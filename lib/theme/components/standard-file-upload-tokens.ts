//. 📍 lib/theme/components/standard-file-upload-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import tinycolor from "tinycolor2";
import type { AppColorTokens, Mode } from "../ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardFileUploadVariant =
	| "default"
	| "primary"
	| "secondary"
	| "accent"
	| "error"
	| "success";

export interface StandardFileUploadStateTokens {
	background: string;
	border: string;
	text: string;
	iconColor: string;
	ring?: string;
}

export interface StandardFileUploadTokens {
	base: {
		borderRadius: string;
		borderWidth: string;
		borderStyle: string;
		transition: string;
	};
	variants: {
		idle: Record<StandardFileUploadVariant, StandardFileUploadStateTokens>;
		active: Record<StandardFileUploadVariant, StandardFileUploadStateTokens>; // Dragging over
		disabled: StandardFileUploadStateTokens;
	};
}
//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧
export function generateStandardFileUploadTokens(
	appColorTokens: AppColorTokens,
	mode: Mode,
): StandardFileUploadTokens {
	const { primary, secondary, accent, neutral, danger, success } =
		appColorTokens;

	const getVariantTokens = (colorToken: any) => {
		const baseColor = colorToken.pure;

		return {
			idle: {
				background:
					mode === "dark" ?
						tinycolor(baseColor).setAlpha(0.05).toRgbString()
					:	tinycolor(baseColor).setAlpha(0.03).toRgbString(),
				border:
					mode === "dark" ?
						tinycolor(baseColor).setAlpha(0.3).toRgbString()
					:	tinycolor(baseColor).setAlpha(0.2).toRgbString(),
				text: neutral.text,
				iconColor:
					mode === "dark" ?
						tinycolor(baseColor).lighten(10).toRgbString()
					:	tinycolor(baseColor).darken(10).toRgbString(),
			},
			active: {
				background:
					mode === "dark" ?
						tinycolor(baseColor).setAlpha(0.15).toRgbString()
					:	tinycolor(baseColor).setAlpha(0.1).toRgbString(),
				border: baseColor,
				text: baseColor,
				iconColor: baseColor,
				ring: tinycolor(baseColor).setAlpha(0.25).toRgbString(),
			},
		};
	};

	const defaultTokens = getVariantTokens(neutral);
	const primaryTokens = getVariantTokens(primary);
	const secondaryTokens = getVariantTokens(secondary);
	const accentTokens = getVariantTokens(accent);
	const errorTokens = getVariantTokens(danger);
	const successTokens = getVariantTokens(success);

	return {
		base: {
			borderRadius: "0.5rem", // rounded-lg
			borderWidth: "2px",
			borderStyle: "dashed",
			transition: "all 0.2s ease-in-out",
		},
		variants: {
			idle: {
				default: defaultTokens.idle,
				primary: primaryTokens.idle,
				secondary: secondaryTokens.idle,
				accent: accentTokens.idle,
				error: errorTokens.idle,
				success: successTokens.idle,
			},
			active: {
				default: defaultTokens.active,
				primary: primaryTokens.active,
				secondary: secondaryTokens.active,
				accent: accentTokens.active,
				error: errorTokens.active,
				success: successTokens.active,
			},
			disabled: {
				background: neutral.bgShade,
				border: tinycolor(neutral.pure).setAlpha(0.1).toRgbString(),
				text: tinycolor(neutral.text).setAlpha(0.4).toRgbString(),
				iconColor: tinycolor(neutral.text).setAlpha(0.2).toRgbString(),
			},
		},
	};
}
//#endregion ![main]
