-- ==============================================================================
-- 🚨 SQL URGENTE: ARREGLO DE BUCKET Y STORAGE PARA COGNÉTICA
-- Ejecutar COMPLETO en el SQL Editor de Supabase Dashboard
-- ==============================================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (para evitar conflictos)
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos Cognetica" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver archivos Cognetica" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden editar archivos Cognetica" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden borrar archivos Cognetica" ON storage.objects;

-- 2. CREAR O ACTUALIZAR BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cognetica-files', 
    'cognetica-files', 
    false,
    104857600, -- 100MB
    ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. CREAR POLÍTICAS DE STORAGE (más permisivas para debug)

-- INSERT: Cualquier usuario autenticado puede subir
CREATE POLICY "cognetica_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cognetica-files');

-- SELECT: Cualquier usuario autenticado puede leer
CREATE POLICY "cognetica_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cognetica-files');

-- UPDATE: Cualquier usuario autenticado puede actualizar
CREATE POLICY "cognetica_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cognetica-files')
WITH CHECK (bucket_id = 'cognetica-files');

-- DELETE: Cualquier usuario autenticado puede borrar
CREATE POLICY "cognetica_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cognetica-files');

-- ==============================================================================
-- 4. VERIFICAR POLÍTICAS DE TABLAS DE DATOS
-- ==============================================================================

-- Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "Auth users full access artifacts" ON public.cog_artifacts;
DROP POLICY IF EXISTS "Auth users full access transcriptions" ON public.cog_transcriptions;
DROP POLICY IF EXISTS "Auth users full access seeds" ON public.cog_fractal_seeds;

-- Habilitar RLS
ALTER TABLE public.cog_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_fractal_seeds ENABLE ROW LEVEL SECURITY;

-- Crear políticas abiertas para authenticated (MVP)
CREATE POLICY "cog_artifacts_auth_policy"
ON public.cog_artifacts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "cog_transcriptions_auth_policy"
ON public.cog_transcriptions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "cog_seeds_auth_policy"
ON public.cog_fractal_seeds FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 5. VERIFICAR QUE EL BUCKET EXISTE
-- ==============================================================================
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'cognetica-files';

-- ==============================================================================
-- 6. LISTAR POLÍTICAS ACTUALES DE STORAGE
-- ==============================================================================
SELECT policyname, tablename, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ==============================================================================
-- ✅ Si todo está bien, deberías ver:
-- - El bucket "cognetica-files" en el primer query
-- - Las 4 políticas (cognetica_insert/select/update/delete_policy) en el segundo
-- ==============================================================================
