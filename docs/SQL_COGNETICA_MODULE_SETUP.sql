-- ==============================================================================
-- 🧠 SETUP MÓDULO COGNÉTICA + CONTROL DE CREACIÓN DE PROYECTOS
-- Ejecutar en Supabase SQL Editor
-- ==============================================================================

-- ============================================================================
-- 1. AGREGAR MÓDULO COGNÉTICA A PROJECTS
-- ============================================================================

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS module_cognetica BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.projects.module_cognetica IS 
'Habilita el módulo de Cognética Forense (análisis de audio/video, transcripción, semillas fractales)';

-- ============================================================================
-- 2. AGREGAR PERMISO GLOBAL DE ADMIN EN users_profiles
-- Este permiso es a nivel PLATAFORMA, no de proyecto
-- ============================================================================

ALTER TABLE public.users_profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.users_profiles.is_platform_admin IS 
'Permiso de administrador de plataforma. Puede crear nuevos proyectos y gestionar la plataforma.';

-- ============================================================================
-- 3. ESTABLECER ADMINISTRADORES (TÚ)
-- Reemplaza 'tu_user_id' con tu ID real de auth.users
-- Puedes obtenerlo con: SELECT id, email FROM auth.users;
-- ============================================================================

-- Primero, ver los usuarios existentes para identificar el correcto:
SELECT 
    u.id as user_id,
    u.email,
    up.first_name,
    up.last_name,
    up.is_platform_admin
FROM auth.users u
LEFT JOIN public.users_profiles up ON u.id = up.user_id
ORDER BY u.created_at;

-- DESPUÉS de identificar tu user_id, ejecuta esto (descomenta y reemplaza):
-- UPDATE public.users_profiles 
-- SET is_platform_admin = true 
-- WHERE user_id = 'TU_USER_ID_AQUI';

-- ============================================================================
-- 4. VERIFICAR PROYECTOS EXISTENTES
-- ============================================================================

SELECT 
    id,
    name,
    owner_id,
    module_bibliography,
    module_interviews,
    module_planning,
    module_cognetica
FROM public.projects;

-- ============================================================================
-- 5. (OPCIONAL) HABILITAR COGNÉTICA EN UN PROYECTO EXISTENTE
-- Solo si quieres agregar Cognética a un proyecto ya creado
-- ============================================================================

-- UPDATE public.projects 
-- SET module_cognetica = true 
-- WHERE id = 'PROJECT_ID_AQUI';

-- ============================================================================
-- 6. RLS PARA users_profiles (asegurar que funcione)
-- ============================================================================

-- Política para que usuarios puedan leer su propio perfil
DROP POLICY IF EXISTS "Users can read own profile" ON public.users_profiles;
CREATE POLICY "Users can read own profile"
ON public.users_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para que usuarios puedan actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profiles;
CREATE POLICY "Users can update own profile"
ON public.users_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para que admins puedan ver todos los perfiles (para gestión)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users_profiles;
CREATE POLICY "Admins can read all profiles"
ON public.users_profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users_profiles 
        WHERE user_id = auth.uid() AND is_platform_admin = true
    )
);

-- ============================================================================
-- 7. RLS PARA projects (control de creación)
-- ============================================================================

-- Solo platform_admins pueden crear proyectos
DROP POLICY IF EXISTS "Only admins can create projects" ON public.projects;
CREATE POLICY "Only admins can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users_profiles 
        WHERE user_id = auth.uid() AND is_platform_admin = true
    )
);

-- Usuarios pueden ver proyectos donde son miembros o dueños
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
CREATE POLICY "Users can view their projects"
ON public.projects FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid() 
    OR lead_researcher_user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = projects.id AND user_id = auth.uid()
    )
);

-- Dueños y admins pueden actualizar proyectos
DROP POLICY IF EXISTS "Owners and admins can update projects" ON public.projects;
CREATE POLICY "Owners and admins can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.users_profiles 
        WHERE user_id = auth.uid() AND is_platform_admin = true
    )
);

-- ============================================================================
-- 8. FUNCIÓN HELPER: Verificar si usuario es admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT is_platform_admin FROM public.users_profiles WHERE user_id = auth.uid()),
        false
    );
$$;

COMMENT ON FUNCTION public.is_platform_admin() IS 
'Retorna true si el usuario actual es administrador de plataforma';

-- ============================================================================
-- ✅ RESUMEN DE LO QUE SE CREÓ:
-- 
-- 1. projects.module_cognetica (BOOLEAN) - Habilita módulo por proyecto
-- 2. users_profiles.is_platform_admin (BOOLEAN) - Permiso global de admin
-- 3. RLS policies para control de creación de proyectos
-- 4. Función is_platform_admin() para verificar permisos
--
-- PRÓXIMOS PASOS:
-- 1. Ejecutar: SELECT id, email FROM auth.users; para ver tu user_id
-- 2. Ejecutar: UPDATE public.users_profiles SET is_platform_admin = true WHERE user_id = 'TU_ID';
-- 3. Regenerar types: npx supabase gen types typescript --project-id vgnteswwvallupuanfiz > lib/database.types.ts
-- ============================================================================
