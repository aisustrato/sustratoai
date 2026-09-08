// 📍 lib/pdf-processing/marker.ts
// Extrae el contenido de un PDF a Markdown vía Replicate (modelo datalab-to/marker).
//
// Inspirado en app/api/cognetica/process-pdf/route.ts (misma técnica, mismo modelo),
// pero escrito de cero e independiente: Cognética Forense está en camino a podarse de
// la app web (ver docs/semillas-preprint/), así que esta utilidad no depende de su
// código para no heredar una fragilidad futura.

import Replicate, { FileOutput } from "replicate";

async function extractFileText(
	value: string | FileOutput | unknown,
	label: string,
): Promise<string> {
	if (typeof value === "string") {
		if (value.startsWith("http")) {
			const res = await fetch(value);
			if (!res.ok) {
				throw new Error(`No se pudo descargar ${label}: ${res.status} ${res.statusText}`);
			}
			return await res.text();
		}
		return value;
	}

	if (value instanceof ReadableStream) {
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

	if (value && typeof value === "object") {
		const fileOutput = value as FileOutput;
		if (typeof fileOutput.blob === "function") {
			const blob = await fileOutput.blob();
			return await blob.text();
		}
		if (typeof fileOutput.url === "function") {
			const url = fileOutput.url();
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`No se pudo descargar ${label}: ${res.status} ${res.statusText}`);
			}
			return await res.text();
		}
	}

	throw new Error(`${label}: tipo desconocido (${typeof value}), no se puede extraer texto`);
}

function isValidTextContent(text: string): { valid: boolean; reason: string } {
	if (text.includes("�")) {
		return { valid: false, reason: "Contiene caracteres de reemplazo Unicode (decodificación fallida)" };
	}
	const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
	if (controlChars && controlChars.length > text.length * 0.05) {
		return {
			valid: false,
			reason: `Contiene ${controlChars.length} caracteres de control (>5% del texto, posiblemente binario)`,
		};
	}
	if (text.trim().length < 100) {
		return { valid: false, reason: `Contenido demasiado corto (${text.trim().length} chars para un PDF)` };
	}
	return { valid: true, reason: "" };
}

/**
 * Extrae el contenido de un PDF a Markdown vía Replicate Marker. Tira si el
 * resultado no se puede extraer o no parece texto válido — quien llama decide
 * qué hacer con el error (acá: marcar el documento como `status: 'error'`).
 */
export async function extractMarkdownFromPdf(pdfBuffer: Buffer): Promise<string> {
	const apiToken = process.env.REPLICATE_API_TOKEN;
	if (!apiToken) {
		throw new Error("REPLICATE_API_TOKEN no configurado en variables de entorno");
	}

	const dataUri = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
	const replicate = new Replicate({ auth: apiToken });

	const input = {
		file: dataUri,
		mode: "balanced",
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

	const rawOutput = await replicate.run("datalab-to/marker", { input });

	let markdown = "";

	if (typeof rawOutput === "string") {
		markdown = await extractFileText(rawOutput, "output string");
	} else if (rawOutput instanceof ReadableStream) {
		markdown = await extractFileText(rawOutput, "output stream");
	} else if (rawOutput && typeof rawOutput === "object") {
		const obj = rawOutput as Record<string, unknown>;
		const fields = ["markdown", "text", "content"];
		let extracted = false;

		for (const field of fields) {
			const value = obj[field];
			if (value !== undefined && value !== null) {
				try {
					markdown = await extractFileText(value, `output.${field}`);
					extracted = true;
					break;
				} catch {
					// probar el siguiente campo
				}
			}
		}

		if (!extracted) {
			for (const [key, value] of Object.entries(obj)) {
				if (value === null || value === undefined) continue;
				if (typeof value === "string" || value instanceof ReadableStream || typeof value === "object") {
					try {
						markdown = await extractFileText(value, `output.${key}`);
						extracted = true;
						break;
					} catch {
						// probar el siguiente campo
					}
				}
			}
		}

		if (!extracted && Array.isArray(rawOutput) && rawOutput.length > 0) {
			markdown = await extractFileText(rawOutput[0], "output[0]");
		}
	}

	if (!markdown || markdown.trim().length === 0) {
		throw new Error("No se pudo extraer contenido del PDF");
	}

	const validation = isValidTextContent(markdown);
	if (!validation.valid) {
		throw new Error(`El output de Marker no es texto válido: ${validation.reason}`);
	}

	return markdown;
}
