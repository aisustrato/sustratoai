//. 📍 lib/theme/components/standard-text-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type {
	AppColorTokens,
	ProCardVariant, // Tipo unificado para los esquemas de color
	Mode,
	ColorShade,
} from "../ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACES 📦
// Tipos renombrados para el nuevo estándar
export type StandardTextTokenColorSet = {
	pure: string;
	text: string;
	dark: string; // Mantenido por compatibilidad con la lógica interna original de text.tsx
	textShade: string;
};

// Se usan las claves de ProCardVariant para el objeto `colors`
type StandardTextColorSchemes = {
	[key in ProCardVariant]?: StandardTextTokenColorSet;
};

export type StandardTextTokens = {
	colors: StandardTextColorSchemes;
	gradients: {
		// Estas claves deben ser un subconjunto de ProCardVariant
		primary: { start: string; middle: string; end: string };
		secondary: { start: string; middle: string; end: string };
		tertiary: { start: string; middle: string; end: string };
		accent: { start: string; middle: string; end: string };
		success: { start: string; middle: string; end: string };
		warning: { start: string; middle: string; end: string };
		danger: { start: string; middle: string; end: string };
	};
	variants: {
		default: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		heading: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		subheading: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		title: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		subtitle: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		label: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		caption: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
		muted: {
			size: string;
			weight: string;
			color: keyof StandardTextTokens["colors"];
		};
	};
};
//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardTextTokens(
	appTokens: AppColorTokens,
	mode: Mode
): StandardTextTokens {
	const isDark = mode === "dark";

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰

	const mapColorShadeToTokenSet = (
		shade: ColorShade
	): StandardTextTokenColorSet => ({
		pure: shade.pure,
		text: shade.text,
		textShade: shade.textShade,
		dark: shade.textShade,
	});
	//#endregion ![sub]

	const textColors: StandardTextTokens["colors"] = {
		primary: mapColorShadeToTokenSet(appTokens.primary),
		secondary: mapColorShadeToTokenSet(appTokens.secondary),
		tertiary: mapColorShadeToTokenSet(appTokens.tertiary),
		accent: mapColorShadeToTokenSet(appTokens.accent),
		success: mapColorShadeToTokenSet(appTokens.success),
		warning: mapColorShadeToTokenSet(appTokens.warning),
		danger: mapColorShadeToTokenSet(appTokens.danger),
		neutral: mapColorShadeToTokenSet(appTokens.neutral), // "default" ahora es "neutral"
		white: mapColorShadeToTokenSet(appTokens.white), // Añadido para completar ProCardVariant
	};

	// Para los casos de "muted" y "default" que ya no son keys,
	// la lógica se manejará en el componente a través de la prop `variant`.
	// Por ejemplo, `variant="muted"` usará `colorScheme="neutral"` y un `colorShade`.

	const textGradients: StandardTextTokens["gradients"] = {
		primary: {
			start: appTokens.primary.pure,
			middle: appTokens.primary.pureShade,
			end: appTokens.primary.textShade,
		},
		secondary: {
			start: appTokens.secondary.pure,
			middle: appTokens.secondary.pureShade,
			end: appTokens.secondary.textShade,
		},
		tertiary: {
			start: appTokens.tertiary.pure,
			middle: appTokens.tertiary.pureShade,
			end: appTokens.tertiary.textShade,
		},
		accent: {
			start: appTokens.accent.pure,
			middle: appTokens.accent.pureShade,
			end: appTokens.accent.textShade,
		},
		success: {
			start: appTokens.success.pure,
			middle: appTokens.success.pureShade,
			end: appTokens.success.textShade,
		},
		warning: {
			start: appTokens.warning.pure,
			middle: appTokens.warning.pureShade,
			end: appTokens.warning.textShade,
		},
		danger: {
			start: appTokens.danger.pure,
			middle: appTokens.danger.pureShade,
			end: appTokens.danger.textShade,
		},
	};

	const variantDefaults: StandardTextTokens["variants"] = {
		default: { size: "base", weight: "normal", color: "neutral" }, // "default" ahora usa el colorScheme "neutral"
		heading: { size: "3xl", weight: "bold", color: "neutral" },
		subheading: { size: "2xl", weight: "semibold", color: "neutral" },
		title: { size: "xl", weight: "semibold", color: "primary" },
		subtitle: { size: "lg", weight: "medium", color: "secondary" },
		label: { size: "sm", weight: "medium", color: "neutral" },
		caption: { size: "xs", weight: "normal", color: "neutral" }, // "muted" y "caption" usarán "neutral" como base
		muted: { size: "sm", weight: "normal", color: "neutral" },
	};

	return {
		colors: textColors,
		gradients: textGradients,
		variants: variantDefaults,
	};
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Types, Interface, and Generator Function are exported above.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// - Review if 'dark' property in StandardTextTokenColorSet is still necessary or can be refactored.
// - Ensure all default variant colors align with design system's intent for neutral/primary/secondary usage.
//#endregion ![todo]
