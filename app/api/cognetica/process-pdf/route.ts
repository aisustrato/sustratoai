// 📍 app/api/cognetica/process-pdf/route.ts
// API Route para procesar PDFs de informe usando Replicate Marker (datalab-to/marker)

import { NextRequest, NextResponse } from "next/server";
import Replicate, { FileOutput } from "replicate";

/**
 * Lee contenido de texto de un FileOutput (ReadableStream) o URL.
 * Maneja los casos donde el SDK de Replicate v1.4+ devuelve FileOutput
 * en lugar de strings.
 */
async function extractFileText(
	value: string | FileOutput | unknown,
	label: string,
): Promise<string> {
	if (typeof value === "string") {
		// Puede ser texto directo o una URL que necesita fetch
		if (value.startsWith("http")) {
			console.log(`📕 [process-pdf] ${label} es URL, descargando...`);
			const res = await fetch(value);
			if (!res.ok) {
				throw new Error(
					`No se pudo descargar ${label}: ${res.status} ${res.statusText}`,
				);
			}
			return await res.text();
		}
		return value;
	}

	if (value instanceof ReadableStream) {
		console.log(`📕 [process-pdf] ${label} es ReadableStream, leyendo...`);
		const reader = value.getReader();
		const chunks: Uint8Array[] = [];
		while (true) {
			const { done, value: chunk } = await reader.read();
			if (done) break;
			chunks.push(chunk);
		}
		const blob = new Blob(chunks);
		return await blob.text();
	}

	// FileOutput tiene método .blob() y .url()
	if (value && typeof value === "object") {
		const fileOutput = value as FileOutput;
		if (typeof fileOutput.blob === "function") {
			console.log(`📕 [process-pdf] ${label} es FileOutput, leyendo blob...`);
			const blob = await fileOutput.blob();
			return await blob.text();
		}
		if (typeof fileOutput.url === "function") {
			console.log(`📕 [process-pdf] ${label} tiene .url(), descargando...`);
			const url = (value as FileOutput).url();
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(
					`No se pudo descargar ${label}: ${res.status} ${res.statusText}`,
				);
			}
			return await res.text();
		}
	}

	throw new Error(
		`${label}: tipo desconocido (${typeof value}), no se puede extraer texto`,
	);
}

/**
 * Valida que un string sea texto válido (no binario corrupto).
 * Detecta si hay demasiados bytes de control no imprimibles.
 */
function isValidTextContent(text: string): { valid: boolean; reason: string } {
	// Si tiene el carácter de reemplazo de Unicode (U+FFFD), hubo bytes inválidos
	if (text.includes("\ufffd")) {
		return {
			valid: false,
			reason: "Contiene caracteres de reemplazo Unicode (decodificación fallida)",
		};
	}

	// Contar caracteres de control problemáticos (excluyendo \n, \r, \t)
	const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
	if (controlChars && controlChars.length > text.length * 0.05) {
		return {
			valid: false,
			reason: `Contiene ${controlChars.length} caracteres de control (>5% del texto, posiblemente binario)`,
		};
	}

	// Si el contenido es extremadamente corto para ser un PDF procesado
	if (text.trim().length < 100) {
		return {
			valid: false,
			reason: `Contenido demasiado corto (${text.trim().length} chars para un PDF)`,
		};
	}

	return { valid: true, reason: "" };
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;
		const mode = (formData.get("mode") as string) || "balanced";

		if (!file) {
			return NextResponse.json(
				{ error: "No se proporcionó archivo" },
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
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "El archivo excede el tamaño máximo de 50 MB" },
				{ status: 400 },
			);
		}

		console.log(
			`📕 [process-pdf] Procesando PDF: ${file.name} (${file.size} bytes, modo: ${mode})`,
		);

		// Verificar API key
		const apiToken = process.env.REPLICATE_API_TOKEN;
		if (!apiToken) {
			console.error("📕 [process-pdf] ❌ REPLICATE_API_TOKEN no configurado");
			return NextResponse.json(
				{
					error:
						"REPLICATE_API_TOKEN no configurado en variables de entorno",
				},
				{ status: 500 },
			);
		}

		// Convertir archivo a base64 data URI (requerido por Replicate)
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64 = buffer.toString("base64");
		const dataUri = `data:application/pdf;base64,${base64}`;

		// Inicializar cliente Replicate
		const replicate = new Replicate({ auth: apiToken });

		// Configuración para PDF informe (texto estructurado, sin imágenes)
		const input = {
			file: dataUri,
			mode,
			use_llm: false,
			paginate: false,
			force_ocr: false,
			skip_cache: false,
			format_lines: false,
			save_checkpoint: false,
			disable_ocr_math: false,
			include_metadata: true,
			strip_existing_ocr: false,
			disable_image_extraction: true,
		};

		console.log("📕 [process-pdf] Enviando a Replicate Marker...");
		const startTime = Date.now();

		const rawOutput = await replicate.run("datalab-to/marker", { input });

		const elapsed = Date.now() - startTime;
		console.log(
			`📕 [process-pdf] ✅ Procesamiento completo en ${elapsed}ms`,
		);
		console.log(
			`📕 [process-pdf] Output type: ${typeof rawOutput}`,
		);
		if (rawOutput && typeof rawOutput === "object" && !("getReader" in rawOutput)) {
			console.log(
				`📕 [process-pdf] Output keys: ${Object.keys(rawOutput as object).join(", ")}`,
			);
		}

		// Extraer markdown del output (manejando FileOutput del SDK v1.4+)
		let markdown = "";

		if (typeof rawOutput === "string") {
			markdown = await extractFileText(rawOutput, "output string");
		} else if (rawOutput instanceof ReadableStream) {
			// Output directo como ReadableStream
			markdown = await extractFileText(rawOutput, "output stream");
		} else if (rawOutput && typeof rawOutput === "object") {
			const obj = rawOutput as Record<string, unknown>;

			// Intentar extraer markdown de los campos conocidos
			const fields = ["markdown", "text", "content"];
			let extracted = false;

			for (const field of fields) {
				const value = obj[field];
				if (value !== undefined && value !== null) {
					try {
						markdown = await extractFileText(value, `output.${field}`);
						extracted = true;
						console.log(
							`📕 [process-pdf] Extraído de campo "${field}": ${markdown.length} chars`,
						);
						break;
					} catch (err) {
						console.log(
							`📕 [process-pdf] Campo "${field}" falló: ${err instanceof Error ? err.message : String(err)}`,
						);
					}
				}
			}

			// Si todos los campos conocidos fallaron, intentar con el primer elemento
			if (!extracted) {
				// Intentar con cualquier valor del objeto
				for (const [key, value] of Object.entries(obj)) {
					if (value === null || value === undefined) continue;
					if (
						typeof value === "string" ||
						value instanceof ReadableStream ||
						typeof value === "object"
					) {
						try {
							markdown = await extractFileText(value, `output.${key}`);
							extracted = true;
							console.log(
								`📕 [process-pdf] Extraído de campo "${key}": ${markdown.length} chars`,
							);
							break;
						} catch {
							// Ignorar y continuar
						}
					}
				}
			}

			if (!extracted) {
				// Último recurso: si es array, intentar primer elemento
				if (Array.isArray(rawOutput) && rawOutput.length > 0) {
					markdown = await extractFileText(rawOutput[0], "output[0]");
				}
			}
		}

		if (!markdown || markdown.trim().length === 0) {
			console.error("📕 [process-pdf] ❌ Markdown vacío después de extracción");
			return NextResponse.json(
				{ error: "No se pudo extraer contenido del PDF" },
				{ status: 500 },
			);
		}

		// Validar que el contenido sea texto válido (no binario corrupto)
		const validation = isValidTextContent(markdown);
		if (!validation.valid) {
			console.error(
				`📕 [process-pdf] ❌ Output inválido: ${validation.reason}`,
			);
			console.error(
				`📕 [process-pdf] Primeros 200 chars del output: ${markdown.substring(0, 200)}`,
			);
			return NextResponse.json(
				{
					error: `El output de Marker no es texto válido: ${validation.reason}`,
				},
				{ status: 500 },
			);
		}

		console.log(
			`📕 [process-pdf] ✅ Markdown extraído: ${markdown.length} caracteres`,
		);
		console.log(
			`📕 [process-pdf] Primeros 200 chars: ${markdown.substring(0, 200)}`,
		);

		return NextResponse.json({
			success: true,
			markdown,
			metadata: {
				title: file.name.replace(/\.pdf$/i, ""),
				originalFileName: file.name,
				fileSize: file.size,
				mode,
			},
		});
	} catch (error) {
		console.error("📕 [process-pdf] Error:", error);

		// Manejar errores específicos
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
			{ error: "Error procesando PDF: " + String(error) },
			{ status: 500 },
		);
	}
}
