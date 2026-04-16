-- ========================================================================
-- MIGRACIÓN: Agregar phase_id a RPC de lotes
-- Fecha: 2026-03-12
-- Propósito: Incluir phase_id en el resultado de get_all_project_batches_v4
--            para permitir filtrado por fase en el frontend
-- ========================================================================

-- Eliminar función existente primero (requerido para cambiar tipo de retorno)
DROP FUNCTION IF EXISTS public.get_all_project_batches_v4(UUID);

CREATE OR REPLACE FUNCTION public.get_all_project_batches_v4(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  batch_number INT,
  name TEXT,
  phase_id UUID,
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
    SELECT 
      bi.item_id,
      bi.batch_id,
      bi.item_status,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'disputed'
        ) THEN 'disputed'
        
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'reconciliation_pending'
        ) THEN 'reconciliation_pending'
        
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'reconciled'
        ) THEN 'reconciled'
        
        WHEN EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status = 'validated'
        ) AND NOT EXISTS (
          SELECT 1 FROM latest_dimension_reviews ldr
          WHERE ldr.item_id = bi.item_id 
          AND ldr.review_status IN ('reconciled', 'disputed', 'reconciliation_pending')
        ) THEN 'validated'
        
        WHEN bi.item_status = 'translated' THEN 'translated'
        WHEN bi.item_status = 'review_pending' THEN 'review_pending'
        ELSE 'pending'
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
    b.phase_id,
    b.status,
    b.assigned_to,
    COALESCE(c.status_counts, '{}'::jsonb) as article_counts
  FROM public.article_batches b
  LEFT JOIN counts c ON b.id = c.batch_id
  WHERE b.project_id = p_project_id
  ORDER BY b.batch_number DESC;
END;
$$;

COMMENT ON FUNCTION public.get_all_project_batches_v4 IS 
'Retorna TODOS los lotes de un proyecto con conteos basados en ARTÍCULOS (no dimensiones).
Incluye phase_id para permitir filtrado por fase.
Cada artículo se agrupa por su peor/más avanzado status basado en la ÚLTIMA review de cada dimensión.';

GRANT EXECUTE ON FUNCTION public.get_all_project_batches_v4(UUID) TO authenticated;
