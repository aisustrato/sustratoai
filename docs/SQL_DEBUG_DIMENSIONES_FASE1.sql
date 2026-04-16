-- 🔍 DEBUG: Verificar datos de dimensiones en Fase 1
-- Ejecutar estos queries en Supabase SQL Editor para diagnosticar el problema

-- 1️⃣ Obtener ID de Fase 1
SELECT id, name, phase_number 
FROM preclassification_phases 
WHERE phase_number = 1 
LIMIT 1;
-- Resultado esperado: acc5f020-e663-4560-8f68-96dccfc68420

-- 2️⃣ Verificar dimensiones activas en Fase 1
SELECT 
    d.id,
    d.name,
    d.status,
    d.ordering,
    COUNT(DISTINCT do.id) as num_options
FROM preclass_dimensions d
LEFT JOIN preclass_dimension_options do ON do.dimension_id = d.id
WHERE d.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
    AND d.status = 'active'
GROUP BY d.id, d.name, d.status, d.ordering
ORDER BY d.ordering;
-- Debe mostrar 7 dimensiones con sus opciones

-- 3️⃣ Verificar batches de Fase 1
SELECT id, name, created_at
FROM article_batches
WHERE phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420';
-- Debe mostrar al menos 1 batch

-- 4️⃣ Contar artículos en batches de Fase 1
SELECT 
    ab.id as batch_id,
    ab.name as batch_name,
    COUNT(abi.id) as num_articles
FROM article_batches ab
LEFT JOIN article_batch_items abi ON abi.batch_id = ab.id
WHERE ab.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
GROUP BY ab.id, ab.name;
-- Debe mostrar 257 artículos totales

-- 5️⃣ 🔥 QUERY CRÍTICO: Verificar clasificaciones por dimensión
SELECT 
    d.id as dimension_id,
    d.name as dimension_name,
    d.ordering,
    COUNT(DISTINCT adr.article_batch_item_id) as num_articles_classified,
    COUNT(adr.id) as num_classifications,
    COUNT(DISTINCT adr.classification_value) as num_unique_values
FROM preclass_dimensions d
LEFT JOIN article_dimension_reviews adr ON adr.dimension_id = d.id
LEFT JOIN article_batch_items abi ON abi.id = adr.article_batch_item_id
LEFT JOIN article_batches ab ON ab.id = abi.batch_id
WHERE d.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
    AND d.status = 'active'
    AND ab.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'  -- ⚠️ IMPORTANTE: solo batches de Fase 1
GROUP BY d.id, d.name, d.ordering
ORDER BY d.ordering;
-- Debe mostrar clasificaciones para TODAS las dimensiones

-- 6️⃣ Verificar si hay clasificaciones de otras fases mezcladas
SELECT 
    d.name as dimension_name,
    d.phase_id as dimension_phase_id,
    ab.phase_id as batch_phase_id,
    COUNT(*) as num_reviews
FROM article_dimension_reviews adr
JOIN preclass_dimensions d ON d.id = adr.dimension_id
JOIN article_batch_items abi ON abi.id = adr.article_batch_item_id
JOIN article_batches ab ON ab.id = abi.batch_id
WHERE d.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
GROUP BY d.name, d.phase_id, ab.phase_id
ORDER BY d.name;
-- Si dimension_phase_id ≠ batch_phase_id, hay datos mezclados ❌

-- 7️⃣ Detalle de clasificaciones por dimensión y valor
SELECT 
    d.name as dimension_name,
    adr.classification_value,
    COUNT(*) as count
FROM preclass_dimensions d
LEFT JOIN article_dimension_reviews adr ON adr.dimension_id = d.id
LEFT JOIN article_batch_items abi ON abi.id = adr.article_batch_item_id
LEFT JOIN article_batches ab ON ab.id = abi.batch_id
WHERE d.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
    AND d.status = 'active'
    AND ab.phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
GROUP BY d.name, adr.classification_value
ORDER BY d.name, count DESC;
-- Debe mostrar todos los valores clasificados por dimensión

-- 8️⃣ 🚨 VERIFICAR PROBLEMA ESPECÍFICO: ¿Por qué algunas dimensiones aparecen vacías?
-- Comparar la query del backend con esta query manual
WITH batch_ids AS (
    SELECT id FROM article_batches WHERE phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420'
),
item_ids AS (
    SELECT id FROM article_batch_items WHERE batch_id IN (SELECT id FROM batch_ids)
),
dimension_ids AS (
    SELECT id, name FROM preclass_dimensions 
    WHERE phase_id = 'acc5f020-e663-4560-8f68-96dccfc68420' AND status = 'active'
)
SELECT 
    d.name,
    COUNT(DISTINCT adr.article_batch_item_id) as classified_count,
    COUNT(DISTINCT adr.classification_value) as unique_values
FROM dimension_ids d
LEFT JOIN article_dimension_reviews adr 
    ON adr.dimension_id = d.id 
    AND adr.article_batch_item_id IN (SELECT id FROM item_ids)
GROUP BY d.id, d.name
ORDER BY d.name;
-- Esta query replica exactamente lo que hace getDimensionStatisticsMultiphase
-- Si aquí salen datos correctos, el problema está en el código TypeScript
-- Si aquí también salen vacíos, el problema está en los datos
