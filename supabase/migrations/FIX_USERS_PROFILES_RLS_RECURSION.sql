-- ============================================================================
-- FIX: Recursión Infinita en Políticas RLS de users_profiles
-- ============================================================================
-- Problema: La política "Admins can read all profiles" causa recursión infinita
-- porque hace un SELECT en users_profiles dentro de la misma política de SELECT
-- 
-- Solución: Usar una función SECURITY DEFINER que no active RLS
-- ============================================================================

-- 1. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Only admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and admins can update projects" ON public.projects;

-- 2. Crear función helper que NO active RLS (SECURITY DEFINER)
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

-- 3. Recrear política de admins SIN recursión
CREATE POLICY "Admins can read all profiles"
ON public.users_profiles FOR SELECT
TO authenticated
USING (public.is_platform_admin());

-- 4. Recrear políticas de projects usando la función
CREATE POLICY "Only admins can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Owners and admins can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() 
    OR public.is_platform_admin()
);

-- 5. Verificar que RLS está habilitado
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esto para verificar que las políticas están correctas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('users_profiles', 'projects');
