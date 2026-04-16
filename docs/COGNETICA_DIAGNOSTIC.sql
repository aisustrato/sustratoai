-- ============================================================================
-- 🔍 DIAGNÓSTICO: Cognética - Verificación de project_id
-- ============================================================================
-- Este script diagnostica el estado actual de los artefactos y su relación
-- con proyectos para identificar por qué se muestran en todos los proyectos

-- 1. Ver todos los artefactos y sus project_id
SELECT 
    id,
    title,
    project_id,
    type,
    status,
    created_at
FROM cog_artifacts
ORDER BY created_at DESC;

-- 2. Contar artefactos por project_id (incluyendo NULL)
SELECT 
    project_id,
    COUNT(*) as total_artefactos,
    array_agg(DISTINCT type) as tipos,
    array_agg(DISTINCT status) as estados
FROM cog_artifacts
GROUP BY project_id
ORDER BY total_artefactos DESC;

-- 3. Ver artefactos con project_id NULL (huérfanos)
SELECT 
    id,
    title,
    type,
    status,
    created_at
FROM cog_artifacts
WHERE project_id IS NULL
ORDER BY created_at DESC;

-- 4. Ver proyectos existentes
SELECT 
    id,
    name,
    user_id,
    status,
    created_at
FROM cog_projects
ORDER BY created_at DESC;

-- 5. Ver relación entre artefactos y proyectos
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.user_id,
    COUNT(a.id) as total_artefactos
FROM cog_projects p
LEFT JOIN cog_artifacts a ON a.project_id = p.id
GROUP BY p.id, p.name, p.user_id
ORDER BY total_artefactos DESC;

-- ============================================================================
-- 🔧 CORRECCIÓN: Asignar artefactos huérfanos a un proyecto
-- ============================================================================
-- IMPORTANTE: Ejecutar SOLO después de revisar los resultados del diagnóstico

-- Opción A: Si hay UN SOLO proyecto, asignar todos los artefactos huérfanos a ese proyecto
-- DESCOMENTAR Y EJECUTAR SOLO SI APLICA:
/*
UPDATE cog_artifacts
SET project_id = (SELECT id FROM cog_projects LIMIT 1)
WHERE project_id IS NULL;
*/

-- Opción B: Si hay MÚLTIPLES proyectos, asignar a un proyecto específico
-- REEMPLAZAR 'PROJECT_ID_AQUI' con el ID del proyecto correcto
/*
UPDATE cog_artifacts
SET project_id = 'PROJECT_ID_AQUI'
WHERE project_id IS NULL;
*/

-- Opción C: Ver el primer usuario y su proyecto para asignar manualmente
SELECT 
    u.id as user_id,
    u.email,
    p.id as project_id,
    p.name as project_name
FROM auth.users u
LEFT JOIN cog_projects p ON p.user_id = u.id
ORDER BY u.created_at
LIMIT 5;

-- ============================================================================
-- ✅ VERIFICACIÓN POST-CORRECCIÓN
-- ============================================================================
-- Ejecutar después de aplicar la corrección para verificar

-- Verificar que no queden artefactos huérfanos
SELECT COUNT(*) as artefactos_sin_proyecto
FROM cog_artifacts
WHERE project_id IS NULL;

-- Debería retornar 0 si la corrección fue exitosa
