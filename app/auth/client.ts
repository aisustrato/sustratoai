// app/auth/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types"; // Asegúrate que la ruta sea correcta

// Obtener la URL base para redirecciones
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

// Crear un cliente de Supabase para el navegador con la configuración más simple posible
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // const isProduction = process.env.NODE_ENV === 'production'; // No se usa directamente en esta config simple
  
  const baseUrl = getBaseUrl();
  console.log('[AUTH_CLIENT_DEBUG_V3] Base URL:', baseUrl);
  console.log('[AUTH_CLIENT_DEBUG_V3] Node Env:', process.env.NODE_ENV);

  // --- PRUEBA DRÁSTICA #3: Sin cookieOptions personalizadas, sin storage personalizado ---
  const clientOptions = {
    auth: {
      flowType: 'pkce' as const,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      // NO auth.storage (dejar que @supabase/ssr use su default: cookies)
      // NO auth.storageKey
    },
    // NO cookieOptions explícitas (dejar que @supabase/ssr use sus defaults)
  };

  console.log('[AUTH_CLIENT_DEBUG_V3] Opciones finales para createBrowserClient (totalmente por defecto para storage/cookies):', JSON.stringify(clientOptions, null, 2));
  
  // Esta es la forma más "vainilla" de crear el cliente SSR para el navegador
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    clientOptions // Que ahora son mínimas
  );
}

// Iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  
  try {
    console.log('[AUTH_CLIENT_V3] Iniciando signInWithEmail con:', { 
      email: email.substring(0,3) + '...',
      appBaseUrl: getBaseUrl()
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[AUTH_CLIENT_V3] Error en supabase.auth.signInWithPassword:', {
        message: error.message, status: error.status, name: error.name,
      });
    } else {
      console.log('[AUTH_CLIENT_V3] Éxito en supabase.auth.signInWithPassword. User:', data.user?.id ? data.user.id.substring(0,8) + '...' : 'N/A', 'Session:', data.session ? 'Presente' : 'Ausente');
    }
    
    if (data?.user && !error) {
      console.log('[AUTH_CLIENT_V3] signInWithPassword exitoso. Esperando 100ms antes de redirigir...');
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      if (typeof document !== 'undefined') {
        const allCookies = document.cookie;
        console.log('[AUTH_CLIENT_DEBUG_V3] Cookies actuales en document.cookie (después de signIn, antes de redirect):', allCookies);
        if (allCookies.includes('sb-nnzjmsfllrdqxlrzrhur-auth-token')) { // Reemplaza con tu ID de proyecto REAL
            console.log('[AUTH_CLIENT_DEBUG_V3] ¡LA COOKIE DE SESIÓN SE ENCONTRÓ EN DOCUMENT.COOKIE ANTES DE REDIRIGIR!');
        } else {
            console.warn('[AUTH_CLIENT_DEBUG_V3] ADVERTENCIA: La cookie de sesión NO se encontró en document.cookie antes de redirigir.');
        }
      }

      const redirectUrl = `${getBaseUrl()}/`;
      console.log('[AUTH_CLIENT_V3] Autenticación exitosa (cliente), intentando redirigir a:', redirectUrl);
      window.location.href = redirectUrl;
    }

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { data: null, error: { message: 'Correo o contraseña incorrectos', status: 401 } };
      }
      return { data: null, error: { message: error.message || 'Error al iniciar sesión', status: error.status || 400, details: error }};
    }
    return { data, error: null };

  } catch (error: any) {
    console.error('[AUTH_CLIENT_V3] Error inesperado (catch) en signInWithEmail:', {
      message: error?.message, name: error?.name,
    });
    return {
      data: null, error: { message: error?.message || 'Error inesperado al intentar iniciar sesión', status: 500, details: error }
    };
  }
}

// Cerrar sesión
export async function signOut() {
  const supabase = createBrowserSupabaseClient();
  console.log('[AUTH_CLIENT_V3] Iniciando signOut...');
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AUTH_CLIENT_V3] Error en supabase.auth.signOut:', error.message);
    } else {
      console.log('[AUTH_CLIENT_V3] Éxito en supabase.auth.signOut.');
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = "/login";
    }
    return { error };
  } catch (error: any) {
    console.error('[AUTH_CLIENT_V3] Error inesperado (catch) en signOut:', error.message);
    return { error: { message: error?.message || 'Error al cerrar sesión', status: 500 } };
  }
}

// Registrar un nuevo usuario (signUp)
export async function signUp(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  console.log('[AUTH_CLIENT_V3] Iniciando signUp...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      console.error('[AUTH_CLIENT_V3] Error en supabase.auth.signUp:', error.message);
      return { data: null, error: { message: error.message || 'Error al registrar el usuario', status: error.status || 400 }};
    }
    console.log('[AUTH_CLIENT_V3] Éxito en supabase.auth.signUp. User:', data.user?.id, 'Session:', data.session ? 'Presente' : 'Ausente');
    return { data, error: null };
  } catch (error: any) {
    console.error('[AUTH_CLIENT_V3] Error inesperado (catch) en signUp:', error.message);
    return {
      data: null, error: { message: error?.message || 'Error inesperado al registrar el usuario', status: 500 }
    };
  }
}

// Obtener la sesión actual (getSession)
export async function getSession() {
  const supabase = createBrowserSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[AUTH_CLIENT_V3] Error en supabase.auth.getSession:', error.message);
    return { session: null, error };
  }
  return { session, error: null };
}