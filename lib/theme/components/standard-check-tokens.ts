//. 📍 lib/theme/components/standard-check-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardCheckVariant =
	| "primary" | "secondary" | "tertiary" | "accent"
	| "success" | "warning" | "danger" | "neutral";
export type StandardCheckSize = "xs" | "sm" | "md" | "lg" | "xl";
export type StandardCheckStyleType = "default" | "outline" | "subtle" | "solid";

export interface StandardCheckTokens {
	background: string;
	border: string;
	check: string;
	text: string;
	hover: { background: string; border: string; };
	focus: { outline: string; };
	active: { background: string; border: string; };
	checked: { background: string; border: string; check: string; };
	disabled: { background: string; border: string; check: string; text: string; opacity: number; };
	size: {
		borderThickness: string;
		box: string;
		checkThickness: number;
		borderRadius: string;
		fontSize: string;
		padding: string;
	};
}
//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧

//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
function getColorForVariant(variant: StandardCheckVariant, appColorTokens: AppColorTokens) {
	switch (variant) {
		case "primary": return appColorTokens.primary;
		case "secondary": return appColorTokens.secondary;
		case "tertiary": return appColorTokens.tertiary;
		case "accent": return appColorTokens.accent;
		case "success": return appColorTokens.success;
		case "warning": return appColorTokens.warning;
		case "danger": return appColorTokens.danger;
		default: return appColorTokens.primary;
	}
}

function getSizeTokens(size: StandardCheckSize) {
	switch (size) {
		case "xs": return { box: "16px", checkThickness: 2.5, borderRadius: "3px", fontSize: "0.75rem", padding: "0.25rem" };
		case "sm": return { box: "18px", checkThickness: 3, borderRadius: "4px", fontSize: "0.875rem", padding: "0.375rem" };
		case "lg": return { box: "24px", checkThickness: 4, borderRadius: "6px", fontSize: "1.125rem", padding: "0.625rem" };
		case "xl": return { box: "28px", checkThickness: 5, borderRadius: "7px", fontSize: "1.25rem", padding: "0.75rem" };
		default: return { box: "20px", checkThickness: 3.5, borderRadius: "5px", fontSize: "1rem", padding: "0.5rem" };
	}
}

function generateNeutralTokens(
	neutralTokenSet: AppColorTokens["neutral"],
	visualVariant: StandardCheckStyleType,
	sizeTokens: any
): StandardCheckTokens {
	let background: string, border: string, check: string, checkedBackground: string, checkedBorder: string;
	const checkColor = neutralTokenSet.contrastText;

	switch (visualVariant) {
		case "outline":
			background = "transparent"; border = neutralTokenSet.bgShade; check = checkColor;
			checkedBackground = "transparent"; checkedBorder = neutralTokenSet.text;
			break;
		case "subtle":
			background = `${neutralTokenSet.bg}40`; border = neutralTokenSet.bgShade; check = checkColor;
			checkedBackground = `${neutralTokenSet.bg}80`; checkedBorder = neutralTokenSet.text;
			break;
		case "solid":
			background = neutralTokenSet.bg; border = neutralTokenSet.bgShade; check = checkColor;
			checkedBackground = neutralTokenSet.bgShade; checkedBorder = neutralTokenSet.text;
			break;
		default:
			background = "#ffffff"; border = neutralTokenSet.bgShade; check = checkColor;
			checkedBackground = "#ffffff"; checkedBorder = neutralTokenSet.text;
			break;
	}

	return {
		background, border, check: neutralTokenSet.contrastText, text: neutralTokenSet.text,
		hover: { background: `${neutralTokenSet.bg}60`, border: neutralTokenSet.text },
		focus: { outline: `${neutralTokenSet.pure}60` },
		active: { background: `${neutralTokenSet.bg}80`, border: neutralTokenSet.contrastText },
		checked: { background: checkedBackground, border: checkedBorder, check: visualVariant === "solid" ? neutralTokenSet.contrastText : checkColor },
		disabled: { background: `${neutralTokenSet.bg}30`, border: `${neutralTokenSet.bgShade}50`, check: `${neutralTokenSet.text}50`, text: `${neutralTokenSet.text}50`, opacity: 0.6 },
		size: sizeTokens,
	};
}

function generateColorTokens(
	baseColorTokenSet: AppColorTokens[keyof AppColorTokens] & { pure: string; bg: string; contrastText: string; text: string; bgShade: string; },
	visualVariant: StandardCheckStyleType,
	sizeTokens: any,
	neutralTokenSet: AppColorTokens["neutral"],
	appColorTokens: AppColorTokens,
	variant: StandardCheckVariant
): StandardCheckTokens {
	if (!baseColorTokenSet || !baseColorTokenSet.pure) {
		return generateNeutralTokens(neutralTokenSet, visualVariant, sizeTokens);
	}

	let background: string, border: string, check: string, checkedBackground: string, checkedBorder: string;
	const useSecondaryCheck = visualVariant === "default" && variant === "primary" && appColorTokens.secondary?.pure;
	const defaultCheckColor = baseColorTokenSet.contrastText;
	const checkColorOnWhite = baseColorTokenSet.pure;

	switch (visualVariant) {
		case "outline":
			background = "transparent"; border = baseColorTokenSet.pure;
			check = useSecondaryCheck ? appColorTokens.secondary.pure : checkColorOnWhite;
			checkedBackground = "transparent"; checkedBorder = baseColorTokenSet.pure;
			break;
		case "subtle":
			background = `${baseColorTokenSet.pure}20`; border = `${baseColorTokenSet.pure}60`;
			check = useSecondaryCheck ? appColorTokens.secondary.pure : checkColorOnWhite;
			checkedBackground = `${baseColorTokenSet.pure}40`; checkedBorder = baseColorTokenSet.pure;
			break;
		case "solid":
			background = baseColorTokenSet.bg; border = baseColorTokenSet.pure; check = baseColorTokenSet.contrastText;
			checkedBackground = baseColorTokenSet.pure; checkedBorder = baseColorTokenSet.pure;
			break;
		default:
			background = "#ffffff"; border = baseColorTokenSet.pure;
			check = useSecondaryCheck ? appColorTokens.secondary.pure : checkColorOnWhite;
			checkedBackground = "#ffffff"; checkedBorder = baseColorTokenSet.pure;
			break;
	}

	return {
		background, border, check: defaultCheckColor, text: neutralTokenSet.text,
		hover: { background: `${baseColorTokenSet.pure}20`, border: baseColorTokenSet.pure },
		focus: { outline: `${baseColorTokenSet.pure}60` },
		active: { background: `${baseColorTokenSet.pure}30`, border: baseColorTokenSet.bgShade },
		checked: {
			background: checkedBackground, border: checkedBorder,
			check: visualVariant === "solid" ? baseColorTokenSet.contrastText : (useSecondaryCheck ? appColorTokens.secondary.pure : checkColorOnWhite),
		},
		disabled: { background: `${neutralTokenSet.bg}30`, border: `${neutralTokenSet.bgShade}50`, check: `${neutralTokenSet.text}50`, text: `${neutralTokenSet.text}50`, opacity: 0.6 },
		size: sizeTokens,
	};
}
//#endregion ![sub]

export function generateStandardCheckTokens(
	appColorTokens: AppColorTokens,
	size: StandardCheckSize = "md",
	variant: StandardCheckVariant = "primary",
	visualVariant: StandardCheckStyleType = "default"
): StandardCheckTokens {
	const sizeTokens = getSizeTokens(size);

	if (variant === "neutral") {
		return generateNeutralTokens(appColorTokens.neutral, visualVariant, sizeTokens);
	} else {
		const baseColorTokenSet = getColorForVariant(variant, appColorTokens);
		return generateColorTokens(
			baseColorTokenSet as any, visualVariant, sizeTokens,
			appColorTokens.neutral, appColorTokens, variant
		);
	}
}
//#endregion ![main]