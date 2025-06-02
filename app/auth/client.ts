// app/auth/client.ts
// Versión: 4.1 (Corrección de importación de tipos User y Session)
"use client";

import { createBrowserClient } from "@supabase/ssr";
// MODIFICACIÓN V4.1: Importar User y Session desde @supabase/supabase-js
import { type User, type Session } from "@supabase/supabase-js"; 
import { Database } from "@/lib/database.types"; // Asegúrate que la ruta sea correcta

// Definición de los tipos de retorno esperados para mayor claridad
interface AuthResponse {
  data: { user: User | null; session: Session | null; } | null;
  error: { message: string; status?: number; details?: any; } | null;
}

interface SignOutResponse {
  error: { message: string; status?: number; details?: any; } | null;
}


// Obtener la URL base para redirecciones (se mantiene por si se usa en emailRedirectTo de signUp)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; 
};

const LOG_PREFIX_CLIENT = '[AUTH_CLIENT_V4.1]'; // Actualizado a V4.1

// Crear un cliente de Supabase para el navegador
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const clientOptions = {
    auth: {
      flowType: 'pkce' as const,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  };
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    clientOptions
  );
}

// Iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const supabase = createBrowserSupabaseClient();
  
  try {
    console.log(`${LOG_PREFIX_CLIENT} Iniciando signInWithEmail con: {email: ${email.substring(0,3)}...}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error(`${LOG_PREFIX_CLIENT} Error en supabase.auth.signInWithPassword:`, {
        message: error.message, status: error.status, name: error.name,
      });
      if (error.message.includes('Invalid login credentials')) {
        return { data: null, error: { message: 'Correo o contraseña incorrectos', status: 401 } };
      }
      return { data: null, error: { message: error.message || 'Error al iniciar sesión', status: error.status || 400, details: error }};
    } 
    
    console.log(`${LOG_PREFIX_CLIENT} Éxito en supabase.auth.signInWithPassword. User: ${data.user?.id ? data.user.id.substring(0,8) + '...' : 'N/A'}, Session: ${data.session ? 'Presente' : 'Ausente'}`);
    
    return { data, error: null };

  } catch (error: any) {
    console.error(`${LOG_PREFIX_CLIENT} Error inesperado (catch) en signInWithEmail:`, {
      message: error?.message, name: error?.name,
    });
    return {
      data: null, error: { message: error?.message || 'Error inesperado al intentar iniciar sesión', status: 500, details: error }
    };
  }
}

// Cerrar sesión
export async function signOut(): Promise<SignOutResponse> {
  const supabase = createBrowserSupabaseClient();
  console.log(`${LOG_PREFIX_CLIENT} Iniciando signOut...`);
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error(`${LOG_PREFIX_CLIENT} Error en supabase.auth.signOut:`, error.message);
      return { error: { message: error.message, status: (error as any).status || 400 } };
    } 
    
    console.log(`${LOG_PREFIX_CLIENT} Éxito en supabase.auth.signOut.`);
    return { error: null }; 

  } catch (error: any) {
    console.error(`${LOG_PREFIX_CLIENT} Error inesperado (catch) en signOut:`, error.message);
    return { error: { message: error?.message || 'Error al cerrar sesión', status: 500 } };
  }
}

// Registrar un nuevo usuario (signUp)
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  const supabase = createBrowserSupabaseClient();
  console.log(`${LOG_PREFIX_CLIENT} Iniciando signUp...`);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`, 
      },
    });

    if (error) {
      console.error(`${LOG_PREFIX_CLIENT} Error en supabase.auth.signUp:`, error.message);
      return { data: null, error: { message: error.message || 'Error al registrar el usuario', status: error.status || 400 }};
    }
    console.log(`${LOG_PREFIX_CLIENT} Éxito en supabase.auth.signUp. User: ${data.user?.id ? data.user.id.substring(0,8) + '...' : 'N/A'}, Session: ${data.session ? 'Presente' : 'Ausente'}`);
    return { data, error: null };
  } catch (error: any) {
    console.error(`${LOG_PREFIX_CLIENT} Error inesperado (catch) en signUp:`, error.message);
    return {
      data: null, error: { message: error?.message || 'Error inesperado al registrar el usuario', status: 500 }
    };
  }
}

// Obtener la sesión actual (getSession)
export async function getSession(): Promise<{ session: Session | null; error: any | null; }> {
  const supabase = createBrowserSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error(`${LOG_PREFIX_CLIENT} Error en supabase.auth.getSession:`, error.message);
  }
  return { session, error };
}