//. 📍 lib/openalex/client.ts
/**
 * Cliente HTTP hacia la API pública de OpenAlex (https://docs.openalex.org).
 * Sin API key: usa el "Polite Pool" (parámetro `mailto`) para prioridad de
 * respuesta. Ver
 * docs/preclasificacion-auditoria-funcional/04_Requerimiento_OpenAlex_Harvester.md
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type {
	OpenAlexSearchFilters,
	OpenAlexWorkNormalized,
	SeedDirection,
} from "@/lib/types/openalex-types";
//#endregion ![head]

//#region [def] - 🎯 CONSTANTES 🎯
const OPENALEX_WORKS_URL = "https://api.openalex.org/works";
/** Tope duro por búsqueda — evita saturar staging_articles y la UI de triaje. */
export const OPENALEX_HARD_MAX_RESULTS = 200;
//#endregion ![def]

//#region [helpers] - 🛠️ UTILIDADES INTERNAS 🛠️
function politeMailto(): string {
	const email = process.env.OPENALEX_POLITE_POOL_EMAIL;
	if (!email) {
		console.warn(
			"[openalex] OPENALEX_POLITE_POOL_EMAIL no configurado — las respuestas de OpenAlex pueden ser más lentas (fuera del Polite Pool).",
		);
	}
	return email ?? "";
}

/**
 * OpenAlex no devuelve el abstract como texto plano (por temas de copyright):
 * lo entrega como "inverted index" (palabra -> posiciones). Hay que
 * reconstruirlo ordenando por posición.
 */
function reconstructAbstract(
	invertedIndex: Record<string, number[]> | null | undefined,
): string | null {
	if (!invertedIndex) return null;
	const positioned: Array<[number, string]> = [];
	for (const [word, positions] of Object.entries(invertedIndex)) {
		for (const pos of positions) positioned.push([pos, word]);
	}
	if (positioned.length === 0) return null;
	positioned.sort((a, b) => a[0] - b[0]);
	return positioned.map(([, word]) => word).join(" ");
}

// La API de OpenAlex no tiene tipos oficiales publicados; se tipa solo lo
// que este cliente lee de la respuesta cruda (todo opcional/laxo a
// propósito), y se normaliza a `OpenAlexWorkNormalized` para el resto de la app.
interface OpenAlexRawWork {
	id?: string;
	doi?: string;
	display_name?: string;
	title?: string;
	authorships?: Array<{ author?: { display_name?: string } }>;
	primary_location?: { source?: { display_name?: string } };
	publication_year?: number;
	abstract_inverted_index?: Record<string, number[]>;
	cited_by_count?: number;
	open_access?: { is_oa?: boolean; oa_url?: string };
	concepts?: Array<{ id?: string; display_name?: string; score?: number }>;
	type?: string;
	referenced_works?: string[];
}

function normalizeWork(raw: OpenAlexRawWork): OpenAlexWorkNormalized {
	return {
		openalexId: raw.id?.replace("https://openalex.org/", "") ?? "",
		doi: raw.doi ? String(raw.doi).replace("https://doi.org/", "") : null,
		title: raw.display_name ?? raw.title ?? null,
		authors: (raw.authorships ?? [])
			.map((a) => a.author?.display_name)
			.filter((name): name is string => !!name),
		journal: raw.primary_location?.source?.display_name ?? null,
		publicationYear: raw.publication_year ?? null,
		abstract: reconstructAbstract(raw.abstract_inverted_index),
		citedByCount: raw.cited_by_count ?? 0,
		isOa: raw.open_access?.is_oa ?? false,
		oaUrl: raw.open_access?.oa_url ?? null,
		concepts: (raw.concepts ?? []).map((c) => ({
			id: c.id?.replace("https://openalex.org/", "") ?? "",
			displayName: c.display_name ?? "",
			score: c.score ?? 0,
		})),
		documentType: raw.type ?? null,
	};
}

/**
 * `filter` de OpenAlex: cláusulas separadas por coma (AND entre cláusulas),
 * valores alternativos separados por `|` (OR dentro de una cláusula). Se
 * arma como string y se deja que `URLSearchParams` haga el URL-encoding —
 * el servidor decodifica antes de parsear, así que las comas literales
 * llegan bien. Caveat: si `keywords` trae una coma, OpenAlex la interpreta
 * como separador de cláusulas (limitación del DSL, no de este cliente).
 */
function buildFilterString(filters: OpenAlexSearchFilters): string {
	const parts: string[] = [];
	if (filters.keywords) {
		parts.push(`title_and_abstract.search:${filters.keywords}`);
	}
	if (filters.conceptIds?.length) {
		parts.push(`concepts.id:${filters.conceptIds.join("|")}`);
	}
	if (filters.yearFrom && filters.yearTo) {
		parts.push(`publication_year:${filters.yearFrom}-${filters.yearTo}`);
	} else if (filters.yearFrom) {
		parts.push(`publication_year:>${filters.yearFrom - 1}`);
	} else if (filters.yearTo) {
		parts.push(`publication_year:<${filters.yearTo + 1}`);
	}
	if (filters.minCitedByCount != null) {
		parts.push(`cited_by_count:>${filters.minCitedByCount - 1}`);
	}
	if (filters.documentTypes?.length) {
		parts.push(`type:${filters.documentTypes.join("|")}`);
	}
	if (filters.isOaOnly) {
		parts.push(`is_oa:true`);
	}
	if (filters.sourceId) {
		parts.push(`primary_location.source.id:${filters.sourceId}`);
	}
	return parts.join(",");
}

async function fetchWorksList(params: URLSearchParams): Promise<OpenAlexWorkNormalized[]> {
	const response = await fetch(`${OPENALEX_WORKS_URL}?${params.toString()}`);
	if (!response.ok) {
		const bodyText = await response.text().catch(() => "");
		throw new Error(`Error en API de OpenAlex: ${response.status} - ${bodyText}`);
	}
	const data = await response.json();
	const results = Array.isArray(data.results) ? data.results : [];
	return results.map(normalizeWork);
}
//#endregion ![helpers]

//#region [main] - 🔧 BÚSQUEDA 🔧
export async function searchOpenAlexWorks(
	filters: OpenAlexSearchFilters,
): Promise<OpenAlexWorkNormalized[]> {
	const perPage = Math.min(
		filters.maxResults ?? OPENALEX_HARD_MAX_RESULTS,
		OPENALEX_HARD_MAX_RESULTS,
	);
	const filterString = buildFilterString(filters);
	if (!filterString) {
		throw new Error("Se necesita al menos un filtro de búsqueda.");
	}

	const params = new URLSearchParams({
		filter: filterString,
		per_page: String(perPage),
		mailto: politeMailto(),
	});
	if (filters.keywords) {
		params.set("sort", "relevance_score:desc");
	}

	return fetchWorksList(params);
}
//#endregion ![main]

//#region [main] - 🔧 BÚSQUEDA POR SEMILLA (CITAS / REFERENCIAS) 🔧
async function fetchSeedWorkByDoi(seedDoi: string) {
	const cleanDoi = seedDoi.replace(/^https?:\/\/doi\.org\//, "").trim();
	const params = new URLSearchParams({ mailto: politeMailto() });
	const response = await fetch(
		`${OPENALEX_WORKS_URL}/doi:${encodeURIComponent(cleanDoi)}?${params.toString()}`,
	);
	if (!response.ok) {
		const bodyText = await response.text().catch(() => "");
		throw new Error(
			`No se encontró el artículo semilla en OpenAlex (DOI ${seedDoi}): ${response.status} - ${bodyText}`,
		);
	}
	return response.json();
}

/**
 * Trae las citas (works que citan la semilla) o las referencias (works que
 * la semilla cita) de un artículo, identificado por su DOI.
 */
export async function harvestBySeedDoi(
	seedDoi: string,
	direction: SeedDirection,
	maxResults = OPENALEX_HARD_MAX_RESULTS,
): Promise<OpenAlexWorkNormalized[]> {
	const seedRaw = await fetchSeedWorkByDoi(seedDoi);
	const perPage = Math.min(maxResults, OPENALEX_HARD_MAX_RESULTS);

	if (direction === "citations") {
		const seedOpenAlexId: string =
			seedRaw.id?.replace("https://openalex.org/", "") ?? "";
		if (!seedOpenAlexId) {
			throw new Error("El artículo semilla no tiene un ID de OpenAlex válido.");
		}
		const params = new URLSearchParams({
			filter: `cites:${seedOpenAlexId}`,
			per_page: String(perPage),
			mailto: politeMailto(),
		});
		return fetchWorksList(params);
	}

	// direction === "references": los trabajos que la semilla cita.
	const referencedWorkIds: string[] = (seedRaw.referenced_works ?? [])
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.map((url: any) => String(url).replace("https://openalex.org/", ""))
		.slice(0, perPage);
	if (referencedWorkIds.length === 0) return [];

	const params = new URLSearchParams({
		filter: `ids.openalex:${referencedWorkIds.join("|")}`,
		per_page: String(referencedWorkIds.length),
		mailto: politeMailto(),
	});
	return fetchWorksList(params);
}
//#endregion ![main]
