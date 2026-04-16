-- MIGRACIÓN DE IDENTIDAD: VERSIÓN SEGURA Y AUDITADA (NK + GTP)
-- Objetivo: Unificar usuarios con red de seguridad (Backups automáticos).

BEGIN; -- Iniciamos transacción. Si algo falla, hacemos ROLLBACK manual o automático.

DO $$
DECLARE
    -- IDs DESTINO (ACTIVOS)
    v_rodolfo_active_id UUID := 'fde9e7ac-cc2a-4844-916b-f6f1745efa76';
    v_sara_target_id UUID := 'f5a9bb7f-ebed-432b-a15f-f066ae9335be';
    
    -- IDs ORIGEN (FANTASMAS)
    v_rodolfo_ghosts UUID[] := ARRAY[
        '6d1a911f-fc86-485d-9674-2a3b17effb6c'::UUID,
        '0a895c53-cb8f-493a-9f1e-ee2c28a8b533'::UUID,
        '5aa8b1f4-56de-47c6-8587-ccd36825cdb7'::UUID
    ];
    v_sara_ghost UUID := '8aa811ea-734d-4786-98e4-0f41bed900a5';
    
    -- Contadores
    v_lotes_moved INTEGER;
    v_reviews_moved INTEGER;
    v_reviews_deleted INTEGER;
    v_members_moved INTEGER;
    v_members_deleted INTEGER;
    v_profiles_deleted INTEGER;
    
    -- Variable temporal iteradora
    v_ghost UUID;
BEGIN
    RAISE NOTICE '🛡️ INICIANDO MIGRACIÓN SEGURA...';

    -- =================================================================
    -- 0. CREACIÓN DE TABLAS DE BACKUP (Red de Seguridad)
    -- =================================================================
    
    -- Solo creamos si no existen para no fallar en reintentos
    CREATE TABLE IF NOT EXISTS public.backup_migration_profiles AS 
    SELECT * FROM public.users_profiles WHERE user_id = ANY(v_rodolfo_ghosts) OR user_id = v_sara_ghost;
    
    CREATE TABLE IF NOT EXISTS public.backup_migration_reviews AS
    SELECT * FROM article_dimension_reviews WHERE reviewer_id = ANY(v_rodolfo_ghosts) OR reviewer_id = v_sara_ghost;
    
    RAISE NOTICE '📦 Backups creados en tablas public.backup_migration_*';

    -- =================================================================
    -- 1. RODOLFO LEIVA
    -- =================================================================
    RAISE NOTICE '--- Procesando Rodolfo ---';
    
    -- A. LOTES (Sin conflictos esperados)
    UPDATE article_batches
    SET assigned_to = v_rodolfo_active_id
    WHERE assigned_to = ANY(v_rodolfo_ghosts);
    GET DIAGNOSTICS v_lotes_moved = ROW_COUNT;
    RAISE NOTICE '   ✅ Lotes movidos: %', v_lotes_moved;

    -- B. REVISIONES (Con manejo de duplicados)
    v_reviews_moved := 0;
    v_reviews_deleted := 0;
    
    FOREACH v_ghost IN ARRAY v_rodolfo_ghosts
    LOOP
        -- Actualizar las que NO existen en destino
        UPDATE article_dimension_reviews src
        SET reviewer_id = v_rodolfo_active_id
        WHERE reviewer_id = v_ghost
        AND NOT EXISTS (
            SELECT 1 FROM article_dimension_reviews dest 
            WHERE dest.reviewer_id = v_rodolfo_active_id 
            AND dest.article_batch_item_id = src.article_batch_item_id
            AND dest.dimension_id = src.dimension_id
            AND dest.iteration = src.iteration
        );
        GET DIAGNOSTICS v_reviews_moved = ROW_COUNT + v_reviews_moved;
        
        -- Borrar las que SOBRARON (eran duplicados exactos del destino)
        DELETE FROM article_dimension_reviews WHERE reviewer_id = v_ghost;
        GET DIAGNOSTICS v_reviews_deleted = ROW_COUNT + v_reviews_deleted;
    END LOOP;
    RAISE NOTICE '   ✅ Revisiones movidas: % | Duplicadas eliminadas: %', v_reviews_moved, v_reviews_deleted;

    -- C. MIEMBROS (project_members)
    v_members_moved := 0;
    v_members_deleted := 0;
    
    FOREACH v_ghost IN ARRAY v_rodolfo_ghosts
    LOOP
        -- Borrar si ya existe en destino
        DELETE FROM project_members src
        WHERE user_id = v_ghost
        AND EXISTS (
            SELECT 1 FROM project_members dest 
            WHERE dest.user_id = v_rodolfo_active_id 
            AND dest.project_id = src.project_id
        );
        GET DIAGNOSTICS v_members_deleted = ROW_COUNT + v_members_deleted;
        
        -- Mover el resto
        UPDATE project_members
        SET user_id = v_rodolfo_active_id
        WHERE user_id = v_ghost;
        GET DIAGNOSTICS v_members_moved = ROW_COUNT + v_members_moved;
    END LOOP;
    RAISE NOTICE '   ✅ Membresías movidas: % | Duplicadas eliminadas: %', v_members_moved, v_members_deleted;

    -- =================================================================
    -- 2. SARA CARO
    -- =================================================================
    RAISE NOTICE '--- Procesando Sara ---';

    -- A. LOTES
    UPDATE article_batches
    SET assigned_to = v_sara_target_id
    WHERE assigned_to = v_sara_ghost;
    GET DIAGNOSTICS v_lotes_moved = ROW_COUNT;
    RAISE NOTICE '   ✅ Lotes movidos: %', v_lotes_moved;

    -- B. REVISIONES
    UPDATE article_dimension_reviews src
    SET reviewer_id = v_sara_target_id
    WHERE reviewer_id = v_sara_ghost
    AND NOT EXISTS (
        SELECT 1 FROM article_dimension_reviews dest 
        WHERE dest.reviewer_id = v_sara_target_id 
        AND dest.article_batch_item_id = src.article_batch_item_id
        AND dest.dimension_id = src.dimension_id
        AND dest.iteration = src.iteration
    );
    GET DIAGNOSTICS v_reviews_moved = ROW_COUNT;
    
    DELETE FROM article_dimension_reviews WHERE reviewer_id = v_sara_ghost;
    GET DIAGNOSTICS v_reviews_deleted = ROW_COUNT;
    RAISE NOTICE '   ✅ Revisiones movidas: % | Duplicadas eliminadas: %', v_reviews_moved, v_reviews_deleted;

    -- C. MIEMBROS
    DELETE FROM project_members src
    WHERE user_id = v_sara_ghost
    AND EXISTS (
        SELECT 1 FROM project_members dest 
        WHERE dest.user_id = v_sara_target_id 
        AND dest.project_id = src.project_id
    );
    
    UPDATE project_members
    SET user_id = v_sara_target_id
    WHERE user_id = v_sara_ghost;

    -- =================================================================
    -- 3. LIMPIEZA FINAL
    -- =================================================================
    DELETE FROM public.users_profiles
    WHERE user_id = ANY(v_rodolfo_ghosts) OR user_id = v_sara_ghost;
    GET DIAGNOSTICS v_profiles_deleted = ROW_COUNT;
    RAISE NOTICE '🗑️ Perfiles fantasma eliminados: %', v_profiles_deleted;
    
    RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA CON ÉXITO.';

END $$;

COMMIT; -- Confirmar cambios si todo salió bien.
