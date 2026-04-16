-- COMPARACIÓN DIRECTA: cog_chat_sessions vs cog_artifacts
-- ¿Por qué cog_artifacts funciona y cog_chat_sessions no?

SELECT 
    '=== COMPARACIÓN POLÍTICAS RLS ===' as titulo;

-- Mostrar TODAS las políticas de ambas tablas lado a lado
SELECT 
    tablename, 
    policyname, 
    cmd as comando,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check 
        ELSE qual 
    END as condicion,
    CASE
        WHEN cmd = 'INSERT' AND with_check IS NULL THEN '❌ SIN CONDICIÓN'
        WHEN cmd != 'INSERT' AND qual IS NULL THEN '❌ SIN CONDICIÓN'  
        ELSE '✅ CON CONDICIÓN'
    END as estado
FROM pg_policies 
WHERE tablename IN ('cog_chat_sessions', 'cog_artifacts')
ORDER BY tablename, 
    CASE cmd 
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2  
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
    END;

SELECT 
    '=== VERIFICAR RLS HABILITADO ===' as titulo;

-- Verificar RLS habilitado
SELECT 
    tablename, 
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('cog_chat_sessions', 'cog_artifacts')
ORDER BY tablename;
