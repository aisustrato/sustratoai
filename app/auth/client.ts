// app/auth/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types"; // Asegúrate que la ruta sea correcta

// Obtener la URL base para redirecciones
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Valor por defecto para SSR o entornos sin window
  // En producción en Vercel, process.env.NEXT_PUBLIC_SITE_URL debería estar disponible
  // y ser https://sustratoai.vercel.app
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

// Crear un cliente de Supabase para el navegador con configuración mejorada
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const isProduction = process.env.NODE_ENV === 'production';
  
  const baseUrl = getBaseUrl();
  // Log crucial para depuración en producción
  console.log('[AUTH_CLIENT_DEBUG] Base URL:', baseUrl);
  console.log('[AUTH_CLIENT_DEBUG] isProduction:', isProduction);
  console.log('[AUTH_CLIENT_DEBUG] NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  console.log('[AUTH_CLIENT_DEBUG] NEXT_PUBLIC_VERCEL_URL (Vercel System Env):', process.env.NEXT_PUBLIC_VERCEL_URL);


  // --- Inicio de Prueba Drástica para cookieOptions ---
  let cookieOptionsForClient: {
    name: string;
    lifetime: number;
    path: string;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
    domain?: string; // El dominio es opcional
  } = {
    name: 'sb-auth-token', // Supabase añadirá el ID del proyecto a esto, ej: sb-IDPROYECTO-auth-token
    lifetime: 60 * 60 * 24 * 7, // 7 días
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
    // Por defecto, NO especificamos 'domain' para esta prueba.
    // El navegador debería asociarlo al host actual.
  };

  if (isProduction) {
    // En producción, para esta prueba, explícitamente NO definimos 'domain'.
    // Queremos que se aplique al host exacto (ej: sustratoai.vercel.app)
    console.log('[AUTH_CLIENT_DEBUG] Producción: Usando cookieOptions SIN "domain" explícito.');
    // cookieOptionsForClient.domain = undefined; // Redundante, ya que no está en el objeto inicial
  } else {
    // En desarrollo (localhost), 'domain' undefined es el comportamiento correcto.
    console.log('[AUTH_CLIENT_DEBUG] Desarrollo: Usando cookieOptions SIN "domain" explícito (localhost).');
    // cookieOptionsForClient.domain = undefined;
  }
  // --- Fin de Prueba Drástica para cookieOptions ---
  
  const clientOptions = {
    auth: {
      flowType: 'pkce' as const,
      autoRefreshToken: true,
      detectSessionInUrl: true, // Generalmente true para PKCE y callbacks
      persistSession: true,
      // Manteniendo tu storage de localStorage por ahora, pero es un punto a revisar si esto falla.
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          // console.log(`[AUTH_CLIENT_STORAGE] localStorage.getItem(${key})`);
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          // console.log(`[AUTH_CLIENT_STORAGE] localStorage.setItem(${key})`);
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          // console.log(`[AUTH_CLIENT_STORAGE] localStorage.removeItem(${key})`);
          localStorage.removeItem(key);
        },
      },
      storageKey: 'sb-auth-token', // Nombre de la clave para localStorage
    },
    cookieOptions: cookieOptionsForClient // Usar las opciones de cookie simplificadas/de prueba
  };

  console.log('[AUTH_CLIENT_DEBUG] Opciones finales para createBrowserClient:', JSON.stringify(clientOptions, (key, value) => key === "storage" ? "[localStorage adapter]" : value, 2));
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    clientOptions
  );
}

// Iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserSupabaseClient(); // Crea la instancia con las opciones de debug/prueba
  
  try {
    console.log('[AUTH_CLIENT] Iniciando signInWithEmail con:', { 
      email: email.substring(0,3) + '...', // No loguear email completo
      supabaseUrlConfigurado: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,20) + '...',
      envActual: process.env.NODE_ENV,
      appBaseUrl: getBaseUrl()
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Loguear la respuesta de Supabase
    if (error) {
      console.error('[AUTH_CLIENT] Error en supabase.auth.signInWithPassword:', {
        message: error.message,
        status: error.status,
        name: error.name,
        // No loguear error.stack en producción a menos que sea necesario para depuración muy específica
      });
    } else {
      console.log('[AUTH_CLIENT] Éxito en supabase.auth.signInWithPassword. User:', data.user?.id ? data.user.id.substring(0,8) + '...' : 'N/A', 'Session:', data.session ? 'Presente' : 'Ausente');
    }
    
    // La redirección y el manejo de errores ya están en tu código original.
    // El punto clave es si la cookie se establece *antes* de cualquier redirección.
    if (data?.user && !error) {
      const redirectUrl = `${getBaseUrl()}/`; // Redirigir a la raíz o dashboard
      console.log('[AUTH_CLIENT] Autenticación exitosa (cliente), intentando redirigir a:', redirectUrl);
      // Antes de redirigir, la cookie ya debería haber sido intentada establecer por @supabase/ssr
      // Dale un instante para que cualquier proceso asíncrono de establecimiento de cookie intente completarse.
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña demora
      window.location.href = redirectUrl; // Redirección manual
    }

    // Manejo de errores como lo tenías
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { 
          data: null,
          error: { message: 'Correo o contraseña incorrectos', status: 401 }
        };
      }
      return { 
        data: null,
        error: { message: error.message || 'Error al iniciar sesión', status: error.status || 400, details: error }
      };
    }

    return { data, error: null };

  } catch (error: any) {
    console.error('[AUTH_CLIENT] Error inesperado (catch) en signInWithEmail:', {
      message: error?.message,
      name: error?.name,
    });
    return {
      data: null,
      error: { message: error?.message || 'Error inesperado al intentar iniciar sesión', status: 500, details: error }
    };
  }
}

// Cerrar sesión
export async function signOut() {
  const supabase = createBrowserSupabaseClient();
  console.log('[AUTH_CLIENT] Iniciando signOut...');
  try {
    const { error } = await supabase.auth.signOut();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('proyectoActualId'); // Limpieza de tu app
      // No es necesario sessionStorage.clear() a menos que lo uses explícitamente para algo más.
      // @supabase/ssr debería manejar la limpieza de sus cookies con signOut.
    }
    
    if (error) {
      console.error('[AUTH_CLIENT] Error en supabase.auth.signOut:', error.message);
    } else {
      console.log('[AUTH_CLIENT] Éxito en supabase.auth.signOut.');
    }
    
    // Forzar redirección a login
    if (typeof window !== 'undefined') {
      window.location.href = "/login";
    }
    
    return { error };
  } catch (error: any) {
    console.error('[AUTH_CLIENT] Error inesperado (catch) en signOut:', error.message);
    return { error: { message: error?.message || 'Error al cerrar sesión', status: 500 } };
  }
}

// Registrar un nuevo usuario
export async function signUp(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  console.log('[AUTH_CLIENT] Iniciando signUp...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`, // Asegúrate que esta ruta de callback exista y maneje la sesión
      },
    });

    if (error) {
      console.error('[AUTH_CLIENT] Error en supabase.auth.signUp:', error.message);
      return { 
        data: null,
        error: { message: error.message || 'Error al registrar el usuario', status: error.status || 400 }
      };
    }
    console.log('[AUTH_CLIENT] Éxito en supabase.auth.signUp. User:', data.user?.id, 'Session:', data.session ? 'Presente' : 'Ausente');
    return { data, error: null };
  } catch (error: any) {
    console.error('[AUTH_CLIENT] Error inesperado (catch) en signUp:', error.message);
    return {
      data: null,
      error: { message: error?.message || 'Error inesperado al registrar el usuario', status: 500 }
    };
  }
}

// Obtener la sesión actual
export async function getSession() {
  // console.log('[AUTH_CLIENT] Solicitando getSession...'); // Puede ser muy verboso
  const supabase = createBrowserSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[AUTH_CLIENT] Error en supabase.auth.getSession:', error.message);
    return { session: null, error };
  }
  // if (session) {
  //   console.log('[AUTH_CLIENT] getSession encontró una sesión activa. User:', session.user.id);
  // } else {
  //   console.log('[AUTH_CLIENT] getSession: No hay sesión activa.');
  // }
  return { session, error: null };
}