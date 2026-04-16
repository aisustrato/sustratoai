-- ==========================================
-- INVESTIGACIÓN: ¿Qué pasó con el Lote #2?
-- ==========================================

-- 1️⃣ Ver el historial de trabajos de IA para este lote
SELECT 
    job_type,
    status,
    description,
    started_at,
    completed_at,
    progress,
    error_message,
    details
FROM ai_job_history
WHERE project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
  AND (
    description ILIKE '%Lote #2%' 
    OR description ILIKE '%Lote 2%'
    OR details::text ILIKE '%"batch_number":2%'
    OR details::text ILIKE '%"batchNumber":2%'
  )
ORDER BY started_at DESC;

-- 2️⃣ Ver si hay preclasificaciones para el Lote #2
SELECT 
    COUNT(*) as total_preclasificaciones,
    COUNT(DISTINCT adr.article_batch_item_id) as items_preclasificados,
    MIN(adr.created_at) as primera_preclasificacion,
    MAX(adr.created_at) as ultima_preclasificacion
FROM article_dimension_reviews adr
INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
INNER JOIN article_batches ab ON abi.batch_id = ab.id
WHERE ab.batch_number = 2
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- 3️⃣ Ver el estado actual del lote y sus items
SELECT 
    'Batch' as tipo,
    ab.status as estado,
    ab.updated_at as ultima_actualizacion,
    NULL::text as info_adicional
FROM article_batches ab
WHERE ab.batch_number = 2
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'

UNION ALL

SELECT 
    'Items' as tipo,
    abi.status as estado,
    NULL::timestamp as ultima_actualizacion,
    CONCAT(COUNT(*), ' items') as info_adicional
FROM article_batch_items abi
INNER JOIN article_batches ab ON abi.batch_id = ab.id
WHERE ab.batch_number = 2
  AND ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
GROUP BY abi.status
ORDER BY tipo, estado;
