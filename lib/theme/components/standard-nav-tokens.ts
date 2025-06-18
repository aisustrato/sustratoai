import type { AppColorTokens, Mode } from "../ColorToken";
import { createAppColorTokens } from "../ColorToken";
import tinycolor from "tinycolor2";


export interface StandardNavbarTokens {
  logo: {
    primary: string
    secondary: string
    accent: string
    titleGradient: string // Nuevo token para el degradado del título
  }
  gradientBar: {
    start: string
    middle: string
    end: string
  }
  hover: {
    bg: string
  }
  active: {
    bg: string
  }
  background: {
    normal: string
    scrolled: string
  }
  submenu: {
    background: string
    border: string
  }
  icon: {
    default: string
    active: string
    arrow: string
  }
  shadow: string
}



const generateStandardNavbarTokens = (appColorTokens: AppColorTokens, mode: Mode): StandardNavbarTokens => {
  const isDark = mode === "dark";
  
  // Get colors from appColorTokens
  const { primary, secondary, tertiary, accent, neutral, white } = appColorTokens;

  // Colores básicos
  const whiteColor = white.pure;
  // Use the appropriate neutral colors from ColorShade
  const borderColor = isDark ? neutral.textShade : neutral.text;

  // Colores primarios con ajuste de contraste para modo oscuro
  const primaryColor = primary.pure;
  const accentColor = accent.pure;
  const secondaryColor = secondary.pure;
  const tertiaryColor = tertiary.pure;

  // Crear el degradado específico para el título del logo
  const titleGradient = `linear-gradient(to right, ${primaryColor}, ${accentColor})`

  // Crear un fondo oscuro con un sutil tinte del color primario del tema
  const themedDarkBackground = isDark 
      ? tinycolor(primary.pure).lighten(5).toString()
      : tinycolor(primary.pure).darken(5).toString()

  return {
    logo: {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
      titleGradient: titleGradient, // Nuevo token para el degradado del título
    },
    gradientBar: {
      start: primaryColor,
      middle: accentColor,
      // En modo oscuro, usamos un color más suave para el final del gradiente
      end: isDark ? neutral.bgShade : whiteColor,
    },
    hover: {
      // Más visible en modo oscuro, usando color accent para el hover
      bg: isDark ? `${accentColor}22` : `${accentColor}15`,
    },
    active: {
      // Más visible en modo oscuro
      bg: isDark ? `${primaryColor}33` : `${primaryColor}15`,
    },
    background: {
      normal: "transparent",
      // Usar un fondo oscuro con tinte del color del tema
      scrolled: isDark ? themedDarkBackground : `${whiteColor}DD`,
    },
    submenu: {
      background: isDark ? neutral.bgShade : neutral.bg,
      border: borderColor,
    },
    icon: {
      default: tertiaryColor,
      // Cambiar a secondaryColor en lugar de accentColor
      active: secondaryColor,
      arrow: tertiaryColor,
    },
    // Sombra más sutil en modo oscuro
    shadow: isDark ? "0 4px 8px rgba(0, 0, 0, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  }
}

// Default export for backward compatibility
export const standardNavTokens = generateStandardNavbarTokens(
  createAppColorTokens("blue", "light"), // Default color scheme
  "light" // Default mode
);

export { generateStandardNavbarTokens };
