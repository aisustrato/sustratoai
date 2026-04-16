// 📍 lib/theme/ColorToken.ts
// 🎯 PROPÓSITO: Agregador central de tokens de color para la aplicación
// 🔧 DECISIÓN: Combina paletas de tema (primary/secondary/tertiary) + semánticas (success/warning/danger)
// ⚠️ ADVERTENCIA: Este archivo es el NÚCLEO del sistema de tokens. Cambios aquí afectan TODA la UI.
//    Referencia: advertencia.txt → "nunca modifiques color-tokens.ts"

//#region [imports] - 📦 IMPORTS
import {
	colors,
	type ColorShade,
	type ThemeColors as RawThemeColors,
} from "./colors";
//#endregion

//#region [types] - 🎨 TIPOS Y ESQUEMAS
export type { ColorShade };

// 🎨 Esquemas de color disponibles (temas visuales de la app)
export type ColorScheme =
	| "blue"
	| "green"
	| "orange"
	| "artisticGreen"
	| "graphite"
	| "roseGold"
	| "midnight"
	| "burgundy"
	| "zenith"
	| "coral"
	| "ocean";

// 🎨 Modos de visualización
export type Mode = "light" | "dark";

// 🎨 Variantes semánticas para componentes (lo que los componentes conocen)
export type ColorSchemeVariant =
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral"
	| "white"
	| "success"
	| "warning"
	| "danger";

// 🎨 Variantes para ProCard (subset de ColorSchemeVariant)
export type ProCardVariant =
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "neutral"
	| "white";

// 🎨 Nombres de shades disponibles en cada paleta
export type ColorShadeName =
	| "pure"
	| "text"
	| "textShade"
	| "bg"
	| "contrastText"
	| "subtle";

// 💎 CORE: Estructura de tokens que consumen TODOS los componentes
// 🔧 DECISIÓN: Los componentes son AGNÓSTICOS - solo conocen estas claves, no los valores hex
export type AppColorTokens = {
	// Paletas del tema principal (ej. azul, verde, naranja)
	primary: ColorShade;
	secondary: ColorShade;
	tertiary: ColorShade;

	// Paletas semánticas globales (accent, success, etc.)
	accent: ColorShade;
	success: ColorShade;
	warning: ColorShade;
	danger: ColorShade;
	neutral: ColorShade;
	white: ColorShade;
};
//#endregion

// #region [helpers] - 🔄 FUNCIONES AUXILIARES
// 🔄 HELPER: Obtiene la paleta de tema según colorScheme + mode
function getThemePalette(colorScheme: ColorScheme, mode: Mode): RawThemeColors {
	const themeKey = mode === "dark" ? `${colorScheme}Dark` : colorScheme;
	const palette = colors.themes[themeKey as keyof typeof colors.themes];

	if (!palette) {
		// ⚠️ Error visible (política anti-callbacks silenciosos)
		console.warn(
			`[ColorToken] Theme palette not found for themeKey: ${themeKey}. Falling back to blue light.`,
		);
		return colors.themes.blue;
	}
	return palette;
}

// 🔄 HELPER: Obtiene las paletas semánticas según el modo
function getActiveSemanticShades(mode: Mode): {
	accent: ColorShade;
	success: ColorShade;
	warning: ColorShade;
	danger: ColorShade;
	neutral: ColorShade;
	white: ColorShade;
} {
	return {
		accent:
			mode === "dark" ? colors.semantic.accentDark : colors.semantic.accent,
		success:
			mode === "dark" ? colors.semantic.successDark : colors.semantic.success,
		warning:
			mode === "dark" ? colors.semantic.warningDark : colors.semantic.warning,
		danger:
			mode === "dark" ? colors.semantic.dangerDark : colors.semantic.danger,
		neutral:
			mode === "dark" ? colors.semantic.neutralDark : colors.semantic.neutral,
		white: mode === "dark" ? colors.semantic.whiteDark : colors.semantic.white,
	};
}
//

//#region [core] - 🚀 FUNCIÓN PRINCIPAL
// 🚀 ENTRY POINT: Crea el conjunto de tokens para la aplicación
// 🔧 DECISIÓN: Esta función se llama 1 vez al inicio y cada vez que cambia tema/modo
export function createAppColorTokens(
	colorScheme: ColorScheme,
	mode: Mode,
): AppColorTokens {
	const themePalette = getThemePalette(colorScheme, mode);
	const activeSemanticShades = getActiveSemanticShades(mode);

	return {
		// Paletas del tema (varían según colorScheme)
		primary: themePalette.primary,
		secondary: themePalette.secondary,
		tertiary: themePalette.tertiary,

		// Paletas semánticas (consistentes entre temas, varían con mode)
		accent: activeSemanticShades.accent,
		success: activeSemanticShades.success,
		warning: activeSemanticShades.warning,
		danger: activeSemanticShades.danger,
		neutral: activeSemanticShades.neutral,
		white: activeSemanticShades.white,
	};
}
//#endregion

//#region [state] - 📦 ESTADO GLOBAL
// ⚠️ ADVERTENCIA: Variable global - será reemplazada por Context en futura refactorización
// 🔧 DECISIÓN: Mantenemos por retrocompatibilidad con código que aún no usa useTheme()
export let appColorTokens: AppColorTokens = createAppColorTokens(
	"blue",
	"light",
);

// 🔄 HELPER: Actualiza la variable global de tokens
export function updateAppColorTokens(newTokens: AppColorTokens) {
	appColorTokens = newTokens;
}
//#endregion
