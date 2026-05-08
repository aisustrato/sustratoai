//. 📍 lib/actions/cognetica-forense-metabolizacion-actions.ts
/**
 * Server Actions de **metabolización** para Cognética Forense v2 — Oleada 1.
 *
 * Implementa los 4 generadores del pipeline (Crónica, Destilado, Núcleo,
 * Germinal) + el orquestador `metabolizarArtefacto` que los encadena según
 * las dependencias descritas en `docs/cognetica/cognetica_v2_formatos_spec_v0_3.md §5`
 * y `docs/cognetica/pipeline_metabolizacion_v1.md §2`.
 *
 * **Modelos y temperaturas** (pipeline §2 — fijados por Hongo):
 *   - Crónica:   `deepseek-reasoner` @ 0.7, max 5000 tokens, output `text`
 *   - Destilado: `deepseek-reasoner` @ 0.6, max 2500 tokens, output `json_object`
 *   - Núcleo:    `deepseek-chat`     @ 0.3, max 600  tokens, output `json_object`
 *   - Germinal:  `deepseek-reasoner` @ 0.7, max 2000 tokens, output `text`
 *
 * **Gate de seguridad**: mientras los prompts del sistema sean placeholders
 * (ver `PROMPT_PLACEHOLDER_MARKER`), los generadores retornan `NOT_IMPLEMENTED`
 * con mensaje claro. Cuando Hongo entregue `prompts_metabolizacion_v1.md` y
 * se pegue en los archivos `/lib/cognetica-forense/prompts/*-prompt.ts`, el
 * gate abre automáticamente.
 *
 * **No hace throw al cliente**: todo error viaja en `Result<_, ResultErrorCode>`.
 *
 * **Reutilización v1**: idea de llamadas con `response_format: json_object`
 * y split por chunks tomada de `cognetica-old-distillation-actions.ts`. Código
 * reescrito limpio alineado al schema v2. Ver
 * `docs/cognetica/REUTILIZACION_V1_EN_V2.md §1 y §2`.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { callDeepSeek } from "@/lib/deepseek/api";
import { revalidatePath } from "next/cache";
import { prepararContenidoLargo } from "@/lib/cognetica-forense/chunking";
import { obtenerContenidoMetabolizable } from "@/lib/cognetica-forense/contenido-metabolizable";
import { logLlamadaDeepseek } from "@/lib/cognetica-forense/deepseek-logger";
import { parsearJsonLLM } from "@/lib/cognetica-forense/parsear-json-llm";
import { persistirMencionesExtractor } from "@/lib/cognetica-forense/lib/persistir-menciones-extractor";
import type { ResumenMetabolizacion } from "@/lib/cognetica-forense/metabolizacion-shared";
import {
	NODO_GENERADOR_CASCADE,
	VERSION_ESQUEMA_FORMATOS,
	actualizarEstadoArtefacto,
	asegurarAccesoArtefacto,
	hashCanonicoDestilado,
	hashCronica,
	promptsListos,
	renderizarDestiladoComoMarkdown,
	tokensContentDe,
} from "@/lib/cognetica-forense/metabolizacion-helpers";
import {
	CRONICA_SYSTEM_PROMPT,
	construirPromptCronica,
} from "@/lib/cognetica-forense/prompts/cronica-prompt";
import {
	DESTILADO_SYSTEM_PROMPT,
	construirPromptDestilado,
} from "@/lib/cognetica-forense/prompts/destilado-prompt";
import {
	GERMINAL_SYSTEM_PROMPT,
	construirPromptGerminal,
} from "@/lib/cognetica-forense/prompts/germinal-prompt";
import {
	NUCLEO_SYSTEM_PROMPT,
	construirPromptNucleo,
} from "@/lib/cognetica-forense/prompts/nucleo-prompt";
import type {
	CgtCronica,
	CgtDestilado,
	CgtGerminal,
	CgtNucleo,
	Result,
	ResultErrorCode,
} from "@/lib/cognetica-forense/types";
import { fail, ok } from "@/lib/cognetica-forense/types";
import { createServerClient } from "@/lib/supabase";
//#endregion ![head]

//#region [def] - 🎯 CONFIG POR FORMATO 🎯
const CONFIG_CRONICA = {
	model: "deepseek-reasoner" as const,
	temperature: 0.7,
	maxTokens: 5000,
};
const CONFIG_DESTILADO = {
	model: "deepseek-reasoner" as const,
	temperature: 0.6,
	// Destilado v2 (Hito 6) produce JSON mucho más extenso:
	// - estructura_documento (metadatos de formato, basura técnica)
	// - esqueleto_argumental (tesis, movimientos, tensión, ámbito)
	// - insumos_extraidos (pensadores/disciplinas/conceptos/teorías CON descripciones)
	// - citas_textuales (sin techo de 3, todas las destacables)
	// - referencias_bibliograficas (exhaustivas, con apariciones y co-citadas)
	// 12000 tokens da margen amplio para el reasoner + output denso.
	maxTokens: 20000,
};
const CONFIG_NUCLEO = {
	model: "deepseek-chat" as const,
	temperature: 0.3,
	// 800 en API para dar aire al JSON; el output final debe mantenerse
	// ≤ 600 tokens (hard cap semántico + CHECK en DB).
	maxTokens: 800,
};
const CONFIG_GERMINAL = {
	model: "deepseek-reasoner" as const,
	temperature: 0.7,
	maxTokens: 2500,
};

/**
 * Modo de operación del Germinal v1: **atómico**.
 *
 * El prompt v1 produce Germinal usando sólo Crónica + Destilado del
 * artefacto actual — no consulta corpus previo. Por eso **no hay umbral**
 * de artefactos previos con Núcleo: todo artefacto con sus upstream
 * inmediatos listos puede generar Germinal, incluyendo el primer artefacto
 * del proyecto. El campo `destilados_previos_consultados` del snapshot
 * queda vacío en v1 y se poblará en v2, cuando los prompts consulten corpus.
 *
 * Decisión trazada por Hongo (nodo Sustrato, 21/4/2026): el umbral previo
 * de `≥3 artefactos previos con Núcleo` era un vestigio de un diseño donde
 * Germinal requería corpus; con v1 atómica sobra. Siempre se parte por uno.
 */
const GERMINAL_MODO_V1 = "atomico" as const;
const GERMINAL_VERSION_PROMPT_V1 = "v1_atomica" as const;
//#endregion ![def]

//#region [main] - 🔧 (1) generarCronica 🔧
/**
 * Genera la Crónica del artefacto a partir del contenido parseado.
 *
 * Si el contenido excede `LIMITE_TOKENS_SIN_CHUNKING`, se sintetiza por
 * chunks con `deepseek-chat` y luego la Crónica se genera sobre la síntesis
 * concatenada (pipeline §7).
 *
 * **Idempotencia**: si ya existe una Crónica para este artefacto, se
 * reemplaza (DELETE + INSERT). La cascada de invalidación (addendum §8)
 * se encarga de señalar downstream desactualizado.
 */
export async function generarCronica(
	artefactoId: string,
): Promise<Result<CgtCronica, ResultErrorCode>> {
	const supabase = await createServerClient();

	const accesoRes = await asegurarAccesoArtefacto(supabase, artefactoId);
	if (!accesoRes.ok) return accesoRes;
	const { projectId } = accesoRes.data;

	// (1) Obtener contenido parseado.
	const contRes = await obtenerContenidoMetabolizable(supabase, artefactoId);
	if (!contRes.ok) return contRes;
	const contenidoArtefacto = contRes.data.contenido;

	// (2) Chunking si el contenido es demasiado largo.
	const chunking = prepararContenidoLargo(contenidoArtefacto);
	const contenidoParaPrompt =
		chunking.requiere_chunking ?
			// Síntesis parcial de cada chunk — en Oleada 1 se concatena como
			// fallback simple; cuando el chunking se active de verdad, aquí se
			// itera con `callDeepSeek` barato (`deepseek-chat`) por chunk.
			chunking.chunks.join("\n\n---\n\n")
		:	contenidoArtefacto;

	// (3) Construir prompts.
	const userPrompt = construirPromptCronica({
		contenidoArtefacto: contenidoParaPrompt,
		tipoArtefacto: "markdown", // TODO cuando ingesta soporte más tipos, propagar.
		incluirContracalibracion: false,
		floorTokens: 800,
		ceilingTokens: CONFIG_CRONICA.maxTokens,
	});

	if (!promptsListos(CRONICA_SYSTEM_PROMPT, userPrompt)) {
		return fail<ResultErrorCode>("NOT_IMPLEMENTED");
	}

	// (4) Llamada al LLM.
	let result;
	try {
		result = await callDeepSeek({
			model: CONFIG_CRONICA.model,
			temperature: CONFIG_CRONICA.temperature,
			maxTokens: CONFIG_CRONICA.maxTokens,
			responseFormat: { type: "text" },
			systemPrompt: CRONICA_SYSTEM_PROMPT,
			userPrompt,
		});
	} catch (err) {
		await logLlamadaDeepseek({
			supabase,
			artefactoId,
			projectId,
			formato: "cronica",
			temperatura: CONFIG_CRONICA.temperature,
			errorMensaje: (err as Error).message,
		});
		return fail<ResultErrorCode>("LLM_ERROR");
	}

	await logLlamadaDeepseek({
		supabase,
		artefactoId,
		projectId,
		formato: "cronica",
		temperatura: CONFIG_CRONICA.temperature,
		result,
	});

	// (5) Persistencia (idempotente: DELETE previa si existe).
	await supabase.from("cgt_cronicas").delete().eq("artefacto_id", artefactoId);

	const { data: insertada, error: insertError } = await supabase
		.from("cgt_cronicas")
		.insert({
			artefacto_id: artefactoId,
			project_id: projectId,
			contenido: result.content,
			tokens_count: tokensContentDe(result),
			contracalibracion: null,
			contracalibracion_activada: false,
			generado_por: "llm",
			nodo_generador: NODO_GENERADOR_CASCADE,
			modelo_ia: result.modelUsado,
			version_esquema: VERSION_ESQUEMA_FORMATOS,
			costo_usd: result.costoUsd,
			tokens_input: result.tokensInput,
			tokens_output: result.tokensOutput,
		})
		.select()
		.single();

	if (insertError || !insertada) {
		console.error("[generarCronica] insert falló:", insertError);
		return fail<ResultErrorCode>("INTERNAL");
	}

	return ok(insertada as CgtCronica);
}
//#endregion ![main]

//#region [main] - 🔧 (2) generarDestilado 🔧
/**
 * Genera el Destilado a partir del contenido del artefacto + Crónica (contexto).
 *
 * **Dependencia**: requiere Crónica generada (spec v0.3 §5). Si no existe,
 * retorna `MISSING_UPSTREAM`.
 *
 * **Output JSON esperado**: `{ tesis, movimientos, tensiones, cita_nucleo }`
 * (+ insumos opcionales en oleadas futuras). Se valida el shape antes de
 * persistir; si el LLM devuelve JSON inválido, retorna `LLM_ERROR` sin
 * escribir la DB.
 */
export async function generarDestilado(
	artefactoId: string,
): Promise<Result<CgtDestilado, ResultErrorCode>> {
	console.log("[generarDestilado] === INICIO === artefactoId=", artefactoId);
	const supabase = await createServerClient();
	console.log("[generarDestilado] Supabase client creado");

	const accesoRes = await asegurarAccesoArtefacto(supabase, artefactoId);
	console.log("[generarDestilado] accesoRes.ok=", accesoRes.ok);
	if (!accesoRes.ok) return accesoRes;
	const { projectId } = accesoRes.data;

	// (1) Leer Crónica (contexto obligatorio) + metadata del artefacto.
	const [
		{ data: cronica, error: cronErr },
		{ data: artefacto, error: artErr },
	] = await Promise.all([
		supabase
			.from("cgt_cronicas")
			.select("contenido")
			.eq("artefacto_id", artefactoId)
			.maybeSingle(),
		supabase
			.from("cgt_artefactos")
			.select("tipo, created_at, metadata")
			.eq("id", artefactoId)
			.single(),
	]);
	if (cronErr || artErr) {
		console.error(
			"[generarDestilado] lookup crónica/artefacto:",
			cronErr || artErr,
		);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!cronica) {
		console.log("[generarDestilado] MISSING_UPSTREAM: no hay crónica");
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}
	if (!artefacto) {
		console.log("[generarDestilado] INTERNAL: no hay artefacto");
		return fail<ResultErrorCode>("INTERNAL");
	}
	console.log("[generarDestilado] crónica y artefacto cargados OK");

	// (2) Leer contenido del artefacto.
	const contRes = await obtenerContenidoMetabolizable(supabase, artefactoId);
	console.log("[generarDestilado] contenido metabolizable OK=", contRes.ok);
	if (!contRes.ok) return contRes;

	// (3) Construir prompts v2 (incluye metadata del artefacto).
	const userPrompt = construirPromptDestilado({
		contenidoArtefacto: contRes.data.contenido,
		cronicaRenderizada: cronica.contenido,
		tipoArtefacto: artefacto.tipo,
		fechaCreacion: artefacto.created_at,
		origen:
			(artefacto.metadata as Record<string, unknown>)?.origen?.toString() ||
			"upload",
	});
	if (!promptsListos(DESTILADO_SYSTEM_PROMPT, userPrompt)) {
		console.log("[generarDestilado] NOT_IMPLEMENTED: prompts no listos");
		return fail<ResultErrorCode>("NOT_IMPLEMENTED");
	}
	console.log("[generarDestilado] prompts listos, llamando LLM...");

	// (4) Llamada al LLM.
	let result;
	try {
		result = await callDeepSeek({
			model: CONFIG_DESTILADO.model,
			temperature: CONFIG_DESTILADO.temperature,
			maxTokens: CONFIG_DESTILADO.maxTokens,
			responseFormat: { type: "json_object" },
			systemPrompt: DESTILADO_SYSTEM_PROMPT,
			userPrompt,
		});
	} catch (err) {
		console.error("[generarDestilado] LLM call threw:", (err as Error).message);
		await logLlamadaDeepseek({
			supabase,
			artefactoId,
			projectId,
			formato: "destilado",
			temperatura: CONFIG_DESTILADO.temperature,
			errorMensaje: (err as Error).message,
		});
		return fail<ResultErrorCode>("LLM_ERROR");
	}
	console.log(
		"[generarDestilado] LLM OK. finishReason=",
		result.finishReason,
		"tokensOutput=",
		result.tokensOutput,
	);
	await logLlamadaDeepseek({
		supabase,
		artefactoId,
		projectId,
		formato: "destilado",
		temperatura: CONFIG_DESTILADO.temperature,
		result,
	});

	// (5) Validar shape JSON con parser tolerante.
	// Destilado v2 produce output denso; si se trunca, el parser tolerante
	// intentará reparar. No marcamos como error fatal — el usuario da
	// libertad total al presupuesto del LLM.
	if (result.finishReason === "length") {
		console.warn(
			"[generarDestilado] output posiblemente truncado por maxTokens. finishReason=length,",
			`tokensOutput=${result.tokensOutput}/${CONFIG_DESTILADO.maxTokens} — se intentará parsear de todos modos.`,
		);
	}

	// Schema v2: estructura anidada
	const parseRes = parsearJsonLLM<{
		estructura_documento?: unknown;
		esqueleto_argumental?: {
			tesis_central?: unknown;
			movimientos_argumentales?: unknown;
			tension_irreductible?: unknown;
			ambito_disciplinar_dominante?: unknown;
		};
		insumos_extraidos?: {
			pensadores_mencionados?: unknown;
			disciplinas_tocadas?: unknown;
			conceptos_clave?: unknown;
			teorias_invocadas?: unknown;
			citas_textuales?: unknown;
		};
		referencias_bibliograficas?: unknown;
	}>(result.content);
	if (!parseRes.ok) {
		console.error(
			"[generarDestilado] JSON inválido:",
			parseRes.error,
			`reparaciones_intentadas=${JSON.stringify(parseRes.reparaciones)}`,
			`finishReason=${result.finishReason}`,
			`content_preview=${result.content.slice(0, 400)}…`,
		);
		return fail<ResultErrorCode>("LLM_ERROR");
	}
	if (parseRes.reparaciones.length > 0) {
		console.warn(
			"[generarDestilado] JSON reparado heurísticamente:",
			JSON.stringify(parseRes.reparaciones),
		);
	}
	const parsed = parseRes.data;
	const esqueleto = parsed.esqueleto_argumental ?? {};
	const insumos = parsed.insumos_extraidos ?? {};

	// Transformar movimientos del formato v2 del LLM al formato v1 de la DB
	// v2: {numero, titulo_breve, idea_central, evidencia_principal}
	// v1: {orden, desde, hacia, texto}
	const movimientosRaw = esqueleto.movimientos_argumentales as unknown[];
	const movimientosTransformados =
		Array.isArray(movimientosRaw) ?
			movimientosRaw
				.map((m: unknown) => {
					const mov = m as {
						numero?: number;
						titulo_breve?: string;
						idea_central?: string;
						evidenncia_principal?: string;
					};
					return {
						orden: typeof mov.numero === "number" ? mov.numero : 0,
						desde: mov.titulo_breve ?? "Movimiento",
						hacia: "",
						texto: mov.idea_central ?? "",
					};
				})
				.filter((m: { texto: string }) => m.texto.trim() !== "")
		:	[];

	// Validación mínima del esqueleto v2
	if (
		typeof esqueleto.tesis_central !== "string" ||
		!esqueleto.tesis_central.trim()
	) {
		console.error(
			"[generarDestilado] shape inválido: falta `esqueleto_argumental.tesis_central`.",
			`finishReason=${result.finishReason}`,
			`content_preview=${result.content.slice(0, 400)}…`,
		);
		return fail<ResultErrorCode>("LLM_ERROR");
	}

	// (6) Persistencia idempotente.
	await supabase
		.from("cgt_destilados")
		.delete()
		.eq("artefacto_id", artefactoId);

	const { data: insertado, error: insertError } = await supabase
		.from("cgt_destilados")
		.insert({
			artefacto_id: artefactoId,
			project_id: projectId,
			// Esqueleto argumental v2 (mapeo a columnas existentes para compatibilidad)
			tesis: esqueleto.tesis_central,
			movimientos: movimientosTransformados as never,
			tensiones: ((
				typeof esqueleto.tension_irreductible === "string" &&
				esqueleto.tension_irreductible.trim()
			) ?
				[{ texto: esqueleto.tension_irreductible.trim(), tipo: "paradoja" }]
			:	[]) as never,
			cita_nucleo: null, // v2 no tiene cita_nucleo directo, está en citas_textuales
			// Nuevo campo v2: estructura_documento como JSONB
			estructura_documento: (parsed.estructura_documento ?? {}) as never,
			tokens_count: tokensContentDe(result),
			generado_por: "llm",
			nodo_generador: NODO_GENERADOR_CASCADE,
			modelo_ia: result.modelUsado,
			version_esquema: VERSION_ESQUEMA_FORMATOS,
			costo_usd: result.costoUsd,
			tokens_input: result.tokensInput,
			tokens_output: result.tokensOutput,
		})
		.select()
		.single();

	if (insertError || !insertado) {
		console.error("[generarDestilado] insert falló:", insertError);
		return fail<ResultErrorCode>("INTERNAL");
	}

	// (7) Persistencia de menciones crudas (Capa 1 de la Oleada 2).
	//
	// Por decisión de eRRRe (23 abril 2026): el Destilado inserta
	// directamente en las 5 tablas `cgt_<tipo>_menciones` con
	// `decision_cartografiador = 'sin_cartografiar'`. Evita un JSONB
	// intermedio en `cgt_destilados` y elimina la "Transacción A" del
	// Cartografiador. El Cartografiador (Hito 3) solo hace UPDATE de
	// Capa 2 después. Idempotente por `hash_extractor_crudo`.
	//
	// Si esta fase falla, el Destilado **queda persistido** (ya committed
	// arriba) pero se retorna error para que el humano sepa. Una nueva
	// corrida de `generarDestilado` hará el `delete+insert` del Destilado
	// y re-intentará las menciones. La dedup por hash evita duplicados.
	// (7) Persistencia de menciones crudas (Capa 1) — schema v2 anidado en insumos_extraidos
	const persistRes = await persistirMencionesExtractor(
		supabase,
		artefactoId,
		projectId,
		{
			pensadores_mencionados: insumos.pensadores_mencionados,
			disciplinas_tocadas: insumos.disciplinas_tocadas,
			conceptos_clave: insumos.conceptos_clave,
			teorias_invocadas: insumos.teorias_invocadas,
			citas_secundarias: insumos.citas_textuales, // v2: citas_textuales (sin límite de 3)
		},
	);
	if (persistRes.error) {
		console.error(
			"[generarDestilado] persistencia de menciones falló:",
			persistRes.error,
			`stats=${JSON.stringify(persistRes.stats)}`,
		);
		return fail<ResultErrorCode>("INTERNAL");
	}
	console.info(
		"[generarDestilado] menciones persistidas:",
		JSON.stringify(persistRes.stats),
	);

	// (8) NOTA: Las referencias bibliográficas ahora se extraen en pipeline
	// separado post-destilado (Opción B del Hito 6).
	// El Destilado v2.1 solo CUENTA referencias (total_referencias_detectadas)
	// pero NO las extrae. El extractor dedicado se ejecuta después.
	const totalReferenciasDetectadas =
		(parsed.estructura_documento as Record<string, unknown>)
			?.total_referencias_detectadas ?? 0;
	console.info(
		"[generarDestilado] Referencias detectadas para extracción posterior:",
		totalReferenciasDetectadas,
	);

	return ok(insertado as unknown as CgtDestilado);
}
//#endregion ![main]

//#region [main] - 🔧 (3) generarNucleo 🔧
/**
 * Genera el Núcleo a partir del Destilado (no del artefacto original —
 * spec v0.3 §4.3). Compresión de compresión; modelo barato (`deepseek-chat` 0.3).
 *
 * Persiste `hash_destilado_upstream` para habilitar cascada de invalidación
 * (addendum §8): si el Destilado se re-genera, su nuevo hash diferirá y la
 * UI marcará el Núcleo como desactualizado.
 *
 * Hard cap de 600 tokens enforzado también a nivel DB (`CHECK constraint`).
 */
export async function generarNucleo(
	artefactoId: string,
): Promise<Result<CgtNucleo, ResultErrorCode>> {
	const supabase = await createServerClient();

	const accesoRes = await asegurarAccesoArtefacto(supabase, artefactoId);
	if (!accesoRes.ok) return accesoRes;
	const { projectId } = accesoRes.data;

	// (1) Leer Destilado upstream.
	const { data: destilado, error: destErr } = await supabase
		.from("cgt_destilados")
		.select("*")
		.eq("artefacto_id", artefactoId)
		.maybeSingle();
	if (destErr) {
		console.error("[generarNucleo] lookup destilado:", destErr);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!destilado) return fail<ResultErrorCode>("MISSING_UPSTREAM");

	const destiladoRenderizado = renderizarDestiladoComoMarkdown(
		destilado as unknown as CgtDestilado,
	);
	const hashUpstream = await hashCanonicoDestilado(
		destilado as unknown as CgtDestilado,
	);

	// (2) Construir prompts.
	const userPrompt = construirPromptNucleo({ destiladoRenderizado });
	if (!promptsListos(NUCLEO_SYSTEM_PROMPT, userPrompt)) {
		return fail<ResultErrorCode>("NOT_IMPLEMENTED");
	}

	// (3) Llamada LLM.
	let result;
	try {
		result = await callDeepSeek({
			model: CONFIG_NUCLEO.model,
			temperature: CONFIG_NUCLEO.temperature,
			maxTokens: CONFIG_NUCLEO.maxTokens,
			responseFormat: { type: "json_object" },
			systemPrompt: NUCLEO_SYSTEM_PROMPT,
			userPrompt,
		});
	} catch (err) {
		await logLlamadaDeepseek({
			supabase,
			artefactoId,
			projectId,
			formato: "nucleo",
			temperatura: CONFIG_NUCLEO.temperature,
			errorMensaje: (err as Error).message,
		});
		return fail<ResultErrorCode>("LLM_ERROR");
	}
	await logLlamadaDeepseek({
		supabase,
		artefactoId,
		projectId,
		formato: "nucleo",
		temperatura: CONFIG_NUCLEO.temperature,
		result,
	});

	// (4) Validar shape con parser tolerante.
	if (result.finishReason === "length") {
		console.error(
			"[generarNucleo] output truncado por maxTokens. finishReason=length,",
			`tokensOutput=${result.tokensOutput}/${CONFIG_NUCLEO.maxTokens}`,
		);
		return fail<ResultErrorCode>("LLM_ERROR");
	}

	const parseRes = parsearJsonLLM<{
		tesis?: unknown;
		movimientos_esenciales?: unknown;
		tension_irreductible?: unknown;
		cita_nucleo?: unknown;
	}>(result.content);
	if (!parseRes.ok) {
		console.error(
			"[generarNucleo] JSON inválido:",
			parseRes.error,
			`reparaciones_intentadas=${JSON.stringify(parseRes.reparaciones)}`,
			`finishReason=${result.finishReason}`,
			`content_preview=${result.content.slice(0, 400)}…`,
		);
		return fail<ResultErrorCode>("LLM_ERROR");
	}
	if (parseRes.reparaciones.length > 0) {
		console.warn(
			"[generarNucleo] JSON reparado heurísticamente:",
			JSON.stringify(parseRes.reparaciones),
		);
	}
	const parsed = parseRes.data;
	if (typeof parsed.tesis !== "string" || !parsed.tesis.trim()) {
		console.error(
			"[generarNucleo] shape inválido: falta `tesis`.",
			`finishReason=${result.finishReason}`,
			`content_preview=${result.content.slice(0, 400)}…`,
		);
		return fail<ResultErrorCode>("LLM_ERROR");
	}

	// (5) Persistencia idempotente.
	await supabase.from("cgt_nucleos").delete().eq("artefacto_id", artefactoId);

	const { data: insertado, error: insertError } = await supabase
		.from("cgt_nucleos")
		.insert({
			artefacto_id: artefactoId,
			project_id: projectId,
			tesis: parsed.tesis,
			movimientos_esenciales: (parsed.movimientos_esenciales ?? []) as never,
			tension_irreductible:
				typeof parsed.tension_irreductible === "string" ?
					parsed.tension_irreductible
				:	null,
			cita_nucleo: (parsed.cita_nucleo ?? null) as never,
			tokens_count: tokensContentDe(result),
			hash_destilado_upstream: hashUpstream,
			generado_por: "llm",
			nodo_generador: NODO_GENERADOR_CASCADE,
			modelo_ia: result.modelUsado,
			version_esquema: VERSION_ESQUEMA_FORMATOS,
			costo_usd: result.costoUsd,
			tokens_input: result.tokensInput,
			tokens_output: result.tokensOutput,
		})
		.select()
		.single();

	if (insertError || !insertado) {
		console.error("[generarNucleo] insert falló:", insertError);
		// Si rebotó por el CHECK de tokens, devolverlo como LLM_ERROR — la UI
		// expone el mensaje "regenerar".
		if (insertError?.message?.includes("chk_nucleo_tokens_cap")) {
			return fail<ResultErrorCode>("LLM_ERROR");
		}
		return fail<ResultErrorCode>("INTERNAL");
	}
	return ok(insertado as unknown as CgtNucleo);
}
//#endregion ![main]

//#region [main] - 🔧 (4) generarGerminalParcial 🔧
/**
 * Genera el Germinal parcial (Oleada 1 — solo resumen narrativo).
 *
 * **Umbral** (spec v0.3 §4.4): requiere ≥3 artefactos previos del proyecto
 * con Núcleo. Si no se cumple, retorna `THRESHOLD_NOT_MET` silencioso (el
 * orquestador marca el estado como "omitido" y continúa).
 *
 * **Inputs**:
 *   - Crónica del artefacto nuevo (catalizador de tensión)
 *   - Destilado del artefacto nuevo (estructura)
 *   - Núcleos de los últimos ~20 artefactos previos (tarjetas del corpus)
 *
 * Persiste `hash_cronica_upstream` + `hash_destilado_upstream` para cascada
 * de invalidación.
 */
export async function generarGerminalParcial(
	artefactoId: string,
): Promise<Result<CgtGerminal, ResultErrorCode>> {
	const supabase = await createServerClient();

	const accesoRes = await asegurarAccesoArtefacto(supabase, artefactoId);
	if (!accesoRes.ok) return accesoRes;
	const { projectId } = accesoRes.data;

	// (1) Leer Crónica + Destilado del artefacto nuevo.
	const [cronRes, destRes] = await Promise.all([
		supabase
			.from("cgt_cronicas")
			.select("*")
			.eq("artefacto_id", artefactoId)
			.maybeSingle(),
		supabase
			.from("cgt_destilados")
			.select("*")
			.eq("artefacto_id", artefactoId)
			.maybeSingle(),
	]);
	if (!cronRes.data || !destRes.data) {
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}

	// (2) Construir prompt. El prompt v1 es ATÓMICO: consume solo Crónica
	//     + Destilado del propio artefacto. No se consulta corpus previo
	//     (eso llega en v2 de prompts). Por tanto no hay umbral de artefactos
	//     previos — todo artefacto con Crónica+Destilado puede generar
	//     Germinal, incluido el primero del proyecto.
	const destiladoRenderizado = renderizarDestiladoComoMarkdown(
		destRes.data as unknown as CgtDestilado,
	);
	const userPrompt = construirPromptGerminal({
		cronicaActual: (cronRes.data as unknown as CgtCronica).contenido,
		destiladoActual: destiladoRenderizado,
		// v1 atómica: lista vacía. Se poblará en v2 cuando el prompt consulte corpus.
		nucleosPreviosDelProyecto: [],
	});
	if (!promptsListos(GERMINAL_SYSTEM_PROMPT, userPrompt)) {
		return fail<ResultErrorCode>("NOT_IMPLEMENTED");
	}

	// (4) Llamada LLM.
	let result;
	try {
		result = await callDeepSeek({
			model: CONFIG_GERMINAL.model,
			temperature: CONFIG_GERMINAL.temperature,
			maxTokens: CONFIG_GERMINAL.maxTokens,
			responseFormat: { type: "text" },
			systemPrompt: GERMINAL_SYSTEM_PROMPT,
			userPrompt,
		});
	} catch (err) {
		await logLlamadaDeepseek({
			supabase,
			artefactoId,
			projectId,
			formato: "germinal",
			temperatura: CONFIG_GERMINAL.temperature,
			errorMensaje: (err as Error).message,
		});
		return fail<ResultErrorCode>("LLM_ERROR");
	}
	await logLlamadaDeepseek({
		supabase,
		artefactoId,
		projectId,
		formato: "germinal",
		temperatura: CONFIG_GERMINAL.temperature,
		result,
	});

	// (5) Hashes upstream para cascada.
	const hashCron = await hashCronica(cronRes.data as unknown as CgtCronica);
	const hashDest = await hashCanonicoDestilado(
		destRes.data as unknown as CgtDestilado,
	);

	// (6) Persistencia idempotente.
	await supabase
		.from("cgt_germinales")
		.delete()
		.eq("artefacto_id", artefactoId);

	const { data: insertado, error: insertError } = await supabase
		.from("cgt_germinales")
		.insert({
			artefacto_id: artefactoId,
			project_id: projectId,
			resumen: result.content,
			// `contexto_snapshot` en v1 atómica: arrays vacíos + metadatos del
			// modo. Cuando v2 de prompts consulte corpus, `destilados_previos_consultados`
			// y `semillas_vivas_snapshot` se poblarán y `artefactos_previos_consultados`
			// reflejará el contador real. El shape JSON es forward-compatible.
			contexto_snapshot: {
				destilados_previos_consultados: [],
				semillas_vivas_snapshot: [],
				timestamp_snapshot: new Date().toISOString(),
				version_prompt: GERMINAL_VERSION_PROMPT_V1,
				artefactos_previos_consultados: 0,
				modo: GERMINAL_MODO_V1,
			} as never,
			num_resonancias_propuestas: 0,
			num_proyecciones_propuestas: 0,
			tokens_count: tokensContentDe(result),
			hash_cronica_upstream: hashCron,
			hash_destilado_upstream: hashDest,
			generado_por: "llm",
			nodo_generador: NODO_GENERADOR_CASCADE,
			modelo_ia: result.modelUsado,
			version_esquema: VERSION_ESQUEMA_FORMATOS,
			costo_usd: result.costoUsd,
			tokens_input: result.tokensInput,
			tokens_output: result.tokensOutput,
		})
		.select()
		.single();

	if (insertError || !insertado) {
		console.error("[generarGerminalParcial] insert falló:", insertError);
		return fail<ResultErrorCode>("INTERNAL");
	}
	return ok(insertado as unknown as CgtGerminal);
}
//#endregion ![main]

//#region [main] - 🔧 (5) metabolizarArtefacto (ORQUESTADOR) 🔧
/**
 * Orquestador secuencial: ejecuta los 4 generadores en orden, gestionando
 * estados del artefacto y políticas de fallo diferenciadas por formato.
 *
 * **Flujo** (spec v0.3 §5 — FASE 1 → FASE 2):
 *   0. `ingresado` → `metabolizando`.
 *   1. `generarCronica`. Fallo → `error`, detener.
 *   2. `generarDestilado`. Fallo → `error`, detener.
 *   3. `generarNucleo`. Fallo → `error`, detener.
 *   4. `generarGerminalParcial`. `THRESHOLD_NOT_MET` → omitir sin error.
 *      Otro fallo → `error`, pero Crónica+Destilado+Núcleo quedan persistidos.
 *   5. `metabolizando` → `metabolizado`.
 *
 * **Resume-from-last**: al arrancar, mira qué formatos ya están persistidos
 * y saltea sus generadores (NO llama al LLM para ellos) — útil cuando el
 * artefacto falló a mitad de pipeline o quedó en `metabolizado` con algún
 * formato faltante (p. ej. Germinal antes de la decisión v1 atómica).
 *
 * Para **regenerar todo** desde cero, pasar `{ forzar: true }`: cada
 * generador hace DELETE+INSERT de su fila, así que sobreescribe.
 */
export async function metabolizarArtefacto(
	artefactoId: string,
	options?: { forzar?: boolean },
): Promise<Result<ResumenMetabolizacion, ResultErrorCode>> {
	console.log(`\n🔬 [metabolizarArtefacto] ===== INICIO ===== artefactoId=${artefactoId}`);
	
	try {
		const forzar = options?.forzar === true;
		console.log(`🔬 [metabolizarArtefacto] forzar=${forzar}`);
		
		const supabase = await createServerClient();
		console.log(`🔬 [metabolizarArtefacto] Supabase client creado`);

		const accesoRes = await asegurarAccesoArtefacto(supabase, artefactoId);
		console.log(`🔬 [metabolizarArtefacto] accesoRes.ok=${accesoRes.ok}`);
		if (!accesoRes.ok) {
			console.error(`🔬 [metabolizarArtefacto] ACCESO DENEGADO:`, accesoRes.error);
			return accesoRes;
		}

		// Scan inicial
		console.log(`🔬 [metabolizarArtefacto] Escaneando formatos existentes...`);
		const [hayCronica, hayDestilado, hayNucleo, hayGerminal] =
			forzar ?
				[false, false, false, false]
			:	await Promise.all([
					existeFormato(supabase, "cgt_cronicas", artefactoId),
					existeFormato(supabase, "cgt_destilados", artefactoId),
					existeFormato(supabase, "cgt_nucleos", artefactoId),
					existeFormato(supabase, "cgt_germinales", artefactoId),
				]);
		console.log(`🔬 [metabolizarArtefacto] Format: cronica=${hayCronica}, destilado=${hayDestilado}, nucleo=${hayNucleo}, germinal=${hayGerminal}`);

		// Estado → metabolizando.
		console.log(`🔬 [metabolizarArtefacto] Estado → metabolizando`);
		await actualizarEstadoArtefacto(supabase, artefactoId, "metabolizando");

		// ─── PRE-PROCESAMIENTO POR TIPO ───
		console.log(`🔬 [metabolizarArtefacto] Detectando tipo de artefacto...`);
		const tipoRes = await supabase
			.from("cgt_artefactos")
			.select("tipo")
			.eq("id", artefactoId)
			.single();
		const tipo = tipoRes.data?.tipo;
		console.log(`🔬 [metabolizarArtefacto] tipo="${tipo}" (error: ${tipoRes.error?.message ?? "ninguno"})`);

		if (tipo === "audio") {
			console.log(`🔬 [metabolizarArtefacto] === PRE-PROCESAMIENTO AUDIO ===`);
			const { data: audioRow } = await supabase
				.from("cgt_artefactos_audio")
				.select("id")
				.eq("artefacto_id", artefactoId)
				.maybeSingle();
			console.log(`🔬 [metabolizarArtefacto] audioRow existe: ${!!audioRow}`);
			
			if (!audioRow) {
				console.log(`🔬 [metabolizarArtefacto] Audio sin transcripción. Descargando de Storage...`);
				const { data: art } = await supabase
					.from("cgt_artefactos")
					.select("storage_path_original, titulo")
					.eq("id", artefactoId)
					.single();
				console.log(`🔬 [metabolizarArtefacto] storage_path_original: ${art?.storage_path_original ?? "NULL"}`);
				
				if (art?.storage_path_original) {
					console.log(`🔬 [metabolizarArtefacto] Descargando audio de Storage...`);
					const { data: blob, error: dlErr } = await supabase.storage
						.from("cognetica-files")
						.download(art.storage_path_original);
					
					if (blob && !dlErr) {
						console.log(`🔬 [metabolizarArtefacto] Audio descargado. Ejecutando transcribirAudio...`);
						const arrayBuffer = await blob.arrayBuffer();
						const { transcribirAudio } = await import("./cognetica_forense_actions");
						const txRes = await transcribirAudio(
							artefactoId,
							Buffer.from(arrayBuffer),
							art.titulo || "audio.mp3",
						);
						console.log(`🔬 [metabolizarArtefacto] transcribirAudio resultado: ok=${txRes.ok}, error=${"error" in txRes ? txRes.error : "ninguno"}`);
						
						if (!txRes.ok) {
							console.error(`🔬 [metabolizarArtefacto] TRANSCRIPCIÓN FALLÓ:`, txRes.error);
							return fail<ResultErrorCode>(txRes.error as ResultErrorCode);
						}
						console.log(`🔬 [metabolizarArtefacto] ✅ Transcripción completada`);
					} else {
						console.error(`🔬 [metabolizarArtefacto] ERROR DESCARGANDO AUDIO:`, dlErr);
						await actualizarEstadoArtefacto(
							supabase,
							artefactoId,
							"error",
							"No se pudo descargar el audio de Storage para transcribirlo.",
						);
						return fail<ResultErrorCode>("MISSING_UPSTREAM");
					}
				} else {
					console.error(`🔬 [metabolizarArtefacto] NO HAY storage_path_original`);
				}
			} else {
				console.log(`🔬 [metabolizarArtefacto] Audio ya transcrito, skip pre-procesamiento`);
			}
		}

		if (tipo === "pdf_slides") {
			console.log(`🔬 [metabolizarArtefacto] === PRE-PROCESAMIENTO PDF SLIDES ===`);
			const { data: slidesRow } = await supabase
				.from("cgt_artefactos_pdf_slides")
				.select("id")
				.eq("artefacto_id", artefactoId)
				.maybeSingle();
			console.log(`🔬 [metabolizarArtefacto] slidesRow existe: ${!!slidesRow}`);

			if (!slidesRow) {
				console.log(`🔬 [metabolizarArtefacto] Slides sin procesar. Descargando de Storage...`);
				const { data: art } = await supabase
					.from("cgt_artefactos")
					.select("storage_path_original, titulo")
					.eq("id", artefactoId)
					.single();

				if (art?.storage_path_original) {
					console.log(`🔬 [metabolizarArtefacto] Descargando PDF slides de Storage...`);
					const { data: blob, error: dlErr } = await supabase.storage
						.from("cognetica-files")
						.download(art.storage_path_original);
					if (blob && !dlErr) {
						console.log(`🔬 [metabolizarArtefacto] PDF descargado. Ejecutando procesarPdfSlides...`);
						const arrayBuffer = await blob.arrayBuffer();
						const { procesarPdfSlides } = await import("./cognetica_forense_actions");
						const slidesRes = await procesarPdfSlides(
							artefactoId,
							Buffer.from(arrayBuffer),
							art.storage_path_original,
						);
						console.log(`🔬 [metabolizarArtefacto] procesarPdfSlides resultado: ok=${slidesRes.ok}, error=${"error" in slidesRes ? slidesRes.error : "ninguno"}`);

						if (!slidesRes.ok) {
							console.error(`🔬 [metabolizarArtefacto] PROCESAMIENTO PDF SLIDES FALLÓ:`, slidesRes.error);
							return fail<ResultErrorCode>(slidesRes.error as ResultErrorCode);
						}
						console.log(`🔬 [metabolizarArtefacto] ✅ PDF slides procesado`);
					} else {
						console.error(`🔬 [metabolizarArtefacto] ERROR DESCARGANDO PDF SLIDES:`, dlErr);
						await actualizarEstadoArtefacto(
							supabase,
							artefactoId,
							"error",
							"No se pudo descargar el PDF de Storage para procesarlo.",
						);
						return fail<ResultErrorCode>("MISSING_UPSTREAM");
					}
				}
			} else {
				console.log(`🔬 [metabolizarArtefacto] PDF slides ya procesado, skip pre-procesamiento`);
			}
		}

		if (tipo === "pdf_informe") {
			console.log(`🔬 [metabolizarArtefacto] === PRE-PROCESAMIENTO PDF ===`);
			const { data: mdRow } = await supabase
				.from("cgt_artefactos_markdown")
				.select("id")
				.eq("artefacto_id", artefactoId)
				.maybeSingle();
			console.log(`🔬 [metabolizarArtefacto] mdRow existe: ${!!mdRow}`);
			
			if (!mdRow) {
				console.log(`🔬 [metabolizarArtefacto] PDF sin contenido Markdown. Descargando de Storage...`);
				const { data: art } = await supabase
					.from("cgt_artefactos")
					.select("storage_path_original, titulo")
					.eq("id", artefactoId)
					.single();
				if (art?.storage_path_original) {
					console.log(`🔬 [metabolizarArtefacto] Descargando PDF de Storage...`);
					const { data: blob, error: dlErr } = await supabase.storage
						.from("cognetica-files")
						.download(art.storage_path_original);
					if (blob && !dlErr) {
						console.log(`🔬 [metabolizarArtefacto] PDF descargado. Ejecutando procesarPdfInforme...`);
						const arrayBuffer = await blob.arrayBuffer();
						const { procesarPdfInforme } = await import("./cognetica_forense_actions");
						const pdfRes = await procesarPdfInforme(
							artefactoId,
							Buffer.from(arrayBuffer),
							art.storage_path_original,
						);
						console.log(`🔬 [metabolizarArtefacto] procesarPdfInforme resultado: ok=${pdfRes.ok}, error=${"error" in pdfRes ? pdfRes.error : "ninguno"}`);
						
						if (!pdfRes.ok) {
							console.error(`🔬 [metabolizarArtefacto] PROCESAMIENTO PDF FALLÓ:`, pdfRes.error);
							return fail<ResultErrorCode>(pdfRes.error as ResultErrorCode);
						}
						console.log(`🔬 [metabolizarArtefacto] ✅ PDF procesado`);
					} else {
						console.error(`🔬 [metabolizarArtefacto] ERROR DESCARGANDO PDF:`, dlErr);
						await actualizarEstadoArtefacto(
							supabase,
							artefactoId,
							"error",
							"No se pudo descargar el PDF de Storage para procesarlo.",
						);
						return fail<ResultErrorCode>("MISSING_UPSTREAM");
					}
				}
			} else {
				console.log(`🔬 [metabolizarArtefacto] PDF ya procesado, skip pre-procesamiento`);
			}
		}

		const resumen: ResumenMetabolizacion = {
			cronica: hayCronica ? "reutilizado" : "no_corrido",
			destilado: hayDestilado ? "reutilizado" : "no_corrido",
			nucleo: hayNucleo ? "reutilizado" : "no_corrido",
			germinal: hayGerminal ? "reutilizado" : "no_corrido",
		};
		console.log(`🔬 [metabolizarArtefacto] Resumen inicial:`, resumen);

		// (1) Crónica.
		if (!hayCronica) {
			console.log(`🔬 [metabolizarArtefacto] === PASO 1: CRÓNICA ===`);
			const cronRes = await generarCronica(artefactoId);
			console.log(`🔬 [metabolizarArtefacto] Crónica resultado: ok=${cronRes.ok}, error=${"error" in cronRes ? cronRes.error : "ninguno"}`);
			if (!cronRes.ok) {
				console.error(`🔬 [metabolizarArtefacto] CRÓNICA FALLÓ:`, cronRes.error);
				await actualizarEstadoArtefacto(
					supabase,
					artefactoId,
					"error",
					`Crónica: ${cronRes.error}`,
				);
				return fail<ResultErrorCode>(cronRes.error);
			}
			resumen.cronica = "generado";
			console.log(`🔬 [metabolizarArtefacto] ✅ Crónica generada`);
		} else {
			console.log(`🔬 [metabolizarArtefacto] Crónica ya existe, skip`);
		}

		// (2) Destilado.
		if (!hayDestilado) {
			console.log(`🔬 [metabolizarArtefacto] === PASO 2: DESTILADO ===`);
			const destRes = await generarDestilado(artefactoId);
			console.log(`🔬 [metabolizarArtefacto] Destilado resultado: ok=${destRes.ok}, error=${"error" in destRes ? destRes.error : "ninguno"}`);
			if (!destRes.ok) {
				console.error(`🔬 [metabolizarArtefacto] DESTILADO FALLÓ:`, destRes.error);
				await actualizarEstadoArtefacto(
					supabase,
					artefactoId,
					"error",
					`Destilado: ${destRes.error}`,
				);
				return fail<ResultErrorCode>(destRes.error);
			}
			resumen.destilado = "generado";
			console.log(`🔬 [metabolizarArtefacto] ✅ Destilado generado`);
		} else {
			console.log(`🔬 [metabolizarArtefacto] Destilado ya existe, skip`);
		}

		// (3) Núcleo.
		if (!hayNucleo) {
			console.log(`🔬 [metabolizarArtefacto] === PASO 3: NÚCLEO ===`);
			const nucRes = await generarNucleo(artefactoId);
			console.log(`🔬 [metabolizarArtefacto] Núcleo resultado: ok=${nucRes.ok}, error=${"error" in nucRes ? nucRes.error : "ninguno"}`);
			if (!nucRes.ok) {
				console.error(`🔬 [metabolizarArtefacto] NÚCLEO FALLÓ:`, nucRes.error);
				await actualizarEstadoArtefacto(
					supabase,
					artefactoId,
					"error",
					`Núcleo: ${nucRes.error}`,
				);
				return fail<ResultErrorCode>(nucRes.error);
			}
			resumen.nucleo = "generado";
			console.log(`🔬 [metabolizarArtefacto] ✅ Núcleo generado`);
		} else {
			console.log(`🔬 [metabolizarArtefacto] Núcleo ya existe, skip`);
		}

		// (4) Germinal — política laxa.
		if (!hayGerminal) {
			console.log(`🔬 [metabolizarArtefacto] === PASO 4: GERMINAL ===`);
			const gerRes = await generarGerminalParcial(artefactoId);
			console.log(`🔬 [metabolizarArtefacto] Germinal resultado: ok=${gerRes.ok}, error=${"error" in gerRes ? gerRes.error : "ninguno"}`);
			if (gerRes.ok) {
				resumen.germinal = "generado";
				console.log(`🔬 [metabolizarArtefacto] ✅ Germinal generado`);
			} else if (gerRes.error === "THRESHOLD_NOT_MET") {
				resumen.germinal = "omitido";
				console.log(`🔬 [metabolizarArtefacto] ⏭️ Germinal omitido (THRESHOLD_NOT_MET)`);
			} else {
				resumen.germinal = "error";
				console.warn(`🔬 [metabolizarArtefacto] ⚠️ Germinal error (no bloqueante):`, gerRes.error);
				await actualizarEstadoArtefacto(
					supabase,
					artefactoId,
					"metabolizado",
					`Germinal: ${gerRes.error}`,
				);
				revalidatePath(`/cognetica/${artefactoId}`);
				revalidatePath("/cognetica");
				return ok(resumen);
			}
		} else {
			console.log(`🔬 [metabolizarArtefacto] Germinal ya existe, skip`);
		}

		console.log(`🔬 [metabolizarArtefacto] ===== FIN EXITOSO =====`);
		await actualizarEstadoArtefacto(supabase, artefactoId, "metabolizado", null);
		revalidatePath(`/cognetica/${artefactoId}`);
		revalidatePath("/cognetica");
		return ok(resumen);
		
	} catch (error) {
		console.error(`🔬 [metabolizarArtefacto] ❌ EXCEPCIÓN NO CAPTURADA:`, error);
		// Intentar marcar el artefacto como error
		try {
			const supabase = await createServerClient();
			await actualizarEstadoArtefacto(
				supabase,
				artefactoId,
				"error",
				error instanceof Error ? error.message : "Error desconocido en metabolización",
			);
		} catch (e) {
			console.error(`🔬 [metabolizarArtefacto] ❌ Error al marcar estado de error:`, e);
		}
		return fail<ResultErrorCode>("INTERNAL");
	}
}

/**
 * Helper interno: verifica si existe una fila del formato para este artefacto.
 *
 * Usa `HEAD` + `count` en vez de `select("id")` para evitar tocar RLS
 * innecesariamente en el payload y minimizar el round-trip.
 */
async function existeFormato(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tabla: "cgt_cronicas" | "cgt_destilados" | "cgt_nucleos" | "cgt_germinales",
	artefactoId: string,
): Promise<boolean> {
	const { count, error } = await supabase
		.from(tabla)
		.select("id", { count: "exact", head: true })
		.eq("artefacto_id", artefactoId);
	if (error) {
		console.error(`[existeFormato:${tabla}]`, error);
		return false;
	}
	return (count ?? 0) > 0;
}

// `ERR_PROMPT_PENDIENTE` y `ResumenMetabolizacion` viven en
// `@/lib/cognetica-forense/metabolizacion-shared` — un archivo `"use server"`
// sólo puede exportar funciones async (Next.js 14).
//#endregion ![main]
