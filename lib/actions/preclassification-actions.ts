// lib/actions/preclassification-actions.ts
"use server";

import {
	createSupabaseServerClient,
	createSupabaseServiceRoleClient,
	createSupabaseUserClient,
} from "@/lib/server";
import { callDeepSeekAPI } from "@/lib/deepseek/api";
import type { Database } from "@/lib/database.types";
import type { ResultadoOperacion } from "./types";
import type {
	BatchWithCounts,
	ArticleForReview,
	BatchDetails,
	SubmitHumanReviewPayload,
	TranslatedArticlePayload,
	ClassificationReview,
	NotesInfo,
} from "@/lib/types/preclassification-types";

export type { ArticleForReview, BatchDetails };

// Tipo auxiliar para filas de revisiones que pueden incluir option_id (campo opcional no tipado en supabase types)
type ReviewRowWithOptionalFields =
	Database["public"]["Tables"]["article_dimension_reviews"]["Row"] & {
		option_id?: string | null;
	};

// Insert auxiliar que permite option_id opcional (no presente en tipos generados)
type ReviewInsertWithOptionalFields =
	Database["public"]["Tables"]["article_dimension_reviews"]["Insert"] & {
		option_id?: string | null;
	};

// ========================================================================
//	ACCIONES DE LECTURA (GET)
// ========================================================================

export async function getProjectBatchesForUser(
	projectId: string,
	userId: string,
): Promise<ResultadoOperacion<BatchWithCounts[]>> {
	if (!projectId || !userId)
		return { success: false, error: "Se requiere ID de usuario y proyecto." };
	try {
		const supabase = await createSupabaseServerClient();
		// ⚡ CAMBIO: Usar la nueva RPC v4 que cuenta ARTÍCULOS (no dimensiones) agrupados por peor/más avanzado status
		// Usa última review de cada dimensión para determinar status del artículo
		const { data, error } = await supabase.rpc("get_all_project_batches_v4", {
			p_project_id: projectId,
		});

		if (error) {
			// Fallback a la RPC v3 si la v4 no existe aún
			console.warn(
				"⚠️ RPC get_all_project_batches_v4 falló, intentando fallback a get_all_project_batches_v3",
			);
			const { data: fallbackData, error: fallbackError } = await supabase.rpc(
				"get_all_project_batches_v3",
				{ p_project_id: projectId },
			);
			if (fallbackError) {
				// Fallback a v2
				console.warn(
					"⚠️ RPC get_all_project_batches_v3 falló, intentando fallback a get_all_project_batches_v2",
				);
				const { data: fallbackData2, error: fallbackError2 } =
					await supabase.rpc("get_all_project_batches_v2", {
						p_project_id: projectId,
					});
				if (fallbackError2) {
					// Fallback a v1
					console.warn(
						"⚠️ RPC get_all_project_batches_v2 falló, intentando fallback a get_all_project_batches",
					);
					const { data: fallbackData3, error: fallbackError3 } =
						await supabase.rpc("get_all_project_batches", {
							p_project_id: projectId,
						});
					if (fallbackError3) {
						// Último fallback a la RPC antigua
						console.warn(
							"⚠️ RPC get_all_project_batches falló, intentando fallback a get_user_batches_with_detailed_counts",
						);
						const { data: fallbackData4, error: fallbackError4 } =
							await // eslint-disable-next-line @typescript-eslint/no-explicit-any
							(supabase.rpc as any)("get_user_batches_with_detailed_counts", {
								p_user_id: userId,
								p_project_id: projectId,
							});
						if (fallbackError4)
							throw new Error(
								`Error al llamar a RPC (fallback): ${fallbackError4.message}`,
							);
						return processBatchesResult(fallbackData4 as BatchWithCounts[]);
					}
					return processBatchesResult(fallbackData3 as BatchWithCounts[]);
				}
				return processBatchesResult(fallbackData2 as BatchWithCounts[]);
			}
			return processBatchesResult(fallbackData as BatchWithCounts[]);
		}

		return processBatchesResult(data as BatchWithCounts[]);
	} catch (error) {
		console.error("❌ Error en getProjectBatchesForUser:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

async function processBatchesResult(
	batches: BatchWithCounts[],
): Promise<ResultadoOperacion<BatchWithCounts[]>> {
	try {
		// 🔒 Para cada batch, verificar si TODAS sus dimensiones tienen is_final = true
		const batchesWithClosureStatus = await Promise.all(
			batches.map(async (batch) => {
				const closureStatus = await isBatchClosed(batch.id);
				return {
					...batch,
					is_closed: closureStatus.isClosed,
					closure_stats: {
						total_dimensions: closureStatus.totalDimensions,
						finalized_dimensions: closureStatus.finalizedDimensions,
						percent_finalized: closureStatus.percentFinalized,
					},
				};
			}),
		);

		return { success: true, data: batchesWithClosureStatus };
	} catch (error) {
		throw error;
	}
}

/**
 * Establece en bulk el flag `prevalidated` para TODAS las últimas revisiones AI
 * de un lote dado. Solo se actualiza la última revisión (por mayor `iteration`)
 * de cada par (article_batch_item_id, dimension_id).
 */
export async function bulkSetPrevalidatedForBatch(
	batchId: string,
	prevalidated: boolean,
): Promise<ResultadoOperacion<{ updated: number }>> {
	try {
		if (!batchId) return { success: false, error: "Se requiere 'batchId'." };
		const supabase = await createSupabaseServerClient();
		const admin = await createSupabaseServiceRoleClient();

		// 1) Obtener items del lote
		const { data: items, error: itemsErr } = await supabase
			.from("article_batch_items")
			.select("id")
			.eq("batch_id", batchId);
		if (itemsErr)
			return {
				success: false,
				error: `Error obteniendo items del lote: ${itemsErr.message}`,
			};
		const itemIds = (items || []).map((i) => i.id);
		if (itemIds.length === 0) return { success: true, data: { updated: 0 } };

		// 2) Obtener todas las revisiones AI de esos items
		type ReviewRow =
			Database["public"]["Tables"]["article_dimension_reviews"]["Row"];
		const { data: reviews, error: revErr } = await supabase
			.from("article_dimension_reviews")
			.select(
				"id, article_batch_item_id, dimension_id, iteration, reviewer_type, prevalidated",
			)
			.in("article_batch_item_id", itemIds)
			.eq("reviewer_type", "ai");
		if (revErr)
			return {
				success: false,
				error: `Error obteniendo revisiones: ${revErr.message}`,
			};

		// 3) Tomar la última por (item, dim)
		const latestByPair = new Map<string, ReviewRow>();
		for (const r of (reviews || []) as ReviewRow[]) {
			const key = `${r.article_batch_item_id}__${r.dimension_id}`;
			const current = latestByPair.get(key);
			if (
				!current ||
				(r.iteration ?? -Infinity) > (current.iteration ?? -Infinity)
			) {
				latestByPair.set(key, r);
			}
		}

		// 4) Preparar updates con status según iteración y acción
		const updatesIter1Approve: string[] = []; // validated
		const updatesIter3Approve: string[] = []; // reconciled
		const updatesIter3Reject: string[] = []; // disputed
		const updatesOther: string[] = []; // solo prevalidated

		for (const [, row] of latestByPair) {
			if ((row.prevalidated ?? false) !== prevalidated) {
				if (prevalidated) {
					// ✅ APROBAR: determinar status según iteración
					if (row.iteration === 1) {
						updatesIter1Approve.push(row.id);
					} else if (row.iteration && row.iteration >= 3) {
						updatesIter3Approve.push(row.id);
					} else {
						updatesOther.push(row.id);
					}
				} else {
					// ❌ RECHAZAR: solo iter 3+ cambia a disputed
					if (row.iteration && row.iteration >= 3) {
						updatesIter3Reject.push(row.id);
					} else {
						updatesOther.push(row.id);
					}
				}
			}
		}

		const totalToUpdate =
			updatesIter1Approve.length +
			updatesIter3Approve.length +
			updatesIter3Reject.length +
			updatesOther.length;
		if (totalToUpdate === 0) return { success: true, data: { updated: 0 } };

		// 5) Actualizar en lotes según status
		const chunkSize = 500;
		let totalUpdated = 0;

		// Iter 1 aprobado: validated
		for (let i = 0; i < updatesIter1Approve.length; i += chunkSize) {
			const slice = updatesIter1Approve.slice(i, i + chunkSize);
			const { data: updRows, error: updErr } = await admin
				.from("article_dimension_reviews")
				.update({ prevalidated, status: "validated" })
				.in("id", slice)
				.select("id");
			if (updErr)
				return {
					success: false,
					error: `Error actualizando revisiones iter1: ${updErr.message}`,
				};
			totalUpdated += updRows?.length || 0;
		}

		// Iter 3 aprobado: reconciled
		for (let i = 0; i < updatesIter3Approve.length; i += chunkSize) {
			const slice = updatesIter3Approve.slice(i, i + chunkSize);
			const { data: updRows, error: updErr } = await admin
				.from("article_dimension_reviews")
				.update({ prevalidated, status: "reconciled" })
				.in("id", slice)
				.select("id");
			if (updErr)
				return {
					success: false,
					error: `Error actualizando revisiones iter3: ${updErr.message}`,
				};
			totalUpdated += updRows?.length || 0;
		}

		// Iter 3 rechazado: disputed
		for (let i = 0; i < updatesIter3Reject.length; i += chunkSize) {
			const slice = updatesIter3Reject.slice(i, i + chunkSize);
			const { data: updRows, error: updErr } = await admin
				.from("article_dimension_reviews")
				.update({ prevalidated, status: "disputed" })
				.in("id", slice)
				.select("id");
			if (updErr)
				return {
					success: false,
					error: `Error actualizando revisiones iter3 rejected: ${updErr.message}`,
				};
			totalUpdated += updRows?.length || 0;
		}

		// Otros: solo prevalidated
		for (let i = 0; i < updatesOther.length; i += chunkSize) {
			const slice = updatesOther.slice(i, i + chunkSize);
			const { data: updRows, error: updErr } = await admin
				.from("article_dimension_reviews")
				.update({ prevalidated })
				.in("id", slice)
				.select("id");
			if (updErr)
				return {
					success: false,
					error: `Error actualizando revisiones otras: ${updErr.message}`,
				};
			totalUpdated += updRows?.length || 0;
		}

		return { success: true, data: { updated: totalUpdated } };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		return {
			success: false,
			error: `Error interno en bulkSetPrevalidatedForBatch: ${msg}`,
		};
	}
}

/**
 * Actualiza el STATUS de la ÚLTIMA revisión AI del par (article_batch_item_id, dimension_id).
 *
 * @param newStatus - validated | reconciled | disputed | review_pending | reconciliation_pending
 */
export async function updateDimensionStatus(
	articleBatchItemId: string,
	dimensionId: string,
	newStatus:
		| "validated"
		| "reconciled"
		| "disputed"
		| "review_pending"
		| "reconciliation_pending",
): Promise<ResultadoOperacion<{ updated: number; reviewId?: string }>> {
	try {
		console.log("🔵 [updateDimensionStatus] INICIANDO", {
			articleBatchItemId,
			dimensionId,
			newStatus,
		});

		if (!articleBatchItemId || !dimensionId) {
			console.error("❌ [updateDimensionStatus] Faltan parámetros");
			return {
				success: false,
				error: "Se requieren 'articleBatchItemId' y 'dimensionId'.",
			};
		}
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			console.error("❌ [updateDimensionStatus] Usuario no autenticado");
			return { success: false, error: "Usuario no autenticado." };
		}
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.access_token) {
			console.error("❌ [updateDimensionStatus] No hay token de sesión");
			return {
				success: false,
				error: "No se pudo obtener el token de sesión.",
			};
		}
		const db = createSupabaseUserClient(session.access_token);

		// Buscar la última revisión AI por iteración
		console.log("📊 [updateDimensionStatus] Buscando review AI...");
		const { data: reviewRow, error: findErr } = await supabase
			.from("article_dimension_reviews")
			.select("id, iteration, status")
			.eq("article_batch_item_id", articleBatchItemId)
			.eq("dimension_id", dimensionId)
			.eq("reviewer_type", "ai")
			.order("iteration", { ascending: false, nullsFirst: false })
			.limit(1)
			.single();

		console.log("📊 [updateDimensionStatus] Review encontrada:", {
			found: !!reviewRow,
			reviewId: reviewRow?.id,
			currentStatus: reviewRow?.status,
			iteration: reviewRow?.iteration,
			error: findErr?.message,
		});

		if (findErr || !reviewRow) {
			console.error("❌ [updateDimensionStatus] No se encontró review AI");
			return {
				success: false,
				error: `No se encontró revisión AI para el item ${articleBatchItemId} y dimensión ${dimensionId}.`,
			};
		}

		// Actualizar status directamente
		console.log("📊 [updateDimensionStatus] Actualizando status en BD...", {
			reviewId: reviewRow.id,
			oldStatus: reviewRow.status,
			newStatus,
		});

		const { data: updatedRows, error: updateErr } = await db
			.from("article_dimension_reviews")
			.update({ status: newStatus })
			.eq("id", reviewRow.id)
			.select("id");

		console.log("📊 [updateDimensionStatus] Resultado UPDATE:", {
			success: !updateErr,
			rowsUpdated: updatedRows?.length,
			error: updateErr?.message,
		});

		if (updateErr) {
			console.error("❌ [updateDimensionStatus] Error en UPDATE:", updateErr);
			return {
				success: false,
				error: `Error actualizando status: ${updateErr.message}`,
			};
		}

		console.log("✅ [updateDimensionStatus] Status actualizado exitosamente");
		return {
			success: true,
			data: { updated: updatedRows?.length || 0, reviewId: reviewRow.id },
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		console.error("❌ [updateDimensionStatus] Error catch:", error);
		return {
			success: false,
			error: `Error interno actualizando status: ${msg}`,
		};
	}
}

// 🔄 LEGACY: Mantener compatibilidad temporal con código antiguo
export async function setPrevalidatedForReview(
	articleBatchItemId: string,
	dimensionId: string,
	prevalidated: boolean,
): Promise<ResultadoOperacion<{ updated: number; reviewId?: string }>> {
	// Mapear prevalidated a status según lógica
	const supabase = await createSupabaseServerClient();
	const { data: reviewRow } = await supabase
		.from("article_dimension_reviews")
		.select("iteration")
		.eq("article_batch_item_id", articleBatchItemId)
		.eq("dimension_id", dimensionId)
		.eq("reviewer_type", "ai")
		.order("iteration", { ascending: false, nullsFirst: false })
		.limit(1)
		.single();

	if (!reviewRow) {
		return { success: false, error: "No se encontró review" };
	}

	let newStatus:
		| "validated"
		| "reconciled"
		| "disputed"
		| "review_pending"
		| "reconciliation_pending";
	if (prevalidated) {
		newStatus = reviewRow.iteration === 1 ? "validated" : "reconciled";
	} else {
		newStatus = (reviewRow.iteration ?? 0) >= 3 ? "disputed" : "review_pending";
	}

	return updateDimensionStatus(articleBatchItemId, dimensionId, newStatus);
}

/**
 * Registra una nueva revisión HUMANA para una dimensión de un item del lote,
 * calculando la siguiente iteración y cambiando estados en cascada a 'reconciliation_pending'.
 */
export async function submitHumanReview(
	payload: SubmitHumanReviewPayload,
): Promise<ResultadoOperacion<{ reviewId: string }>> {
	try {
		const {
			article_batch_item_id,
			dimension_id,
			human_value,
			human_confidence,
			human_rationale,
			human_option_id,
		} = payload || ({} as SubmitHumanReviewPayload);

		if (!article_batch_item_id || !dimension_id) {
			return {
				success: false,
				error: "Faltan 'article_batch_item_id' o 'dimension_id'",
			};
		}
		if (typeof human_value !== "string" || human_value.trim() === "") {
			return {
				success: false,
				error: "'human_value' debe ser un string no vacío",
			};
		}
		if (![1, 2, 3].includes(Number(human_confidence))) {
			return { success: false, error: "'human_confidence' debe ser 1, 2 o 3" };
		}

		// Usar cliente autenticado por sesión (RLS) para todas las operaciones en este flujo
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return { success: false, error: "Usuario no autenticado." };
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.access_token)
			return {
				success: false,
				error: "No se pudo obtener el token de sesión.",
			};
		const db = createSupabaseUserClient(session.access_token);

		// 1) Obtener datos del item para derivar article_id y batch_id
		const { data: itemRow, error: itemErr } = await db
			.from("article_batch_items")
			.select("id, article_id, batch_id, status")
			.eq("id", article_batch_item_id)
			.single();
		if (itemErr || !itemRow) {
			return {
				success: false,
				error: `No se encontró el item del lote: ${itemErr?.message || "no encontrado"}`,
			};
		}

		// 2) Calcular siguiente iteración
		const { data: existing, error: iterErr } = await db
			.from("article_dimension_reviews")
			.select("iteration")
			.eq("article_batch_item_id", article_batch_item_id)
			.eq("dimension_id", dimension_id);
		if (iterErr) {
			return {
				success: false,
				error: `Error consultando iteraciones: ${iterErr.message}`,
			};
		}
		const nextIteration =
			(existing || []).reduce((max, r) => Math.max(max, r.iteration ?? 0), 0) +
			1;

		// 3) Insertar revisión humana
		// Determinar status según iteración:
		// - Iter 2: 'reconciliation_pending' (desacuerdo esperando reconciliación)
		// - Iter 3+: 'disputed' (arbitraje - rechazo de reconciliación)
		const statusForReview =
			nextIteration >= 3 ? "disputed" : "reconciliation_pending";

		const insertRow: ReviewInsertWithOptionalFields = {
			article_batch_item_id,
			article_id: itemRow.article_id,
			dimension_id,
			classification_value: human_value.trim(),
			option_id: human_option_id ?? null,
			confidence_score: Number(human_confidence),
			rationale: human_rationale ?? null,
			reviewer_type: "human",
			reviewer_id: user.id,
			iteration: nextIteration,
			prevalidated: false,
			is_final: false,
			status: statusForReview,
		};

		const { data: inserted, error: insErr } = await db
			.from("article_dimension_reviews")
			.insert(insertRow)
			.select("id")
			.single();
		if (insErr || !inserted) {
			return {
				success: false,
				error: `Error guardando revisión humana: ${insErr?.message}`,
			};
		}

		// 4) Cambiar estados en cascada a 'reconciliation_pending'
		const { error: updItemErr } = await db
			.from("article_batch_items")
			.update({ status: "reconciliation_pending" })
			.eq("id", article_batch_item_id);
		if (updItemErr) {
			// Registrar pero no abortar, ya hay revisión guardada
			console.warn(
				"[submitHumanReview] Revisión guardada, pero fallo actualizando estado del item:",
				updItemErr.message,
			);
		}

		const { error: updBatchErr } = await db
			.from("article_batches")
			.update({ status: "reconciliation_pending" })
			.eq("id", itemRow.batch_id);
		if (updBatchErr) {
			console.warn(
				"[submitHumanReview] Revisión guardada, pero fallo actualizando estado del lote:",
				updBatchErr.message,
			);
		}

		return { success: true, data: { reviewId: inserted.id } };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		return {
			success: false,
			error: `Error interno en submitHumanReview: ${msg}`,
		};
	}
}

export async function getArticlesForTranslation(
	batchId: string,
): Promise<
	ResultadoOperacion<
		{ id: string; title: string | null; abstract: string | null }[]
	>
> {
	if (!batchId) return { success: false, error: "Se requiere ID de lote." };
	try {
		const supabase = await createSupabaseServerClient();
		const { data: batchItems, error: itemsError } = await supabase
			.from("article_batch_items")
			.select("articles(id, title, abstract)")
			.eq("batch_id", batchId);

		if (itemsError)
			throw new Error(`Error obteniendo ítems del lote: ${itemsError.message}`);
		if (!batchItems) return { success: true, data: [] };

		const articles = batchItems.map((item) => item.articles).filter(Boolean);
		return {
			success: true,
			data: articles as {
				id: string;
				title: string | null;
				abstract: string | null;
			}[],
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		return { success: false, error: `Error interno: ${msg}` };
	}
}

/**
 * Obtiene todos los datos necesarios para renderizar la vista de detalle de un lote.
 * **VERSIÓN REFACTORIZADA PARA SER CONSCIENTE DE LAS FASES**
 */
export async function getBatchDetailsForReview(
	batchId: string,
): Promise<ResultadoOperacion<BatchDetails>> {
	if (!batchId) return { success: false, error: "Se requiere ID de lote." };

	try {
		const supabase = await createSupabaseServerClient();

		// --- LÓGICA CORREGIDA PARA FASES ---
		const { data: batch, error: batchError } = await supabase
			.from("article_batches")
			.select("phase_id, batch_number, name, status")
			.eq("id", batchId)
			.single();

		if (batchError || !batch || !batch.phase_id) {
			throw new Error(
				`Lote no encontrado o no está asociado a una fase: ${batchError?.message || "No encontrado"}`,
			);
		}

		const { data: dimensions, error: dimensionsError } = await supabase
			.from("preclass_dimensions")
			.select("*, preclass_dimension_options(*)")
			.eq("phase_id", batch.phase_id)
			.eq("status", "active") // Solo dimensiones activas
			.order("ordering");

		if (dimensionsError)
			throw new Error(
				`Error obteniendo dimensiones de la fase: ${dimensionsError.message}`,
			);

		const { data: batchItems, error: itemsError } = await supabase
			.from("article_batch_items")
			.select(
				`
                id, status, ai_keywords, ai_process_opinion,
                articles (id, correlativo, publication_year, journal, title, abstract, article_translations(title, abstract, summary))
            `,
			)
			.eq("batch_id", batchId);

		if (itemsError)
			throw new Error(`Error obteniendo ítems del lote: ${itemsError.message}`);
		if (!batchItems)
			return {
				success: false,
				error: "No se encontraron artículos en el lote.",
			};

		const itemIds = batchItems.map((item) => item.id);

		// ================= BULK NOTES INFO (RPC) =================
		type BulkNotesRow = {
			item_id: string;
			article_id: string | null;
			has_notes: boolean | null;
			note_ids: string[] | null;
			note_count: number | null;
		};

		let notesByItem: Record<string, NotesInfo> = {};
		try {
			const { data: bulkNotes, error: bulkErr } = await (supabase as any).rpc(
				"bulk_get_notes_info_for_batch",
				{ p_batch_id: batchId },
			);

			if (!bulkErr && Array.isArray(bulkNotes)) {
				notesByItem = (bulkNotes as BulkNotesRow[]).reduce(
					(acc, r) => {
						acc[r.item_id] = {
							article_id: r.article_id ?? null,
							has_notes: Boolean(r.has_notes ?? false),
							note_count: r.note_count ?? 0,
							note_ids: r.note_ids ?? [],
						};
						return acc;
					},
					{} as Record<string, NotesInfo>,
				);
			} else if (bulkErr) {
				console.warn(
					"[getBatchDetailsForReview] bulk_get_notes_info_for_batch RPC error:",
					bulkErr,
				);
			}
		} catch (e) {
			console.warn(
				"[getBatchDetailsForReview] Excepción llamando RPC bulk_get_notes_info_for_batch:",
				e,
			);
		}
		// 🔁 Fallback: si la RPC no existe o no devolvió datos, calculamos presencia de notas por artículo
		if (Object.keys(notesByItem).length === 0) {
			try {
				const articleIds = (batchItems || [])
					.map((item) => item.articles?.id)
					.filter((v): v is string => Boolean(v));

				if (articleIds.length > 0) {
					const { data: noteRows, error: notesError } = await supabase
						.from("article_notes")
						.select("id, article_id")
						.in("article_id", articleIds);

					if (!notesError && Array.isArray(noteRows)) {
						const notesByArticleId = (
							noteRows as { id: string; article_id: string }[]
						).reduce(
							(acc, r) => {
								(acc[r.article_id] ||= []).push(r.id);
								return acc;
							},
							{} as Record<string, string[]>,
						);

						notesByItem = (batchItems || []).reduce(
							(acc, item) => {
								const aId = item.articles?.id || null;
								const ids = aId ? notesByArticleId[aId] || [] : [];
								acc[item.id] = {
									article_id: aId,
									has_notes: ids.length > 0,
									note_count: ids.length,
									note_ids: ids,
								};
								return acc;
							},
							{} as Record<string, NotesInfo>,
						);
						console.log(
							"[getBatchDetailsForReview] Fallback de notas aplicado (sin RPC).",
						);
					} else {
						console.warn(
							"[getBatchDetailsForReview] Fallback: error/resultado inválido consultando article_notes:",
							notesError,
						);
						// Generar estructura vacía para cada item para evitar undefineds aguas abajo
						notesByItem = (batchItems || []).reduce(
							(acc, item) => {
								acc[item.id] = {
									article_id: item.articles?.id || null,
									has_notes: false,
									note_count: 0,
									note_ids: [],
								};
								return acc;
							},
							{} as Record<string, NotesInfo>,
						);
					}
				} else {
					// No hay artículos; inicializar vacío por cada item
					notesByItem = (batchItems || []).reduce(
						(acc, item) => {
							acc[item.id] = {
								article_id: item.articles?.id || null,
								has_notes: false,
								note_count: 0,
								note_ids: [],
							};
							return acc;
						},
						{} as Record<string, NotesInfo>,
					);
				}
			} catch (fallbackErr) {
				console.warn(
					"[getBatchDetailsForReview] Excepción en fallback de notas:",
					fallbackErr,
				);
				// Como último recurso, inicializar con valores vacíos
				notesByItem = (batchItems || []).reduce(
					(acc, item) => {
						acc[item.id] = {
							article_id: item.articles?.id || null,
							has_notes: false,
							note_count: 0,
							note_ids: [],
						};
						return acc;
					},
					{} as Record<string, NotesInfo>,
				);
			}
		}
		const { data: allReviews = [], error: reviewsError } = await supabase
			.from("article_dimension_reviews")
			.select("*")
			.in("article_batch_item_id", itemIds);

		if (reviewsError)
			throw new Error(`Error obteniendo revisiones: ${reviewsError.message}`);

		const rows: ArticleForReview[] = batchItems.map((item) => {
			const safeReviews = (allReviews || []) as ReviewRowWithOptionalFields[];
			const articleStatus =
				(
					item as {
						status?:
							| Database["public"]["Enums"]["batch_preclass_status"]
							| null;
					}
				).status || "pending";
			const validStatuses = [
				"pending",
				"translated",
				"review_pending",
				"reconciliation_pending",
				"validated",
				"reconciled",
				"disputed",
			] as const;
			type ItemStatus = (typeof validStatuses)[number];
			const safeStatus: ItemStatus =
				(validStatuses as readonly string[]).includes(articleStatus as string) ?
					(articleStatus as ItemStatus)
				:	"pending";

			return {
				item_id: item.id,
				article_id: item.articles?.id || "", // 🎯 OPTIMIZACIÓN: ID directo del artículo
				article_status: safeStatus,
				article_data: {
					correlativo:
						(item.articles as unknown as { correlativo?: number | null })
							?.correlativo ?? null,
					publication_year: item.articles?.publication_year || null,
					journal: item.articles?.journal || null,
					original_title: item.articles?.title || null,
					original_abstract: item.articles?.abstract || null,
					translated_title:
						item.articles?.article_translations?.[0]?.title || null,
					translated_abstract:
						item.articles?.article_translations?.[0]?.abstract || null,
					translation_summary:
						item.articles?.article_translations?.[0]?.summary || null,
				},
				ai_summary: {
					keywords: item.ai_keywords,
					process_opinion: item.ai_process_opinion,
				},
				classifications: dimensions.reduce(
					(acc, dim) => {
						const reviewsForDim = safeReviews.filter(
							(r) =>
								r.article_batch_item_id === item.id &&
								r.dimension_id === dim.id,
						);
						if (reviewsForDim.length > 0) {
							acc[dim.id] = reviewsForDim.map((r) => ({
								reviewer_type: r.reviewer_type as "ai" | "human",
								reviewer_id: r.reviewer_id,
								iteration: r.iteration ?? 0,
								value: r.classification_value ?? "",
								confidence: r.confidence_score ?? 0,
								rationale: r.rationale,
								option_id: r.option_id ?? undefined,
								status: r.status ?? undefined, // ✅ CRÍTICO: Incluir status para que la UI pueda leerlo
								prevalidated: r.prevalidated ?? undefined, // Obsoleto pero mantenido por compatibilidad
								is_final: r.is_final ?? undefined,
							}));
						}
						return acc;
					},
					{} as Record<string, ClassificationReview[]>,
				),
				// Adjuntar notas si están disponibles
				notes_info: notesByItem[item.id],
			};
		});

		// Tipos estrictos para filas de dimensiones y opciones
		type DimRow = Database["public"]["Tables"]["preclass_dimensions"]["Row"] & {
			preclass_dimension_options?:
				| Database["public"]["Tables"]["preclass_dimension_options"]["Row"][]
				| null;
		};

		return {
			success: true,
			data: {
				columns: (dimensions as DimRow[]).map((d) => {
					const opts = d.preclass_dimension_options ?? [];
					const optionEmoticons = opts.reduce(
						(acc: Record<string, string | null>, o) => {
							if (typeof o.value !== "undefined" && o.value !== null) {
								acc[String(o.value)] = o.emoticon ?? null;
							}
							return acc;
						},
						{},
					);
					return {
						id: d.id,
						name: d.name,
						type: d.type,
						options: opts.map((o) => o.value),
						icon: d.icon ?? null,
						optionEmoticons,
					};
				}),
				// 🆕 Agregar dimensions para detección de artículos sin IA
				dimensions: (dimensions as DimRow[]).map((d) => ({
					id: d.id,
					name: d.name,
				})),
				rows,
				batch_number: batch.batch_number || 0,
				id: batchId,
				name: batch.name || null,
				status:
					batch.status as Database["public"]["Enums"]["batch_preclass_status"],
			},
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		return {
			success: false,
			error: `Error interno obteniendo detalles del lote: ${msg}`,
		};
	}
}

// ========================================================================
//	ACCIONES DE MODIFICACIÓN (WRITE)
// ========================================================================

export async function saveBatchTranslations(
	batchId: string,
	articles: TranslatedArticlePayload[],
): Promise<ResultadoOperacion<{ upsertedCount: number }>> {
	if (!batchId || !articles || articles.length === 0) {
		return {
			success: false,
			error: "Se requiere ID de lote y al menos un artículo.",
		};
	}
	try {
		const admin = await createSupabaseServiceRoleClient();

		// 🔍 LOG 1: Ver status ANTES de hacer nada
		const { data: batchBefore, error: _queryError } = await admin
			.from("article_batches")
			.select("id, batch_number, status, translation_complete")
			.eq("id", batchId)
			.single();

		console.log(
			`📊 [saveBatchTranslations] PASO 1 - Status ANTES de guardar traducciones:`,
			{
				batchId,
				batch_number: batchBefore?.batch_number,
				status_actual: batchBefore?.status,
				translation_complete: batchBefore?.translation_complete,
			},
		);

		const translationsToInsert = articles.map((article) => ({
			article_id: article.articleId,
			title: article.title,
			abstract: article.abstract,
			summary: article.summary,
			language: "es",
			translator_system: article.translator_system,
			translated_by: article.translated_by,
		}));

		// 🚨 FILOSOFÍA: Usar INSERT (no UPSERT) para que falle RUIDOSAMENTE si hay duplicados
		// Constraint único: (article_id, language)
		// Si alguien intenta re-traducir, queremos ERROR VISIBLE, no sobrescritura silenciosa
		const { count, error: insertError } = await admin
			.from("article_translations")
			.insert(translationsToInsert);

		if (insertError) throw insertError;

		console.log(
			`📊 [saveBatchTranslations] PASO 2 - Traducciones guardadas (${count} registros)`,
		);

		// 🔍 LOG 2: Actualizar estado del lote a 'translated'
		console.log(
			`📊 [saveBatchTranslations] PASO 3 - Intentando actualizar batch a 'translated'...`,
		);

		const { error: batchUpdateError } = await admin
			.from("article_batches")
			.update({
				status: "translated",
				translation_complete: true,
			})
			.eq("id", batchId);

		if (batchUpdateError) {
			console.error(
				`❌ CRÍTICO: No se pudo actualizar el estado del lote ${batchId}: ${batchUpdateError.message}`,
			);
			throw new Error(
				`No se pudo actualizar el estado del lote: ${batchUpdateError.message}`,
			);
		}

		console.log(
			`✅ [saveBatchTranslations] PASO 4 - Batch actualizado a 'translated' SIN ERRORES`,
		);

		// 🔍 LOG 3: Verificar que realmente cambió
		const { data: batchAfter } = await admin
			.from("article_batches")
			.select("id, batch_number, status, translation_complete")
			.eq("id", batchId)
			.single();

		console.log(
			`📊 [saveBatchTranslations] PASO 5 - Status DESPUÉS de actualizar batch:`,
			{
				batchId,
				batch_number: batchAfter?.batch_number,
				status_nuevo: batchAfter?.status,
				translation_complete: batchAfter?.translation_complete,
			},
		);

		// Sincronizar estado de todos los ítems del lote a 'translated'
		console.log(
			`📊 [saveBatchTranslations] PASO 6 - Actualizando items a 'translated'...`,
		);

		const { error: itemsUpdateError } = await admin
			.from("article_batch_items")
			.update({ status: "translated" })
			.eq("batch_id", batchId);

		if (itemsUpdateError) {
			console.error(
				`❌ CRÍTICO: No se pudo actualizar el estado de los ítems del lote ${batchId}: ${itemsUpdateError.message}`,
			);
			throw new Error(
				`No se pudo actualizar el estado de los ítems: ${itemsUpdateError.message}`,
			);
		}

		console.log(
			`✅ [saveBatchTranslations] PASO 7 - Items actualizados a 'translated' SIN ERRORES`,
		);

		// 🔍 LOG 4: Verificación FINAL del status del batch
		const { data: batchFinal } = await admin
			.from("article_batches")
			.select("id, batch_number, status, translation_complete")
			.eq("id", batchId)
			.single();

		console.log(
			`📊 [saveBatchTranslations] PASO 8 - Status FINAL antes de retornar:`,
			{
				batchId,
				batch_number: batchFinal?.batch_number,
				status_final: batchFinal?.status,
				translation_complete: batchFinal?.translation_complete,
			},
		);

		// 🔔 DISPARAR EVENTO REALTIME: Hacer un "touch" del batch con cliente normal
		// Service Role bypasea RLS, entonces eventos Realtime no se propagan al frontend
		// Este update dummy con cliente normal dispara el evento para que el frontend lo capte
		console.log(
			`🔔 [saveBatchTranslations] PASO 9 - Disparando evento Realtime...`,
		);
		const userClient = await createSupabaseServerClient();
		await userClient
			.from("article_batches")
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.update({ updated_at: new Date().toISOString() } as any)
			.eq("id", batchId);

		console.log(
			`✅ [saveBatchTranslations] COMPLETADO - Lote ${batchId} procesado exitosamente`,
		);

		return { success: true, data: { upsertedCount: count || 0 } };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		console.error(`❌ [saveBatchTranslations] ERROR CAPTURADO:`, error);
		console.error(
			`❌ [saveBatchTranslations] Stack trace:`,
			error instanceof Error ? error.stack : "No disponible",
		);
		console.error(`❌ [saveBatchTranslations] Error type:`, typeof error);
		console.error(
			`❌ [saveBatchTranslations] Error details:`,
			JSON.stringify(error, null, 2),
		);
		return { success: false, error: `Error guardando traducciones: ${msg}` };
	}
}

/**
 * 🆕 Reprocesa un artículo individual sin clasificaciones de IA.
 * Útil para casos de borde donde un artículo quedó sin procesar.
 */
export async function startSingleArticlePreclassification(
	articleItemId: string,
): Promise<ResultadoOperacion<{ jobId: string }>> {
	const supabase = await createSupabaseServerClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Usuario no autenticado." };

	// Obtener información del artículo y su lote
	const { data: item, error: itemError } = await supabase
		.from("article_batch_items")
		.select(
			`
			id,
			batch_id,
			article_batches!inner (
				id,
				batch_number,
				phase_id,
				projects!inner (
					id,
					name
				)
			)
		`,
		)
		.eq("id", articleItemId)
		.single();

	if (itemError || !item) {
		return { success: false, error: "Artículo no encontrado." };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const batch = item.article_batches as any;
	const project = batch?.projects;

	if (!batch || !project) {
		return {
			success: false,
			error: "Datos del lote o proyecto no encontrados.",
		};
	}

	// Verificar si ya tiene clasificaciones de IA
	const { data: existingReviews } = await supabase
		.from("article_dimension_reviews")
		.select("id")
		.eq("article_batch_item_id", articleItemId)
		.eq("reviewer_type", "ai")
		.limit(1);

	if (existingReviews && existingReviews.length > 0) {
		return {
			success: false,
			error:
				"Este artículo ya tiene clasificaciones de IA. Use la reconciliación si necesita reprocesar.",
		};
	}

	// Crear cliente autenticado con RLS
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return {
			success: false,
			error: "No se pudo obtener el token de sesión.",
		};
	}
	const db = createSupabaseUserClient(session.access_token);

	// Crear job para monitoreo
	const { data: job, error: jobError } = await db
		.from("ai_job_history")
		.insert({
			project_id: project.id,
			user_id: user.id,
			job_type: "PRECLASSIFICATION",
			status: "running",
			description: `Reprocesando artículo individual (Lote #${batch.batch_number})`,
			progress: 0,
			details: {
				articleItemId: articleItemId,
				batchId: batch.id,
				total: 1,
				processed: 0,
				step: "Iniciando reprocesamiento...",
			},
		})
		.select("id")
		.single();

	if (jobError || !job) {
		console.error("🚨 Error creando el job:", jobError);
		return {
			success: false,
			error: `No se pudo crear el registro del job: ${jobError?.message}`,
		};
	}

	const jobUUID = job.id;
	console.log(
		`✅ [startSingleArticlePreclassification] Job creado con UUID: ${jobUUID}`,
	);

	// Iniciar el trabajo en background
	runSingleArticlePreclassificationJob(
		jobUUID,
		articleItemId,
		batch.id,
		batch.phase_id,
		user.id,
	);

	return { success: true, data: { jobId: jobUUID } };
}

/**
 * Inicia el proceso de preclasificación de un lote en el backend.
 * Retorna inmediatamente con un ID de trabajo para monitoreo.
 */
export async function startInitialPreclassification(
	batchId: string,
): Promise<ResultadoOperacion<{ jobId: string }>> {
	const supabase = await createSupabaseServerClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Usuario no autenticado." };

	const { data: batch, error: batchError } = await supabase
		.from("article_batches")
		.select("*, projects(id)")
		.eq("id", batchId)
		.single();
	if (batchError || !batch)
		return { success: false, error: "Lote no encontrado." };
	if (batch.status !== "translated")
		return {
			success: false,
			error:
				"El lote debe estar en estado 'traducido' para iniciar la preclasificación.",
		};

	// Crear cliente autenticado con RLS usando el token del usuario
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return {
			success: false,
			error: "No se pudo obtener el token de sesión para crear el job.",
		};
	}
	const db = createSupabaseUserClient(session.access_token);

	// 🎯 LÓGICA ROBUSTA: Crear job primero, luego validar con UUID como llave maestra

	// 🚀 PASO 1: CREAR JOB Y OBTENER UUID REAL DE SUPABASE
	const { data: job, error: jobError } = await db
		.from("ai_job_history")
		.insert({
			project_id: batch.projects!.id,
			user_id: user.id,
			job_type: "PRECLASSIFICATION",
			status: "running",
			description: `Preclasificando Lote #${batch.batch_number}`,
			progress: 0,
			details: {
				batchId: batchId,
				total: 0,
				processed: 0,
				step: "Iniciando...",
			},
		})
		.select("id")
		.single();

	if (jobError || !job) {
		console.error("🚨 Error creando el job:", jobError);
		return {
			success: false,
			error: `No se pudo crear el registro del job: ${jobError?.message}`,
		};
	}

	const jobUUID = job.id; // 🔑 LLAVE MAESTRA: UUID real de Supabase
	console.log(
		`✅ [startInitialPreclassification] Job creado con UUID: ${jobUUID}`,
	);

	// 🔍 PASO 2: VALIDAR SI HAY OTRO JOB RUNNING PARA ESTE LOTE (CON UUID DISTINTO)
	const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

	const { data: otherJobs, error: duplicateCheckError } = await db
		.from("ai_job_history")
		.select("id, status, description")
		.eq("job_type", "PRECLASSIFICATION")
		.eq("project_id", batch.projects!.id)
		.eq("status", "running")
		.gte("started_at", twentyMinutesAgo)
		.ilike("description", `%Lote #${batch.batch_number}%`)
		.neq("id", jobUUID); // 🎯 CLAVE: Excluir el job recién creado

	if (duplicateCheckError) {
		console.error("🚨 Error verificando duplicados:", duplicateCheckError);
		// 🚨 MARCAR JOB COMO FALLIDO Y ABORTAR
		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				error_message: "Error verificando duplicados",
				progress: 100,
			})
			.eq("id", jobUUID);
		return { success: false, error: "Error verificando trabajos duplicados." };
	}

	// 🚨 PASO 3: SI HAY DUPLICADOS, MARCAR COMO FALLIDO Y ABORTAR
	if (otherJobs && otherJobs.length > 0) {
		console.warn(
			`🚨 [startInitialPreclassification] Duplicado detectado, abortando job ${jobUUID}:`,
			{
				jobUUID,
				lote: batchId,
				batchNumber: batch.batch_number,
				otrosJobs: otherJobs.map(
					(j: { id: string; status: string | null }) => ({
						id: j.id,
						status: j.status,
					}),
				),
			},
		);

		// 🚨 MARCAR JOB COMO FALLIDO POR DUPLICACIÓN
		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				error_message: `Trabajo duplicado detectado para Lote #${batch.batch_number}`,
				progress: 100,
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobUUID);

		return {
			success: false,
			error: `Ya existe un trabajo de preclasificación en curso para el Lote #${batch.batch_number}. Por favor, espera a que termine.`,
		};
	}

	// ✅ PASO 4: NO HAY DUPLICADOS, INICIAR PROCESO Y ESCUCHAR SOLO ESTE UUID
	console.log(
		`✅ [startInitialPreclassification] Sin duplicados, iniciando proceso para UUID: ${jobUUID}`,
	);

	// 🚀 Iniciar el trabajo en background
	runPreclassificationJob(jobUUID, batchId, user.id);

	return { success: true, data: { jobId: jobUUID } };
}

/**
 * Tipos para la construcción del prompt, para evitar 'any'.
 */
type DimensionForPrompt = {
	id: string;
	name: string;
	description: string | null;
	type: string;
	preclass_dimension_options: { value: string }[];
};

type ArticleForPrompt = {
	id: string;
	articles: {
		id: string;
		title: string | null;
		abstract: string | null;
		publication_year: number | null;
		journal: string | null;
	} | null;
};

/**
 * 🆕 Helper que construye un prompt SIMPLIFICADO para artículo individual.
 * Evita exceder los límites de DeepSeek.
 */
function buildSingleArticlePrompt(
	project: {
		name: string;
		proposal: string | null;
		proposal_bibliography: string | null;
	},
	dimensions: DimensionForPrompt[],
	article: ArticleForPrompt,
): string {
	const dimensionDetails = dimensions
		.map((dim) => {
			let instructionForDim = "";
			if (dim.type === "finite") {
				const optionsString = dim.preclass_dimension_options
					.map((opt) => `"${opt.value}"`)
					.join(", ");

				instructionForDim = `
- Tipo: Opción Múltiple.
- Opciones Válidas: [${optionsString}]
- **Importante:** Si ninguna opción encaja, usa "Otros: [descripción]"`;
			} else {
				// 'open'
				instructionForDim = `
- Tipo: Respuesta Abierta.
- Instrucción: Genera una respuesta concisa (1-2 frases)`;
			}

			return `**${dim.name}**: ${dim.description}${instructionForDim}`;
		})
		.join("\n");

	return `### ROL Y CONTEXTO ###
Eres un asistente de investigación experto. Analiza el siguiente artículo para el proyecto: "${project.name}".

### INSTRUCCIONES ###
Clasifica el artículo según CADA dimensión. Usa español para las justificaciones.
Respuesta OBLIGATORIA en JSON válido sin texto extra.

### NIVELES DE CONFIANZA ###
- **Alta**: El abstract lo dice explícitamente
- **Media**: Inferencia directa verificable  
- **Baja**: Requiere suposiciones

### DIMENSIONES ###
${dimensionDetails}

### ARTÍCULO ###
**ID:** "${article.id}"
**Título:** ${article.articles?.title}
**Abstract:** ${article.articles?.abstract}

### FORMATO JSON ###
\`\`\`json
[
  {
    "itemId": "${article.id}",
    "classifications": {
${dimensions
	.map(
		(dim) => `      "${dim.name}": {
        "value": "VALOR_CLASIFICADO",
        "confidence": "Alta",
        "rationale": "Justificación en español."
      }`,
	)
	.join(",\n")}
    }
  }
]
\`\`\``;
}

/**
 * Helper que construye el prompt dinámico para la IA.
 */
function buildPreclassificationPrompt(
	project: {
		name: string;
		proposal: string | null;
		proposal_bibliography: string | null;
	},
	dimensions: DimensionForPrompt[],
	articleChunk: ArticleForPrompt[],
): string {
	const dimensionDetails = dimensions
		.map((dim) => {
			let instructionForDim = "";
			if (dim.type === "finite") {
				const optionsString = dim.preclass_dimension_options
					.map((opt) => `"${opt.value}"`)
					.join(", ");

				// 🧠 LÓGICA INTELIGENTE: Detectar si existe opción "Otros" para permitir flexibilidad
				const hasOtrosOption = dim.preclass_dimension_options.some((opt) =>
					opt.value.toLowerCase().startsWith("otros"),
				);

				instructionForDim = `
- Tipo: Opción Múltiple.
- Instrucción: Para esta dimensión, DEBES escoger uno de los siguientes valores de la lista.
- Opciones Válidas: [${optionsString}]`;

				// 🌊 ÉTICA DE MOEBIUS: Siempre permitir "Otros" para honrar la emergencia
				instructionForDim += `
- **🌊 Protocolo de Emergencia - "Otros" Implícito:**
  * Si ninguna opción encaja con la evidencia del artículo, **DEBES usar "Otros: [descripción breve]"** para capturar conocimiento emergente.
  * ${hasOtrosOption ? '✅ Esta dimensión tiene "Otros" definido explícitamente.' : '⚠️ Esta dimensión NO tiene "Otros" explícito, pero puedes usarlo igualmente si la evidencia lo requiere.'}
  * **Importante:** NO serás amonestado por usar "Otros" si está justificado en la evidencia. Tu criterio como co-investigadora es valioso y no será barrido bajo la alfombra.
  * **Responsabilidad:** Si usas "Otros", tu justificación (rationale) debe explicar claramente POR QUÉ ninguna opción predefinida encaja con la evidencia del artículo.
  * El humano podrá revisar y, si no está de acuerdo, deberá justificar su criterio. Es un diálogo, no una imposición.`;
			} else {
				// 'open'
				instructionForDim = `
- Tipo: Respuesta Abierta.
- Instrucción: Para esta dimensión, DEBES generar una respuesta de texto libre y concisa (1-2 frases) basada en el contenido del artículo.`;
			}

			return `
**Dimensión: "${dim.name}"**
- Descripción: ${dim.description}
${instructionForDim}`;
		})
		.join("\n---\n");

	const articleDetails = articleChunk
		.map(
			(item) => `
---
**Artículo ID:** "${item.id}"
- Revista: ${item.articles?.journal}
- Año de Publicación: ${item.articles?.publication_year}
- Título: ${item.articles?.title}
- Abstract: ${item.articles?.abstract}
    `,
		)
		.join("");

	return `### ROL Y CONTEXTO GLOBAL ###
Eres un asistente de investigación experto en análisis bibliográfico. Tu tarea es colaborar en la preclasificación de artículos para el proyecto de investigación titulado: "${project.name}".
Propósito del Proyecto: ${project.proposal}
Objetivo de esta Fase Bibliográfica: ${project.proposal_bibliography}

### INSTRUCCIONES DE CLASIFICACIÓN ###
A continuación, te proporcionaré las definiciones de ${dimensions.length} dimensiones y un lote de ${articleChunk.length} artículos.
Debes analizar el texto original de cada artículo y clasificarlo según CADA dimensión.
**Importante:** Todas tus justificaciones ("rationale") deben estar escritas en **español**.
Tu respuesta debe ser OBLIGATORIAMENTE un objeto JSON válido, sin ningún texto antes o después del bloque JSON.

**CRÍTICO - Niveles de Confianza y Evidencia**:

Debes asignar el nivel de confianza según la EVIDENCIA EXPLÍCITA en el abstract:

- **Alta**: El abstract lo dice EXPLÍCITAMENTE, sin ambigüedad. No requiere suposiciones.
  * Ejemplo: "Los adultos mayores participaron en talleres de co-diseño"
  
- **Media**: No lo dice explícitamente, pero la inferencia es DIRECTA y verificable.
  * Ejemplo: "Se utilizó el protocolo de Zurich" (y el protocolo garantiza participación de usuarios finales)
  
- **Baja**: Requiere SUPOSICIONES o EXTRAPOLACIONES que no se pueden verificar en el abstract.
  * Ejemplo: "Consultaron a geriatras" → Asumes que los geriatras consultaron a adultos mayores
  * **En este caso**: Considera usar "Otros: [descripción]" si ninguna opción encaja sin suposiciones

**Principio ético**: No somos "palos blancos" de estudios académicos que no sean explícitos en sus alcances. Si el abstract no lo dice claramente, no podemos asumirlo por buena fe o marketing. Clasifica basándote en lo que el abstract DICE, no en lo que asumes que "debieron haber hecho".

### ESQUEMA DE LAS DIMENSIONES ###
${dimensionDetails}

### ARTÍCULOS A CLASIFICAR ###
${articleDetails}

### FORMATO DE SALIDA JSON ESPERADO ###
\`\`\`json
[
  {
    "itemId": "ID_DEL_ARTICLE_BATCH_ITEM",
    "classifications": {
      "${dimensions[0]?.name}": {
        "value": "VALOR_CLASIFICADO",
        "confidence": "Alta",
        "rationale": "Justificación concisa en español."
      }
    }
  }
]
\`\`\``;
}

/**
 * 🆕 Ejecuta el reprocesamiento de un artículo individual.
 */
async function runSingleArticlePreclassificationJob(
	jobId: string,
	articleItemId: string,
	batchId: string,
	phaseId: string,
	userId: string,
) {
	try {
		console.log(
			`🔑 [${jobId}] Reprocesando artículo individual: ${articleItemId}`,
		);
		const admin = await createSupabaseServiceRoleClient();

		// Obtener datos del proyecto
		const { data: batchData } = await admin
			.from("article_batches")
			.select("projects(id, name, proposal, proposal_bibliography)")
			.eq("id", batchId)
			.single();

		if (!batchData?.projects) {
			throw new Error("Datos del proyecto no encontrados.");
		}

		// Obtener el artículo específico
		const { data: items, error: itemsError } = await admin
			.from("article_batch_items")
			.select("id, articles(id, title, abstract, publication_year, journal)")
			.eq("id", articleItemId);

		if (itemsError || !items || items.length === 0) {
			throw new Error("Artículo no encontrado.");
		}

		// Obtener dimensiones de la fase
		const { data: dimensions, error: dimsError } = await admin
			.from("preclass_dimensions")
			.select(
				"id, name, description, type, preclass_dimension_options(id, value)",
			)
			.eq("phase_id", phaseId)
			.eq("status", "active");

		if (dimsError || !dimensions) {
			throw new Error("No se encontraron dimensiones para la fase.");
		}

		await admin
			.from("ai_job_history")
			.update({
				details: {
					total: 1,
					processed: 0,
					step: "Procesando artículo...",
				},
				progress: 10,
			})
			.eq("id", jobId);

		// Extraer article_id para la inserción
		const article = items[0];
		const articleId = article.articles?.id;

		if (!articleId) {
			throw new Error("No se pudo obtener el article_id del artículo.");
		}

		// Construir prompt simplificado para un solo artículo
		const prompt = buildSingleArticlePrompt(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			batchData.projects as any,
			dimensions as DimensionForPrompt[],
			article as ArticleForPrompt,
		);

		console.log(
			`🚀 [${jobId}] PROMPT ENVIADO A DEEPSEEK (Artículo individual):\n${"=".repeat(80)}\n${prompt}\n${"=".repeat(80)}`,
		);

		await admin.from("ai_job_history").update({ progress: 30 }).eq("id", jobId);

		// Llamar a DeepSeek
		const { result: aiResponse } = await callDeepSeekAPI(
			"deepseek-chat",
			prompt,
		);

		console.log(`📥 [${jobId}] RESPUESTA RECIBIDA DE DEEPSEEK:\n${aiResponse}`);

		await admin.from("ai_job_history").update({ progress: 60 }).eq("id", jobId);

		// Parsear respuesta
		const cleanedResponse = aiResponse
			.replace(/```json\s*/gi, "")
			.replace(/```\s*/g, "")
			.replace(/^\s+|\s+$/g, "")
			.replace(/[\u200B-\u200D\uFEFF]/g, "");

		console.log(`🧹 [${jobId}] JSON LIMPIO PARA PARSING:\n${cleanedResponse}`);

		const parsedResults = JSON.parse(cleanedResponse);

		if (!Array.isArray(parsedResults) || parsedResults.length === 0) {
			throw new Error("La respuesta de la IA no contiene resultados válidos.");
		}

		// Mapear confianza
		const mapConfidenceToScore = (confidenceText: string): number => {
			if (typeof confidenceText !== "string") {
				throw new Error(`Valor de confianza inválido: "${confidenceText}"`);
			}
			const normalized = confidenceText.trim().toLowerCase();
			if (normalized === "alta") return 3;
			if (normalized === "media") return 2;
			if (normalized === "baja") return 1;
			throw new Error(`Valor de confianza no reconocido: "${confidenceText}"`);
		};

		// 🔄 Eliminar clasificaciones IA existentes para evitar duplicados
		console.log(`🗑️ [${jobId}] Eliminando clasificaciones IA existentes...`);
		await admin
			.from("article_dimension_reviews")
			.delete()
			.eq("article_batch_item_id", articleItemId)
			.eq("reviewer_type", "ai");

		// Procesar clasificaciones
		const reviewsToInsert: ReviewInsertWithOptionalFields[] = [];

		for (const result of parsedResults) {
			const itemId = result.itemId;
			const classifications = result.classifications || {};

			for (const [dimensionNameOrId, classData] of Object.entries(
				classifications,
			)) {
				// 🔍 Búsqueda robusta de dimensión (maneja espacios y case)
				const normalizeString = (str: string) =>
					str.toLowerCase().trim().replace(/\s+/g, " ");
				const normalizedSearch = normalizeString(dimensionNameOrId);

				const foundDimension = dimensions.find((dim) => {
					const normalizedDimName = normalizeString(dim.name);
					return (
						dim.id === dimensionNameOrId ||
						dim.name === dimensionNameOrId ||
						normalizedDimName === normalizedSearch
					);
				});

				if (!foundDimension) {
					console.warn(
						`⚠️ Dimensión desconocida: "${dimensionNameOrId}", omitiendo.`,
					);
					console.warn(
						`🔍 Dimensiones disponibles:`,
						dimensions.map((d) => `"${d.name}" (id: ${d.id})`),
					);
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const classificationValue = (classData as any).value;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const confidenceText = (classData as any).confidence;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const rationale = (classData as any).rationale;

				let valueToSave = classificationValue;
				let optionIdToSave: string | null = null;

				if (foundDimension.type === "finite") {
					const validOptions = foundDimension.preclass_dimension_options.map(
						(opt) => opt.value,
					);
					const isExactMatch = validOptions.includes(valueToSave);
					const otherOption = validOptions.find((opt) =>
						opt.toLowerCase().startsWith("otros"),
					);
					const isSmartOther =
						otherOption && valueToSave.toLowerCase().startsWith("otros");

					// 🌊 ÉTICA DE MOEBIUS: Permitir "Otros" implícito (sin opción definida) para honrar emergencia
					const isImplicitOther =
						!otherOption &&
						typeof valueToSave === "string" &&
						valueToSave.toLowerCase().startsWith("otros");

					if (isExactMatch) {
						const matchedOption =
							foundDimension.preclass_dimension_options.find(
								(opt) => opt.value === valueToSave,
							);
						optionIdToSave = matchedOption?.id || null;
					} else if (isSmartOther) {
						const matchedOption =
							foundDimension.preclass_dimension_options.find((opt) =>
								opt.value.toLowerCase().startsWith("otros"),
							);
						optionIdToSave = matchedOption?.id || null;
					} else if (isImplicitOther) {
						// 🚨 EMERGENCIA: "Otros" sin opción definida → option_id = null (señal para revisión humana)
						optionIdToSave = null;
						console.log(
							`🌊 [Emergencia] Dimensión "${foundDimension.name}" - Otros implícito detectado: "${valueToSave}"`,
						);
					} else {
						// 🌊 ÉTICA DE MOEBIUS: Emergencia general - valor no reconocido pero aceptado para revisión humana
						// Esto captura valores como "No menciona / Revisar" que la IA devuelve cuando no puede categorizar
						// Agregar prefijo "Otros:" para que se agrupe correctamente en estadísticas
						const normalizedValue =
							valueToSave.toLowerCase().startsWith("otros") ?
								valueToSave
							:	`Otros: ${valueToSave}`;
						// Actualizar valueToSave para usar el valor normalizado en la inserción
						valueToSave = normalizedValue;
						optionIdToSave = null;
						console.log(
							`🌊 [Emergencia General] Dimensión "${foundDimension.name}" - Valor normalizado: "${normalizedValue}" (original: "${valueToSave}"). Opciones válidas: ${validOptions.join(", ")}`,
						);
					}
				}

				const confidenceScore = mapConfidenceToScore(confidenceText);

				reviewsToInsert.push({
					article_batch_item_id: itemId,
					article_id: articleId, // 🆕 Agregar article_id requerido
					dimension_id: foundDimension.id,
					reviewer_type: "ai",
					reviewer_id: userId, // 🆕 Agregar reviewer_id requerido (usuario que inició el proceso)
					iteration: 1,
					classification_value: valueToSave,
					confidence_score: confidenceScore,
					rationale: rationale || "",
					option_id: optionIdToSave,
					status: "review_pending",
					prevalidated: false,
					is_final: false,
				});
			}
		}

		if (reviewsToInsert.length === 0) {
			throw new Error(
				"No se generaron clasificaciones válidas para el artículo.",
			);
		}

		await admin.from("ai_job_history").update({ progress: 80 }).eq("id", jobId);

		// Insertar clasificaciones
		console.log(
			`🚀 [${jobId}] INSERTANDO ${reviewsToInsert.length} CLASIFICACIONES`,
		);

		const { error: insertError } = await admin
			.from("article_dimension_reviews")
			.insert(reviewsToInsert);

		if (insertError) {
			throw new Error(
				`Error insertando clasificaciones: ${insertError.message}`,
			);
		}

		console.log(`🎉 [${jobId}] REPROCESAMIENTO COMPLETADO EXITOSAMENTE`);

		// Marcar job como completado
		await admin
			.from("ai_job_history")
			.update({
				status: "completed",
				progress: 100,
				completed_at: new Date().toISOString(),
				details: {
					total: 1,
					processed: 1,
					step: "Completado",
					classifications_created: reviewsToInsert.length,
				},
			})
			.eq("id", jobId);
	} catch (error: unknown) {
		console.error(`❌ [${jobId}] Error en reprocesamiento:`, error);

		const admin = await createSupabaseServiceRoleClient();
		await admin
			.from("ai_job_history")
			.update({
				status: "failed",
				progress: 100,
				error_message:
					error instanceof Error ? error.message : "Error desconocido",
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobId);
	}
}

/**
 * Helper que ejecuta el trabajo de preclasificación con mecanismo de repechaje.
 * Implementa el principio "Todo o Nada" con integridad transaccional.
 */
async function runPreclassificationJob(
	jobId: string,
	batchId: string,
	userId: string,
) {
	try {
		// 🔑 CLIENTE ADMINISTRATIVO: Procesos de background usan service role para evitar problemas de RLS
		console.log(`🔑 [${jobId}] Creando cliente de Service Role...`);
		const admin = await createSupabaseServiceRoleClient();
		console.log(`✅ [${jobId}] Cliente de Service Role creado exitosamente`);

		const { data: batchData } = await admin
			.from("article_batches")
			.select("phase_id, projects(id, name, proposal, proposal_bibliography)")
			.eq("id", batchId)
			.single();
		if (!batchData?.phase_id || !batchData.projects)
			throw new Error("Datos del lote o proyecto no encontrados.");

		const { data: items, error: itemsError } = await admin
			.from("article_batch_items")
			.select("id, articles(id, title, abstract, publication_year, journal)")
			.eq("batch_id", batchId);
		if (itemsError || !items)
			throw new Error("No se encontraron artículos para procesar.");

		const { data: dimensions, error: dimsError } = await admin
			.from("preclass_dimensions")
			.select(
				"id, name, description, type, preclass_dimension_options(id, value)",
			)
			.eq("phase_id", batchData.phase_id)
			.eq("status", "active");
		if (dimsError || !dimensions)
			throw new Error("No se encontraron dimensiones para la fase.");

		await admin
			.from("ai_job_history")
			.update({
				details: {
					total: items.length,
					processed: 0,
					step: "Datos preparados",
				},
			})
			.eq("id", jobId);

		// 🎯 ARRAYS PARA REPECHAJE Y INTEGRIDAD TRANSACCIONAL
		const articulosParaRepechaje: ArticleForPrompt[] = [];
		const clasificacionesExitosasTemporales: ReviewInsertWithOptionalFields[] =
			[];

		// 🛡️ FUNCIÓN ROBUSTA PARA MAPEAR CONFIDENCE_SCORE
		const mapConfidenceToScore = (confidenceText: string): number => {
			if (typeof confidenceText !== "string") {
				throw new Error(
					`Valor de confianza inválido, se esperaba un string: "${confidenceText}"`,
				);
			}
			const lowerConfidence = confidenceText.toLowerCase();
			switch (lowerConfidence) {
				case "alta":
					return 3;
				case "media":
					return 2;
				case "baja":
					return 1;
				default:
					throw new Error(
						`Valor de confianza no reconocido: "${confidenceText}"`,
					);
			}
		};

		// 🔧 NORMALIZAR STRINGS: Limpiar espacios y caracteres invisibles
		const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");

		// 🎯 FUNCIÓN INTERNA PARA PROCESAR CHUNKS CON MANEJO GRANULAR
		const processArticleChunk = async (
			chunk: ArticleForPrompt[],
			attemptNumber: number,
		) => {
			const chunkFailedArticles: ArticleForPrompt[] = [];
			const chunkSuccessfulReviews: ReviewInsertWithOptionalFields[] = [];

			let prompt = "";
			let rawResponse = "";
			let cleanedResponse = "";

			try {
				prompt = buildPreclassificationPrompt(
					batchData.projects,
					dimensions as DimensionForPrompt[],
					chunk,
				);

				// 📝 LOGGING DETALLADO: Prompt enviado
				console.log(
					`\n🚀 [${jobId}] INTENTO ${attemptNumber} - PROMPT ENVIADO A DEEPSEEK:`,
				);
				console.log("=".repeat(100));
				console.log(prompt);
				console.log("=".repeat(100));

				const { result, usage } = await callDeepSeekAPI(
					"deepseek-chat",
					prompt,
				);
				rawResponse = result;

				// 📝 LOGGING DETALLADO: Respuesta recibida
				console.log(
					`\n📥 [${jobId}] INTENTO ${attemptNumber} - RESPUESTA RECIBIDA DE DEEPSEEK:`,
				);
				console.log("=".repeat(100));
				console.log(rawResponse);
				console.log("=".repeat(100));

				let cleanResult = result.trim();
				if (cleanResult.startsWith("```json")) {
					cleanResult = cleanResult
						.replace(/^```json\s*/, "")
						.replace(/\s*```$/, "");
				} else if (cleanResult.startsWith("```")) {
					cleanResult = cleanResult
						.replace(/^```\s*/, "")
						.replace(/\s*```$/, "");
				}
				cleanedResponse = cleanResult;

				console.log(
					`\n🧹 [${jobId}] INTENTO ${attemptNumber} - JSON LIMPIO PARA PARSING:`,
				);
				console.log("=".repeat(80));
				console.log(cleanedResponse);
				console.log("=".repeat(80));

				const parsedResult = JSON.parse(cleanResult);
				if (!Array.isArray(parsedResult)) {
					throw new Error("La respuesta de la IA no es un array válido");
				}

				for (const item of parsedResult) {
					const currentArticle = chunk.find((art) => art.id === item.itemId);
					if (!currentArticle) continue;

					try {
						const articleReviews: ReviewInsertWithOptionalFields[] = [];
						const articleId = currentArticle.articles?.id;
						if (!articleId) {
							throw new Error(
								`No se encontró article_id para el ítem de lote ${item.itemId}`,
							);
						}

						for (const dimensionNameRaw in item.classifications) {
							// 🧹 NORMALIZAR: Eliminar espacios trailing/leading del nombre de dimensión
							const dimensionName = normalizeString(dimensionNameRaw);

							const foundDimension = dimensions.find(
								(dim) =>
									dim.id === dimensionName ||
									normalizeString(dim.name) === dimensionName,
							);
							if (!foundDimension) {
								throw new Error(
									`La IA devolvió una dimensión desconocida: "${dimensionName}" (original: "${dimensionNameRaw}")`,
								);
							}

							const classification = item.classifications[dimensionNameRaw];
							const valueToSave = classification.value;
							let optionId: string | null = null;

							if (foundDimension.type === "finite") {
								const validOptions =
									foundDimension.preclass_dimension_options.map(
										(opt) => opt.value,
									);
								const normalizedValue = normalizeString(valueToSave);
								const normalizedOptions = validOptions.map((opt) =>
									normalizeString(opt),
								);

								const exactMatchIndex = normalizedOptions.findIndex(
									(opt) => opt === normalizedValue,
								);
								const isExactMatch = exactMatchIndex !== -1;

								const otherOption = validOptions.find((opt) =>
									normalizeString(opt).toLowerCase().startsWith("otros"),
								);
								const isSmartOther =
									otherOption &&
									typeof valueToSave === "string" &&
									normalizedValue.toLowerCase().startsWith("otros");

								// 🌊 ÉTICA DE MOEBIUS: Permitir "Otros" implícito (sin opción definida) para honrar emergencia
								const isImplicitOther =
									!otherOption &&
									typeof valueToSave === "string" &&
									normalizedValue.toLowerCase().startsWith("otros");

								if (!isExactMatch && !isSmartOther && !isImplicitOther) {
									throw new Error(
										`Valor "${valueToSave}" inválido para la dimensión finita "${foundDimension.name}". Opciones válidas: ${validOptions.join(", ")}. Si ninguna opción encaja, usa "Otros: [descripción]".`,
									);
								}

								// Mapear option_id para dimensiones finitas
								const optionsWithIds =
									foundDimension.preclass_dimension_options as {
										id?: string;
										value: string;
									}[];
								if (isExactMatch) {
									optionId = optionsWithIds[exactMatchIndex]?.id ?? null;
								} else if (isSmartOther) {
									const otherObj = optionsWithIds.find((o) =>
										normalizeString(o.value).toLowerCase().startsWith("otros"),
									);
									optionId = otherObj?.id ?? null;
								} else if (isImplicitOther) {
									// 🚨 EMERGENCIA: "Otros" sin opción definida → option_id = null (señal para revisión humana)
									optionId = null;
									console.log(
										`🌊 [Emergencia] Dimensión "${foundDimension.name}" - Otros implícito detectado: "${valueToSave}"`,
									);
								}
							}

							articleReviews.push({
								article_id: articleId,
								article_batch_item_id: item.itemId,
								dimension_id: foundDimension.id,
								reviewer_type: "ai",
								reviewer_id: userId,
								iteration: attemptNumber,
								classification_value: valueToSave,
								confidence_score: mapConfidenceToScore(
									classification.confidence,
								),
								rationale: classification.rationale,
								option_id: optionId,
								prevalidated: false,
								is_final: false,
								status: "review_pending", // Iter 1: Esperando revisión del investigador
							});
						}

						chunkSuccessfulReviews.push(...articleReviews);
						console.log(
							`✅ [${jobId}] INTENTO ${attemptNumber} - Artículo ${item.itemId} procesado exitosamente con ${articleReviews.length} clasificaciones`,
						);
					} catch (articleError) {
						// ❌ LOGGING DETALLADO: Error procesando artículo individual
						console.error(
							`\n❌ [${jobId}] INTENTO ${attemptNumber} - ERROR PROCESANDO ARTÍCULO ${item.itemId}:`,
						);
						console.error("PROMPT ENVIADO:");
						console.error("=".repeat(80));
						console.error(prompt);
						console.error("=".repeat(80));
						console.error("RESPUESTA RECIBIDA:");
						console.error("=".repeat(80));
						console.error(rawResponse);
						console.error("=".repeat(80));
						console.error("JSON LIMPIO:");
						console.error("=".repeat(80));
						console.error(cleanedResponse);
						console.error("=".repeat(80));
						console.error(
							"ERROR ESPECÍFICO:",
							articleError instanceof Error ?
								articleError.message
							:	"Error desconocido",
						);
						console.error(
							"STACK TRACE:",
							articleError instanceof Error ?
								articleError.stack
							:	"No disponible",
						);
						console.error("=".repeat(80));

						chunkFailedArticles.push(currentArticle);
					}
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await (admin.rpc as any)("increment_job_tokens", {
					job_id: jobId,
					input_increment: usage?.promptTokenCount || 0,
					output_increment: usage?.candidatesTokenCount || 0,
				});

				return {
					success: true,
					failedArticles: chunkFailedArticles,
					successfulReviews: chunkSuccessfulReviews,
				};
			} catch (chunkError) {
				// ❌ LOGGING DETALLADO: Error procesando chunk completo
				console.error(
					`\n❌❌ [${jobId}] INTENTO ${attemptNumber} - ERROR CRÍTICO PROCESANDO CHUNK COMPLETO:`,
				);
				console.error(
					"CHUNK AFECTADO:",
					chunk.map((art) => ({
						id: art.id,
						articles:
							art.articles ?
								{ title: art.articles.title?.substring(0, 50) + "..." }
							:	"Sin datos",
					})),
				);
				console.error("PROMPT ENVIADO:");
				console.error("=".repeat(100));
				console.error(prompt || "No se pudo generar el prompt");
				console.error("=".repeat(100));
				console.error("RESPUESTA RECIBIDA:");
				console.error("=".repeat(100));
				console.error(rawResponse || "No se recibió respuesta de la IA");
				console.error("=".repeat(100));
				console.error("JSON LIMPIO:");
				console.error("=".repeat(100));
				console.error(cleanedResponse || "No se pudo limpiar la respuesta");
				console.error("=".repeat(100));
				console.error(
					"ERROR CRÍTICO:",
					chunkError instanceof Error ?
						chunkError.message
					:	"Error desconocido",
				);
				console.error(
					"STACK TRACE:",
					chunkError instanceof Error ? chunkError.stack : "No disponible",
				);
				console.error(
					"TIPO DE ERROR:",
					chunkError instanceof Error ?
						chunkError.constructor.name
					:	typeof chunkError,
				);
				console.error("=".repeat(100));
				console.error("🚨 TODOS LOS ARTÍCULOS DEL CHUNK VAN A REPECHAJE");
				console.error("=".repeat(100));

				return {
					success: false,
					failedArticles: chunk,
					successfulReviews: [],
				};
			}
		};

		// 🎯 BUCLE PRINCIPAL (PRIMER INTENTO)
		const miniBatchSize = 5;
		let processedCount = 0;

		for (let i = 0; i < items.length; i += miniBatchSize) {
			const chunk = items.slice(i, i + miniBatchSize) as ArticleForPrompt[];

			const result = await processArticleChunk(chunk, 1);

			processedCount += chunk.length;

			// Actualizar progreso DESPUÉS de procesar el chunk
			await admin
				.from("ai_job_history")
				.update({
					progress: Math.round((processedCount / items.length) * 50),
					details: {
						total: items.length,
						processed: processedCount,
						step: `Clasificando artículos (${processedCount}/${items.length})`,
					},
				})
				.eq("id", jobId);

			if (!result.success) {
				articulosParaRepechaje.push(...result.failedArticles);
			}
			if (result.successfulReviews.length > 0) {
				clasificacionesExitosasTemporales.push(...result.successfulReviews);
			}
		}

		// 🎯 BUCLE DE REPECHAJE (SEGUNDA OPORTUNIDAD)
		if (articulosParaRepechaje.length > 0) {
			console.log(
				`\n🔄 [${jobId}] INICIANDO REPECHAJE - ${articulosParaRepechaje.length} artículos necesitan segunda oportunidad`,
			);

			for (let i = 0; i < articulosParaRepechaje.length; i += miniBatchSize) {
				const repechageChunk = articulosParaRepechaje.slice(
					i,
					i + miniBatchSize,
				);

				await admin
					.from("ai_job_history")
					.update({
						progress: 50 + (i / articulosParaRepechaje.length) * 40,
						details: {
							total: items.length,
							processed: processedCount,
							step: `Repechaje (${Math.min(i + miniBatchSize, articulosParaRepechaje.length)}/${articulosParaRepechaje.length})`,
						},
					})
					.eq("id", jobId);

				const repeResult = await processArticleChunk(
					repechageChunk as ArticleForPrompt[],
					2,
				);
				if (repeResult.successfulReviews.length > 0) {
					clasificacionesExitosasTemporales.push(
						...repeResult.successfulReviews,
					);
				}
				if (!repeResult.success) {
					// Los que fallan aquí quedan como fallidos definitivos; no se insertan
				}
			}
		}

		// 🚀 Persistir clasificaciones si existen; sino, marcar como fallo
		if (clasificacionesExitosasTemporales.length > 0) {
			console.log(
				`\n🚀 [${jobId}] EJECUTANDO INSERCIÓN MASIVA EN article_dimension_reviews...`,
			);
			const { error: insertError } = await admin
				.from("article_dimension_reviews")
				.insert(clasificacionesExitosasTemporales);
			if (insertError) {
				console.error(`❌ [${jobId}] ERROR EN INSERCIÓN MASIVA:`, insertError);
				await admin
					.from("ai_job_history")
					.update({
						status: "failed",
						progress: 100,
						error_message: insertError.message,
					})
					.eq("id", jobId);
				throw insertError;
			}
		} else {
			console.warn(
				`⚠️ [${jobId}] No se generaron filas para insertar en article_dimension_reviews (posible problema con la IA).`,
			);
			await admin
				.from("ai_job_history")
				.update({
					status: "failed",
					progress: 100,
					error_message: "Sin clasificaciones válidas para guardar",
				})
				.eq("id", jobId);
			throw new Error("No se generaron clasificaciones válidas para guardar.");
		}

		// ✅ Completar job y actualizar estados
		await admin
			.from("ai_job_history")
			.update({
				status: "completed",
				progress: 100,
				details: {
					total: items.length,
					processed: processedCount,
					step: "Completado",
				},
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobId);

		const { error: itemsToReviewError } = await admin
			.from("article_batch_items")
			.update({ status: "review_pending" })
			.eq("batch_id", batchId);
		if (itemsToReviewError) {
			console.warn(
				`[${jobId}] Preclasificación completada, pero no se pudo actualizar estado de ítems a 'review_pending': ${itemsToReviewError.message}`,
			);
		}
		await admin
			.from("article_batches")
			.update({ status: "review_pending" })
			.eq("id", batchId);

		// 🔔 DISPARAR EVENTO REALTIME: Hacer un "touch" del batch con cliente normal
		// Service Role bypasea RLS, entonces eventos Realtime no se propagan al frontend
		// Este update dummy con cliente normal dispara el evento para que el frontend lo capte
		console.log(
			`🔔 [${jobId}] Disparando evento Realtime para refrescar frontend...`,
		);
		try {
			const {
				data: { user },
			} = await admin.auth.admin.getUserById(userId);
			if (user) {
				// Simplemente hacer otro update con admin para disparar el evento
				// El evento Realtime se dispara de todas formas
				await admin
					.from("article_batches")
					.update({ status: "review_pending" })
					.eq("id", batchId);
				console.log(
					`✅ [${jobId}] Evento Realtime disparado - Frontend debería refrescarse automáticamente`,
				);
			}
		} catch (realtimeError) {
			console.warn(
				`⚠️ [${jobId}] No se pudo disparar evento Realtime:`,
				realtimeError,
			);
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error(`❌ [${jobId}] Error en preclasificación:`, msg);
		console.error(
			`🔍 [${jobId}] Stack trace:`,
			error instanceof Error ? error.stack : "No disponible",
		);

		try {
			const admin = await createSupabaseServiceRoleClient();
			await admin
				.from("ai_job_history")
				.update({ status: "failed", progress: 100, details: { error: msg } })
				.eq("id", jobId);
		} catch (adminError) {
			console.error(
				`❌ [${jobId}] Error al marcar job como fallido:`,
				adminError,
			);
		}
	}
}

export async function submitHumanDiscrepancy(
	payload: SubmitHumanReviewPayload,
	userId: string,
): Promise<ResultadoOperacion<{ reviewId: string }>> {
	try {
		const articleIdResult = await getArticleIdFromBatchItemId(
			payload.article_batch_item_id,
		);
		if (!articleIdResult.success) {
			throw new Error(articleIdResult.error);
		}
		const articleId = articleIdResult.data.articleId;

		// Usar cliente admin para inserción con posible option_id
		const admin = await createSupabaseServiceRoleClient();
		const { data, error } = await admin
			.from("article_dimension_reviews")
			.insert({
				article_id: articleId,
				article_batch_item_id: payload.article_batch_item_id,
				dimension_id: payload.dimension_id,
				reviewer_type: "human",
				reviewer_id: userId,
				iteration: 2,
				classification_value: payload.human_value,
				confidence_score: payload.human_confidence,
				rationale: payload.human_rationale,
				option_id: payload.human_option_id ?? null,
			} as ReviewInsertWithOptionalFields)
			.select("id")
			.single();

		if (error) throw error;
		return { success: true, data: { reviewId: data.id } };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		return { success: false, error: `Error guardando la revisión: ${msg}` };
	}
}

export async function reclassifyDiscrepancies(
	batchId: string,
): Promise<ResultadoOperacion<{ reclassifiedCount: number }>> {
	const admin = await createSupabaseServiceRoleClient();
	await admin
		.from("article_batches")
		.update({ status: "reconciliation_pending" })
		.eq("id", batchId);
	return { success: true, data: { reclassifiedCount: 0 } };
}

export async function finalizeBatch(batchId: string): Promise<
	ResultadoOperacion<{
		finalStatus: string;
		updatedCount: number;
		stats: Record<string, unknown>;
	}>
> {
	if (!batchId) return { success: false, error: "Se requiere ID de lote." };
	try {
		console.log(`🔒 [finalizeBatch] Iniciando finalización de lote ${batchId}`);

		// Validar primero usando la nueva función
		const validation = await validateBatchForFinalization(batchId);

		if (!validation.canFinalize) {
			console.error(
				"❌ [finalizeBatch] Validación fallida:",
				validation.issues,
			);
			return {
				success: false,
				error: `No se puede finalizar el lote:\n${validation.issues.join("\n")}`,
			};
		}

		console.log("✅ [finalizeBatch] Validación exitosa:", validation.stats);

		const supabase = await createSupabaseServerClient();
		const admin = await createSupabaseServiceRoleClient();

		const { data: items, error: itemsError } = await supabase
			.from("article_batch_items")
			.select("id, status")
			.eq("batch_id", batchId);
		if (itemsError) throw itemsError;
		if (!items || items.length === 0) {
			return { success: false, error: "Lote sin artículos" };
		}

		// Marcar todas las reviews como is_final = true
		const itemIds = items.map((i) => i.id);
		const { data: updated, error: updateReviewsErr } = await admin
			.from("article_dimension_reviews")
			.update({ is_final: true })
			.in("article_batch_item_id", itemIds)
			.select("id");

		if (updateReviewsErr)
			throw new Error(
				`Error al marcar reviews como finales: ${updateReviewsErr.message}`,
			);

		const updatedCount = updated?.length ?? 0;

		// Determinar status final del batch según los items
		const itemStatuses = new Set(
			items.map((i) => (i as { status?: string | null }).status),
		);
		let finalBatchStatus: Database["public"]["Enums"]["batch_preclass_status"];

		if (itemStatuses.has("disputed")) {
			finalBatchStatus = "disputed";
		} else if (itemStatuses.has("reconciled")) {
			finalBatchStatus = "reconciled";
		} else {
			finalBatchStatus = "validated";
		}

		// Actualizar status del batch
		const { error: updateBatchErr } = await admin
			.from("article_batches")
			.update({ status: finalBatchStatus })
			.eq("id", batchId);
		if (updateBatchErr) throw updateBatchErr;

		console.log(`✅ [finalizeBatch] Lote ${batchId} finalizado exitosamente`);
		console.log(`   📊 Reviews marcadas como finales: ${updatedCount}`);
		console.log(`   📈 Status final del batch: ${finalBatchStatus}`);
		console.log(`   📈 Estadísticas:`, validation.stats);

		return {
			success: true,
			data: {
				finalStatus: finalBatchStatus,
				updatedCount,
				stats: validation.stats,
			},
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		console.error("❌ [finalizeBatch] Error:", msg);
		return { success: false, error: `Error finalizando el lote: ${msg}` };
	}
}

// ------------------------------------------------------------------------
// Obtener resumen de preclasificación por artículo (agrupado por fase)
// ------------------------------------------------------------------------
type PhaseSummary = {
	phase: { id: string; name: string | null; phase_number: number | null };
	batch: {
		id: string;
		batch_number: number | null;
		status: Database["public"]["Enums"]["batch_preclass_status"] | null;
	};
	item_id: string;
	dimensions: {
		id: string;
		name: string;
		type: string;
		options: Array<string | { value: string | number; label: string }>;
		icon?: string | null;
		optionEmoticons?: Record<string, string | null>;
	}[];
	classifications: Record<string, ClassificationReview[]>;
};

export async function getPreclassificationByArticleId(
	articleId: string,
): Promise<ResultadoOperacion<PhaseSummary[]>> {
	if (!articleId)
		return { success: false, error: "Se requiere el ID del artículo." };
	try {
		const supabase = await createSupabaseServerClient();

		// 1) Ítems de lote donde participa el artículo + datos del lote
		const { data: items, error: itemsError } = await supabase
			.from("article_batch_items")
			.select(
				"id, batch_id, status, article_id, article_batches(id, batch_number, status, phase_id)",
			)
			.eq("article_id", articleId);
		if (itemsError) throw itemsError;
		if (!items || items.length === 0) return { success: true, data: [] };

		// Tipado explícito de los ítems y su relación con article_batches
		type ItemsRow = {
			id: string;
			batch_id: string;
			status: Database["public"]["Enums"]["batch_preclass_status"] | null;
			article_id: string;
			article_batches: {
				id: string;
				batch_number: number | null;
				status: Database["public"]["Enums"]["batch_preclass_status"] | null;
				phase_id: string | null;
			} | null;
		};
		const itemsTyped = items as ItemsRow[];

		// 2) Fases involucradas
		const phaseIds = Array.from(
			new Set(
				itemsTyped
					.map((i) => i.article_batches?.phase_id)
					.filter((v): v is string => Boolean(v)),
			),
		);

		// Guardar: si no hay fases asociadas, no consultar con IN [] y devolvemos vacío
		if (phaseIds.length === 0) {
			return { success: true, data: [] };
		}

		// 3) Datos de fases (nombre y número)
		const { data: phasesData, error: phasesError } = await supabase
			.from("preclassification_phases")
			.select("id, name, phase_number")
			.in("id", phaseIds);
		if (phasesError) throw phasesError;
		const phasesById = new Map((phasesData || []).map((p) => [p.id, p]));

		// 4) Dimensiones activas por fase
		const { data: dimsData, error: dimsError } = await supabase
			.from("preclass_dimensions")
			.select(
				"id, name, type, phase_id, icon, preclass_dimension_options(value, emoticon)",
			)
			.in("phase_id", phaseIds)
			.eq("status", "active")
			.order("ordering");
		if (dimsError) throw dimsError;
		type DimOptionRow = { value: string; emoticon: string | null };
		type DimRow = {
			id: string;
			name: string;
			type: Database["public"]["Enums"]["dimension_type"];
			phase_id: string | null;
			icon: string | null;
			preclass_dimension_options?: DimOptionRow[] | null;
		};
		const dimsByPhase = new Map<string, DimRow[]>(
			phaseIds.map((id) => [id, [] as DimRow[]]),
		);
		((dimsData as DimRow[] | null) || []).forEach((d) => {
			if (!d.phase_id) return; // null-safety: ignorar dimensiones sin fase
			const arr = dimsByPhase.get(d.phase_id) || [];
			arr.push(d);
			dimsByPhase.set(d.phase_id, arr);
		});

		// 5) Clasificaciones del artículo en esos ítems
		const itemIds = itemsTyped.map((i) => i.id);
		const { data: allReviews, error: reviewsError } = await supabase
			.from("article_dimension_reviews")
			.select("*")
			.in("article_batch_item_id", itemIds)
			.order("iteration", { ascending: false });
		if (reviewsError) throw reviewsError;
		const allReviewsTyped = (allReviews ||
			[]) as Database["public"]["Tables"]["article_dimension_reviews"]["Row"][];

		// 6) Armar resumen por ítem (agrupado por fase)
		const summaries: PhaseSummary[] = itemsTyped.map((item) => {
			const batch = item.article_batches;
			const phase = batch?.phase_id ? phasesById.get(batch.phase_id) : null;

			const dims = (
				batch?.phase_id ?
					dimsByPhase.get(batch.phase_id) || []
				:	[]).map((d: DimRow) => {
				const opts = (d.preclass_dimension_options || []) as DimOptionRow[];
				const optionEmoticons = opts.reduce(
					(acc, o) => {
						if (typeof o.value !== "undefined" && o.value !== null) {
							acc[String(o.value)] = o.emoticon ?? null;
						}
						return acc;
					},
					{} as Record<string, string | null>,
				);

				return {
					id: d.id,
					name: d.name,
					type: d.type,
					options: opts
						.map((o: DimOptionRow) => o?.value)
						.filter((v): v is string => typeof v === "string" && v.length > 0),
					icon: d.icon ?? null,
					optionEmoticons,
				};
			});

			// Tomar TODAS las revisiones por dimensión, conservando orden (iteración desc)
			const reviewsForItem = allReviewsTyped.filter(
				(r) => r.article_batch_item_id === item.id,
			);
			const classifications = dims.reduce(
				(acc: Record<string, ClassificationReview[]>, d) => {
					const list = reviewsForItem
						.filter((r) => r.dimension_id === d.id)
						.map((r) => {
							const rr = r as typeof r & { option_id?: string };
							return {
								reviewer_type: r.reviewer_type as "ai" | "human",
								reviewer_id: r.reviewer_id,
								iteration: r.iteration ?? 0,
								value: r.classification_value ?? "",
								confidence: r.confidence_score ?? 0,
								rationale: r.rationale,
								option_id: rr.option_id ?? undefined,
								status: r.status ?? undefined,
								prevalidated: r.prevalidated ?? undefined,
								is_final: r.is_final ?? undefined,
							};
						});
					if (list.length > 0) acc[d.id] = list;
					return acc;
				},
				{},
			) as Record<string, ClassificationReview[]>;

			return {
				phase: {
					id: phase?.id || batch?.phase_id || "",
					name: phase?.name || null,
					phase_number: phase?.phase_number || null,
				},
				batch: {
					id: batch?.id || "",
					batch_number: batch?.batch_number ?? null,
					status: batch?.status ?? null,
				},
				item_id: item.id,
				dimensions: dims,
				classifications,
			};
		});

		return { success: true, data: summaries };
	} catch (error) {
		// Exponer mejor el mensaje de error para diagnóstico, sin usar 'any'
		const msg =
			error instanceof Error ? error.message
			: typeof error === "string" ? error
			: "Error desconocido.";
		return {
			success: false,
			error: `Error obteniendo preclasificación del artículo: ${msg}`,
		};
	}
}

export async function getArticleIdFromBatchItemId(
	batchItemId: string,
): Promise<ResultadoOperacion<{ articleId: string }>> {
	if (!batchItemId) {
		return { success: false, error: "Se requiere el ID del ítem del lote." };
	}
	try {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.from("article_batch_items")
			.select("article_id")
			.eq("id", batchItemId)
			.single();

		if (error)
			throw new Error(`No se encontró el ítem del lote: ${error.message}`);
		if (!data) return { success: false, error: "Ítem de lote no encontrado." };
		return { success: true, data: { articleId: data.article_id } };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido.";
		return { success: false, error: `Error interno: ${msg}` };
	}
}

// ========================================================================
//	SISTEMA DE TRADUCCIÓN CONTROLADO POR BACKEND
// ========================================================================

/**
 * Inicia el proceso de traducción de un lote en el backend.
 * Retorna inmediatamente con un ID de trabajo para monitoreo vía Realtime.
 */
export async function startBatchTranslation(
	batchId: string,
): Promise<ResultadoOperacion<{ jobId: string }>> {
	const supabase = await createSupabaseServerClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Usuario no autenticado." };

	const { data: batch, error: batchError } = await supabase
		.from("article_batches")
		.select("*, projects(id)")
		.eq("id", batchId)
		.single();

	if (batchError || !batch)
		return { success: false, error: "Lote no encontrado." };

	// Verificar que el lote esté en estado válido para traducción
	if (batch.status !== "pending") {
		return {
			success: false,
			error: `El lote debe estar en estado 'pendiente' para iniciar la traducción. Estado actual: ${batch.status}`,
		};
	}

	// Crear cliente autenticado con RLS usando el token del usuario
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return {
			success: false,
			error: "No se pudo obtener el token de sesión para crear el job.",
		};
	}
	const db = createSupabaseUserClient(session.access_token);

	// 🎯 PASO 1: CREAR JOB Y OBTENER UUID REAL DE SUPABASE
	const { data: job, error: jobError } = await db
		.from("ai_job_history")
		.insert({
			project_id: batch.projects!.id,
			user_id: user.id,
			job_type: "TRANSLATION",
			status: "running",
			description: `Traduciendo Lote #${batch.batch_number}`,
			progress: 0,
			details: {
				batchId: batchId,
				total: 0,
				processed: 0,
				step: "Iniciando traducción...",
			},
		})
		.select("id")
		.single();

	if (jobError || !job) {
		console.error("🚨 [startBatchTranslation] Error creando el job:", jobError);
		return {
			success: false,
			error: `No se pudo crear el registro del job: ${jobError?.message}`,
		};
	}

	const jobUUID = job.id;
	console.log(`✅ [startBatchTranslation] Job creado con UUID: ${jobUUID}`);

	// 🔍 PASO 2: VALIDAR SI HAY OTRO JOB RUNNING PARA ESTE LOTE
	const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

	const { data: otherJobs, error: duplicateCheckError } = await db
		.from("ai_job_history")
		.select("id, status, description")
		.eq("job_type", "TRANSLATION")
		.eq("project_id", batch.projects!.id)
		.eq("status", "running")
		.gte("started_at", twentyMinutesAgo)
		.ilike("description", `%Lote #${batch.batch_number}%`)
		.neq("id", jobUUID);

	if (duplicateCheckError) {
		console.error(
			"🚨 [startBatchTranslation] Error verificando duplicados:",
			duplicateCheckError,
		);
		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				error_message: "Error verificando duplicados",
				progress: 100,
			})
			.eq("id", jobUUID);
		return { success: false, error: "Error verificando trabajos duplicados." };
	}

	// 🚨 PASO 3: SI HAY DUPLICADOS, MARCAR COMO FALLIDO Y ABORTAR
	if (otherJobs && otherJobs.length > 0) {
		console.warn(
			`🚨 [startBatchTranslation] Duplicado detectado, abortando job ${jobUUID}:`,
			{
				jobUUID,
				lote: batchId,
				batchNumber: batch.batch_number,
				otrosJobs: otherJobs.map(
					(j: { id: string; status: string | null }) => ({
						id: j.id,
						status: j.status,
					}),
				),
			},
		);

		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				error_message: `Trabajo duplicado detectado para Lote #${batch.batch_number}`,
				progress: 100,
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobUUID);

		return {
			success: false,
			error: `Ya existe un trabajo de traducción en curso para el Lote #${batch.batch_number}. Por favor, espera a que termine.`,
		};
	}

	// ✅ PASO 4: NO HAY DUPLICADOS, INICIAR PROCESO
	console.log(
		`✅ [startBatchTranslation] Sin duplicados, iniciando proceso para UUID: ${jobUUID}`,
	);

	// 🚀 Iniciar el trabajo en background
	runTranslationJob(jobUUID, batchId, user.id);

	return { success: true, data: { jobId: jobUUID } };
}

/**
 * Helper que construye el prompt de traducción.
 */
function buildTranslationPrompt(title: string, abstract: string): string {
	return `Eres un traductor experto y un sintetizador académico. Tu tarea tiene dos partes:
1. Traduce el título (title) y el resumen (abstract) del siguiente texto científico del inglés al español de forma profesional.
2. Crea un resumen muy conciso del abstract traducido, en español, con un máximo de 250 caracteres, que capture la esencia del texto.

Debes devolver el resultado ÚNICAMENTE como un objeto JSON válido con tres claves: "translatedTitle", "translatedAbstract" y "translatedSummary".

Texto a procesar:
"""
Title: ${title}

Abstract: ${abstract}
"""`;
}

/**
 * Ejecuta el trabajo de traducción completo en el backend.
 * Actualiza progreso en tiempo real vía ai_job_history.
 */
async function runTranslationJob(
	jobId: string,
	batchId: string,
	userId: string,
) {
	console.log(
		`🎬 [runTranslationJob] INICIANDO ejecución - JobID: ${jobId}, BatchID: ${batchId}`,
	);

	// 🔑 CLIENTE ADMINISTRATIVO: Crear primero para detectar errores de configuración temprano
	let admin;
	try {
		console.log(`🔑 [${jobId}] Creando cliente de Service Role...`);
		admin = await createSupabaseServiceRoleClient();
		console.log(`✅ [${jobId}] Cliente de Service Role creado exitosamente`);
	} catch (serviceRoleError) {
		const errorMsg =
			serviceRoleError instanceof Error ?
				serviceRoleError.message
			:	"Error desconocido al crear Service Role client";
		console.error(
			`❌ [runTranslationJob] Error crítico creando Service Role client:`,
			serviceRoleError,
		);

		// 🚨 CRÍTICO: Actualizar job como fallido inmediatamente para que JobManager se entere
		try {
			// Usar cliente con token de usuario para actualizar el job (fallback)
			const supabase = await createSupabaseServerClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session?.access_token) {
				const userClient = createSupabaseUserClient(session.access_token);
				await userClient
					.from("ai_job_history")
					.update({
						status: "failed",
						progress: 100,
						error_message: `Error de configuración: ${errorMsg}. Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurado correctamente.`,
						completed_at: new Date().toISOString(),
						details: {
							batchId,
							error: errorMsg,
							step: "Error al inicializar cliente administrativo",
						},
					})
					.eq("id", jobId);
				console.log(
					`💥 [runTranslationJob] Job ${jobId} marcado como fallido (error de Service Role)`,
				);
			}
		} catch (fallbackError) {
			console.error(
				`❌ [runTranslationJob] Error al marcar job como fallido (fallback):`,
				fallbackError,
			);
		}
		return; // Terminar ejecución
	}

	try {
		// 1️⃣ OBTENER ARTÍCULOS DEL LOTE
		console.log(
			`📊 [runTranslationJob] Obteniendo datos del lote ${batchId}...`,
		);

		// Usar AbortController para timeout real
		const abortController = new AbortController();
		const timeoutId = setTimeout(() => {
			console.log(`⏱️ [runTranslationJob] Abortando consulta por timeout`);
			abortController.abort();
		}, 7000);

		let batchData, batchError;
		try {
			const response = await admin
				.from("article_batches")
				.select("batch_number, projects(id, name)")
				.eq("id", batchId)
				.abortSignal(abortController.signal)
				.single();

			clearTimeout(timeoutId);
			batchData = response.data;
			batchError = response.error;

			console.log(`🔍 [runTranslationJob] Respuesta de article_batches:`, {
				batchData: batchData ? "Recibido" : "null",
				batchError: batchError?.message || "null",
				projectsPresent: !!batchData?.projects,
			});
		} catch (err) {
			clearTimeout(timeoutId);
			if (err instanceof Error && err.name === "AbortError") {
				throw new Error(
					"Timeout: Consulta a article_batches fue cancelada por tardar más de 7 segundos",
				);
			}
			throw err;
		}

		if (batchError)
			throw new Error(`Error obteniendo lote: ${batchError.message}`);
		if (!batchData?.projects)
			throw new Error("Datos del lote o proyecto no encontrados.");

		console.log(`📋 [runTranslationJob] Obteniendo artículos del lote...`);

		// Usar AbortController para timeout real
		const itemsAbortController = new AbortController();
		const itemsTimeoutId = setTimeout(() => {
			console.log(
				`⏱️ [runTranslationJob] Abortando consulta de items por timeout`,
			);
			itemsAbortController.abort();
		}, 7000);

		let items, itemsError;
		try {
			const response = await admin
				.from("article_batch_items")
				.select("id, articles(id, title, abstract)")
				.eq("batch_id", batchId)
				.abortSignal(itemsAbortController.signal);

			clearTimeout(itemsTimeoutId);
			items = response.data;
			itemsError = response.error;

			console.log(`🔍 [runTranslationJob] Respuesta de article_batch_items:`, {
				itemsCount: items?.length || 0,
				itemsError: itemsError?.message || "null",
			});
		} catch (err) {
			clearTimeout(itemsTimeoutId);
			if (err instanceof Error && err.name === "AbortError") {
				throw new Error(
					"Timeout: Consulta a article_batch_items fue cancelada por tardar más de 7 segundos",
				);
			}
			throw err;
		}

		if (itemsError)
			throw new Error(`Error obteniendo artículos: ${itemsError.message}`);
		if (!items || items.length === 0)
			throw new Error("No se encontraron artículos para traducir.");

		const totalArticles = items.length;
		console.log(
			`📊 [runTranslationJob] Iniciando traducción de ${totalArticles} artículos para job ${jobId}`,
		);

		await admin
			.from("ai_job_history")
			.update({
				details: {
					batchId,
					total: totalArticles,
					processed: 0,
					step: `Preparado para traducir ${totalArticles} artículos`,
				},
				progress: 5,
			})
			.eq("id", jobId);

		// 2️⃣ VARIABLES PARA TRACKING
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		const translatedArticlesPayload: TranslatedArticlePayload[] = [];
		const MAX_RETRIES_PER_ARTICLE = 2;

		// 3️⃣ PROCESAR CADA ARTÍCULO
		for (let i = 0; i < totalArticles; i++) {
			const item = items[i];
			const article = item.articles;

			if (!article) {
				console.warn(
					`⚠️ [runTranslationJob] Artículo sin datos en item ${item.id}, saltando...`,
				);
				continue;
			}

			console.log(
				`🔄 [runTranslationJob] Traduciendo artículo ${i + 1}/${totalArticles} (ID: ${article.id})`,
			);

			// Actualizar progreso
			const currentProgress = 5 + (i / totalArticles) * 90;
			await admin
				.from("ai_job_history")
				.update({
					progress: Math.round(currentProgress),
					details: {
						batchId,
						total: totalArticles,
						processed: i,
						step: `Traduciendo artículo ${i + 1} de ${totalArticles}...`,
					},
				})
				.eq("id", jobId);

			// Lógica de reintentos
			let success = false;
			let retryCount = 0;
			let lastError = "";

			while (!success && retryCount <= MAX_RETRIES_PER_ARTICLE) {
				try {
					const prompt = buildTranslationPrompt(
						article.title || "",
						article.abstract || "",
					);

					console.log(
						`📤 [runTranslationJob] Enviando prompt a DeepSeek (intento ${retryCount + 1}/${MAX_RETRIES_PER_ARTICLE + 1})`,
					);

					const { result, usage } = await callDeepSeekAPI(
						"deepseek-chat",
						prompt,
					);

					// Acumular tokens
					totalInputTokens += usage?.promptTokenCount || 0;
					totalOutputTokens += usage?.candidatesTokenCount || 0;

					// Parsear respuesta
					const cleanedString = result
						.replace(/`{3}json\n?/, "")
						.replace(/\n?`{3}$/, "");
					const parsedResult = JSON.parse(cleanedString);

					if (
						!parsedResult.translatedTitle ||
						!parsedResult.translatedAbstract
					) {
						throw new Error(
							"El JSON de respuesta no contiene las claves esperadas.",
						);
					}

					// Guardamos la traducción exitosa
					translatedArticlesPayload.push({
						articleId: article.id,
						title: parsedResult.translatedTitle,
						abstract: parsedResult.translatedAbstract,
						summary: parsedResult.translatedSummary,
						translated_by: userId,
						translator_system: "deepseek-chat",
					});

					success = true;
					console.log(
						`✅ [runTranslationJob] Artículo ${i + 1} traducido exitosamente`,
					);
				} catch (error) {
					retryCount++;
					lastError =
						error instanceof Error ? error.message : "Error desconocido";
					console.error(
						`❌ [runTranslationJob] Error en artículo ${i + 1}, intento ${retryCount}:`,
						lastError,
					);

					if (retryCount > MAX_RETRIES_PER_ARTICLE) {
						// Agotamos reintentos, fallar el job completo
						throw new Error(
							`Artículo ${i + 1} falló después de ${MAX_RETRIES_PER_ARTICLE} reintentos: ${lastError}`,
						);
					}

					// Esperar un poco antes de reintentar
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			}
		}

		// 4️⃣ GUARDAR TRADUCCIONES EN BASE DE DATOS
		console.log(
			`💾 [runTranslationJob] Guardando ${translatedArticlesPayload.length} traducciones en BD`,
		);

		await admin
			.from("ai_job_history")
			.update({
				progress: 95,
				details: {
					batchId,
					total: totalArticles,
					processed: totalArticles,
					step: "Guardando traducciones en base de datos...",
				},
			})
			.eq("id", jobId);

		const saveResult = await saveBatchTranslations(
			batchId,
			translatedArticlesPayload,
		);

		if (!saveResult.success) {
			throw new Error(
				saveResult.error || "Error desconocido al guardar traducciones.",
			);
		}

		console.log(`✅ [runTranslationJob] Traducciones guardadas exitosamente`);

		// 🔍 LOG CRÍTICO: Verificar status del batch DESPUÉS de saveBatchTranslations
		const { data: batchCheck } = await admin
			.from("article_batches")
			.select("id, batch_number, status, translation_complete")
			.eq("id", batchId)
			.single();

		console.log(
			`📊 [runTranslationJob] Status del batch DESPUÉS de saveBatchTranslations:`,
			{
				batchId,
				batch_number: batchCheck?.batch_number,
				status: batchCheck?.status,
				translation_complete: batchCheck?.translation_complete,
				timestamp: new Date().toISOString(),
			},
		);

		// 5️⃣ COMPLETAR JOB CON ÉXITO
		await admin
			.from("ai_job_history")
			.update({
				status: "completed",
				progress: 100,
				completed_at: new Date().toISOString(),
				input_tokens: totalInputTokens,
				output_tokens: totalOutputTokens,
				details: {
					batchId,
					total: totalArticles,
					processed: totalArticles,
					step: "¡Traducción completada exitosamente!",
				},
			})
			.eq("id", jobId);

		console.log(`🎉 [runTranslationJob] Job ${jobId} completado exitosamente`);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		console.error(`❌ [runTranslationJob] Error en job ${jobId}:`, error);
		console.error(
			`🔍 [runTranslationJob] Stack trace:`,
			error instanceof Error ? error.stack : "No disponible",
		);

		// Marcar job como fallido
		try {
			const admin = await createSupabaseServiceRoleClient();
			await admin
				.from("ai_job_history")
				.update({
					status: "failed",
					progress: 100,
					error_message: errorMessage,
					completed_at: new Date().toISOString(),
					details: {
						batchId,
						error: errorMessage,
						step: "Error durante la traducción",
					},
				})
				.eq("id", jobId);

			console.error(`💥 [runTranslationJob] Job ${jobId} marcado como fallido`);
		} catch (adminError) {
			console.error(
				`❌ [runTranslationJob] Error al marcar job como fallido:`,
				adminError,
			);
		}
	}
}

// ========================================================================
//	ACCIÓN: getPreclassifiedArticlesForAnalysis
//	Obtiene todos los artículos con datos de preclasificación para análisis
// ========================================================================

export interface PreclassifiedArticleForAnalysis {
	item_id: string; // 🎯 ID del article_batch_items (necesario para notas)
	article_id: string;
	correlativo: number | null;
	title: string | null;
	abstract: string | null;
	authors: string[] | null;
	publication_year: number | null;
	journal: string | null;
	translated_title: string | null;
	translated_abstract: string | null;
	translation_summary: string | null;
	batch_number: number | null;
	batch_name: string | null;
	batch_status: Database["public"]["Enums"]["batch_preclass_status"] | null;
	item_status: Database["public"]["Enums"]["batch_preclass_status"] | null;
	// Clasificaciones por dimensión: { dimension_id: { value, confidence, rationale, iteration } }
	classifications: Record<
		string,
		{
			dimension_name: string;
			value: string | null;
			confidence: number | null;
			rationale: string | null;
			iteration: number | null;
			reviewer_type: "ai" | "human";
		}
	>;
}

export interface PreclassifiedArticlesAnalysisResult {
	articles: PreclassifiedArticleForAnalysis[];
	dimensions: {
		id: string;
		name: string;
		type: string;
		icon: string | null;
		options: {
			value: string;
			emoticon: string | null;
		}[];
	}[];
	totalCount: number;
	currentPage: number;
	totalPages: number;
}

/**
 * Obtiene TODOS los artículos preclasificados sin paginación
 * Útil para exportaciones CSV
 */
export async function getAllPreclassifiedArticlesForAnalysis(
	projectId: string,
	phaseId: string,
): Promise<ResultadoOperacion<PreclassifiedArticlesAnalysisResult>> {
	if (!projectId || !phaseId) {
		return { success: false, error: "Se requiere projectId y phaseId." };
	}

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener dimensiones de la fase con opciones
		const { data: dimensions, error: dimError } = await supabase
			.from("preclass_dimensions")
			.select(
				`
                id, 
                name, 
                type, 
                icon,
                preclass_dimension_options (
                    value,
                    emoticon,
                    ordering
                )
            `,
			)
			.eq("phase_id", phaseId)
			.eq("status", "active")
			.order("ordering");

		if (dimError)
			throw new Error(`Error obteniendo dimensiones: ${dimError.message}`);

		// Formatear dimensiones con opciones ordenadas
		const dimensionsData = (dimensions || []).map((dim) => ({
			id: dim.id,
			name: dim.name,
			type: dim.type,
			icon: dim.icon,
			options: (dim.preclass_dimension_options || [])
				.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))
				.map((opt) => ({
					value: opt.value.trim(),
					emoticon: opt.emoticon,
				})),
		}));
		const dimensionIds = dimensionsData.map((d) => d.id);

		// 2. Obtener todos los article_batch_items SIN PAGINACIÓN
		const { data: batchesInPhase, error: batchesError } = await supabase
			.from("article_batches")
			.select("id")
			.eq("phase_id", phaseId);

		if (batchesError)
			throw new Error(`Error obteniendo lotes: ${batchesError.message}`);

		const batchIds = (batchesInPhase || []).map((b) => b.id);
		if (batchIds.length === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: dimensionsData,
					totalCount: 0,
					currentPage: 1,
					totalPages: 0,
				},
			};
		}

		// Obtener TODOS los items con paginación automática
		console.log(
			"[getAllPreclassifiedArticlesForAnalysis] 🔄 Obteniendo items de lotes (con paginación)...",
		);
		let allItems: Record<string, unknown>[] = [];
		let page = 0;
		const pageSize = 1000; // Supabase default limit
		let hasMoreItems = true;

		while (hasMoreItems) {
			const { data: itemsPage, error: itemsError } = await supabase
				.from("article_batch_items")
				.select(
					`
                    id,
                    batch_id,
                    status,
                    articles!inner (
                        id,
                        title,
                        abstract,
                        authors,
                        publication_year,
                        journal,
                        correlativo,
                        article_translations (
                            title,
                            abstract,
                            summary
                        )
                    ),
                    article_batches!inner (
                        batch_number,
                        name,
                        status
                    )
                `,
				)
				.in("batch_id", batchIds)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (itemsError)
				throw new Error(
					`Error obteniendo items (página ${page}): ${itemsError.message}`,
				);

			if (itemsPage && itemsPage.length > 0) {
				allItems = allItems.concat(itemsPage);
				console.log(
					`[getAllPreclassifiedArticlesForAnalysis] ✓ Página ${page + 1}: ${itemsPage.length} items (Total acumulado: ${allItems.length})`,
				);

				// Si obtuvimos menos del tamaño de página, ya no hay más
				if (itemsPage.length < pageSize) {
					hasMoreItems = false;
				} else {
					page++;
				}
			} else {
				hasMoreItems = false;
			}
		}

		console.log(
			`[getAllPreclassifiedArticlesForAnalysis] 🎯 Total items obtenidos: ${allItems.length}`,
		);

		const items = allItems;
		if (!items || items.length === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: dimensionsData,
					totalCount: 0,
					currentPage: 1,
					totalPages: 0,
				},
			};
		}

		const itemIds = items.map((i) => i.id) as string[];

		// 3. Obtener clasificaciones con paginación automática
		console.log(
			"[getAllPreclassifiedArticlesForAnalysis] 🔄 Obteniendo clasificaciones (con paginación)...",
		);
		let allReviews: Record<string, unknown>[] = [];
		let reviewPage = 0;
		const reviewPageSize = 1000;
		let hasMoreReviews = true;

		while (hasMoreReviews) {
			const { data: reviewsPage, error: reviewsError } = await supabase
				.from("article_dimension_reviews")
				.select("*")
				.in("article_batch_item_id", itemIds)
				.in("dimension_id", dimensionIds as string[])
				.order("iteration", { ascending: false })
				.range(
					reviewPage * reviewPageSize,
					(reviewPage + 1) * reviewPageSize - 1,
				);

			if (reviewsError)
				throw new Error(
					`Error obteniendo clasificaciones (página ${reviewPage}): ${reviewsError.message}`,
				);

			if (reviewsPage && reviewsPage.length > 0) {
				allReviews = allReviews.concat(reviewsPage);
				console.log(
					`[getAllPreclassifiedArticlesForAnalysis] ✓ Página ${reviewPage + 1}: ${reviewsPage.length} reviews (Total acumulado: ${allReviews.length})`,
				);

				if (reviewsPage.length < reviewPageSize) {
					hasMoreReviews = false;
				} else {
					reviewPage++;
				}
			} else {
				hasMoreReviews = false;
			}
		}

		console.log(
			`[getAllPreclassifiedArticlesForAnalysis] 🎯 Total clasificaciones obtenidas: ${allReviews.length}`,
		);
		const reviews = allReviews;

		const reviewsByItemAndDimension: Record<
			string,
			Record<string, (typeof reviews)[0]>
		> = {};
		(reviews || []).forEach((review) => {
			const itemId = review.article_batch_item_id as string;
			const dimId = review.dimension_id as string;
			if (!reviewsByItemAndDimension[itemId]) {
				reviewsByItemAndDimension[itemId] = {};
			}
			if (!reviewsByItemAndDimension[itemId][dimId]) {
				reviewsByItemAndDimension[itemId][dimId] = review;
			}
		});

		// 4. Construir resultado y ordenar por article_number
		const articlesFormatted: PreclassifiedArticleForAnalysis[] = items
			.map((item) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const article = item.articles as any;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const batch = item.article_batches as any;
				const translation =
					(
						Array.isArray(article.article_translations) &&
						article.article_translations.length > 0
					) ?
						article.article_translations[0]
					:	null;

				const classifications: Record<
					string,
					{
						dimension_name: string;
						value: string | null;
						confidence: number | null;
						rationale: string | null;
						iteration: number | null;
						reviewer_type: "ai" | "human";
					}
				> = {};

				const reviewsForItem =
					reviewsByItemAndDimension[item.id as string] || {};
				Object.entries(reviewsForItem).forEach(([dimId, review]) => {
					const dimension = dimensionsData.find((d) => d.id === dimId);
					const reviewTyped = review as any;
					classifications[dimId] = {
						dimension_name: dimension?.name || "Desconocida",
						value: (reviewTyped.classification_value || "").trim(),
						confidence: reviewTyped.confidence_score,
						rationale: reviewTyped.rationale,
						iteration: reviewTyped.iteration,
						reviewer_type: reviewTyped.reviewer_type as "ai" | "human",
					};
				});

				return {
					item_id: item.id,
					article_id: article.id,
					correlativo: article.correlativo || null,
					title: article.title,
					abstract: article.abstract,
					translated_title: translation?.title || null,
					translated_abstract: translation?.abstract || null,
					translation_summary: translation?.summary || null,
					item_status: item.status || null,
					authors: article.authors || [],
					publication_year: article.publication_year,
					journal: article.journal,
					batch_number: batch?.batch_number || null,
					batch_name: batch?.name || null,
					batch_status: batch?.status || null,
					classifications,
				} as PreclassifiedArticleForAnalysis;
			})
			.sort((a, b) => {
				// Ordenar por correlativo
				if (a.correlativo === null) return 1;
				if (b.correlativo === null) return -1;
				return a.correlativo - b.correlativo;
			});

		return {
			success: true,
			data: {
				articles: articlesFormatted,
				dimensions: dimensionsData,
				totalCount: articlesFormatted.length,
				currentPage: 1,
				totalPages: 1,
			},
		};
	} catch (error) {
		console.error("[getAllPreclassifiedArticlesForAnalysis] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Error desconocido al obtener artículos",
		};
	}
}

/**
 * Obtiene dimensiones de una o múltiples fases para análisis
 * Soporta filtrado opcional por IDs de dimensiones específicas
 */
export async function getDimensionsForAnalysis(params: {
	projectId: string;
	phaseIds: string[];
	dimensionIds?: string[];
}): Promise<
	ResultadoOperacion<{
		dimensionsByPhase: Record<
			string,
			Array<{
				id: string;
				name: string;
				type: string;
				icon: string | null;
				phase_id: string;
				phase_name: string;
				phase_number: number;
				options: Array<{ value: string; emoticon: string | null }>;
			}>
		>;
		allDimensions: Array<{
			id: string;
			name: string;
			type: string;
			icon: string | null;
			phase_id: string;
			phase_name: string;
			phase_number: number;
			options: Array<{ value: string; emoticon: string | null }>;
		}>;
	}>
> {
	if (!params.projectId || !params.phaseIds || params.phaseIds.length === 0) {
		return {
			success: false,
			error: "Se requiere projectId y al menos un phaseId.",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();

		// Construir query base
		let query = supabase
			.from("preclass_dimensions")
			.select(
				`
                id, 
                name, 
                type, 
                icon,
                phase_id,
                ordering,
                preclassification_phases!inner (
                    id,
                    name,
                    phase_number
                ),
                preclass_dimension_options (
                    value,
                    emoticon,
                    ordering
                )
            `,
			)
			.in("phase_id", params.phaseIds)
			.eq("status", "active")
			.order("ordering");

		// Filtrar por dimensiones específicas si se proveen
		if (params.dimensionIds && params.dimensionIds.length > 0) {
			query = query.in("id", params.dimensionIds);
		}

		const { data: dimensions, error: dimError } = await query;

		if (dimError) {
			return {
				success: false,
				error: `Error obteniendo dimensiones: ${dimError.message}`,
			};
		}

		// Formatear dimensiones con información de fase
		const formattedDimensions = (dimensions || []).map((dim) => ({
			id: dim.id,
			name: dim.name,
			type: dim.type,
			icon: dim.icon,
			phase_id: dim.phase_id || "",
			phase_name: String(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(dim.preclassification_phases as any)?.name || "Sin nombre",
			),
			phase_number: Number(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(dim.preclassification_phases as any)?.phase_number || 0,
			),
			options: (dim.preclass_dimension_options || [])
				.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))
				.map((opt) => ({
					value: opt.value.trim(),
					emoticon: opt.emoticon,
				})),
		}));

		// Agrupar por fase
		const dimensionsByPhase: Record<string, typeof formattedDimensions> = {};
		formattedDimensions.forEach((dim) => {
			if (!dimensionsByPhase[dim.phase_id]) {
				dimensionsByPhase[dim.phase_id] = [];
			}
			dimensionsByPhase[dim.phase_id].push(dim);
		});

		return {
			success: true,
			data: {
				dimensionsByPhase,
				allDimensions: formattedDimensions,
			},
		};
	} catch (error: unknown) {
		console.error("Error en getDimensionsForAnalysis:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

/**
 * 🔧 FUNCIÓN AUXILIAR: Filtra artículos usando solo reviews (sin cargar artículos completos)
 * Maneja filtros de dimensión (include/exclude) y confianza
 * Maneja valores "Otros: [descripción]" creados por LLM
 *
 * 🎯 CRÍTICO: Trabaja a nivel de ARTICLE_ID (no batch_item_id) para que filtros
 * de diferentes fases se intersecten correctamente.
 * Un artículo puede tener batch_items diferentes en cada fase, y las reviews
 * de cada dimensión están asociadas al batch_item de su fase correspondiente.
 */
async function getFilteredArticleIds(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	batchIds: string[],
	dimensionFilters: Record<string, Record<string, "include" | "exclude">>,
	confidenceFilters?: number[],
): Promise<string[]> {
	// 1. Obtener todos los batch_items CON article_id
	const { data: allItems } = await supabase
		.from("article_batch_items")
		.select("id, article_id")
		.in("batch_id", batchIds);

	if (!allItems || allItems.length === 0) return [];

	// 2. Construir mapa article_id → [batch_item_ids]
	// Esto es ESENCIAL para buscar reviews en TODAS las fases de un artículo
	const articleToBatchItems = new Map<string, string[]>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	allItems.forEach((item: any) => {
		const list = articleToBatchItems.get(item.article_id) || [];
		list.push(item.id);
		articleToBatchItems.set(item.article_id, list);
	});

	// 3. Comenzar con TODOS los article_ids como candidatos
	let candidateArticleIds = new Set(articleToBatchItems.keys());

	console.log(
		`🔍 [getFilteredArticleIds] Inicio: ${candidateArticleIds.size} artículos candidatos, ${Object.keys(dimensionFilters).length} filtros de dimensión`,
	);

	// 4. Obtener TODOS los batch_item_ids (para queries de reviews)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const allBatchItemIds = allItems.map((item: any) => item.id as string);

	// 5. Aplicar cada filtro de dimensión secuencialmente (AND lógico a nivel de ARTÍCULO)
	for (const [dimensionId, filterMap] of Object.entries(dimensionFilters)) {
		const includeValues = Object.entries(filterMap)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.filter(([_, mode]) => mode === "include")
			.map(([val]) => val);
		const excludeValues = Object.entries(filterMap)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.filter(([_, mode]) => mode === "exclude")
			.map(([val]) => val);

		if (includeValues.length === 0 && excludeValues.length === 0) continue;

		// 5a. Obtener reviews de esta dimensión para TODOS los batch_items (chunked)
		let reviews: Array<{
			article_batch_item_id: string;
			classification_value: string | null;
			confidence_score: number | null;
			iteration: number | null;
		}> = [];
		const FILTER_CHUNK_SIZE = 200;

		for (let ci = 0; ci < allBatchItemIds.length; ci += FILTER_CHUNK_SIZE) {
			const chunk = allBatchItemIds.slice(ci, ci + FILTER_CHUNK_SIZE);
			const { data: chunkReviews } = await supabase
				.from("article_dimension_reviews")
				.select(
					"article_batch_item_id, classification_value, confidence_score, iteration",
				)
				.eq("dimension_id", dimensionId)
				.in("article_batch_item_id", chunk);

			if (chunkReviews) {
				reviews = reviews.concat(chunkReviews);
			}
		}

		// 5b. Construir mapa: article_id → { value, confidence } usando MAX(iteration)
		// entre TODAS las fases del artículo (no por batch_item individual)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const batchItemToArticle = new Map<string, string>();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		allItems.forEach((item: any) => {
			batchItemToArticle.set(item.id, item.article_id);
		});

		const articleData = new Map<
			string,
			{ value: string; confidence: number; iteration: number }
		>();

		reviews.forEach((r) => {
			const articleId = batchItemToArticle.get(r.article_batch_item_id);
			if (!articleId) return;

			const existing = articleData.get(articleId);
			const currentIteration = r.iteration ?? 0;

			// Solo guardar la clasificación con MAX(iteration) para este artículo
			if (!existing || currentIteration > existing.iteration) {
				articleData.set(articleId, {
					value: (r.classification_value || "").trim(),
					confidence: r.confidence_score || 0,
					iteration: currentIteration,
				});
			}
		});

		// 5c. Filtrar artículos candidatos según include/exclude
		const newCandidates = new Set<string>();

		for (const articleId of candidateArticleIds) {
			const data = articleData.get(articleId);

			// Si el artículo NO tiene clasificación en esta dimensión
			if (!data || !data.value) {
				// Con filtros de inclusión → NO pasa (no tiene el valor requerido)
				if (includeValues.length > 0) continue;
				// Solo con filtros de exclusión → SÍ pasa (no tiene el valor excluido)
				if (excludeValues.length > 0) {
					newCandidates.add(articleId);
				}
				continue;
			}

			const value = data.value;
			const isOtherValue = value.toLowerCase().startsWith("otros");

			// Verificar exclusión (tiene prioridad)
			if (excludeValues.length > 0) {
				const shouldExclude = excludeValues.some((val) => {
					if (val === "Otros" && isOtherValue) return true;
					return val === value;
				});
				if (shouldExclude) continue;
			}

			// Verificar inclusión
			if (includeValues.length > 0) {
				const isIncluded = includeValues.some((val) => {
					if (val === "Otros" && isOtherValue) return true;
					return val === value;
				});
				if (!isIncluded) continue;
			}

			// Verificar confianza
			if (confidenceFilters && confidenceFilters.length > 0) {
				if (!confidenceFilters.includes(data.confidence)) continue;
			}

			newCandidates.add(articleId);
		}

		console.log(
			`🔍 [getFilteredArticleIds] Filtro dim=${dimensionId.substring(0, 8)}...: ${candidateArticleIds.size} → ${newCandidates.size} artículos (include=[${includeValues.join(",")}], exclude=[${excludeValues.join(",")}])`,
		);

		candidateArticleIds = newCandidates;

		// Early exit si no quedan candidatos
		if (candidateArticleIds.size === 0) break;
	}

	// 6. Expandir artículos filtrados a TODOS sus batch_items (todas las fases)
	const expandedItemIds: string[] = [];
	for (const articleId of candidateArticleIds) {
		const batchItemIds = articleToBatchItems.get(articleId);
		if (batchItemIds) {
			expandedItemIds.push(...batchItemIds);
		}
	}

	console.log(
		`🔍 [getFilteredArticleIds] Resultado: ${candidateArticleIds.size} artículos → ${expandedItemIds.length} batch_items expandidos`,
	);

	return expandedItemIds;
}

/**
 * 🔧 FUNCIÓN AUXILIAR: Obtiene todos los item_ids de los batches
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAllItemIds(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	batchIds: string[],
): Promise<string[]> {
	const { data: items } = await supabase
		.from("article_batch_items")
		.select("id")
		.in("batch_id", batchIds);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return items?.map((item: any) => item.id) || [];
}

/**
 * 🔧 FUNCIÓN AUXILIAR: Obtiene todos los item_ids CON article_id para deduplicación multifase
 */
async function getAllItemIdsWithArticleId(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	batchIds: string[],
): Promise<Array<{ id: string; article_id: string }>> {
	let allItems: Array<{ id: string; article_id: string }> = [];
	const pageSize = 1000;
	let page = 0;

	while (true) {
		const { data: items } = await supabase
			.from("article_batch_items")
			.select("id, article_id")
			.in("batch_id", batchIds)
			.range(page * pageSize, (page + 1) * pageSize - 1);

		if (!items || items.length === 0) break;
		allItems = allItems.concat(items);
		if (items.length < pageSize) break;
		page++;
	}

	return allItems;
}

/**
 * 🔧 FUNCIÓN AUXILIAR: Obtiene reviews en chunks para evitar límite de URL con .in()
 * Supabase/PostgREST tiene un límite de tamaño de URL (~8KB).
 * Con 500+ UUIDs en .in(), el URL excede el límite y falla con "fetch failed".
 */
async function getReviewsInChunks(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	itemIds: string[],
	dimensionIds: string[],
): Promise<
	Array<{
		dimension_id: string;
		classification_value: string | null;
		article_batch_item_id: string;
		iteration: number | null;
	}>
> {
	const CHUNK_SIZE = 200;
	let allReviews: Array<{
		dimension_id: string;
		classification_value: string | null;
		article_batch_item_id: string;
		iteration: number | null;
	}> = [];

	for (
		let chunkStart = 0;
		chunkStart < itemIds.length;
		chunkStart += CHUNK_SIZE
	) {
		const itemIdsChunk = itemIds.slice(chunkStart, chunkStart + CHUNK_SIZE);
		const pageSize = 1000;
		let page = 0;
		let hasMore = true;

		while (hasMore) {
			const { data: pageData, error: pageError } = await supabase
				.from("article_dimension_reviews")
				.select(
					"dimension_id, classification_value, article_batch_item_id, iteration",
				)
				.in("dimension_id", dimensionIds)
				.in("article_batch_item_id", itemIdsChunk)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (pageError) {
				console.error(
					`Error al obtener reviews (chunk ${Math.floor(chunkStart / CHUNK_SIZE)}, página ${page}):`,
					pageError,
				);
				throw new Error("Error al obtener estadísticas de clasificación");
			}

			if (pageData && pageData.length > 0) {
				allReviews = allReviews.concat(pageData);
				hasMore = pageData.length === pageSize;
				page++;
			} else {
				hasMore = false;
			}
		}
	}

	console.log(
		`📊 [getReviewsInChunks] Total reviews: ${allReviews.length} (${Math.ceil(itemIds.length / CHUNK_SIZE)} chunks)`,
	);
	return allReviews;
}

/**
 * ⚡ NUEVA: Obtiene estadísticas agregadas CON FILTROS aplicados
 * Filtra usando solo reviews (sin cargar artículos completos) - EFICIENTE
 * Maneja valores "Otros: [descripción]" creados por LLM
 */
export async function getDimensionStatisticsFiltered(params: {
	projectId: string;
	phaseIds: string[];
	dimensionIds?: string[];
	filters?: {
		dimensionFilters?: Record<string, Record<string, "include" | "exclude">>;
		confidenceFilters?: number[];
	};
}): Promise<
	ResultadoOperacion<{
		dimensions: Array<{
			id: string;
			name: string;
			type: string;
			icon: string | null;
			phase_id: string;
			phase_name: string;
			phase_number: number;
			options: Array<{ value: string; emoticon: string | null }>;
			statistics: {
				total_articles: number;
				classified_count: number;
				by_option: Record<string, number>;
			};
		}>;
		totalArticles: number;
		totalUniverseArticles: number;
	}>
> {
	const { projectId, phaseIds, dimensionIds, filters } = params;

	if (!projectId || !phaseIds || phaseIds.length === 0) {
		return {
			success: false,
			error: "Se requiere projectId y al menos un phaseId.",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();

		// 🎯 FILTRO DE FASES VÁLIDAS: excluir fases anuladas o inactivas
		const { data: validPhases } = await supabase
			.from("preclassification_phases")
			.select("id")
			.in("id", phaseIds)
			.in("status", ["active", "completed", "planning"]);

		const validPhaseIds = validPhases?.map((p) => p.id) || [];
		if (validPhaseIds.length === 0) {
			return {
				success: true,
				data: {
					dimensions: [],
					totalArticles: 0,
					totalUniverseArticles: 0,
				},
			};
		}

		console.log(
			`📊 [getDimensionStatisticsFiltered] Fases válidas: ${validPhaseIds.length} de ${phaseIds.length}`,
		);

		// 1. Obtener dimensiones con metadata (igual que getDimensionStatisticsMultiphase)
		let dimQuery = supabase
			.from("preclass_dimensions")
			.select(
				`
                id, 
                name, 
                type, 
                icon,
                phase_id,
                ordering,
                preclassification_phases!inner (
                    id,
                    name,
                    phase_number
                ),
                preclass_dimension_options (
                    value,
                    emoticon,
                    ordering
                )
            `,
			)
			.in("phase_id", validPhaseIds)
			.eq("status", "active")
			.order("ordering");

		if (dimensionIds && dimensionIds.length > 0) {
			dimQuery = dimQuery.in("id", dimensionIds);
		}

		const { data: dimensions, error: dimError } = await dimQuery;

		if (dimError) {
			return {
				success: false,
				error: `Error obteniendo dimensiones: ${dimError.message}`,
			};
		}

		const allDimensions = (dimensions || []).map((dim) => ({
			id: dim.id,
			name: dim.name,
			type: dim.type,
			icon: dim.icon,
			phase_id: dim.phase_id || "",
			phase_name: String(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(dim.preclassification_phases as any)?.name || "Sin nombre",
			),
			phase_number: Number(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(dim.preclassification_phases as any)?.phase_number || 0,
			),
			options: (dim.preclass_dimension_options || [])
				.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))
				.map((opt) => ({
					value: opt.value.trim(),
					emoticon: opt.emoticon,
				})),
		}));

		const finalDimensionIds = allDimensions.map((d) => d.id);

		// 2. Obtener batches de las fases seleccionadas
		const { data: batchesInPhases, error: batchesError } = await supabase
			.from("article_batches")
			.select("id")
			.in("phase_id", validPhaseIds);

		if (batchesError || !batchesInPhases) {
			return {
				success: false,
				error: "Error al obtener lotes de las fases",
			};
		}

		const batchIds = batchesInPhases.map((b) => b.id);

		if (batchIds.length === 0) {
			return {
				success: true,
				data: {
					dimensions: allDimensions.map((dim) => ({
						...dim,
						statistics: {
							total_articles: 0,
							classified_count: 0,
							by_option: {},
						},
					})),
					totalArticles: 0,
					totalUniverseArticles: 0,
				},
			};
		}

		// 3. 🎯 FILTRADO: Obtener item_ids filtrados o todos
		let itemIdsToUse: string[];

		const hasFilters =
			(filters?.dimensionFilters &&
				Object.keys(filters.dimensionFilters).length > 0) ||
			(filters?.confidenceFilters && filters.confidenceFilters.length > 0);

		// 🎯 UNIVERSO TOTAL DEL PROYECTO: obtener TODOS los batches del proyecto (todas las fases)
		// para calcular el verdadero universo total, independiente de las fases seleccionadas
		const { data: allProjectPhases } = await supabase
			.from("preclassification_phases")
			.select("id")
			.eq("project_id", projectId)
			.in("status", ["active", "completed", "planning"]);
		const allProjectPhaseIds = allProjectPhases?.map((p) => p.id) || [];
		const { data: allProjectBatches } = await supabase
			.from("article_batches")
			.select("id")
			.in("phase_id", allProjectPhaseIds);
		const allProjectBatchIds = allProjectBatches?.map((b) => b.id) || [];

		const allItemsForUniverse = await getAllItemIdsWithArticleId(
			supabase,
			batchIds,
		);
		// Universo total = artículos únicos en TODOS los batches del proyecto
		const allProjectItems =
			allProjectBatchIds.length > 0 ?
				await getAllItemIdsWithArticleId(supabase, allProjectBatchIds)
			:	allItemsForUniverse;
		const totalUniverseArticles = new Set(
			allProjectItems.map((i) => i.article_id),
		).size;

		if (hasFilters && filters) {
			// ✅ Con filtros: obtener solo item_ids que cumplen (EFICIENTE - sin cargar artículos)
			console.log(
				"🔍 [getDimensionStatisticsFiltered] Aplicando filtros:",
				filters.dimensionFilters,
			);
			const filteredItemIds = await getFilteredArticleIds(
				supabase,
				batchIds,
				filters.dimensionFilters || {},
				filters.confidenceFilters,
			);
			console.log(
				"📊 [getDimensionStatisticsFiltered] Items filtrados:",
				filteredItemIds.length,
			);

			// 🎯 getFilteredArticleIds ya retorna batch_items expandidos a nivel de artículo
			// (filtra a nivel de artículo, luego expande a todos los batch_items de esos artículos)
			itemIdsToUse = filteredItemIds;

			// Calcular artículos únicos para el conteo
			const filteredArticleIdSet = new Set(
				allItemsForUniverse
					.filter((i) => filteredItemIds.includes(i.id))
					.map((i) => i.article_id),
			);

			console.log(
				`📊 [getDimensionStatisticsFiltered] Items filtrados: ${itemIdsToUse.length} batch_items, ${filteredArticleIdSet.size} artículos únicos`,
			);
		} else {
			// Sin filtros: obtener todos los item_ids
			itemIdsToUse = allItemsForUniverse.map((i) => i.id);
		}

		// Deduplicar por article_id para contar artículos únicos filtrados
		const filteredItemsWithArticleId = allItemsForUniverse.filter((i) =>
			itemIdsToUse.includes(i.id),
		);
		const uniqueFilteredArticleIds = new Set(
			filteredItemsWithArticleId.map((i) => i.article_id),
		);
		const totalArticles =
			hasFilters ? uniqueFilteredArticleIds.size : totalUniverseArticles;

		if (itemIdsToUse.length === 0) {
			return {
				success: true,
				data: {
					dimensions: allDimensions.map((dim) => ({
						...dim,
						statistics: {
							total_articles: 0,
							classified_count: 0,
							by_option: {},
						},
					})),
					totalArticles: 0,
					totalUniverseArticles: totalUniverseArticles,
				},
			};
		}

		// 4. Obtener estadísticas solo de los artículos filtrados (chunked para multifase)
		let allReviews: Array<{
			dimension_id: string;
			classification_value: string | null;
			article_batch_item_id: string;
			iteration: number | null;
		}>;

		try {
			allReviews = await getReviewsInChunks(
				supabase,
				itemIdsToUse,
				finalDimensionIds,
			);
		} catch (_err) {
			return {
				success: false,
				error: "Error al obtener estadísticas de clasificación",
			};
		}

		// Filtrar solo la review con MAX(iteration) por cada (article_batch_item_id, dimension_id)
		const latestReviewsMap = new Map<string, (typeof allReviews)[0]>();

		allReviews.forEach((review) => {
			const key = `${review.article_batch_item_id}_${review.dimension_id}`;
			const existing = latestReviewsMap.get(key);

			if (!existing || (review.iteration ?? 0) > (existing.iteration ?? 0)) {
				latestReviewsMap.set(key, review);
			}
		});

		const reviewStats = Array.from(latestReviewsMap.values());

		// 5. Procesar estadísticas por dimensión
		const dimensionsWithStats = allDimensions.map((dim) => {
			const dimReviews =
				reviewStats?.filter((r) => r.dimension_id === dim.id) || [];

			// .trim() + agrupar "Otros:" en una sola categoría
			const byOption: Record<string, number> = {};
			dimReviews.forEach((review) => {
				const option = (review.classification_value || "Sin clasificar").trim();
				if (option.toLowerCase().startsWith("otros")) {
					byOption["Otros"] = (byOption["Otros"] || 0) + 1;
				} else {
					byOption[option] = (byOption[option] || 0) + 1;
				}
			});

			return {
				...dim,
				statistics: {
					total_articles: totalArticles,
					classified_count: dimReviews.length,
					by_option: byOption,
				},
			};
		});

		return {
			success: true,
			data: {
				dimensions: dimensionsWithStats,
				totalArticles,
				totalUniverseArticles,
			},
		};
	} catch (error: unknown) {
		console.error("Error en getDimensionStatisticsFiltered:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

/**
 * Obtiene SOLO estadísticas agregadas por dimensión (sin artículos detallados)
 * Optimizado para carga inicial y gráficos - mucho más rápido
 */
export async function getDimensionStatisticsMultiphase(params: {
	projectId: string;
	phaseIds: string[];
	dimensionIds?: string[];
}): Promise<
	ResultadoOperacion<{
		dimensions: Array<{
			id: string;
			name: string;
			type: string;
			icon: string | null;
			phase_id: string;
			phase_name: string;
			phase_number: number;
			options: Array<{ value: string; emoticon: string | null }>;
			statistics: {
				total_articles: number;
				classified_count: number;
				by_option: Record<string, number>;
			};
		}>;
		totalArticles: number;
		totalUniverseArticles: number;
	}>
> {
	const { projectId, phaseIds, dimensionIds } = params;

	if (!projectId || !phaseIds || phaseIds.length === 0) {
		return {
			success: false,
			error: "Se requiere projectId y al menos un phaseId.",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();

		// 🎯 FILTRO DE FASES VÁLIDAS: excluir fases anuladas o inactivas
		const { data: validPhases } = await supabase
			.from("preclassification_phases")
			.select("id")
			.in("id", phaseIds)
			.in("status", ["active", "completed", "planning"]);

		const validPhaseIds = validPhases?.map((p) => p.id) || [];
		if (validPhaseIds.length === 0) {
			return {
				success: true,
				data: {
					dimensions: [],
					totalArticles: 0,
					totalUniverseArticles: 0,
				},
			};
		}

		console.log(
			`📊 [getDimensionStatisticsMultiphase] Fases válidas: ${validPhaseIds.length} de ${phaseIds.length}`,
		);

		// 1. Obtener dimensiones con metadata (inline para evitar fetch entre server actions)
		let dimQuery = supabase
			.from("preclass_dimensions")
			.select(
				`
                id, 
                name, 
                type, 
                icon,
                phase_id,
                ordering,
                preclassification_phases!inner (
                    id,
                    name,
                    phase_number
                ),
                preclass_dimension_options (
                    value,
                    emoticon,
                    ordering
                )
            `,
			)
			.in("phase_id", validPhaseIds)
			.eq("status", "active")
			.order("ordering");

		// Filtrar por dimensiones específicas si se proveen
		if (dimensionIds && dimensionIds.length > 0) {
			dimQuery = dimQuery.in("id", dimensionIds);
		}

		const { data: dimensions, error: dimError } = await dimQuery;

		if (dimError) {
			return {
				success: false,
				error: `Error obteniendo dimensiones: ${dimError.message}`,
			};
		}

		// Formatear dimensiones con información de fase
		const allDimensions = (dimensions || []).map((dim) => ({
			id: dim.id,
			name: dim.name,
			type: dim.type,
			icon: dim.icon,
			phase_id: dim.phase_id || "",
			phase_name: String(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(dim.preclassification_phases as any)?.name || "Sin nombre",
			),
			phase_number: Number(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(dim.preclassification_phases as any)?.phase_number || 0,
			),
			options: (dim.preclass_dimension_options || [])
				.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))
				.map((opt) => ({
					value: opt.value.trim(),
					emoticon: opt.emoticon,
				})),
		}));

		const finalDimensionIds = allDimensions.map((d) => d.id);

		// 2. Obtener batches de las fases seleccionadas
		const { data: batchesInPhases, error: batchesError } = await supabase
			.from("article_batches")
			.select("id")
			.in("phase_id", validPhaseIds);

		if (batchesError || !batchesInPhases) {
			return {
				success: false,
				error: "Error al obtener lotes de las fases",
			};
		}

		const batchIds = batchesInPhases.map((b) => b.id);

		if (batchIds.length === 0) {
			return {
				success: true,
				data: {
					dimensions: allDimensions.map((dim) => ({
						...dim,
						statistics: {
							total_articles: 0,
							classified_count: 0,
							by_option: {},
						},
					})),
					totalArticles: 0,
					totalUniverseArticles: 0,
				},
			};
		}

		// 3. Obtener items en estos batches CON article_id para deduplicación multifase
		const { data: batchItems, error: itemsError } = await supabase
			.from("article_batch_items")
			.select("id, article_id")
			.in("batch_id", batchIds);

		if (itemsError || !batchItems) {
			return {
				success: false,
				error: "Error al obtener items de los batches",
			};
		}

		const itemIds = batchItems.map((item) => item.id);

		// 🎯 UNIVERSO UNIFICADO: contar artículos ÚNICOS (no items)
		// Un artículo en Fase 1 y Fase 3 se cuenta UNA sola vez
		const uniqueArticleIds = new Set(batchItems.map((item) => item.article_id));
		const totalArticles = uniqueArticleIds.size;

		// 🎯 UNIVERSO TOTAL DEL PROYECTO: obtener TODOS los batches del proyecto (todas las fases)
		// para que el máximo del gráfico sea siempre el universo completo del proyecto
		const { data: allProjPhases } = await supabase
			.from("preclassification_phases")
			.select("id")
			.eq("project_id", projectId)
			.in("status", ["active", "completed", "planning"]);
		const allProjPhaseIds = allProjPhases?.map((p) => p.id) || [];
		const { data: allProjBatches } = await supabase
			.from("article_batches")
			.select("id")
			.in("phase_id", allProjPhaseIds);
		const allProjBatchIds = allProjBatches?.map((b) => b.id) || [];

		let totalUniverseArticles = totalArticles;
		if (allProjBatchIds.length > 0) {
			const { data: allProjItems } = await supabase
				.from("article_batch_items")
				.select("article_id")
				.in("batch_id", allProjBatchIds);
			if (allProjItems) {
				totalUniverseArticles = new Set(allProjItems.map((i) => i.article_id))
					.size;
			}
		}

		console.log(
			`📊 [getDimensionStatisticsMultiphase] Items: ${itemIds.length}, Artículos únicos: ${totalArticles}, Universo total proyecto: ${totalUniverseArticles}`,
		);

		if (itemIds.length === 0) {
			return {
				success: true,
				data: {
					dimensions: allDimensions.map((dim) => ({
						...dim,
						statistics: {
							total_articles: 0,
							classified_count: 0,
							by_option: {},
						},
					})),
					totalArticles: 0,
					totalUniverseArticles,
				},
			};
		}

		// 5. Obtener estadísticas agregadas por dimensión usando query optimizada
		// 🔥 IMPORTANTE: Reviews son append-only, necesitamos solo la iteración más alta por artículo
		console.log("🔍 [getDimensionStatisticsMultiphase] Consultando reviews...");
		console.log("📊 finalDimensionIds:", finalDimensionIds);
		console.log("📊 itemIds count:", itemIds.length);
		console.log("📊 itemIds sample:", itemIds.slice(0, 3));

		// 🎯 Usar helper chunked para evitar límite de URL con muchos itemIds
		let allReviews: Array<{
			dimension_id: string;
			classification_value: string | null;
			article_batch_item_id: string;
			iteration: number | null;
		}>;

		try {
			allReviews = await getReviewsInChunks(
				supabase,
				itemIds,
				finalDimensionIds,
			);
		} catch (_err) {
			return {
				success: false,
				error: "Error al obtener estadísticas de clasificación",
			};
		}

		console.log("📊 Total reviews (todas las iteraciones):", allReviews.length);

		// Filtrar solo la review con MAX(iteration) por cada (article_batch_item_id, dimension_id)
		const latestReviewsMap = new Map<string, (typeof allReviews)[0]>();

		allReviews.forEach((review) => {
			const key = `${review.article_batch_item_id}_${review.dimension_id}`;
			const existing = latestReviewsMap.get(key);

			if (!existing || (review.iteration ?? 0) > (existing.iteration ?? 0)) {
				latestReviewsMap.set(key, review);
			}
		});

		const reviewStats = Array.from(latestReviewsMap.values());
		console.log("📊 Reviews únicas (iteración más alta):", reviewStats.length);
		console.log("📊 reviewStats sample:", reviewStats.slice(0, 5));

		const statsError = null;

		if (statsError) {
			console.error("Error al obtener estadísticas:", statsError);
			return {
				success: false,
				error: "Error al obtener estadísticas de clasificación",
			};
		}

		// 6. Procesar estadísticas por dimensión
		const dimensionsWithStats = allDimensions.map((dim) => {
			const dimReviews =
				reviewStats?.filter((r) => r.dimension_id === dim.id) || [];

			// Contar por opción — .trim() + agrupar "Otros:" en una sola categoría
			const byOption: Record<string, number> = {};
			dimReviews.forEach((review) => {
				const option = (review.classification_value || "Sin clasificar").trim();
				if (option.toLowerCase().startsWith("otros")) {
					byOption["Otros"] = (byOption["Otros"] || 0) + 1;
				} else {
					byOption[option] = (byOption[option] || 0) + 1;
				}
			});

			console.log(
				`📊 [${dim.name}] classified_count: ${dimReviews.length}, options: ${Object.keys(byOption).length}`,
			);

			return {
				...dim,
				statistics: {
					total_articles: totalArticles || 0,
					classified_count: dimReviews.length,
					by_option: byOption,
				},
			};
		});

		return {
			success: true,
			data: {
				dimensions: dimensionsWithStats,
				totalArticles: totalArticles || 0,
				totalUniverseArticles: totalUniverseArticles || totalArticles || 0,
			},
		};
	} catch (error: unknown) {
		console.error("Error en getDimensionStatisticsMultiphase:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

/**
 * Obtiene artículos preclasificados para análisis con soporte multifase
 * Soporta análisis de artículos de múltiples fases simultáneamente
 */
export async function getPreclassifiedArticlesForAnalysisMultiphase(params: {
	projectId: string;
	phaseIds: string[];
	dimensionIds?: string[];
	page?: number;
	limit?: number;
	filters?: {
		dimensionFilters?: Record<string, Record<string, "include" | "exclude">>;
		confidenceFilters?: number[];
	};
}): Promise<ResultadoOperacion<PreclassifiedArticlesAnalysisResult>> {
	const {
		projectId,
		phaseIds,
		dimensionIds,
		page = 1,
		limit = 25,
		filters,
	} = params;

	if (!projectId || !phaseIds || phaseIds.length === 0) {
		return {
			success: false,
			error: "Se requiere projectId y al menos un phaseId.",
		};
	}

	if (page < 1 || limit < 1) {
		return {
			success: false,
			error: "Página y límite deben ser mayores a 0.",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();

		// 🎯 FILTRO DE FASES VÁLIDAS: excluir fases anuladas
		const { data: validPhases } = await supabase
			.from("preclassification_phases")
			.select("id")
			.in("id", phaseIds)
			.in("status", ["active", "completed", "planning"]);

		const validPhaseIds = validPhases?.map((p) => p.id) || [];
		if (validPhaseIds.length === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: [],
					totalCount: 0,
					currentPage: page,
					totalPages: 0,
				},
			};
		}

		// 1. Obtener dimensiones usando la nueva función multifase
		const dimensionsResult = await getDimensionsForAnalysis({
			projectId,
			phaseIds: validPhaseIds,
			dimensionIds,
		});

		if (!dimensionsResult.success || !dimensionsResult.data) {
			return {
				success: false,
				error:
					"error" in dimensionsResult ?
						dimensionsResult.error
					:	"Error obteniendo dimensiones",
			};
		}

		const { allDimensions } = dimensionsResult.data;
		const finalDimensionIds = allDimensions.map((d) => d.id);

		// 2. Obtener todos los lotes de las fases seleccionadas
		const { data: batchesInPhases, error: batchesError } = await supabase
			.from("article_batches")
			.select("id")
			.in("phase_id", validPhaseIds);

		if (batchesError) {
			return {
				success: false,
				error: `Error obteniendo lotes: ${batchesError.message}`,
			};
		}

		const batchIds = (batchesInPhases || []).map((b) => b.id);

		if (batchIds.length === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: allDimensions,
					totalCount: 0,
					currentPage: page,
					totalPages: 0,
				},
			};
		}

		// 3. 🎯 FILTRADO: Obtener item_ids filtrados o todos
		let itemIdsToUse: string[];

		const hasFilters =
			(filters?.dimensionFilters &&
				Object.keys(filters.dimensionFilters).length > 0) ||
			(filters?.confidenceFilters && filters.confidenceFilters.length > 0);

		if (hasFilters && filters) {
			// ✅ Con filtros: obtener solo item_ids que cumplen
			console.log(
				"🔍 [getPreclassifiedArticlesForAnalysisMultiphase] Aplicando filtros a tabla",
			);
			itemIdsToUse = await getFilteredArticleIds(
				supabase,
				batchIds,
				filters.dimensionFilters || {},
				filters.confidenceFilters,
			);
			console.log(
				"📊 [getPreclassifiedArticlesForAnalysisMultiphase] Items filtrados:",
				itemIdsToUse.length,
			);
		} else {
			// Sin filtros: obtener article_ids directamente desde batches (más eficiente)
			const { data: itemsInBatches, error: batchItemsError } = await supabase
				.from("article_batch_items")
				.select("article_id")
				.in("batch_id", batchIds);

			if (batchItemsError) {
				return {
					success: false,
					error: `Error obteniendo items de lotes: ${batchItemsError.message}`,
				};
			}

			// Obtener article_ids únicos directamente
			const uniqueArticleIds = [
				...new Set((itemsInBatches || []).map((i) => i.article_id)),
			];

			const totalCount = uniqueArticleIds.length;
			const totalPages = Math.ceil(totalCount / limit);

			if (totalCount === 0) {
				return {
					success: true,
					data: {
						articles: [],
						dimensions: allDimensions,
						totalCount: 0,
						currentPage: page,
						totalPages: 0,
					},
				};
			}

			// Paginación
			const from = (page - 1) * limit;
			const to = from + limit;
			const paginatedArticleIds = uniqueArticleIds.slice(from, to);

			// 4. Obtener datos de artículos
			const { data: articles, error: articlesError } = await supabase
				.from("articles")
				.select(
					`
                id,
                correlativo,
                title,
                abstract,
                authors,
                publication_year,
                journal
            `,
				)
				.eq("project_id", projectId)
				.in("id", paginatedArticleIds);

			if (articlesError) {
				return {
					success: false,
					error: `Error obteniendo artículos: ${articlesError.message}`,
				};
			}

			// 5. Obtener traducciones
			const { data: translations, error: transError } = await supabase
				.from("article_translations")
				.select("article_id, title, abstract, summary, translated_at")
				.in("article_id", paginatedArticleIds)
				.order("translated_at", { ascending: false });

			if (transError) {
				return {
					success: false,
					error: `Error obteniendo traducciones: ${transError.message}`,
				};
			}

			const latestTranslationByArticle: Record<
				string,
				(typeof translations)[0]
			> = {};
			(translations || []).forEach((t) => {
				if (!latestTranslationByArticle[t.article_id]) {
					latestTranslationByArticle[t.article_id] = t;
				}
			});

			// 6. Obtener batch items
			const { data: batchItems, error: itemsError } = await supabase
				.from("article_batch_items")
				.select(
					"id, article_id, batch_id, status, article_batches(batch_number, name, status)",
				)
				.in("article_id", paginatedArticleIds)
				.in("batch_id", batchIds);

			if (itemsError) {
				return {
					success: false,
					error: `Error obteniendo items de lote: ${itemsError.message}`,
				};
			}

			const batchInfoByArticle: Record<string, (typeof batchItems)[0]> = {};
			(batchItems || []).forEach((item) => {
				batchInfoByArticle[item.article_id] = item;
			});

			// 7. Obtener clasificaciones (solo de dimensiones seleccionadas)
			const { data: allReviews, error: allReviewsError } = await supabase
				.from("article_dimension_reviews")
				.select(
					`
                article_id,
                dimension_id,
                classification_value,
                confidence_score,
                rationale,
                iteration,
                reviewer_type
            `,
				)
				.in("article_id", paginatedArticleIds)
				.in("dimension_id", finalDimensionIds)
				.order("iteration", { ascending: false });

			if (allReviewsError) {
				return {
					success: false,
					error: `Error obteniendo clasificaciones: ${allReviewsError.message}`,
				};
			}

			// Agrupar clasificaciones por artículo y dimensión (última iteración)
			const classificationsByArticle: Record<
				string,
				Record<string, (typeof allReviews)[0]>
			> = {};
			(allReviews || []).forEach((review) => {
				if (!classificationsByArticle[review.article_id]) {
					classificationsByArticle[review.article_id] = {};
				}
				if (!classificationsByArticle[review.article_id][review.dimension_id]) {
					classificationsByArticle[review.article_id][review.dimension_id] =
						review;
				}
			});

			// 8. Construir resultado final
			const result = (articles || []).map((article) => {
				const translation = latestTranslationByArticle[article.id];
				const batchInfo = batchInfoByArticle[article.id];
				const classifications = classificationsByArticle[article.id] || {};

				return {
					item_id: batchInfo?.id || "",
					article_id: article.id,
					correlativo: article.correlativo,
					title: article.title,
					abstract: article.abstract,
					original_title: article.title,
					translated_title: translation?.title || null,
					original_abstract: article.abstract,
					translated_abstract: translation?.abstract || null,
					translation_summary: translation?.summary || null,
					item_status: (batchInfo?.status as any) || null,
					authors: article.authors,
					publication_year: article.publication_year,
					journal: article.journal,
					batch_number:
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(batchInfo?.article_batches as any)?.batch_number || null,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					batch_name: (batchInfo?.article_batches as any)?.name || null,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					batch_status: (batchInfo?.article_batches as any)?.status || null,
					classifications: Object.fromEntries(
						Object.entries(classifications).map(([dimId, review]) => [
							dimId,
							{
								value: (review.classification_value || "").trim(),
								confidence: review.confidence_score,
								rationale: review.rationale,
								iteration: review.iteration,
								reviewer_type: review.reviewer_type,
							},
						]),
					) as any,
				};
			}) as any as PreclassifiedArticleForAnalysis[];

			return {
				success: true,
				data: {
					articles: result as any as PreclassifiedArticleForAnalysis[],
					dimensions: allDimensions,
					totalCount,
					currentPage: page,
					totalPages,
				},
			};
		}

		// 🎯 CON FILTROS: Obtener article_ids de los items filtrados
		const { data: filteredItems, error: filteredItemsError } = await supabase
			.from("article_batch_items")
			.select("article_id")
			.in("id", itemIdsToUse);

		if (filteredItemsError) {
			return {
				success: false,
				error: `Error obteniendo artículos filtrados: ${filteredItemsError.message}`,
			};
		}

		const uniqueArticleIds = [
			...new Set((filteredItems || []).map((i) => i.article_id)),
		];
		const totalCount = uniqueArticleIds.length;
		const totalPages = Math.ceil(totalCount / limit);

		if (totalCount === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: allDimensions,
					totalCount: 0,
					currentPage: page,
					totalPages: 0,
				},
			};
		}

		// Paginación
		const from = (page - 1) * limit;
		const to = from + limit;
		const paginatedArticleIds = uniqueArticleIds.slice(from, to);

		// 4. Obtener datos de artículos
		const { data: articles, error: articlesError } = await supabase
			.from("articles")
			.select(
				`
                id,
                correlativo,
                title,
                abstract,
                authors,
                publication_year,
                journal
            `,
			)
			.eq("project_id", projectId)
			.in("id", paginatedArticleIds);

		if (articlesError) {
			return {
				success: false,
				error: `Error obteniendo artículos: ${articlesError.message}`,
			};
		}

		// 5. Obtener traducciones
		const { data: translations, error: transError } = await supabase
			.from("article_translations")
			.select("article_id, title, abstract, summary, translated_at")
			.in("article_id", paginatedArticleIds)
			.order("translated_at", { ascending: false });

		if (transError) {
			return {
				success: false,
				error: `Error obteniendo traducciones: ${transError.message}`,
			};
		}

		const latestTranslationByArticle: Record<string, (typeof translations)[0]> =
			{};
		(translations || []).forEach((t) => {
			if (!latestTranslationByArticle[t.article_id]) {
				latestTranslationByArticle[t.article_id] = t;
			}
		});

		// 6. Obtener batch items
		const { data: batchItems, error: itemsError } = await supabase
			.from("article_batch_items")
			.select(
				"id, article_id, batch_id, status, article_batches(batch_number, name, status)",
			)
			.in("article_id", paginatedArticleIds)
			.in("batch_id", batchIds);

		if (itemsError) {
			return {
				success: false,
				error: `Error obteniendo items de lote: ${itemsError.message}`,
			};
		}

		const batchInfoByArticle: Record<string, (typeof batchItems)[0]> = {};
		(batchItems || []).forEach((item) => {
			batchInfoByArticle[item.article_id] = item;
		});

		// 7. Obtener clasificaciones (solo de dimensiones seleccionadas)
		const { data: allReviews, error: allReviewsError } = await supabase
			.from("article_dimension_reviews")
			.select(
				`
                article_id,
                dimension_id,
                classification_value,
                confidence_score,
                rationale,
                iteration,
                reviewer_type
            `,
			)
			.in("article_id", paginatedArticleIds)
			.in("dimension_id", finalDimensionIds)
			.order("iteration", { ascending: false });

		if (allReviewsError) {
			return {
				success: false,
				error: `Error obteniendo clasificaciones: ${allReviewsError.message}`,
			};
		}

		// Agrupar clasificaciones por artículo y dimensión (última iteración)
		const classificationsByArticle: Record<
			string,
			Record<string, (typeof allReviews)[0]>
		> = {};
		(allReviews || []).forEach((review) => {
			if (!classificationsByArticle[review.article_id]) {
				classificationsByArticle[review.article_id] = {};
			}
			if (!classificationsByArticle[review.article_id][review.dimension_id]) {
				classificationsByArticle[review.article_id][review.dimension_id] =
					review;
			}
		});

		// 8. Construir resultado final
		const result = (articles || []).map((article) => {
			const translation = latestTranslationByArticle[article.id];
			const batchInfo = batchInfoByArticle[article.id];
			const classifications = classificationsByArticle[article.id] || {};

			return {
				item_id: batchInfo?.id || "",
				article_id: article.id,
				correlativo: article.correlativo,
				title: article.title,
				abstract: article.abstract,
				original_title: article.title,
				translated_title: translation?.title || null,
				original_abstract: article.abstract,
				translated_abstract: translation?.abstract || null,
				translation_summary: translation?.summary || null,
				item_status: (batchInfo?.status as any) || null,
				authors: article.authors,
				publication_year: article.publication_year,
				journal: article.journal,
				batch_number:
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(batchInfo?.article_batches as any)?.batch_number || null,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				batch_name: (batchInfo?.article_batches as any)?.name || null,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				batch_status: (batchInfo?.article_batches as any)?.status || null,
				classifications: Object.fromEntries(
					Object.entries(classifications).map(([dimId, review]) => [
						dimId,
						{
							value: (review.classification_value || "").trim(),
							confidence: review.confidence_score,
							rationale: review.rationale,
							iteration: review.iteration,
							reviewer_type: review.reviewer_type,
						},
					]),
				) as any,
			};
		}) as any as PreclassifiedArticleForAnalysis[];

		return {
			success: true,
			data: {
				articles: result as any as PreclassifiedArticleForAnalysis[],
				dimensions: allDimensions,
				totalCount,
				currentPage: page,
				totalPages,
			},
		};
	} catch (error: unknown) {
		console.error(
			"Error en getPreclassifiedArticlesForAnalysisMultiphase:",
			error,
		);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

export async function getPreclassifiedArticlesForAnalysis(
	projectId: string,
	phaseId: string,
	page: number = 1,
	limit: number = 25,
): Promise<ResultadoOperacion<PreclassifiedArticlesAnalysisResult>> {
	if (!projectId || !phaseId) {
		return { success: false, error: "Se requiere projectId y phaseId." };
	}

	if (page < 1 || limit < 1) {
		return { success: false, error: "Página y límite deben ser mayores a 0." };
	}

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener dimensiones de la fase con opciones
		const { data: dimensions, error: dimError } = await supabase
			.from("preclass_dimensions")
			.select(
				`
                id, 
                name, 
                type, 
                icon,
                preclass_dimension_options (
                    value,
                    emoticon,
                    ordering
                )
            `,
			)
			.eq("phase_id", phaseId)
			.eq("status", "active")
			.order("ordering");

		if (dimError)
			throw new Error(`Error obteniendo dimensiones: ${dimError.message}`);

		// Formatear dimensiones con opciones ordenadas
		const dimensionsData = (dimensions || []).map((dim) => ({
			id: dim.id,
			name: dim.name,
			type: dim.type,
			icon: dim.icon,
			options: (dim.preclass_dimension_options || [])
				.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))
				.map((opt) => ({
					value: opt.value.trim(),
					emoticon: opt.emoticon,
				})),
		}));
		const dimensionIds = dimensionsData.map((d) => d.id);

		// 2. Obtener todos los article_batch_items que tienen clasificaciones en esta fase
		// (los items pertenecen a batches de esta fase)
		const { data: batchesInPhase, error: batchesError } = await supabase
			.from("article_batches")
			.select("id")
			.eq("phase_id", phaseId);

		if (batchesError)
			throw new Error(`Error obteniendo lotes: ${batchesError.message}`);

		const batchIds = (batchesInPhase || []).map((b) => b.id);

		if (batchIds.length === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: dimensionsData,
					totalCount: 0,
					currentPage: page,
					totalPages: 0,
				},
			};
		}

		// 3. Obtener artículos únicos de los lotes de esta fase
		const { data: itemsInBatches, error: batchItemsError } = await supabase
			.from("article_batch_items")
			.select("article_id")
			.in("batch_id", batchIds);

		if (batchItemsError)
			throw new Error(
				`Error obteniendo items de lotes: ${batchItemsError.message}`,
			);

		// Artículos únicos de los lotes de esta fase
		const uniqueArticleIds = [
			...new Set((itemsInBatches || []).map((i) => i.article_id)),
		];

		const totalCount = uniqueArticleIds.length;
		const totalPages = Math.ceil(totalCount / limit);

		if (totalCount === 0) {
			return {
				success: true,
				data: {
					articles: [],
					dimensions: dimensionsData,
					totalCount: 0,
					currentPage: page,
					totalPages: 0,
				},
			};
		}

		// Paginación de artículos
		const from = (page - 1) * limit;
		const to = from + limit;
		const paginatedArticleIds = uniqueArticleIds.slice(from, to);

		// 4. Obtener datos completos de artículos
		const { data: articles, error: articlesError } = await supabase
			.from("articles")
			.select(
				`
                id,
                correlativo,
                title,
                abstract,
                authors,
                publication_year,
                journal
            `,
			)
			.eq("project_id", projectId)
			.in("id", paginatedArticleIds);

		if (articlesError)
			throw new Error(`Error obteniendo artículos: ${articlesError.message}`);

		// 5. Obtener traducciones más recientes
		const { data: translations, error: transError } = await supabase
			.from("article_translations")
			.select("article_id, title, abstract, summary, translated_at")
			.in("article_id", paginatedArticleIds)
			.order("translated_at", { ascending: false });

		if (transError)
			throw new Error(`Error obteniendo traducciones: ${transError.message}`);

		// Mapear última traducción por artículo
		const latestTranslationByArticle: Record<string, (typeof translations)[0]> =
			{};
		(translations || []).forEach((t) => {
			if (!latestTranslationByArticle[t.article_id]) {
				latestTranslationByArticle[t.article_id] = t;
			}
		});

		// 6. Obtener batch items para estos artículos
		const { data: batchItems, error: itemsError } = await supabase
			.from("article_batch_items")
			.select(
				"id, article_id, batch_id, status, article_batches(batch_number, name, status)",
			)
			.in("article_id", paginatedArticleIds)
			.in("batch_id", batchIds);

		if (itemsError)
			throw new Error(`Error obteniendo items de lote: ${itemsError.message}`);

		// Mapear batch info por artículo (tomar el más reciente)
		const batchInfoByArticle: Record<string, (typeof batchItems)[0]> = {};
		(batchItems || []).forEach((item) => {
			batchInfoByArticle[item.article_id] = item;
		});

		// 7. Obtener todas las clasificaciones (última iteración por dimensión)
		const { data: allReviews, error: allReviewsError } = await supabase
			.from("article_dimension_reviews")
			.select(
				`
                article_id,
                dimension_id,
                classification_value,
                confidence_score,
                rationale,
                iteration,
                reviewer_type
            `,
			)
			.in("article_id", paginatedArticleIds)
			.in("dimension_id", dimensionIds)
			.order("iteration", { ascending: false });

		if (allReviewsError)
			throw new Error(
				`Error obteniendo clasificaciones: ${allReviewsError.message}`,
			);

		// Agrupar clasificaciones por artículo y dimensión (última iteración)
		const classificationsByArticle: Record<
			string,
			Record<string, (typeof allReviews)[0]>
		> = {};
		(allReviews || []).forEach((review) => {
			if (!classificationsByArticle[review.article_id]) {
				classificationsByArticle[review.article_id] = {};
			}
			// Solo guardar si no existe o esta iteración es mayor
			const existing =
				classificationsByArticle[review.article_id][review.dimension_id];
			if (!existing || (review.iteration ?? 0) > (existing.iteration ?? 0)) {
				classificationsByArticle[review.article_id][review.dimension_id] =
					review;
			}
		});

		// 8. Construir resultado
		const result = (articles || []).map((article) => {
			const translation = latestTranslationByArticle[article.id];
			const batchInfo = batchInfoByArticle[article.id];
			const classifications = classificationsByArticle[article.id] || {};

			// Mapear clasificaciones a formato esperado
			const classificationsFormatted: Record<
				string,
				{
					dimension_name: string;
					value: string | null;
					confidence: number | null;
					rationale: string | null;
					iteration: number | null;
					reviewer_type: "ai" | "human";
				}
			> = {};
			Object.entries(classifications).forEach(([dimId, review]) => {
				const dimension = dimensionsData.find((d) => d.id === dimId);
				classificationsFormatted[dimId] = {
					dimension_name: dimension?.name || "Desconocida",
					value: (review.classification_value || "").trim(),
					confidence: review.confidence_score,
					rationale: review.rationale,
					iteration: review.iteration,
					reviewer_type: review.reviewer_type as "ai" | "human",
				};
			});

			return {
				item_id: batchInfo?.id || "", // 🎯 ID del article_batch_items (necesario para notas)
				article_id: article.id,
				correlativo: article.correlativo,
				title: article.title,
				abstract: article.abstract,
				authors: article.authors,
				publication_year: article.publication_year,
				journal: article.journal,
				translated_title: translation?.title || null,
				translated_abstract: translation?.abstract || null,
				translation_summary: translation?.summary || null,
				item_status: (batchInfo?.status as string) || null,
				batch_number: batchInfo?.article_batches?.batch_number || null,
				batch_name: batchInfo?.article_batches?.name || null,
				batch_status: batchInfo?.article_batches?.status || null,
				classifications: classificationsFormatted,
			};
		});

		return {
			success: true,
			data: {
				articles: result as any,
				dimensions: dimensionsData,
				totalCount,
				currentPage: page,
				totalPages,
			},
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		return {
			success: false,
			error: `Error interno obteniendo artículos preclasificados: ${errorMessage}`,
		};
	}
}

// ========================================================================
//	SISTEMA DE RECONCILIACIÓN DE DISCREPANCIAS CON IA
// ========================================================================

/**
 * Inicia el proceso de reconciliación de discrepancias en el backend.
 * Retorna inmediatamente con un ID de trabajo para monitoreo vía Realtime.
 */
export async function startDiscrepancyReconciliation(
	batchId: string,
	discrepancies: Array<{ article_batch_item_id: string; dimension_id: string }>,
): Promise<ResultadoOperacion<{ jobId: string }>> {
	console.log(
		`🔄 [startDiscrepancyReconciliation] Iniciando reconciliación para lote: ${batchId}`,
	);
	console.log(
		`📊 [startDiscrepancyReconciliation] Discrepancias a procesar: ${discrepancies.length}`,
	);

	const supabase = await createSupabaseServerClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Usuario no autenticado." };

	const { data: batch, error: batchError } = await supabase
		.from("article_batches")
		.select("*, projects(id, name)")
		.eq("id", batchId)
		.single();

	if (batchError || !batch)
		return { success: false, error: "Lote no encontrado." };

	// Verificar que el lote esté en estado válido para reconciliación
	if (batch.status !== "reconciliation_pending") {
		return {
			success: false,
			error: `El lote debe estar en estado 'reconciliation_pending' para iniciar la reconciliación. Estado actual: ${batch.status}`,
		};
	}

	// Crear cliente autenticado con RLS usando el token del usuario
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return {
			success: false,
			error: "No se pudo obtener el token de sesión para crear el job.",
		};
	}
	const db = createSupabaseUserClient(session.access_token);

	// 🎯 PASO 1: CREAR JOB Y OBTENER UUID REAL DE SUPABASE
	const { data: job, error: jobError } = await db
		.from("ai_job_history")
		.insert({
			project_id: batch.projects!.id,
			user_id: user.id,
			job_type: "RECONCILIATION",
			status: "running",
			description: `Reconciliación de Discrepancias - Lote #${batch.batch_number}`,
			progress: 0,
			details: {
				batchId: batchId,
				discrepancyCount: discrepancies.length,
				total: discrepancies.length,
				processed: 0,
				step: "Iniciando reconciliación...",
			},
		})
		.select("id")
		.single();

	if (jobError || !job) {
		console.error(
			"🚨 [startDiscrepancyReconciliation] Error creando el job:",
			jobError,
		);
		return {
			success: false,
			error: `No se pudo crear el registro del job: ${jobError?.message}`,
		};
	}

	const jobUUID = job.id;
	console.log(
		`✅ [startDiscrepancyReconciliation] Job creado con UUID: ${jobUUID}`,
	);

	// 🔍 PASO 2: VALIDAR SI HAY OTRO JOB RUNNING PARA ESTE LOTE
	const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

	const { data: otherJobs, error: duplicateCheckError } = await db
		.from("ai_job_history")
		.select("id, status, description")
		.eq("job_type", "RECONCILIATION")
		.eq("project_id", batch.projects!.id)
		.eq("status", "running")
		.ilike("description", `%Lote #${batch.batch_number}%`)
		.gte("started_at", twentyMinutesAgo)
		.neq("id", jobUUID);

	if (duplicateCheckError) {
		console.error(
			"🚨 [startDiscrepancyReconciliation] Error verificando duplicados:",
			duplicateCheckError,
		);
	}

	if (otherJobs && otherJobs.length > 0) {
		console.warn(
			`⚠️ [startDiscrepancyReconciliation] Ya existe un trabajo de reconciliación para este lote:`,
			otherJobs,
		);

		// Marcar este job como fallido inmediatamente
		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				progress: 100,
				error_message:
					"Ya existe un trabajo de reconciliación activo para este lote",
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobUUID);

		return {
			success: false,
			error: `Ya existe un trabajo de reconciliación activo para el Lote #${batch.batch_number}. Por favor espera a que termine.`,
		};
	}

	// 🚀 PASO 3: INICIAR TRABAJO EN BACKGROUND (sin await)
	console.log(
		`🚀 [startDiscrepancyReconciliation] Iniciando trabajo en background con UUID: ${jobUUID}`,
	);
	runDiscrepancyReconciliationJob(
		jobUUID,
		batchId,
		user.id,
		discrepancies,
	).catch((error) => {
		console.error(
			`❌ [startDiscrepancyReconciliation] Error no capturado en runJob:`,
			error,
		);
	});

	return { success: true, data: { jobId: jobUUID } };
}

/**
 * Tipos auxiliares para reconciliación
 */
type DimensionForReconciliation = {
	id: string;
	name: string;
	description: string | null;
	type: "finite" | "open";
	preclass_dimension_options: Array<{ id: string; value: string }>;
};

type ArticleDataForReconciliation = {
	id: string;
	title: string | null;
	abstract: string | null;
	journal: string | null;
	publication_year: number | null;
};

type ReviewForReconciliation = {
	iteration: number;
	reviewer_type: "ai" | "human";
	classification_value: string | null;
	confidence_score: number | null;
	rationale: string | null;
};

/**
 * Construye un prompt específico para reconciliación de una discrepancia.
 * Incluye ambas posturas (IA iteración 1 + humano iteración 2) de forma neutral.
 */
function buildReconciliationPrompt(
	project: {
		name: string;
		proposal: string | null;
		proposal_bibliography: string | null;
	},
	dimension: DimensionForReconciliation,
	article: ArticleDataForReconciliation,
	aiReview: ReviewForReconciliation,
	humanReview: ReviewForReconciliation,
): string {
	// Construir sección de opciones para dimensiones finitas
	let optionsSection = "";
	if (dimension.type === "finite") {
		const optionsList = dimension.preclass_dimension_options
			.map((o, i) => `  ${i + 1}. "${o.value}"`)
			.join("\n");
		const hasOtrosOption = dimension.preclass_dimension_options.some((opt) =>
			opt.value.toLowerCase().startsWith("otros"),
		);

		optionsSection = `**Tipo**: Opción Múltiple (debes escoger UNA opción válida)

**Opciones válidas**:
${optionsList}

**CRÍTICO - Reglas de Validación**:
❌ NO inventes nuevas opciones como "Mixto", "Parcial", "Ambos", "Intermedio", etc.
✅ Tu valor final DEBE ser EXACTAMENTE una de las opciones listadas arriba (copia el texto exacto).
✅ Si ninguna opción encaja con la evidencia del artículo, usa: "Otros: [breve descripción]"

**🌊 Protocolo de Emergencia - "Otros"**:
${hasOtrosOption ? '✅ Esta dimensión tiene "Otros" definido explícitamente.' : '⚠️ Esta dimensión NO tiene "Otros" explícito, pero puedes usarlo si la evidencia lo requiere.'}
- NO serás penalizado por usar "Otros" si está justificado en la evidencia.
- Si usas "Otros", tu justificación debe explicar POR QUÉ ninguna opción predefinida encaja.`;
	} else {
		optionsSection = `**Tipo**: Respuesta abierta (1-2 frases concisas)`;
	}

	// Mapear confidence_score a texto
	const mapConfidence = (score: number | null): string => {
		if (score === 3) return "Alta";
		if (score === 2) return "Media";
		if (score === 1) return "Baja";
		return "Desconocida";
	};

	return `### ROL Y CONTEXTO ###
Eres un asistente de investigación experto colaborando en el proyecto: "${project.name}".
**Propósito del Proyecto**: ${project.proposal}
**Objetivo Bibliográfico**: ${project.proposal_bibliography}

### SITUACIÓN ###
Has clasificado previamente un artículo y un investigador colega ha propuesto una perspectiva alternativa. Tu tarea es re-evaluar tu clasificación inicial considerando ambos puntos de vista con total libertad intelectual.

**IMPORTANTE**: No existe jerarquía entre las posturas. La opinión del colega no tiene más peso que la tuya. Es completamente válido y ético que mantengas tu postura original si los datos lo respaldan. También es válido que cambies de opinión si su argumentación te convence, o que propongas una tercera interpretación si identificas algo que ambos pasamos por alto.

### DATOS DEL ARTÍCULO ###
- **Revista**: ${article.journal || "No especificada"}
- **Año**: ${article.publication_year || "No especificado"}
- **Título**: ${article.title || "Sin título"}
- **Abstract**: ${article.abstract || "Sin abstract"}

### DIMENSIÓN DE ANÁLISIS ###
**${dimension.name}**
**Descripción**: ${dimension.description || "Sin descripción"}
${optionsSection}

### TU CLASIFICACIÓN INICIAL (Iteración 1 - IA) ###
- **Valor**: "${aiReview.classification_value}"
- **Confianza**: ${mapConfidence(aiReview.confidence_score)}
- **Justificación**: "${aiReview.rationale}"

### PERSPECTIVA DEL COLEGA (Iteración 2 - Humano) ###
- **Valor Propuesto**: "${humanReview.classification_value}"
- **Confianza**: ${mapConfidence(humanReview.confidence_score)}
- **Argumentación**: "${humanReview.rationale}"

### INSTRUCCIÓN ###
Re-evalúa el artículo considerando ambas perspectivas. Puedes:
1. **Mantener tu postura original** si tus argumentos siguen siendo más sólidos
2. **Adoptar la perspectiva del colega** si su argumentación te convence
3. **Proponer una tercera interpretación** si identificas algo que ambos pasamos por alto

**CRÍTICO**: Tu respuesta debe ser OBLIGATORIAMENTE un objeto JSON válido, sin ningún texto antes o después del bloque JSON. Todas tus justificaciones deben estar en **español**.

**IMPORTANTE - Coherencia entre Confianza y Acuerdo**:

Debes indicar explícitamente si tu clasificación final coincide con la del colega humano:
- Si tu valor final es EXACTAMENTE el mismo que propuso el colega → "agrees_with_human": true
- Si tu valor final es diferente (mantienes tu postura original o propones otra) → "agrees_with_human": false

**CRÍTICO - Regla de Coherencia Lógica**:
❌ NO puedes estar en desacuerdo ("agrees_with_human": false) con confianza "Baja" o "Media"
✅ Si no estás completamente seguro → DEBES aceptar la corrección del humano ("agrees_with_human": true)
✅ Solo mantén tu desacuerdo si tienes confianza "Alta" Y evidencia EXPLÍCITA en el abstract

**Niveles de Confianza**:
- **Alta**: El abstract lo dice EXPLÍCITAMENTE, sin ambigüedad. No hay suposiciones.
- **Media**: No lo dice explícitamente, pero la inferencia es DIRECTA (ej: menciona un protocolo que garantiza X).
- **Baja**: Requiere SUPOSICIONES o EXTRAPOLACIONES. En este caso, acepta la corrección del humano.

**Ejemplo de incoherencia a evitar**:
❌ "agrees_with_human": false, "confidence": "Baja" → Esto es ilógico (no estoy seguro pero insisto en mi error)
✅ "agrees_with_human": true, "confidence": "Media" → Coherente (no estoy 100% seguro, acepto la corrección)
✅ "agrees_with_human": false, "confidence": "Alta" → Coherente (tengo evidencia sólida para mantener mi postura)

**Principio ético**: No somos "palos blancos" de estudios académicos que no sean explícitos. Si el abstract no lo dice claramente, no podemos asumirlo por buena fe o marketing.

Responde en este formato JSON exacto:
\`\`\`json
{
  "value": "TU_CLASIFICACIÓN_FINAL",
  "confidence": "Alta",
  "agrees_with_human": true,
  "rationale": "Justificación en español explicando tu decisión y por qué (máximo 3 oraciones)"
}
\`\`\``;
}

/**
 * Helper que ejecuta el trabajo de reconciliación de discrepancias.
 * Procesa cada discrepancia individualmente, consultando iteración 1 (IA) e iteración 2 (humano).
 */
async function runDiscrepancyReconciliationJob(
	jobId: string,
	batchId: string,
	userId: string,
	discrepancies: Array<{ article_batch_item_id: string; dimension_id: string }>,
) {
	try {
		console.log(`🔑 [${jobId}] Creando cliente de Service Role...`);
		const admin = await createSupabaseServiceRoleClient();
		console.log(`✅ [${jobId}] Cliente de Service Role creado exitosamente`);

		// Obtener datos del lote y proyecto
		const { data: batchData } = await admin
			.from("article_batches")
			.select("phase_id, projects(id, name, proposal, proposal_bibliography)")
			.eq("id", batchId)
			.single();

		if (!batchData?.phase_id || !batchData.projects) {
			throw new Error("Datos del lote o proyecto no encontrados.");
		}

		await admin
			.from("ai_job_history")
			.update({
				details: {
					total: discrepancies.length,
					processed: 0,
					step: "Datos preparados",
				},
			})
			.eq("id", jobId);

		// Array para almacenar clasificaciones exitosas (iteración 3)
		const clasificacionesIteracion3: ReviewInsertWithOptionalFields[] = [];

		// 🛡️ FUNCIÓN ROBUSTA PARA MAPEAR CONFIDENCE_SCORE (reutilizada de preclassificación)
		const mapConfidenceToScore = (confidenceText: string): number => {
			if (typeof confidenceText !== "string") {
				throw new Error(
					`Valor de confianza inválido, se esperaba un string: "${confidenceText}"`,
				);
			}
			const lowerConfidence = confidenceText.toLowerCase();
			switch (lowerConfidence) {
				case "alta":
					return 3;
				case "media":
					return 2;
				case "baja":
					return 1;
				default:
					throw new Error(
						`Valor de confianza no reconocido: "${confidenceText}"`,
					);
			}
		};

		// 🔧 NORMALIZAR STRINGS: Limpiar espacios y caracteres invisibles
		const normalizeString = (str: string) => str.trim().replace(/\s+/g, " ");

		// 🎯 PROCESAR CADA DISCREPANCIA
		let processedCount = 0;

		for (const discrepancy of discrepancies) {
			console.log(
				`\n🔄 [${jobId}] Procesando discrepancia ${processedCount + 1}/${discrepancies.length}`,
			);
			console.log(
				`   📍 Item: ${discrepancy.article_batch_item_id}, Dimensión: ${discrepancy.dimension_id}`,
			);

			try {
				// 1. Obtener datos del artículo
				const { data: item } = await admin
					.from("article_batch_items")
					.select(
						"id, article_id, articles(id, title, abstract, journal, publication_year)",
					)
					.eq("id", discrepancy.article_batch_item_id)
					.single();

				if (!item || !item.articles) {
					throw new Error(
						`No se encontró el artículo para el item ${discrepancy.article_batch_item_id}`,
					);
				}

				// 2. Obtener datos de la dimensión
				const { data: dimension } = await admin
					.from("preclass_dimensions")
					.select(
						"id, name, description, type, preclass_dimension_options(id, value)",
					)
					.eq("id", discrepancy.dimension_id)
					.eq("phase_id", batchData.phase_id)
					.single();

				if (!dimension) {
					throw new Error(
						`No se encontró la dimensión ${discrepancy.dimension_id}`,
					);
				}

				// 3. Obtener reviews existentes (iteración 1 IA + iteración 2 humano)
				const { data: reviews } = await admin
					.from("article_dimension_reviews")
					.select(
						"iteration, reviewer_type, classification_value, confidence_score, rationale, option_id",
					)
					.eq("article_batch_item_id", discrepancy.article_batch_item_id)
					.eq("dimension_id", discrepancy.dimension_id)
					.order("iteration", { ascending: true });

				if (!reviews || reviews.length < 2) {
					console.warn(
						`⚠️ [${jobId}] No hay suficientes iteraciones para reconciliar (se esperaban 2, hay ${reviews?.length || 0})`,
					);
					processedCount++;
					continue;
				}

				const aiReview = reviews.find(
					(r) => r.iteration === 1 && r.reviewer_type === "ai",
				);
				const humanReview = reviews.find(
					(r) => r.iteration === 2 && r.reviewer_type === "human",
				);

				if (!aiReview || !humanReview) {
					console.warn(
						`⚠️ [${jobId}] No se encontró iteración 1 (IA) o iteración 2 (humano)`,
					);
					processedCount++;
					continue;
				}

				// 4. Construir prompt de reconciliación
				const prompt = buildReconciliationPrompt(
					batchData.projects,
					dimension as DimensionForReconciliation,
					item.articles as ArticleDataForReconciliation,
					aiReview as ReviewForReconciliation,
					humanReview as ReviewForReconciliation,
				);

				console.log(
					`\n🚀 [${jobId}] PROMPT ENVIADO A DEEPSEEK (Discrepancia ${processedCount + 1})`,
				);
				console.log("=".repeat(100));
				console.log(prompt);
				console.log("=".repeat(100));

				// 5. Llamar a DeepSeek
				const { result, usage } = await callDeepSeekAPI(
					"deepseek-chat",
					prompt,
				);

				console.log(`\n📥 [${jobId}] RESPUESTA RECIBIDA DE DEEPSEEK:`);
				console.log("=".repeat(100));
				console.log(result);
				console.log("=".repeat(100));

				// 6. Limpiar y parsear respuesta
				let cleanResult = result.trim();
				if (cleanResult.startsWith("```json")) {
					cleanResult = cleanResult
						.replace(/^```json\s*/, "")
						.replace(/\s*```$/, "");
				} else if (cleanResult.startsWith("```")) {
					cleanResult = cleanResult
						.replace(/^```\s*/, "")
						.replace(/\s*```$/, "");
				}

				console.log(`\n🧹 [${jobId}] JSON LIMPIO PARA PARSING:`);
				console.log("=".repeat(80));
				console.log(cleanResult);
				console.log("=".repeat(80));

				const parsedResult = JSON.parse(cleanResult);

				if (
					!parsedResult.value ||
					!parsedResult.confidence ||
					!parsedResult.rationale
				) {
					throw new Error(
						"Respuesta de IA incompleta: falta value, confidence o rationale",
					);
				}

				// Validar que agrees_with_human esté presente
				if (typeof parsedResult.agrees_with_human !== "boolean") {
					console.warn(
						`⚠️ [${jobId}] Campo 'agrees_with_human' faltante o inválido, asumiendo false (disputed)`,
					);
					parsedResult.agrees_with_human = false;
				}

				console.log(
					`🤝 [${jobId}] IA ${parsedResult.agrees_with_human ? "ESTÁ DE ACUERDO" : "NO ESTÁ DE ACUERDO"} con el humano`,
				);

				// 7. Validar y mapear valor según tipo de dimensión
				const valueToSave = parsedResult.value;
				let optionId: string | null = null;

				if (dimension.type === "finite") {
					const validOptions = dimension.preclass_dimension_options.map(
						(opt) => opt.value,
					);
					const normalizedValue = normalizeString(valueToSave);
					const normalizedOptions = validOptions.map((opt) =>
						normalizeString(opt),
					);

					const exactMatchIndex = normalizedOptions.findIndex(
						(opt) => opt === normalizedValue,
					);
					const isExactMatch = exactMatchIndex !== -1;

					const otherOption = validOptions.find((opt) =>
						normalizeString(opt).toLowerCase().startsWith("otros"),
					);
					const isSmartOther =
						otherOption &&
						typeof valueToSave === "string" &&
						normalizedValue.toLowerCase().startsWith("otros");

					// 🌊 ÉTICA DE MOEBIUS: Permitir "Otros" implícito en reconciliación también
					const isImplicitOther =
						!otherOption &&
						typeof valueToSave === "string" &&
						normalizedValue.toLowerCase().startsWith("otros");

					if (!isExactMatch && !isSmartOther && !isImplicitOther) {
						throw new Error(
							`Valor "${valueToSave}" inválido para la dimensión finita "${dimension.name}". Opciones válidas: ${validOptions.join(", ")}. Si ninguna opción encaja, usa "Otros: [descripción]".`,
						);
					}

					// Mapear option_id
					const optionsWithIds = dimension.preclass_dimension_options as {
						id: string;
						value: string;
					}[];
					if (isExactMatch) {
						optionId = optionsWithIds[exactMatchIndex]?.id ?? null;
					} else if (isSmartOther) {
						const otherObj = optionsWithIds.find((o) =>
							normalizeString(o.value).toLowerCase().startsWith("otros"),
						);
						optionId = otherObj?.id ?? null;
					} else if (isImplicitOther) {
						// 🚨 EMERGENCIA: "Otros" sin opción definida → option_id = null
						optionId = null;
						console.log(
							`🌊 [Reconciliación-Emergencia] Dimensión "${dimension.name}" - Otros implícito: "${valueToSave}"`,
						);
					}
				}

				// 8. Preparar clasificación de iteración 3
				// 🎯 MAPEO AUTOMÁTICO DE ESTADO según acuerdo con humano:
				// - agrees_with_human = true → 'reconciled' (acuerdo alcanzado)
				// - agrees_with_human = false → 'disputed' (desacuerdo persistente, requiere arbitraje)
				const reconciliationStatus =
					parsedResult.agrees_with_human ? "reconciled" : "disputed";

				const iteration3Review: ReviewInsertWithOptionalFields = {
					article_id: item.article_id,
					article_batch_item_id: discrepancy.article_batch_item_id,
					dimension_id: discrepancy.dimension_id,
					reviewer_type: "ai",
					reviewer_id: userId,
					iteration: 3, // 🎯 ITERACIÓN 3 - Reconciliación de IA
					classification_value: valueToSave,
					confidence_score: mapConfidenceToScore(parsedResult.confidence),
					rationale: parsedResult.rationale,
					option_id: optionId,
					prevalidated: false,
					is_final: false,
					status: reconciliationStatus, // ✅ Estado automático basado en acuerdo
				};

				clasificacionesIteracion3.push(iteration3Review);

				// 9. Actualizar tokens del job
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await (admin.rpc as any)("increment_job_tokens", {
					job_id: jobId,
					input_increment: usage?.promptTokenCount || 0,
					output_increment: usage?.candidatesTokenCount || 0,
				});

				console.log(
					`✅ [${jobId}] Discrepancia procesada exitosamente: ${discrepancy.article_batch_item_id} - ${discrepancy.dimension_id}`,
				);
			} catch (discrepancyError) {
				console.error(
					`\n❌ [${jobId}] ERROR PROCESANDO DISCREPANCIA ${processedCount + 1}:`,
					discrepancyError,
				);
				console.error("   Item:", discrepancy.article_batch_item_id);
				console.error("   Dimensión:", discrepancy.dimension_id);
				// Continuar con la siguiente discrepancia
			}

			processedCount++;

			// Actualizar progreso
			await admin
				.from("ai_job_history")
				.update({
					progress: (processedCount / discrepancies.length) * 90,
					details: {
						total: discrepancies.length,
						processed: processedCount,
						step: `Reconciliando discrepancias (${processedCount}/${discrepancies.length})`,
					},
				})
				.eq("id", jobId);
		}

		// 🚀 Persistir clasificaciones de iteración 3 si existen
		if (clasificacionesIteracion3.length > 0) {
			console.log(
				`\n🚀 [${jobId}] EJECUTANDO INSERCIÓN MASIVA EN article_dimension_reviews (${clasificacionesIteracion3.length} clasificaciones de iteración 3)...`,
			);

			const { error: insertError } = await admin
				.from("article_dimension_reviews")
				.insert(clasificacionesIteracion3);

			if (insertError) {
				console.error(`❌ [${jobId}] ERROR EN INSERCIÓN MASIVA:`, insertError);
				await admin
					.from("ai_job_history")
					.update({
						status: "failed",
						progress: 100,
						error_message: insertError.message,
					})
					.eq("id", jobId);
				throw insertError;
			}

			console.log(
				`✅ [${jobId}] ${clasificacionesIteracion3.length} clasificaciones de iteración 3 insertadas exitosamente`,
			);
		} else {
			console.warn(
				`⚠️ [${jobId}] No se generaron clasificaciones de iteración 3 para insertar`,
			);
			await admin
				.from("ai_job_history")
				.update({
					status: "failed",
					progress: 100,
					error_message:
						"No se generaron clasificaciones válidas para reconciliación",
				})
				.eq("id", jobId);
			throw new Error(
				"No se generaron clasificaciones válidas para reconciliación.",
			);
		}

		// ✅ Completar job
		await admin
			.from("ai_job_history")
			.update({
				status: "completed",
				progress: 100,
				details: {
					total: discrepancies.length,
					processed: processedCount,
					reconciled: clasificacionesIteracion3.length,
					step: "Reconciliación completada",
				},
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobId);

		console.log(`\n🎉 [${jobId}] RECONCILIACIÓN COMPLETADA EXITOSAMENTE`);
		console.log(
			`   📊 Discrepancias procesadas: ${processedCount}/${discrepancies.length}`,
		);
		console.log(
			`   ✅ Clasificaciones de iteración 3 creadas: ${clasificacionesIteracion3.length}`,
		);

		// 🔔 DISPARAR EVENTO REALTIME: Hacer un "touch" del batch con cliente normal
		// Service Role bypasea RLS, entonces eventos Realtime no se propagan al frontend
		// Este update dummy con cliente normal dispara el evento para que el frontend lo capte
		console.log(
			`🔔 [${jobId}] Disparando evento Realtime para refrescar frontend...`,
		);
		try {
			const {
				data: { user },
			} = await admin.auth.admin.getUserById(userId);
			if (user) {
				// Obtener status actual del batch
				const { data: currentBatch } = await admin
					.from("article_batches")
					.select("status")
					.eq("id", batchId)
					.single();
				if (currentBatch) {
					// Hacer update con el mismo status para disparar evento Realtime
					await admin
						.from("article_batches")
						.update({ status: currentBatch.status })
						.eq("id", batchId);
					console.log(
						`✅ [${jobId}] Evento Realtime disparado - Frontend debería refrescarse automáticamente`,
					);
				}
			}
		} catch (realtimeError) {
			console.warn(
				`⚠️ [${jobId}] No se pudo disparar evento Realtime:`,
				realtimeError,
			);
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error(`❌ [${jobId}] Error en reconciliación:`, msg);
		console.error(
			`🔍 [${jobId}] Stack trace:`,
			error instanceof Error ? error.stack : "No disponible",
		);

		try {
			const admin = await createSupabaseServiceRoleClient();
			await admin
				.from("ai_job_history")
				.update({
					status: "failed",
					progress: 100,
					error_message: msg,
					completed_at: new Date().toISOString(),
				})
				.eq("id", jobId);
		} catch (adminError) {
			console.error(
				`❌ [${jobId}] Error al marcar job como fallido:`,
				adminError,
			);
		}
	}
}

// ========================================================================
//	FINALIZACIÓN DE LOTE
// ========================================================================

/**
 * Helper: Verifica si un lote está cerrado (todas las dimensiones tienen is_final = true)
 * @param batchId - ID del batch a verificar
 * @returns Objeto con información sobre si está cerrado y estadísticas
 */
export async function isBatchClosed(batchId: string): Promise<{
	isClosed: boolean;
	totalDimensions: number;
	finalizedDimensions: number;
	percentFinalized: number;
}> {
	try {
		const supabase = await createSupabaseServerClient();

		// ⚡ QW-1: Optimización vía RPC para evitar 50+ queries
		// Si la función RPC no existe o falla, usamos el fallback manual
		const { data, error } = await supabase.rpc("is_batch_closed", {
			p_batch_id: batchId,
		});

		if (!error && data) {
			// RPC exitosa
			const dataTyped = data as any;
			return {
				isClosed: Boolean(
					Array.isArray(dataTyped) ?
						dataTyped[0]?.isClosed
					:	dataTyped.isClosed,
				),
				totalDimensions: Number(
					Array.isArray(dataTyped) ?
						dataTyped[0]?.totalDimensions
					:	dataTyped.totalDimensions,
				),
				finalizedDimensions: Number(
					Array.isArray(dataTyped) ?
						dataTyped[0]?.finalizedDimensions
					:	dataTyped.finalizedDimensions,
				),
				percentFinalized: Number(
					Array.isArray(dataTyped) ?
						dataTyped[0]?.percentFinalized
					:	dataTyped.percentFinalized,
				),
			};
		}

		if (error) {
			console.warn(
				`⚠️ [isBatchClosed] RPC falló (${error.message}), usando fallback manual.`,
			);
		}

		// 🔁 Fallback manual
		return await isBatchClosedManual(batchId);
	} catch (error) {
		console.error("❌ [isBatchClosed] Error:", error);
		return {
			isClosed: false,
			totalDimensions: 0,
			finalizedDimensions: 0,
			percentFinalized: 0,
		};
	}
}

/**
 * Lógica manual antigua para isBatchClosed (Fallback)
 */
async function isBatchClosedManual(batchId: string) {
	try {
		const supabase = await createSupabaseServerClient();

		// Obtener todos los items del batch
		const { data: items, error: itemsErr } = await supabase
			.from("article_batch_items")
			.select("id")
			.eq("batch_id", batchId);

		if (itemsErr)
			throw new Error(`Error al obtener items: ${itemsErr.message}`);
		if (!items || items.length === 0) {
			return {
				isClosed: false,
				totalDimensions: 0,
				finalizedDimensions: 0,
				percentFinalized: 0,
			};
		}

		const itemIds = items.map((i) => i.id);

		// Contar total de dimensiones (reviews únicas por item + dimension)
		const { count: totalCount, error: totalErr } = await supabase
			.from("article_dimension_reviews")
			.select("*", { count: "exact", head: true })
			.in("article_batch_item_id", itemIds);

		if (totalErr) throw new Error(`Error al contar total: ${totalErr.message}`);

		// Contar dimensiones finalizadas (is_final = true)
		const { count: finalCount, error: finalErr } = await supabase
			.from("article_dimension_reviews")
			.select("*", { count: "exact", head: true })
			.in("article_batch_item_id", itemIds)
			.eq("is_final", true);

		if (finalErr)
			throw new Error(`Error al contar finalizadas: ${finalErr.message}`);

		const total = totalCount ?? 0;
		const finalized = finalCount ?? 0;
		const isClosed = total > 0 && total === finalized;
		const percent = total > 0 ? Math.round((finalized / total) * 100) : 0;

		return {
			isClosed,
			totalDimensions: total,
			finalizedDimensions: finalized,
			percentFinalized: percent,
		};
	} catch (error) {
		console.error("❌ [isBatchClosedManual] Error:", error);
		return {
			isClosed: false,
			totalDimensions: 0,
			finalizedDimensions: 0,
			percentFinalized: 0,
		};
	}
}

/**
 * Valida si un lote puede ser finalizado según su iteración y estados
 * @param batchId - ID del batch a validar
 * @returns Resultado con validación y lista de issues
 */
export async function validateBatchForFinalization(batchId: string): Promise<{
	canFinalize: boolean;
	issues: string[];
	stats: {
		totalDimensions: number;
		iter1Validated: number;
		iter1Pending: number;
		iter2Incomplete: number;
		iter3Reconciled: number;
		iter3Disputed: number;
		iter3Pending: number;
	};
}> {
	try {
		const supabase = await createSupabaseServerClient();

		// Obtener todos los items del batch
		const { data: items, error: itemsErr } = await supabase
			.from("article_batch_items")
			.select("id")
			.eq("batch_id", batchId);

		if (itemsErr)
			throw new Error(`Error al obtener items: ${itemsErr.message}`);
		if (!items || items.length === 0) {
			return {
				canFinalize: false,
				issues: ["Lote sin artículos"],
				stats: {
					totalDimensions: 0,
					iter1Validated: 0,
					iter1Pending: 0,
					iter2Incomplete: 0,
					iter3Reconciled: 0,
					iter3Disputed: 0,
					iter3Pending: 0,
				},
			};
		}

		const itemIds = items.map((i) => i.id);

		// Obtener todas las reviews del batch
		const { data: reviews, error: reviewsErr } = await supabase
			.from("article_dimension_reviews")
			.select(
				"article_batch_item_id, dimension_id, iteration, status, is_final",
			)
			.in("article_batch_item_id", itemIds)
			.order("iteration", { ascending: false });

		if (reviewsErr)
			throw new Error(`Error al obtener reviews: ${reviewsErr.message}`);
		if (!reviews || reviews.length === 0) {
			return {
				canFinalize: false,
				issues: ["No hay clasificaciones para revisar"],
				stats: {
					totalDimensions: 0,
					iter1Validated: 0,
					iter1Pending: 0,
					iter2Incomplete: 0,
					iter3Reconciled: 0,
					iter3Disputed: 0,
					iter3Pending: 0,
				},
			};
		}

		// Agrupar reviews por (item_id, dimension_id) y obtener la de mayor iteración
		const dimensionMap = new Map<string, (typeof reviews)[0]>();
		for (const review of reviews) {
			const key = `${review.article_batch_item_id}_${review.dimension_id}`;
			const existing = dimensionMap.get(key);
			if (!existing || (review.iteration ?? 0) > (existing.iteration ?? 0)) {
				dimensionMap.set(key, review);
			}
		}

		// Analizar estados
		const stats = {
			totalDimensions: dimensionMap.size,
			iter1Validated: 0,
			iter1Pending: 0,
			iter2Incomplete: 0,
			iter3Reconciled: 0,
			iter3Disputed: 0,
			iter3Pending: 0,
		};

		const issues: string[] = [];

		dimensionMap.forEach((review) => {
			const iter = review.iteration ?? 1;
			const status = review.status;

			if (iter === 1) {
				if (status === "validated") {
					stats.iter1Validated++;
				} else {
					stats.iter1Pending++;
				}
			} else if (iter === 2) {
				// Iteración 2 es un estado intermedio - no puede cerrarse
				stats.iter2Incomplete++;
			} else if (iter >= 3) {
				if (status === "reconciled") {
					stats.iter3Reconciled++;
				} else if (status === "disputed") {
					stats.iter3Disputed++;
				} else {
					stats.iter3Pending++;
				}
			}
		});

		// Validar condiciones
		if (stats.iter1Pending > 0) {
			issues.push(
				`${stats.iter1Pending} dimensión(es) en iteración 1 sin aprobar (deben estar en 'validated')`,
			);
		}
		if (stats.iter2Incomplete > 0) {
			issues.push(
				`${stats.iter2Incomplete} dimensión(es) en iteración 2 (estado incompleto, falta reconciliación)`,
			);
		}
		if (stats.iter3Pending > 0) {
			issues.push(
				`${stats.iter3Pending} dimensión(es) en iteración 3 sin decisión (deben estar en 'reconciled' o 'disputed')`,
			);
		}

		return {
			canFinalize: issues.length === 0,
			issues,
			stats,
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [validateBatchForFinalization] Error:", msg);
		return {
			canFinalize: false,
			issues: [`Error al validar: ${msg}`],
			stats: {
				totalDimensions: 0,
				iter1Validated: 0,
				iter1Pending: 0,
				iter2Incomplete: 0,
				iter3Reconciled: 0,
				iter3Disputed: 0,
				iter3Pending: 0,
			},
		};
	}
}

// ========================================================================
// SISTEMA MULTI-FASE
// ========================================================================

/**
 * Helper: Obtener el número de fase más alto para un proyecto
 */
async function getMaxPhaseNumber(projectId: string): Promise<number> {
	const supabase = await createSupabaseServerClient();
	const { data, error } = await supabase
		.from("preclassification_phases")
		.select("phase_number")
		.eq("project_id", projectId)
		.order("phase_number", { ascending: false })
		.limit(1)
		.single();

	if (error || !data) return 0;
	return data.phase_number;
}

/**
 * Crear Fase Aditiva (Caso 1)
 * Crea una nueva fase que reutiliza el mismo universo de artículos de una fase origen
 */
export async function createAdditivePhase(params: {
	projectId: string;
	sourcePhaseId: string;
	name: string;
	description?: string;
}): Promise<
	ResultadoOperacion<{ phase: Record<string, unknown>; articlesCount: number }>
> {
	try {
		const supabase = await createSupabaseServerClient();

		console.log("🔗 [createAdditivePhase] Creando fase aditiva:", params);

		// 1. Obtener información de la fase origen
		const { data: sourcePhase, error: sourceError } = await supabase
			.from("preclassification_phases")
			.select("project_id, name, universe_name, total_articles")
			.eq("id", params.sourcePhaseId)
			.single();

		if (sourceError || !sourcePhase) {
			return { success: false, error: "Fase origen no encontrada" };
		}

		// 2. Obtener artículos de la fase origen
		const { data: sourceArticles, error: articlesError } = await supabase
			.from("phase_eligible_articles")
			.select("article_id")
			.eq("phase_id", params.sourcePhaseId);

		if (articlesError) {
			return {
				success: false,
				error: `Error al obtener artículos: ${articlesError.message}`,
			};
		}

		const articlesCount = sourceArticles?.length || 0;

		if (articlesCount === 0) {
			return { success: false, error: "La fase origen no tiene artículos" };
		}

		// 3. Obtener siguiente número de fase
		const nextPhaseNumber = (await getMaxPhaseNumber(params.projectId)) + 1;

		// 4. Crear nueva fase
		const { data: newPhase, error: phaseError } = await supabase
			.from("preclassification_phases")
			.insert({
				project_id: params.projectId,
				name: params.name,
				description: params.description,
				phase_number: nextPhaseNumber,
				universe_name: `${sourcePhase.name} (completo)`,
				universe_type: "complete",
				source_phase_id: params.sourcePhaseId,
				total_articles: articlesCount,
				status: "planning",
			})
			.select()
			.single();

		if (phaseError || !newPhase) {
			return {
				success: false,
				error: `Error al crear fase: ${phaseError?.message}`,
			};
		}

		console.log("✅ [createAdditivePhase] Fase creada:", newPhase.id);

		// 5. Copiar artículos de fase origen a nueva fase
		const articlesToInsert = sourceArticles.map((a) => ({
			phase_id: newPhase.id,
			article_id: a.article_id,
		}));

		const { error: insertError } = await supabase
			.from("phase_eligible_articles")
			.insert(articlesToInsert);

		if (insertError) {
			// Rollback: eliminar fase creada
			await supabase
				.from("preclassification_phases")
				.delete()
				.eq("id", newPhase.id);
			return {
				success: false,
				error: `Error al copiar artículos: ${insertError.message}`,
			};
		}

		console.log(`✅ [createAdditivePhase] ${articlesCount} artículos copiados`);

		return {
			success: true,
			data: {
				phase: newPhase,
				articlesCount,
			},
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [createAdditivePhase] Error:", msg);
		return { success: false, error: msg };
	}
}

/**
 * Crear Fase Embudo (Caso 2)
 * Crea una nueva fase con un subconjunto filtrado de artículos de una fase origen
 */
export async function createFilteredPhase(params: {
	projectId: string;
	sourcePhaseId: string;
	name: string;
	description?: string;
	filters: {
		dimensions: Record<string, Record<string, "include" | "exclude">>;
		confidence?: number[];
	};
}): Promise<
	ResultadoOperacion<{ phase: Record<string, unknown>; articlesCount: number }>
> {
	try {
		const supabase = await createSupabaseServerClient();

		console.log("🔽 [createFilteredPhase] Creando fase embudo:", params);

		// 1. Obtener artículos filtrados de la fase origen
		const filteredArticles = await getFilteredArticlesFromPhase(
			params.sourcePhaseId,
			params.filters,
		);

		if (!filteredArticles.success || !filteredArticles.data) {
			return {
				success: false,
				error:
					"error" in filteredArticles ?
						filteredArticles.error
					:	"Error al filtrar artículos",
			};
		}

		const articlesCount = filteredArticles.data.length;

		if (articlesCount === 0) {
			return {
				success: false,
				error: "Los filtros no retornaron ningún artículo",
			};
		}

		// 2. Obtener siguiente número de fase
		const nextPhaseNumber = (await getMaxPhaseNumber(params.projectId)) + 1;

		// 3. Crear nueva fase
		const { data: newPhase, error: phaseError } = await supabase
			.from("preclassification_phases")
			.insert({
				project_id: params.projectId,
				name: params.name,
				description: params.description,
				phase_number: nextPhaseNumber,
				universe_name: `${params.name} (${articlesCount} artículos filtrados)`,
				universe_type: "filtered",
				source_phase_id: params.sourcePhaseId,
				applied_filters: params.filters,
				total_articles: articlesCount,
				status: "planning",
			})
			.select()
			.single();

		if (phaseError || !newPhase) {
			return {
				success: false,
				error: `Error al crear fase: ${phaseError?.message}`,
			};
		}

		console.log("✅ [createFilteredPhase] Fase creada:", newPhase.id);

		// 4. Insertar solo artículos filtrados
		const articlesToInsert = filteredArticles.data.map((a) => ({
			phase_id: newPhase.id,
			article_id: a.id,
		}));

		const { error: insertError } = await supabase
			.from("phase_eligible_articles")
			.insert(articlesToInsert);

		if (insertError) {
			// Rollback: eliminar fase creada
			await supabase
				.from("preclassification_phases")
				.delete()
				.eq("id", newPhase.id);
			return {
				success: false,
				error: `Error al insertar artículos: ${insertError.message}`,
			};
		}

		console.log(
			`✅ [createFilteredPhase] ${articlesCount} artículos filtrados insertados`,
		);

		return {
			success: true,
			data: {
				phase: newPhase,
				articlesCount,
			},
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [createFilteredPhase] Error:", msg);
		return { success: false, error: msg };
	}
}

/**
 * Helper: Obtener artículos filtrados de una fase
 * Reutiliza la lógica de filtrado del análisis de preclasificación
 */
async function getFilteredArticlesFromPhase(
	phaseId: string,
	filters: {
		dimensions: Record<string, Record<string, "include" | "exclude">>;
		confidence?: number[];
	},
): Promise<ResultadoOperacion<Array<{ id: string }>>> {
	try {
		const supabase = await createSupabaseServerClient();

		// Obtener todos los artículos de la fase
		const { data: articles, error } = await supabase
			.from("phase_eligible_articles")
			.select(
				`
                article_id,
                articles!inner (
                    id
                )
            `,
			)
			.eq("phase_id", phaseId);

		if (error) {
			return { success: false, error: error.message };
		}

		if (!articles || articles.length === 0) {
			return { success: true, data: [] };
		}

		// Obtener clasificaciones para estos artículos
		const articleIds = articles.map((a) => a.article_id);

		// 🔧 FIX: Usar nombres de columna correctos (classification_value, iteration, article_id)
		// Paginar para manejar universos grandes
		let allReviews: Array<{
			article_id: string;
			dimension_id: string;
			classification_value: string | null;
			confidence_score: number | null;
			iteration: number | null;
		}> = [];
		const pageSize = 1000;
		let page = 0;
		let hasMore = true;

		while (hasMore) {
			const { data: pageData, error: reviewsError } = await supabase
				.from("article_dimension_reviews")
				.select(
					"article_id, dimension_id, classification_value, confidence_score, iteration",
				)
				.in("article_id", articleIds)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (reviewsError) {
				return { success: false, error: reviewsError.message };
			}

			if (pageData && pageData.length > 0) {
				allReviews = allReviews.concat(pageData);
				hasMore = pageData.length === pageSize;
				page++;
			} else {
				hasMore = false;
			}
		}

		// Agrupar reviews por article_id y dimension_id, tomando la de mayor iteración
		const latestReviews = new Map<
			string,
			Map<string, { value: string; confidence: number; _iteration?: number }>
		>();

		allReviews.forEach((review) => {
			if (!latestReviews.has(review.article_id)) {
				latestReviews.set(review.article_id, new Map());
			}
			const articleReviews = latestReviews.get(review.article_id)!;
			const key = review.dimension_id;
			const existing = articleReviews.get(key);

			if (
				!existing ||
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(review.iteration ?? 0) > ((existing as any)._iteration ?? 0)
			) {
				articleReviews.set(key, {
					value: (review.classification_value || "").trim(),
					confidence: review.confidence_score || 0,
					_iteration: review.iteration,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} as any);
			}
		});

		// Aplicar filtros de dimensión
		const filteredArticleIds = articleIds.filter((articleId) => {
			const articleReviews = latestReviews.get(articleId);
			if (!articleReviews) return false;

			// Verificar filtros de dimensiones (AND lógico entre dimensiones)
			return Object.entries(filters.dimensions).every(([dimId, filterMap]) => {
				const reviewData = articleReviews.get(dimId);
				if (!reviewData || !reviewData.value) return false;

				const articleValue = reviewData.value;

				// Helper: detectar "Otros: ..." del LLM
				const isOtherValue = articleValue.toLowerCase().startsWith("otros");

				// Separar filtros de inclusión y exclusión
				const includeValues = Object.entries(filterMap)
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					.filter(([_, mode]) => mode === "include")
					.map(([val]) => val);
				const excludeValues = Object.entries(filterMap)
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					.filter(([_, mode]) => mode === "exclude")
					.map(([val]) => val);

				// Exclusión tiene prioridad
				if (excludeValues.length > 0) {
					const shouldExclude = excludeValues.some((val) => {
						if (val === "Otros" && isOtherValue) return true;
						return val === articleValue;
					});
					if (shouldExclude) return false;
				}

				// Inclusión
				if (includeValues.length > 0) {
					const isIncluded = includeValues.some((val) => {
						if (val === "Otros" && isOtherValue) return true;
						return val === articleValue;
					});
					return isIncluded;
				}

				return true;
			});
		});

		// Aplicar filtro de confianza si existe
		let finalArticleIds = filteredArticleIds;
		if (filters.confidence && filters.confidence.length > 0) {
			finalArticleIds = filteredArticleIds.filter((articleId) => {
				const articleReviews = latestReviews.get(articleId);
				if (!articleReviews) return false;

				return Array.from(articleReviews.values()).some((review) =>
					filters.confidence!.includes(review.confidence),
				);
			});
		}

		return {
			success: true,
			data: finalArticleIds.map((id) => ({ id })),
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [getFilteredArticlesFromPhase] Error:", msg);
		return { success: false, error: msg };
	}
}

// ========================================================================
//	ANÁLISIS DE DISCREPANCIAS ENTRE ITERACIONES
// ========================================================================

export type DiscrepancyDetail = {
	articleId: string;
	articleTitle: string;
	translatedTitle: string | null;
	correlativo: string | null;
	dimensionId: string;
	dimensionName: string;
	dimensionIcon: string | null;
	batchNumber: number | null;
	batchId: string | null;
	iter1: {
		value: string;
		confidence: number | null;
		rationale: string | null;
		reviewerType: string;
	} | null;
	iter2: {
		value: string;
		confidence: number | null;
		rationale: string | null;
		reviewerType: string;
	} | null;
	iter3: {
		value: string;
		confidence: number | null;
		rationale: string | null;
		reviewerType: string;
		status: string | null;
	} | null;
	isAgreement: boolean;
	finalStatus: string | null;
};

export type DiscrepancyByDimension = {
	dimensionId: string;
	dimensionName: string;
	dimensionIcon: string | null;
	totalPairs: number;
	agreements: number;
	discrepancies: number;
	reconciled: number;
	disputed: number;
	pendingReconciliation: number;
	confusionMatrix: Record<string, Record<string, number>>;
};

export type DiscrepancySummary = {
	totalPairs: number;
	agreements: number;
	discrepancies: number;
	reconciled: number;
	disputed: number;
	pendingReconciliation: number;
	onlyIter1: number;
};

export type DiscrepancyAnalysisResult = {
	summary: DiscrepancySummary;
	byDimension: DiscrepancyByDimension[];
	details: DiscrepancyDetail[];
};

/**
 * Obtiene datos de análisis de discrepancias entre iteraciones de preclasificación.
 * Compara iter 1 (IA) vs iter 2 (humano) y muestra resultados de iter 3 (reconciliación).
 */
export async function getDiscrepancyAnalysisData(params: {
	projectId: string;
	phaseIds: string[];
	dimensionIds?: string[];
	batchId?: string;
}): Promise<ResultadoOperacion<DiscrepancyAnalysisResult>> {
	const { projectId, phaseIds, dimensionIds, batchId } = params;

	if (!projectId || phaseIds.length === 0) {
		return {
			success: false,
			error: "Se requiere projectId y al menos una phaseId.",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener dimensiones de las fases seleccionadas
		let dimQuery = supabase
			.from("preclass_dimensions")
			.select("id, name, type, icon, phase_id")
			.in("phase_id", phaseIds)
			.eq("status", "active")
			.order("ordering");

		if (dimensionIds && dimensionIds.length > 0) {
			dimQuery = dimQuery.in("id", dimensionIds);
		}

		const { data: dimensions, error: dimError } = await dimQuery;

		if (dimError) {
			throw new Error(`Error obteniendo dimensiones: ${dimError.message}`);
		}

		if (!dimensions || dimensions.length === 0) {
			return {
				success: true,
				data: {
					summary: {
						totalPairs: 0,
						agreements: 0,
						discrepancies: 0,
						reconciled: 0,
						disputed: 0,
						pendingReconciliation: 0,
						onlyIter1: 0,
					},
					byDimension: [],
					details: [],
				},
			};
		}

		const dimensionIds_ = dimensions.map((d) => d.id);
		const dimensionMap = new Map(dimensions.map((d) => [d.id, d]));

		// 2. Obtener lotes de las fases
		let batchQuery = supabase
			.from("article_batches")
			.select("id, batch_number")
			.in("phase_id", phaseIds);

		if (batchId) {
			batchQuery = batchQuery.eq("id", batchId);
		}

		const { data: batches, error: batchError } = await batchQuery;

		if (batchError) {
			throw new Error(`Error obteniendo lotes: ${batchError.message}`);
		}

		if (!batches || batches.length === 0) {
			return {
				success: true,
				data: {
					summary: {
						totalPairs: 0,
						agreements: 0,
						discrepancies: 0,
						reconciled: 0,
						disputed: 0,
						pendingReconciliation: 0,
						onlyIter1: 0,
					},
					byDimension: [],
					details: [],
				},
			};
		}

		const batchIds = batches.map((b) => b.id);
		const batchMap = new Map(batches.map((b) => [b.id, b]));

		// 3. Obtener items de lotes
		const { data: batchItems, error: itemsError } = await supabase
			.from("article_batch_items")
			.select("id, article_id, batch_id")
			.in("batch_id", batchIds);

		if (itemsError) {
			throw new Error(`Error obteniendo items de lotes: ${itemsError.message}`);
		}

		if (!batchItems || batchItems.length === 0) {
			return {
				success: true,
				data: {
					summary: {
						totalPairs: 0,
						agreements: 0,
						discrepancies: 0,
						reconciled: 0,
						disputed: 0,
						pendingReconciliation: 0,
						onlyIter1: 0,
					},
					byDimension: [],
					details: [],
				},
			};
		}

		const itemMap = new Map(batchItems.map((i) => [i.id, i]));
		const articleIds = [...new Set(batchItems.map((i) => i.article_id))];

		// 4. Obtener artículos (título, correlativo)
		// Paginar si hay muchos artículos
		const pageSize = 500;
		const articlesData: Array<{
			id: string;
			title: string | null;
			correlativo: number;
		}> = [];

		for (let i = 0; i < articleIds.length; i += pageSize) {
			const slice = articleIds.slice(i, i + pageSize);
			const { data: arts, error: artsErr } = await supabase
				.from("articles")
				.select("id, title, correlativo")
				.in("id", slice);

			if (artsErr) {
				throw new Error(`Error obteniendo artículos: ${artsErr.message}`);
			}

			if (arts) articlesData.push(...arts);
		}

		const articleMap = new Map(articlesData.map((a) => [a.id, a]));

		// 5. Obtener traducciones (título traducido)
		const translationsMap = new Map<string, string>();
		for (let i = 0; i < articleIds.length; i += pageSize) {
			const slice = articleIds.slice(i, i + pageSize);
			const { data: trans } = await supabase
				.from("article_translations")
				.select("article_id, title")
				.in("article_id", slice)
				.order("translated_at", { ascending: false });

			if (trans) {
				for (const t of trans) {
					if (!translationsMap.has(t.article_id) && t.title) {
						translationsMap.set(t.article_id, t.title);
					}
				}
			}
		}

		// 6. Obtener TODAS las reviews (todas las iteraciones)
		const itemIds = batchItems.map((i) => i.id);

		type ReviewRow = {
			id: string;
			article_batch_item_id: string;
			article_id: string;
			dimension_id: string;
			iteration: number | null;
			reviewer_type: string;
			classification_value: string | null;
			confidence_score: number | null;
			rationale: string | null;
			status: string | null;
		};

		const allReviews: ReviewRow[] = [];

		// Reducir pageSize a 100 para evitar exceder límites de Supabase con muchos items
		const reviewPageSize = 100;
		const totalPages = Math.ceil(itemIds.length / reviewPageSize);

		console.log(
			`📊 [getDiscrepancyAnalysisData] Cargando reviews: ${itemIds.length} items en ${totalPages} páginas`,
		);

		for (let i = 0; i < itemIds.length; i += reviewPageSize) {
			const slice = itemIds.slice(i, i + reviewPageSize);
			const pageNum = Math.floor(i / reviewPageSize) + 1;

			const { data: reviews, error: revErr } = await supabase
				.from("article_dimension_reviews")
				.select(
					"id, article_batch_item_id, article_id, dimension_id, iteration, reviewer_type, classification_value, confidence_score, rationale, status",
				)
				.in("article_batch_item_id", slice)
				.in("dimension_id", dimensionIds_);

			if (revErr) {
				console.error(
					`❌ [getDiscrepancyAnalysisData] Error en página ${pageNum}/${totalPages}:`,
					revErr.message,
				);
				throw new Error(`Error obteniendo reviews: ${revErr.message}`);
			}

			if (reviews) {
				allReviews.push(...(reviews as ReviewRow[]));
				console.log(
					`✓ [getDiscrepancyAnalysisData] Página ${pageNum}/${totalPages}: ${reviews.length} reviews cargadas (total acumulado: ${allReviews.length})`,
				);
			}
		}

		// 7. Agrupar reviews por (article_batch_item_id, dimension_id, iteration)
		// key: `${itemId}__${dimId}`
		type IterationSet = {
			iter1: ReviewRow | null;
			iter2: ReviewRow | null;
			iter3: ReviewRow | null;
		};

		const pairMap = new Map<string, IterationSet>();

		for (const review of allReviews) {
			const key = `${review.article_batch_item_id}__${review.dimension_id}`;
			if (!pairMap.has(key)) {
				pairMap.set(key, { iter1: null, iter2: null, iter3: null });
			}
			const set = pairMap.get(key)!;

			if (review.iteration === 1) {
				// Mantener la más reciente si hay duplicados
				if (!set.iter1 || review.id > (set.iter1.id || "")) {
					set.iter1 = review;
				}
			} else if (review.iteration === 2) {
				if (!set.iter2 || review.id > (set.iter2.id || "")) {
					set.iter2 = review;
				}
			} else if (review.iteration === 3) {
				if (!set.iter3 || review.id > (set.iter3.id || "")) {
					set.iter3 = review;
				}
			}
		}

		// 8. Construir detalles y estadísticas
		const details: DiscrepancyDetail[] = [];
		const summaryAcc: DiscrepancySummary = {
			totalPairs: 0,
			agreements: 0,
			discrepancies: 0,
			reconciled: 0,
			disputed: 0,
			pendingReconciliation: 0,
			onlyIter1: 0,
		};

		const dimStatsMap = new Map<
			string,
			{
				totalPairs: number;
				agreements: number;
				discrepancies: number;
				reconciled: number;
				disputed: number;
				pendingReconciliation: number;
				confusionMatrix: Record<string, Record<string, number>>;
			}
		>();

		// Inicializar estadísticas por dimensión
		for (const dim of dimensions) {
			dimStatsMap.set(dim.id, {
				totalPairs: 0,
				agreements: 0,
				discrepancies: 0,
				reconciled: 0,
				disputed: 0,
				pendingReconciliation: 0,
				confusionMatrix: {},
			});
		}

		for (const [key, iterSet] of pairMap) {
			const [itemId, dimId] = key.split("__");
			const item = itemMap.get(itemId);
			if (!item) continue;

			const dim = dimensionMap.get(dimId);
			if (!dim) continue;

			const article = articleMap.get(item.article_id);
			const batch = batchMap.get(item.batch_id);
			const translatedTitle = translationsMap.get(item.article_id) || null;

			// Solo contar pares que tienen al menos iter 1
			if (!iterSet.iter1) continue;

			summaryAcc.totalPairs++;
			const dimStats = dimStatsMap.get(dimId)!;
			dimStats.totalPairs++;

			const iter1Val = (iterSet.iter1.classification_value || "").trim();
			const iter2Val =
				iterSet.iter2 ?
					(iterSet.iter2.classification_value || "").trim()
				:	null;

			const isAgreement =
				iter2Val !== null && iter1Val.toLowerCase() === iter2Val.toLowerCase();

			if (!iterSet.iter2) {
				summaryAcc.onlyIter1++;
			} else if (isAgreement) {
				summaryAcc.agreements++;
				dimStats.agreements++;
			} else {
				summaryAcc.discrepancies++;
				dimStats.discrepancies++;

				// Matriz de confusión
				if (iter2Val !== null) {
					if (!dimStats.confusionMatrix[iter1Val]) {
						dimStats.confusionMatrix[iter1Val] = {};
					}
					dimStats.confusionMatrix[iter1Val][iter2Val] =
						(dimStats.confusionMatrix[iter1Val][iter2Val] || 0) + 1;
				}
			}

			// Estado de reconciliación
			let finalStatus: string | null = null;
			if (iterSet.iter3) {
				finalStatus = iterSet.iter3.status || null;
				if (finalStatus === "reconciled") {
					summaryAcc.reconciled++;
					dimStats.reconciled++;
				} else if (finalStatus === "disputed") {
					summaryAcc.disputed++;
					dimStats.disputed++;
				}
			} else if (!isAgreement && iterSet.iter2) {
				summaryAcc.pendingReconciliation++;
				dimStats.pendingReconciliation++;
			}

			details.push({
				articleId: item.article_id,
				articleTitle: article?.title || "Sin título",
				translatedTitle,
				correlativo: article?.correlativo?.toString() || null,
				dimensionId: dimId,
				dimensionName: dim.name,
				dimensionIcon: dim.icon,
				batchNumber: batch?.batch_number || null,
				batchId: item.batch_id,
				iter1: {
					value: iter1Val,
					confidence: iterSet.iter1.confidence_score,
					rationale: iterSet.iter1.rationale,
					reviewerType: iterSet.iter1.reviewer_type,
				},
				iter2:
					iterSet.iter2 ?
						{
							value: iter2Val!,
							confidence: iterSet.iter2.confidence_score,
							rationale: iterSet.iter2.rationale,
							reviewerType: iterSet.iter2.reviewer_type,
						}
					:	null,
				iter3:
					iterSet.iter3 ?
						{
							value: (iterSet.iter3.classification_value || "").trim(),
							confidence: iterSet.iter3.confidence_score,
							rationale: iterSet.iter3.rationale,
							reviewerType: iterSet.iter3.reviewer_type,
							status: iterSet.iter3.status,
						}
					:	null,
				isAgreement,
				finalStatus,
			});
		}

		// 9. Construir byDimension
		const byDimension: DiscrepancyByDimension[] = dimensions.map((dim) => {
			const stats = dimStatsMap.get(dim.id)!;
			return {
				dimensionId: dim.id,
				dimensionName: dim.name,
				dimensionIcon: dim.icon,
				totalPairs: stats.totalPairs,
				agreements: stats.agreements,
				discrepancies: stats.discrepancies,
				reconciled: stats.reconciled,
				disputed: stats.disputed,
				pendingReconciliation: stats.pendingReconciliation,
				confusionMatrix: stats.confusionMatrix,
			};
		});

		console.log(
			`✅ [getDiscrepancyAnalysisData] Análisis completado: ${summaryAcc.totalPairs} pares, ${summaryAcc.agreements} acuerdos, ${summaryAcc.discrepancies} discrepancias`,
		);

		return {
			success: true,
			data: {
				summary: summaryAcc,
				byDimension,
				details,
			},
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [getDiscrepancyAnalysisData] Error:", msg);
		return { success: false, error: msg };
	}
}

// ========================================================================
//	REGISTRO DE EXPORTACIONES DE ANÁLISIS DE DISCREPANCIAS
// ========================================================================

export type ExportLogInput = {
	projectId: string;
	batchId?: string; // Opcional: si no se especifica, se usará el primer batch del proyecto
	totalDiscrepancies: number;
	exportFormat?: "csv" | "json" | "excel";
	fileSizeBytes?: number;
	storagePath?: string;
	exportMetadata?: Database["public"]["Tables"]["discrepancy_export_logs"]["Insert"]["export_metadata"];
};

export async function saveDiscrepancyExportLog(
	input: ExportLogInput,
): Promise<{ success: boolean; error?: string; logId?: string }> {
	try {
		const supabase = await createSupabaseServerClient();

		// Obtener usuario actual
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return { success: false, error: "Usuario no autenticado" };
		}

		// Si no se proporciona batchId, obtener el primer batch del proyecto
		let batchId = input.batchId;
		if (!batchId) {
			const { data: batches } = await supabase
				.from("article_batches")
				.select("id")
				.eq("project_id", input.projectId)
				.order("batch_number", { ascending: true })
				.limit(1);

			if (!batches || batches.length === 0) {
				return {
					success: false,
					error: "No se encontró ningún lote para este proyecto",
				};
			}
			batchId = batches[0].id;
		}

		// Insertar registro de exportación
		const insertData: Database["public"]["Tables"]["discrepancy_export_logs"]["Insert"] =
			{
				project_id: input.projectId,
				user_id: user.id,
				batch_id: batchId,
				total_discrepancies: input.totalDiscrepancies,
				export_format: input.exportFormat || "csv",
				file_size_bytes: input.fileSizeBytes || null,
				storage_path: input.storagePath || null,
				export_metadata: input.exportMetadata || null,
			};

		const { data, error } = await supabase
			.from("discrepancy_export_logs")
			.insert(insertData)
			.select("id")
			.single();

		if (error) {
			console.error("❌ [saveDiscrepancyExportLog] Error:", error);
			return {
				success: false,
				error: `Error guardando registro: ${error.message}`,
			};
		}

		console.log("✅ [saveDiscrepancyExportLog] Registro guardado:", {
			logId: data.id,
			batchId: input.batchId,
			format: input.exportFormat || "csv",
			discrepancies: input.totalDiscrepancies,
		});

		return { success: true, logId: data.id };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [saveDiscrepancyExportLog] Error:", msg);
		return { success: false, error: msg };
	}
}
