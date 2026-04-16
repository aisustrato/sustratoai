import { useState, useCallback } from "react";
import type { ArchetypeTone, HumanResponse } from "@/lib/types/minotauro-types";

interface Analysis {
	archetype: ArchetypeTone;
	status: "pending_calibration" | "calibrated" | "executed";
	comments: Array<{
		id: string;
		point: string;
		observation: string;
		userResponse?: HumanResponse;
		userNote?: string;
	}>;
	tokens: {
		totalTokenCount?: number;
		promptTokenCount?: number;
		completionTokenCount?: number;
	};
}

interface UseAnalysisHistoryReturn {
	analyses: Record<string, Analysis | null>;
	collapsedAnalyses: Record<string, boolean>;
	setAnalyses: React.Dispatch<
		React.SetStateAction<Record<string, Analysis | null>>
	>;
	toggleCollapse: (galaxyId: string) => void;
	dismissAnalysis: (galaxyId: string) => void;
}

export function useAnalysisHistory(
	initialAnalyses: Record<string, Analysis | null> = {},
): UseAnalysisHistoryReturn {
	const [analyses, setAnalyses] =
		useState<Record<string, Analysis | null>>(initialAnalyses);
	const [collapsedAnalyses, setCollapsedAnalyses] = useState<
		Record<string, boolean>
	>({});

	const toggleCollapse = useCallback((galaxyId: string) => {
		setCollapsedAnalyses((prev) => ({
			...prev,
			[galaxyId]: !prev[galaxyId],
		}));
	}, []);

	const dismissAnalysis = useCallback((galaxyId: string) => {
		setAnalyses((prev) => ({
			...prev,
			[galaxyId]: null,
		}));
	}, []);

	return {
		analyses,
		collapsedAnalyses,
		setAnalyses,
		toggleCollapse,
		dismissAnalysis,
	};
}
