-- ============================================
-- LIMPIEZA: Imágenes de Infografías con URLs de Replicate
-- ============================================
-- PROPÓSITO: Eliminar imágenes generadas que tienen URLs de replicate.delivery
-- para que se puedan regenerar y guardar en Supabase Storage
-- ============================================

-- 1️⃣ Ver cuántas imágenes tienen URLs de Replicate (para verificar antes de borrar)
SELECT 
    COUNT(*) as total_replicate_images,
    COUNT(DISTINCT prompt_id) as prompts_afectados
FROM cog_generated_images
WHERE storage_url LIKE '%replicate.delivery%';

-- 2️⃣ Ver los detalles de las imágenes que se van a borrar
SELECT 
    cgi.id,
    cgi.storage_url,
    cgi.created_at,
    cip.artifact_id,
    cip.prompt_text
FROM cog_generated_images cgi
JOIN cog_image_prompts cip ON cgi.prompt_id = cip.id
WHERE cgi.storage_url LIKE '%replicate.delivery%'
ORDER BY cgi.created_at DESC;

-- 3️⃣ ELIMINAR las imágenes con URLs de Replicate
-- ⚠️ ADVERTENCIA: Esta acción es irreversible
-- Ejecuta esto solo después de revisar los resultados de las consultas anteriores

DELETE FROM cog_generated_images
WHERE storage_url LIKE '%replicate.delivery%';

-- 4️⃣ OPCIONAL: También eliminar los prompts huérfanos (sin imágenes asociadas)
-- Solo ejecuta esto si quieres limpiar completamente y regenerar todo

DELETE FROM cog_image_prompts
WHERE id NOT IN (
    SELECT DISTINCT prompt_id 
    FROM cog_generated_images
);

-- 5️⃣ Verificar que la limpieza fue exitosa
SELECT 
    COUNT(*) as imagenes_restantes,
    COUNT(CASE WHEN storage_url LIKE '%replicate.delivery%' THEN 1 END) as replicate_urls_restantes
FROM cog_generated_images;

-- ============================================
-- ✅ RESULTADO ESPERADO
-- ============================================
-- Después de ejecutar este script:
-- - Las imágenes con URLs de Replicate estarán eliminadas
-- - Los prompts sin imágenes también estarán eliminados (si ejecutaste el paso 4)
-- - Podrás regenerar las imágenes y se guardarán en Supabase Storage
-- ============================================
