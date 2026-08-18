//. 📍 lib/openalex/dedup.ts
/**
 * Deduplicación capa 0 del harvester de OpenAlex: antes de insertar un
 * resultado en `staging_articles`, se compara contra lo que ya existe en
 * staging (cualquier estado) y en `articles` del mismo proyecto. Cascada:
 * OpenAlex ID exacto → DOI exacto (normalizado) → título+año normalizado.
 */

//#region [def] - 📦 TYPES 📦
export interface DedupCandidate {
	openalexId: string | null;
	doi: string | null;
	title: string | null;
	publicationYear: number | null;
}
//#endregion ![def]

//#region [main] - 🔧 NORMALIZACIÓN 🔧
export function normalizeDoi(doi: string | null | undefined): string | null {
	if (!doi) return null;
	return doi
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\/doi\.org\//, "");
}

export function normalizeTitleForDedup(title: string | null | undefined): string | null {
	if (!title) return null;
	const normalized = title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // quitar acentos
		.replace(/[^a-z0-9\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
	return normalized || null;
}
//#endregion ![main]

//#region [main] - 🔧 MATCHING 🔧
/**
 * True si `candidate` es un posible duplicado de alguno de `existing`.
 * `existing` debe incluir tanto filas de `staging_articles` (cualquier
 * estado) como de `articles`, ambas del mismo proyecto.
 */
export function isDuplicate(
	candidate: DedupCandidate,
	existing: DedupCandidate[],
): boolean {
	const candidateDoi = normalizeDoi(candidate.doi);
	const candidateTitle = normalizeTitleForDedup(candidate.title);

	for (const item of existing) {
		if (
			candidate.openalexId &&
			item.openalexId &&
			candidate.openalexId === item.openalexId
		) {
			return true;
		}
		if (candidateDoi && normalizeDoi(item.doi) === candidateDoi) {
			return true;
		}
		if (
			candidateTitle &&
			candidate.publicationYear != null &&
			candidate.publicationYear === item.publicationYear &&
			normalizeTitleForDedup(item.title) === candidateTitle
		) {
			return true;
		}
	}
	return false;
}
//#endregion ![main]
