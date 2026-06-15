// 📍 app/api/personal/conversor/docx-to-md/route.ts
//
// DOCX → Markdown vía pandoc. Útil para traer documentos externos al
// ecosistema MD/Obsidian.

import { NextResponse } from "next/server";
import { docxToMd } from "@/lib/personal/conversor/pandoc";

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
		const { buffer, stderr } = await docxToMd(docxBuffer);

		const outName = file.name.replace(/\.docx$/i, "") + ".md";

		return new NextResponse(new Uint8Array(buffer), {
			status: 200,
			headers: {
				"Content-Type": "text/markdown; charset=utf-8",
				"Content-Disposition": `attachment; filename="${encodeURIComponent(outName)}"`,
				"X-Pandoc-Stderr": encodeURIComponent(stderr.slice(0, 2000)),
			},
		});
	} catch (err) {
		console.error("[api:docx-to-md]", err);
		const msg = err instanceof Error ? err.message : "Error desconocido";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
