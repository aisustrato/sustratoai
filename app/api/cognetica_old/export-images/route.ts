import { NextRequest, NextResponse } from "next/server";
import { listArtifactPages } from "@/lib/actions/cognetica-old-presentation-actions";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const artifactId = searchParams.get("artifactId");

		if (!artifactId) {
			return NextResponse.json(
				{ error: "artifactId es requerido" },
				{ status: 400 },
			);
		}

		console.log(`🖼️ [ExportImages] Preparando imágenes para: ${artifactId}`);

		// Obtener páginas
		const pagesResult = await listArtifactPages(artifactId);

		if (!pagesResult.success || pagesResult.data.length === 0) {
			return NextResponse.json(
				{ error: "No se encontraron páginas procesadas" },
				{ status: 404 },
			);
		}

		const supabase = await createServerClient();
		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();

		// Obtener nombre del artefacto
		const { data: artifact } = await supabase
			.from("cog_artifacts")
			.select("title")
			.eq("id", artifactId)
			.single();

		const folderName =
			artifact?.title?.replace(/[^a-z0-9]/gi, "_") ||
			`presentation_${artifactId}`;

		// Convertir cada PDF a imagen y agregar al ZIP
		for (const page of pagesResult.data) {
			if (!page.pdf_storage_path) continue;

			try {
				// Descargar PDF de la página
				const { data: pdfData, error } = await supabase.storage
					.from("cognetica-files")
					.download(page.pdf_storage_path);

				if (error || !pdfData) {
					console.warn(
						`⚠️ [ExportImages] Error descargando página ${page.pageNumber}`,
					);
					continue;
				}

				// Convertir Blob a ArrayBuffer
				const arrayBuffer = await pdfData.arrayBuffer();

				// Usar pdf-lib para renderizar a imagen
				const { PDFDocument } = await import("pdf-lib");
				const pdfDoc = await PDFDocument.load(arrayBuffer);
				const pages = pdfDoc.getPages();
				const firstPage = pages[0];

				// Obtener dimensiones
				const { width, height } = firstPage.getSize();

				// Crear canvas para renderizar (usando node-canvas o similar)
				// Por ahora, agregamos el PDF directamente al ZIP como fallback
				const filename = `pagina_${String(page.pageNumber).padStart(3, "0")}.pdf`;
				zip.file(filename, arrayBuffer);

				console.log(`✅ [ExportImages] Agregada página ${page.pageNumber}`);
			} catch (error) {
				console.error(
					`❌ [ExportImages] Error procesando página ${page.pageNumber}:`,
					error,
				);
			}
		}

		// Generar ZIP (usar uint8array en lugar de nodebuffer para Edge Runtime)
		const zipBuffer = await zip.generateAsync({ type: "uint8array" });

		console.log(
			`🎉 [ExportImages] ZIP generado: ${folderName}.zip (${zipBuffer.length} bytes)`,
		);

		// Convertir a Buffer para NextResponse
		const buffer = Buffer.from(zipBuffer);

		return new NextResponse(buffer, {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${folderName}.zip"`,
				"Content-Length": zipBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("❌ [ExportImages] Error inesperado:", error);
		return NextResponse.json(
			{ error: "Error generando ZIP de imágenes" },
			{ status: 500 },
		);
	}
}
