// middleware.ts - Configuración mejorada de autenticación
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/contact',
  '/api/auth/callback',
  '/auth/callback',
  '/_next',
  '/static',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
]

// Extensiones de archivo estáticos
const STATIC_FILE_EXTENSIONS = [
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
  '.map'
]

// Función para verificar si la ruta debe ser ignorada
function shouldIgnorePath(pathname: string): boolean {
  // Verificar rutas públicas
  if (PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )) {
    return true;
  }

  // Verificar extensiones de archivo estáticas
  if (STATIC_FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return true;
  }

  // Verificar rutas de API (excepto las de autenticación)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { pathname } = url
  const requestId = Math.floor(Math.random() * 10000)
  const isProduction = process.env.NODE_ENV === 'production'
  const domain = isProduction ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.replace('www.', '') : 'localhost'
  
  // Configuración de cookies seguras
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
    httpOnly: false,
    domain: domain === 'localhost' ? undefined : domain
  }

  console.log(`[MW:${requestId}] Procesando ruta: ${pathname}`)

  // Verificar si la ruta debe ser ignorada
  if (shouldIgnorePath(pathname)) {
    console.log(`[MW:${requestId}] Ruta ignorada`)
    return NextResponse.next()
  }

  // Crear una respuesta que podamos modificar
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Configuración de cookies
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
          debug: !isProduction,
          storage: {
            getItem: (key: string) => {
              // Obtener la cookie de la solicitud
              const cookie = request.cookies.get(key)?.value
              console.log(`[MW:${requestId}] Obteniendo cookie ${key}:`, cookie ? '***' : 'no encontrada')
              return cookie || null
            },
            setItem: (key: string, value: string) => {
              console.log(`[MW:${requestId}] Estableciendo cookie ${key}`)
              response.cookies.set({
                name: key,
                value,
                ...cookieOptions,
                maxAge: 60 * 60 * 24 * 7, // 7 días
              })
              
              // Asegurarse de que la cookie se establezca en el navegador
              request.cookies.set(key, value)
              console.log(`[MW:${requestId}] Cookie ${key} establecida`)
            },
            removeItem: (key: string) => {
              console.log(`[MW:${requestId}] Eliminando cookie ${key}`)
              response.cookies.set({
                name: key,
                value: '',
                ...cookieOptions,
                maxAge: 0,
              })
              
              // Asegurarse de que la cookie se elimine del navegador
              request.cookies.delete(key)
              console.log(`[MW:${requestId}] Cookie ${key} eliminada`)
            },
          },
        },
      }
    )

    // Refrescar la sesión si es necesario
    console.log(`[MW:${requestId}] Verificando sesión...`)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Si hay un error o no hay sesión, redirigir al login
    if (error || !session) {
      console.log(`[MW:${requestId}] Sin sesión válida - redirigiendo a /login`)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      
      // Limpiar cookies de autenticación
      const authCookies = [
        'sb-auth-token',
        'sb-access-token',
        'sb-refresh-token',
        'sb-provider-token'
      ]
      
      // Crear una nueva respuesta de redirección
      const redirectResponse = NextResponse.redirect(loginUrl)
      
      // Limpiar todas las cookies de autenticación
      authCookies.forEach(cookie => {
        redirectResponse.cookies.set({
          name: cookie,
          value: '',
          path: '/',
          sameSite: 'lax',
          secure: isProduction,
          httpOnly: false,
          domain,
          maxAge: 0,
        })
      })
      
      return redirectResponse
    }
    
    console.log(`[MW:${requestId}] Sesión válida para usuario:`, session.user?.email)

    // Verificar que el token sea válido
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log(`[MW:${requestId}] Token inválido o expirado - redirigiendo a /login`)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      
      // Limpiar cookies de autenticación
      response.cookies.set({
        name: 'sb-auth-token',
        value: '',
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
        httpOnly: true,
        domain,
        maxAge: 0,
      })
      
      return NextResponse.redirect(loginUrl)
    }

    // Si llegamos aquí, la autenticación es válida
    console.log(`[MW:${requestId}] Usuario autenticado: ${user.email} (${user.id.substring(0, 8)}...)`)
    
    // Asegurarnos de que las cookies de autenticación estén configuradas correctamente
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    
    // Asegurarnos de que la cookie de autenticación esté configurada correctamente
    response.cookies.set({
      name: 'sb-auth-token',
      value: request.cookies.get('sb-auth-token')?.value || '',
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
      httpOnly: true,
      domain,
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })
    
    return response
    
  } catch (error) {
    console.error(`[MW:${requestId}] Error inesperado en middleware:`, error)
    
    // En caso de error, redirigir al login con un mensaje de error
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'Ocurrió un error al verificar tu sesión. Por favor, inicia sesión nuevamente.')
    
    // Limpiar cookies de autenticación
    response.cookies.set({
      name: 'sb-auth-token',
      value: '',
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
      httpOnly: true,
      domain,
      maxAge: 0,
    })
    
    return NextResponse.redirect(loginUrl)
  }
}

// Configuración del middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth callbacks)
     * - static files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/|auth/).*)',
  ],
}
