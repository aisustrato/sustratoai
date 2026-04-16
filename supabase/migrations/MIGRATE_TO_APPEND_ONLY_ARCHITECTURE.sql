-- ============================================================================
-- MIGRACIÓN: Convertir datos existentes a arquitectura append-only
-- ============================================================================
-- Convierte metadata de galaxias al nuevo formato con:
-- - versiones_texto: array de versiones del texto
-- - historial_arquetipos: array de análisis de arquetipos
-- - fuentes_curadas: array de referencias numeradas
-- - version_actual: versión actualmente visualizada
-- ============================================================================

-- 1. Verificar estado actual
SELECT 
    COUNT(*) as total_galaxias,
    COUNT(CASE WHEN metadata->>'content' IS NOT NULL THEN 1 END) as con_contenido,
    COUNT(CASE WHEN metadata->>'versiones_texto' IS NOT NULL THEN 1 END) as ya_migradas
FROM minotauro_galaxies;

-- 2. Migrar contenido a versiones_texto (v1 = contenido actual)
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{versiones_texto}',
    CASE 
        WHEN metadata->>'content' IS NOT NULL AND metadata->>'content' != '' THEN
            jsonb_build_array(
                jsonb_build_object(
                    'version', 1,
                    'content', metadata->'content',
                    'timestamp', COALESCE(
                        metadata->>'timestamp_analisis',
                        metadata->>'created_at',
                        NOW()::text
                    ),
                    'origen', 'humano'
                )
            )
        ELSE '[]'::jsonb
    END,
    true
)
WHERE metadata IS NOT NULL
    AND metadata->>'versiones_texto' IS NULL
    AND (metadata->>'content' IS NOT NULL OR metadata->>'content' != '');

-- 3. Inicializar historial_arquetipos vacío
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{historial_arquetipos}',
    '[]'::jsonb,
    true
)
WHERE metadata IS NOT NULL
    AND metadata->>'historial_arquetipos' IS NULL;

-- 4. Inicializar fuentes_curadas vacío
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{fuentes_curadas}',
    '[]'::jsonb,
    true
)
WHERE metadata IS NOT NULL
    AND metadata->>'fuentes_curadas' IS NULL;

-- 5. Inicializar siguiente_numero_referencia en 1
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{siguiente_numero_referencia}',
    '1',
    true
)
WHERE metadata IS NOT NULL
    AND metadata->>'siguiente_numero_referencia' IS NULL;

-- 6. Establecer version_actual = 1 (última versión)
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{version_actual}',
    CASE 
        WHEN jsonb_array_length(metadata->'versiones_texto') > 0 THEN
            (jsonb_array_length(metadata->'versiones_texto'))::text::jsonb
        ELSE '1'::jsonb
    END,
    true
)
WHERE metadata IS NOT NULL
    AND metadata->>'version_actual' IS NULL;

-- 7. Verificar migración
SELECT 
    'Migración Completada' as status,
    COUNT(*) as total_galaxias,
    COUNT(CASE WHEN metadata->>'versiones_texto' IS NOT NULL THEN 1 END) as con_versiones,
    COUNT(CASE WHEN metadata->>'historial_arquetipos' IS NOT NULL THEN 1 END) as con_historial,
    COUNT(CASE WHEN metadata->>'fuentes_curadas' IS NOT NULL THEN 1 END) as con_fuentes,
    COUNT(CASE WHEN metadata->>'version_actual' IS NOT NULL THEN 1 END) as con_version_actual
FROM minotauro_galaxies
WHERE metadata IS NOT NULL;

-- 8. Ver ejemplo de metadata migrado
SELECT 
    id,
    title,
    jsonb_pretty(metadata) as metadata_migrado
FROM minotauro_galaxies
WHERE metadata->>'versiones_texto' IS NOT NULL
LIMIT 1;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Esta migración es IDEMPOTENTE: se puede ejecutar múltiples veces sin problemas
-- 2. NO elimina campos legacy (ultimo_analisis, historial_analisis) para compatibilidad
-- 3. Cada galaxia con contenido tendrá al menos v1 (versión humana original)
-- 4. Los campos nuevos se inicializan vacíos si no existen
-- 5. version_actual apunta a la última versión disponible
-- ============================================================================
