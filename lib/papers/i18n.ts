// 📍 lib/papers/i18n.ts
// Resolución de contenido bilingüe (ES/EN) para la DMZ de papers.
// Puerta única de acceso al idioma "en": si no hay traducción real, no se
// inventa ni se mezcla contenido — el llamador recibe null y debe ocultar
// el toggle, nunca rellenar con el idioma equivocado.

import type { Paper, PaperAnnex } from "./types";

export type PaperIdioma = "es" | "en";

export interface PaperLocalizedContent {
	title: string;
	subtitle?: string | null;
	abstract: string;
	contentMd: string;
	keywords: string[];
}

/** true solo si el paper tiene traducción completa (título, abstract y cuerpo). */
export function hasTranslation(paper: Paper): boolean {
	return Boolean(paper.title_en && paper.abstract_en && paper.content_md_en);
}

/**
 * Resuelve el contenido del paper en el idioma pedido.
 * Devuelve `null` si se pide "en" y no hay traducción real — el llamador
 * no debe usar esto para mostrar contenido a medias.
 */
export function resolvePaperContent(
	paper: Paper,
	idioma: PaperIdioma,
): PaperLocalizedContent | null {
	if (idioma === "es") {
		return {
			title: paper.title,
			subtitle: paper.subtitle,
			abstract: paper.abstract_es,
			contentMd: paper.content_md,
			keywords: paper.keywords,
		};
	}

	if (!hasTranslation(paper)) return null;

	return {
		title: paper.title_en as string,
		subtitle: paper.subtitle_en,
		abstract: paper.abstract_en as string,
		contentMd: paper.content_md_en as string,
		keywords: paper.keywords_en ?? [],
	};
}

/**
 * Igual que `resolvePaperContent`, pero nunca retorna null: si se pide "en"
 * sin traducción, cae a español. Solo usar cuando quien llama ya garantizó
 * (aguas arriba) que el idioma pedido es válido — típicamente los
 * componentes de presentación, que reciben `idioma` ya filtrado por
 * `hasTranslation` en `PaperBilingualView`.
 */
export function resolvePaperContentSafe(
	paper: Paper,
	idioma: PaperIdioma,
): PaperLocalizedContent {
	return resolvePaperContent(paper, idioma) ?? resolvePaperContent(paper, "es")!;
}

/** Descripción de un anexo en el idioma pedido, con fallback a español si no hay traducción del label. */
export function resolveAnnexDescription(annex: PaperAnnex, idioma: PaperIdioma): string {
	if (idioma === "en" && annex.description_en) return annex.description_en;
	return annex.description;
}

export interface PaperLabels {
	resumen: string;
	anexos: string;
	licencia: string;
	licenciaPrefix: string;
	licenciaNombre: string;
	comoCitar: string;
	descargarPdf: string;
	verEnZenodo: string;
	citar: string;
	copiado: string;
	compartir: string;
	dateLocale: string;
	navPublicaciones: string;
	navSobre: string;
	navIrALaApp: string;
	footerLicenciaPrefix: string;
}

export const PAPER_LABELS: Record<PaperIdioma, PaperLabels> = {
	es: {
		resumen: "Resumen",
		anexos: "Anexos / Material Suplementario",
		licencia: "Licencia",
		licenciaPrefix: "Este trabajo está licenciado bajo",
		licenciaNombre: "Creative Commons Attribution 4.0 International (CC-BY-4.0)",
		comoCitar: "Cómo citar",
		descargarPdf: "Descargar PDF",
		verEnZenodo: "Ver en Zenodo",
		citar: "Citar",
		copiado: "¡Copiado!",
		compartir: "Compartir",
		dateLocale: "es-CL",
		navPublicaciones: "Publicaciones",
		navSobre: "Sobre",
		navIrALaApp: "Ir a la app",
		footerLicenciaPrefix: "Licencia",
	},
	en: {
		resumen: "Abstract",
		anexos: "Annexes / Supplementary Material",
		licencia: "License",
		licenciaPrefix: "This work is licensed under",
		licenciaNombre: "Creative Commons Attribution 4.0 International (CC-BY-4.0)",
		comoCitar: "How to cite",
		descargarPdf: "Download PDF",
		verEnZenodo: "View on Zenodo",
		citar: "Cite",
		copiado: "Copied!",
		compartir: "Share",
		dateLocale: "en-US",
		navPublicaciones: "Publications",
		navSobre: "About",
		navIrALaApp: "Go to the app",
		footerLicenciaPrefix: "License",
	},
};
