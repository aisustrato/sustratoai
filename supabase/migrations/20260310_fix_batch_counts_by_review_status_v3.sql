-- ========================================================================
-- MIGRACIÓN: Corregir conteos de lotes basándose en status de reviews (V3)
-- Fecha: 2026-03-10
-- Propósito: Contar DIMENSIONES por status (no artículos completos)
--            Cada dimensión cuenta según su ÚLTIMA review
-- ========================================================================

-- Function: get_all_project_batches_v3 (FIXED - Cuenta por dimensión)
-- Description: Returns all batches with counts based on LATEST review status per dimension

CREATE OR REPLACE FUNCTION public.get_all_project_batches_v3(p_project_id UUID)
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
      bi.batch_id,
      bi.item_id,
      adr.dimension_id,
      adr.status as review_status,
      adr.iteration
    FROM batch_items bi
    JOIN public.article_dimension_reviews adr ON adr.article_batch_item_id = bi.item_id
    ORDER BY bi.item_id, adr.dimension_id, adr.iteration DESC
  ),
  counts AS (
    -- Contar dimensiones por status
    SELECT 
      ldr.batch_id,
      jsonb_object_agg(
        COALESCE(ldr.review_status::text, 'unknown'), 
        count_val
      ) as status_counts
    FROM (
      SELECT 
        batch_id, 
        review_status, 
        COUNT(*) as count_val
      FROM latest_dimension_reviews
      GROUP BY batch_id, review_status
    ) ldr
    GROUP BY ldr.batch_id
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

COMMENT ON FUNCTION public.get_all_project_batches_v3 IS 
'Retorna TODOS los lotes de un proyecto con conteos basados en ÚLTIMA review de cada dimensión.
Cuenta correctamente: validated, reconciled, disputed, reconciliation_pending.
Lógica: Para cada (item_id, dimension_id) toma la review con mayor iteración.
Usado por: /articulos/preclasificacion (página raíz)';

GRANT EXECUTE ON FUNCTION public.get_all_project_batches_v3(UUID) TO authenticated;

-- ========================================================================
-- ACTUALIZAR BACKEND PARA USAR V3
-- ========================================================================
-- Después de aplicar esta migración, actualiza:
-- /lib/actions/preclassification-actions.ts
-- Línea 40: Cambiar get_all_project_batches_v2 → get_all_project_batches_v3
-- ========================================================================
