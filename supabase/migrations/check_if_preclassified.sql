-- ==========================================
-- VERIFICAR SI EL LOTE #2 FUE PRECLASIFICADO
-- ==========================================

-- Ver si hay preclasificaciones en article_dimension_reviews
SELECT 
    COUNT(*) as total_reviews,
    COUNT(DISTINCT adr.article_batch_item_id) as items_preclasificados,
    COUNT(DISTINCT adr.dimension_id) as dimensiones_usadas,
    MAX(adr.created_at) as ultima_preclasificacion
FROM article_dimension_reviews adr
INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
INNER JOIN article_batches ab ON abi.batch_id = ab.id
WHERE ab.batch_number = 2
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Si total_reviews > 0, entonces SÍ se preclasificó
-- Si total_reviews = 0, entonces NO se preclasificó (y el status 'review_pending' es incorrecto)
