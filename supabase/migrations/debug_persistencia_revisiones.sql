-- ==========================================
-- DEBUG: ¿Por qué no persisten las revisiones del investigador?
-- ==========================================

-- Ver las revisiones del Lote #10 para el artículo 1
SELECT 
    adr.id,
    adr.article_batch_item_id,
    d.name as dimension_name,
    adr.classification_value,
    adr.reviewer_type,
    adr.iteration,
    adr.status,
    adr.prevalidated,  -- ← CAMPO QUE LEE LA UI
    adr.created_at
FROM article_dimension_reviews adr
INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
INNER JOIN article_batches ab ON abi.batch_id = ab.id
INNER JOIN dimensions d ON adr.dimension_id = d.id
WHERE ab.batch_number = 10
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
ORDER BY adr.article_batch_item_id, d.name, adr.iteration;
