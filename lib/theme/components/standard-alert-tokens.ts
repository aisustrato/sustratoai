//. 📍 lib/theme/components/standard-alert-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorSchemeVariant, ColorShade, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACES 📦
export type StandardAlertStyleType = "solid" | "subtle";

export interface StandardAlertRecipe {
	backgroundColor: string;
	borderColor: string;
	textColor: string;
	iconColor: string;
}

export interface StandardAlertTokenOptions {
	styleType: StandardAlertStyleType;
	colorScheme: ColorSchemeVariant;
}
//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardAlertTokens(
	appTokens: AppColorTokens, 
	mode: Mode, 
	options: StandardAlertTokenOptions
): StandardAlertRecipe {
	const { styleType, colorScheme } = options;
	const palette: ColorShade = appTokens[colorScheme] || appTokens.neutral;

	const recipe: StandardAlertRecipe = {
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		textColor: '',
		iconColor: '',
	};

	switch (styleType) {
		case 'solid':
			recipe.backgroundColor = palette.pure;
			recipe.borderColor = tinycolor(palette.pure).darken(10).toHexString();
			recipe.textColor = palette.contrastText;
			recipe.iconColor = palette.contrastText;
			break;
		case 'subtle':
			recipe.backgroundColor = palette.bg;
			recipe.borderColor = palette.bgShade;
			recipe.textColor = palette.pure;
			recipe.iconColor = palette.pure;
			break;
	}

	return recipe;
}
//#endregion ![main]
