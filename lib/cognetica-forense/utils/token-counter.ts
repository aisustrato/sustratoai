/**
 * Estimación de tokens por tipo de artefacto.
 *
 * Usada para:
 *  - Dimensionar el techo/piso de la crónica (20–30% del original, piso 800,
 *    techo 8.000) según el requerimiento §1.1.
 *  - Validar el hard cap de 1.500 tokens del destilado antes de regenerar.
 *  - Registrar `tokens_input` / `tokens_output` de cada llamada al LLM.
 *
 * **Estimación, no cómputo exacto.** Para el cómputo final del costo se usa
 * la respuesta real del provider (DeepSeek/Replicate). Esta función sirve
 * para planificación y validaciones rápidas sin llamar al tokenizador.
 *
 * Heurística: ~4 caracteres por token en español (similar a tiktoken cl100k
 * para castellano con acentos). Ajustar cuando se mida empíricamente.
 */

const AVG_CHARS_PER_TOKEN_ES = 4;

/**
 * Estima el número de tokens de un texto plano.
 * Para estructuras JSON/YAML, serializar primero y pasar el string.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN_ES);
}

/**
 * Calcula el piso y techo de la crónica según el token count del original.
 *  - Piso: max(800, 20% original)
 *  - Techo: min(8000, 30% original)
 */
export function cronicaBounds(originalTokens: number): {
  floor: number;
  ceiling: number;
} {
  const floor = Math.max(800, Math.floor(originalTokens * 0.2));
  const ceiling = Math.min(8000, Math.ceil(originalTokens * 0.3));
  return { floor, ceiling };
}

/** Hard cap del destilado (tokens). Ver §1.1 del requerimiento. */
export const DESTILADO_HARD_CAP = 1500;
