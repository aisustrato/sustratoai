// Configuración de cliente Supabase
import { createClient, type AuthChangeEvent, type AuthSession, type User } from '@supabase/supabase-js';
import { Database } from './database.types';
import { cookies } from 'next/headers';

// Obtener variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const isProduction = process.env.NODE_ENV === 'production';

// Configuración común para todos los clientes
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    debug: !isProduction,
  },
  global: {
    headers: {
      'X-Client-Info': 'sustratoai-web/1.0.0',
    },
  },
  cookieOptions: {
    name: 'sb-auth-token',
    lifetime: 60 * 60 * 24 * 7, // 7 días
    domain: isProduction ? new URL(supabaseUrl).hostname.replace('www.', '') : undefined,
    path: '/',
    sameSite: 'lax' as const,
  }
};

// Crear cliente de navegador con configuración mejorada
const createBrowserSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, options);
};

export const supabase = typeof window !== 'undefined' 
  ? createBrowserSupabaseClient() 
  : createClient<Database>(supabaseUrl, supabaseAnonKey, options);

// Para el sandbox, vamos a crear un mock de Supabase
// Esto solo se usa en el entorno de desarrollo del sandbox
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
        select: (columns = "*") => ({
          order: (column: string, { ascending = true } = {}) => ({
            then: (callback: Function) => {
              callback({ data: mockFundaciones, error: null });
              return { data: mockFundaciones, error: null };
            },
          }),
          eq: (column: string, value: any) => ({
            maybeSingle: () => {
              const found = mockFundaciones.find(
                (f) => f[column as keyof typeof f] === value
              );
              return { data: found || null, error: null };
            },
          }),
        }),
        insert: (rows: any[]) => ({
          select: () => ({
            single: () => {
              const newId = mockFundaciones.length + 1;
              const newRow = { id: newId, ...rows[0] };
              mockFundaciones.push(newRow);
              return { data: newRow, error: null };
            },
          }),
        }),
      };
    }
    return {};
  },
  auth: {
    signInWithPassword: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const user = mockUsers.find(
        (u) => u.email === email && u.password === password
      );
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
    signUp: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
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
    onAuthStateChange: (callback: Function) => {
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
