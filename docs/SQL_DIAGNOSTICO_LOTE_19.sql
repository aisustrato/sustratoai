-- 🔍 DIAGNÓSTICO COMPLETO: Lote #19 (97bcfad8-c21c-43fc-a222-e28fe23562ec)
-- Investigar por qué detecta 24 dimensiones en iteración 2 pendientes de reconciliación

-- ============================================================================
-- 1. INFORMACIÓN BÁSICA DEL LOTE
-- ============================================================================
SELECT 
    id,
    batch_number,
    status,
    translation_complete,
    created_at,
    started_at,
    completed_at
FROM article_batches
WHERE id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';

-- ============================================================================
-- 2. CONTEO DE ITEMS POR STATUS
-- ============================================================================
SELECT 
    status,
    COUNT(*) as cantidad
FROM article_batch_items
WHERE batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY status
ORDER BY status;

-- ============================================================================
-- 3. ANÁLISIS DE REVIEWS POR ITERACIÓN Y STATUS
-- ============================================================================
SELECT 
    adr.iteration,
    adr.status,
    COUNT(*) as cantidad_reviews
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY adr.iteration, adr.status
ORDER BY adr.iteration, adr.status;

-- ============================================================================
-- 4. DETALLE DE REVIEWS EN ITERACIÓN 2 (LAS PROBLEMÁTICAS)
-- ============================================================================
SELECT 
    adr.id as review_id,
    adr.article_id,
    a.title as articulo_titulo,
    pd.name as dimension_nombre,
    adr.iteration,
    adr.status,
    adr.classification_value,
    adr.confidence_score,
    adr.is_final,
    adr.created_at
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
JOIN articles a ON adr.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.iteration = 2
ORDER BY adr.article_id, pd.name;

-- ============================================================================
-- 5. VERIFICAR SI HAY REVIEWS DUPLICADAS (MISMO ARTÍCULO + DIMENSIÓN + ITERACIÓN)
-- ============================================================================
SELECT 
    adr.article_id,
    a.title,
    pd.name as dimension,
    adr.iteration,
    COUNT(*) as cantidad_duplicados
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
JOIN articles a ON adr.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY adr.article_id, a.title, pd.name, adr.iteration
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- ============================================================================
-- 6. REVIEWS CON STATUS 'reconciliation_pending' (EL PROBLEMA ESPECÍFICO)
-- ============================================================================
SELECT 
    adr.id as review_id,
    a.title as articulo,
    pd.name as dimension,
    adr.iteration,
    adr.status,
    adr.classification_value,
    adr.rationale,
    adr.is_final,
    adr.created_at
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
JOIN articles a ON adr.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.status = 'reconciliation_pending'
ORDER BY a.title, pd.name, adr.iteration;

-- ============================================================================
-- 7. CONTEO DE DIMENSIONES POR ARTÍCULO (DEBERÍA SER 6 POR ARTÍCULO)
-- ============================================================================
SELECT 
    a.id,
    a.title,
    COUNT(DISTINCT adr.dimension_id) as dimensiones_distintas,
    COUNT(*) as total_reviews
FROM articles a
JOIN article_batch_items abi ON a.id = abi.article_id
LEFT JOIN article_dimension_reviews adr ON a.id = adr.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY a.id, a.title
ORDER BY dimensiones_distintas DESC, total_reviews DESC;

-- ============================================================================
-- 8. VERIFICAR LÓGICA DE FINALIZACIÓN (is_final)
-- ============================================================================
SELECT 
    COUNT(*) FILTER (WHERE is_final = true) as finalizadas,
    COUNT(*) FILTER (WHERE is_final = false) as no_finalizadas,
    COUNT(*) as total
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec';

-- ============================================================================
-- 9. ARTÍCULOS CON MEZCLA DE ITERACIONES (POSIBLE CORRUPCIÓN)
-- ============================================================================
SELECT 
    a.id,
    a.title,
    STRING_AGG(DISTINCT adr.iteration::text, ', ' ORDER BY adr.iteration::text) as iteraciones_presentes,
    COUNT(*) as total_reviews
FROM articles a
JOIN article_batch_items abi ON a.id = abi.article_id
JOIN article_dimension_reviews adr ON a.id = adr.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
GROUP BY a.id, a.title
HAVING COUNT(DISTINCT adr.iteration) > 1
ORDER BY total_reviews DESC;

-- ============================================================================
-- 10. RESUMEN EJECUTIVO
-- ============================================================================
SELECT 
    'Total artículos' as metrica,
    COUNT(DISTINCT abi.article_id)::text as valor
FROM article_batch_items abi
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'

UNION ALL

SELECT 
    'Total reviews',
    COUNT(*)::text
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'

UNION ALL

SELECT 
    'Reviews iteración 1',
    COUNT(*)::text
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.iteration = 1

UNION ALL

SELECT 
    'Reviews iteración 2',
    COUNT(*)::text
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.iteration = 2

UNION ALL

SELECT 
    'Reviews con status reconciliation_pending',
    COUNT(*)::text
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_id = abi.article_id
WHERE abi.batch_id = '97bcfad8-c21c-43fc-a222-e28fe23562ec'
    AND adr.status = 'reconciliation_pending';
