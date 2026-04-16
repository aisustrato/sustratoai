-- ============================================================================
-- SCRIPT: Resetear UN SOLO artículo específico de un lote
-- ============================================================================
-- Batch ID: 5cc0ffb2-f9f9-40d3-9782-05cb92dae541
-- ============================================================================

-- 🔍 PASO 1: Ver TODOS los artículos del lote para elegir cuál resetear
SELECT 
    abi.id as item_id,
    a.title,
    a.abstract,
    abi.status as item_status,
    COUNT(adr.id) as num_reviews,
    COUNT(DISTINCT adr.iteration) as num_iterations,
    STRING_AGG(DISTINCT adr.status::text, ', ') as review_statuses
FROM article_batch_items abi
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
GROUP BY abi.id, a.title, a.abstract, abi.status
ORDER BY a.title;

-- 📝 INSTRUCCIONES:
-- 1. Ejecuta el PASO 1 arriba
-- 2. Identifica el artículo problemático por su título
-- 3. Copia el 'item_id' (UUID) de ese artículo
-- 4. Reemplaza 'ARTICLE_ITEM_ID_AQUI' en los pasos siguientes con ese UUID
-- 5. Ejecuta los pasos 2-7 en orden

-- 🔍 PASO 2: Ver reviews del artículo específico ANTES de eliminar
SELECT 
    adr.id,
    pd.name as dimension_name,
    adr.iteration,
    adr.reviewer_type,
    adr.classification_value,
    adr.status,
    adr.confidence_score,
    adr.is_final
FROM article_dimension_reviews adr
LEFT JOIN preclass_dimensions pd ON pd.id = adr.dimension_id
WHERE adr.article_batch_item_id = 'ARTICLE_ITEM_ID_AQUI'
ORDER BY pd.name, adr.iteration;

-- 📊 PASO 3: Contar reviews a eliminar
SELECT 
    COUNT(*) as total_reviews_to_delete,
    COUNT(DISTINCT dimension_id) as affected_dimensions,
    MAX(iteration) as max_iteration
FROM article_dimension_reviews
WHERE article_batch_item_id = 'ARTICLE_ITEM_ID_AQUI';

-- ⚠️ PASO 4: ELIMINAR todas las reviews del artículo específico
DELETE FROM article_dimension_reviews
WHERE article_batch_item_id = 'ARTICLE_ITEM_ID_AQUI';

-- ✅ PASO 5: Verificar eliminación
SELECT COUNT(*) as remaining_reviews
FROM article_dimension_reviews
WHERE article_batch_item_id = 'ARTICLE_ITEM_ID_AQUI';
-- Debería retornar 0

-- 🔄 PASO 6: Resetear status del artículo
UPDATE article_batch_items
SET status = 'translated'
WHERE id = 'ARTICLE_ITEM_ID_AQUI';

-- 📋 PASO 7: Verificar nuevo estado
SELECT 
    abi.id,
    a.title,
    abi.status,
    COUNT(adr.id) as num_reviews
FROM article_batch_items abi
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
WHERE abi.id = 'ARTICLE_ITEM_ID_AQUI'
GROUP BY abi.id, a.title, abi.status;

-- ============================================================================
-- NOTA: Este script resetea SOLO UN artículo, no todo el lote
-- Si quieres resetear TODO el lote, usa reset_batch_by_batch_id.sql
-- ============================================================================
