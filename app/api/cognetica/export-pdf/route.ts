import { NextRequest, NextResponse } from "next/server";
import { reconstructPdfFromPages } from "@/lib/actions/cognetica-presentation-actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artifactId = searchParams.get("artifactId");

    if (!artifactId) {
      return NextResponse.json(
        { error: "artifactId es requerido" },
        { status: 400 }
      );
    }

    console.log(`📥 [ExportPDF] Iniciando reconstrucción para: ${artifactId}`);

    const result = await reconstructPdfFromPages(artifactId);

    if (!result.success) {
      console.error(`❌ [ExportPDF] Error:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const { pdfBuffer, filename } = result.data;

    console.log(`✅ [ExportPDF] PDF generado: ${filename} (${pdfBuffer.length} bytes)`);

    // Convertir Buffer a Uint8Array para NextResponse
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
    console.error("❌ [ExportPDF] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
