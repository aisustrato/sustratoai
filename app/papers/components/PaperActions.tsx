// 📍 app/papers/components/PaperActions.tsx
// Botones de acción: Descargar PDF, Ver en Zenodo, Citar, Compartir

"use client";

import type { Paper } from "@/lib/papers/types";
import { StandardButton } from "@/components/ui/StandardButton";
import { Download, ExternalLink, Quote, Share2 } from "lucide-react";
import { useState } from "react";

interface PaperActionsProps {
	paper: Paper;
}

export function PaperActions({ paper }: PaperActionsProps) {
	const [copied, setCopied] = useState(false);

	const handleShare = async () => {
		const url = `https://sustrato.ai/papers/${paper.slug}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: paper.title,
					text: paper.abstract_es.substring(0, 200) + "...",
					url,
				});
			} catch (err) {
				// Usuario canceló o error
				console.log("Share cancelled or failed");
			}
		} else {
			// Fallback: copiar URL al portapapeles
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleCite = () => {
		if (paper.citation_apa) {
			navigator.clipboard.writeText(paper.citation_apa);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div className="flex flex-wrap gap-3 border-y py-6">
			{/* Descargar PDF */}
			{paper.pdf_url && (
				<a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">
					<StandardButton styleType="solid" colorScheme="primary" size="md">
						<Download className="w-4 h-4" />
						Descargar PDF
					</StandardButton>
				</a>
			)}

			{/* Ver en Zenodo */}
			{paper.zenodo_url && (
				<a href={paper.zenodo_url} target="_blank" rel="noopener noreferrer">
					<StandardButton styleType="outline" colorScheme="neutral" size="md">
						<ExternalLink className="w-4 h-4" />
						Ver en Zenodo
					</StandardButton>
				</a>
			)}

			{/* Citar */}
			{paper.citation_apa && (
				<StandardButton
					styleType="outline"
					colorScheme="neutral"
					size="md"
					onClick={handleCite}>
					<Quote className="w-4 h-4" />
					{copied ? "¡Copiado!" : "Citar"}
				</StandardButton>
			)}

			{/* Compartir */}
			<StandardButton
				styleType="outline"
				colorScheme="neutral"
				size="md"
				onClick={handleShare}>
				<Share2 className="w-4 h-4" />
				{copied ? "¡Copiado!" : "Compartir"}
			</StandardButton>
		</div>
	);
}
