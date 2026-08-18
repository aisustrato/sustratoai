//. 📍 app/datos-maestros/harvest-openalex/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Pesca masiva de literatura vía OpenAlex hacia un buffer de staging, con
 * triaje rápido y promoción a la tabla maestra `articles`. Ver
 * docs/preclasificacion-auditoria-funcional/04_Requerimiento_OpenAlex_Harvester.md
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { toast } from "sonner";
import { Microscope } from "lucide-react";
import { useAuth } from "@/app/auth-provider";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
	StandardTabsContent,
} from "@/components/ui/StandardTabs";
import { SearchFiltersPanel } from "./components/SearchFiltersPanel";
import { StagingTriageView } from "./components/StagingTriageView";
import { searchOpenAlex, harvestBySeed } from "@/lib/actions/openalex-actions";
import type { OpenAlexSearchFilters, SeedDirection } from "@/lib/types/openalex-types";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
export default function HarvestOpenAlexPage() {
	const { proyectoActual } = useAuth();
	const [activeTab, setActiveTab] = useState("buscar");
	const [isSearching, setIsSearching] = useState(false);
	const [triageRefreshKey, setTriageRefreshKey] = useState(0);

	const handleSearch = async (filters: OpenAlexSearchFilters) => {
		if (!proyectoActual) return;
		setIsSearching(true);
		const result = await searchOpenAlex(proyectoActual.id, filters);
		if (result.success) {
			const { fetchedCount, insertedCount, skippedDuplicates } = result.data;
			toast.success(
				`OpenAlex trajo ${fetchedCount} resultado(s): ${insertedCount} nuevo(s) en staging, ${skippedDuplicates} duplicado(s) omitido(s).`,
			);
			setTriageRefreshKey((k) => k + 1);
			setActiveTab("triaje");
		} else {
			toast.error(result.error);
		}
		setIsSearching(false);
	};

	const handleHarvestBySeed = async (seedDoi: string, direction: SeedDirection) => {
		if (!proyectoActual) return;
		setIsSearching(true);
		const result = await harvestBySeed(proyectoActual.id, seedDoi, direction);
		if (result.success) {
			const { fetchedCount, insertedCount, skippedDuplicates } = result.data;
			toast.success(
				`Semilla trajo ${fetchedCount} resultado(s): ${insertedCount} nuevo(s) en staging, ${skippedDuplicates} duplicado(s) omitido(s).`,
			);
			setTriageRefreshKey((k) => k + 1);
			setActiveTab("triaje");
		} else {
			toast.error(result.error);
		}
		setIsSearching(false);
	};

	if (!proyectoActual) {
		return null;
	}

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<StandardPageTitle
				title="Pesca OpenAlex"
				subtitle="Busca literatura en OpenAlex y triála antes de sumarla a tus artículos."
				mainIcon={Microscope}
				breadcrumbs={[
					{ label: "Datos Maestros", href: "/datos-maestros" },
					{ label: "Pesca OpenAlex", href: "/datos-maestros/harvest-openalex" },
				]}
				showBackButton={{ href: "/datos-maestros" }}
			/>

			<StandardTabs value={activeTab} onValueChange={setActiveTab}>
				<StandardTabsList className="grid w-full grid-cols-2">
					<StandardTabsTrigger value="buscar">Buscar</StandardTabsTrigger>
					<StandardTabsTrigger value="triaje">Triaje</StandardTabsTrigger>
				</StandardTabsList>

				<StandardTabsContent value="buscar" className="pt-4">
					<SearchFiltersPanel
						onSearch={handleSearch}
						onHarvestBySeed={handleHarvestBySeed}
						isSearching={isSearching}
					/>
				</StandardTabsContent>

				<StandardTabsContent value="triaje" className="pt-4">
					<StagingTriageView
						projectId={proyectoActual.id}
						refreshKey={triageRefreshKey}
					/>
				</StandardTabsContent>
			</StandardTabs>
		</div>
	);
}
//#endregion ![main]
