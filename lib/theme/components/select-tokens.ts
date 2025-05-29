// lib/theme/components/select-tokens.ts

import tinycolor from "tinycolor2";
import type { AppColorTokens, ColorShade, Mode } from "../ColorToken";

export type SelectSize = "sm" | "md" | "lg";
export type SelectVariant =
  | "default"
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "neutral";

export interface SelectVariantTokens {
  background: string;
  border: string;
  text: string; 
  placeholder: string;
  iconColor: string;
  hoverBorder: string;
  focusBorder: string;
  focusRing: string;
  editingBackground: string;
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
  readOnlyBackground: string; // AÑADIDO
  readOnlyBorder: string;     // AÑADIDO
  readOnlyText: string;       // AÑADIDO
  dropdownBackground: string;
  dropdownBorder: string;
  optionText: string;
  optionHoverBackground: string;
  optionSelectedBackground: string;
  optionSelectedText: string;
  chevronButtonBackground: string;
}

export interface SelectSizeTokens {
  height: string;
  fontSize: string;
  paddingX: string;
  paddingY: string;
  optionPaddingX: string;
  optionPaddingY: string;
  dropdownMaxHeight: string;
}

export interface SelectTokens {
  variants: Record<SelectVariant, SelectVariantTokens>;
  sizes: Record<SelectSize, SelectSizeTokens>;
}

export function generateSelectTokens(
  appColorTokens: AppColorTokens,
  mode: Mode
): SelectTokens {
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
  const basePlaceholderColor = tinycolor(baseTextColor).setAlpha(0.6).toRgbString();
  const baseIconColorDefault = mode === "dark" ? tinycolor(neutral.text).setAlpha(0.7).toRgbString() : tinycolor(neutral.pure).setAlpha(0.8).toRgbString();

  const commonDisabledBackground = neutral.bgShade;
  const commonDisabledBorder = tinycolor(neutral.pure).setAlpha(0.4).toRgbString();
  const commonDisabledText = tinycolor(baseTextColor).setAlpha(0.5).toRgbString();

  // Lógica ReadOnly (alineada con input-tokens)
  const commonReadOnlyBackground =
    mode === "dark"
      ? tinycolor(neutral.bgDark).lighten(5).setAlpha(0.8).toString()
      : tinycolor(neutral.contrastText).darken(0).setAlpha(0.8).toString();
  const commonReadOnlyBorder =
    mode === "dark"
      ? tinycolor(neutral.pure).darken(10).toRgbString()
      : tinycolor(neutral.pure).lighten(10).toRgbString();
  const commonReadOnlyText = baseTextColor; // El texto en readonly suele ser el normal

  const commonErrorSuccessStateTokens = {
    errorBackground: tinycolor(danger.bg).setAlpha(mode === "dark" ? 0.2 : 0.8).toRgbString(),
    errorBorder: danger.pure,
    errorRing: tinycolor(danger.pure).setAlpha(0.25).toRgbString(),
    successBackground: tinycolor(success.bg).setAlpha(mode === "dark" ? 0.2 : 0.8).toRgbString(),
    successBorder: success.pure,
    successRing: tinycolor(success.pure).setAlpha(0.25).toRgbString(),
    successText: success.text,
  };
  
  // Fondo base para el select (alineado con Input default: neutral.bg en light mode)
  const selectBaseBackground = mode === "dark" ? neutral.bgDark : neutral.bg;
  const dropdownBaseBackground = mode === "dark" ? neutral.bg : white.bg; // Dropdown puede ser blanco puro en light

  // Editing background
  const defaultEditingBackground = tinycolor(tertiary.bg).setAlpha(0.8).toString(); // Para variante default
  const generalEditingBackgroundForVariants = tinycolor(tertiary.bg ? tertiary.bg : neutral.bg)
      .setAlpha(mode === "dark" ? 0.3 : 0.5)
      .toRgbString(); // Para otras variantes
  
  const defaultVariantTokens: SelectVariantTokens = {
    background: selectBaseBackground,
    border: neutral.pure,
    text: baseTextColor,
    placeholder: basePlaceholderColor,
    iconColor: baseIconColorDefault,
    hoverBorder: mode === "dark" ? tinycolor(neutral.pure).lighten(10).toString() : neutral.bgShade,
    focusBorder: primary.pure,
    focusRing: tinycolor(primary.pure).setAlpha(0.25).toRgbString(),
    editingBackground: defaultEditingBackground,
    ...commonErrorSuccessStateTokens,
    disabledBackground: commonDisabledBackground,
    disabledBorder: commonDisabledBorder,
    disabledText: commonDisabledText,
    readOnlyBackground: commonReadOnlyBackground,
    readOnlyBorder: commonReadOnlyBorder,
    readOnlyText: commonReadOnlyText,
    dropdownBackground: dropdownBaseBackground,
    dropdownBorder: mode === "dark" ? neutral.bgShade : neutral.pure,
    optionText: baseTextColor,
    optionHoverBackground: tinycolor(primary.pure).setAlpha(mode === "dark" ? 0.15 : 0.1).toRgbString(),
    optionSelectedBackground: tinycolor(primary.pure).setAlpha(mode === "dark" ? 0.25 : 0.15).toRgbString(),
    optionSelectedText: mode === "dark" ? primary.text : primary.pure,
    chevronButtonBackground: mode === "dark" ? tinycolor(primary.pure).setAlpha(0.1).toRgbString() : tinycolor(primary.bg).darken(2).toRgbString(),
  };

  const createColoredVariant = (
    variantMainShade: ColorShade,
    focusShadeInput?: ColorShade
  ): SelectVariantTokens => {
    const effectiveFocusShade = focusShadeInput || variantMainShade;
    return {
      background: selectBaseBackground, // Mantiene fondo base neutro
      border: variantMainShade.pure,   // Borde toma color de variante
      text: baseTextColor,
      placeholder: basePlaceholderColor,
      iconColor: mode === "dark" ? tinycolor(variantMainShade.text).setAlpha(0.9).toRgbString() : tinycolor(variantMainShade.pure).setAlpha(0.9).toRgbString(),
      hoverBorder: mode === "dark" ? tinycolor(variantMainShade.pure).lighten(10).toString() : variantMainShade.bgShade,
      focusBorder: effectiveFocusShade.pure,
      focusRing: tinycolor(effectiveFocusShade.pure).setAlpha(0.25).toRgbString(),
      editingBackground: generalEditingBackgroundForVariants, // Editing general
      ...commonErrorSuccessStateTokens,
      disabledBackground: commonDisabledBackground,
      disabledBorder: commonDisabledBorder,
      disabledText: commonDisabledText,
      readOnlyBackground: commonReadOnlyBackground,
      readOnlyBorder: commonReadOnlyBorder,
      readOnlyText: commonReadOnlyText,
      dropdownBackground: dropdownBaseBackground,
      dropdownBorder: mode === "dark" ? neutral.bgShade : variantMainShade.pure,
      optionText: baseTextColor,
      optionHoverBackground: tinycolor(variantMainShade.pure).setAlpha(mode === "dark" ? 0.15 : 0.1).toRgbString(),
      optionSelectedBackground: tinycolor(variantMainShade.pure).setAlpha(mode === "dark" ? 0.25 : 0.15).toRgbString(),
      optionSelectedText: mode === "dark" ? variantMainShade.text : variantMainShade.pure,
      chevronButtonBackground: mode === "dark" ? tinycolor(variantMainShade.pure).setAlpha(0.1).toRgbString() : tinycolor(variantMainShade.bg).darken(2).toRgbString(),
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
    sizes: { /* ... (definición de tamaños sin cambios de la última versión) ... */
      sm: { height: "h-8", fontSize: "text-xs", paddingX: "px-2", paddingY: "py-1", optionPaddingX: "px-2", optionPaddingY: "py-1", dropdownMaxHeight: "max-h-40", },
      md: { height: "h-10", fontSize: "text-sm", paddingX: "px-3", paddingY: "py-2", optionPaddingX: "px-3", optionPaddingY: "py-2", dropdownMaxHeight: "max-h-60", },
      lg: { height: "h-12", fontSize: "text-base", paddingX: "px-4", paddingY: "py-2.5", optionPaddingX: "px-4", optionPaddingY: "py-2.5", dropdownMaxHeight: "max-h-72", },
    },
  };
}