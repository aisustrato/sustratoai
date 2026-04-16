-- ============================================
-- FIX: Conectar fuentes curadas a galaxias en lugar de párrafos
-- Fecha: 16 Febrero 2026
-- Razón: Las galaxias son ahora las secciones MD editables, no tienen párrafos
-- ============================================

-- Eliminar constraint y FK antigua
ALTER TABLE minotauro_curated_sources 
  DROP CONSTRAINT IF EXISTS minotauro_curated_sources_paragraph_id_fkey;

-- Renombrar columna paragraph_id a galaxy_id
ALTER TABLE minotauro_curated_sources 
  RENAME COLUMN paragraph_id TO galaxy_id;

-- Agregar nueva FK a galaxias
ALTER TABLE minotauro_curated_sources 
  ADD CONSTRAINT minotauro_curated_sources_galaxy_id_fkey 
  FOREIGN KEY (galaxy_id) REFERENCES minotauro_galaxies(id) ON DELETE CASCADE;

-- Actualizar índice
DROP INDEX IF EXISTS idx_minotauro_sources_paragraph;
CREATE INDEX idx_minotauro_sources_galaxy ON minotauro_curated_sources(galaxy_id);

-- Actualizar políticas RLS
DROP POLICY IF EXISTS "Users can view sources of their paragraphs" ON minotauro_curated_sources;
DROP POLICY IF EXISTS "Users can manage sources of their paragraphs" ON minotauro_curated_sources;

CREATE POLICY "Users can view sources of their galaxies"
  ON minotauro_curated_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_galaxies g
      JOIN minotauro_universes u ON g.universe_id = u.id
      JOIN project_members pm ON u.project_id = pm.project_id
      WHERE g.id = galaxy_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage sources of their galaxies"
  ON minotauro_curated_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_galaxies g
      JOIN minotauro_universes u ON g.universe_id = u.id
      JOIN project_members pm ON u.project_id = pm.project_id
      WHERE g.id = galaxy_id
      AND pm.user_id = auth.uid()
    )
  );

-- Actualizar comentarios
COMMENT ON TABLE minotauro_curated_sources IS 'Fuentes curadas desde Cognética enlazadas a galaxias específicas';
COMMENT ON COLUMN minotauro_curated_sources.galaxy_id IS 'ID de la galaxia (sección MD) a la que pertenece esta fuente';
