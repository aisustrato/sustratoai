-- ========================================================================
-- MIGRACIÓN: Corregir conteos de lotes basándose en status de reviews
-- Fecha: 2026-03-10
-- Propósito: Contar artículos por status de reviews (validated, reconciled, disputed)
--            en lugar de solo por article_batch_items.status
-- ========================================================================

-- Function: get_all_project_batches_v2 (FIXED COUNTS)
-- Description: Returns all batches with counts based on review status
--              Counts validated, reconciled, disputed from article_dimension_reviews

CREATE OR REPLACE FUNCTION public.get_all_project_batches_v2(p_project_id UUID)
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
  item_review_status AS (
    -- For each item, get the most critical review status
    -- Priority: disputed > reconciliation_pending > reconciled > validated > review_pending > pending
    SELECT 
      bi.item_id,
      bi.batch_id,
      bi.item_status,
      CASE 
        -- Si tiene alguna review en disputed → disputed
        WHEN EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id 
          AND r.status = 'disputed'
        ) THEN 'disputed'
        
        -- Si tiene alguna review en reconciliation_pending → reconciliation_pending
        WHEN EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id 
          AND r.status = 'reconciliation_pending'
        ) THEN 'reconciliation_pending'
        
        -- Si TODAS las reviews están en reconciled → reconciled
        WHEN EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id
        ) AND NOT EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id 
          AND r.status NOT IN ('reconciled')
        ) THEN 'reconciled'
        
        -- Si TODAS las reviews están en validated → validated
        WHEN EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id
        ) AND NOT EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id 
          AND r.status NOT IN ('validated')
        ) THEN 'validated'
        
        -- Si tiene reviews pero no están todas validated/reconciled → review_pending
        WHEN EXISTS (
          SELECT 1 FROM public.article_dimension_reviews r 
          WHERE r.article_batch_item_id = bi.item_id
        ) THEN 'review_pending'
        
        -- Si no tiene reviews, usar item_status
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

COMMENT ON FUNCTION public.get_all_project_batches_v2 IS 
'Retorna TODOS los lotes de un proyecto con conteos basados en status de reviews.
Cuenta correctamente: validated, reconciled, disputed, reconciliation_pending.
Usado por: /articulos/preclasificacion (página raíz)';

GRANT EXECUTE ON FUNCTION public.get_all_project_batches_v2(UUID) TO authenticated;

-- ========================================================================
-- FIN DE LA MIGRACIÓN
-- ========================================================================
