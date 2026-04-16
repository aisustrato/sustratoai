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
  const isDev = process.env.NODE_ENV === 'development';

  // 🔍 LOGS REDUCIDOS - Solo en desarrollo y para rutas específicas
  const shouldLog = isDev && (search.includes('error') || search.includes('code=') || pathname.includes('/update-password'));
  if (shouldLog) {
    console.log(`${LOG_PREFIX_MW}:${requestId} 🔍 URL: ${pathname}${search}`);
  }
  
  // 🔧 DETECCIÓN DE ENLACE EXPIRADO
  if ((search.includes('error_code=otp_expired') || search.includes('expired')) && pathname !== '/login') {
    if (isDev) console.log(`${LOG_PREFIX_MW}:${requestId} 🚨 Enlace expirado → /login`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.search = search;
    return NextResponse.redirect(loginUrl);
  }
  
  // 🔧 SOLUCIÓN PARA RECOVERY TOKENS
  const isValidRecoveryFlow = search.includes('type=recovery') || 
                             hash.includes('access_token') || 
                             search.includes('access_token') ||
                             (search.includes('code=') && !search.includes('error'));
  
  if (isValidRecoveryFlow && pathname !== '/update-password') {
    if (isDev) console.log(`${LOG_PREFIX_MW}:${requestId} Recovery flow → /update-password`);
    const updatePasswordUrl = new URL('/update-password', request.url);
    if (search.includes('code=')) {
      updatePasswordUrl.search = search;
    }
    return NextResponse.redirect(updatePasswordUrl);
  }
  
  if (pathname === '/update-password') {
    return response;
  }

  if (shouldIgnorePathForSession(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const cookieValue = request.cookies.get(name)?.value;
          // Solo loguear cookie principal, no fragmentadas (.0, .1, etc)
          if (isDev && name === 'sb-vgnteswwvallupuanfiz-auth-token' && !cookieValue) {
            console.log(`${LOG_PREFIX_MW}:${requestId} ⚠️ Cookie principal no encontrada`);
          }
          return cookieValue;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError && isDev) {
      console.error(`${LOG_PREFIX_MW}:${requestId} ❌ Error en getSession():`, sessionError.message);
    }
    
    if (!session) {
      if (isDev) console.log(`${LOG_PREFIX_MW}:${requestId} Sin sesión → /login`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Solo loguear sesión válida en desarrollo y para rutas específicas
    if (shouldLog) {
      console.log(`${LOG_PREFIX_MW}:${requestId} ✅ Sesión válida: ${session.user?.id?.substring(0,8)}`);
    }
    return response;

  } catch (error) {
    console.error(`${LOG_PREFIX_MW}:${requestId} ❌ Error inesperado:`, error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'Error interno del servidor');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/auth/callback|auth/callback).*)',
  ],
};