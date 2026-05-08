import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
	listArtifactPagesV2,
} from "@/lib/actions/cognetica-forense-slides-actions";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const artefactoId = searchParams.get("artefactoId");

		if (!artefactoId) {
			return NextResponse.json(
				{ error: "artefactoId es requerido" },
				{ status: 400 },
			);
		}

		console.log(`🖼️ [ExportSlidesZip] Preparando ZIP para: ${artefactoId}`);

		// Obtener páginas procesadas
		const pagesResult = await listArtifactPagesV2(artefactoId);

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
			.from("cgt_artefactos")
			.select("titulo")
			.eq("id", artefactoId)
			.single();

		const folderName =
			artifact?.titulo?.replace(/[^a-z0-9]/gi, "_") ||
			`presentation_${artefactoId}`;

		// Agregar cada página al ZIP
		for (const page of pagesResult.data) {
			if (!page.pdf_storage_path) continue;

			try {
				const { data: pdfData, error } = await supabase.storage
					.from("cognetica-files")
					.download(page.pdf_storage_path);

				if (error || !pdfData) {
					console.warn(
						`⚠️ [ExportSlidesZip] Error descargando página ${page.pageNumber}`,
					);
					continue;
				}

				const arrayBuffer = await pdfData.arrayBuffer();
				const filename = `pagina_${String(page.pageNumber).padStart(3, "0")}.pdf`;
				zip.file(filename, arrayBuffer);

				console.log(`✅ [ExportSlidesZip] Agregada página ${page.pageNumber}`);
			} catch (error) {
				console.error(
					`❌ [ExportSlidesZip] Error procesando página ${page.pageNumber}:`,
					error,
				);
			}
		}

		// Generar ZIP
		const zipBuffer = await zip.generateAsync({ type: "uint8array" });
		const buffer = Buffer.from(zipBuffer);

		console.log(
			`🎉 [ExportSlidesZip] ZIP generado: ${folderName}.zip (${buffer.length} bytes)`,
		);

		return new NextResponse(buffer, {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${folderName}.zip"`,
				"Content-Length": buffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("❌ [ExportSlidesZip] Error inesperado:", error);
		return NextResponse.json(
			{ error: "Error generando ZIP de láminas" },
			{ status: 500 },
		);
	}
}
