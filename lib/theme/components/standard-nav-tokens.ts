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
      titleGradient: titleGradient,
    },
    gradientBar: {
      start: primaryColor,
      middle: accentColor,
      end: isDark ? neutral.bgShade : whiteColor,
    },
    hover: {
      // Aumentar la opacidad para mejor contraste en modo oscuro
      bg: isDark ? `${accentColor}33` : `${accentColor}15`,
    },
    active: {
      // Color de fondo más visible en modo oscuro
      bg: isDark ? `${primaryColor}44` : `${primaryColor}15`,
    },
    background: {
      normal: isDark ? neutral.bg : "transparent",
      // Fondo más oscuro cuando se hace scroll
      scrolled: isDark ? neutral.bgShade : `${whiteColor}DD`,
    },
    submenu: {
      // Fondo más oscuro para el submenú
      background: isDark ? neutral.bgShade : neutral.bg,
      border: isDark ? neutral.bgShade : borderColor,
    },
    icon: {
      // Iconos más claros en modo oscuro
      default: isDark ? neutral.textShade : tertiaryColor,
      // Color de icono activo más visible
      active: isDark ? whiteColor : secondaryColor,
      arrow: isDark ? neutral.textShade : tertiaryColor,
    },
    // Sombra más pronunciada en modo oscuro
    shadow: isDark ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  }
}

// Default export for backward compatibility
export const standardNavTokens = generateStandardNavbarTokens(
  createAppColorTokens("blue", "light"), // Default color scheme
  "light" // Default mode
);

export { generateStandardNavbarTokens };
