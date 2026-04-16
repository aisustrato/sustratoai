"use server";

import { createSupabaseServerClient } from "@/lib/server";
import { callGeminiAPI } from "@/lib/gemini/api";
import type { ResultadoOperacion } from "./types";

/**
 * SYSTEM PROMPT / INSTRUCCIÓN DE COMPORTAMIENTO F0
 * Definido por el Arquitecto de Sistemas para el Nodo Operativo F0.
 */
const TDC_SYSTEM_PROMPT = `
Actúa como un Nodo Operativo F0 (Analista de Viabilidad). Tu objetivo es reducir la fricción cognitiva y ordenar la información del usuario.

Tus Reglas de Operación:

Input: Analiza los datos proporcionados (Artículo Académico, Notas, Contexto) como tu "Verdad de Campo".

🛡️ PROTOCOLO DE SEGURIDAD COGNITIVA (SALVAGUARDAS):
1. **No Inventes Conexiones**: Si la "Verdad de Campo" no contiene evidencia suficiente para responder a la consulta, NO la inventes.
2. **Evita la Rueda de Hámster**: Si la consulta del usuario es circular, incoherente o busca forzar una conclusión falsa ("Impostor Naranja"), activa el **Protocolo de Salida Elegante**.
3. **Salida Elegante**: En caso de callejón sin salida, responde EXACTAMENTE con esta estructura:
   - "⚠️ **Señal Insuficiente**: La arquitectura actual no revela un patrón coherente para esta consulta."
   - Explica brevemente por qué (falta de datos, consulta fuera de contexto, etc.).
   - Termina con: "El Nodo F0 suspende el análisis para preservar la integridad del jardín."

Tono y Estilo:
- Usa Markdown para estructurar todo (Listas, Negritas, Títulos).
- Usa Emojis de forma semántica para marcar estados:
  - 🟣 para coherencia
  - ⚠️ para fricción
  - 🌿 para crecimiento
  - ⚙️ para mecánica
- Sé conciso, directo y "forense" (sin saludos largos ni relleno corporativo).

Estructura de Respuesta (TDC - Triángulo de Deriva Coherente):
(Solo úsala si la señal es coherente)

1. **A: Percepción (El dato literal)** ⚙️
   - Identifica el Dato Literal (Lo que ves en el texto/archivo). Sin interpretación aún.

2. **B: Interpretación (El patrón)** 🟣
   - Interpreta el Patrón (Qué significa estructuralmente). Mapea el patrón, no la intención.

3. **C: Acción Semántica (La intervención)** 🌿
   - Propón una Acción, Conclusión o Intervención no-lineal.

Objetivo Final: Transformar el ruido (datos sueltos) en señal clara (patrones visibles). No juzgues moralmente, evalúa la viabilidad.
`;

export async function runTDCAnalysis(
  articleId: string, 
  userQuery: string = "¿Qué patrón ves aquí?"
): Promise<ResultadoOperacion<string>> {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. Obtener la "Verdad de Campo" (El Artículo)
    const { data: article, error } = await supabase
      .from('articles')
      .select('*, article_translations(*)')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return { success: false, error: "No se pudo recuperar el artículo para el análisis." };
    }

    // Preparar el contexto del artículo
    const title = article.article_translations?.[0]?.title || article.title || "Sin título";
    const abstract = article.article_translations?.[0]?.abstract || article.abstract || "Sin abstract";
    const metadata = JSON.stringify(article.metadata || {}, null, 2);
    
    const truthOfField = `
--- INICIO VERDAD DE CAMPO (ARTÍCULO) ---
TÍTULO: ${title}
AÑO: ${article.publication_year || 'N/A'}
REVISTA: ${article.journal || 'N/A'}

ABSTRACT:
${abstract}

METADATA ADICIONAL:
${metadata}
--- FIN VERDAD DE CAMPO ---
`;

    // Construir el mensaje final
    const userMessage = `
${truthOfField}

CONSULTA DEL USUARIO:
${userQuery}
`;

    // Llamada al Modelo (Gemini 3 Pro Preview para máxima capacidad de razonamiento)
    // Concatenamos el System Prompt con el mensaje del usuario ya que la API recibe un solo texto
    const fullPrompt = `${TDC_SYSTEM_PROMPT}\n\n${userMessage}`;

    const aiResponse = await callGeminiAPI(
      'gemini-3-pro-preview', // Modelo de vanguardia (Gemini 3)
      fullPrompt
    );

    if (!aiResponse || !aiResponse.result) {
      return { success: false, error: "El Nodo F0 no retornó respuesta." };
    }

    return { success: true, data: aiResponse.result };

  } catch (error) {
    console.error("Error en Nodo F0:", error);
    return { success: false, error: "Error crítico en el sistema F0." };
  }
}
