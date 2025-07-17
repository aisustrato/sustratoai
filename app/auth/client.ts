// RUTA: app/auth/client.ts
// VERSIÓN: 5.0 (Implementación de Singleton)
'use client';

import { createBrowserClient } from "@supabase/ssr";
import { type User, type Session } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const LOG_PREFIX_CLIENT = '[AUTH_CLIENT_V5.0]';

// ========================================================================
// ✅ PASO 1: CREACIÓN DE LA INSTANCIA ÚNICA (SINGLETON)
// El cliente se crea UNA SOLA VEZ y se exporta para ser reutilizado.
// ========================================================================
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce' as const,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
);

// ========================================================================
// ✅ PASO 2: LAS FUNCIONES AHORA USAN LA INSTANCIA COMPARTIDA
// Ya no llaman a createBrowserSupabaseClient() internamente.
// ========================================================================

interface AuthResponse {
  data: { user: User | null; session: Session | null; } | null;
  error: { message: string; status?: number; } | null;
}

interface SignOutResponse {
  error: { message: string; status?: number; } | null;
}

// Iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log(`${LOG_PREFIX_CLIENT} Iniciando signInWithEmail...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error(`${LOG_PREFIX_CLIENT} Error en signInWithPassword:`, error.message);
      return { data: null, error: { message: 'Correo o contraseña incorrectos', status: 401 } };
    }
    
    console.log(`${LOG_PREFIX_CLIENT} Éxito en signInWithPassword.`);
    return { data, error: null };

  } catch (error: any) {
    console.error(`${LOG_PREFIX_CLIENT} Error inesperado en signInWithEmail:`, error.message);
    return { data: null, error: { message: 'Error inesperado al iniciar sesión', status: 500 } };
  }
}

// Cerrar sesión
export async function signOut(): Promise<SignOutResponse> {
  try {
    console.log(`${LOG_PREFIX_CLIENT} Iniciando signOut...`);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error(`${LOG_PREFIX_CLIENT} Error en signOut:`, error.message);
      return { error: { message: error.message, status: (error as any).status || 400 } };
    }
    
    console.log(`${LOG_PREFIX_CLIENT} Éxito en signOut.`);
    return { error: null };

  } catch (error: any) {
    console.error(`${LOG_PREFIX_CLIENT} Error inesperado en signOut:`, error.message);
    return { error: { message: 'Error al cerrar sesión', status: 500 } };
  }
}

// (Las funciones signUp y getSession también usarían la instancia compartida 'supabase')
// Se omiten por brevedad, pero deben seguir el mismo patrón.

// Registrar un nuevo usuario (signUp)
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log(`${LOG_PREFIX_CLIENT} Iniciando signUp...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error(`${LOG_PREFIX_CLIENT} Error en signUp:`, error.message);
      return { data: null, error: { message: error.message, status: (error as any).status || 400 } };
    }

    console.log(`${LOG_PREFIX_CLIENT} Éxito en signUp.`);
    return { data, error: null };

  } catch (error: any) {
    console.error(`${LOG_PREFIX_CLIENT} Error inesperado en signUp:`, error.message);
    return { data: null, error: { message: 'Error inesperado al registrar usuario', status: 500 } };
  }
}

// Obtener la sesión actual (getSession)
export async function getSession(): Promise<{ session: Session | null; error: any | null; }> {
  // Esta función ahora utiliza la instancia 'supabase' exportada (singleton)
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error(`${LOG_PREFIX_CLIENT} Error en supabase.auth.getSession:`, error.message);
  }
  return { session, error };
}