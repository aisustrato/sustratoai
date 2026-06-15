//. 📍 lib/cognetica-forense/citas/mapear-citas-a-segmentos.ts
/**
 * Mapea las citas de un artefacto de audio a los segmentos de su transcripción,
 * para marcarlos en el visor. Puro y cliente-safe.
 *
 * Estrategia por cita:
 *   1. Si `ubicacion_en_artefacto` tiene `ts:<inicio>` → segmento por timestamp
 *      (humanas y de IA ya "backfilleadas").
 *   2. Si no (citas viejas de IA sin ts) → emparejar por texto (retrocompat).
 *
 * Una cita que no se puede ubicar se descarta del mapa (no se marca nada que
 * no tengamos cómo justificar — coherente con "no fallback disfraz").
 */

import {
	emparejarCitaConSegmento,
	parsearUbicacionTimestamp,
	type SegmentoEmparejable,
} from "@/lib/cognetica-forense/citas/emparejar-cita-segmento";

/** Origen de una cita (subset del enum cgt_origen relevante para citas). */
export type OrigenCita = "humano" | "llm" | "nodo" | "sistema";

/** Cita mínima para mapear (subset de cgt_citas_menciones). */
export interface CitaParaMapear {
	id: string;
	origen: OrigenCita;
	ubicacion_en_artefacto: string | null;
	texto_extractor_crudo: string | null;
}

/** Info de citas asociada a un segmento. */
export interface CitasDeSegmento {
	/** Todas las citas ligadas a este segmento. */
	citas: Array<{ mencionId: string; origen: OrigenCita }>;
	/** `true` si alguna cita del segmento fue creada por un humano. */
	tieneHumana: boolean;
	/** Id de la primera cita humana (para el toggle "Quitar cita"), o null. */
	mencionHumanaId: string | null;
}

/** Tolerancia (segundos) para casar un `ts:` con el inicio de un segmento. */
const TOLERANCIA_TS = 0.6;

/**
 * Construye un mapa `segmentoId → CitasDeSegmento`.
 */
export function mapearCitasASegmentos<T extends SegmentoEmparejable>(
	citas: CitaParaMapear[],
	segmentos: T[],
): Map<string, CitasDeSegmento> {
	const mapa = new Map<string, CitasDeSegmento>();
	if (segmentos.length === 0) return mapa;

	const asignar = (segmentoId: string, mencionId: string, origen: OrigenCita) => {
		const previo = mapa.get(segmentoId);
		if (previo) {
			previo.citas.push({ mencionId, origen });
			if (origen === "humano") {
				previo.tieneHumana = true;
				previo.mencionHumanaId ??= mencionId;
			}
		} else {
			mapa.set(segmentoId, {
				citas: [{ mencionId, origen }],
				tieneHumana: origen === "humano",
				mencionHumanaId: origen === "humano" ? mencionId : null,
			});
		}
	};

	for (const cita of citas) {
		const ts = parsearUbicacionTimestamp(cita.ubicacion_en_artefacto);
		if (ts !== null) {
			// Segmento por timestamp: el más cercano dentro de tolerancia, o el
			// que contiene el ts en su rango.
			let elegido: T | null = null;
			let mejorDelta = Infinity;
			for (const seg of segmentos) {
				const delta = Math.abs(seg.timestamp_inicio - ts);
				if (delta < mejorDelta) {
					mejorDelta = delta;
					elegido = seg;
				}
			}
			if (elegido && mejorDelta <= TOLERANCIA_TS) {
				asignar(elegido.id, cita.id, cita.origen);
				continue;
			}
		}

		// Retrocompat: emparejar por texto.
		const match = emparejarCitaConSegmento(cita.texto_extractor_crudo ?? "", segmentos);
		if (match) asignar(match.id, cita.id, cita.origen);
	}

	return mapa;
}
