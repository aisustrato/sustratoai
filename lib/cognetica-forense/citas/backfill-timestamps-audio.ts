//. 📍 lib/cognetica-forense/citas/backfill-timestamps-audio.ts
/**
 * Backfill de timestamps en citas de audio.
 *
 * Las citas que extrae el pipeline (LLM) provienen del Destilado (texto
 * reescrito, sin timestamp), por lo que no quedan ligadas a un segmento de
 * la transcripción. Este helper, tras la extracción de un artefacto de AUDIO,
 * intenta emparejar cada cita sin `ts:` con un segmento por texto y, si hay
 * match confiable, guarda `ubicacion_en_artefacto = "ts:<inicio>"`.
 *
 * Es best-effort y conservador: si no hay match, la cita queda como estaba
 * (se ubicará por texto al renderizar, retrocompat). No "adivina".
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import {
	emparejarCitaConSegmento,
	parsearUbicacionTimestamp,
	timestampAUbicacion,
	type SegmentoEmparejable,
} from "@/lib/cognetica-forense/citas/emparejar-cita-segmento";

type DbClient = SupabaseClient<Database>;

/**
 * Intenta poblar `ubicacion_en_artefacto` con el timestamp del segmento que
 * mejor empareja, para las citas del artefacto de audio que aún no lo tengan.
 *
 * Devuelve cuántas citas se actualizaron. Nunca lanza: loguea y sigue (las
 * citas que fallan quedan sin `ts:` y se resuelven por texto en el render).
 */
export async function backfillTimestampsCitasAudio(
	supabase: DbClient,
	artefactoId: string,
): Promise<{ actualizadas: number }> {
	// 1. Segmentos del audio.
	const segRes = await supabase
		.from("cgt_audio_segmentos")
		.select("id, texto, timestamp_inicio")
		.eq("artefacto_id", artefactoId);
	if (segRes.error) {
		console.error(
			"[backfillTimestampsCitasAudio] lectura segmentos:",
			segRes.error,
		);
		return { actualizadas: 0 };
	}
	const segmentos: SegmentoEmparejable[] = (segRes.data ?? []).map((s) => ({
		id: s.id,
		texto: s.texto ?? "",
		timestamp_inicio: s.timestamp_inicio ?? 0,
	}));
	if (segmentos.length === 0) return { actualizadas: 0 };

	// 2. Citas del artefacto que aún no tienen ubicación temporal (`ts:`).
	const citasRes = await supabase
		.from("cgt_citas_menciones")
		.select("id, texto_extractor_crudo, ubicacion_en_artefacto")
		.eq("artefacto_id", artefactoId);
	if (citasRes.error) {
		console.error("[backfillTimestampsCitasAudio] lectura citas:", citasRes.error);
		return { actualizadas: 0 };
	}

	const pendientes = (citasRes.data ?? []).filter(
		(c) => parsearUbicacionTimestamp(c.ubicacion_en_artefacto) === null,
	);
	if (pendientes.length === 0) return { actualizadas: 0 };

	// 3. Emparejar y actualizar una por una (volúmenes chicos: audios cortos).
	let actualizadas = 0;
	for (const cita of pendientes) {
		const texto = cita.texto_extractor_crudo ?? "";
		if (!texto.trim()) continue;

		const match = emparejarCitaConSegmento(texto, segmentos);
		if (!match) continue;

		const upd = await supabase
			.from("cgt_citas_menciones")
			.update({ ubicacion_en_artefacto: timestampAUbicacion(match.timestamp_inicio) })
			.eq("id", cita.id);
		if (upd.error) {
			console.error(
				"[backfillTimestampsCitasAudio] update cita:",
				cita.id.slice(0, 8),
				upd.error,
			);
			continue;
		}
		actualizadas++;
	}

	return { actualizadas };
}
