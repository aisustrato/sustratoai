-- ============================================================================
-- MIGRACIÓN: Convertir análisis existentes a formato de historial
-- ============================================================================
-- Problema: Las galaxias existentes tienen 'ultimo_analisis' pero no 'historial_analisis'
-- Solución: Migrar 'ultimo_analisis' a un array 'historial_analisis'
-- ============================================================================

-- 1. Verificar cuántas galaxias tienen análisis sin historial
SELECT 
    COUNT(*) as total_galaxias_con_analisis,
    COUNT(CASE WHEN metadata->>'historial_analisis' IS NULL THEN 1 END) as sin_historial,
    COUNT(CASE WHEN metadata->>'historial_analisis' IS NOT NULL THEN 1 END) as con_historial
FROM minotauro_galaxies
WHERE metadata->>'ultimo_analisis' IS NOT NULL;

-- 2. Ver ejemplo de metadata actual
SELECT 
    id,
    title,
    metadata->>'ultimo_analisis' as ultimo_analisis,
    metadata->>'historial_analisis' as historial_analisis
FROM minotauro_galaxies
WHERE metadata->>'ultimo_analisis' IS NOT NULL
LIMIT 3;

-- 3. MIGRACIÓN: Convertir ultimo_analisis a historial_analisis (array)
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{historial_analisis}',
    jsonb_build_array(metadata->'ultimo_analisis'),
    true
)
WHERE metadata->>'ultimo_analisis' IS NOT NULL
  AND metadata->>'historial_analisis' IS NULL;

-- 4. Verificar migración
SELECT 
    COUNT(*) as galaxias_migradas
FROM minotauro_galaxies
WHERE metadata->>'historial_analisis' IS NOT NULL;

-- 5. Ver ejemplo después de migración
SELECT 
    id,
    title,
    jsonb_array_length(metadata->'historial_analisis') as num_analisis_en_historial
FROM minotauro_galaxies
WHERE metadata->>'historial_analisis' IS NOT NULL
LIMIT 5;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Ejecuta esto para confirmar que todo está bien:
SELECT 
    'Galaxias con análisis' as categoria,
    COUNT(*) as cantidad
FROM minotauro_galaxies
WHERE metadata->>'ultimo_analisis' IS NOT NULL

UNION ALL

SELECT 
    'Galaxias con historial' as categoria,
    COUNT(*) as cantidad
FROM minotauro_galaxies
WHERE metadata->>'historial_analisis' IS NOT NULL;
