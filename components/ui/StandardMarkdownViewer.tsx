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

import { sanitizeMarkdown } from "@/lib/cognetica-forense/markdown-sanitizer";
import { renderLatexInline, renderLatexBlock, extractLatexBlocks } from "./latex-renderer";

// Re-exportar para compatibilidad con código existente
export { sanitizeMarkdown };

// ========================================================================
// SANITIZADOR: Implementación en lib/cognetica-forense/markdown-sanitizer.ts
// ========================================================================

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

	// Extraer bloques LaTeX $$...$$ antes de procesar líneas
	const segments = extractLatexBlocks(safeContent);

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

	// Procesar cada segmento (texto o bloque LaTeX)
	let elementKey = 0;

	for (const segment of segments) {
		if (segment.type === "latex-block") {
			flushList();
			flushTable();
			elements.push(
				<div key={`latex-block-${elementKey++}`}>
					{renderLatexBlock(segment.content)}
				</div>,
			);
			continue;
		}

		// Procesar segmento de texto línea por línea
		const lines = segment.content.split("\n");
		for (const line of lines) {
			const MAX_LINE_LENGTH = 2000;
			const safeLine = line.length > MAX_LINE_LENGTH
				? line.slice(0, MAX_LINE_LENGTH) + "…"
				: line;

			// Detectar tabla markdown
			if (safeLine.includes("|")) {
				if (!inTable) {
					flushList();
					inTable = true;
				}
				tableRows.push(safeLine);
				continue;
			} else if (inTable) {
				flushTable();
			}

			// Lista desordenada
			if (safeLine.match(/^\s*[-*+]\s+/)) {
				if (!inList || listType !== "ul") {
					flushList();
					inList = true;
					listType = "ul";
				}
				listItems.push(safeLine.replace(/^\s*[-*+]\s+/, ""));
				continue;
			}

			// Lista ordenada
			if (safeLine.match(/^\s*\d+\.\s+/)) {
				if (!inList || listType !== "ol") {
					flushList();
					inList = true;
					listType = "ol";
				}
				listItems.push(safeLine.replace(/^\s*\d+\.\s+/, ""));
				continue;
			}

			// Si no es lista, flush lista anterior
			if (inList) {
				flushList();
			}

			// Línea vacía
			if (safeLine.trim() === "") {
				elements.push(<div key={`space-${elementKey++}`} className="h-2" />);
				continue;
			}

			// Blockquote
			if (safeLine.startsWith(">")) {
				const quoteContent = safeLine.replace(/^>\s*/, "");
				elements.push(
					<blockquote
						key={`quote-${elementKey++}`}
						className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3">
						{renderInlineMarkdown(quoteContent, options)}
					</blockquote>,
				);
				continue;
			}

			// Código inline (línea completa con backticks)
			if (safeLine.trim().startsWith("```")) {
				elements.push(
					<pre
						key={`code-${elementKey++}`}
						className="bg-muted/50 p-3 rounded-md my-3 overflow-x-auto">
						<code className="text-sm font-mono">{safeLine.replace(/```/g, "")}</code>
					</pre>,
				);
				continue;
			}

			// Párrafo normal
			elements.push(
				<p key={`p-${elementKey++}`} className="text-base leading-relaxed mb-2">
					{renderInlineMarkdown(safeLine, options)}
				</p>,
			);
		}
	}

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
// Parser iterativo O(n) — evita backtracking catastrófico con contenido de PDF
function renderInlineMarkdown(
	text: string,
	options?: RenderContentOptions,
): React.ReactNode {
	const parts: React.ReactNode[] = [];
	let i = 0;
	let key = 0;

	const pushText = (chunk: string) => {
		if (!chunk) return;
		if (options?.shouldHighlight && options?.highlightTerm) {
			parts.push(
				<span key={key++}>{highlightSearchTerm(chunk, options.highlightTerm)}</span>,
			);
		} else {
			parts.push(<span key={key++}>{chunk}</span>);
		}
	};

	while (i < text.length) {
		const ch = text[i];

		// LaTeX inline $...$ (pero no $$ que es block-level)
		if (ch === "$" && i + 1 < text.length && text[i + 1] !== "$") {
			// Buscar cierre $ (pero no $$)
			let found = false;
			for (let j = i + 1; j < text.length && j < i + 2000; j++) {
				if (text[j] === "$" && (j + 1 >= text.length || text[j + 1] !== "$")) {
					const latex = text.slice(i + 1, j);
					if (latex.length > 0) {
						parts.push(renderLatexInline(latex));
						i = j + 1;
						found = true;
					}
					break;
				}
			}
			if (!found) {
				pushText("$");
				i += 1;
			}
			continue;
		}

		// Negrita con **
		if (ch === "*" && i + 1 < text.length && text[i + 1] === "*") {
			const closeIdx = text.indexOf("**", i + 2);
			if (closeIdx !== -1) {
				const inner = text.slice(i + 2, closeIdx);
				if (inner.length > 0 && inner.length < 5000) {
					parts.push(
						<StandardText
							key={key++}
							weight="semibold"
							colorScheme="accent"
							colorShade="textShade"
							asElement="span">
							{renderInlineMarkdown(inner, options)}
						</StandardText>,
					);
					i = closeIdx + 2;
					continue;
				}
			}
			pushText("**");
			i += 2;
			continue;
		}

		// Negrita o cursiva con _ (un solo _ = cursiva, __ = negrita)
		if (ch === "_") {
			if (i + 1 < text.length && text[i + 1] === "_") {
				// __negrita__
				const closeIdx = text.indexOf("__", i + 2);
				if (closeIdx !== -1) {
					const inner = text.slice(i + 2, closeIdx);
					if (inner.length > 0 && inner.length < 5000) {
						parts.push(
							<StandardText
								key={key++}
								weight="semibold"
								colorScheme="accent"
								colorShade="textShade"
								asElement="span">
								{renderInlineMarkdown(inner, options)}
							</StandardText>,
						);
						i = closeIdx + 2;
						continue;
					}
				}
				pushText("__");
				i += 2;
				continue;
			} else {
				// _cursiva_
				const closeIdx = text.indexOf("_", i + 1);
				if (closeIdx !== -1 && closeIdx > i + 1 && closeIdx < i + 2000) {
					// Verificar que no sea doble underscore en closeIdx
					if (text[closeIdx + 1] !== "_") {
						const inner = text.slice(i + 1, closeIdx);
						parts.push(
							<em key={key++} className="italic">
								{inner}
							</em>,
						);
						i = closeIdx + 1;
						continue;
					}
				}
				pushText("_");
				i += 1;
				continue;
			}
		}

		// Cursiva con * (asterisco simple, no doble)
		if (ch === "*") {
			// Ya manejamos ** arriba; si llegamos aquí es un * soltero
			// Buscar cierre * pero no **
			let found = false;
			for (let j = i + 1; j < text.length && j < i + 2000; j++) {
				if (text[j] === "*" && (j + 1 >= text.length || text[j + 1] !== "*")) {
					const inner = text.slice(i + 1, j);
					if (inner.length > 0) {
						parts.push(
							<em key={key++} className="italic">
								{inner}
							</em>,
						);
						i = j + 1;
						found = true;
					}
					break;
				}
			}
			if (!found) {
				pushText("*");
				i += 1;
			}
			continue;
		}

		// Código inline
		if (ch === "`") {
			const closeIdx = text.indexOf("`", i + 1);
			if (closeIdx !== -1 && closeIdx < i + 5000) {
				const inner = text.slice(i + 1, closeIdx);
				parts.push(
					<code
						key={key++}
						className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
						{inner}
					</code>,
				);
				i = closeIdx + 1;
				continue;
			}
			pushText("`");
			i += 1;
			continue;
		}

		// Enlace [texto](url)
		if (ch === "[") {
			const closeBracket = text.indexOf("]", i + 1);
			if (closeBracket !== -1 && closeBracket < i + 500 && closeBracket + 1 < text.length && text[closeBracket + 1] === "(") {
				const closeParen = text.indexOf(")", closeBracket + 2);
				if (closeParen !== -1 && closeParen < closeBracket + 2000) {
					const linkText = text.slice(i + 1, closeBracket);
					const href = text.slice(closeBracket + 2, closeParen);
					if (href.length > 0 && href.length < 3000) {
						parts.push(
							<a
								key={key++}
								href={href}
								className="text-primary hover:underline"
								target="_blank"
								rel="noopener noreferrer">
								{linkText}
							</a>,
						);
						i = closeParen + 1;
						continue;
					}
				}
			}
			pushText("[");
			i += 1;
			continue;
		}

		// Texto normal: acumular hasta el próximo carácter especial
		const nextSpecial = text.slice(i).search(/[\*_`\[$]/);
		if (nextSpecial === -1) {
			pushText(text.slice(i));
			break;
		} else {
			pushText(text.slice(i, i + nextSpecial));
			i += nextSpecial;
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
						{renderInlineMarkdown(section.title)}
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
					{renderInlineMarkdown(section.title)}
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
	const sections = useMemo(() => {
		return parseMarkdownToSections(content);
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
