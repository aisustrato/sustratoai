-- ============================================================================
-- DEBUG: Verificar QUÉ hay realmente en la base de datos
-- ============================================================================
-- Ejecuta estas queries UNA POR UNA para ver qué está pasando
-- ============================================================================

-- 1. Ver TODAS las galaxias y su metadata completo
SELECT 
    id,
    title,
    metadata
FROM minotauro_galaxies
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver específicamente el campo historial_analisis
SELECT 
    id,
    title,
    metadata->'historial_analisis' as historial_analisis,
    metadata->'ultimo_analisis' as ultimo_analisis
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Contar cuántos análisis hay en cada historial
SELECT 
    id,
    title,
    CASE 
        WHEN metadata->'historial_analisis' IS NULL THEN 0
        WHEN jsonb_typeof(metadata->'historial_analisis') = 'array' THEN jsonb_array_length(metadata->'historial_analisis')
        ELSE 0
    END as num_analisis_en_historial
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
ORDER BY created_at DESC;

-- 4. Ver el contenido COMPLETO del historial de UNA galaxia específica
-- REEMPLAZA 'TU_GALAXY_ID' con el ID real de una galaxia que hayas procesado
SELECT 
    id,
    title,
    jsonb_pretty(metadata->'historial_analisis') as historial_formateado
FROM minotauro_galaxies
WHERE id = 'TU_GALAXY_ID';

-- 5. Ver TODOS los arquetipos usados en cada galaxia
SELECT 
    g.id,
    g.title,
    jsonb_array_elements(g.metadata->'historial_analisis')->>'archetype' as arquetipo,
    jsonb_array_elements(g.metadata->'historial_analisis')->>'timestamp' as fecha
FROM minotauro_galaxies g
WHERE g.metadata->'historial_analisis' IS NOT NULL
  AND jsonb_typeof(g.metadata->'historial_analisis') = 'array'
ORDER BY g.created_at DESC, fecha DESC;
