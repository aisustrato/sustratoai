// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

// Obtener dominio dinámicamente
const getDomain = () => {
  if (!isProduction) return undefined;
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || process.env.NEXT_PUBLIC_VERCEL_URL;
    if (url) return new URL(url).hostname.replace('www.', '');
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.replace('www.', '');
  } catch {
    return undefined;
  }
};

const domain = isVercel ? '.vercel.app' : getDomain();

export async function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              domain,
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
              httpOnly: true,
            })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              domain,
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
              httpOnly: true,
              maxAge: 0
            })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

// Función para obtener la sesión actual en el servidor
export async function getServerSession() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Función para obtener el usuario actual en el servidor
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}