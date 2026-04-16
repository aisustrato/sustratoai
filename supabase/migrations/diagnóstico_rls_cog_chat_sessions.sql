-- ============================================
-- 🔍 DIAGNÓSTICO RLS: cog_chat_sessions 
-- Fecha: 26 Enero 2026
-- ============================================

-- 🚨 INVESTIGAR: Por qué cog_chat_sessions falla cuando otras tablas funcionan
-- - project_id problemático: '60a80290-6f28-41a5-b155-420dee98597d'
-- - Error: "new row violates row-level security policy"

-- ============================================
-- 1️⃣ VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('cog_chat_sessions', 'cog_artifacts', 'cog_fractal_seeds')
ORDER BY tablename;

-- ============================================
-- 2️⃣ VER POLÍTICAS RLS ACTUALES
-- ============================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd AS command,
    qual AS condition,
    with_check
FROM pg_policies 
WHERE tablename IN ('cog_chat_sessions', 'cog_artifacts') 
ORDER BY tablename, cmd;

-- ============================================
-- 3️⃣ VERIFICAR PROYECTO ESPECÍFICO
-- ============================================
-- Ver si el proyecto existe y quién es el owner
SELECT 
    id,
    name,
    owner_id,
    (owner_id = auth.uid()) as soy_owner
FROM projects 
WHERE id = '60a80290-6f28-41a5-b155-420dee98597d';

-- ============================================
-- 4️⃣ VERIFICAR USUARIO ACTUAL
-- ============================================
SELECT 
    auth.uid() as mi_user_id,
    auth.role() as mi_role;

-- ============================================
-- 5️⃣ PROBAR QUERY MANUAL DE INSERCIÓN
-- ============================================
-- PROBAR: ¿Funciona una inserción manual?
-- DESCOMENTA Y EJECUTA SOLO SI ES SEGURO:
/*
INSERT INTO cog_chat_sessions (
    artifact_id,
    project_id,
    session_title,
    messages,
    total_messages
) VALUES (
    '60a343a4-070f-470d-a3e9-21977843e2a8',
    '60a80290-6f28-41a5-b155-420dee98597d', 
    'Test RLS',
    '[]'::jsonb,
    0
);
*/

-- ============================================
-- 6️⃣ VERIFICAR OTRAS TABLAS COGNETICA
-- ============================================
-- Ver políticas de tabla que SÍ funciona
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd AS command,
    qual AS condition
FROM pg_policies 
WHERE tablename = 'cog_artifacts'
ORDER BY cmd;
