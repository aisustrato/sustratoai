//. 📍 lib/cognetica-forense/exportacion/transcripcion-diarizada.ts
/**
 * Reconstruye un Markdown de transcripción CON diarización (hablantes + tiempos)
 * a partir de los segmentos de audio (`cgt_audio_segmentos`).
 *
 * El visor en pantalla (`StandardAudioPlayer`) muestra cada segmento con su
 * etiqueta "Hablante N" y su rango temporal. Hasta ahora la exportación usaba
 * el texto plano (`contenidoMarkdown`), que NO conserva esa diarización: por eso
 * la diarización se veía en la app pero se perdía al exportar (md / Obsidian).
 *
 * Este helper recompone el mismo etiquetado del visor para que ambos formatos
 * la mantengan. Mapeo de hablante idéntico al visor: "SPEAKER_00" → "Hablante 1".
 * Segmentos consecutivos del mismo hablante se fusionan en un único turno.
 */

import type { CgtAudioSegmento } from "@/lib/cognetica-forense/cognetica_forense_types";

/** Formatea segundos como mm:ss (o h:mm:ss si supera la hora). */
function formatTiempo(segundos: number): string {
	const total = Math.max(0, Math.floor(segundos));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const mm = String(m).padStart(2, "0");
	const ss = String(s).padStart(2, "0");
	return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Etiqueta de hablante idéntica a la del visor (`StandardAudioPlayer`):
 * "SPEAKER_00" → "Hablante 1". Si no hay id válido → "Desconocido".
 */
function etiquetaHablante(hablanteId: string | null): string {
	if (!hablanteId) return "Desconocido";
	const n = parseInt(String(hablanteId).replace("SPEAKER_", ""), 10);
	return Number.isNaN(n) ? "Desconocido" : `Hablante ${n + 1}`;
}

/**
 * Genera el Markdown diarizado a partir de los segmentos.
 *
 * Devuelve `null` cuando no hay segmentos utilizables, para que quien llama
 * decida un fallback explícito (no inventa contenido: ver regla "no fallback
 * disfraz").
 */
export function transcripcionDiarizadaMD(
	segmentos: CgtAudioSegmento[] | null | undefined,
): string | null {
	if (!segmentos || segmentos.length === 0) return null;

	// Ordenar por tiempo de inicio (defensivo: la consulta podría no garantizarlo).
	const ordenados = [...segmentos].sort(
		(a, b) => (a.timestamp_inicio ?? 0) - (b.timestamp_inicio ?? 0),
	);

	interface Turno {
		etiqueta: string;
		inicio: number;
		fin: number;
		textos: string[];
	}
	const turnos: Turno[] = [];

	for (const seg of ordenados) {
		const texto = (seg.texto ?? "").trim();
		if (!texto) continue;

		const etiqueta = etiquetaHablante(seg.hablante_id);
		const inicio = seg.timestamp_inicio ?? 0;
		const fin = seg.timestamp_fin ?? inicio;

		const ultimo = turnos[turnos.length - 1];
		if (ultimo && ultimo.etiqueta === etiqueta) {
			// Mismo hablante: extender el turno actual.
			ultimo.fin = fin;
			ultimo.textos.push(texto);
		} else {
			turnos.push({ etiqueta, inicio, fin, textos: [texto] });
		}
	}

	if (turnos.length === 0) return null;

	const bloques = turnos.map((t) => {
		const rango = `${formatTiempo(t.inicio)} – ${formatTiempo(t.fin)}`;
		return `**${t.etiqueta}** _(${rango})_\n\n${t.textos.join(" ")}`;
	});

	return bloques.join("\n\n");
}
