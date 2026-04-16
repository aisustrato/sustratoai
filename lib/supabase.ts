// Importar dinámicamente los clientes para evitar problemas con Server Components
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { supabase } from '@/app/auth/client'

// Configuración común
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const isProduction = process.env.NODE_ENV === 'production'
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

// Obtener dominio dinámicamente
const getDomain = () => {
  if (!isProduction) return 'localhost';
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || process.env.NEXT_PUBLIC_VERCEL_URL;
    if (url) return new URL(url).hostname.replace('www.', '');
    return new URL(supabaseUrl).hostname.replace('www.', '');
  } catch {
    return 'localhost';
  }
};

const domain = getDomain();

// ⚠️ DEPRECADO: Este cliente causaba conflictos de cookies con @/app/auth/client.ts
// ✅ USAR EN SU LUGAR: import { supabase } from '@/app/auth/client'
// 
// Cliente para el navegador (DEPRECADO - mantener solo para compatibilidad temporal)
// Este cliente NO debe usarse en nuevo código
export const supabase_DEPRECATED = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        if (typeof document === 'undefined') return null;
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`))
          ?.split('=')[1];
        return value ? decodeURIComponent(value) : null;
      },
      setItem: (key: string, value: string) => {
        if (typeof document === 'undefined') return;
        let cookieString = `${key}=${encodeURIComponent(value)}; path=/; samesite=lax`;
        if (domain) cookieString += `; domain=${domain}`;
        if (isProduction) cookieString += '; secure';
        document.cookie = cookieString;
      },
      removeItem: (key: string) => {
        if (typeof document === 'undefined') return;
        let cookieString = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        if (domain) cookieString += `; domain=${domain}`;
        document.cookie = cookieString;
      }
    }
  }
})

// ✅ Re-exportar el cliente oficial de @/app/auth/client.ts
// Esto asegura compatibilidad con código existente que importa desde aquí
export { supabase }

// Función para obtener el cliente del servidor
export async function createServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Este método solo debe usarse en el servidor')
  }
  
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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
        set(name: string, value: string, options: unknown) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...(options && typeof options === 'object' ? options as Record<string, unknown> : {}),
              domain,
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
              httpOnly: true
            })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: unknown) {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...(options && typeof options === 'object' ? options as Record<string, unknown> : {}), 
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

// Función de ayuda para obtener el cliente correcto según el entorno
export function getSupabase() {
  if (typeof window !== 'undefined') {
    return supabase
  }
  
  // En el servidor, se debe usar createServerClient()
  throw new Error('En el servidor, usa createServerClient() en lugar de getSupabase()')
}

// Para el sandbox, vamos a crear un mock de Supabase
const isSandbox =
  typeof window !== "undefined" &&
  window.location.hostname.includes("vercel.app");

// Mock de datos para el sandbox
const mockFundaciones = [
  {
    id: 1,
    codigo: "FR",
    nombre: "Fundación Las Rosas",
    descripcion: "Fundación dedicada al cuidado de adultos mayores",
  },
  {
    id: 2,
    codigo: "FS",
    nombre: "Fundación Sonrisas",
    descripcion: "Fundación enfocada en niños con discapacidad",
  },
  {
    id: 3,
    codigo: "FM",
    nombre: "Fundación Miradas",
    descripcion: "Apoyo a personas con discapacidad visual",
  },
];

// Mock de usuarios para el sandbox
const mockUsers = [
  {
    id: "1",
    email: "usuario@ejemplo.com",
    password: "password123",
  },
];

// Cliente mock para el sandbox
export const mockSupabase = {
  from: (table: string) => {
    if (table === "fundaciones") {
      return {
        select() {
          return {
            order() {
              return {
                then: (callback: (result: { data: unknown; error: Error | null }) => void) => {
                  callback({ data: mockFundaciones, error: null });
                  return { data: mockFundaciones, error: null };
                },
              };
            },
            eq(column: string, value: unknown) {
              return {
                maybeSingle() {
                  const found = mockFundaciones.find(
                    (f) => f[column as keyof typeof f] === value
                  );
                  return { data: found || null, error: null };
                },
              };
            },
          };
        },
        insert(rows: unknown[]) {
          return {
            select() {
              return {
                single() {
                  const newId = mockFundaciones.length + 1;
                  const rowData = rows[0] && typeof rows[0] === 'object' ? rows[0] as Record<string, unknown> : {};
                  // Aseguramos que los valores sean del tipo correcto
                  const newRow = { 
                    id: newId, 
                    codigo: typeof rowData.codigo === 'string' ? rowData.codigo : `F${newId.toString().padStart(3, '0')}`, 
                    nombre: typeof rowData.nombre === 'string' ? rowData.nombre : 'Nueva Fundación', 
                    descripcion: typeof rowData.descripcion === 'string' ? rowData.descripcion : 'Sin descripción',
                    ...rowData 
                  } as const;
                  mockFundaciones.push(newRow);
                  return { data: newRow, error: null };
                },
              };
            },
          };
        },
      };
    }
    return {};
  },
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const user = mockUsers.find((u) => u.email === email && u.password === password);
      if (user) {
        return {
          data: {
            user: { id: user.id, email: user.email },
            session: { user: { id: user.id, email: user.email } },
          },
          error: null,
        };
      }
      return {
        data: { user: null, session: null },
        error: { message: "Credenciales inválidas" },
      };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const exists = mockUsers.some((u) => u.email === email);
      if (exists) {
        return {
          data: { user: null, session: null },
          error: { message: "El usuario ya existe" },
        };
      }
      const newUser = { id: String(mockUsers.length + 1), email, password };
      mockUsers.push(newUser);
      return {
        data: {
          user: { id: newUser.id, email: newUser.email },
          session: { user: { id: newUser.id, email: newUser.email } },
        },
        error: null,
      };
    },
    signOut: async () => {
      return { error: null };
    },
    getSession: async () => {
      // Simulamos que no hay sesión activa por defecto
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      // Simulamos que no hay cambios de estado de autenticación
      return { data: { subscription: { unsubscribe: () => {} } }, error: null };
    },
  },
};

// Exportamos el cliente adecuado según el entorno
export const supabaseClient = isSandbox ? mockSupabase : supabase;

// Funciones de autenticación con manejo mejorado de errores
export async function signIn(email: string, password: string) {
  try {
    console.log('🔐 Iniciando sesión con:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Error al iniciar sesión:', error);
      throw error;
    }

    console.log('✅ Sesión iniciada correctamente');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error inesperado en signIn:', error);
    return { data: null, error };
  }
}

export async function signUp(email: string, password: string) {
  try {
    console.log('📝 Registrando nuevo usuario:', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('❌ Error al registrar usuario:', error);
      throw error;
    }

    console.log('✅ Usuario registrado correctamente');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error inesperado en signUp:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    console.log('🚪 Cerrando sesión...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }

    console.log('✅ Sesión cerrada correctamente');
    return { error: null };
  } catch (error) {
    console.error('❌ Error inesperado en signOut:', error);
    return { error };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener la sesión:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Error inesperado en getSession:', error);
    return { data: { session: null }, error };
  }
}
