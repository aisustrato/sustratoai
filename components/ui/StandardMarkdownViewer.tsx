"use client";

// 📍 /components/ui/StandardMarkdownViewer.tsx
// 🎯 Componente para visualizar Markdown de forma amigable con acordeones para títulos
// 🔧 Reutilizable para documentos MD y PDFs convertidos a MD

import React, {
	useState,
	useMemo,
	useEffect,
	useRef,
	useCallback,
} from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { cn } from "@/lib/utils";

export interface StandardMarkdownViewerProps {
	content: string;
	className?: string;
	expandAll?: boolean;
	searchTerm?: string;
	currentMatchIndex?: number;
	onSearch?: (matches: SearchMatch[]) => void;
}

interface RenderContentOptions {
	highlightTerm?: string;
	shouldHighlight?: boolean;
}

export interface SearchMatch {
	sectionId: string;
	sectionTitle: string;
	position: number;
}

interface MarkdownSection {
	level: number;
	title: string;
	content: string;
	id: string;
}

// ========================================================================
// SANITIZADOR: Limpia caracteres y patrones problemáticos del markdown
// ========================================================================
function sanitizeMarkdown(markdown: string): string {
	let sanitized = markdown;
	const corrections: string[] = [];

	// 1. Normalizar saltos de línea (CRLF → LF)
	sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

	// 2. Eliminar caracteres de control invisibles (excepto \n y \t)
	sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

	// 3. Normalizar espacios en blanco múltiples (excepto saltos de línea)
	sanitized = sanitized.replace(/[^\S\n]+/g, " ");

	// 4. Detectar y corregir bloques de código mal cerrados
	const codeBlockMatches = sanitized.match(/```/g);
	if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
		console.warn(
			"⚠️ [Sanitizer] Bloques de código mal cerrados detectados, corrigiendo...",
		);
		sanitized += "\n```\n"; // Cerrar el bloque abierto
	}

	// 5. Limpiar comillas tipográficas problemáticas que pueden causar parsing issues
	sanitized = sanitized.replace(/[""]/g, '"');
	sanitized = sanitized.replace(/['']/g, "'");

	// 6. Eliminar secuencias de más de 3 saltos de línea consecutivos
	sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

	// 7. Detectar y escapar asteriscos sueltos que pueden romper el parsing de negritas
	// Solo si no están en pares (bold/italic)
	const lines = sanitized.split("\n");
	const cleanedLines = lines.map((line) => {
		// Contar asteriscos en la línea
		const asteriskCount = (line.match(/\*/g) || []).length;

		// Si hay número impar de asteriscos y no es un item de lista
		if (
			asteriskCount > 0 &&
			asteriskCount % 2 !== 0 &&
			!line.trim().startsWith("*")
		) {
			// Escapar asteriscos sueltos al final
			return line.replace(/\*(?!\*)(?![^*]*\*)/g, "\\*");
		}
		return line;
	});
	sanitized = cleanedLines.join("\n");

	// 8. Normalizar headers con espacios inconsistentes
	// Detectar headers con múltiples espacios para logging
	const headersWithMultipleSpaces = sanitized.match(/^#{1,6}\s{2,}.+$/gm);
	if (headersWithMultipleSpaces) {
		console.warn(
			"⚠️ [Sanitizer] Headers con espacios múltiples detectados:",
			headersWithMultipleSpaces.length,
		);
		headersWithMultipleSpaces.forEach((h) =>
			console.log("   📝", h.substring(0, 50)),
		);
	}

	// Normalizar: ## + múltiples espacios + texto → ## + un espacio + texto
	sanitized = sanitized.replace(/^(#{1,6})\s{2,}(.+)$/gm, "$1 $2");

	// Normalizar: ## + sin espacio + texto → ## + un espacio + texto
	sanitized = sanitized.replace(/^(#{1,6})([^\s#].+)$/gm, "$1 $2");

	// 9. Eliminar espacios al final de las líneas
	sanitized = sanitized.replace(/[^\S\n]+$/gm, "");

	// 10. Normalizar comillas tipográficas (previene problemas de parsing)
	const originalQuotes = sanitized;
	sanitized = sanitized.replace(/[""]/g, '"');
	sanitized = sanitized.replace(/['']/g, "'");
	if (sanitized !== originalQuotes) {
		corrections.push("Comillas tipográficas normalizadas");
	}

	// 11. Sanitizar asteriscos desbalanceados (Solo heurísticas específicas y seguras)

	// Heurística 1: * seguido de " sin cierre antes de — (em dash)
	// Caso específico: *"texto"— donde el * no tiene cierre
	const h1Matches = sanitized.match(/\*"([^"]*)"—/g);
	sanitized = sanitized.replace(/\*"([^"]*)"—/g, '"$1"—');
	if (h1Matches) {
		corrections.push(
			`Asteriscos antes de comillas+em-dash: ${h1Matches.length}`,
		);
	}

	// Heurística 2: * seguido de " sin cierre antes de fin de línea
	const h2Matches = sanitized.match(/\*"([^"]*)"$/gm);
	sanitized = sanitized.replace(/\*"([^"]*)"$/gm, '"$1"');
	if (h2Matches) {
		corrections.push(
			`Asteriscos antes de comillas al final de línea: ${h2Matches.length}`,
		);
	}

	// Heurística 3: Limpiar patrón corrupto *\* que debería ser **
	// Esto ocurre cuando se corrompe el cierre de negritas
	const h3Matches = sanitized.match(/\*\\\*/g);
	sanitized = sanitized.replace(/\*\\\*/g, "**");
	if (h3Matches) {
		corrections.push(
			`Patrones corruptos *\\* corregidos a **: ${h3Matches.length}`,
		);
	}

	// 12. Romper líneas extremadamente largas (>500 caracteres) que pueden bloquear el parser
	const linesArray = sanitized.split("\n");
	const brokenLines = linesArray.map((line) => {
		if (
			line.length > 500 &&
			!line.trim().startsWith("#") &&
			!line.trim().startsWith("```")
		) {
			// Romper en oraciones (por puntos seguidos de espacio)
			const sentences = line.match(/[^.!?]+[.!?]+\s*/g) || [line];
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

			console.log(
				`⚠️ [Sanitizer] Línea larga rota: ${line.length} → ${result.split("\n").length} líneas`,
			);
			return result;
		}
		return line;
	});
	sanitized = brokenLines.join("\n");

	// 11. Asegurar que el documento termine con un salto de línea
	if (!sanitized.endsWith("\n")) {
		sanitized += "\n";
	}

	// Log final solo si hubo correcciones
	if (corrections.length > 0) {
		console.log("🧹 [SANITIZADOR] Correcciones aplicadas:");
		corrections.forEach((c) => console.log(`   ✓ ${c}`));
	}

	return sanitized;
}

// ========================================================================
// PRE-PROCESADOR: Genera headers automáticamente si el markdown carece de estructura
// ========================================================================
function preprocessMarkdownWithHeaders(markdown: string): string {
	console.log("🔧 [Preprocessor] Verificando si el markdown tiene headers...");

	// Detectar si ya tiene headers
	const hasHeaders = /^#{1,6}\s+.+$/m.test(markdown);

	if (hasHeaders) {
		console.log(
			"✅ [Preprocessor] Markdown ya tiene headers, no se requiere pre-procesamiento",
		);
		return markdown;
	}

	console.log(
		"⚠️ [Preprocessor] Markdown SIN headers detectado, generando estructura automática...",
	);

	// Dividir en párrafos (bloques separados por líneas vacías)
	const paragraphs = markdown.split(/\n\n+/).filter((p) => p.trim().length > 0);

	if (paragraphs.length === 0) {
		return markdown;
	}

	// Generar estructura con headers
	let result = "";

	// Primer párrafo como título principal (H1)
	const firstParagraph = paragraphs[0].trim();
	const titleWords = firstParagraph.split(/\s+/).slice(0, 10).join(" ");
	result += `# ${titleWords}${titleWords.length < firstParagraph.length ? "..." : ""}\n\n`;

	// Resto de párrafos: agrupar cada 3-4 párrafos bajo un H2
	const paragraphsPerSection = 4;
	let sectionNumber = 1;

	for (let i = 0; i < paragraphs.length; i += paragraphsPerSection) {
		const sectionParagraphs = paragraphs.slice(i, i + paragraphsPerSection);

		// Generar título de sección basado en primeras palabras del primer párrafo
		const sectionFirstPara = sectionParagraphs[0].trim();
		const sectionTitle = sectionFirstPara.split(/\s+/).slice(0, 6).join(" ");

		result += `## ${sectionTitle}${sectionTitle.length < sectionFirstPara.length ? "..." : ""}\n\n`;

		// Agregar párrafos de esta sección
		result += sectionParagraphs.join("\n\n") + "\n\n";

		sectionNumber++;
	}

	console.log(
		`✅ [Preprocessor] Estructura generada: 1 H1 + ${sectionNumber - 1} secciones H2`,
	);

	return result;
}

// Parser simple de Markdown a secciones con acordeones
function parseMarkdownToSections(markdown: string): MarkdownSection[] {
	// ✅ PASO 1: SANITIZAR - Limpiar caracteres y patrones problemáticos
	const sanitizedMarkdown = sanitizeMarkdown(markdown);

	// ✅ PASO 2: PRE-PROCESAR - Generar headers si no existen
	const processedMarkdown = preprocessMarkdownWithHeaders(sanitizedMarkdown);

	const lines = processedMarkdown.split("\n");

	const sections: MarkdownSection[] = [];
	let currentSection: { level: number; title: string; id: string } | null =
		null;
	let contentBuffer: string[] = [];
	let sectionCounter = 0;

	const saveCurrentSection = () => {
		if (currentSection) {
			const content = contentBuffer.join("\n").trim();
			sections.push({
				level: currentSection.level,
				title: currentSection.title,
				content: content,
				id: currentSection.id,
			});
		}
	};

	lines.forEach((line) => {
		// Detectar títulos (# ## ### etc.)
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

		if (headerMatch) {
			// Guardar sección anterior si existe
			saveCurrentSection();

			// Crear nueva sección
			const level = headerMatch[1].length;
			const title = headerMatch[2].trim();
			currentSection = {
				level,
				title,
				id: `section-${sectionCounter++}`,
			};
			contentBuffer = [];
		} else {
			// Acumular contenido
			contentBuffer.push(line);
		}
	});

	// Guardar última sección (CRÍTICO para secciones finales)
	saveCurrentSection();

	// Si no hay secciones pero hay contenido, crear una sección única SIN COLAPSABLE
	// Esto evita el problema de "Contenido" bloqueado en PDFs sin estructura
	if (sections.length === 0 && contentBuffer.length > 0) {
		sections.push({
			level: 0, // ✅ Nivel 0 = renderizar sin colapsable
			title: "", // ✅ Sin título para que no se muestre el header
			content: contentBuffer.join("\n").trim(),
			id: "section-0",
		});
	}

	console.log(`📄 [Parser] ${sections.length} secciones detectadas`);
	return sections;
}

// Renderizar contenido markdown inline (negritas, cursivas, listas, etc.)
function renderMarkdownContent(
	content: string,
	options?: RenderContentOptions,
	showFullContent?: boolean,
): React.ReactNode {
	if (!content) return null;

	// Protección contra contenido muy grande que causa cuelgue de memoria
	const MAX_CONTENT_LENGTH = 20000; // Aumentado de 5000 a 20000
	const isTruncated = !showFullContent && content.length > MAX_CONTENT_LENGTH;
	const safeContent =
		isTruncated ? content.slice(0, MAX_CONTENT_LENGTH) : content;

	console.log(
		`📄 Renderizando contenido: ${safeContent.length} chars${isTruncated ? " (TRUNCADO desde " + content.length + ")" : ""}`,
	);

	if (content.length > 50000) {
		// Mostrar últimos 500 caracteres para secciones muy grandes
		const last500 = content.slice(-500);
		console.log(
			`🔍 Últimos 500 caracteres del contenido original:\n${last500}`,
		);
	}

	const lines = safeContent.split("\n");
	const elements: React.ReactNode[] = [];
	let listItems: string[] = [];
	let inList = false;
	let listType: "ul" | "ol" = "ul";
	let inTable = false;
	let tableRows: string[] = [];

	const flushList = () => {
		if (listItems.length > 0) {
			const ListTag = listType;
			elements.push(
				<ListTag
					key={`list-${elements.length}`}
					className="ml-6 my-3 space-y-1">
					{listItems.map((item, idx) => (
						<li key={idx} className="text-base leading-relaxed">
							{renderInlineMarkdown(item, options)}
						</li>
					))}
				</ListTag>,
			);
			listItems = [];
			inList = false;
		}
	};

	const flushTable = () => {
		if (tableRows.length > 0) {
			const headers = tableRows[0]
				.split("|")
				.map((h: string) => h.trim())
				.filter((h: string) => h);
			const rows = tableRows.slice(2).map((row: string) =>
				row
					.split("|")
					.map((cell: string) => cell.trim())
					.filter((cell: string) => cell),
			);

			elements.push(
				<div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
					<table className="min-w-full border-collapse border border-border">
						<thead className="bg-muted/50">
							<tr>
								{headers.map((header: string, idx: number) => (
									<th
										key={idx}
										className="border border-border px-4 py-2 text-left font-semibold text-base">
										{header}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row: string[], rowIdx: number) => (
								<tr key={rowIdx} className="hover:bg-muted/30">
									{row.map((cell: string, cellIdx: number) => (
										<td
											key={cellIdx}
											className="border border-border px-4 py-2 text-base">
											{renderInlineMarkdown(cell, options)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>,
			);
			tableRows = [];
			inTable = false;
		}
	};

	lines.forEach((line, idx) => {
		// Detectar tabla markdown
		if (line.includes("|")) {
			if (!inTable) {
				flushList();
				inTable = true;
			}
			tableRows.push(line);
			return;
		} else if (inTable) {
			flushTable();
		}

		// Lista desordenada
		if (line.match(/^\s*[-*+]\s+/)) {
			if (!inList || listType !== "ul") {
				flushList();
				inList = true;
				listType = "ul";
			}
			listItems.push(line.replace(/^\s*[-*+]\s+/, ""));
			return;
		}

		// Lista ordenada
		if (line.match(/^\s*\d+\.\s+/)) {
			if (!inList || listType !== "ol") {
				flushList();
				inList = true;
				listType = "ol";
			}
			listItems.push(line.replace(/^\s*\d+\.\s+/, ""));
			return;
		}

		// Si no es lista, flush lista anterior
		if (inList) {
			flushList();
		}

		// Línea vacía
		if (line.trim() === "") {
			elements.push(<div key={`space-${idx}`} className="h-2" />);
			return;
		}

		// Blockquote
		if (line.startsWith(">")) {
			const quoteContent = line.replace(/^>\s*/, "");
			elements.push(
				<blockquote
					key={`quote-${idx}`}
					className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3">
					{renderInlineMarkdown(quoteContent, options)}
				</blockquote>,
			);
			return;
		}

		// Código inline (línea completa con backticks)
		if (line.trim().startsWith("```")) {
			elements.push(
				<pre
					key={`code-${idx}`}
					className="bg-muted/50 p-3 rounded-md my-3 overflow-x-auto">
					<code className="text-sm font-mono">{line.replace(/```/g, "")}</code>
				</pre>,
			);
			return;
		}

		// Párrafo normal
		elements.push(
			<p key={`p-${idx}`} className="text-base leading-relaxed mb-2">
				{renderInlineMarkdown(line, options)}
			</p>,
		);
	});

	// Flush lista y tabla final si existen
	flushList();
	flushTable();

	// Agregar advertencia y botón "Ver más" si el contenido fue truncado
	if (isTruncated) {
		elements.push(
			<div
				key="truncated-warning"
				className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-md">
				<p className="text-sm text-primary font-medium mb-2">
					📚 Contenido grande ({content.length.toLocaleString()} caracteres).
					Mostrando primeros {MAX_CONTENT_LENGTH.toLocaleString()} caracteres.
				</p>
				<p className="text-xs text-muted-foreground">
					💡 Esta sección es muy extensa. Por rendimiento, se muestra
					parcialmente.
				</p>
			</div>,
		);
	}

	return <div className="space-y-1">{elements}</div>;
}

// Renderizar markdown inline (negritas, cursivas, código, enlaces)
function renderInlineMarkdown(
	text: string,
	options?: RenderContentOptions,
): React.ReactNode {
	const parts: React.ReactNode[] = [];
	let remaining = text;
	let key = 0;

	while (remaining.length > 0) {
		// Negrita (**texto** o __texto__) - Prioridad ALTA para capturar antes que cursiva
		// Usar regex que NO capture asteriscos individuales internos
		const boldMatch = remaining.match(/^\*\*([^*]+(?:\*(?!\*)[^*]+)*)\*\*/);
		if (boldMatch) {
			// Renderizar el contenido interno recursivamente para manejar cursivas anidadas
			const innerContent = boldMatch[1];
			parts.push(
				<StandardText
					key={key++}
					weight="semibold"
					colorScheme="accent"
					colorShade="textShade"
					asElement="span">
					{renderInlineMarkdown(innerContent, options)}
				</StandardText>,
			);
			remaining = remaining.slice(boldMatch[0].length);
			continue;
		}

		// Negrita con __ (alternativa)
		const boldUnderscoreMatch = remaining.match(/^__(.+?)__/);
		if (boldUnderscoreMatch) {
			parts.push(
				<StandardText
					key={key++}
					weight="semibold"
					colorScheme="accent"
					colorShade="textShade"
					asElement="span">
					{renderInlineMarkdown(boldUnderscoreMatch[1], options)}
				</StandardText>,
			);
			remaining = remaining.slice(boldUnderscoreMatch[0].length);
			continue;
		}

		// Cursiva con * (solo un asterisco, no dos)
		const italicAsteriskMatch = remaining.match(/^\*([^*]+)\*/);
		if (italicAsteriskMatch) {
			parts.push(
				<em key={key++} className="italic">
					{italicAsteriskMatch[1]}
				</em>,
			);
			remaining = remaining.slice(italicAsteriskMatch[0].length);
			continue;
		}

		// Cursiva con _ (alternativa)
		const italicUnderscoreMatch = remaining.match(/^_([^_]+)_/);
		if (italicUnderscoreMatch) {
			parts.push(
				<em key={key++} className="italic">
					{italicUnderscoreMatch[1]}
				</em>,
			);
			remaining = remaining.slice(italicUnderscoreMatch[0].length);
			continue;
		}

		// Código inline (`código`)
		const codeMatch = remaining.match(/^`(.+?)`/);
		if (codeMatch) {
			parts.push(
				<code
					key={key++}
					className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
					{codeMatch[1]}
				</code>,
			);
			remaining = remaining.slice(codeMatch[0].length);
			continue;
		}

		// Enlace ([texto](url))
		const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
		if (linkMatch) {
			parts.push(
				<a
					key={key++}
					href={linkMatch[2]}
					className="text-primary hover:underline"
					target="_blank"
					rel="noopener noreferrer">
					{linkMatch[1]}
				</a>,
			);
			remaining = remaining.slice(linkMatch[0].length);
			continue;
		}

		// Texto normal (hasta el próximo marcador)
		const nextSpecial = remaining.search(/[\*_`\[]/);
		const textChunk =
			nextSpecial === -1 ? remaining : remaining.slice(0, nextSpecial);

		// Aplicar highlight si está habilitado
		if (options?.shouldHighlight && options?.highlightTerm && textChunk) {
			parts.push(
				<span key={key++}>
					{highlightSearchTerm(textChunk, options.highlightTerm)}
				</span>,
			);
		} else {
			parts.push(<span key={key++}>{textChunk}</span>);
		}

		if (nextSpecial === -1) {
			break;
		} else {
			remaining = remaining.slice(nextSpecial);
		}
	}

	return <>{parts}</>;
}

// Función para resaltar término de búsqueda inline
function highlightSearchTerm(
	text: string,
	searchTerm: string,
): React.ReactNode {
	if (!searchTerm.trim()) return text;

	const parts: React.ReactNode[] = [];
	const lowerText = text.toLowerCase();
	const lowerSearch = searchTerm.toLowerCase();
	let lastIndex = 0;
	let matchIndex = 0;

	while (lastIndex < text.length) {
		const foundIndex = lowerText.indexOf(lowerSearch, lastIndex);

		if (foundIndex === -1) {
			// No más coincidencias, agregar resto del texto
			parts.push(
				<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>,
			);
			break;
		}

		// Agregar texto antes de la coincidencia
		if (foundIndex > lastIndex) {
			parts.push(
				<span key={`text-${lastIndex}`}>
					{text.slice(lastIndex, foundIndex)}
				</span>,
			);
		}

		// Agregar coincidencia resaltada
		const matchText = text.slice(foundIndex, foundIndex + searchTerm.length);
		parts.push(
			<mark
				key={`match-${matchIndex++}`}
				className="bg-accent/80 text-accent-foreground font-semibold rounded px-1">
				{matchText}
			</mark>,
		);

		lastIndex = foundIndex + searchTerm.length;
	}

	return <>{parts}</>;
}

// Componente de sección con acordeón
function MarkdownSection({
	section,
	forceExpanded,
	isHighlighted,
	searchTerm,
	onExpand,
}: {
	section: MarkdownSection;
	forceExpanded?: boolean;
	isHighlighted?: boolean;
	searchTerm?: string;
	onExpand?: (sectionId: string, isExpanding?: boolean) => void;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	// Responder a cambios en forceExpanded
	useEffect(() => {
		if (forceExpanded !== undefined) {
			console.log(
				`🔄 forceExpanded cambió para "${section.title}" (${section.id}): ${forceExpanded}`,
			);
			console.log(`   🔍 isExpanded actual antes del cambio: ${isExpanded}`);
			console.log(
				`   ⚠️ SOBRESCRIBIENDO isExpanded con forceExpanded: ${forceExpanded}`,
			);
			setIsExpanded(forceExpanded);
		}
	}, [forceExpanded, section.title, section.id, isExpanded]);

	// Auto-expandir si está resaltada
	useEffect(() => {
		if (isHighlighted) {
			console.log(`⭐ Auto-expandiendo sección resaltada: "${section.title}"`);
			setIsExpanded(true);
			onExpand?.(section.id);
		}
	}, [isHighlighted, section.id, onExpand, section.title]);

	// Aplicar highlight directo al contenido (estilo StandardNote)
	useEffect(() => {
		if (!contentRef.current) return;

		if (isHighlighted) {
			contentRef.current.style.setProperty(
				"background-color",
				"rgba(59, 130, 246, 0.1)",
				"important",
			);
			contentRef.current.style.setProperty(
				"border-left",
				"4px solid rgba(59, 130, 246, 0.6)",
				"important",
			);
			contentRef.current.style.setProperty("padding-left", "12px", "important");
			contentRef.current.style.setProperty("margin-left", "-16px", "important");
			contentRef.current.style.setProperty(
				"transition",
				"all 0.3s ease",
				"important",
			);
			contentRef.current.style.setProperty("border-radius", "4px", "important");
		} else {
			contentRef.current.style.removeProperty("background-color");
			contentRef.current.style.removeProperty("border-left");
			contentRef.current.style.removeProperty("padding-left");
			contentRef.current.style.removeProperty("margin-left");
			contentRef.current.style.removeProperty("transition");
			contentRef.current.style.removeProperty("border-radius");
		}
	}, [isHighlighted]);

	const levelConfig = {
		1: {
			colorScheme: "primary" as const,
			size: "xl" as const,
			gradient: true,
			weight: "bold" as const,
		},
		2: {
			colorScheme: "secondary" as const,
			size: "lg" as const,
			gradient: false,
			weight: "semibold" as const,
		},
		3: {
			colorScheme: "tertiary" as const,
			size: "base" as const,
			gradient: false,
			weight: "semibold" as const,
		},
		4: {
			colorScheme: "neutral" as const,
			size: "sm" as const,
			gradient: false,
			weight: "medium" as const,
		},
		5: {
			colorScheme: "neutral" as const,
			size: "sm" as const,
			gradient: false,
			weight: "medium" as const,
		},
		6: {
			colorScheme: "neutral" as const,
			size: "xs" as const,
			gradient: false,
			weight: "normal" as const,
		},
	};

	const config =
		levelConfig[section.level as keyof typeof levelConfig] || levelConfig[6];

	const handleToggle = () => {
		const newState = !isExpanded;
		console.log(`👆 Click manual en "${section.title}" (${section.id})`);
		console.log(`   📊 Estado actual: ${isExpanded} -> Nuevo: ${newState}`);

		setIsExpanded(newState);
		console.log(`   ✅ setIsExpanded(${newState}) ejecutado`);

		// Notificar al padre para persistir el estado manual (tanto al abrir como al cerrar)
		if (onExpand) {
			console.log(
				`   📢 Notificando al padre: onExpand(${section.id}, ${newState})`,
			);
			onExpand(section.id, newState);
		}
	};

	// ✅ Si level=0, renderizar contenido directamente SIN colapsable
	// Esto soluciona el problema de PDFs sin estructura que quedan bloqueados en "Contenido"
	if (section.level === 0) {
		return (
			<div ref={contentRef} className="py-2">
				{renderMarkdownContent(
					section.content,
					{
						highlightTerm: searchTerm,
						shouldHighlight: isHighlighted,
					},
					true,
				)}
			</div>
		);
	}

	// ✅ H1 (nivel 1): Siempre visible, SIN chevron (es el título del documento)
	if (section.level === 1) {
		return (
			<div className="border-l-2 border-primary/30 pl-0">
				<div className="py-3 px-3">
					<StandardText
						size={config.size}
						weight={config.weight}
						colorScheme={config.colorScheme}
						colorShade="text"
						applyGradient={config.gradient}
						asElement="h1"
						className="text-left">
						{section.title}
					</StandardText>
				</div>
				{/* H1 siempre muestra su contenido si existe */}
				{section.content && (
					<div ref={contentRef} className="pl-3 pr-3 pb-4 pt-2">
						{renderMarkdownContent(section.content, {
							highlightTerm: searchTerm,
							shouldHighlight: isHighlighted,
						})}
					</div>
				)}
			</div>
		);
	}

	// ✅ H2 y H3: Con chevron, colapsables
	return (
		<div
			className={cn(
				"border-l-2 transition-colors",
				section.level === 2 ? "border-secondary/30 pl-4" : "border-muted pl-6",
			)}>
			<button
				onClick={handleToggle}
				className="w-full flex items-center gap-3 py-3 px-3 hover:bg-muted/50 rounded-md transition-colors group">
				{isExpanded ?
					<ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
				:	<ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
				}
				<StandardText
					size={config.size}
					weight={config.weight}
					colorScheme={config.colorScheme}
					colorShade="text"
					applyGradient={config.gradient}
					asElement="span"
					className="flex-1 text-left">
					{section.title}
				</StandardText>
			</button>

			{isExpanded && section.content && (
				<div ref={contentRef} className="pl-9 pr-3 pb-4 pt-2">
					{renderMarkdownContent(section.content, {
						highlightTerm: searchTerm,
						shouldHighlight: isHighlighted,
					})}
				</div>
			)}
		</div>
	);
}

export function StandardMarkdownViewer({
	content,
	className,
	expandAll = false,
	searchTerm,
	currentMatchIndex,
	onSearch,
}: StandardMarkdownViewerProps) {
	// Guardar markdown sanitizado para debugging
	const [sanitizedMarkdown, setSanitizedMarkdown] = useState<string>("");

	const sections = useMemo(() => {
		const result = parseMarkdownToSections(content);
		// Guardar el markdown sanitizado para poder descargarlo
		const sanitized = sanitizeMarkdown(content);
		setSanitizedMarkdown(sanitized);
		return result;
	}, [content]);

	const [highlightedSectionId, setHighlightedSectionId] = useState<
		string | null
	>(null);
	const [cachedMatches, setCachedMatches] = useState<SearchMatch[]>([]);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(),
	);
	const [manuallyExpandedSections, setManuallyExpandedSections] = useState<
		Set<string>
	>(new Set());
	const onSearchRef = useRef(onSearch);
	const manuallyExpandedRef = useRef<Set<string>>(new Set());

	// Función para descargar markdown sanitizado
	const downloadSanitized = useCallback(() => {
		const blob = new Blob([sanitizedMarkdown], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "markdown-sanitizado.md";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [sanitizedMarkdown]);

	// Mantener refs actualizadas
	useEffect(() => {
		onSearchRef.current = onSearch;
	}, [onSearch]);

	useEffect(() => {
		manuallyExpandedRef.current = manuallyExpandedSections;
	}, [manuallyExpandedSections]);

	// Ejecutar búsqueda cuando cambia el término (solo si hay término)
	const performSearch = useCallback(
		(term: string) => {
			if (!term || !term.trim()) {
				setCachedMatches([]);
				setHighlightedSectionId(null);
				onSearchRef.current?.([]);
				return;
			}

			// Búsqueda simple con indexOf (sin regex)
			const matches: SearchMatch[] = [];
			const lowerSearch = term.toLowerCase();

			sections.forEach((section) => {
				const titlePos = section.title.toLowerCase().indexOf(lowerSearch);
				const contentPos = section.content.toLowerCase().indexOf(lowerSearch);

				if (titlePos !== -1) {
					matches.push({
						sectionId: section.id,
						sectionTitle: section.title,
						position: titlePos,
					});
				} else if (contentPos !== -1) {
					matches.push({
						sectionId: section.id,
						sectionTitle: section.title,
						position: contentPos,
					});
				}
			});

			setCachedMatches(matches);
			onSearchRef.current?.(matches);
		},
		[sections],
	);

	// Ejecutar búsqueda cuando cambia el término
	useEffect(() => {
		performSearch(searchTerm || "");
	}, [searchTerm, performSearch]);

	// Actualizar sección resaltada según índice actual
	useEffect(() => {
		if (currentMatchIndex === undefined || cachedMatches.length === 0) {
			setHighlightedSectionId(null);
			return;
		}

		if (cachedMatches[currentMatchIndex]) {
			setHighlightedSectionId(cachedMatches[currentMatchIndex].sectionId);
		}
	}, [currentMatchIndex, cachedMatches]);

	// Scroll a sección resaltada
	useEffect(() => {
		if (!highlightedSectionId) return;

		const timer = setTimeout(() => {
			const element = document.getElementById(highlightedSectionId);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [highlightedSectionId]);

	// Handler para expansión/colapso manual del usuario
	const handleManualExpand = useCallback(
		(sectionId: string, isExpanding: boolean = true) => {
			if (isExpanding) {
				console.log(`🔓 Usuario expandió manualmente: ${sectionId}`);

				setManuallyExpandedSections((prev) => {
					const newSet = new Set(prev);
					newSet.add(sectionId);
					console.log(
						`   📝 manuallyExpandedSections actualizado:`,
						Array.from(newSet),
					);
					return newSet;
				});

				setExpandedSections((prev) => {
					const newSet = new Set(prev);
					newSet.add(sectionId);
					console.log(
						`   📝 expandedSections actualizado:`,
						Array.from(newSet),
					);
					return newSet;
				});
			} else {
				console.log(`🔒 Usuario colapsó manualmente: ${sectionId}`);

				setManuallyExpandedSections((prev) => {
					const newSet = new Set(prev);
					newSet.delete(sectionId);
					console.log(
						`   📝 manuallyExpandedSections actualizado:`,
						Array.from(newSet),
					);
					return newSet;
				});

				setExpandedSections((prev) => {
					const newSet = new Set(prev);
					newSet.delete(sectionId);
					console.log(
						`   📝 expandedSections actualizado:`,
						Array.from(newSet),
					);
					return newSet;
				});
			}
		},
		[],
	);

	// Expansión secuencial por niveles
	useEffect(() => {
		console.log(`🎬 useEffect expandAll ejecutándose...`);
		console.log(`   📊 expandAll: ${expandAll}`);
		console.log(
			`   📊 manuallyExpandedRef.current.size: ${manuallyExpandedRef.current.size}`,
		);

		if (!expandAll) {
			// Si expandAll es false, mantener solo las secciones expandidas manualmente
			console.log(
				`🔒 expandAll=false - Manteniendo ${manuallyExpandedRef.current.size} secciones manuales`,
			);

			setExpandedSections((prev) => {
				const desired = new Set(manuallyExpandedRef.current);

				// Solo actualizar si hay diferencia
				if (prev.size === 0 && desired.size === 0) {
					console.log(`   ✅ Ambos vacíos, NO actualizar`);
					return prev;
				}

				const prevArray = Array.from(prev).sort();
				const desiredArray = Array.from(desired).sort();

				if (JSON.stringify(prevArray) === JSON.stringify(desiredArray)) {
					console.log(
						`   ✅ expandedSections ya está sincronizado, NO actualizar`,
					);
					return prev;
				}

				console.log(`   ⚠️ Actualizando expandedSections`);
				return desired;
			});
			return;
		}

		// Si expandAll es true, expandir todas las secciones
		console.log(`🔓 expandAll=true - Expandiendo todas las secciones`);
		const allSectionIds = sections.map((s) => s.id);
		setExpandedSections(new Set(allSectionIds));
	}, [expandAll, sections]);

	if (!content || sections.length === 0) {
		return (
			<StandardCard className={className}>
				<StandardCard.Content>
					<div className="flex items-center justify-center py-12 text-muted-foreground">
						<FileText className="w-8 h-8 mr-2" />
						<StandardText>No hay contenido para mostrar</StandardText>
					</div>
				</StandardCard.Content>
			</StandardCard>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			{/* Botón de debugging para descargar markdown sanitizado */}
			<div className="flex justify-end mb-2">
				<button
					onClick={downloadSanitized}
					className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
					title="Descargar markdown sanitizado para verificar qué cambios hizo el sanitizador">
					🔍 Descargar Markdown Sanitizado
				</button>
			</div>

			{sections.map((section, index) => {
				// H1 y H2 siempre visibles
				const isH1orH2 = section.level <= 2;

				// H3 solo visible si su H2 padre está expandido
				let isVisible = isH1orH2;
				if (section.level === 3) {
					const parentH2 = sections
						.slice(0, index)
						.reverse()
						.find((s) => s.level === 2);
					isVisible = parentH2 ? expandedSections.has(parentH2.id) : false;
				}

				if (!isVisible) return null;

				return (
					<div key={section.id} id={section.id}>
						<MarkdownSection
							section={section}
							forceExpanded={expandedSections.has(section.id)}
							isHighlighted={highlightedSectionId === section.id}
							searchTerm={searchTerm}
							onExpand={handleManualExpand}
						/>
					</div>
				);
			})}
		</div>
	);
}
