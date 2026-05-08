//. 📍 lib/cognetica-forense/lib/cartografiador/construir-payload.ts
/**
 * Construcción del payload que el Cartografiador pasa al LLM:
 *
 *   1. **Universo del proyecto** — entidades canónicas existentes en
 *      las 5 tablas `cgt_<tipo>`. Si una entidad no tiene descripción
 *      canónica, se pasa `null`. Los `aliases` vienen como array JSONB
 *      en DB y se serializan a string[] para el LLM.
 *
 *   2. **Extracto crudo** — menciones con `decision_cartografiador =
 *      'sin_cartografiar'` del artefacto a cartografiar. Se capturan
 *      también los `mencion_id` en un mapa paralelo para que el
 *      `aplicar-decisiones` sepa qué fila UPDATE-ar al recibir la
 *      respuesta del LLM (el LLM no ve los UUID de menciones, solo los
 *      `nombre_extractor_crudo` — ver `cartografiador-prompt.ts` donde
 *      se limpian del payload).
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type {
	ExtractoCrudo,
	UniversoProyecto,
	MencionCrudaSimple,
	MencionCrudaCita,
	EntidadUniversoSimple,
	CitaUniverso,
} from "@/lib/cognetica-forense/prompts/cartografiador-prompt";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
type DbClient = SupabaseClient<Database>;
//#endregion ![def]

//#region [main] - 🔧 construirUniverso 🔧
/**
 * Lee las entidades canónicas de las 5 tablas del proyecto y arma el
 * shape `UniversoProyecto` que consume el prompt.
 *
 * Si una lectura falla, devolvemos error y no continuamos — sin el
 * universo el Cartografiador no puede decidir `match_existente` y
 * marcaría falsamente todo como `nueva_entidad`, contaminando el grafo.
 */
export async function construirUniverso(
	supabase: DbClient,
	projectId: string,
): Promise<{ universo: UniversoProyecto | null; error: string | null }> {
	const [pensRes, discRes, concRes, teoRes, citRes] = await Promise.all([
		supabase
			.from("cgt_pensadores")
			.select("id, nombre_canonico, aliases, descripcion_canonica")
			.eq("project_id", projectId),
		supabase
			.from("cgt_disciplinas")
			.select("id, nombre_canonico, aliases, descripcion_canonica")
			.eq("project_id", projectId),
		supabase
			.from("cgt_conceptos")
			.select("id, nombre_canonico, aliases, descripcion_canonica")
			.eq("project_id", projectId),
		supabase
			.from("cgt_teorias")
			.select("id, nombre_canonico, aliases, descripcion_canonica")
			.eq("project_id", projectId),
		supabase
			.from("cgt_citas")
			.select("id, texto, autor, referencia, tipo_cita")
			.eq("project_id", projectId),
	]);

	const errores = [pensRes.error, discRes.error, concRes.error, teoRes.error, citRes.error]
		.filter(Boolean)
		.map((e) => e?.message ?? "error desconocido");
	if (errores.length > 0) {
		console.error("[construirUniverso] lectura falló:", errores);
		return { universo: null, error: errores.join("; ") };
	}

	return {
		universo: {
			pensadores: (pensRes.data ?? []).map(mapearEntidadSimple),
			disciplinas: (discRes.data ?? []).map(mapearEntidadSimple),
			conceptos: (concRes.data ?? []).map(mapearEntidadSimple),
			teorias: (teoRes.data ?? []).map(mapearEntidadSimple),
			citas: (citRes.data ?? []).map(mapearCita),
		},
		error: null,
	};
}

function mapearEntidadSimple(row: {
	id: string;
	nombre_canonico: string;
	aliases: unknown;
	descripcion_canonica: string | null;
}): EntidadUniversoSimple {
	// `aliases` es JSONB en DB (array de strings). Normalizamos a string[]
	// de forma defensiva: si no es array o trae no-strings, devolvemos [].
	const aliases: string[] =
		Array.isArray(row.aliases) ?
			row.aliases.filter((x): x is string => typeof x === "string")
		:	[];
	return {
		id: row.id,
		nombre_canonico: row.nombre_canonico,
		aliases,
		descripcion_canonica: row.descripcion_canonica,
	};
}

function mapearCita(row: {
	id: string;
	texto: string;
	autor: string | null;
	referencia: string | null;
	tipo_cita: string;
}): CitaUniverso {
	return {
		id: row.id,
		texto: row.texto,
		autor: row.autor,
		referencia: row.referencia,
		tipo_cita: row.tipo_cita,
	};
}
//#endregion ![main]

//#region [main] - 🔧 construirExtracto 🔧
/**
 * Lee las menciones del artefacto con `decision_cartografiador =
 * 'sin_cartografiar'` (las que el Cartografiador aún no resolvió) y
 * arma el shape `ExtractoCrudo` que consume el prompt.
 *
 * Los `mencion_id` viajan en el extracto (no en el payload al LLM) para
 * que `aplicar-decisiones` sepa qué fila UPDATE al recibir la respuesta.
 */
export async function construirExtracto(
	supabase: DbClient,
	artefactoId: string,
): Promise<{ extracto: ExtractoCrudo | null; error: string | null }> {
	const [pensRes, discRes, concRes, teoRes, citRes] = await Promise.all([
		supabase
			.from("cgt_pensadores_menciones")
			.select("id, nombre_extractor_crudo, descripcion_extractor_cruda")
			.eq("artefacto_id", artefactoId)
			.eq("decision_cartografiador", "sin_cartografiar")
			.order("created_at", { ascending: true }),
		supabase
			.from("cgt_disciplinas_menciones")
			.select("id, nombre_extractor_crudo, descripcion_extractor_cruda")
			.eq("artefacto_id", artefactoId)
			.eq("decision_cartografiador", "sin_cartografiar")
			.order("created_at", { ascending: true }),
		supabase
			.from("cgt_conceptos_menciones")
			.select("id, nombre_extractor_crudo, descripcion_extractor_cruda")
			.eq("artefacto_id", artefactoId)
			.eq("decision_cartografiador", "sin_cartografiar")
			.order("created_at", { ascending: true }),
		supabase
			.from("cgt_teorias_menciones")
			.select("id, nombre_extractor_crudo, descripcion_extractor_cruda")
			.eq("artefacto_id", artefactoId)
			.eq("decision_cartografiador", "sin_cartografiar")
			.order("created_at", { ascending: true }),
		supabase
			.from("cgt_citas_menciones")
			.select(
				"id, texto_extractor_crudo, autor_extractor_crudo, referencia_extractor_cruda, tipo_cita_extractor, ubicacion_en_artefacto",
			)
			.eq("artefacto_id", artefactoId)
			.eq("decision_cartografiador", "sin_cartografiar")
			.order("created_at", { ascending: true }),
	]);

	const errores = [pensRes.error, discRes.error, concRes.error, teoRes.error, citRes.error]
		.filter(Boolean)
		.map((e) => e?.message ?? "error desconocido");
	if (errores.length > 0) {
		console.error("[construirExtracto] lectura falló:", errores);
		return { extracto: null, error: errores.join("; ") };
	}

	const mapSimple = (
		row: {
			id: string;
			nombre_extractor_crudo: string;
			descripcion_extractor_cruda: string | null;
		},
	): MencionCrudaSimple => ({
		mencion_id: row.id,
		nombre_extractor_crudo: row.nombre_extractor_crudo,
		descripcion_extractor_cruda: row.descripcion_extractor_cruda,
	});

	const mapCita = (row: {
		id: string;
		texto_extractor_crudo: string;
		autor_extractor_crudo: string | null;
		referencia_extractor_cruda: string | null;
		tipo_cita_extractor: string | null;
		ubicacion_en_artefacto: string | null;
	}): MencionCrudaCita => ({
		mencion_id: row.id,
		texto_extractor_crudo: row.texto_extractor_crudo,
		autor_extractor_crudo: row.autor_extractor_crudo,
		referencia_extractor_cruda: row.referencia_extractor_cruda,
		tipo_cita_extractor: row.tipo_cita_extractor,
		ubicacion_en_artefacto: row.ubicacion_en_artefacto,
	});

	return {
		extracto: {
			pensadores: (pensRes.data ?? []).map(mapSimple),
			disciplinas: (discRes.data ?? []).map(mapSimple),
			conceptos: (concRes.data ?? []).map(mapSimple),
			teorias: (teoRes.data ?? []).map(mapSimple),
			citas: (citRes.data ?? []).map(mapCita),
		},
		error: null,
	};
}

/**
 * Helper: total de menciones pendientes en un extracto. Se usa para
 * decidir si vale la pena llamar al LLM (si es 0, nada que cartografiar).
 */
export function totalMencionesExtracto(extracto: ExtractoCrudo): number {
	return (
		extracto.pensadores.length +
		extracto.disciplinas.length +
		extracto.conceptos.length +
		extracto.teorias.length +
		extracto.citas.length
	);
}
//#endregion ![main]
