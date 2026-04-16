//. 📍 /components/ui/StandardAccordion/standard-accordion-context.ts

import { createContext, useContext } from "react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { DesignTokens } from "@/app/providers/DesignTokensProvider";

export interface StandardAccordionContextValue {
	colorScheme: ColorSchemeVariant;
	size: "sm" | "md" | "lg";
	styleType: "subtle" | "solid";
	designTokens: DesignTokens | null;
	openItems: string[];
}

export const StandardAccordionContext =
	createContext<StandardAccordionContextValue | null>(null);

export const useStandardAccordion = () => {
	const context = useContext(StandardAccordionContext);
	if (!context) {
		throw new Error(
			"useStandardAccordion must be used within a StandardAccordion provider",
		);
	}
	return context;
};
