//. 📍 lib/theme/components/standard-icon-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardIconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

//> 📝 Este es el tipo de color INTERNO que el componente usará. No se expone en la API pública.
export type StandardIconColor =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "neutral"
	| "white";

export type StandardIconColorToken = {
	pure: string;
	text: string;
	shade: string;
	bg: string;
};

export type StandardIconTokens = {
	colors: Record<StandardIconColor, StandardIconColorToken>;
};
//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧
export function generateStandardIconTokens(
	appTokens: AppColorTokens,
	mode: Mode
): StandardIconTokens {
	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const generateColorTokenFromPalette = (
		colorPalette: ColorShade
	): StandardIconColorToken => {
		return {
			pure: colorPalette.pure,
			text: colorPalette.text,
			shade: colorPalette.textShade,
			bg: colorPalette.bg,
		};
	};
	//#endregion ![sub]

	const defaultToken: StandardIconColorToken = generateColorTokenFromPalette(
		appTokens.neutral
	);
	const neutralToken: StandardIconColorToken = generateColorTokenFromPalette(
		appTokens.neutral
	);
	const whiteToken: StandardIconColorToken = generateColorTokenFromPalette(
		appTokens.white
	);

	return {
		colors: {
			default: defaultToken,
			primary: generateColorTokenFromPalette(appTokens.primary),
			secondary: generateColorTokenFromPalette(appTokens.secondary),
			tertiary: generateColorTokenFromPalette(appTokens.tertiary),
			accent: generateColorTokenFromPalette(appTokens.accent),
			success: generateColorTokenFromPalette(appTokens.success),
			warning: generateColorTokenFromPalette(appTokens.warning),
			danger: generateColorTokenFromPalette(appTokens.danger),
			neutral: neutralToken,
			white: whiteToken,
		},
	};
}
//#endregion ![main]