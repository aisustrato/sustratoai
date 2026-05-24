//. 📍 lib/cognetica-forense/pipelines.ts
/**
 * Pipelines declarativos de metabolización por tipo de artefacto.
 *
 * Cada tipo de artefacto recorre una secuencia ordenada de **steps**. La
 * secuencia varía: markdown va directo a los 4 formatos; PDF informe pasa
 * antes por Marker; PDF slides pasa por extracción de imágenes + Marker
 * por página; audio pasa por WhisperX. Esta tabla es la **única fuente de
 * verdad** del orden — el orquestador la lee, el stepper la lee.
 *
 * Para agregar un nuevo tipo de artefacto o un nuevo step:
 *   1. Sumarlo a `StepName` (si es un step nuevo).
 *   2. Agregar la entrada en `PIPELINES_POR_TIPO`.
 *   3. Asegurarse que el orquestador (`metabolizacion-actions.ts`) sepa
 *      ejecutar ese step. El runner vive ahí, no acá — este archivo es
 *      **puro datos**, sin lógica.
 *
 * **Por qué separar pipelines de runners**: el cliente necesita saber el
 * orden para pintar el stepper sin haber importado código de server.
 * Mezclar runners aquí arrastraría dependencias de server al cliente.
 */

import type { CgtTipoArtefacto } from "./cognetica_forense_types";

//#region [types] - 📦 TIPOS 📦

/**
 * Nombres canónicos de cada step. Coinciden con `step_name` que el orquestador
 * escribe en `ai_job_history.details.step_name` durante la ejecución.
 */
export type StepName =
	// Pre-procesamiento (varía por tipo)
	| "pdf_marker"
	| "pdf_slides_imagenes"
	| "pdf_slides_marker"
	| "audio_transcripcion"
	// Metabolización (común a todos los tipos)
	| "cronica"
	| "destilado"
	| "nucleo"
	| "germinal";

export interface StepDefinicion {
	/** Identificador canónico, debe coincidir con el del orquestador. */
	name: StepName;
	/** Etiqueta amigable para mostrar en el stepper. */
	label: string;
	/** Descripción corta visible debajo del label en el stepper. */
	descripcion: string;
}

//#endregion ![types]

//#region [data] - 🗺️ TABLA DE PIPELINES 🗺️

const STEP_CRONICA: StepDefinicion = {
	name: "cronica",
	label: "Crónica",
	descripcion: "Reconstrucción narrativa con voz literaria.",
};

const STEP_DESTILADO: StepDefinicion = {
	name: "destilado",
	label: "Destilado",
	descripcion: "Anatomía argumental (tesis · movimientos · tensiones).",
};

const STEP_NUCLEO: StepDefinicion = {
	name: "nucleo",
	label: "Núcleo",
	descripcion: "Tarjeta de presentación irreductible (≤600 tok).",
};

const STEP_GERMINAL: StepDefinicion = {
	name: "germinal",
	label: "Germinal",
	descripcion: "Hipótesis especulativa derivada del artefacto.",
};

const PIPELINE_METABOLIZACION: StepDefinicion[] = [
	STEP_CRONICA,
	STEP_DESTILADO,
	STEP_NUCLEO,
	STEP_GERMINAL,
];

/**
 * Pipeline ordenado por tipo de artefacto.
 *
 * Tipos sin entrada (`video`, `imagen` por ahora) no soportan
 * metabolización todavía — el orquestador retornará `NOT_IMPLEMENTED`
 * antes de crear el job.
 */
export const PIPELINES_POR_TIPO: Partial<
	Record<CgtTipoArtefacto, StepDefinicion[]>
> = {
	markdown: PIPELINE_METABOLIZACION,
	pdf_informe: [
		{
			name: "pdf_marker",
			label: "PDF → Markdown",
			descripcion: "Extracción de texto estructurado vía Marker.",
		},
		...PIPELINE_METABOLIZACION,
	],
	pdf_slides: [
		{
			name: "pdf_slides_imagenes",
			label: "Extracción de imágenes",
			descripcion: "Renderizado de cada lámina del PDF a PNG (no usa IA).",
		},
		{
			name: "pdf_slides_marker",
			label: "Conversión a texto",
			descripcion: "OCR de cada lámina vía Marker.",
		},
		...PIPELINE_METABOLIZACION,
	],
	audio: [
		{
			name: "audio_transcripcion",
			label: "Audio → Texto",
			descripcion: "Transcripción con diarización vía WhisperX.",
		},
		...PIPELINE_METABOLIZACION,
	],
};

//#endregion ![data]

//#region [helpers] - 🛠️ ACCESO 🛠️

/**
 * Devuelve el pipeline para un tipo de artefacto, o `null` si el tipo no
 * tiene metabolización implementada (ej: `video`, `imagen`).
 */
export function pipelineParaTipo(
	tipo: CgtTipoArtefacto,
): StepDefinicion[] | null {
	return PIPELINES_POR_TIPO[tipo] ?? null;
}

/**
 * Encuentra el índice (0-based) de un step dentro del pipeline de un tipo.
 * Devuelve `-1` si el step no pertenece al pipeline (no debería pasar si
 * el orquestador es coherente con esta tabla).
 */
export function indiceDelStep(
	tipo: CgtTipoArtefacto,
	stepName: StepName,
): number {
	const pipeline = pipelineParaTipo(tipo);
	if (!pipeline) return -1;
	return pipeline.findIndex((s) => s.name === stepName);
}

//#endregion ![helpers]
