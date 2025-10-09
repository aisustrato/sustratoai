import type { AppColorTokens, ColorSchemeVariant } from "../ColorToken";
import { type StandardTextSize } from "@/components/ui/StandardText";
import { type StandardIconSize } from "@/components/ui/StandardIcon";

// 📌 1. ESTANDARIZACIÓN DE TAMAÑOS: 'xs' se añade para coherencia.
export type StandardBadgeSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';
export type StandardBadgeStyleType = 'solid' | 'subtle' | 'outline';

// 📌 2. ÚNICA FUENTE DE VERDAD PARA TAMAÑOS
// Este mapa define todo lo relacionado con el tamaño de cada variante del badge.
export const BADGE_SIZE_DEFINITIONS: Record<StandardBadgeSize, {
  heightPx: number;         // Altura en píxeles para cálculos de layout (como en el Grid)
  padding: string;          // Clases de Tailwind para el padding
  textSize: StandardTextSize; // Tamaño semántico para el componente StandardText
  iconSize: StandardIconSize; // Tamaño semántico para el componente StandardIcon
}> = {
  '2xs': { heightPx: 16, padding: "px-1.5 py-px", textSize: '4xs',  iconSize: '3xs' },
  xs: { heightPx: 20, padding: "px-2 py-0.5",  textSize: 'xs',   iconSize: 'xs' },
  sm: { heightPx: 24, padding: "px-2.5 py-1",  textSize: 'sm',   iconSize: 'sm' },
  md: { heightPx: 28, padding: "px-3 py-1.5",  textSize: 'sm',   iconSize: 'sm' },
  lg: { heightPx: 32, padding: "px-3.5 py-2",  textSize: 'base', iconSize: 'base' },
};

// Helper derivado para que otros componentes (como Sphere) puedan usarlo fácilmente.
export const BADGE_PIXEL_HEIGHTS = Object.fromEntries(
  Object.entries(BADGE_SIZE_DEFINITIONS).map(([key, value]) => [key, value.heightPx])
) as Record<StandardBadgeSize, number>;


// --- Lógica de Generación de Color ---
interface BadgeStyleTokenSet {
  bg: string;
  text: string;
  border: string;
}

// 📌 3. CORRECCIÓN DE TIPO: Usamos ColorSchemeVariant, no ProCardVariant.
export type BadgeTokens = Record<ColorSchemeVariant, Record<StandardBadgeStyleType, BadgeStyleTokenSet>>;

export function generateStandardBadgeTokens(appColorTokens: AppColorTokens): BadgeTokens {
  const tokens = {} as BadgeTokens;

  for (const colorScheme in appColorTokens) {
    const key = colorScheme as ColorSchemeVariant;
    const colorSet = appColorTokens[key];

    if (colorSet && colorSet.pure) {
      tokens[key] = {
        // ✅ Usamos 'solid' como nos pediste, para mantener la jerga.
        solid: {
          bg: colorSet.pure,
          text: colorSet.contrastText,
          border: 'transparent',
        },
        subtle: {
          bg: colorSet.bgShade,
          text: key === 'warning' ? colorSet.textShade : colorSet.text,
          border: 'transparent',
        },
        outline: {
          bg: 'transparent',
          // En 'warning', usar un tono de texto más oscuro para contraste en fondos claros/transparente
          text: key === 'warning' ? colorSet.textShade : colorSet.pure,
          border: colorSet.pure,
        },
      };
    }
  }
  
  return tokens;
}