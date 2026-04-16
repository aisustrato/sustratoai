-- Migración: Agregar metadatos de universo a preclassification_phases
-- Fecha: 2026-03-11
-- Propósito: Habilitar sistema multi-fase (Casos 1 y 2)

-- 1. Agregar columnas para metadatos de universo
ALTER TABLE preclassification_phases 
ADD COLUMN IF NOT EXISTS universe_name TEXT,
ADD COLUMN IF NOT EXISTS universe_type TEXT CHECK (universe_type IN ('complete', 'filtered')),
ADD COLUMN IF NOT EXISTS source_phase_id UUID REFERENCES preclassification_phases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS applied_filters JSONB,
ADD COLUMN IF NOT EXISTS total_articles INTEGER;

-- 2. Crear índice para consultas de fases relacionadas
CREATE INDEX IF NOT EXISTS idx_phases_source_phase ON preclassification_phases(source_phase_id);

-- 3. Actualizar fases existentes con valores por defecto
-- Esto asegura que Fase 1 actual siga funcionando sin cambios
UPDATE preclassification_phases
SET 
  universe_name = COALESCE(universe_name, 'Universo Completo - ' || name),
  universe_type = COALESCE(universe_type, 'complete'),
  total_articles = COALESCE(total_articles, (
    SELECT COUNT(*) 
    FROM phase_eligible_articles 
    WHERE phase_id = preclassification_phases.id
  ))
WHERE universe_name IS NULL OR universe_type IS NULL OR total_articles IS NULL;

-- 4. Comentarios para documentación
COMMENT ON COLUMN preclassification_phases.universe_name IS 'Nombre descriptivo del universo de artículos (ej: "Artículos con Consideraciones Éticas")';
COMMENT ON COLUMN preclassification_phases.universe_type IS 'Tipo de universo: complete (100% artículos) o filtered (subconjunto filtrado)';
COMMENT ON COLUMN preclassification_phases.source_phase_id IS 'ID de la fase origen si esta fase es derivada (aditiva o embudo)';
COMMENT ON COLUMN preclassification_phases.applied_filters IS 'Filtros aplicados para crear universo filtrado (JSON con dimensiones y confianza)';
COMMENT ON COLUMN preclassification_phases.total_articles IS 'Cache del total de artículos en este universo';
