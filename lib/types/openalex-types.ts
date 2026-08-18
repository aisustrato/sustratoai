//. 📍 lib/types/openalex-types.ts
/**
 * Tipos del harvester de OpenAlex. Ver
 * docs/preclasificacion-auditoria-funcional/04_Requerimiento_OpenAlex_Harvester.md
 */

//#region [def] - 📦 BÚSQUEDA 📦
export interface OpenAlexSearchFilters {
	/** `title_and_abstract.search` — texto libre, soporta AND/OR/NOT de OpenAlex. */
	keywords?: string;
	/** IDs de conceptos OpenAlex (ej. "C41008148"). */
	conceptIds?: string[];
	yearFrom?: number;
	yearTo?: number;
	minCitedByCount?: number;
	/** ej. "article", "preprint", "review", "book-chapter". */
	documentTypes?: string[];
	isOaOnly?: boolean;
	/** ID de fuente/revista OpenAlex (ej. "S4306400194" para arXiv). */
	sourceId?: string;
	/** Tope de resultados a traer (se recorta al máximo duro del cliente). */
	maxResults?: number;
}

export type SeedDirection = "citations" | "references";
//#endregion ![def]

//#region [def] - 📦 RESULTADO NORMALIZADO 📦
export interface OpenAlexConcept {
	id: string;
	displayName: string;
	score: number;
}

export interface OpenAlexWorkNormalized {
	openalexId: string;
	doi: string | null;
	title: string | null;
	authors: string[];
	journal: string | null;
	publicationYear: number | null;
	abstract: string | null;
	citedByCount: number;
	isOa: boolean;
	oaUrl: string | null;
	concepts: OpenAlexConcept[];
	documentType: string | null;
}
//#endregion ![def]
