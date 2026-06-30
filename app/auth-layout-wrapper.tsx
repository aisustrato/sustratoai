// app/auth-layout-wrapper.tsx
// Versión: 2.2 (Soporte DMZ /papers/*)
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { StandardNavbar } from "@/components/ui/StandardNavbar";
import { StandardSolidNavbarWrapper } from "@/components/ui/StandardSolidNavbarWrapper";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

// Constantes base para rutas de autenticación
const NO_NAVBAR_PAGES = [
	"/login",
	"/signup",
	"/reset-password",
	"/update-password",
];

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/contact"];

// Función helper para determinar si una ruta es pública
// Incluye rutas de autenticación Y la DMZ (/papers/*)
const isPublicPath = (pathname: string | null): boolean => {
	if (!pathname) return false;

	// Verificar rutas públicas estándar
	if (PUBLIC_PATHS.includes(pathname)) return true;
	if (PUBLIC_PATHS.some((path) => pathname.startsWith(`${path}/`))) return true;

	// DMZ: cualquier ruta que empiece con /papers es pública
	if (pathname.startsWith("/papers")) return true;

	return false;
};

// Función helper para determinar si una ruta NO debe mostrar StandardNavbar
// Incluye páginas de autenticación Y la DMZ (que tiene su propio navbar)
const isNoNavbarPage = (pathname: string | null): boolean => {
	if (!pathname) return false;

	// Verificar páginas sin navbar estándar
	if (NO_NAVBAR_PAGES.includes(pathname)) return true;
	if (NO_NAVBAR_PAGES.some((path) => pathname.startsWith(`${path}/`)))
		return true;

	// DMZ: /papers/* usa DMZNavbar, no StandardNavbar
	if (pathname.startsWith("/papers")) return true;

	return false;
};

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
	// MODIFICACIÓN V2.2: Obtenemos más estados para la lógica defensiva
	const { user, authLoading, authInitialized } = useAuth();
	const pathname = usePathname();

	// Usar las funciones helper para determinar el tipo de página
	const currentPathIsNoNavbar = isNoNavbarPage(pathname);
	const currentPathIsPublic = isPublicPath(pathname);

	// CASO 1: Carga Global del AuthProvider Activa (o carga inicial antes de que authInitialized sea true)
	// `authLoading` cubre el inicio de sesión, cierre de sesión, cambio de proyecto.
	// `!authInitialized` cubre la primerísima carga de la aplicación si no es una página pública.
	if (authLoading || (!authInitialized && !currentPathIsPublic)) {
		// console.log(LOG_PREFIX_WRAPPER, `CASO 1: Mostrando Loader. authLoading: ${authLoading}, authInitialized: ${authInitialized}, isPublic: ${currentPathIsPublic}`);
		let loaderText = "Inicializando Sustrato AI...";
		if (authInitialized) {
			// Si ya inicializó, el loading es por una acción
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
					colorTransition={false}
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
					colorTransition={false}
					showText
					text="Redirigiendo..."
				/>
			</div>
		);
	}

	// CASO 3: Usuario Autenticado, Datos del Proyecto Cargados (o no estrictamente necesarios para la ruta), en Ruta Protegida/Principal.
	// La Navbar se muestra si hay un usuario Y no estamos en una página que explícitamente no la lleva (como login/signup/papers).
	// La existencia de `proyectoActual` podría ser una condición adicional si todas las rutas autenticadas lo requieren.
	if (user && !currentPathIsNoNavbar) {
		// console.log(LOG_PREFIX_WRAPPER, `CASO 3: Usuario autenticado. Mostrando Navbar. Path: ${pathname}`);
		// Podríamos añadir una verificación aquí: if (!proyectoActual) return <Loader text="Cargando proyecto..."/>;
		// pero si AuthProvider ya maneja el authLoading hasta que proyectoActual esté listo para las rutas principales,
		// este caso debería ser seguro.
		return (
			<div className="flex flex-col min-h-screen">
				<StandardSolidNavbarWrapper>
					<StandardNavbar />
				</StandardSolidNavbarWrapper>
				<main className="flex-grow w-full">{children}</main>
			</div>
		);
	}

	// CASO 4: Páginas Públicas, o páginas de autenticación (donde no se muestra Navbar), o cualquier otro caso.
	// AuthProvider ya se ha encargado de las redirecciones si son necesarias.
	// Ej: Usuario en /login (currentPathIsNoNavbar es true), o no hay usuario y está en /contact o /papers (currentPathIsPublic es true).
	// console.log(LOG_PREFIX_WRAPPER, `CASO 4: Renderizando children directamente. User: ${!!user}, IsNoNavbarPage: ${currentPathIsNoNavbar}, IsPublic: ${currentPathIsPublic} Path: ${pathname}`);
	return <>{children}</>;
}
