// En: /lib/theme/components/standard-tabs-tokens.ts

"use client";

import type { AppColorTokens, ColorSchemeVariant, Mode } from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";

export interface StandardTabsTokenArgs {
  colorScheme?: ColorSchemeVariant;
  styleType?: 'line' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
  isActive: boolean;
  isDisabled: boolean;
  isHovered: boolean;
}

export interface StandardTabsTokens {
  tabsList: {
    borderBottomColor?: string;
    borderBottomWidth?: string;
  };
  tabsTrigger: {
    background: string;
    color: string;
    borderBottomColor: string;
    borderBottomWidth: string; // <-- Añadido para controlar el grosor
    borderTopColor: string;
    borderLeftColor: string;
    borderRightColor: string;
    fontWeight: string;
    fontSize: string;
    padding: string;
    cursor: string;
    opacity: number;
    marginBottom: string; // <-- Añadido para el ajuste vertical
  };
}

export function generateStandardTabsTokens(
  appTokens: AppColorTokens,
  mode: Mode,
  args: StandardTabsTokenArgs
): StandardTabsTokens {
  const { colorScheme = 'primary', styleType = 'line', size = 'md', isActive, isDisabled, isHovered } = args;
  
  const isDark = mode === 'dark';
  const palette = appTokens[colorScheme] || appTokens.primary;

  const fontMap: Record<typeof size, string> = { sm: "0.875rem", md: "0.875rem", lg: "1rem" };
  const paddingMap: Record<typeof size, string> = { sm: "0.4rem 0.8rem", md: "0.5rem 1rem", lg: "0.6rem 1.2rem" };
  const borderWidth = "2px"; // Grosor de borde estandarizado

  const recipe: StandardTabsTokens = {
    tabsList: {
      // FIX: El borde de la lista ahora es transparente por defecto en el modo 'line'
      borderBottomColor: styleType === 'line' ? 'transparent' : appTokens.neutral.bgShade,
      borderBottomWidth: borderWidth,
    },
    tabsTrigger: {
      background: 'transparent',
      color: appTokens.neutral.text,
      // FIX: Cada trigger tiene un borde transparente para ocupar espacio
      borderBottomColor: 'transparent',
      borderBottomWidth: borderWidth,
      borderTopColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      fontWeight: '500',
      fontSize: fontMap[size],
      padding: paddingMap[size],
      cursor: 'pointer',
      opacity: 1,
      // FIX: Ajustamos el margen inferior para que el borde se alinee con el riel
      marginBottom: `-${borderWidth}`,
    },
  };

  if (styleType === 'enclosed') {
    recipe.tabsList.borderBottomColor = appTokens.neutral.bgShade;
    recipe.tabsTrigger.borderBottomColor = appTokens.neutral.bgShade;
  }

  if (isHovered && !isActive && !isDisabled) {
    recipe.tabsTrigger.background = tinycolor(palette.pure).setAlpha(isDark ? 0.1 : 0.05).toRgbString();
    recipe.tabsTrigger.color = tinycolor(palette.pure).darken(isDark ? 0 : 10).toHexString();
  }

  if (isActive && !isDisabled) {
    recipe.tabsTrigger.color = palette.pure;
    recipe.tabsTrigger.fontWeight = '700';

    if (styleType === 'line') {
      recipe.tabsTrigger.borderBottomColor = palette.pure;
    }
    if (styleType === 'enclosed') {
      recipe.tabsTrigger.background = isDark ? tinycolor(appTokens.neutral.bg).lighten(5).toHexString() : appTokens.white.pure;
      recipe.tabsTrigger.borderBottomColor = 'transparent';
      recipe.tabsTrigger.borderTopColor = appTokens.neutral.bgShade;
      recipe.tabsTrigger.borderLeftColor = appTokens.neutral.bgShade;
      recipe.tabsTrigger.borderRightColor = appTokens.neutral.bgShade;
    }
  }

  if (isDisabled) {
    recipe.tabsTrigger.opacity = 0.6;
    recipe.tabsTrigger.cursor = 'not-allowed';
    recipe.tabsTrigger.color = tinycolor(appTokens.neutral.text).setAlpha(0.6).toRgbString();
    recipe.tabsTrigger.background = 'transparent';
  }

  return recipe;
}