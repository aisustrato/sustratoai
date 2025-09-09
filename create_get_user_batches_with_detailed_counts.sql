BEGIN;

-- Paso 1: Eliminar explícitamente la función antigua con la firma incorrecta.
-- Seguimos la recomendación del HINT de la base de datos.
DROP FUNCTION IF EXISTS public.get_user_batches_with_detailed_counts(uuid, uuid);

-- Paso 2: Crear la nueva versión de la función desde cero con la firma correcta.
-- Usamos CREATE OR REPLACE por si el script se corre más de una vez.
CREATE OR REPLACE FUNCTION public.get_user_batches_with_detailed_counts(
  p_project_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  batch_number integer,
  status public.batch_preclass_status,
  assigned_to uuid,
  article_counts jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.batch_number,
    b.status::public.batch_preclass_status AS status,
    b.assigned_to,
    jsonb_build_object(
      'pending',               COALESCE(COUNT(*) FILTER (WHERE abi.status = 'pending'), 0),
      'translated',            COALESCE(COUNT(*) FILTER (WHERE abi.status = 'translated'), 0),
      'pending_review',        COALESCE(COUNT(*) FILTER (WHERE abi.status = 'review_pending'), 0),
      'reconciliation_pending',COALESCE(COUNT(*) FILTER (WHERE abi.status = 'reconciliation_pending'), 0),
      'agreed',                COALESCE(COUNT(*) FILTER (WHERE abi.status = 'validated'), 0),
      'reconciled',            COALESCE(COUNT(*) FILTER (WHERE abi.status = 'reconciled'), 0),
      'disputed',              COALESCE(COUNT(*) FILTER (WHERE abi.status = 'disputed'), 0)
    ) AS article_counts
  FROM public.article_batches b
  LEFT JOIN public.article_batch_items abi ON abi.batch_id = b.id
  WHERE b.project_id = p_project_id
    AND b.assigned_to = p_user_id
    AND EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = b.project_id
        AND pm.user_id = p_user_id
    )
  GROUP BY b.id, b.name, b.batch_number, b.status;
END;
$$;

-- Paso 3: Eliminar el tipo antiguo si aún existe.
DROP TYPE IF EXISTS public.item_preclass_status;

COMMIT;
