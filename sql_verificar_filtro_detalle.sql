-- 📍 SQL para verificar detalle de filtro en análisis de preclasificación
-- 🎯 PROPÓSITO: Revisar los 17 artículos que coinciden con el filtro aplicado
-- 🔧 DATOS: Dimensión f94e54c9-42d8-438f-b3af-eb1c59842049 con valor 'Mención primaria de ocio. es el foco'

-- 1. Verificar la dimensión y sus opciones
SELECT 
    id,
    name,
    type,
    phase_id,
    status
FROM preclassification_dimensions 
WHERE id = 'f94e54c9-42d8-438f-b3af-eb1c59842049';

-- 2. Verificar las opciones de esta dimensión (para validar el valor exacto)
SELECT 
    dimension_id,
    value,
    emoticon,
    created_at
FROM preclassification_dimension_options 
WHERE dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
ORDER BY value;

-- 3. VER DETALLE COMPLETO de los 17 artículos filtrados
-- 🎯 Esta es la consulta principal para ver qué artículos coinciden
SELECT 
    -- Datos del artículo
    a.id as article_id,
    a.title as original_title,
    a.translated_title,
    a.publication_year,
    a.journal,
    a.authors,
    
    -- Datos del batch item
    abi.id as batch_item_id,
    abi.status as item_status,
    
    -- Datos de la clasificación específica
    adr.dimension_id,
    adr.value as dimension_value,
    adr.confidence,
    adr.rationale,
    adr.iteration,
    adr.is_final,
    adr.created_at as classification_date,
    
    -- Datos del batch
    ab.batch_number,
    ab.name as batch_name,
    ab.status as batch_status,
    
    -- Datos de la fase
    pp.phase_number,
    pp.name as phase_name
FROM article_batch_items abi
JOIN articles a ON abi.article_id = a.id
JOIN article_batches ab ON abi.batch_id = ab.id
JOIN preclassification_phases pp ON ab.phase_id = pp.id
JOIN article_dimension_reviews adr ON abi.id = adr.batch_item_id
WHERE adr.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND adr.value = 'Mención primaria de ocio. es el foco'
  AND abi.status IN ('translated', 'review_pending', 'reconciliation_pending', 'validated', 'reconciled', 'disputed')
ORDER BY 
    pp.phase_number,
    ab.batch_number,
    a.translated_title,
    a.title;

-- 4. Verificar si hay otras variaciones del valor (posibles diferencias de espacios/casing)
SELECT 
    adr.value,
    COUNT(*) as count,
    STRING_AGG(DISTINCT a.translated_title, ', ' ORDER BY a.translated_title) as sample_titles
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
WHERE adr.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
GROUP BY adr.value
ORDER BY count DESC;

-- 5. Verificar estadísticas totales vs filtradas
SELECT 
    COUNT(*) as total_articles_with_dimension,
    COUNT(CASE WHEN adr.value = 'Mención primaria de ocio. es el foco' THEN 1 END) as filtered_articles,
    ROUND(
        (COUNT(CASE WHEN adr.value = 'Mención primaria de ocio. es el foco' THEN 1 END) * 100.0 / COUNT(*)), 
        2
    ) as percentage
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.batch_item_id = abi.id
WHERE adr.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND abi.status IN ('translated', 'review_pending', 'reconciliation_pending', 'validated', 'reconciled', 'disputed');

-- 6. Verificar por fases (para entender distribución)
SELECT 
    pp.phase_number,
    pp.name as phase_name,
    COUNT(*) as articles_count,
    COUNT(CASE WHEN adr.value = 'Mención primaria de ocio. es el foco' THEN 1 END) as filtered_count
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.batch_item_id = abi.id
JOIN article_batches ab ON abi.batch_id = ab.id
JOIN preclassification_phases pp ON ab.phase_id = pp.id
WHERE adr.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND abi.status IN ('translated', 'review_pending', 'reconciliation_pending', 'validated', 'reconciled', 'disputed')
GROUP BY pp.phase_number, pp.name
ORDER BY pp.phase_number;

-- 7. Verificar niveles de confianza de los artículos filtrados
SELECT 
    adr.confidence,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.batch_item_id = abi.id
WHERE adr.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND adr.value = 'Mención primaria de ocio. es el foco'
  AND abi.status IN ('translated', 'review_pending', 'reconciliation_pending', 'validated', 'reconciled', 'disputed')
GROUP BY adr.confidence
ORDER BY adr.confidence DESC;
