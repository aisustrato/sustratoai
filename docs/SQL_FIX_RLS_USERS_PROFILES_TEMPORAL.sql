-- 📍 docs/SQL_FIX_RLS_USERS_PROFILES_TEMPORAL.sql
-- 🎯 PROPÓSITO: Solución temporal para permitir UPDATE en users_profiles
-- 🔧 DECISIÓN: Política permisiva basada en permisos de proyecto
-- ⚠️ ADVERTENCIA: Esta es una solución TEMPORAL - idealmente debes migrar las políticas originales

-- ============================================================================
-- SOLUCIÓN TEMPORAL: Permitir UPDATE a usuarios con permisos
-- ============================================================================

-- Política para UPDATE: Permitir actualizar perfiles si el usuario tiene permisos en el proyecto
CREATE POLICY "Usuarios con permisos pueden actualizar perfiles de miembros"
ON public.users_profiles
FOR UPDATE
TO authenticated
USING (
    -- Permitir si el usuario autenticado tiene permiso can_manage_master_data
    -- en algún proyecto donde el perfil objetivo es miembro
    EXISTS (
        SELECT 1
        FROM project_members pm
        JOIN project_roles pr ON pm.project_role_id = pr.id
        WHERE pm.user_id = users_profiles.user_id
          AND pr.can_manage_master_data = true
          AND pm.project_id IN (
              SELECT project_id 
              FROM project_members 
              WHERE user_id = auth.uid()
          )
    )
)
WITH CHECK (
    -- Misma condición para verificar después del update
    EXISTS (
        SELECT 1
        FROM project_members pm
        JOIN project_roles pr ON pm.project_role_id = pr.id
        WHERE pm.user_id = users_profiles.user_id
          AND pr.can_manage_master_data = true
          AND pm.project_id IN (
              SELECT project_id 
              FROM project_members 
              WHERE user_id = auth.uid()
          )
    )
);

-- ============================================================================
-- ALTERNATIVA MÁS PERMISIVA (si la anterior no funciona)
-- ============================================================================
-- Descomentar SOLO si la política anterior es demasiado restrictiva

/*
CREATE POLICY "Usuarios autenticados pueden actualizar su propio perfil"
ON public.users_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Administradores pueden actualizar cualquier perfil"
ON public.users_profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM project_members pm
        JOIN project_roles pr ON pm.project_role_id = pr.id
        WHERE pm.user_id = auth.uid()
          AND pr.can_manage_master_data = true
    )
);
*/

-- ============================================================================
-- VERIFICACIÓN POST-APLICACIÓN
-- ============================================================================
-- Ejecutar después de crear la política para verificar que existe:

SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users_profiles' 
  AND cmd = 'UPDATE';
