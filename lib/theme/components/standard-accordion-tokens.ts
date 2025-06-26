//. 📍 /lib/theme/components/standard-accordion-tokens.ts

"use client";

import type { AppColorTokens, ColorSchemeVariant, Mode } from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";

export interface StandardAccordionTokenArgs {
  colorScheme?: ColorSchemeVariant;
  size?: 'sm' | 'md' | 'lg';
  isHovered?: boolean;
  isOpen?: boolean;
  isDisabled?: boolean;
}

export interface StandardAccordionTokens {
  item: {
    borderColor: string;
    marginBottom: string;
  };
  trigger: {
    background: string;
    color: string;
    padding: string;
    fontSize: string;
    fontWeight: string;
    cursor: string;
    opacity: number;
  };
  content: {
    background: string;
    color: string;
    padding: string;
    fontSize: string;
    borderTop: string;
    opacity: number; // Propiedad añadida para el estado deshabilitado
  };
  icon: {
    color: string;
    transform: string;
  };
}

export function generateStandardAccordionTokens(
  appTokens: AppColorTokens,
  mode: Mode,
  args: StandardAccordionTokenArgs
): StandardAccordionTokens {
  const { colorScheme = 'neutral', size = 'md', isHovered, isOpen, isDisabled } = args;

  const isDark = mode === 'dark';
  const palette = appTokens[colorScheme] || appTokens.neutral;

  const sizeMap = {
    sm: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', contentPadding: '0.75rem' },
    md: { padding: '0.75rem 1rem', fontSize: '1rem', contentPadding: '1rem' },
    lg: { padding: '1rem 1.25rem', fontSize: '1.125rem', contentPadding: '1.25rem' },
  };

  const currentSize = sizeMap[size];

  // Corregido: Usar 'bgShade' para el fondo del contenido en modo oscuro, y 'white.pure' en modo claro.
  const contentBg = isDark ? appTokens.neutral.bgShade : appTokens.white.pure;
  const baseTextColor = appTokens.neutral.text;

  const recipe: StandardAccordionTokens = {
    item: {
      borderColor: appTokens.neutral.bgShade,
      marginBottom: '0.5rem',
      // Corregido: 'borderRadius' se gestionará con clases de Tailwind en el componente.
    },
    trigger: {
      background: 'transparent',
      color: baseTextColor,
      padding: currentSize.padding,
      fontSize: currentSize.fontSize,
      fontWeight: '500',
      cursor: 'pointer',
      opacity: 1,
    },
    content: {
      background: contentBg,
      color: baseTextColor,
      padding: currentSize.contentPadding,
      fontSize: currentSize.fontSize,
      borderTop: `1px solid ${appTokens.neutral.bgShade}`,
      opacity: 1, // Opacidad por defecto
    },
    icon: {
      // Corregido: 'textSubtle' no existe, se usa 'text'.
      color: appTokens.neutral.text,
      transform: 'rotate(0deg)',
    },
  };

  if (isHovered && !isDisabled) {
    recipe.trigger.background = tinycolor(palette.pure).setAlpha(isDark ? 0.1 : 0.08).toRgbString();
    recipe.trigger.color = palette.pure;
    recipe.icon.color = palette.pure;
  }

  if (isOpen && !isDisabled) {
    recipe.trigger.color = palette.pure;
    recipe.trigger.fontWeight = '600';
    recipe.icon.transform = 'rotate(180deg)';
    recipe.icon.color = palette.pure;
  }

  if (isDisabled) {
    recipe.trigger.cursor = 'not-allowed';
    recipe.trigger.opacity = 0.5;
    // Corregido: Se añade la opacidad al contenido cuando está deshabilitado.
    recipe.content.opacity = 0.5;
  }

  return recipe;
}
