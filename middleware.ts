// middleware.ts - Configuración mejorada de autenticación
import { createClient } from "@supabase/supabase-js"; // O preferiblemente @supabase/ssr si lo adaptas
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/reset-password",
  "/contact",
  "/api/auth/callback", // Asegúrate que estas rutas de API sean realmente públicas o manejadas de otra forma
  "/auth/callback", // Callback de Supabase
  // No es necesario incluir /_next, /static, favicon.ico, etc., aquí si el matcher de config ya los excluye.
  // Sin embargo, si quieres doble seguridad o tu matcher es más permisivo, puedes mantenerlos.
  // Por ahora, los mantendré como en tu versión original para minimizar cambios no solicitados.
  "/_next",
  "/static",
  "/favicon.ico",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
];

// Extensiones de archivo estáticos (generalmente bien manejadas por el matcher de config)
const STATIC_FILE_EXTENSIONS = [
  ".json", // manifest.json ya está en PUBLIC_ROUTES
  ".ico", // favicon.ico ya está en PUBLIC_ROUTES
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".gif",
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".map",
];

// Función para verificar si la ruta debe ser ignorada
function shouldIgnorePath(pathname: string): boolean {
  // Verificar rutas públicas explícitas
  if (
    PUBLIC_ROUTES.some(
      (route) =>
        pathname === route ||
        (route !== "/" && pathname.startsWith(`${route}/`))
    )
  ) {
    return true;
  }

  // Verificar extensiones de archivo estáticas
  // (puede ser redundante si el matcher del config es efectivo)
  if (STATIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // Permitir rutas de API específicas de autenticación, pero ignorar otras rutas de API
  // si no quieres que el middleware de sesión las procese.
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    // Si tienes otras rutas de API que sí necesitan sesión, ajusta esta lógica.
    // Por ejemplo, podrías tener una lista de PUBLIC_API_ROUTES.
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const requestId = Math.floor(Math.random() * 10000); // Para seguimiento de logs
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";

  // Derivación del dominio principal de la aplicación
  let appDomain = "localhost"; // Default para desarrollo
  if (isProduction) {
    try {
      // Priorizar NEXT_PUBLIC_SITE_URL, luego VERCEL_URL, luego NEXT_PUBLIC_VERCEL_URL
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_VERCEL_URL);

      if (siteUrl) {
        appDomain = new URL(siteUrl).hostname.replace(/^www\./, "");
      } else {
        // Fallback MUY improbable en Vercel si las variables están bien configuradas.
        // Como último recurso, podrías usar el hostname de Supabase, pero es menos ideal para la cookie de la app.
        console.warn(
          `[MW:${requestId}] NEXT_PUBLIC_SITE_URL y VERCEL_URL no están definidas. Intentando fallback (no ideal).`
        );
        appDomain = "localhost"; // O un dominio por defecto seguro si es preferible a fallar.
      }
    } catch (e) {
      console.error(
        `[MW:${requestId}] Error parseando URL para appDomain. URL base usada: ${
          process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        }. Error:`,
        e
      );
      appDomain = "localhost"; // Fallback en caso de error de parsing
    }
  }

  // Dominio para la cookie:
  // En Vercel, para un dominio como 'nombre-proyecto.vercel.app', queremos '.vercel.app'
  // Para un dominio personalizado como 'app.midominio.com', queremos '.midominio.com'
  // Para localhost, queremos 'undefined' (sin especificar dominio)
  const cookieDomainSetting = (() => {
    if (!isProduction) return undefined; // localhost
    if (isVercel && appDomain.endsWith(".vercel.app")) return ".vercel.app"; // Para sustratoai.vercel.app -> .vercel.app

    // Para dominios personalizados: ej. app.custom.com -> .custom.com
    // O custom.com -> .custom.com
    const parts = appDomain.split(".");
    if (parts.length > 1) {
      return `.${parts.slice(-2).join(".")}`;
    }
    return `.${appDomain}`; // Si es un TLD como 'mycompany' (raro), o fallback.
  })();

  console.log(
    `[MW:${requestId}] Ruta: ${pathname}. AppDomain: ${appDomain}, CookieDomain: ${cookieDomainSetting}, Prod: ${isProduction}, Vercel: ${isVercel}`
  );

  // Opciones base para cookies, usadas por el storage del cliente Supabase en middleware
  const cookieOptionsBase = {
    path: "/",
    sameSite: "lax" as const,
    secure: isProduction,
    domain: cookieDomainSetting,
  };

  // Opciones específicas para la cookie de sesión principal que maneja el servidor (sb-*-auth-token)
  const sessionCookieOptions = {
    ...cookieOptionsBase,
    httpOnly: true, // CRÍTICO: La cookie de sesión del servidor debe ser HttpOnly
    maxAge: 60 * 60 * 24 * 7, // 7 días
  };

  // Opciones para otras cookies que el cliente Supabase podría manejar y que JS necesite leer
  // (ej. sb-access-token, sb-refresh-token si no son manejadas por el token HttpOnly principal)
  const clientAccessibleCookieOptions = {
    ...cookieOptionsBase,
    httpOnly: false, // Permite lectura por JS si es necesario para esas cookies específicas
    maxAge: 60 * 60 * 24 * 7,
  };

  // Verificar si la ruta debe ser ignorada por el middleware de autenticación
  if (shouldIgnorePath(pathname)) {
    console.log(`[MW:${requestId}] Ruta ignorada (configuración): ${pathname}`);
    return NextResponse.next();
  }

  // Crear una respuesta base que se puede modificar
  const response = NextResponse.next({
    request: {
      headers: request.headers, // Propagar las cabeceras de la solicitud original
    },
  });

  try {
    // Se usa createClient de @supabase/supabase-js.
    // Idealmente, para middleware, se usaría createServerClient de @supabase/ssr
    // con el Request y Response adaptados, pero la estructura actual es funcional
    // si el 'storage' personalizado se comporta correctamente.
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true, // Para el cliente universal, esto activa el 'storage'
          detectSessionInUrl: false, // PKCE maneja esto
          flowType: "pkce",
          debug: !isProduction,
          storage: {
            // Este 'storage' es cómo ESTA instancia de Supabase interactúa con las cookies
            getItem: (key: string) => {
              const cookie = request.cookies.get(key)?.value;
              if (key.includes("auth-token")) {
                // Más específico para la cookie de sesión
                console.log(
                  `[MW:${requestId}] storage.getItem('${key}'): ${
                    cookie ? "ENCONTRADA" : "NO ENCONTRADA"
                  }`
                );
              }
              return cookie || null;
            },
            setItem: (key: string, value: string) => {
              // Diferenciar opciones si la cookie es la de sesión principal o no
              const opts = key.includes("auth-token")
                ? sessionCookieOptions
                : clientAccessibleCookieOptions;
              console.log(
                `[MW:${requestId}] storage.setItem('${key}') con dominio: ${opts.domain}, httpOnly: ${opts.httpOnly}`
              );
              response.cookies.set({ name: key, value, ...opts });
              // También actualiza la colección de cookies de la solicitud actual para que supabase.auth.getSession() la vea inmediatamente
              request.cookies.set(key, value);
            },
            removeItem: (key: string) => {
              const opts = key.includes("auth-token")
                ? sessionCookieOptions
                : clientAccessibleCookieOptions;
              console.log(
                `[MW:${requestId}] storage.removeItem('${key}') con dominio: ${opts.domain}, httpOnly: ${opts.httpOnly}`
              );
              response.cookies.set({
                name: key,
                value: "",
                ...opts,
                maxAge: 0,
              });
              // También elimina de la colección de cookies de la solicitud actual
              request.cookies.delete(key);
            },
          },
        },
      }
    );

    console.log(`[MW:${requestId}] Verificando sesión para: ${pathname}...`);
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        `[MW:${requestId}] Error al obtener sesión supabase.auth.getSession():`,
        sessionError.message
      );
      // Considerar qué hacer aquí. Si el error es "Auth session missing", es un no-sesión.
      // Si es un error de red con Supabase, podría ser temporal.
      // Por ahora, lo trataremos como no-sesión si hay error.
    }

    if (!session) {
      console.log(
        `[MW:${requestId}] Sin sesión válida o error en getSession. Redirigiendo a /login desde ${pathname}.`
      );
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname); // Guardar la ruta a la que se intentaba acceder

      const redirectResponse = NextResponse.redirect(loginUrl);

      // Limpiar cookies de autenticación conocidas. Es importante que el 'domain' y 'path' coincidan.
      const supabaseCookiePrefixes = ["sb-", "sb_"]; // Prefijos comunes de cookies de Supabase
      request.cookies.getAll().forEach((cookie) => {
        if (
          supabaseCookiePrefixes.some((prefix) =>
            cookie.name.startsWith(prefix)
          )
        ) {
          console.log(
            `[MW:${requestId}] Limpiando cookie en redirección a login: ${cookie.name}`
          );
          redirectResponse.cookies.set({
            name: cookie.name,
            value: "",
            path: "/", // Path raíz
            domain: cookieDomainSetting, // Mismo dominio que al establecerlas
            maxAge: 0, // Expira inmediatamente
            secure: isProduction,
            // La cookie de sesión principal (sb-*-auth-token) es httpOnly. Otras pueden no serlo.
            httpOnly: cookie.name.includes("auth-token"),
            sameSite: "lax",
          });
        }
      });
      return redirectResponse;
    }

    // Si hay sesión, el token ya fue validado por Supabase al hacer getSession()
    console.log(
      `[MW:${requestId}] Sesión VÁLIDA para usuario: ${
        session.user?.email
          ? session.user.email.substring(0, 3) + "..."
          : "ID: " + session.user?.id.substring(0, 8) + "..."
      }`
    );

    // La cookie de sesión ya debería estar en `response.cookies` si fue refrescada por `supabase.auth.getSession()`
    // y el `storage.setItem` se ejecutó.
    // Nos aseguramos de que las cabeceras de no-cacheo estén presentes.
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
    );

    return response; // Permite el acceso
  } catch (error) {
    // Captura errores inesperados en el bloque try del middleware
    console.error(
      `[MW:${requestId}] Error INESPERADO en middleware para ${pathname}:`,
      error
    );

    // Redirigir a login con un mensaje de error genérico
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "Ocurrió un error inesperado. Por favor, intenta iniciar sesión de nuevo."
    );
    loginUrl.searchParams.set("redirectTo", pathname); // Preservar la intención original

    const errorResponse = NextResponse.redirect(loginUrl);
    // Intentar limpiar cookies igualmente
    const supabaseCookiePrefixes = ["sb-", "sb_"];
    request.cookies.getAll().forEach((cookie) => {
      if (
        supabaseCookiePrefixes.some((prefix) => cookie.name.startsWith(prefix))
      ) {
        errorResponse.cookies.set({
          name: cookie.name,
          value: "",
          path: "/",
          domain: cookieDomainSetting,
          maxAge: 0,
          secure: isProduction,
          httpOnly: cookie.name.includes("auth-token"),
          sameSite: "lax",
        });
      }
    });
    return errorResponse;
  }
}

// Configuración del Matcher para el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json, robots.txt, sitemap.xml (archivos de metadatos)
     * - /api/auth/ (rutas de callback de autenticación de Supabase)
     * - /auth/ (si tienes otras rutas de UI bajo /auth que no deben ser protegidas por este middleware)
     * Cualquier otra cosa SÍ pasará por el middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/auth/callback|auth/callback).*)",
  ],
};
