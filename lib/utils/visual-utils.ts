import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { Database } from "@/lib/database.types";

export const getVisualsForBatchStatus = (
	status: Database["public"]["Enums"]["batch_status"] | string | undefined | null
): { emoticon: string; colorScheme: ColorSchemeVariant; label: string } => {
	if (!status) return { emoticon: "❔", colorScheme: "neutral", label: "Desconocido" };

	// Estandarizamos los estados que vienen de diferentes fuentes
	const upperCaseStatus = status.toUpperCase();

	switch (upperCaseStatus) {
		// Estados de ProjectBatchesDisplay
		case "PENDING":
			return { emoticon: "🕘", colorScheme: "neutral", label: "Pendiente" };
		case "ASSIGNED":
			return { emoticon: "👤", colorScheme: "primary", label: "Asignado" };
		case "IN_PROGRESS":
			return { emoticon: "🚀", colorScheme: "tertiary", label: "En Progreso" };
		case "COMPLETED":
			return { emoticon: "✅", colorScheme: "success", label: "Completado" };
		case "PAUSED":
			return { emoticon: "⏸️", colorScheme: "warning", label: "Pausado" };
		case "ERROR":
			return { emoticon: "❌", colorScheme: "danger", label: "Error" };

		// Estados adicionales de Preclasificacion
		case "TRANSLATED":
			return { emoticon: "🇪🇸", colorScheme: "tertiary", label: "Traducido" };
		case "REVIEW_PENDING":
			return { emoticon: "🔍", colorScheme: "primary", label: "Pend. Revisión" };
		case "RECONCILIATION_PENDING":
			return { emoticon: "🔄", colorScheme: "accent", label: "Pend. Reconciliación" };
		case "VALIDATED":
			return { emoticon: "👍🏻", colorScheme: "warning", label: "Validado" };
		case "RECONCILED":
			return { emoticon: "🤝", colorScheme: "success", label: "Reconciliado" };
		case "DISPUTED":
			return { emoticon: "⚠️", colorScheme: "danger", label: "En Disputa" };

		default:
			return { emoticon: "❔", colorScheme: "neutral", label: status };
	}
};
