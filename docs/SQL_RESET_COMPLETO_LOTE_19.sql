-- 🔄 RESET COMPLETO: Lote #19 a estado inicial (solo IA, sin revisiones humanas)
-- Batch ID: 97bcfad8-c21c-43fc-a222-e28fe23562ec
--
-- OBJETIVO: Eliminar TODAS las reviews y dejar el lote como recién preclasificado
-- para que puedas revisar desde cero con datos limpios.
--
-- ⚠️ IMPORTANTE: Esto eliminará TODAS las revisiones humanas del lote.
-- Solo ejecutar si estás seguro de querer empezar de cero.

-- ============================================================================
-- PASO 1: VERIFICAR QUÉ SE VA A ELIMINAR (DRY RUN)
-- ============================================================================
SELECT 
    'Reviews a eliminar' as descripcion,
    COUNT(*) as cantidad
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';

-- ============================================================================
-- PASO 2: VER DETALLE POR REVIEWER_TYPE
-- ============================================================================
SELECT 
    adr.reviewer_type,
    adr.iteration,
    adr.status,
    COUNT(*) as cantidad
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY adr.reviewer_type, adr.iteration, adr.status
ORDER BY adr.reviewer_type, adr.iteration, adr.status;

-- ============================================================================
-- PASO 3: ELIMINAR TODAS LAS REVIEWS DEL LOTE
-- ============================================================================
-- ⚠️ DESCOMENTAR PARA EJECUTAR:

DELETE FROM article_dimension_reviews
WHERE id IN (
    SELECT adr.id
    FROM article_dimension_reviews adr
    JOIN article_batch_items abi ON adr.article_id = abi.article_id
    WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
);


-- ============================================================================
-- PASO 4: ACTUALIZAR STATUS DE ITEMS A 'pending'
-- ============================================================================
-- Resetear todos los items del lote a estado inicial
-- ⚠️ DESCOMENTAR PARA EJECUTAR:

UPDATE article_batch_items
SET status = 'pending'
WHERE batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';

-- ============================================================================
-- PASO 5: ACTUALIZAR STATUS DEL BATCH A 'translated'
-- ============================================================================
-- Dejar el lote listo para iniciar preclasificación de nuevo
-- ⚠️ DESCOMENTAR PARA EJECUTAR:

UPDATE article_batches
SET 
    status = 'translated',
    completed_at = NULL
WHERE id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';


-- ============================================================================
-- PASO 6: VERIFICAR RESULTADO DESPUÉS DEL RESET
-- ============================================================================
-- Ejecutar después del reset para confirmar que quedó limpio:
/*
-- Verificar que no hay reviews
SELECT 
    COUNT(*) as reviews_restantes
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';

-- Verificar status de items
SELECT 
    status,
    COUNT(*) as cantidad
FROM article_batch_items
WHERE batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY status;

-- Verificar status del batch
SELECT 
    id,
    batch_number,
    status,
    translation_complete,
    completed_at
FROM article_batches
WHERE id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';
*/

-- ============================================================================
-- RESULTADO ESPERADO DESPUÉS DEL RESET
-- ============================================================================
-- - 0 reviews en article_dimension_reviews
-- - 24 items con status 'pending'
-- - Batch con status 'translated'
-- - completed_at = NULL
-- - Listo para ejecutar preclasificación de nuevo desde el frontend
