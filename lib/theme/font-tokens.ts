// 📍 lib/theme/font-tokens.ts
// 🎯 PROPÓSITO: Definición de pares tipográficos y tokens de fuente del ecosistema sustrato
// 🔧 DECISIÓN: 5 pares de fuentes cubren el espectro sans/serif/mono para todas las necesidades

//#region [types]

export type FontPairId =
	| "inter"
	| "geometric"
	| "editorial"
	| "bold"
	| "enterprise";

export type FontCategory = "sans" | "serif" | "mixed";

export interface FontPairConfig {
	id: FontPairId;
	display: string;
	body: string;
	mono: string;
	category: FontCategory;
	description: string;
}

export interface FontScale {
	xs: string;
	sm: string;
	md: string;
	lg: string;
	xl: string;
	xxl: string;
}

export interface FontWeight {
	light: number;
	regular: number;
	medium: number;
	semibold: number;
	bold: number;
}

export interface FontLineHeight {
	tight: number;
	normal: number;
	relaxed: number;
}

export interface AppFontTokens {
	fontPairId: FontPairId;
	displayFont: string;
	bodyFont: string;
	monoFont: string;
	scale: FontScale;
	weight: FontWeight;
	lineHeight: FontLineHeight;
}

//#endregion

//#region [pairs]

export const FONT_PAIRS: Record<FontPairId, FontPairConfig> = {
	inter: {
		id: "inter",
		display: "Inter",
		body: "Inter",
		mono: "JetBrains Mono",
		category: "sans",
		description: "Moderna, tech, máxima legibilidad. Default del sistema.",
	},
	geometric: {
		id: "geometric",
		display: "DM Sans",
		body: "DM Sans",
		mono: "DM Mono",
		category: "sans",
		description: "Geométrica, limpia, contemporánea. Ideal para dashboards.",
	},
	editorial: {
		id: "editorial",
		display: "Georgia",
		body: "Merriweather",
		mono: "Fira Code",
		category: "serif",
		description: "Editorial, académica, cálida. Para lectura prolongada.",
	},
	bold: {
		id: "bold",
		display: "Space Grotesk",
		body: "Space Grotesk",
		mono: "Source Code Pro",
		category: "sans",
		description: "Audaz, con carácter, impacto visual. Para headlines y branding.",
	},
	enterprise: {
		id: "enterprise",
		display: "IBM Plex Sans",
		body: "IBM Plex Sans",
		mono: "IBM Plex Mono",
		category: "sans",
		description: "Corporativa, robusta, profesional. Para entornos enterprise.",
	},
};

//#endregion

//#region [defaults]

export const DEFAULT_FONT_SCALE: FontScale = {
	xs: "0.75rem",
	sm: "0.875rem",
	md: "1rem",
	lg: "1.125rem",
	xl: "1.5rem",
	xxl: "2rem",
};

export const DEFAULT_FONT_WEIGHT: FontWeight = {
	light: 300,
	regular: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
};

export const DEFAULT_LINE_HEIGHT: FontLineHeight = {
	tight: 1.2,
	normal: 1.5,
	relaxed: 1.75,
};

export function createAppFontTokens(
	fontPairId: FontPairId = "inter",
): AppFontTokens {
	const pair = FONT_PAIRS[fontPairId];

	return {
		fontPairId,
		displayFont: pair.display,
		bodyFont: pair.body,
		monoFont: pair.mono,
		scale: DEFAULT_FONT_SCALE,
		weight: DEFAULT_FONT_WEIGHT,
		lineHeight: DEFAULT_LINE_HEIGHT,
	};
}

//#endregion
