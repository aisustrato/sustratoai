import type {
  AppColorTokens,
  ColorScheme,
  Mode,
  ProCardVariant,
} from "../ColorToken";
import tinycolor from "tinycolor2"; 
/**
 * Genera los tokens de fondo para ProCard usando AppColorTokens.
 */
export function generateProCardBackgroundGradients(
  appTokens: AppColorTokens,
  mode: Mode
): Record<ProCardVariant, string> {
  const variants: ProCardVariant[] = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
    "white",
  ];
  const gradients: Partial<Record<ProCardVariant, string>> = {};
  const isDark = mode === "dark";

  for (const variant of variants) {
    let color1: string | undefined;
    let color2: string | undefined;

    // Fallback defensivo si appTokens no está completamente formado o falta una variante
    const currentVariantTokens = appTokens?.[variant] as
      | AppColorTokens[ProCardVariant]
      | undefined;
    const neutralTokens = appTokens?.neutral;
    const whiteTokens = appTokens?.white;

    if (variant === "white") {
      color1 = whiteTokens?.bg;
      color2 = isDark ? whiteTokens?.bgShade : neutralTokens?.bg;
    } else if (
      variant === "primary" ||
      variant === "secondary" ||
      variant === "tertiary"
    ) {
      color1 = tinycolor(currentVariantTokens?.bg).setAlpha(0.6).toString();
      color2 = isDark ? neutralTokens?.bgShade : whiteTokens?.bg;
    } else {
      color1 = tinycolor(currentVariantTokens?.bg).toString();
      color2 = neutralTokens?.bg;
    }

    if (color1 && color2) {
      gradients[
        variant
      ] = `linear-gradient(135deg, ${color1} 0%, ${color2} 90%)`;
    } else {
      console.warn(
        `ProCard: Tokens for background gradient variant '${variant}' not fully defined. C1: ${color1}, C2: ${color2}`
      );
      gradients[variant] = `linear-gradient(135deg, #808080 0%, #C0C0C0 100%)`;
    }
  }
  return gradients as Record<ProCardVariant, string>;
}

/**
 * Genera los tokens de borde para ProCard usando AppColorTokens.
 */
export function generateProCardBorders(
  appTokens: AppColorTokens
): Record<ProCardVariant, string> {
  const variants: ProCardVariant[] = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
    "white",
  ];
  const borders: Partial<Record<ProCardVariant, string>> = {};

  for (const variant of variants) {
    const currentVariantTokens = appTokens?.[variant] as
      | AppColorTokens[ProCardVariant]
      | undefined;
    borders[variant] = currentVariantTokens?.pureShade ?? "#808080";
  }
  return borders as Record<ProCardVariant, string>;
}

/**
 * Genera los tokens de gradiente de borde superior para ProCard usando AppColorTokens.
 */
export function generateProCardBorderGradientsTop(
  appTokens: AppColorTokens
): Record<ProCardVariant, string> {
  const variants: ProCardVariant[] = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
    "white",
  ];
  const gradients: Partial<Record<ProCardVariant, string>> = {};

  for (const variant of variants) {
    const currentVariantTokens = appTokens?.[variant] as
      | AppColorTokens[ProCardVariant]
      | undefined;
    const primaryTokens = appTokens?.primary;
    const accentTokens = appTokens?.accent;
    const neutralTokens = appTokens?.neutral;

    const color1 = currentVariantTokens?.pure;
    let color2: string | undefined;

    if (
      variant === "primary" ||
      variant === "secondary" ||
      variant === "tertiary"
    ) {
      color2 = accentTokens?.pure;
    } else if (
      variant === "success" ||
      variant === "warning" ||
      variant === "danger"
    ) {
      color2 = neutralTokens?.pure;
    } else if (
      variant === "accent" ||
      variant === "neutral" ||
      variant === "white"
    ) {
      color2 = primaryTokens?.pure;
    } else {
      color2 = neutralTokens?.pure;
    }

    if (color1 && color2) {
      gradients[
        variant
      ] = `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
    } else {
      console.warn(
        `ProCard: Tokens for top border gradient variant '${variant}' not fully defined.`
      );
      gradients[variant] = `linear-gradient(90deg, #808080 0%, #C0C0C0 100%)`;
    }
  }
  return gradients as Record<ProCardVariant, string>;
}

/**
 * Genera los tokens de gradiente de borde izquierdo para ProCard usando AppColorTokens.
 */
export function generateProCardBorderGradientsLeft(
  appTokens: AppColorTokens
): Record<ProCardVariant, string> {
  const variants: ProCardVariant[] = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
    "white",
  ];
  const gradients: Partial<Record<ProCardVariant, string>> = {};

  for (const variant of variants) {
    const currentVariantTokens = appTokens?.[variant] as
      | AppColorTokens[ProCardVariant]
      | undefined;
    const primaryTokens = appTokens?.primary;
    const accentTokens = appTokens?.accent;
    const neutralTokens = appTokens?.neutral;

    const color1 = currentVariantTokens?.pure;
    let color2: string | undefined;

    if (
      variant === "primary" ||
      variant === "secondary" ||
      variant === "tertiary"
    ) {
      color2 = accentTokens?.pure;
    } else if (
      variant === "success" ||
      variant === "warning" ||
      variant === "danger"
    ) {
      color2 = neutralTokens?.pure;
    } else if (
      variant === "accent" ||
      variant === "neutral" ||
      variant === "white"
    ) {
      color2 = primaryTokens?.pure;
    } else {
      color2 = neutralTokens?.pure;
    }

    if (color1 && color2) {
      gradients[
        variant
      ] = `linear-gradient(180deg, ${color1} 0%, ${color2} 100%)`;
    } else {
      console.warn(
        `ProCard: Tokens for left border gradient variant '${variant}' not fully defined.`
      );
      gradients[variant] = `linear-gradient(180deg, #808080 0%, #C0C0C0 100%)`;
    }
  }
  return gradients as Record<ProCardVariant, string>;
}

/**
 * Genera todos los tokens para ProCard usando AppColorTokens.
 * Ahora devuelve un objeto 'selected' con colores por variante.
 */
export type ProCardComponentTokens = {
  backgroundGradient: Record<ProCardVariant, string>;
  border: Record<ProCardVariant, string>;
  borderGradientTop: Record<ProCardVariant, string>;
  borderGradientLeft: Record<ProCardVariant, string>;
  selected: Record<ProCardVariant, string>; // Cambiado para ser específico de la variante
};

export function generateProCardTokens(
  appTokens: AppColorTokens | any,
  mode: Mode
): ProCardComponentTokens {
  const selectedTokens: Partial<Record<ProCardVariant, string>> = {};
  const variants: ProCardVariant[] = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
    "white",
  ];

  // Fallback si appTokens no es la estructura esperada (llamada desde sistema legacy)
  const defaultPureShade =
    typeof appTokens?.primary?.pureShade === "string"
      ? appTokens.primary.pureShade
      : "#0000FF";

  for (const variant of variants) {
    // Acceso defensivo a las propiedades de appTokens
    const currentVariantTokens = appTokens?.[variant] as
      | AppColorTokens[ProCardVariant]
      | undefined;
    selectedTokens[variant] =
      currentVariantTokens?.pureShade ?? defaultPureShade;
  }

  // Asegurarse de que generateProCardBackgroundGradients también sea defensivo si appTokens es 'any'
  // o pasarle un appTokens 'seguro' o mock si es 'any'
  const safeAppTokens =
    appTokens && typeof appTokens === "object" && appTokens.primary
      ? (appTokens as AppColorTokens)
      : ({} as AppColorTokens);

  return {
    backgroundGradient: generateProCardBackgroundGradients(safeAppTokens, mode),
    border: generateProCardBorders(safeAppTokens),
    borderGradientTop: generateProCardBorderGradientsTop(safeAppTokens),
    borderGradientLeft: generateProCardBorderGradientsLeft(safeAppTokens),
    selected: selectedTokens as Record<ProCardVariant, string>,
  };
}
