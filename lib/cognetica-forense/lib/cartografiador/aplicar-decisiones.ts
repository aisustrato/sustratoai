//. 📍 lib/cognetica-forense/lib/cartografiador/aplicar-decisiones.ts
/**
 * Aplicación de la respuesta del Cartografiador sobre las menciones.
 *
 * El LLM devuelve una decisión por cada mención cruda. Aquí:
 *
 *   1. Se valida el shape de la respuesta (conteos por tipo = input).
 *   2. Para `nueva_entidad` se crean canónicas (con dedup intra-corrida
 *      por `nombre_canonico` y detección de UNIQUE conflicts cross-
 *      corrida — si el LLM propone crear algo que ya existe, se
 *      degrada a `match_existente` contra la fila preexistente).
 *   3. Para `match_existente` se valida el UUID contra el universo.
 *   4. Para `ambigua` se aplica Capa 2 sin asignar FK.
 *   5. Todos los UPDATE se hacen uno por uno (las filas son pocas,
 *      <50 por corrida típica) para preservar errores individuales.
 *
 * **Política cross-corrida ante UNIQUE:** el LLM a veces decide
 * `nueva_entidad` cuando ya hay una canónica con ese `nombre_canonico`
 * (típicamente porque el universo le pasó aliases pero el LLM los
 * ignoró). En vez de fallar el INSERT, lo convertimos a un
 * `match_existente` con `confianza_cartografiador = 0` y una
 * justificación anexa ("sistema reasignó a entidad preexistente por
 * colisión de nombre_canonico"). Es más robusto que tumbar la corrida.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type {
	ExtractoCrudo,
	UniversoProyecto,
	MencionCrudaSimple,
	MencionCrudaCita,
} from "@/lib/cognetica-forense/prompts/cartografiador-prompt";
import type {
	DecisionCartografiador,
	TipoCita,
} from "@/lib/cognetica-forense/types/oleada2";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
type DbClient = SupabaseClient<Database>;

/**
 * Shape de una decisión "simple" del LLM (pensador/disciplina/concepto/
 * teoría). Todos los campos llegan como `unknown` porque el LLM puede
 * devolver casi cualquier cosa; los validamos uno por uno.
 */
interface DecisionSimpleLlm {
	nombre_extractor_crudo?: unknown;
	nombre_cartografiador?: unknown;
	descripcion_cartografiador?: unknown;
	decision?: unknown;
	id_entidad_existente?: unknown;
	confianza?: unknown;
	justificacion?: unknown;
}

interface DecisionCitaLlm {
	texto_extractor_crudo?: unknown;
	autor_extractor_crudo?: unknown;
	texto_cartografiador?: unknown;
	autor_cartografiador?: unknown;
	referencia_cartografiador?: unknown;
	tipo_cita_cartografiador?: unknown;
	decision?: unknown;
	id_entidad_existente?: unknown;
	confianza?: unknown;
	justificacion?: unknown;
}

export interface RespuestaCartografiador {
	pensadores: DecisionSimpleLlm[];
	disciplinas: DecisionSimpleLlm[];
	conceptos: DecisionSimpleLlm[];
	teorias: DecisionSimpleLlm[];
	citas: DecisionCitaLlm[];
}

/**
 * Contadores del resultado de una corrida. Se usan para el log en
 * `cgt_logs_cartografiador` y para el toast de UI.
 */
export interface StatsAplicacion {
	matches: number;
	nuevas: number;
	ambiguas: number;
	/** Menciones descartadas (input != output, campos faltantes, etc). */
	inconsistentes: number;
	/** Entidades canónicas efectivamente creadas. */
	canonicas_creadas: number;
}

type TipoSimple = "pensador" | "disciplina" | "concepto" | "teoria";
//#endregion ![def]

//#region [helpers] - 🛠️ VALIDADORES 🛠️
const DECISIONES_VALIDAS: ReadonlyArray<DecisionCartografiador> = [
	"match_existente",
	"nueva_entidad",
	"ambigua",
];

const TIPOS_CITA_VALIDOS: ReadonlyArray<TipoCita> = [
	"academica",
	"hecho_historico",
	"obra",
	"otra",
];

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asDecision(v: unknown): DecisionCartografiador | null {
	if (typeof v !== "string") return null;
	return (DECISIONES_VALIDAS as readonly string[]).includes(v) ?
			(v as DecisionCartografiador)
		:	null;
}

function asTipoCita(v: unknown): TipoCita | null {
	if (typeof v !== "string") return null;
	return (TIPOS_CITA_VALIDOS as readonly string[]).includes(v) ?
			(v as TipoCita)
		:	null;
}

function asUuid(v: unknown): string | null {
	return typeof v === "string" && UUID_RE.test(v) ? v : null;
}

function asTextoRequerido(v: unknown): string | null {
	return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function asTextoOpcional(v: unknown): string | null {
	return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function asConfianza(v: unknown): number | null {
	if (typeof v !== "number" || Number.isNaN(v)) return null;
	if (v < 0 || v > 1) return null;
	return v;
}

/**
 * Concatena una nota del sistema a la justificación del LLM. Se usa
 * cuando el código degrada una decisión (ej. `nueva_entidad` → `match`
 * por colisión UNIQUE, o reutilización intra-corrida). Mantiene la
 * justificación original del LLM para auditoría y agrega un prefijo
 * `[sistema]` para que el humano la distinga.
 */
function anotarSistema(
	justificacionLlm: string | null,
	notaSistema: string,
): string {
	const nota = `[sistema] ${notaSistema}`;
	if (!justificacionLlm) return nota;
	return `${justificacionLlm} | ${nota}`;
}
//#endregion ![helpers]

//#region [main] - 🔧 aplicarDecisiones 🔧
/**
 * Aplica las decisiones del LLM sobre las menciones.
 *
 * **Contratos:**
 *   - Cada array de la respuesta debe tener la **misma cantidad** que
 *     el extracto correspondiente. Si difiere, marcamos la respuesta
 *     como inconsistente para ese tipo y continuamos con los otros.
 *   - Las menciones del input se matchean por **índice** con las
 *     decisiones del output (el LLM respeta el orden de la spec §1).
 *   - El `nombre_extractor_crudo` de la decisión se verifica contra el
 *     `nombre_extractor_crudo` de la mención en el mismo índice, por
 *     seguridad. Si difiere, se descarta esa decisión.
 */
export async function aplicarDecisiones(
	supabase: DbClient,
	projectId: string,
	extracto: ExtractoCrudo,
	universo: UniversoProyecto,
	respuesta: RespuestaCartografiador,
): Promise<StatsAplicacion> {
	const stats: StatsAplicacion = {
		matches: 0,
		nuevas: 0,
		ambiguas: 0,
		inconsistentes: 0,
		canonicas_creadas: 0,
	};

	// UUIDs válidos del universo por tipo, para validar `id_entidad_existente`.
	const uuidsPensadores = new Set(universo.pensadores.map((e) => e.id));
	const uuidsDisciplinas = new Set(universo.disciplinas.map((e) => e.id));
	const uuidsConceptos = new Set(universo.conceptos.map((e) => e.id));
	const uuidsTeorias = new Set(universo.teorias.map((e) => e.id));
	const uuidsCitas = new Set(universo.citas.map((e) => e.id));

	// Procesamiento secuencial por tipo. Paralelizar los 5 UPDATE bulk
	// daría poco beneficio (el LLM fue el bottleneck) y complicaría el
	// dedup intra-corrida. Secuencial es más fácil de razonar.
	await procesarSimple(
		supabase,
		"pensador",
		projectId,
		extracto.pensadores,
		respuesta.pensadores,
		uuidsPensadores,
		stats,
	);
	await procesarSimple(
		supabase,
		"disciplina",
		projectId,
		extracto.disciplinas,
		respuesta.disciplinas,
		uuidsDisciplinas,
		stats,
	);
	await procesarSimple(
		supabase,
		"concepto",
		projectId,
		extracto.conceptos,
		respuesta.conceptos,
		uuidsConceptos,
		stats,
	);
	await procesarSimple(
		supabase,
		"teoria",
		projectId,
		extracto.teorias,
		respuesta.teorias,
		uuidsTeorias,
		stats,
	);
	await procesarCitas(
		supabase,
		projectId,
		extracto.citas,
		respuesta.citas,
		uuidsCitas,
		stats,
	);

	return stats;
}
//#endregion ![main]

//#region [helpers] - 🛠️ procesarSimple (pensadores/disciplinas/conceptos/teorias) 🛠️
async function procesarSimple(
	supabase: DbClient,
	tipo: TipoSimple,
	projectId: string,
	menciones: MencionCrudaSimple[],
	decisiones: DecisionSimpleLlm[],
	uuidsValidos: Set<string>,
	stats: StatsAplicacion,
): Promise<void> {
	if (menciones.length !== decisiones.length) {
		console.error(
			`[aplicarDecisiones:${tipo}] input.length=${menciones.length} != output.length=${decisiones.length}; descartando tipo completo`,
		);
		stats.inconsistentes += menciones.length;
		return;
	}
	if (menciones.length === 0) return;

	// Cache de canónicas creadas en ESTA corrida para dedup:
	// `nombre_canonico → id`. Evita que dos `nueva_entidad` con el mismo
	// `nombre_cartografiador` creen dos canónicas distintas.
	const canonicasRecien: Map<string, string> = new Map();

	for (let i = 0; i < menciones.length; i++) {
		const mencion = menciones[i];
		const decision = decisiones[i];

		const nombreCrudoLlm = asTextoRequerido(decision.nombre_extractor_crudo);
		if (nombreCrudoLlm !== mencion.nombre_extractor_crudo) {
			console.error(
				`[aplicarDecisiones:${tipo}] idx=${i} mismatch nombre_extractor_crudo: esperado="${mencion.nombre_extractor_crudo}" recibido="${nombreCrudoLlm ?? "(invalido)"}"`,
			);
			stats.inconsistentes++;
			continue;
		}

		const decisionEnum = asDecision(decision.decision);
		if (!decisionEnum) {
			console.error(
				`[aplicarDecisiones:${tipo}] idx=${i} decision inválida:`,
				decision.decision,
			);
			stats.inconsistentes++;
			continue;
		}

		const nombreCart = asTextoRequerido(decision.nombre_cartografiador);
		if (!nombreCart) {
			console.error(
				`[aplicarDecisiones:${tipo}] idx=${i} nombre_cartografiador requerido pero inválido`,
			);
			stats.inconsistentes++;
			continue;
		}
		const descripcionCart = asTextoOpcional(
			decision.descripcion_cartografiador,
		);
		const confianza = asConfianza(decision.confianza);
		const justificacion = asTextoOpcional(decision.justificacion);

		let fkId: string | null = null;
		let decisionFinal: DecisionCartografiador = decisionEnum;
		let justificacionFinal: string | null = justificacion;

		if (decisionEnum === "match_existente") {
			// Path directo: el LLM ya reconoció la entidad del universo.
			const uuid = asUuid(decision.id_entidad_existente);
			if (!uuid || !uuidsValidos.has(uuid)) {
				console.error(
					`[aplicarDecisiones:${tipo}] idx=${i} id_entidad_existente no válido o ajeno al universo:`,
					decision.id_entidad_existente,
				);
				stats.inconsistentes++;
				continue;
			}
			fkId = uuid;
			stats.matches++;
		} else if (decisionEnum === "nueva_entidad") {
			// Dedup intra-corrida: si en esta misma corrida ya se creó
			// (o reusó) una canónica con este `nombre_canonico`, se
			// reutiliza. No se cuenta como `canonicas_creadas` otra vez.
			const yaCreada = canonicasRecien.get(nombreCart);
			if (yaCreada !== undefined) {
				fkId = yaCreada;
				// La segunda mención apuntando al mismo canónico cuenta
				// como match (está referenciando una entidad que ya existe
				// post-creación), no como nueva.
				decisionFinal = "match_existente";
				justificacionFinal = anotarSistema(
					justificacion,
					"reutilización intra-corrida: misma entidad que mención previa",
				);
				stats.matches++;
			} else {
				const res = await crearOReusarCanonica(
					supabase,
					tipo,
					projectId,
					nombreCart,
					descripcionCart,
				);
				if (res.error) {
					console.error(
						`[aplicarDecisiones:${tipo}] idx=${i} fallo creando canónica "${nombreCart}":`,
						res.error,
					);
					stats.inconsistentes++;
					continue;
				}
				fkId = res.id;
				canonicasRecien.set(nombreCart, res.id);
				if (res.reusada) {
					// Colisión cross-corrida: el LLM propuso nueva pero ya
					// había una canónica con ese nombre. Se degrada.
					decisionFinal = "match_existente";
					justificacionFinal = anotarSistema(
						justificacion,
						"reasignado a entidad preexistente por colisión de nombre_canonico",
					);
					stats.matches++;
				} else {
					stats.canonicas_creadas++;
					stats.nuevas++;
				}
			}
		} else {
			// ambigua — se aplica Capa 2 sin FK.
			stats.ambiguas++;
		}

		// UPDATE de la mención con Capa 2 poblada.
		const updatePatch = {
			nombre_cartografiador: nombreCart,
			descripcion_cartografiador: descripcionCart,
			decision_cartografiador: decisionFinal,
			confianza_cartografiador: confianza,
			justificacion_cartografiador: justificacionFinal,
			cartografiado_at: new Date().toISOString(),
		};
		const errUpdate = await actualizarMencionSimple(
			supabase,
			tipo,
			mencion.mencion_id,
			fkId,
			updatePatch,
		);
		if (errUpdate) {
			console.error(
				`[aplicarDecisiones:${tipo}] UPDATE mencion_id=${mencion.mencion_id} falló:`,
				errUpdate,
			);
			stats.inconsistentes++;
		}
	}
}

/**
 * Crea una canónica "simple" o reusa la existente si ya había una con
 * el mismo `(project_id, nombre_canonico)` (UNIQUE constraint). La
 * reutilización es silenciosa — el caller detecta el caso con `reusada`.
 */
async function crearOReusarCanonica(
	supabase: DbClient,
	tipo: TipoSimple,
	projectId: string,
	nombreCanonico: string,
	descripcionCanonica: string | null,
): Promise<{ id: string; reusada: boolean; error: string | null }> {
	// 1. Check previo: ¿ya existe?
	const existente = await leerCanonicaPorNombre(
		supabase,
		tipo,
		projectId,
		nombreCanonico,
	);
	if (existente.error) {
		return { id: "", reusada: false, error: existente.error };
	}
	if (existente.id) {
		return { id: existente.id, reusada: true, error: null };
	}

	// 2. No existe: insertar.
	const insertPayload = {
		project_id: projectId,
		nombre_canonico: nombreCanonico,
		descripcion_canonica: descripcionCanonica,
	};

	let insertRes;
	switch (tipo) {
		case "pensador":
			insertRes = await supabase
				.from("cgt_pensadores")
				.insert(insertPayload)
				.select("id")
				.maybeSingle();
			break;
		case "disciplina":
			insertRes = await supabase
				.from("cgt_disciplinas")
				.insert(insertPayload)
				.select("id")
				.maybeSingle();
			break;
		case "concepto":
			insertRes = await supabase
				.from("cgt_conceptos")
				.insert(insertPayload)
				.select("id")
				.maybeSingle();
			break;
		case "teoria":
			insertRes = await supabase
				.from("cgt_teorias")
				.insert(insertPayload)
				.select("id")
				.maybeSingle();
			break;
	}

	if (insertRes.error) {
		// Race condition UNIQUE: otro proceso creó la misma canónica
		// entre nuestro check y nuestro insert. Re-leer.
		if (insertRes.error.code === "23505") {
			const retry = await leerCanonicaPorNombre(
				supabase,
				tipo,
				projectId,
				nombreCanonico,
			);
			if (retry.id) {
				return { id: retry.id, reusada: true, error: null };
			}
		}
		return { id: "", reusada: false, error: insertRes.error.message };
	}
	if (!insertRes.data) {
		return { id: "", reusada: false, error: "insert sin data" };
	}
	return { id: insertRes.data.id, reusada: false, error: null };
}

async function leerCanonicaPorNombre(
	supabase: DbClient,
	tipo: TipoSimple,
	projectId: string,
	nombreCanonico: string,
): Promise<{ id: string | null; error: string | null }> {
	let res;
	switch (tipo) {
		case "pensador":
			res = await supabase
				.from("cgt_pensadores")
				.select("id")
				.eq("project_id", projectId)
				.eq("nombre_canonico", nombreCanonico)
				.maybeSingle();
			break;
		case "disciplina":
			res = await supabase
				.from("cgt_disciplinas")
				.select("id")
				.eq("project_id", projectId)
				.eq("nombre_canonico", nombreCanonico)
				.maybeSingle();
			break;
		case "concepto":
			res = await supabase
				.from("cgt_conceptos")
				.select("id")
				.eq("project_id", projectId)
				.eq("nombre_canonico", nombreCanonico)
				.maybeSingle();
			break;
		case "teoria":
			res = await supabase
				.from("cgt_teorias")
				.select("id")
				.eq("project_id", projectId)
				.eq("nombre_canonico", nombreCanonico)
				.maybeSingle();
			break;
	}
	if (res.error) return { id: null, error: res.error.message };
	return { id: res.data?.id ?? null, error: null };
}

/**
 * UPDATE de una mención "simple". Despacha por tipo para preservar la
 * columna FK correcta (`pensador_id`, `disciplina_id`, etc.).
 */
async function actualizarMencionSimple(
	supabase: DbClient,
	tipo: TipoSimple,
	mencionId: string,
	fkId: string | null,
	patch: {
		nombre_cartografiador: string;
		descripcion_cartografiador: string | null;
		decision_cartografiador: DecisionCartografiador;
		confianza_cartografiador: number | null;
		justificacion_cartografiador: string | null;
		cartografiado_at: string;
	},
): Promise<string | null> {
	switch (tipo) {
		case "pensador": {
			const { error } = await supabase
				.from("cgt_pensadores_menciones")
				.update({ ...patch, pensador_id: fkId })
				.eq("id", mencionId);
			return error ? error.message : null;
		}
		case "disciplina": {
			const { error } = await supabase
				.from("cgt_disciplinas_menciones")
				.update({ ...patch, disciplina_id: fkId })
				.eq("id", mencionId);
			return error ? error.message : null;
		}
		case "concepto": {
			const { error } = await supabase
				.from("cgt_conceptos_menciones")
				.update({ ...patch, concepto_id: fkId })
				.eq("id", mencionId);
			return error ? error.message : null;
		}
		case "teoria": {
			const { error } = await supabase
				.from("cgt_teorias_menciones")
				.update({ ...patch, teoria_id: fkId })
				.eq("id", mencionId);
			return error ? error.message : null;
		}
	}
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ procesarCitas 🛠️
/**
 * Procesa las decisiones de citas. A diferencia de las entidades
 * simples, las citas **no tienen UNIQUE** sobre un `nombre_canonico`
 * (cada aparición de una cita es conceptualmente única por su texto
 * + autor + referencia). Por eso no hacemos dedup por "nombre" — el
 * LLM decide match_existente contra una cita del universo si
 * literalmente es la misma; si no, es nueva_entidad y creamos canónica.
 */
async function procesarCitas(
	supabase: DbClient,
	projectId: string,
	menciones: MencionCrudaCita[],
	decisiones: DecisionCitaLlm[],
	uuidsValidos: Set<string>,
	stats: StatsAplicacion,
): Promise<void> {
	if (menciones.length !== decisiones.length) {
		console.error(
			`[aplicarDecisiones:cita] input.length=${menciones.length} != output.length=${decisiones.length}; descartando tipo completo`,
		);
		stats.inconsistentes += menciones.length;
		return;
	}
	if (menciones.length === 0) return;

	for (let i = 0; i < menciones.length; i++) {
		const mencion = menciones[i];
		const decision = decisiones[i];

		const textoCrudoLlm = asTextoRequerido(decision.texto_extractor_crudo);
		if (textoCrudoLlm !== mencion.texto_extractor_crudo) {
			console.error(
				`[aplicarDecisiones:cita] idx=${i} mismatch texto_extractor_crudo`,
			);
			stats.inconsistentes++;
			continue;
		}

		const decisionEnum = asDecision(decision.decision);
		if (!decisionEnum) {
			stats.inconsistentes++;
			continue;
		}

		const textoCart = asTextoRequerido(decision.texto_cartografiador);
		if (!textoCart) {
			stats.inconsistentes++;
			continue;
		}
		const autorCart = asTextoOpcional(decision.autor_cartografiador);
		const referenciaCart = asTextoOpcional(decision.referencia_cartografiador);
		const tipoCitaCart = asTipoCita(decision.tipo_cita_cartografiador);
		const confianza = asConfianza(decision.confianza);
		const justificacion = asTextoOpcional(decision.justificacion);

		let fkId: string | null = null;
		// Las citas no tienen lógica de degradación (no hay UNIQUE sobre
		// texto; cada cita es única), así que `decisionFinal` coincide
		// siempre con `decisionEnum`. Se mantienen como `const` para
		// mantener paralelismo estructural con `procesarSimple`.
		const decisionFinal: DecisionCartografiador = decisionEnum;
		const justificacionFinal: string | null = justificacion;

		if (decisionEnum === "match_existente") {
			const uuid = asUuid(decision.id_entidad_existente);
			if (!uuid || !uuidsValidos.has(uuid)) {
				console.error(
					`[aplicarDecisiones:cita] idx=${i} id_entidad_existente inválido`,
				);
				stats.inconsistentes++;
				continue;
			}
			fkId = uuid;
			stats.matches++;
		} else if (decisionEnum === "nueva_entidad") {
			// Siempre creamos una cita canónica nueva (no hay dedup por
			// texto porque podrían ser distintos contextos del mismo
			// texto — ese juicio lo hace un humano después, no este
			// pipeline).
			const { data: canonica, error: insErr } = await supabase
				.from("cgt_citas")
				.insert({
					project_id: projectId,
					texto: textoCart,
					autor: autorCart,
					referencia: referenciaCart,
					tipo_cita: tipoCitaCart ?? "otra",
				})
				.select("id")
				.maybeSingle();
			if (insErr || !canonica) {
				console.error(
					`[aplicarDecisiones:cita] idx=${i} fallo creando cita canónica:`,
					insErr,
				);
				stats.inconsistentes++;
				continue;
			}
			fkId = canonica.id;
			stats.canonicas_creadas++;
			stats.nuevas++;
		} else {
			// ambigua
			stats.ambiguas++;
		}

		const { error: updErr } = await supabase
			.from("cgt_citas_menciones")
			.update({
				cita_id: fkId,
				texto_cartografiador: textoCart,
				autor_cartografiador: autorCart,
				referencia_cartografiador: referenciaCart,
				tipo_cita_cartografiador: tipoCitaCart,
				decision_cartografiador: decisionFinal,
				confianza_cartografiador: confianza,
				justificacion_cartografiador: justificacionFinal,
				cartografiado_at: new Date().toISOString(),
			})
			.eq("id", mencion.mencion_id);
		if (updErr) {
			console.error(
				`[aplicarDecisiones:cita] UPDATE mencion_id=${mencion.mencion_id} falló:`,
				updErr,
			);
			stats.inconsistentes++;
		}
	}
}
//#endregion ![helpers]
