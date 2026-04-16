-- 🧹 LIMPIEZA: Eliminar reviews corruptas de iteración 2 en Lote #19
-- Batch ID: 97bcfad8-c21c-43fc-a222-e28fe23562ec
-- 
-- PROBLEMA: El lote tiene reviews en iteración 2 con status 'reconciliation_pending'
-- cuando visualmente todo está en iteración 1 y aprobado.
--
-- ⚠️ IMPORTANTE: Ejecutar primero SQL_DIAGNOSTICO_LOTE_19.sql para verificar
-- qué reviews se van a eliminar.

-- ============================================================================
-- PASO 1: VERIFICAR CUÁNTAS REVIEWS SE VAN A ELIMINAR (DRY RUN)
-- ============================================================================
SELECT 
    COUNT(*) as reviews_a_eliminar,
    STRING_AGG(DISTINCT status::text, ', ') as status_afectados,
    STRING_AGG(DISTINCT iteration::text, ', ') as iteraciones_afectadas
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.iteration = 2;

-- ============================================================================
-- PASO 2: VER DETALLE DE LO QUE SE VA A ELIMINAR
-- ============================================================================
SELECT 
    adr.id as review_id,
    a.title as articulo,
    pd.name as dimension,
    adr.iteration,
    adr.status,
    adr.value,
    adr.is_final
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
JOIN articles a ON adr.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.iteration = 2
ORDER BY a.title, pd.name;

-- ============================================================================
-- PASO 3: ELIMINAR REVIEWS DE ITERACIÓN 2 (EJECUTAR SOLO SI PASO 1 Y 2 SON CORRECTOS)
-- ============================================================================
-- ⚠️ DESCOMENTAR PARA EJECUTAR:
/*
DELETE FROM article_dimension_reviews
WHERE id IN (
    SELECT adr.id
    FROM article_dimension_reviews adr
    JOIN article_batch_items abi ON adr.article_id = abi.article_id
    WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
        AND adr.iteration = 2
);
*/

-- ============================================================================
-- PASO 4: VERIFICAR RESULTADO DESPUÉS DE LA LIMPIEZA
-- ============================================================================
-- Ejecutar después del DELETE para confirmar que quedó limpio:
/*
SELECT 
    iteration,
    status,
    COUNT(*) as cantidad
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY iteration, status
ORDER BY iteration, status;
*/

-- ============================================================================
-- PASO 5: ACTUALIZAR STATUS DE ITEMS DEL LOTE (SI ES NECESARIO)
-- ============================================================================
-- Si los items quedaron en status incorrecto, actualizarlos:
/*
UPDATE article_batch_items
SET status = 'validated'
WHERE batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND status = 'reconciliation_pending';
*/

-- ============================================================================
-- PASO 6: VERIFICAR QUE AHORA SE PUEDE FINALIZAR
-- ============================================================================
-- Ejecutar la función que verifica si el lote se puede finalizar:
/*
SELECT * FROM is_batch_closed('97bcfad8-c21c-43fc-a222-e28fe23562ec');
*/
