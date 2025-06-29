// components/ui/dark-mode-switcher.tsx
// Versión: 2.0 (Refactorizado con Hook de lógica para separar intereses)
"use client";

import { useTheme } from "@/app/theme-provider";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/auth-provider";
import { actualizarPreferenciasUI } from "@/app/actions/proyecto-actions";
import { toast } from "sonner";
import { StandardIcon } from "@/components/ui/StandardIcon";

// --- 🧠 Hook de Lógica ---
// Encapsula toda la complejidad del manejo del estado y la persistencia.
function useDarkMode() {
	const { mode, setMode } = useTheme();
	const auth = useAuth();

	const toggleMode = async () => {
		const newMode = mode === "light" ? "dark" : "light";
		const newIsDarkMode = newMode === "dark";

		// 1. Cambio visual optimista e inmediato
		setMode(newMode);

		// 2. Persistencia silenciosa en segundo plano
		const needsPersistence =
			auth.user?.id &&
			auth.proyectoActual?.id &&
			newIsDarkMode !== auth.proyectoActual?.ui_is_dark_mode;

		if (!needsPersistence) {
			return; // No hay nada que persistir, salimos.
		}

		try {
			const result = await actualizarPreferenciasUI(
				auth.user!.id, // Sabemos que existe por el check de needsPersistence
				auth.proyectoActual!.id,
				{ ui_is_dark_mode: newIsDarkMode }
			);

			if (result.success) {
				auth.setUiIsDarkModeLocal(newIsDarkMode); // Actualiza el AuthProvider
			} else {
				toast.error(
					result.error ||
						"No se pudo guardar tu preferencia de modo oscuro/claro."
				);
				// Opcional: Revertir el cambio visual si la persistencia es crítica
				// setMode(mode);
			}
		} catch (error: unknown) {
			console.error("Excepción en toggleMode:", error);
			const errorMessage = error instanceof Error ? error.message : "Error inesperado al guardar tu preferencia de modo.";
			toast.error(errorMessage);
			// Opcional: Revertir el cambio visual
			// setMode(mode);
		}
	};

	return {
		mode: mode || "light", // Aseguramos que 'mode' nunca sea nulo o undefined
		toggleMode,
	};
}


// --- 🖼️ Componente de Presentación ---
// Ahora es un componente simple, legible y sin lógica de negocio.
export function DarkModeSwitcher() {
	const { mode, toggleMode } = useDarkMode();

	return (
		<div className="flex items-center gap-1">
			<StandardIcon styleType="outline" colorScheme="neutral" size="sm" colorShade="pure">
				<Sun className="h-3 w-3" />
			</StandardIcon>
			<motion.div whileTap={{ scale: 0.95 }}>
				<StandardSwitch
				colorScheme="tertiary"
					checked={mode === "dark"}
					onCheckedChange={toggleMode}
					size="sm" // Un tamaño explícito es más predecible
					aria-label={
						mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
					}
				/>
			</motion.div>
			<StandardIcon styleType="outline" size="sm" colorScheme="neutral" colorShade="pure">
				<Moon className="h-3 w-3" />
			</StandardIcon>
		</div>
	);
}