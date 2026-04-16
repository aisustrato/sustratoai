-- ============================================
-- 🎯 REVERTIR política permisiva incorrecta y seguir patrón correcto
-- ============================================

-- 1. REVERTIR política permisiva incorrecta
DROP POLICY IF EXISTS "Auth users full access chat sessions" ON cog_chat_sessions;

-- 2. Las políticas restrictivas están correctas, el problema es en el código
-- No necesitamos políticas permisivas si verificamos permisos explícitamente

-- 3. Verificar que las políticas restrictivas están bien
SELECT 
    'Políticas actuales de cog_chat_sessions:' as info;
    
SELECT 
    policyname, 
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check 
        ELSE qual 
    END as condicion
FROM pg_policies 
WHERE tablename = 'cog_chat_sessions'
ORDER BY cmd;
