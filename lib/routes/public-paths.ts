// 📍 lib/routes/public-paths.ts
// Rutas públicas (DMZ /papers/* + páginas de auth) compartidas entre
// AuthProvider y AuthLayoutWrapper — ambas necesitan saber si una ruta debe
// renderizarse sin esperar el estado de sesión.

const NO_NAVBAR_PAGES = ["/login", "/signup", "/reset-password", "/update-password"];

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/contact"];

/** Rutas públicas: páginas de auth estándar + toda la DMZ /papers/*. */
export const isPublicPath = (pathname: string | null): boolean => {
	if (!pathname) return false;

	if (PUBLIC_PATHS.includes(pathname)) return true;
	if (PUBLIC_PATHS.some((path) => pathname.startsWith(`${path}/`))) return true;

	// DMZ: cualquier ruta que empiece con /papers es pública
	if (pathname.startsWith("/papers")) return true;

	return false;
};

/** Rutas que no muestran el StandardNavbar (auth + DMZ, que usa su propio navbar). */
export const isNoNavbarPage = (pathname: string | null): boolean => {
	if (!pathname) return false;

	if (NO_NAVBAR_PAGES.includes(pathname)) return true;
	if (NO_NAVBAR_PAGES.some((path) => pathname.startsWith(`${path}/`))) return true;

	if (pathname.startsWith("/papers")) return true;

	return false;
};
