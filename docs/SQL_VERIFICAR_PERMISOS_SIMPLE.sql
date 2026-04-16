-- ========================================================================
-- 🔍 VERIFICACIÓN SIMPLE DE PERMISOS (SIN user_profiles)
-- ========================================================================
-- Este script verifica tu acceso sin depender de user_profiles
-- ========================================================================

-- 🧑 PASO 1: MI USUARIO ACTUAL
-- ========================================================================
SELECT 
    '🧑 MI USUARIO ACTUAL' as seccion,
    au.id as user_id,
    au.email,
    au.last_sign_in_at as ultimo_acceso
FROM auth.users au
WHERE au.id = auth.uid();

-- 📁 PASO 2: MIS PROYECTOS Y ROLES
-- ========================================================================
SELECT 
    '📁 MIS PROYECTOS' as seccion,
    p.id as project_id,
    p.name as proyecto_nombre,
    pm.project_role_id,
    pr.role_name as rol_nombre,
    pr.can_manage_master_data as ✅_puedo_crear_dimensiones,
    pr.can_create_batches,
    pr.can_bulk_edit_master_data,
    pm.is_active_for_user as mi_membresia_activa,
    pm.joined_at as fecha_union
FROM public.project_members pm
JOIN public.projects p ON pm.project_id = p.id
JOIN public.project_roles pr ON pm.project_role_id = pr.id
WHERE pm.user_id = auth.uid()
ORDER BY pm.joined_at DESC;

-- 🔑 PASO 3: VERIFICAR PROYECTO ESPECÍFICO
-- ========================================================================
-- ⚠️ REEMPLAZA EL UUID CON TU PROJECT_ID REAL (del PASO 2)
SELECT 
    '🔑 VALIDACIÓN PROYECTO ESPECÍFICO' as seccion,
    p.id as project_id,
    p.name as proyecto_nombre,
    p.status as estado_proyecto,
    CASE 
        WHEN pm.user_id IS NOT NULL THEN '✅ SÍ TENGO ACCESO'
        ELSE '❌ NO TENGO ACCESO'
    END as resultado_acceso,
    pr.role_name as mi_rol,
    pr.can_manage_master_data as puedo_crear_dimensiones,
    pm.is_active_for_user as mi_membresia_activa
FROM public.projects p
LEFT JOIN public.project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
LEFT JOIN public.project_roles pr ON pm.project_role_id = pr.id
WHERE p.id = '61918743-16a4-4ab5-8378-83fb42e99a61'; -- ⚠️ REEMPLAZAR CON TU PROJECT_ID

-- 📊 PASO 4: TODOS LOS ROLES DEL SISTEMA
-- ========================================================================
SELECT 
    '📊 ROLES DISPONIBLES' as seccion,
    pr.id as role_id,
    pr.role_name,
    pr.can_manage_master_data as ✅_crear_dimensiones,
    pr.can_create_batches as ✅_crear_lotes,
    pr.can_bulk_edit_master_data as ✅_edicion_masiva,
    pr.can_upload_files as ✅_subir_archivos,
    p.name as proyecto
FROM public.project_roles pr
JOIN public.projects p ON pr.project_id = p.id
ORDER BY p.name, pr.role_name;

-- ========================================================================
-- 📝 INSTRUCCIONES:
-- ========================================================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Revisa el PASO 2 para ver tus proyectos
-- 3. Copia el project_id del proyecto donde quieres crear dimensiones
-- 4. Reemplaza el UUID en el PASO 3 con ese project_id
-- 5. Ejecuta de nuevo y comparte los resultados
-- ========================================================================
