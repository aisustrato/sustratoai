// lib/hooks/useComponentVisibility.ts
"use client";

import { usePathname } from "next/navigation";
import { useWindowSize } from "@/lib/hooks/useWindowSize";

// Breakpoints para determinar modo móvil/estrecho (basado en StandardNavbar)
// El menú hamburguesa se activa en STAGE_4 (1120px) y STAGE_5 (1050px)
const RESPONSIVE_BREAKPOINTS = {
  MOBILE_BREAKPOINT: 1250, // STAGE_4 del navbar - cuando aparece el menú hamburguesa
} as const;

/**
 * Hook para determinar la visibilidad de componentes según la ruta y el tamaño de pantalla
 */
export const useComponentVisibility = () => {
  const pathname = usePathname();
  const { width: windowWidth } = useWindowSize();

  // Determinar si estamos en modo móvil/estrecho
  // Si windowWidth es undefined, asumimos que NO es móvil (desktop por defecto)
  const isMobileView = windowWidth ? windowWidth <= RESPONSIVE_BREAKPOINTS.MOBILE_BREAKPOINT : false;

  // Rutas donde ciertos componentes no deben mostrarse
  const isUpdatePasswordPage = pathname === '/update-password';

  return {
    // ProjectStatusBadge: ocultar en móvil Y en /update-password
    shouldShowProjectStatusBadge: !isMobileView && !isUpdatePasswordPage,
    
    // JobManager: ocultar solo en /update-password
    shouldShowJobManager: !isUpdatePasswordPage,
    
    // Estados auxiliares para debugging o uso externo
    isMobileView,
    isUpdatePasswordPage,
    currentPath: pathname,
  };
};
