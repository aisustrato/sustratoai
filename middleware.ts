// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';

const PUBLIC_ROUTES = [ '/login', '/signup', '/reset-password', '/update-password', '/contact', '/api/auth/callback', '/auth/callback' ];

function shouldIgnorePathForSession(pathname: string): boolean {
  if (PUBLIC_ROUTES.some(route => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)))) return true;
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) return true;
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|json|webmanifest|txt|xml|css|js|map)$/i)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, search, hash } = nextUrl;
  const LOG_PREFIX_MW = "[MIDDLEWARE_SSR_V2]"; // Nuevo prefijo para esta versión
  const requestId = Math.floor(Math.random() * 10000);

  const response = NextResponse.next({ request: { headers: request.headers } });

  // 🔍 LOGS DETALLADOS PARA DEBUGGING DE PASSWORD RESET
  console.log(`${LOG_PREFIX_MW}:${requestId} 🔍 URL COMPLETA: ${request.url}`);
  console.log(`${LOG_PREFIX_MW}:${requestId} 🔍 PATHNAME: ${pathname}`);
  console.log(`${LOG_PREFIX_MW}:${requestId} 🔍 SEARCH: ${search}`);
  console.log(`${LOG_PREFIX_MW}:${requestId} 🔍 HASH: ${hash}`);
  console.log(`${LOG_PREFIX_MW}:${requestId} 🔍 REFERER: ${request.headers.get('referer') || 'NO REFERER'}`);
  
  // 🔧 DETECCIÓN DE ENLACE EXPIRADO: Interceptar directamente en middleware
  // Si detectamos error de enlace expirado Y NO estamos ya en /login, redirigir
  if ((search.includes('error_code=otp_expired') || search.includes('expired')) && pathname !== '/login') {
    console.log(`${LOG_PREFIX_MW}:${requestId} 🚨 ENLACE EXPIRADO DETECTADO - Redirigiendo a /login`);
    const loginUrl = new URL('/login', request.url);
    // Preservar los parámetros de error para que login los detecte
    loginUrl.search = search;
    console.log(`${LOG_PREFIX_MW}:${requestId} 🎯 Redirigiendo a: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }
  
  // 🔧 SOLUCIÓN PARA RECOVERY TOKENS: Detectar tokens de recuperación válidos
  const isValidRecoveryFlow = search.includes('type=recovery') || 
                             hash.includes('access_token') || 
                             search.includes('access_token') ||
                             (search.includes('code=') && !search.includes('error'));
  
  // 🚫 PREVENIR LOOP INFINITO: Si ya estamos en /update-password, no redirigir
  if (isValidRecoveryFlow && pathname !== '/update-password') {
    console.log(`${LOG_PREFIX_MW}:${requestId} 🚨 DETECTADA URL DE RECUPERACIÓN VÁLIDA!`);
    console.log(`${LOG_PREFIX_MW}:${requestId} 🔧 Recovery flow válido detectado, redirigiendo a /update-password.`);
    
    const updatePasswordUrl = new URL('/update-password', request.url);
    if (search.includes('code=')) {
      updatePasswordUrl.search = search;
    }
    
    console.log(`${LOG_PREFIX_MW}:${requestId} 🎯 Redirigiendo a: ${updatePasswordUrl.toString()}`);
    return NextResponse.redirect(updatePasswordUrl);
  }
  
  if (pathname === '/update-password') {
    console.log(`${LOG_PREFIX_MW}:${requestId} 🚨 RUTA /update-password detectada, permitiendo paso.`);
    return response;
  }

  if (shouldIgnorePathForSession(pathname)) {
    console.log(`${LOG_PREFIX_MW}:${requestId} Ruta ignorada (sesión): ${pathname}`);
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Loguear las variables de entorno que usa el middleware
  console.log(`${LOG_PREFIX_MW}:${requestId} Supabase URL (MW): ${supabaseUrl ? supabaseUrl.substring(0,20) + '...' : 'NO DEFINIDA'}`);
  console.log(`${LOG_PREFIX_MW}:${requestId} Supabase Anon Key (MW): ${supabaseAnonKey ? supabaseAnonKey.substring(0,10) + '...' : 'NO DEFINIDA'}`);

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const cookieValue = request.cookies.get(name)?.value;
          console.log(`${LOG_PREFIX_MW}:${requestId} cookies.get('${name}'): ${cookieValue ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);
          if (name.includes('auth-token') && cookieValue) {
            console.log(`${LOG_PREFIX_MW}:${requestId} Valor de cookie ${name} (primeros 20 chars): ${cookieValue.substring(0,20)}...`);
          }
          return cookieValue;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`${LOG_PREFIX_MW}:${requestId} cookies.set('${name}') con dominio: ${options.domain}, path: ${options.path}, httpOnly: ${options.httpOnly}, secure: ${options.secure}`);
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          console.log(`${LOG_PREFIX_MW}:${requestId} cookies.remove('${name}') con dominio: ${options.domain}, path: ${options.path}`);
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
      // Siendo explícitos con las opciones de auth para el middleware
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false, // Generalmente false para el middleware, PKCE se maneja en cliente
        persistSession: true, // Le dice que use el adaptador de cookies
        // flowType: 'pkce', // No es necesario especificar aquí si el cliente lo maneja
      }
    }
  );

  try {
    console.log(`${LOG_PREFIX_MW}:${requestId} Intentando supabase.auth.getSession()...`);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(`${LOG_PREFIX_MW}:${requestId} Error en getSession() del middleware:`, sessionError.message);
    }
    
    if (!session) {
      console.log(`${LOG_PREFIX_MW}:${requestId} SIN SESIÓN en middleware para ${pathname}. Redirigiendo a /login.`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log(`${LOG_PREFIX_MW}:${requestId} SESIÓN VÁLIDA en middleware. User: ${session.user?.id?.substring(0,8)}. Path: ${pathname}`);
    return response;

  } catch (error) {
    console.error(`${LOG_PREFIX_MW}:${requestId} Error INESPERADO en middleware para ${pathname}:`, error);
    // ... (manejo de error genérico)
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'Error interno del servidor en middleware');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/auth/callback|auth/callback).*)',
  ],
};