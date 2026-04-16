-- ============================================================================
-- SCRIPT MANUAL: Resetear Reviews de un Artículo Específico
-- ============================================================================
-- ⚠️ IMPORTANTE: Primero debes obtener el ID correcto del artículo
-- 
-- CÓMO OBTENER EL ID DESDE LA UI:
-- 1. Ve a la página del lote en /articulos/preclasificacion/[batchId]
-- 2. Abre las herramientas de desarrollador (F12)
-- 3. En la consola, ejecuta: 
--    document.querySelector('[data-article-id]')?.dataset.articleId
-- 4. O inspecciona el elemento de la tarjeta del artículo y busca el atributo data-article-id
-- 5. Copia el UUID completo (ej: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
--
-- Luego reemplaza 'TU_ARTICLE_BATCH_ITEM_ID_AQUI' con ese UUID en todos los pasos
-- ============================================================================

-- 🔍 PASO 0: PRIMERO - Encontrar el artículo correcto
-- Ejecuta este query para ver todos los artículos del lote más reciente:
SELECT 
    abi.id as item_id,
    ab.batch_number,
    a.title,
    a.year,
    abi.status,
    COUNT(adr.id) as num_reviews,
    COUNT(DISTINCT adr.iteration) as num_iterations
FROM article_batch_items abi
LEFT JOIN article_batches ab ON ab.id = abi.batch_id
LEFT JOIN articles a ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON adr.article_batch_item_id = abi.id
WHERE ab.batch_number = (SELECT MAX(batch_number) FROM article_batches)
GROUP BY abi.id, ab.batch_number, a.title, a.year, abi.status
ORDER BY a.title;
-- Copia el 'item_id' del artículo que quieres resetear

-- 🔍 PASO 1: Verificar reviews existentes ANTES de eliminar
-- ⚠️ REEMPLAZA 'TU_ARTICLE_BATCH_ITEM_ID_AQUI' con el ID real
SELECT 
    adr.id,
    adr.article_batch_item_id,
    adr.dimension_id,
    pd.name as dimension_name,
    adr.iteration,
    adr.reviewer_type,
    adr.classification_value,
    adr.status,
    adr.confidence_score,
    adr.is_final,
    adr.created_at
FROM article_dimension_reviews adr
LEFT JOIN preclass_dimensions pd ON pd.id = adr.dimension_id
WHERE adr.article_batch_item_id = 'TU_ARTICLE_BATCH_ITEM_ID_AQUI'
ORDER BY adr.dimension_id, adr.iteration;

-- 📊 PASO 2: Contar total de reviews a eliminar
SELECT 
    COUNT(*) as total_reviews_to_delete,
    COUNT(DISTINCT dimension_id) as affected_dimensions,
    MAX(iteration) as max_iteration
FROM article_dimension_reviews
WHERE article_batch_item_id = 'TU_ARTICLE_BATCH_ITEM_ID_AQUI';

-- ⚠️ PASO 3: ELIMINAR todas las reviews del artículo
-- IMPORTANTE: Ejecutar solo si estás seguro de que quieres resetear
DELETE FROM article_dimension_reviews
WHERE article_batch_item_id = 'TU_ARTICLE_BATCH_ITEM_ID_AQUI';

-- ✅ PASO 4: Verificar que se eliminaron correctamente
SELECT 
    COUNT(*) as remaining_reviews
FROM article_dimension_reviews
WHERE article_batch_item_id = 'TU_ARTICLE_BATCH_ITEM_ID_AQUI';
-- Debería retornar 0

-- 🔄 PASO 5: Resetear el status del item en article_batch_items
UPDATE article_batch_items
SET status = 'review_pending'
WHERE id = 'TU_ARTICLE_BATCH_ITEM_ID_AQUI';

-- 📋 PASO 6: Verificar el nuevo status del item
SELECT 
    id,
    batch_id,
    article_id,
    status,
    updated_at
FROM article_batch_items
WHERE id = 'TU_ARTICLE_BATCH_ITEM_ID_AQUI';

-- ============================================================================
-- NOTAS:
-- - Después de ejecutar este script, el artículo estará listo para ser
--   reclasificado desde cero
-- - Puedes volver a ejecutar la preclasificación de IA para este artículo
-- - El artículo aparecerá como "pendiente de revisión" en la UI
-- ============================================================================
