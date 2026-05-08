//. 📍 lib/cognetica-forense/lib/persistir-menciones-extractor.ts
/**
 * Persistencia de menciones crudas desde el output del Destilado
 * directamente a las tablas `cgt_<tipo>_menciones` (Capa 1 del modelo
 * de trazabilidad).
 *
 * **Por qué vive aquí y no en el Cartografiador:**
 *
 * La propuesta original (guía §3 HITO 3 Transacción A) contemplaba que
 * el Cartografiador leyera un JSONB `insumos_extraidos` persistido por
 * el Destilado y poblara menciones. eRRRe eligió un camino más
 * elegante: el Destilado inserta directamente en las tablas finales,
 * eliminando el JSONB intermedio y la Transacción A completa. El
 * Cartografiador solo hace UPDATE de Capa 2 después.
 *
 * Beneficios de esta decisión:
 *   - Una sola fuente de verdad (las tablas de menciones, no un JSONB
 *     duplicado en `cgt_destilados`).
 *   - No hay código legacy de migración que mantener.
 *   - Append-only natural: si un Destilado se regenera, las menciones
 *     nuevas coexisten con las viejas diferenciadas por `hash_extractor_crudo`.
 *   - Validación estructural temprana: si el LLM devuelve un ítem
 *     malformado, el INSERT falla y no queda datos silenciosamente mal.
 *
 * **Manejo del doble schema del Destilado:**
 *
 * El prompt v1 de Destilado entrega strings planos para pensadores /
 * disciplinas / conceptos, y objetos `{texto, autor, ubicacion}` para
 * citas. El prompt v2 (Hito 6) pasa todos a objetos `{nombre, descripcion}`
 * + añade teorías. Este helper maneja **ambos schemas** sin branch
 * externo — el parser dual `parsearItemSimple` acepta string u objeto.
 *
 * **Idempotencia:**
 *
 * Antes de insertar, se consultan los `hash_extractor_crudo` ya presentes
 * para el artefacto por tipo. Los ítems con hash ya existente se saltan.
 * Esto hace idempotente la regeneración del Destilado sin violar el
 * principio append-only: si el LLM produce el mismo ítem (mismo JSON
 * canónico → mismo SHA-256), no se duplica; si produce algo distinto,
 * se agrega como nueva mención y la vieja queda como historial.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import crypto from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { TipoCita } from "@/lib/cognetica-forense/types/oleada2";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
/**
 * Subset del Destilado parseado que alimenta este helper. No
 * validamos shape aquí — eso es responsabilidad de `generarDestilado`
 * antes de llamarnos. Todo lo marcamos `unknown` donde el schema real
 * puede variar entre prompt v1 y v2.
 */
export interface DestiladoInsumos {
	pensadores_mencionados?: unknown;
	disciplinas_tocadas?: unknown;
	conceptos_clave?: unknown;
	teorias_invocadas?: unknown;
	citas_secundarias?: unknown;
}

/**
 * Contadores de lo que efectivamente se insertó (excluye deduplicados
 * por hash). Útil para el log del pipeline y para tests de humo.
 */
export interface EstadisticasPersistencia {
	pensadores_insertados: number;
	disciplinas_insertadas: number;
	conceptos_insertados: number;
	teorias_insertadas: number;
	citas_insertadas: number;
	/** Cantidad de ítems saltados por dedup (hash repetido). */
	duplicados_saltados: number;
	/** Cantidad de ítems rechazados por schema inválido. */
	malformados: number;
}

type DbClient = SupabaseClient<Database>;

interface ItemSimple {
	nombre: string;
	descripcion: string | null;
}

interface ItemCita {
	texto: string;
	autor: string | null;
	referencia: string | null;
	tipo_cita: TipoCita | null;
	ubicacion: string | null;
}
//#endregion ![def]

//#region [helpers] - 🛠️ HASH Y PARSER DUAL 🛠️
/**
 * SHA-256 hex de un objeto canonicalizado (claves ordenadas
 * alfabéticamente). Garantiza que el mismo ítem lógico siempre
 * produzca el mismo hash, independiente del orden de las keys que haya
 * usado el LLM.
 *
 * El `hash_extractor_crudo` es la pieza que hace la regeneración
 * idempotente: si el LLM reproduce el mismo objeto, no se duplica.
 */
function hashExtractor(item: unknown): string {
	const canonical = canonicalize(item);
	return crypto.createHash("sha256").update(canonical).digest("hex");
}

function canonicalize(value: unknown): string {
	if (value === null || value === undefined) return "null";
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number" || typeof value === "boolean") {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map(canonicalize).join(",")}]`;
	}
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		const keys = Object.keys(obj).sort();
		const pairs = keys.map(
			(k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`,
		);
		return `{${pairs.join(",")}}`;
	}
	return "null";
}

/**
 * Parser dual para pensadores / disciplinas / conceptos / teorías.
 * Acepta:
 *   - `string` (prompt v1): se usa como nombre, descripción null.
 *   - `{nombre, descripcion?}` (prompt v2): ambos campos honrados.
 *
 * Devuelve `null` si el ítem es malformado (p.ej. string vacío, objeto
 * sin `nombre`, tipo inesperado). El caller incrementa `malformados` y
 * sigue con el resto de ítems — un ítem malo no tumba el batch.
 */
function parsearItemSimple(item: unknown): ItemSimple | null {
	if (typeof item === "string") {
		const nombre = item.trim();
		return nombre ? { nombre, descripcion: null } : null;
	}
	if (item && typeof item === "object" && !Array.isArray(item)) {
		const obj = item as { nombre?: unknown; descripcion?: unknown };
		const nombre = typeof obj.nombre === "string" ? obj.nombre.trim() : "";
		if (!nombre) return null;
		const descripcion =
			typeof obj.descripcion === "string" && obj.descripcion.trim() ?
				obj.descripcion.trim()
			:	null;
		return { nombre, descripcion };
	}
	return null;
}

/**
 * Parser de citas. Maneja tanto el schema v1 (`{texto, autor, ubicacion}`)
 * como el v2 (`{texto, autor, referencia, tipo_cita}`). La precedencia
 * es: `referencia` si viene, si no `ubicacion`.
 *
 * `tipo_cita_extractor` solo se rellena si el LLM lo devolvió y es un
 * valor válido del enum; en caso contrario se deja null y el
 * Cartografiador (Capa 2) lo completará.
 */
function parsearCita(item: unknown): ItemCita | null {
	if (!item || typeof item !== "object" || Array.isArray(item)) return null;
	const obj = item as Record<string, unknown>;
	const texto = typeof obj.texto === "string" ? obj.texto.trim() : "";
	if (!texto) return null;

	const autor =
		typeof obj.autor === "string" && obj.autor.trim() ? obj.autor.trim() : null;

	const referenciaField =
		typeof obj.referencia === "string" && obj.referencia.trim() ?
			obj.referencia.trim()
		:	null;
	const ubicacionField =
		typeof obj.ubicacion === "string" && obj.ubicacion.trim() ?
			obj.ubicacion.trim()
		:	null;
	// `referencia` gana sobre `ubicacion` (schema v2 sobre v1); guardamos
	// la que no quede como referencia en `ubicacion_en_artefacto` si existe.
	const referencia = referenciaField ?? ubicacionField;
	const ubicacion =
		referenciaField && ubicacionField ? ubicacionField : null;

	const tiposValidos: ReadonlyArray<TipoCita> = [
		"academica",
		"hecho_historico",
		"obra",
		"otra",
	];
	const tipoRaw = obj.tipo_cita;
	const tipo_cita: TipoCita | null =
		typeof tipoRaw === "string" && (tiposValidos as readonly string[]).includes(tipoRaw) ?
			(tipoRaw as TipoCita)
		:	null;

	return { texto, autor, referencia, tipo_cita, ubicacion };
}
//#endregion ![helpers]

//#region [main] - 🔧 persistirMencionesExtractor 🔧
/**
 * Persiste en las 5 tablas `cgt_<tipo>_menciones` las menciones crudas
 * extraídas por el LLM del Destilado. Idempotente por `hash_extractor_crudo`.
 *
 * Estrategia:
 *   1. Para cada tipo, leer los hashes ya presentes para el artefacto.
 *   2. Parsear cada ítem del array correspondiente (`parsearItemSimple`
 *      o `parsearCita`). Contar malformados.
 *   3. Calcular hash del ítem original (no del parseado — el hash
 *      refleja exactamente lo que el LLM dijo).
 *   4. Filtrar por hash ya presente (dedup).
 *   5. Bulk-insert lo que queda con `decision_cartografiador = 'sin_cartografiar'`.
 *
 * Si una tabla falla, se logea y se **sigue con las demás**. Retornamos
 * el error de la última falla (si hubo alguna) para que el caller
 * decida. La alternativa — abortar al primer error — sacrificaría las
 * menciones que sí se pudieron insertar, peor para UX.
 */
export async function persistirMencionesExtractor(
	supabase: DbClient,
	artefactoId: string,
	projectId: string,
	insumos: DestiladoInsumos,
): Promise<{
	stats: EstadisticasPersistencia;
	error: string | null;
}> {
	const stats: EstadisticasPersistencia = {
		pensadores_insertados: 0,
		disciplinas_insertadas: 0,
		conceptos_insertados: 0,
		teorias_insertadas: 0,
		citas_insertadas: 0,
		duplicados_saltados: 0,
		malformados: 0,
	};
	let ultimoError: string | null = null;

	// ── Pensadores ───────────────────────────────────────────────
	if (Array.isArray(insumos.pensadores_mencionados)) {
		const r = await persistirSimpleBulk(
			supabase,
			"cgt_pensadores_menciones",
			"pensador",
			insumos.pensadores_mencionados,
			artefactoId,
			projectId,
			stats,
		);
		stats.pensadores_insertados = r.insertados;
		if (r.error) ultimoError = r.error;
	}

	// ── Disciplinas ──────────────────────────────────────────────
	if (Array.isArray(insumos.disciplinas_tocadas)) {
		const r = await persistirSimpleBulk(
			supabase,
			"cgt_disciplinas_menciones",
			"disciplina",
			insumos.disciplinas_tocadas,
			artefactoId,
			projectId,
			stats,
		);
		stats.disciplinas_insertadas = r.insertados;
		if (r.error) ultimoError = r.error;
	}

	// ── Conceptos ────────────────────────────────────────────────
	if (Array.isArray(insumos.conceptos_clave)) {
		const r = await persistirSimpleBulk(
			supabase,
			"cgt_conceptos_menciones",
			"concepto",
			insumos.conceptos_clave,
			artefactoId,
			projectId,
			stats,
		);
		stats.conceptos_insertados = r.insertados;
		if (r.error) ultimoError = r.error;
	}

	// ── Teorías (Hito 6 en adelante; vacío en prompt v1) ─────────
	if (Array.isArray(insumos.teorias_invocadas)) {
		const r = await persistirSimpleBulk(
			supabase,
			"cgt_teorias_menciones",
			"teoria",
			insumos.teorias_invocadas,
			artefactoId,
			projectId,
			stats,
		);
		stats.teorias_insertadas = r.insertados;
		if (r.error) ultimoError = r.error;
	}

	// ── Citas ────────────────────────────────────────────────────
	if (Array.isArray(insumos.citas_secundarias)) {
		const r = await persistirCitasBulk(
			supabase,
			insumos.citas_secundarias,
			artefactoId,
			projectId,
			stats,
		);
		stats.citas_insertadas = r.insertados;
		if (r.error) ultimoError = r.error;
	}

	return { stats, error: ultimoError };
}
//#endregion ![main]

//#region [helpers] - 🛠️ BULK INSERTS POR TIPO 🛠️
/**
 * Nombres de las 4 tablas "simples" (pensadores/disciplinas/conceptos/teorías).
 * Se usa el literal en el `.from()` para que Supabase-ts infiera shape.
 */
type TablaSimple =
	| "cgt_pensadores_menciones"
	| "cgt_disciplinas_menciones"
	| "cgt_conceptos_menciones"
	| "cgt_teorias_menciones";

type TipoSimple = "pensador" | "disciplina" | "concepto" | "teoria";

/**
 * Inserta menciones de un tipo "simple" (no citas). Despacha por tabla
 * para que cada branch preserve el tipo de Insert exacto de Supabase.
 */
async function persistirSimpleBulk(
	supabase: DbClient,
	tabla: TablaSimple,
	tipo: TipoSimple,
	items: unknown[],
	artefactoId: string,
	projectId: string,
	stats: EstadisticasPersistencia,
): Promise<{ insertados: number; error: string | null }> {
	// 1. Parseo + malformados.
	const parsed: Array<{ raw: unknown; parsed: ItemSimple; hash: string }> = [];
	for (const raw of items) {
		const p = parsearItemSimple(raw);
		if (!p) {
			stats.malformados++;
			continue;
		}
		parsed.push({ raw, parsed: p, hash: hashExtractor(raw) });
	}
	if (parsed.length === 0) return { insertados: 0, error: null };

	// 2. Dedup contra hashes ya persistidos.
	const hashesExistentes = await leerHashesExistentes(
		supabase,
		tabla,
		artefactoId,
	);
	const nuevos = parsed.filter((p) => {
		if (hashesExistentes.has(p.hash)) {
			stats.duplicados_saltados++;
			return false;
		}
		return true;
	});
	if (nuevos.length === 0) return { insertados: 0, error: null };

	// 3. Bulk insert con branch tipado.
	const filas = nuevos.map((n) => ({
		artefacto_id: artefactoId,
		project_id: projectId,
		nombre_extractor_crudo: n.parsed.nombre,
		descripcion_extractor_cruda: n.parsed.descripcion,
		hash_extractor_crudo: n.hash,
		// `decision_cartografiador` toma su default 'sin_cartografiar' del schema.
	}));

	let error: string | null = null;
	let insertRes;
	switch (tabla) {
		case "cgt_pensadores_menciones":
			insertRes = await supabase.from(tabla).insert(filas);
			break;
		case "cgt_disciplinas_menciones":
			insertRes = await supabase.from(tabla).insert(filas);
			break;
		case "cgt_conceptos_menciones":
			insertRes = await supabase.from(tabla).insert(filas);
			break;
		case "cgt_teorias_menciones":
			insertRes = await supabase.from(tabla).insert(filas);
			break;
	}
	if (insertRes.error) {
		console.error(
			`[persistirMencionesExtractor:${tipo}] bulk insert en ${tabla}:`,
			insertRes.error,
		);
		error = insertRes.error.message;
		return { insertados: 0, error };
	}

	return { insertados: filas.length, error: null };
}

/**
 * Inserta menciones de citas. Schema distinto (texto/autor/referencia/
 * tipo_cita en vez de nombre/descripcion) justifica función aparte.
 */
async function persistirCitasBulk(
	supabase: DbClient,
	items: unknown[],
	artefactoId: string,
	projectId: string,
	stats: EstadisticasPersistencia,
): Promise<{ insertados: number; error: string | null }> {
	const parsed: Array<{ raw: unknown; parsed: ItemCita; hash: string }> = [];
	for (const raw of items) {
		const p = parsearCita(raw);
		if (!p) {
			stats.malformados++;
			continue;
		}
		parsed.push({ raw, parsed: p, hash: hashExtractor(raw) });
	}
	if (parsed.length === 0) return { insertados: 0, error: null };

	const hashesExistentes = await leerHashesExistentes(
		supabase,
		"cgt_citas_menciones",
		artefactoId,
	);
	const nuevos = parsed.filter((p) => {
		if (hashesExistentes.has(p.hash)) {
			stats.duplicados_saltados++;
			return false;
		}
		return true;
	});
	if (nuevos.length === 0) return { insertados: 0, error: null };

	const filas = nuevos.map((n) => ({
		artefacto_id: artefactoId,
		project_id: projectId,
		texto_extractor_crudo: n.parsed.texto,
		autor_extractor_crudo: n.parsed.autor,
		referencia_extractor_cruda: n.parsed.referencia,
		tipo_cita_extractor: n.parsed.tipo_cita,
		ubicacion_en_artefacto: n.parsed.ubicacion,
		hash_extractor_crudo: n.hash,
	}));

	const insertRes = await supabase.from("cgt_citas_menciones").insert(filas);
	if (insertRes.error) {
		console.error(
			"[persistirMencionesExtractor:cita] bulk insert en cgt_citas_menciones:",
			insertRes.error,
		);
		return { insertados: 0, error: insertRes.error.message };
	}

	return { insertados: filas.length, error: null };
}

/**
 * Lee hashes ya persistidos de un tipo para un artefacto. Si la lectura
 * falla, devolvemos un `Set` vacío y dejamos que el insert intente —
 * al menos no bloqueamos la escritura por un error de lectura. Las
 * duplicaciones potenciales las detectará la UNIQUE constraint de DB
 * si existe, o quedarán como datos redundantes (no rompe integridad).
 */
async function leerHashesExistentes(
	supabase: DbClient,
	tabla:
		| "cgt_pensadores_menciones"
		| "cgt_disciplinas_menciones"
		| "cgt_conceptos_menciones"
		| "cgt_teorias_menciones"
		| "cgt_citas_menciones",
	artefactoId: string,
): Promise<Set<string>> {
	let res;
	switch (tabla) {
		case "cgt_pensadores_menciones":
			res = await supabase
				.from(tabla)
				.select("hash_extractor_crudo")
				.eq("artefacto_id", artefactoId);
			break;
		case "cgt_disciplinas_menciones":
			res = await supabase
				.from(tabla)
				.select("hash_extractor_crudo")
				.eq("artefacto_id", artefactoId);
			break;
		case "cgt_conceptos_menciones":
			res = await supabase
				.from(tabla)
				.select("hash_extractor_crudo")
				.eq("artefacto_id", artefactoId);
			break;
		case "cgt_teorias_menciones":
			res = await supabase
				.from(tabla)
				.select("hash_extractor_crudo")
				.eq("artefacto_id", artefactoId);
			break;
		case "cgt_citas_menciones":
			res = await supabase
				.from(tabla)
				.select("hash_extractor_crudo")
				.eq("artefacto_id", artefactoId);
			break;
	}
	if (res.error) {
		console.warn(
			`[persistirMencionesExtractor] lectura de hashes falló en ${tabla}; se procede sin dedup:`,
			res.error,
		);
		return new Set();
	}
	const set = new Set<string>();
	for (const row of (res.data ?? []) as Array<{ hash_extractor_crudo: string }>) {
		set.add(row.hash_extractor_crudo);
	}
	return set;
}
//#endregion ![helpers]
