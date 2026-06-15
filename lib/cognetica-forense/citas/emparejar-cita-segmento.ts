//. 📍 lib/cognetica-forense/citas/emparejar-cita-segmento.ts
/**
 * Vínculo cita ↔ segmento de audio.
 *
 * Convención de `ubicacion_en_artefacto` para artefactos de audio:
 *   "ts:<segundos_inicio>"   (ej. "ts:123.4")
 *
 * - Citas humanas: el operador marca un segmento → guardamos su timestamp exacto.
 * - Citas del pipeline (LLM): se extraen del Destilado (texto reescrito, sin
 *   timestamp), por lo que tras la extracción intentamos emparejarlas con un
 *   segmento por texto y, si hay match, guardamos también su "ts:".
 * - Retrocompatibilidad: citas viejas sin "ts:" se ubican por texto al renderizar.
 *
 * Este módulo es PURO (sin dependencias de Supabase) para poder reutilizarlo
 * tanto en el pipeline (servidor) como en el render (cliente).
 */

/** Prefijo de la convención de ubicación temporal en audio. */
const PREFIJO_TS = "ts:";

/** Segmento mínimo necesario para emparejar (subset de CgtAudioSegmento). */
export interface SegmentoEmparejable {
	id: string;
	texto: string;
	timestamp_inicio: number;
}

/**
 * Serializa un timestamp de inicio a la convención `ubicacion_en_artefacto`.
 * Redondea a 2 decimales para evitar ruido de coma flotante.
 */
export function timestampAUbicacion(timestampInicio: number): string {
	return `${PREFIJO_TS}${Math.round(timestampInicio * 100) / 100}`;
}

/**
 * Extrae el timestamp de inicio desde `ubicacion_en_artefacto`.
 * Devuelve `null` si la ubicación no sigue la convención `ts:` (ej. citas IA
 * viejas con texto libre del LLM, o ubicaciones de otros tipos de artefacto).
 */
export function parsearUbicacionTimestamp(
	ubicacion: string | null | undefined,
): number | null {
	if (!ubicacion || !ubicacion.startsWith(PREFIJO_TS)) return null;
	const n = Number(ubicacion.slice(PREFIJO_TS.length).trim());
	return Number.isFinite(n) ? n : null;
}

/**
 * Normaliza texto para comparación tolerante: minúsculas, sin acentos, sin
 * signos de puntuación y con espacios colapsados.
 */
function normalizar(texto: string): string {
	return texto
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "") // diacríticos combinantes
		.replace(/[^\p{L}\p{N}\s]/gu, " ") // puntuación → espacio
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Empareja el texto de una cita con el segmento más probable (best-effort).
 *
 * Estrategia, de más a menos fuerte:
 *   1. Un segmento cuyo texto CONTIENE el texto de la cita (o viceversa).
 *   2. El segmento con mayor solapamiento de palabras (Jaccard), sobre un
 *      umbral mínimo para no inventar coincidencias débiles.
 *
 * Devuelve el segmento emparejado o `null` si ninguno supera el umbral.
 * (No "adivina": si no hay evidencia suficiente, no empareja — el caller
 * decide qué hacer con un null, en línea con "no fallback disfraz".)
 */
export function emparejarCitaConSegmento<T extends SegmentoEmparejable>(
	textoCita: string,
	segmentos: T[],
): T | null {
	const cita = normalizar(textoCita);
	if (!cita || segmentos.length === 0) return null;

	// 1. Contención directa (la cita vive textual dentro de un segmento, o el
	//    segmento es un fragmento de la cita).
	for (const seg of segmentos) {
		const s = normalizar(seg.texto);
		if (!s) continue;
		if (s.includes(cita) || cita.includes(s)) return seg;
	}

	// 2. Solapamiento de palabras (Jaccard) sobre umbral.
	const palabrasCita = new Set(cita.split(" ").filter((w) => w.length > 2));
	if (palabrasCita.size === 0) return null;

	let mejor: T | null = null;
	let mejorScore = 0;
	for (const seg of segmentos) {
		const palabrasSeg = new Set(
			normalizar(seg.texto)
				.split(" ")
				.filter((w) => w.length > 2),
		);
		if (palabrasSeg.size === 0) continue;

		let interseccion = 0;
		for (const w of palabrasCita) {
			if (palabrasSeg.has(w)) interseccion++;
		}
		const union = palabrasCita.size + palabrasSeg.size - interseccion;
		const score = union > 0 ? interseccion / union : 0;
		if (score > mejorScore) {
			mejorScore = score;
			mejor = seg;
		}
	}

	// Umbral conservador: preferimos no marcar a marcar mal.
	const UMBRAL_JACCARD = 0.35;
	return mejorScore >= UMBRAL_JACCARD ? mejor : null;
}
