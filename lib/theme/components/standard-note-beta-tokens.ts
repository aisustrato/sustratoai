//. 📍 lib/theme/components/standard-note-beta-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardNoteBetaVariant =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral";

export type StandardNoteBetaSize = "sm" | "md" | "lg";

export interface StandardNoteBetaVariantTokens {
	background: string;
	border: string;
	text: string;
	placeholder: string;
	focusBorder: string;
	focusRing: string;
	hoverBorder: string;
	disabledBackground: string;
	disabledBorder: string;
	disabledText: string;
	readOnlyBackground: string;
	readOnlyBorder: string;
	readOnlyText: string;
	toolbarBackground: string;
	toolbarBorder: string;
	previewBackground: string;
	previewBorder: string;
}

export interface StandardNoteBetaSizeTokens {
	fontSize: string;
	paddingX: string;
	paddingY: string;
	minHeight: string;
}

export interface StandardNoteBetaTokens {
	variants: Record<StandardNoteBetaVariant, StandardNoteBetaVariantTokens>;
	sizes: Record<StandardNoteBetaSize, StandardNoteBetaSizeTokens>;
}
//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧
export function generateStandardNoteBetaTokens(
	appColorTokens: AppColorTokens,
	mode: Mode
): StandardNoteBetaTokens {
	const {
		primary, secondary, tertiary, accent,
		neutral,
	} = appColorTokens;

	const baseTextColor = neutral.text;
	const basePlaceholderColor = tinycolor(baseTextColor).setAlpha(0.6).toRgbString();

	const commonDisabledBackground = neutral.bgShade;
	const commonDisabledBorder = tinycolor(neutral.pure).setAlpha(0.4).toRgbString();
	const commonDisabledText = tinycolor(baseTextColor).setAlpha(0.5).toRgbString();

	const commonReadOnlyBackground = mode === "dark"
		? tinycolor(neutral.bgShade).lighten(5).setAlpha(0.8).toString()
		: tinycolor(neutral.contrastText).darken(0).setAlpha(0.8).toString();
	const commonReadOnlyBorder = mode === "dark"
		? tinycolor(neutral.pure).darken(10).toRgbString()
		: tinycolor(neutral.pure).lighten(10).toRgbString();
	const commonReadOnlyText = baseTextColor;

	// Colores específicos para el editor de notas
	const toolbarBackground = mode === "dark"
		? tinycolor(neutral.bgShade).lighten(3).toString()
		: tinycolor(neutral.contrastText).darken(2).toString();
	const toolbarBorder = mode === "dark"
		? tinycolor(neutral.pure).darken(5).toString()
		: tinycolor(neutral.pure).lighten(5).toString();

	const previewBackground = mode === "dark"
		? tinycolor(neutral.bg).lighten(2).toString()
		: tinycolor(neutral.contrastText).darken(1).toString();

	const defaultVariantTokens: StandardNoteBetaVariantTokens = {
		background: neutral.bg,
		border: neutral.pure,
		text: baseTextColor,
		placeholder: basePlaceholderColor,
		focusBorder: primary.pure,
		focusRing: tinycolor(primary.pure).setAlpha(0.25).toRgbString(),
		hoverBorder: mode === "dark" 
			? tinycolor(neutral.pure).lighten(10).toString() 
			: neutral.bgShade,
		disabledBackground: commonDisabledBackground,
		disabledBorder: commonDisabledBorder,
		disabledText: commonDisabledText,
		readOnlyBackground: commonReadOnlyBackground,
		readOnlyBorder: commonReadOnlyBorder,
		readOnlyText: commonReadOnlyText,
		toolbarBackground: toolbarBackground,
		toolbarBorder: toolbarBorder,
		previewBackground: previewBackground,
		previewBorder: neutral.pure,
	};

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const createColoredVariant = (
		variantMainShade: ColorShade,
		focusShadeInput?: ColorShade
	): StandardNoteBetaVariantTokens => {
		const effectiveFocusShade = focusShadeInput || variantMainShade;
		
		// Crear fondos sutiles para las variantes coloreadas
		const subtleBackground = mode === "dark"
			? tinycolor(variantMainShade.bg).setAlpha(0.1).toString()
			: tinycolor(variantMainShade.bg).setAlpha(0.05).toString();

		const subtleToolbarBackground = mode === "dark"
			? tinycolor(variantMainShade.bg).setAlpha(0.15).toString()
			: tinycolor(variantMainShade.bg).setAlpha(0.08).toString();

		const subtlePreviewBackground = mode === "dark"
			? tinycolor(variantMainShade.bg).setAlpha(0.12).toString()
			: tinycolor(variantMainShade.bg).setAlpha(0.06).toString();

		return {
			background: subtleBackground,
			border: tinycolor(variantMainShade.pure).setAlpha(0.3).toString(),
			text: baseTextColor,
			placeholder: basePlaceholderColor,
			focusBorder: effectiveFocusShade.pure,
			focusRing: tinycolor(effectiveFocusShade.pure).setAlpha(0.25).toRgbString(),
			hoverBorder: mode === "dark" 
				? tinycolor(variantMainShade.pure).lighten(10).toString() 
				: variantMainShade.bgShade,
			disabledBackground: commonDisabledBackground,
			disabledBorder: commonDisabledBorder,
			disabledText: commonDisabledText,
			readOnlyBackground: commonReadOnlyBackground,
			readOnlyBorder: commonReadOnlyBorder,
			readOnlyText: commonReadOnlyText,
			toolbarBackground: subtleToolbarBackground,
			toolbarBorder: tinycolor(variantMainShade.pure).setAlpha(0.2).toString(),
			previewBackground: subtlePreviewBackground,
			previewBorder: tinycolor(variantMainShade.pure).setAlpha(0.3).toString(),
		};
	};
	//#endregion ![sub]

	return {
		variants: {
			default: defaultVariantTokens,
			primary: createColoredVariant(primary),
			secondary: createColoredVariant(secondary),
			tertiary: createColoredVariant(tertiary),
			accent: createColoredVariant(accent),
			neutral: createColoredVariant(neutral, primary),
		},
		sizes: {
			sm: { 
				fontSize: "text-xs", 
				paddingX: "px-2", 
				paddingY: "py-1.5", 
				minHeight: "min-h-[100px]" 
			},
			md: { 
				fontSize: "text-sm", 
				paddingX: "px-3", 
				paddingY: "py-2", 
				minHeight: "min-h-[120px]" 
			},
			lg: { 
				fontSize: "text-base", 
				paddingX: "px-4", 
				paddingY: "py-2.5", 
				minHeight: "min-h-[150px]" 
			},
		},
	};
}
//#endregion ![main]
