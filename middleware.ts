// middleware.ts - MEJORADO
import { createMiddlewareClient } from "@/lib/supabase-middleware-client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/reset-password",
  "/contact",
  "/api/auth/callback", // Ruta de callback de autenticación
  "/auth/callback",     // Ruta de callback alternativa
];

// Patrones de rutas que deben ser ignorados por el middleware
const IGNORE_PATTERNS = [
  '/_next',
  '/api',
  '/_vercel',
  '/favicon',
  '/sitemap',
  '/robots.txt',
  '/manifest.json',
  '.json',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.gif',
  '.css',
  '.js',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

export async function middleware(req: NextRequest) {
  const requestId = Math.floor(Math.random() * 10000);
  const { pathname } = req.nextUrl;
  
  console.log(`[MW:${requestId}] Procesando ruta: ${pathname}`);
  
  // Verificar si la ruta es pública
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isPublicRoute) {
    console.log(`[MW:${requestId}] Ruta pública - acceso permitido`);
    return NextResponse.next();
  }
  
  // Verificar si la ruta debe ser ignorada
  const shouldIgnore = IGNORE_PATTERNS.some(pattern => 
    pathname.includes(pattern)
  );
  
  if (shouldIgnore) {
    return NextResponse.next();
  }
  
  // Crear una respuesta que podamos modificar
  const res = NextResponse.next();
  
  try {
    // Crear cliente de Supabase para el middleware
    const supabase = createMiddlewareClient(req, res);
    
    // Obtener la sesión del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Si hay un error al obtener la sesión o no hay sesión
    if (sessionError || !session) {
      console.log(`[MW:${requestId}] Sin sesión válida - redirigiendo a /login`);
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Verificar que el token sea válido
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log(`[MW:${requestId}] Token inválido o expirado - redirigiendo a /login`);
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Si llegamos aquí, la autenticación es válida
    console.log(`[MW:${requestId}] Usuario autenticado: ${user.email} (${user.id.substring(0, 8)}...)`);
    
    // Asegurarnos de que las cookies de autenticación estén configuradas correctamente
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    
    return res;
    
  } catch (error) {
    console.error(`[MW:${requestId}] Error inesperado en middleware:`, error);
    
    // En caso de error, redirigir al login con un mensaje de error
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'Ocurrió un error al verificar tu sesión. Por favor, inicia sesión nuevamente.');
    return NextResponse.redirect(loginUrl);
  }
}

// Configuración del middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static files (images, fonts, etc.)
     * - auth routes (login, signup, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|json)$|api/auth/|auth/|login|signup|reset-password|contact).*)',
  ],
};
