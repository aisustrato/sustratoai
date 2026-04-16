-- ==========================================
-- QUERY PARA VERIFICAR STATUS DE LOTES
-- ==========================================
-- Ejecuta esto en Supabase SQL Editor para ver el status actual de tus lotes

-- Ver todos los lotes del proyecto
SELECT 
    id,
    batch_number,
    name,
    status,
    translation_complete,
    created_at,
    updated_at
FROM article_batches
WHERE project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
ORDER BY batch_number DESC;

-- Ver el lote específico #2 (ajusta el batch_number según necesites)
SELECT 
    ab.id,
    ab.batch_number,
    ab.name,
    ab.status as batch_status,
    ab.translation_complete,
    COUNT(abi.id) as total_items,
    COUNT(CASE WHEN abi.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN abi.status = 'translated' THEN 1 END) as translated,
    COUNT(CASE WHEN abi.status = 'review_pending' THEN 1 END) as review_pending
FROM article_batches ab
LEFT JOIN article_batch_items abi ON ab.id = abi.batch_id
WHERE ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
  AND ab.batch_number = 2
GROUP BY ab.id, ab.batch_number, ab.name, ab.status, ab.translation_complete;

-- Ver el detalle de items de un lote específico (reemplaza el UUID con el de tu lote)
-- SELECT 
--     abi.id,
--     abi.status as item_status,
--     a.correlativo,
--     a.title,
--     CASE 
--         WHEN EXISTS (
--             SELECT 1 FROM article_translations at 
--             WHERE at.article_id = a.id
--         ) THEN 'Sí' 
--         ELSE 'No' 
--     END as tiene_traduccion
-- FROM article_batch_items abi
-- INNER JOIN articles a ON abi.article_id = a.id
-- WHERE abi.batch_id = 'REEMPLAZA-CON-UUID-DEL-LOTE'
-- ORDER BY a.correlativo;
