-- 📍 docs/SQL_EXTRAER_RLS_USERS_PROFILES.sql
-- 🎯 PROPÓSITO: Extraer políticas RLS de users_profiles de la base antigua
-- 🔧 DECISIÓN: Query para copiar y ejecutar en Supabase SQL Editor de la BASE ANTIGUA
-- ⚠️ ADVERTENCIA: Ejecutar en la BASE ANTIGUA (La Momia) para obtener las políticas

-- ============================================================================
-- QUERY PARA EXTRAER POLÍTICAS RLS DE users_profiles
-- ============================================================================
-- Ejecutar en: Supabase SQL Editor de la BASE ANTIGUA
-- Resultado: Código SQL para recrear las políticas en la base nueva

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users_profiles'
ORDER BY policyname;

-- ============================================================================
-- QUERY ALTERNATIVA: Generar DDL completo de las políticas
-- ============================================================================
-- Esta query genera el código SQL listo para copiar y pegar

SELECT 
    'CREATE POLICY ' || quote_ident(policyname) || 
    ' ON ' || quote_ident(schemaname) || '.' || quote_ident(tablename) ||
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN ' AS PERMISSIVE'
        ELSE ' AS RESTRICTIVE'
    END ||
    ' FOR ' || cmd ||
    ' TO ' || array_to_string(roles, ', ') ||
    CASE 
        WHEN qual IS NOT NULL THEN ' USING (' || qual || ')'
        ELSE ''
    END ||
    CASE 
        WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')'
        ELSE ''
    END ||
    ';' AS policy_ddl
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users_profiles'
ORDER BY policyname;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 1. Conectarte a la BASE ANTIGUA (La Momia) en Supabase Dashboard
-- 2. Ir a SQL Editor
-- 3. Ejecutar la segunda query (la que genera DDL)
-- 4. Copiar el resultado (código SQL generado)
-- 5. Ejecutar ese código en la BASE NUEVA
-- 6. Verificar que las políticas se crearon correctamente
