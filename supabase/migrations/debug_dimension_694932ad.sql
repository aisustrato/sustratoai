-- ========================================================================
-- DEBUG: Ver todas las reviews de la dimensión 694932ad-c849-4ecf-a534-b42d90101724
-- ========================================================================

SELECT 
  adr.id as review_id,
  adr.iteration,
  adr.reviewer_type,
  adr.status,
  adr.classification_value,
  adr.confidence_score,
  adr.created_at
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
  AND adr.dimension_id = '694932ad-c849-4ecf-a534-b42d90101724'
ORDER BY adr.iteration, adr.reviewer_type, adr.created_at;
