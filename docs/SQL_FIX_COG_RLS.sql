-- ==============================================================================
-- 🔧 FIX RLS PARA TABLAS COGNETICA
-- El server action no tiene contexto de usuario, necesitamos políticas más permisivas
-- O usar service_role. Por ahora hacemos políticas abiertas para MVP.
-- ==============================================================================

-- 1. LIMPIAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "cog_artifacts_auth_policy" ON public.cog_artifacts;
DROP POLICY IF EXISTS "cog_transcriptions_auth_policy" ON public.cog_transcriptions;
DROP POLICY IF EXISTS "cog_seeds_auth_policy" ON public.cog_fractal_seeds;

-- 2. ASEGURAR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.cog_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_fractal_seeds ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS PERMISIVAS (para MVP - luego se restringen)
-- Opción A: Permitir a todos los roles autenticados Y service_role

CREATE POLICY "cog_artifacts_policy"
ON public.cog_artifacts FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "cog_transcriptions_policy"
ON public.cog_transcriptions FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "cog_seeds_policy"
ON public.cog_fractal_seeds FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename LIKE 'cog_%';

-- ==============================================================================
-- ✅ DESPUÉS DE EJECUTAR ESTO:
-- 1. Vuelve a la app
-- 2. Haz clic en "Reintentar Transcripción"
-- 3. Debería funcionar ahora
-- ==============================================================================
