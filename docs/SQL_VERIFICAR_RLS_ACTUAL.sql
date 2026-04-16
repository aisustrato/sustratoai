-- 📍 docs/SQL_VERIFICAR_RLS_ACTUAL.sql
-- 🎯 PROPÓSITO: Verificar estado actual de RLS en users_profiles (BASE NUEVA)
-- 🔧 DECISIÓN: Diagnosticar qué políticas existen actualmente
-- ⚠️ ADVERTENCIA: Ejecutar en la BASE NUEVA para ver qué falta

-- ============================================================================
-- VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users_profiles';

-- ============================================================================
-- LISTAR POLÍTICAS ACTUALES EN users_profiles
-- ============================================================================
SELECT 
    policyname AS "Nombre Política",
    cmd AS "Comando (SELECT/INSERT/UPDATE/DELETE)",
    roles AS "Roles",
    qual AS "Condición USING",
    with_check AS "Condición WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users_profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- VERIFICAR PERMISOS DE LA TABLA
-- ============================================================================
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'users_profiles'
ORDER BY grantee, privilege_type;

-- ============================================================================
-- DIAGNÓSTICO: ¿Por qué falla el UPDATE?
-- ============================================================================
-- Si RLS está habilitado pero NO hay política para UPDATE, 
-- entonces TODOS los updates fallarán silenciosamente.
--
-- Políticas típicas necesarias:
-- 1. SELECT: Para leer perfiles (ya funciona según logs)
-- 2. UPDATE: Para modificar perfiles (ESTO FALTA)
-- 3. INSERT: Para crear nuevos perfiles
-- 4. DELETE: Para eliminar perfiles (opcional)
