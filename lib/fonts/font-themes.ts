// Define the font theme types
export type FontTheme = 
  | "sustrato"
  | "default"
  | "classic"
  | "modern"
  | "accessible"
  | "technical"
  | "minimalist"
  | "creative";

// Font configuration type
interface FontConfig {
  heading: string;
  body: string;
  headingWeight: number | string;
  bodyWeight: number | string;
  letterSpacingHeadings: string;
  letterSpacingBody: string;
  lineHeight: number | string;
}

// Font configurations for each theme
export const fontThemes: Record<FontTheme, FontConfig> = {
  sustrato: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    letterSpacingHeadings: '-0.025em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.5,
  },
  default: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    letterSpacingHeadings: '-0.025em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.5,
  },
  classic: {
    heading: '"Merriweather", Georgia, serif',
    body: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    letterSpacingHeadings: '0em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.6,
  },
  modern: {
    heading: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '"Hind", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    letterSpacingHeadings: '-0.03em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.5,
  },
  accessible: {
    heading: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    letterSpacingHeadings: '0em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.6,
  },
  technical: {
    heading: '"Roboto Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    body: '"Roboto Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    headingWeight: 600,
    bodyWeight: 400,
    letterSpacingHeadings: '0em',
    letterSpacingBody: '0em',
    lineHeight: 1.6,
  },
  minimalist: {
    heading: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 600,
    bodyWeight: 400,
    letterSpacingHeadings: '-0.02em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.5,
  },
  creative: {
    heading: '"Playfair Display", Georgia, serif',
    body: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    letterSpacingHeadings: '0em',
    letterSpacingBody: '0.01em',
    lineHeight: 1.6,
  },
};

// Get font configuration for a specific theme
export function getFontConfig(theme: FontTheme): FontConfig {
  return fontThemes[theme] || fontThemes.default;
}

// Get all available font themes
export function getAvailableFontThemes(): FontTheme[] {
  return Object.keys(fontThemes) as FontTheme[];
}

// Get the default font theme
export function getDefaultFontTheme(): FontTheme {
  return 'sustrato';
}
