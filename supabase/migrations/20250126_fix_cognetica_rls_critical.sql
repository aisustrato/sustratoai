-- ============================================
-- 🚨 CORRECCIÓN CRÍTICA: Políticas RLS Cognetica
-- Fecha: 26 Enero 2026
-- Problema: Tabla cog_projects NO EXISTE - usar projects
-- ============================================

-- 🚨 PROBLEMA IDENTIFICADO CORREGIDO:
-- - La tabla 'cog_projects' NO EXISTE en la base de datos  
-- - La tabla CORRECTA es 'projects WHERE owner_id = auth.uid()'
-- - SQL_COGNETICA_ESTABILIZACION.sql tenía la referencia CORRECTA
-- - SQL_COG_CHAT_HISTORY.sql y otros archivos tenían referencias INCORRECTAS

-- ============================================
-- 1️⃣ CORREGIR cog_chat_sessions
-- ============================================

-- Eliminar políticas incorrectas (si existen)
DROP POLICY IF EXISTS "Users can view chat sessions of their projects" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Users can create chat sessions in their projects" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Users can update their chat sessions" ON cog_chat_sessions;
DROP POLICY IF EXISTS "Users can delete their chat sessions" ON cog_chat_sessions;

-- Crear políticas CORRECTAS que apuntan a 'projects' (tabla real)
CREATE POLICY "Users can view chat sessions of their projects"
    ON cog_chat_sessions FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chat sessions in their projects"
    ON cog_chat_sessions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their chat sessions"
    ON cog_chat_sessions FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their chat sessions"
    ON cog_chat_sessions FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- 2️⃣ CORREGIR cog_artifacts (si está mal)
-- ============================================

-- Eliminar políticas incorrectas (si existen)
DROP POLICY IF EXISTS "Users can view cog_artifacts" ON cog_artifacts;
DROP POLICY IF EXISTS "Users can create cog_artifacts" ON cog_artifacts;
DROP POLICY IF EXISTS "Users can update cog_artifacts" ON cog_artifacts;
DROP POLICY IF EXISTS "Users can delete cog_artifacts" ON cog_artifacts;

-- Crear políticas CORRECTAS que apuntan a 'projects' (tabla real)
CREATE POLICY "Users can view cog_artifacts"
    ON cog_artifacts FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create cog_artifacts"
    ON cog_artifacts FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update cog_artifacts"
    ON cog_artifacts FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete cog_artifacts"
    ON cog_artifacts FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- 3️⃣ VERIFICACIÓN POST-MIGRACIÓN
-- ============================================

-- Verificar que las políticas están correctas:
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('cog_chat_sessions', 'cog_artifacts')
-- ORDER BY tablename, cmd;

-- ============================================
-- 4️⃣ COMENTARIO CRÍTICO
-- ============================================

-- ⚠️  NUNCA MÁS usar 'projects WHERE owner_id' en políticas de Cognetica
-- ✅  SIEMPRE usar 'cog_projects WHERE user_id' en políticas de Cognetica
-- 🚨  Fallos RLS causan errores silenciosos - el usuario no se entera!
