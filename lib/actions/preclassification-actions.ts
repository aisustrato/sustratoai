// EN: lib/actions/preclassification-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";
import type {
  ResultadoOperacion,
  BatchWithCounts,
  ArticleForReview,
  BatchDetails,
  SubmitHumanReviewPayload,
  TranslatedArticlePayload,
  ClassificationReview
} from "@/lib/types/preclassification-types";

export type { ArticleForReview, BatchDetails };

// ========================================================================
//  ACCIONES DE LECTURA (GET)
// ========================================================================

/**
 * Obtiene todos los lotes asignados a un usuario para un proyecto,
 * incluyendo un desglose detallado del estado de los artículos en cada lote.
 */
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
 * Obtiene los artículos de un lote con su título y abstract originales, listos para ser traducidos.
 */
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
 * **VERSIÓN CORREGIDA**
 */
export async function getBatchDetailsForReview(batchId: string): Promise<ResultadoOperacion<BatchDetails>> {
    if (!batchId) return { success: false, error: "Se requiere ID de lote." };

    try {
        const supabase = await createSupabaseServerClient();
        
        const { data: batchData, error: batchError } = await supabase
            .from("article_batches")
            .select("projects(id, preclass_dimensions(*, preclass_dimension_options(*)))")
            .eq("id", batchId)
            .single();
            
        if(batchError || !batchData) throw new Error(`Error obteniendo lote o proyecto: ${batchError?.message || 'No encontrado'}`);
        
        const dimensions = batchData.projects?.preclass_dimensions || [];

        // --- CONSULTA CORREGIDA ---
        // Ahora se anida la consulta de 'article_translations' dentro de 'articles'
        const { data: batchItems, error: itemsError } = await supabase
            .from("article_batch_items")
            .select(`
                id, status_preclasificacion, ai_keywords, ai_process_opinion, requires_adjudication,
                articles (
                    id, publication_year, journal, title, abstract,
                    article_translations ( title, abstract, summary )
                )
            `)
            .eq("batch_id", batchId);
        // --- FIN DE CONSULTA CORREGIDA ---
        
        if (itemsError) throw new Error(`Error obteniendo ítems del lote: ${itemsError.message}`);
        if (!batchItems) return { 
            success: true, 
            data: { 
                columns: [], 
                rows: [],
                batch_number: 0, // Valor por defecto
                id: batchId,
                name: null,
                status: 'pending' as const
            } 
        };

        const itemIds = batchItems.map(item => item.id);
        const { data: allReviews = [], error: reviewsError } = await supabase
            .from("article_dimension_reviews")
            .select("*")
            .in("article_batch_item_id", itemIds);
            
        if(reviewsError) throw new Error(`Error obteniendo revisiones: ${reviewsError.message}`);
        
        // Obtener información adicional del lote
        const { data: batchInfo, error: batchInfoError } = await supabase
            .from("article_batches")
            .select("batch_number, name, status")
            .eq("id", batchId)
            .single();
            
        if (batchInfoError) throw new Error(`Error obteniendo información del lote: ${batchInfoError.message}`);

        const rows: ArticleForReview[] = batchItems.map(item => {
            const safeReviews = allReviews || [];
            // Comentario sobre las variables no utilizadas que podrían ser útiles en el futuro
            // const itemReviews = safeReviews.filter(r => r.article_batch_item_id === item.id);
            // const classifications: Record<string, ClassificationReview[]> = {};

            const articleStatus = item.status_preclasificacion || 'pending';
            const validStatuses = ['pending', 'agreed', 'reconciled', 'disputed', 'reconciliation_pending'] as const;
            // Convertir el estado del artículo a minúsculas para hacer la comparación insensible a mayúsculas
            const normalizedStatus = articleStatus?.toLowerCase() as Database["public"]["Enums"]["item_preclass_status"];
            // Usar aserción de tipo para validar el estado
            const safeStatus = (validStatuses as readonly string[]).includes(normalizedStatus.toLowerCase())
                ? normalizedStatus as typeof validStatuses[number]
                : 'pending';
            
            return {
                item_id: item.id,
                article_status: safeStatus,
                article_data: {
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
                    const reviews = safeReviews.filter((r: { article_batch_item_id: string; dimension_id: string }) => 
                        r.article_batch_item_id === item.id && 
                        r.dimension_id === dim.id
                    );
                    
                    if (reviews.length > 0) {
                        acc[dim.id] = reviews.map((r: { reviewer_id: string; iteration: number; classification_value: string | null; confidence_score: number | null; rationale: string | null }) => ({
                            reviewer_type: 'human' as const,
                            reviewer_id: r.reviewer_id,
                            iteration: r.iteration,
                            value: r.classification_value,
                            confidence: r.confidence_score,
                            rationale: r.rationale
                        }));
                    }
                    return acc;
                }, {} as Record<string, ClassificationReview[]>)
            } as ArticleForReview;
        });

        return {
            success: true,
            data: {
                columns: dimensions.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    options: d.preclass_dimension_options?.map(o => o.value) || []
                })),
                rows,
                batch_number: batchInfo?.batch_number || 0,
                id: batchId,
                name: batchInfo?.name || null,
                status: (batchInfo?.status as Database["public"]["Enums"]["batch_preclass_status"]) || 'pending'
            }
        };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error interno obteniendo detalles del lote: ${msg}` };
    }
}

// ========================================================================
//  ACCIONES DE MODIFICACIÓN (WRITE)
// ========================================================================

export async function saveBatchTranslations(
  batchId: string,
  articles: TranslatedArticlePayload[]
): Promise<ResultadoOperacion<{ upsertedCount: number }>> {
  if (!batchId || !articles || articles.length === 0) {
    return { success: false, error: "Se requiere ID de lote y un array de artículos." };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const translationsToUpsert = articles.map(article => ({
      article_id: article.articleId,
      language: 'es',
      title: article.title,
      abstract: article.abstract,
      summary: article.summary,
      translated_at: new Date().toISOString(),
      translated_by: article.translated_by || null,
      translator_system: article.translator_system || null,
    }));

    const { count, error: upsertError } = await supabase
      .from('article_translations')
      .upsert(translationsToUpsert, { onConflict: 'article_id, language', count: 'exact' });

    if (upsertError) throw new Error(`Error guardando las traducciones: ${upsertError.message}`);

    const { error: batchUpdateError } = await supabase
      .from('article_batches')
      .update({ status: 'translated' })
      .eq('id', batchId);

    if (batchUpdateError) throw new Error(`Traducciones guardadas, pero falló al actualizar el estado del lote: ${batchUpdateError.message}`);
    
    return { success: true, data: { upsertedCount: count || 0 } };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `Error en saveBatchTranslations: ${msg}` };
  }
}


/**
 * Guarda el título y abstract traducidos de un artículo y actualiza su estado.
 */
export async function saveTranslatedArticle(
  articleId: string, 
  translatedTitle: string, 
  translatedAbstract: string
): Promise<ResultadoOperacion<{ updated: boolean }>> {
  if (!articleId || !translatedTitle || !translatedAbstract) {
    return { success: false, error: "Se requieren ID de artículo, título y abstract traducidos." };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Actualizar la tabla de artículos con el contenido traducido en el campo metadata
    const { error: articleUpdateError } = await supabase
      .from('articles')
      .update({
        metadata: {
          translatedTitle: translatedTitle,
          translatedAbstract: translatedAbstract,
        }
      })
      .eq('id', articleId);

    if (articleUpdateError) throw new Error(`Error actualizando el artículo: ${articleUpdateError.message}`);

    // 2. Actualizar el estado del ítem a 'pending_review' para que entre en la cola de revisión humana
    const { error: itemUpdateError } = await supabase
      .from('article_batch_items')
      .update({ status_preclasificacion: 'pending_review' })
      .eq('article_id', articleId);

    if (itemUpdateError) throw new Error(`Error actualizando el estado del ítem del lote: ${itemUpdateError.message}`);

    return { success: true, data: { updated: true } };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `Error interno al guardar la traducción: ${msg}` };
  }
}

/**
 * Orquesta la traducción de artículos de un lote y actualiza su estado.
 */
export async function translateBatch(batchId: string): Promise<ResultadoOperacion<{ translatedCount: number }>> {
    console.log(`Función translateBatch llamada para el lote: ${batchId}. La implementación real con API externa está pendiente.`);
    // 1. Verificar permisos.
    // 2. Verificar que el estado del lote es 'pending'.
    // 3. Llamar a getArticlesForTranslation(batchId).
    // 4. Iterar y llamar a la API de traducción (placeholder).
    // 5. 'upsert' en 'article_translations'.
    // 6. Actualizar estado del lote a 'translated'.
    return { success: true, data: { translatedCount: 0 } }; // Placeholder
}

/**
 * Inicia el primer pase de pre-clasificación con IA para un lote.
 */
export async function startInitialPreclassification(batchId: string): Promise<ResultadoOperacion<{ preclassifiedCount: number }>> {
    console.log(`Función startInitialPreclassification llamada para el lote: ${batchId}. La implementación real con API externa está pendiente.`);
    // 1. Verificar permisos y que el lote esté en 'translated'.
    // 2. Iterar, construir prompts y llamar a la API de IA de clasificación.
    // 3. Poblar 'article_dimension_reviews' y actualizar 'article_batch_items'.
    // 4. Actualizar estado del lote a 'review_pending'.
    return { success: true, data: { preclassifiedCount: 0 } }; // Placeholder
}

/**
 * Guarda la revisión de un humano sobre una única dimensión, registrando una discrepancia.
 */
export async function submitHumanDiscrepancy(payload: SubmitHumanReviewPayload, userId: string): Promise<ResultadoOperacion<{ reviewId: string }>> {
    const supabase = await createSupabaseServerClient();
    try {
        // 1. Verificar que el usuario pertenece al proyecto.
        // 2. Insertar la opinión humana en la tabla de revisiones.
        const { data, error } = await supabase
            .from('article_dimension_reviews')
            .insert({
                article_batch_item_id: payload.article_batch_item_id,
                dimension_id: payload.dimension_id,
                reviewer_type: 'human',
                reviewer_id: userId,
                iteration: 2, // La discrepancia humana inicia la iteración 2
                classification_value: payload.human_value,
                confidence_score: payload.human_confidence,
                rationale: payload.human_rationale,
            })
            .select('id')
            .single();

        if (error) throw error;

        // 3. Actualizar el estado del ítem para reflejar que hay una discrepancia pendiente.
        // Podríamos tener un estado 'awaiting_reclassification'. Por ahora, se maneja al llamar la siguiente acción.
        return { success: true, data: { reviewId: data.id } };

    } catch(error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error guardando la revisión: ${msg}` };
    }
}


/**
 * Inicia el segundo pase de la IA para resolver las discrepancias marcadas.
 * VERSIÓN CORREGIDA
 */
export async function reclassifyDiscrepancies(batchId: string): Promise<ResultadoOperacion<{ reclassifiedCount: number }>> {
    // 1. Verificar permisos y que el estado del lote sea 'review_pending'.
    // 2. Buscar ítems con revisiones humanas (iteración 2).
    // 3. Construir prompts con feedback y llamar a la API de IA. (placeholder)
    // 4. Insertar nuevas revisiones de la IA (iteración 3).
    // 5. Actualizar estado de los ítems a 'reconciliation_pending'.
    
    // 6. Al finalizar, actualizar el estado del lote al NUEVO estado.
    const supabase = await createSupabaseServerClient();
    await supabase
        .from('article_batches')
        .update({ status: 'reconciliation_pending' })
        .eq('id', batchId);
    
    console.log(`Función reclassifyDiscrepancies ejecutada para el lote: ${batchId}. El lote ahora espera el veredicto final.`);
    return { success: true, data: { reclassifiedCount: 0 } }; // Placeholder
}

/**
 * Cierra un lote, asignándole un estado final basado en el estado de sus artículos.
 * **VERSIÓN CORREGIDA**
 */
export async function finalizeBatch(batchId: string): Promise<ResultadoOperacion<{ finalStatus: string }>> {
    if (!batchId) return { success: false, error: "Se requiere ID de lote." };

    try {
        const supabase = await createSupabaseServerClient();
        
        const { data: items, error: itemsError } = await supabase
            .from('article_batch_items')
            .select('status_preclasificacion')
            .eq('batch_id', batchId);

        if (itemsError) throw itemsError;

        // --- LÓGICA DE CHEQUEO ACTUALIZADA ---
        const pendingItems = items.filter(item => 
            ['pending_review', 'reconciliation_pending'].includes(item.status_preclasificacion || '')
        );
        // --- FIN DE LÓGICA DE CHEQUEO ACTUALIZADA ---
        if (pendingItems.length > 0) {
            return { success: false, error: `Aún hay ${pendingItems.length} artículos pendientes de revisión en este lote.` };
        }

        const itemStatuses = new Set(items.map(i => i.status_preclasificacion));
        let finalBatchStatus: Database["public"]["Enums"]["batch_preclass_status"];

        if (itemStatuses.has('disputed')) {
            finalBatchStatus = 'disputed';
        } else if (itemStatuses.has('reconciled')) {
            finalBatchStatus = 'reconciled';
        } else {
            finalBatchStatus = 'validated';
        }

        const { error: updateError } = await supabase
            .from('article_batches')
            .update({ status: finalBatchStatus }) // El tipo aquí ya es correcto por el Paso 1
            .eq('id', batchId);

        if (updateError) throw updateError;
        
        return { success: true, data: { finalStatus: finalBatchStatus } };

    } catch(error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error finalizando el lote: ${msg}` };
    }
}

/**
 * Obtiene el ID del artículo ('articles') a partir del ID de un ítem de lote ('article_batch_items').
 * @param batchItemId El ID de la fila en la tabla 'article_batch_items'.
 * @returns El 'article_id' correspondiente o un error si no se encuentra.
 */
export async function getArticleIdFromBatchItemId(
  batchItemId: string
): Promise<ResultadoOperacion<{ articleId: string }>> {
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

    if (error) {
      throw new Error(`No se encontró el ítem del lote o el usuario no tiene permisos: ${error.message}`);
    }

    if (!data) {
      return { success: false, error: "Ítem de lote no encontrado." };
    }

    return { success: true, data: { articleId: data.article_id } };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `Error interno: ${msg}` };
  }
}