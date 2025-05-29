import {
  Playfair_Display,
  Montserrat,
  Inter,
  Open_Sans,
  Roboto_Mono,
  Quicksand,
  JetBrains_Mono,
  Ubuntu,
  Space_Grotesk,
  Work_Sans,
  Marhey,
} from "next/font/google";

// Declarar las fuentes como constantes individuales
const playfairFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserratFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

const openSansFont = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const robotoMonoFont = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const quicksandFont = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

const jetbrainsMonoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: true,
  fallback: ["Consolas", "Monaco", "Courier New", "monospace"],
  adjustFontFallback: true,
});

const ubuntuFont = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
});

const spaceGroteskFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

const workSansFont = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});

const marheyFont = Marhey({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-marhey",
  display: "swap",
  preload: true,
  fallback: ["cursive", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

// Crear el objeto fonts usando las constantes
export const fonts = {
  playfair: playfairFont,
  montserrat: montserratFont,
  inter: interFont,
  openSans: openSansFont,
  robotoMono: robotoMonoFont,
  quicksand: quicksandFont,
  jetbrainsMono: jetbrainsMonoFont,
  ubuntu: ubuntuFont,
  spaceGrotesk: spaceGroteskFont,
  workSans: workSansFont,
  marhey: marheyFont,
};

// Exportar individualmente para compatibilidad con código existente
export const {
  playfair,
  montserrat,
  inter,
  openSans,
  robotoMono,
  quicksand,
  jetbrainsMono,
  ubuntu,
  spaceGrotesk,
  workSans,
  marhey,
} = fonts;

// Función para obtener todas las variables de fuente
export function getAllFontVariables() {
  return Object.values(fonts)
    .map((font) => font.variable)
    .join(" ");
}

// Tipos de temas de fuentes
export type FontTheme =
  | "sustrato"
  | "default"
  | "classic"
  | "modern"
  | "accessible"
  | "technical"
  | "minimalist"
  | "creative";

// Configuración de pares de fuentes por tema
export const fontThemeConfig = {
  default: {
    heading: `var(--font-playfair)`,
    body: `var(--font-inter)`,
    headingWeight: "600",
    bodyWeight: "400",
    letterSpacingHeadings: "normal",
    letterSpacingBody: "normal",
    lineHeight: "1.5",
  },
  sustrato: {
    heading: `var(--font-ubuntu)`,
    body: `var(--font-work-sans)`,
    headingWeight: "700",
    bodyWeight: "400",
    letterSpacingHeadings: "-0.01em",
    letterSpacingBody: "normal",
    lineHeight: "1.4",
  },
  classic: {
    heading: `var(--font-playfair)`,
    body: `var(--font-open-sans)`,
    headingWeight: "600",
    bodyWeight: "400",
    letterSpacingHeadings: "normal",
    letterSpacingBody: "normal",
    lineHeight: "1.5",
  },
  modern: {
    heading: `var(--font-montserrat)`,
    body: `var(--font-inter)`,
    headingWeight: "600",
    bodyWeight: "400",
    letterSpacingHeadings: "-0.02em",
    letterSpacingBody: "normal",
    lineHeight: "1.4",
  },
  accessible: {
    heading: `var(--font-open-sans)`,
    body: `var(--font-open-sans)`,
    headingWeight: "700",
    bodyWeight: "400",
    letterSpacingHeadings: "0.5px",
    letterSpacingBody: "0.5px",
    lineHeight: "1.6",
  },
  technical: {
    heading: `var(--font-jetbrains-mono)`,
    body: `var(--font-roboto-mono)`,
    headingWeight: "600",
    bodyWeight: "400",
    letterSpacingHeadings: "normal",
    letterSpacingBody: "-0.01em",
    lineHeight: "1.5",
  },
  minimalist: {
    heading: `var(--font-space-grotesk)`,
    body: `var(--font-inter)`,
    headingWeight: "600",
    bodyWeight: "300",
    letterSpacingHeadings: "-0.03em",
    letterSpacingBody: "-0.03em",
    lineHeight: "1.3",
  },
  creative: {
    heading: `var(--font-marhey)`,
    body: `var(--font-quicksand)`,
    headingWeight: "700",
    bodyWeight: "400",
    letterSpacingHeadings: "0.01em",
    letterSpacingBody: "normal",
    lineHeight: "1.5",
  },
};

// Función para obtener la configuración de fuentes para un tema específico
export function getFontConfig(theme: FontTheme) {
  return fontThemeConfig[theme];
}
