//. 📍 app/datos-maestros/harvest-openalex/components/SearchFiltersPanel.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { Search, Sprout } from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardRadioGroup } from "@/components/ui/StandardRadioGroup";
import type {
	OpenAlexSearchFilters,
	SeedDirection,
} from "@/lib/types/openalex-types";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface SearchFiltersPanelProps {
	onSearch: (filters: OpenAlexSearchFilters) => void;
	onHarvestBySeed: (seedDoi: string, direction: SeedDirection) => void;
	isSearching: boolean;
}

const DOCUMENT_TYPE_OPTIONS: SelectOption[] = [
	{ value: "article", label: "Artículo" },
	{ value: "preprint", label: "Preprint" },
	{ value: "review", label: "Review" },
	{ value: "book-chapter", label: "Capítulo de libro" },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function SearchFiltersPanel({
	onSearch,
	onHarvestBySeed,
	isSearching,
}: SearchFiltersPanelProps) {
	const [keywords, setKeywords] = useState("");
	const [yearFrom, setYearFrom] = useState("");
	const [yearTo, setYearTo] = useState("");
	const [minCitedByCount, setMinCitedByCount] = useState("");
	const [documentTypes, setDocumentTypes] = useState<string[]>([]);
	const [isOaOnly, setIsOaOnly] = useState(false);

	const [seedDoi, setSeedDoi] = useState("");
	const [seedDirection, setSeedDirection] = useState<SeedDirection>("citations");

	const handleSearchSubmit = () => {
		const filters: OpenAlexSearchFilters = {
			keywords: keywords.trim() || undefined,
			yearFrom: yearFrom ? Number(yearFrom) : undefined,
			yearTo: yearTo ? Number(yearTo) : undefined,
			minCitedByCount: minCitedByCount ? Number(minCitedByCount) : undefined,
			documentTypes: documentTypes.length > 0 ? documentTypes : undefined,
			isOaOnly: isOaOnly || undefined,
		};
		onSearch(filters);
	};

	const canSearch =
		keywords.trim() || documentTypes.length > 0 || yearFrom || yearTo;

	return (
		<div className="space-y-6">
			<StandardCard accentPlacement="top">
				<StandardCard.Header>
					<StandardCard.Title className="flex items-center gap-2">
						<Search className="h-4 w-4" /> Búsqueda en OpenAlex
					</StandardCard.Title>
					<StandardCard.Subtitle>
						<StandardText size="sm" colorScheme="secondary">
							Trae resultados a la mesa de triaje (máx. 200 por búsqueda). No
							se insertan directo a la base de artículos.
						</StandardText>
					</StandardCard.Subtitle>
				</StandardCard.Header>
				<StandardCard.Content>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="md:col-span-2">
							<StandardFormField
								label="Palabras clave"
								htmlFor="keywords"
								hint="Busca en título y abstract. Soporta AND/OR/NOT."
							>
								<StandardInput
									id="keywords"
									placeholder="ej. cognitive load AND remote work"
									value={keywords}
									onChange={(e) => setKeywords(e.target.value)}
								/>
							</StandardFormField>
						</div>

						<StandardFormField label="Año desde" htmlFor="year-from">
							<StandardInput
								id="year-from"
								type="number"
								placeholder="2020"
								value={yearFrom}
								onChange={(e) => setYearFrom(e.target.value)}
							/>
						</StandardFormField>

						<StandardFormField label="Año hasta" htmlFor="year-to">
							<StandardInput
								id="year-to"
								type="number"
								placeholder="2026"
								value={yearTo}
								onChange={(e) => setYearTo(e.target.value)}
							/>
						</StandardFormField>

						<StandardFormField label="Mínimo de citas" htmlFor="min-citations">
							<StandardInput
								id="min-citations"
								type="number"
								placeholder="0"
								value={minCitedByCount}
								onChange={(e) => setMinCitedByCount(e.target.value)}
							/>
						</StandardFormField>

						<StandardFormField label="Tipo de documento" htmlFor="doc-types">
							<StandardSelect
								id="doc-types"
								multiple
								options={DOCUMENT_TYPE_OPTIONS}
								value={documentTypes}
								onChange={(value) =>
									setDocumentTypes(Array.isArray(value) ? value : [])
								}
								placeholder="Todos"
							/>
						</StandardFormField>

						<div className="md:col-span-2">
							<StandardCheckbox
								label="Solo acceso abierto (Open Access)"
								checked={isOaOnly}
								onChange={(e) => setIsOaOnly(e.target.checked)}
							/>
						</div>
					</div>
				</StandardCard.Content>
				<StandardCard.Actions className="justify-end border-t border-neutral-200 dark:border-neutral-800">
					<StandardButton
						leftIcon={Search}
						onClick={handleSearchSubmit}
						loading={isSearching}
						disabled={!canSearch}
					>
						Buscar
					</StandardButton>
				</StandardCard.Actions>
			</StandardCard>

			<StandardCard accentPlacement="top" colorScheme="secondary">
				<StandardCard.Header>
					<StandardCard.Title className="flex items-center gap-2">
						<Sprout className="h-4 w-4" /> Búsqueda por semilla
					</StandardCard.Title>
					<StandardCard.Subtitle>
						<StandardText size="sm" colorScheme="secondary">
							Dado el DOI de un artículo, trae sus citas (quién lo cita) o sus
							referencias (a quién cita él).
						</StandardText>
					</StandardCard.Subtitle>
				</StandardCard.Header>
				<StandardCard.Content>
					<div className="space-y-4">
						<StandardFormField label="DOI del artículo semilla" htmlFor="seed-doi">
							<StandardInput
								id="seed-doi"
								placeholder="10.1234/example.2023.12345"
								value={seedDoi}
								onChange={(e) => setSeedDoi(e.target.value)}
							/>
						</StandardFormField>
						<StandardRadioGroup
							name="seed-direction"
							label="Dirección"
							options={[
								{ value: "citations", label: "Citas (quién lo cita)" },
								{ value: "references", label: "Referencias (a quién cita)" },
							]}
							value={seedDirection}
							onChange={(value: string) =>
								setSeedDirection(value as SeedDirection)
							}
							orientation="horizontal"
							size="sm"
						/>
					</div>
				</StandardCard.Content>
				<StandardCard.Actions className="justify-end border-t border-neutral-200 dark:border-neutral-800">
					<StandardButton
						colorScheme="secondary"
						leftIcon={Sprout}
						onClick={() => onHarvestBySeed(seedDoi.trim(), seedDirection)}
						loading={isSearching}
						disabled={!seedDoi.trim()}
					>
						Buscar por semilla
					</StandardButton>
				</StandardCard.Actions>
			</StandardCard>
		</div>
	);
}
//#endregion ![main]
