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
