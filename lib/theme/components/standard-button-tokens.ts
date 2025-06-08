import type { AppColorTokens, Mode, ProCardVariant } from "../ColorToken";
import { neutral as neutralPalette } from "../colors";
import tinycolor from "tinycolor2";

// Tipos para las props de StandardButton
export type StandardButtonStyleType = "solid" | "outline" | "ghost" | "link" | "subtle";
export type StandardButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "icon";
export type StandardButtonRounded = "none" | "sm" | "md" | "lg" | "full";
export type StandardButtonColorScheme = ProCardVariant;

// Estructura completa de tokens para el botón estándar
export interface StandardButtonTokens {
  base: {
    padding: Record<Exclude<StandardButtonSize, "icon">, string> & { icon: string }; // Tipado más preciso
    borderRadius: Record<StandardButtonRounded, string>;
    fontSize: Record<Exclude<StandardButtonSize, "icon">, string> & { icon: string };
    height: Record<Exclude<StandardButtonSize, "icon">, string> & { icon: string };
    iconSize: Record<Exclude<StandardButtonSize, "icon">, string> & { icon: string };
    transition: string;
    fontWeight: string;
    gap: Record<Exclude<StandardButtonSize, "icon">, string> & { icon: string };
  };
  variants: {
    [key in StandardButtonStyleType]: {
      default: { background: string; color: string; border: string; boxShadow: string; };
      hover: { background: string; color: string; border: string; boxShadow: string; transform: string; };
      active: { background: string; color: string; border: string; boxShadow: string; transform: string; };
      focus: { outline: string; ring: string; };
      disabled: { background: string; color: string; border: string; opacity: string; cursor: string; };
    };
  };
  colors: {
    [key in StandardButtonColorScheme]?: {
      background: string; color: string; border: string; gradient: string;
      hoverBackground: string; hoverColor: string; hoverBorder: string;
      activeBackground: string; activeColor: string; activeBorder: string;
      ghostColor: string; ghostBorder: string; outlineColor: string; outlineBorder: string;
      rippleColor: string; bgShade: string; textShade: string;
    };
  };
  loading: {
    spinnerColor: string;
    spinnerSize: Record<Exclude<StandardButtonSize, "icon">, string> & { icon: string };
    opacity: string;
  };
}

// Función para generar los tokens del botón estándar
export function generateStandardButtonTokens(appColorTokens: AppColorTokens, mode: Mode): StandardButtonTokens {
  const isDark = mode === "dark";

  const adjustColor = (color: string, darken: number, lighten: number) => isDark ? tinycolor(color).lighten(lighten).toString() : tinycolor(color).darken(darken).toString();
  const createGradient = (color: string) => {
    const lighter = tinycolor(color).lighten(10).toString();
    return isDark ? `linear-gradient(to bottom right, ${color}, ${lighter})` : `linear-gradient(to bottom right, ${lighter}, ${color})`;
  };

  // CORREGIDO: Incluido el contenido completo de baseTokens
  const baseTokens: StandardButtonTokens['base'] = {
    padding: { xs: "0.25rem 0.5rem", sm: "0.375rem 0.75rem", md: "0.5rem 1rem", lg: "0.75rem 1.25rem", xl: "1rem 1.5rem", icon: "0" },
    borderRadius: { none: "0", sm: "0.25rem", md: "0.375rem", lg: "0.5rem", full: "9999px" },
    fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.125rem", xl: "1.25rem", icon: "1.25rem" },
    height: { xs: "1.5rem", sm: "2rem", md: "2.5rem", lg: "3rem", xl: "3.5rem", icon: "2.5rem" },
    iconSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.25rem", xl: "1.5rem", icon: "1.25rem" },
    gap: { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", icon: "0.25rem" },
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    fontWeight: "500",
  };

  // CORREGIDO: Incluido el contenido completo de variantTokens
  const variantTokens: StandardButtonTokens['variants'] = {
    solid: { default: { background: "currentBackground", color: "currentColor", border: "none", boxShadow: isDark ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }, hover: { background: "currentHoverBackground", color: "currentHoverColor", border: "none", boxShadow: isDark ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", transform: "translateY(-1px)" }, active: { background: "currentActiveBackground", color: "currentActiveColor", border: "none", boxShadow: isDark ? "0 1px 2px 0 rgba(0, 0, 0, 0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)", transform: "translateY(1px)" }, focus: { outline: "none", ring: isDark ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.5).toString()}` : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}` }, disabled: { background: isDark ? neutralPalette.gray[700] : neutralPalette.gray[200], color: isDark ? neutralPalette.gray[500] : neutralPalette.gray[400], border: "none", opacity: "0.6", cursor: "not-allowed" } },
    outline: { default: { background: "transparent", color: "currentOutlineColor", border: "1px solid currentOutlineBorder", boxShadow: "none" }, hover: { background: "currentBgShade", color: "currentTextShade", border: "1px solid currentHoverBorder", boxShadow: isDark ? "0 2px 4px -1px rgba(0, 0, 0, 0.3)" : "0 2px 4px -1px rgba(0, 0, 0, 0.06)", transform: "translateY(-1px)" }, active: { background: "rgba(currentRgb, 0.4)", color: "currentActiveColor", border: "1px solid currentActiveBorder", boxShadow: "none", transform: "translateY(1px)" }, focus: { outline: "none", ring: isDark ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.5).toString()}` : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}` }, disabled: { background: "transparent", color: isDark ? neutralPalette.gray[500] : neutralPalette.gray[400], border: `1px solid ${isDark ? neutralPalette.gray[600] : neutralPalette.gray[300]}`, opacity: "0.6", cursor: "not-allowed" } },
    ghost: { default: { background: "transparent", color: "currentGhostColor", border: "none", boxShadow: "none" }, hover: { background: "currentBgShade", color: "currentTextShade", border: "none", boxShadow: "none", transform: "translateY(-1px)" }, active: { background: "rgba(currentRgb, 0.4)", color: "currentActiveColor", border: "none", boxShadow: "none", transform: "translateY(1px)" }, focus: { outline: "none", ring: isDark ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}` : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.3).toString()}` }, disabled: { background: "transparent", color: isDark ? neutralPalette.gray[500] : neutralPalette.gray[400], border: "none", opacity: "0.6", cursor: "not-allowed" } },
    link: { default: { background: "transparent", color: "currentColor", border: "none", boxShadow: "none" }, hover: { background: "currentBgShade", color: "currentTextShade", border: "none", boxShadow: "none", transform: "none" }, active: { background: "transparent", color: "currentActiveColor", border: "none", boxShadow: "none", transform: "none" }, focus: { outline: "none", ring: "none" }, disabled: { background: "transparent", color: isDark ? neutralPalette.gray[500] : neutralPalette.gray[400], border: "none", opacity: "0.6", cursor: "not-allowed" } },
    subtle: { default: { background: "rgba(currentRgb, 0.25)", color: "currentColor", border: "none", boxShadow: "none" }, hover: { background: "currentBackground", color: "currentColor", border: "none", boxShadow: isDark ? "0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 2px 4px -1px rgba(0, 0, 0, 0.05)", transform: "translateY(-1px)" }, active: { background: "currentActiveBackground", color: "currentActiveColor", border: "none", boxShadow: "none", transform: "translateY(1px)" }, focus: { outline: "none", ring: isDark ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}` : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.3).toString()}` }, disabled: { background: isDark ? neutralPalette.gray[800] : neutralPalette.gray[100], color: isDark ? neutralPalette.gray[500] : neutralPalette.gray[400], border: "none", opacity: "0.6", cursor: "not-allowed" } }
  };
  
  // CORREGIDO: Incluido el contenido completo de loadingTokens
  const loadingTokens: StandardButtonTokens['loading'] = {
    spinnerColor: "currentColor",
    spinnerSize: { xs: "0.75rem", sm: "1rem", md: "1.25rem", lg: "1.5rem", xl: "1.75rem", icon: "1.25rem" },
    opacity: "0.7",
  };
  
  const colorTokens: StandardButtonTokens["colors"] = {};
  
  const schemesToGenerate: StandardButtonColorScheme[] = [ "primary", "secondary", "tertiary", "accent", "success", "warning", "danger", "neutral", "white" ];
 
  schemesToGenerate.forEach(scheme => {
    const tokenShade = appColorTokens[scheme as keyof AppColorTokens];
    if (tokenShade) {
      colorTokens[scheme] = {
        background: tokenShade.pure, color: tokenShade.contrastText, border: tokenShade.pure,
        gradient: createGradient(tokenShade.pure),
        hoverBackground: adjustColor(tokenShade.pure, 10, 10), hoverColor: tokenShade.contrastText, hoverBorder: adjustColor(tokenShade.pure, 10, 10),
        activeBackground: adjustColor(tokenShade.pure, 15, 15), activeColor: tokenShade.contrastText, activeBorder: adjustColor(tokenShade.pure, 15, 15),
        ghostColor: tokenShade.pure, ghostBorder: tokenShade.pure, outlineColor: tokenShade.pure, outlineBorder: tokenShade.pure,
        rippleColor: tokenShade.bg, bgShade: tokenShade.bgShade, textShade: tokenShade.textShade,
      };
    }
  });

  colorTokens.neutral = {
    background: isDark ? neutralPalette.gray[600] : neutralPalette.gray[200],
    color: isDark ? neutralPalette.gray[200] : neutralPalette.gray[800],
    border: isDark ? neutralPalette.gray[400] : neutralPalette.gray[400],
    gradient: createGradient(isDark ? neutralPalette.gray[600] : neutralPalette.gray[200]),
    hoverBackground: isDark ? neutralPalette.gray[500] : neutralPalette.gray[300],
    hoverColor: isDark ? neutralPalette.gray[200] : neutralPalette.gray[800],
    hoverBorder: isDark ? neutralPalette.gray[300] : neutralPalette.gray[500],
    activeBackground: isDark ? neutralPalette.gray[400] : neutralPalette.gray[400],
    activeColor: isDark ? neutralPalette.gray[200] : neutralPalette.gray[800],
    activeBorder: isDark ? neutralPalette.gray[200] : neutralPalette.gray[600],
    ghostColor: isDark ? neutralPalette.white : neutralPalette.gray[900],
    ghostBorder: isDark ? neutralPalette.gray[300] : neutralPalette.gray[500],
    outlineColor: isDark ? neutralPalette.white : neutralPalette.gray[900],
    outlineBorder: isDark ? neutralPalette.gray[300] : neutralPalette.gray[500],
    rippleColor: neutralPalette.gray[300],
    bgShade: appColorTokens.neutral.bgShade,
    textShade: appColorTokens.neutral.textShade,
  };

  return { base: baseTokens, variants: variantTokens, colors: colorTokens, loading: loadingTokens };
}