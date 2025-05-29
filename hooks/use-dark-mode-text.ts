"use client"

import { useTheme } from "@/app/theme-provider"

type TextColorVariant = "pure" | "text" | "dark"
type TextColorType =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "default"

interface DarkModeTextOptions {
  color?: TextColorType
  colorVariant?: TextColorVariant
  gradient?: boolean | TextColorType
  forceLightVariant?: boolean
  adaptToDarkMode?: boolean
}

/**
 * Hook para adaptar automáticamente los colores de texto en modo oscuro
 * para mejorar la legibilidad
 */
export function useDarkModeText(options: DarkModeTextOptions = {}) {
  const { mode } = useTheme()
  const isDark = mode === "dark"

  // Si no estamos en modo oscuro, devolvemos las opciones originales
  if (!isDark && !options.forceLightVariant) {
    return options
  }

  // Copia de las opciones para no modificar el objeto original
  const adaptedOptions = { ...options }

  // En modo oscuro, preferimos la variante "pure" para mejor contraste
  if (
    !adaptedOptions.colorVariant ||
    adaptedOptions.colorVariant === "text" ||
    adaptedOptions.colorVariant === "dark"
  ) {
    adaptedOptions.colorVariant = "pure"
  }

  // Asegurarnos de que adaptToDarkMode esté activado
  adaptedOptions.adaptToDarkMode = true

  return adaptedOptions
}
