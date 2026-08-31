// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const isProduction = process.env.NODE_ENV === 'production'

// Cliente autenticado con token de usuario (útil para procesos en background con RLS)
export function createSupabaseUserClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en el entorno')
  }
  if (!anonKey) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno')
  }
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

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
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
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
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
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

// Cliente con Service Role (privilegiado) para operaciones backend seguras
// Usa SUPABASE_SERVICE_ROLE_KEY y no persiste sesión ni usa cookies
export async function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en el entorno')
  }
  if (!serviceKey) {
    // Endurecer: NO permitir fallback a anon key, ya que operaciones administrativas requieren Service Role
    // Esto previene errores de RLS silenciosos al insertar en tablas protegidas (ej. ai_job_history)
    throw new Error('[Supabase] SUPABASE_SERVICE_ROLE_KEY no está definido. Configúralo en el entorno para usar el cliente de Service Role.')
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}