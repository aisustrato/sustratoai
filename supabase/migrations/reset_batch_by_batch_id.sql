-- ============================================================================
-- SCRIPT: Resetear TODOS los artículos de un LOTE completo
-- ============================================================================
-- Batch ID: 5cc0ffb2-f9f9-40d3-9782-05cb92dae541
-- Este es el ID del LOTE (batch), no de un artículo individual
-- ============================================================================

-- 🔍 PASO 1: Ver información del lote
SELECT 
    id,
    batch_number,
    name,
    status,
    created_at
FROM article_batches
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 🔍 PASO 2: Ver TODOS los artículos de este lote ANTES de resetear
SELECT 
    abi.id as item_id,
    a.title,
    abi.status as item_status,
    COUNT(adr.id) as num_reviews,
    COUNT(DISTINCT adr.iteration) as num_iterations,
    STRING_AGG(DISTINCT adr.status::text, ', ') as review_statuses
FROM article_batch_items abi
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
GROUP BY abi.id, a.title, abi.status
ORDER BY a.title;

-- 📊 PASO 3: Contar total de reviews a eliminar en TODO el lote
SELECT 
    COUNT(*) as total_reviews_to_delete,
    COUNT(DISTINCT adr.article_batch_item_id) as affected_articles,
    COUNT(DISTINCT adr.dimension_id) as affected_dimensions,
    MAX(adr.iteration) as max_iteration
FROM article_dimension_reviews adr
WHERE adr.article_batch_item_id IN (
    SELECT id FROM article_batch_items WHERE batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
);

-- ⚠️ PASO 4: ELIMINAR todas las reviews de TODOS los artículos del lote
-- IMPORTANTE: Esto reseteará TODO el lote completo
DELETE FROM article_dimension_reviews
WHERE article_batch_item_id IN (
    SELECT id FROM article_batch_items WHERE batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
);

-- ✅ PASO 5: Verificar que se eliminaron correctamente
SELECT 
    COUNT(*) as remaining_reviews
FROM article_dimension_reviews
WHERE article_batch_item_id IN (
    SELECT id FROM article_batch_items WHERE batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
);
-- Debería retornar 0

-- 🔄 PASO 6: Resetear el status de TODOS los items del lote
UPDATE article_batch_items
SET status = 'translated'  -- Volver a estado "traducido" para que se pueda reclasificar
WHERE batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 🔄 PASO 7: Resetear el status del lote mismo
UPDATE article_batches
SET status = 'translated'  -- Volver a estado "traducido"
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- 📋 PASO 8: Verificar el nuevo estado del lote y sus artículos
SELECT 
    ab.id as batch_id,
    ab.batch_number,
    ab.status as batch_status,
    COUNT(abi.id) as total_articles,
    COUNT(CASE WHEN abi.status = 'translated' THEN 1 END) as translated_articles
FROM article_batches ab
LEFT JOIN article_batch_items abi ON abi.batch_id = ab.id
WHERE ab.id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
GROUP BY ab.id, ab.batch_number, ab.status;

-- ============================================================================
-- RESULTADO ESPERADO:
-- - Todas las reviews eliminadas (0 remaining_reviews)
-- - Todos los artículos en status 'translated'
-- - Lote en status 'translated'
-- - Listo para ejecutar "Iniciar Preclasificación con IA" de nuevo
-- ============================================================================
