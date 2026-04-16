-- ==========================================
-- FIX: get_user_batches_with_detailed_counts debe contar 'validated' correctamente
-- ==========================================
-- Problema: La RPC está contando artículos con status 'validated' en el campo 'agreed'
-- en lugar de 'validated', causando inconsistencia entre esferas y gráfico/leyenda.
--
-- Solución: Actualizar la función para que cuente correctamente cada status en su
-- campo correspondiente, especialmente 'validated'.

-- Eliminar la función existente primero
DROP FUNCTION IF EXISTS get_user_batches_with_detailed_counts(UUID, UUID);

-- Recrear la función con el tipo de retorno correcto
CREATE OR REPLACE FUNCTION get_user_batches_with_detailed_counts(
  p_user_id UUID,
  p_project_id UUID
) RETURNS TABLE (
  id UUID,
  batch_number INTEGER,
  name TEXT,
  status batch_preclass_status,
  assigned_to UUID,
  article_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ab.id,
    ab.batch_number,
    ab.name,
    ab.status,
    ab.assigned_to,
    jsonb_build_object(
      'pending', COALESCE(SUM(CASE WHEN abi.status = 'pending' THEN 1 ELSE 0 END), 0),
      'translated', COALESCE(SUM(CASE WHEN abi.status = 'translated' THEN 1 ELSE 0 END), 0),
      'pending_review', COALESCE(SUM(CASE WHEN abi.status = 'review_pending' THEN 1 ELSE 0 END), 0),
      'reconciliation_pending', COALESCE(SUM(CASE WHEN abi.status = 'reconciliation_pending' THEN 1 ELSE 0 END), 0),
      'validated', COALESCE(SUM(CASE WHEN abi.status = 'validated' THEN 1 ELSE 0 END), 0),
      'reconciled', COALESCE(SUM(CASE WHEN abi.status = 'reconciled' THEN 1 ELSE 0 END), 0),
      'disputed', COALESCE(SUM(CASE WHEN abi.status = 'disputed' THEN 1 ELSE 0 END), 0)
    ) as article_counts
  FROM article_batches ab
  LEFT JOIN article_batch_items abi ON abi.batch_id = ab.id
  WHERE ab.project_id = p_project_id
    AND ab.assigned_to = p_user_id
  GROUP BY ab.id, ab.batch_number, ab.name, ab.status, ab.assigned_to
  ORDER BY ab.batch_number DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Comentario explicativo
COMMENT ON FUNCTION get_user_batches_with_detailed_counts IS 
'Retorna los lotes asignados a un usuario con conteos detallados por estado de artículo. 
✅ CORREGIDO: Ahora cuenta correctamente validated en su propio campo.';

-- Verificar la corrección (ejecutar manualmente con IDs reales)
-- SELECT * FROM get_user_batches_with_detailed_counts('USER_ID', 'PROJECT_ID');
