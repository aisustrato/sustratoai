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

-- Function: is_batch_closed (OPTIMIZED & FIXED)
-- Description: Checks if a batch is closed by counting finalized dimensions.
--              Uses robust counting logic handling potential duplicates.

CREATE OR REPLACE FUNCTION public.is_batch_closed(p_batch_id UUID)
RETURNS TABLE (
  "isClosed" BOOLEAN,          -- Quoted to match JS case sensitivity expectation
  "totalDimensions" BIGINT,    -- Quoted to match JS case sensitivity expectation
  "finalizedDimensions" BIGINT,-- Quoted to match JS case sensitivity expectation
  "percentFinalized" NUMERIC   -- Quoted to match JS case sensitivity expectation
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- is_closed
    CASE WHEN total > 0 AND total = finalized THEN true ELSE false END,
    -- total_dimensions
    COALESCE(total, 0),
    -- finalized_dimensions
    COALESCE(finalized, 0),
    -- percent_finalized (integer percent)
    CASE WHEN COALESCE(total, 0) > 0
      THEN ROUND((finalized::numeric / total::numeric) * 100, 0)
      ELSE 0 END
  FROM (
    SELECT
      -- Fallback for row constructor distinct if needed, but standard Postgres supports it.
      -- Using simple count here assuming integrity is managed elsewhere, but DISTINCT adds safety.
      COUNT(DISTINCT (adr.article_batch_item_id, adr.dimension_id))::bigint AS total,
      COUNT(DISTINCT (CASE WHEN adr.is_final THEN (adr.article_batch_item_id, adr.dimension_id) END))::bigint AS finalized
    FROM public.article_dimension_reviews adr
    JOIN public.article_batch_items abi ON adr.article_batch_item_id = abi.id
    WHERE abi.batch_id = p_batch_id
  ) q;
END;
$$;
