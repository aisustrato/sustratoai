-- 📍 docs/SQL_LIMPIEZA_FASE2_CORRUPTA.sql
-- 🎯 PROPÓSITO: Limpieza quirúrgica de datos corruptos de la Fase 2
-- 🔧 DECISIÓN: Eliminación en cascada respetando dependencias FK
-- ⚠️ ADVERTENCIA: Ejecutar SOLO en Supabase SQL Editor, verificar fase_id antes de ejecutar

-- ============================================================================
-- LIMPIEZA QUIRÚRGICA DE FASE 2 CORRUPTA
-- ============================================================================
-- Fase ID: 2fc1a3ff-0189-4bf5-a961-ba2cf7b1919f
-- Fecha: 23 Mar 2026
-- Razón: Datos corruptos tras fallo en preclasificación
-- ============================================================================

BEGIN;

-- 🔍 PASO 1: Verificar qué se va a eliminar (INFORMATIVO)
-- ============================================================================
DO $$
DECLARE
    v_phase_id UUID := '2fc1a3ff-0189-4bf5-a961-ba2cf7b1919f';
    v_batch_count INTEGER;
    v_item_count INTEGER;
    v_review_count INTEGER;
BEGIN
    -- Contar lotes
    SELECT COUNT(*) INTO v_batch_count
    FROM article_batches
    WHERE phase_id = v_phase_id;
    
    -- Contar items de lotes
    SELECT COUNT(*) INTO v_item_count
    FROM article_batch_items abi
    INNER JOIN article_batches ab ON abi.batch_id = ab.id
    WHERE ab.phase_id = v_phase_id;
    
    -- Contar revisiones de dimensiones
    SELECT COUNT(*) INTO v_review_count
    FROM article_dimension_reviews adr
    INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
    INNER JOIN article_batches ab ON abi.batch_id = ab.id
    WHERE ab.phase_id = v_phase_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE ELIMINACIÓN - FASE 2';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Phase ID: %', v_phase_id;
    RAISE NOTICE 'Lotes a eliminar: %', v_batch_count;
    RAISE NOTICE 'Items de lotes a eliminar: %', v_item_count;
    RAISE NOTICE 'Revisiones de dimensiones a eliminar: %', v_review_count;
    RAISE NOTICE '========================================';
END $$;

-- 🗑️ PASO 2: Eliminar article_dimension_reviews
-- ============================================================================
-- Primero eliminamos las revisiones porque dependen de article_batch_items
DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM article_dimension_reviews
    WHERE article_batch_item_id IN (
        SELECT abi.id
        FROM article_batch_items abi
        INNER JOIN article_batches ab ON abi.batch_id = ab.id
        WHERE ab.phase_id = '2fc1a3ff-0189-4bf5-a961-ba2cf7b1919f'
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ article_dimension_reviews eliminadas: %', v_deleted_count;
END $$;

-- 🗑️ PASO 3: Eliminar article_batch_items
-- ============================================================================
-- Luego eliminamos los items porque dependen de article_batches
DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM article_batch_items
    WHERE batch_id IN (
        SELECT id
        FROM article_batches
        WHERE phase_id = '2fc1a3ff-0189-4bf5-a961-ba2cf7b1919f'
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ article_batch_items eliminados: %', v_deleted_count;
END $$;

-- 🗑️ PASO 4: Eliminar article_batches
-- ============================================================================
-- Finalmente eliminamos los lotes
DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM article_batches
    WHERE phase_id = '2fc1a3ff-0189-4bf5-a961-ba2cf7b1919f';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ article_batches eliminados: %', v_deleted_count;
END $$;

-- 🔍 PASO 5: Verificación post-limpieza
-- ============================================================================
DO $$
DECLARE
    v_phase_id UUID := '2fc1a3ff-0189-4bf5-a961-ba2cf7b1919f';
    v_batch_count INTEGER;
    v_item_count INTEGER;
    v_review_count INTEGER;
BEGIN
    -- Verificar que no queden lotes
    SELECT COUNT(*) INTO v_batch_count
    FROM article_batches
    WHERE phase_id = v_phase_id;
    
    -- Verificar que no queden items
    SELECT COUNT(*) INTO v_item_count
    FROM article_batch_items abi
    INNER JOIN article_batches ab ON abi.batch_id = ab.id
    WHERE ab.phase_id = v_phase_id;
    
    -- Verificar que no queden revisiones
    SELECT COUNT(*) INTO v_review_count
    FROM article_dimension_reviews adr
    INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
    INNER JOIN article_batches ab ON abi.batch_id = ab.id
    WHERE ab.phase_id = v_phase_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-LIMPIEZA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Lotes restantes: % (debe ser 0)', v_batch_count;
    RAISE NOTICE 'Items restantes: % (debe ser 0)', v_item_count;
    RAISE NOTICE 'Revisiones restantes: % (debe ser 0)', v_review_count;
    
    IF v_batch_count = 0 AND v_item_count = 0 AND v_review_count = 0 THEN
        RAISE NOTICE '✅ LIMPIEZA EXITOSA - Fase 2 completamente limpia';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Aún quedan datos residuales';
    END IF;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Este script elimina SOLO los datos de la Fase 2 específica
-- 2. NO elimina la fase en sí (preclass_phases), solo sus lotes y revisiones
-- 3. NO elimina artículos (articles), solo las relaciones de lotes
-- 4. NO elimina dimensiones (preclass_dimensions), solo las revisiones
-- 5. Después de ejecutar, la Fase 2 estará limpia y lista para recrear lotes
-- 6. Los artículos elegibles (phase_eligible_articles) NO se tocan
-- ============================================================================
