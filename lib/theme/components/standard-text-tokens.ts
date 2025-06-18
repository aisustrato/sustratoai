//. 📍 lib/theme/components/standard-text-tokens.ts (v2.4 - Fuente de Verdad de Tipos)

import type { AppColorTokens, ColorSchemeVariant, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

//#region [def] - 📦 TYPES & INTERFACES 📦

// ✅ CORRECCIÓN ARQUITECTÓNICA: Los tipos de props se definen y exportan desde aquí.
export type StandardTextSize = "3xs" | "2xs" | "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
export type StandardTextWeight = "normal" | "medium" | "semibold" | "bold";
export type StandardTextAlign = "left" | "center" | "right" | "justify";
export type StandardTextColorShade = "pure" | "text" | "textShade" | "contrastText" | "subtle";
export type StandardTextGradient = ColorSchemeVariant | boolean;

export interface StandardTextTokenSet {
	pure: string;
	text: string;
	contrastText: string;
	textShade: string;
	subtle: string;
}

export type StandardTextTokens = {
	colors: Record<ColorSchemeVariant, StandardTextTokenSet>;
	gradients: Record<ColorSchemeVariant, string>;
}
//#endregion ![def]

// ... (la función generateStandardTextTokens no cambia)
export function generateStandardTextTokens(appColorTokens: AppColorTokens, mode: Mode): StandardTextTokens {
    // ... lógica existente
    const isDark = mode === "dark";
	const textColors = {} as Record<ColorSchemeVariant, StandardTextTokenSet>;
    const textGradients = {} as Record<ColorSchemeVariant, string>;

	for (const colorScheme in appColorTokens) {
		const key = colorScheme as ColorSchemeVariant;
		const colorSet = appColorTokens[key];

		if (colorSet) {
            const subtleColor = tinycolor.mix(colorSet.text, isDark ? '#A0A0A0' : '#888888', 70).toHexString();
			textColors[key] = {
				pure: colorSet.pure,
				text: colorSet.text,
				contrastText: colorSet.contrastText,
				textShade: colorSet.textShade,
                subtle: subtleColor,
			};
            
            const gradientStart = colorSet.pure;
            const gradientMiddle = tinycolor.mix(colorSet.pure, colorSet.text, 70).toHexString();
            const gradientEnd = colorSet.textShade;
            
            textGradients[key] = `linear-gradient(to right, ${gradientStart} 40%, ${gradientMiddle} 60%, ${gradientEnd} 100%)`;
		}
	}
	
	return {
        colors: textColors,
        gradients: textGradients,
    };
}