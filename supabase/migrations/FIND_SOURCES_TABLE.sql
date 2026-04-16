-- ============================================================================
-- ENCONTRAR: Tabla de fuentes y su estructura
-- ============================================================================

-- 1. Listar todas las tablas relacionadas con minotauro
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%minotauro%'
ORDER BY table_name;

-- 2. Listar todas las tablas que podrían contener fuentes
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%source%'
        OR table_name LIKE '%fuente%'
        OR table_name LIKE '%reference%'
        OR table_name LIKE '%bibliografia%'
    )
ORDER BY table_name;

-- 3. Ver estructura de minotauro_sources (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'minotauro_sources'
ORDER BY ordinal_position;

-- 4. Ver datos de ejemplo de minotauro_sources (si existe)
SELECT *
FROM minotauro_sources
LIMIT 5;

-- 5. Si no es minotauro_sources, buscar en otras tablas posibles
-- Descomenta según lo que encuentres en los pasos anteriores:

/*
SELECT * FROM cognetica_sources LIMIT 5;
SELECT * FROM galaxy_sources LIMIT 5;
SELECT * FROM universe_sources LIMIT 5;
*/

-- 6. Ver relaciones entre tablas
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (
        tc.table_name LIKE '%minotauro%'
        OR tc.table_name LIKE '%source%'
        OR ccu.table_name LIKE '%minotauro%'
    )
ORDER BY tc.table_name;
