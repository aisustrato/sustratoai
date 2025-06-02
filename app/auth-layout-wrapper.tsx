// app/auth-layout-wrapper.tsx
// Versión: 2.1 (Lógica de renderizado defensiva más explícita)
"use client";

import React from "react"; 
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider"; 
import { Navbar } from "@/components/ui/navbar";
import { SolidNavbarWrapper } from "@/components/ui/solid-navbar-wrapper";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

// Constantes para las rutas donde NO se debe mostrar la Navbar principal de la app
const NO_NAVBAR_PAGES = ["/login", "/signup", "/reset-password"]; 

// Función helper para determinar si una ruta es pública (AuthProvider también la tiene)
const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/contact"]; // Asegurar que coincida con AuthProvider
const isPublicPage = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
};


export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  // MODIFICACIÓN V2.1: Obtenemos más estados para la lógica defensiva
  const { user, authLoading, authInitialized, proyectoActual } = useAuth(); 
  const pathname = usePathname();
  
  const isNoNavbarPage = pathname ? NO_NAVBAR_PAGES.some(path => pathname === path || pathname.startsWith(`${path}/`)) : false;
  const currentPathIsPublic = isPublicPage(pathname); // Para la lógica defensiva

  const LOG_PREFIX_WRAPPER = "[AUTH_LAYOUT_WRAPPER_V2.1]";

  // CASO 1: Carga Global del AuthProvider Activa (o carga inicial antes de que authInitialized sea true)
  // `authLoading` cubre el inicio de sesión, cierre de sesión, cambio de proyecto.
  // `!authInitialized` cubre la primerísima carga de la aplicación si no es una página pública.
  if (authLoading || (!authInitialized && !currentPathIsPublic)) {
    // console.log(LOG_PREFIX_WRAPPER, `CASO 1: Mostrando Loader. authLoading: ${authLoading}, authInitialized: ${authInitialized}, isPublic: ${currentPathIsPublic}`);
    let loaderText = "Inicializando Sustrato AI...";
    if (authInitialized) { // Si ya inicializó, el loading es por una acción
        // Podríamos tener estados más específicos en AuthProvider para el texto aquí,
        // como loadingSignIn, loadingSignOut, etc. Por ahora, uno genérico.
        loaderText = "Procesando...";
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <SustratoLoadingLogo
          size={80}
          variant="spin-pulse"
          speed="normal"
          breathingEffect
          colorTransition
          showText
          text={loaderText} 
        />
      </div>
    );
  }

  // CASO 2: Logout en Progreso o Estado Post-Logout (Usuario es null, en Ruta Protegida, y no estamos cargando por authLoading)
  // Esto es para evitar el "Home sin Navbar" mientras AuthProvider redirige.
  // Se activa DESPUÉS de que authLoading (del logout) se haya puesto a false, pero ANTES de la redirección.
  if (!user && !currentPathIsPublic && authInitialized) {
    // console.log(LOG_PREFIX_WRAPPER, `CASO 2: Loader Defensivo (No User, Ruta Protegida, Auth Inicializado). Path: ${pathname}`);
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <SustratoLoadingLogo
          size={80}
          variant="spin-pulse"
          speed="normal"
          breathingEffect
          colorTransition
          showText
          text="Redirigiendo..." 
        />
      </div>
    );
  }
  
  // CASO 3: Usuario Autenticado, Datos del Proyecto Cargados (o no estrictamente necesarios para la ruta), en Ruta Protegida/Principal.
  // La Navbar se muestra si hay un usuario Y no estamos en una página que explícitamente no la lleva (como login/signup).
  // La existencia de `proyectoActual` podría ser una condición adicional si todas las rutas autenticadas lo requieren.
  if (user && !isNoNavbarPage) { 
    // console.log(LOG_PREFIX_WRAPPER, `CASO 3: Usuario autenticado. Mostrando Navbar. Path: ${pathname}`);
    // Podríamos añadir una verificación aquí: if (!proyectoActual) return <Loader text="Cargando proyecto..."/>;
    // pero si AuthProvider ya maneja el authLoading hasta que proyectoActual esté listo para las rutas principales,
    // este caso debería ser seguro.
    return (
      <div className="flex flex-col min-h-screen">
        <SolidNavbarWrapper>
          <Navbar />
        </SolidNavbarWrapper>
        <main className="flex-grow w-full">
          {children}
        </main>
      </div>
    );
  }

  // CASO 4: Páginas Públicas, o páginas de autenticación (donde no se muestra Navbar), o cualquier otro caso.
  // AuthProvider ya se ha encargado de las redirecciones si son necesarias.
  // Ej: Usuario en /login (isNoNavbarPage es true), o no hay usuario y está en /contact (currentPathIsPublic es true).
  // console.log(LOG_PREFIX_WRAPPER, `CASO 4: Renderizando children directamente. User: ${!!user}, IsNoNavbarPage: ${isNoNavbarPage}, IsPublic: ${currentPathIsPublic} Path: ${pathname}`);
  return <>{children}</>; 
}