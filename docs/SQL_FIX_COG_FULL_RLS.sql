-- ==============================================================================
-- 🧠 COGNÉTICA: POLÍTICAS RLS COMPLETAS
-- Ejecuta esto en Supabase SQL Editor para habilitar TODAS las tablas cognitivas
-- ==============================================================================

-- 1. HABILITAR RLS EN TODAS LAS TABLAS COGNITIVAS
ALTER TABLE IF EXISTS public.cog_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_fractal_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_artifact_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_artifact_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_theories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_artifact_theories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_thought_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cog_artifact_streams ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS EXISTENTES (para evitar conflictos)
DROP POLICY IF EXISTS "cog_artifacts_policy" ON public.cog_artifacts;
DROP POLICY IF EXISTS "cog_transcriptions_policy" ON public.cog_transcriptions;
DROP POLICY IF EXISTS "cog_seeds_policy" ON public.cog_fractal_seeds;
DROP POLICY IF EXISTS "cog_disciplines_policy" ON public.cog_disciplines;
DROP POLICY IF EXISTS "cog_artifact_disciplines_policy" ON public.cog_artifact_disciplines;
DROP POLICY IF EXISTS "cog_references_policy" ON public.cog_references;
DROP POLICY IF EXISTS "cog_artifact_references_policy" ON public.cog_artifact_references;
DROP POLICY IF EXISTS "cog_theories_policy" ON public.cog_theories;
DROP POLICY IF EXISTS "cog_artifact_theories_policy" ON public.cog_artifact_theories;
DROP POLICY IF EXISTS "cog_thought_streams_policy" ON public.cog_thought_streams;
DROP POLICY IF EXISTS "cog_artifact_streams_policy" ON public.cog_artifact_streams;

-- 3. CREAR POLÍTICAS PERMISIVAS (authenticated + service_role)

-- Artefactos
CREATE POLICY "cog_artifacts_policy"
ON public.cog_artifacts FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Transcripciones
CREATE POLICY "cog_transcriptions_policy"
ON public.cog_transcriptions FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Semillas Fractales
CREATE POLICY "cog_seeds_policy"
ON public.cog_fractal_seeds FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Disciplinas
CREATE POLICY "cog_disciplines_policy"
ON public.cog_disciplines FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Relación Artefacto-Disciplina
CREATE POLICY "cog_artifact_disciplines_policy"
ON public.cog_artifact_disciplines FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Referencias (Pensadores)
CREATE POLICY "cog_references_policy"
ON public.cog_references FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Relación Artefacto-Referencia
CREATE POLICY "cog_artifact_references_policy"
ON public.cog_artifact_references FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Teorías
CREATE POLICY "cog_theories_policy"
ON public.cog_theories FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Relación Artefacto-Teoría
CREATE POLICY "cog_artifact_theories_policy"
ON public.cog_artifact_theories FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Corrientes de Pensamiento
CREATE POLICY "cog_thought_streams_policy"
ON public.cog_thought_streams FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Relación Artefacto-Stream
CREATE POLICY "cog_artifact_streams_policy"
ON public.cog_artifact_streams FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. VERIFICAR
SELECT 
    schemaname,
    tablename,
    policyname,
    roles
FROM pg_policies 
WHERE tablename LIKE 'cog_%'
ORDER BY tablename;

-- ==============================================================================
-- ✅ DESPUÉS DE EJECUTAR:
-- 1. Vuelve a la app
-- 2. Ejecuta "Análisis Cognitivo" 
-- 3. Verás pensadores, teorías, disciplinas y citas en la consola
-- ==============================================================================
