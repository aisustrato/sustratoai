"use client";

// 📍 app/cognetica/[id]/DocumentoMarkdownViewer.tsx
// 🎯 Wrapper de StandardMarkdownViewer con controles de búsqueda integrados
// 🔧 Usa componentes Standard* para consistencia visual

import { useState, useCallback } from "react";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	FileCode,
	Copy,
	Check,
} from "lucide-react";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import {
	StandardMarkdownViewer,
	SearchMatch,
	sanitizeMarkdown,
} from "@/components/ui/StandardMarkdownViewer";

interface DocumentoMarkdownViewerProps {
	/** Contenido markdown a visualizar */
	content: string;
	/** Título del documento */
	titulo?: string;
	/** Mostrar barra de búsqueda */
	mostrarBusqueda?: boolean;
	/** Mostrar botón de descarga */
	mostrarDescarga?: boolean;
	/** Modo compacto: sin desplegables, solo texto renderizado */
	compact?: boolean;
	/** Clases CSS adicionales */
	className?: string;
	/** Callback para descarga Obsidian-friendly (ver plan 2026-05-06). */
	onDescargarObsidiana?: () => void;
	/** SHA-256 de la última descarga Obsidian (muestra 8 chars en tooltip). */
	sha256Descarga?: string | null;
}

export function DocumentoMarkdownViewer({
	content,
	titulo = "Documento",
	mostrarBusqueda = true,
	mostrarDescarga = true,
	compact = false,
	className,
	onDescargarObsidiana,
	sha256Descarga,
}: DocumentoMarkdownViewerProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [matches, setMatches] = useState<SearchMatch[]>([]);
	const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
	const [copied, setCopied] = useState(false);

	// Callback cuando cambian los resultados de búsqueda
	const handleSearch = useCallback((newMatches: SearchMatch[]) => {
		setMatches(newMatches);
		setCurrentMatchIndex(0);
	}, []);

	// Navegación entre matches
	const goToPrevMatch = () => {
		if (matches.length === 0) return;
		setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
	};

	const goToNextMatch = () => {
		if (matches.length === 0) return;
		setCurrentMatchIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
	};

	// Descargar contenido markdown ORIGINAL
	const handleDownloadOriginal = () => {
		const blob = new Blob([content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${titulo.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_original.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Descargar contenido markdown SANITIZADO (para debugging)
	const handleDownloadSanitizado = () => {
		const sanitized = sanitizeMarkdown(content);
		const blob = new Blob([sanitized], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${titulo.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_sanitizado.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Copiar contenido al portapapeles
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback silencioso si clipboard no está disponible
		}
	};

	const hasMatches = matches.length > 0;
	const currentMatchNumber = hasMatches ? currentMatchIndex + 1 : 0;

	// MODO COMPACTO: Solo renderiza markdown con botón copiar mínimo
	if (compact) {
		return (
			<div className={`relative pt-8 ${className ?? ""}`}>
				{/* Botón copiar flotante en esquina */}
				<div className="absolute top-0 right-1 z-10">
					<StandardButton
						styleType="ghost"
						size="sm"
						leftIcon={copied ? Check : Copy}
						onClick={handleCopy}
						tooltip={copied ? "¡Copiado!" : "Copiar markdown"}
						colorScheme={copied ? "success" : "neutral"}>
						{copied ? "Copiado" : "Copiar"}
					</StandardButton>
				</div>
				{/* Markdown sin card, sin header, integrado al flujo */}
				<StandardMarkdownViewer
					content={content}
					expandAll={true}
					searchTerm=""
				/>
			</div>
		);
	}

	// MODO NORMAL: Con card, título, búsqueda y descargas
	return (
		<StandardCard
			colorScheme="neutral"
			styleType="subtle"
			className={className}>
			{/* Header con título y controles */}
			<div className="flex flex-col gap-3 mb-4">
				{/* Fila 1: Título y acciones */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="w-5 h-5 text-muted-foreground" />
						<StandardText size="base" weight="semibold" colorScheme="neutral">
							{titulo}
						</StandardText>
					</div>

					<div className="flex items-center gap-1 flex-wrap">
						{/* Botón Copiar - siempre visible */}
						<StandardButton
							styleType="ghost"
							size="sm"
							leftIcon={copied ? Check : Copy}
							onClick={handleCopy}
							tooltip={copied ? "¡Copiado!" : "Copiar contenido"}
							colorScheme={copied ? "success" : "neutral"}>
							{copied ? "Copiado" : "Copiar"}
						</StandardButton>

						{mostrarDescarga && (
							<>
								<StandardButton
									styleType="ghost"
									size="sm"
									leftIcon={Download}
									onClick={handleDownloadOriginal}
									tooltip="Descargar markdown original">
									Original
								</StandardButton>
								<StandardButton
									styleType="ghost"
									size="sm"
									leftIcon={FileCode}
									onClick={handleDownloadSanitizado}
									tooltip="Descargar markdown sanitizado (para debugging)">
									Sanitizado
								</StandardButton>
								{onDescargarObsidiana && (
									<StandardButton
										styleType="outline"
										size="sm"
										leftIcon={Download}
										onClick={onDescargarObsidiana}
										tooltip={
											sha256Descarga
												? `SHA-256: ${sha256Descarga.slice(0, 8)}…`
												: "Descargar para Obsidian (con frontmatter y semillas)"
										}
										colorScheme="primary">
										Obsidian
									</StandardButton>
								)}
							</>
						)}
					</div>
				</div>

				{/* Fila 2: Búsqueda y navegación */}
				{mostrarBusqueda && (
					<div className="flex items-center gap-2">
						<div className="flex-1 max-w-md">
							<StandardInput
								placeholder="Buscar en documento..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								leadingIcon={Search}
								onClear={() => setSearchTerm("")}
							/>
						</div>

						{/* Contador de matches */}
						{searchTerm && (
							<StandardText
								size="sm"
								colorScheme={hasMatches ? "success" : "neutral"}
								className="tabular-nums">
								{hasMatches ? `${currentMatchNumber}/${matches.length}` : "0/0"}
							</StandardText>
						)}

						{/* Botones de navegación */}
						{hasMatches && (
							<>
								<StandardButton
									styleType="ghost"
									size="sm"
									leftIcon={ChevronLeft}
									onClick={goToPrevMatch}
									disabled={!hasMatches}
								/>
								<StandardButton
									styleType="ghost"
									size="sm"
									leftIcon={ChevronRight}
									onClick={goToNextMatch}
									disabled={!hasMatches}
								/>
							</>
						)}
					</div>
				)}
			</div>

			{/* Contenido markdown */}
			<div className="border-t pt-4">
				<StandardMarkdownViewer
					content={content}
					expandAll={false}
					searchTerm={searchTerm}
					currentMatchIndex={currentMatchIndex}
					onSearch={handleSearch}
				/>
			</div>
		</StandardCard>
	);
}
