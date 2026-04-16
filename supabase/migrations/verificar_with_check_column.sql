-- ============================================
-- 🔍 VERIFICAR COLUMNA CORRECTA: with_check
-- ============================================

-- 🚨 IMPORTANTE: Para políticas INSERT se usa 'with_check', NO 'qual'
-- qual = SELECT, UPDATE, DELETE (USING)
-- with_check = INSERT (WITH CHECK)

-- ============================================
-- QUERY CORRECTA: Mostrar with_check
-- ============================================

SELECT 
    policyname, 
    cmd,
    qual,           -- Para SELECT, UPDATE, DELETE
    with_check      -- 👈 ESTA es la columna correcta para INSERT
FROM pg_policies 
WHERE tablename = 'cog_chat_sessions'
ORDER BY cmd;

-- ============================================
-- VERIFICAR ESPECÍFICAMENTE INSERT
-- ============================================

SELECT 
    policyname,
    cmd,
    with_check AS condicion_insert
FROM pg_policies 
WHERE tablename = 'cog_chat_sessions' 
  AND cmd = 'INSERT';

-- ============================================
-- DEBUG: Si with_check está vacío, recrear política
-- ============================================

-- Si el resultado anterior muestra with_check = null, ejecutar:
/*
DROP POLICY IF EXISTS "Users can create chat sessions in their projects" ON cog_chat_sessions;

CREATE POLICY "Users can create chat sessions in their projects"
    ON cog_chat_sessions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );
*/
