/**
 * Sanitizador de Markdown — versión server-compatible (sin "use client").
 *
 * Compartido por:
 *   - Server actions: `cognetica_forense_actions.ts` (sanitiza antes de guardar)
 *   - Client components: `StandardMarkdownViewer.tsx` (sanitiza antes de renderizar)
 *
 * Limpia caracteres y patrones problemáticos que pueden causar:
 *   - Backtracking catastrófico en parsers de regex (ReDoS)
 *   - Caracteres binarios en output de PDF
 *   - Markdown mal formado por extractores OCR
 */

export function sanitizeMarkdown(markdown: string): string {
	let sanitized = markdown;

	// 1. Normalizar saltos de línea (CRLF → LF)
	sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

	// 2. Eliminar caracteres de control invisibles (excepto \n y \t)
	sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

	// 3. Normalizar espacios en blanco múltiples (excepto saltos de línea)
	sanitized = sanitized.replace(/[^\S\n]+/g, " ");

	// 4. Detectar y corregir bloques de código mal cerrados
	const codeBlockMatches = sanitized.match(/```/g);
	if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
		sanitized += "\n```\n";
	}

	// 5. Limpiar comillas tipográficas problemáticas
	sanitized = sanitized.replace(/[""]/g, '"');
	sanitized = sanitized.replace(/['']/g, "'");

	// 6. Eliminar secuencias de más de 3 saltos de línea consecutivos
	sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

	// 7. Detectar y escapar asteriscos sueltos
	const lines = sanitized.split("\n");
	const cleanedLines = lines.map((line) => {
		const asteriskCount = (line.match(/\*/g) || []).length;
		if (
			asteriskCount > 0 &&
			asteriskCount % 2 !== 0 &&
			!line.trim().startsWith("*")
		) {
			return line.replace(/\*(?!\*)(?![^*]*\*)/g, "\\*");
		}
		return line;
	});
	sanitized = cleanedLines.join("\n");

	// 8. Normalizar headers con espacios inconsistentes
	sanitized = sanitized.replace(/^(#{1,6})\s{2,}(.+)$/gm, "$1 $2");
	sanitized = sanitized.replace(/^(#{1,6})([^\s#].+)$/gm, "$1 $2");

	// 9. Eliminar espacios al final de las líneas
	sanitized = sanitized.replace(/[^\S\n]+$/gm, "");

	// 10. Eliminar referencias de imágenes sin URL
	sanitized = sanitized.replace(/!\[[^\]]*\]\[[^\]]+\]/g, "");

	// 11. Eliminar imágenes con URL vacía
	sanitized = sanitized.replace(/!\[[^\]]*\]\(\s*\)/g, "");

	// 12. Sanitizar asteriscos desbalanceados
	sanitized = sanitized.replace(/\*"([^"]*)"—/g, '"$1"—');
	sanitized = sanitized.replace(/\*"([^"]*)"$/gm, '"$1"');
	sanitized = sanitized.replace(/\*\\\*/g, "**");

	// 13. Romper líneas extremadamente largas (>500 chars)
	const linesArray = sanitized.split("\n");
	const brokenLines = linesArray.map((line) => {
		if (
			line.length > 500 &&
			!line.trim().startsWith("#") &&
			!line.trim().startsWith("```")
		) {
			const decimalPattern = /(\d)\.(\d)/g;
			const placeholders: string[] = [];
			const protectedLine = line.replace(
				decimalPattern,
				(_match, before, after) => {
					const placeholder = `__DECIMAL_${placeholders.length}__`;
					placeholders.push(`${before}.${after}`);
					return placeholder;
				},
			);

			const sentences = protectedLine.match(/[^.!?]+[.!?]+\s*/g) || [
				protectedLine,
			];
			let result = "";
			let currentLine = "";

			sentences.forEach((sentence) => {
				if ((currentLine + sentence).length > 500) {
					if (currentLine) result += currentLine.trim() + "\n";
					currentLine = sentence;
				} else {
					currentLine += sentence;
				}
			});

			if (currentLine) result += currentLine.trim();

			placeholders.forEach((dec, i) => {
				result = result.replace(`__DECIMAL_${i}__`, dec);
			});

			return result;
		}
		return line;
	});
	sanitized = brokenLines.join("\n");

	// 14. Asegurar que el documento termine con un salto de línea
	if (!sanitized.endsWith("\n")) {
		sanitized += "\n";
	}

	return sanitized;
}
