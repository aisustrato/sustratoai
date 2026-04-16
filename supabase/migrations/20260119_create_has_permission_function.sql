-- ========================================================================
-- FUNCIÓN RPC: has_permission_in_project
-- ========================================================================
-- Esta función verifica si un usuario tiene un permiso específico en un proyecto
-- Es utilizada por dimension-actions.ts y otros módulos para validar permisos
-- ========================================================================

CREATE OR REPLACE FUNCTION has_permission_in_project(
    p_user_id UUID,
    p_project_id UUID,
    p_permission_column TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_has_permission BOOLEAN := false;
BEGIN
    -- Verificar que el usuario es miembro del proyecto y tiene el permiso específico
    EXECUTE format(
        'SELECT COALESCE(pr.%I, false)
         FROM project_members pm
         JOIN project_roles pr ON pm.project_role_id = pr.id
         WHERE pm.project_id = $1
           AND pm.user_id = $2
           AND pm.is_active_for_user = true',
        p_permission_column
    )
    INTO v_has_permission
    USING p_project_id, p_user_id;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$;

-- ========================================================================
-- COMENTARIO DE LA FUNCIÓN
-- ========================================================================
COMMENT ON FUNCTION has_permission_in_project IS 
'Verifica si un usuario tiene un permiso específico en un proyecto.
Parámetros:
  - p_user_id: UUID del usuario
  - p_project_id: UUID del proyecto
  - p_permission_column: Nombre de la columna de permiso en project_roles (ej: can_manage_master_data)
Retorna: true si el usuario tiene el permiso, false en caso contrario';

-- ========================================================================
-- GRANT PARA USUARIOS AUTENTICADOS
-- ========================================================================
GRANT EXECUTE ON FUNCTION has_permission_in_project(UUID, UUID, TEXT) TO authenticated;
