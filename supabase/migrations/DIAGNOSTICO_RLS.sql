-- =====================================================================
-- SCRIPT DE DIAGNÓSTICO: Políticas RLS Actuales
-- Ejecuta esto en Supabase SQL Editor para ver el estado real
-- =====================================================================

-- 1. VER TODAS LAS POLÍTICAS EXISTENTES PARA article_batches
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
WHERE tablename = 'article_batches'
ORDER BY policyname;

-- 2. VER TODAS LAS POLÍTICAS EXISTENTES PARA preclass_dimensions (que SÍ funciona)
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
WHERE tablename = 'preclass_dimensions'
ORDER BY policyname;

-- 3. VERIFICAR SI RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('article_batches', 'preclass_dimensions', 'article_batch_items')
ORDER BY tablename;

-- 4. VERIFICAR SI LA FUNCIÓN user_has_project_access EXISTE
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'user_has_project_access';

-- 5. VER ESTRUCTURA DE article_batches
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'article_batches'
ORDER BY ordinal_position;

-- 6. PROBAR SI EL USUARIO ACTUAL PUEDE VER PROYECTOS
SELECT 
    id,
    name,
    owner_id,
    (owner_id = auth.uid()) as soy_owner
FROM projects
LIMIT 5;

-- 7. PROBAR SI EL USUARIO ES MIEMBRO DE ALGÚN PROYECTO
SELECT 
    pm.project_id,
    pm.user_id,
    pm.is_active_for_user,
    (pm.user_id = auth.uid()) as soy_yo,
    p.name as project_name
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.user_id = auth.uid()
LIMIT 5;

-- =====================================================================
-- EJECUTA ESTE SCRIPT Y COMPARTE LOS RESULTADOS
-- =====================================================================
