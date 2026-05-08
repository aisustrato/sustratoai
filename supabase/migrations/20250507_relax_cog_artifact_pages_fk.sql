-- 📍 supabase/migrations/20250507_relax_cog_artifact_pages_fk.sql
-- Relax FK constraint on cog_artifact_pages.artifact_id
--
-- Motivo: La tabla `cog_artifact_pages` fue diseñada para V1 donde los artefactos
-- vivían en `cog_artifacts`. En V2 (Cognética Forense), los artefactos viven en
-- `cgt_artefactos` y tienen IDs diferentes. Necesitamos poder insertar páginas
-- de artefactos V2 en `cog_artifact_pages` para el pipeline de procesamiento
-- (split + Marker). Drop del FK constraint es la opción más limpia para permitir
-- que ambas tablas (V1 cog_artifacts y V2 cgt_artefactos) referencien la misma
-- tabla de páginas.

ALTER TABLE IF EXISTS cog_artifact_pages
  DROP CONSTRAINT IF EXISTS cog_artifact_pages_artifact_id_fkey;
