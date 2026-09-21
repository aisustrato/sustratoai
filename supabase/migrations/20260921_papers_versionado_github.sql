-- 📍 supabase/migrations/20260921_papers_versionado_github.sql
-- Versionado de papers (concept DOI + versiones anteriores) y repositorio GitHub.
--
-- `doi`/`zenodo_url`/`version` (ya existentes) pasan a representar la versión
-- ACTUAL. `concept_doi` es el DOI de Zenodo que agrupa todas las versiones y
-- siempre resuelve a la última. `previous_versions` guarda el registro de las
-- versiones anteriores (cada una con su DOI de versión, permanente en Zenodo).
-- La URL canónica (slug) no cambia entre versiones.
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio.
-- (Registro: ya aplicada manualmente en Studio el 2026-09-21.)

ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS concept_doi       text,
  ADD COLUMN IF NOT EXISTS previous_versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS github_url        text;

-- previous_versions debe ser un arreglo JSON
ALTER TABLE papers
  DROP CONSTRAINT IF EXISTS papers_previous_versions_is_array;
ALTER TABLE papers
  ADD CONSTRAINT papers_previous_versions_is_array
  CHECK (jsonb_typeof(previous_versions) = 'array');
