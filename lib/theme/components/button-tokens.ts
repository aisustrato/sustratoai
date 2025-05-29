import tinycolor from "tinycolor2"

import colors from "../colors"
import type { AppColorTokens, Mode } from "../ColorToken"

// Definimos los tipos para las variantes y tamaños
export type ButtonVariant = "solid" | "outline" | "ghost" | "link" | "subtle"
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "icon"
export type ButtonColor = "default" | "primary" | "secondary" | "tertiary" | "accent" | "success" | "warning" | "danger"
export type ButtonRounded = "none" | "sm" | "md" | "lg" | "full"

// Estructura completa de tokens para el botón
export type ButtonTokens = {
  base: {
    padding: Record<ButtonSize, string>
    borderRadius: Record<ButtonRounded, string>
    fontSize: Record<ButtonSize, string>
    height: Record<ButtonSize, string>
    iconSize: Record<ButtonSize, string>
    transition: string
    fontWeight: string
    gap: Record<ButtonSize, string>
  }
  variants: {
    [key in ButtonVariant]: {
      default: {
        background: string
        color: string
        border: string
        boxShadow: string
      }
      hover: {
        background: string
        color: string
        border: string
        boxShadow: string
        transform: string
      }
      active: {
        background: string
        color: string
        border: string
        boxShadow: string
        transform: string
      }
      focus: {
        outline: string
        ring: string
      }
      disabled: {
        background: string
        color: string
        border: string
        opacity: string
        cursor: string
      }
    }
  }
  colors: {
    [key in ButtonColor]: {
      background: string
      color: string
      border: string
      gradient: string
      hoverBackground: string
      hoverColor: string
      hoverBorder: string
      activeBackground: string
      activeColor: string
      activeBorder: string
      // Nuevos tokens para ghost y outline
      ghostColor: string
      ghostBorder: string
      outlineColor: string
      outlineBorder: string
      // Nuevo token para el efecto ripple
      rippleColor: string
      bgShade: string
      textShade: string
    }
  }
  loading: {
    spinnerColor: string
    spinnerSize: Record<ButtonSize, string>
    opacity: string
  }
}

// Función para generar los tokens del botón
export function generateButtonTokens(appColorTokens: AppColorTokens, mode: Mode): ButtonTokens {
  const isDark = mode === "dark"

  // Función para ajustar colores basados en el modo
  const adjustColor = (color: string, darken: number, lighten: number) => {
    if (isDark) {
      return tinycolor(color).lighten(lighten).toString()
    }
    return tinycolor(color).darken(darken).toString()
  }

  // Función para crear un gradiente
  const createGradient = (color: string) => {
    const baseColor = tinycolor(color)
    const lighterColor = baseColor.clone().lighten(10).toString()
    const darkerColor = baseColor.clone().darken(10).toString()

    return isDark
      ? `linear-gradient(to bottom right, ${color}, ${lighterColor})`
      : `linear-gradient(to bottom right, ${lighterColor}, ${color})`
  }

  // Modificar la función hexToRgb para asegurar que siempre devuelva un valor
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)}`
      : "0, 0, 0" // Valor por defecto en caso de error
  }

  // Colores base de appColorTokens
  const primaryColor = appColorTokens.primary.pure
  const secondaryColor = appColorTokens.secondary.pure
  const tertiaryColor = appColorTokens.tertiary.pure
  const accentColor = appColorTokens.accent.pure
  const successColor = appColorTokens.success.pure
  const warningColor = appColorTokens.warning.pure
  const dangerColor = appColorTokens.danger.pure

  // El color 'default' del botón sigue usando la paleta neutral.gray directamente por consistencia visual.
  const defaultColor = isDark ? colors.neutral.gray[600] : colors.neutral.gray[200]

  // Colores de texto
  // El texto del botón 'default' sigue usando la paleta neutral.gray directamente.
  const defaultTextColor = isDark ? colors.neutral.gray[200] : colors.neutral.gray[800]

  // Textos por contraste para cada variante
  const primaryTextColor = appColorTokens.primary.contrastText
  const secondaryTextColor = appColorTokens.secondary.contrastText
  const tertiaryTextColor = appColorTokens.tertiary.contrastText
  const accentTextColor = appColorTokens.accent.contrastText
  const successTextColor = appColorTokens.success.contrastText
  const warningTextColor = appColorTokens.warning.contrastText
  const dangerTextColor = appColorTokens.danger.contrastText

  // Colores para el efecto ripple
  const primaryRippleColor = appColorTokens.primary.bg
  const secondaryRippleColor = appColorTokens.secondary.bg
  const tertiaryRippleColor = appColorTokens.tertiary.bg
  const accentRippleColor = appColorTokens.accent.bg
  const successRippleColor = appColorTokens.success.bg
  const warningRippleColor = appColorTokens.warning.bg
  const dangerRippleColor = appColorTokens.danger.bg
  // El ripple del botón 'default' sigue usando la paleta neutral.gray directamente.
  const defaultRippleColor = colors.neutral.gray[300]

  // Tokens base
  const baseTokens = {
    padding: {
      xs: "0.25rem 0.5rem",
      sm: "0.375rem 0.75rem",
      md: "0.5rem 1rem",
      lg: "0.75rem 1.25rem",
      xl: "1rem 1.5rem",
      icon: "0", // Sin padding para icon-only
    },
    borderRadius: {
      none: "0",
      sm: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      full: "9999px",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      icon: "1.25rem", // Tamaño de icono base
    },
    height: {
      xs: "1.5rem",
      sm: "2rem",
      md: "2.5rem",
      lg: "3rem",
      xl: "3.5rem",
      icon: "2.5rem", // Altura estándar para botón de icono
    },
    iconSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.25rem",
      xl: "1.5rem",
      icon: "1.25rem", // Tamaño de icono base
    },
    gap: {
      xs: "0.25rem",
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      icon: "0.25rem",
    },
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    fontWeight: "500",
  }

  // Variantes
  const variantTokens = {
    solid: {
      default: {
        background: "currentBackground",
        color: "currentColor",
        border: "none",
        boxShadow: isDark ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      },
      hover: {
        background: "currentHoverBackground",
        color: "currentHoverColor",
        border: "none",
        boxShadow: isDark
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transform: "translateY(-1px)",
      },
      active: {
        background: "currentActiveBackground",
        color: "currentActiveColor",
        border: "none",
        boxShadow: isDark ? "0 1px 2px 0 rgba(0, 0, 0, 0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        transform: "translateY(1px)",
      },
      focus: {
        outline: "none",
        ring: isDark
          ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.5).toString()}`
          : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`,
      },
      disabled: {
        background: isDark ? colors.neutral.gray[700] : colors.neutral.gray[200],
        color: isDark ? colors.neutral.gray[500] : colors.neutral.gray[400],
        border: "none",
        opacity: "0.6",
        cursor: "not-allowed",
      },
    },
    outline: {
      default: {
        background: "transparent",
        color: "currentOutlineColor",
        border: "1px solid currentOutlineBorder",
        boxShadow: "none",
      },
      hover: {
        background: "currentBgShade",
        color: "currentTextShade",
        border: "1px solid currentHoverBorder",
        boxShadow: isDark ? "0 2px 4px -1px rgba(0, 0, 0, 0.3)" : "0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transform: "translateY(-1px)",
      },
      active: {
        background: "rgba(currentRgb, 0.4)", // Aumentado significativamente de 0.25 a 0.4
        color: "currentActiveColor",
        border: "1px solid currentActiveBorder",
        boxShadow: "none",
        transform: "translateY(1px)",
      },
      focus: {
        outline: "none",
        ring: isDark
          ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.5).toString()}`
          : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`,
      },
      disabled: {
        background: "transparent",
        color: isDark ? colors.neutral.gray[500] : colors.neutral.gray[400],
        border: `1px solid ${isDark ? colors.neutral.gray[600] : colors.neutral.gray[300]}`,
        opacity: "0.6",
        cursor: "not-allowed",
      },
    },
    ghost: {
      default: {
        background: "transparent",
        color: "currentGhostColor",
        border: "none",
        boxShadow: "none",
      },
      hover: {
        background: "currentBgShade",
        color: "currentTextShade",
        border: "none",
        boxShadow: "none",
        transform: "translateY(-1px)",
      },
      active: {
        background: "rgba(currentRgb, 0.4)", // Aumentado significativamente de 0.25 a 0.4
        color: "currentActiveColor",
        border: "none",
        boxShadow: "none",
        transform: "translateY(1px)",
      },
      focus: {
        outline: "none",
        ring: isDark
          ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`
          : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.3).toString()}`,
      },
      disabled: {
        background: "transparent",
        color: isDark ? colors.neutral.gray[500] : colors.neutral.gray[400],
        border: "none",
        opacity: "0.6",
        cursor: "not-allowed",
      },
    },
    link: {
      default: {
        background: "transparent",
        color: "currentColor",
        border: "none",
        boxShadow: "none",
      },
      hover: {
        background: "currentBgShade",
        color: "currentTextShade",
        border: "none",
        boxShadow: "none",
        transform: "none",
      },
      active: {
        background: "transparent",
        color: "currentActiveColor",
        border: "none",
        boxShadow: "none",
        transform: "none",
      },
      focus: {
        outline: "none",
        ring: "none",
      },
      disabled: {
        background: "transparent",
        color: isDark ? colors.neutral.gray[500] : colors.neutral.gray[400],
        border: "none",
        opacity: "0.6",
        cursor: "not-allowed",
      },
    },
    subtle: {
      default: {
        background: "rgba(currentRgb, 0.25)", // Aumentado de 0.2 a 0.25
        color: "currentColor",
        border: "none",
        boxShadow: "none",
      },
      hover: {
        background: "currentBackground", // Cambiar de rgba a currentBackground (que es el color pure)
        color: "currentColor", // Mantener el color original para contraste
        border: "none",
        boxShadow: isDark ? "0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 2px 4px -1px rgba(0, 0, 0, 0.05)",
        transform: "translateY(-1px)",
      },
      active: {
        background: "currentActiveBackground", // Usar el activeBackground para consistencia
        color: "currentActiveColor",
        border: "none",
        boxShadow: "none",
        transform: "translateY(1px)",
      },
      focus: {
        outline: "none",
        ring: isDark
          ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`
          : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.3).toString()}`,
      },
      disabled: {
        background: isDark ? colors.neutral.gray[800] : colors.neutral.gray[100],
        color: isDark ? colors.neutral.gray[500] : colors.neutral.gray[400],
        border: "none",
        opacity: "0.6",
        cursor: "not-allowed",
      },
    },
  }

  // En la sección de colorTokens, modificar el objeto default para aumentar la opacidad en hover
  const colorTokens = {
    default: {
      background: defaultColor,
      color: defaultTextColor,
      // Usar un borde más oscuro para mayor contraste
      border: isDark ? colors.neutral.gray[400] : colors.neutral.gray[400],
      gradient: createGradient(defaultColor),
      // Usar colores más contrastantes para hover
      hoverBackground: isDark ? colors.neutral.gray[500] : colors.neutral.gray[300],
      hoverColor: defaultTextColor,
      hoverBorder: isDark ? colors.neutral.gray[300] : colors.neutral.gray[500],
      // Usar colores más contrastantes para active
      activeBackground: isDark ? colors.neutral.gray[400] : colors.neutral.gray[400],
      activeColor: defaultTextColor,
      activeBorder: isDark ? colors.neutral.gray[200] : colors.neutral.gray[600],
      // Para ghost, outline, link y subtle usamos el color neutral puro para mejor contraste
      ghostColor: isDark ? colors.neutral.white : colors.neutral.gray[900],
      ghostBorder: isDark ? colors.neutral.gray[300] : colors.neutral.gray[500],
      outlineColor: isDark ? colors.neutral.white : colors.neutral.gray[900],
      outlineBorder: isDark ? colors.neutral.gray[300] : colors.neutral.gray[500],
      rippleColor: defaultRippleColor,
      bgShade: appColorTokens.neutral.bgShade,
      textShade: appColorTokens.neutral.textShade,
    },
    primary: {
      background: primaryColor,
      color: primaryTextColor,
      border: primaryColor,
      gradient: createGradient(primaryColor),
      hoverBackground: adjustColor(primaryColor, 10, 10),
      hoverColor: primaryTextColor,
      hoverBorder: adjustColor(primaryColor, 10, 10),
      activeBackground: adjustColor(primaryColor, 15, 15),
      activeColor: primaryTextColor,
      activeBorder: adjustColor(primaryColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: primaryColor,
      ghostBorder: primaryColor,
      outlineColor: primaryColor,
      outlineBorder: primaryColor,
      rippleColor: primaryRippleColor,
      bgShade: appColorTokens.primary.bgShade,
      textShade: appColorTokens.primary.textShade,
    },
    secondary: {
      background: secondaryColor,
      color: secondaryTextColor,
      border: secondaryColor,
      gradient: createGradient(secondaryColor),
      hoverBackground: adjustColor(secondaryColor, 10, 10),
      hoverColor: secondaryTextColor,
      hoverBorder: adjustColor(secondaryColor, 10, 10),
      activeBackground: adjustColor(secondaryColor, 15, 15),
      activeColor: secondaryTextColor,
      activeBorder: adjustColor(secondaryColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: secondaryColor,
      ghostBorder: secondaryColor,
      outlineColor: secondaryColor,
      outlineBorder: secondaryColor,
      rippleColor: secondaryRippleColor,
      bgShade: appColorTokens.secondary.bgShade,
      textShade: appColorTokens.secondary.textShade,
    },
    tertiary: {
      background: tertiaryColor,
      color: tertiaryTextColor,
      border: tertiaryColor,
      gradient: createGradient(tertiaryColor),
      hoverBackground: adjustColor(tertiaryColor, 10, 10),
      hoverColor: tertiaryTextColor,
      hoverBorder: adjustColor(tertiaryColor, 10, 10),
      activeBackground: adjustColor(tertiaryColor, 15, 15),
      activeColor: tertiaryTextColor,
      activeBorder: adjustColor(tertiaryColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: tertiaryColor,
      ghostBorder: tertiaryColor,
      outlineColor: tertiaryColor,
      outlineBorder: tertiaryColor,
      rippleColor: tertiaryRippleColor,
      bgShade: appColorTokens.tertiary.bgShade,
      textShade: appColorTokens.tertiary.textShade,
    },
    accent: {
      background: accentColor,
      color: accentTextColor,
      border: accentColor,
      gradient: createGradient(accentColor),
      hoverBackground: adjustColor(accentColor, 10, 10),
      hoverColor: accentTextColor,
      hoverBorder: adjustColor(accentColor, 10, 10),
      activeBackground: adjustColor(accentColor, 15, 15),
      activeColor: accentTextColor,
      activeBorder: adjustColor(accentColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: accentColor,
      ghostBorder: accentColor,
      outlineColor: accentColor,
      outlineBorder: accentColor,
      rippleColor: accentRippleColor,
      bgShade: appColorTokens.accent.bgShade,
      textShade: appColorTokens.accent.textShade,
    },
    success: {
      background: successColor,
      color: successTextColor,
      border: successColor,
      gradient: createGradient(successColor),
      hoverBackground: adjustColor(successColor, 10, 10),
      hoverColor: successTextColor,
      hoverBorder: adjustColor(successColor, 10, 10),
      activeBackground: adjustColor(successColor, 15, 15),
      activeColor: successTextColor,
      activeBorder: adjustColor(successColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: successColor,
      ghostBorder: successColor,
      outlineColor: successColor,
      outlineBorder: successColor,
      rippleColor: successRippleColor,
      bgShade: appColorTokens.success.bgShade,
      textShade: appColorTokens.success.textShade,
    },
    warning: {
      background: warningColor,
      color: warningTextColor,
      border: warningColor,
      gradient: createGradient(warningColor),
      hoverBackground: adjustColor(warningColor, 10, 10),
      hoverColor: warningTextColor,
      hoverBorder: adjustColor(warningColor, 10, 10),
      activeBackground: adjustColor(warningColor, 15, 15),
      activeColor: warningTextColor,
      activeBorder: adjustColor(warningColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: warningColor,
      ghostBorder: warningColor,
      outlineColor: warningColor,
      outlineBorder: warningColor,
      rippleColor: warningRippleColor,
      bgShade: appColorTokens.warning.bgShade,
      textShade: appColorTokens.warning.textShade,
    },
    danger: {
      background: dangerColor,
      color: dangerTextColor,
      border: dangerColor,
      gradient: createGradient(dangerColor),
      hoverBackground: adjustColor(dangerColor, 10, 10),
      hoverColor: dangerTextColor,
      hoverBorder: adjustColor(dangerColor, 10, 10),
      activeBackground: adjustColor(dangerColor, 15, 15),
      activeColor: dangerTextColor,
      activeBorder: adjustColor(dangerColor, 15, 15),
      // Para ghost, outline, link y subtle usamos el color puro para mejor contraste
      ghostColor: dangerColor,
      ghostBorder: dangerColor,
      outlineColor: dangerColor,
      outlineBorder: dangerColor,
      rippleColor: dangerRippleColor,
      bgShade: appColorTokens.danger.bgShade,
      textShade: appColorTokens.danger.textShade,
    },
  }

  // Loading
  const loadingTokens = {
    spinnerColor: "currentColor",
    spinnerSize: {
      xs: "0.75rem",
      sm: "1rem",
      md: "1.25rem",
      lg: "1.5rem",
      xl: "1.75rem",
      icon: "1.25rem",
    },
    opacity: "0.7",
  }

  return {
    base: baseTokens,
    variants: variantTokens,
    colors: colorTokens,
    loading: loadingTokens,
  }
}
