//. 📍 lib/actions/cognetica-forense-cartografiador-actions.ts
/**
 * Server Actions del **Cartografiador** — segundo pipeline de Cognética
 * Forense v2 (Oleada 2, Hito 3).
 *
 * Responsabilidad única expuesta al cliente: `ejecutarCartografiador`.
 * Lee menciones `sin_cartografiar` del artefacto + universo canónico
 * del proyecto, llama al LLM, aplica decisiones y registra bitácora.
 *
 * **Decisión arquitectural de eRRRe (23 abril 2026):** el Destilado ya
 * persiste las menciones crudas directamente en las tablas
 * `cgt_<tipo>_menciones` con `decision_cartografiador = 'sin_cartografiar'`.
 * Por eso aquí **no hay "Transacción A"** — solo resolvemos Capa 2.
 * Ver `persistir-menciones-extractor.ts` y la sección (7) de
 * `generarDestilado` para el otro extremo del pipeline.
 *
 * **Idempotencia:** si se ejecuta sobre un artefacto sin menciones
 * `sin_cartografiar` (todo ya cartografiado), retorna stats vacías y
 * no llama al LLM. Si se re-ejecuta después de un fallo parcial, solo
 * las menciones que siguen pendientes van al LLM.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { callDeepSeek } from "@/lib/deepseek/api";
import { logLlamadaDeepseek } from "@/lib/cognetica-forense/deepseek-logger";
import { parsearJsonLLM } from "@/lib/cognetica-forense/parsear-json-llm";
import { createServerClient } from "@/lib/supabase";
import { fail, ok } from "@/lib/cognetica-forense/result";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import {
	CARTOGRAFIADOR_MODEL,
	CARTOGRAFIADOR_SYSTEM_PROMPT,
	CARTOGRAFIADOR_TEMPERATURE,
	CARTOGRAFIADOR_TIMEOUT_MS,
	calcularMaxTokensCartografiador,
	construirUserPromptCartografiador,
} from "@/lib/cognetica-forense/prompts/cartografiador-prompt";
import {
	construirExtracto,
	construirUniverso,
	totalMencionesExtracto,
} from "@/lib/cognetica-forense/lib/cartografiador/construir-payload";
import {
	aplicarDecisiones,
	type RespuestaCartografiador,
	type StatsAplicacion,
} from "@/lib/cognetica-forense/lib/cartografiador/aplicar-decisiones";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
/**
 * Resumen del resultado de una corrida del Cartografiador. Se devuelve
 * al cliente para mostrar el toast y se persiste en `cgt_logs_cartografiador`.
 */
export interface ResultadoCartografiador extends StatsAplicacion {
	/** Total de menciones procesadas (suma de los 5 tipos). */
	total_menciones: number;
	/** Conteo del universo por tipo al momento de la corrida. */
	universo_conteos: {
		pensadores: number;
		disciplinas: number;
		conceptos: number;
		teorias: number;
		citas: number;
	};
	/** Costo y tokens del LLM. */
	costo_usd: number;
	tokens_input: number;
	tokens_output: number;
	duracion_ms: number;
}
//#endregion ![def]

//#region [action] - 🔧 ejecutarCartografiador 🔧
/**
 * Orquesta una corrida completa del Cartografiador sobre un artefacto.
 *
 * Flujo:
 *   1. Validar sesión + acceso al artefacto (vía RLS).
 *   2. Construir universo del proyecto (5 SELECT paralelos).
 *   3. Construir extracto de menciones `sin_cartografiar` (5 SELECT paralelos).
 *   4. Si no hay menciones pendientes → cortar con stats vacías.
 *   5. Llamar LLM con prompt cartografiador + universo + extracto.
 *   6. Parsear JSON respuesta (tolerante).
 *   7. Aplicar decisiones (crea canónicas, UPDATE menciones con Capa 2).
 *   8. Registrar bitácora en `cgt_logs_cartografiador`.
 *
 * Si falla la llamada al LLM, se registra el log igual con
 * `error_mensaje` para auditoría; las menciones quedan intactas y se
 * pueden re-intentar en la próxima corrida.
 */
export async function ejecutarCartografiador(
	artefactoId: string,
): Promise<Result<ResultadoCartografiador, ResultErrorCode>> {
	if (!artefactoId || typeof artefactoId !== "string") {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail<ResultErrorCode>("UNAUTHORIZED");

	// (1) Leer artefacto para obtener project_id. RLS filtra por
	// membresía; si el usuario no tiene acceso devolvemos NOT_FOUND.
	const { data: artefacto, error: artErr } = await supabase
		.from("cgt_artefactos")
		.select("id, project_id")
		.eq("id", artefactoId)
		.maybeSingle();
	if (artErr) {
		console.error("[ejecutarCartografiador] lookup artefacto:", artErr);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!artefacto) return fail<ResultErrorCode>("NOT_FOUND");
	const projectId = artefacto.project_id;

	// (2) Universo del proyecto.
	const { universo, error: errUniverso } = await construirUniverso(
		supabase,
		projectId,
	);
	if (!universo) {
		console.error("[ejecutarCartografiador] construirUniverso:", errUniverso);
		return fail<ResultErrorCode>("INTERNAL");
	}

	// (3) Extracto de menciones pendientes.
	const { extracto, error: errExtracto } = await construirExtracto(
		supabase,
		artefactoId,
	);
	if (!extracto) {
		console.error("[ejecutarCartografiador] construirExtracto:", errExtracto);
		return fail<ResultErrorCode>("INTERNAL");
	}

	const total = totalMencionesExtracto(extracto);
	const universoConteos = {
		pensadores: universo.pensadores.length,
		disciplinas: universo.disciplinas.length,
		conceptos: universo.conceptos.length,
		teorias: universo.teorias.length,
		citas: universo.citas.length,
	};

	// (4) Corto si no hay nada que cartografiar.
	if (total === 0) {
		const vacio: ResultadoCartografiador = {
			matches: 0,
			nuevas: 0,
			ambiguas: 0,
			inconsistentes: 0,
			canonicas_creadas: 0,
			total_menciones: 0,
			universo_conteos: universoConteos,
			costo_usd: 0,
			tokens_input: 0,
			tokens_output: 0,
			duracion_ms: 0,
		};
		// Log mínimo para auditoría (una corrida disparada sobre un
		// artefacto sin pendientes también es información útil).
		await registrarLogCartografiador(supabase, {
			artefactoId,
			projectId,
			userId: user.id,
			resultado: vacio,
			finishReason: null,
			errorMensaje: "sin menciones pendientes",
			tokensCached: 0,
		});
		return ok(vacio);
	}

	// (5) Llamada al LLM.
	const userPrompt = construirUserPromptCartografiador(universo, extracto);
	const maxTokens = calcularMaxTokensCartografiador(extracto);
	console.log(
		`[ejecutarCartografiador] maxTokens calculado: ${maxTokens} para ${total} menciones`,
	);
	const inicio = Date.now();

	let llmRes;
	try {
		llmRes = await callDeepSeek({
			model: CARTOGRAFIADOR_MODEL,
			temperature: CARTOGRAFIADOR_TEMPERATURE,
			maxTokens,
			systemPrompt: CARTOGRAFIADOR_SYSTEM_PROMPT,
			userPrompt,
			responseFormat: { type: "json_object" },
			timeoutMs: CARTOGRAFIADOR_TIMEOUT_MS,
		});
		if (llmRes.finishReason === "length") {
			console.warn(
				`[ejecutarCartografiador] output truncado: tokensOutput=${llmRes.tokensOutput}/${maxTokens} — se intentará parsear de todos modos.`,
			);
		}
	} catch (err) {
		const mensaje = err instanceof Error ? err.message : String(err);
		console.error("[ejecutarCartografiador] LLM falló:", mensaje);
		await registrarLogCartografiador(supabase, {
			artefactoId,
			projectId,
			userId: user.id,
			resultado: {
				matches: 0,
				nuevas: 0,
				ambiguas: 0,
				inconsistentes: total,
				canonicas_creadas: 0,
				total_menciones: total,
				universo_conteos: universoConteos,
				costo_usd: 0,
				tokens_input: 0,
				tokens_output: 0,
				duracion_ms: Date.now() - inicio,
			},
			finishReason: null,
			errorMensaje: mensaje,
			tokensCached: 0,
		});
		return fail<ResultErrorCode>("LLM_ERROR");
	}

	// Log de la llamada cruda a DeepSeek (reutiliza logger de Oleada 1).
	// `formato: "cartografiador"` no está en el enum `CgtFormato` original,
	// pero el tipo del logger acepta string libre para cubrir extensiones.
	await logLlamadaDeepseek({
		supabase,
		projectId,
		artefactoId,
		formato: "cartografiador",
		temperatura: CARTOGRAFIADOR_TEMPERATURE,
		intento: 1,
		result: llmRes,
	});

	// (6) Parseo del JSON. El prompt obliga a `json_object` pero el
	// parser tolerante cubre reparaciones comunes.
	const parseRes = parsearJsonLLM<RespuestaCartografiador>(llmRes.content);
	if (!parseRes.ok) {
		console.error(
			"[ejecutarCartografiador] JSON inválido del Cartografiador:",
			parseRes.error,
			`finishReason=${llmRes.finishReason}`,
			`preview=${llmRes.content.slice(0, 400)}…`,
		);
		await registrarLogCartografiador(supabase, {
			artefactoId,
			projectId,
			userId: user.id,
			resultado: {
				matches: 0,
				nuevas: 0,
				ambiguas: 0,
				inconsistentes: total,
				canonicas_creadas: 0,
				total_menciones: total,
				universo_conteos: universoConteos,
				costo_usd: llmRes.costoUsd,
				tokens_input: llmRes.tokensInput,
				tokens_output: llmRes.tokensOutput,
				duracion_ms: llmRes.duracionMs,
			},
			finishReason: llmRes.finishReason,
			errorMensaje: `JSON inválido: ${parseRes.error}`,
			tokensCached: llmRes.tokensCached,
		});
		return fail<ResultErrorCode>("LLM_ERROR");
	}

	const respuesta = normalizarRespuesta(parseRes.data);

	// (7) Aplicar decisiones.
	const stats = await aplicarDecisiones(
		supabase,
		projectId,
		extracto,
		universo,
		respuesta,
	);

	// (8) Log final de la corrida.
	const resultado: ResultadoCartografiador = {
		...stats,
		total_menciones: total,
		universo_conteos: universoConteos,
		costo_usd: llmRes.costoUsd,
		tokens_input: llmRes.tokensInput,
		tokens_output: llmRes.tokensOutput,
		duracion_ms: llmRes.duracionMs,
	};
	await registrarLogCartografiador(supabase, {
		artefactoId,
		projectId,
		userId: user.id,
		resultado,
		finishReason: llmRes.finishReason,
		errorMensaje:
			stats.inconsistentes > 0 ?
				`${stats.inconsistentes} menciones inconsistentes`
			:	null,
		tokensCached: llmRes.tokensCached,
	});

	console.info(
		"[ejecutarCartografiador] corrida completada:",
		JSON.stringify(resultado),
	);

	return ok(resultado);
}
//#endregion ![action]

//#region [helpers] - 🛠️ normalizarRespuesta 🛠️
/**
 * Garantiza que la respuesta del LLM tenga las 5 claves con arrays
 * (aunque vengan `undefined`). El prompt las exige pero cubrirlo aquí
 * evita un crash si el modelo omite alguna.
 */
function normalizarRespuesta(
	raw: Partial<RespuestaCartografiador>,
): RespuestaCartografiador {
	return {
		pensadores: Array.isArray(raw.pensadores) ? raw.pensadores : [],
		disciplinas: Array.isArray(raw.disciplinas) ? raw.disciplinas : [],
		conceptos: Array.isArray(raw.conceptos) ? raw.conceptos : [],
		teorias: Array.isArray(raw.teorias) ? raw.teorias : [],
		citas: Array.isArray(raw.citas) ? raw.citas : [],
	};
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ registrarLogCartografiador 🛠️
/**
 * Inserta una fila en `cgt_logs_cartografiador` con los contadores
 * finales de la corrida. Nunca bloquea el flujo principal — si el log
 * falla, lo notamos con `console.error` pero no propagamos error al
 * cliente (la mutación importante ya ocurrió sobre las menciones).
 */
async function registrarLogCartografiador(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	input: {
		artefactoId: string;
		projectId: string;
		userId: string;
		resultado: ResultadoCartografiador;
		finishReason: string | null;
		errorMensaje: string | null;
		tokensCached: number;
	},
): Promise<void> {
	const { resultado } = input;
	const { error } = await supabase.from("cgt_logs_cartografiador").insert({
		artefacto_id: input.artefactoId,
		project_id: input.projectId,
		user_id: input.userId,
		modelo: CARTOGRAFIADOR_MODEL,
		temperatura: CARTOGRAFIADOR_TEMPERATURE,
		intento: 1,
		tokens_input: resultado.tokens_input,
		tokens_output: resultado.tokens_output,
		tokens_cached: input.tokensCached,
		costo_usd: resultado.costo_usd,
		duracion_ms: resultado.duracion_ms,
		finish_reason: input.finishReason,
		error_mensaje: input.errorMensaje,
		total_menciones: resultado.total_menciones,
		total_match_existente: resultado.matches,
		total_nueva_entidad: resultado.nuevas,
		total_ambigua: resultado.ambiguas,
		universo_pensadores_count: resultado.universo_conteos.pensadores,
		universo_disciplinas_count: resultado.universo_conteos.disciplinas,
		universo_conceptos_count: resultado.universo_conteos.conceptos,
		universo_teorias_count: resultado.universo_conteos.teorias,
		universo_citas_count: resultado.universo_conteos.citas,
	});
	if (error) {
		console.error(
			"[registrarLogCartografiador] fallo inserción log (no bloquea):",
			error,
		);
	}
}
//#endregion ![helpers]
