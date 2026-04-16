-- 📍 supabase/migrations/20260305_fix_chronological_data_delete_rls.sql
-- 🎯 PROPÓSITO: Permitir a MIEMBROS del proyecto borrar datos cronológicos (no solo owner)
-- 🔧 DECISIÓN: Alinear política DELETE con política INSERT (ambas para project_members)

-- Eliminar política restrictiva actual (solo owner)
DROP POLICY IF EXISTS "Users can delete chronological data" ON cog_chronological_data;

-- Crear nueva política DELETE para MIEMBROS del proyecto
CREATE POLICY "Project members can delete chronological data"
    ON cog_chronological_data
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = cog_chronological_data.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Comentario explicativo
COMMENT ON POLICY "Project members can delete chronological data" ON cog_chronological_data IS 
'Permite a miembros del proyecto borrar datos cronológicos. Alineado con política INSERT para consistencia.';
