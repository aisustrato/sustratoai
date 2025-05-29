import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.replace('www.', '') : undefined;

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain,
  };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: false, // Desactivar detección de sesión en URL para el middleware
        persistSession: true,
      },
      cookies: {
        get(name: string) {
          try {
            return req.cookies.get(name)?.value;
          } catch (error) {
            console.error('Error al obtener cookie:', error);
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            res.cookies.set({
              name,
              value,
              ...cookieOptions,
              ...options,
            });
          } catch (error) {
            console.error('Error al establecer cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            res.cookies.set({
              name,
              value: '',
              ...cookieOptions,
              ...options,
              maxAge: 0, // Eliminar la cookie
            });
          } catch (error) {
            console.error('Error al eliminar cookie:', error);
          }
        },
      },
    }
  );
}
