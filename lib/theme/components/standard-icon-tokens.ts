//. 📍 lib/theme/components/standard-icon-tokens.ts (v2.9 - Fuente de Verdad de Tipos)

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorSchemeVariant, ColorShade, Mode } from "../ColorToken";
// ✅ Se importa el tipo de tamaño base para mantener una escala consistente.
import type { StandardTextSize } from "./standard-text-tokens";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦

// ✅ CORRECCIÓN ARQUITECTÓNICA: El tipo de tamaño del icono se define y exporta desde aquí.
export type StandardIconSize = StandardTextSize;

export type StandardIconStyleType = "solid" | "outline" | "outlineGradient" | "inverseStroke";
export type StandardIconColorShade = "pure" | "text" | "textShade" | "bg" | "contrastText" | "subtle";

export type StandardIconRecipe = {
	fill: string;
	stroke: string;
	defs: string;
};

// ✅ NUEVO: Mapeo de tamaños de icono a valores rem para consistencia.
export const standardIconSizeTokens: Record<StandardIconSize, string> = {
	"4xs": "0.625rem", // 10px
	"3xs": "0.75rem", // 12px
	"2xs": "0.875rem", // 14px
	xs: "1rem", // 16px
	sm: "1.125rem", // 18px
	base: "1.25rem", // 20px
	md: "1.5rem", // 24px
	lg: "1.75rem", // 28px
	xl: "2rem", // 32px
	"2xl": "2.5rem", // 40px
	"3xl": "3rem", // 48px
	"4xl": "3.5rem", // 56px
	"5xl": "4rem", // 64px
};
//#endregion ![def]

// ... (la función generateStandardIconTokens no cambia)
export function generateStandardIconTokens(
	appTokens: AppColorTokens,
	mode: Mode,
	colorScheme: ColorSchemeVariant = "neutral",
	styleType: StandardIconStyleType = "solid",
	colorShade: StandardIconColorShade = "pure"
): StandardIconRecipe {
    // ... lógica existente
	const palette: ColorShade = appTokens[colorScheme] || appTokens.neutral;
	const isDark = mode === "dark";

	let effectiveColor: string;
	if (colorShade === 'subtle') {
		effectiveColor = tinycolor.mix(palette.text, isDark ? '#A0A0A0' : '#888888', 70).toHexString();
	} else {
		effectiveColor = palette[colorShade] || palette.pure;
	}

	switch (styleType) {
		case "solid":
		case "outline": {
			return {
				fill: styleType === 'solid' ? effectiveColor : 'none',
				stroke: styleType === 'outline' ? effectiveColor : 'none',
				defs: "",
			};
		}
		case "outlineGradient": {
			const gradientId = `sig-og-${colorScheme}`;
			const startColor = palette.bgShade;
			const endColor = palette.pure;
			const defs = `<defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${startColor}" /><stop offset="100%" stop-color="${endColor}" /></linearGradient></defs>`;
			return { fill: "none", stroke: `url(#${gradientId})`, defs: defs };
		}
		case "inverseStroke": {
			const fillId = `sig-is-inverse-fill-${colorScheme}`;
			const strokeId = `sig-is-inverse-stroke-${colorScheme}`;
			const strokeStart = palette.bgShade;
			const strokeEnd = palette.pure;
			const fillStart = strokeEnd;
			const fillEnd = strokeStart;
			const defs = `<defs><linearGradient id="${fillId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${fillStart}" /><stop offset="100%" stop-color="${fillEnd}" /></linearGradient><linearGradient id="${strokeId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${strokeStart}" /><stop offset="100%" stop-color="${strokeEnd}" /></linearGradient></defs>`;
			return { fill: `url(#${fillId})`, stroke: `url(#${strokeId})`, defs: defs };
		}
		default: {
			return {
				fill: palette.pure,
				stroke: "none",
				defs: "",
			};
		}
	}
}