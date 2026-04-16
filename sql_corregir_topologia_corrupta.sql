-- 📍 SQL para identificar y corregir valores corruptos en Topología de Despliegue
-- 🎯 PROPÓSITO: Encontrar valores mal escritos como "corrupatos" y "robotiva"
-- 🔧 DATOS: Dimensión Topología de Despliegue de los 17 artículos filtrados

-- 1. Encontrar el ID exacto de la dimensión "Topología de Despliegue"
SELECT 
    id as topologia_dimension_id,
    name,
    type,
    status
FROM preclass_dimensions 
WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%';

-- 2. Verificar TODOS los valores existentes en Topología de Despliegue (incluidos los corruptos)
SELECT 
    value,
    COUNT(*) as cantidad,
    STRING_AGG(DISTINCT a.translated_title, ', ' ORDER BY a.translated_title) as articulos_afectados
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
WHERE adr.dimension_id = (
    SELECT id FROM preclass_dimensions 
    WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
    LIMIT 1
)
GROUP BY adr.value
ORDER BY cantidad DESC, adr.value;

-- 3. 🎯 BUSCAR ESPECÍFICAMENTE valores corruptos (corrupatos, robotiva, etc.)
SELECT 
    adr.value as valor_corrupto,
    adr.confidence_score,
    adr.iteration,
    adr.created_at,
    a.id as article_id,
    a.translated_title,
    abi.id as batch_item_id
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
WHERE adr.dimension_id = (
    SELECT id FROM preclass_dimensions 
    WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
    LIMIT 1
)
AND (
    adr.value ILIKE '%corrupatos%' 
    OR adr.value ILIKE '%robotiva%'
    OR adr.value ILIKE '%terminan%'
    OR adr.value ILIKE '%acceso%'
    OR adr.value ILIKE '%fuente%'
    OR adr.value ILIKE '%sustrato%'
    OR adr.value ILIKE '%ocean%'
    OR adr.value ILIKE '%analizar%'
    OR adr.value ILIKE '%fases%'
    OR adr.value ILIKE '%afinacion%'
)
ORDER BY adr.created_at DESC;

-- 4. Ver los valores CORRECTOS esperados para comparar
SELECT 
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

-- 5. 🎯 CONSULTA ESPECÍFICA: Topología de los 17 artículos con "Mención primaria de ocio. es el foco"
SELECT 
    a.translated_title,
    foco.classification_value as foco_en_ocio,
    topologia.classification_value as topologia_actual,
    topologia.confidence_score as topologia_confianza,
    CASE 
        WHEN topologia.classification_value ILIKE '%corrupatos%' THEN '❌ CORRUPTO (corrupatos)'
        WHEN topologia.classification_value ILIKE '%robotiva%' THEN '❌ CORRUPTO (robotiva)'
        WHEN topologia.classification_value ILIKE '%terminan%' THEN '❌ CORRUPTO (terminan)'
        WHEN topologia.classification_value ILIKE '%fuente%' OR topologia.classification_value ILIKE '%sustrato%' THEN '❌ CORRUPTO (metadata)'
        ELSE '✅ OK'
    END as estado,
    topologia.iteration
FROM articles a
JOIN article_batch_items abi ON a.id = abi.article_id
JOIN article_dimension_reviews foco ON abi.id = foco.batch_item_id
LEFT JOIN article_dimension_reviews topologia ON abi.id = topologia.batch_item_id
    AND topologia.dimension_id = (
        SELECT id FROM preclass_dimensions 
        WHERE name ILIKE '%topología%despliegue%' OR name ILIKE '%topologia%despliegue%'
        LIMIT 1
    )
    AND topologia.iteration = (
        SELECT MAX(iteration) 
        FROM article_dimension_reviews adr2 
        WHERE adr2.batch_item_id = abi.id 
          AND adr2.dimension_id = topologia.dimension_id
    )
WHERE foco.dimension_id = 'f94e54c9-42d8-438f-b3af-eb1c59842049'
  AND foco.classification_value = 'Mención primaria de ocio. es el foco'
ORDER BY estado, a.translated_title;

-- 6. SQL para CORREGIR los valores corruptos (ejecutar con cuidado)
/*
-- Descomentar y ejecutar solo después de identificar los valores correctos

-- Ejemplo: Corregir "corrupatos para termian de acceso" a "Terminal de Acceso"
UPDATE article_dimension_reviews 
SET classification_value = 'Terminal de Acceso'
WHERE dimension_id = (SELECT id FROM preclass_dimensions WHERE name ILIKE '%topología%despliegue%' LIMIT 1)
  AND classification_value ILIKE '%corrupatos%';

-- Ejemplo: Corregir "robotiva Fuente Sustrato" a "Actuadores y Robótica"  
UPDATE article_dimension_reviews 
SET classification_value = 'Actuadores y Robótica'
WHERE dimension_id = (SELECT id FROM preclass_dimensions WHERE name ILIKE '%topología%despliegue%' LIMIT 1)
  AND classification_value ILIKE '%robotiva%';

-- Verificar cambios después de corregir
SELECT classification_value, COUNT(*) 
FROM article_dimension_reviews 
WHERE dimension_id = (SELECT id FROM preclass_dimensions WHERE name ILIKE '%topología%despliegue%' LIMIT 1)
GROUP BY classification_value
ORDER BY COUNT(*) DESC;
*/
