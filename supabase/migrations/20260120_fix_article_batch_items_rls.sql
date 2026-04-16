-- =====================================================================
-- MIGRACIÓN: Corrección de Políticas RLS para article_batch_items
-- Fecha: 2026-01-20
-- Problema: Complemento de la corrección de RLS para article_batches
--           Asegura que los items de lotes también tengan políticas correctas
-- =====================================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (si existen)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_batch_items;
DROP POLICY IF EXISTS "Users can view batch items from their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can insert batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can update batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can delete batch items in their projects" ON article_batch_items;

-- 2. CREAR POLÍTICAS RLS PARA article_batch_items

-- Política SELECT: Ver items de lotes donde el usuario tiene acceso al proyecto
CREATE POLICY "Users can view batch items from their projects"
ON article_batch_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM article_batches ab
    WHERE ab.id = article_batch_items.batch_id
    AND user_has_project_access(ab.project_id)
  )
);

-- Política INSERT: Crear items en lotes de proyectos donde el usuario tiene acceso
-- CRÍTICO: Esta política permite la creación de items de lotes
CREATE POLICY "Users can insert batch items in their projects"
ON article_batch_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM article_batches ab
    WHERE ab.id = article_batch_items.batch_id
    AND user_has_project_access(ab.project_id)
  )
);

-- Política UPDATE: Actualizar items de lotes donde el usuario tiene acceso
CREATE POLICY "Users can update batch items in their projects"
ON article_batch_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM article_batches ab
    WHERE ab.id = article_batch_items.batch_id
    AND user_has_project_access(ab.project_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM article_batches ab
    WHERE ab.id = article_batch_items.batch_id
    AND user_has_project_access(ab.project_id)
  )
);

-- Política DELETE: Eliminar items de lotes donde el usuario tiene permisos de gestión
CREATE POLICY "Users can delete batch items in their projects"
ON article_batch_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM article_batches ab
    WHERE ab.id = article_batch_items.batch_id
    AND user_has_project_access(ab.project_id)
    AND (
      -- Es owner del proyecto
      EXISTS (SELECT 1 FROM projects p WHERE p.id = ab.project_id AND p.owner_id = auth.uid())
      OR
      -- Tiene permisos de gestión de lotes
      EXISTS (
        SELECT 1 FROM project_members pm
        JOIN project_roles pr ON pm.project_role_id = pr.id
        WHERE pm.project_id = ab.project_id
        AND pm.user_id = auth.uid()
        AND pr.can_create_batches = true
      )
    )
  )
);

-- 3. VERIFICAR QUE RLS ESTÉ HABILITADO
ALTER TABLE article_batch_items ENABLE ROW LEVEL SECURITY;

-- 4. COMENTARIOS Y DOCUMENTACIÓN
COMMENT ON POLICY "Users can view batch items from their projects" ON article_batch_items IS 
  'Permite ver items de lotes de proyectos donde el usuario tiene acceso';

COMMENT ON POLICY "Users can insert batch items in their projects" ON article_batch_items IS 
  'Permite crear items en lotes de proyectos donde el usuario tiene acceso';

COMMENT ON POLICY "Users can update batch items in their projects" ON article_batch_items IS 
  'Permite actualizar items de lotes de proyectos donde el usuario tiene acceso';

COMMENT ON POLICY "Users can delete batch items in their projects" ON article_batch_items IS 
  'Permite eliminar items de lotes solo a owners o usuarios con permiso can_create_batches';

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
