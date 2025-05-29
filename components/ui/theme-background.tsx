"use client"

import type React from "react"
import { type ReactNode, useEffect, useState } from "react"
import { useTheme } from "@/app/theme-provider"
import colors from "@/lib/theme/colors"

interface ThemeBackgroundProps {
  children?: ReactNode
}

/**
 * ThemeBackground - Componente que aplica el fondo según el tema actual
 * Utiliza el sistema de colores basado en JS/TS en lugar de CSS
 */
export function ThemeBackground({ children }: ThemeBackgroundProps) {
  const { colorScheme, mode } = useTheme()
  const [style, setStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    try {
      // Validar que colorScheme sea un valor válido
      const validColorSchemes = ["blue", "green", "orange"] as const
      const validColorScheme = validColorSchemes.includes(colorScheme as any) ? colorScheme : "blue"

      // Acceder al tema de forma segura
      const themeColors = colors.themes[validColorScheme as keyof typeof colors.themes]

      // Verificar que themeColors existe
      if (!themeColors || !themeColors.primary) {
        console.error(`Theme colors not found for scheme: ${validColorScheme}`)
        // Usar un color de fallback
        setStyle({
          backgroundColor: mode === "dark" ? "#0a0d14" : "#f9fafb",
          color: mode === "dark" ? "#f9fafb" : "#0a0d14",
        })
        return
      }

      // Definir el color de fondo basado en el tema y modo
      if (mode === "dark") {
        // En modo oscuro, usar un color oscuro específico del tema
        setStyle({
          backgroundColor: themeColors.primary.textDark || "#0a0d14",
          color: colors.neutral.gray[100],
        })
      } else {
        // En modo claro, usar un color muy suave del tema
        setStyle({
          backgroundColor: `${themeColors.primary.bg}15` || "#f9fafb",
          color: colors.neutral.gray[900],
        })
      }
    } catch (error) {
      console.error("Error setting theme background:", error)
      // Fallback en caso de error
      setStyle({
        backgroundColor: mode === "dark" ? "#0a0d14" : "#f9fafb",
        color: mode === "dark" ? "#f9fafb" : "#0a0d14",
      })
    }
  }, [colorScheme, mode])

  return (
    <div
      style={{
        ...style,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        transition: "background-color 0.3s ease",
      }}
    >
      {children}
    </div>
  )
}
