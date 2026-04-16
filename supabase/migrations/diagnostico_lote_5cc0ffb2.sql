-- ========================================================================
-- DIAGNÓSTICO: Lote 5cc0ffb2-f9f9-40d3-9782-05cb92dae541
-- Investigar por qué aparece "Pend. Reconciliación" fantasma
-- y no aparece "Reconciliados" en la página raíz
-- ========================================================================

-- 1. Ver información básica del lote
SELECT 
  id,
  batch_number,
  name,
  status as batch_status,
  created_at
FROM article_batches
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 2. Ver todos los items del lote y su status
SELECT 
  abi.id as item_id,
  abi.status as item_status,
  a.correlativo,
  a.title
FROM article_batch_items abi
JOIN articles a ON abi.article_id = a.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
ORDER BY a.correlativo;

-- 3. Ver TODAS las reviews del lote con su status
SELECT 
  adr.id as review_id,
  a.correlativo,
  a.title as article_title,
  pd.name as dimension_name,
  adr.iteration,
  adr.reviewer_type,
  adr.status,
  adr.classification_value,
  adr.confidence_score,
  adr.is_final,
  adr.created_at
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
ORDER BY a.correlativo, pd.name, adr.iteration;

-- 4. Contar reviews por status (lo que DEBERÍA mostrar la página raíz)
SELECT 
  adr.status,
  COUNT(*) as count
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
GROUP BY adr.status
ORDER BY adr.status;

-- 5. Ver la última review de cada dimensión por artículo (lógica de la UI)
WITH latest_reviews AS (
  SELECT DISTINCT ON (abi.id, adr.dimension_id)
    abi.id as item_id,
    a.correlativo,
    pd.name as dimension_name,
    adr.iteration,
    adr.status,
    adr.classification_value,
    adr.reviewer_type
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
  JOIN articles a ON abi.article_id = a.id
  JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
  WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
  ORDER BY abi.id, adr.dimension_id, adr.iteration DESC
)
SELECT 
  correlativo,
  dimension_name,
  iteration,
  status,
  classification_value,
  reviewer_type
FROM latest_reviews
ORDER BY correlativo, dimension_name;

-- 6. Contar por status de ÚLTIMA review (lo que ve el usuario)
WITH latest_reviews AS (
  SELECT DISTINCT ON (abi.id, adr.dimension_id)
    adr.status
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
  WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
  ORDER BY abi.id, adr.dimension_id, adr.iteration DESC
)
SELECT 
  status,
  COUNT(*) as count
FROM latest_reviews
GROUP BY status
ORDER BY status;

-- 7. Buscar reviews "problemáticas" (reconciliation_pending que no deberían existir)
SELECT 
  a.correlativo,
  a.title,
  pd.name as dimension_name,
  adr.iteration,
  adr.status,
  adr.classification_value,
  adr.reviewer_type,
  adr.created_at
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
  AND adr.status = 'reconciliation_pending'
ORDER BY a.correlativo, pd.name, adr.iteration;

-- 8. Buscar reviews reconciled
SELECT 
  a.correlativo,
  a.title,
  pd.name as dimension_name,
  adr.iteration,
  adr.status,
  adr.classification_value,
  adr.reviewer_type,
  adr.created_at
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
  AND adr.status = 'reconciled'
ORDER BY a.correlativo, pd.name, adr.iteration;

-- 9. Ver qué devuelve la RPC v2 para este lote
SELECT * FROM get_all_project_batches_v2(
  (SELECT project_id FROM article_batches WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541')
)
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 10. Verificar si hay reviews duplicadas (mismo item + dimensión + iteración)
SELECT 
  abi.id as item_id,
  a.correlativo,
  adr.dimension_id,
  pd.name as dimension_name,
  adr.iteration,
  COUNT(*) as count
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
GROUP BY abi.id, a.correlativo, adr.dimension_id, pd.name, adr.iteration
HAVING COUNT(*) > 1
ORDER BY a.correlativo, pd.name, adr.iteration;

-- ========================================================================
-- INSTRUCCIONES:
-- Ejecuta este SQL completo y comparte TODOS los resultados
-- Especialmente importante:
-- - Query 4: Conteo total por status
-- - Query 6: Conteo de ÚLTIMAS reviews por status
-- - Query 7: Reviews con reconciliation_pending
-- - Query 8: Reviews con reconciled
-- - Query 9: Lo que devuelve la RPC v2
-- ========================================================================
