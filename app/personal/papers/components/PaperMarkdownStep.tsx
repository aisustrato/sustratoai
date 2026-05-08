// 📍 app/personal/papers/components/PaperMarkdownStep.tsx
// Paso 2: Editor de Markdown + Preview lado a lado

"use client";

import { useState, useEffect } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { RotateCcw, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PaperMarkdownStepProps {
	initialMarkdown: string;
	onMarkdownChange: (markdown: string) => void;
	imagePlaceholdersCount: number;
}

export function PaperMarkdownStep({
	initialMarkdown,
	onMarkdownChange,
	imagePlaceholdersCount,
}: PaperMarkdownStepProps) {
	const [markdown, setMarkdown] = useState(initialMarkdown);
	const [wordCount, setWordCount] = useState(0);
	const [charCount, setCharCount] = useState(0);

	// Calcular estadísticas del texto
	useEffect(() => {
		const words = markdown.trim().split(/\s+/).filter(Boolean).length;
		const chars = markdown.length;
		setWordCount(words);
		setCharCount(chars);
	}, [markdown]);

	// Notificar cambios al padre (debounced)
	useEffect(() => {
		const timer = setTimeout(() => {
			onMarkdownChange(markdown);
		}, 500);

		return () => clearTimeout(timer);
	}, [markdown, onMarkdownChange]);

	const handleReset = () => {
		if (
			confirm(
				"¿Estás seguro de que quieres restaurar el Markdown original? Se perderán todos los cambios.",
			)
		) {
			setMarkdown(initialMarkdown);
		}
	};

	return (
		<div className="space-y-4">
			{/* Barra de herramientas */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4 text-sm text-text-subtle">
					<span>{wordCount} palabras</span>
					<span>{charCount} caracteres</span>
					{imagePlaceholdersCount > 0 && (
						<span className="flex items-center gap-1">
							<Info className="h-4 w-4" />
							{imagePlaceholdersCount} imágenes detectadas
						</span>
					)}
				</div>
				<StandardButton
					styleType="ghost"
					size="sm"
					onClick={handleReset}
					title="Restaurar Markdown original"
					leftIcon={RotateCcw}>
					Reset
				</StandardButton>
			</div>

			{/* Layout split: Editor + Preview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Editor */}
				<StandardCard styleType="filled" colorScheme="neutral" noPadding>
					<div className="flex flex-col h-full">
						<div className="px-4 py-3 border-b border-border-neutral">
							<StandardText size="sm" weight="medium">
								Editor Markdown
							</StandardText>
						</div>
						<textarea
							value={markdown}
							onChange={(e) => setMarkdown(e.target.value)}
							className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm min-h-[600px] max-h-[600px] overflow-y-auto"
							placeholder="Escribe o edita el contenido en Markdown..."
							spellCheck={false}
						/>
					</div>
				</StandardCard>

				{/* Preview */}
				<StandardCard styleType="filled" colorScheme="neutral" noPadding>
					<div className="flex flex-col h-full">
						<div className="px-4 py-3 border-b border-border-neutral">
							<StandardText size="sm" weight="medium">
								Vista Previa
							</StandardText>
						</div>
						<div className="flex-1 p-4 overflow-y-auto min-h-[600px] max-h-[600px] prose prose-sm dark:prose-invert max-w-none">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{markdown}
							</ReactMarkdown>
						</div>
					</div>
				</StandardCard>
			</div>

			{/* Info Card */}
			<StandardCard styleType="subtle" colorScheme="neutral">
				<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
					<strong>Tip:</strong> Puedes editar libremente el Markdown para
					corregir errores de OCR, reorganizar secciones o eliminar artefactos.
					Los placeholders de imágenes (ej: <code>![](image_0.png)</code>) se
					gestionarán en el siguiente paso.
				</StandardText>
			</StandardCard>
		</div>
	);
}
