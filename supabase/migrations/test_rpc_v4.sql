-- ========================================================================
-- TEST: Verificar que get_all_project_batches_v4 funciona correctamente
-- ========================================================================

-- 1. Ver el resultado RAW de la RPC v4 para el lote 1
SELECT 
  batch_number,
  jsonb_pretty(article_counts) as counts_formatted
FROM get_all_project_batches_v4(
  (SELECT project_id FROM article_batches WHERE batch_number = 1 LIMIT 1)
)
WHERE batch_number = 1;

-- 2. Contar manualmente los artículos del lote 1 por status efectivo
WITH batch_items AS (
  SELECT 
    abi.id as item_id,
    abi.batch_id,
    abi.status as item_status,
    ab.batch_number
  FROM article_batch_items abi
  JOIN article_batches ab ON abi.batch_id = ab.id
  WHERE ab.batch_number = 1
),
latest_dimension_reviews AS (
  SELECT DISTINCT ON (bi.item_id, adr.dimension_id)
    bi.item_id,
    bi.batch_number,
    adr.dimension_id,
    pd.name as dimension_name,
    adr.status as review_status,
    adr.iteration
  FROM batch_items bi
  JOIN article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
  JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
  ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
),
item_review_status AS (
  SELECT 
    bi.item_id,
    bi.batch_number,
    bi.item_status,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id 
        AND ldr.review_status = 'disputed'
      ) THEN 'disputed'
      
      WHEN EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id 
        AND ldr.review_status = 'reconciliation_pending'
      ) THEN 'reconciliation_pending'
      
      WHEN EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id
      ) AND NOT EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id 
        AND ldr.review_status NOT IN ('reconciled')
      ) THEN 'reconciled'
      
      WHEN EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id
      ) AND NOT EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id 
        AND ldr.review_status NOT IN ('validated')
      ) THEN 'validated'
      
      WHEN EXISTS (
        SELECT 1 FROM latest_dimension_reviews ldr
        WHERE ldr.item_id = bi.item_id
      ) THEN 'review_pending'
      
      ELSE bi.item_status::text
    END as effective_status
  FROM batch_items bi
)
SELECT 
  effective_status,
  COUNT(*) as count
FROM item_review_status
GROUP BY effective_status
ORDER BY effective_status;

-- 3. Ver el artículo específico que debería estar reconciliado
WITH batch_items AS (
  SELECT 
    abi.id as item_id,
    abi.batch_id,
    a.title
  FROM article_batch_items abi
  JOIN article_batches ab ON abi.batch_id = ab.id
  JOIN articles a ON abi.article_id = a.id
  WHERE ab.batch_number = 1
),
latest_dimension_reviews AS (
  SELECT DISTINCT ON (bi.item_id, adr.dimension_id)
    bi.item_id,
    bi.title,
    adr.dimension_id,
    pd.name as dimension_name,
    adr.status as review_status,
    adr.iteration
  FROM batch_items bi
  JOIN article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
  JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
  ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
)
SELECT 
  item_id,
  title,
  COUNT(*) as total_dimensions,
  COUNT(*) FILTER (WHERE review_status = 'validated') as validated_count,
  COUNT(*) FILTER (WHERE review_status = 'reconciled') as reconciled_count,
  COUNT(*) FILTER (WHERE review_status = 'disputed') as disputed_count,
  COUNT(*) FILTER (WHERE review_status = 'reconciliation_pending') as reconciliation_pending_count,
  array_agg(DISTINCT review_status) as unique_statuses
FROM latest_dimension_reviews
GROUP BY item_id, title
HAVING COUNT(*) FILTER (WHERE review_status = 'reconciled') > 0
ORDER BY title;
