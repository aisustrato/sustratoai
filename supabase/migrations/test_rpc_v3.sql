-- ========================================================================
-- TEST: Verificar que get_all_project_batches_v3 funciona correctamente
-- ========================================================================

-- 1. Verificar que la función existe
SELECT 
  proname as function_name,
  prokind as kind,
  provolatile as volatility
FROM pg_proc 
WHERE proname LIKE 'get_all_project_batches%'
ORDER BY proname;

-- 2. Ejecutar la v3 directamente para el lote problemático
SELECT * FROM get_all_project_batches_v3(
  (SELECT project_id FROM article_batches WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541')
)
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 3. Ver qué está contando la v3 paso a paso (debug)
WITH batch_items AS (
  SELECT 
    abi.id as item_id,
    abi.batch_id,
    abi.status as item_status
  FROM article_batch_items abi
  JOIN article_batches b ON abi.batch_id = b.id
  WHERE b.id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
),
latest_dimension_reviews AS (
  SELECT DISTINCT ON (bi.item_id, adr.dimension_id)
    bi.batch_id,
    bi.item_id,
    adr.dimension_id,
    adr.status,
    adr.iteration,
    adr.classification_value
  FROM batch_items bi
  JOIN article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
  ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
)
SELECT 
  status,
  COUNT(*) as count,
  array_agg(classification_value) as values
FROM latest_dimension_reviews
GROUP BY status
ORDER BY status;

-- 4. Ver TODAS las últimas reviews para entender qué está pasando
WITH batch_items AS (
  SELECT 
    abi.id as item_id,
    abi.batch_id
  FROM article_batch_items abi
  WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
),
latest_dimension_reviews AS (
  SELECT DISTINCT ON (bi.item_id, adr.dimension_id)
    bi.item_id,
    adr.dimension_id,
    pd.name as dimension_name,
    adr.status,
    adr.iteration,
    adr.classification_value
  FROM batch_items bi
  JOIN article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
  JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
  ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
)
SELECT * FROM latest_dimension_reviews
ORDER BY item_id, dimension_name;
