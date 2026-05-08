-- =============================================================================
-- FUNCIÓN RPC: cgt_borrar_artefacto_completo
-- =============================================================================
-- Elimina un artefacto y todos sus datos asociados en una transacción atómica.
-- 
-- Tablas borradas explícitamente (orden: hijos primero, padre al final):
--   1. cgt_artefactos_referencias (puente artefacto↔referencia)
--   2. cgt_nucleos (formato metabolizable, UNIQUE(artefacto_id))
--   3. cgt_germinales (formato metabolizable, UNIQUE(artefacto_id))
--   4. cgt_destilados (formato metabolizable, UNIQUE(artefacto_id))
--   5. cgt_cronicas (formato metabolizable, UNIQUE(artefacto_id))
--   6. cgt_logs_deepseek (actualiza artefacto_id a NULL)
--   7. cgt_artefactos (el artefacto mismo)
--
-- Tablas con CASCADE automático (no necesitan DELETE explícito):
--   - cgt_*_menciones (ON DELETE CASCADE desde cgt_artefactos)
--   - cgt_*_ediciones_humanas (ON DELETE CASCADE desde menciones)
--   - cgt_logs_cartografiador (ON DELETE CASCADE desde cgt_artefactos)
--
-- Seguridad:
--   - RLS: la función se ejecuta con SECURITY INVOKER (permisos del llamador)
--   - Verificación previa: el código debe validar que NO sea entidad canónica
--
-- Ejecutar en Supabase SQL Editor con rol de servicio.
-- =============================================================================

-- Eliminar función existente si existe (para recreación idempotente)
DROP FUNCTION IF EXISTS cgt_borrar_artefacto_completo(UUID);

CREATE OR REPLACE FUNCTION cgt_borrar_artefacto_completo(p_artefacto_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- =================================================================
    -- 1. BORRAR PUENTE DE REFERENCIAS BIBLIOGRÁFICAS (v1.2)
    -- =================================================================
    DELETE FROM cgt_artefactos_referencias 
    WHERE artefacto_id = p_artefacto_id;

    -- =================================================================
    -- 2. BORRAR FORMATOS METABOLIZABLES (1:1 con artefacto)
    -- =================================================================
    -- Estas tablas tienen UNIQUE(artefacto_id), solo puede haber una fila
    
    DELETE FROM cgt_nucleos 
    WHERE artefacto_id = p_artefacto_id;
    
    DELETE FROM cgt_germinales 
    WHERE artefacto_id = p_artefacto_id;
    
    DELETE FROM cgt_destilados 
    WHERE artefacto_id = p_artefacto_id;
    
    DELETE FROM cgt_cronicas 
    WHERE artefacto_id = p_artefacto_id;

    -- =================================================================
    -- 3. LIMPIAR LOGS DE DEEPSEEK (SET NULL en vez de DELETE)
    -- =================================================================
    -- Los logs se conservan para auditoría, solo se desvinculan del artefacto
    UPDATE cgt_logs_deepseek 
    SET artefacto_id = NULL 
    WHERE artefacto_id = p_artefacto_id;

    -- =================================================================
    -- 4. BORRAR EL ARTEFACTO
    -- =================================================================
    -- Al borrar el artefacto, las siguientes tablas se limpian automáticamente
    -- por ON DELETE CASCADE:
    --   - cgt_pensadores_menciones
    --   - cgt_disciplinas_menciones
    --   - cgt_conceptos_menciones
    --   - cgt_teorias_menciones
    --   - cgt_citas_menciones
    --   - cgt_*_ediciones_humanas (por CASCADE desde menciones)
    --   - cgt_logs_cartografiador
    
    DELETE FROM cgt_artefactos 
    WHERE id = p_artefacto_id;

    -- Si el DELETE no encontró filas, no hay error (idempotente)
    -- El código del cliente ya verificó existencia previamente
    
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION cgt_borrar_artefacto_completo(UUID) IS 
    'Elimina un artefacto y todos sus datos asociados en transacción atómica. Borra formatos metabolizables, referencias, menciones (por CASCADE), y desvincula logs. Ejecutar solo después de verificar que NO es entidad canónica.';

-- =============================================================================
-- VERIFICACIÓN (descomentar para probar)
-- =============================================================================
-- SELECT proname, proargtypes, prosrc 
-- FROM pg_proc 
-- WHERE proname = 'cgt_borrar_artefacto_completo';
