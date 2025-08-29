-- RPC: get_article_notes_info_by_batch_item
-- Dado un article_batch_item_id, retorna:
--   - article_id
--   - has_notes (boolean)
--   - note_ids (uuid[])
--   - note_count (integer)
-- Importante: esta función respeta RLS (SECURITY INVOKER por defecto).

CREATE OR REPLACE FUNCTION public.get_article_notes_info_by_batch_item(
  batch_item_id uuid
)
RETURNS TABLE (
  article_id uuid,
  has_notes boolean,
  note_ids uuid[],
  note_count integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  aid uuid;
BEGIN
  -- 1) Obtener article_id a partir del ítem de lote
  SELECT abi.article_id INTO aid
  FROM public.article_batch_items abi
  WHERE abi.id = batch_item_id;

  -- 2) Si no se encontró el artículo, devolver vacío controlado
  IF aid IS NULL THEN
    RETURN QUERY SELECT NULL::uuid AS article_id,
                        FALSE AS has_notes,
                        ARRAY[]::uuid[] AS note_ids,
                        0::int AS note_count;
    RETURN;
  END IF;

  -- 3) Agregar notas visibles según RLS (invoker)
  RETURN QUERY
  SELECT aid AS article_id,
         COUNT(n.id) > 0 AS has_notes,
         COALESCE(
           ARRAY_AGG(n.id ORDER BY n.created_at DESC) FILTER (WHERE n.id IS NOT NULL),
           ARRAY[]::uuid[]
         ) AS note_ids,
         COUNT(n.id)::int AS note_count
  FROM public.article_notes n
  WHERE n.article_id = aid;
END;
$$;
