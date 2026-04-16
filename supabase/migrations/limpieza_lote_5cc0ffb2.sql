-- ========================================================================
-- LIMPIEZA: Lote 5cc0ffb2-f9f9-40d3-9782-05cb92dae541
-- Corregir datos corruptos de pruebas
-- ========================================================================

-- ⚠️ IMPORTANTE: Ejecuta primero diagnostico_lote_5cc0ffb2.sql
-- para entender qué hay que limpiar antes de ejecutar esto

-- ========================================================================
-- OPCIÓN 1: Eliminar reviews duplicadas (mismo item + dimensión + iteración)
-- ========================================================================
-- Ejecuta esto SOLO si el diagnóstico mostró duplicados en Query 10

/*
WITH duplicates AS (
  SELECT 
    adr.id,
    ROW_NUMBER() OVER (
      PARTITION BY adr.article_batch_item_id, adr.dimension_id, adr.iteration 
      ORDER BY adr.created_at DESC
    ) as rn
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
  WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
)
DELETE FROM article_dimension_reviews
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
*/

-- ========================================================================
-- OPCIÓN 2: Corregir reviews con status incorrecto
-- ========================================================================
-- Si una review de iteración 3 tiene status 'reconciliation_pending'
-- pero debería ser 'reconciled' o 'disputed'

/*
-- Ver cuáles se corregirían (DRY RUN)
SELECT 
  adr.id,
  a.correlativo,
  pd.name as dimension_name,
  adr.iteration,
  adr.status as current_status,
  adr.reviewer_type,
  'reconciled' as suggested_new_status
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
JOIN articles a ON abi.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
  AND adr.iteration >= 3
  AND adr.status = 'reconciliation_pending'
  AND adr.reviewer_type = 'ai';

-- Aplicar corrección (DESCOMENTAR SOLO SI ESTÁS SEGURO)
-- UPDATE article_dimension_reviews adr
-- SET status = 'reconciled'
-- FROM article_batch_items abi
-- WHERE adr.article_batch_item_id = abi.id
--   AND abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
--   AND adr.iteration >= 3
--   AND adr.status = 'reconciliation_pending'
--   AND adr.reviewer_type = 'ai';
*/

-- ========================================================================
-- OPCIÓN 3: Eliminar reviews de iteración 2 huérfanas
-- ========================================================================
-- Si hay reviews de iteración 2 sin su correspondiente iteración 3

/*
-- Ver cuáles se eliminarían (DRY RUN)
WITH iter2_without_iter3 AS (
  SELECT 
    adr2.id,
    a.correlativo,
    pd.name as dimension_name,
    adr2.article_batch_item_id,
    adr2.dimension_id
  FROM article_dimension_reviews adr2
  JOIN article_batch_items abi ON adr2.article_batch_item_id = abi.id
  JOIN articles a ON abi.article_id = a.id
  JOIN preclass_dimensions pd ON adr2.dimension_id = pd.id
  WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
    AND adr2.iteration = 2
    AND NOT EXISTS (
      SELECT 1 
      FROM article_dimension_reviews adr3
      WHERE adr3.article_batch_item_id = adr2.article_batch_item_id
        AND adr3.dimension_id = adr2.dimension_id
        AND adr3.iteration = 3
    )
)
SELECT * FROM iter2_without_iter3;

-- Aplicar eliminación (DESCOMENTAR SOLO SI ESTÁS SEGURO)
-- DELETE FROM article_dimension_reviews adr
-- USING article_batch_items abi
-- WHERE adr.article_batch_item_id = abi.id
--   AND abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
--   AND adr.iteration = 2
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM article_dimension_reviews adr3
--     WHERE adr3.article_batch_item_id = adr.article_batch_item_id
--       AND adr3.dimension_id = adr.dimension_id
--       AND adr3.iteration = 3
--   );
*/

-- ========================================================================
-- OPCIÓN 4: Reset completo del lote (NUCLEAR)
-- ========================================================================
-- Elimina TODAS las reviews del lote y resetea items a 'pending'
-- Úsalo SOLO si quieres empezar de cero

/*
-- Eliminar todas las reviews
DELETE FROM article_dimension_reviews adr
USING article_batch_items abi
WHERE adr.article_batch_item_id = abi.id
  AND abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- Resetear items a pending
UPDATE article_batch_items
SET status = 'pending'
WHERE batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- Resetear batch a pending
UPDATE article_batches
SET status = 'pending'
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';
*/

-- ========================================================================
-- VERIFICACIÓN POST-LIMPIEZA
-- ========================================================================
-- Ejecuta esto después de cualquier limpieza para verificar

-- Contar reviews por status
SELECT 
  adr.status,
  COUNT(*) as count
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
WHERE abi.batch_id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541'
GROUP BY adr.status
ORDER BY adr.status;

-- Ver qué devuelve la RPC v2
SELECT * FROM get_all_project_batches_v2(
  (SELECT project_id FROM article_batches WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541')
)
WHERE id = '5cc0ffb2-f9f9-40d3-9782-05cb92dae541';

-- ========================================================================
-- INSTRUCCIONES:
-- 1. Ejecuta primero diagnostico_lote_5cc0ffb2.sql
-- 2. Analiza los resultados
-- 3. Descomenta SOLO la opción de limpieza que necesites
-- 4. Ejecuta la verificación post-limpieza
-- ========================================================================
