// lib/preclassification/dimension-versioning.ts
/**
 * Sellado de versiones de dimensiones de preclasificación (Fase 1 de la
 * auditoría append-only con SHA-256).
 *
 * `preclass_dimensions` es editable en cualquier momento; sin esto, la
 * definición (nombre, descripción, tipo, opciones/preguntas/ejemplos) que se
 * inyecta en el prompt de la IA podía cambiar después de que ya existían
 * clasificaciones basadas en ella, sin dejar rastro de qué decía antes.
 *
 * `getOrCreateCurrentDimensionVersionId` calcula el hash canónico del
 * contenido ACTUAL de una dimensión y, si no existe ya una versión sellada
 * con ese mismo hash, crea una nueva fila en `preclass_dimension_versions`
 * (append-only, nunca se actualiza ni se borra). Se usa en dos momentos:
 *  - Antes de aplicar una edición a una dimensión ya usada (sella el
 *    contenido PRE-edición) — ver `updateDimension` en dimension-actions.ts.
 *  - Cada vez que se inserta una `article_dimension_reviews` (IA o humana) —
 *    para dejar esa fila ligada para siempre a la versión exacta que vio.
 *
 * Deliberadamente NO importa `next/server` ni nada específico de Server
 * Actions: recibe el cliente de Supabase como parámetro para poder llamarse
 * tanto desde `lib/actions/preclassification-actions.ts` como desde
 * `workflows/preclassification-workflow.ts` (que se mantiene aislado a
 * propósito, ver comentario de cabecera de ese archivo).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sha256CanonicalJson } from "@/lib/cognetica-forense/hash";

type DbClient = SupabaseClient<Database>;

interface DimensionContentInput {
	name: string;
	description: string | null;
	type: string;
	options: { value: string; ordering: number | null; emoticon: string | null }[];
	questions: { question: string; ordering: number | null }[];
	examples: { example: string }[];
}

function buildCanonicalContent(input: DimensionContentInput) {
	return {
		name: input.name,
		description: input.description,
		type: input.type,
		// Arrays ordenados explícitamente: canonicalStringify preserva el orden
		// de los arrays (lo trata como información), así que un mismo contenido
		// leído en distinto orden desde la BD no debe producir un hash distinto.
		options: [...input.options]
			.sort(
				(a, b) =>
					(a.ordering ?? 0) - (b.ordering ?? 0) ||
					a.value.localeCompare(b.value),
			)
			.map((o) => ({
				value: o.value,
				ordering: o.ordering,
				emoticon: o.emoticon,
			})),
		questions: [...input.questions]
			.sort(
				(a, b) =>
					(a.ordering ?? 0) - (b.ordering ?? 0) ||
					a.question.localeCompare(b.question),
			)
			.map((q) => ({ question: q.question, ordering: q.ordering })),
		examples: [...input.examples]
			.map((e) => e.example)
			.sort((a, b) => a.localeCompare(b)),
	};
}

export async function computeDimensionContentHash(
	input: DimensionContentInput,
): Promise<string> {
	return sha256CanonicalJson(buildCanonicalContent(input));
}

export interface DimensionVersionResult {
	versionId: string | null;
	error?: string;
}

/**
 * Devuelve el id de la versión sellada que corresponde al contenido ACTUAL
 * de la dimensión, creándola si todavía no existe una con ese hash.
 */
export async function getOrCreateCurrentDimensionVersionId(
	db: DbClient,
	dimensionId: string,
	sealedBy: string | null,
): Promise<DimensionVersionResult> {
	const { data: dim, error: dimErr } = await db
		.from("preclass_dimensions")
		.select(
			"id, project_id, name, description, type, preclass_dimension_options(value, ordering, emoticon), preclass_dimension_questions(question, ordering), preclass_dimension_examples(example)",
		)
		.eq("id", dimensionId)
		.single();

	if (dimErr || !dim) {
		return {
			versionId: null,
			error: dimErr?.message || "Dimensión no encontrada",
		};
	}

	const hash = await computeDimensionContentHash({
		name: dim.name,
		description: dim.description,
		type: dim.type,
		options: dim.preclass_dimension_options || [],
		questions: dim.preclass_dimension_questions || [],
		examples: dim.preclass_dimension_examples || [],
	});

	const { data: existingVersion, error: findErr } = await db
		.from("preclass_dimension_versions")
		.select("id")
		.eq("dimension_id", dimensionId)
		.eq("content_sha256", hash)
		.maybeSingle();

	if (findErr) {
		return { versionId: null, error: findErr.message };
	}
	if (existingVersion) {
		return { versionId: existingVersion.id };
	}

	const { data: latestVersion, error: latestErr } = await db
		.from("preclass_dimension_versions")
		.select("version_number")
		.eq("dimension_id", dimensionId)
		.order("version_number", { ascending: false })
		.limit(1)
		.maybeSingle();
	if (latestErr) {
		return { versionId: null, error: latestErr.message };
	}
	const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

	const { data: inserted, error: insertErr } = await db
		.from("preclass_dimension_versions")
		.insert({
			dimension_id: dimensionId,
			project_id: dim.project_id,
			version_number: nextVersionNumber,
			content_sha256: hash,
			name: dim.name,
			description: dim.description,
			type: dim.type,
			options_snapshot: dim.preclass_dimension_options || [],
			questions_snapshot: dim.preclass_dimension_questions || [],
			examples_snapshot: dim.preclass_dimension_examples || [],
			sealed_by: sealedBy,
		})
		.select("id")
		.single();

	if (insertErr || !inserted) {
		// 🔧 Condición de carrera: dos procesos pueden intentar sellar la misma
		// dimensión al mismo tiempo cuando todavía no existe ninguna versión.
		// El constraint UNIQUE(dimension_id, version_number) hace que el
		// segundo insert falle — en ese caso, no es un error real: alguien más
		// ya selló el mismo contenido, así que buscamos esa versión por hash.
		if (insertErr?.code === "23505") {
			const { data: raceWinner } = await db
				.from("preclass_dimension_versions")
				.select("id")
				.eq("dimension_id", dimensionId)
				.eq("content_sha256", hash)
				.maybeSingle();
			if (raceWinner) return { versionId: raceWinner.id };
		}
		return {
			versionId: null,
			error: insertErr?.message || "No se pudo sellar la versión",
		};
	}
	return { versionId: inserted.id };
}

/**
 * Variante con caché en memoria para uso dentro de un mismo job/lote: evita
 * recalcular el hash y re-consultar la BD para la misma dimensión en cada
 * artículo de un chunk (ej. 100 artículos x 5 dimensiones = solo 5 lookups,
 * no 500).
 */
export function createDimensionVersionResolver(
	db: DbClient,
	sealedBy: string | null,
) {
	const cache = new Map<string, Promise<DimensionVersionResult>>();
	return async (dimensionId: string): Promise<string | null> => {
		let pending = cache.get(dimensionId);
		if (!pending) {
			pending = getOrCreateCurrentDimensionVersionId(
				db,
				dimensionId,
				sealedBy,
			);
			cache.set(dimensionId, pending);
		}
		const result = await pending;
		if (result.error) {
			console.error(
				`[dimension-versioning] Error sellando dimensión ${dimensionId}: ${result.error}`,
			);
		}
		return result.versionId;
	};
}
