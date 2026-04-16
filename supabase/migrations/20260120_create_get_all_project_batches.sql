-- ========================================================================
-- MIGRACIÓN: Crear función get_all_project_batches
-- Fecha: 2026-01-20
-- Propósito: Permitir visualización completa de lotes en datos-maestros/lote
--            sin filtrar por usuario asignado ("momento sin cierre")
-- ========================================================================

-- Function: get_all_project_batches (OPTIMIZED & FIXED)
-- Description: Returns all batches for a project with article counts by status.
--              Uses explicit schema qualification and project-scoped aggregation.

CREATE OR REPLACE FUNCTION public.get_all_project_batches(p_project_id UUID)
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
  WITH counts AS (
    -- Optimize: Filter first by project via join to avoid scanning full table
    SELECT 
      abi.batch_id,
      jsonb_object_agg(COALESCE(abi.status::text, 'unknown'), count_val) as status_counts
    FROM (
      SELECT 
        abi_inner.batch_id, 
        abi_inner.status, 
        COUNT(*) as count_val
      FROM public.article_batch_items abi_inner
      JOIN public.article_batches b_inner ON abi_inner.batch_id = b_inner.id
      WHERE b_inner.project_id = p_project_id -- Project scope filter
      GROUP BY abi_inner.batch_id, abi_inner.status
    ) abi
    GROUP BY abi.batch_id
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

COMMENT ON FUNCTION public.get_all_project_batches IS 
'Retorna TODOS los lotes de un proyecto con conteos detallados por estado de artículo.
NO filtra por usuario asignado, permitiendo visibilidad completa ("momento sin cierre").
Usado por: /datos-maestros/lote y /articulos/preclasificacion';

GRANT EXECUTE ON FUNCTION public.get_all_project_batches(UUID) TO authenticated;

-- ========================================================================
-- FIN DE LA MIGRACIÓN
-- ========================================================================
