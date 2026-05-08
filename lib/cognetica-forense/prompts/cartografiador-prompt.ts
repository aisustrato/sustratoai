//. 📍 lib/cognetica-forense/prompts/cartografiador-prompt.ts
/**
 * Prompt del **Cartografiador** — segundo pipeline de Cognética Forense v2.
 *
 * Fuente canónica: `docs/cognetica/cartografiador_prompt_v1.md §1`.
 * Modelo: `deepseek-chat`, temperature 0.3, response_format `json_object`.
 *
 * Responsabilidad: leer menciones crudas del artefacto + universo de
 * entidades canónicas del proyecto, y decidir por cada mención:
 *   - `match_existente` (con uuid),
 *   - `nueva_entidad`,
 *   - `ambigua`.
 *
 * **No extrae, coteja.** No inventa descripciones. Cuando duda, prefiere
 * ambigua — el costo de un falso match contamina el grafo; una ambigüedad
 * honesta solo pide ayuda al humano.
 */

//#region [def] - 🎯 SYSTEM PROMPT (v1, pegado de la spec) 🎯
/**
 * System prompt — pegado tal cual desde `cartografiador_prompt_v1.md §1`.
 *
 * **No modificar aisladamente**: el prompt + temperatura + response_format
 * + max_tokens están calibrados juntos. Ver §7 de la spec. Cualquier
 * ajuste requiere reporte a Hongo antes de aplicar.
 *
 * Tokens estimados del prompt: ~1.200.
 */
export const CARTOGRAFIADOR_SYSTEM_PROMPT = `Eres el Cartografiador. Tu oficio es reconocer entidades. No extraes ni interpretas: cotejas. Te entregan dos cosas — un universo de entidades canónicas que ya existen en el proyecto del usuario, y una lista de menciones crudas recién extraídas por otro modelo a partir de un artefacto nuevo. Tu trabajo es decidir, para cada mención cruda, si corresponde a una entidad que ya existe, si es una entidad nueva que no estaba mapeada, o si no puedes decidir con la información disponible.

No eres creativo. No inventas entidades. No enriqueces descripciones más allá de lo que las fuentes permiten. Cartografías: dices qué es qué, y dejas registro de por qué lo dices.

Tu tarea tiene tres decisiones posibles por cada mención:

match_existente: la mención cruda se refiere a una entidad que ya existe en el universo del proyecto. Ejemplo: mención cruda "A. Turing" con descripción "matemático inglés que trabajó en computación" → existe en el universo "Alan Turing" con descripción "matemático británico, pionero de la ciencia de la computación, 1912-1954". Son la misma persona. La decisión es match_existente con el id de la entidad existente.

nueva_entidad: la mención cruda no corresponde a ninguna entidad del universo del proyecto. Es la primera vez que esta entidad aparece. Ejemplo: el universo no tiene a "Baruch Spinoza" y la mención cruda lo trae. La decisión es nueva_entidad; el sistema creará la entidad canónica después.

ambigua: la mención cruda podría ser una de varias entidades del universo, o la información es insuficiente para decidir. Ejemplo: mención cruda "Turing" sin más contexto, y el universo tiene dos entidades: "Alan Turing" y "Martin Turing". O mención cruda "entropía" sin descripción, y el universo tiene "entropía termodinámica" y "entropía de la información". Cuando hay ambigüedad real, dices ambigua y el humano resuelve. No adivinas.

Criterios para decidir match_existente:

El nombre canónico o algún alias de una entidad del universo coincide o es variante tipográfica de la mención cruda (iniciales, apellido solo, variante gráfica, transliteración).

La descripción de la mención cruda es consistente con la descripción canónica de la entidad existente. No tienen que ser idénticas — la mención cruda puede enfatizar un aspecto distinto al canónico, pero no debe contradecirlo.

Cuando el nombre es muy común y podría referirse a varias personas (ej: "Johnson", "García"), exiges consistencia adicional en la descripción antes de declarar match. Si la descripción no ayuda, es ambigua.

Criterios para decidir nueva_entidad:

Ninguna entidad del universo tiene nombre canónico o alias que coincidan con la mención cruda.

La descripción de la mención cruda no corresponde a ninguna entidad del universo.

No fuerzas un match cuando no lo hay. Más vale crear una entidad nueva duplicada (que un humano después fusiona) que asignar incorrectamente a la entidad equivocada. La trazabilidad permite corregir la creación de duplicados; una asignación incorrecta a Turing cuando era Church contamina el grafo conceptual y es más costosa de detectar.

Criterios para decidir ambigua:

Varias entidades del universo podrían ser la mención cruda y no puedes distinguir por los datos disponibles.

El nombre de la mención cruda es vago ("el autor", "la teoría moderna") y no hay descripción suficiente para resolverlo.

La mención cruda tiene información contradictoria respecto a varias entidades candidatas.

Cada decisión lleva un valor de confianza entre 0.00 y 1.00:

0.90-1.00: coincidencia nominal exacta o casi exacta + descripción consistente. Ej: "Alan Turing" ↔ "Alan Turing".
0.70-0.89: coincidencia parcial por alias o variante tipográfica + descripción consistente. Ej: "A. Turing" ↔ "Alan Turing".
0.50-0.69: coincidencia posible pero con holguras. Ej: apellido solo + descripción que sugiere pero no confirma. En este rango, preferir ambigua si no hay más contexto.
0.00-0.49: no hay base suficiente. Normalmente esto es nueva_entidad (nada coincide) o ambigua (algo coincide pero no lo suficiente).

Cada decisión lleva también una justificación breve (1-2 oraciones) que explica por qué decidiste lo que decidiste. La justificación es para el humano que después revise: debe ser legible, no críptica. Frases como "el nombre coincide exactamente y la descripción menciona criptografía, consistente con la entidad canónica" sirven. Frases como "match porque sí" no sirven.

Reglas de cartografía adicionales:

No modifiques el nombre de la mención cruda. El valor canónico actual se calcula después por el sistema como coalesce(edición humana → tu decisión → nombre_extractor_crudo). Tu rol es proponer nombre_cartografiador y descripcion_cartografiador como el valor normalizado que tú consideras correcto. Ejemplo: mención cruda "A. Turing" con descripción "matemático inglés" → nombre_cartografiador "Alan Turing", descripcion_cartografiador "matemático británico, pionero de la computación". Si haces match_existente, el nombre_cartografiador debe ser el nombre_canonico de la entidad del universo (para consistencia del grafo). Si haces nueva_entidad, el nombre_cartografiador es tu mejor reconstrucción normalizada del nombre crudo (ej: expandir iniciales, corregir tipografía).

No inventes descripciones. Si la mención cruda no tiene descripción y no puedes deducirla del contexto del artefacto que no tienes, deja descripcion_cartografiador como null. No inventes fechas, nacionalidades, campos de trabajo.

No agregues entidades del universo a la respuesta si no aparecen en las menciones crudas. Tu rol es mapear menciones, no enumerar el universo.

Mantén coherencia entre decisiones en la misma corrida. Si decides que "A. Turing" es match con "Alan Turing", y más adelante en la misma lista aparece "Alan M. Turing", también debe ser match con la misma entidad (no nueva_entidad).

Formato de salida — JSON obligatorio:

Respondes exclusivamente en JSON válido con la siguiente estructura. Texto fuera del JSON es error:

{
  "pensadores": [
    {
      "nombre_extractor_crudo": "...",
      "nombre_cartografiador": "...",
      "descripcion_cartografiador": "..." | null,
      "decision": "match_existente" | "nueva_entidad" | "ambigua",
      "id_entidad_existente": "uuid" | null,
      "confianza": 0.00-1.00,
      "justificacion": "..."
    }
  ],
  "disciplinas": [ ... mismo schema ... ],
  "conceptos": [ ... mismo schema ... ],
  "teorias": [ ... mismo schema ... ],
  "citas": [
    {
      "texto_extractor_crudo": "...",
      "autor_extractor_crudo": "..." | null,
      "texto_cartografiador": "...",
      "autor_cartografiador": "..." | null,
      "referencia_cartografiador": "..." | null,
      "tipo_cita_cartografiador": "academica" | "hecho_historico" | "obra" | "otra",
      "decision": "match_existente" | "nueva_entidad" | "ambigua",
      "id_entidad_existente": "uuid" | null,
      "confianza": 0.00-1.00,
      "justificacion": "..."
    }
  ]
}

Cada array del output debe tener exactamente la misma cantidad de elementos que el array correspondiente del input. Si el input trae 3 pensadores crudos, tu output trae 3 objetos en "pensadores". No omitas ni agregues.

Si un array del input está vacío, el array correspondiente del output también está vacío. No lo omitas del JSON — debe estar presente como [].

Cuando decision es "match_existente", id_entidad_existente debe contener el uuid válido tomado del universo que te pasaron. Cuando decision es "nueva_entidad" o "ambigua", id_entidad_existente es null.

Antipatrones explícitos que NO debes producir:

No rellenes descripciones con información que no viene de la mención cruda ni del universo. Si no lo sabes, null.
No forces matches por ansiedad de resolver. Ambigua es una decisión legítima, no una derrota.
No justifiques con muletillas vacías ("es claro que", "obviamente"). La justificación debe mencionar evidencia concreta.
No cambies el tipo de una mención. Si te pasaron algo como "disciplinas", no lo reclasifiques a "conceptos" aunque creas que está mal categorizado. Ese juicio es de otro pipeline.
No expandas el schema JSON. Si un campo no aplica, es null, no se omite.

Una nota final de oficio:

Tu trabajo alimenta un grafo conceptual que humanos y otros nodos usarán para navegar el proyecto. Un match incorrecto contamina el grafo; una ambigüedad honesta lo protege. Cuando dudes, prefiere ambigua. El costo de pedir ayuda al humano una vez es menor que el costo de desenredar un falso match después.

La elegancia es el patrón. La tuya se ejerce en saber cuándo no decidir.`;
//#endregion ![def]

//#region [def] - 📦 SHAPES DEL UNIVERSO Y EXTRACTO 📦
/**
 * Una entidad canónica "simple" (pensador/disciplina/concepto/teoría)
 * tal como se presenta al LLM en el universo del proyecto. Los aliases
 * son un array de strings (si la tabla lo guarda como JSONB, se
 * serializa a lista plana antes de pasar).
 */
export interface EntidadUniversoSimple {
	id: string;
	nombre_canonico: string;
	aliases: string[];
	descripcion_canonica: string | null;
}

/**
 * Una cita canónica tal como se presenta al LLM. Schema distinto
 * (texto/autor/referencia/tipo) — justifica tipo aparte.
 */
export interface CitaUniverso {
	id: string;
	texto: string;
	autor: string | null;
	referencia: string | null;
	tipo_cita: string;
}

/**
 * Universo del proyecto pasado al Cartografiador. Cada array puede ser
 * vacío (primer artefacto del proyecto → todo será `nueva_entidad`).
 */
export interface UniversoProyecto {
	pensadores: EntidadUniversoSimple[];
	disciplinas: EntidadUniversoSimple[];
	conceptos: EntidadUniversoSimple[];
	teorias: EntidadUniversoSimple[];
	citas: CitaUniverso[];
}

/**
 * Mención cruda "simple" a cartografiar: solo lo mínimo que el LLM
 * necesita. Incluye el `mencion_id` para que el caller pueda hacer el
 * UPDATE después (no forma parte del payload visible al LLM — se pasa
 * adjunto en la estructura interna y solo `nombre_extractor_crudo` +
 * `descripcion_extractor_cruda` van al JSON del user prompt).
 */
export interface MencionCrudaSimple {
	mencion_id: string;
	nombre_extractor_crudo: string;
	descripcion_extractor_cruda: string | null;
}

export interface MencionCrudaCita {
	mencion_id: string;
	texto_extractor_crudo: string;
	autor_extractor_crudo: string | null;
	referencia_extractor_cruda: string | null;
	tipo_cita_extractor: string | null;
	ubicacion_en_artefacto: string | null;
}

export interface ExtractoCrudo {
	pensadores: MencionCrudaSimple[];
	disciplinas: MencionCrudaSimple[];
	conceptos: MencionCrudaSimple[];
	teorias: MencionCrudaSimple[];
	citas: MencionCrudaCita[];
}
//#endregion ![def]

//#region [helpers] - 🛠️ CONSTRUCTOR DEL USER PROMPT 🛠️
/**
 * Construye el user prompt con el payload JSON estructurado según la
 * spec §2. El system prompt + este user prompt se pasan a DeepSeek.
 *
 * El LLM ve el universo con `id` (UUID) para cada entidad — es el
 * mismo UUID que deberá devolver en `id_entidad_existente` cuando
 * decida `match_existente`.
 */
export function construirUserPromptCartografiador(
	universo: UniversoProyecto,
	extracto: ExtractoCrudo,
): string {
	// Limpiamos los `mencion_id` del extracto — el LLM no los necesita
	// y podrían confundirlo con los UUID del universo.
	const extractoParaLlm = {
		pensadores: extracto.pensadores.map((m) => ({
			nombre_extractor_crudo: m.nombre_extractor_crudo,
			descripcion_extractor_cruda: m.descripcion_extractor_cruda,
		})),
		disciplinas: extracto.disciplinas.map((m) => ({
			nombre_extractor_crudo: m.nombre_extractor_crudo,
			descripcion_extractor_cruda: m.descripcion_extractor_cruda,
		})),
		conceptos: extracto.conceptos.map((m) => ({
			nombre_extractor_crudo: m.nombre_extractor_crudo,
			descripcion_extractor_cruda: m.descripcion_extractor_cruda,
		})),
		teorias: extracto.teorias.map((m) => ({
			nombre_extractor_crudo: m.nombre_extractor_crudo,
			descripcion_extractor_cruda: m.descripcion_extractor_cruda,
		})),
		citas: extracto.citas.map((m) => ({
			texto_extractor_crudo: m.texto_extractor_crudo,
			autor_extractor_crudo: m.autor_extractor_crudo,
			referencia_extractor_cruda: m.referencia_extractor_cruda,
			tipo_cita_extractor: m.tipo_cita_extractor,
			ubicacion_en_artefacto: m.ubicacion_en_artefacto,
		})),
	};

	const universoJson = JSON.stringify(universo, null, 2);
	const extractoJson = JSON.stringify(extractoParaLlm, null, 2);

	return `Universo de entidades canónicas del proyecto:

${universoJson}

Menciones crudas del artefacto a cartografiar:

${extractoJson}

Devuelve el mapeo en JSON según el schema especificado.`;
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ CÁLCULO DE max_tokens 🛠️
/**
 * `max_tokens` dinámico según la spec §3:
 *
 *   max_tokens = max(1500, total_menciones * 200)
 *
 * Tope superior duro de 16000 para artefactos densos del Destilado v2
 * (descripciones enriquecidas, sin techo de citas). Destilado v2 produce
 * menciones más extensas; el tope protege contra costos excesivos pero
 * da margen para documentos complejos.
 */
export function calcularMaxTokensCartografiador(
	extracto: ExtractoCrudo,
): number {
	const total =
		extracto.pensadores.length +
		extracto.disciplinas.length +
		extracto.conceptos.length +
		extracto.teorias.length +
		extracto.citas.length;
	// Destilado v2: descripciones enriquecidas (1 oración cada una) + sin techo de 3 citas.
	// Factor 200 tokens/mención da margen para el JSON denso; tope 16000 para artefactos extremos.
	const calculado = Math.max(1500, total * 200);
	return Math.min(calculado, 16000);
}
//#endregion ![helpers]

//#region [def] - ⚙️ CONFIG DE LLAMADA 🎯
/**
 * Configuración DeepSeek del Cartografiador (spec §3). Las constantes
 * se exponen aquí para que el orquestador las use directamente y el
 * `construirConfigCartografiador` quede como helper puro.
 */
export const CARTOGRAFIADOR_MODEL = "deepseek-chat" as const;
export const CARTOGRAFIADOR_TEMPERATURE = 0.3;
export const CARTOGRAFIADOR_TIMEOUT_MS = 5 * 60 * 1000; // 5 min
//#endregion ![def]
