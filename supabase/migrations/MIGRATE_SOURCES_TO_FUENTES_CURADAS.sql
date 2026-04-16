-- ============================================================================
-- MIGRACIÓN: Fuentes existentes a fuentes_curadas
-- ============================================================================
-- Migra fuentes desde diferentes campos legacy a fuentes_curadas
-- con numeración automática
-- ============================================================================

-- PASO 1: Verificar qué campos de fuentes existen
SELECT 
    'Verificación de campos de fuentes' as paso,
    COUNT(*) as total_galaxias,
    COUNT(CASE WHEN metadata->'sources' IS NOT NULL THEN 1 END) as con_sources,
    COUNT(CASE WHEN metadata->'fuentes' IS NOT NULL THEN 1 END) as con_fuentes,
    COUNT(CASE WHEN metadata->'referencias' IS NOT NULL THEN 1 END) as con_referencias,
    COUNT(CASE WHEN metadata->'bibliography' IS NOT NULL THEN 1 END) as con_bibliography
FROM minotauro_galaxies
WHERE metadata IS NOT NULL;

-- PASO 2: Ver ejemplo de estructura de fuentes (si existen)
SELECT 
    'Ejemplo de fuentes existentes' as paso,
    id,
    title,
    COALESCE(
        metadata->'sources',
        metadata->'fuentes',
        metadata->'referencias',
        metadata->'bibliography'
    ) as fuentes_actuales
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
    AND (
        metadata->'sources' IS NOT NULL 
        OR metadata->'fuentes' IS NOT NULL
        OR metadata->'referencias' IS NOT NULL
        OR metadata->'bibliography' IS NOT NULL
    )
LIMIT 1;

-- ============================================================================
-- OPCIÓN A: Si tus fuentes están en metadata->'sources' como array de objetos
-- ============================================================================
-- Formato esperado: [{"author": "X", "year": "2024", "title": "Y", ...}]

UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{fuentes_curadas}',
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'numero', row_number,
                'autor', source->>'author',
                'anio', source->>'year',
                'titulo', source->>'title',
                'tipo', COALESCE(source->>'type', 'articulo'),
                'url', source->>'url'
            )
        )
        FROM (
            SELECT 
                ROW_NUMBER() OVER () as row_number,
                jsonb_array_elements(metadata->'sources') as source
        ) numbered_sources
    ),
    true
)
WHERE metadata IS NOT NULL
    AND metadata->'sources' IS NOT NULL
    AND jsonb_typeof(metadata->'sources') = 'array'
    AND jsonb_array_length(metadata->'sources') > 0;

-- Actualizar siguiente_numero_referencia basado en fuentes migradas
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{siguiente_numero_referencia}',
    (jsonb_array_length(metadata->'fuentes_curadas') + 1)::text::jsonb,
    true
)
WHERE metadata IS NOT NULL
    AND metadata->'fuentes_curadas' IS NOT NULL
    AND jsonb_array_length(metadata->'fuentes_curadas') > 0;

-- ============================================================================
-- OPCIÓN B: Si tus fuentes están en otro formato
-- ============================================================================
-- Descomenta y adapta según tu estructura real:

/*
-- Si las fuentes están como objeto con keys
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
    metadata,
    '{fuentes_curadas}',
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'numero', row_number,
                'autor', value->>'autor',
                'anio', value->>'anio',
                'titulo', value->>'titulo',
                'tipo', COALESCE(value->>'tipo', 'articulo'),
                'url', value->>'url'
            )
        )
        FROM (
            SELECT 
                ROW_NUMBER() OVER () as row_number,
                value
            FROM jsonb_each(metadata->'fuentes')
        ) numbered_sources
    ),
    true
)
WHERE metadata IS NOT NULL
    AND metadata->'fuentes' IS NOT NULL;
*/

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Ver resultado de la migración
SELECT 
    'Resultado de migración' as paso,
    COUNT(*) as total_galaxias,
    COUNT(CASE WHEN metadata->'fuentes_curadas' IS NOT NULL 
               AND jsonb_array_length(metadata->'fuentes_curadas') > 0 
               THEN 1 END) as con_fuentes_migradas,
    SUM(CASE WHEN metadata->'fuentes_curadas' IS NOT NULL 
             THEN jsonb_array_length(metadata->'fuentes_curadas') 
             ELSE 0 END) as total_fuentes_migradas
FROM minotauro_galaxies
WHERE metadata IS NOT NULL;

-- Ver ejemplo de fuentes migradas
SELECT 
    'Ejemplo de fuentes migradas' as paso,
    id,
    title,
    jsonb_pretty(metadata->'fuentes_curadas') as fuentes_curadas,
    metadata->>'siguiente_numero_referencia' as siguiente_numero
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
    AND metadata->'fuentes_curadas' IS NOT NULL
    AND jsonb_array_length(metadata->'fuentes_curadas') > 0
LIMIT 1;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta PASO 1 y PASO 2 primero para ver tu estructura actual
-- 2. Según el resultado, usa OPCIÓN A o adapta OPCIÓN B
-- 3. Ejecuta la VERIFICACIÓN FINAL para confirmar
-- 4. Si necesitas ayuda, comparte el resultado de PASO 2
-- ============================================================================
