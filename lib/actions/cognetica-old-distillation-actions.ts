"use server";

import { createSupabaseServerClient } from "@/lib/server";
import { estimateTokens } from "@/lib/utils/token-estimator";

// ========================================================================
// TYPES
// ========================================================================

export interface ChunkingStrategy {
    total_chunks: number;
    chunk_size_avg: number;
    processing_method: 'accumulative_context';
}

export interface DistilledEssayMetadata {
    model: string;
    generated_at: string;
    token_count: number;
    prompt_version: string;
    source_token_count: number;
    compression_ratio: number;
    chunking_strategy?: ChunkingStrategy;
}

export interface CognitiveElement {
    seeds: Array<{ content: string; context: string; category: string }>;
    thinkers: Array<{ name: string; discipline: string; relevance: string }>;
    disciplines: string[];
    notable_phrases: Array<{ phrase: string; context: string }>;
    pop_culture_analogies?: Array<{ reference: string; analogy: string; connection: string }>;
    image_prompts?: Array<{ style: string; prompt: string }>;
}

export interface ChunkProcessingResult {
    summary: string;
    cognitive_elements: CognitiveElement;
}

export interface GenerateDistilledEssayResult {
    success: boolean;
    data?: {
        essay: string;
        metadata: DistilledEssayMetadata;
        cognitive_elements?: CognitiveElement;
    };
    error?: string;
}

// ========================================================================
// FUNCIÓN: Generar Ensayo Destilado
// ========================================================================

// ========================================================================
// FUNCIÓN AUXILIAR: Dividir texto en chunks inteligentes
// ========================================================================

/**
 * Divide un texto largo en chunks manejables para procesamiento
 * 
 * @param text - Texto completo a dividir
 * @param maxTokens - Máximo de tokens por chunk (default: 30000)
 * @returns Array de chunks de texto
 * 
 * NOTA: Límite reducido a 30k para evitar exceder contexto del modelo:
 * - DeepSeek límite total: 131,072 tokens
 * - Chunk: ~30,000 tokens
 * - Prompt + contexto: ~10,000 tokens
 * - Respuesta esperada: 8,192 tokens
 * - Total: ~48,192 tokens (bien dentro del límite)
 */
function splitIntoChunks(text: string, maxTokens: number = 30000): string[] {
    const estimatedTokens = estimateTokens(text);
    
    // Si el texto cabe en el límite, retornar como un solo chunk
    if (estimatedTokens <= maxTokens) {
        return [text];
    }
    
    // Calcular número de chunks necesarios
    const numChunks = Math.ceil(estimatedTokens / maxTokens);
    const chunkSize = Math.ceil(text.length / numChunks);
    
    const chunks: string[] = [];
    for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize, text.length);
        chunks.push(text.slice(start, end));
    }
    
    return chunks;
}

// ========================================================================
// FUNCIONES AUXILIARES: Procesamiento de Chunks
// ========================================================================

/**
 * Procesa un solo chunk (caso simple)
 */
async function processSingleChunk(
    chunk: string,
    apiKey: string,
    opId: string
): Promise<string> {
    const prompt = `Eres un académico experto en síntesis conceptual. Tu tarea es destilar esta transcripción de podcast/conferencia en un ensayo académico coherente de aproximadamente 6,000-8,000 tokens.

**INSTRUCCIONES CRÍTICAS:**
1. **NO diluyas los conceptos**: Mantén la profundidad teórica y conceptual
2. **Sintetiza sin simplificar**: Reduce redundancias pero preserva complejidad
3. **Estructura académica**: Introduce temas, desarrolla argumentos, concluye insights
4. **Preserva citas y referencias**: Si hay menciones a autores/teorías, manténlas
5. **Lenguaje académico**: Usa terminología precisa, evita coloquialismos
6. **Coherencia narrativa**: El ensayo debe leerse como una pieza unificada, no como resumen de puntos

**FORMATO DE SALIDA (MARKDOWN CON HEADERS):**
- **CRÍTICO**: Usa estructura de headers Markdown (# H1, ## H2, ### H3)
- # Título principal del ensayo (H1)
- ## Introducción (H2) - Contextualiza el tema
- ## Desarrollo (H2) - Organizado por ejes conceptuales con ### subsecciones (H3)
- ## Conclusión (H2) - Sintetiza los insights clave
- Aproximadamente 6,000-8,000 tokens

**EJEMPLO DE ESTRUCTURA REQUERIDA:**
# Título del Ensayo

## Introducción
Contenido introductorio...

## Primer Eje Conceptual
### Aspecto 1
Desarrollo del aspecto...
### Aspecto 2
Desarrollo del aspecto...

## Segundo Eje Conceptual
Contenido del segundo eje...

## Conclusión
Síntesis final...

**TRANSCRIPCIÓN A DESTILAR:**

${chunk}

---

Genera ahora el ensayo destilado:`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 16000,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let content = result.choices[0].message.content;
    
    // 🔧 LIMPIEZA: Si el contenido es un JSON con campo 'essay', extraerlo
    if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
            const possibleJson = JSON.parse(content);
            if (possibleJson.essay && typeof possibleJson.essay === 'string') {
                console.log(`🧹 [${opId}] Detectado JSON en chunk único, extrayendo campo 'essay'`);
                content = possibleJson.essay;
            }
        } catch {
            // No es JSON válido, mantener como está
        }
    }
    
    return content;
}

/**
 * Procesa múltiples chunks con contexto acumulativo
 * Ahora extrae elementos cognitivos además del resumen
 */
async function processMultipleChunks(
    chunks: string[],
    apiKey: string,
    opId: string,
    projectId: string,
    artifactId: string
): Promise<{ essay: string; cognitiveElements: CognitiveElement }> {
    const chunkSummaries: string[] = [];
    const allSeeds: Array<{ content: string; context: string; category: string }> = [];
    const allThinkers: Array<{ name: string; discipline: string; relevance: string }> = [];
    const allDisciplines: Set<string> = new Set();
    const allNotablePhrases: Array<{ phrase: string; context: string }> = [];
    
    // Procesar cada chunk con contexto acumulativo
    for (let i = 0; i < chunks.length; i++) {
        const chunkNumber = i + 1;
        const totalChunks = chunks.length;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📝 [${opId}] PROCESANDO CHUNK ${chunkNumber}/${totalChunks}`);
        console.log(`${'='.repeat(60)}`);
        
        // Construir contexto previo
        const previousContext = chunkSummaries.length > 0
            ? `\n\n**CONTEXTO PREVIO (resúmenes de partes anteriores):**\n${chunkSummaries.join('\n\n---\n\n')}\n\n`
            : '';
        
        const prompt = `Eres un académico experto en síntesis conceptual y extracción cognitiva. Estás procesando la **PARTE ${chunkNumber} de ${totalChunks}** de una transcripción larga.

${previousContext}**INSTRUCCIONES PARA ESTA PARTE:**

1. **RESUMEN ACADÉMICO (CON HEADERS MARKDOWN):**
   - **CRÍTICO**: Usa headers Markdown (## H2, ### H3) para estructurar
   - Mantén coherencia con el contexto previo (si existe)
   - NO diluyas conceptos: Preserva profundidad teórica
   - Sintetiza sin simplificar: Reduce redundancias, preserva complejidad
   - Preserva citas y referencias: Autores, teorías, conceptos clave
   - Lenguaje académico: Terminología precisa

2. **ELEMENTOS COGNITIVOS A EXTRAER:**
   - **Seeds (máx 10)**: Conceptos clave, metáforas, principios, patrones
   - **Thinkers (máx 5)**: Pensadores mencionados o relevantes al contenido
   - **Disciplines (máx 5)**: Disciplinas académicas relacionadas
   - **Notable Phrases (máx 5)**: Frases memorables o importantes

**CONTENIDO DE LA PARTE ${chunkNumber}:**

${chunks[i]}

---

**FORMATO DE RESPUESTA (JSON):**
\`\`\`json
{
  "summary": "Resumen académico de esta parte (~2,000-3,000 tokens)...",
  "cognitive_elements": {
    "seeds": [
      {"content": "Concepto clave", "context": "Contexto donde aparece", "category": "concepto"}
    ],
    "thinkers": [
      {"name": "Nombre del pensador", "discipline": "Disciplina", "relevance": "Por qué es relevante"}
    ],
    "disciplines": ["Disciplina 1", "Disciplina 2"],
    "notable_phrases": [
      {"phrase": "Frase notable", "context": "Contexto"}
    ]
  }
}
\`\`\`

Genera ahora el análisis completo en formato JSON:`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-reasoner',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 8192,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error en chunk ${chunkNumber}: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        let responseContent = result.choices[0].message.content;
        
        // Limpiar markdown si viene con backticks
        if (responseContent.includes('```json')) {
            responseContent = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (responseContent.includes('```')) {
            responseContent = responseContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Parsear respuesta JSON
        let chunkResult: ChunkProcessingResult;
        try {
            chunkResult = JSON.parse(responseContent);
        } catch (parseError) {
            console.error(`❌ [${opId}] Error parseando JSON del chunk ${chunkNumber}:`, parseError);
            console.log('Respuesta recibida:', responseContent.slice(0, 500));
            throw new Error(`Error parseando respuesta del chunk ${chunkNumber}`);
        }
        
        // Guardar resumen
        chunkSummaries.push(`**RESUMEN PARTE ${chunkNumber}:**\n${chunkResult.summary}`);
        
        // Acumular elementos cognitivos
        if (chunkResult.cognitive_elements) {
            allSeeds.push(...(chunkResult.cognitive_elements.seeds || []));
            allThinkers.push(...(chunkResult.cognitive_elements.thinkers || []));
            (chunkResult.cognitive_elements.disciplines || []).forEach(d => allDisciplines.add(d));
            allNotablePhrases.push(...(chunkResult.cognitive_elements.notable_phrases || []));
        }
        
        const summaryTokens = Math.round(chunkResult.summary.length / 4);
        console.log(`✅ [${opId}] Chunk ${chunkNumber}/${totalChunks} procesado (~${summaryTokens} tokens)`);
        console.log(`   📦 Seeds: ${chunkResult.cognitive_elements?.seeds?.length || 0}, Thinkers: ${chunkResult.cognitive_elements?.thinkers?.length || 0}, Disciplines: ${chunkResult.cognitive_elements?.disciplines?.length || 0}`);
        console.log(`📊 [${opId}] Progreso: ${Math.round((chunkNumber / totalChunks) * 100)}% de chunks completados`);
    }
    
    // Consolidar todos los resúmenes en un ensayo final coherente
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 [${opId}] FASE FINAL: CONSOLIDACIÓN`);
    console.log(`📦 [${opId}] Consolidando ${chunkSummaries.length} resúmenes en ensayo final...`);
    console.log(`${'='.repeat(60)}`);
    
    const consolidationPrompt = `Eres un académico experto en síntesis conceptual. Has recibido ${chunkSummaries.length} resúmenes parciales de una transcripción larga. Tu tarea es:

1. Consolidarlos en un **ensayo académico coherente y unificado** de aproximadamente 6,000-8,000 tokens
2. Generar **3 analogías de cultura pop** creativas para humildad epistémica
3. Generar **3 prompts de imagen** para visualizar conceptos clave

**RESÚMENES PARCIALES:**

${chunkSummaries.join('\n\n---\n\n')}

---

**INSTRUCCIONES PARA LA CONSOLIDACIÓN:**
1. **Unifica la narrativa**: El ensayo debe leerse como una pieza coherente, no como partes separadas
2. **Elimina redundancias**: Si un concepto aparece en múltiples partes, menciónalo una vez de forma integrada
3. **Estructura académica clara**:
   - Título sugerido
   - Introducción que contextualiza el tema completo
   - Desarrollo organizado por ejes conceptuales (no por partes)
   - Conclusión que sintetiza los insights clave de TODA la transcripción
4. **Preserva profundidad**: No diluyas los conceptos al consolidar
5. **Mantén todas las referencias**: Autores, teorías, citas mencionadas en cualquier parte

**ANALOGÍAS DE CULTURA POP (3):**
Crea EXACTAMENTE 3 analogías, una de cada tipo:

1. **PELÍCULA O SERIE** (no videojuegos, no anime):
   - Puede ser clásica, contemporánea, cult, mainstream
   - EVITA lo obvio: nada de Matrix, Inception, Black Mirror
   - Busca referencias cinematográficas/televisivas sorprendentes

2. **HECHO HISTÓRICO**:
   - Evento real, figura histórica, o momento cultural significativo
   - Puede ser antiguo o reciente (últimos 100 años)
   - Debe tener una conexión conceptual clara con el tema

3. **MEME DE INTERNET**:
   - Meme viral, fenómeno de redes sociales, o cultura digital
   - Puede ser de cualquier época de internet (2000s hasta hoy)
   - Debe ser reconocible pero usado de forma inteligente

**PROMPTS DE IMAGEN (3):**
Crea 3 variantes distintas:
1. Estilo conceptual/abstracto (geometría, fractales, símbolos)
2. Estilo figurativo/narrativo (escena, personajes, situación)
3. Estilo artístico/estético (pintura, ilustración, arte digital)

Cada prompt debe ser detallado (50-100 palabras), en inglés, optimizado para Seedream 4K.

**FORMATO DE RESPUESTA (JSON):**
\`\`\`json
{
  "essay": "El ensayo consolidado completo...",
  "pop_culture_analogies": [
    {
      "reference": "Nombre de la referencia cultural",
      "analogy": "La analogía explicada",
      "connection": "Cómo conecta con el tema del artefacto"
    }
  ],
  "image_prompts": [
    {
      "style": "conceptual",
      "prompt": "Detailed prompt in English for Seedream 4K..."
    }
  ]
}
\`\`\`

Genera ahora la respuesta completa en JSON:`;

    const consolidationResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [{ role: 'user', content: consolidationPrompt }],
            temperature: 0.7,
            max_tokens: 16000,
            stream: false
        })
    });

    if (!consolidationResponse.ok) {
        const errorText = await consolidationResponse.text();
        throw new Error(`DeepSeek API error en consolidación: ${consolidationResponse.status} - ${errorText}`);
    }

    const consolidationResult = await consolidationResponse.json();
    
    console.log(`📊 [${opId}] Respuesta de consolidación recibida:`, {
        hasChoices: !!consolidationResult.choices,
        choicesLength: consolidationResult.choices?.length,
        hasContent: !!consolidationResult.choices?.[0]?.message?.content,
        contentLength: consolidationResult.choices?.[0]?.message?.content?.length
    });
    
    let responseContent = consolidationResult.choices[0].message.content;
    
    // Limpiar markdown si viene con backticks
    if (responseContent.includes('```json')) {
        responseContent = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseContent.includes('```')) {
        responseContent = responseContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parsear JSON de consolidación
    let consolidationData: {
        essay: string;
        pop_culture_analogies?: Array<{ reference: string; analogy: string; connection: string }>;
        image_prompts?: Array<{ style: string; prompt: string }>;
    };
    
    try {
        consolidationData = JSON.parse(responseContent);
        console.log(`✅ [${opId}] JSON parseado exitosamente`);
    } catch (parseError) {
        console.warn(`⚠️ [${opId}] No se pudo parsear JSON, usando respuesta como texto plano`);
        // Si no es JSON, asumir que es solo el ensayo
        consolidationData = { essay: responseContent };
    }
    
    // 🔧 LIMPIEZA CRÍTICA: Extraer solo el campo 'essay' del JSON
    let finalEssay = consolidationData.essay || responseContent;
    
    // 🛡️ PROTECCIÓN: Si finalEssay es un objeto JSON stringificado, extraer el campo 'essay'
    if (typeof finalEssay === 'string' && finalEssay.trim().startsWith('{')) {
        try {
            const possibleJson = JSON.parse(finalEssay);
            if (possibleJson.essay && typeof possibleJson.essay === 'string') {
                console.log(`🧹 [${opId}] Detectado JSON anidado, extrayendo campo 'essay'`);
                finalEssay = possibleJson.essay;
            }
        } catch {
            // No es JSON válido, mantener como está
        }
    }
    
    console.log(`📝 [${opId}] Ensayo final limpio: ${finalEssay.length} caracteres, tipo: ${typeof finalEssay}`);
    
    if (!finalEssay || finalEssay.length === 0) {
        console.error(`❌ [${opId}] ERROR: Ensayo final está vacío!`);
        throw new Error('La consolidación no generó contenido');
    }
    
    console.log(`✅ [${opId}] Consolidación completada exitosamente`);
    console.log(`📝 [${opId}] Ensayo final: ${finalEssay.length} caracteres`);
    console.log(`🎬 [${opId}] Analogías generadas: ${consolidationData.pop_culture_analogies?.length || 0}`);
    console.log(`🎨 [${opId}] Prompts de imagen generados: ${consolidationData.image_prompts?.length || 0}`);
    
    // Consolidar elementos cognitivos
    console.log(`\n📦 [${opId}] Consolidando elementos cognitivos...`);
    console.log(`   Total Seeds: ${allSeeds.length}`);
    console.log(`   Total Thinkers: ${allThinkers.length}`);
    console.log(`   Total Disciplines: ${allDisciplines.size}`);
    console.log(`   Total Notable Phrases: ${allNotablePhrases.length}`);
    
    const consolidatedElements: CognitiveElement = {
        seeds: allSeeds,
        thinkers: allThinkers,
        disciplines: Array.from(allDisciplines),
        notable_phrases: allNotablePhrases,
        pop_culture_analogies: consolidationData.pop_culture_analogies || [],
        image_prompts: consolidationData.image_prompts || []
    };
    
    return {
        essay: finalEssay,
        cognitiveElements: consolidatedElements
    };
}

// ========================================================================
// FUNCIÓN AUXILIAR: Guardar Elementos Cognitivos
// ========================================================================

/**
 * Guarda elementos cognitivos en las tablas existentes
 * Sobrescribe elementos existentes (útil para desarrollo/testing)
 */
async function saveCognitiveElements(
    supabase: any,
    projectId: string,
    artifactId: string,
    elements: CognitiveElement,
    opId: string
): Promise<void> {
    console.log(`💾 [${opId}] Guardando elementos cognitivos en BD...`);

    // 1. BORRAR elementos existentes para este artefacto (sobrescribir en modo dev/test)
    console.log(`🗑️ [${opId}] Eliminando elementos cognitivos previos...`);
    
    // Contar y borrar semillas
    const { count: prevSeedsCount } = await supabase
        .from('cog_fractal_seeds')
        .select('*', { count: 'exact', head: true })
        .eq('artifact_id', artifactId);
    
    const { error: deleteSeedsError } = await supabase
        .from('cog_fractal_seeds')
        .delete()
        .eq('artifact_id', artifactId);
    
    if (deleteSeedsError) {
        console.error(`❌ [${opId}] Error borrando semillas previas:`, deleteSeedsError);
    } else {
        console.log(`✅ [${opId}] ${prevSeedsCount || 0} semillas previas borradas`);
    }
    
    // Contar y borrar relaciones disciplinas
    const { count: prevDiscCount } = await supabase
        .from('cog_artifact_disciplines')
        .select('*', { count: 'exact', head: true })
        .eq('artifact_id', artifactId);
    
    const { error: deleteDiscError } = await supabase
        .from('cog_artifact_disciplines')
        .delete()
        .eq('artifact_id', artifactId);
    
    if (deleteDiscError) {
        console.error(`❌ [${opId}] Error borrando relaciones disciplinas previas:`, deleteDiscError);
    } else {
        console.log(`✅ [${opId}] ${prevDiscCount || 0} relaciones disciplinas previas borradas`);
    }
    
    // Borrar relaciones artefacto-referencias (pensadores)
    const { count: prevRefCount } = await supabase
        .from('cog_artifact_references')
        .select('*', { count: 'exact', head: true })
        .eq('artifact_id', artifactId);
    
    const { error: deleteRefError } = await supabase
        .from('cog_artifact_references')
        .delete()
        .eq('artifact_id', artifactId);
    
    if (deleteRefError) {
        console.error(`❌ [${opId}] Error borrando referencias previas:`, deleteRefError);
    } else {
        console.log(`✅ [${opId}] ${prevRefCount || 0} referencias previas borradas`);
    }
    
    // Limpiar analogías y prompts del source_metadata
    const { data: currentMetadata } = await supabase
        .from('cog_artifacts')
        .select('source_metadata')
        .eq('id', artifactId)
        .single();
    
    if (currentMetadata?.source_metadata && typeof currentMetadata.source_metadata === 'object') {
        const cleanedMetadata = { ...(currentMetadata.source_metadata as Record<string, unknown>) };
        delete cleanedMetadata.pop_culture_analogies;
        delete cleanedMetadata.image_prompts;
        
        await supabase
            .from('cog_artifacts')
            .update({ source_metadata: cleanedMetadata as never })
            .eq('id', artifactId);
        
        console.log(`✅ [${opId}] Analogías y prompts eliminados de source_metadata`);
    }

    // 2. GUARDAR SEMILLAS (seeds)
    if (elements.seeds && elements.seeds.length > 0) {
        const seedsToInsert = elements.seeds.map(seed => ({
            project_id: projectId,
            artifact_id: artifactId,
            content: seed.content,
            context: seed.context,
            properties: {
                category: seed.category,
                source: 'unified_distillation'
            },
            tags: [seed.category, 'auto-generated', 'unified-process']
        }));

        const { error: seedsError } = await supabase
            .from('cog_fractal_seeds')
            .insert(seedsToInsert);

        if (seedsError) {
            console.error(`❌ [${opId}] Error guardando semillas:`, seedsError);
        } else {
            console.log(`✅ [${opId}] ${seedsToInsert.length} semillas guardadas`);
        }
    }

    // 3. GUARDAR DISCIPLINAS
    if (elements.disciplines && elements.disciplines.length > 0) {
        for (const disciplineName of elements.disciplines) {
            // Buscar o crear disciplina
            const { data: existingDisc } = await supabase
                .from('cog_disciplines')
                .select('id')
                .eq('name', disciplineName)
                .eq('project_id', projectId)
                .maybeSingle();

            let disciplineId = existingDisc?.id;

            if (!disciplineId) {
                const { data: newDisc } = await supabase
                    .from('cog_disciplines')
                    .insert({ name: disciplineName, project_id: projectId })
                    .select('id')
                    .single();
                disciplineId = newDisc?.id;
            }

            // Asociar al artefacto
            if (disciplineId) {
                await supabase
                    .from('cog_artifact_disciplines')
                    .insert({ artifact_id: artifactId, discipline_id: disciplineId });
            }
        }
        console.log(`✅ [${opId}] ${elements.disciplines.length} disciplinas procesadas`);
    }

    // 4. GUARDAR PENSADORES (thinkers)
    if (elements.thinkers && elements.thinkers.length > 0) {
        for (const thinker of elements.thinkers) {
            // Buscar disciplina para asociar
            const { data: discData } = await supabase
                .from('cog_disciplines')
                .select('id')
                .eq('name', thinker.discipline)
                .eq('project_id', projectId)
                .maybeSingle();

            // Buscar o crear pensador
            const { data: existingRef } = await supabase
                .from('cog_references')
                .select('id')
                .eq('name', thinker.name)
                .eq('project_id', projectId)
                .maybeSingle();

            if (!existingRef) {
                await supabase
                    .from('cog_references')
                    .insert({
                        project_id: projectId,
                        name: thinker.name,
                        is_thinker: true,
                        discipline_id: discData?.id,
                        properties: {
                            relevance: thinker.relevance,
                            source: 'unified_distillation'
                        }
                    });
            }
        }
        console.log(`✅ [${opId}] ${elements.thinkers.length} pensadores procesados`);
    }

    // 5. GUARDAR FRASES NOTABLES (como semillas especiales)
    if (elements.notable_phrases && elements.notable_phrases.length > 0) {
        const phrasesToInsert = elements.notable_phrases.map(phrase => ({
            project_id: projectId,
            artifact_id: artifactId,
            content: phrase.phrase,
            context: phrase.context,
            properties: {
                type: 'notable_phrase',
                source: 'unified_distillation'
            },
            tags: ['frase-notable', 'auto-generated', 'unified-process']
        }));

        const { error: phrasesError } = await supabase
            .from('cog_fractal_seeds')
            .insert(phrasesToInsert);

        if (phrasesError) {
            console.error(`❌ [${opId}] Error guardando frases notables:`, phrasesError);
        } else {
            console.log(`✅ [${opId}] ${phrasesToInsert.length} frases notables guardadas`);
        }
    }

    // 6. GUARDAR ANALOGÍAS Y PROMPTS en source_metadata
    if ((elements.pop_culture_analogies && elements.pop_culture_analogies.length > 0) ||
        (elements.image_prompts && elements.image_prompts.length > 0)) {
        
        // Obtener metadata actual
        const { data: currentArtifact } = await supabase
            .from('cog_artifacts')
            .select('source_metadata')
            .eq('id', artifactId)
            .single();
        
        const currentMetadata = (currentArtifact?.source_metadata || {}) as Record<string, unknown>;
        
        // Actualizar con analogías y prompts
        const updatedMetadata = {
            ...currentMetadata,
            pop_culture_analogies: elements.pop_culture_analogies || [],
            image_prompts: elements.image_prompts || []
        };
        
        await supabase
            .from('cog_artifacts')
            .update({ source_metadata: updatedMetadata as never })
            .eq('id', artifactId);
        
        console.log(`✅ [${opId}] ${elements.pop_culture_analogies?.length || 0} analogías y ${elements.image_prompts?.length || 0} prompts guardados en source_metadata`);
    }

    console.log(`✅ [${opId}] Todos los elementos cognitivos guardados exitosamente`);
}

// ========================================================================
// FUNCIÓN: Generar Ensayo Destilado con Chunking Inteligente
// ========================================================================

/**
 * Genera un ensayo destilado (~6-8k tokens) a partir de una transcripción larga
 * usando chunking inteligente con contexto acumulativo
 * Ahora también extrae y guarda elementos cognitivos en el proceso
 * 
 * @param artifactId - ID del artefacto
 * @returns Ensayo destilado, metadata y elementos cognitivos
 */
export async function generateDistilledEssay(
    artifactId: string
): Promise<GenerateDistilledEssayResult> {
    const opId = `DISTILL-${Math.floor(Math.random() * 10000)}`;
    console.log(`🎯 [${opId}] Iniciando generación de ensayo destilado para artifact: ${artifactId}`);

    try {
        const supabase = await createSupabaseServerClient();

        // 1. Obtener transcripción completa
        console.log(`📖 [${opId}] Obteniendo transcripción...`);
        const { data: transcription, error: fetchError } = await supabase
            .from('cog_transcriptions')
            .select('id, full_text, artifact_id')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !transcription) {
            console.error(`❌ [${opId}] Error obteniendo transcripción:`, fetchError);
            return {
                success: false,
                error: 'No se encontró transcripción para este artefacto'
            };
        }

        if (!transcription.full_text) {
            return {
                success: false,
                error: 'La transcripción está vacía'
            };
        }

        const sourceTokenCount = estimateTokens(transcription.full_text);
        console.log(`📊 [${opId}] Transcripción original: ${transcription.full_text.length} caracteres, ~${sourceTokenCount} tokens`);

        // 2. Obtener project_id del artefacto
        const { data: artifact, error: artifactError } = await supabase
            .from('cog_artifacts')
            .select('project_id')
            .eq('id', artifactId)
            .single();

        if (artifactError || !artifact?.project_id) {
            console.error(`❌ [${opId}] Error obteniendo project_id:`, artifactError);
            return {
                success: false,
                error: 'No se pudo obtener el proyecto del artefacto'
            };
        }

        const projectId = artifact.project_id;
        console.log(`📂 [${opId}] Project ID: ${projectId}`);

        // 3. Verificar si ya existe un ensayo destilado
        const { data: existing } = await supabase
            .from('cog_transcriptions')
            .select('distilled_essay, distilled_essay_metadata')
            .eq('id', transcription.id)
            .single();

        if (existing?.distilled_essay) {
            console.log(`ℹ️ [${opId}] Ya existe un ensayo destilado, regenerando...`);
        }

        // 3. Dividir en chunks si es necesario (30k tokens por chunk)
        const chunks = splitIntoChunks(transcription.full_text, 30000);
        console.log(`📦 [${opId}] Texto dividido en ${chunks.length} chunk(s)`);

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            throw new Error('DEEPSEEK_API_KEY no configurado');
        }

        let finalEssay = '';
        let cognitiveElements: CognitiveElement | undefined;

        // 4. Procesar chunks con contexto acumulativo
        if (chunks.length === 1) {
            // Caso simple: un solo chunk (por ahora sin elementos cognitivos)
            console.log(`🤖 [${opId}] Procesando chunk único...`);
            finalEssay = await processSingleChunk(chunks[0], DEEPSEEK_API_KEY, opId);
        } else {
            // Caso complejo: múltiples chunks con contexto acumulativo + elementos cognitivos
            console.log(`🤖 [${opId}] Procesando ${chunks.length} chunks con contexto acumulativo...`);
            const result = await processMultipleChunks(chunks, DEEPSEEK_API_KEY, opId, projectId, artifactId);
            finalEssay = result.essay;
            cognitiveElements = result.cognitiveElements;
        }

        // 🛡️ SANITIZACIÓN FINAL: Última verificación antes de guardar
        // Si finalEssay sigue siendo un JSON envuelto, extraer el campo 'essay'
        if (typeof finalEssay === 'string' && finalEssay.trim().startsWith('{')) {
            try {
                const possibleJson = JSON.parse(finalEssay);
                if (possibleJson.essay && typeof possibleJson.essay === 'string') {
                    console.log(`🧹 [${opId}] SANITIZACIÓN FINAL: Detectado JSON antes de guardar, extrayendo 'essay'`);
                    finalEssay = possibleJson.essay;
                }
            } catch {
                // No es JSON válido, mantener como está
            }
        }
        
        const essayTokenCount = estimateTokens(finalEssay);
        console.log(`✅ [${opId}] Ensayo final generado: ${finalEssay.length} caracteres, ~${essayTokenCount} tokens`);
        console.log(`📝 [${opId}] Tipo de contenido: ${typeof finalEssay}, Inicia con '{': ${finalEssay.trim().startsWith('{')}`);
        
        if (!finalEssay || finalEssay.length === 0) {
            console.error(`❌ [${opId}] ERROR CRÍTICO: finalEssay está vacío antes de guardar!`);
            throw new Error('El ensayo final está vacío');
        }

        // 5. Preparar metadata
        const metadata: DistilledEssayMetadata = {
            model: 'deepseek-reasoner',
            generated_at: new Date().toISOString(),
            token_count: essayTokenCount,
            prompt_version: 'v2.0-chunked',
            source_token_count: sourceTokenCount,
            compression_ratio: essayTokenCount / sourceTokenCount,
            chunking_strategy: chunks.length > 1 ? {
                total_chunks: chunks.length,
                chunk_size_avg: Math.floor(transcription.full_text.length / chunks.length),
                processing_method: 'accumulative_context'
            } : undefined
        };

        // 6. Guardar en base de datos
        console.log(`💾 [${opId}] Guardando ensayo destilado...`);
        const { error: updateError } = await supabase
            .from('cog_transcriptions')
            .update({
                distilled_essay: finalEssay,
                distilled_essay_metadata: JSON.parse(JSON.stringify(metadata))
            })
            .eq('id', transcription.id);

        if (updateError) {
            console.error(`❌ [${opId}] Error guardando ensayo:`, updateError);
            throw new Error(`Error guardando ensayo: ${updateError.message}`);
        }

        // 7. Guardar elementos cognitivos si existen (solo en modo multi-chunk)
        if (cognitiveElements) {
            console.log(`\n📦 [${opId}] Guardando elementos cognitivos...`);
            await saveCognitiveElements(supabase, projectId, artifactId, cognitiveElements, opId);
        }

        console.log(`✅✅ [${opId}] Ensayo destilado generado y guardado exitosamente`);
        console.log(`📊 [${opId}] Compresión: ${sourceTokenCount} → ${essayTokenCount} tokens (${(metadata.compression_ratio * 100).toFixed(1)}%)`);

        return {
            success: true,
            data: {
                essay: finalEssay,
                metadata,
                cognitive_elements: cognitiveElements
            }
        };

    } catch (error) {
        console.error(`❌ [${opId}] Error generando ensayo destilado:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// ========================================================================
// FUNCIÓN: Borrar Ensayo Destilado
// ========================================================================

/**
 * Borra el ensayo destilado y elementos cognitivos de un artefacto
 * Útil para regenerar desde cero en desarrollo/testing
 * 
 * @param artifactId - ID del artefacto
 * @returns Resultado de la operación
 */
export async function deleteDistilledEssay(artifactId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createSupabaseServerClient();

        console.log(`🗑️ Borrando ensayo destilado para artifact: ${artifactId}`);

        // 1. Borrar ensayo de la transcripción
        const { error: updateError } = await supabase
            .from('cog_transcriptions')
            .update({
                distilled_essay: null,
                distilled_essay_metadata: null
            })
            .eq('artifact_id', artifactId);

        if (updateError) {
            console.error('Error borrando ensayo:', updateError);
            return { success: false, error: updateError.message };
        }

        // 2. Borrar elementos cognitivos asociados
        console.log(`🗑️ Borrando semillas fractales...`);
        const { count: seedsCount } = await supabase
            .from('cog_fractal_seeds')
            .select('*', { count: 'exact', head: true })
            .eq('artifact_id', artifactId);
        
        const { error: seedsError } = await supabase
            .from('cog_fractal_seeds')
            .delete()
            .eq('artifact_id', artifactId);

        if (seedsError) {
            console.error('❌ Error borrando semillas:', seedsError);
        } else {
            console.log(`✅ ${seedsCount || 0} semillas borradas`);
        }

        console.log(`🗑️ Borrando relaciones disciplinas-artefacto...`);
        const { count: discCount } = await supabase
            .from('cog_artifact_disciplines')
            .select('*', { count: 'exact', head: true })
            .eq('artifact_id', artifactId);
        
        const { error: discError } = await supabase
            .from('cog_artifact_disciplines')
            .delete()
            .eq('artifact_id', artifactId);

        if (discError) {
            console.error('❌ Error borrando relaciones disciplinas:', discError);
        } else {
            console.log(`✅ ${discCount || 0} relaciones disciplinas borradas`);
        }

        // 3. Obtener project_id para borrar referencias
        const { data: artifactData } = await supabase
            .from('cog_artifacts')
            .select('project_id')
            .eq('id', artifactId)
            .single();

        console.log(`🗑️ Borrando relaciones artefacto-referencias (pensadores)...`);
        const { count: refCount } = await supabase
            .from('cog_artifact_references')
            .select('*', { count: 'exact', head: true })
            .eq('artifact_id', artifactId);
        
        const { error: refError } = await supabase
            .from('cog_artifact_references')
            .delete()
            .eq('artifact_id', artifactId);

        if (refError) {
            console.error('❌ Error borrando relaciones referencias:', refError);
        } else {
            console.log(`✅ ${refCount || 0} relaciones referencias borradas`);
        }
        
        // 4. Limpiar analogías y prompts del source_metadata
        const { data: currentMetadata } = await supabase
            .from('cog_artifacts')
            .select('source_metadata')
            .eq('id', artifactId)
            .single();
        
        if (currentMetadata?.source_metadata && typeof currentMetadata.source_metadata === 'object') {
            const cleanedMetadata = { ...(currentMetadata.source_metadata as Record<string, unknown>) };
            delete cleanedMetadata.pop_culture_analogies;
            delete cleanedMetadata.image_prompts;
            
            await supabase
                .from('cog_artifacts')
                .update({ source_metadata: cleanedMetadata as never })
                .eq('id', artifactId);
            
            console.log(`✅ Analogías y prompts eliminados de source_metadata`);
        }

        console.log(`✅ Ensayo y elementos cognitivos borrados exitosamente`);

        return { success: true };

    } catch (error) {
        console.error('Error borrando ensayo destilado:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// ========================================================================
// FUNCIÓN: Borrar Solo Elementos Cognitivos (sin tocar ensayo)
// ========================================================================

/**
 * Borra únicamente los elementos cognitivos de un artefacto
 * (semillas, disciplinas, referencias) sin eliminar el ensayo destilado.
 * Útil para artefactos que tienen elementos cognitivos pero no ensayo.
 * 
 * @param artifactId - ID del artefacto
 * @returns Resultado de la operación con conteo de elementos borrados
 */
export async function deleteCognitiveElements(artifactId: string): Promise<{
    success: boolean;
    data?: {
        seedsDeleted: number;
        disciplinesDeleted: number;
        referencesDeleted: number;
    };
    error?: string;
}> {
    try {
        const supabase = await createSupabaseServerClient();

        console.log(`🗑️ Borrando elementos cognitivos para artifact: ${artifactId}`);

        // 1. Borrar semillas fractales
        console.log(`🗑️ Borrando semillas fractales...`);
        const { count: seedsCount } = await supabase
            .from('cog_fractal_seeds')
            .select('*', { count: 'exact', head: true })
            .eq('artifact_id', artifactId);
        
        const { error: seedsError } = await supabase
            .from('cog_fractal_seeds')
            .delete()
            .eq('artifact_id', artifactId);

        if (seedsError) {
            console.error('❌ Error borrando semillas:', seedsError);
            return { success: false, error: seedsError.message };
        }
        console.log(`✅ ${seedsCount || 0} semillas borradas`);

        // 2. Borrar relaciones disciplinas-artefacto
        console.log(`🗑️ Borrando relaciones disciplinas-artefacto...`);
        const { count: discCount } = await supabase
            .from('cog_artifact_disciplines')
            .select('*', { count: 'exact', head: true })
            .eq('artifact_id', artifactId);
        
        const { error: discError } = await supabase
            .from('cog_artifact_disciplines')
            .delete()
            .eq('artifact_id', artifactId);

        if (discError) {
            console.error('❌ Error borrando relaciones disciplinas:', discError);
            return { success: false, error: discError.message };
        }
        console.log(`✅ ${discCount || 0} relaciones disciplinas borradas`);

        // 3. Obtener project_id para borrar referencias
        const { data: artifactData } = await supabase
            .from('cog_artifacts')
            .select('project_id')
            .eq('id', artifactId)
            .single();

        let refCount = 0;
        console.log(`🗑️ Borrando relaciones artefacto-referencias (pensadores)...`);
        const { count } = await supabase
            .from('cog_artifact_references')
            .select('*', { count: 'exact', head: true })
            .eq('artifact_id', artifactId);
        
        refCount = count || 0;
        
        const { error: refError } = await supabase
            .from('cog_artifact_references')
            .delete()
            .eq('artifact_id', artifactId);

        if (refError) {
            console.error('❌ Error borrando relaciones referencias:', refError);
            return { success: false, error: refError.message };
        }
        console.log(`✅ ${refCount} relaciones referencias borradas`);
        
        // 4. Limpiar analogías y prompts del source_metadata
        const { data: currentMetadata } = await supabase
            .from('cog_artifacts')
            .select('source_metadata')
            .eq('id', artifactId)
            .single();
        
        if (currentMetadata?.source_metadata && typeof currentMetadata.source_metadata === 'object') {
            const cleanedMetadata = { ...(currentMetadata.source_metadata as Record<string, unknown>) };
            delete cleanedMetadata.pop_culture_analogies;
            delete cleanedMetadata.image_prompts;
            
            await supabase
                .from('cog_artifacts')
                .update({ source_metadata: cleanedMetadata as never })
                .eq('id', artifactId);
            
            console.log(`✅ Analogías y prompts eliminados de source_metadata`);
        }

        console.log(`✅ Elementos cognitivos borrados exitosamente`);

        return {
            success: true,
            data: {
                seedsDeleted: seedsCount || 0,
                disciplinesDeleted: discCount || 0,
                referencesDeleted: refCount
            }
        };

    } catch (error) {
        console.error('Error borrando elementos cognitivos:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// ========================================================================
// FUNCIÓN: Obtener Ensayo Destilado
// ========================================================================

/**
 * Obtiene el ensayo destilado de un artefacto si existe
 * 
 * @param artifactId - ID del artefacto
 * @returns Ensayo destilado y metadata, o null si no existe
 */
export async function getDistilledEssay(artifactId: string): Promise<{
    success: boolean;
    data?: {
        essay: string;
        metadata: DistilledEssayMetadata;
    } | null;
    error?: string;
}> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from('cog_transcriptions')
            .select('distilled_essay, distilled_essay_metadata')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error obteniendo ensayo destilado:', error);
            return { success: false, error: error.message };
        }

        if (!data?.distilled_essay) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                essay: data.distilled_essay,
                metadata: data.distilled_essay_metadata as unknown as DistilledEssayMetadata
            }
        };

    } catch (error) {
        console.error('Error obteniendo ensayo destilado:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
