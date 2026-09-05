//. 📍 lib/actions/openalex-actions.ts
"use server";

/**
 * Harvester de OpenAlex: búsqueda + staging + triaje + promoción. Ver
 * docs/preclasificacion-auditoria-funcional/04_Requerimiento_OpenAlex_Harvester.md
 *
 * Flujo síncrono (no background job): buscar en OpenAlex, deduplicar contra
 * `staging_articles` + `articles` del proyecto, e insertar lo nuevo en
 * staging toma segundos, no minutos.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { createSupabaseServerClient } from "@/lib/server";
import type { Database, Json } from "@/lib/database.types";
import { sha256Hex } from "@/lib/cognetica-forense/hash";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
	searchOpenAlexWorks,
	harvestBySeedDoi,
	OPENALEX_HARD_MAX_RESULTS,
} from "@/lib/openalex/client";
import { isDuplicate, type DedupCandidate } from "@/lib/openalex/dedup";
import type {
	OpenAlexSearchFilters,
	OpenAlexWorkNormalized,
	SeedDirection,
} from "@/lib/types/openalex-types";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export type StagingArticleRow =
	Database["public"]["Tables"]["staging_articles"]["Row"];

const PERMISO_SUBIR_ARCHIVOS = "can_upload_files";

interface HarvestResult {
	fetchedCount: number;
	insertedCount: number;
	skippedDuplicates: number;
}
//#endregion ![def]

//#region [helpers] - 🛠️ PERMISOS 🛠️
async function verificarPermisoYUsuario(
	supabase: SupabaseClient<Database>,
	projectId: string,
): Promise<ResultadoOperacion<{ userId: string }> > {
	const {
		data: { user: currentUser },
	} = await supabase.auth.getUser();
	if (!currentUser) {
		return { success: false, error: "Usuario no autenticado." };
	}

	const { data: tienePermiso, error: rpcError } = await supabase.rpc(
		"has_permission_in_project",
		{
			p_user_id: currentUser.id,
			p_project_id: projectId,
			p_permission_column: PERMISO_SUBIR_ARCHIVOS,
		},
	);
	if (rpcError || !tienePermiso) {
		return {
			success: false,
			error: "No tienes permiso para pescar/promover artículos en este proyecto.",
		};
	}

	return { success: true, data: { userId: currentUser.id } };
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ DEDUP + INSERCIÓN EN STAGING 🛠️
async function insertNormalizedWorksIntoStaging(
	supabase: SupabaseClient<Database>,
	projectId: string,
	userId: string,
	works: OpenAlexWorkNormalized[],
	sourceQueryLabel: string,
): Promise<{ insertedCount: number; skippedDuplicates: number }> {
	if (works.length === 0) return { insertedCount: 0, skippedDuplicates: 0 };

	const { data: existingStaging, error: stagingError } = await supabase
		.from("staging_articles")
		.select("openalex_id, doi, title, publication_year")
		.eq("project_id", projectId);
	if (stagingError) {
		throw new Error(
			`No se pudo leer el staging existente: ${stagingError.message}`,
		);
	}

	const { data: existingArticles, error: articlesError } = await supabase
		.from("articles")
		.select("openalex_id, doi, title, publication_year")
		.eq("project_id", projectId);
	if (articlesError) {
		throw new Error(
			`No se pudo leer los artículos existentes: ${articlesError.message}`,
		);
	}

	const existingCandidates: DedupCandidate[] = [
		...(existingStaging ?? []).map((r) => ({
			openalexId: r.openalex_id,
			doi: r.doi,
			title: r.title,
			publicationYear: r.publication_year,
		})),
		...(existingArticles ?? []).map((r) => ({
			openalexId: r.openalex_id,
			doi: r.doi,
			title: r.title,
			publicationYear: r.publication_year,
		})),
	];

	const rowsToInsert: Database["public"]["Tables"]["staging_articles"]["Insert"][] =
		[];
	let skipped = 0;

	for (const work of works) {
		if (!work.openalexId) {
			skipped++;
			continue;
		}
		const candidate: DedupCandidate = {
			openalexId: work.openalexId,
			doi: work.doi,
			title: work.title,
			publicationYear: work.publicationYear,
		};
		if (isDuplicate(candidate, existingCandidates)) {
			skipped++;
			continue;
		}
		// Se agrega a los candidatos ya "vistos" para no duplicar dentro del
		// mismo batch (ej. la búsqueda trae el mismo work dos veces).
		existingCandidates.push(candidate);
		rowsToInsert.push({
			project_id: projectId,
			openalex_id: work.openalexId,
			doi: work.doi,
			title: work.title,
			authors: work.authors.length > 0 ? work.authors : null,
			journal: work.journal,
			publication_year: work.publicationYear,
			abstract: work.abstract,
			cited_by_count: work.citedByCount,
			is_oa: work.isOa,
			oa_url: work.oaUrl,
			concepts: work.concepts as unknown as Json,
			source_query: sourceQueryLabel,
			status: "pending",
			created_by: userId,
		});
	}

	if (rowsToInsert.length === 0) {
		return { insertedCount: 0, skippedDuplicates: skipped };
	}

	const { error: insertError, count } = await supabase
		.from("staging_articles")
		.insert(rowsToInsert, { count: "exact" });
	if (insertError) {
		throw new Error(`No se pudo guardar en staging: ${insertError.message}`);
	}

	return { insertedCount: count ?? rowsToInsert.length, skippedDuplicates: skipped };
}
//#endregion ![helpers]

//#region [main] - 🔧 BÚSQUEDA 🔧
export async function searchOpenAlex(
	projectId: string,
	filters: OpenAlexSearchFilters,
): Promise<ResultadoOperacion<HarvestResult>> {
	const supabase = await createSupabaseServerClient();
	const auth = await verificarPermisoYUsuario(supabase, projectId);
	if (!auth.success) return auth;

	try {
		const works = await searchOpenAlexWorks(filters);
		const sourceQueryLabel = `search:${JSON.stringify(filters)}`.slice(0, 500);
		const { insertedCount, skippedDuplicates } =
			await insertNormalizedWorksIntoStaging(
				supabase,
				projectId,
				auth.data.userId,
				works,
				sourceQueryLabel,
			);
		return {
			success: true,
			data: { fetchedCount: works.length, insertedCount, skippedDuplicates },
		};
	} catch (error) {
		console.error("[searchOpenAlex] Error", { projectId, filters, error });
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido buscando en OpenAlex.",
		};
	}
}
//#endregion ![main]

//#region [main] - 🔧 BÚSQUEDA POR SEMILLA 🔧
export async function harvestBySeed(
	projectId: string,
	seedDoi: string,
	direction: SeedDirection,
): Promise<ResultadoOperacion<HarvestResult>> {
	const supabase = await createSupabaseServerClient();
	const auth = await verificarPermisoYUsuario(supabase, projectId);
	if (!auth.success) return auth;

	try {
		const works = await harvestBySeedDoi(seedDoi, direction, OPENALEX_HARD_MAX_RESULTS);
		const sourceQueryLabel = `seed:${direction}:${seedDoi}`.slice(0, 500);
		const { insertedCount, skippedDuplicates } =
			await insertNormalizedWorksIntoStaging(
				supabase,
				projectId,
				auth.data.userId,
				works,
				sourceQueryLabel,
			);
		return {
			success: true,
			data: { fetchedCount: works.length, insertedCount, skippedDuplicates },
		};
	} catch (error) {
		console.error("[harvestBySeed] Error", { projectId, seedDoi, direction, error });
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido pescando por semilla.",
		};
	}
}
//#endregion ![main]

//#region [main] - 🔧 LISTAR STAGING 🔧
export async function listStagingArticles(
	projectId: string,
	status?: "pending" | "promoted" | "discarded",
): Promise<ResultadoOperacion<StagingArticleRow[]>> {
	const supabase = await createSupabaseServerClient();
	const auth = await verificarPermisoYUsuario(supabase, projectId);
	if (!auth.success) return auth;

	let query = supabase
		.from("staging_articles")
		.select("*")
		.eq("project_id", projectId)
		.order("created_at", { ascending: false });
	if (status) query = query.eq("status", status);

	const { data, error } = await query;
	if (error) {
		console.error("[listStagingArticles] Error", { projectId, status, error });
		return { success: false, error: `No se pudo cargar el staging: ${error.message}` };
	}

	return { success: true, data: data ?? [] };
}
//#endregion ![main]

//#region [main] - 🔧 PROMOCIÓN 🔧
export async function promoteStagingArticles(
	projectId: string,
	stagingIds: string[],
): Promise<ResultadoOperacion<{ promotedCount: number }>> {
	const supabase = await createSupabaseServerClient();
	const auth = await verificarPermisoYUsuario(supabase, projectId);
	if (!auth.success) return auth;

	if (stagingIds.length === 0) {
		return { success: true, data: { promotedCount: 0 } };
	}

	try {
		const { data: pendingRows, error: fetchError } = await supabase
			.from("staging_articles")
			.select("*")
			.eq("project_id", projectId)
			.eq("status", "pending")
			.in("id", stagingIds);
		if (fetchError) {
			throw new Error(`No se pudo leer el staging a promover: ${fetchError.message}`);
		}
		if (!pendingRows || pendingRows.length === 0) {
			return { success: true, data: { promotedCount: 0 } };
		}

		const { data: lastCorrelativoData, error: correlativoError } = await supabase
			.from("articles")
			.select("correlativo")
			.eq("project_id", projectId)
			.order("correlativo", { ascending: false })
			.limit(1)
			.maybeSingle();
		if (correlativoError) {
			throw new Error(`Error al obtener el correlativo: ${correlativoError.message}`);
		}
		const nextCorrelativo = (lastCorrelativoData?.correlativo || 0) + 1;

		const articlesToInsert: Database["public"]["Tables"]["articles"]["Insert"][] =
			pendingRows.map((row, index) => ({
				project_id: projectId,
				correlativo: nextCorrelativo + index,
				title: row.title,
				authors: row.authors,
				journal: row.journal,
				publication_year: row.publication_year,
				abstract: row.abstract,
				doi: row.doi,
				openalex_id: row.openalex_id,
				is_oa: row.is_oa,
				cited_by_count: row.cited_by_count,
				concepts: row.concepts,
				metadata: {},
			}));

		const { error: insertError } = await supabase
			.from("articles")
			.insert(articlesToInsert);
		if (insertError) {
			throw new Error(`No se pudo promover a articles: ${insertError.message}`);
		}

		// Re-consultar por openalex_id para mapear cada staging row a su
		// article_id recién creado (más robusto que asumir orden de retorno).
		const promotedOpenAlexIds = pendingRows.map((row) => row.openalex_id);
		const { data: newArticles, error: refetchError } = await supabase
			.from("articles")
			.select("id, openalex_id")
			.eq("project_id", projectId)
			.in("openalex_id", promotedOpenAlexIds);
		if (refetchError) {
			throw new Error(
				`Artículos promovidos pero no se pudo confirmar el mapeo: ${refetchError.message}`,
			);
		}

		const articleIdByOpenAlexId = new Map(
			(newArticles ?? []).map((a) => [a.openalex_id, a.id]),
		);

		const stagingUpdates = pendingRows
			.map((row) => ({
				id: row.id,
				project_id: row.project_id,
				openalex_id: row.openalex_id,
				status: "promoted" as const,
				promoted_article_id: articleIdByOpenAlexId.get(row.openalex_id) ?? null,
			}))
			.filter((u) => u.promoted_article_id !== null);

		if (stagingUpdates.length > 0) {
			const { error: updateError } = await supabase
				.from("staging_articles")
				.upsert(stagingUpdates, { onConflict: "id" });
			if (updateError) {
				throw new Error(
					`Artículos promovidos pero no se pudo actualizar staging: ${updateError.message}`,
				);
			}
		}

		// 🔧 Fase 3 (auditoría append-only): hash del titulo/abstract tal como
		// entraron a `articles`, para poder detectar despues si fueron
		// modificados. No bloquea la promoción si falla.
		const pendingByOpenAlexId = new Map(
			pendingRows.map((row) => [row.openalex_id, row]),
		);
		const ingestionRows = await Promise.all(
			(newArticles ?? [])
				.filter((a): a is typeof a & { openalex_id: string } => !!a.openalex_id)
				.map((a) => ({ articleId: a.id, staging: pendingByOpenAlexId.get(a.openalex_id) }))
				.filter(
					(x): x is { articleId: string; staging: (typeof pendingRows)[number] } =>
						!!x.staging,
				)
				.map(async ({ articleId, staging }) => ({
					article_id: articleId,
					source: "openalex" as const,
					abstract_sha256:
						staging.abstract ? await sha256Hex(staging.abstract) : null,
					title_sha256: staging.title ? await sha256Hex(staging.title) : null,
					ingested_by: auth.data.userId,
				})),
		);
		if (ingestionRows.length > 0) {
			const { error: logError } = await supabase
				.from("article_ingestion_log")
				.insert(ingestionRows);
			if (logError) {
				console.error(
					"[promoteStagingArticles] Error registrando log de ingesta:",
					logError,
				);
			}
		}

		return { success: true, data: { promotedCount: stagingUpdates.length } };
	} catch (error) {
		console.error("[promoteStagingArticles] Error", { projectId, stagingIds, error });
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido promoviendo artículos.",
		};
	}
}
//#endregion ![main]

//#region [main] - 🔧 DESCARTE 🔧
export async function discardStagingArticles(
	projectId: string,
	stagingIds: string[],
): Promise<ResultadoOperacion<{ discardedCount: number }>> {
	const supabase = await createSupabaseServerClient();
	const auth = await verificarPermisoYUsuario(supabase, projectId);
	if (!auth.success) return auth;

	if (stagingIds.length === 0) {
		return { success: true, data: { discardedCount: 0 } };
	}

	const { data, error } = await supabase
		.from("staging_articles")
		.update({ status: "discarded", updated_at: new Date().toISOString() })
		.eq("project_id", projectId)
		.eq("status", "pending")
		.in("id", stagingIds)
		.select("id");

	if (error) {
		console.error("[discardStagingArticles] Error", { projectId, stagingIds, error });
		return { success: false, error: `No se pudo descartar: ${error.message}` };
	}

	return { success: true, data: { discardedCount: data?.length ?? 0 } };
}
//#endregion ![main]
