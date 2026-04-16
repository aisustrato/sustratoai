//. 📍 lib/theme/components/standard-stepper-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import tinycolor from "tinycolor2";
import type { AppColorTokens, Mode } from "../ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type StandardStepperVariant =
	| "primary"
	| "secondary"
	| "accent"
	| "neutral";
export type StandardStepperOrientation = "horizontal" | "vertical";

export interface StandardStepperStateTokens {
	background: string;
	border: string;
	text: string;
	lineColor: string;
}

export interface StandardStepperTokens {
	base: {
		bubbleSize: string;
		fontSize: string;
		lineThickness: string;
		transition: string;
	};
	variants: {
		pending: StandardStepperStateTokens;
		current: Record<StandardStepperVariant, StandardStepperStateTokens>;
		completed: Record<StandardStepperVariant, StandardStepperStateTokens>;
	};
}
//#endregion ![def]

//#region [main] - 🔧 LOGIC 🔧
export function generateStandardStepperTokens(
	appColorTokens: AppColorTokens,
	mode: Mode,
): StandardStepperTokens {
	const { primary, secondary, accent, neutral, success } = appColorTokens;

	const getColoredTokens = (colorToken: any, isCompleted = false) => {
		// eslint-disable-line @typescript-eslint/no-explicit-any
		if (isCompleted) {
			return {
				background: colorToken.pure,
				border: colorToken.pure,
				text: colorToken.contrastText,
				lineColor: colorToken.pure,
			};
		}
		// Current
		return {
			background:
				mode === "dark" ?
					tinycolor(colorToken.bg).setAlpha(0.2).toRgbString()
				:	colorToken.bg,
			border: colorToken.pure,
			text: colorToken.pure,
			lineColor: neutral.bgShade, // La linea hacia adelante aun no esta completa
		};
	};

	return {
		base: {
			bubbleSize: "2.5rem", // h-10 w-10
			fontSize: "0.875rem", // text-sm
			lineThickness: "2px",
			transition: "all 0.3s ease-in-out",
		},
		variants: {
			pending: {
				background:
					mode === "dark" ?
						tinycolor(neutral.bgShade).lighten(5).toRgbString()
					:	neutral.bgShade,
				border:
					mode === "dark" ?
						tinycolor(neutral.pure).setAlpha(0.2).toRgbString()
					:	tinycolor(neutral.pure).setAlpha(0.2).toRgbString(),
				text: tinycolor(neutral.text).setAlpha(0.5).toRgbString(),
				lineColor:
					mode === "dark" ?
						tinycolor(neutral.bgShade).lighten(10).toRgbString()
					:	tinycolor(neutral.bgShade).darken(5).toRgbString(),
			},
			current: {
				primary: getColoredTokens(primary),
				secondary: getColoredTokens(secondary),
				accent: getColoredTokens(accent),
				neutral: getColoredTokens(neutral),
			},
			completed: {
				primary: getColoredTokens(success, true), // Usamos success para completed por defecto visualmente, o el color primario
				secondary: getColoredTokens(secondary, true),
				accent: getColoredTokens(accent, true),
				neutral: getColoredTokens(neutral, true),
			},
		},
	};
}
//#endregion ![main]
