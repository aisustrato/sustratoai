import type { AppColorTokens, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

export interface UserAvatarTokens {
  avatar: {
    backgroundColor: string;
    backgroundGradient: string;
    borderColor: string;
    textColor: string;
    fontWeight: string;
    transition: string;
    hover: {
      backgroundColor: string;
      borderColor: string;
      transform: string;
    };
  };
  menu: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    boxShadow: string;
    padding: string;
  };
  menuItem: {
    padding: string;
    borderRadius: string;
    hoverBackgroundColor: string;
    textColor: string;
    iconColor: string;
  };
  menuHeader: {
    borderColor: string;
    padding: string;
    titleColor: string;
    subtitleColor: string;
  };
  menuDivider: {
    color: string;
    margin: string;
  };
}

export function generateUserAvatarTokens(
  appColorTokens: AppColorTokens,
  mode: Mode
): UserAvatarTokens {
  const {
    primary,
    tertiary,
    neutral,
    white
  } = appColorTokens;

  // Determinar colores apropiados basados en el modo
  const isDark = mode === "dark";
  const surfaceColor = isDark ? neutral.bg : white.bg;
  const borderColor = isDark ? `${tertiary.text}40` : `${tertiary.text}30`;
  
  // Crear gradiente para el fondo del avatar
  const gradientStart = primary.pure;
  const gradientEnd = primary.pureShade;
  const backgroundGradient = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
  
  // Crear colores semi-transparentes para efectos
  const primaryA10 = tinycolor(primary.pure).setAlpha(0.1).toRgbString();
  const primaryA20 = tinycolor(primary.pure).setAlpha(0.2).toRgbString();

  return {
    avatar: {
      backgroundColor: primary.pure,
      backgroundGradient: backgroundGradient,
      borderColor: borderColor,
      textColor: primary.contrastText,
      fontWeight: "700", // Más peso para la letra como solicitado
      transition: "all 0.2s ease-in-out",
      hover: {
        backgroundColor: primary.pureShade,
        borderColor: tertiary.text,
        transform: "scale(1.05)",
      },
    },
    menu: {
      backgroundColor: surfaceColor,
      borderColor: isDark ? neutral.pure : neutral.bgShade,
      borderRadius: "0.75rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      padding: "0.75rem",
    },
    menuItem: {
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      hoverBackgroundColor: isDark 
        ? tinycolor(neutral.bg).lighten(5).toString() 
        : tinycolor(white.bg).darken(5).toString(),
      textColor: neutral.text,
      iconColor: primary.pure,
    },
    menuHeader: {
      borderColor: isDark ? `${neutral.pure}50` : `${neutral.bgShade}50`,
      padding: "0.5rem",
      titleColor: primary.text,
      subtitleColor: neutral.textShade,
    },
    menuDivider: {
      color: isDark ? neutral.pure : neutral.bgShade,
      margin: "0.5rem 0",
    },
  };
}

// Helper function to get token value
export function getUserAvatarTokenValue(
  tokens: UserAvatarTokens,
  path: string
): any {
  const parts = path.split('.');
  let current: any = tokens;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined; // Token not found
    }
  }
  
  return current;
}