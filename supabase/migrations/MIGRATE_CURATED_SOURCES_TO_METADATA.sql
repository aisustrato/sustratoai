-- ============================================================================
-- MIGRACIÓN: minotauro_curated_sources → metadata.fuentes_curadas
-- ============================================================================
-- Convierte fuentes de la tabla minotauro_curated_sources a formato numerado
-- dentro del metadata de cada galaxia
-- ============================================================================

-- PASO 1: Verificar fuentes existentes
SELECT 
    'Verificación inicial' as paso,
    COUNT(DISTINCT galaxy_id) as galaxias_con_fuentes,
    COUNT(*) as total_fuentes
FROM minotauro_curated_sources;

-- Ver ejemplo de fuentes actuales
SELECT 
    'Ejemplo de fuentes actuales' as paso,
    mcs.id,
    mcs.galaxy_id,
    mg.title as galaxy_title,
    mcs.source_type,
    mcs.title as source_title,
    mcs.artifact_id,
    mcs.order_index
FROM minotauro_curated_sources mcs
JOIN minotauro_galaxies mg ON mcs.galaxy_id = mg.id
ORDER BY mcs.galaxy_id, mcs.order_index
LIMIT 10;

-- PASO 2: Migrar fuentes a metadata.fuentes_curadas
UPDATE minotauro_galaxies mg
SET metadata = jsonb_set(
    COALESCE(mg.metadata, '{}'::jsonb),
    '{fuentes_curadas}',
    (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'numero', ROW_NUMBER() OVER (ORDER BY mcs.order_index, mcs.created_at),
                'autor', COALESCE(mcs.author, 'Sin autor'),
                'anio', COALESCE(mcs.year, ''),
                'titulo', COALESCE(mcs.title, 'Artefacto: ' || COALESCE(mcs.artifact_id::text, 'Sin título')),
                'tipo', CASE 
                    WHEN mcs.source_type = 'artifact' THEN 'artefacto'
                    WHEN mcs.source_type = 'chat_session' THEN 'conversacion'
                    WHEN mcs.source_type = 'external_link' THEN 'enlace'
                    WHEN mcs.source_type = 'article' THEN 'articulo'
                    ELSE mcs.source_type
                END,
                'url', COALESCE(mcs.url, ''),
                'artifact_id', mcs.artifact_id,
                'chat_session_id', mcs.chat_session_id,
                'content_excerpt', mcs.content_excerpt,
                'relevance_note', mcs.relevance_note
            )
        ), '[]'::jsonb)
        FROM minotauro_curated_sources mcs
        WHERE mcs.galaxy_id = mg.id
        ORDER BY mcs.order_index, mcs.created_at
    ),
    true
)
WHERE EXISTS (
    SELECT 1 
    FROM minotauro_curated_sources mcs 
    WHERE mcs.galaxy_id = mg.id
);

-- PASO 3: Actualizar siguiente_numero_referencia
UPDATE minotauro_galaxies mg
SET metadata = jsonb_set(
    mg.metadata,
    '{siguiente_numero_referencia}',
    (
        COALESCE(
            (
                SELECT (COUNT(*) + 1)::text::jsonb
                FROM minotauro_curated_sources mcs
                WHERE mcs.galaxy_id = mg.id
            ),
            '1'::jsonb
        )
    ),
    true
)
WHERE EXISTS (
    SELECT 1 
    FROM minotauro_curated_sources mcs 
    WHERE mcs.galaxy_id = mg.id
);

-- PASO 4: Verificar migración
SELECT 
    'Resultado de migración' as paso,
    COUNT(*) as total_galaxias,
    COUNT(CASE 
        WHEN metadata->'fuentes_curadas' IS NOT NULL 
        AND jsonb_array_length(metadata->'fuentes_curadas') > 0 
        THEN 1 
    END) as galaxias_con_fuentes_migradas,
    SUM(CASE 
        WHEN metadata->'fuentes_curadas' IS NOT NULL 
        THEN jsonb_array_length(metadata->'fuentes_curadas') 
        ELSE 0 
    END) as total_fuentes_migradas
FROM minotauro_galaxies
WHERE metadata IS NOT NULL;

-- Ver ejemplo de fuentes migradas
SELECT 
    'Ejemplo de fuentes migradas' as paso,
    mg.id,
    mg.title,
    jsonb_pretty(mg.metadata->'fuentes_curadas') as fuentes_curadas,
    mg.metadata->>'siguiente_numero_referencia' as siguiente_numero
FROM minotauro_galaxies mg
WHERE mg.metadata->'fuentes_curadas' IS NOT NULL
    AND jsonb_array_length(mg.metadata->'fuentes_curadas') > 0
LIMIT 1;

-- PASO 5: Comparar con tabla original (verificación)
SELECT 
    'Comparación tabla vs metadata' as paso,
    mg.id,
    mg.title,
    (
        SELECT COUNT(*) 
        FROM minotauro_curated_sources mcs 
        WHERE mcs.galaxy_id = mg.id
    ) as fuentes_en_tabla,
    COALESCE(
        jsonb_array_length(mg.metadata->'fuentes_curadas'),
        0
    ) as fuentes_en_metadata
FROM minotauro_galaxies mg
WHERE EXISTS (
    SELECT 1 
    FROM minotauro_curated_sources mcs 
    WHERE mcs.galaxy_id = mg.id
)
ORDER BY mg.created_at DESC
LIMIT 10;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Esta migración NO elimina las fuentes de minotauro_curated_sources
-- 2. Las fuentes se copian a metadata.fuentes_curadas con numeración automática
-- 3. Se preservan campos adicionales (artifact_id, chat_session_id, etc.)
-- 4. El orden se respeta según order_index y created_at
-- 5. siguiente_numero_referencia se calcula automáticamente
-- ============================================================================

-- OPCIONAL: Si quieres ver todas las fuentes migradas de una galaxia específica
-- Reemplaza 'TU_GALAXY_ID' con el ID real
/*
SELECT 
    jsonb_pretty(metadata->'fuentes_curadas') as fuentes_curadas
FROM minotauro_galaxies
WHERE id = 'TU_GALAXY_ID';
*/
