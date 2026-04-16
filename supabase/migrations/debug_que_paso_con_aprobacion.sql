-- ==========================================
-- DEBUG: ¿Qué pasó con la aprobación que hice?
-- ==========================================

-- Ver el artículo #1 del Lote #14 (el que aprobaste en la imagen)
SELECT 
    adr.id,
    adr.article_batch_item_id,
    cd.name as dimension_name,
    adr.classification_value,
    adr.reviewer_type,
    adr.iteration,
    adr.status,  -- ← ESTE ES EL CAMPO IMPORTANTE
    adr.prevalidated,  -- ← Este está obsoleto, debería seguir en false
    adr.updated_at,
    adr.created_at
FROM article_dimension_reviews adr
INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
INNER JOIN article_batches ab ON abi.batch_id = ab.id
INNER JOIN classification_dimensions cd ON adr.dimension_id = cd.id
WHERE ab.batch_number = 14
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
  AND adr.article_batch_item_id = '75cf5a52-67b1-4855-8a80-f28a43224104'  -- El articleId del log
ORDER BY cd.name, adr.iteration;

-- Ver si hay alguna dimensión con status 'validated'
SELECT COUNT(*) as total_validated
FROM article_dimension_reviews adr
INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
INNER JOIN article_batches ab ON abi.batch_id = ab.id
WHERE ab.batch_number = 14
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
  AND adr.status = 'validated';
