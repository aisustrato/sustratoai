import {
  Playfair_Display,
  Inter,
  Open_Sans,
  Roboto_Mono,
  Quicksand,
  Montserrat,
  JetBrains_Mono,
  Marhey,
  Space_Grotesk,
  Outfit,
  Chau_Philomene_One,
  Work_Sans,
} from "next/font/google"

// Definir las fuentes
export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
})

export const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
})

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
})

export const marhey = Marhey({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-marhey",
})

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

// Nuevas fuentes para el tema Sustrato
export const chauPhilomeneOne = Chau_Philomene_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-chau-philomene-one",
})

export const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
})

// Función para obtener todas las variables de fuente
export function getAllFontVariables() {
  return `${playfair.variable} ${inter.variable} ${openSans.variable} ${robotoMono.variable} ${jetbrainsMono.variable} ${quicksand.variable} ${montserrat.variable} ${marhey.variable} ${spaceGrotesk.variable} ${outfit.variable} ${chauPhilomeneOne.variable} ${workSans.variable}`
}
