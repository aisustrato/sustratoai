// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';

const PUBLIC_ROUTES = [ '/login', '/signup', '/reset-password', '/contact', '/api/auth/callback', '/auth/callback' ];

function shouldIgnorePathForSession(pathname: string): boolean {
  if (PUBLIC_ROUTES.some(route => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)))) return true;
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) return true;
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|json|webmanifest|txt|xml|css|js|map)$/i)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  const LOG_PREFIX_MW = "[MIDDLEWARE_SSR_V2]"; // Nuevo prefijo para esta versión
  const requestId = Math.floor(Math.random() * 10000);

  const response = NextResponse.next({ request: { headers: request.headers } });

  console.log(`${LOG_PREFIX_MW}:${requestId} Procesando: ${pathname}`);

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