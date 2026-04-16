-- =====================================================================
-- MIGRACIÓN: Corrección de Políticas RLS para article_batches
-- Fecha: 2026-01-20
-- Problema: Error "new row violates row-level security policy" 
--           al intentar crear lotes tras migración de BD
-- =====================================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (si existen)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_batches;
DROP POLICY IF EXISTS "Users can view batches from their projects" ON article_batches;
DROP POLICY IF EXISTS "Users can insert batches in their projects" ON article_batches;
DROP POLICY IF EXISTS "Users can update batches in their projects" ON article_batches;
DROP POLICY IF EXISTS "Users can delete batches in their projects" ON article_batches;

-- 2. CREAR FUNCIÓN AUXILIAR PARA VERIFICAR PERMISOS
-- Esta función verifica si el usuario tiene permisos en el proyecto
CREATE OR REPLACE FUNCTION user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si el usuario es owner del proyecto
  IF EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = p_project_id 
    AND p.owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar si el usuario es miembro del proyecto
  IF EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p_project_id 
    AND pm.user_id = auth.uid()
    AND pm.is_active_for_user = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR POLÍTICAS RLS PARA article_batches

-- Política SELECT: Ver lotes de proyectos donde el usuario tiene acceso
CREATE POLICY "Users can view batches from their projects"
ON article_batches
FOR SELECT
USING (user_has_project_access(project_id));

-- Política INSERT: Crear lotes en proyectos donde el usuario tiene acceso
-- CRÍTICO: Esta política permite la creación de lotes
CREATE POLICY "Users can insert batches in their projects"
ON article_batches
FOR INSERT
WITH CHECK (user_has_project_access(project_id));

-- Política UPDATE: Actualizar lotes de proyectos donde el usuario tiene acceso
CREATE POLICY "Users can update batches in their projects"
ON article_batches
FOR UPDATE
USING (user_has_project_access(project_id))
WITH CHECK (user_has_project_access(project_id));

-- Política DELETE: Eliminar lotes de proyectos donde el usuario tiene acceso
-- Solo si el usuario tiene permisos de gestión
CREATE POLICY "Users can delete batches in their projects"
ON article_batches
FOR DELETE
USING (
  user_has_project_access(project_id) 
  AND (
    -- Es owner del proyecto
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR
    -- Tiene permisos de gestión de lotes
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN project_roles pr ON pm.project_role_id = pr.id
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pr.can_create_batches = true
    )
  )
);

-- 4. VERIFICAR QUE RLS ESTÉ HABILITADO
ALTER TABLE article_batches ENABLE ROW LEVEL SECURITY;

-- 5. COMENTARIOS Y DOCUMENTACIÓN
COMMENT ON POLICY "Users can view batches from their projects" ON article_batches IS 
  'Permite ver lotes de proyectos donde el usuario es owner o miembro activo';

COMMENT ON POLICY "Users can insert batches in their projects" ON article_batches IS 
  'Permite crear lotes en proyectos donde el usuario tiene acceso (owner o miembro)';

COMMENT ON POLICY "Users can update batches in their projects" ON article_batches IS 
  'Permite actualizar lotes de proyectos donde el usuario tiene acceso';

COMMENT ON POLICY "Users can delete batches in their projects" ON article_batches IS 
  'Permite eliminar lotes solo a owners o usuarios con permiso can_create_batches';

COMMENT ON FUNCTION user_has_project_access(UUID) IS 
  'Función auxiliar que verifica si el usuario autenticado tiene acceso a un proyecto (owner o miembro activo)';

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
