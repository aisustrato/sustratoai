// 📍 app/papers/components/PapersFooter.tsx
// Pie de página de la DMZ (zona pública de papers) — extraído de
// app/papers/layout.tsx para poder recibir el idioma resuelto de cada
// página, ya que un layout compartido no tiene acceso a esa información.

import { PAPER_LABELS, type PaperIdioma } from "@/lib/papers/i18n";

interface PapersFooterProps {
	/** Idioma de la página actual (por defecto "es" para el índice, que es bilingüe/mixto). */
	idioma?: PaperIdioma;
}

export function PapersFooter({ idioma = "es" }: PapersFooterProps) {
	const t = PAPER_LABELS[idioma];

	return (
		<footer className="border-t py-8">
			<div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
				<div className="text-sm text-muted-foreground">
					© {new Date().getFullYear()} sustrato.ai — {t.footerLicenciaPrefix}{" "}
					<a
						href="https://creativecommons.org/licenses/by/4.0/"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground transition-colors underline">
						CC-BY-4.0
					</a>
				</div>
				<div className="flex gap-4 text-sm text-muted-foreground">
					<a
						href="https://zenodo.org"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground transition-colors">
						Zenodo
					</a>
					<a
						href="https://orcid.org"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground transition-colors">
						ORCID
					</a>
					<a
						href="https://github.com/sustratoai"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground transition-colors">
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}
