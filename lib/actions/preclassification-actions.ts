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
    
    // 🎯 LÓGICA ROBUSTA: Crear job primero, luego validar con UUID como llave maestra
    
    // 🚀 PASO 1: CREAR JOB Y OBTENER UUID REAL DE SUPABASE
    const { data: job, error: jobError } = await supabase.from('ai_job_history').insert({
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
    
    const { data: otherJobs, error: duplicateCheckError } = await supabase
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
        await supabase.from('ai_job_history')
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
            otrosJobs: otherJobs.map(j => ({ id: j.id, status: j.status }))
        });
        
        // 🚨 MARCAR JOB COMO FALLIDO POR DUPLICACIÓN
        await supabase.from('ai_job_history')
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
async function runPreclassificationJob(jobId: string, batchId: string, userId: string) {
    const supabase = await createSupabaseServerClient();

    try {
        const { data: batchData } = await supabase.from('article_batches').select('phase_id, projects(id, name, proposal, proposal_bibliography)').eq('id', batchId).single();
        if (!batchData?.phase_id || !batchData.projects) throw new Error("Datos del lote o proyecto no encontrados.");

        const { data: items, error: itemsError } = await supabase.from('article_batch_items').select('id, articles(id, title, abstract, publication_year, journal)').eq('batch_id', batchId);
        if (itemsError || !items) throw new Error("No se encontraron artículos para procesar.");
        
        const { data: dimensions, error: dimsError } = await supabase.from('preclass_dimensions').select('id, name, description, type, preclass_dimension_options(value)').eq('phase_id', batchData.phase_id).eq('status', 'active');
        if (dimsError || !dimensions) throw new Error("No se encontraron dimensiones para la fase.");

        await supabase.from('ai_job_history').update({ details: { total: items.length, processed: 0, step: 'Datos preparados' } }).eq('id', jobId);

        // 🎯 ARRAYS PARA REPECHAJE Y INTEGRIDAD TRANSACCIONAL
        const articulosParaRepechaje: ArticleForPrompt[] = [];
        const clasificacionesExitosasTemporales: Database['public']['Tables']['article_dimension_reviews']['Insert'][] = [];
        
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
            const chunkSuccessfulReviews: Database['public']['Tables']['article_dimension_reviews']['Insert'][] = [];
            
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
                        const articleReviews: Database['public']['Tables']['article_dimension_reviews']['Insert'][] = [];
                        
                        for (const dimensionName in item.classifications) {
                            const foundDimension = dimensions.find(dim => dim.id === dimensionName || dim.name === dimensionName);
                            if (!foundDimension) {
                                throw new Error(`La IA devolvió una dimensión desconocida: "${dimensionName}"`);
                            }

                            const classification = item.classifications[dimensionName];
                            const valueToSave = classification.value;

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
                            }

                            articleReviews.push({
                                article_batch_item_id: item.itemId,
                                dimension_id: foundDimension.id,
                                reviewer_type: 'ai',
                                reviewer_id: userId,
                                iteration: attemptNumber,
                                classification_value: valueToSave,
                                confidence_score: mapConfidenceToScore(classification.confidence),
                                rationale: classification.rationale,
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

                await supabase.rpc('increment_job_tokens', {
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
        
        console.log(`\n🚀 [${jobId}] INICIANDO PRIMER INTENTO - Procesando ${items.length} artículos en chunks de ${miniBatchSize}`);
        
        for (let i = 0; i < items.length; i += miniBatchSize) {
            const chunk = items.slice(i, i + miniBatchSize) as ArticleForPrompt[];
            
            await supabase.from('ai_job_history').update({
                progress: (processedCount / items.length) * 50,
                details: { 
                    total: items.length, 
                    processed: processedCount, 
                    step: `Primer intento: artículos ${i+1}-${i+chunk.length}`,
                    phase: 'first_attempt'
                }
            }).eq('id', jobId);

            const result = await processArticleChunk(chunk, 1);
            
            articulosParaRepechaje.push(...result.failedArticles);
            clasificacionesExitosasTemporales.push(...result.successfulReviews);
            
            processedCount += chunk.length;
            
            console.log(`\n📊 [${jobId}] PROGRESO PRIMER INTENTO - Chunk ${i/miniBatchSize + 1}: ${result.successfulReviews.length} éxitos, ${result.failedArticles.length} fallos`);
        }

        console.log(`\n📊 [${jobId}] RESUMEN PRIMER INTENTO:`);
        console.log(`- Artículos exitosos: ${items.length - articulosParaRepechaje.length}`);
        console.log(`- Artículos para repechaje: ${articulosParaRepechaje.length}`);
        console.log(`- Clasificaciones temporales acumuladas: ${clasificacionesExitosasTemporales.length}`);

        // 🎯 BUCLE DE REPECHAJE (SEGUNDA OPORTUNIDAD)
        if (articulosParaRepechaje.length > 0) {
            console.log(`\n🔄 [${jobId}] INICIANDO REPECHAJE - ${articulosParaRepechaje.length} artículos necesitan segunda oportunidad`);
            
            const articulosFallidosDefinitivos: ArticleForPrompt[] = [];
            
            for (let i = 0; i < articulosParaRepechaje.length; i += miniBatchSize) {
                const repechageChunk = articulosParaRepechaje.slice(i, i + miniBatchSize);
                
                await supabase.from('ai_job_history').update({
                    progress: 50 + ((i / articulosParaRepechaje.length) * 40),
                    details: { 
                        total: items.length, 
                        processed: items.length - articulosParaRepechaje.length + i, 
                        step: `Repechaje: artículos ${i+1}-${i+repechageChunk.length} de ${articulosParaRepechaje.length}`,
                        phase: 'repechaje'
                    }
                }).eq('id', jobId);

                const repechageResult = await processArticleChunk(repechageChunk, 2);
                
                clasificacionesExitosasTemporales.push(...repechageResult.successfulReviews);
                articulosFallidosDefinitivos.push(...repechageResult.failedArticles);
                
                console.log(`\n📊 [${jobId}] PROGRESO REPECHAJE - Chunk ${i/miniBatchSize + 1}: ${repechageResult.successfulReviews.length} éxitos, ${repechageResult.failedArticles.length} fallos definitivos`);
            }

            console.log(`\n📊 [${jobId}] RESUMEN REPECHAJE:`);
            console.log(`- Artículos recuperados en repechaje: ${articulosParaRepechaje.length - articulosFallidosDefinitivos.length}`);
            console.log(`- Artículos con fallo definitivo: ${articulosFallidosDefinitivos.length}`);

            // 🚨 SI HAY FALLOS DEFINITIVOS, ABORTAR TODO
            if (articulosFallidosDefinitivos.length > 0) {
                const failedIds = articulosFallidosDefinitivos.map(art => art.id).join(', ');
                const errorMsg = `Fallos persistentes en ${articulosFallidosDefinitivos.length} artículos tras repechaje. IDs: ${failedIds}`;
                
                // 🚨 LOGGING CRÍTICO: Fallos persistentes tras repechaje
                console.error(`\n🚨🚨🚨 [${jobId}] FALLO PERSISTENTE TRAS REPECHAJE - ABORTANDO PROCESO COMPLETO`);
                console.error('=' .repeat(120));
                console.error('RESUMEN DEL FALLO CRÍTICO:');
                console.error(`- Total de artículos procesados: ${items.length}`);
                console.error(`- Artículos exitosos: ${items.length - articulosFallidosDefinitivos.length}`);
                console.error(`- Artículos con fallo persistente: ${articulosFallidosDefinitivos.length}`);
                console.error(`- Clasificaciones exitosas (NO SE GUARDARÁN): ${clasificacionesExitosasTemporales.length}`);
                console.error('=' .repeat(120));
                console.error('ARTÍCULOS CON FALLO PERSISTENTE:');
                articulosFallidosDefinitivos.forEach((art, index) => {
                    console.error(`${index + 1}. ID: ${art.id} - Título: ${art.articles?.title?.substring(0, 100) || 'Sin título'}...`);
                });
                console.error('=' .repeat(120));
                console.error('🚨 PRINCIPIO "TODO O NADA" ACTIVADO - NO SE INSERTARÁN DATOS PARCIALES');
                console.error('🚨 TODOS LOS DATOS EXITOSOS SE DESCARTAN PARA MANTENER INTEGRIDAD');
                console.error('=' .repeat(120));
                
                await supabase.from('ai_job_history').update({ 
                    status: 'failed', 
                    progress: 100, 
                    error_message: errorMsg,
                    details: { 
                        error: errorMsg,
                        failedArticles: articulosFallidosDefinitivos.length,
                        successfulClassifications: clasificacionesExitosasTemporales.length,
                        step: 'Fallo persistente tras repechaje',
                        failedArticleIds: failedIds,
                        totalProcessed: items.length
                    } 
                }).eq('id', jobId);
                
                throw new Error(errorMsg);
            }
        }

        // 🎯 INSERCIÓN MASIVA FINAL - PRINCIPIO "TODO O NADA"
        console.log(`\n💾 [${jobId}] PREPARANDO INSERCIÓN MASIVA FINAL:`);
        console.log(`Total de clasificaciones a insertar: ${clasificacionesExitosasTemporales.length}`);
        
        if (clasificacionesExitosasTemporales.length > 0) {
            console.log(`\n🚀 [${jobId}] EJECUTANDO INSERCIÓN MASIVA EN article_dimension_reviews...`);
            const { error: insertError } = await supabase.from('article_dimension_reviews').insert(clasificacionesExitosasTemporales);
            
            if (insertError) {
                console.error(`❌ [${jobId}] ERROR EN INSERCIÓN MASIVA:`, insertError);
                throw new Error(`Error de base de datos al insertar clasificaciones: ${insertError.message}`);
            }
            
            console.log(`✅ [${jobId}] INSERCIÓN MASIVA EXITOSA: ${clasificacionesExitosasTemporales.length} clasificaciones guardadas`);
        } else {
            console.error(`❌ [${jobId}] FALLO SILENCIOSO EVITADO: Sin clasificaciones válidas para insertar`);
            throw new Error('No se generaron clasificaciones válidas para guardar.');
        }

        await supabase.from('ai_job_history').update({ 
            status: 'completed', 
            progress: 100, 
            details: { 
                total: items.length, 
                processed: items.length, 
                step: 'Completado con repechaje',
                successfulClassifications: clasificacionesExitosasTemporales.length,
                articlesWithRepechaje: articulosParaRepechaje.length
            } 
        }).eq('id', jobId);
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