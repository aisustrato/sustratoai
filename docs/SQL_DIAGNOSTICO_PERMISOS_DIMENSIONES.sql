-- ========================================================================
-- 🔍 DIAGNÓSTICO DE PERMISOS PARA CREACIÓN DE DIMENSIONES
-- ========================================================================
-- Este script verifica:
-- 1. Tu usuario actual (user_id y email)
-- 2. Proyectos a los que tienes acceso
-- 3. Tu rol en cada proyecto
-- 4. Permisos específicos (can_manage_master_data)
-- 5. Validación del project_id que estás intentando usar
-- ========================================================================

-- 🧑 PASO 1: IDENTIFICAR MI USUARIO ACTUAL
-- ========================================================================
SELECT 
    '🧑 MI USUARIO ACTUAL' as seccion,
    au.id as user_id,
    au.email,
    up.full_name,
    au.last_sign_in_at as ultimo_acceso
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = auth.uid();

-- 📁 PASO 2: MIS PROYECTOS Y ROLES
-- ========================================================================
SELECT 
    '📁 MIS PROYECTOS' as seccion,
    p.id as project_id,
    p.name as proyecto_nombre,
    pm.project_role_id,
    pr.name as rol_nombre,
    pr.can_manage_master_data as permiso_gestionar_dimensiones,
    pr.can_create_batches,
    pr.can_review_articles,
    pm.is_active_for_user as activo,
    pm.joined_at as fecha_union
FROM public.project_members pm
JOIN public.projects p ON pm.project_id = p.id
JOIN public.project_roles pr ON pm.project_role_id = pr.id
WHERE pm.user_id = auth.uid()
ORDER BY pm.joined_at DESC;

-- 🔑 PASO 3: VERIFICAR PROYECTO ESPECÍFICO
-- ========================================================================
-- Reemplaza 'TU_PROJECT_ID_AQUI' con el ID del proyecto que estás usando
SELECT 
    '🔑 VALIDACIÓN PROYECTO ESPECÍFICO' as seccion,
    p.id as project_id,
    p.name as proyecto_nombre,
    p.status as estado_proyecto,
    CASE 
        WHEN pm.user_id IS NOT NULL THEN '✅ SÍ'
        ELSE '❌ NO'
    END as tengo_acceso,
    pr.name as mi_rol,
    pr.can_manage_master_data as puedo_gestionar_dimensiones,
    pm.is_active_for_user as mi_membresia_activa
FROM public.projects p
LEFT JOIN public.project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
LEFT JOIN public.project_roles pr ON pm.project_role_id = pr.id
WHERE p.id = '61918743-16a4-4ab5-8378-83fb42e99a61'; -- ⚠️ REEMPLAZAR CON TU PROJECT_ID

-- 🎯 PASO 4: VERIFICAR FUNCIÓN RPC DE PERMISOS
-- ========================================================================
-- Esta es la función que usa el código para verificar permisos
SELECT 
    '🎯 PRUEBA RPC has_permission_in_project' as seccion,
    has_permission_in_project(
        auth.uid(),
        '61918743-16a4-4ab5-8378-83fb42e99a61'::uuid, -- ⚠️ REEMPLAZAR CON TU PROJECT_ID
        'can_manage_master_data'
    ) as resultado_rpc;

-- 📊 PASO 5: RESUMEN DE TODOS LOS ROLES DISPONIBLES
-- ========================================================================
SELECT 
    '📊 ROLES DISPONIBLES EN EL SISTEMA' as seccion,
    id as role_id,
    name as rol_nombre,
    can_manage_master_data,
    can_create_batches,
    can_review_articles,
    can_manage_members,
    can_manage_project_settings
FROM public.project_roles
ORDER BY name;

-- 🔍 PASO 6: VERIFICAR FASES DEL PROYECTO
-- ========================================================================
SELECT 
    '🔍 FASES DEL PROYECTO' as seccion,
    ph.id as phase_id,
    ph.name as fase_nombre,
    ph.project_id,
    ph.status as estado_fase,
    ph.is_active as fase_activa,
    COUNT(pd.id) as dimensiones_existentes
FROM public.phases ph
LEFT JOIN public.preclass_dimensions pd ON ph.id = pd.phase_id
WHERE ph.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61' -- ⚠️ REEMPLAZAR CON TU PROJECT_ID
GROUP BY ph.id, ph.name, ph.project_id, ph.status, ph.is_active
ORDER BY ph.ordering;

-- ========================================================================
-- 📝 INSTRUCCIONES:
-- ========================================================================
-- 1. Copia este script completo
-- 2. Ve a Supabase Dashboard → SQL Editor
-- 3. Pega el script
-- 4. REEMPLAZA '61918743-16a4-4ab5-8378-83fb42e99a61' con tu project_id real
--    (búscalo en los resultados del PASO 2 si no lo conoces)
-- 5. Ejecuta el script
-- 6. Comparte los resultados para diagnosticar el problema
-- ========================================================================
