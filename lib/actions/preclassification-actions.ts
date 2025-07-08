// EN: lib/actions/preclassification-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ========================================================================
//  INTERFACES Y TIPOS
// ========================================================================

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

export interface BatchWithCounts {
  id: string;
  batch_number: number;
  name: string | null;
  status: Database["public"]["Enums"]["batch_preclass_status"];
  article_counts: {
    pending_review?: number;
    reconciliation_pending?: number;
    agreed?: number;
    reconciled?: number;
    disputed?: number;
  } | null;
}

export interface ClassificationReview {
  reviewer_type: 'ai' | 'human';
  reviewer_id: string;
  iteration: number;
  value: string | null;
  confidence: number | null;
  rationale: string | null;
}

export interface ArticleForReview {
  item_id: string;
  article_status: Database["public"]["Enums"]["item_preclass_status"];
  article_data: {
    publication_year: number | null;
    journal: string | null;
    original_title: string | null;
    original_abstract: string | null;
    translated_title: string | null;
    translated_abstract: string | null;
    translation_summary: string | null;
  };
  ai_summary: {
    keywords: string[] | null;
    process_opinion: string | null;
  };
  classifications: Record<string, ClassificationReview[]>;
}

export interface BatchDetails {
  columns: { id: string; name: string; type: string; options: any[] }[];
  rows: ArticleForReview[];
}

export interface SubmitHumanReviewPayload {
    article_batch_item_id: string;
    dimension_id: string;
    human_value: string;
    human_rationale: string;
    human_confidence: number;
}

// Constantes de permisos
const PERMISO_GESTIONAR_PRECLASIFICACION = "can_create_batches";
const PERMISO_GESTIONAR_DATOS_MAESTROS = "can_manage_master_data";


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
        if (!batchItems) return { success: true, data: { columns: [], rows: [] } };

        const itemIds = batchItems.map(item => item.id);
        const { data: allReviews, error: reviewsError } = await supabase
            .from("article_dimension_reviews")
            .select("*")
            .in("article_batch_item_id", itemIds);
            
        if(reviewsError) throw new Error(`Error obteniendo revisiones: ${reviewsError.message}`);

        const rows: ArticleForReview[] = batchItems.map(item => {
            const itemReviews = allReviews?.filter(r => r.article_batch_item_id === item.id) || [];
            const classifications: Record<string, ClassificationReview[]> = {};

            for (const dim of dimensions) {
                const reviewsForDim = itemReviews
                    .filter(r => r.dimension_id === dim.id)
                    .sort((a, b) => a.iteration - b.iteration)
                    .map(r => ({
                        reviewer_type: r.reviewer_type as 'ai' | 'human',
                        reviewer_id: r.reviewer_id,
                        iteration: r.iteration,
                        value: r.classification_value,
                        confidence: r.confidence_score,
                        rationale: r.rationale,
                    }));
                classifications[dim.name] = reviewsForDim;
            }

            // --- ACCESO A DATOS CORREGIDO ---
            const translations = item.articles?.article_translations || [];

            return {
                item_id: item.id,
                article_status: item.status_preclasificacion as any,
                article_data: {
                    publication_year: item.articles?.publication_year || null,
                    journal: item.articles?.journal || null,
                    original_title: item.articles?.title || null,
                    original_abstract: item.articles?.abstract || null,
                    translated_title: translations[0]?.title || null,
                    translated_abstract: translations[0]?.abstract || null,
                    translation_summary: translations[0]?.summary || null,
                },
                ai_summary: {
                    keywords: item.ai_keywords,
                    process_opinion: item.ai_process_opinion,
                },
                requires_adjudication: item.requires_adjudication || false,
                classifications,
            };
        });

        const columns = dimensions.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            options: d.preclass_dimension_options.map(opt => opt.value)
        }));

        return { success: true, data: { columns, rows } };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error interno obteniendo detalles del lote: ${msg}` };
    }
}

// ========================================================================
//  ACCIONES DE MODIFICACIÓN (WRITE)
// ========================================================================

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