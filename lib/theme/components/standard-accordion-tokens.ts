//. 📍 /lib/theme/components/standard-accordion-tokens.ts

"use client";

import type { AppColorTokens, ColorSchemeVariant, Mode } from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";

export interface StandardAccordionTokenArgs {
  colorScheme?: ColorSchemeVariant;
  size?: 'sm' | 'md' | 'lg';
  styleType?: 'subtle' | 'solid';
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
    size: string;
  };
}

export function generateStandardAccordionTokens(
  appTokens: AppColorTokens,
  mode: Mode,
  args: StandardAccordionTokenArgs
): StandardAccordionTokens {
  const { colorScheme = 'neutral', size = 'md', styleType = 'subtle', isHovered, isOpen, isDisabled } = args;

  const isDark = mode === 'dark';
  const palette = appTokens[colorScheme] || appTokens.neutral;

  const sizeMap = {
    sm: { padding: '0.5rem 0.75rem', fontSize: '0.9375rem', contentPadding: '0.75rem' }, // 15px
    md: { padding: '0.75rem 1rem', fontSize: '1.0625rem', contentPadding: '1rem' },      // 17px
    lg: { padding: '1rem 1.25rem', fontSize: '1.1875rem', contentPadding: '1.25rem' },   // 19px
  } as const;

  const currentSize = sizeMap[size];

  const baseTextColor = appTokens.neutral.text;

  // Helpers de gradiente según estilo
  const base = tinycolor(palette.pure);
  const makeSubtleGradient = (vivid = false) => {
    const top = base.clone().lighten(vivid ? 16 : 12).setAlpha(isDark ? (vivid ? 0.22 : 0.14) : (vivid ? 0.18 : 0.10)).toRgbString();
    const bottom = base.clone().darken(vivid ? 12 : 8).setAlpha(isDark ? (vivid ? 0.22 : 0.14) : (vivid ? 0.18 : 0.10)).toRgbString();
    return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
  };
  const makeSolidGradient = (vivid = false) => {
    const top = base.clone().lighten(vivid ? 8 : 4).toHexString();
    const bottom = base.clone().darken(vivid ? 12 : 8).toHexString();
    return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
  };

  const triggerBgBase = styleType === 'solid' ? makeSolidGradient(false) : makeSubtleGradient(false);
  const triggerBgHover = styleType === 'solid' ? makeSolidGradient(false) : makeSubtleGradient(true);
  const triggerBgOpen  = styleType === 'solid' ? makeSolidGradient(true)  : makeSubtleGradient(true);

  const contentBgBase = styleType === 'solid'
    ? `linear-gradient(180deg, ${base.clone().lighten(10).toHexString()} 0%, ${base.clone().lighten(2).toHexString()} 100%)`
    : (isDark ? appTokens.neutral.bgShade : appTokens.white.pure);

  const recipe: StandardAccordionTokens = {
    item: {
      borderColor: appTokens.neutral.bgShade,
      marginBottom: '0.5rem',
      // Corregido: 'borderRadius' se gestionará con clases de Tailwind en el componente.
    },
    trigger: {
      // Fondo con gradiente
      background: triggerBgBase,
      color: baseTextColor,
      padding: currentSize.padding,
      fontSize: currentSize.fontSize,
      fontWeight: '500',
      cursor: 'pointer',
      opacity: 1,
    },
    content: {
      background: contentBgBase,
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
      // Tamaño del ícono según tamaño del componente (sm/md/lg)
      size: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem',
    },
  };

  if (isHovered && !isDisabled) {
    recipe.trigger.background = triggerBgHover;
    recipe.trigger.color = styleType === 'solid' ? appTokens.white.pure : palette.pure;
    recipe.icon.color = palette.pure;
  }

  if (isOpen && !isDisabled) {
    recipe.trigger.background = triggerBgOpen;
    recipe.trigger.color = styleType === 'solid' ? appTokens.white.pure : palette.pure;
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
