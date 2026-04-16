-- ========================================================================
-- DEBUG: Verificar qué está retornando get_all_project_batches_v3
-- ========================================================================

-- 1. Ver el resultado RAW de la RPC v3 para el lote problemático
SELECT 
  id,
  batch_number,
  name,
  status,
  article_counts
FROM get_all_project_batches_v3(
  (SELECT project_id FROM article_batches WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541')
)
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 2. Desglosar el JSONB de article_counts
SELECT 
  batch_number,
  jsonb_pretty(article_counts) as counts_formatted,
  article_counts->>'pending' as pending,
  article_counts->>'translated' as translated,
  article_counts->>'pending_review' as pending_review,
  article_counts->>'review_pending' as review_pending,
  article_counts->>'reconciliation_pending' as reconciliation_pending,
  article_counts->>'validated' as validated,
  article_counts->>'reconciled' as reconciled,
  article_counts->>'disputed' as disputed
FROM get_all_project_batches_v3(
  (SELECT project_id FROM article_batches WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541')
)
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 3. Contar manualmente las últimas reviews por status
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
    adr.reviewer_type
  FROM batch_items bi
  JOIN article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
  JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
  ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
)
SELECT 
  status,
  COUNT(*) as count,
  array_agg(DISTINCT dimension_name) as dimensions
FROM latest_dimension_reviews
GROUP BY status
ORDER BY status;

-- 4. Ver la dimensión específica que está reconciliada
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
    adr.reviewer_type,
    adr.classification_value
  FROM batch_items bi
  JOIN article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
  JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
  ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
)
SELECT *
FROM latest_dimension_reviews
WHERE dimension_id = '694932ad-c849-4ecf-a534-b42d90101724'
ORDER BY item_id;
