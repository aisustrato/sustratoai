
import type { AppColorTokens } from "../ColorToken";

export type ProgressVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "termometro";
export type ProgressSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ProgressTokens {
  trackColor: string;
  barColor: string;
  barGradient: string;
  accentGradient: string;
  borderRadius: string;
  transition: string;
}

/**
 * Genera los tokens para el componente Progress
 */
export function generateProgressTokens(
  appColorTokens: AppColorTokens,
  variant: ProgressVariant = "primary"
): ProgressTokens {
  // const isDark = mode === "dark" // Removed
  // const themeColors = colors.themes[colorScheme] // Removed
  // const semanticColors = colors.semantic // Removed
  // const accentColor = semanticColors.accent // Will use appColorTokens.accent

  // Función para obtener los colores base según la variante
  const getBaseColors = () => {
    switch (variant) {
      case "primary": {
        const mainColor = appColorTokens.primary.pure;
        const secondColor = appColorTokens.secondary.pure;
        return {
          track: `${appColorTokens.primary.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${mainColor}, ${secondColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
      case "secondary": {
        const mainColor = appColorTokens.secondary.pure;
        const primaryColor = appColorTokens.primary.pure;
        return {
          track: `${appColorTokens.secondary.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${primaryColor}, ${mainColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
      case "tertiary": {
        const mainColor = appColorTokens.tertiary.pure;
        const secondaryColor = appColorTokens.secondary.pure;
        return {
          track: `${appColorTokens.tertiary.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${secondaryColor}, ${mainColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
      case "accent": {
        const mainColor = appColorTokens.accent.pure;
        const primaryColor = appColorTokens.primary.pure;
        return {
          track: `${appColorTokens.accent.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${primaryColor}, ${mainColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${primaryColor})`,
        };
      }
      case "success": {
        const mainColor = appColorTokens.success.pure;
        // const accentColor = appColorTokens.accent.pure; // Replaced direct use
        return {
          track: `${appColorTokens.success.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${appColorTokens.accent.pure}, ${mainColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
      case "warning": {
        const mainColor = appColorTokens.warning.pure;
        const dangerColor = appColorTokens.danger.pure;
        return {
          track: `${appColorTokens.warning.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${dangerColor}, ${mainColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
      case "danger": {
        const mainColor = appColorTokens.danger.pure;
        const warningColor = appColorTokens.warning.pure;
        return {
          track: `${appColorTokens.danger.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${mainColor}, ${warningColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
      case "neutral": {
        // const darkColor = isDark ? colors.neutral.gray[400] : colors.neutral.gray[600] // Removed
        // const lightColor = isDark ? colors.neutral.gray[600] : colors.neutral.gray[400] // Removed
        return {
          track: `${appColorTokens.neutral.bg}40`,
          bar: appColorTokens.neutral.text, // Using neutral text for the bar
          gradient: `linear-gradient(90deg, ${appColorTokens.neutral.text}, ${appColorTokens.neutral.bgShade})`,
          accentGradient: `linear-gradient(90deg, ${appColorTokens.neutral.text}, ${appColorTokens.accent.pure})`,
        };
      }
      case "termometro": {
        const dangerColor = appColorTokens.danger.pure;
        const warningColor = appColorTokens.warning.pure;
        const successColor = appColorTokens.success.pure;
        return {
          track: `${appColorTokens.neutral.bg}40`, // Neutral track for thermometer
          bar: warningColor, // Color base (no se usa directamente para el degradado principal)
          gradient: `linear-gradient(90deg, ${dangerColor}, ${warningColor}, ${successColor})`,
          accentGradient: `linear-gradient(90deg, ${dangerColor}, ${appColorTokens.accent.pure}, ${successColor})`,
        };
      }
      default: {
        // Fallback to primary
        const mainColor = appColorTokens.primary.pure;
        const secondColor = appColorTokens.secondary.pure;
        return {
          track: `${appColorTokens.primary.bg}40`,
          bar: mainColor,
          gradient: `linear-gradient(90deg, ${mainColor}, ${secondColor})`,
          accentGradient: `linear-gradient(90deg, ${mainColor}, ${appColorTokens.accent.pure})`,
        };
      }
    }
  };

  const baseColors = getBaseColors();

  return {
    trackColor: baseColors.track,
    barColor: baseColors.bar,
    barGradient: baseColors.gradient,
    accentGradient: baseColors.accentGradient,
    borderRadius: "9999px", // Siempre redondeado
    transition: "width 0.3s ease-in-out",
  };
}
