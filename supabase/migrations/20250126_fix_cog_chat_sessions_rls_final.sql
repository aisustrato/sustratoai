-- ========================================================================
-- MIGRACIÓN: Política RLS para cog_chat_sessions (patrón dimension-actions.ts)
-- Fecha: 26 Enero 2026
-- Objetivo: Aplicar MISMO patrón de seguridad que cog_artifacts
-- ========================================================================

-- 1. Eliminar políticas existentes si las hay (limpieza)
DROP POLICY IF EXISTS "Miembros del proyecto ven chat sessions" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Users can manage chat sessions in their projects" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON cog_chat_sessions;

-- 2. Crear política RLS IGUAL que cog_artifacts
-- Esta política verifica que el usuario sea miembro del proyecto vía project_members
CREATE POLICY "Miembros del proyecto ven chat sessions"
    ON cog_chat_sessions 
    FOR ALL 
    USING (
        EXISTS ( 
            SELECT 1 
            FROM project_members pm
            WHERE pm.project_id = cog_chat_sessions.project_id 
              AND pm.user_id = auth.uid()
        )
    );

-- 3. Asegurar que RLS esté habilitado
ALTER TABLE cog_chat_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- VERIFICACIÓN: Ejecuta esto después de aplicar la migración
-- ========================================================================
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     permissive, 
--     roles, 
--     cmd, 
--     qual 
-- FROM pg_policies 
-- WHERE tablename = 'cog_chat_sessions';
