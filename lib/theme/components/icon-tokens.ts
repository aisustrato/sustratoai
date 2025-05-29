import type { AppColorTokens, ColorShade, Mode } from "../ColorToken"; // ÚNICA importación necesaria para los tokens

// Tipos para los tokens de iconos
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type IconColor =
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

export type IconColorToken = {
  pure: string;
  text: string;
  shade: string; // 'shade' es la variante principal para tonos más oscuros/matizados
  bg: string;
};

export type IconTokens = {
  colors: Record<IconColor, IconColorToken>;
};

/**
 * Genera los tokens para iconos utilizando AppColorTokens.
 * Se confía en que AppColorTokens ya proporciona los colores correctos para el modo (claro/oscuro)
 * y que estos colores ya tienen el contraste adecuado.
 * La función 'ensureContrast' y 'tinycolor' se eliminan.
 * Las referencias a 'colorScheme', 'colors.themes', 'colors.semantic' se eliminan.
 */
export function generateIconTokens(appTokens: AppColorTokens, mode: Mode): IconTokens {
  // 'mode' se recibe por consistencia, pero AppColorTokens ya es consciente del modo.

  // Función auxiliar para generar IconColorToken a partir de una paleta ColorShade de AppColorTokens
  const generateColorTokenFromPalette = (colorPalette: ColorShade): IconColorToken => {
    // Decidimos qué variante 'Shade' de la paleta se usará para la propiedad 'shade' del IconColorToken.
    // Usaremos 'textShade' como el 'shade' principal del icono.
    // Podría ser 'pureShade' si el diseño específico del icono o del tema lo requiere para ciertos colores.
    return {
      pure: colorPalette.pure,
      text: colorPalette.text,
      shade: colorPalette.textShade, // Asignamos la variante 'textShade' a la propiedad 'shade'
      bg: colorPalette.bg,
    };
  };

  // El token 'default' se genera consistentemente usando la paleta neutral de appTokens.
  // Esto significa que 'default' y 'neutral' serán funcionalmente idénticos
  // a menos que se introduzca una lógica de derivación específica para 'default' en el futuro.
  const defaultToken: IconColorToken = generateColorTokenFromPalette(appTokens.neutral);
  const neutralToken: IconColorToken = generateColorTokenFromPalette(appTokens.neutral);
  const whiteToken: IconColorToken = generateColorTokenFromPalette(appTokens.white);

  return {
    colors: {
      default: defaultToken,
      primary: generateColorTokenFromPalette(appTokens.primary),
      secondary: generateColorTokenFromPalette(appTokens.secondary),
      tertiary: generateColorTokenFromPalette(appTokens.tertiary),
      accent: generateColorTokenFromPalette(appTokens.accent), // Asumiendo que accent es parte de AppColorTokens.theme o AppColorTokens.semantic
      success: generateColorTokenFromPalette(appTokens.success),
      warning: generateColorTokenFromPalette(appTokens.warning),
      danger: generateColorTokenFromPalette(appTokens.danger),
      neutral: neutralToken,
      white: whiteToken,
    },
  };
}
