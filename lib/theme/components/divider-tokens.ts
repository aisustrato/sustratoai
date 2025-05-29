
import type { AppColorTokens } from "../ColorToken";

export type DividerVariant = "gradient" | "solid" | "subtle";
export type DividerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface DividerTokens {
  // Variantes de divider
  variants: {
    gradient: {
      backgroundImage: string;
    };
    solid: {
      background: string;
    };
    subtle: {
      background: string;
    };
  };
  // Tamaños predefinidos
  sizes: {
    xs: {
      height: string;
      width: string;
      borderRadius: string;
    };
    sm: {
      height: string;
      width: string;
      borderRadius: string;
    };
    md: {
      height: string;
      width: string;
      borderRadius: string;
    };
    lg: {
      height: string;
      width: string;
      borderRadius: string;
    };
    xl: {
      height: string;
      width: string;
      borderRadius: string;
    };
  };
}

// Helper function to convert hex to RGBA and handle potential errors
function hexToRgba(hex: string, alpha: number): string {
  const hexValue = hex.startsWith("#") ? hex.slice(1) : hex;

  const fullHex =
    hexValue.length === 3
      ? hexValue
          .split("")
          .map((char) => char + char)
          .join("")
      : hexValue;

  if (fullHex.length !== 6) {
    console.warn(
      `[DividerTokens/hexToRgba] Invalid hex color format: "${hex}". Falling back to black with alpha.`
    );
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn(
      `[DividerTokens/hexToRgba] Could not parse hex color: "${hex}". Falling back to black with alpha.`
    );
    return `rgba(0, 0, 0, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Genera los tokens para el componente Divider
 */
export function generateDividerTokens(
  appColorTokens: AppColorTokens
): DividerTokens {
  // Ya no se necesita themeKey ni buscar en colors.themes directamente,
  // appColorTokens ya tiene los colores del tema y modo correctos.

  // Colores para el gradiente
  const primaryColor = appColorTokens.primary.pure;
  const secondaryColor = appColorTokens.secondary.pure;
  const accentColor = appColorTokens.accent.pure; // appColorTokens.accent ya está resuelto para el modo

  // Color para la variante sólida
  const solidColor = appColorTokens.primary.pure;

  // Color para la variante sutil (calculado como RGBA del primario del tema/modo activo)
  const subtleBaseColor = appColorTokens.primary.pure;
  const subtleColor = hexToRgba(subtleBaseColor, 0.3);

  return {
    variants: {
      gradient: {
        backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
      },
      solid: {
        background: solidColor,
      },
      subtle: {
        background: subtleColor,
      },
    },
    sizes: {
      xs: {
        height: "2px",
        width: "60px",
        borderRadius: "1px",
      },
      sm: {
        height: "2px",
        width: "100px",
        borderRadius: "1px",
      },
      md: {
        height: "3px",
        width: "150px",
        borderRadius: "1.5px",
      },
      lg: {
        height: "4px",
        width: "200px",
        borderRadius: "2px",
      },
      xl: {
        height: "5px",
        width: "250px",
        borderRadius: "2.5px",
      },
    },
  };
}
