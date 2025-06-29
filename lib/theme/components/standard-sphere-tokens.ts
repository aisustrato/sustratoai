import type { AppColorTokens, ColorSchemeVariant, Mode } from "../ColorToken";
import tinycolor from 'tinycolor2';

export type SphereSizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ImportedIconSize = "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl";
export type SphereStyleType = 'filled' | 'subtle' | 'outline';

// 📌 ÚNICA FUENTE DE VERDAD PARA LOS TAMAÑOS
// Este objeto es ahora el "mapa maestro". Define todo lo que necesitamos saber sobre los tamaños.
export const SPHERE_SIZE_DEFINITIONS: Record<SphereSizeVariant, { rem: string; px: number }> = {
  xs: { rem: '2rem', px: 32 },
  sm: { rem: '2.5rem', px: 40 },
  md: { rem: '3rem', px: 48 },
  lg: { rem: '3.5rem', px: 56 },
  xl: { rem: '4rem', px: 64 },
  '2xl': { rem: '4.5rem', px: 72 },
};

// El token de espaciado proporcional que define el "aire" correcto para cada tamaño de esfera en el grid.
export const SPHERE_GRID_GAP_TOKENS: Record<SphereSizeVariant, { col: number; row: number }> = {
  xs: { col: 8,  row: 16 },
  sm: { col: 12, row: 24 },
  md: { col: 16, row: 32 },
  lg: { col: 20, row: 40 },
  xl: { col: 24, row: 48 },
  '2xl': { col: 24, row: 48 },
};

export interface SphereTokens {
  size: Record<SphereSizeVariant, string>; // Sigue esperando los valores en 'rem'
  styles: Record<SphereStyleType, {
    backgroundColor: string;
    foregroundColor: string;
    borderColor: string;
    gradient?: string;
    hoverBackgroundColor?: string;
    hoverForegroundColor?: string;
    activeBorderColor?: string;
  }>;
  badge: {
    offset: string;
    size: string;
  };
  transition: string;
  hoverTransform: string;
  activeTransform: string;
}

function createGradient(color: string): string {
  const lighter = tinycolor(color).lighten(12).toHexString();
  const base = color;
  const darker = tinycolor(color).darken(15).toHexString();
  return `radial-gradient(circle at 30% 30%, ${lighter}, ${base} 50%, ${darker})`;
}

export function generateSphereTokens(appColorTokens: AppColorTokens, mode: Mode): Record<ColorSchemeVariant, SphereTokens> {
  const isDark = mode === 'dark';
  const tokens = {} as Record<ColorSchemeVariant, SphereTokens>;

  // Derivamos los tamaños en 'rem' desde nuestra nueva fuente de verdad.
  const sphereRemSizes = Object.fromEntries(
    Object.entries(SPHERE_SIZE_DEFINITIONS).map(([key, value]) => [key, value.rem])
  ) as Record<SphereSizeVariant, string>;

  for (const colorScheme in appColorTokens) {
    const key = colorScheme as ColorSchemeVariant;
    const palette = appColorTokens[key];

    if (!palette || !['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info', 'neutral'].includes(key)) {
      continue;
    }
    
    const mainColor = palette.pure;
    const textColor = palette.contrastText;
    const subtleTextColor = isDark ? palette.text : palette.textShade;
    const hoverBgColor = isDark ? tinycolor(mainColor).lighten(8).toHexString() : tinycolor(mainColor).darken(8).toHexString();
    const activeBgColor = isDark ? tinycolor(mainColor).lighten(12).toHexString() : tinycolor(mainColor).darken(12).toHexString();

    tokens[key] = {
      size: sphereRemSizes,
      styles: {
        filled: {
          backgroundColor: mainColor,
          foregroundColor: textColor,
          borderColor: 'transparent',
          gradient: createGradient(mainColor),
          hoverBackgroundColor: hoverBgColor,
          hoverForegroundColor: textColor,
          activeBorderColor: activeBgColor,
        },
        subtle: {
          backgroundColor: tinycolor(mainColor).setAlpha(0.15).toHexString(),
          foregroundColor: subtleTextColor,
          borderColor: 'transparent',
          gradient: `radial-gradient(circle at 30% 30%, ${tinycolor(mainColor).setAlpha(0.2)}, ${tinycolor(mainColor).setAlpha(0.1)})`,
          hoverBackgroundColor: tinycolor(mainColor).setAlpha(0.25).toHexString(),
          hoverForegroundColor: subtleTextColor,
          activeBorderColor: 'transparent',
        },
        outline: {
          backgroundColor: 'transparent',
          foregroundColor: mainColor,
          borderColor: mainColor,
          hoverBackgroundColor: tinycolor(mainColor).setAlpha(0.1).toHexString(),
          hoverForegroundColor: mainColor,
          activeBorderColor: mainColor,
        }
      },
      badge: {
        offset: '0.7rem',
        size: '1rem',
      },
      transition: 'all 0.2s ease-in-out',
      hoverTransform: 'translateY(-2px) scale(1.05)',
      activeTransform: 'translateY(0) scale(0.98)'
    };
  }

  return tokens;
}