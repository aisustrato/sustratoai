// 📍 lib/theme/resolved-style.ts
// 🎯 PROPÓSITO: Capa de resolución agnóstica — un componente pide "primary solid md"
//              y recibe todos los valores concretos ya calculados desde el tema.
// 🔧 DECISIÓN: Inspirado en el trait Component de rustsustrato.
//              Encapsula los generadores de tokens existentes.

import type { AppColorTokens, ColorSchemeVariant, Mode } from "./ColorToken";
import type { AppFontTokens, FontPairId } from "./font-tokens";
import { createAppFontTokens } from "./font-tokens";
import { generateStandardButtonTokens } from "./components/standard-button-tokens";
import type { StandardButtonTokenOptions, StandardButtonStyleType, StandardButtonSize, StandardButtonRounded, StandardButtonModifier } from "./components/standard-button-tokens";
import type { StandardTextSize, StandardTextWeight } from "./components/standard-text-tokens";

//#region [core] — ResolvedStyle

export interface ResolvedStyle {
	backgroundColor: string;
	textColor: string;
	borderColor: string;
	borderStyle: string;
	fontSize: string;
	fontWeight: number;
	fontFamily: string;
	padding: string;
	borderRadius: string;
	boxShadow: string;
	opacity: number;
	cursor: string;
	textDecoration?: string;
}

//#endregion

//#region [theme context] — lo que se pasa a resolve()

export interface ThemeContext {
	colorTokens: AppColorTokens;
	fontTokens: AppFontTokens;
	mode: Mode;
}

export function createThemeContext(
	colorTokens: AppColorTokens,
	mode: Mode,
	fontPairId?: FontPairId,
): ThemeContext {
	return {
		colorTokens,
		fontTokens: createAppFontTokens(fontPairId),
		mode,
	};
}

//#endregion

//#region [button] — resolveButtonStyle

export interface ButtonConfig {
	variant?: ColorSchemeVariant;
	styleType?: StandardButtonStyleType;
	size?: StandardButtonSize;
	rounded?: StandardButtonRounded;
	modifiers?: StandardButtonModifier[];
	disabled?: boolean;
	isHovered?: boolean;
	isPressed?: boolean;
	iconOnly?: boolean;
}

export function resolveButtonStyle(
	ctx: ThemeContext,
	config: ButtonConfig = {},
): ResolvedStyle {
	const options: StandardButtonTokenOptions = {
		styleType: config.styleType ?? "solid",
		colorScheme: config.variant ?? "primary",
		size: config.size ?? "md",
		rounded: config.rounded ?? "md",
		modifiers: config.modifiers ?? [],
		isHovered: config.isHovered ?? false,
		isPressed: config.isPressed ?? false,
		isDisabled: config.disabled ?? false,
		iconOnly: config.iconOnly ?? false,
	};

	const recipe = generateStandardButtonTokens(
		ctx.colorTokens,
		ctx.mode,
		options,
	);

	return {
		backgroundColor: recipe.background,
		textColor: recipe.color,
		borderColor: recipe.border,
		borderStyle: recipe.border,
		fontSize: recipe.fontSize,
		fontWeight: ctx.fontTokens.weight.medium,
		fontFamily: ctx.fontTokens.displayFont,
		padding: recipe.padding,
		borderRadius: "0.5rem",
		boxShadow: recipe.boxShadow,
		opacity: recipe.opacity,
		cursor: recipe.cursor,
		textDecoration: recipe.textDecoration,
	};
}

//#endregion

//#region [text] — resolveTextStyle

export interface TextConfig {
	variant?: ColorSchemeVariant;
	size?: StandardTextSize;
	weight?: StandardTextWeight;
}

export function resolveTextStyle(
	ctx: ThemeContext,
	config: TextConfig = {},
): ResolvedStyle {
	const palette =
		ctx.colorTokens[config.variant ?? "primary"] ??
		ctx.colorTokens.primary;

	const size = config.size ?? "md";
	const weightKey = config.weight ?? "normal";

	return {
		backgroundColor: "transparent",
		textColor: palette.text,
		borderColor: "transparent",
		borderStyle: "none",
		fontSize: `var(--font-size-${size})`,
		fontWeight: weightKey === "bold" ? 700 : weightKey === "semibold" ? 600 : weightKey === "medium" ? 500 : 400,
		fontFamily: ctx.fontTokens.bodyFont,
		padding: "0",
		borderRadius: "0",
		boxShadow: "none",
		opacity: 1,
		cursor: "inherit",
	};
}

//#endregion

//#region [container] — resolveContainerStyle

export type ContainerVariant = "card" | "surface" | "transparent";

export interface ContainerConfig {
	variant?: ContainerVariant;
	padding?: string;
	borderRadius?: string;
}

export function resolveContainerStyle(
	ctx: ThemeContext,
	config: ContainerConfig = {},
): ResolvedStyle {
	const isDark = ctx.mode === "dark";
	const variant = config.variant ?? "card";
	const padding = config.padding ?? "1rem";
	const radius = config.borderRadius ?? "0.75rem";

	const bgColor =
		variant === "transparent" ? "transparent"
		: variant === "card" ?
			isDark ?
				"rgba(255,255,255,0.06)"
			:	ctx.colorTokens.white?.pure ?? "#FFFFFF"
		:	isDark ?
				"rgba(255,255,255,0.03)"
			:	ctx.colorTokens.neutral.bg;

	const shadow =
		variant === "card" ?
			isDark ?
				"0 4px 12px rgba(0,0,0,0.4)"
			:	"0 2px 8px rgba(0,0,0,0.08)"
		:	"none";

	const border =
		variant === "card" ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : ctx.colorTokens.neutral.bgShade}`
		: "none";

	return {
		backgroundColor: bgColor,
		textColor: ctx.colorTokens.neutral.text,
		borderColor: border,
		borderStyle: border,
		fontSize: ctx.fontTokens.scale.md,
		fontWeight: ctx.fontTokens.weight.regular,
		fontFamily: ctx.fontTokens.bodyFont,
		padding,
		borderRadius: radius,
		boxShadow: shadow,
		opacity: 1,
		cursor: "inherit",
	};
}

//#endregion
