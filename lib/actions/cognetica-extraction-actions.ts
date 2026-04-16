"use server";

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { callDeepSeekAPI } from "@/lib/deepseek/api";

// Tipos para la extracción cognitiva
interface FractalSeed {
    content: string;
    context: string;
    relevance: number; // 0-1
    category: 'concepto' | 'metafora' | 'principio' | 'patron' | 'cita';
}

interface Thinker {
    name: string;
    discipline: string;
    era: string;
    bio_snippet: string;
    key_contributions: string[];
    avatar_prompt: string; // Prompt para generar imagen
}

interface Quote {
    text: string;
    author: string;
    context: string;
}

interface ImagePrompt {
    style: "conceptual" | "figurative" | "artistic";
    prompt: string;
}

interface PopCultureAnalogy {
    reference: string;
    analogy: string;
    connection: string;
}

interface CognitiveExtraction {
    fractal_seeds: FractalSeed[];
    disciplines: string[];
    thinkers: Thinker[];
    theories: string[];
    thought_streams: string[];
    quotes: Quote[];
    image_prompts: ImagePrompt[];
    pop_culture_analogies: PopCultureAnalogy[];
    summary: string;
}

/**
 * Extrae elementos cognitivos de una transcripción usando Gemini
 */
export async function extractCognitiveElements(artifactId: string) {
    console.log(`🧠 [DeepSeek] Iniciando extracción cognitiva para artefacto: ${artifactId}`);
    
    const supabase = await createServerClient();
    
    // 1. Obtener el project_id y tipo del artefacto
    const { data: artifact } = await supabase
        .from('cog_artifacts')
        .select('project_id, type, source_metadata')
        .eq('id', artifactId)
        .single();
    
    if (!artifact?.project_id) {
        return { success: false, error: "Artefacto sin proyecto asociado" };
    }
    
    let fullText = '';
    
    // 2. Obtener texto según tipo de artefacto
    console.log(`🧠 [DeepSeek] source_metadata:`, JSON.stringify(artifact.source_metadata));
    console.log(`🧠 [DeepSeek] type:`, artifact.type);
    
    // Detectar si es presentación: por type='pdf_slides' O por metadata legacy
    const isPresentation = 
        artifact.type === 'pdf_slides' ||
        (
            artifact.source_metadata && 
            typeof artifact.source_metadata === 'object' && 
            !Array.isArray(artifact.source_metadata) &&
            (
                ('isPresentation' in artifact.source_metadata && artifact.source_metadata.isPresentation === true) ||
                ('processing_mode' in artifact.source_metadata && artifact.source_metadata.processing_mode === 'presentacion')
            )
        );
    
    console.log(`🧠 [DeepSeek] isPresentation detectado:`, isPresentation);
    
    if (isPresentation) {
        // Para presentaciones: obtener markdown de todas las páginas
        console.log(`🧠 [DeepSeek] Detectada presentación, obteniendo páginas...`);
        
        const { data: pages, error: pagesError } = await supabase
            .from('cog_artifact_pages')
            .select('page_number, markdown_original')
            .eq('artifact_id', artifactId)
            .eq('status', 'processed')
            .order('page_number', { ascending: true });
        
        if (pagesError || !pages || pages.length === 0) {
            console.error("🧠 [DeepSeek] ❌ No hay páginas procesadas:", pagesError);
            return { success: false, error: "No hay páginas procesadas para analizar" };
        }
        
        // Concatenar markdown de todas las páginas
        fullText = pages
            .map(p => `\n--- PÁGINA ${p.page_number} ---\n${p.markdown_original || ''}`)
            .join('\n\n');
        
        console.log(`🧠 [DeepSeek] ${pages.length} páginas encontradas: ${fullText.length} caracteres`);
    } else {
        // Para audio/PDF/markdown: obtener de transcripción
        const { data: transcription, error: fetchError } = await supabase
            .from('cog_transcriptions')
            .select('id, full_text, artifact_id')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (fetchError || !transcription?.full_text) {
            console.error("🧠 [DeepSeek] ❌ No hay transcripción disponible:", fetchError);
            return { success: false, error: "No hay transcripción para analizar" };
        }
        
        fullText = transcription.full_text;
        console.log(`🧠 [DeepSeek] Transcripción encontrada: ${fullText.length} caracteres`);
    }
    
    // 3. Construir el prompt para Gemini - EXTRACCIÓN COGNITIVA PROFUNDA
    const systemPrompt = `Eres un analista cognitivo experto en epistemología y sistemas complejos.
Tu tarea es extraer TODOS los elementos cognitivos profundos de transcripciones.

INSTRUCCIONES DETALLADAS:
1. SEMILLAS FRACTALES: conceptos abstractos que encapsulan ideas complejas
2. DISCIPLINAS: áreas del conocimiento mencionadas o implícitas
3. PENSADORES: personas referenciadas con información biográfica
4. TEORÍAS: paradigmas o marcos teóricos mencionados
5. CORRIENTES DE PENSAMIENTO: movimientos intelectuales
6. CITAS CÉLEBRES: frases memorables o conceptos clave textuales
7. IMAGE PROMPTS: 3 prompts visuales distintos que representen la esencia del contenido
8. ANALOGÍAS DE CULTURA POP: 3 analogías lúdicas pero coherentes para humildad epistémica

Para cada PENSADOR incluye:
- Su disciplina principal
- Era temporal (ej: "siglo XX", "contemporáneo")
- Mini biografía de 1 frase
- Contribuciones clave (3-5 puntos)
- Un prompt de imagen para crear su avatar

Para los IMAGE PROMPTS del artefacto, crea 3 variantes distintas:
1. Estilo conceptual/abstracto (geometría, fractales, símbolos)
2. Estilo figurativo/narrativo (escena, personajes, situación)
3. Estilo artístico/estético (pintura, ilustración, arte digital)

Cada prompt debe ser detallado (50-100 palabras), en inglés, y optimizado para Seedream 4K.

Para las ANALOGÍAS DE CULTURA POP, crea 3 referencias CREATIVAS y SORPRENDENTES:
- EVITA lo obvio: nada de Matrix, Inception, Black Mirror (demasiado usados)
- Busca referencias inesperadas: anime oscuro, videojuegos indie, memes de nicho, música experimental, cómics underground
- Mezcla épocas: un clásico de los 80s + algo viral de TikTok + una referencia cult
- Sé específico: no "Star Wars", sino "la escena donde Yoda levanta la X-Wing del pantano"
- Humor inteligente permitido: un buen meme puede ser más revelador que una película seria
- La conexión debe ser ingeniosa, no literal: busca paralelismos creativos, no comparaciones directas
- Ejemplos de buenas referencias: "El bucle temporal de Groundhog Day pero versión Dark Souls", "La paradoja del gato de Schrödinger explicada con Among Us", "El jardín de senderos que se bifurcan de Borges meets Choose Your Own Adventure"

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    const userPrompt = `Analiza este contenido y extrae TODOS los elementos cognitivos:

---CONTENIDO---
${fullText.slice(0, 30000)} 
---FIN---

Responde con este formato JSON exacto:
{
  "fractal_seeds": [
    {"content": "nombre del concepto", "context": "frase donde aparece", "relevance": 0.9, "category": "concepto|metafora|principio|patron|cita"}
  ],
  "disciplines": ["filosofía", "neurociencia", "ética de la IA", ...],
  "thinkers": [
    {
      "name": "Nombre Completo",
      "discipline": "disciplina principal",
      "era": "siglo XX / contemporáneo / etc",
      "bio_snippet": "Breve descripción en una frase",
      "key_contributions": ["contribución 1", "contribución 2"],
      "avatar_prompt": "Portrait of [name], oil painting style, wise expression, warm lighting, 4K detailed"
    }
  ],
  "theories": ["teoría de sistemas", "constructivismo", ...],
  "thought_streams": ["posthumanismo", "fenomenología", ...],
  "quotes": [
    {"text": "La frase célebre o concepto textual", "author": "Autor", "context": "Contexto donde se menciona"}
  ],
  "image_prompts": [
    {
      "style": "conceptual",
      "prompt": "Abstract geometric visualization of interconnected neural pathways and fractal patterns, representing cognitive complexity, deep blue and gold palette, 4K ultra detailed, professional art"
    },
    {
      "style": "figurative", 
      "prompt": "A wise scholar in a vast library filled with floating books and glowing ideas, cinematic lighting, 4K photorealistic rendering"
    },
    {
      "style": "artistic",
      "prompt": "Oil painting masterpiece depicting the fusion of ancient wisdom and modern technology, renaissance style meets cyberpunk, rich textures, 4K gallery quality"
    }
  ],
  "pop_culture_analogies": [
    {
      "reference": "Evangelion (1995) - El dilema del erizo de Schopenhauer",
      "analogy": "Los Ángeles como representación de traumas que parecen incomprensibles hasta que Shinji aprende a sincronizarse: la empatía requiere vulnerabilidad",
      "connection": "Ilustra cómo el conocimiento profundo de sistemas complejos requiere 'sincronización' emocional, no solo análisis racional"
    },
    {
      "reference": "Outer Wilds (videojuego indie) - El bucle temporal de 22 minutos",
      "analogy": "Cada loop es idéntico pero tu conocimiento acumulado cambia todo: la misma información vista con nuevos ojos revela patrones ocultos",
      "connection": "Metáfora perfecta de la iteración cognitiva: no cambia el objeto de estudio, cambia el observador"
    },
    {
      "reference": "Meme 'This is fine' del perro en llamas (2016)",
      "analogy": "La normalización de lo absurdo: seguir tomando café mientras todo arde como estrategia de supervivencia cognitiva",
      "connection": "Representa la disonancia cognitiva y cómo los sistemas adaptativos a veces eligen la negación funcional sobre el colapso"
    }
  ],
  "summary": "Resumen de 2-3 oraciones del contenido principal"
}`;

    // 4. Llamar a DeepSeek API para extracción cognitiva
    console.log(`🧠 [DeepSeek] Enviando a API...`);
    
    try {
        const fullPrompt = systemPrompt + "\n\n" + userPrompt;
        const { result: textContent } = await callDeepSeekAPI("deepseek-chat", fullPrompt);
        
        if (!textContent) {
            console.error(`🧠 [DeepSeek] ❌ Respuesta vacía`);
            return { success: false, error: "Respuesta vacía de DeepSeek" };
        }
        
        console.log(`🧠 [DeepSeek] ✅ Respuesta recibida`);
        
        // 5. Parsear la respuesta JSON (limpiar si viene con backticks)
        let cleanJson = textContent.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        let extraction: CognitiveExtraction;
        try {
            extraction = JSON.parse(cleanJson);
        } catch {
            console.error(`🧠 [DeepSeek] ❌ Error parseando JSON:`, cleanJson.slice(0, 500));
            return { success: false, error: "Error parseando respuesta de DeepSeek" };
        }
        
        console.log(`🧠 [DeepSeek] Semillas encontradas: ${extraction.fractal_seeds?.length || 0}`);
        console.log(`🧠 [DeepSeek] Disciplinas: ${extraction.disciplines?.length || 0}`);
        console.log(`🧠 [DeepSeek] Pensadores: ${extraction.thinkers?.length || 0}`);
        console.log(`🧠 [DeepSeek] Citas: ${extraction.quotes?.length || 0}`);
        console.log(`🧠 [DeepSeek] Analogías cultura pop: ${extraction.pop_culture_analogies?.length || 0}`);
        
        // Función para normalizar capitalización de semillas
        const normalizeSeedContent = (content: string): string => {
            // Si ya está en Title Case, mantenerlo
            if (/^[A-Z][a-záéíóúñü]/.test(content)) {
                return content;
            }
            // Convertir a Title Case si está en minúsculas o ALL CAPS
            return content.toLowerCase()
                .split(' ')
                .map(word => {
                    // Palabras que deben mantenerse en minúsculas (preposiciones, artículos, etc.)
                    const lowerCaseWords = ['de', 'la', 'el', 'en', 'y', 'o', 'con', 'por', 'para', 'del'];
                    if (lowerCaseWords.includes(word.toLowerCase()) && content.split(' ').length > 1) {
                        return word.toLowerCase();
                    }
                    // Capitalizar primera letra
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join(' ');
        };

        // 6. Guardar semillas fractales
        if (extraction.fractal_seeds?.length > 0) {
            const seedsToInsert = extraction.fractal_seeds.map(seed => ({
                project_id: artifact.project_id,
                artifact_id: artifactId,
                content: normalizeSeedContent(seed.content),
                context: seed.context,
                properties: {
                    relevance: seed.relevance,
                    category: seed.category,
                    source: 'gemini_extraction'
                },
                tags: [seed.category, 'auto-generated']
            }));
            
            const { error: seedsError } = await supabase
                .from('cog_fractal_seeds')
                .insert(seedsToInsert);
            
            if (seedsError) {
                console.error(`🧠 [DeepSeek] ⚠️ Error guardando semillas:`, seedsError);
            } else {
                console.log(`🧠 [DeepSeek] ✅ ${seedsToInsert.length} semillas guardadas`);
            }
        }
        
        // 7. Guardar citas como semillas especiales
        if (extraction.quotes?.length > 0) {
            const quotesToInsert = extraction.quotes.map(quote => ({
                project_id: artifact.project_id,
                artifact_id: artifactId,
                content: normalizeSeedContent(`"${quote.text}" — ${quote.author}`),
                context: quote.context,
                properties: {
                    type: 'quote',
                    author: quote.author,
                    source: 'gemini_extraction'
                },
                tags: ['cita', 'auto-generated']
            }));
            
            await supabase.from('cog_fractal_seeds').insert(quotesToInsert);
            console.log(`🧠 [DeepSeek] ✅ ${quotesToInsert.length} citas guardadas`);
        }
        
        // 8. Guardar disciplinas y asociar al artefacto
        if (extraction.disciplines?.length > 0) {
            for (const discipline of extraction.disciplines) {
                // Insertar disciplina si no existe
                const { data: existingDisc } = await supabase
                    .from('cog_disciplines')
                    .select('id')
                    .eq('name', discipline)
                    .eq('project_id', artifact.project_id)
                    .maybeSingle();
                
                let disciplineId = existingDisc?.id;
                
                if (!disciplineId) {
                    const { data: newDisc } = await supabase
                        .from('cog_disciplines')
                        .insert({ name: discipline, project_id: artifact.project_id })
                        .select('id')
                        .single();
                    disciplineId = newDisc?.id;
                }
                
                // Asociar al artefacto
                if (disciplineId) {
                    await supabase
                        .from('cog_artifact_disciplines')
                        .insert({ artifact_id: artifactId, discipline_id: disciplineId })
                        .select();
                }
            }
            console.log(`🧠 [DeepSeek] ✅ ${extraction.disciplines.length} disciplinas procesadas`);
        }
        
        // 9. Guardar pensadores en cog_references
        if (extraction.thinkers?.length > 0) {
            for (const thinker of extraction.thinkers) {
                // Buscar disciplina para asociar
                const { data: discData } = await supabase
                    .from('cog_disciplines')
                    .select('id')
                    .eq('name', thinker.discipline)
                    .eq('project_id', artifact.project_id)
                    .maybeSingle();
                
                // Insertar pensador si no existe
                const { data: existingRef } = await supabase
                    .from('cog_references')
                    .select('id')
                    .eq('name', thinker.name)
                    .eq('project_id', artifact.project_id)
                    .maybeSingle();
                
                let referenceId = existingRef?.id;
                
                if (!referenceId) {
                    const { data: newRef } = await supabase
                        .from('cog_references')
                        .insert({
                            project_id: artifact.project_id,
                            name: thinker.name,
                            is_thinker: true,
                            era: thinker.era,
                            bio_snippet: thinker.bio_snippet,
                            key_contributions: thinker.key_contributions,
                            primary_discipline_id: discData?.id || null
                        })
                        .select('id')
                        .single();
                    referenceId = newRef?.id;
                }
                
                // Asociar al artefacto con el prompt de avatar
                if (referenceId) {
                    await supabase
                        .from('cog_artifact_references')
                        .insert({ 
                            artifact_id: artifactId, 
                            reference_id: referenceId,
                            context_snippet: thinker.avatar_prompt // Guardamos el prompt aquí
                        })
                        .select();
                }
            }
            console.log(`🧠 [DeepSeek] ✅ ${extraction.thinkers.length} pensadores guardados`);
        }
        
        // 10. Guardar teorías
        if (extraction.theories?.length > 0) {
            for (const theory of extraction.theories) {
                const { data: existingTheory } = await supabase
                    .from('cog_theories')
                    .select('id')
                    .eq('name', theory)
                    .eq('project_id', artifact.project_id)
                    .maybeSingle();
                
                let theoryId = existingTheory?.id;
                
                if (!theoryId) {
                    const { data: newTheory } = await supabase
                        .from('cog_theories')
                        .insert({ name: theory, project_id: artifact.project_id })
                        .select('id')
                        .single();
                    theoryId = newTheory?.id;
                }
                
                if (theoryId) {
                    await supabase
                        .from('cog_artifact_theories')
                        .insert({ artifact_id: artifactId, theory_id: theoryId })
                        .select();
                }
            }
            console.log(`🧠 [DeepSeek] ✅ ${extraction.theories.length} teorías guardadas`);
        }
        
        // 11. Guardar corrientes de pensamiento
        if (extraction.thought_streams?.length > 0) {
            for (const stream of extraction.thought_streams) {
                const { data: existingStream } = await supabase
                    .from('cog_thought_streams')
                    .select('id')
                    .eq('name', stream)
                    .eq('project_id', artifact.project_id)
                    .maybeSingle();
                
                let streamId = existingStream?.id;
                
                if (!streamId) {
                    const { data: newStream } = await supabase
                        .from('cog_thought_streams')
                        .insert({ name: stream, project_id: artifact.project_id })
                        .select('id')
                        .single();
                    streamId = newStream?.id;
                }
                
                if (streamId) {
                    await supabase
                        .from('cog_artifact_streams')
                        .insert({ artifact_id: artifactId, stream_id: streamId })
                        .select();
                }
            }
            console.log(`🧠 [DeepSeek] ✅ ${extraction.thought_streams.length} corrientes guardadas`);
        }
        
        // 12. Guardar los 3 prompts de imagen para el artefacto
        const imagePrompts = extraction.image_prompts || [];
        if (imagePrompts.length > 0) {
            console.log(`🧠 [DeepSeek] ✅ ${imagePrompts.length} prompts de imagen generados`);
        }
        
        // 13. Actualizar artefacto con resumen y prompts (usando JSON serializable)
        const thinkerNames = extraction.thinkers?.map(t => t.name) || [];
        const popCultureAnalogies = extraction.pop_culture_analogies || [];
        await supabase
            .from('cog_artifacts')
            .update({
                status: 'completed',
                source_metadata: {
                    cognitive_summary: extraction.summary,
                    thinkers: thinkerNames,
                    theories: extraction.theories || [],
                    thought_streams: extraction.thought_streams || [],
                    quotes_count: extraction.quotes?.length || 0,
                    image_prompts: imagePrompts.map(p => ({ style: p.style, prompt: p.prompt })),
                    pop_culture_analogies: popCultureAnalogies.map(a => ({ reference: a.reference, analogy: a.analogy, connection: a.connection })),
                    extraction_date: new Date().toISOString()
                }
            })
            .eq('id', artifactId);
        
        revalidatePath(`/cognetica/${artifactId}`);
        revalidatePath('/cognetica');
        
        console.log(`🧠 [DeepSeek] ✅ Extracción cognitiva COMPLETA`);
        
        return { 
            success: true, 
            data: {
                seeds_count: extraction.fractal_seeds?.length || 0,
                disciplines_count: extraction.disciplines?.length || 0,
                thinkers_count: extraction.thinkers?.length || 0,
                theories_count: extraction.theories?.length || 0,
                quotes_count: extraction.quotes?.length || 0,
                image_prompts: imagePrompts,
                pop_culture_analogies: popCultureAnalogies,
                summary: extraction.summary
            }
        };
        
    } catch (error) {
        console.error(`🧠 [DeepSeek] ❌ Error:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Obtener semillas fractales de un artefacto
 */
export async function getArtifactSeeds(artifactId: string) {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
        .from('cog_fractal_seeds')
        .select('id, content, context, properties, tags, created_at')
        .eq('artifact_id', artifactId)
        .order('created_at', { ascending: false });
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    return { success: true, data };
}
