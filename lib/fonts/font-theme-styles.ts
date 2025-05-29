// Crear un nuevo archivo para generar estilos CSS dinámicos

import { type FontTheme, getFontConfig } from "./font-themes"

// Genera un bloque de CSS para un tema específico
export function generateThemeCSS(theme: FontTheme): string {
  const config = getFontConfig(theme)

  return `
    :root[data-font-theme="${theme}"] {
      --font-family-headings: ${config.heading};
      --font-family-base: ${config.body};
      --font-weight-headings: ${config.headingWeight};
      --font-weight-base: ${config.bodyWeight};
      --letter-spacing-headings: ${config.letterSpacingHeadings};
      --letter-spacing-body: ${config.letterSpacingBody};
      --line-height: ${config.lineHeight};
    }
  `
}

// Genera CSS para todos los temas disponibles
export function generateAllThemesCSS(): string {
  const themes: FontTheme[] = [
    "sustrato",
    "default",
    "classic",
    "modern",
    "accessible",
    "technical",
    "minimalist",
    "creative",
  ]

  const baseCSS = `
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-family-headings);
      font-weight: var(--font-weight-headings);
      letter-spacing: var(--letter-spacing-headings);
    }
    
    body, p, div, span, a, button, input, textarea, select {
      font-family: var(--font-family-base);
      font-weight: var(--font-weight-base);
      letter-spacing: var(--letter-spacing-body);
      line-height: var(--line-height);
    }
  `

  return themes.map(generateThemeCSS).join("\n") + baseCSS
}
