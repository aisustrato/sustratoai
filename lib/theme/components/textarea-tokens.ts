// lib/theme/components/textarea-tokens.ts

import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

// ... (Tipos TextareaVariant, TextareaSize, TextareaVariantTokens, TextareaSizeTokens, TextareaTokens sin cambios) ...
export type TextareaVariant =
  | "default"
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "neutral";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaVariantTokens {
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

export interface TextareaSizeTokens {
  height: string;
  minHeight: string;
  fontSize: string;
  paddingX: string;
  paddingY: string;
}

export interface TextareaTokens {
  variants: Record<TextareaVariant, TextareaVariantTokens>;
  sizes: Record<TextareaSize, TextareaSizeTokens>;
}


export function generateTextareaTokens(
  appColorTokens: AppColorTokens,
  mode: Mode
): TextareaTokens {
  const {
    primary,
    secondary,
    tertiary,
    accent,
    neutral,
    danger,
    success,
    // white, // No se usa directamente para fondos de variantes
  } = appColorTokens;

  const baseTextColor = neutral.text;
  const basePlaceholderColor = tinycolor(baseTextColor)
    .setAlpha(0.6)
    .toRgbString();
  
  const baseIconColorDefault =
    mode === "dark"
      ? tinycolor(neutral.text).setAlpha(0.7).toRgbString()
      : tinycolor(neutral.pure).setAlpha(0.8).toRgbString();

  const commonDisabledBackground = neutral.bgShade;
  const commonDisabledBorder = tinycolor(neutral.pure)
    .setAlpha(0.4)
    .toRgbString();
  const commonDisabledText = tinycolor(baseTextColor)
    .setAlpha(0.5)
    .toRgbString();

  // --- MODIFICACIÓN AQUÍ ---
  const commonReadOnlyBackground =
    mode === "dark"
      ? tinycolor(neutral.bgDark).lighten(5).setAlpha(0.8).toString()
      // Alineado con input-tokens: usa neutral.contrastText para light mode
      : tinycolor(neutral.contrastText).darken(0).setAlpha(0.8).toString(); 
  // --- FIN MODIFICACIÓN ---

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

  const defaultVariantTokens: TextareaVariantTokens = {
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
    readOnlyBackground: commonReadOnlyBackground, // Usando la variable corregida
    readOnlyBorder: commonReadOnlyBorder,
    readOnlyText: commonReadOnlyText,
  };

  const createColoredVariant = (
    variantMainShade: ColorShade,
    focusShadeInput?: ColorShade
  ): TextareaVariantTokens => {
    const effectiveFocusShade = focusShadeInput || variantMainShade;
    
    const generalEditingBackgroundForVariants = tinycolor(
      tertiary.bg ? tertiary.bg : neutral.bg
    )
      .setAlpha(mode === "dark" ? 0.3 : 0.5)
      .toRgbString();

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
      readOnlyBackground: commonReadOnlyBackground, // Usando la variable corregida
      readOnlyBorder: commonReadOnlyBorder,
      readOnlyText: commonReadOnlyText,
    };
  };

  return {
    variants: {
      default: defaultVariantTokens,
      primary: createColoredVariant(primary),
      secondary: createColoredVariant(secondary),
      tertiary: createColoredVariant(tertiary),
      accent: createColoredVariant(accent),
      neutral: createColoredVariant(neutral, neutral),
    },
    sizes: {
      sm: {
        height: "h-auto",
        minHeight: "min-h-[70px]",
        fontSize: "text-xs",
        paddingX: "px-2",
        paddingY: "py-1.5",
      },
      md: {
        height: "h-auto",
        minHeight: "min-h-[80px]",
        fontSize: "text-sm",
        paddingX: "px-3",
        paddingY: "py-2",
      },
      lg: {
        height: "h-auto",
        minHeight: "min-h-[100px]",
        fontSize: "text-base",
        paddingX: "px-4",
        paddingY: "py-2.5",
      },
    },
  };
}