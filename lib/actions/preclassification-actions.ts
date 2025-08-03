// lib/actions/preclassification-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import { callGeminiAPI } from "@/lib/gemini/api";
import type { Database } from "@/lib/database.types";
import type { ResultadoOperacion } from "./types";
import type { 
    BatchWithCounts,
    ArticleForReview,
    BatchDetails,
    SubmitHumanReviewPayload,
    TranslatedArticlePayload,
    ClassificationReview
} from "@/lib/types/preclassification-types";

export type { ArticleForReview, BatchDetails };

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
                id, status_preclasificacion, ai_keywords, ai_process_opinion,
                articles (id, publication_year, journal, title, abstract, article_translations(title, abstract, summary))
            `)
            .eq("batch_id", batchId);
            
        if (itemsError) throw new Error(`Error obteniendo ítems del lote: ${itemsError.message}`);
        if (!batchItems) return { success: false, error: "No se encontraron artículos en el lote." };

        const itemIds = batchItems.map(item => item.id);
        const { data: allReviews = [], error: reviewsError } = await supabase
            .from("article_dimension_reviews")
            .select("*")
            .in("article_batch_item_id", itemIds);
            
        if(reviewsError) throw new Error(`Error obteniendo revisiones: ${reviewsError.message}`);
        
        const rows: ArticleForReview[] = batchItems.map(item => {
            const safeReviews = allReviews || [];
            const articleStatus = item.status_preclasificacion || 'pending_review';
            const validStatuses = ['pending_review', 'agreed', 'reconciled', 'disputed', 'reconciliation_pending'] as const;
            type ItemStatus = typeof validStatuses[number];
            const safeStatus: ItemStatus = (validStatuses as readonly string[]).includes(articleStatus) ? articleStatus as ItemStatus : 'pending_review';

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
                    const reviewsForDim = safeReviews.filter(r => r.article_batch_item_id === item.id && r.dimension_id === dim.id);
                    if (reviewsForDim.length > 0) {
                        acc[dim.id] = reviewsForDim.map(r => ({
                            reviewer_type: r.reviewer_type as 'ai' | 'human',
                            reviewer_id: r.reviewer_id,
                            iteration: r.iteration,
                            value: r.classification_value,
                            confidence: r.confidence_score,
                            rationale: r.rationale
                        }));
                    }
                    return acc;
                }, {} as Record<string, ClassificationReview[]>)
            };
        });

        return {
            success: true,
            data: {
                columns: dimensions.map(d => ({ id: d.id, name: d.name, type: d.type, options: d.preclass_dimension_options?.map(o => o.value) || [] })),
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
        const supabase = await createSupabaseServerClient();
        const translationsToUpsert = articles.map(article => ({
            article_id: article.articleId,
            title: article.title,
            abstract: article.abstract,
            summary: article.summary,
            language: 'es' // Asumimos español por ahora
        }));

        const { count, error: upsertError } = await supabase
            .from('article_translations')
            .upsert(translationsToUpsert, { onConflict: 'article_id, language' });

        if (upsertError) throw upsertError;

        // Actualizar estado del lote a 'traducido'
        const { error: batchUpdateError } = await supabase
            .from('article_batches')
            .update({ status: 'translated' })
            .eq('id', batchId);

        if (batchUpdateError) {
            console.warn(`Traducciones guardadas, pero no se pudo actualizar el estado del lote ${batchId}: ${batchUpdateError.message}`);
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
    
    const { data: job, error: jobError } = await supabase.from('ai_job_history').insert({
        project_id: batch.projects!.id,
        user_id: user.id,
        job_type: 'PRECLASSIFICATION',
        status: 'running',
        description: `Preclasificando Lote #${batch.batch_number}`,
        progress: 0,
        details: { total: 0, processed: 0, step: 'Iniciando...' }
    }).select('id').single();

    if (jobError || !job) return { success: false, error: `No se pudo crear el registro del job: ${jobError?.message}` };
    
    runPreclassificationJob(job.id, batchId, user.id); 
    
    return { success: true, data: { jobId: job.id } };
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
        article_translations: {
            title: string | null;
            abstract: string | null;
        }[];
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
    const dimensionDetails = dimensions.map(dim => `
**Dimensión: "${dim.name}"**
- Descripción: ${dim.description}
- Tipo: ${dim.type}
${dim.type === 'finite' ? `- Opciones Válidas: [${dim.preclass_dimension_options.map(opt => `"${opt.value}"`).join(', ')}]` : ''}
    `).join('\n---\n');

    const articleDetails = articleChunk.map(item => `
---
**Artículo ID:** "${item.id}"
- Título: ${item.articles?.article_translations?.[0]?.title}
- Abstract: ${item.articles?.article_translations?.[0]?.abstract}
    `).join('');

    return `### ROL Y CONTEXTO GLOBAL ###
Eres un asistente de investigación experto en análisis bibliográfico. Tu tarea es colaborar en la preclasificación de artículos para el proyecto de investigación titulado: "${project.name}".
Propósito del Proyecto: ${project.proposal}
Objetivo de esta Fase Bibliográfica: ${project.proposal_bibliography}

### INSTRUCCIONES DE CLASIFICACIÓN ###
A continuación, te proporcionaré las definiciones de ${dimensions.length} dimensiones de clasificación y luego un lote de ${articleChunk.length} artículos.
Debes analizar cada artículo y clasificarlo según CADA una de las dimensiones definidas.
Tu respuesta debe ser OBLIGATORIAMENTE un objeto JSON válido, sin ningún texto antes o después del bloque JSON. La estructura debe ser un array, donde cada elemento del array es un objeto que representa un artículo clasificado.

### ESQUEMA DE LAS DIMENSIONES ###
${dimensionDetails}

### ARTÍCULOS A CLASIFICAR ###
${articleDetails}

### FORMATO DE SALIDA JSON ESPERADO ###
\`\`\`json
[
  {
    "itemId": "ID_DEL_PRIMER_ARTICLE_BATCH_ITEM",
    "classifications": {
      "${dimensions[0]?.id}": {
        "value": "VALOR_CLASIFICADO",
        "confidence": "Alta",
        "rationale": "Justificación concisa."
      }
    }
  }
]
\`\`\``;
}

/**
 * Helper que ejecuta el trabajo de preclasificación.
 */
async function runPreclassificationJob(jobId: string, batchId: string, userId: string) {
    const supabase = await createSupabaseServerClient();

    try {
        const { data: batchData } = await supabase.from('article_batches').select('phase_id, projects(id, name, proposal, proposal_bibliography)').eq('id', batchId).single();
        if (!batchData?.phase_id || !batchData.projects) throw new Error("Datos del lote o proyecto no encontrados.");

        const { data: items, error: itemsError } = await supabase.from('article_batch_items').select('id, articles(id, article_translations(title, abstract))').eq('batch_id', batchId);
        if (itemsError || !items) throw new Error("No se encontraron artículos para procesar.");
        
        const { data: dimensions, error: dimsError } = await supabase.from('preclass_dimensions').select('id, name, description, type, preclass_dimension_options(value)').eq('phase_id', batchData.phase_id).eq('status', 'active');
        if (dimsError || !dimensions) throw new Error("No se encontraron dimensiones para la fase.");

        await supabase.from('ai_job_history').update({ details: { total: items.length, processed: 0, step: 'Datos preparados' } }).eq('id', jobId);

        const miniBatchSize = 5;
        let processedCount = 0;
        for (let i = 0; i < items.length; i += miniBatchSize) {
            const chunk = items.slice(i, i + miniBatchSize);
            
            await supabase.from('ai_job_history').update({
                progress: (processedCount / items.length) * 100,
                details: { total: items.length, processed: processedCount, step: `Procesando artículos ${i+1}-${i+chunk.length}` }
            }).eq('id', jobId);

            const prompt = buildPreclassificationPrompt(batchData.projects, dimensions as DimensionForPrompt[], chunk as ArticleForPrompt[]);
            const { result, usage } = await callGeminiAPI('gemini-1.5-flash', prompt);
            
            try {
                const parsedResult = JSON.parse(result);
                if (Array.isArray(parsedResult)) {
                    const reviewsToInsert: Database['public']['Tables']['article_dimension_reviews']['Insert'][] = [];
                    
                    for (const item of parsedResult) {
                        for (const dimId in item.classifications) {
                            reviewsToInsert.push({
                                article_batch_item_id: item.itemId,
                                dimension_id: dimId,
                                reviewer_type: 'ai',
                                reviewer_id: userId,
                                iteration: 1,
                                classification_value: item.classifications[dimId].value,
                                confidence_score: item.classifications[dimId].confidence === 'Alta' ? 0.9 : (item.classifications[dimId].confidence === 'Media' ? 0.6 : 0.3),
                                rationale: item.classifications[dimId].rationale,
                            });
                        }
                    }

                    if (reviewsToInsert.length > 0) {
                        await supabase.from('article_dimension_reviews').insert(reviewsToInsert);
                    }
                }
            } catch (parseError) {
                console.error(`[${jobId}] Error parseando JSON de la IA:`, parseError);
                throw new Error("La respuesta de la IA no fue un JSON válido.");
            }
            
            await supabase.rpc('increment_job_tokens', {
                job_id: jobId,
                input_increment: usage?.promptTokenCount || 0,
                output_increment: usage?.candidatesTokenCount || 0
            });
            
            processedCount += chunk.length;
        }

        await supabase.from('ai_job_history').update({ status: 'completed', progress: 100, details: { total: items.length, processed: items.length, step: 'Completado' } }).eq('id', jobId);
        await supabase.from('article_batches').update({ status: 'review_pending' }).eq('id', batchId);

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        await supabase.from('ai_job_history').update({ status: 'failed', progress: 100, details: { error: msg } }).eq('id', jobId);
    }
}

export async function submitHumanDiscrepancy(payload: SubmitHumanReviewPayload, userId: string): Promise<ResultadoOperacion<{ reviewId: string }>> {
    const supabase = await createSupabaseServerClient();
    try {
        const { data, error } = await supabase
            .from('article_dimension_reviews')
            .insert({
                article_batch_item_id: payload.article_batch_item_id,
                dimension_id: payload.dimension_id,
                reviewer_type: 'human',
                reviewer_id: userId,
                iteration: 2,
                classification_value: payload.human_value,
                confidence_score: payload.human_confidence,
                rationale: payload.human_rationale,
            })
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
    const supabase = await createSupabaseServerClient();
    await supabase.from('article_batches').update({ status: 'reconciliation_pending' }).eq('id', batchId);
    return { success: true, data: { reclassifiedCount: 0 } };
}

export async function finalizeBatch(batchId: string): Promise<ResultadoOperacion<{ finalStatus: string }>> {
    if (!batchId) return { success: false, error: "Se requiere ID de lote." };
    try {
        const supabase = await createSupabaseServerClient();
        
        const { data: items, error: itemsError } = await supabase
            .from('article_batch_items')
            .select('status_preclasificacion')
            .eq('batch_id', batchId);
        if (itemsError) throw itemsError;

        const pendingItems = items.filter(item => ['pending_review', 'reconciliation_pending'].includes(item.status_preclasificacion || ''));
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
            .update({ status: finalBatchStatus })
            .eq('id', batchId);
        if (updateError) throw updateError;
        
        return { success: true, data: { finalStatus: finalBatchStatus } };

    } catch(error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `Error finalizando el lote: ${msg}` };
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