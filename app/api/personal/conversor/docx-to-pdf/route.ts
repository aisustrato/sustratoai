// 📍 app/api/personal/conversor/docx-to-pdf/route.ts
//
// DOCX → PDF vía LibreOffice headless. Sin paso intermedio.

import { NextResponse } from "next/server";
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

		const docxBuffer = Buffer.from(await file.arrayBuffer());
		const { buffer, stderr } = await docxToPdf(docxBuffer);

		const outName = file.name.replace(/\.docx$/i, "") + ".pdf";

		return new NextResponse(new Uint8Array(buffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${encodeURIComponent(outName)}"`,
				"X-Soffice-Stderr": encodeURIComponent(stderr.slice(0, 2000)),
			},
		});
	} catch (err) {
		console.error("[api:docx-to-pdf]", err);
		const msg = err instanceof Error ? err.message : "Error desconocido";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
