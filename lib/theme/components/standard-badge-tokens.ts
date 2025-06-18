//. 📍 lib/theme/components/standard-badge-tokens.ts (v2.0 - Canon StandardCard)

import type { AppColorTokens, ProCardVariant } from "../ColorToken";

export type StandardBadgeStyleType = 'solid' | 'subtle' | 'outline';
export type StandardBadgeSize = 'sm' | 'md' | 'lg';

// Define la estructura de un set de colores para un estilo específico
interface BadgeStyleTokenSet {
  bg: string;
  text: string;
  border: string;
}

// El objeto final anidado: ColorScheme -> StyleType -> TokenSet
export type BadgeTokens = Record<ProCardVariant, Record<StandardBadgeStyleType, BadgeStyleTokenSet>>;

/**
 * Genera un "diccionario tonto" con todos los valores de color brutos
 * para todas las variantes y estilos posibles del Badge.
 */
export function generateStandardBadgeTokens(appColorTokens: AppColorTokens): BadgeTokens {
  const tokens = {} as BadgeTokens;

  // Iteramos sobre cada esquema de color definido en el tema principal
  for (const colorScheme in appColorTokens) {
    const key = colorScheme as ProCardVariant;
    const colorSet = appColorTokens[key];

    if (colorSet) {
      tokens[key] = {
        solid: {
          bg: colorSet.pure,
          text: colorSet.contrastText,
          border: 'transparent',
        },
        subtle: {
          bg: colorSet.bgShade,
          text: colorSet.text,
          border: 'transparent',
        },
        outline: {
          bg: 'transparent',
          text: colorSet.pure,
          border: colorSet.pure,
        },
      };
    }
  }
  
  return tokens;
}