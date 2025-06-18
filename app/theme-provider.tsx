"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";


import {
  createAppColorTokens,
  updateAppColorTokens,
  ColorScheme, // Asegúrate que ColorScheme se importa como tipo si es necesario o se actualiza donde se define
  Mode,
  type AppColorTokens,
} from "@/lib/theme/ColorToken";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  colorScheme: ColorScheme;
  mode: Mode;
  setColorScheme: (colorScheme: ColorScheme) => void;
  setMode: (mode: Mode) => void;
  appColorTokens: AppColorTokens;
  theme: string;
  setTheme: (theme: string) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeInternal] = useState<ColorScheme>(() => {
    // Lógica inicial para determinar el colorScheme, puede ser 'blue' o cargado de localStorage
    if (typeof window !== 'undefined') {
      const storedScheme = localStorage.getItem("colorScheme") as ColorScheme;
      // Ensure 'zenith' is recognized if stored from a previous session or by other means
      if (storedScheme && ["blue", "green", "orange", "artisticGreen", "graphite", "roseGold", "midnight", "burgundy", "zenith"].includes(storedScheme)) {
        return storedScheme;
      }
    }
    return "zenith"; // Valor por defecto para nuevos usuarios
  });
  const [mode, setModeInternal] = useState<Mode>("light");
  const [mounted, setMounted] = useState(false);

  const [appTokensState, setAppTokensState] = useState<AppColorTokens>(() => {
    // Default to 'zenith' for initial tokens as well
    const initialAppTokens = createAppColorTokens("zenith", "light");
    updateAppColorTokens(initialAppTokens);
    return initialAppTokens;
  });



  const theme =
    mode === "dark"
      ? colorScheme === "burgundy" ? "theme-burgundyDark" : "dark" // Manejo específico para burgundyDark
      : colorScheme === "blue"
      ? "light"
      : `theme-${colorScheme}`;

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  const updateAllTokens = (newColorScheme: ColorScheme, newMode: Mode) => {
    const newAppTokens = createAppColorTokens(newColorScheme, newMode);
    setAppTokensState(newAppTokens);
    updateAppColorTokens(newAppTokens);


  };

  const handleSetColorScheme = (newColorScheme: ColorScheme) => {
    setColorSchemeInternal(newColorScheme);
    updateAllTokens(newColorScheme, mode);

    // Emitir evento para que AuthProvider guarde en la base de datos
    document.dispatchEvent(
      new CustomEvent("theme-preference-change", {
        detail: {
          theme: newColorScheme,
          isDarkMode: mode === "dark",
        },
      })
    );
  };

  const handleSetMode = (newMode: Mode) => {
    setModeInternal(newMode);
    updateAllTokens(colorScheme, newMode);

    // Emitir evento para que AuthProvider guarde en la base de datos
    document.dispatchEvent(
      new CustomEvent("theme-preference-change", {
        detail: {
          theme: colorScheme,
          isDarkMode: newMode === "dark",
        },
      })
    );
  };

  const setTheme = (newTheme: string) => {
    let newMode: Mode = mode;
    let newColorScheme: ColorScheme = colorScheme;

    if (newTheme === "dark") {
      newMode = "dark";
    } else if (newTheme === "light") {
      newMode = "light";
      newColorScheme = "blue";
    } else if (newTheme === "theme-green") {
      newMode = "light";
      newColorScheme = "green";
    } else if (newTheme === "theme-orange") {
      newMode = "light";
      newColorScheme = "orange";
    } else if (newTheme === "theme-artisticGreen") {
      newMode = "light";
      newColorScheme = "artisticGreen";
    } else if (newTheme === "theme-graphite") {
      newMode = "light";
      newColorScheme = "graphite";
    } else if (newTheme === "theme-roseGold") {
      newMode = "light";
      newColorScheme = "roseGold";
    } else if (newTheme === "theme-midnight") { // Midnight es inherentemente oscuro
      newMode = "dark";
      newColorScheme = "midnight";
    } else if (newTheme === "theme-burgundy") {
      newMode = "light";
      newColorScheme = "burgundy";
    } else if (newTheme === "theme-burgundyDark") {
      newMode = "dark";
      newColorScheme = "burgundy"; // El colorScheme base es burgundy, el modo lo hace dark
    }
    setModeInternal(newMode);
    setColorSchemeInternal(newColorScheme);
    updateAllTokens(newColorScheme, newMode);

    // Emitir evento para que AuthProvider guarde en la base de datos
    document.dispatchEvent(
      new CustomEvent("theme-preference-change", {
        detail: {
          theme: newColorScheme,
          isDarkMode: newMode === "dark",
        },
      })
    );
  };

  // Escuchar eventos de cambio de tema desde el AuthProvider
  useEffect(() => {
    if (!mounted) return;

    const handleThemeChange = (e: CustomEvent) => {
      const { theme, isDarkMode } = e.detail;
      console.log(`📣 Evento theme-change recibido:`, e.detail);

      // Normalizar el tema (eliminar espacios en blanco)
      const themeNormalized = typeof theme === "string" ? theme.trim() : theme;

      console.log(`🔄 Tema normalizado: "${themeNormalized}"`);

      // Mapear el tema recibido a los valores internos del ThemeProvider
      let newColorScheme: ColorScheme = "blue";
      if (themeNormalized === "green") newColorScheme = "green";
      if (themeNormalized === "orange") newColorScheme = "orange";
      if (themeNormalized === "artisticGreen") newColorScheme = "artisticGreen";
      if (themeNormalized === "graphite") newColorScheme = "graphite";
      if (themeNormalized === "roseGold") newColorScheme = "roseGold";
      if (themeNormalized === "midnight") newColorScheme = "midnight";
      if (themeNormalized === "burgundy") newColorScheme = "burgundy";

      // Establecer el modo según el valor de isDarkMode
      const newMode: Mode = isDarkMode ? "dark" : "light";

      console.log(`✅ Aplicando tema: ${newColorScheme}, modo: ${newMode}`);

      // Actualizar estado y tokens
      setColorSchemeInternal(newColorScheme);
      setModeInternal(newMode);
      updateAllTokens(newColorScheme, newMode);
    };

    // Añadir el event listener con tipado correcto
    document.addEventListener(
      "theme-change",
      handleThemeChange as EventListener
    );

    // Limpiar el event listener
    return () => {
      document.removeEventListener(
        "theme-change",
        handleThemeChange as EventListener
      );
    };
  }, [mounted]);

  useEffect(() => {
    updateAllTokens(colorScheme, mode);
  }, [colorScheme, mode]);

  useEffect(() => {
    if (!mounted) return;

    let initialColorScheme = "zenith" as ColorScheme; // Default for new users
    let initialMode = "light" as Mode;

    try {
      const storedColorScheme = localStorage.getItem(
        "colorScheme"
      ) as ColorScheme;
      const storedMode = localStorage.getItem("mode") as Mode;

      if (
        storedColorScheme &&
        ["blue", "green", "orange", "artisticGreen", "graphite", "roseGold", "midnight", "burgundy", "zenith"].includes(storedColorScheme)
      ) {
        initialColorScheme = storedColorScheme;
      }

      if (storedMode && ["light", "dark"].includes(storedMode)) {
        initialMode = storedMode;
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initialMode = "dark";
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }

    setColorSchemeInternal(initialColorScheme);
    setModeInternal(initialMode);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    try {
      const root = window.document.documentElement;
      root.classList.remove(
        "dark",
        "theme-blue",
        "theme-green",
        "theme-orange",
        "theme-artisticGreen",
        "theme-graphite",
        "theme-roseGold",
        "theme-midnight",
        "theme-burgundy",
        "theme-burgundyDark",
        "theme-zenith",
        "theme-zenithDark"
      );

      if (mode === "dark") {
        root.classList.add("dark");
      }

      // Aplicar clase de tema específico si no es el azul por defecto en modo claro
      // o si es un tema que tiene su propia variante oscura (como midnight o burgundyDark)
      if (mode === "dark") {
        if (colorScheme === "midnight") {
          root.classList.add("theme-midnight");
        } else if (colorScheme === "burgundy") {
          root.classList.add("theme-burgundyDark");
        } else if (colorScheme === "zenith") {
          root.classList.add("theme-zenithDark");
        } else {
          // Para otros esquemas en modo oscuro, solo se aplica la clase 'dark'
          // y se confía en las variables CSS definidas para el modo oscuro de esos temas.
        }
      } else { // Modo Claro
        if (colorScheme !== "blue") {
          root.classList.add(`theme-${colorScheme}`);
        }
      }

      localStorage.setItem("colorScheme", colorScheme);
      localStorage.setItem("mode", mode);

      console.log(
        `🎉 Tema aplicado completamente: ${colorScheme}, modo: ${mode}`
      );
    } catch (error) {
      console.error("Error updating documentElement or localStorage:", error);
    }
  }, [colorScheme, mode, mounted]);

  const value = {
    colorScheme,
    mode,
    setColorScheme: handleSetColorScheme,
    setMode: handleSetMode,
    appColorTokens: appTokensState,
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
