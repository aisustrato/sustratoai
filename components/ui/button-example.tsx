/**
 * Ejemplo de componente Button usando el nuevo sistema de diseño
 * Este es un ejemplo de cómo migrar componentes al nuevo sistema
 */

"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/theme/colors"
import { useTheme } from "@/app/theme-provider"
import type { Mode } from "@/lib/theme/color-tokens"

// Definimos los estilos base y variantes usando JS en lugar de CSS
const getButtonStyles = (theme: string, mode: Mode) => {
  const isDark = mode === "dark";
  // Obtenemos los colores correctos basados en el tema actual
  const themeKey = (theme === "default" ? "blue" : theme) as keyof typeof colors.themes
  const themeVariant = colors.themes[themeKey]

  // Ajustamos los colores según el modo (claro/oscuro)
  const primary = isDark ? themeVariant.primary.pureShade : themeVariant.primary.pure
  const primaryHover = isDark ? themeVariant.primary.bgShade : themeVariant.primary.pureShade
  const primaryActive = isDark ? themeVariant.primary.bgDark : themeVariant.primary.pureDark

  // Definimos los estilos para cada variante
  return {
    base: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      height: "2.5rem",
      paddingLeft: "1rem",
      paddingRight: "1rem",
      transition: "all 150ms",
    },
    variants: {
      variant: {
        default: {
          backgroundColor: primary,
          color: isDark ? colors.semantic.neutralDark.pure : colors.semantic.neutral.pure,
          "&:hover": {
            backgroundColor: primaryHover,
          },
          "&:active": {
            backgroundColor: primaryActive,
          },
        },
        outline: {
          backgroundColor: "transparent",
          color: primary,
          border: `1px solid ${primary}`,
          "&:hover": {
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          },
        },
        ghost: {
          backgroundColor: "transparent",
          color: primary,
          "&:hover": {
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          },
        },
      },
      size: {
        default: {
          height: "2.5rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        },
        sm: {
          height: "2rem",
          paddingLeft: "0.75rem",
          paddingRight: "0.75rem",
          fontSize: "0.75rem",
        },
        lg: {
          height: "3rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          fontSize: "1rem",
        },
      },
    },
  }
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    // Usamos el hook de tema para obtener el tema actual
    const { theme, mode } = useTheme()

    // Obtenemos los estilos basados en el tema actual
    const buttonStyles = getButtonStyles(theme, mode)

    // Combinamos los estilos base con las variantes seleccionadas
    const styles = {
      ...buttonStyles.base,
      ...(buttonStyles.variants?.variant?.[variant] || {}),
      ...(buttonStyles.variants?.size?.[size] || {}),
    }

    return <button className={cn(className)} ref={ref} style={styles} {...props} />
  },
)

Button.displayName = "Button"

export { Button }
