// 📍 app/papers/components/PaperBilingualView.tsx
// Cuerpo del paper (header, acciones, resumen, contenido, anexos, footer) con
// toggle de idioma client-side. El toggle solo aparece si hay traducción real
// — nunca se muestra contenido inventado o mezclado.

"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { StandardButton } from "@/components/ui/StandardButton";
import { PaperHeader } from "./PaperHeader";
import { PaperActions } from "./PaperActions";
import { PaperContent } from "./PaperContent";
import type { Paper, PaperAnnex } from "@/lib/papers/types";
import {
	PAPER_LABELS,
	hasTranslation,
	resolveAnnexDescription,
	resolvePaperContentSafe,
	type PaperIdioma,
} from "@/lib/papers/i18n";

interface PaperBilingualViewProps {
	paper: Paper;
	annexes: PaperAnnex[];
}

export function PaperBilingualView({ paper, annexes }: PaperBilingualViewProps) {
	const idiomaCanonico: PaperIdioma = paper.language === "en" ? "en" : "es";
	const [idioma, setIdioma] = useState<PaperIdioma>(idiomaCanonico);
	const puedeAlternar = hasTranslation(paper);
	const t = PAPER_LABELS[idioma];
	const contenido = resolvePaperContentSafe(paper, idioma);

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			{/* Header + toggle de idioma */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<PaperHeader paper={paper} idioma={idioma} />
				</div>
				{puedeAlternar && (
					<StandardButton
						styleType="outline"
						colorScheme="neutral"
						size="sm"
						leftIcon={Globe}
						onClick={() => setIdioma(idioma === "es" ? "en" : "es")}
						aria-label={idioma === "es" ? "Switch to English" : "Cambiar a español"}
						title={idioma === "es" ? "Switch to English" : "Cambiar a español"}>
						{idioma === "es" ? "EN" : "ES"}
					</StandardButton>
				)}
			</div>

			{/* Acciones: PDF, Zenodo, Citar, Compartir */}
			<PaperActions paper={paper} idioma={idioma} />

			{/* Resumen / Abstract */}
			<section className="space-y-4">
				<h2 className="font-heading text-2xl font-bold">{t.resumen}</h2>
				<p className="text-base leading-relaxed">{contenido.abstract}</p>
			</section>

			{/* Contenido principal (Markdown) */}
			<section className="space-y-4">
				<PaperContent content={contenido.contentMd} />
			</section>

			{/* Anexos / Material Suplementario */}
			{annexes.length > 0 && (
				<section className="space-y-4 border-t pt-8">
					<h2 className="font-heading text-2xl font-bold">{t.anexos}</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{annexes.map((annex) => {
							const descripcion = resolveAnnexDescription(annex, idioma);
							return (
								<a
									key={annex.id}
									href={`https://vgnteswwvallupuanfiz.supabase.co/storage/v1/object/public/paper-annexes/${annex.storage_path}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-start gap-3 p-4 rounded-lg border border-border-neutral bg-background-paper hover:border-primary-pure transition-colors">
									<div className="p-2 rounded bg-primary-bg flex-shrink-0 text-primary-pure text-lg font-bold">
										{"{}"}
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-sm truncate">{annex.filename}</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{annex.language} •{" "}
											{annex.file_size > 1024 * 1024 ?
												`${(annex.file_size / (1024 * 1024)).toFixed(1)} MB`
											:	`${(annex.file_size / 1024).toFixed(0)} KB`}
										</p>
										{descripcion && (
											<p className="text-xs text-muted-foreground mt-1">{descripcion}</p>
										)}
									</div>
								</a>
							);
						})}
					</div>
				</section>
			)}

			{/* Footer: licencia, cómo citar, DOI */}
			<footer className="space-y-4 border-t pt-8 text-sm text-muted-foreground">
				<div>
					<h3 className="font-semibold text-foreground mb-2">{t.licencia}</h3>
					<p>
						{t.licenciaPrefix}{" "}
						<a
							href="https://creativecommons.org/licenses/by/4.0/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline">
							{t.licenciaNombre}
						</a>
						.
					</p>
				</div>
				{paper.citation_apa && (
					<div>
						<h3 className="font-semibold text-foreground mb-2">{t.comoCitar}</h3>
						<p className="font-mono text-xs bg-muted p-3 rounded">{paper.citation_apa}</p>
					</div>
				)}
				{paper.doi && (
					<div>
						<h3 className="font-semibold text-foreground mb-2">DOI</h3>
						<p>
							<a
								href={`https://doi.org/${paper.doi}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline">
								{paper.doi}
							</a>
						</p>
					</div>
				)}
			</footer>
		</div>
	);
}
