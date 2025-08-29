-- RPC: bulk_get_notes_info_for_batch
-- Dado un batch_id, retorna una fila por cada item del lote con:
--   - item_id (uuid)
--   - article_id (uuid)
--   - has_notes (boolean)
--   - note_ids (uuid[])
--   - note_count (integer)
-- Importante: SECURITY INVOKER para respetar RLS en article_notes.

CREATE OR REPLACE FUNCTION public.bulk_get_notes_info_for_batch(
  p_batch_id uuid
)
RETURNS TABLE (
  item_id uuid,
  article_id uuid,
  has_notes boolean,
  note_ids uuid[],
  note_count integer
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    abi.id AS item_id,
    abi.article_id AS article_id,
    COUNT(n.id) > 0 AS has_notes,
    COALESCE(
      ARRAY_AGG(n.id ORDER BY n.created_at DESC) FILTER (WHERE n.id IS NOT NULL),
      ARRAY[]::uuid[]
    ) AS note_ids,
    COUNT(n.id)::int AS note_count
  FROM public.article_batch_items abi
  LEFT JOIN public.article_notes n
    ON n.article_id = abi.article_id
  WHERE abi.batch_id = p_batch_id
  GROUP BY abi.id, abi.article_id
$$;
