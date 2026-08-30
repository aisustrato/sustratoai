-- 📍 supabase/migrations/20260829_papers_seo_i18n.sql
-- Soporte para indexación académica bilingüe de /papers/*.
--
-- `slug` y `pdf_url` (ya existentes) pasan a representar consistentemente la
-- variante en español, igual que `title`/`content_md`/`keywords` ya lo hacen
-- respecto de sus contrapartes `_en`. `slug_en` permite servir una página
-- propia (URL + hreflang) para la traducción, sin romper el slug ya citado
-- (DOI 10.5281/zenodo.22099183 apunta al slug español actual).
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio.

ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS slug_en    text,
  ADD COLUMN IF NOT EXISTS pdf_url_en text;

CREATE UNIQUE INDEX IF NOT EXISTS papers_slug_en_key
  ON papers (slug_en)
  WHERE slug_en IS NOT NULL;
