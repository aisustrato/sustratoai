-- 📍 supabase/migrations/20260818_openalex_staging_harvest.sql
-- OpenAlex Harvester & Staging Buffer.
--
-- Pesca masiva de literatura vía la API pública de OpenAlex hacia un buffer
-- de triaje por proyecto (`staging_articles`), separado de la tabla maestra
-- `articles`. Los artículos aprobados se promueven a `articles`, que gana
-- columnas nuevas para guardar metadatos de OpenAlex.
--
-- Ver docs/preclasificacion-auditoria-funcional/04_Requerimiento_OpenAlex_Harvester.md
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio.

-- Columnas nuevas en `articles` ────────────────────────────────────────────
-- Todas nullable: los artículos cargados por CSV (WoS) no las tienen.
-- Sin UNIQUE en doi: `articles` ya puede tener duplicados de cargas CSV
-- previas (sin dedup); un constraint duro ahora rompería la migración.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS openalex_id     text,
  ADD COLUMN IF NOT EXISTS is_oa           boolean,
  ADD COLUMN IF NOT EXISTS cited_by_count  integer,
  ADD COLUMN IF NOT EXISTS concepts        jsonb;

-- Es una columna nueva: todas las filas existentes parten en NULL, así que
-- este índice único parcial es seguro de crear sin chocar con data previa.
CREATE UNIQUE INDEX IF NOT EXISTS uq_articles_project_openalex_id
  ON articles (project_id, openalex_id) WHERE openalex_id IS NOT NULL;

-- Tabla staging_articles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staging_articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  openalex_id         text NOT NULL,
  doi                 text,
  title               text,
  authors             text[],
  journal             text,
  publication_year    integer,
  abstract            text,
  cited_by_count      integer,
  is_oa               boolean,
  oa_url              text,
  -- Array de conceptos OpenAlex: [{ id, display_name, score }, ...]
  concepts            jsonb,
  -- Texto libre de la búsqueda/semilla que trajo este resultado (auditoría).
  source_query        text,
  status              text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'promoted', 'discarded')),
  -- Solo se llena cuando status = 'promoted'.
  promoted_article_id uuid REFERENCES articles(id) ON DELETE SET NULL,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Dedup capa 0: un mismo work de OpenAlex no puede entrar dos veces al
-- staging del mismo proyecto (aunque venga de búsquedas distintas).
CREATE UNIQUE INDEX IF NOT EXISTS uq_staging_articles_project_openalex_id
  ON staging_articles (project_id, openalex_id);

-- Defensa adicional por DOI (además del chequeo en código, que también
-- compara contra `articles`). NULLs no chocan entre sí en un índice único.
CREATE UNIQUE INDEX IF NOT EXISTS uq_staging_articles_project_doi
  ON staging_articles (project_id, doi) WHERE doi IS NOT NULL;

-- Lectura de la UI de triaje: por proyecto + estado.
CREATE INDEX IF NOT EXISTS idx_staging_articles_project_status
  ON staging_articles (project_id, status);

-- RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE staging_articles ENABLE ROW LEVEL SECURITY;

-- Políticas TRANSICIONALES (mismo criterio que cgt_menciones_direcciones):
-- se permite a `authenticated` y la app filtra/valida por proyecto y permiso
-- (can_upload_files vía has_permission_in_project) en cada server action.
DROP POLICY IF EXISTS "staging_articles_select" ON staging_articles;
CREATE POLICY "staging_articles_select" ON staging_articles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staging_articles_insert" ON staging_articles;
CREATE POLICY "staging_articles_insert" ON staging_articles
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staging_articles_update" ON staging_articles;
CREATE POLICY "staging_articles_update" ON staging_articles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staging_articles_delete" ON staging_articles;
CREATE POLICY "staging_articles_delete" ON staging_articles
  FOR DELETE TO authenticated USING (true);
