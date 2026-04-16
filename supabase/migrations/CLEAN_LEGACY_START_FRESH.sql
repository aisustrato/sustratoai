-- ============================================================================
-- LIMPIEZA TOTAL: Eliminar datos legacy y partir de cero
-- ============================================================================
-- Este script elimina todos los campos legacy del metadata y deja solo
-- la nueva arquitectura append-only limpia
-- ============================================================================

-- PASO 1: Ver estado actual
SELECT 
    'Estado antes de limpieza' as paso,
    id,
    title,
    jsonb_object_keys(metadata) as campos_metadata
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
LIMIT 1;

-- PASO 2: Eliminar campos legacy del metadata
UPDATE minotauro_galaxies
SET metadata = metadata 
    - 'historial_analisis'
    - 'ultimo_analisis'
    - 'ultimo_arquetipo'
    - 'timestamp_analisis'
    - 'timestamp_ejecucion'
    - 'historial_interacciones'
    - 'arquetipos_ya_actuados'
    - 'session_id'
    - 'estado_seccion'
WHERE metadata IS NOT NULL;

-- PASO 3: Asegurar que existen los campos nuevos
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{versiones_texto}',
                COALESCE(metadata->'versiones_texto', '[]'::jsonb),
                true
            ),
            '{historial_arquetipos}',
            COALESCE(metadata->'historial_arquetipos', '[]'::jsonb),
            true
        ),
        '{fuentes_curadas}',
        COALESCE(metadata->'fuentes_curadas', '[]'::jsonb),
        true
    ),
    '{siguiente_numero_referencia}',
    COALESCE(metadata->'siguiente_numero_referencia', '1'::jsonb),
    true
)
WHERE metadata IS NOT NULL;

-- PASO 4: Verificar limpieza
SELECT 
    'Estado después de limpieza' as paso,
    COUNT(*) as total_galaxias,
    COUNT(CASE WHEN metadata->'versiones_texto' IS NOT NULL THEN 1 END) as con_versiones,
    COUNT(CASE WHEN metadata->'historial_arquetipos' IS NOT NULL THEN 1 END) as con_historial,
    COUNT(CASE WHEN metadata->'fuentes_curadas' IS NOT NULL THEN 1 END) as con_fuentes,
    COUNT(CASE WHEN metadata->'historial_analisis' IS NOT NULL THEN 1 END) as con_legacy_historial,
    COUNT(CASE WHEN metadata->'ultimo_analisis' IS NOT NULL THEN 1 END) as con_legacy_analisis
FROM minotauro_galaxies
WHERE metadata IS NOT NULL;

-- Ver ejemplo de metadata limpio
SELECT 
    'Ejemplo de metadata limpio' as paso,
    id,
    title,
    jsonb_pretty(metadata) as metadata_limpio
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
LIMIT 1;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Metadata solo con campos nuevos:
-- {
--   "content": "...",
--   "word_count": 496,
--   "char_count": 3394,
--   "estimated_pages": 1.984,
--   "versiones_texto": [...],
--   "historial_arquetipos": [...],
--   "fuentes_curadas": [...],
--   "siguiente_numero_referencia": 1,
--   "version_actual": 1
-- }
--
-- SIN campos legacy:
-- - historial_analisis ❌
-- - ultimo_analisis ❌
-- - historial_interacciones ❌
-- - arquetipos_ya_actuados ❌
-- - session_id ❌
-- ============================================================================
