-- ========================================================================
-- CORRECCIÓN: RLS Policies para cog_essay_edit_history
-- ========================================================================
-- 🎯 PROPÓSITO: Corregir políticas RLS para permitir INSERT/SELECT con project_members
-- 🔧 DECISIÓN: Usar el patrón correcto de project_members como en otras tablas

-- Eliminar políticas incorrectas
DROP POLICY IF EXISTS "Users can view essay history from their projects" ON cog_essay_edit_history;
DROP POLICY IF EXISTS "Users can create essay versions in their projects" ON cog_essay_edit_history;

-- ========================================================================
-- POLÍTICAS SELECT (3 políticas para máxima compatibilidad)
-- ========================================================================

-- Política SELECT 1: Owner del proyecto puede ver historial
CREATE POLICY "Users can view essay history from their projects"
    ON cog_essay_edit_history
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM cog_artifacts a
            INNER JOIN projects p ON a.project_id = p.id
            WHERE a.id = cog_essay_edit_history.artifact_id
            AND p.owner_id = auth.uid()
        )
    );

-- Política SELECT 2: Miembros del proyecto pueden ver historial
CREATE POLICY "Project members can view essay history"
    ON cog_essay_edit_history
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM cog_artifacts a
            INNER JOIN project_members pm ON a.project_id = pm.project_id
            WHERE a.id = cog_essay_edit_history.artifact_id
            AND pm.user_id = auth.uid()
        )
    );

-- Política SELECT 3: Acceso vía project_members (patrón alternativo)
CREATE POLICY "Users can access essay history"
    ON cog_essay_edit_history
    FOR SELECT
    TO public
    USING (
        artifact_id IN (
            SELECT a.id FROM cog_artifacts a
            INNER JOIN project_members pm ON a.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- ========================================================================
-- POLÍTICA INSERT
-- ========================================================================

-- Política INSERT: Miembros del proyecto pueden crear versiones
CREATE POLICY "Users can insert essay versions"
    ON cog_essay_edit_history
    FOR INSERT
    TO public
    WITH CHECK (
        artifact_id IN (
            SELECT a.id FROM cog_artifacts a
            INNER JOIN project_members pm ON a.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- ⚠️ NO hay política de UPDATE ni DELETE - tabla es append-only

-- Grant permisos para usuarios autenticados
GRANT SELECT, INSERT ON cog_essay_edit_history TO authenticated;

-- Comentario para documentación
COMMENT ON TABLE cog_essay_edit_history IS 'Historial append-only de ediciones de ensayos destilados. RLS: Acceso vía project_members. Solo INSERT y SELECT permitidos.';
