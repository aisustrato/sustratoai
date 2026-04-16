-- ========================================================================
-- MIGRACIÓN: Corregir conteos de lotes - V4 (DEFINITIVA)
-- Fecha: 2026-03-10
-- Propósito: Contar ARTÍCULOS (no dimensiones) agrupados por peor/más avanzado status
--            Usa ÚLTIMA review por dimensión para determinar status del artículo
-- ========================================================================

-- Function: get_all_project_batches_v4 (FIXED - Cuenta artículos correctamente)
-- Description: Returns all batches with counts based on article status (worst/most advanced)

CREATE OR REPLACE FUNCTION public.get_all_project_batches_v4(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  batch_number INT,
  name TEXT,
  status public.batch_preclass_status,
  assigned_to UUID,
  article_counts JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH batch_items AS (
    -- Get all items for batches in this project
    SELECT 
      abi.id as item_id,
      abi.batch_id,
      abi.status as item_status
    FROM public.article_batch_items abi
    JOIN public.article_batches b ON abi.batch_id = b.id
    WHERE b.project_id = p_project_id
  ),
  latest_dimension_reviews AS (
    -- Para cada item + dimensión, obtener la ÚLTIMA review (mayor iteración)
    SELECT DISTINCT ON (bi.item_id, adr.dimension_id)
      bi.item_id,
      bi.batch_id,
      adr.dimension_id,
      adr.status as review_status,
      adr.iteration
    FROM batch_items bi
    JOIN public.article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
    ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
  ),
  item_review_status AS (
    -- Para cada artículo, determinar su status efectivo basado en el peor/más avanzado status de sus dimensiones
    -- Prioridad: disputed > reconciliation_pending > reconciled > validated > review_pending > pending
    SELECT 
      bi.item_id,
      bi.batch_id,
      bi.item_status,
      CASE 
        -- PRIORIDAD 1: Si tiene alguna dimensión en disputed → disputed (peor caso)
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'disputed'
        ) THEN 'disputed'
        
        -- PRIORIDAD 2: Si tiene alguna dimensión en reconciliation_pending → reconciliation_pending
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'reconciliation_pending'
        ) THEN 'reconciliation_pending'
        
        -- PRIORIDAD 3: Si tiene AL MENOS UNA dimensión en reconciled → reconciled
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'reconciled'
        ) THEN 'reconciled'
        
        -- PRIORIDAD 4: Si TODAS las dimensiones están en validated → validated
        -- (Si tuviera reconciled/disputed/pending ya fue capturado por prioridades anteriores)
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id
        ) AND NOT EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status <> 'validated'
        ) THEN 'validated'
        
        -- PRIORIDAD 5: Si tiene reviews pero no están en ningún estado final → review_pending
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id
        ) THEN 'review_pending'
        
        -- PRIORIDAD 6: Si no tiene reviews, usar item_status (pending o translated)
        ELSE bi.item_status::text
      END as effective_status
    FROM batch_items bi
  ),
  counts AS (
    SELECT 
      batch_id,
      jsonb_object_agg(
        COALESCE(effective_status, 'unknown'), 
        count_val
      ) as status_counts
    FROM (
      SELECT 
        batch_id, 
        effective_status, 
        COUNT(*) as count_val
      FROM item_review_status
      GROUP BY batch_id, effective_status
    ) grouped
    GROUP BY batch_id
  )
  SELECT 
    b.id,
    b.batch_number,
    b.name,
    b.status,
    b.assigned_to,
    COALESCE(c.status_counts, '{}'::jsonb) as article_counts
  FROM public.article_batches b
  LEFT JOIN counts c ON b.id = c.batch_id
  WHERE b.project_id = p_project_id
  ORDER BY b.batch_number DESC;
END;
$$;

-- ========================================================================
-- COMENTARIO Y PERMISOS
-- ========================================================================

COMMENT ON FUNCTION public.get_all_project_batches_v4 IS 
'Retorna TODOS los lotes de un proyecto con conteos basados en ARTÍCULOS (no dimensiones).
Cada artículo se agrupa por su peor/más avanzado status basado en la ÚLTIMA review de cada dimensión.
Cuenta correctamente: pending, translated, review_pending, validated, reconciliation_pending, reconciled, disputed.
Usado por: /articulos/preclasificacion (página raíz)';

GRANT EXECUTE ON FUNCTION public.get_all_project_batches_v4(UUID) TO authenticated;

-- ========================================================================
-- ACTUALIZAR BACKEND PARA USAR V4
-- ========================================================================
-- Después de aplicar esta migración, actualiza:
-- /lib/actions/preclassification-actions.ts
-- Línea ~40: Cambiar get_all_project_batches_v2 → get_all_project_batches_v4
-- ========================================================================
