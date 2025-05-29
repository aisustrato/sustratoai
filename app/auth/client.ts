"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

// Obtener la URL base para redirecciones
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Valor por defecto para SSR
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// Crear un cliente de Supabase para el navegador con configuración mejorada
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = getBaseUrl();
  
  console.log('🔧 Configurando cliente Supabase:', {
    isProduction,
    baseUrl,
    supabaseUrl,
    nodeEnv: process.env.NODE_ENV
  });
  
  const domain = isProduction ? new URL(baseUrl).hostname : undefined;
  
  console.log('🍪 Configuración de cookies:', {
    domain,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax'
  });
  
  const clientOptions = {
    auth: {
      flowType: 'pkce' as const,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(key);
        },
      },
      storageKey: 'sb-auth-token',
    },
    cookieOptions: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 7 días
      domain: domain,
      path: '/',
      sameSite: 'lax' as const,
      secure: isProduction,
    }
  };

  console.log('🔍 Configuración final del cliente:', JSON.stringify(clientOptions, null, 2));
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    clientOptions
  );
}

// Iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  
  try {
    console.log('🔐 Intentando autenticar con:', { 
      email, 
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      env: process.env.NODE_ENV,
      baseUrl: getBaseUrl()
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔑 Respuesta de autenticación:', { data, error });
    
    // Si la autenticación es exitosa, redirigir manualmente
    if (data?.user && !error) {
      const redirectUrl = `${getBaseUrl()}/dashboard`;
      console.log('✅ Autenticación exitosa, redirigiendo a:', redirectUrl);
      window.location.href = redirectUrl;
    }

    if (error) {
      console.error('❌ Error de autenticación:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      });
      
      // Verificar si es un error de credenciales
      if (error.message.includes('Invalid login credentials')) {
        return { 
          data: null,
          error: {
            message: 'Correo o contraseña incorrectos',
            status: 401
          }
        };
      }
      
      return { 
        data: null,
        error: {
          message: error.message || 'Error al iniciar sesión',
          status: error.status || 400,
          details: error
        }
      };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Error inesperado en signInWithEmail:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      code: error?.code
    });
    
    return {
      data: null,
      error: {
        message: error?.message || 'Error inesperado al intentar iniciar sesión',
        status: 500,
        details: error
      }
    };
  }
}

// Cerrar sesión
export async function signOut() {
  const supabase = createBrowserSupabaseClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    // Limpiar almacenamiento local relacionado con la sesión
    if (typeof window !== 'undefined') {
      localStorage.removeItem('proyectoActualId');
      sessionStorage.clear();
    }
    
    // Forzar una recarga completa para limpiar el estado
    if (!error) {
      window.location.href = "/login";
    }
    
    return { error };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { error: { message: 'Error al cerrar sesión', status: 500 } };
  }
}

// Registrar un nuevo usuario
export async function signUp(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error en el registro:', error);
      return { 
        data: null,
        error: {
          message: error.message || 'Error al registrar el usuario',
          status: error.status || 400
        }
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error inesperado en signUp:', error);
    return {
      data: null,
      error: {
        message: 'Error inesperado al registrar el usuario',
        status: 500
      }
    };
  }
}

// Obtener la sesión actual
export async function getSession() {
  const supabase = createBrowserSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error al obtener la sesión:', error);
    return { session: null, error };
  }
  
  return { session, error: null };
}
