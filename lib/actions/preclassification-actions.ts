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
    
    // 🛡️ VALIDACIÓN CRÍTICA: Prevenir trabajos duplicados del mismo lote
    const { data: existingJobs, error: jobCheckError } = await supabase
        .from('ai_job_history')
        .select('id, status, description')
        .eq('job_type', 'PRECLASSIFICATION')
        .eq('project_id', batch.projects!.id)
        .eq('status', 'running')
        .ilike('description', `%Lote #${batch.batch_number}%`);
    
    if (jobCheckError) {
        console.error('🚨 Error verificando trabajos existentes:', jobCheckError);
        return { success: false, error: "Error verificando trabajos existentes." };
    }
    
    if (existingJobs && existingJobs.length > 0) {
        console.warn(`🚨 [startInitialPreclassification] Trabajo duplicado detectado:`, {
            lote: batchId,
            batchNumber: batch.batch_number,
            trabajosExistentes: existingJobs.map(j => ({ id: j.id, status: j.status, description: j.description }))
        });
        return { 
            success: false, 
            error: `Ya existe un trabajo de preclasificación en curso para el Lote #${batch.batch_number}. Por favor, espera a que termine o cancela el trabajo existente.` 
        };
    }
    
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
        id: string;
        title: string | null;
        abstract: string | null;
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
 * Helper que ejecuta el trabajo de preclasificación.
 */
async function runPreclassificationJob(jobId: string, batchId: string, userId: string) {
    const supabase = await createSupabaseServerClient();

    try {
        const { data: batchData } = await supabase.from('article_batches').select('phase_id, projects(id, name, proposal, proposal_bibliography)').eq('id', batchId).single();
        if (!batchData?.phase_id || !batchData.projects) throw new Error("Datos del lote o proyecto no encontrados.");

        const { data: items, error: itemsError } = await supabase.from('article_batch_items').select('id, articles(id, title, abstract)').eq('batch_id', batchId);
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
            
            // 📝 LOGGING: Prompt enviado
            console.log(`\n🚀 [${jobId}] PROMPT ENVIADO A GEMINI:`);
            console.log('=' .repeat(80));
            console.log(prompt);
            console.log('=' .repeat(80));
            
            const { result, usage } = await callGeminiAPI('gemini-1.5-flash', prompt);
            
            // 📝 LOGGING: Respuesta recibida
            console.log(`\n📥 [${jobId}] RESPUESTA RECIBIDA DE GEMINI:`);
            console.log('=' .repeat(80));
            console.log(result);
            console.log('=' .repeat(80));
            
            // 🔧 MEJORAR PARSING: Limpiar markdown si está presente
            let cleanResult = result.trim();
            
            // Remover bloques de código markdown si existen
            if (cleanResult.startsWith('```json')) {
                cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResult.startsWith('```')) {
                cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            console.log(`\n🧹 [${jobId}] JSON LIMPIO PARA PARSING:`);
            console.log('=' .repeat(50));
            console.log(cleanResult);
            console.log('=' .repeat(50));
            
            try {
                const parsedResult = JSON.parse(cleanResult);
                if (Array.isArray(parsedResult)) {
                    const reviewsToInsert: Database['public']['Tables']['article_dimension_reviews']['Insert'][] = [];

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

                    console.log(`\n🔍 [${jobId}] INICIANDO VALIDACIÓN INTELIGENTE:`);
                    console.log('Dimensiones disponibles:', dimensions.map(d => ({ id: d.id, name: d.name, type: d.type })));

                    for (const item of parsedResult) {
                        console.log(`\n📄 [${jobId}] Procesando artículo itemId: ${item.itemId}`);
                        
                        for (const dimensionName in item.classifications) {
                            console.log(`\n🔍 [${jobId}] Validando dimensión: "${dimensionName}"`);
                            
                            const foundDimension = dimensions.find(d => d.name === dimensionName);

                            if (!foundDimension) {
                                throw new Error(`La IA devolvió una dimensión desconocida: "${dimensionName}"`);
                            }

                            const classification = item.classifications[dimensionName];
                            const valueToSave = classification.value;

                            console.log(`🧠 [${jobId}] Validando valor "${valueToSave}" para dimensión "${foundDimension.name}" (tipo: ${foundDimension.type})`);

                            // 🧠 LÓGICA DE VALIDACIÓN INTELIGENTE CON NORMALIZACIÓN
                            if (foundDimension.type === 'finite') {
                                const validOptions = foundDimension.preclass_dimension_options.map(opt => opt.value);
                                
                                // 🔧 NORMALIZAR STRINGS: Limpiar espacios y caracteres invisibles
                                const normalizeString = (str: string) => str.trim().replace(/\s+/g, ' ');
                                const normalizedValue = normalizeString(valueToSave);
                                const normalizedOptions = validOptions.map(opt => normalizeString(opt));
                                
                                // Verificar coincidencia exacta con normalización
                                const exactMatchIndex = normalizedOptions.findIndex(opt => opt === normalizedValue);
                                const isExactMatch = exactMatchIndex !== -1;
                                
                                // Verificar opción "Otros" inteligente
                                const otherOption = validOptions.find(opt => normalizeString(opt).toLowerCase().startsWith('otros'));
                                const isSmartOther = otherOption && typeof valueToSave === 'string' && normalizedValue.toLowerCase().startsWith('otros');

                                console.log(`🔍 [${jobId}] Valor original: "${valueToSave}"`);
                                console.log(`🔍 [${jobId}] Valor normalizado: "${normalizedValue}"`);
                                console.log(`🔍 [${jobId}] Opciones válidas:`, validOptions);
                                console.log(`🔍 [${jobId}] Opciones normalizadas:`, normalizedOptions);
                                console.log(`🔍 [${jobId}] Coincidencia exacta: ${isExactMatch} (índice: ${exactMatchIndex}), Otros inteligente: ${isSmartOther}`);

                                if (!isExactMatch && !isSmartOther) {
                                    throw new Error(`Valor "${valueToSave}" inválido para la dimensión finita "${foundDimension.name}". Opciones válidas: ${validOptions.join(', ')}`);
                                }
                            }

                            console.log(`✅ [${jobId}] Valor validado exitosamente: "${valueToSave}"`);

                            reviewsToInsert.push({
                                article_batch_item_id: item.itemId,
                                dimension_id: foundDimension.id,
                                reviewer_type: 'ai',
                                reviewer_id: userId,
                                iteration: 1,
                                classification_value: valueToSave,
                                confidence_score: mapConfidenceToScore(classification.confidence),
                                rationale: classification.rationale,
                            });
                        }
                    }

                    console.log(`\n💾 [${jobId}] PREPARANDO INSERCIÓN:`);
                    console.log(`Total de clasificaciones a insertar: ${reviewsToInsert.length}`);
                    
                    // 🛡️ VALIDACIÓN FINAL ANTI-FALLO SILENCIOSO
                    if (reviewsToInsert.length > 0) {
                        console.log(`\n🚀 [${jobId}] EJECUTANDO INSERCIÓN EN article_dimension_reviews...`);
                        const { error: insertError } = await supabase.from('article_dimension_reviews').insert(reviewsToInsert);
                        
                        if (insertError) {
                            console.error(`❌ [${jobId}] ERROR EN INSERCIÓN:`, insertError);
                            throw new Error(`Error de base de datos al insertar clasificaciones: ${insertError.message}`);
                        }
                        
                        console.log(`✅ [${jobId}] INSERCIÓN EXITOSA: ${reviewsToInsert.length} clasificaciones guardadas`);
                    } else if (parsedResult.length > 0) {
                        console.error(`❌ [${jobId}] FALLO SILENCIOSO EVITADO: Respuesta parseada pero sin clasificaciones válidas`);
                        throw new Error('La respuesta de la IA fue parseada pero no generó ninguna clasificación válida para guardar.');
                    }
                }
            } catch (parseError) {
                console.error(`\n❌ [${jobId}] ERROR PARSEANDO JSON DE LA IA:`);
                console.error('=' .repeat(60));
                console.error('Error:', parseError);
                console.error('Respuesta original:', result);
                console.error('JSON limpio intentado:', cleanResult);
                console.error('=' .repeat(60));
                
                const errorMsg = `Error parseando JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`;
                
                // Actualizar el job con error específico
                await supabase.from('ai_job_history').update({ 
                    status: 'failed', 
                    progress: 100, 
                    details: { 
                        error: errorMsg,
                        originalResponse: result,
                        step: `Error en lote ${i+1}-${i+chunk.length}`,
                        total: items.length,
                        processed: processedCount
                    } 
                }).eq('id', jobId);
                
                throw new Error(errorMsg);
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