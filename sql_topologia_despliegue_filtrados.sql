-- 📍 SQL para ver Topología de Despliegue de los 17 artículos filtrados
-- 🎯 PROPÓSITO: Ver valores de "Topología de Despliegue" para artículos con "Mención primaria de ocio. es el foco"
-- 🔧 DATOS: 17 artículos filtrados por dimensión f94e54c9-42d8-438f-b3af-eb1c59842049

-- 1. Primero, encontrar el ID de la dimensión "Topología de Despliegue"
SELECT 
    id,
    name,
    type,
    status
FROM preclass_dimensions 
WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%';

-- 2. Verificar las opciones de "Topología de Despliegue"
SELECT 
    id,
    dimension_id,
    value,
    emoticon,
    ordering
FROM preclass_dimension_options 
WHERE dimension_id = (
    SELECT id FROM preclass_dimensions 
    WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
    LIMIT 1
)
ORDER BY ordering, value;

-- 3. 🎯 CONSULTA PRINCIPAL: Ver Topología de Despliegue de los 17 artículos filtrados
-- Artículos que tienen 'Mención primaria de ocio. es el foco' Y su valor en Topología de Despliegue
SELECT 
    -- Datos del artículo
    a.id as article_id,
    a.title as original_title,
    a.translated_title,
    a.publication_year,
    a.journal,
    
    -- Filtro aplicado (Mención primaria de ocio)
    foco_review.classification_value as foco_en_ocio,
    foco_review.confidence_score as foco_confidence,
    foco_review.iteration as foco_iteration,
    
    -- Topología de Despliegue (lo que queremos ver)
    topologia_review.classification_value as topologia_despliegue,
    topologia_review.confidence_score as topologia_confidence,
    topologia_review.iteration as topologia_iteration,
    topologia_review.is_final as topologia_is_final,
    
    -- Contexto
    ab.batch_number,
    pp.phase_number,
    pp.name as phase_name,
    
    -- IDs para referencia
    foco_review.dimension_id as foco_dimension_id,
    topologia_review.dimension_id as topologia_dimension_id
FROM articles a
JOIN article_batch_items abi ON a.id = abi.article_id
JOIN article_batches ab ON abi.batch_id = ab.id
JOIN preclassification_phases pp ON ab.phase_id = pp.id

-- JOIN para obtener los artículos con el filtro aplicado
JOIN article_dimension_reviews foco_review ON abi.id = foco_review.batch_item_id
WHERE foco_review.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND foco_review.classification_value = 'Mención primaria de ocio. es el foco'

-- LEFT JOIN para obtener la Topologia de Despliegue (si existe)
LEFT JOIN article_dimension_reviews topologia_review ON abi.id = topologia_review.batch_item_id
    AND topologia_review.dimension_id = (
        SELECT id FROM preclass_dimensions 
        WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
        LIMIT 1
    )
    AND topologia_review.iteration = (
        SELECT MAX(iteration) 
        FROM article_dimension_reviews adr2 
        WHERE adr2.batch_item_id = abi.id 
          AND adr2.dimension_id = topologia_review.dimension_id
    )

ORDER BY 
    pp.phase_number,
    ab.batch_number,
    a.translated_title;

-- 4. Resumen de valores de Topología de Despliegue para los 17 artículos
SELECT 
    topologia_review.classification_value as topologia_despliegue,
    COUNT(*) as cantidad_articulos,
    ROUND(COUNT(*) * 100.0 / 17, 2) as porcentaje,
    STRING_AGG(
        DISTINCT a.translated_title || ' (Fase ' || pp.phase_number || ')', 
        ', ' ORDER BY a.translated_title
    ) as articulos
FROM articles a
JOIN article_batch_items abi ON a.id = abi.article_id
JOIN article_batches ab ON abi.batch_id = ab.id
JOIN preclassification_phases pp ON ab.phase_id = pp.id
JOIN article_dimension_reviews foco_review ON abi.id = foco_review.batch_item_id
LEFT JOIN article_dimension_reviews topologia_review ON abi.id = topologia_review.batch_item_id
    AND topologia_review.dimension_id = (
        SELECT id FROM preclass_dimensions 
        WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
        LIMIT 1
    )
    AND topologia_review.iteration = (
        SELECT MAX(iteration) 
        FROM article_dimension_reviews adr2 
        WHERE adr2.batch_item_id = abi.id 
          AND adr2.dimension_id = topologia_review.dimension_id
    )
WHERE foco_review.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND foco_review.classification_value = 'Mención primaria de ocio. es el foco'
GROUP BY topologia_review.classification_value
ORDER BY cantidad_articulos DESC;

-- 5. Verificar si algunos de los 17 artículos NO tienen Topología de Despliegue
SELECT 
    COUNT(*) as total_con_foco,
    COUNT(topologia_review.classification_value) as con_topologia,
    COUNT(*) - COUNT(topologia_review.classification_value) as sin_topologia
FROM articles a
JOIN article_batch_items abi ON a.id = abi.article_id
JOIN article_dimension_reviews foco_review ON abi.id = foco_review.batch_item_id
LEFT JOIN article_dimension_reviews topologia_review ON abi.id = topologia_review.batch_item_id
    AND topologia_review.dimension_id = (
        SELECT id FROM preclass_dimensions 
        WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
        LIMIT 1
    )
    AND topologia_review.iteration = (
        SELECT MAX(iteration) 
        FROM article_dimension_reviews adr2 
        WHERE adr2.batch_item_id = abi.id 
          AND adr2.dimension_id = topologia_review.dimension_id
    )
WHERE foco_review.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND foco_review.classification_value = 'Mención primaria de ocio. es el foco';
