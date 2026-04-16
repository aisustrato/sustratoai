import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
	getUniverseFull,
	deleteUniverse,
} from "@/lib/actions/minotauro-actions";
import type { MinotauroUniverseFull } from "@/lib/types/minotauro-types";

// Tipo local para análisis
interface Analysis {
	archetype?: string;
	status?: string;
	comments?: Array<{ id: string; point: string; observation?: string }>;
	tokens?: { totalTokenCount?: number };
}

interface GalaxyContent {
	title: string;
	description: string;
	content: string;
}

interface UseUniverseDataReturn {
	universe: MinotauroUniverseFull | null;
	loading: boolean;
	galaxies: MinotauroUniverseFull["galaxies"];
	initialContent: Record<string, GalaxyContent>;
	initialAnalyses: Record<string, Analysis | null>;
	loadUniverse: () => Promise<void>;
	handleDeleteUniverse: () => Promise<void>;
}

export function useUniverseData(universeId: string): UseUniverseDataReturn {
	const router = useRouter();
	const { toast } = useToast();

	const [universe, setUniverse] = useState<MinotauroUniverseFull | null>(null);
	const [loading, setLoading] = useState(true);
	const [initialContent, setInitialContent] = useState<
		Record<string, GalaxyContent>
	>({});
	const [initialAnalyses, setInitialAnalyses] = useState<
		Record<string, Analysis | null>
	>({});

	const loadUniverse = useCallback(async () => {
		setLoading(true);
		const result = await getUniverseFull(universeId);

		if (result.success && result.data) {
			setUniverse(result.data);

			const content: Record<string, GalaxyContent> = {};
			const analyses: Record<string, Analysis | null> = {};

			// Validar que galaxies existe y es un array
			const galaxies = result.data.galaxies || [];

			galaxies.forEach((item) => {
				const meta = (item.galaxy.metadata as Record<string, unknown>) || {};
				content[item.galaxy.id] = {
					title: item.galaxy.title,
					description: item.galaxy.description || "",
					content: (meta.content as string) || "",
				};

				// Ya no se necesita cargar análisis aquí - se leen directamente desde metadata en el componente
			});

			setInitialContent(content);
			setInitialAnalyses(analyses);
		} else {
			toast({
				title: "Error al cargar universo",
				description: result.error || "No se pudo cargar el escrito",
				variant: "destructive",
			});
			router.push("/cognetica/minotauro");
		}

		setLoading(false);
	}, [universeId, router, toast]);

	const handleDeleteUniverse = useCallback(async () => {
		if (
			!confirm(
				"¿Estás seguro de eliminar este universo? Esta acción no se puede deshacer.",
			)
		) {
			return;
		}

		const result = await deleteUniverse(universeId);

		if (result.success) {
			toast({
				title: "🗑️ Universo eliminado",
				description: "El escrito ha sido eliminado",
			});
			router.push("/cognetica/minotauro");
		} else {
			toast({
				title: "Error al eliminar",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}
	}, [universeId, router, toast]);

	useEffect(() => {
		loadUniverse();
	}, [loadUniverse]);

	const galaxies = universe?.galaxies || [];

	return {
		universe,
		loading,
		galaxies,
		initialContent,
		initialAnalyses,
		loadUniverse,
		handleDeleteUniverse,
	};
}
