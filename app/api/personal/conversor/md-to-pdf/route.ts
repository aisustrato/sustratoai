// 📍 app/api/personal/conversor/md-to-pdf/route.ts
//
// Encadena MD → DOCX (pandoc) → PDF (libreoffice). El intermedio DOCX
// queda en memoria, no se persiste. Si falla el paso DOCX→PDF, el
// error indica probablemente que LibreOffice no está instalado.

import { NextResponse } from "next/server";
import { mdToDocx } from "@/lib/personal/conversor/pandoc";
import { docxToPdf } from "@/lib/personal/conversor/libreoffice";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");
		if (!(file instanceof File)) {
			return NextResponse.json(
				{ error: "Falta el campo 'file' o no es un archivo válido." },
				{ status: 400 },
			);
		}

		const markdown = await file.text();
		const { buffer: docxBuffer, stderr: pandocStderr } = await mdToDocx(markdown);
		const { buffer: pdfBuffer, stderr: sofficeStderr } = await docxToPdf(docxBuffer);

		const outName = file.name.replace(/\.md$/i, "") + ".pdf";

		return new NextResponse(new Uint8Array(pdfBuffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${encodeURIComponent(outName)}"`,
				"X-Pandoc-Stderr": encodeURIComponent(pandocStderr.slice(0, 1000)),
				"X-Soffice-Stderr": encodeURIComponent(sofficeStderr.slice(0, 1000)),
			},
		});
	} catch (err) {
		console.error("[api:md-to-pdf]", err);
		const msg = err instanceof Error ? err.message : "Error desconocido";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
