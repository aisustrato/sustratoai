"use client"

import type React from "react"

import type { ReactNode } from "react"
import { useTheme } from "@/app/theme-provider"
import colors from "@/lib/theme/colors"

interface ThemeTextProps {
  children: ReactNode
  variant?: "title" | "subtitle" | "body" | "caption"
  className?: string
}

/**
 * ThemeText - Componente que aplica estilos de texto según el tema actual
 * Utiliza el sistema de colores basado en JS/TS en lugar de CSS
 */
export function ThemeText({ children, variant = "body", className = "" }: ThemeTextProps) {
  const { colorScheme, mode } = useTheme()

  // Obtener el tema actual
  const currentTheme = colorScheme || "blue"
  const themeColors = colors.themes[currentTheme as keyof typeof colors.themes]
  const isDark = mode === "dark"

  // Definir estilos según la variante y el tema
  let style: React.CSSProperties = {}

  switch (variant) {
    case "title":
      style = {
        fontSize: "2rem",
        fontWeight: 700,
        color: isDark ? themeColors.primary.pure : themeColors.primary.text,
        fontFamily: "var(--font-playfair)",
      }
      break
    case "subtitle":
      style = {
        fontSize: "1.5rem",
        fontWeight: 600,
        color: isDark ? themeColors.secondary.pure : themeColors.secondary.text,
        fontFamily: "var(--font-jakarta)",
      }
      break
    case "caption":
      style = {
        fontSize: "0.875rem",
        color: isDark ? colors.neutral.gray[400] : colors.neutral.gray[600],
        fontFamily: "var(--font-inter)",
      }
      break
    default: // body
      style = {
        fontSize: "1rem",
        color: isDark ? colors.neutral.gray[300] : colors.neutral.gray[700],
        fontFamily: "var(--font-jakarta)",
      }
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}
