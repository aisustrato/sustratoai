import type { AppColorTokens, ColorSchemeVariant, Mode } from "../ColorToken";
import tinycolor from 'tinycolor2';
import type { StandardIconSize } from "./standard-icon-tokens";

export type SphereSizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ImportedIconSize = StandardIconSize;
export type SphereStyleType = 'filled' | 'subtle' | 'outline';

export const SPHERE_SIZE_DEFINITIONS: Record<SphereSizeVariant, { rem: string; px: number }> = {
  xs: { rem: '2rem', px: 32 },
  sm: { rem: '2.5rem', px: 40 },
  md: { rem: '3rem', px: 48 },
  lg: { rem: '3.5rem', px: 56 },
  xl: { rem: '4rem', px: 64 },
  '2xl': { rem: '4.5rem', px: 72 },
};

export const MINIMUM_SPHERE_DIAMETER_FOR_BADGE = 48;

export const SPHERE_GRID_GAP_TOKENS: Record<SphereSizeVariant, { col: number; row: number }> = {
  xs: { col: 8,  row: 16 },
  sm: { col: 12, row: 24 },
  md: { col: 16, row: 32 },
  lg: { col: 20, row: 40 },
  xl: { col: 24, row: 48 },
  '2xl': { col: 24, row: 48 },
};

export interface SphereTokens {
  size: Record<SphereSizeVariant, string>;
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

export function generateSphereTokens(appColorTokens: AppColorTokens, mode: Mode): Record<ColorSchemeVariant, SphereTokens> {
  const isDark = mode === 'dark';
  const tokens = {} as Record<ColorSchemeVariant, SphereTokens>;

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

    // --- 🎨 Laboratorio de Gradientes 3D --- //

    // Gradiente para el estilo 'filled'
    const filledBase = tinycolor(mainColor);
    const filledHighlight = filledBase.clone().lighten(20).saturate(15).toRgbString();
    const filledShadow = filledBase.clone().darken(20).desaturate(15).toRgbString();
    const filledGlint = tinycolor('white').setAlpha(isDark ? 0.2 : 0.4).toRgbString();
    const filledBodyGradient = `radial-gradient(circle at 35% 35%, ${filledHighlight}, ${filledBase.toRgbString()} 80%, ${filledShadow})`;
    const filledGlintGradient = `radial-gradient(circle at 50% 25%, ${filledGlint}, transparent 35%)`;
    const finalFilledGradient = `${filledGlintGradient}, ${filledBodyGradient}`;

    // Gradiente para el estilo 'subtle'
    const subtleBaseBg = tinycolor.mix(palette.bg, mainColor, 12);
    const subtleHighlight = subtleBaseBg.clone().lighten(isDark ? 8 : 5).saturate(5).toRgbString();
    const subtleShadow = subtleBaseBg.clone().darken(isDark ? 8 : 5).toRgbString();
    const subtleGlint = tinycolor(isDark ? 'white' : 'black').setAlpha(0.07).toRgbString();
    const subtleBodyGradient = `radial-gradient(circle at 40% 40%, ${subtleHighlight}, ${subtleBaseBg.toRgbString()} 85%, ${subtleShadow})`;
    const subtleGlintGradient = `radial-gradient(circle at 50% 30%, ${subtleGlint}, transparent 35%)`;
    const finalSubtleGradient = `${subtleGlintGradient}, ${subtleBodyGradient}`;

    // --- Fin del Laboratorio ---

    const candidates = [
      palette.contrastText,
      isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      isDark ? '#FFFFFF' : '#000000'
    ];
    const bestTextColor = tinycolor.mostReadable(mainColor, candidates, { includeFallbackColors: true, level: "AA", size: "small" }).toRgbString();

    const subtleTextColor = isDark ? palette.text : palette.textShade;
    const hoverBgColor = isDark ? tinycolor(mainColor).lighten(8).toHexString() : tinycolor(mainColor).darken(8).toHexString();
    const activeBgColor = isDark ? tinycolor(mainColor).lighten(12).toHexString() : tinycolor(mainColor).darken(12).toHexString();
    
    const subtleHoverBg = tinycolor(subtleBaseBg).darken(5).saturate(5).toHexString();

    tokens[key] = {
      size: sphereRemSizes,
      styles: {
        filled: {
          backgroundColor: mainColor,
          foregroundColor: bestTextColor,
          borderColor: 'rgba(0,0,0,0)',
          gradient: finalFilledGradient,
          hoverBackgroundColor: hoverBgColor,
          hoverForegroundColor: bestTextColor,
          activeBorderColor: activeBgColor,
        },
        subtle: {
          backgroundColor: subtleBaseBg.toHexString(),
          foregroundColor: subtleTextColor,
          borderColor: mainColor,
          gradient: finalSubtleGradient,
          hoverBackgroundColor: subtleHoverBg,
          hoverForegroundColor: subtleTextColor,
          activeBorderColor: mainColor,
        },
        outline: {
          backgroundColor: 'rgba(0,0,0,0)',
          foregroundColor: mainColor,
          borderColor: mainColor,
          hoverBackgroundColor: tinycolor(mainColor).setAlpha(0.1).toRgbString(),
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