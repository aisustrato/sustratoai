import tinycolor from "tinycolor2"
import type { AppColorTokens, Mode } from "../ColorToken"

// Definimos los tipos para las variantes y tamaños
export type SliderVariant = "solid" | "outline" | "subtle"
export type SliderSize = "xs" | "sm" | "md" | "lg" | "xl"
export type SliderColor = "default" | "primary" | "secondary" | "tertiary" | "accent" | "success" | "warning" | "danger"
export type SliderOrientation = "horizontal" | "vertical"

// Estructura completa de tokens para el slider
export type SliderTokens = {
  base: {
    height: Record<SliderSize, string>
    thumbSize: Record<SliderSize, string>
    trackHeight: Record<SliderSize, string>
    borderRadius: string
    transition: string
    gap: Record<SliderSize, string>
  }
  variants: {
    [key in SliderVariant]: {
      default: {
        track: {
          background: string
          border: string
        }
        range: {
          background: string
          border: string
        }
        thumb: {
          background: string
          border: string
          boxShadow: string
        }
      }
      hover: {
        track: {
          background: string
        }
        range: {
          background: string
        }
        thumb: {
          background: string
          border: string
          boxShadow: string
          transform: string
        }
      }
      active: {
        track: {
          background: string
        }
        range: {
          background: string
        }
        thumb: {
          background: string
          border: string
          boxShadow: string
          transform: string
        }
      }
      focus: {
        thumb: {
          outline: string
          ring: string
        }
      }
      disabled: {
        track: {
          background: string
          opacity: string
        }
        range: {
          background: string
          opacity: string
        }
        thumb: {
          background: string
          border: string
          opacity: string
          cursor: string
        }
      }
    }
  }
  colors: {
    [key in SliderColor]: {
      track: {
        background: string
        border: string
      }
      range: {
        background: string
        border: string
        gradient: string
      }
      thumb: {
        background: string
        border: string
        hoverBackground: string
        hoverBorder: string
        activeBackground: string
        activeBorder: string
      }
    }
  }
}

// Función para generar los tokens del slider
export function generateSliderTokens(appColorTokens: AppColorTokens, mode: Mode): SliderTokens {
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
      ? `linear-gradient(to right, ${color}, ${lighterColor})`
      : `linear-gradient(to right, ${lighterColor}, ${color})`
  }

  // Colores base de appColorTokens
  const primaryColor = appColorTokens.primary.pure
  const secondaryColor = appColorTokens.secondary.pure
  const tertiaryColor = appColorTokens.tertiary.pure
  const accentColor = appColorTokens.accent.pure
  const successColor = appColorTokens.success.pure
  const warningColor = appColorTokens.warning.pure
  const dangerColor = appColorTokens.danger.pure
  const neutralColor = appColorTokens.neutral.pure
  const neutralBgColor = appColorTokens.neutral.bg

  // Tokens base
  const baseTokens = {
    height: {
      xs: "16px",
      sm: "20px",
      md: "24px",
      lg: "28px",
      xl: "32px",
    },
    thumbSize: {
      xs: "12px",
      sm: "16px",
      md: "20px",
      lg: "24px",
      xl: "28px",
    },
    trackHeight: {
      xs: "4px",
      sm: "6px",
      md: "8px",
      lg: "10px",
      xl: "12px",
    },
    borderRadius: "9999px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    gap: {
      xs: "8px",
      sm: "12px",
      md: "16px",
      lg: "20px",
      xl: "24px",
    },
  }

  // Variantes
  const variantTokens = {
    solid: {
      default: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          border: "none",
        },
        range: {
          background: "currentBackground",
          border: "none",
        },
        thumb: {
          background: "currentThumbBackground",
          border: "currentThumbBorder",
          boxShadow: isDark ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        },
      },
      hover: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
        },
        range: {
          background: "currentBackground",
        },
        thumb: {
          background: "currentThumbHoverBackground",
          border: "currentThumbHoverBorder",
          boxShadow: isDark
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          transform: "scale(1.1)",
        },
      },
      active: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
        },
        range: {
          background: "currentBackground",
        },
        thumb: {
          background: "currentThumbActiveBackground",
          border: "currentThumbActiveBorder",
          boxShadow: isDark ? "0 1px 2px 0 rgba(0, 0, 0, 0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          transform: "scale(1.15)",
        },
      },
      focus: {
        thumb: {
          outline: "none",
          ring: isDark
            ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.5).toString()}`
            : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`,
        },
      },
      disabled: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          opacity: "0.6",
        },
        range: {
          background: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          opacity: "0.6",
        },
        thumb: {
          background: isDark ? "#555" : "#ccc",
          border: "none",
          opacity: "0.6",
          cursor: "not-allowed",
        },
      },
    },
    outline: {
      default: {
        track: {
          background: "transparent",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}`,
        },
        range: {
          background: "currentBackground",
          border: "none",
        },
        thumb: {
          background: "currentThumbBackground",
          border: "currentThumbBorder",
          boxShadow: isDark ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        },
      },
      hover: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        range: {
          background: "currentBackground",
        },
        thumb: {
          background: "currentThumbHoverBackground",
          border: "currentThumbHoverBorder",
          boxShadow: isDark
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          transform: "scale(1.1)",
        },
      },
      active: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        range: {
          background: "currentBackground",
        },
        thumb: {
          background: "currentThumbActiveBackground",
          border: "currentThumbActiveBorder",
          boxShadow: isDark ? "0 1px 2px 0 rgba(0, 0, 0, 0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          transform: "scale(1.15)",
        },
      },
      focus: {
        thumb: {
          outline: "none",
          ring: isDark
            ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.5).toString()}`
            : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`,
        },
      },
      disabled: {
        track: {
          background: "transparent",
          opacity: "0.6",
        },
        range: {
          background: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          opacity: "0.6",
        },
        thumb: {
          background: isDark ? "#555" : "#ccc",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}`,
          opacity: "0.6",
          cursor: "not-allowed",
        },
      },
    },
    subtle: {
      default: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          border: "none",
        },
        range: {
          background: "currentBackground",
          border: "none",
        },
        thumb: {
          background: "currentThumbBackground",
          border: "currentThumbBorder",
          boxShadow: "none",
        },
      },
      hover: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        range: {
          background: "currentBackground",
        },
        thumb: {
          background: "currentThumbHoverBackground",
          border: "currentThumbHoverBorder",
          boxShadow: isDark ? "0 2px 4px rgba(0, 0, 0, 0.2)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
          transform: "scale(1.1)",
        },
      },
      active: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
        },
        range: {
          background: "currentBackground",
        },
        thumb: {
          background: "currentThumbActiveBackground",
          border: "currentThumbActiveBorder",
          boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.2)" : "0 1px 2px rgba(0, 0, 0, 0.1)",
          transform: "scale(1.15)",
        },
      },
      focus: {
        thumb: {
          outline: "none",
          ring: isDark
            ? `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.4).toString()}`
            : `0 0 0 2px ${tinycolor(appColorTokens.primary.pure).setAlpha(0.3).toString()}`,
        },
      },
      disabled: {
        track: {
          background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
          opacity: "0.6",
        },
        range: {
          background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          opacity: "0.6",
        },
        thumb: {
          background: isDark ? "#444" : "#ddd",
          border: "none",
          opacity: "0.6",
          cursor: "not-allowed",
        },
      },
    },
  }

  // Colores
  const colorTokens = {
    default: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: neutralColor,
        border: "none",
        gradient: createGradient(neutralColor),
      },
      thumb: {
        background: neutralColor,
        border: `1px solid ${neutralColor}`,
        hoverBackground: adjustColor(neutralColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(neutralColor, 10, 10)}`,
        activeBackground: adjustColor(neutralColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(neutralColor, 15, 15)}`,
      },
    },
    primary: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: primaryColor,
        border: "none",
        gradient: createGradient(primaryColor),
      },
      thumb: {
        background: primaryColor,
        border: `1px solid ${primaryColor}`,
        hoverBackground: adjustColor(primaryColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(primaryColor, 10, 10)}`,
        activeBackground: adjustColor(primaryColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(primaryColor, 15, 15)}`,
      },
    },
    secondary: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: secondaryColor,
        border: "none",
        gradient: createGradient(secondaryColor),
      },
      thumb: {
        background: secondaryColor,
        border: `1px solid ${secondaryColor}`,
        hoverBackground: adjustColor(secondaryColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(secondaryColor, 10, 10)}`,
        activeBackground: adjustColor(secondaryColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(secondaryColor, 15, 15)}`,
      },
    },
    tertiary: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: tertiaryColor,
        border: "none",
        gradient: createGradient(tertiaryColor),
      },
      thumb: {
        background: tertiaryColor,
        border: `1px solid ${tertiaryColor}`,
        hoverBackground: adjustColor(tertiaryColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(tertiaryColor, 10, 10)}`,
        activeBackground: adjustColor(tertiaryColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(tertiaryColor, 15, 15)}`,
      },
    },
    accent: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: accentColor,
        border: "none",
        gradient: createGradient(accentColor),
      },
      thumb: {
        background: accentColor,
        border: `1px solid ${accentColor}`,
        hoverBackground: adjustColor(accentColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(accentColor, 10, 10)}`,
        activeBackground: adjustColor(accentColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(accentColor, 15, 15)}`,
      },
    },
    success: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: successColor,
        border: "none",
        gradient: createGradient(successColor),
      },
      thumb: {
        background: successColor,
        border: `1px solid ${successColor}`,
        hoverBackground: adjustColor(successColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(successColor, 10, 10)}`,
        activeBackground: adjustColor(successColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(successColor, 15, 15)}`,
      },
    },
    warning: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: warningColor,
        border: "none",
        gradient: createGradient(warningColor),
      },
      thumb: {
        background: warningColor,
        border: `1px solid ${warningColor}`,
        hoverBackground: adjustColor(warningColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(warningColor, 10, 10)}`,
        activeBackground: adjustColor(warningColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(warningColor, 15, 15)}`,
      },
    },
    danger: {
      track: {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: "none",
      },
      range: {
        background: dangerColor,
        border: "none",
        gradient: createGradient(dangerColor),
      },
      thumb: {
        background: dangerColor,
        border: `1px solid ${dangerColor}`,
        hoverBackground: adjustColor(dangerColor, 10, 10),
        hoverBorder: `1px solid ${adjustColor(dangerColor, 10, 10)}`,
        activeBackground: adjustColor(dangerColor, 15, 15),
        activeBorder: `1px solid ${adjustColor(dangerColor, 15, 15)}`,
      },
    },
  }

  return {
    base: baseTokens,
    variants: variantTokens,
    colors: colorTokens,
  }
}
