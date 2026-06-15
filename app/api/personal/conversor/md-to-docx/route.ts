// 📍 app/api/personal/conversor/md-to-docx/route.ts
//
// Recibe un .md (con LaTeX math y frontmatter opcional) por formData
// y devuelve el .docx generado por pandoc. Sin persistencia: el archivo
// queda transitorio en /tmp y se borra al cerrar el handler.

import { NextResponse } from "next/server";
import { mdToDocx } from "@/lib/personal/conversor/pandoc";

export const runtime = "nodejs"; // pandoc es child_process — no edge

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
		const { buffer, stderr } = await mdToDocx(markdown);

		const outName = file.name.replace(/\.md$/i, "") + ".docx";

		return new NextResponse(new Uint8Array(buffer), {
			status: 200,
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"Content-Disposition": `attachment; filename="${encodeURIComponent(outName)}"`,
				// stderr de pandoc va como header para inspección manual si algo
				// raro pasó (warnings de math, refs faltantes, etc.).
				"X-Pandoc-Stderr": encodeURIComponent(stderr.slice(0, 2000)),
			},
		});
	} catch (err) {
		console.error("[api:md-to-docx]", err);
		const msg = err instanceof Error ? err.message : "Error desconocido";
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
