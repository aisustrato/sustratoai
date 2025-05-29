"use server";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Database } from "@/lib/database.types";

// Crear un cliente de Supabase para el servidor
export async function createServerSupabaseClient() {
  // Obtener el almacén de cookies de forma síncrona
  const cookieStore = cookies();
  
  // Crear el cliente de Supabase para el servidor
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Configurar las cookies para el servidor
      cookies: {
        // Obtener una cookie por su nombre
        get(name) {
          // Usar el método síncrono para obtener cookies
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        // Establecer una cookie
        set(name, value, options) {
          // Usar el método síncrono para establecer cookies
          cookieStore.set({
            name,
            value,
            ...options as CookieOptions
          });
        },
        // Eliminar una cookie
        remove(name, options) {
          // Usar el método síncrono para eliminar cookies
          cookieStore.set({
            name,
            value: "",
            ...options as CookieOptions
          });
        },
      },
    }
  );
}

// Obtener la sesión actual del usuario
export async function getSession() {
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error al obtener la sesión:", error.message);
      return null;
    }
    return data.session;
  } catch (e) {
    console.error("Excepción al obtener la sesión:", e);
    return null;
  }
}

// Verificar si el usuario está autenticado
export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  return session;
}

// Obtener el usuario actual
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export { createServerClient };
