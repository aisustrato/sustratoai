// --- auth-layout-wrapper.tsx (OPTIMIZADO) ---
"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Navbar } from "@/components/ui/navbar";
import { SolidNavbarWrapper } from "@/components/ui/solid-navbar-wrapper";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, authInitialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Para evitar múltiples redirecciones/renderizaciones
  const redirected = useRef(false);
  
  // Determinar si estamos en una página de autenticación
  const isAuthenticatedPage = pathname ? (
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname === "/reset-password" || 
    pathname === "/contact"
  ) : false;
  
  // Resetear el estado de redirección cuando cambia la ruta o el usuario
  useEffect(() => {
    redirected.current = false;
  }, [pathname, user]);

  // Efecto de redirección optimizado - solo se ejecuta una vez por cambio de estado
  useEffect(() => {
    if (!pathname) return; // Protección contra pathname undefined/null
    
    // Requisitos para redirección:
    // 1. Autenticación inicializada
    // 2. No cargando
    // 3. No estamos en una página de autenticación
    // 4. No hay usuario autenticado
    // 5. No hemos redirigido previamente
    if (authInitialized && !loading && !isAuthenticatedPage && !user && !redirected.current) {
      // Generar un ID único para el evento de redirección (para depuración)
      const eventId = Math.floor(Math.random() * 1000);
      console.log(`🔀 [${eventId}] Redirigiendo a login desde: ${pathname}`); 
      redirected.current = true;
      
      // Agregar parámetro redirectTo para volver a esta página después del login
      const loginUrl = `/login?redirectTo=${encodeURIComponent(pathname || '/')}`;  // Con fallback a '/' si pathname es null
      router.push(loginUrl);
    }
  }, [user, loading, authInitialized, pathname, router, isAuthenticatedPage]);

  // Mostrar pantalla de carga mejorada durante inicialización
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <SustratoLoadingLogo
          size={80}
          variant="spin-pulse"
          speed="normal"
          breathingEffect
          colorTransition
          showText
          text="Cargando..."
        />
      </div>
    );
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/reset-password" || pathname === "/contact";

  // Si el usuario está autenticado Y NO es una página de autenticación
  if (user && !isAuthPage) {
    return (
      // Este div es el contenedor principal de la página autenticada
      // Debe permitir que el children (main content area) crezca
      <div className="flex flex-col min-h-screen"> {/* O h-screen si el body ya es h-full */}
        <SolidNavbarWrapper> {/* Esto podría tener su propio position:sticky o fixed */}
          <Navbar />
        </SolidNavbarWrapper>
        {/* Este 'main' es el área de contenido principal que debe crecer */}
        <main className="flex-grow w-full">
          {children} {/* children es PageWrapper */}
        </main>
      </div>
    );
  }

  // Para páginas de autenticación o si no hay usuario (y ya está en una pág de auth)
  // Renderiza children directamente, PageWrapper/PageBackground manejarán su propio layout
  return <>{children}</>; 
}