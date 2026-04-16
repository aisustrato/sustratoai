// 📍 app/api/cognetica/process-pdf/route.ts
// API Route para procesar PDFs usando Replicate marker (datalab-to/marker)

import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		console.log(
			"📕 [API Replicate] Procesando PDF:",
			file.name,
			file.size,
			"bytes",
		);

		// Verificar API key
		const apiToken = process.env.REPLICATE_API_TOKEN;
		if (!apiToken) {
			console.error("📕 [API Replicate] ❌ REPLICATE_API_TOKEN no configurado");
			return NextResponse.json(
				{ error: "REPLICATE_API_TOKEN no configurado en variables de entorno" },
				{ status: 500 },
			);
		}

		// Inicializar cliente Replicate
		const replicate = new Replicate({ auth: apiToken });

		// Convertir archivo a base64 data URI (requerido por Replicate)
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64 = buffer.toString("base64");
		const dataUri = `data:application/pdf;base64,${base64}`;

		console.log("📕 [API Replicate] Enviando a modelo marker...");

		// Llamar a Replicate con modelo marker según documentación oficial
		// https://replicate.com/datalab-to/marker
		const input = {
			file: dataUri,
			mode: "balanced", // balanced, fast, or accurate
			use_llm: false, // No usar LLM adicional (más rápido)
			paginate: false, // No agregar números de página
			force_ocr: false, // Solo OCR si es necesario
			skip_cache: false, // Usar caché si está disponible
			format_lines: false, // No formatear líneas adicionales
			save_checkpoint: false, // No guardar checkpoints
			disable_ocr_math: false, // Habilitar OCR para ecuaciones
			include_metadata: true, // ✅ Incluir metadata del PDF
			strip_existing_ocr: false, // Mantener OCR existente
			disable_image_extraction: true, // ✅ No extraer imágenes (solo texto)
		};

		const output = (await replicate.run("datalab-to/marker", { input })) as any;

		console.log("📕 [API Replicate] ✅ Procesamiento completo");
		console.log("📕 [API Replicate] Output type:", typeof output);
		console.log("📕 [API Replicate] Output keys:", Object.keys(output || {}));
		console.log(
			"📕 [API Replicate] Output completo:",
			JSON.stringify(output).substring(0, 500),
		);

		// Marker puede devolver el markdown en diferentes formatos
		let markdown = "";

		if (typeof output === "string") {
			markdown = output;
		} else if (output && typeof output === "object") {
			// Intentar extraer markdown de diferentes posibles estructuras
			markdown =
				output.markdown || output.text || output.content || output[0] || "";

			// Si sigue siendo un objeto, convertir a string
			if (typeof markdown !== "string") {
				console.error(
					"📕 [API Replicate] ⚠️ Markdown no es string:",
					typeof markdown,
				);
				markdown = JSON.stringify(markdown);
			}
		}

		console.log(
			"📕 [API Replicate] Markdown extraído:",
			markdown.length,
			"caracteres",
		);
		console.log(
			"📕 [API Replicate] Primeros 200 chars:",
			markdown.substring(0, 200),
		);

		// Metadata básica del archivo
		const metadata = {
			numPages: null,
			title: file.name.replace(".pdf", ""),
			author: null,
			subject: null,
			originalFileName: file.name,
			fileSize: file.size,
		};

		return NextResponse.json({
			success: true,
			markdown: markdown,
			metadata: metadata,
		});
	} catch (error) {
		console.error("📕 [API] Error procesando PDF:", error);
		return NextResponse.json(
			{ error: "Error procesando PDF: " + String(error) },
			{ status: 500 },
		);
	}
}
