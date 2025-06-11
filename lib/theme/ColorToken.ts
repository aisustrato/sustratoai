import {
  colors,
  type ColorShade,
  type ThemeColors as RawThemeColors,
  type AllSemanticColors,
} from "./colors";

export type { ColorShade };

export type ColorScheme = "blue" | "green" | "orange";
export type Mode = "light" | "dark";
export type ColorSchemeVariant = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'neutral' | 'white' | 'success' | 'warning' | 'danger';
// Definición de variantes válidas para ProCard y como claves en AppColorTokens
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
//test
/**
 * Estructura de los tokens de color simplificados que consumirán los componentes refactorizados.
 * Proporciona un acceso directo a las paletas principales del tema activo.
 */
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
  neutral: ColorShade; // Paleta neutral unificada (anteriormente también en semantic.neutral)
  white: ColorShade;

  // Podrías añadir aquí tokens específicos de UI que no encajan en ColorShade
  // Por ejemplo:
  // bodyBackground: string;
  // bodyText: string;
  // focusRing: string;
};

function getThemePalette(colorScheme: ColorScheme, mode: Mode): RawThemeColors {
  const themeKey = mode === "dark" ? `${colorScheme}Dark` : colorScheme;
  const palette = colors.themes[themeKey as keyof typeof colors.themes];

  if (!palette) {
    console.warn(
      `[ColorToken] Theme palette not found for themeKey: ${themeKey}. Falling back to blue light.`
    );
    return colors.themes.blue; // Fallback seguro
  }
  return palette;
}

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

/**
 * Crea el conjunto de tokens de color simplificados para la aplicación,
 * basado en el esquema de color y el modo seleccionados.
 */
export function createAppColorTokens(
  colorScheme: ColorScheme,
  mode: Mode
): AppColorTokens {
  const themePalette = getThemePalette(colorScheme, mode);
  const activeSemanticShades = getActiveSemanticShades(mode);

  return {
    // Paletas del tema
    primary: themePalette.primary,
    secondary: themePalette.secondary,
    tertiary: themePalette.tertiary,


    // Paletas semánticas
    accent: activeSemanticShades.accent,
    success: activeSemanticShades.success,
    warning: activeSemanticShades.warning,
    danger: activeSemanticShades.danger,
    neutral: activeSemanticShades.neutral,
    white: activeSemanticShades.white,
  };
}

/**
 * Variable global para acceder a los tokens de color activos de la aplicación.
 * Es actualizada por el ThemeProvider cuando cambia el tema o modo.
 */
export let appColorTokens: AppColorTokens = createAppColorTokens(
  "blue",
  "light"
);

/**
 * Actualiza la variable global de tokens de color de la aplicación.
 * @param newTokens El nuevo conjunto de tokens a activar.
 */
export function updateAppColorTokens(newTokens: AppColorTokens) {
  appColorTokens = newTokens;
  // Aquí podrías, opcionalmente, disparar eventos personalizados o actualizar
  // variables CSS globales si tu sistema lo requiere para partes no-React.
}
