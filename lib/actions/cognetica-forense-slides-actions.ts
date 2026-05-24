// 📍 lib/actions/cognetica-forense-slides-actions.ts
"use server";

import { PDFDocument } from "pdf-lib";
import { createSupabaseServiceRoleClient } from "@/lib/server";
import type { CgtPaginaSlide } from "@/lib/cognetica-forense/types";
import type { Json } from "@/lib/database.types";
import { pdfToImages } from "@/app/actions/pdf-to-image";

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
// FUNCIÓN 1: Split PDF en páginas individuales (V2)
// ========================================================================

export async function splitPDFIntoPagesV2(
	artefactoId: string,
	storagePath: string,
): Promise<ResultadoOperacion<{ totalPages: number; pageIds: string[] }>> {
	const opId = `SPLIT-V2-${Math.floor(Math.random() * 10000)}`;
	console.error(`[SPLIT-V2-${opId}] Iniciando split de PDF para artefacto: ${artefactoId}`);

	try {
		const supabase = await createSupabaseServiceRoleClient();

		// 1. Descargar PDF desde Storage
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(storagePath);

		if (downloadError || !fileData) {
			return {
				success: false,
				error: `Error descargando PDF: ${downloadError?.message || "Archivo no encontrado"}`,
			};
		}

		// 2. Cargar con pdf-lib
		const pdfBuffer = await fileData.arrayBuffer();
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		const totalPages = pdfDoc.getPageCount();

		// 3. Guardar metadata de procesamiento en cgt_artefactos
		const { error: updateError } = await supabase
			.from("cgt_artefactos")
			.update({
				metadata: {
					has_pages: true,
					total_pages: totalPages,
					has_images: false,
				} as unknown as Json,
			})
			.eq("id", artefactoId);

		if (updateError) {
			console.error(`[SPLIT-V2-${opId}] Error actualizando metadata:`, updateError);
			return { success: false, error: `Error actualizando metadata: ${updateError.message}` };
		}

		// 4. Dividir PDF en páginas individuales
		const pageIds: string[] = [];

		for (let i = 0; i < totalPages; i++) {
			const pageNumber = i + 1;

			// Crear un nuevo PDF con solo esta página
			const singlePagePdf = await PDFDocument.create();
			const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
			singlePagePdf.addPage(copiedPage);
			const singlePageBuffer = await singlePagePdf.save();

			// Subir a Storage
			const pageStoragePath = `presentations/${artefactoId}/page_${pageNumber}.pdf`;
			const { error: uploadError } = await supabase.storage
				.from("cognetica-files")
				.upload(pageStoragePath, singlePageBuffer, {
					contentType: "application/pdf",
					upsert: true,
				});

			if (uploadError) {
				return {
					success: false,
					error: `Error subiendo página ${pageNumber}: ${uploadError.message}`,
				};
			}

			// Crear registro en cog_artifact_pages
			const { data: pageData, error: insertError } = await supabase
				.from("cog_artifact_pages")
				.insert({
					artifact_id: artefactoId,
					page_number: pageNumber,
					pdf_storage_path: pageStoragePath,
					status: "pending",
				})
				.select("id")
				.single();

			if (insertError || !pageData) {
				return {
					success: false,
					error: `Error creando registro de página ${pageNumber}: ${insertError?.message || "No data returned"}`,
				};
			}

			pageIds.push(pageData.id);
		}

		// 5. Generar imágenes PNG de cada página (para visor nativo)
		console.error(`[SPLIT-V2-${opId}] Generando imágenes PNG...`);
		let successCount = 0;
		try {
			const imageDataUrls = await pdfToImages(pdfBuffer, 150);
			for (let i = 0; i < imageDataUrls.length; i++) {
				const pageNumber = i + 1;
				const dataUrl = imageDataUrls[i];
				// Convertir data:image/png;base64,... a Buffer
				const base64 = dataUrl.split(",")[1];
				const imgBuffer = Buffer.from(base64, "base64");

				const imagePath = `presentations/${artefactoId}/images/page_${pageNumber}.png`;
				const { error: imgUploadError } = await supabase.storage
					.from("cognetica-files")
					.upload(imagePath, imgBuffer, {
						contentType: "image/png",
						upsert: true,
					});

				if (imgUploadError) {
					console.error(
						`[SPLIT-V2-${opId}] Error subiendo imagen página ${pageNumber}:`,
						imgUploadError,
					);
				} else {
					successCount++;
					console.error(
						`[SPLIT-V2-${opId}] Imagen página ${pageNumber} subida: ${imagePath}`,
					);
				}
			}
		} catch (imgError) {
			console.error(
				`[SPLIT-V2-${opId}] Error generando imágenes (no crítico):`,
				imgError,
			);
		}

		// 6. Marcar imágenes como generadas en metadata SOLO si todas subieron OK
		await supabase
			.from("cgt_artefactos")
			.update({
				metadata: {
					has_pages: true,
					total_pages: totalPages,
					has_images: successCount === totalPages,
					images_success_count: successCount,
				} as unknown as Json,
			})
			.eq("id", artefactoId);

		if (successCount !== totalPages) {
			console.error(
				`[SPLIT-V2-${opId}] Imágenes incompletas: ${successCount}/${totalPages} subidas correctamente`,
			);
		}

		console.error(`[SPLIT-V2-${opId}] Split completado: ${totalPages} páginas`);
		return { success: true, data: { totalPages, pageIds } };
	} catch (error) {
		console.error(`[SPLIT-V2-${opId}] Error en split:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido en split",
		};
	}
}

// ========================================================================
// FUNCIÓN 2: Procesar una página con Marker API (V2)
// ========================================================================

export async function processPageWithMarkerV2(
	pageId: string,
): Promise<ResultadoOperacion<{ markdown: string }>> {
	const opId = `MARKER-V2-${Math.floor(Math.random() * 10000)}`;
	console.log(`[${opId}] Procesando página con Marker: ${pageId}`);

	try {
		const supabase = await createSupabaseServiceRoleClient();

		// 1. Obtener información de la página
		const { data: page, error: fetchError } = await supabase
			.from("cog_artifact_pages")
			.select("pdf_storage_path, artifact_id, page_number")
			.eq("id", pageId)
			.single();

		if (fetchError || !page) {
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
			await supabase
				.from("cog_artifact_pages")
				.update({ status: "failed", error_message: "Página sin PDF storage path" })
				.eq("id", pageId);
			return { success: false, error: "Página sin PDF storage path" };
		}

		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(pdfPath);

		if (downloadError || !fileData) {
			await supabase
				.from("cog_artifact_pages")
				.update({ status: "failed", error_message: "Error descargando PDF de storage" })
				.eq("id", pageId);
			return { success: false, error: "Error descargando PDF" };
		}

		const pdfBuffer = await fileData.arrayBuffer();

		// 4. Enviar a API Route /api/cognetica/process-pdf (Marker)
		const formData = new FormData();
		formData.append("file", new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }));
		formData.append("mode", "balanced");

		const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const response = await fetch(`${apiUrl}/api/cognetica/process-pdf`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorData: { error?: string } = await response.json().catch((parseErr) => {
				console.error(
					"[cognetica-forense:slides] no se pudo parsear el JSON de error de Marker API — HTTP",
					response.status,
					parseErr,
				);
				return {};
			});
			await supabase
				.from("cog_artifact_pages")
				.update({
					status: "failed",
					error_message: errorData.error || `Marker API error: ${response.status}`,
				})
				.eq("id", pageId);
			return { success: false, error: errorData.error || `Error en Marker API: ${response.status}` };
		}

		const result = (await response.json()) as { markdown: string; metadata?: Record<string, unknown> };
		const markdown = result.markdown || "";
		const metadata = result.metadata || {};

		if (!markdown) {
			await supabase
				.from("cog_artifact_pages")
				.update({ status: "failed", error_message: "No se pudo extraer markdown" })
				.eq("id", pageId);
			return { success: false, error: "No se pudo extraer markdown" };
		}

		// 5. Guardar markdown en DB
		const { error: updateError } = await supabase
			.from("cog_artifact_pages")
			.update({
				markdown_original: markdown,
				marker_metadata: metadata as unknown as Json | null,
				status: "processed",
				processed_at: new Date().toISOString(),
			})
			.eq("id", pageId);

		if (updateError) {
			console.error(`[${opId}] Error guardando markdown:`, updateError);
			return { success: false, error: "Error guardando markdown" };
		}

		console.log(`[${opId}] Página procesada exitosamente: ${markdown.length} caracteres`);
		return { success: true, data: { markdown } };
	} catch (error) {
		console.error(`[${opId}] Error procesando página:`, error);

		const supabase = await createSupabaseServiceRoleClient();
		await supabase
			.from("cog_artifact_pages")
			.update({
				status: "failed",
				error_message: error instanceof Error ? error.message : "Error desconocido",
			})
			.eq("id", pageId);

		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 3: Listar páginas de un artefacto (V2)
// ========================================================================

export async function listArtifactPagesV2(
	artefactoId: string,
): Promise<ResultadoOperacion<PageProcessingStatus[]>> {
	try {
		const supabase = await createSupabaseServiceRoleClient();

		const { data, error } = await supabase
			.from("cog_artifact_pages")
			.select("id, page_number, status, error_message, markdown_original, pdf_storage_path")
			.eq("artifact_id", artefactoId)
			.order("page_number", { ascending: true });

		if (error) {
			return { success: false, error: `Error consultando páginas: ${error.message}` };
		}

		if (!data || data.length === 0) {
			return { success: false, error: "No se encontraron páginas" };
		}

		const pages: PageProcessingStatus[] = data.map((p) => ({
			pageId: p.id,
			pageNumber: p.page_number,
			status: p.status as PageProcessingStatus["status"],
			errorMessage: p.error_message ?? undefined,
			markdown_original: p.markdown_original ?? undefined,
			pdf_storage_path: p.pdf_storage_path ?? undefined,
		}));

		return { success: true, data: pages };
	} catch (error) {
		console.error("Error en listArtifactPagesV2:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 4: Obtener URL firmada de una página PDF (V2)
// ========================================================================

export async function getPagePdfUrlV2(
	pdfStoragePath: string,
): Promise<ResultadoOperacion<{ signedUrl: string }>> {
	try {
		const supabase = await createSupabaseServiceRoleClient();

		const { data, error } = await supabase.storage
			.from("cognetica-files")
			.createSignedUrl(pdfStoragePath, 3600); // 1 hora de validez

		if (error || !data) {
			return { success: false, error: "Error obteniendo URL del PDF" };
		}

		return { success: true, data: { signedUrl: data.signedUrl } };
	} catch (error) {
		console.error("Error en getPagePdfUrlV2:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 4b: Obtener URL firmada de imagen PNG de una página (V2)
// ========================================================================

export async function getPageImageUrlV2(
	artefactoId: string,
	pageNumber: number,
): Promise<ResultadoOperacion<{ signedUrl: string }>> {
	try {
		const supabase = await createSupabaseServiceRoleClient();
		const imagePath = `presentations/${artefactoId}/images/page_${pageNumber}.png`;

		const { data, error } = await supabase.storage
			.from("cognetica-files")
			.createSignedUrl(imagePath, 3600); // 1 hora de validez

		if (error || !data) {
			return { success: false, error: "Imagen no encontrada" };
		}

		return { success: true, data: { signedUrl: data.signedUrl } };
	} catch (error) {
		console.error("Error en getPageImageUrlV2:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 5: Reconstruir PDF completo desde páginas individuales (V2)
// ========================================================================

export async function reconstructPdfFromPagesV2(
	artefactoId: string,
): Promise<ResultadoOperacion<{ pdfBuffer: Buffer; filename: string }>> {
	const opId = `RECONSTRUCT-V2-${Math.floor(Math.random() * 10000)}`;

	try {
		const supabase = await createSupabaseServiceRoleClient();

		// 1. Obtener todas las páginas procesadas
		const pagesResult = await listArtifactPagesV2(artefactoId);
		if (!pagesResult.success || pagesResult.data.length === 0) {
			return { success: false, error: "No se encontraron páginas procesadas" };
		}

		const pages = pagesResult.data.filter((p) => p.status === "processed");
		if (pages.length === 0) {
			return { success: false, error: "No hay páginas procesadas para reconstruir" };
		}

		// 2. Fusionar páginas
		const { PDFDocument } = await import("pdf-lib");
		const mergedPdf = await PDFDocument.create();

		for (const page of pages) {
			if (!page.pdf_storage_path) continue;

			const { data: pdfData, error: downloadError } = await supabase.storage
				.from("cognetica-files")
				.download(page.pdf_storage_path);

			if (downloadError || !pdfData) {
				console.warn(`[${opId}] Error descargando página ${page.pageNumber}, saltando...`);
				continue;
			}

			const arrayBuffer = await pdfData.arrayBuffer();
			const pagePdf = await PDFDocument.load(arrayBuffer);
			const [copiedPage] = await mergedPdf.copyPages(pagePdf, [0]);
			mergedPdf.addPage(copiedPage);
		}

		const pdfBytes = await mergedPdf.save();
		const pdfBuffer = Buffer.from(pdfBytes);

		// 3. Obtener nombre del artefacto
		const { data: artifact } = await supabase
			.from("cgt_artefactos")
			.select("titulo")
			.eq("id", artefactoId)
			.single();

		const filename = artifact?.titulo
			? `${artifact.titulo.replace(/[^a-z0-9]/gi, "_")}.pdf`
			: `presentation_${artefactoId}.pdf`;

		return { success: true, data: { pdfBuffer, filename } };
	} catch (error) {
		console.error(`[${opId}] Error reconstruyendo PDF:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 6: Construir JSONB paginas para cgt_artefactos_pdf_slides
// ========================================================================

export async function buildPaginasJsonb(
	artefactoId: string,
): Promise<ResultadoOperacion<{ num_paginas: number }>> {
	try {
		const pagesResult = await listArtifactPagesV2(artefactoId);
		if (!pagesResult.success) {
			return { success: false, error: pagesResult.error };
		}

		const processedPages = pagesResult.data.filter((p) => p.status === "processed");
		if (processedPages.length === 0) {
			return { success: false, error: "No hay páginas procesadas para construir JSONB" };
		}

		const paginas: CgtPaginaSlide[] = processedPages.map((p) => ({
			numero: p.pageNumber,
			titulo: null,
			texto: p.markdown_original || "",
			notas: null,
		}));

		const supabase = await createSupabaseServiceRoleClient();
		const { error: upsertError } = await supabase
			.from("cgt_artefactos_pdf_slides")
			.upsert({
				artefacto_id: artefactoId,
				num_paginas: paginas.length,
				paginas: paginas as unknown as Json,
			}, { onConflict: "artefacto_id" });

		if (upsertError) {
			console.error("Error upserting cgt_artefactos_pdf_slides:", upsertError);
			return { success: false, error: upsertError.message };
		}

		return { success: true, data: { num_paginas: paginas.length } };
	} catch (error) {
		console.error("Error en buildPaginasJsonb:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 7: Procesar todas las páginas pendientes en batches
// ========================================================================

export async function procesarTodasLasPaginas(
	artefactoId: string,
	batchSize = 3,
): Promise<ResultadoOperacion<{ processed: number; failed: number }>> {
	const opId = `BATCH-${Math.floor(Math.random() * 10000)}`;
	console.log(`[${opId}] Procesando todas las páginas para: ${artefactoId}`);

	try {
		const pagesResult = await listArtifactPagesV2(artefactoId);
		if (!pagesResult.success) {
			return { success: false, error: pagesResult.error };
		}

		const pendingPages = pagesResult.data.filter((p) => p.status === "pending" || p.status === "failed");
		if (pendingPages.length === 0) {
			console.log(`[${opId}] No hay páginas pendientes, todas procesadas`);
			return { success: true, data: { processed: 0, failed: 0 } };
		}

		console.log(`[${opId}] ${pendingPages.length} páginas por procesar (batch de ${batchSize})`);

		let processed = 0;
		let failed = 0;

		// Procesar en batches
		for (let i = 0; i < pendingPages.length; i += batchSize) {
			const batch = pendingPages.slice(i, i + batchSize);
			console.log(`[${opId}] Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} páginas`);

			const results = await Promise.allSettled(
				batch.map((p) => processPageWithMarkerV2(p.pageId)),
			);

			for (const result of results) {
				if (result.status === "fulfilled" && result.value.success) {
					processed++;
				} else {
					failed++;
				}
			}
		}

		// Construir JSONB al finalizar
		await buildPaginasJsonb(artefactoId);

		console.log(`[${opId}] Procesamiento completo: ${processed} OK, ${failed} FAIL`);
		return { success: true, data: { processed, failed } };
	} catch (error) {
		console.error(`[${opId}] Error en procesamiento batch:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN 8: Regenerar imágenes de slides existentes
// ========================================================================

export async function regenerarImagenesSlides(
	artefactoId: string,
): Promise<ResultadoOperacion<{ successCount: number; totalPages: number }>> {
	const opId = `REGEN-IMAGES-${Math.floor(Math.random() * 10000)}`;
	console.error(`[${opId}] Iniciando regeneración de imágenes para artefacto: ${artefactoId}`);

	try {
		const supabase = await createSupabaseServiceRoleClient();

		// 1. Obtener metadata del artefacto para saber total_pages y storage_path
		const { data: artefacto, error: fetchError } = await supabase
			.from("cgt_artefactos")
			.select("metadata, storage_path_original, tipo")
			.eq("id", artefactoId)
			.single();

		if (fetchError || !artefacto) {
			return { success: false, error: "Artefacto no encontrado" };
		}

		if (artefacto.tipo !== "pdf_slides") {
			return { success: false, error: "El artefacto no es de tipo pdf_slides" };
		}

		const metadata = (artefacto.metadata as Record<string, unknown>) || {};
		const totalPages = (metadata.total_pages as number) || 0;

		if (totalPages === 0) {
			return { success: false, error: "No se encontró total_pages en la metadata" };
		}

		// 2. Descargar PDF original desde storage
		const storagePath = artefacto.storage_path_original;
		if (!storagePath) {
			return { success: false, error: "Artefacto sin storage_path_original" };
		}

		console.error(`[${opId}] Descargando PDF original desde: ${storagePath}`);
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(storagePath);

		if (downloadError || !fileData) {
			return {
				success: false,
				error: `Error descargando PDF original: ${downloadError?.message || "Archivo no encontrado"}`,
			};
		}

		const pdfBuffer = await fileData.arrayBuffer();

		// 3. Generar imágenes PNG
		console.error(`[${opId}] Generando ${totalPages} imágenes PNG...`);
		let successCount = 0;

		try {
			const imageDataUrls = await pdfToImages(pdfBuffer, 150);
			for (let i = 0; i < imageDataUrls.length; i++) {
				const pageNumber = i + 1;
				const dataUrl = imageDataUrls[i];
				const base64 = dataUrl.split(",")[1];
				const imgBuffer = Buffer.from(base64, "base64");

				const imagePath = `presentations/${artefactoId}/images/page_${pageNumber}.png`;
				const { error: imgUploadError } = await supabase.storage
					.from("cognetica-files")
					.upload(imagePath, imgBuffer, {
						contentType: "image/png",
						upsert: true,
					});

				if (imgUploadError) {
					console.error(
						`[${opId}] Error subiendo imagen página ${pageNumber}:`,
						imgUploadError,
					);
				} else {
					successCount++;
					console.error(`[${opId}] Imagen página ${pageNumber} subida: ${imagePath}`);
				}
			}
		} catch (imgError) {
			console.error(`[${opId}] Error generando imágenes:`, imgError);
			return {
				success: false,
				error: `Error generando imágenes: ${imgError instanceof Error ? imgError.message : "Error desconocido"}`,
			};
		}

		// 4. Actualizar metadata con resultado
		await supabase
			.from("cgt_artefactos")
			.update({
				metadata: {
					...metadata,
					has_images: successCount === totalPages,
					images_success_count: successCount,
					last_image_regeneration: new Date().toISOString(),
				} as unknown as Json,
			})
			.eq("id", artefactoId);

		console.error(`[${opId}] Regeneración completada: ${successCount}/${totalPages} imágenes`);

		if (successCount !== totalPages) {
			return {
				success: true,
				data: { successCount, totalPages },
			};
		}

		return { success: true, data: { successCount, totalPages } };
	} catch (error) {
		console.error(`[${opId}] Error en regeneración:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}
