"use client";

import { useTheme } from "@/app/theme-provider";

/**
 * Hook para acceder a los tokens de color en componentes LEGACY
 * Este hook garantiza que los componentes se actualicen cuando cambia el tema
 */
export function useColorTokens() {
  // Usar el hook useTheme para forzar la actualización cuando cambia el tema
  // Acceder a legacyColorTokens en lugar del antiguo colorTokens
  const { legacyColorTokens: contextTokens } = useTheme();

  // Devolver los tokens del contexto, que siempre están actualizados
  return contextTokens;
}
