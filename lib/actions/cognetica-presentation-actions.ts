// 📍 lib/actions/cognetica-presentation-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import { PDFDocument } from "pdf-lib";

// ========================================================================
// TYPES
// ========================================================================

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export interface PageProcessingStatus {
	pageId: string;
	pageNumber: number;
	status: "pending" | "processing" | "processed" | "translated" | "failed";
	errorMessage?: string;
	markdown_original?: string;
	pdf_storage_path?: string;
}

export interface ArtifactProgress {
	totalPages: number;
	pending: number;
	processing: number;
	processed: number;
	translated: number;
	failed: number;
	completionPercentage: number;
}

// ========================================================================
// FUNCIÓN 1: Split PDF en páginas individuales
// ========================================================================

export async function splitPDFIntoPages(
	artifactId: string,
	storagePath: string,
): Promise<ResultadoOperacion<{ totalPages: number; pageIds: string[] }>> {
	const opId = `SPLIT-${Math.floor(Math.random() * 10000)}`;
	console.error(`�🔥🔥 [SPLIT-PDF-${opId}] INICIANDO SPLIT DE PDF`);
	console.error(`🔥 [SPLIT-PDF-${opId}] Artifact ID: ${artifactId}`);
	console.error(`� [SPLIT-PDF-${opId}] Storage path: ${storagePath}`);

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Descargar PDF desde Storage
		console.error(`� [SPLIT-PDF-${opId}] Descargando PDF desde Storage...`);
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(storagePath);

		if (downloadError || !fileData) {
			console.error(
				`❌ [SPLIT-PDF-${opId}] Error descargando PDF:`,
				downloadError,
			);
			return {
				success: false,
				error: `Error descargando PDF: ${downloadError?.message || "Archivo no encontrado"}`,
			};
		}

		// 2. Convertir a buffer y cargar con pdf-lib
		console.error(`� [SPLIT-PDF-${opId}] Cargando PDF en memoria...`);
		const pdfBuffer = await fileData.arrayBuffer();
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		const totalPages = pdfDoc.getPageCount();
		console.error(`� [SPLIT-PDF-${opId}] PDF tiene ${totalPages} páginas`);

		// 2. Actualizar metadata del artefacto
		const { error: updateError } = await supabase
			.from("cog_artifacts")
			.update({
				source_metadata: {
					isPresentation: true,
					processing_mode: "presentacion",
					has_pages: true,
					total_pages: totalPages,
				},
			})
			.eq("id", artifactId);

		if (updateError) {
			console.error(`❌ [${opId}] Error actualizando metadata:`, updateError);
			return {
				success: false,
				error: `Error actualizando metadata: ${updateError.message}`,
			};
		}

		// 3. Dividir PDF en páginas individuales
		const pageIds: string[] = [];

		for (let i = 0; i < totalPages; i++) {
			const pageNumber = i + 1;
			console.error(
				`� [SPLIT-PDF-${opId}] Procesando página ${pageNumber}/${totalPages}`,
			);

			// Crear un nuevo PDF con solo esta página
			const singlePagePdf = await PDFDocument.create();
			const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
			singlePagePdf.addPage(copiedPage);

			// Convertir a buffer
			const singlePageBuffer = await singlePagePdf.save();

			// Subir a Storage
			const storagePath = `presentations/${artifactId}/page_${pageNumber}.pdf`;
			const { error: uploadError } = await supabase.storage
				.from("cognetica-files")
				.upload(storagePath, singlePageBuffer, {
					contentType: "application/pdf",
					upsert: true,
				});

			if (uploadError) {
				console.error(
					`❌ [SPLIT-PDF-${opId}] Error subiendo página ${pageNumber}:`,
					uploadError,
				);
				return {
					success: false,
					error: `Error subiendo página ${pageNumber}: ${uploadError.message}`,
				};
			}

			// Crear registro en cog_artifact_pages
			console.error(
				`� [SPLIT-PDF-${opId}] Insertando página ${pageNumber} en DB...`,
			);
			const { data: pageData, error: insertError } = await supabase
				.from("cog_artifact_pages")
				.insert({
					artifact_id: artifactId,
					page_number: pageNumber,
					pdf_storage_path: storagePath,
					status: "pending",
				})
				.select("id")
				.single();

			if (insertError) {
				console.error(
					`❌ [SPLIT-PDF-${opId}] Error creando registro de página ${pageNumber}:`,
					insertError,
				);
				console.error(
					`❌ [SPLIT-PDF-${opId}] Detalles del error:`,
					JSON.stringify(insertError, null, 2),
				);
				return {
					success: false,
					error: `Error creando registro de página ${pageNumber}: ${insertError.message}`,
				};
			}

			if (!pageData) {
				console.error(
					`❌ [SPLIT-PDF-${opId}] Página ${pageNumber} insertada pero sin data retornada (posible RLS)`,
				);
				return {
					success: false,
					error: `Error: Página ${pageNumber} no retornó datos después de inserción (verificar RLS)`,
				};
			}

			console.error(
				`✅ [SPLIT-PDF-${opId}] Página ${pageNumber} insertada con ID: ${pageData.id}`,
			);
			pageIds.push(pageData.id);
		}

		// 4. Actualizar status del artefacto a 'analyzing'
		const { error: statusError } = await supabase
			.from("cog_artifacts")
			.update({ status: "analyzing" })
			.eq("id", artifactId);

		if (statusError) {
			console.error(
				`⚠️ [SPLIT-PDF-${opId}] Error actualizando status (no crítico):`,
				statusError,
			);
		}

		console.error(
			`✅✅✅ [SPLIT-PDF-${opId}] SPLIT COMPLETADO: ${totalPages} páginas creadas`,
		);
		return {
			success: true,
			data: { totalPages, pageIds },
		};
	} catch (error) {
		console.error(`❌ [${opId}] Error en split:`, error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Error desconocido en split",
		};
	}
}

// ========================================================================
// FUNCIÓN 2: Procesar una página con Marker API
// ========================================================================

export async function processPageWithMarker(
	pageId: string,
): Promise<ResultadoOperacion<{ markdown: string }>> {
	const opId = `MARKER-${Math.floor(Math.random() * 10000)}`;
	console.log(`🔍 [${opId}] Procesando página con Marker: ${pageId}`);

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener información de la página
		const { data: page, error: fetchError } = await supabase
			.from("cog_artifact_pages")
			.select("pdf_storage_path, artifact_id, page_number")
			.eq("id", pageId)
			.single();

		if (fetchError || !page) {
			console.error(`❌ [${opId}] Error obteniendo página:`, fetchError);
			return { success: false, error: "Página no encontrada" };
		}

		// 2. Actualizar estado a 'processing'
		await supabase
			.from("cog_artifact_pages")
			.update({ status: "processing" })
			.eq("id", pageId);

		// 3. Descargar PDF de la página desde Storage
		const pdfPath = page.pdf_storage_path;
		if (!pdfPath) {
			console.error(`❌ [${opId}] Página sin PDF storage path`);
			await supabase
				.from("cog_artifact_pages")
				.update({
					status: "failed",
					error_message: "Página sin PDF storage path",
				})
				.eq("id", pageId);
			return { success: false, error: "Página sin PDF storage path" };
		}

		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(pdfPath);

		if (downloadError || !fileData) {
			console.error(`❌ [${opId}] Error descargando PDF:`, downloadError);
			await supabase
				.from("cog_artifact_pages")
				.update({
					status: "failed",
					error_message: "Error descargando PDF de storage",
				})
				.eq("id", pageId);
			return { success: false, error: "Error descargando PDF" };
		}

		// 4. Convertir a buffer
		const pdfBuffer = await fileData.arrayBuffer();

		// 5. Llamar a Marker API (usando Replicate SDK)
		const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
		if (!REPLICATE_API_TOKEN) {
			throw new Error("REPLICATE_API_TOKEN no configurado");
		}

		// Importar Replicate SDK dinámicamente
		const Replicate = (await import("replicate")).default;
		const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

		// Convertir buffer a base64 para Replicate
		const base64Pdf = Buffer.from(pdfBuffer).toString("base64");
		const dataUri = `data:application/pdf;base64,${base64Pdf}`;

		console.log(`🔥 [${opId}] Enviando a Marker API (datalab-to/marker)...`);

		// Llamar a Marker con configuración optimizada
		const output = (await replicate.run("datalab-to/marker", {
			input: {
				file: dataUri,
				mode: "balanced",
				use_llm: false,
				paginate: false,
				force_ocr: false,
				skip_cache: false,
				format_lines: false,
				save_checkpoint: false,
				disable_ocr_math: false,
				include_metadata: true,
				strip_existing_ocr: false,
				disable_image_extraction: true,
			},
		})) as unknown as {
			markdown?: string;
			text?: string;
			content?: string;
			metadata?: Record<string, unknown>;
			[key: string]: unknown;
		};

		console.log(`✅ [${opId}] Marker completado, extrayendo markdown...`);

		// 6. Extraer markdown del output
		let markdown = "";
		if (typeof output === "string") {
			markdown = output;
		} else if (output && typeof output === "object") {
			markdown =
				output.markdown ||
				output.text ||
				output.content ||
				(typeof output[0] === "string" ? output[0] : "") ||
				"";
		}

		if (typeof markdown !== "string") {
			markdown = JSON.stringify(markdown);
		}

		if (!markdown) {
			console.error(`❌ [${opId}] No se pudo extraer markdown del output`);
			await supabase
				.from("cog_artifact_pages")
				.update({
					status: "failed",
					error_message: "No se pudo extraer markdown",
				})
				.eq("id", pageId);
			return { success: false, error: "No se pudo extraer markdown" };
		}

		console.log(
			`✅ [${opId}] Markdown extraído: ${markdown.length} caracteres`,
		);

		// Extraer metadata si está disponible
		const metadata =
			(output && typeof output === "object" && output.metadata) || {};

		// 7. Guardar markdown en DB
		const { error: updateError } = await supabase
			.from("cog_artifact_pages")
			.update({
				markdown_original: markdown,
				// @ts-expect-error - Tipo Json de Supabase es más restrictivo
				marker_metadata: metadata as unknown as
					| Record<string, unknown>
					| undefined,
				status: "processed",
				processed_at: new Date().toISOString(),
			})
			.eq("id", pageId);

		if (updateError) {
			console.error(`❌ [${opId}] Error guardando markdown:`, updateError);
			return { success: false, error: "Error guardando markdown" };
		}

		console.log(`✅ [${opId}] Página procesada exitosamente`);
		return { success: true, data: { markdown } };
	} catch (error) {
		console.error(`❌ [${opId}] Error procesando página:`, error);

		// Marcar como fallida
		const supabase = await createSupabaseServerClient();
		await supabase
			.from("cog_artifact_pages")
			.update({
				status: "failed",
				error_message:
					error instanceof Error ? error.message : "Error desconocido",
			})
			.eq("id", pageId);

		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 3: Obtener progreso de procesamiento
// ========================================================================

export async function getArtifactPagesProgress(
	artifactId: string,
): Promise<ResultadoOperacion<ArtifactProgress>> {
	try {
		const supabase = await createSupabaseServerClient();

		// Llamar a función SQL get_artifact_progress
		const { data, error } = await supabase.rpc("get_artifact_progress", {
			artifact_uuid: artifactId,
		});

		if (error) {
			console.error("❌ Error obteniendo progreso:", error);
			return { success: false, error: error.message };
		}

		return { success: true, data: data as unknown as ArtifactProgress };
	} catch (error) {
		console.error("❌ Error en getArtifactPagesProgress:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 4: Listar páginas de un artefacto
// ========================================================================

// ========================================================================
// FUNCIÓN: Reconstruir PDF completo desde páginas individuales
// ========================================================================

export async function reconstructPdfFromPages(
	artifactId: string,
): Promise<ResultadoOperacion<{ pdfBuffer: Buffer; filename: string }>> {
	const opId = `RECONSTRUCT-${Math.floor(Math.random() * 10000)}`;
	console.log(`🔧 [${opId}] Reconstruyendo PDF para artifact: ${artifactId}`);

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener todas las páginas procesadas
		const { data: pages, error: pagesError } = await supabase
			.from("cog_artifact_pages")
			.select("id, page_number, pdf_storage_path")
			.eq("artifact_id", artifactId)
			.eq("status", "processed")
			.order("page_number", { ascending: true });

		if (pagesError || !pages || pages.length === 0) {
			console.error(`❌ [${opId}] Error obteniendo páginas:`, pagesError);
			return { success: false, error: "No se encontraron páginas procesadas" };
		}

		console.log(
			`📄 [${opId}] Encontradas ${pages.length} páginas para reconstruir`,
		);

		// 2. Importar pdf-lib
		const { PDFDocument } = await import("pdf-lib");
		const mergedPdf = await PDFDocument.create();

		// 3. Descargar y fusionar cada página
		for (const page of pages) {
			if (!page.pdf_storage_path) {
				console.warn(
					`⚠️ [${opId}] Página ${page.page_number} sin PDF, saltando...`,
				);
				continue;
			}

			// Descargar PDF de la página desde storage
			const { data: pdfData, error: downloadError } = await supabase.storage
				.from("cognetica-files")
				.download(page.pdf_storage_path);

			if (downloadError || !pdfData) {
				console.error(
					`❌ [${opId}] Error descargando página ${page.page_number}:`,
					downloadError,
				);
				continue;
			}

			// Convertir a ArrayBuffer y cargar con pdf-lib
			const arrayBuffer = await pdfData.arrayBuffer();
			const pagePdf = await PDFDocument.load(arrayBuffer);

			// Copiar la página al PDF fusionado
			const [copiedPage] = await mergedPdf.copyPages(pagePdf, [0]);
			mergedPdf.addPage(copiedPage);

			console.log(`✅ [${opId}] Página ${page.page_number} agregada`);
		}

		// 4. Generar buffer del PDF final
		const pdfBytes = await mergedPdf.save();
		const pdfBuffer = Buffer.from(pdfBytes);

		// 5. Obtener nombre del artefacto para el archivo
		const { data: artifact } = await supabase
			.from("cog_artifacts")
			.select("title")
			.eq("id", artifactId)
			.single();

		const filename =
			artifact?.title ?
				`${artifact.title.replace(/[^a-z0-9]/gi, "_")}.pdf`
			:	`presentation_${artifactId}.pdf`;

		console.log(`🎉 [${opId}] PDF reconstruido exitosamente: ${filename}`);

		return {
			success: true,
			data: { pdfBuffer, filename },
		};
	} catch (error) {
		console.error(`❌ [${opId}] Error reconstruyendo PDF:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN: Obtener URL firmada de una página PDF
// ========================================================================

export async function getPagePdfUrl(
	pdfStoragePath: string,
): Promise<ResultadoOperacion<{ signedUrl: string }>> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase.storage
			.from("cognetica-files")
			.createSignedUrl(pdfStoragePath, 3600); // 1 hora de validez

		if (error || !data) {
			console.error("❌ [getPagePdfUrl] Error obteniendo URL firmada:", error);
			return { success: false, error: "Error obteniendo URL del PDF" };
		}

		return { success: true, data: { signedUrl: data.signedUrl } };
	} catch (error) {
		console.error("❌ Error en getPagePdfUrl:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN: Listar páginas de un artefacto
// ========================================================================

export async function listArtifactPages(
	artifactId: string,
): Promise<ResultadoOperacion<PageProcessingStatus[]>> {
	try {
		console.error(
			`🔥 [listArtifactPages] Consultando páginas para artifact: ${artifactId}`,
		);
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("cog_artifact_pages")
			.select(
				"id, page_number, status, error_message, markdown_original, pdf_storage_path",
			)
			.eq("artifact_id", artifactId)
			.order("page_number", { ascending: true });

		console.error(`🔥 [listArtifactPages] Resultado de consulta:`, {
			dataLength: data?.length || 0,
			error: error?.message || null,
			errorDetails: error ? JSON.stringify(error, null, 2) : null,
		});

		if (error) {
			console.error("❌ [listArtifactPages] Error en SELECT:", error);
			return {
				success: false,
				error: `Error consultando páginas: ${error.message}`,
			};
		}

		if (!data || data.length === 0) {
			console.error(
				"⚠️ [listArtifactPages] SELECT exitoso pero retornó 0 páginas (posible RLS bloqueando)",
			);
			return {
				success: false,
				error: "No se encontraron páginas. Posible problema de permisos (RLS)",
			};
		}

		const pages: PageProcessingStatus[] = data.map(
			(page: {
				id: string;
				page_number: number;
				status: string;
				error_message: string | null;
				markdown_original: string | null;
				pdf_storage_path: string | null;
			}) => ({
				pageId: page.id,
				pageNumber: page.page_number,
				status: page.status as PageProcessingStatus["status"],
				errorMessage: page.error_message ?? undefined,
				markdown_original: page.markdown_original ?? undefined,
				pdf_storage_path: page.pdf_storage_path ?? undefined,
			}),
		);

		return { success: true, data: pages };
	} catch (error) {
		console.error("❌ Error en listArtifactPages:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}
