// lib/theme/components/input-tokens.ts
// Iteración: Corregido `createColoredVariant` para no usar `arguments` y mejorar tipado.

import tinycolor from "tinycolor2";
import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant =
  | "default"
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "neutral";

// Definición de la interfaz InputVariantTokens (asegúrate que todas las props estén aquí)
export interface InputVariantTokens {
  background: string;
  border: string;
  text: string;
  placeholder: string;
  iconColor: string;
  focusBorder: string;
  focusRing: string;
  hoverBorder: string;
  errorBackground: string;
  errorBorder: string;
  errorRing: string;
  successBackground: string;
  successBorder: string;
  successRing: string;
  successText: string;
  disabledBackground: string;
  disabledBorder: string;
  disabledText: string;
  editingBackground: string;
  readOnlyBackground: string;
  readOnlyBorder: string;
  readOnlyText: string;
}

export interface InputSizeTokens {
  height: string;
  fontSize: string;
  paddingX: string;
  paddingY: string;
}

export type InputTokens = {
  variants: Record<InputVariant, InputVariantTokens>;
  sizes: Record<InputSize, InputSizeTokens>;
};

export function generateInputTokens(
  appColorTokens: AppColorTokens,
  mode: Mode
): InputTokens {
  const {
    primary,
    secondary,
    tertiary,
    accent,
    neutral,
    danger,
    success,
    white,
  } = appColorTokens;

  const baseTextColor = neutral.text;
  const basePlaceholderColor = tinycolor(baseTextColor)
    .setAlpha(0.6)
    .toRgbString();
  const baseIconColorDefault =
    mode === "dark"
      ? tinycolor(neutral.text).setAlpha(0.7).toRgbString()
      : tinycolor(neutral.pure).setAlpha(0.8).toRgbString();
  const genericVariantBackground = mode === "dark" ? neutral.bgDark : white.bg;

  const commonDisabledBackground = neutral.bgShade;
  const commonDisabledBorder = tinycolor(neutral.pure)
    .setAlpha(0.4)
    .toRgbString();
  const commonDisabledText = tinycolor(baseTextColor)
    .setAlpha(0.5)
    .toRgbString();

  const commonReadOnlyBackground =
    mode === "dark"
      ? tinycolor(neutral.bgDark).lighten(5).setAlpha(0.8).toString()
      : tinycolor(neutral.contrastText).darken(0).setAlpha(0.8).toString();
  const commonReadOnlyBorder =
    mode === "dark"
      ? tinycolor(neutral.pure).darken(10).toRgbString()
      : tinycolor(neutral.pure).lighten(10).toRgbString();
  const commonReadOnlyText = baseTextColor;

  const commonErrorSuccessStateTokens = {
    errorBackground: tinycolor(danger.bg)
      .setAlpha(mode === "dark" ? 0.2 : 0.8)
      .toRgbString(),
    errorBorder: danger.pure,
    errorRing: tinycolor(danger.pure).setAlpha(0.25).toRgbString(),
    successBackground: tinycolor(success.bg)
      .setAlpha(mode === "dark" ? 0.2 : 0.8)
      .toRgbString(),
    successBorder: success.pure,
    successRing: tinycolor(success.pure).setAlpha(0.25).toRgbString(),
    successText: success.text,
  };

  const defaultVariantNormalBackground = neutral.bg;
  const defaultVariantIsEditingBackground = tinycolor(tertiary.bg)
    .setAlpha(0.8)
    .toString();

  const defaultVariantTokens: InputVariantTokens = {
    background: defaultVariantNormalBackground,
    border: neutral.pure,
    text: baseTextColor,
    placeholder: basePlaceholderColor,
    iconColor: baseIconColorDefault,
    focusBorder: primary.pure,
    focusRing: tinycolor(primary.pure).setAlpha(0.25).toRgbString(),
    hoverBorder:
      mode === "dark"
        ? tinycolor(neutral.pure).lighten(10).toString()
        : neutral.bgShade,
    ...commonErrorSuccessStateTokens,
    disabledBackground: commonDisabledBackground,
    disabledBorder: commonDisabledBorder,
    disabledText: commonDisabledText,
    editingBackground: defaultVariantIsEditingBackground,
    readOnlyBackground: commonReadOnlyBackground,
    readOnlyBorder: commonReadOnlyBorder,
    readOnlyText: commonReadOnlyText,
  };

  // --- createColoredVariant con parámetros explícitos ---
  const createColoredVariant = (
    variantMainShade: ColorShade,
    focusShadeInput?: ColorShade // Parámetro opcional para el color de foco
  ): InputVariantTokens => {
    const effectiveFocusShade = focusShadeInput || variantMainShade; // Si no se provee focusShadeInput, usa variantMainShade
    const generalEditingBackgroundForVariants = tinycolor(
      tertiary.bg ? tertiary.bg : neutral.bg
    )
      .setAlpha(mode === "dark" ? 0.3 : 0.5)
      .toRgbString();
    console.log(variantMainShade.contrastText);
    return {
      background: variantMainShade.contrastText,

      border: variantMainShade.pure,
      text: baseTextColor,
      placeholder: basePlaceholderColor,
      iconColor:
        mode === "dark"
          ? tinycolor(variantMainShade.text).setAlpha(0.9).toRgbString()
          : tinycolor(variantMainShade.pure).setAlpha(0.9).toRgbString(),
      focusBorder: effectiveFocusShade.pure,
      focusRing: tinycolor(effectiveFocusShade.pure)
        .setAlpha(0.25)
        .toRgbString(),
      hoverBorder:
        mode === "dark"
          ? tinycolor(variantMainShade.pure).lighten(10).toString()
          : variantMainShade.bgShade,
      ...commonErrorSuccessStateTokens,
      disabledBackground: commonDisabledBackground,
      disabledBorder: commonDisabledBorder,
      disabledText: commonDisabledText,
      editingBackground: generalEditingBackgroundForVariants,
      readOnlyBackground: commonReadOnlyBackground,
      readOnlyBorder: commonReadOnlyBorder,
      readOnlyText: commonReadOnlyText,
    };
  };
  // --- Fin corrección ---

  return {
    variants: {
      default: defaultVariantTokens,
      primary: createColoredVariant(primary), // Llama con un solo argumento, focusShade será primary
      secondary: createColoredVariant(secondary),
      tertiary: createColoredVariant(tertiary),
      accent: createColoredVariant(accent),
      neutral: createColoredVariant(neutral, neutral), // Aquí pasamos neutral dos veces, el segundo es para focusShadeInput
    },
    sizes: {
      sm: {
        height: "h-8",
        fontSize: "text-xs",
        paddingX: "px-2",
        paddingY: "py-1",
      },
      md: {
        height: "h-10",
        fontSize: "text-sm",
        paddingX: "px-3",
        paddingY: "py-2",
      },
      lg: {
        height: "h-12",
        fontSize: "text-base",
        paddingX: "px-4",
        paddingY: "py-2.5",
      },
    },
  };
}
