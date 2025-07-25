'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/auth-provider';
import { createBrowserClient } from '@supabase/ssr';
import type { UserProfile } from '@/lib/actions/project-dashboard-actions';

/**
 * Hook personalizado para obtener y gestionar el perfil extendido del usuario
 * @returns El perfil extendido del usuario y el estado de carga
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error al cargar el perfil del usuario:', error);
          setProfile(null);
        } else {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Error inesperado al cargar el perfil:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  return { profile, loading };
}

/**
 * Función para obtener el nombre de visualización más apropiado para un usuario
 * @param user Objeto de usuario de Supabase
 * @param profile Perfil extendido del usuario (opcional)
 * @returns El nombre de visualización más apropiado
 */
export function getUserDisplayName(
  user: {
    email?: string | null;
    user_metadata?: {
      public_display_name?: string | null;
      name?: string | null;
      full_name?: string | null;
    } | null;
  } | null | undefined,
  profile?: UserProfile | null
): string {
  if (!user) return 'Usuario';

  // Obtener la parte del email antes del @ si es necesario
  const getEmailUsername = (email?: string | null) => {
    if (!email) return 'Usuario';
    return email.split('@')[0];
  };

  // Intentar obtener el mejor nombre disponible siguiendo el orden de prioridad
  let displayName: string | null | undefined;
  
  // 1. Usar el perfil extendido si está disponible
  if (profile) {
    // Intentar con public_display_name primero
    if (profile.public_display_name) {
      displayName = profile.public_display_name;
    } 
    // Luego intentar con first_name + last_name
    else if (profile.first_name) {
      displayName = profile.first_name;
      if (profile.last_name) {
        displayName += ` ${profile.last_name}`;
      }
    }
  }
  
  // 2. Si no hay nombre del perfil, intentar con los metadatos de autenticación
  if (!displayName && user?.user_metadata) {
    displayName = user.user_metadata.public_display_name || 
                 user.user_metadata.name || 
                 user.user_metadata.full_name || null;
  }
  
  // 3. Si aún no hay nombre, usar el email como último recurso
  if (!displayName && user?.email) {
    displayName = getEmailUsername(user.email);
  }
  
  // Asegurarse de que siempre haya un valor de retorno
  displayName = displayName || 'Usuario';

  // Capitalizar la primera letra para mejor presentación
  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
}
