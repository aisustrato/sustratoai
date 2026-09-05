//. 📍 app/datos-maestros/harvest-openalex/components/SearchFiltersPanel.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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

const makeDocumentTypeOptions = (
	t: ReturnType<typeof useTranslations<"datosMaestrosPages.searchFiltersPanel">>,
): SelectOption[] => [
	{ value: "article", label: t("documentTypeArticle") },
	{ value: "preprint", label: t("documentTypePreprint") },
	{ value: "review", label: t("documentTypeReview") },
	{ value: "book-chapter", label: t("documentTypeBookChapter") },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function SearchFiltersPanel({
	onSearch,
	onHarvestBySeed,
	isSearching,
}: SearchFiltersPanelProps) {
	const t = useTranslations("datosMaestrosPages.searchFiltersPanel");
	const DOCUMENT_TYPE_OPTIONS = useMemo(() => makeDocumentTypeOptions(t), [t]);
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
						<Search className="h-4 w-4" /> {t("searchSectionTitle")}
					</StandardCard.Title>
					<StandardCard.Subtitle>
						<StandardText size="sm" colorScheme="secondary">
							{t("searchSectionSubtitle")}
						</StandardText>
					</StandardCard.Subtitle>
				</StandardCard.Header>
				<StandardCard.Content>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="md:col-span-2">
							<StandardFormField
								label={t("keywordsLabel")}
								htmlFor="keywords"
								hint={t("keywordsHint")}
							>
								<StandardInput
									id="keywords"
									placeholder={t("keywordsPlaceholder")}
									value={keywords}
									onChange={(e) => setKeywords(e.target.value)}
								/>
							</StandardFormField>
						</div>

						<StandardFormField label={t("yearFromLabel")} htmlFor="year-from">
							<StandardInput
								id="year-from"
								type="number"
								placeholder="2020"
								value={yearFrom}
								onChange={(e) => setYearFrom(e.target.value)}
							/>
						</StandardFormField>

						<StandardFormField label={t("yearToLabel")} htmlFor="year-to">
							<StandardInput
								id="year-to"
								type="number"
								placeholder="2026"
								value={yearTo}
								onChange={(e) => setYearTo(e.target.value)}
							/>
						</StandardFormField>

						<StandardFormField label={t("minCitationsLabel")} htmlFor="min-citations">
							<StandardInput
								id="min-citations"
								type="number"
								placeholder="0"
								value={minCitedByCount}
								onChange={(e) => setMinCitedByCount(e.target.value)}
							/>
						</StandardFormField>

						<StandardFormField label={t("documentTypeLabel")} htmlFor="doc-types">
							<StandardSelect
								id="doc-types"
								multiple
								options={DOCUMENT_TYPE_OPTIONS}
								value={documentTypes}
								onChange={(value) =>
									setDocumentTypes(Array.isArray(value) ? value : [])
								}
								placeholder={t("documentTypePlaceholder")}
							/>
						</StandardFormField>

						<div className="md:col-span-2">
							<StandardCheckbox
								label={t("openAccessOnlyLabel")}
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
						{t("searchButton")}
					</StandardButton>
				</StandardCard.Actions>
			</StandardCard>

			<StandardCard accentPlacement="top" colorScheme="secondary">
				<StandardCard.Header>
					<StandardCard.Title className="flex items-center gap-2">
						<Sprout className="h-4 w-4" /> {t("seedSectionTitle")}
					</StandardCard.Title>
					<StandardCard.Subtitle>
						<StandardText size="sm" colorScheme="secondary">
							{t("seedSectionSubtitle")}
						</StandardText>
					</StandardCard.Subtitle>
				</StandardCard.Header>
				<StandardCard.Content>
					<div className="space-y-4">
						<StandardFormField label={t("seedDoiLabel")} htmlFor="seed-doi">
							<StandardInput
								id="seed-doi"
								placeholder={t("seedDoiPlaceholder")}
								value={seedDoi}
								onChange={(e) => setSeedDoi(e.target.value)}
							/>
						</StandardFormField>
						<StandardRadioGroup
							name="seed-direction"
							label={t("directionLabel")}
							options={[
								{ value: "citations", label: t("directionCitations") },
								{ value: "references", label: t("directionReferences") },
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
						{t("searchBySeedButton")}
					</StandardButton>
				</StandardCard.Actions>
			</StandardCard>
		</div>
	);
}
//#endregion ![main]
