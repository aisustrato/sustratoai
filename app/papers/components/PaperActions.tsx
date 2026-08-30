// 📍 app/papers/components/PaperActions.tsx
// Botones de acción: Descargar PDF, Ver en Zenodo, Citar, Compartir

"use client";

import type { Paper } from "@/lib/papers/types";
import { StandardButton } from "@/components/ui/StandardButton";
import { Download, ExternalLink, Quote, Share2 } from "lucide-react";
import { useState } from "react";
import {
	PAPER_LABELS,
	resolvePaperContentSafe,
	type PaperIdioma,
} from "@/lib/papers/i18n";

interface PaperActionsProps {
	paper: Paper;
	idioma: PaperIdioma;
}

export function PaperActions({ paper, idioma }: PaperActionsProps) {
	const [copied, setCopied] = useState(false);
	const contenido = resolvePaperContentSafe(paper, idioma);
	const t = PAPER_LABELS[idioma];
	const slugActual = idioma === "en" && paper.slug_en ? paper.slug_en : paper.slug;
	const pdfUrl = idioma === "en" ? paper.pdf_url_en : paper.pdf_url;

	const handleShare = async () => {
		const url = `https://sustrato.ai/papers/${slugActual}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: contenido.title,
					text: contenido.abstract.substring(0, 200) + "...",
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
			{pdfUrl && (
				<a href={pdfUrl} target="_blank" rel="noopener noreferrer">
					<StandardButton
						styleType="solid"
						colorScheme="primary"
						size="md"
						leftIcon={Download}>
						{t.descargarPdf}
					</StandardButton>
				</a>
			)}

			{/* Ver en Zenodo */}
			{paper.zenodo_url && (
				<a href={paper.zenodo_url} target="_blank" rel="noopener noreferrer">
					<StandardButton
						styleType="outline"
						colorScheme="neutral"
						size="md"
						leftIcon={ExternalLink}>
						{t.verEnZenodo}
					</StandardButton>
				</a>
			)}

			{/* Citar */}
			{paper.citation_apa && (
				<StandardButton
					styleType="outline"
					colorScheme="neutral"
					size="md"
					onClick={handleCite}
					leftIcon={Quote}>
					{copied ? t.copiado : t.citar}
				</StandardButton>
			)}

			{/* Compartir */}
			<StandardButton
				styleType="outline"
				colorScheme="neutral"
				size="md"
				onClick={handleShare}
				leftIcon={Share2}>
				{copied ? t.copiado : t.compartir}
			</StandardButton>
		</div>
	);
}
