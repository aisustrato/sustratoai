-- Índices para optimizar queries de análisis multifase de preclasificación
-- Fecha: 2026-03-13
-- Propósito: Mejorar performance de getDimensionStatisticsMultiphase y queries relacionadas

-- 1. Índice compuesto para article_dimension_reviews
-- Optimiza: Búsqueda por dimension_id + article_batch_item_id (query más común)
CREATE INDEX IF NOT EXISTS idx_article_dimension_reviews_dimension_item 
ON article_dimension_reviews(dimension_id, article_batch_item_id);

-- 2. Índice para búsqueda por article_batch_item_id (para joins con article_batch_items)
CREATE INDEX IF NOT EXISTS idx_article_dimension_reviews_item_id 
ON article_dimension_reviews(article_batch_item_id);

-- 3. Índice para article_batch_items por batch_id (ya existe pero verificamos)
CREATE INDEX IF NOT EXISTS idx_article_batch_items_batch_id 
ON article_batch_items(batch_id);

-- 4. Índice compuesto para article_batches por phase_id y project_id
CREATE INDEX IF NOT EXISTS idx_article_batches_phase_project 
ON article_batches(phase_id, project_id);

-- 5. Índice para preclass_dimensions por phase_id y status
CREATE INDEX IF NOT EXISTS idx_preclass_dimensions_phase_status 
ON preclass_dimensions(phase_id, status);

-- 6. Índice para classification_value (para agregaciones por opción)
CREATE INDEX IF NOT EXISTS idx_article_dimension_reviews_classification 
ON article_dimension_reviews(classification_value);

-- Comentarios sobre el impacto esperado:
-- - idx_article_dimension_reviews_dimension_item: Reduce tiempo de búsqueda de O(n) a O(log n)
-- - idx_article_dimension_reviews_item_id: Acelera joins con article_batch_items
-- - idx_article_batches_phase_project: Optimiza filtrado por múltiples fases
-- - idx_preclass_dimensions_phase_status: Acelera getDimensionsForAnalysis
-- - idx_article_dimension_reviews_classification: Mejora agregaciones por classification_value (by_option)

-- Verificar índices creados:
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename LIKE '%article_dimension%' OR tablename LIKE '%article_batch%';
