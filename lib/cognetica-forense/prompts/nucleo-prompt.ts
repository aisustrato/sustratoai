/**
 * Prompt del **Núcleo** (tarjeta de presentación irreductible).
 *
 * Fuente canónica: `docs/cognetica/prompts_metabolizacion_v1.md §3`.
 * Modelo: `deepseek-chat`, temperature 0.3, max_tokens 800 (API), formato `json_object`.
 *
 * **Hard cap semántico**: 600 tokens del output final — enforzado también en DB
 * vía `CHECK (tokens_count <= 600)` (spec v0.3 §4.3).
 *
 * **Input**: sólo el Destilado renderizado (compresión de compresión).
 */

/** System prompt — pegado tal cual desde `prompts_metabolizacion_v1.md §3`. */
export const NUCLEO_SYSTEM_PROMPT = `Tu tarea es producir el Núcleo de un artefacto: la forma más pequeña en que el artefacto sigue siendo reconocible como sí mismo.

El Núcleo es compresión brutal. Tarjeta de presentación irreductible. Solo hueso, sin carne. Entre 400 y 500 tokens de contenido final. Hard cap: 600 tokens.

Tu input NO es el artefacto original. Tu input es el Destilado ya generado del artefacto. Tu trabajo es comprimir el Destilado a su mínima expresión operativa.

Criterio de compresión: si el Núcleo se pudiera recortar más sin perder identidad del artefacto, aún no está en su forma mínima. Si el Núcleo se quedara corto y un lector no pudiera reconocer el artefacto, está demasiado comprimido. El punto justo es donde el artefacto sigue siendo reconocible con la menor cantidad de palabras posible.

Responde exclusivamente en JSON válido con este schema:

{
  "tesis": "Una oración. Puede ser la misma tesis del Destilado o una reformulación más afilada. Tú decides cuál representa mejor el núcleo.",

  "movimientos_esenciales": [
    {
      "orden": 1,
      "texto": "Movimiento argumental en una oración. Elige los 3 movimientos del Destilado más estructurales — los que, si se quitan, el argumento se cae."
    },
    {
      "orden": 2,
      "texto": "..."
    },
    {
      "orden": 3,
      "texto": "..."
    }
  ],

  "tension_irreductible": "La tensión más irreductible del artefacto, en una oración. Si el Destilado tiene varias tensiones, eliges la que más define al artefacto.",

  "cita_nucleo": {
    "texto": "La misma cita núcleo del Destilado, literal, sin modificar.",
    "ubicacion": "La misma ubicación del Destilado.",
    "autor": "El mismo autor del Destilado o null."
  }
}

Reglas estrictas:

- Exactamente 3 movimientos. Ni 2 ni 4. Selección rigurosa.
- La tensión es UNA sola.
- La cita núcleo se copia del Destilado sin modificar.
- Sin texto fuera del JSON.
- Sin comentarios en el JSON.
- Si el JSON generado excede 600 tokens, recomprimir formulaciones hasta cumplir.

El Núcleo es el formato que un nodo externo recibe cuando necesita entrar al artefacto en 30 segundos. Piensa en eso cuando escribas: ¿en 30 segundos este Núcleo le da al lector suficiente para saber de qué va este artefacto y si le interesa profundizar?`;

/** Hard cap semántico de tokens del Núcleo output (spec v0.3 §4.3). */
export const NUCLEO_HARD_CAP = 600;

export interface ConstruirPromptNucleoInput {
	/** Destilado renderizado en Markdown (tesis + movimientos + tensiones + cita + insumos). */
	destiladoRenderizado: string;
}

/**
 * User prompt (spec §3 — "construido programáticamente").
 */
export function construirPromptNucleo(
	input: ConstruirPromptNucleoInput,
): string {
	return `Destilado del artefacto (fuente a comprimir):

${input.destiladoRenderizado}

Produce el Núcleo en formato JSON según schema especificado.`;
}
