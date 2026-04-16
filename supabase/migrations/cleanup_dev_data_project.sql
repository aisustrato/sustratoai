-- ==========================================
-- SCRIPT DE LIMPIEZA DE DATOS DE DESARROLLO
-- Proyecto: 61918743-16a4-4ab5-8378-83fb42e99a61
-- ==========================================
-- 
-- ⚠️ ADVERTENCIA: Este script borrará:
-- 1. Todas las preclasificaciones (article_dimension_reviews)
-- 2. Todos los items de lotes (article_batch_items)
-- 3. Todos los lotes (article_batches)
-- 4. Todas las traducciones (article_translations)
-- 
-- del proyecto especificado.
--
-- ✅ NO TOCARÁ:
-- - Artículos (articles)
-- - Fases (phases)
-- - Dimensiones (preclass_dimensions)
-- - Opciones de dimensiones (preclass_dimension_options)
-- - Artículos elegibles (phase_eligible_articles)
-- - Grupos de artículos
-- - Usuarios
-- - Otras tablas del proyecto
--
-- ==========================================

BEGIN;

-- Variable del proyecto
DO $$
DECLARE
    target_project_id UUID := '61918743-16a4-4ab5-8378-83fb42e99a61';
    deleted_reviews INTEGER := 0;
    deleted_batch_items INTEGER := 0;
    deleted_batches INTEGER := 0;
    deleted_translations INTEGER := 0;
BEGIN
    RAISE NOTICE '🧹 Iniciando limpieza de datos para proyecto: %', target_project_id;
    RAISE NOTICE '================================================';
    
    -- ==========================================
    -- 1️⃣ BORRAR PRECLASIFICACIONES (article_dimension_reviews)
    -- ==========================================
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣ Borrando preclasificaciones...';
    
    -- Obtener IDs de items de lotes del proyecto
    WITH batch_items AS (
        SELECT abi.id
        FROM article_batch_items abi
        INNER JOIN article_batches ab ON abi.batch_id = ab.id
        WHERE ab.project_id = target_project_id
    )
    DELETE FROM article_dimension_reviews
    WHERE article_batch_item_id IN (SELECT id FROM batch_items);
    
    GET DIAGNOSTICS deleted_reviews = ROW_COUNT;
    RAISE NOTICE '   ✅ Borrados % registros de article_dimension_reviews', deleted_reviews;
    
    -- ==========================================
    -- 2️⃣ BORRAR ITEMS DE LOTES (article_batch_items)
    -- ==========================================
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Borrando items de lotes...';
    
    DELETE FROM article_batch_items
    WHERE batch_id IN (
        SELECT id FROM article_batches WHERE project_id = target_project_id
    );
    
    GET DIAGNOSTICS deleted_batch_items = ROW_COUNT;
    RAISE NOTICE '   ✅ Borrados % registros de article_batch_items', deleted_batch_items;
    
    -- ==========================================
    -- 3️⃣ BORRAR LOTES (article_batches)
    -- ==========================================
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ Borrando lotes...';
    
    DELETE FROM article_batches
    WHERE project_id = target_project_id;
    
    GET DIAGNOSTICS deleted_batches = ROW_COUNT;
    RAISE NOTICE '   ✅ Borrados % registros de article_batches', deleted_batches;
    
    -- ==========================================
    -- 4️⃣ BORRAR TRADUCCIONES (article_translations)
    -- ==========================================
    RAISE NOTICE '';
    RAISE NOTICE '4️⃣ Borrando traducciones...';
    
    -- Obtener IDs de artículos del proyecto
    DELETE FROM article_translations
    WHERE article_id IN (
        SELECT id FROM articles WHERE project_id = target_project_id
    );
    
    GET DIAGNOSTICS deleted_translations = ROW_COUNT;
    RAISE NOTICE '   ✅ Borrados % registros de article_translations', deleted_translations;
    
    -- ==========================================
    -- 📊 RESUMEN
    -- ==========================================
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 RESUMEN DE LIMPIEZA:';
    RAISE NOTICE '================================================';
    RAISE NOTICE '   Preclasificaciones borradas: %', deleted_reviews;
    RAISE NOTICE '   Items de lotes borrados: %', deleted_batch_items;
    RAISE NOTICE '   Lotes borrados: %', deleted_batches;
    RAISE NOTICE '   Traducciones borradas: %', deleted_translations;
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Limpieza completada exitosamente';
    RAISE NOTICE '';
    RAISE NOTICE '💡 NOTA: El próximo lote creado tomará automáticamente';
    RAISE NOTICE '   el número de lote correcto (máximo existente + 1)';
    RAISE NOTICE '';
    
END $$;

-- Si todo salió bien, hacer COMMIT
COMMIT;

-- ==========================================
-- 🔍 VERIFICACIÓN POST-LIMPIEZA
-- ==========================================
-- Ejecuta estas queries para verificar que la limpieza fue exitosa:

-- Verificar que no quedan lotes del proyecto:
-- SELECT COUNT(*) as lotes_restantes FROM article_batches WHERE project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Verificar que no quedan items de lotes del proyecto:
-- SELECT COUNT(*) as items_restantes FROM article_batch_items abi
-- INNER JOIN article_batches ab ON abi.batch_id = ab.id
-- WHERE ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Verificar que no quedan preclasificaciones del proyecto:
-- SELECT COUNT(*) as reviews_restantes FROM article_dimension_reviews adr
-- INNER JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
-- INNER JOIN article_batches ab ON abi.batch_id = ab.id
-- WHERE ab.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Verificar que no quedan traducciones del proyecto:
-- SELECT COUNT(*) as traducciones_restantes FROM article_translations at
-- INNER JOIN articles a ON at.article_id = a.id
-- WHERE a.project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';

-- Verificar el máximo batch_number actual (debería ser 0 o NULL si no hay lotes):
-- SELECT MAX(batch_number) as max_batch_number FROM article_batches WHERE project_id = '61918743-16a4-4ab5-8378-83fb42e99a61';
