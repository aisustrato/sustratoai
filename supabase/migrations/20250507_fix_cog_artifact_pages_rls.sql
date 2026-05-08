-- 📍 supabase/migrations/20250507_fix_cog_artifact_pages_rls.sql
-- Fix RLS para permitir operaciones desde Cognética V2 (cgt_artefactos).
--
-- Motivo: La tabla cog_artifact_pages tiene RLS activado con políticas que
-- validan el artifact_id contra cog_artifacts (tabla V1). Los artefactos de V2
-- viven en cgt_artefactos. Esta migración agrega políticas que permiten
-- INSERT y SELECT para usuarios autenticados sin depender de la tabla V1.

-- Asegurar que RLS está activado (idempotente)
ALTER TABLE IF EXISTS cog_artifact_pages FORCE ROW LEVEL SECURITY;

-- Política: permitir INSERT a usuarios autenticados
-- (la app valida permisos a nivel de proyecto antes de llegar aquí)
DROP POLICY IF EXISTS "allow_v2_insert" ON cog_artifact_pages;
CREATE POLICY "allow_v2_insert"
ON cog_artifact_pages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: permitir SELECT a usuarios autenticados
-- (la app filtra por proyecto en la query)
DROP POLICY IF EXISTS "allow_v2_select" ON cog_artifact_pages;
CREATE POLICY "allow_v2_select"
ON cog_artifact_pages
FOR SELECT
TO authenticated
USING (true);

-- Política: permitir UPDATE a usuarios autenticados
-- (necesario para actualizar markdown_original y status)
DROP POLICY IF EXISTS "allow_v2_update" ON cog_artifact_pages;
CREATE POLICY "allow_v2_update"
ON cog_artifact_pages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Nota: estas políticas son de transición. La solución limpia es crear
-- cgt_artifact_pages (tabla V2 propia) pero eso requiere refactor mayor.
