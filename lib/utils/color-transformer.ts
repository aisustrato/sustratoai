/**
 * Utilidad para transformar colores y mejorar el contraste en modo oscuro
 */

// Función para convertir un color hex a componentes RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Eliminar el # si existe
  hex = hex.replace(/^#/, "")

  // Convertir formato abreviado (por ejemplo, #03F) a formato completo (por ejemplo, #0033FF)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

// Función para convertir componentes RGB a color hex
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

// Función para aumentar el brillo de un color
export function increaseBrightness(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color

  const { r, g, b } = rgb

  // Aumentar cada componente según el porcentaje
  const factor = 1 + percent / 100
  const newR = r * factor
  const newG = g * factor
  const newB = b * factor

  return rgbToHex(newR, newG, newB)
}

// Función para calcular la luminancia de un color (para determinar el contraste)
export function getLuminance(color: string): number {
  const rgb = hexToRgb(color)
  if (!rgb) return 0

  // Convertir a espacio de color sRGB
  const { r, g, b } = rgb
  const sRGB = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  // Calcular luminancia según fórmula WCAG
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
}

// Función para calcular el contraste entre dos colores
export function getContrast(color1: string, color2: string): number {
  const luminance1 = getLuminance(color1)
  const luminance2 = getLuminance(color2)

  const brightest = Math.max(luminance1, luminance2)
  const darkest = Math.min(luminance1, luminance2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// Función para ajustar un color hasta alcanzar un contraste mínimo con el fondo
export function adjustColorForContrast(color: string, backgroundColor: string, minContrast = 4.5): string {
  let adjustedColor = color
  let currentContrast = getContrast(adjustedColor, backgroundColor)
  const brightnessIncrement = 5
  let attempts = 0
  const maxAttempts = 20 // Evitar bucles infinitos

  while (currentContrast < minContrast && attempts < maxAttempts) {
    adjustedColor = increaseBrightness(adjustedColor, brightnessIncrement)
    currentContrast = getContrast(adjustedColor, backgroundColor)
    attempts++
  }

  return adjustedColor
}

// Función principal para adaptar colores en modo oscuro
export function adaptColorForDarkMode(color: string, darkBackgroundColor = "#1F2937"): string {
  // Primero verificamos si el color ya tiene buen contraste
  const currentContrast = getContrast(color, darkBackgroundColor)

  // Si el contraste ya es bueno (4.5:1 es el mínimo recomendado por WCAG AA)
  if (currentContrast >= 4.5) {
    return color
  }

  // Si no, ajustamos el color para mejorar el contraste
  return adjustColorForContrast(color, darkBackgroundColor)
}

// Función para adaptar un gradiente para modo oscuro
export function adaptGradientForDarkMode(
  startColor: string,
  middleColor: string,
  endColor: string,
  darkBackgroundColor = "#1F2937",
): { start: string; middle: string; end: string } {
  // Adaptamos cada color del gradiente
  const adaptedStart = adaptColorForDarkMode(startColor, darkBackgroundColor)
  const adaptedMiddle = adaptColorForDarkMode(middleColor, darkBackgroundColor)
  const adaptedEnd = adaptColorForDarkMode(endColor, darkBackgroundColor)

  return {
    start: adaptedStart,
    middle: adaptedMiddle,
    end: adaptedEnd,
  }
}
