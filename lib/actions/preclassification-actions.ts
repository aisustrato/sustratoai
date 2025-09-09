// lib/actions/preclassification-actions.ts
"use server";

import { createSupabaseServerClient, createSupabaseServiceRoleClient, createSupabaseUserClient } from "@/lib/server";
import { callGeminiAPI } from "@/lib/gemini/api";
import type { Database } from "@/lib/database.types";
import type { ResultadoOperacion } from "./types";
import type { 
    BatchWithCounts,
    ArticleForReview,
    BatchDetails,
    SubmitHumanReviewPayload,
    TranslatedArticlePayload,
    ClassificationReview,
    NotesInfo
} from "@/lib/types/preclassification-types";

export type { ArticleForReview, BatchDetails };

// Tipo auxiliar para filas de revisiones que pueden incluir option_id (campo opcional no tipado en supabase types)
type ReviewRowWithOptionalFields = Database['public']['Tables']['article_dimension_reviews']['Row'] & {
  option_id?: string | null;
};

// Insert auxiliar que permite option_id opcional (no presente en tipos generados)
type ReviewInsertWithOptionalFields = Database['public']['Tables']['article_dimension_reviews']['Insert'] & {
  option_id?: string | null;
};

// ========================================================================
//	ACCIONES DE LECTURA (GET)
// ========================================================================

export async function getProjectBatchesForUser(projectId: string, userId: string): Promise<ResultadoOperacion<BatchWithCounts[]>> {
    if (!projectId || !userId) return { success: false, error: "Se requiere ID de usuario y proyecto." };
    try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.rpc("get_user_batches_with_detailed_counts", { p_user_id: userId, p_project_id: projectId });
        if (error) throw new Error(`Error al llamar a RPC: ${error.message}`);
        return { success: true, data: data as BatchWithCounts[] };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error interno: ${msg}` };
    }
}

/**
 * Establece en bulk el flag `prevalidated` para TODAS las últimas revisiones AI
 * de un lote dado. Solo se actualiza la última revisión (por mayor `iteration`)
 * de cada par (article_batch_item_id, dimension_id).
 */
export async function bulkSetPrevalidatedForBatch(
  batchId: string,
  prevalidated: boolean
): Promise<ResultadoOperacion<{ updated: number }>> {
  try {
    if (!batchId) return { success: false, error: "Se requiere 'batchId'." };
    const supabase = await createSupabaseServerClient();
    const admin = await createSupabaseServiceRoleClient();

    // 1) Obtener items del lote
    const { data: items, error: itemsErr } = await supabase
      .from('article_batch_items')
      .select('id')
      .eq('batch_id', batchId);
    if (itemsErr) return { success: false, error: `Error obteniendo items del lote: ${itemsErr.message}` };
    const itemIds = (items || []).map(i => i.id);
    if (itemIds.length === 0) return { success: true, data: { updated: 0 } };

    // 2) Obtener todas las revisiones AI de esos items
    type ReviewRow = Database['public']['Tables']['article_dimension_reviews']['Row'];
    const { data: reviews, error: revErr } = await supabase
      .from('article_dimension_reviews')
      .select('id, article_batch_item_id, dimension_id, iteration, reviewer_type, prevalidated')
      .in('article_batch_item_id', itemIds)
      .eq('reviewer_type', 'ai');
    if (revErr) return { success: false, error: `Error obteniendo revisiones: ${revErr.message}` };

    // 3) Tomar la última por (item, dim)
    const latestByPair = new Map<string, ReviewRow>();
    for (const r of (reviews || []) as ReviewRow[]) {
      const key = `${r.article_batch_item_id}__${r.dimension_id}`;
      const current = latestByPair.get(key);
      if (!current || (r.iteration ?? -Infinity) > (current.iteration ?? -Infinity)) {
        latestByPair.set(key, r);
      }
    }

    // 4) IDs a actualizar (solo si hay cambio)
    const idsToUpdate: string[] = [];
    for (const [, row] of latestByPair) {
      if ((row.prevalidated ?? false) !== prevalidated) {
        idsToUpdate.push(row.id);
      }
    }
    if (idsToUpdate.length === 0) return { success: true, data: { updated: 0 } };

    // 5) Actualizar en lotes para evitar límites de IN
    const chunkSize = 500;
    let totalUpdated = 0;
    for (let i = 0; i < idsToUpdate.length; i += chunkSize) {
      const slice = idsToUpdate.slice(i, i + chunkSize);
      const { data: updRows, error: updErr } = await admin
        .from('article_dimension_reviews')
        .update({ prevalidated })
        .in('id', slice)
        .select('id');
      if (updErr) return { success: false, error: `Error actualizando revisiones: ${updErr.message}` };
      totalUpdated += (updRows?.length || 0);
    }

    return { success: true, data: { updated: totalUpdated } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: `Error interno en bulkSetPrevalidatedForBatch: ${msg}` };
  }
}

/**
 * Actualiza el flag `prevalidated` en la ÚLTIMA revisión AI
 * del par (article_batch_item_id, dimension_id).
 */
export async function setPrevalidatedForReview(
    articleBatchItemId: string,
    dimensionId: string,
    prevalidated: boolean
): Promise<ResultadoOperacion<{ updated: number; reviewId?: string }>> {
    try {
        if (!articleBatchItemId || !dimensionId) {
            return { success: false, error: "Se requieren 'articleBatchItemId' y 'dimensionId'." };
        }
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Usuario no autenticado." };
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return { success: false, error: 'No se pudo obtener el token de sesión.' };
        const db = createSupabaseUserClient(session.access_token);

        // Buscar la última revisión AI por iteración
        const { data: reviewRow, error: findErr } = await supabase
            .from('article_dimension_reviews')
            .select('id, iteration, reviewer_type')
            .eq('article_batch_item_id', articleBatchItemId)
            .eq('dimension_id', dimensionId)
            .eq('reviewer_type', 'ai')
            .order('iteration', { ascending: false, nullsFirst: false })
            .limit(1)
            .single();

        if (findErr || !reviewRow) {
            return { success: false, error: `No se encontró revisión AI para el item ${articleBatchItemId} y dimensión ${dimensionId}.` };
        }

        const { data: updatedRows, error: updateErr } = await db
            .from('article_dimension_reviews')
            .update({ prevalidated })
            .eq('id', reviewRow.id)
            .select('id');

        if (updateErr) {
            return { success: false, error: `Error actualizando prevalidated: ${updateErr.message}` };
        }

        return { success: true, data: { updated: updatedRows?.length || 0, reviewId: reviewRow.id } };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido.';
        return { success: false, error: `Error interno estableciendo prevalidated: ${msg}` };
    }
}

/**
 * Registra una nueva revisión HUMANA para una dimensión de un item del lote,
 * calculando la siguiente iteración y cambiando estados en cascada a 'reconciliation_pending'.
 */
export async function submitHumanReview(payload: SubmitHumanReviewPayload): Promise<ResultadoOperacion<{ reviewId: string }>> {
  try {
    const { article_batch_item_id, dimension_id, human_value, human_confidence, human_rationale, human_option_id } = payload || {} as SubmitHumanReviewPayload;

    if (!article_batch_item_id || !dimension_id) {
      return { success: false, error: "Faltan 'article_batch_item_id' o 'dimension_id'" };
    }
    if (typeof human_value !== 'string' || human_value.trim() === '') {
      return { success: false, error: "'human_value' debe ser un string no vacío" };
    }
    if (![1,2,3].includes(Number(human_confidence))) {
      return { success: false, error: "'human_confidence' debe ser 1, 2 o 3" };
    }

    // Usar cliente autenticado por sesión (RLS) para todas las operaciones en este flujo
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuario no autenticado.' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { success: false, error: 'No se pudo obtener el token de sesión.' };
    const db = createSupabaseUserClient(session.access_token);

    // 1) Obtener datos del item para derivar article_id y batch_id
    const { data: itemRow, error: itemErr } = await db
      .from('article_batch_items')
      .select('id, article_id, batch_id, status')
      .eq('id', article_batch_item_id)
      .single();
    if (itemErr || !itemRow) {
      return { success: false, error: `No se encontró el item del lote: ${itemErr?.message || 'no encontrado'}` };
    }

    // 2) Calcular siguiente iteración
    const { data: existing, error: iterErr } = await db
      .from('article_dimension_reviews')
      .select('iteration')
      .eq('article_batch_item_id', article_batch_item_id)
      .eq('dimension_id', dimension_id);
    if (iterErr) {
      return { success: false, error: `Error consultando iteraciones: ${iterErr.message}` };
    }
    const nextIteration = (existing || []).reduce((max, r) => Math.max(max, r.iteration ?? 0), 0) + 1;

    // 3) Insertar revisión humana
    const insertRow: ReviewInsertWithOptionalFields = {
      article_batch_item_id,
      article_id: itemRow.article_id,
      dimension_id,
      classification_value: human_value.trim(),
      option_id: human_option_id ?? null,
      confidence_score: Number(human_confidence),
      rationale: human_rationale ?? null,
      reviewer_type: 'human',
      reviewer_id: user.id,
      iteration: nextIteration,
      prevalidated: false,
      is_final: false,
    };

    const { data: inserted, error: insErr } = await db
      .from('article_dimension_reviews')
      .insert(insertRow)
      .select('id')
      .single();
    if (insErr || !inserted) {
      return { success: false, error: `Error guardando revisión humana: ${insErr?.message}` };
    }

    // 4) Cambiar estados en cascada a 'reconciliation_pending'
    const { error: updItemErr } = await db
      .from('article_batch_items')
      .update({ status: 'reconciliation_pending' })
      .eq('id', article_batch_item_id);
    if (updItemErr) {
      // Registrar pero no abortar, ya hay revisión guardada
      console.warn('[submitHumanReview] Revisión guardada, pero fallo actualizando estado del item:', updItemErr.message);
    }

    const { error: updBatchErr } = await db
      .from('article_batches')
      .update({ status: 'reconciliation_pending' })
      .eq('id', itemRow.batch_id);
    if (updBatchErr) {
      console.warn('[submitHumanReview] Revisión guardada, pero fallo actualizando estado del lote:', updBatchErr.message);
    }

    return { success: true, data: { reviewId: inserted.id } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: `Error interno en submitHumanReview: ${msg}` };
  }
}

export async function getArticlesForTranslation(batchId: string): Promise<ResultadoOperacion<{id: string, title: string | null, abstract: string | null}[]>> {
    if (!batchId) return { success: false, error: "Se requiere ID de lote." };
    try {
        const supabase = await createSupabaseServerClient();
        const { data: batchItems, error: itemsError } = await supabase
            .from("article_batch_items")
            .select("articles(id, title, abstract)")
            .eq("batch_id", batchId);

        if (itemsError) throw new Error(`Error obteniendo ítems del lote: ${itemsError.message}`);
        if (!batchItems) return { success: true, data: [] };

        const articles = batchItems.map(item => item.articles).filter(Boolean);
        return { success: true, data: articles as {id: string, title: string | null, abstract: string | null}[] };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error interno: ${msg}` };
    }
}

/**
 * Obtiene todos los datos necesarios para renderizar la vista de detalle de un lote.
 * **VERSIÓN REFACTORIZADA PARA SER CONSCIENTE DE LAS FASES**
 */
export async function getBatchDetailsForReview(batchId: string): Promise<ResultadoOperacion<BatchDetails>> {
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
            throw new Error(`Lote no encontrado o no está asociado a una fase: ${batchError?.message || 'No encontrado'}`);
        }
        
        const { data: dimensions, error: dimensionsError } = await supabase
            .from("preclass_dimensions")
            .select("*, preclass_dimension_options(*)")
            .eq("phase_id", batch.phase_id)
            .eq('status', 'active') // Solo dimensiones activas
            .order("ordering");

        if (dimensionsError) throw new Error(`Error obteniendo dimensiones de la fase: ${dimensionsError.message}`);
        
        const { data: batchItems, error: itemsError } = await supabase
            .from("article_batch_items")
            .select(`
                id, status, ai_keywords, ai_process_opinion,
                articles (id, correlativo, publication_year, journal, title, abstract, article_translations(title, abstract, summary))
            `)
            .eq("batch_id", batchId);
            
        if (itemsError) throw new Error(`Error obteniendo ítems del lote: ${itemsError.message}`);
        if (!batchItems) return { success: false, error: "No se encontraron artículos en el lote." };

        const itemIds = batchItems.map(item => item.id);

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
            const { data: bulkNotes, error: bulkErr } = await supabase
                .rpc('bulk_get_notes_info_for_batch', { p_batch_id: batchId });

            if (!bulkErr && Array.isArray(bulkNotes)) {
                notesByItem = (bulkNotes as BulkNotesRow[]).reduce((acc, r) => {
                    acc[r.item_id] = {
                        article_id: r.article_id ?? null,
                        has_notes: Boolean(r.has_notes ?? false),
                        note_count: r.note_count ?? 0,
                        note_ids: r.note_ids ?? []
                    };
                    return acc;
                }, {} as Record<string, NotesInfo>);
            } else if (bulkErr) {
                console.warn('[getBatchDetailsForReview] bulk_get_notes_info_for_batch RPC error:', bulkErr);
            }
        } catch (e) {
            console.warn('[getBatchDetailsForReview] Excepción llamando RPC bulk_get_notes_info_for_batch:', e);
        }
        // 🔁 Fallback: si la RPC no existe o no devolvió datos, calculamos presencia de notas por artículo
        if (Object.keys(notesByItem).length === 0) {
            try {
                const articleIds = (batchItems || [])
                    .map(item => item.articles?.id)
                    .filter((v): v is string => Boolean(v));

                if (articleIds.length > 0) {
                    const { data: noteRows, error: notesError } = await supabase
                        .from('article_notes')
                        .select('id, article_id')
                        .in('article_id', articleIds);

                    if (!notesError && Array.isArray(noteRows)) {
                        const notesByArticleId = (noteRows as { id: string; article_id: string }[]).reduce((acc, r) => {
                            (acc[r.article_id] ||= []).push(r.id);
                            return acc;
                        }, {} as Record<string, string[]>);

                        notesByItem = (batchItems || []).reduce((acc, item) => {
                            const aId = item.articles?.id || null;
                            const ids = aId ? (notesByArticleId[aId] || []) : [];
                            acc[item.id] = {
                                article_id: aId,
                                has_notes: ids.length > 0,
                                note_count: ids.length,
                                note_ids: ids,
                            };
                            return acc;
                        }, {} as Record<string, NotesInfo>);
                        console.log('[getBatchDetailsForReview] Fallback de notas aplicado (sin RPC).');
                    } else {
                        console.warn('[getBatchDetailsForReview] Fallback: error/resultado inválido consultando article_notes:', notesError);
                        // Generar estructura vacía para cada item para evitar undefineds aguas abajo
                        notesByItem = (batchItems || []).reduce((acc, item) => {
                            acc[item.id] = { article_id: item.articles?.id || null, has_notes: false, note_count: 0, note_ids: [] };
                            return acc;
                        }, {} as Record<string, NotesInfo>);
                    }
                } else {
                    // No hay artículos; inicializar vacío por cada item
                    notesByItem = (batchItems || []).reduce((acc, item) => {
                        acc[item.id] = { article_id: item.articles?.id || null, has_notes: false, note_count: 0, note_ids: [] };
                        return acc;
                    }, {} as Record<string, NotesInfo>);
                }
            } catch (fallbackErr) {
                console.warn('[getBatchDetailsForReview] Excepción en fallback de notas:', fallbackErr);
                // Como último recurso, inicializar con valores vacíos
                notesByItem = (batchItems || []).reduce((acc, item) => {
                    acc[item.id] = { article_id: item.articles?.id || null, has_notes: false, note_count: 0, note_ids: [] };
                    return acc;
                }, {} as Record<string, NotesInfo>);
            }
        }
        const { data: allReviews = [], error: reviewsError } = await supabase
            .from("article_dimension_reviews")
            .select("*")
            .in("article_batch_item_id", itemIds);
            
        if(reviewsError) throw new Error(`Error obteniendo revisiones: ${reviewsError.message}`);
        
        const rows: ArticleForReview[] = batchItems.map(item => {
            const safeReviews = (allReviews || []) as ReviewRowWithOptionalFields[];
            const articleStatus = (item as { status?: Database["public"]["Enums"]["batch_preclass_status"] | null }).status || 'pending';
            const validStatuses = ['pending', 'translated', 'review_pending', 'reconciliation_pending', 'validated', 'reconciled', 'disputed'] as const;
            type ItemStatus = typeof validStatuses[number];
            const safeStatus: ItemStatus = (validStatuses as readonly string[]).includes(articleStatus as string) ? articleStatus as ItemStatus : 'pending';

            return {
                item_id: item.id,
                article_id: item.articles?.id || '', // 🎯 OPTIMIZACIÓN: ID directo del artículo
                article_status: safeStatus,
                article_data: {
                    correlativo: ((item.articles as unknown) as { correlativo?: number | null })?.correlativo ?? null,
                    publication_year: item.articles?.publication_year || null,
                    journal: item.articles?.journal || null,
                    original_title: item.articles?.title || null,
                    original_abstract: item.articles?.abstract || null,
                    translated_title: item.articles?.article_translations?.[0]?.title || null,
                    translated_abstract: item.articles?.article_translations?.[0]?.abstract || null,
                    translation_summary: item.articles?.article_translations?.[0]?.summary || null,
                },
                ai_summary: {
                    keywords: item.ai_keywords,
                    process_opinion: item.ai_process_opinion
                },
                classifications: dimensions.reduce((acc, dim) => {
                    const reviewsForDim = safeReviews.filter(r => r.article_batch_item_id === item.id && r.dimension_id === dim.id);
                    if (reviewsForDim.length > 0) {
                        acc[dim.id] = reviewsForDim.map(r => ({
                            reviewer_type: r.reviewer_type as 'ai' | 'human',
                            reviewer_id: r.reviewer_id,
                            iteration: r.iteration,
                            value: r.classification_value,
                            confidence: r.confidence_score,
                            rationale: r.rationale,
                            option_id: r.option_id ?? undefined,
                            prevalidated: r.prevalidated,
                            is_final: r.is_final,
                        }));
                    }
                    return acc;
                }, {} as Record<string, ClassificationReview[]>),
                // Adjuntar notas si están disponibles
                notes_info: notesByItem[item.id]
            };
        });

        // Tipos estrictos para filas de dimensiones y opciones
        type DimRow = Database['public']['Tables']['preclass_dimensions']['Row'] & {
            preclass_dimension_options?: Database['public']['Tables']['preclass_dimension_options']['Row'][] | null;
        };

        return {
            success: true,
            data: {
                columns: (dimensions as DimRow[]).map(d => {
                    const opts = d.preclass_dimension_options ?? [];
                    const optionEmoticons = opts.reduce((acc: Record<string, string | null>, o) => {
                        if (typeof o.value !== 'undefined' && o.value !== null) {
                            acc[String(o.value)] = o.emoticon ?? null;
                        }
                        return acc;
                    }, {});
                    return {
                        id: d.id,
                        name: d.name,
                        type: d.type,
                        options: opts.map(o => o.value),
                        icon: d.icon ?? null,
                        optionEmoticons,
                    };
                }),
                rows,
                batch_number: batch.batch_number || 0,
                id: batchId,
                name: batch.name || null,
                status: batch.status as Database["public"]["Enums"]["batch_preclass_status"]
            }
        };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error interno obteniendo detalles del lote: ${msg}` };
    }
}

// ========================================================================
//	ACCIONES DE MODIFICACIÓN (WRITE)
// ========================================================================

export async function saveBatchTranslations(
    batchId: string,
    articles: TranslatedArticlePayload[]
): Promise<ResultadoOperacion<{ upsertedCount: number }>> {
    if (!batchId || !articles || articles.length === 0) {
        return { success: false, error: "Se requiere ID de lote y al menos un artículo." };
    }
    try {
        const admin = await createSupabaseServiceRoleClient();
        const translationsToUpsert = articles.map(article => ({
            article_id: article.articleId,
            title: article.title,
            abstract: article.abstract,
            summary: article.summary,
            language: 'es' // Asumimos español por ahora
        }));

        const { count, error: upsertError } = await admin
            .from('article_translations')
            .upsert(translationsToUpsert, { onConflict: 'article_id, language' });

        if (upsertError) throw upsertError;

        // Actualizar estado del lote a 'traducido'
        const { error: batchUpdateError } = await admin
            .from('article_batches')
            .update({ status: 'translated' })
            .eq('id', batchId);

        if (batchUpdateError) {
            console.warn(`Traducciones guardadas, pero no se pudo actualizar el estado del lote ${batchId}: ${batchUpdateError.message}`);
        }

        // Sincronizar estado de todos los ítems del lote a 'translated'
        const { error: itemsUpdateError } = await admin
            .from('article_batch_items')
            .update({ status: 'translated' })
            .eq('batch_id', batchId);

        if (itemsUpdateError) {
            console.warn(`Traducciones guardadas, pero no se pudo actualizar el estado de los ítems del lote ${batchId}: ${itemsUpdateError.message}`);
        }

        return { success: true, data: { upsertedCount: count || 0 } };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error guardando traducciones: ${msg}` };
    }
}

/**
 * Inicia el proceso de preclasificación de un lote en el backend.
 * Retorna inmediatamente con un ID de trabajo para monitoreo.
 */
export async function startInitialPreclassification(batchId: string): Promise<ResultadoOperacion<{ jobId: string }>> {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado." };
    
    const { data: batch, error: batchError } = await supabase.from('article_batches').select('*, projects(id)').eq('id', batchId).single();
    if (batchError || !batch) return { success: false, error: "Lote no encontrado." };
    if (batch.status !== 'translated') return { success: false, error: "El lote debe estar en estado 'traducido' para iniciar la preclasificación." };
    
    // Crear cliente autenticado con RLS usando el token del usuario
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        return { success: false, error: "No se pudo obtener el token de sesión para crear el job." };
    }
    const db = createSupabaseUserClient(session.access_token);

    // 🎯 LÓGICA ROBUSTA: Crear job primero, luego validar con UUID como llave maestra
    
    // 🚀 PASO 1: CREAR JOB Y OBTENER UUID REAL DE SUPABASE
    const { data: job, error: jobError } = await db.from('ai_job_history').insert({
        project_id: batch.projects!.id,
        user_id: user.id,
        job_type: 'PRECLASSIFICATION',
        status: 'running',
        description: `Preclasificando Lote #${batch.batch_number}`,
        progress: 0,
        details: { 
            batchId: batchId,
            total: 0, 
            processed: 0, 
            step: 'Iniciando...' 
        }
    }).select('id').single();
    
    if (jobError || !job) {
        console.error('🚨 Error creando el job:', jobError);
        return { success: false, error: `No se pudo crear el registro del job: ${jobError?.message}` };
    }
    
    const jobUUID = job.id; // 🔑 LLAVE MAESTRA: UUID real de Supabase
    console.log(`✅ [startInitialPreclassification] Job creado con UUID: ${jobUUID}`);
    
    // 🔍 PASO 2: VALIDAR SI HAY OTRO JOB RUNNING PARA ESTE LOTE (CON UUID DISTINTO)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    
    const { data: otherJobs, error: duplicateCheckError } = await db
        .from('ai_job_history')
        .select('id, status, description')
        .eq('job_type', 'PRECLASSIFICATION')
        .eq('project_id', batch.projects!.id)
        .eq('status', 'running')
        .gte('started_at', twentyMinutesAgo)
        .ilike('description', `%Lote #${batch.batch_number}%`)
        .neq('id', jobUUID); // 🎯 CLAVE: Excluir el job recién creado
    
    if (duplicateCheckError) {
        console.error('🚨 Error verificando duplicados:', duplicateCheckError);
        // 🚨 MARCAR JOB COMO FALLIDO Y ABORTAR
        await db.from('ai_job_history')
            .update({ status: 'failed', error_message: 'Error verificando duplicados', progress: 100 })
            .eq('id', jobUUID);
        return { success: false, error: "Error verificando trabajos duplicados." };
    }
    
    // 🚨 PASO 3: SI HAY DUPLICADOS, MARCAR COMO FALLIDO Y ABORTAR
    if (otherJobs && otherJobs.length > 0) {
        console.warn(`🚨 [startInitialPreclassification] Duplicado detectado, abortando job ${jobUUID}:`, {
            jobUUID,
            lote: batchId,
            batchNumber: batch.batch_number,
            otrosJobs: otherJobs.map((j: { id: string; status: string }) => ({ id: j.id, status: j.status }))
        });
        
        // 🚨 MARCAR JOB COMO FALLIDO POR DUPLICACIÓN
        await db.from('ai_job_history')
            .update({ 
                status: 'failed', 
                error_message: `Trabajo duplicado detectado para Lote #${batch.batch_number}`,
                progress: 100,
                completed_at: new Date().toISOString()
            })
            .eq('id', jobUUID);
            
        return { 
            success: false, 
            error: `Ya existe un trabajo de preclasificación en curso para el Lote #${batch.batch_number}. Por favor, espera a que termine.` 
        };
    }
    
    // ✅ PASO 4: NO HAY DUPLICADOS, INICIAR PROCESO Y ESCUCHAR SOLO ESTE UUID
    console.log(`✅ [startInitialPreclassification] Sin duplicados, iniciando proceso para UUID: ${jobUUID}`);
    
    // 🚀 Iniciar el trabajo en background
    runPreclassificationJob(jobUUID, batchId, user.id, session.access_token); 
    
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
 * Helper que construye el prompt dinámico para la IA.
 */
function buildPreclassificationPrompt(
    project: { name: string; proposal: string | null; proposal_bibliography: string | null; },
    dimensions: DimensionForPrompt[],
    articleChunk: ArticleForPrompt[]
): string {
    const dimensionDetails = dimensions.map(dim => {
        let instructionForDim = '';
        if (dim.type === 'finite') {
            const optionsString = dim.preclass_dimension_options.map(opt => `"${opt.value}"`).join(', ');
            
            // 🧠 LÓGICA INTELIGENTE: Detectar si existe opción "Otros" para permitir flexibilidad
            const hasOtrosOption = dim.preclass_dimension_options.some(opt => 
                opt.value.toLowerCase().startsWith('otros')
            );
            
            instructionForDim = `
- Tipo: Opción Múltiple.
- Instrucción: Para esta dimensión, DEBES escoger uno de los siguientes valores de la lista.
- Opciones Válidas: [${optionsString}]`;
            
            if (hasOtrosOption) {
                instructionForDim += `
- **Nota Especial para 'Otros':** Si ninguna de las opciones encaja perfectamente, puedes usar la opción que comienza con 'Otros:' y reemplazar la palabra 'Especificar' con un resumen muy breve (1-5 palabras) del tema real que has identificado.`;
            }
        } else { // 'open'
            instructionForDim = `
- Tipo: Respuesta Abierta.
- Instrucción: Para esta dimensión, DEBES generar una respuesta de texto libre y concisa (1-2 frases) basada en el contenido del artículo.`;
        }

        return `
**Dimensión: "${dim.name}"**
- Descripción: ${dim.description}
${instructionForDim}`;
    }).join('\n---\n');

    const articleDetails = articleChunk.map(item => `
---
**Artículo ID:** "${item.id}"
- Revista: ${item.articles?.journal}
- Año de Publicación: ${item.articles?.publication_year}
- Título: ${item.articles?.title}
- Abstract: ${item.articles?.abstract}
    `).join('');

    return `### ROL Y CONTEXTO GLOBAL ###
Eres un asistente de investigación experto en análisis bibliográfico. Tu tarea es colaborar en la preclasificación de artículos para el proyecto de investigación titulado: "${project.name}".
Propósito del Proyecto: ${project.proposal}
Objetivo de esta Fase Bibliográfica: ${project.proposal_bibliography}

### INSTRUCCIONES DE CLASIFICACIÓN ###
A continuación, te proporcionaré las definiciones de ${dimensions.length} dimensiones y un lote de ${articleChunk.length} artículos.
Debes analizar el texto original de cada artículo y clasificarlo según CADA dimensión.
**Importante:** Todas tus justificaciones ("rationale") deben estar escritas en **español**.
Tu respuesta debe ser OBLIGATORIAMENTE un objeto JSON válido, sin ningún texto antes o después del bloque JSON.

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
 * Helper que ejecuta el trabajo de preclasificación con mecanismo de repechaje.
 * Implementa el principio "Todo o Nada" con integridad transaccional.
 */
async function runPreclassificationJob(jobId: string, batchId: string, userId: string, accessToken: string) {
    // Operar con cliente autenticado (RLS)
    const db = createSupabaseUserClient(accessToken);

    try {
        const { data: batchData } = await db.from('article_batches').select('phase_id, projects(id, name, proposal, proposal_bibliography)').eq('id', batchId).single();
        if (!batchData?.phase_id || !batchData.projects) throw new Error("Datos del lote o proyecto no encontrados.");

        const { data: items, error: itemsError } = await db.from('article_batch_items').select('id, articles(id, title, abstract, publication_year, journal)').eq('batch_id', batchId);
        if (itemsError || !items) throw new Error("No se encontraron artículos para procesar.");
        
        const { data: dimensions, error: dimsError } = await db.from('preclass_dimensions').select('id, name, description, type, preclass_dimension_options(id, value)').eq('phase_id', batchData.phase_id).eq('status', 'active');
        if (dimsError || !dimensions) throw new Error("No se encontraron dimensiones para la fase.");

        await db.from('ai_job_history').update({ details: { total: items.length, processed: 0, step: 'Datos preparados' } }).eq('id', jobId);

        // 🎯 ARRAYS PARA REPECHAJE Y INTEGRIDAD TRANSACCIONAL
        const articulosParaRepechaje: ArticleForPrompt[] = [];
        const clasificacionesExitosasTemporales: ReviewInsertWithOptionalFields[] = [];
        
        // 🛡️ FUNCIÓN ROBUSTA PARA MAPEAR CONFIDENCE_SCORE
        const mapConfidenceToScore = (confidenceText: string): number => {
            if (typeof confidenceText !== 'string') {
                throw new Error(`Valor de confianza inválido, se esperaba un string: "${confidenceText}"`);
            }
            const lowerConfidence = confidenceText.toLowerCase();
            switch (lowerConfidence) {
                case 'alta': return 3;
                case 'media': return 2;
                case 'baja': return 1;
                default:
                    throw new Error(`Valor de confianza no reconocido: "${confidenceText}"`);
            }
        };

        // 🔧 NORMALIZAR STRINGS: Limpiar espacios y caracteres invisibles
        const normalizeString = (str: string) => str.trim().replace(/\s+/g, ' ');

        // 🎯 FUNCIÓN INTERNA PARA PROCESAR CHUNKS CON MANEJO GRANULAR
        const processArticleChunk = async (chunk: ArticleForPrompt[], attemptNumber: number) => {
            const chunkFailedArticles: ArticleForPrompt[] = [];
            const chunkSuccessfulReviews: ReviewInsertWithOptionalFields[] = [];
            
            let prompt = '';
            let rawResponse = '';
            let cleanedResponse = '';

            try {
                prompt = buildPreclassificationPrompt(batchData.projects, dimensions as DimensionForPrompt[], chunk);
                
                // 📝 LOGGING DETALLADO: Prompt enviado
                console.log(`\n🚀 [${jobId}] INTENTO ${attemptNumber} - PROMPT ENVIADO A GEMINI:`);
                console.log('=' .repeat(100));
                console.log(prompt);
                console.log('=' .repeat(100));
                
                const { result, usage } = await callGeminiAPI('gemini-1.5-flash', prompt);
                rawResponse = result;
                
                // 📝 LOGGING DETALLADO: Respuesta recibida
                console.log(`\n📥 [${jobId}] INTENTO ${attemptNumber} - RESPUESTA RECIBIDA DE GEMINI:`);
                console.log('=' .repeat(100));
                console.log(rawResponse);
                console.log('=' .repeat(100));
                
                let cleanResult = result.trim();
                if (cleanResult.startsWith('```json')) {
                    cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanResult.startsWith('```')) {
                    cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                cleanedResponse = cleanResult;
                
                console.log(`\n🧹 [${jobId}] INTENTO ${attemptNumber} - JSON LIMPIO PARA PARSING:`);
                console.log('=' .repeat(80));
                console.log(cleanedResponse);
                console.log('=' .repeat(80));
                
                const parsedResult = JSON.parse(cleanResult);
                if (!Array.isArray(parsedResult)) {
                    throw new Error('La respuesta de la IA no es un array válido');
                }

                for (const item of parsedResult) {
                    const currentArticle = chunk.find(art => art.id === item.itemId);
                    if (!currentArticle) continue;
                    
                    try {
                        const articleReviews: ReviewInsertWithOptionalFields[] = [];
                        const articleId = currentArticle.articles?.id;
                        if (!articleId) {
                            throw new Error(`No se encontró article_id para el ítem de lote ${item.itemId}`);
                        }
                        
                        for (const dimensionName in item.classifications) {
                            const foundDimension = dimensions.find(dim => dim.id === dimensionName || dim.name === dimensionName);
                            if (!foundDimension) {
                                throw new Error(`La IA devolvió una dimensión desconocida: "${dimensionName}"`);
                            }

                            const classification = item.classifications[dimensionName];
                            const valueToSave = classification.value;
                            let optionId: string | null = null;

                            if (foundDimension.type === 'finite') {
                                const validOptions = foundDimension.preclass_dimension_options.map(opt => opt.value);
                                const normalizedValue = normalizeString(valueToSave);
                                const normalizedOptions = validOptions.map(opt => normalizeString(opt));

                                const exactMatchIndex = normalizedOptions.findIndex(opt => opt === normalizedValue);
                                const isExactMatch = exactMatchIndex !== -1;

                                const otherOption = validOptions.find(opt => normalizeString(opt).toLowerCase().startsWith('otros'));
                                const isSmartOther = otherOption && typeof valueToSave === 'string' && normalizedValue.toLowerCase().startsWith('otros');

                                if (!isExactMatch && !isSmartOther) {
                                    throw new Error(`Valor "${valueToSave}" inválido para la dimensión finita "${foundDimension.name}". Opciones válidas: ${validOptions.join(', ')}`);
                                }

                                // Mapear option_id para dimensiones finitas
                                const optionsWithIds = (foundDimension.preclass_dimension_options as { id?: string; value: string }[]);
                                if (isExactMatch) {
                                    optionId = optionsWithIds[exactMatchIndex]?.id ?? null;
                                } else if (isSmartOther) {
                                    const otherObj = optionsWithIds.find(o => normalizeString(o.value).toLowerCase().startsWith('otros'));
                                    optionId = otherObj?.id ?? null;
                                }
                            }

                            articleReviews.push({
                                article_id: articleId,
                                article_batch_item_id: item.itemId,
                                dimension_id: foundDimension.id,
                                reviewer_type: 'ai',
                                reviewer_id: userId,
                                iteration: attemptNumber,
                                classification_value: valueToSave,
                                confidence_score: mapConfidenceToScore(classification.confidence),
                                rationale: classification.rationale,
                                option_id: optionId,
                                prevalidated: false,
                                is_final: false,
                            });
                        }

                        chunkSuccessfulReviews.push(...articleReviews);
                        console.log(`✅ [${jobId}] INTENTO ${attemptNumber} - Artículo ${item.itemId} procesado exitosamente con ${articleReviews.length} clasificaciones`);
                        
                    } catch (articleError) {
                        // ❌ LOGGING DETALLADO: Error procesando artículo individual
                        console.error(`\n❌ [${jobId}] INTENTO ${attemptNumber} - ERROR PROCESANDO ARTÍCULO ${item.itemId}:`);
                        console.error('PROMPT ENVIADO:');
                        console.error('=' .repeat(80));
                        console.error(prompt);
                        console.error('=' .repeat(80));
                        console.error('RESPUESTA RECIBIDA:');
                        console.error('=' .repeat(80));
                        console.error(rawResponse);
                        console.error('=' .repeat(80));
                        console.error('JSON LIMPIO:');
                        console.error('=' .repeat(80));
                        console.error(cleanedResponse);
                        console.error('=' .repeat(80));
                        console.error('ERROR ESPECÍFICO:', articleError instanceof Error ? articleError.message : 'Error desconocido');
                        console.error('STACK TRACE:', articleError instanceof Error ? articleError.stack : 'No disponible');
                        console.error('=' .repeat(80));
                        
                        chunkFailedArticles.push(currentArticle);
                    }
                }

                await db.rpc('increment_job_tokens', {
                    job_id: jobId,
                    input_increment: usage?.promptTokenCount || 0,
                    output_increment: usage?.candidatesTokenCount || 0
                });

                return {
                    success: true,
                    failedArticles: chunkFailedArticles,
                    successfulReviews: chunkSuccessfulReviews
                };

            } catch (chunkError) {
                // ❌ LOGGING DETALLADO: Error procesando chunk completo
                console.error(`\n❌❌ [${jobId}] INTENTO ${attemptNumber} - ERROR CRÍTICO PROCESANDO CHUNK COMPLETO:`);
                console.error('CHUNK AFECTADO:', chunk.map(art => ({ id: art.id, articles: art.articles ? { title: art.articles.title?.substring(0, 50) + '...' } : 'Sin datos' })));
                console.error('PROMPT ENVIADO:');
                console.error('=' .repeat(100));
                console.error(prompt || 'No se pudo generar el prompt');
                console.error('=' .repeat(100));
                console.error('RESPUESTA RECIBIDA:');
                console.error('=' .repeat(100));
                console.error(rawResponse || 'No se recibió respuesta de la IA');
                console.error('=' .repeat(100));
                console.error('JSON LIMPIO:');
                console.error('=' .repeat(100));
                console.error(cleanedResponse || 'No se pudo limpiar la respuesta');
                console.error('=' .repeat(100));
                console.error('ERROR CRÍTICO:', chunkError instanceof Error ? chunkError.message : 'Error desconocido');
                console.error('STACK TRACE:', chunkError instanceof Error ? chunkError.stack : 'No disponible');
                console.error('TIPO DE ERROR:', chunkError instanceof Error ? chunkError.constructor.name : typeof chunkError);
                console.error('=' .repeat(100));
                console.error('🚨 TODOS LOS ARTÍCULOS DEL CHUNK VAN A REPECHAJE');
                console.error('=' .repeat(100));
                
                return {
                    success: false,
                    failedArticles: chunk,
                    successfulReviews: []
                };
            }
        };

        // 🎯 BUCLE PRINCIPAL (PRIMER INTENTO)
        const miniBatchSize = 5;
        let processedCount = 0;

        for (let i = 0; i < items.length; i += miniBatchSize) {
            const chunk = (items.slice(i, i + miniBatchSize) as ArticleForPrompt[]);

            await db.from('ai_job_history').update({
                progress: (processedCount / items.length) * 50,
                details: {
                    total: items.length,
                    processed: processedCount,
                    step: `Clasificando artículos (${processedCount}/${items.length})`
                }
            }).eq('id', jobId);

            const result = await processArticleChunk(chunk, 1);

            processedCount += chunk.length;

            if (!result.success) {
                articulosParaRepechaje.push(...result.failedArticles);
            }
            if (result.successfulReviews.length > 0) {
                clasificacionesExitosasTemporales.push(...result.successfulReviews);
            }
        }

        // 🎯 BUCLE DE REPECHAJE (SEGUNDA OPORTUNIDAD)
        if (articulosParaRepechaje.length > 0) {
            console.log(`\n🔄 [${jobId}] INICIANDO REPECHAJE - ${articulosParaRepechaje.length} artículos necesitan segunda oportunidad`);

            for (let i = 0; i < articulosParaRepechaje.length; i += miniBatchSize) {
                const repechageChunk = articulosParaRepechaje.slice(i, i + miniBatchSize);

                await db.from('ai_job_history').update({
                    progress: 50 + ((i / articulosParaRepechaje.length) * 40),
                    details: {
                        total: items.length,
                        processed: processedCount,
                        step: `Repechaje (${Math.min(i + miniBatchSize, articulosParaRepechaje.length)}/${articulosParaRepechaje.length})`
                    }
                }).eq('id', jobId);

                const repeResult = await processArticleChunk(repechageChunk as ArticleForPrompt[], 2);
                if (repeResult.successfulReviews.length > 0) {
                    clasificacionesExitosasTemporales.push(...repeResult.successfulReviews);
                }
                if (!repeResult.success) {
                    // Los que fallan aquí quedan como fallidos definitivos; no se insertan
                }
            }
        }

        // 🚀 Persistir clasificaciones si existen; sino, marcar como fallo
        if (clasificacionesExitosasTemporales.length > 0) {
            console.log(`\n🚀 [${jobId}] EJECUTANDO INSERCIÓN MASIVA EN article_dimension_reviews...`);
            const { error: insertError } = await db
                .from('article_dimension_reviews')
                .insert(clasificacionesExitosasTemporales);
            if (insertError) {
                console.error(`❌ [${jobId}] ERROR EN INSERCIÓN MASIVA:`, insertError);
                await db.from('ai_job_history').update({ status: 'failed', progress: 100, error_message: insertError.message }).eq('id', jobId);
                throw insertError;
            }
        } else {
            console.warn(`⚠️ [${jobId}] No se generaron filas para insertar en article_dimension_reviews (posible problema con la IA).`);
            await db.from('ai_job_history').update({ status: 'failed', progress: 100, error_message: 'Sin clasificaciones válidas para guardar' }).eq('id', jobId);
            throw new Error('No se generaron clasificaciones válidas para guardar.');
        }

        // ✅ Completar job y actualizar estados
        await db.from('ai_job_history').update({
            status: 'completed',
            progress: 100,
            details: { total: items.length, processed: processedCount, step: 'Completado' },
            completed_at: new Date().toISOString(),
        }).eq('id', jobId);

        const { error: itemsToReviewError } = await db
            .from('article_batch_items')
            .update({ status: 'review_pending' })
            .eq('batch_id', batchId);
        if (itemsToReviewError) {
            console.warn(`[${jobId}] Preclasificación completada, pero no se pudo actualizar estado de ítems a 'review_pending': ${itemsToReviewError.message}`);
        }
        await db.from('article_batches').update({ status: 'review_pending' }).eq('id', batchId);

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        await db.from('ai_job_history').update({ status: 'failed', progress: 100, details: { error: msg } }).eq('id', jobId);
    }
}

export async function submitHumanDiscrepancy(payload: SubmitHumanReviewPayload, userId: string): Promise<ResultadoOperacion<{ reviewId: string }>> {
    try {
        const articleIdResult = await getArticleIdFromBatchItemId(payload.article_batch_item_id);
        if (!articleIdResult.success) {
            throw new Error(articleIdResult.error);
        }
        const articleId = articleIdResult.data.articleId;

        // Usar cliente admin para inserción con posible option_id
        const admin = await createSupabaseServiceRoleClient();
        const { data, error } = await admin
            .from('article_dimension_reviews')
            .insert({
                article_id: articleId,
                article_batch_item_id: payload.article_batch_item_id,
                dimension_id: payload.dimension_id,
                reviewer_type: 'human',
                reviewer_id: userId,
                iteration: 2,
                classification_value: payload.human_value,
                confidence_score: payload.human_confidence,
                rationale: payload.human_rationale,
                option_id: payload.human_option_id ?? null,
            } as ReviewInsertWithOptionalFields)
            .select('id')
            .single();

        if (error) throw error;
        return { success: true, data: { reviewId: data.id } };

    } catch(error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error guardando la revisión: ${msg}` };
    }
}

export async function reclassifyDiscrepancies(batchId: string): Promise<ResultadoOperacion<{ reclassifiedCount: number }>> {
    const admin = await createSupabaseServiceRoleClient();
    await admin.from('article_batches').update({ status: 'reconciliation_pending' }).eq('id', batchId);
    return { success: true, data: { reclassifiedCount: 0 } };
}

export async function finalizeBatch(batchId: string): Promise<ResultadoOperacion<{ finalStatus: string }>> {
    if (!batchId) return { success: false, error: "Se requiere ID de lote." };
    try {
        const supabase = await createSupabaseServerClient();
        const admin = await createSupabaseServiceRoleClient();
        
        const { data: items, error: itemsError } = await supabase
            .from('article_batch_items')
            .select('status')
            .eq('batch_id', batchId);
        if (itemsError) throw itemsError;

        const pendingItems = items.filter(item => ['review_pending', 'reconciliation_pending'].includes((item as { status?: string | null }).status || ''));
        if (pendingItems.length > 0) {
            return { success: false, error: `Aún hay ${pendingItems.length} artículos pendientes de revisión en este lote.` };
        }

        const itemStatuses = new Set(items.map(i => (i as { status?: string | null }).status));
        let finalBatchStatus: Database["public"]["Enums"]["batch_preclass_status"];

        if (itemStatuses.has('disputed')) {
            finalBatchStatus = 'disputed';
        } else if (itemStatuses.has('reconciled')) {
            finalBatchStatus = 'reconciled';
        } else {
            finalBatchStatus = 'validated';
        }

        const { error: updateError } = await admin
            .from('article_batches')
            .update({ status: finalBatchStatus })
            .eq('id', batchId);
        if (updateError) throw updateError;
        
        return { success: true, data: { finalStatus: finalBatchStatus } };

    } catch(error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error finalizando el lote: ${msg}` };
    }
}

// ------------------------------------------------------------------------
// Obtener resumen de preclasificación por artículo (agrupado por fase)
// ------------------------------------------------------------------------
type PhaseSummary = {
    phase: { id: string; name: string | null; phase_number: number | null };
    batch: { id: string; batch_number: number | null; status: Database["public"]["Enums"]["batch_preclass_status"] | null };
    item_id: string;
    dimensions: { id: string; name: string; type: string; options: Array<string | { value: string | number; label: string }>; icon?: string | null; optionEmoticons?: Record<string, string | null>; }[];
    classifications: Record<string, ClassificationReview[]>;
};

export async function getPreclassificationByArticleId(articleId: string): Promise<ResultadoOperacion<PhaseSummary[]>> {
    if (!articleId) return { success: false, error: "Se requiere el ID del artículo." };
    try {
        const supabase = await createSupabaseServerClient();

        // 1) Ítems de lote donde participa el artículo + datos del lote
        const { data: items, error: itemsError } = await supabase
            .from('article_batch_items')
            .select('id, batch_id, status, article_id, article_batches(id, batch_number, status, phase_id)')
            .eq('article_id', articleId);
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
                (itemsTyped
                    .map(i => i.article_batches?.phase_id)
                    .filter((v): v is string => Boolean(v)))
            )
        );

        // Guardar: si no hay fases asociadas, no consultar con IN [] y devolvemos vacío
        if (phaseIds.length === 0) {
            return { success: true, data: [] };
        }

        // 3) Datos de fases (nombre y número)
        const { data: phasesData, error: phasesError } = await supabase
            .from('preclassification_phases')
            .select('id, name, phase_number')
            .in('id', phaseIds);
        if (phasesError) throw phasesError;
        const phasesById = new Map((phasesData || []).map(p => [p.id, p]));

        // 4) Dimensiones activas por fase
        const { data: dimsData, error: dimsError } = await supabase
            .from('preclass_dimensions')
            .select('id, name, type, phase_id, icon, preclass_dimension_options(value, emoticon)')
            .in('phase_id', phaseIds)
            .eq('status', 'active')
            .order('ordering');
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
        const dimsByPhase = new Map<string, DimRow[]>(phaseIds.map(id => [id, [] as DimRow[]]));
        (dimsData as DimRow[] | null || []).forEach((d) => {
            if (!d.phase_id) return; // null-safety: ignorar dimensiones sin fase
            const arr = dimsByPhase.get(d.phase_id) || [];
            arr.push(d);
            dimsByPhase.set(d.phase_id, arr);
        });

        // 5) Clasificaciones del artículo en esos ítems
        const itemIds = itemsTyped.map(i => i.id);
        const { data: allReviews, error: reviewsError } = await supabase
            .from('article_dimension_reviews')
            .select('*')
            .in('article_batch_item_id', itemIds)
            .order('iteration', { ascending: false });
        if (reviewsError) throw reviewsError;
        const allReviewsTyped = (allReviews || []) as Database["public"]["Tables"]["article_dimension_reviews"]["Row"][];

        // 6) Armar resumen por ítem (agrupado por fase)
        const summaries: PhaseSummary[] = itemsTyped.map((item) => {
            const batch = item.article_batches;
            const phase = batch?.phase_id ? phasesById.get(batch.phase_id) : null;

            const dims = (batch?.phase_id ? (dimsByPhase.get(batch.phase_id) || []) : []).map((d: DimRow) => {
                const opts = (d.preclass_dimension_options || []) as DimOptionRow[];
                const optionEmoticons = opts.reduce((acc, o) => {
                    if (typeof o.value !== 'undefined' && o.value !== null) {
                        acc[String(o.value)] = o.emoticon ?? null;
                    }
                    return acc;
                }, {} as Record<string, string | null>);

                return {
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    options: opts
                        .map((o: DimOptionRow) => o?.value)
                        .filter((v): v is string => typeof v === 'string' && v.length > 0),
                    icon: d.icon ?? null,
                    optionEmoticons,
                };
            });

            // Tomar TODAS las revisiones por dimensión, conservando orden (iteración desc)
            const reviewsForItem = allReviewsTyped.filter(r => r.article_batch_item_id === item.id);
            const classifications = dims.reduce((acc: Record<string, ClassificationReview[]>, d) => {
                const list = reviewsForItem
                    .filter(r => r.dimension_id === d.id)
                    .map(r => {
                        const rr = r as ReviewRowWithOptionalFields;
                        return {
                            reviewer_type: r.reviewer_type as 'ai' | 'human',
                            reviewer_id: r.reviewer_id,
                            iteration: r.iteration,
                            value: r.classification_value,
                            confidence: r.confidence_score,
                            rationale: r.rationale,
                            option_id: rr.option_id ?? undefined,
                            prevalidated: r.prevalidated,
                            is_final: r.is_final,
                        };
                    });
                if (list.length > 0) acc[d.id] = list;
                return acc;
            }, {});

            return {
                phase: { id: phase?.id || batch?.phase_id || '', name: phase?.name || null, phase_number: phase?.phase_number || null },
                batch: { id: batch?.id || '', batch_number: batch?.batch_number ?? null, status: batch?.status ?? null },
                item_id: item.id,
                dimensions: dims,
                classifications,
            };
        });

        return { success: true, data: summaries };
    } catch (error) {
        // Exponer mejor el mensaje de error para diagnóstico, sin usar 'any'
        const msg =
            error instanceof Error
                ? error.message
                : (typeof error === 'string' ? error : 'Error desconocido.');
        return { success: false, error: `Error obteniendo preclasificación del artículo: ${msg}` };
    }
}

export async function getArticleIdFromBatchItemId(batchItemId: string): Promise<ResultadoOperacion<{ articleId: string }>> {
    if (!batchItemId) {
        return { success: false, error: "Se requiere el ID del ítem del lote." };
    }
    try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from('article_batch_items')
            .select('article_id')
            .eq('id', batchItemId)
            .single();

        if (error) throw new Error(`No se encontró el ítem del lote: ${error.message}`);
        if (!data) return { success: false, error: "Ítem de lote no encontrado." };
        return { success: true, data: { articleId: data.article_id } };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error interno: ${msg}` };
    }
}