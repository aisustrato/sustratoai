import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }], // 10px
      },
      fontFamily: {
        // La clase 'font-body' usará la variable --font-family-base
        body: ['var(--font-family-base)'],
        // La clase 'font-heading' usará la variable --font-family-headings
        heading: ['var(--font-family-headings)'],
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // ✅ El único cambio está aquí, en el arreglo de plugins
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/line-clamp"), // <-- Se añade el plugin que faltaba
  ],
} satisfies Config;

export default config;