-- 📍 supabase/migrations/20260805_papers_bilingue.sql
-- DMZ de papers bilingüe (ES/EN).
--
-- Agrega las columnas en inglés que faltan junto a las ya existentes en
-- español (title, subtitle, content_md, keywords en `papers`; description en
-- `paper_annexes`), siguiendo el mismo patrón ya usado por
-- abstract_es/abstract_en. `language` (columna existente en `papers`) no
-- cambia: sigue siendo el idioma canónico/default para SEO.
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio.

ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS title_en      text,
  ADD COLUMN IF NOT EXISTS subtitle_en   text,
  ADD COLUMN IF NOT EXISTS content_md_en text,
  ADD COLUMN IF NOT EXISTS keywords_en   text[];

ALTER TABLE paper_annexes
  ADD COLUMN IF NOT EXISTS description_en text;
