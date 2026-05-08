import { NextRequest, NextResponse } from "next/server";
import { reconstructPdfFromPagesV2 } from "@/lib/actions/cognetica-forense-slides-actions";

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

		console.log(`📥 [ExportSlidesPdf] Reconstruyendo PDF para: ${artefactoId}`);

		const result = await reconstructPdfFromPagesV2(artefactoId);

		if (!result.success) {
			console.error(`❌ [ExportSlidesPdf] Error:`, result.error);
			return NextResponse.json(
				{ error: result.error },
				{ status: 500 },
			);
		}

		const { pdfBuffer, filename } = result.data;

		console.log(
			`✅ [ExportSlidesPdf] PDF generado: ${filename} (${pdfBuffer.length} bytes)`,
		);

		const uint8Array = new Uint8Array(pdfBuffer);

		return new NextResponse(uint8Array, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Content-Length": pdfBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("❌ [ExportSlidesPdf] Error inesperado:", error);
		return NextResponse.json(
			{ error: "Error generando PDF" },
			{ status: 500 },
		);
	}
}
