-- ============================================================================
-- SCRIPT: Encontrar el ID correcto del artículo problemático
-- ============================================================================

-- 🔍 OPCIÓN 1: Buscar por el ID que proporcionaste
SELECT 
    abi.id as item_id,
    abi.batch_id,
    abi.article_id,
    abi.status,
    a.title,
    a.year
FROM article_batch_items abi
LEFT JOIN articles a ON a.id = abi.article_id
WHERE abi.id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 🔍 OPCIÓN 2: Buscar artículos con reviews en estado extraño
-- (múltiples iteraciones, estados inconsistentes)
SELECT 
    abi.id as item_id,
    abi.batch_id,
    abi.article_id,
    abi.status as item_status,
    a.title,
    COUNT(DISTINCT adr.iteration) as num_iterations,
    COUNT(*) as total_reviews,
    STRING_AGG(DISTINCT adr.status::text, ', ') as statuses
FROM article_batch_items abi
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
GROUP BY abi.id, abi.batch_id, abi.article_id, abi.status, a.title
HAVING COUNT(DISTINCT adr.iteration) > 2  -- Artículos con más de 2 iteraciones
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 🔍 OPCIÓN 3: Ver todos los artículos del lote más reciente
SELECT 
    abi.id as item_id,
    ab.batch_number,
    a.title,
    abi.status,
    COUNT(adr.id) as num_reviews,
    COUNT(DISTINCT adr.iteration) as num_iterations
FROM article_batch_items abi
LEFT JOIN article_batches ab ON ab.id = abi.batch_id
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
WHERE ab.batch_number = (SELECT MAX(batch_number) FROM article_batches)
GROUP BY abi.id, ab.batch_number, a.title, abi.status
ORDER BY a.title;

-- 🔍 OPCIÓN 4: Buscar artículos con reviews que tengan status conflictivos
SELECT 
    abi.id as item_id,
    a.title,
    adr.dimension_id,
    pd.name as dimension_name,
    adr.iteration,
    adr.reviewer_type,
    adr.status,
    adr.classification_value
FROM article_batch_items abi
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
LEFT JOIN preclass_dimensions pd ON pd.id = adr.dimension_id
WHERE adr.status IN ('disputed', 'reconciliation_pending')
   OR adr.iteration >= 3
ORDER BY abi.id, adr.dimension_id, adr.iteration
LIMIT 50;

-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecuta OPCIÓN 1 primero para verificar si el ID existe
-- 2. Si no existe, ejecuta OPCIÓN 2 para encontrar artículos problemáticos
-- 3. OPCIÓN 3 te muestra todos los artículos del lote más reciente
-- 4. OPCIÓN 4 te muestra artículos con estados conflictivos
-- 
-- Una vez que encuentres el item_id correcto, úsalo en el script de reset
-- ============================================================================
