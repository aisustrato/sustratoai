-- Function: get_all_project_batches
-- Description: Returns all batches for a project with article counts by status.
--              Ignores user assignment to allow full visibility ("Momento sin cierre").

CREATE OR REPLACE FUNCTION get_all_project_batches(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  batch_number INT,
  name TEXT,
  status batch_preclass_status,
  assigned_to UUID,
  article_counts JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH counts AS (
    SELECT 
      batch_id,
      jsonb_object_agg(status, count) as status_counts
    FROM (
      SELECT batch_id, status::text as status, count(*) as count
      FROM article_batch_items
      GROUP BY batch_id, status
    ) sub
    GROUP BY batch_id
  )
  SELECT 
    b.id,
    b.batch_number,
    b.name,
    b.status,
    b.assigned_to,
    COALESCE(c.status_counts, '{}'::jsonb) as article_counts
  FROM article_batches b
  LEFT JOIN counts c ON b.id = c.batch_id
  WHERE b.project_id = p_project_id
  ORDER BY b.batch_number DESC;
END;
$$;

-- Function: is_batch_closed (Optimization for status check)
CREATE OR REPLACE FUNCTION is_batch_closed(p_batch_id UUID)
RETURNS TABLE (
  "isClosed" BOOLEAN,
  "totalDimensions" BIGINT,
  "finalizedDimensions" BIGINT,
  "percentFinalized" NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_dimensions BIGINT;
  v_finalized_dimensions BIGINT;
BEGIN
  -- Count total dimensions (unique reviews per item+dimension)
  SELECT COUNT(*)
  INTO v_total_dimensions
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
  WHERE abi.batch_id = p_batch_id;

  -- Count finalized dimensions
  SELECT COUNT(*)
  INTO v_finalized_dimensions
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
  WHERE abi.batch_id = p_batch_id
  AND adr.is_final = true;

  -- Return result
  RETURN QUERY SELECT
    CASE WHEN v_total_dimensions > 0 AND v_total_dimensions = v_finalized_dimensions THEN true ELSE false END,
    COALESCE(v_total_dimensions, 0),
    COALESCE(v_finalized_dimensions, 0),
    CASE WHEN v_total_dimensions > 0 THEN ROUND((v_finalized_dimensions::numeric / v_total_dimensions::numeric) * 100, 0) ELSE 0 END;
END;
$$;
