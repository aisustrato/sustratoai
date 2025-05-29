-- Función RPC que evita completamente el problema de RLS
CREATE OR REPLACE FUNCTION public.get_all_projects()
RETURNS SETOF proyecto
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM proyecto LIMIT 50;
$$;
