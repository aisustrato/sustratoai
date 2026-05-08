/**
 * Cognética Forense — Server Actions Oleada 1
 *
 * Firmas de Server Actions con documentación detallada.
 * Windsurf debe implementar el cuerpo de cada una respetando:
 *   - Las firmas y tipos de retorno
 *   - El orden del flujo documentado
 *   - El patrón Result<T> para todos los retornos
 *   - La validación de permisos por proyecto
 *
 * Convenciones:
 *   - Todos los archivos comienzan con "use server"
 *   - Cliente Supabase vía `createServerClient()` del wrapper propio
 *   - Errores user-facing en español, logs internos pueden ser en inglés
 *   - No lanzar excepciones hacia el cliente — siempre retornar Result
 *
 * Autor: Hongo / Calibrador
 * Versión: v0.2
 */

/* eslint-disable @typescript-eslint/no-unused-vars --
   Este archivo es el CONTRATO de Server Actions entregado por Hongo/Calibrador.
   Los parámetros están declarados pero no usados todavía: se consumirán a
   medida que cada dominio (ingesta, transcripción, pdf, metabolización,
   grupos, consulta) sea implementado en `cognetica-forense-<dominio>-actions.ts`.
   Conforme se porten las firmas, este disable debe ir removiéndose o
   replicándose solo en los archivos donde persista deuda declarada.
*/

"use server";

import type {
	ArtefactoCompleto,
	CgtArtefacto,
	CgtAudioSegmento,
	CgtCronica,
	CgtDestilado,
	CgtGerminal,
	CgtGrupoArtefactos,
	CgtVideoSegmento,
	CrearGrupoInput,
	FiltrosArtefacto,
	IngestaArtefactoInput,
	Result,
} from "@/lib/cognetica-forense/cognetica_forense_types";
import { ok, fail } from "@/lib/cognetica-forense/types";
import { createServerClient } from "@/lib/supabase";
import Replicate from "replicate";
import { revalidatePath } from "next/cache";

// =============================================================================
// INGESTA
// =============================================================================

/**
 * Ingesta principal de un artefacto.
 *
 * Flujo:
 *   1. Valida permisos sobre el proyecto
 *   2. Valida tipo vs archivo (coherencia MIME)
 *   3. Sube archivo original a Supabase Storage en ruta:
 *      `cognetica/{project_id}/{artefacto_uuid}/original.{ext}`
 *   4. Procesa según tipo (sincronía/asincronía según caso):
 *      - audio/video: crea artefacto en estado 'ingresado', transcripción async
 *      - pdf_slides/pdf_informe: procesa sincrónicamente
 *      - markdown: parsea frontmatter + headers sincrónicamente
 *      - imagen: solo metadata (sin descripción IA en Oleada 1)
 *   5. Construye tríada canónica (JSON determinístico, YAML legible, MD humano)
 *   6. Calcula SHA-256 del JSON canónico
 *   7. Valida que no exista artefacto con mismo hash en el mismo proyecto
 *      (constraint UNIQUE, pero chequeo previo con mensaje amigable)
 *   8. Inserta en cgt_artefactos + tabla específica por tipo
 *   9. Sube tríada (md, yaml, json) a Storage
 *  10. UPDATE storage_paths en cgt_artefactos
 *  11. Para audio/video: dispara `transcribirAudio/Video` en background
 *  12. Para todos: dispara flujo de metabolización en background
 *      (no bloquea retorno)
 *  13. Retorna CgtArtefacto con estado inicial
 *
 * Errores manejados:
 *   - Usuario sin permisos sobre proyecto → "No tienes permisos sobre este proyecto"
 *   - Archivo inválido para el tipo → "El archivo no corresponde al tipo seleccionado"
 *   - Hash duplicado → "Este artefacto ya existe en el proyecto"
 *   - Falla de Storage → "Error al guardar el archivo, reintenta"
 */
export async function ingestaArtefacto(
	input: IngestaArtefactoInput,
): Promise<Result<CgtArtefacto>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Reintenta la metabolización de un artefacto en estado 'error'.
 * Útil cuando DeepSeek/Replicate estaban caídos o hubo error transitorio.
 *
 * Flujo:
 *   1. Valida permisos
 *   2. Valida estado = 'error' o 'ingresado'
 *   3. Limpia error_mensaje previo
 *   4. Dispara flujo de metabolización de nuevo
 *   5. Retorna éxito (el flujo es asíncrono)
 */
export async function reintentarMetabolizacion(
	artefactoId: string,
): Promise<Result<void>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Elimina un artefacto completamente.
 *
 * ATENCIÓN: Esto es destructivo. Borra:
 *   - Fila en cgt_artefactos (CASCADE elimina extensiones específicas)
 *   - Archivos en Supabase Storage (original + tríada)
 *   - Crónica, destilado, germinal asociados
 *   - NO borra grupos (el grupo puede existir sin este artefacto)
 *
 * Valida permisos antes de borrar.
 */
export async function eliminarArtefacto(
	artefactoId: string,
): Promise<Result<void>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

// =============================================================================
// TRANSCRIPCIÓN
// =============================================================================

/**
 * Transcribe un artefacto de audio usando Replicate WhisperX Large v3.
 *
 * Flujo:
 *   1. Obtiene artefacto, valida tipo = 'audio'
 *   2. Genera URL firmada del archivo en Storage
 *   3. Llama API Route /api/transcription/replicate con diarización activada
 *   4. Parsea respuesta: transcripción completa + segmentos con hablantes
 *   5. INSERT en cgt_artefactos_audio (metadata + transcripción + hablantes)
 *   6. INSERT batch en cgt_audio_segmentos
 *   7. UPDATE cgt_artefactos SET estado = 'ingresado'
 *
 * Si falla: estado = 'error', error_mensaje poblado.
 */
export async function transcribirAudio(
	artefactoId: string,
	fileBuffer: Buffer,
	fileName: string,
): Promise<Result<void>> {
	console.log(
		`🎙️ [transcribirAudio] Iniciando para artefacto: ${artefactoId}`,
	);

	const supabase = await createServerClient();

	try {
		// (1) Obtener artefacto y validar tipo
		const { data: artefacto, error: artefactoError } = await supabase
			.from("cgt_artefactos")
			.select("id, tipo, storage_path_original, titulo")
			.eq("id", artefactoId)
			.single();

		if (artefactoError || !artefacto) {
			console.error(
				"🎙️ [transcribirAudio] Artefacto no encontrado:",
				artefactoError,
			);
			return fail("NOT_FOUND");
		}

		if (artefacto.tipo !== "audio") {
			console.error(
				`🎙️ [transcribirAudio] Tipo incorrecto: ${artefacto.tipo}`,
			);
			return fail("INVALID_INPUT");
		}

		// (2) Llamar Replicate directamente (sin API route intermedia)
		if (!process.env.REPLICATE_API_TOKEN) {
			console.error("❌ [transcribirAudio] REPLICATE_API_TOKEN no configurado");
			await supabase
				.from("cgt_artefactos")
				.update({
					estado: "error",
					error_mensaje: "Servicio de transcripción no configurado (falta REPLICATE_API_TOKEN)",
					updated_at: new Date().toISOString(),
				})
				.eq("id", artefactoId);
			return fail("TRANSCRIPTION_ERROR");
		}

		const replicate = new Replicate({
			auth: process.env.REPLICATE_API_TOKEN,
		});

		// Convertir buffer a data URI (Replicate acepta data URIs)
		const base64Audio = fileBuffer.toString("base64");
		// Detectar MIME type correcto desde el nombre de archivo
		const ext = fileName.toLowerCase().split('.').pop() ?? "";
		const mimeMap: Record<string, string> = {
			mp3: "audio/mpeg",
			m4a: "audio/mp4",
			mpeg: "audio/mpeg",
			mpga: "audio/mpeg",
			wav: "audio/wav",
			webm: "audio/webm",
			flac: "audio/flac",
			ogg: "audio/ogg",
			oga: "audio/ogg",
			opus: "audio/opus",
		};
		const mimeType = mimeMap[ext] ?? "audio/mpeg";
		const dataUri = `data:${mimeType};base64,${base64Audio}`;

		console.log(`🎙️ [transcribirAudio] Enviando audio a WhisperX vía Replicate (mimeType=${mimeType}, size=${fileBuffer.length} bytes)...`);

		let output;
		try {
			output = await replicate.run(
				"victor-upmeet/whisperx:84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb",
				{
					input: {
						audio_file: dataUri,
						debug: false,
						batch_size: 64,
						diarization: true,
						align_output: true,
						temperature: 0,
						vad_onset: 0.5,
						vad_offset: 0.363,
						language_detection_min_prob: 0,
						language_detection_max_tries: 5,
					},
				},
			);
			console.log("✅ [transcribirAudio] Transcripción Replicate exitosa");
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Error desconocido";
			const errorStack = error instanceof Error ? error.stack : "";
			const errorFull = error instanceof Error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
			
			console.error("❌ [transcribirAudio] Error Replicate completo:");
			console.error("  Message:", errorMessage);
			console.error("  Stack:", errorStack);
			console.error("  Full:", errorFull);
			console.error("  Token exists:", !!process.env.REPLICATE_API_TOKEN);
			console.error("  Token length:", process.env.REPLICATE_API_TOKEN?.length ?? 0);

			await supabase
				.from("cgt_artefactos")
				.update({
					estado: "error",
					error_mensaje: `Transcripción fallida: ${errorMessage}`,
					updated_at: new Date().toISOString(),
				})
				.eq("id", artefactoId);

			return fail("TRANSCRIPTION_ERROR");
		}

		// Extraer texto y segmentos de la respuesta de WhisperX
		console.log("🎙️ [transcribirAudio] Output crudo de Replicate:", JSON.stringify(output, null, 2).slice(0, 2000));

		let transcription = "";
		let segments: Array<{
			start: number;
			end: number;
			text: string;
			speaker?: string | number;
		}> = [];
		let detectedLanguage = "";

		if (typeof output === "string") {
			transcription = output;
		} else if (output && typeof output === "object") {
			const outputObj = output as Record<string, unknown>;
			detectedLanguage =
				(outputObj.detected_language as string) ||
				(outputObj.language as string) ||
				"";

			// Intentar múltiples formatos de segmentos que Replicate/WhisperX puede devolver
			const rawSegments = outputObj.segments || outputObj.chunks || outputObj.words;
			if (rawSegments && Array.isArray(rawSegments)) {
				segments = (rawSegments as Array<Record<string, unknown>>).map((s) => ({
					start: Number(s.start ?? s.timestamp ?? s.start_time ?? 0),
					end: Number(s.end ?? s.timestamp_end ?? s.end_time ?? 0),
					text: String(s.text ?? s.word ?? s.content ?? ""),
					speaker: (s.speaker ?? s.speaker_id ?? s.speaker_label) as string | number | undefined,
				}));
				transcription = segments
					.map((s) => s.text)
					.filter(Boolean)
					.join(" ");
				console.log(`🎙️ [transcribirAudio] ${segments.length} segmentos extraídos`);
			} else if (outputObj.transcription) {
				transcription = outputObj.transcription as string;
			} else if (outputObj.text) {
				transcription = outputObj.text as string;
			} else {
				console.error("⚠️ [transcribirAudio] Formato inesperado — keys:", Object.keys(outputObj));
				transcription = JSON.stringify(output);
			}
		}

		const transcriptionData = {
			success: true,
			transcription,
			segments,
			detectedLanguage,
			metadata: {
				fileName,
				fileSize: fileBuffer.length,
				segmentCount: segments.length,
			},
		};

		console.log(
			`🎙️ [transcribirAudio] Transcripción exitosa: ${transcriptionData.transcription?.length ?? 0} chars, ${transcriptionData.segments?.length ?? 0} segmentos`,
		);

		// (3) Construir lista de hablantes únicos desde segmentos
		const hablantesMap = new Map<string, string>();
		for (const seg of transcriptionData.segments ?? []) {
			const speakerId = String(seg.speaker ?? "SPEAKER_00");
			if (!hablantesMap.has(speakerId)) {
				hablantesMap.set(speakerId, speakerId);
			}
		}
		const hablantes = Array.from(hablantesMap.entries()).map(
			([id, nombre]) => ({ id, nombre }),
		);

		// (4) Calcular duración total a partir de los segmentos
		const duracionSeg =
			transcriptionData.segments?.length > 0
				? Math.max(
						...transcriptionData.segments.map((s) => s.end ?? 0),
					)
				: null;

		// (5) Detectar formato original del nombre de archivo
		const formatoOriginal = fileName.includes(".")
			? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
			: null;

		// (6) INSERT en cgt_artefactos_audio
		const { error: audioInsertError } = await supabase
			.from("cgt_artefactos_audio")
			.insert({
				artefacto_id: artefactoId,
				duracion_seg: duracionSeg,
				idioma: transcriptionData.detectedLanguage ?? "es",
				transcripcion_completa:
					transcriptionData.transcription ?? "",
				hablantes: hablantes as unknown as import("@/lib/database.types").Json[],
				sample_rate: null,
				bitrate: null,
				formato_original: formatoOriginal,
			});

		if (audioInsertError) {
			console.error(
				"🎙️ [transcribirAudio] Error insertando cgt_artefactos_audio:",
				audioInsertError,
			);

			await supabase
				.from("cgt_artefactos")
				.update({
					estado: "error",
					error_mensaje: `Error guardando transcripción: ${audioInsertError.message}`,
					updated_at: new Date().toISOString(),
				})
				.eq("id", artefactoId);

			return fail("INTERNAL");
		}

		// (7) INSERT batch en cgt_audio_segmentos
		if (
			transcriptionData.segments &&
			transcriptionData.segments.length > 0
		) {
			// Sanitizar segmentos: asegurar que start < end y ambos >= 0
			const segmentosRaw = transcriptionData.segments
				.map((seg) => {
					const start = Math.max(0, Number(seg.start ?? 0));
					const end = Math.max(0, Number(seg.end ?? 0));
					return {
						artefacto_id: artefactoId,
						timestamp_inicio: start,
						timestamp_fin: end,
						hablante_id: String(seg.speaker ?? "SPEAKER_00"),
						texto: String(seg.text ?? "").trim(),
						confianza: null,
					};
				})
				.filter((seg) => {
					// Filtrar segmentos inválidos: deben tener duración positiva y texto no vacío
					if (seg.timestamp_inicio >= seg.timestamp_fin) {
						console.warn(
							`🎙️ [transcribirAudio] Segmento inválido descartado: start=${seg.timestamp_inicio} >= end=${seg.timestamp_fin}`,
						);
						return false;
					}
					if (!seg.texto) {
						return false;
					}
					return true;
				});

			if (segmentosRaw.length > 0) {
				const { error: segInsertError } = await supabase
					.from("cgt_audio_segmentos")
					.insert(segmentosRaw);

				if (segInsertError) {
					console.error(
						"🎙️ [transcribirAudio] Error insertando segmentos (no bloqueante):",
						segInsertError,
					);
				} else {
					console.log(
						`🎙️ [transcribirAudio] ${segmentosRaw.length} segmentos insertados correctamente`,
					);
				}
			} else {
				console.warn(
					"🎙️ [transcribirAudio] Todos los segmentos fueron descartados por timestamps inválidos",
				);
			}
		}

		// (8) INSERT en cgt_artefactos_markdown (transcripción como contenido)
		const markdownContent = `# Transcripción: ${artefacto.titulo}\n\n${(transcriptionData.transcription ?? "").split("\n").map((line: string) => line.trim()).filter((line: string) => line.length > 0).join("\n\n")}`;

		const { error: mdInsertError } = await supabase
			.from("cgt_artefactos_markdown")
			.insert({
				artefacto_id: artefactoId,
				contenido: markdownContent,
				frontmatter: {
					tipo: "audio",
					fuente: "whisperx-replicate",
					idioma: transcriptionData.detectedLanguage ?? "es",
				} as unknown as import("@/lib/database.types").Json,
				headers: [] as unknown as import("@/lib/database.types").Json,
				autor_original: "WhisperX Large v3",
				fecha_original: new Date().toISOString(),
			});

		if (mdInsertError) {
			console.error(
				"🎙️ [transcribirAudio] ⚠️ Error insertando markdown (no bloqueante):",
				mdInsertError,
			);
		}

		// (9) Actualizar estado a 'ingresado' (listo para metabolización)
		const { error: updateError } = await supabase
			.from("cgt_artefactos")
			.update({
				estado: "ingresado",
				descripcion: `Audio transcrito con WhisperX: ${transcriptionData.transcription?.substring(0, 100) ?? "Sin transcripción"}${(transcriptionData.transcription?.length ?? 0) > 100 ? "..." : ""}`,
				updated_at: new Date().toISOString(),
			})
			.eq("id", artefactoId);

		if (updateError) {
			console.error(
				"🎙️ [transcribirAudio] ⚠️ Error actualizando estado:",
				updateError,
			);
		}

		console.log(
			`🎙️ [transcribirAudio] ✅ Audio transcrito, listo para metabolización: ${artefactoId}`,
		);

		// Invalidar cache para que el frontend vea la transcripción
		revalidatePath(`/cognetica/${artefactoId}`);
		revalidatePath("/cognetica");

		return ok(void 0);
	} catch (error) {
		console.error("🎙️ [transcribirAudio] ❌ Error:", error);

		// Actualizar estado a error
		try {
			await supabase
				.from("cgt_artefactos")
				.update({
					estado: "error",
					error_mensaje:
						error instanceof Error
							? error.message
							: "Error desconocido en transcripción",
					updated_at: new Date().toISOString(),
				})
				.eq("id", artefactoId);
		} catch (e) {
			console.error(
				"🎙️ [transcribirAudio] ⚠️ Error marcando fallo:",
				e,
			);
		}

		return fail("TRANSCRIPTION_ERROR");
	}
}

/**
 * Transcribe un artefacto de video.
 *
 * Similar a `transcribirAudio` pero:
 *   - Extrae pista de audio del video antes de enviar a WhisperX
 *   - Persiste en cgt_artefactos_video + cgt_video_segmentos
 *   - Extracción de frames clave NO se hace en Oleada 1 (Oleada 1.5)
 */
export async function transcribirVideo(
	artefactoId: string,
): Promise<Result<CgtVideoSegmento[]>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

// =============================================================================
// PROCESAMIENTO PDF
// =============================================================================

/**
 * Procesa un PDF de presentación (slides).
 *
 * Flujo:
 *   1. Descarga PDF desde Storage
 *   2. Divide PDF en páginas individuales con splitPDFIntoPagesV2
 *   3. Procesa cada página con Marker (en batches de 3)
 *   4. Construye JSONB paginas en cgt_artefactos_pdf_slides
 *   5. Actualiza estado del artefacto
 *   6. Retorna éxito
 *
 * Nota: a diferencia de procesarPdfInforme, este procesamiento es más
 * complejo porque primero debe dividir el PDF en páginas individuales
 * y luego procesar cada una con Marker.
 */
export async function procesarPdfSlides(
	artefactoId: string,
	fileBuffer: Buffer,
	storagePath: string,
): Promise<Result<void>> {
	console.log(`📗 [procesarPdfSlides] Iniciando para artefacto: ${artefactoId}`);

	const supabase = await createServerClient();

	try {
		// (1) Split PDF en páginas individuales
		console.log(`📗 [procesarPdfSlides] Dividiendo PDF en páginas...`);
		const { splitPDFIntoPagesV2 } = await import(
			"@/lib/actions/cognetica-forense-slides-actions"
		);
		const splitResult = await splitPDFIntoPagesV2(artefactoId, storagePath);
		if (!splitResult.success) {
			throw new Error(`Error dividiendo PDF: ${splitResult.error}`);
		}
		console.log(`📗 [procesarPdfSlides] PDF dividido en ${splitResult.data.totalPages} páginas`);

		// (2) Procesar todas las páginas con Marker
		console.log(`📗 [procesarPdfSlides] Procesando páginas con Marker...`);
		const { procesarTodasLasPaginas } = await import(
			"@/lib/actions/cognetica-forense-slides-actions"
		);
		const batchResult = await procesarTodasLasPaginas(artefactoId);
		if (!batchResult.success) {
			throw new Error(`Error procesando páginas: ${batchResult.error}`);
		}
		console.log(
			`📗 [procesarPdfSlides] Procesamiento completado: ${batchResult.data.processed} OK, ${batchResult.data.failed} FAIL`,
		);

		// (3) Invalidar cache para que el frontend vea el contenido
		const { revalidatePath } = await import("next/cache");
		revalidatePath(`/cognetica/${artefactoId}`);
		revalidatePath("/cognetica");

		console.log(`📗 [procesarPdfSlides] ✅ Procesamiento completo: ${artefactoId}`);
		return ok(void 0);
	} catch (error) {
		console.error(`📗 [procesarPdfSlides] ❌ Error:`, error);

		try {
			await supabase
				.from("cgt_artefactos")
				.update({
					estado: "error",
					error_mensaje:
						error instanceof Error ? error.message : "Error desconocido procesando slides",
					updated_at: new Date().toISOString(),
				})
				.eq("id", artefactoId);
		} catch (e) {
			console.error("📗 [procesarPdfSlides] ⚠️ Error marcando fallo:", e);
		}

		return fail(
			error instanceof Error ? error.message : "Error procesando PDF slides",
		);
	}
}

/**
 * Procesa un PDF de informe (paper, libro, deep research).
 *
 * Flujo:
 *   1. Valida artefacto tipo = 'pdf_informe'
 *   2. Envía PDF a API Route /api/cognetica/process-pdf
 *   3. Recibe markdown estructurado
 *   4. Parsea headers (h1-h6) → secciones JSONB
 *   5. Detecta DOI si existe en primeras páginas
 *   6. INSERT en cgt_artefactos_pdf_informe
 *   7. Actualiza estado del artefacto a 'procesado'
 *   4. Retorna éxito
 *
 * Nota: la calidad de conversión PDF→MD depende del PDF original.
 * PDFs escaneados sin OCR quedarán con texto vacío o incorrecto.
 */
export async function procesarPdfInforme(
	artefactoId: string,
	fileBuffer: Buffer,
	storagePath: string,
): Promise<Result<void>> {
	console.log(
		`📕 [procesarPdfInforme] Iniciando para artefacto: ${artefactoId}`,
	);

	const supabase = await createServerClient();

	try {
		// (1) Enviar PDF a API Route para procesamiento
		const formData = new FormData();
		formData.append(
			"file",
			new Blob([new Uint8Array(fileBuffer)], { type: "application/pdf" }),
		);
		formData.append("mode", "balanced");

		const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const response = await fetch(`${apiUrl}/api/cognetica/process-pdf`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `Error en API de procesamiento: ${response.status}`,
			);
		}

		const { markdown, metadata } = (await response.json()) as {
			markdown: string;
			metadata: { title: string; originalFileName: string; fileSize: number };
		};

		console.log(
			`📕 [procesarPdfInforme] Markdown recibido: ${markdown.length} caracteres`,
		);

		// Sanitizar el markdown crudo de Marker antes de guardarlo en DB.
		// Esto previene backtracking catastrófico en el renderizado de inline markdown.
		const { sanitizeMarkdown } = await import(
			"@/lib/cognetica-forense/markdown-sanitizer"
		);
		const markdownSanitizado = sanitizeMarkdown(markdown);

		// (2) Parsear markdown sanitizado (igual que ingesta de MD nativo)
		const { parseMarkdownArtefacto } = await import(
			"@/lib/cognetica-forense/parsers/markdown"
		);
		const parsed = parseMarkdownArtefacto(markdownSanitizado);

		// (3) Parsear secciones (headers h1-h6) para tabla pdf_informe
		const secciones = parsearSecciones(markdownSanitizado);

		// (4) Detectar DOI en primeras 2000 caracteres
		const doi = detectarDOI(markdownSanitizado);

		// (5) INSERT en cgt_artefactos_pdf_informe (registro del procesamiento)
		const { error: pdfInsertError } = await supabase
			.from("cgt_artefactos_pdf_informe")
			.insert({
				artefacto_id: artefactoId,
				markdown_renderizado: markdownSanitizado,
				num_paginas: null,
				secciones: secciones as unknown as import("@/lib/database.types").Json,
				autor_original: parsed.autor_original,
				fecha_original: parsed.fecha_original,
				doi,
				citas_bibliograficas: null,
			});

		if (pdfInsertError) {
			throw new Error(
				`Error insertando en cgt_artefactos_pdf_informe: ${pdfInsertError.message}`,
			);
		}

		// (6) INSERT en cgt_artefactos_markdown (contenido parseado para metabolización)
		// Esto permite que el PDF se comporte como un MD nativo en el pipeline
		const { error: mdInsertError } = await supabase
			.from("cgt_artefactos_markdown")
			.insert({
				artefacto_id: artefactoId,
				contenido: parsed.contenido,
				frontmatter: parsed.frontmatter as import("@/lib/database.types").Json,
				headers:
					parsed.headers as unknown as import("@/lib/database.types").Json,
				autor_original: parsed.autor_original,
				fecha_original: parsed.fecha_original,
			});

		if (mdInsertError) {
			console.error(
				"📕 [procesarPdfInforme] ⚠️ Error insertando en cgt_artefactos_markdown:",
				mdInsertError,
			);
			// Continuamos - el PDF está procesado aunque no se pueda metabolizar
		}

		// (7) Actualizar estado a "ingresado" (listo para metabolización)
		// El artefacto ahora tiene contenido markdown disponible
		const { error: updateError } = await supabase
			.from("cgt_artefactos")
			.update({
				estado: "ingresado",
				descripcion: `PDF procesado por Marker: ${metadata.title || metadata.originalFileName}`,
				updated_at: new Date().toISOString(),
			})
			.eq("id", artefactoId);

		if (updateError) {
			console.error(
				`📕 [procesarPdfInforme] ⚠️ Error actualizando estado: ${updateError.message}`,
			);
		}

		console.log(
			`📕 [procesarPdfInforme] ✅ PDF procesado, listo para metabolización: ${artefactoId}`,
		);

		// Invalidar cache para que el frontend vea el contenido
		revalidatePath(`/cognetica/${artefactoId}`);
		revalidatePath("/cognetica");

		return ok(void 0);
	} catch (error) {
		console.error(`📕 [procesarPdfInforme] ❌ Error:`, error);

		// Actualizar estado a error (ignorar error de update)
		try {
			await supabase
				.from("cgt_artefactos")
				.update({
					estado: "error",
					error_mensaje:
						error instanceof Error ? error.message : "Error desconocido",
					updated_at: new Date().toISOString(),
				})
				.eq("id", artefactoId);
		} catch (e) {
			console.error("📕 [procesarPdfInforme] ⚠️ Error marcando fallo:", e);
		}

		return fail(
			error instanceof Error ? error.message : "Error procesando PDF informe",
		);
	}
}

/**
 * Parsea headers del markdown para extraer secciones estructuradas.
 */
function parsearSecciones(markdown: string): Array<{
	titulo: string;
	nivel: number;
	inicio_char: number;
	fin_char: number;
}> {
	const secciones: Array<{
		titulo: string;
		nivel: number;
		inicio_char: number;
		fin_char: number;
	}> = [];

	// Regex para detectar headers (# ## ### etc)
	const headerRegex = /^(#{1,6})\s+(.+)$/gm;
	let match;

	while ((match = headerRegex.exec(markdown)) !== null) {
		const nivel = match[1].length; // Cantidad de #
		const titulo = match[2].trim();
		const inicio_char = match.index;

		secciones.push({
			titulo,
			nivel,
			inicio_char,
			fin_char: -1, // Se calculará después
		});
	}

	// Calcular fin_char basado en el inicio del siguiente header
	for (let i = 0; i < secciones.length - 1; i++) {
		secciones[i].fin_char = secciones[i + 1].inicio_char - 1;
	}
	// El último va hasta el final del documento
	if (secciones.length > 0) {
		secciones[secciones.length - 1].fin_char = markdown.length;
	}

	return secciones;
}

/**
 * Detecta DOI en el texto (primeros 2000 caracteres).
 */
function detectarDOI(text: string): string | null {
	const primerosChars = text.slice(0, 2000);
	// Patrones comunes de DOI
	const doiPatterns = [
		/doi:\s*(10\.\d{4,}\/[^\s]+)/i,
		/10\.\d{4,}\/[^\s]+/,
		/DOI:\s*(10\.\d{4,}\/[^\s]+)/i,
	];

	for (const pattern of doiPatterns) {
		const match = primerosChars.match(pattern);
		if (match) {
			return match[1] || match[0];
		}
	}
	return null;
}

// =============================================================================
// METABOLIZACIÓN
// =============================================================================

/**
 * Genera la Crónica de un artefacto.
 *
 * Flujo:
 *   1. Valida permisos + estado = 'ingresado' (no re-genera si ya existe)
 *   2. Obtiene contenido metabolizable del artefacto según tipo:
 *      - audio/video: transcripcion_completa
 *      - pdf_slides: concatena texto de paginas
 *      - pdf_informe: markdown_renderizado
 *      - markdown: contenido
 *      - imagen: nombre + descripcion (sin IA en Oleada 1, usará solo metadata)
 *   3. Construye prompt con `construirPromptCronica(contenido, tipo, incluirContracalibracion)`
 *   4. Llama DeepSeek vía `callDeepSeekAPI("deepseek-chat", prompt)`
 *   5. Parsea respuesta:
 *      - contenido principal (crónica)
 *      - contracalibración (si se pidió)
 *      - tokens_count estimado
 *   6. INSERT en cgt_cronicas con:
 *      - generado_por = 'llm'
 *      - nodo_generador = 'spectris'
 *      - modelo_ia = 'deepseek-chat'
 *      - version_esquema = 'v0.2'
 *      - tokens_input / tokens_output / costo_usd del usage
 *   7. Retorna CgtCronica creada
 *
 * Si incluirContracalibracion=true, la crónica viene con bloque adicional
 * de higiene epistémica (supuestos no examinados, evidencia débil, etc.)
 * según definido en spec v0.2 sección 4.1.
 */
export async function generarCronica(
	artefactoId: string,
	incluirContracalibracion = false,
): Promise<Result<CgtCronica>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Genera el Destilado de un artefacto.
 *
 * Flujo:
 *   1. Valida permisos + que exista la Crónica (requerida como contexto)
 *   2. Construye prompt con:
 *      - Contenido original del artefacto
 *      - Crónica como contexto de referencia narrativa
 *   3. Llama DeepSeek
 *   4. Parsea respuesta que debe venir en estructura:
 *      - tesis: string
 *      - movimientos: Array (3-5)
 *      - tensiones: Array (1-2)
 *      - cita_nucleo: {texto, ubicacion, autor?}
 *   5. Valida que tokens_count <= 1500 (hard cap). Si excede, RE-GENERA con
 *      prompt que pida más compresión. Máximo 2 reintentos. Si sigue largo,
 *      retorna error.
 *   6. INSERT en cgt_destilados
 *   7. Retorna CgtDestilado
 */
export async function generarDestilado(
	artefactoId: string,
): Promise<Result<CgtDestilado>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Genera el Germinal PARCIAL de un artefacto (Oleada 1).
 *
 * En Oleada 1, Germinal es parcial:
 *   - Se genera el contenedor con resumen narrativo
 *   - Se captura contexto_snapshot
 *   - Capa A (resonancias) y Capa B (proyecciones) NO se pueblan aquí
 *     (se difieren a Oleada 2 con sus tablas propias)
 *
 * Flujo:
 *   1. Valida que exista Destilado
 *   2. Valida umbral: ≥ 3 artefactos previos con Destilado en el mismo proyecto
 *   3. Si no cumple umbral: INSERT cgt_germinales con resumen = null + nota,
 *      contadores en 0. Retorna éxito con flag "germinal_omitido".
 *   4. Si cumple:
 *      - Consulta destilados previos del proyecto
 *      - Construye contexto_snapshot con UUIDs de destilados consultados
 *      - Llama DeepSeek con prompt de germinal parcial:
 *        "describe narrativamente qué germina de la conversación entre
 *         este artefacto y el corpus previo, SIN estructurar resonancias
 *         ni proyecciones formales"
 *      - Recibe resumen narrativo
 *   5. INSERT en cgt_germinales con num_* = 0 (se poblarán en Oleada 2)
 *   6. Retorna CgtGerminal
 */
export async function generarGerminalParcial(
	artefactoId: string,
): Promise<Result<CgtGerminal>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Regenera un formato específico de un artefacto (sobreescribe el anterior).
 *
 * Útil cuando:
 *   - Usuario considera que el resultado no es bueno
 *   - Se actualizó el prompt (nuevo version_esquema)
 *   - Hubo error transitorio en generación previa
 *
 * Flujo:
 *   1. Valida permisos
 *   2. DELETE formato existente si hay
 *   3. Llama a generar{Formato}(artefactoId)
 *   4. Retorna éxito
 *
 * Para germinal, si hay datos de Oleada 2 (resonancias, proyecciones),
 * esta regeneración NO los borra — solo el contenedor germinal.
 * (En Oleada 1 esto no aplica porque esas tablas aún no existen.)
 */
export async function regenerarFormato(
	artefactoId: string,
	formato: "cronica" | "destilado" | "germinal",
): Promise<Result<void>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

// =============================================================================
// GRUPOS
// =============================================================================

/**
 * Crea un grupo de artefactos.
 *
 * Flujo:
 *   1. Valida permisos sobre el proyecto
 *   2. INSERT en cgt_grupos_artefactos
 *   3. Retorna grupo creado
 */
export async function crearGrupo(
	input: CrearGrupoInput,
): Promise<Result<CgtGrupoArtefactos>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Asigna un artefacto existente a un grupo.
 *
 * Si el artefacto ya pertenece a otro grupo, se reemplaza silenciosamente
 * (un artefacto pertenece a 0 o 1 grupo).
 *
 * Flujo:
 *   1. Valida permisos sobre ambos (artefacto y grupo del mismo proyecto)
 *   2. UPDATE cgt_artefactos SET grupo_id = grupoId
 *   3. Retorna éxito
 */
export async function agregarArtefactoAGrupo(
	artefactoId: string,
	grupoId: string,
): Promise<Result<void>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Remueve un artefacto de su grupo actual (lo deja sin grupo).
 */
export async function removerArtefactoDeGrupo(
	artefactoId: string,
): Promise<Result<void>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Genera el germinal de un grupo completo (pseudo-artefacto conjunto).
 *
 * Flujo:
 *   1. Valida permisos
 *   2. Obtiene todos los destilados de los artefactos del grupo
 *   3. Si hay < 2 artefactos con destilado: retorna error
 *      "Se necesitan al menos 2 artefactos con destilado para generar
 *       un germinal de grupo"
 *   4. Construye prompt que pide germinal narrativo sobre la unidad-grupo
 *      y su resonancia con el corpus del proyecto
 *   5. Llama DeepSeek
 *   6. INSERT en cgt_germinales con grupo_id poblado (artefacto_id = null)
 *   7. Retorna germinal
 */
export async function generarGerminalDeGrupo(
	grupoId: string,
): Promise<Result<CgtGerminal>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

// =============================================================================
// CONSULTA
// =============================================================================

/**
 * Lista artefactos de un proyecto con filtros.
 *
 * Aplica los filtros de `FiltrosArtefacto`. Si no se provee filtro,
 * retorna todos los artefactos del proyecto ordenados por created_at desc,
 * con límite por defecto de 50.
 *
 * Búsqueda por texto: usa índices GIN full-text sobre:
 *   - cgt_artefactos.titulo, descripcion
 *   - cgt_cronicas.contenido
 *   - cgt_destilados.tesis
 *   - cgt_artefactos_markdown.contenido
 *   - cgt_artefactos_pdf_informe.markdown_renderizado
 *   - cgt_audio_segmentos.texto
 */
export async function listarArtefactosDeProyecto(
	projectId: string,
	filtros: FiltrosArtefacto = {},
): Promise<Result<CgtArtefacto[]>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Obtiene un artefacto con toda su información relacionada.
 *
 * Incluye:
 *   - Artefacto base
 *   - Extensión específica por tipo
 *   - Segmentos si audio/video
 *   - Imágenes descritas si aplica
 *   - Crónica, destilado, germinal
 *   - Grupo si pertenece a uno
 *
 * Valida permisos (usuario tiene acceso al proyecto).
 */
export async function obtenerArtefactoCompleto(
	artefactoId: string,
): Promise<Result<ArtefactoCompleto>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

/**
 * Lista grupos de un proyecto con conteo de artefactos por grupo.
 */
export async function listarGruposDeProyecto(
	projectId: string,
): Promise<Result<Array<CgtGrupoArtefactos & { num_artefactos: number }>>> {
	// TODO: Windsurf implementa
	throw new Error("Not implemented");
}

// =============================================================================
// UTILIDADES INTERNAS (no-exportadas, referencia)
// =============================================================================

/**
 * Valida que el usuario autenticado tenga acceso al proyecto.
 * Acceso se determina por owner_id o lead_researcher_user_id de projects.
 *
 * Retorna el user_id si tiene acceso, o error si no.
 */
// async function validarAccesoProyecto(projectId: string): Promise<Result<string>>

/**
 * Construye la tríada canónica (JSON + YAML + MD) para un artefacto.
 * El JSON es determinístico (keys ordenadas) para que el hash sea reproducible.
 *
 * La lógica de serialización canónica vive en
 * `/lib/cognetica-forense/utils/json-canonical.ts`.
 */
// async function construirTriada(
//   artefacto: CgtArtefacto,
//   contenidoEstructurado: unknown
// ): Promise<{ md: string; yaml: string; json: string; sha256: string }>

/**
 * Dispara el flujo completo de metabolización en background.
 * No bloquea el retorno al cliente.
 */
// async function dispararMetabolizacion(artefactoId: string): Promise<void>

/**
 * Obtiene una URL firmada para descargar un archivo de Supabase Storage.
 * Útil para reproducir audio/video directamente en el navegador.
 */
export async function obtenerUrlFirmadaStorage(
	path: string,
	bucket: string = "cognetica-files",
): Promise<Result<string>> {
	const supabase = await createServerClient();

	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrl(path, 3600); // 1 hora

	if (error || !data?.signedUrl) {
		console.error("[obtenerUrlFirmadaStorage] Error:", error);
		return fail("STORAGE_ERROR");
	}

	return ok(data.signedUrl);
}
