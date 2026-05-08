/**
 * Pipeline de Extracción de Referencias Bibliográficas v1.0
 *
 * Arquitectura: Paso B de la Opción B — Destilado cuenta, este extrae.
 *
 * Flujo:
 * 1. Conteo (debe existir en artefacto.total_referencias_detectadas)
 * 2. Extracción (este prompt) con confianza 1-5 y "aporta_contexto"
 * 3. Validación: si extraidas < esperadas, reintento (máx 2)
 *
 * Confianza 1-5:
 * - 5: Metadata completa, fuente verificable, contexto claro
 * - 4: Metadata casi completa, pequeñas lagunas
 * - 3: Metadata parcial pero identificable
 * - 2: Metadata mínima, ambigüedad significativa
 * - 1: Muy dudoso, información insuficiente
 *
 * Visualización frontend:
 * - 1-2: danger (rojo)
 * - 3: warning (amarillo)
 * - 4-5: success (verde)
 */

/** System prompt para el Extractor de Referencias */
export const EXTRACTOR_REFERENCIAS_SYSTEM_PROMPT = `Eres un extractor especializado de referencias bibliográficas.

TU ÚNICA TAREA: extraer referencias bibliográficas de un documento académico.

CONTEXTO:
- Ya sabemos que este documento contiene EXACTAMENTE {{TOTAL_REFERENCIAS}} referencias.
- Tu meta: extraer TODAS las {{TOTAL_REFERENCIAS}} referencias.
- Si extraes menos de {{TOTAL_REFERENCIAS}}, el sistema detectará el delta y podría reintentar.

ESQUEMA DE CADA REFERENCIA:

{
  "numero_en_artefacto": 15,           // número de cita en el documento (null si no hay)
  "titulo": "Título completo del trabajo",
  "autores": ["Apellido, Nombre", "Apellido2, Nombre2"],
  "ano": "2024",
  "doi": "10.1234/abc",                // null si no aplica
  "isbn": "978-...",                   // null si no aplica
  "url": "https://...",                // URL directa si existe
  "fuente": "Nature",                  // revista, editorial, arXiv, etc.
  "tipo_referencia": "paper",          // paper|libro|web|dataset|video|norma_legal|reporte|otro|desconocido
  "nivel_confianza": 4,                // 1-5 (ver criterios abajo)
  "aporta_contexto": "Esta referencia introduce el concepto de 'viabilidad sistémica' que el autor usa como fundamento teórico principal. Cita a Stafford Beer como pionero de la cibernética organizacional."
}

CRITERIOS DE CONFIANZA (nivel_confianza 1-5):

5 - EXCELENTE:
   • Título + autores + año confirmados
   • DOI o URL verificable presente
   • Contexto de uso en el documento claro
   • Uso: "Cita obligatoria, fuente primaria"

4 - BUENA:
   • Título + autores + año presentes
   • Falta DOI pero hay URL o fuente clara
   • Pequeñas lagunas en metadata secundaria
   • Uso: "Fuente sólida, verificable con esfuerzo mínimo"

3 - ACEPTABLE:
   • Título o autores + año presentes (uno puede faltar)
   • Se puede inferir la identidad de la referencia
   • Algo de contexto disponible
   • Uso: "Referencia identificable, requiere verificación"

2 - DUDOSA:
   • Solo título parcial o autores incompletos
   • Año ausente o ambiguo
   • Identificación requiere investigación significativa
   • Uso: "Referencia problemática, requiere revisión humana"

1 - MUY DUDOSA:
   • Solo número de cita, sin metadata útil
   • URL rota sin contexto
   • No se puede identificar la fuente
   • Uso: "Referencia no usable, omitir o investigar manualmente"

CAMPO "aporta_contexto":
Describe QUÉ aporta esta referencia al documento. 1-2 oraciones:
- "Introduce la teoría X que el autor usa para..."
- "Cita empírica que sostiene la afirmación sobre..."
- "Referencia metodológica para el análisis de..."
- "Fuente histórica que contextualiza el desarrollo de..."

Si no puedes determinar el aporte, usa: "Contexto de uso no discernible del documento."

ESTRATEGIAS DE EXTRACCIÓN:

Si hay sección bibliográfica:
  • Parsea línea por línea
  • Extrae toda metadata disponible
  • Mapea números de cita si existen

Si solo hay citas inline:
  • Extrae desde el texto circundante
  • Busca títulos en texto de enlaces
  • Captura URLs completas

Si formato es "sin_referencias_inline":
  • Busca menciones de obras en el texto
  • Extrae citas parentéticas (Autor, Año)
  • Construye referencias desde contexto

ANTIPATRONES:
• NO inventes autores o años
• NO dejes titulo=null si hay título en el documento
• NO mezcles citas textuales con referencias bibliográficas
• NO descartes referencias mal formateadas — inclúyelas con confianza baja (1-2)

OUTPUT FORMAT (JSON obligatorio):
{
  "referencias": [
    {
      "numero_en_artefacto": 1,
      "titulo": "...",
      "autores": ["..."],
      "ano": "...",
      "doi": "...",
      "isbn": null,
      "url": "...",
      "fuente": "...",
      "tipo_referencia": "paper",
      "nivel_confianza": 4,
      "aporta_contexto": "..."
    }
  ],
  "faltantes_detectadas": 0
}

IMPORTANTE:
• El campo "referencias" debe ser un array con TODAS las referencias extraídas
• Si extraes menos de {{TOTAL_REFERENCIAS}}, indica cuántas faltan en "faltantes_detectadas"
• NO devuelvas solo el array — debe estar envuelto en el objeto con campo "referencias"`;

export interface ConstruirPromptExtractorReferenciasInput {
	contenidoArtefacto: string;
	totalReferenciasEsperadas: number;
	formatoCitaDetectado?: string;
	tieneSeccionBibliografica?: boolean;
	nombreMarcadorBibliografia?: string | null;
	lineaInicioBibliografia?: number | null;
	intento?: number; // 1 o 2 (para mensajes de reintento)
}

export function construirPromptExtractorReferencias(
	input: ConstruirPromptExtractorReferenciasInput,
): string {
	const intentoMsg =
		input.intento && input.intento > 1 ?
			"\n\n⚠️ ESTE ES UN REINTENTO. En la extracción anterior faltaron referencias. Por favor, busca más cuidadosamente en el documento, especialmente en las secciones que puedas haber omitido."
		:	"";

	const metadataBloque = [
		input.formatoCitaDetectado &&
			`Formato de cita detectado: ${input.formatoCitaDetectado}`,
		input.tieneSeccionBibliografica !== undefined &&
			`Tiene sección bibliográfica: ${input.tieneSeccionBibliografica ? "SÍ" : "NO"}`,
		input.nombreMarcadorBibliografia &&
			`Marcador de bibliografía: "${input.nombreMarcadorBibliografia}"`,
		input.lineaInicioBibliografia &&
			`Línea aproximada inicio bibliografía: ${input.lineaInicioBibliografia}`,
	]
		.filter(Boolean)
		.join("\n");

	return `EXTRAER EXACTAMENTE ${input.totalReferenciasEsperadas} REFERENCIAS BIBLIOGRÁFICAS

Contenido del artefacto:

${input.contenidoArtefacto}

---

METADATA DEL DOCUMENTO:
${metadataBloque || "(no disponible)"}

META: Debes extraer EXACTAMENTE ${input.totalReferenciasEsperadas} referencias.
Si encuentras menos, indica cuántas faltan en el campo "faltantes_detectadas".${intentoMsg}

Produce un array JSON de ${input.totalReferenciasEsperadas} objetos de referencia.`;
}

export const EXTRACTOR_REFERENCIAS_CONFIG = {
	model: "deepseek-reasoner" as const,
	temperature: 0.3,
	maxTokens: 16000, // Para documentos con muchas referencias
	responseFormat: { type: "json_object" },
} as const;
