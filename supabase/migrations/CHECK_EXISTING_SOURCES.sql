-- ============================================================================
-- VERIFICAR: Fuentes existentes en galaxias
-- ============================================================================
-- Este script verifica qué fuentes ya existen en las galaxias
-- para migrarlas correctamente a fuentes_curadas
-- ============================================================================

-- 1. Ver si hay campo 'sources' o 'fuentes' en metadata
SELECT 
    id,
    title,
    metadata->'sources' as sources,
    metadata->'fuentes' as fuentes,
    metadata->'referencias' as referencias,
    metadata->'bibliography' as bibliography
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
    AND (
        metadata->'sources' IS NOT NULL 
        OR metadata->'fuentes' IS NOT NULL
        OR metadata->'referencias' IS NOT NULL
        OR metadata->'bibliography' IS NOT NULL
    )
LIMIT 10;

-- 2. Ver estructura completa de una galaxia con fuentes
SELECT 
    id,
    title,
    jsonb_pretty(metadata) as metadata_completo
FROM minotauro_galaxies
WHERE metadata IS NOT NULL
    AND (
        metadata->'sources' IS NOT NULL 
        OR metadata->'fuentes' IS NOT NULL
    )
LIMIT 1;

-- 3. Contar galaxias con fuentes
SELECT 
    COUNT(*) as total_galaxias,
    COUNT(CASE WHEN metadata->'sources' IS NOT NULL THEN 1 END) as con_sources,
    COUNT(CASE WHEN metadata->'fuentes' IS NOT NULL THEN 1 END) as con_fuentes,
    COUNT(CASE WHEN metadata->'referencias' IS NOT NULL THEN 1 END) as con_referencias
FROM minotauro_galaxies
WHERE metadata IS NOT NULL;
