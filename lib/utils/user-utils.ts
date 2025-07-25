/**
 * Obtiene el nombre de visualización más apropiado para un usuario
 * @param user Objeto de usuario de Supabase
 * @returns El nombre de visualización más apropiado
 */
export function getUserDisplayName(user: {
  email?: string | null;
  user_metadata?: {
    public_display_name?: string | null;
    name?: string | null;
    full_name?: string | null;
  } | null;
} | null | undefined): string {
  if (!user) return 'Usuario';
  
  // Obtener la parte del email antes del @ si es necesario
  const getEmailUsername = (email?: string | null) => {
    if (!email) return 'Usuario';
    return email.split('@')[0];
  };

  // Intentar obtener el mejor nombre disponible siguiendo el orden de prioridad
  const displayName = user.user_metadata?.public_display_name ||
                    user.user_metadata?.name ||
                    user.user_metadata?.full_name ||
                    (user.email ? getEmailUsername(user.email) : 'Usuario');

  // Capitalizar la primera letra para mejor presentación
  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
}
