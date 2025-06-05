// components/ui/dark-mode-switcher.tsx
// Versión: 1.1 (Lógica optimista: cambio visual inmediato, persistencia silenciosa de ui_is_dark_mode)
"use client";

import { useTheme } from "@/app/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

// --- NUEVAS IMPORTACIONES ---
import { useAuth } from "@/app/auth-provider";
import { actualizarPreferenciasUI } from "@/app/actions/proyecto-actions";
import { toast } from "sonner";

export function DarkModeSwitcher() {
  const { mode, setMode } = useTheme(); // Para el cambio visual inmediato y la UI del switcher
  const auth = useAuth(); // Hook para acceder al contexto de autenticación

  // Nota: El uso de forceUpdate podría revisarse.
  // Si los cambios en ThemeProvider y AuthProvider ya provocan los re-renders necesarios,
  // este estado y el setTimeout podrían no ser necesarios.


  const toggleMode = async () => {
    const newMode = mode === "light" ? "dark" : "light";
    const newIsDarkMode = newMode === "dark"; // Valor booleano para persistencia

    // 1. Aplicar el cambio visual inmediato
    setMode(newMode); // Esto actualiza ThemeProvider y la UI
    console.log(`[DarkModeSwitcher v1.1] Cambio visual inmediato a modo: ${newMode}`);
    
    // El setTimeout para forceUpdate se mantiene por ahora, como en el código original.
 

    // 2. Proceder con la persistencia silenciosa si es necesario
    const currentPersistedIsDarkMode = auth.proyectoActual?.ui_is_dark_mode;
    const needsPersistence = auth.user?.id &&
                             auth.proyectoActual?.id &&
                             (newIsDarkMode !== currentPersistedIsDarkMode); // Persistir si el valor es diferente

    if (!needsPersistence) {
      if (!auth.user?.id || !auth.proyectoActual?.id) {
        console.warn("[DarkModeSwitcher v1.1] Persistencia omitida: Usuario o proyecto no disponible.");
      } else if (newIsDarkMode === currentPersistedIsDarkMode) {
        console.log("[DarkModeSwitcher v1.1] Persistencia omitida: El modo oscuro/claro seleccionado ya está persistido.");
      }
      return;
    }
    
    console.log(`[DarkModeSwitcher v1.1] Iniciando persistencia silenciosa para ui_is_dark_mode: ${newIsDarkMode}`);
    try {
      // Aseguramos que user.id y proyectoActual.id existen antes de usarlos
      if (!auth.user?.id || !auth.proyectoActual?.id) {
          throw new Error("Usuario o ID de proyecto no disponible para la persistencia del modo oscuro/claro.");
      }

      const result = await actualizarPreferenciasUI(
        auth.user.id,
        auth.proyectoActual.id,
        { ui_is_dark_mode: newIsDarkMode } // Solo enviamos la preferencia de modo
      );

      if (result.success) {
        auth.setUiIsDarkModeLocal(newIsDarkMode); // Actualiza AuthProvider silenciosamente
        console.log(`[DarkModeSwitcher v1.1] Persistencia exitosa y AuthProvider actualizado para ui_is_dark_mode: ${newIsDarkMode}`);
      } else {
        toast.error(result.error || "Ups! Tuvimos un problema al guardar tu preferencia de modo oscuro/claro. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.");
        console.error("[DarkModeSwitcher v1.1] Error en persistencia desde actualizarPreferenciasUI:", result.error);
        // Opcional: Revertir el cambio visual si falla la persistencia
        // setMode(mode); // Revertiría al modo original
      }
    } catch (error: any) {
      console.error("[DarkModeSwitcher v1.1] Excepción durante la persistencia del modo oscuro/claro:", error);
      toast.error(error.message || "Ups! Hubo una excepción al guardar tu preferencia de modo oscuro/claro. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.");
      // Opcional: Revertir el cambio visual
      // setMode(mode);
    }
  };
  
  return (
    <div className="flex items-center gap-1">
      <Icon size="xs" color="neutral" colorVariant="pure">
        <Sun className="h-3 w-3" />
      </Icon>
      <motion.div whileTap={{ scale: 0.95 }}>
        <Switch
          checked={mode === "dark"}
          onCheckedChange={toggleMode} // Llama a la nueva función toggleMode asíncrona
          className="scale-75 origin-center"
          aria-label={
            mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        />
      </motion.div>
      <Icon size="xs" color="neutral" colorVariant="pure">
        <Moon className="h-3 w-3" />
      </Icon>
    </div>
  );
}