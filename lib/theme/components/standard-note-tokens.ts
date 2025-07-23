//. 📍 lib/theme/components/standard-note-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardNoteVariant =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral";

export type StandardNoteSize = "sm" | "md" | "lg";

export interface StandardNoteVariantTokens {
	// Editor container
	background: string;
	border: string;
	borderRadius: string;
	shadow: string;
	
	// Toolbar
	toolbarBackground: string;
	toolbarBorder: string;
	toolbarButtonBackground: string;
	toolbarButtonBackgroundHover: string;
	toolbarButtonBackgroundActive: string;
	toolbarButtonText: string;
	toolbarButtonTextHover: string;
	toolbarButtonTextActive: string;
	toolbarButtonBorder: string;
	toolbarButtonBorderHover: string;
	toolbarButtonBorderActive: string;
	toolbarSeparator: string;
	
	// Editor content
	editorBackground: string;
	editorText: string;
	editorPlaceholder: string;
	editorBorder: string;
	editorFocusBorder: string;
	editorFocusRing: string;
	
	// Mode toggle button
	modeToggleBackground: string;
	modeToggleBackgroundHover: string;
	modeToggleBackgroundActive: string;
	modeToggleText: string;
	modeToggleTextHover: string;
	modeToggleTextActive: string;
	modeToggleBorder: string;
	modeToggleBorderHover: string;
	modeToggleBorderActive: string;
	
	// Raw mode (textarea)
	rawBackground: string;
	rawText: string;
	rawBorder: string;
	rawPlaceholder: string;
	
	// States
	disabledBackground: string;
	disabledBorder: string;
	disabledText: string;
	readOnlyBackground: string;
	readOnlyBorder: string;
	readOnlyText: string;
}

export interface StandardNoteSizeTokens {
	containerHeight: string;
	containerMinHeight: string;
	toolbarHeight: string;
	toolbarPadding: string;
	editorPadding: string;
	fontSize: string;
	toolbarButtonSize: string;
	toolbarButtonPadding: string;
	toolbarButtonFontSize: string;
}

export interface StandardNoteTokens {
	variants: Record<StandardNoteVariant, StandardNoteVariantTokens>;
	sizes: Record<StandardNoteSize, StandardNoteSizeTokens>;
}
//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧
export function generateStandardNoteTokens(
	appColorTokens: AppColorTokens,
	mode: Mode
): StandardNoteTokens {
	const {
		primary, secondary, tertiary, accent,
		neutral,
	} = appColorTokens;

	const baseTextColor = neutral.text;
	const basePlaceholderColor = tinycolor(baseTextColor).setAlpha(0.6).toRgbString();
	
	// 🎨 LABORATORIO CREATIVO: Colores únicos para el editor de notas
	const editorBackgroundBase = mode === "dark" 
		? tinycolor(neutral.bg).lighten(2).toString()
		: tinycolor(neutral.contrastText).darken(1).toString();
	
	// Toolbar con un toque sutil de personalidad
	const toolbarBackgroundBase = mode === "dark"
		? tinycolor(neutral.bgShade).lighten(3).toString()
		: tinycolor(neutral.bg).darken(2).toString();
	
	// Botones de toolbar con gradientes sutiles
	const toolbarButtonGradient = mode === "dark"
		? `linear-gradient(135deg, ${tinycolor(neutral.pure).setAlpha(0.1).toString()}, ${tinycolor(neutral.pure).setAlpha(0.05).toString()})`
		: `linear-gradient(135deg, ${tinycolor(neutral.contrastText).setAlpha(0.8).toString()}, ${tinycolor(neutral.contrastText).setAlpha(0.95).toString()})`;

	const commonDisabledTokens = {
		disabledBackground: neutral.bgShade,
		disabledBorder: tinycolor(neutral.pure).setAlpha(0.3).toRgbString(),
		disabledText: tinycolor(baseTextColor).setAlpha(0.5).toRgbString(),
		readOnlyBackground: mode === "dark"
			? tinycolor(neutral.bgShade).lighten(2).setAlpha(0.7).toString()
			: tinycolor(neutral.contrastText).setAlpha(0.9).toString(),
		readOnlyBorder: tinycolor(neutral.pure).setAlpha(0.5).toRgbString(),
		readOnlyText: tinycolor(baseTextColor).setAlpha(0.8).toRgbString(),
	};

	const defaultVariantTokens: StandardNoteVariantTokens = {
		// Container
		background: editorBackgroundBase,
		border: neutral.pure,
		borderRadius: "0.75rem",
		shadow: mode === "dark" 
			? `0 4px 6px -1px ${tinycolor("#000").setAlpha(0.3).toString()}, 0 2px 4px -1px ${tinycolor("#000").setAlpha(0.2).toString()}`
			: `0 4px 6px -1px ${tinycolor(neutral.pure).setAlpha(0.1).toString()}, 0 2px 4px -1px ${tinycolor(neutral.pure).setAlpha(0.06).toString()}`,
		
		// Toolbar
		toolbarBackground: toolbarBackgroundBase,
		toolbarBorder: tinycolor(neutral.pure).setAlpha(0.8).toRgbString(),
		toolbarButtonBackground: toolbarButtonGradient,
		toolbarButtonBackgroundHover: mode === "dark"
			? tinycolor(primary.bg).setAlpha(0.2).toString()
			: tinycolor(primary.bg).setAlpha(0.8).toString(),
		toolbarButtonBackgroundActive: mode === "dark"
			? tinycolor(primary.bg).setAlpha(0.3).toString()
			: tinycolor(primary.bg).setAlpha(0.9).toString(),
		toolbarButtonText: baseTextColor,
		toolbarButtonTextHover: primary.text,
		toolbarButtonTextActive: primary.contrastText,
		toolbarButtonBorder: tinycolor(neutral.pure).setAlpha(0.4).toRgbString(),
		toolbarButtonBorderHover: tinycolor(primary.pure).setAlpha(0.6).toRgbString(),
		toolbarButtonBorderActive: primary.pure,
		toolbarSeparator: tinycolor(neutral.pure).setAlpha(0.3).toRgbString(),
		
		// Editor content
		editorBackground: editorBackgroundBase,
		editorText: baseTextColor,
		editorPlaceholder: basePlaceholderColor,
		editorBorder: tinycolor(neutral.pure).setAlpha(0.6).toRgbString(),
		editorFocusBorder: primary.pure,
		editorFocusRing: tinycolor(primary.pure).setAlpha(0.25).toRgbString(),
		
		// Mode toggle
		modeToggleBackground: mode === "dark"
			? tinycolor(accent.bg).setAlpha(0.2).toString()
			: tinycolor(accent.bg).setAlpha(0.8).toString(),
		modeToggleBackgroundHover: mode === "dark"
			? tinycolor(accent.bg).setAlpha(0.3).toString()
			: tinycolor(accent.bg).setAlpha(0.9).toString(),
		modeToggleBackgroundActive: accent.bg,
		modeToggleText: accent.text,
		modeToggleTextHover: accent.text,
		modeToggleTextActive: accent.contrastText,
		modeToggleBorder: tinycolor(accent.pure).setAlpha(0.5).toRgbString(),
		modeToggleBorderHover: tinycolor(accent.pure).setAlpha(0.7).toRgbString(),
		modeToggleBorderActive: accent.pure,
		
		// Raw mode
		rawBackground: mode === "dark"
			? tinycolor(neutral.bg).lighten(1).toString()
			: tinycolor(neutral.contrastText).darken(0.5).toString(),
		rawText: baseTextColor,
		rawBorder: tinycolor(neutral.pure).setAlpha(0.5).toRgbString(),
		rawPlaceholder: basePlaceholderColor,
		
		...commonDisabledTokens,
	};

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const createColoredVariant = (
		variantMainShade: ColorShade,
		focusShadeInput?: ColorShade
	): StandardNoteVariantTokens => {
		const effectiveFocusShade = focusShadeInput || variantMainShade;
		
		// 🎨 LABORATORIO: Cada variante tiene su propia personalidad
		const variantEditorBg = mode === "dark"
			? tinycolor(variantMainShade.bg).setAlpha(0.1).toString()
			: tinycolor(variantMainShade.contrastText).setAlpha(0.95).toString();
		
		const variantToolbarBg = mode === "dark"
			? tinycolor(variantMainShade.bgShade).lighten(2).toString()
			: tinycolor(variantMainShade.bg).setAlpha(0.8).toString();
		
		const variantButtonGradient = mode === "dark"
			? `linear-gradient(135deg, ${tinycolor(variantMainShade.pure).setAlpha(0.15).toString()}, ${tinycolor(variantMainShade.pure).setAlpha(0.08).toString()})`
			: `linear-gradient(135deg, ${tinycolor(variantMainShade.contrastText).setAlpha(0.9).toString()}, ${tinycolor(variantMainShade.bg).setAlpha(0.7).toString()})`;

		return {
			// Container
			background: variantEditorBg,
			border: tinycolor(variantMainShade.pure).setAlpha(0.7).toRgbString(),
			borderRadius: "0.75rem",
			shadow: mode === "dark" 
				? `0 4px 6px -1px ${tinycolor(variantMainShade.pure).setAlpha(0.2).toString()}, 0 2px 4px -1px ${tinycolor(variantMainShade.pure).setAlpha(0.1).toString()}`
				: `0 4px 6px -1px ${tinycolor(variantMainShade.pure).setAlpha(0.08).toString()}, 0 2px 4px -1px ${tinycolor(variantMainShade.pure).setAlpha(0.04).toString()}`,
			
			// Toolbar
			toolbarBackground: variantToolbarBg,
			toolbarBorder: tinycolor(variantMainShade.pure).setAlpha(0.6).toRgbString(),
			toolbarButtonBackground: variantButtonGradient,
			toolbarButtonBackgroundHover: mode === "dark"
				? tinycolor(variantMainShade.bg).setAlpha(0.3).toString()
				: tinycolor(variantMainShade.bg).setAlpha(0.9).toString(),
			toolbarButtonBackgroundActive: variantMainShade.bg,
			toolbarButtonText: baseTextColor,
			toolbarButtonTextHover: variantMainShade.text,
			toolbarButtonTextActive: variantMainShade.contrastText,
			toolbarButtonBorder: tinycolor(variantMainShade.pure).setAlpha(0.4).toRgbString(),
			toolbarButtonBorderHover: tinycolor(variantMainShade.pure).setAlpha(0.7).toRgbString(),
			toolbarButtonBorderActive: variantMainShade.pure,
			toolbarSeparator: tinycolor(variantMainShade.pure).setAlpha(0.3).toRgbString(),
			
			// Editor content
			editorBackground: variantEditorBg,
			editorText: baseTextColor,
			editorPlaceholder: basePlaceholderColor,
			editorBorder: tinycolor(variantMainShade.pure).setAlpha(0.5).toRgbString(),
			editorFocusBorder: effectiveFocusShade.pure,
			editorFocusRing: tinycolor(effectiveFocusShade.pure).setAlpha(0.25).toRgbString(),
			
			// Mode toggle
			modeToggleBackground: mode === "dark"
				? tinycolor(accent.bg).setAlpha(0.2).toString()
				: tinycolor(accent.bg).setAlpha(0.8).toString(),
			modeToggleBackgroundHover: mode === "dark"
				? tinycolor(accent.bg).setAlpha(0.3).toString()
				: tinycolor(accent.bg).setAlpha(0.9).toString(),
			modeToggleBackgroundActive: accent.bg,
			modeToggleText: accent.text,
			modeToggleTextHover: accent.text,
			modeToggleTextActive: accent.contrastText,
			modeToggleBorder: tinycolor(accent.pure).setAlpha(0.5).toRgbString(),
			modeToggleBorderHover: tinycolor(accent.pure).setAlpha(0.7).toRgbString(),
			modeToggleBorderActive: accent.pure,
			
			// Raw mode
			rawBackground: mode === "dark"
				? tinycolor(variantMainShade.bg).setAlpha(0.1).toString()
				: tinycolor(variantMainShade.contrastText).setAlpha(0.95).toString(),
			rawText: baseTextColor,
			rawBorder: tinycolor(variantMainShade.pure).setAlpha(0.5).toRgbString(),
			rawPlaceholder: basePlaceholderColor,
			
			...commonDisabledTokens,
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
				containerHeight: "h-64",
				containerMinHeight: "min-h-[16rem]",
				toolbarHeight: "h-10",
				toolbarPadding: "px-2 py-1",
				editorPadding: "p-3",
				fontSize: "text-sm",
				toolbarButtonSize: "h-8 w-8",
				toolbarButtonPadding: "p-1",
				toolbarButtonFontSize: "text-xs",
			},
			md: {
				containerHeight: "h-80",
				containerMinHeight: "min-h-[20rem]",
				toolbarHeight: "h-12",
				toolbarPadding: "px-3 py-2",
				editorPadding: "p-4",
				fontSize: "text-base",
				toolbarButtonSize: "h-9 w-9",
				toolbarButtonPadding: "p-1.5",
				toolbarButtonFontSize: "text-sm",
			},
			lg: {
				containerHeight: "h-96",
				containerMinHeight: "min-h-[24rem]",
				toolbarHeight: "h-14",
				toolbarPadding: "px-4 py-2.5",
				editorPadding: "p-5",
				fontSize: "text-lg",
				toolbarButtonSize: "h-10 w-10",
				toolbarButtonPadding: "p-2",
				toolbarButtonFontSize: "text-base",
			},
		},
	};
}
//#endregion ![main]
