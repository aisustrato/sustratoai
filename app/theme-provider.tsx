// 📍 app/theme-provider.tsx
// 🎯 PROPÓSITO: Orquestador central del sistema de temas de la aplicación
// 🔧 DECISIÓN: Expone appColorTokens via Context para que los componentes sean agnósticos
// ⚠️ ADVERTENCIA: Cambios aquí afectan TODA la UI. Validar cambio de temas tras modificaciones.

"use client";

//#region [imports] - 📦 IMPORTS
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
	createAppColorTokens,
	updateAppColorTokens,
	ColorScheme,
	Mode,
	type AppColorTokens,
} from "@/lib/theme/ColorToken";
//#endregion

//#region [types] - 🎨 TIPOS E INTERFACES
type ThemeProviderProps = {
	children: React.ReactNode;
};

// 💎 CORE: Contrato del contexto de tema
type ThemeContextType = {
	colorScheme: ColorScheme;
	mode: Mode;
	setColorScheme: (colorScheme: ColorScheme) => void;
	setMode: (mode: Mode) => void;
	appColorTokens: AppColorTokens;
	theme: string;
	setTheme: (theme: string) => void;
};
//#endregion

//#region [context] - 📦 CONTEXT
export const ThemeContext = createContext<ThemeContextType | undefined>(
	undefined,
);
//#endregion

//#region [provider] - 🚀 PROVIDER COMPONENT
// 🚀 ENTRY POINT: Componente que provee el contexto de tema a toda la app
export function ThemeProvider({ children }: ThemeProviderProps) {
	//#region [state] - Estado interno del provider
	const [colorScheme, setColorSchemeInternal] = useState<ColorScheme>(() => {
		// 🔧 DECISIÓN: Intentar recuperar de localStorage, fallback a 'zenith'
		if (typeof window !== "undefined") {
			const storedScheme = localStorage.getItem("colorScheme") as ColorScheme;
			if (
				storedScheme &&
				[
					"blue",
					"green",
					"orange",
					"artisticGreen",
					"graphite",
					"roseGold",
					"midnight",
					"burgundy",
					"zenith",
				].includes(storedScheme)
			) {
				return storedScheme;
			}
		}
		return "zenith";
	});
	const [mode, setModeInternal] = useState<Mode>("light");
	const [mounted, setMounted] = useState(false);

	const [appTokensState, setAppTokensState] = useState<AppColorTokens>(() => {
		const initialAppTokens = createAppColorTokens("zenith", "light");
		updateAppColorTokens(initialAppTokens);
		return initialAppTokens;
	});
	//#endregion

	//#region [computed] - Valores derivados
	// 🔧 DECISIÓN: Calcular el nombre del tema CSS basado en colorScheme + mode
	const theme =
		mode === "dark" ?
			colorScheme === "burgundy" ?
				"theme-burgundyDark"
			:	"dark"
		: colorScheme === "blue" ? "light"
		: `theme-${colorScheme}`;
	//#endregion

	//#region [handlers] - 🔄 FUNCIONES DE ACTUALIZACIÓN
	// 🔄 HELPER: Evitar problemas de hidratación SSR
	useEffect(() => {
		setMounted(true);
	}, []);

	// 💎 CORE: Actualiza todos los tokens cuando cambia tema/modo
	// 🔧 DECISIÓN: Esta es LA función que regenera tokens - se llama pocas veces
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
			}),
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
			}),
		);
	};

	// 💎 CORE: Mapeo declarativo de temas → {colorScheme, mode}
	// 🔧 DECISIÓN: Extensible sin tocar lógica - solo agregar entrada al mapa
	const THEME_MAP: Record<string, { colorScheme: ColorScheme; mode: Mode }> = {
		dark: { colorScheme: colorScheme, mode: "dark" }, // Mantiene colorScheme actual
		light: { colorScheme: "blue", mode: "light" },
		"theme-green": { colorScheme: "green", mode: "light" },
		"theme-orange": { colorScheme: "orange", mode: "light" },
		"theme-artisticGreen": { colorScheme: "artisticGreen", mode: "light" },
		"theme-graphite": { colorScheme: "graphite", mode: "light" },
		"theme-roseGold": { colorScheme: "roseGold", mode: "light" },
		"theme-midnight": { colorScheme: "midnight", mode: "dark" },
		"theme-burgundy": { colorScheme: "burgundy", mode: "light" },
		"theme-burgundyDark": { colorScheme: "burgundy", mode: "dark" },
		"theme-zenith": { colorScheme: "zenith", mode: "light" },
		"theme-coral": { colorScheme: "coral", mode: "light" },
		"theme-ocean": { colorScheme: "ocean", mode: "light" },
	};

	const setTheme = (newTheme: string) => {
		const mapping = THEME_MAP[newTheme];

		// 🔄 HELPER: Si no hay mapeo, aplicar modo dark/light manteniendo colorScheme
		const newMode: Mode =
			mapping?.mode ?? (newTheme === "dark" ? "dark" : mode);
		const newColorScheme: ColorScheme = mapping?.colorScheme ?? colorScheme;

		setModeInternal(newMode);
		setColorSchemeInternal(newColorScheme);
		updateAllTokens(newColorScheme, newMode);

		// 🔄 EVENTO: Notificar a AuthProvider para persistir en BD
		document.dispatchEvent(
			new CustomEvent("theme-preference-change", {
				detail: {
					theme: newColorScheme,
					isDarkMode: newMode === "dark",
				},
			}),
		);
	};
	//#endregion

	//#region [effects] - 🔄 EFECTOS DE SINCRONIZACIÓN
	// 🔄 EFFECT: Escuchar eventos de cambio de tema desde AuthProvider
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
			handleThemeChange as EventListener,
		);

		// Limpiar el event listener
		return () => {
			document.removeEventListener(
				"theme-change",
				handleThemeChange as EventListener,
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
				"colorScheme",
			) as ColorScheme;
			const storedMode = localStorage.getItem("mode") as Mode;

			if (
				storedColorScheme &&
				[
					"blue",
					"green",
					"orange",
					"artisticGreen",
					"graphite",
					"roseGold",
					"midnight",
					"burgundy",
					"zenith",
				].includes(storedColorScheme)
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
				"theme-zenithDark",
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
			} else {
				// Modo Claro
				if (colorScheme !== "blue") {
					root.classList.add(`theme-${colorScheme}`);
				}
			}

			localStorage.setItem("colorScheme", colorScheme);
			localStorage.setItem("mode", mode);

			console.log(
				`🎉 Tema aplicado completamente: ${colorScheme}, modo: ${mode}`,
			);
		} catch (error) {
			console.error("Error updating documentElement or localStorage:", error);
		}
	}, [colorScheme, mode, mounted]);
	//#endregion

	//#region [render] - 🎨 RENDER
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
	//#endregion
}
//#endregion

//#region [hook] - 🪝 CUSTOM HOOK
// 🚀 ENTRY POINT: Hook para consumir el contexto de tema
export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		// ⚠️ Error visible (política anti-callbacks silenciosos)
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
//#endregion
