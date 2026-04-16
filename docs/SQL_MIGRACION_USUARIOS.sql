-- MIGRACIÓN DE IDENTIDAD Y UNIFICACIÓN DE USUARIOS
-- Objetivo: Transferir historial y permisos a los usuarios activos, eliminando perfiles fantasma.

-- =============================================================================
-- 1. DEFINIR LOS IDs (VARIABLES)
-- =============================================================================

-- 👤 RODOLFO LEIVA
-- ID ACTIVO (El que tiene Auth real): 'fde9e7ac-cc2a-4844-916b-f6f1745efa76' (leivarojas@pm.me)
-- IDs FANTASMA (Perfiles sin Auth) a migrar hacia el activo:
--   - '6d1a911f-fc86-485d-9674-2a3b17effb6c' (Rodolfo Andres Leiva Rojas)
--   - '0a895c53-cb8f-493a-9f1e-ee2c28a8b533' (Rodolfo Andres Leiva rojas)
--   - '5aa8b1f4-56de-47c6-8587-ccd36825cdb7' (rodolfo.leiva.rojas@gmail.com -> Fusionar a cuenta Proton por ahora)

-- 👤 SARA CARO
-- CORREO DESTINO: 'saracaropuga@gmail.com' (Necesitamos que este tenga Auth)
-- IDs FANTASMA a unificar:
--   - 'f5a9bb7f-ebed-432b-a15f-f066ae9335be' (Sara Caro Puga - Gmail)
--   - '8aa811ea-734d-4786-98e4-0f41bed900a5' (Sara Caro - UC)

-- =============================================================================
-- 2. EJECUCIÓN DE LA MIGRACIÓN (BLOQUE TRANSACCIONAL)
-- =============================================================================

DO $$
DECLARE
    v_rodolfo_active_id UUID := 'fde9e7ac-cc2a-4844-916b-f6f1745efa76';
    
    -- IDs fantasmas de Rodolfo
    v_rodolfo_ghost_1 UUID := '6d1a911f-fc86-485d-9674-2a3b17effb6c';
    v_rodolfo_ghost_2 UUID := '0a895c53-cb8f-493a-9f1e-ee2c28a8b533';
    v_rodolfo_ghost_3 UUID := '5aa8b1f4-56de-47c6-8587-ccd36825cdb7'; -- El de gmail viejo
    
    -- IDs fantasmas de Sara (Necesitamos crearle un Auth real primero, pero por ahora unifiquemos perfiles)
    -- Usaremos el perfil de Gmail como "principal" temporalmente hasta que se registre
    v_sara_target_id UUID := 'f5a9bb7f-ebed-432b-a15f-f066ae9335be'; 
    v_sara_ghost_uc UUID := '8aa811ea-734d-4786-98e4-0f41bed900a5';

BEGIN
    -- -----------------------------------------------------
    -- A. MIGRACIÓN DE RODOLFO (Todo al ID Activo)
    -- -----------------------------------------------------
    RAISE NOTICE 'Iniciando migración para Rodolfo...';

    -- 1. Mover Lotes (Assigned To)
    UPDATE article_batches 
    SET assigned_to = v_rodolfo_active_id 
    WHERE assigned_to IN (v_rodolfo_ghost_1, v_rodolfo_ghost_2, v_rodolfo_ghost_3);

    -- 2. Mover Revisiones (Reviewer ID)
    UPDATE article_dimension_reviews 
    SET reviewer_id = v_rodolfo_active_id 
    WHERE reviewer_id IN (v_rodolfo_ghost_1, v_rodolfo_ghost_2, v_rodolfo_ghost_3);
    
    -- 3. Mover Membresía de Proyectos
    -- (Usamos ON CONFLICT DO NOTHING implícito borrando primero si ya existe en destino)
    DELETE FROM project_members 
    WHERE user_id IN (v_rodolfo_ghost_1, v_rodolfo_ghost_2, v_rodolfo_ghost_3)
    AND EXISTS (SELECT 1 FROM project_members WHERE user_id = v_rodolfo_active_id AND project_id = project_members.project_id);

    UPDATE project_members
    SET user_id = v_rodolfo_active_id
    WHERE user_id IN (v_rodolfo_ghost_1, v_rodolfo_ghost_2, v_rodolfo_ghost_3);

    -- -----------------------------------------------------
    -- B. MIGRACIÓN DE SARA (Todo al perfil Gmail)
    -- -----------------------------------------------------
    RAISE NOTICE 'Iniciando unificación de perfiles para Sara...';

    -- 1. Mover Lotes
    UPDATE article_batches 
    SET assigned_to = v_sara_target_id 
    WHERE assigned_to = v_sara_ghost_uc;

    -- 2. Mover Revisiones
    UPDATE article_dimension_reviews 
    SET reviewer_id = v_sara_target_id 
    WHERE reviewer_id = v_sara_ghost_uc;
    
    -- 3. Mover Membresía
    UPDATE project_members
    SET user_id = v_sara_target_id
    WHERE user_id = v_sara_ghost_uc;

    -- -----------------------------------------------------
    -- C. LIMPIEZA DE FANTASMAS (Solo perfiles, no Auth porque no tienen)
    -- -----------------------------------------------------
    RAISE NOTICE 'Eliminando perfiles fantasmas vacíos...';
    
    DELETE FROM public.users_profiles 
    WHERE user_id IN (v_rodolfo_ghost_1, v_rodolfo_ghost_2, v_rodolfo_ghost_3, v_sara_ghost_uc);

    RAISE NOTICE 'Migración completada exitosamente.';
END $$;

-- 3. CONSULTA DE VERIFICACIÓN FINAL
SELECT 
    up.public_contact_email,
    up.first_name || ' ' || up.last_name as nombre,
    count(DISTINCT ab.id) as lotes_asignados,
    count(DISTINCT adr.id) as revisiones_realizadas
FROM public.users_profiles up
LEFT JOIN article_batches ab ON up.user_id = ab.assigned_to
LEFT JOIN article_dimension_reviews adr ON up.user_id = adr.reviewer_id
GROUP BY up.public_contact_email, up.first_name, up.last_name;
