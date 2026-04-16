-- ============================================
-- FIX: Políticas de Storage para cognetica-files
-- ============================================
-- PROBLEMA: Las URLs se guardan en BD pero las imágenes no se muestran
-- DIAGNÓSTICO: Verificar si las imágenes realmente existen en Storage
-- ============================================

-- 1️⃣ Verificar si las imágenes existen en storage.objects
SELECT 
    name,
    bucket_id,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'cognetica-files'
AND name LIKE 'infographics/%'
ORDER BY created_at DESC
LIMIT 10;

-- 2️⃣ Verificar si el bucket existe y es público
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'cognetica-files';

-- 2️⃣ Si el bucket no es público, hacerlo público
UPDATE storage.buckets
SET public = true
WHERE name = 'cognetica-files';

-- 3️⃣ Crear política de lectura pública para todos los archivos
-- Esto permite que cualquiera pueda VER los archivos (necesario para next/image)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cognetica-files' );

-- 4️⃣ Política de inserción para usuarios autenticados
-- Solo usuarios autenticados pueden SUBIR archivos
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cognetica-files' );

-- 5️⃣ Política de actualización para usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'cognetica-files' )
WITH CHECK ( bucket_id = 'cognetica-files' );

-- 6️⃣ Política de eliminación para usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'cognetica-files' );

-- 7️⃣ Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- ✅ RESULTADO ESPERADO
-- ============================================
-- Después de ejecutar este script:
-- 1. El bucket cognetica-files será público
-- 2. Cualquiera podrá VER (SELECT) los archivos
-- 3. Solo usuarios autenticados podrán SUBIR/MODIFICAR/ELIMINAR
-- 4. Next.js podrá cargar las imágenes sin error 400
-- ============================================
