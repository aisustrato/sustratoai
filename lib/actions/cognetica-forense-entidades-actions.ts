/**
 * @file lib/actions/cognetica-forense-entidades-actions.ts
 * Server Actions para navegación por entidad (Hito 5).
 *
 * Sub-paso 5.1: Server Actions + tipos.
 * Dos acciones principales:
 *   1. obtenerEntidadCanonica — obtiene la entidad canónica + conteo de menciones.
 *   2. listarArtefactosPorEntidad — lista artefactos donde aparece la entidad.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { fail, ok } from "@/lib/cognetica-forense/result";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import {
	type TipoEntidadConConteo,
	type PensadorConConteo,
	type DisciplinaConConteo,
	type ConceptoConConteo,
	type TeoriaConConteo,
} from "@/lib/cognetica-forense/types/oleada2";
//#endregion ![head]

//#region [def] - 📦 SCHEMAS ZOD 📦
const UUID_SCHEMA = z.string().uuid();

const TIPO_ENTIDAD_CON_CONTEO_SCHEMA = z.enum([
	"pensador",
	"disciplina",
	"concepto",
	"teoria",
]);
//#endregion ![def]

//#region [def] - 📦 TIPOS 📦
// Re-exportamos el tipo desde oleada2 para conveniencia de consumidores
export type { TipoEntidadConConteo } from "@/lib/cognetica-forense/types/oleada2";

/**
 * Entidad canónica con su conteo de menciones, discriminada por tipo.
 * Extraído de las vistas `cgt_vw_<tipo>_con_conteo`.
 */
export type EntidadCanonicaConConteo<T extends TipoEntidadConConteo> =
	T extends "pensador" ? PensadorConConteo
	: T extends "disciplina" ? DisciplinaConConteo
	: T extends "concepto" ? ConceptoConConteo
	: T extends "teoria" ? TeoriaConConteo
	: never;

/**
 * Artefacto donde aparece una entidad, con metadata de la mención específica.
 * El campo `descripcion_mencion_en_artefacto` viene de la vista
 * `cgt_vw_<tipo>_valor_canonico.descripcion_canonica_actual`.
 */
export interface ArtefactoConMencion {
	/** ID del artefacto donde aparece la entidad. */
	artefacto_id: string;
	/** ID de la mención específica dentro de ese artefacto. */
	mencion_id: string;
	/** Título del artefacto (de cgt_artefactos). */
	titulo: string;
	/** Tipo de artefacto (markdown, audio, etc.). */
	tipo_artefacto: string;
	/** Fecha de creación del artefacto. */
	created_at: string;
	/** Timestamp de la primera mención (más antigua) de esta entidad. */
	primera_aparicion: string;
	/**
	 * Descripción de la mención en este artefacto específico.
	 * Puede diferir entre artefactos si el humano editó la descripción.
	 * Viene de `cgt_vw_<tipo>_valor_canonico.descripcion_canonica_actual`.
	 */
	descripcion_mencion_en_artefacto: string | null;
}

/**
 * Helper para unificar el retorno de las funciones SQL cgt_artefactos_por_<tipo>.
 * Todas las funciones devuelven el mismo shape base; luego joineamos con cgt_artefactos.
 */
interface ArtefactoPorEntidadRow {
	artefacto_id: string;
	mencion_id: string;
	nombre_canonico_actual: string;
	primera_aparicion: string;
}
//#endregion ![def]

//#region [action] - 🔧 obtenerEntidadCanonica 🔧
/**
 * Obtiene una entidad canónica por su ID, incluyendo el conteo de menciones.
 * Usa la vista `cgt_vw_<tipo>_con_conteo` que ya tiene el conteo pre-calculado.
 *
 * @param tipo - Tipo de entidad (sin citas, que no tienen vista con conteo).
 * @param entidadId - UUID de la entidad canónica.
 * @returns Result con la entidad + conteo, o código de error.
 */
export async function obtenerEntidadCanonica<T extends TipoEntidadConConteo>(
	tipo: T,
	entidadId: string,
): Promise<Result<EntidadCanonicaConConteo<T>, ResultErrorCode>> {
	// Validaciones de entrada
	const parseId = UUID_SCHEMA.safeParse(entidadId);
	const parseTipo = TIPO_ENTIDAD_CON_CONTEO_SCHEMA.safeParse(tipo);
	if (!parseId.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();

	// Despacho explícito por tipo — cada branch consulta la vista correspondiente.
	// El narrowing de TypeScript garantiza que el tipo de retorno coincide con T.
	switch (tipo) {
		case "pensador": {
			const { data, error } = await supabase
				.from("cgt_vw_pensadores_con_conteo")
				.select("*")
				.eq("id", entidadId)
				.maybeSingle();

			if (error) {
				console.error("[obtenerEntidadCanonica] pensador:", error);
				if (error.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
				return fail<ResultErrorCode>("INTERNAL");
			}
			if (!data) return fail<ResultErrorCode>("NOT_FOUND");
			return ok(data as EntidadCanonicaConConteo<T>);
		}

		case "disciplina": {
			const { data, error } = await supabase
				.from("cgt_vw_disciplinas_con_conteo")
				.select("*")
				.eq("id", entidadId)
				.maybeSingle();

			if (error) {
				console.error("[obtenerEntidadCanonica] disciplina:", error);
				if (error.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
				return fail<ResultErrorCode>("INTERNAL");
			}
			if (!data) return fail<ResultErrorCode>("NOT_FOUND");
			return ok(data as EntidadCanonicaConConteo<T>);
		}

		case "concepto": {
			const { data, error } = await supabase
				.from("cgt_vw_conceptos_con_conteo")
				.select("*")
				.eq("id", entidadId)
				.maybeSingle();

			if (error) {
				console.error("[obtenerEntidadCanonica] concepto:", error);
				if (error.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
				return fail<ResultErrorCode>("INTERNAL");
			}
			if (!data) return fail<ResultErrorCode>("NOT_FOUND");
			return ok(data as EntidadCanonicaConConteo<T>);
		}

		case "teoria": {
			const { data, error } = await supabase
				.from("cgt_vw_teorias_con_conteo")
				.select("*")
				.eq("id", entidadId)
				.maybeSingle();

			if (error) {
				console.error("[obtenerEntidadCanonica] teoria:", error);
				if (error.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
				return fail<ResultErrorCode>("INTERNAL");
			}
			if (!data) return fail<ResultErrorCode>("NOT_FOUND");
			return ok(data as EntidadCanonicaConConteo<T>);
		}

		default:
			// Exhaustiveness check — nunca debería llegar aquí por la validación Zod
			return fail<ResultErrorCode>("INVALID_INPUT");
	}
}
//#endregion ![action]

//#region [action] - 🔧 listarArtefactosPorEntidad 🔧
/**
 * Lista todos los artefactos donde aparece una entidad canónica dada.
 *
 * Llama a la función SQL `cgt_artefactos_por_<tipo>(entidad_id)` que devuelve
 * los artefactos con sus menciones, luego joinea con `cgt_artefactos` para
 * obtener título, tipo y fecha. También busca el `descripcion_mencion_en_artefacto`
 * desde la vista `cgt_vw_<tipo>_valor_canonico`.
 *
 * El resultado se ordena por `primera_aparicion DESC` (más reciente primero).
 *
 * @param tipo - Tipo de entidad (sin citas).
 * @param entidadId - UUID de la entidad canónica.
 * @returns Result con array de ArtefactoConMencion ordenados.
 */
export async function listarArtefactosPorEntidad<
	T extends TipoEntidadConConteo,
>(
	tipo: T,
	entidadId: string,
): Promise<Result<ArtefactoConMencion[], ResultErrorCode>> {
	// Validaciones de entrada
	const parseId = UUID_SCHEMA.safeParse(entidadId);
	const parseTipo = TIPO_ENTIDAD_CON_CONTEO_SCHEMA.safeParse(tipo);
	if (!parseId.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();

	// 1. Llamar función SQL para obtener artefactos + menciones de esta entidad.
	const rowsBase = await obtenerArtefactosBase(supabase, tipo, entidadId);
	if (!rowsBase.ok) return rowsBase; // Propaga error

	if (rowsBase.data.length === 0) {
		// Entidad sin apariciones activas (caso raro pero posible)
		return ok([]);
	}

	// Extraer IDs de artefactos para hacer un fetch batch de metadata
	const artefactoIds = rowsBase.data.map((r) => r.artefacto_id);
	const mencionIds = rowsBase.data.map((r) => r.mencion_id);

	// 2. Fetch paralelo: metadata de artefactos + descripciones de menciones
	const [artefactosRes, descripcionesRes] = await Promise.all([
		supabase
			.from("cgt_artefactos")
			.select("id, titulo, tipo, created_at")
			.in("id", artefactoIds),
		obtenerDescripcionesMenciones(supabase, tipo, mencionIds),
	]);

	if (artefactosRes.error) {
		console.error(
			"[listarArtefactosPorEntidad] artefactos:",
			artefactosRes.error,
		);
		return fail<ResultErrorCode>("INTERNAL");
	}

	if (descripcionesRes.error) {
		console.error(
			"[listarArtefactosPorEntidad] descripciones:",
			descripcionesRes.error,
		);
		return fail<ResultErrorCode>("INTERNAL");
	}

	// Indexar por ID para lookups O(1)
	const artefactoPorId = new Map(
		(artefactosRes.data ?? []).map((a) => [a.id, a]),
	);
	const descripcionPorMencionId = new Map(
		(descripcionesRes.data ?? []).map((d) => [d.mencion_id, d.descripcion]),
	);

	// 3. Ensamblar resultado final ordenado por primera_aparicion DESC
	const resultado: ArtefactoConMencion[] = rowsBase.data
		.map((row) => {
			const artefacto = artefactoPorId.get(row.artefacto_id);
			return {
				artefacto_id: row.artefacto_id,
				mencion_id: row.mencion_id,
				titulo: artefacto?.titulo ?? "(sin título)",
				tipo_artefacto: artefacto?.tipo ?? "desconocido",
				created_at: artefacto?.created_at ?? row.primera_aparicion,
				primera_aparicion: row.primera_aparicion,
				descripcion_mencion_en_artefacto:
					descripcionPorMencionId.get(row.mencion_id) ?? null,
			};
		})
		.sort(
			(a, b) =>
				new Date(b.primera_aparicion).getTime() -
				new Date(a.primera_aparicion).getTime(),
		);

	return ok(resultado);
}

/**
 * Llama a la función SQL `cgt_artefactos_por_<tipo>` según el tipo.
 * Cada función devuelve el mismo shape base (artefacto_id, mencion_id,
 * nombre_canonico_actual, primera_aparicion).
 */
async function obtenerArtefactosBase(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidadConConteo,
	entidadId: string,
): Promise<Result<ArtefactoPorEntidadRow[], ResultErrorCode>> {
	switch (tipo) {
		case "pensador": {
			const { data, error } = await supabase.rpc(
				"cgt_artefactos_por_pensador",
				{
					p_pensador_id: entidadId,
				},
			);
			if (error) {
				console.error("[obtenerArtefactosBase] pensador:", error);
				return fail<ResultErrorCode>("INTERNAL");
			}
			return ok((data ?? []) as ArtefactoPorEntidadRow[]);
		}

		case "disciplina": {
			const { data, error } = await supabase.rpc(
				"cgt_artefactos_por_disciplina",
				{
					p_disciplina_id: entidadId,
				},
			);
			if (error) {
				console.error("[obtenerArtefactosBase] disciplina:", error);
				return fail<ResultErrorCode>("INTERNAL");
			}
			return ok((data ?? []) as ArtefactoPorEntidadRow[]);
		}

		case "concepto": {
			const { data, error } = await supabase.rpc(
				"cgt_artefactos_por_concepto",
				{
					p_concepto_id: entidadId,
				},
			);
			if (error) {
				console.error("[obtenerArtefactosBase] concepto:", error);
				return fail<ResultErrorCode>("INTERNAL");
			}
			return ok((data ?? []) as ArtefactoPorEntidadRow[]);
		}

		case "teoria": {
			const { data, error } = await supabase.rpc("cgt_artefactos_por_teoria", {
				p_teoria_id: entidadId,
			});
			if (error) {
				console.error("[obtenerArtefactosBase] teoria:", error);
				return fail<ResultErrorCode>("INTERNAL");
			}
			return ok((data ?? []) as ArtefactoPorEntidadRow[]);
		}

		default:
			return fail<ResultErrorCode>("INVALID_INPUT");
	}
}

/**
 * Obtiene las descripciones canónicas de las menciones para enriquecer
 * `descripcion_mencion_en_artefacto`.
 *
 * Cada tipo tiene su propia vista: cgt_vw_<tipo>_valor_canonico.
 * Seleccionamos mencion_id + descripcion_canonica_actual.
 *
 * Nota: las vistas devuelven `mencion_id: string | null`, pero nosotros
 * filtramos por IDs conocidos, así que hacemos transformación defensiva.
 */
async function obtenerDescripcionesMenciones(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidadConConteo,
	mencionIds: string[],
): Promise<{
	data: Array<{ mencion_id: string; descripcion: string | null }> | null;
	error: unknown;
}> {
	if (mencionIds.length === 0) return { data: [], error: null };

	let res: {
		data:
			| {
					mencion_id: string | null;
					descripcion_canonica_actual: string | null;
			  }[]
			| null;
		error: unknown;
	};

	switch (tipo) {
		case "pensador": {
			res = await supabase
				.from("cgt_vw_pensadores_valor_canonico")
				.select("mencion_id, descripcion_canonica_actual")
				.in("mencion_id", mencionIds);
			break;
		}

		case "disciplina": {
			res = await supabase
				.from("cgt_vw_disciplinas_valor_canonico")
				.select("mencion_id, descripcion_canonica_actual")
				.in("mencion_id", mencionIds);
			break;
		}

		case "concepto": {
			res = await supabase
				.from("cgt_vw_conceptos_valor_canonico")
				.select("mencion_id, descripcion_canonica_actual")
				.in("mencion_id", mencionIds);
			break;
		}

		case "teoria": {
			res = await supabase
				.from("cgt_vw_teorias_valor_canonico")
				.select("mencion_id, descripcion_canonica_actual")
				.in("mencion_id", mencionIds);
			break;
		}

		default:
			return { data: [], error: null };
	}

	if (res.error) {
		return { data: null, error: res.error };
	}

	// Transformación defensiva: las vistas devuelven `string | null`,
	// pero sabemos que mencion_id no será null porque filtramos por IDs válidos.
	const transformed = (res.data ?? [])
		.filter(
			(
				d,
			): d is {
				mencion_id: string | null;
				descripcion_canonica_actual: string | null;
			} => d !== null && typeof d === "object",
		)
		.map((d) => ({
			mencion_id: d.mencion_id ?? "",
			descripcion: d.descripcion_canonica_actual ?? null,
		}))
		.filter((d) => d.mencion_id !== "");

	return { data: transformed, error: null };
}
//#endregion ![action]
