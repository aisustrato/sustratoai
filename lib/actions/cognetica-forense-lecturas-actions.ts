//. 📍 lib/actions/cognetica-forense-lecturas-actions.ts
/**
 * Server Actions de **lectura** para Cognética Forense v2 — Oleada 1.
 *
 * Este archivo expone operaciones de solo lectura del pipeline de
 * metabolización (artefacto + 4 formatos). No muta estado; por eso permanece
 * independiente de `cognetica-forense-metabolizacion-actions.ts` (que sí
 * escribe y está cableado como `"use server"` con solo funciones async).
 *
 * Fase 3.1 del plan general (ver `docs/cognetica/addendum_requerimiento_windsurf_v11.md`).
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import type { PostgrestError } from "@supabase/supabase-js";

import { asegurarAccesoArtefacto } from "@/lib/cognetica-forense/metabolizacion-helpers";
import type { ArtefactoCompleto } from "@/lib/cognetica-forense/lecturas-shared";
import type {
	CgtArtefacto,
	CgtCronica,
	CgtDestilado,
	CgtGerminal,
	CgtNucleo,
	Result,
	ResultErrorCode,
} from "@/lib/cognetica-forense/types";
import { fail, ok } from "@/lib/cognetica-forense/types";
import { createServerClient } from "@/lib/supabase";
//#endregion ![head]

//#region [main] - 🔧 obtenerArtefactoCompleto 🔧
/**
 * Lee el artefacto y las filas existentes de cada uno de los 4 formatos.
 *
 * Controla permiso vía `asegurarAccesoArtefacto` (misma puerta que usa la
 * metabolización para escribir). Si el artefacto aún no tiene un formato
 * dado, el campo respectivo llega `null` — eso es lo que el Stepper y el
 * Accordion de la UI usan para decidir qué sección está "pendiente" vs.
 * "lista" vs. "con error".
 *
 * No hace throw: errores viajan en `Result<_, ResultErrorCode>`.
 */
export async function obtenerArtefactoCompleto(
	artefactoId: string,
): Promise<Result<ArtefactoCompleto, ResultErrorCode>> {
	const supabase = await createServerClient();

	// (1) Control de acceso (también valida que el artefacto exista).
	const acceso = await asegurarAccesoArtefacto(supabase, artefactoId);
	if (!acceso.ok) return acceso;

	// (2) Fetch paralelo de artefacto + 4 formatos + pdf_informe + pdf_slides + markdown + audio.
	const [artRes, cronRes, destRes, nuclRes, gerRes, pdfRes, slidesRes, mdRes, audioRes, audioSegRes] =
		await Promise.all([
			supabase
				.from("cgt_artefactos")
				.select("*")
				.eq("id", artefactoId)
				.single(),
			supabase
				.from("cgt_cronicas")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_destilados")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_nucleos")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_germinales")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_artefactos_pdf_informe")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_artefactos_pdf_slides")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_artefactos_markdown")
				.select("contenido")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_artefactos_audio")
				.select("*")
				.eq("artefacto_id", artefactoId)
				.maybeSingle(),
			supabase
				.from("cgt_audio_segmentos")
				.select(
					"id, artefacto_id, timestamp_inicio, timestamp_fin, hablante_id, texto, confianza",
				)
				.eq("artefacto_id", artefactoId)
				.order("timestamp_inicio", { ascending: true }),
		]);

	const tipo = artRes.data?.tipo as string;
	let contenidoMarkdown: string | null = null;

	// (2b) Para audio: obtener transcripción como contenido markdown.
	if (tipo === "audio" && audioRes.data?.transcripcion_completa) {
		contenidoMarkdown = audioRes.data.transcripcion_completa as string;
		console.log(
			`[obtenerArtefactoCompleto] Transcripción de audio cargada: ${contenidoMarkdown.length} chars`,
		);
	}

	// (2c) Obtener contenido markdown desde cgt_artefactos_markdown (para PDF y markdown).

	if (tipo === "pdf_informe" && mdRes.data?.contenido) {
		contenidoMarkdown = mdRes.data.contenido as string;
		console.log(
			`[obtenerArtefactoCompleto] Markdown cargado desde cgt_artefactos_markdown: ${contenidoMarkdown.length} chars`,
		);
	} else if (tipo === "markdown") {
		const storagePathMd = artRes.data?.storage_path_md as string | null;
		const storagePathOriginal = artRes.data?.storage_path_original as string | null;
		const storagePath = storagePathMd ?? storagePathOriginal;

		if (storagePath) {
			try {
				const { data: fileData, error: downloadError } = await supabase.storage
					.from("cognetica-files")
					.download(storagePath);
				if (!downloadError && fileData) {
					contenidoMarkdown = await fileData.text();
					console.log(
						`[obtenerArtefactoCompleto] Markdown cargado desde storage: ${contenidoMarkdown.length} chars`,
					);
				}
			} catch {
				/* Storage no disponible, continuar con null */
			}
		}
	}

	// Agrupamos errores en un helper local para no repetir el mismo branch.
	const errores: Array<{ etiqueta: string; err: PostgrestError | null }> = [
		{ etiqueta: "artefacto", err: artRes.error },
		{ etiqueta: "cronica", err: cronRes.error },
		{ etiqueta: "destilado", err: destRes.error },
		{ etiqueta: "nucleo", err: nuclRes.error },
		{ etiqueta: "germinal", err: gerRes.error },
		{ etiqueta: "pdf_informe", err: pdfRes.error },
		{ etiqueta: "pdf_slides", err: slidesRes.error },
	];
	for (const { etiqueta, err } of errores) {
		if (err) {
			console.error(`[obtenerArtefactoCompleto] ${etiqueta}:`, err);
			return fail<ResultErrorCode>("INTERNAL");
		}
	}

	if (!artRes.data) {
		// Defensivo: `asegurarAccesoArtefacto` ya lo validó, pero TS no lo sabe.
		return fail<ResultErrorCode>("NOT_FOUND");
	}

	// (3) Cast a los tipos de dominio. El `unknown` intermedio se debe a que
	//     los tipos autogenerados de Supabase (`Database`) usan `Json` y
	//     `string | null` en lugares donde los tipos de dominio son más
	//     específicos (ej. `CgtMovimiento[]`).
	return ok<ArtefactoCompleto>({
		artefacto: artRes.data as unknown as CgtArtefacto,
		cronica: (cronRes.data as unknown as CgtCronica | null) ?? null,
		destilado: (destRes.data as unknown as CgtDestilado | null) ?? null,
		nucleo: (nuclRes.data as unknown as CgtNucleo | null) ?? null,
		germinal: (gerRes.data as unknown as CgtGerminal | null) ?? null,
		contenidoMarkdown,
		pdf_informe:
			(pdfRes.data as unknown as
				| import("@/lib/cognetica-forense/types").CgtArtefactoPdfInforme
				| null) ?? null,
		pdf_slides:
			(slidesRes.data as unknown as
				| import("@/lib/cognetica-forense/types").CgtArtefactoPdfSlides
				| null) ?? null,
		audio:
			(audioRes.data as unknown as
				| import("@/lib/cognetica-forense/types").CgtArtefactoAudio
				| null) ?? null,
		audio_segmentos:
			(audioSegRes.data as unknown as
				| import("@/lib/cognetica-forense/types").CgtAudioSegmento[]
				| null) ?? null,
	});
}
//#endregion ![main]
