//. 📍 lib/cognetica-forense/lecturas-shared.ts
/**
 * Tipos compartidos por los Server Actions de **lectura** y sus consumidores
 * en UI.
 *
 * Vive fuera de `lib/actions/cognetica-forense-lecturas-actions.ts` por la
 * restricción de Next.js 14: un archivo `"use server"` sólo puede exportar
 * funciones `async`. Cualquier `export interface` / `export const` debe
 * vivir en un módulo plano como éste.
 */

import type {
	CgtArtefacto,
	CgtArtefactoPdfInforme,
	CgtArtefactoPdfSlides,
	CgtArtefactoAudio,
	CgtAudioSegmento,
	CgtCronica,
	CgtDestilado,
	CgtGerminal,
	CgtNucleo,
} from "./types";

/**
 * Payload de `obtenerArtefactoCompleto`: artefacto + los 4 formatos.
 *
 * Cada formato es opcional (`null` cuando el pipeline aún no llegó a ese
 * paso, o falló antes de persistir). La UI usa estos `null` como señal
 * directa del estado del Stepper y del Accordion.
 *
 * `jobActual` contiene el job activo (running) más reciente del pipeline
 * de metabolización para este artefacto. Permite al frontend saber qué
 * paso está corriendo en tiempo real sin adivinar.
 */
export interface ArtefactoCompleto {
	artefacto: CgtArtefacto;
	cronica: CgtCronica | null;
	destilado: CgtDestilado | null;
	nucleo: CgtNucleo | null;
	germinal: CgtGerminal | null;
	/** Contenido markdown del artefacto (solo para tipos markdown y pdf_informe) */
	contenidoMarkdown?: string | null;
	/** Datos específicos del PDF procesado por Marker */
	pdf_informe?: CgtArtefactoPdfInforme | null;
	/** Datos específicos del PDF slides procesado */
	pdf_slides?: CgtArtefactoPdfSlides | null;
	/** Datos específicos del audio transcrito */
	audio?: CgtArtefactoAudio | null;
	/** Segmentos de la transcripción con timestamps y hablantes */
	audio_segmentos?: CgtAudioSegmento[] | null;
	/** Job activo del pipeline de metabolización (si hay uno en curso). */
	jobActual?: {
		id: string;
		step_name: string;
		status: string;
		progress: number | null;
		started_at: string | null;
		ai_model: string | null;
	} | null;
}
