// 📍 lib/utils/pdf-parser.ts
// Parsing estructurado de PDFs usando pdf.js para preservar jerarquía

import * as pdfjs from "pdfjs-dist";

// Configurar worker de pdf.js para Node.js
if (typeof window === "undefined") {
	// Server-side: usar path al worker
	pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface TextItem {
	str: string;
	height: number;
	width: number;
	transform: number[];
	hasEOL: boolean;
}

interface StructuredContent {
	type: "h1" | "h2" | "h3" | "paragraph" | "list-item" | "table-row";
	text: string;
	level?: number;
	indent?: number;
}

/**
 * Extrae texto estructurado de un PDF preservando jerarquía
 * Detecta headers por tamaño de fuente, listas por indentación
 */
export async function extractStructuredContentFromPDF(
	buffer: ArrayBuffer,
): Promise<string> {
	console.log("📄 Iniciando parsing estructurado de PDF...");

	const loadingTask = pdfjs.getDocument({ data: buffer });
	const pdf = await loadingTask.promise;

	console.log(`📊 PDF cargado: ${pdf.numPages} páginas`);

	const allContent: StructuredContent[] = [];

	// Procesar cada página
	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
		const page = await pdf.getPage(pageNum);
		const textContent = await page.getTextContent();

		console.log(`📄 Procesando página ${pageNum}/${pdf.numPages}...`);

		// Analizar items de texto para detectar estructura
		const items = textContent.items as TextItem[];

		// Detectar tamaño de fuente promedio para identificar headers
		const fontSizes = items.map((item) => item.height).filter((h) => h > 0);
		const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;

		console.log(`  📏 Tamaño fuente promedio: ${avgFontSize.toFixed(2)}px`);

		items.forEach((item, idx) => {
			const text = item.str.trim();
			if (!text) return;

			const fontSize = item.height;
			const indent = item.transform[4]; // Posición X (indentación)

			// Detectar tipo de contenido por tamaño de fuente
			if (fontSize > avgFontSize * 1.5) {
				// Header nivel 1 (título grande)
				allContent.push({ type: "h1", text, level: 1 });
			} else if (fontSize > avgFontSize * 1.2) {
				// Header nivel 2 (subtítulo)
				allContent.push({ type: "h2", text, level: 2 });
			} else if (fontSize > avgFontSize * 1.05) {
				// Header nivel 3 (sub-subtítulo)
				allContent.push({ type: "h3", text, level: 3 });
			} else if (text.match(/^[-•*]\s+/) || text.match(/^\d+\.\s+/)) {
				// Lista (detectada por bullets o números)
				allContent.push({ type: "list-item", text, indent });
			} else if (
				text.includes("\t") ||
				items[idx + 1]?.transform[4] > indent + 50
			) {
				// Posible tabla (detectada por tabs o saltos de posición)
				allContent.push({ type: "table-row", text });
			} else {
				// Párrafo normal
				allContent.push({ type: "paragraph", text, indent });
			}
		});

		// Agregar separador de página
		if (pageNum < pdf.numPages) {
			allContent.push({ type: "paragraph", text: "\n---\n" });
		}
	}

	console.log(
		`✅ Contenido estructurado extraído: ${allContent.length} elementos`,
	);

	// Convertir a Markdown
	const markdown = convertToMarkdown(allContent);

	console.log(`📝 Markdown generado: ${markdown.length} caracteres`);

	return markdown;
}

/**
 * Convierte contenido estructurado a Markdown jerárquico
 */
function convertToMarkdown(content: StructuredContent[]): string {
	const lines: string[] = [];
	let inList = false;
	let inTable = false;
	const tableRows: string[] = [];

	content.forEach((item) => {
		switch (item.type) {
			case "h1":
				if (inList) inList = false;
				if (inTable) {
					lines.push(formatTable(tableRows));
					tableRows.length = 0;
					inTable = false;
				}
				lines.push(`\n# ${item.text}\n`);
				break;

			case "h2":
				if (inList) inList = false;
				if (inTable) {
					lines.push(formatTable(tableRows));
					tableRows.length = 0;
					inTable = false;
				}
				lines.push(`\n## ${item.text}\n`);
				break;

			case "h3":
				if (inList) inList = false;
				if (inTable) {
					lines.push(formatTable(tableRows));
					tableRows.length = 0;
					inTable = false;
				}
				lines.push(`\n### ${item.text}\n`);
				break;

			case "list-item":
				if (inTable) {
					lines.push(formatTable(tableRows));
					tableRows.length = 0;
					inTable = false;
				}
				if (!inList) {
					lines.push("");
					inList = true;
				}
				// Preservar formato de lista original o normalizar
				const listText = item.text
					.replace(/^[-•*]\s+/, "- ")
					.replace(/^\d+\.\s+/, "1. ");
				lines.push(listText);
				break;

			case "table-row":
				if (inList) inList = false;
				if (!inTable) inTable = true;
				tableRows.push(item.text);
				break;

			case "paragraph":
				if (inList && item.text !== "\n---\n") inList = false;
				if (inTable && item.text !== "\n---\n") {
					lines.push(formatTable(tableRows));
					tableRows.length = 0;
					inTable = false;
				}
				lines.push(item.text);
				break;
		}
	});

	// Flush tabla final si existe
	if (inTable && tableRows.length > 0) {
		lines.push(formatTable(tableRows));
	}

	return lines.join("\n").replace(/\n{3,}/g, "\n\n"); // Limpiar líneas vacías excesivas
}

/**
 * Formatea filas de tabla como Markdown table
 */
function formatTable(rows: string[]): string {
	if (rows.length === 0) return "";

	// Intentar detectar columnas por tabs o espacios múltiples
	const cells = rows.map((row) =>
		row.split(/\t+|\s{3,}/).filter((cell) => cell.trim()),
	);

	if (cells.length === 0 || cells[0].length < 2) {
		// No es tabla válida, devolver como párrafos
		return rows.join("\n");
	}

	const numCols = Math.max(...cells.map((row) => row.length));

	// Crear tabla Markdown
	const table: string[] = [];

	// Header
	table.push("| " + cells[0].join(" | ") + " |");
	table.push("| " + Array(numCols).fill("---").join(" | ") + " |");

	// Rows
	for (let i = 1; i < cells.length; i++) {
		const row = cells[i];
		// Rellenar celdas faltantes
		while (row.length < numCols) row.push("");
		table.push("| " + row.join(" | ") + " |");
	}

	return "\n" + table.join("\n") + "\n";
}

/**
 * Extrae metadata del PDF
 */
export async function extractPDFMetadata(buffer: ArrayBuffer): Promise<{
	numPages: number;
	title?: string;
	author?: string;
	subject?: string;
	keywords?: string;
	creator?: string;
	producer?: string;
	creationDate?: string;
}> {
	const loadingTask = pdfjs.getDocument({ data: buffer });
	const pdf = await loadingTask.promise;
	const metadata = await pdf.getMetadata();

	// Tipar metadata.info correctamente
	const info = metadata.info as Record<string, string | undefined>;

	return {
		numPages: pdf.numPages,
		title: info?.Title,
		author: info?.Author,
		subject: info?.Subject,
		keywords: info?.Keywords,
		creator: info?.Creator,
		producer: info?.Producer,
		creationDate: info?.CreationDate,
	};
}
