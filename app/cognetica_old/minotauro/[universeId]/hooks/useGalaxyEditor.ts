import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateGalaxy, deleteGalaxy } from "@/lib/actions/minotauro-actions";
import type { MinotauroUniverseFull } from "@/lib/types/minotauro-types";

interface GalaxyContent {
	title: string;
	description: string;
	content: string;
}

interface TextMetrics {
	words: number;
	characters: number;
	estimatedPages: number;
}

function calculateTextMetrics(text: string): TextMetrics {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	const characters = text.length;
	const estimatedPages = words / 250;

	return { words, characters, estimatedPages };
}

interface UseGalaxyEditorReturn {
	editingContent: Record<string, GalaxyContent>;
	expandedSections: Set<string>;
	setEditingContent: React.Dispatch<
		React.SetStateAction<Record<string, GalaxyContent>>
	>;
	handleSaveSection: (galaxyId: string) => Promise<void>;
	handleDeleteGalaxy: (galaxyId: string) => Promise<void>;
	handleContentChange: (galaxyId: string, newContent: string) => void;
	handleFieldChange: (
		galaxyId: string,
		field: keyof GalaxyContent,
		value: string,
	) => void;
	toggleSection: (galaxyId: string) => void;
}

export function useGalaxyEditor(
	initialContent: Record<string, GalaxyContent>,
	galaxies: MinotauroUniverseFull["galaxies"],
	onReload: () => Promise<void>,
): UseGalaxyEditorReturn {
	const { toast } = useToast();

	const [editingContent, setEditingContent] =
		useState<Record<string, GalaxyContent>>(initialContent);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(),
	);

	const handleSaveSection = useCallback(
		async (galaxyId: string) => {
			const content = editingContent[galaxyId];
			if (!content) return;

			const metrics = calculateTextMetrics(content.content);

			const currentGalaxy = galaxies.find((g) => g.galaxy.id === galaxyId);
			const currentMetadata =
				(currentGalaxy?.galaxy.metadata as Record<string, unknown>) || {};

			const result = await updateGalaxy(galaxyId, {
				title: content.title.trim(),
				description: content.description.trim() || undefined,
				metadata: {
					...currentMetadata,
					content: content.content.trim() || "",
					word_count: metrics.words,
					char_count: metrics.characters,
					estimated_pages: metrics.estimatedPages,
				},
			});

			if (result.success) {
				toast({
					title: "✅ Sección guardada",
					description: "Cambios guardados exitosamente",
				});
				await onReload();
			} else {
				toast({
					title: "Error al guardar",
					description: result.error || "Intenta nuevamente",
					variant: "destructive",
				});
			}
		},
		[editingContent, galaxies, onReload, toast],
	);

	const handleDeleteGalaxy = useCallback(
		async (galaxyId: string) => {
			if (!confirm("¿Eliminar esta sección?")) return;

			const result = await deleteGalaxy(galaxyId);
			if (result.success) {
				toast({
					title: "🗑️ Sección eliminada",
					description: "La sección ha sido eliminada",
				});
				await onReload();
			} else {
				toast({
					title: "Error al eliminar",
					description: result.error || "Intenta nuevamente",
					variant: "destructive",
				});
			}
		},
		[onReload, toast],
	);

	const handleContentChange = useCallback(
		(galaxyId: string, newContent: string) => {
			setEditingContent((prev) => ({
				...prev,
				[galaxyId]: {
					...prev[galaxyId],
					content: newContent,
				},
			}));
		},
		[],
	);

	const handleFieldChange = useCallback(
		(galaxyId: string, field: keyof GalaxyContent, value: string) => {
			setEditingContent((prev) => ({
				...prev,
				[galaxyId]: {
					...prev[galaxyId],
					[field]: value,
				},
			}));
		},
		[],
	);

	const toggleSection = useCallback((galaxyId: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(galaxyId)) {
				newSet.delete(galaxyId);
			} else {
				newSet.add(galaxyId);
			}
			return newSet;
		});
	}, []);

	return {
		editingContent,
		expandedSections,
		setEditingContent,
		handleSaveSection,
		handleDeleteGalaxy,
		handleContentChange,
		handleFieldChange,
		toggleSection,
	};
}
