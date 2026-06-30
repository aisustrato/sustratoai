// 📍 app/api/personal/process-paper-pdf/route.ts
// API Route para procesar PDFs académicos con Replicate Marker
// Diferencias con Cognética: imágenes habilitadas, modo accurate

import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createServerSupabaseClient } from "@/app/auth/session";
import { extractImagePlaceholders } from "@/lib/papers/image-utils";

export async function POST(request: NextRequest) {
	try {
		// 1. Verificar autenticación
		const supabase = await createServerSupabaseClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "No autorizado. Debes iniciar sesión." },
				{ status: 401 },
			);
		}

		// 2. Recibir PDF del FormData
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "No se proporcionó ningún archivo" },
				{ status: 400 },
			);
		}

		// Validar que sea PDF
		if (file.type !== "application/pdf") {
			return NextResponse.json(
				{ error: "El archivo debe ser un PDF" },
				{ status: 400 },
			);
		}

		// Validar tamaño (max 50 MB)
		const maxSize = 50 * 1024 * 1024; // 50 MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "El archivo excede el tamaño máximo de 50 MB" },
				{ status: 400 },
			);
		}

		console.log(
			`📄 [ProcessPaperPDF] Procesando: ${file.name} (${file.size} bytes)`,
		);

		// 3. Verificar API token de Replicate
		const apiToken = process.env.REPLICATE_API_TOKEN;
		if (!apiToken) {
			console.error(
				"📄 [ProcessPaperPDF] ❌ REPLICATE_API_TOKEN no configurado",
			);
			return NextResponse.json(
				{
					error:
						"REPLICATE_API_TOKEN no configurado en variables de entorno",
				},
				{ status: 500 },
			);
		}

		// 4. Calcular SHA-256 del PDF para integridad
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const { createHash } = await import("crypto");
		const sha256 = createHash("sha256").update(buffer).digest("hex");

		console.log(`📄 [ProcessPaperPDF] SHA-256: ${sha256.slice(0, 16)}...`);

		// 5. Convertir a base64 data URI (requerido por Replicate)
		const base64 = buffer.toString("base64");
		const dataUri = `data:application/pdf;base64,${base64}`;

		console.log("📄 [ProcessPaperPDF] Enviando a Replicate Marker...");

		// 6. Inicializar cliente Replicate
		const replicate = new Replicate({ auth: apiToken });

		// 7. Configuración específica para papers académicos
		const input = {
			file: dataUri,
			mode: "accurate", // ← Máxima precisión para papers académicos
			use_llm: false, // No usar LLM adicional (más rápido)
			paginate: false, // No agregar números de página
			force_ocr: false, // Solo OCR si es necesario
			skip_cache: false, // Usar caché si está disponible
			format_lines: false, // No formatear líneas adicionales
			save_checkpoint: false, // No guardar checkpoints
			disable_ocr_math: false, // Habilitar OCR para ecuaciones
			include_metadata: true, // Incluir metadata del PDF
			strip_existing_ocr: false, // Mantener OCR existente
			disable_image_extraction: false, // ← HABILITADO para papers
		};

		// 8. Ejecutar procesamiento con Replicate Marker
		const output = (await replicate.run("datalab-to/marker", {
			input,
		})) as any;

		console.log("📄 [ProcessPaperPDF] ✅ Procesamiento completo");

		// 9. Extraer markdown del output
		let markdown = "";

		if (typeof output === "string") {
			markdown = output;
		} else if (output && typeof output === "object") {
			// Intentar extraer markdown de diferentes posibles estructuras
			markdown =
				output.markdown || output.text || output.content || output[0] || "";

			// Si sigue siendo un objeto, convertir a string
			if (typeof markdown !== "string") {
				markdown = JSON.stringify(markdown);
			}
		}

		if (!markdown || markdown.trim().length === 0) {
			console.error("📄 [ProcessPaperPDF] ❌ Markdown vacío");
			return NextResponse.json(
				{ error: "No se pudo extraer contenido del PDF" },
				{ status: 500 },
			);
		}

		console.log(
			`📄 [ProcessPaperPDF] Markdown extraído: ${markdown.length} caracteres`,
		);

		// 10. Detectar placeholders de imágenes en el markdown
		const imagePlaceholders = extractImagePlaceholders(markdown);

		console.log(
			`📄 [ProcessPaperPDF] Imágenes detectadas: ${imagePlaceholders.length}`,
		);

		// 11. Metadata del archivo
		const metadata = {
			title: file.name.replace(/\.pdf$/i, ""),
			originalFileName: file.name,
			fileSize: file.size,
			sha256,
			numPages: undefined, // Marker no siempre devuelve esto
			author: undefined,
			subject: undefined,
		};

		// 12. Respuesta exitosa
		return NextResponse.json({
			success: true,
			markdown,
			imagePlaceholders,
			metadata,
		});
	} catch (error) {
		console.error("📄 [ProcessPaperPDF] Error inesperado:", error);

		// Manejar errores específicos de Replicate
		if (error instanceof Error) {
			if (error.message.includes("rate limit")) {
				return NextResponse.json(
					{
						error:
							"Límite de procesamiento alcanzado. Intenta nuevamente en unos minutos.",
					},
					{ status: 429 },
				);
			}

			if (error.message.includes("timeout")) {
				return NextResponse.json(
					{
						error:
							"El procesamiento tomó demasiado tiempo. Intenta con un PDF más pequeño.",
					},
					{ status: 504 },
				);
			}
		}

		return NextResponse.json(
			{
				error: "Error procesando PDF: " + String(error),
			},
			{ status: 500 },
		);
	}
}
