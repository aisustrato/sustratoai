-- MIGRACIÓN DE IDENTIDAD (VERSIÓN FUERZA BRUTA)
-- Objetivo: Mover datos sí o sí, manejando conflictos de duplicados.

DO $$
DECLARE
    v_rodolfo_active_id UUID := 'fde9e7ac-cc2a-4844-916b-f6f1745efa76';
    v_sara_target_id UUID := 'f5a9bb7f-ebed-432b-a15f-f066ae9335be';
    
    -- Lista de IDs fantasma de Rodolfo
    v_rodolfo_ghosts UUID[] := ARRAY[
        '6d1a911f-fc86-485d-9674-2a3b17effb6c'::UUID,
        '0a895c53-cb8f-493a-9f1e-ee2c28a8b533'::UUID,
        '5aa8b1f4-56de-47c6-8587-ccd36825cdb7'::UUID
    ];
    
    v_sara_ghost UUID := '8aa811ea-734d-4786-98e4-0f41bed900a5';
    
    v_count INTEGER;
    v_ghost UUID;
BEGIN
    RAISE NOTICE '🚀 INICIANDO MIGRACIÓN FUERZA BRUTA...';

    -- =================================================================
    -- 1. RODOLFO LEIVA
    -- =================================================================
    
    -- A. LOTES (article_batches)
    -- Simplemente actualizamos el dueño. No suele haber conflictos únicos aquí.
    UPDATE article_batches
    SET assigned_to = v_rodolfo_active_id
    WHERE assigned_to = ANY(v_rodolfo_ghosts);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Rodolfo: Lotes movidos: %', v_count;

    -- B. REVISIONES (article_dimension_reviews)
    -- Aquí sí puede haber conflicto si el usuario destino YA revisó lo mismo (raro, pero posible).
    -- Estrategia: Intentar UPDATE, si falla, es porque ya existe -> Borrar el origen.
    
    FOREACH v_ghost IN ARRAY v_rodolfo_ghosts
    LOOP
        -- 1. Actualizar lo que se pueda (sin conflicto)
        UPDATE article_dimension_reviews
        SET reviewer_id = v_rodolfo_active_id
        WHERE reviewer_id = v_ghost
        AND NOT EXISTS (
            SELECT 1 FROM article_dimension_reviews dest 
            WHERE dest.reviewer_id = v_rodolfo_active_id 
            AND dest.article_batch_item_id = article_dimension_reviews.article_batch_item_id
            AND dest.dimension_id = article_dimension_reviews.dimension_id
            AND dest.iteration = article_dimension_reviews.iteration
        );
        
        -- 2. Borrar lo que sobró (porque ya existía en destino y era duplicado)
        DELETE FROM article_dimension_reviews WHERE reviewer_id = v_ghost;
    END LOOP;
    RAISE NOTICE '✅ Rodolfo: Revisiones unificadas.';

    -- C. MIEMBROS DE PROYECTO (project_members)
    FOREACH v_ghost IN ARRAY v_rodolfo_ghosts
    LOOP
        -- Si el destino ya está en el proyecto, borramos al fantasma del proyecto.
        DELETE FROM project_members pm_ghost
        WHERE user_id = v_ghost
        AND EXISTS (
            SELECT 1 FROM project_members pm_dest 
            WHERE pm_dest.user_id = v_rodolfo_active_id 
            AND pm_dest.project_id = pm_ghost.project_id
        );
        
        -- Si no estaba, lo movemos.
        UPDATE project_members
        SET user_id = v_rodolfo_active_id
        WHERE user_id = v_ghost;
    END LOOP;
    RAISE NOTICE '✅ Rodolfo: Membresías unificadas.';

    -- =================================================================
    -- 2. SARA CARO
    -- =================================================================
    
    -- A. LOTES
    UPDATE article_batches
    SET assigned_to = v_sara_target_id
    WHERE assigned_to = v_sara_ghost;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Sara: Lotes movidos: %', v_count;

    -- B. REVISIONES
    UPDATE article_dimension_reviews
    SET reviewer_id = v_sara_target_id
    WHERE reviewer_id = v_sara_ghost
    AND NOT EXISTS (
        SELECT 1 FROM article_dimension_reviews dest 
        WHERE dest.reviewer_id = v_sara_target_id 
        AND dest.article_batch_item_id = article_dimension_reviews.article_batch_item_id
        AND dest.dimension_id = article_dimension_reviews.dimension_id
        AND dest.iteration = article_dimension_reviews.iteration
    );
    DELETE FROM article_dimension_reviews WHERE reviewer_id = v_sara_ghost;
    RAISE NOTICE '✅ Sara: Revisiones unificadas.';

    -- C. MIEMBROS
    DELETE FROM project_members pm_ghost
    WHERE user_id = v_sara_ghost
    AND EXISTS (
        SELECT 1 FROM project_members pm_dest 
        WHERE pm_dest.user_id = v_sara_target_id 
        AND pm_dest.project_id = pm_ghost.project_id
    );
    UPDATE project_members
    SET user_id = v_sara_target_id
    WHERE user_id = v_sara_ghost;
    RAISE NOTICE '✅ Sara: Membresías unificadas.';

    -- =================================================================
    -- 3. EXTERMINIO (Borrar perfiles vacíos)
    -- =================================================================
    DELETE FROM public.users_profiles
    WHERE user_id = ANY(v_rodolfo_ghosts) OR user_id = v_sara_ghost;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '🗑️ Perfiles fantasma eliminados: %', v_count;

END $$;
