"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import {
  getAllFontVariables,
  type FontTheme,
  fontThemeConfig,
} from "@/lib/fonts";

// Contexto para el tema de fuentes
type FontThemeContextType = {
  fontTheme: FontTheme;
  setFontTheme: (theme: FontTheme) => void;
};

const FontThemeContext = createContext<FontThemeContextType | undefined>(
  undefined
);

// Proveedor del tema de fuentes
export function FontThemeProvider({ children }: { children: ReactNode }) {
  const [fontTheme, setFontThemeInternal] = useState<FontTheme>("sustrato");
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para cambiar el tema de fuente y emitir evento
  const setFontTheme = (theme: FontTheme) => {
    setFontThemeInternal(theme);

    // Si ya está montado, emitir evento para persistir la preferencia
    if (mounted) {
      console.log(
        `🔤 Emitiendo evento font-preference-change con tema: ${theme}`
      );
      document.dispatchEvent(
        new CustomEvent("font-preference-change", {
          detail: { fontPair: theme },
        })
      );
    }
  };

  // Escuchar eventos de cambio de fuente desde el AuthProvider
  useEffect(() => {
    if (!mounted) return;

    const handleFontChange = (e: CustomEvent) => {
      const { fontPair } = e.detail;
      console.log(`📣 Evento font-change recibido, cambiando a: ${fontPair}`);

      // Limpiar espacios en blanco y normalizar el valor
      const fontPairNormalized =
        typeof fontPair === "string" ? fontPair.trim() : fontPair;

      console.log(`🔄 Valor normalizado: "${fontPairNormalized}"`);

      // Verificar explícitamente todos los valores posibles de FontTheme
      if (
        fontPairNormalized &&
        typeof fontPairNormalized === "string" &&
        [
          "sustrato",
          "default",
          "classic",
          "modern",
          "accessible",
          "technical",
          "minimalist",
          "creative",
        ].includes(fontPairNormalized)
      ) {
        console.log(
          `✅ Aplicando tema de fuente válido: ${fontPairNormalized}`
        );
        setFontThemeInternal(fontPairNormalized as FontTheme);
      } else {
        console.warn(`⚠️ Valor de fontPair no válido: "${fontPairNormalized}"`);
      }
    };

    // Añadir el event listener con tipado correcto
    document.addEventListener("font-change", handleFontChange as EventListener);

    // Limpiar el event listener
    return () => {
      document.removeEventListener(
        "font-change",
        handleFontChange as EventListener
      );
    };
  }, [mounted]);

  // Aplicar variables CSS dinámicamente
  useEffect(() => {
    if (mounted) {
      // Asegúrate de que fontTheme existe en fontThemeConfig
      if (!(fontTheme in fontThemeConfig)) {
        console.error(
          `❌ Tema de fuente no encontrado en configuración: ${fontTheme}`
        );
        return;
      }

      const config = fontThemeConfig[fontTheme];
      console.log(`🔤 Aplicando configuración para tema: ${fontTheme}`, config);

      // Aplicar variables CSS a nivel de documento
      document.documentElement.style.setProperty(
        "--font-family-headings",
        config.heading
      );
      document.documentElement.style.setProperty(
        "--font-family-base",
        config.body
      );
      document.documentElement.style.setProperty(
        "--font-weight-headings",
        config.headingWeight
      );
      document.documentElement.style.setProperty(
        "--font-weight-base",
        config.bodyWeight
      );
      document.documentElement.style.setProperty(
        "--letter-spacing-headings",
        config.letterSpacingHeadings
      );
      document.documentElement.style.setProperty(
        "--letter-spacing-body",
        config.letterSpacingBody
      );
      document.documentElement.style.setProperty(
        "--line-height",
        config.lineHeight
      );

      // Forzar la actualización de las fuentes en elementos específicos
      document.body.style.fontFamily = config.body;
      document.body.style.fontWeight = config.bodyWeight;
      document.body.style.letterSpacing = config.letterSpacingBody;
      document.body.style.lineHeight = config.lineHeight;

      // Aplicar a todos los encabezados
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      headings.forEach((heading) => {
        (heading as HTMLElement).style.fontFamily = config.heading;
        (heading as HTMLElement).style.fontWeight = config.headingWeight;
        (heading as HTMLElement).style.letterSpacing =
          config.letterSpacingHeadings;
      });

      // Forzar actualización de componentes específicos que podrían no actualizarse automáticamente
      const navbarElements = document.querySelectorAll(
        ".navbar-brand, .navbar-item"
      );
      navbarElements.forEach((element) => {
        (element as HTMLElement).style.fontFamily = config.heading;
        (element as HTMLElement).style.fontWeight = config.headingWeight;
      });

      console.log(`🎉 Tema de fuente aplicado completamente: ${fontTheme}`);
    }
  }, [fontTheme, mounted]);

  // Obtener todas las variables de fuente
  const fontVariables = getAllFontVariables();

  return (
    <FontThemeContext.Provider value={{ fontTheme, setFontTheme }}>
      <div className={fontVariables}>{children}</div>
    </FontThemeContext.Provider>
  );
}

// Hook para usar el tema de fuentes
export function useFontTheme() {
  const context = useContext(FontThemeContext);
  if (context === undefined) {
    throw new Error("useFontTheme must be used within a FontThemeProvider");
  }
  return context;
}
