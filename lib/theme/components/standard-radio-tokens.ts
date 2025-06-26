//. 📍 lib/theme/components/standard-radio-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens } from "../ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardRadioVariant =
	| "primary" | "secondary" | "tertiary" | "accent"
	| "success" | "warning" | "danger" | "neutral";
export type StandardRadioSize = "xs" | "sm" | "md" | "lg" | "xl";
export type StandardRadioStyleType = "default" | "outline" | "subtle" | "solid";

export interface StandardRadioTokens {
	background: string;
	border: string;
	indicator: string; // Changed from 'check'
	text: string;
	hover: { background: string; border: string; };
	focus: { outline: string; };
	active: { background: string; border: string; };
	checked: { background: string; border: string; indicator: string; };
	disabled: { background: string; border: string; indicator: string; text: string; opacity: number; };
	size: {
		borderThickness: string;
		box: string;
		indicatorSize: string; // Changed from 'checkThickness'
		borderRadius: string;
		fontSize: string;
		padding: string;
	};
}

interface SizeProperties {
  borderThickness: string;
  box: string;
  indicatorSize: string;
  borderRadius: string;
  fontSize: string;
  padding: string;
}

//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧

//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
function getColorForVariant(variant: StandardRadioVariant, appColorTokens: AppColorTokens) {
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

function getSizeTokens(size: StandardRadioSize): SizeProperties {
	const baseRadius = '50%';
	switch (size) {
		case "xs": return { borderThickness: "1px", box: "16px", indicatorSize: "8px", borderRadius: baseRadius, fontSize: "0.75rem", padding: "0.25rem" };
		case "sm": return { borderThickness: "1.5px", box: "18px", indicatorSize: "9px", borderRadius: baseRadius, fontSize: "0.875rem", padding: "0.375rem" };
		case "lg": return { borderThickness: "2.5px", box: "24px", indicatorSize: "12px", borderRadius: baseRadius, fontSize: "1.125rem", padding: "0.625rem" };
		case "xl": return { borderThickness: "3px", box: "28px", indicatorSize: "14px", borderRadius: baseRadius, fontSize: "1.25rem", padding: "0.75rem" };
		default: return { borderThickness: "2px", box: "20px", indicatorSize: "10px", borderRadius: baseRadius, fontSize: "1rem", padding: "0.5rem" };
	}
}

function generateColorTokens(
	baseColorTokenSet: AppColorTokens[keyof AppColorTokens] & { pure: string; bg: string; contrastText: string; text: string; bgShade: string; },
	neutralTokenSet: AppColorTokens["neutral"]
): Omit<StandardRadioTokens, 'size'> {

	const indicatorColor = baseColorTokenSet.pure;

	return {
		background: '#ffffff',
		border: neutralTokenSet.bgShade,
		indicator: indicatorColor,
		text: neutralTokenSet.text,
		hover: { background: neutralTokenSet.bg, border: baseColorTokenSet.pure },
		focus: { outline: `${baseColorTokenSet.pure}60` },
		active: { background: neutralTokenSet.bgShade, border: baseColorTokenSet.pure },
		checked: { background: '#ffffff', border: baseColorTokenSet.pure, indicator: indicatorColor },
		disabled: { background: `${neutralTokenSet.bg}30`, border: `${neutralTokenSet.bgShade}50`, indicator: `${neutralTokenSet.text}50`, text: `${neutralTokenSet.text}50`, opacity: 0.6 },
	};
}
//#endregion ![sub]

export function generateStandardRadioTokens(
	appColorTokens: AppColorTokens,
	size: StandardRadioSize = "md",
	variant: StandardRadioVariant = "primary"
): StandardRadioTokens {
	const sizeTokens = getSizeTokens(size);
	const baseColorTokenSet = getColorForVariant(variant, appColorTokens);
	const colorTokens = generateColorTokens(baseColorTokenSet, appColorTokens.neutral);

	return {
		...colorTokens,
		size: sizeTokens,
	};
}
//#endregion ![main]
