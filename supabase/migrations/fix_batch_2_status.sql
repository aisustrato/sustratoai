-- ==========================================
-- ARREGLAR STATUS DEL LOTE #2
-- ==========================================
-- Este lote fue traducido pero el status no se actualizó correctamente

BEGIN;

-- Verificar estado actual
SELECT 
    batch_number,
    status as estado_actual,
    translation_complete
FROM article_batches
WHERE batch_number = 2
  AND project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Actualizar lote a 'translated'
UPDATE article_batches
SET 
    status = 'translated',
    translation_complete = true
WHERE batch_number = 2
  AND project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Verificar que los items estén en 'translated'
UPDATE article_batch_items
SET status = 'translated'
WHERE batch_id = (
    SELECT id 
    FROM article_batches 
    WHERE batch_number = 2 
      AND project_id = '61918743-16a4-4ab5-8378-83fb42e99a61'
)
AND status != 'translated'; -- Solo los que no estén traducidos

-- Verificar resultado
SELECT 
    'Lote actualizado a:' as mensaje,
    batch_number,
    status,
    translation_complete
FROM article_batches
WHERE batch_number = 2
  AND project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

COMMIT;
