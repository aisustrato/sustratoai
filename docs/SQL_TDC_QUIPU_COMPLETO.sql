-- ============================================================
-- SQL_TDC_QUIPU_COMPLETO.sql
-- Migración completa para el Protocolo TDC-QUIPU v1.0
-- Incluye: Viabilidad, Avatar Dr. Jung, Disciplinas, Teorías,
--          Corrientes de Pensamiento, y Equivalencias Geométricas
-- ============================================================

-- ============================================================
-- PARTE 1: ENUMS (Tipos Enumerados)
-- ============================================================

-- TDC Colors para los vértices del triángulo
DO $$ BEGIN
  CREATE TYPE tdc_color AS ENUM ('green', 'yellow', 'red');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Estado del triángulo TDC
DO $$ BEGIN
  CREATE TYPE tdc_status AS ENUM ('coherent', 'broken');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tipo de memoria HOPE (Google)
DO $$ BEGIN
  CREATE TYPE hope_memory_type AS ENUM ('Slow', 'Fast', 'Mixed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tipo de sistema F0/F1
DO $$ BEGIN
  CREATE TYPE system_type AS ENUM ('F0-SlowMemory', 'F1-FastMemory', 'Mixto');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PARTE 2: TABLA ANÁLISIS DE VIABILIDAD TDC
-- ============================================================

CREATE TABLE IF NOT EXISTS cog_viability_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES cog_transcriptions(id) ON DELETE SET NULL,
  
  -- Métricas de Viabilidad (Ecuación V = E - F × De)
  friction_score INTEGER NOT NULL CHECK (friction_score >= 0 AND friction_score <= 100),
  ethical_debt_score INTEGER NOT NULL CHECK (ethical_debt_score >= 0 AND ethical_debt_score <= 100),
  viability_score DECIMAL(5,2) NOT NULL,
  frequency_proximity DECIMAL(5,3), -- Proximidad a r=3.57 (constante Feigenbaum)
  
  -- Protocolo TDC (Triángulo de Deriva Coherente)
  tdc_perception tdc_color NOT NULL,      -- Vértice A: ¿Datos crudos o narrativas?
  tdc_interpretation tdc_color NOT NULL,  -- Vértice B: ¿Coherente sin autoengaños?
  tdc_action tdc_color NOT NULL,          -- Vértice C: ¿Acción reversible?
  tdc_status tdc_status NOT NULL,
  
  -- Mapeo a Arquitectura HOPE (Google Nested Learning)
  hope_memory_type hope_memory_type NOT NULL,
  hope_catastrophic_forgetting_risk INTEGER CHECK (hope_catastrophic_forgetting_risk >= 0 AND hope_catastrophic_forgetting_risk <= 100),
  
  -- Clasificación Final F0/F1
  system_type system_type NOT NULL,
  
  -- Metadata
  recommendation TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  analyzed_by TEXT NOT NULL DEFAULT 'TDC-Quipu-v1.0',
  reviewed_by TEXT,
  
  -- Evidencia (para auditoría)
  friction_keywords TEXT[],         -- Palabras de alta fricción detectadas
  ethical_debt_signals JSONB,       -- Contradicciones/señales detectadas
  raw_analysis_data JSONB,          -- Datos crudos del análisis para debugging
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Índices para viabilidad
CREATE INDEX IF NOT EXISTS idx_viability_artifact ON cog_viability_analysis(artifact_id);
CREATE INDEX IF NOT EXISTS idx_viability_system_type ON cog_viability_analysis(system_type);
CREATE INDEX IF NOT EXISTS idx_viability_tdc_status ON cog_viability_analysis(tdc_status);
CREATE INDEX IF NOT EXISTS idx_viability_score ON cog_viability_analysis(viability_score DESC);

-- ============================================================
-- PARTE 3: TEORÍAS Y PARADIGMAS (NUEVO)
-- ============================================================

CREATE TABLE IF NOT EXISTS cog_theories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identificación
  name TEXT NOT NULL,                    -- "Teoría del Caos", "TDC", "Constructivismo"
  aliases TEXT[],                        -- ["Chaos Theory", "Teoría del Desorden"]
  
  -- Contexto
  description TEXT,
  era TEXT,                              -- "Siglo XX", "Contemporáneo"
  origin_discipline_id UUID REFERENCES cog_disciplines(id),
  
  -- Pensadores asociados
  key_thinkers TEXT[],                   -- ["Lorenz", "Feigenbaum", "Mandelbrot"]
  
  -- Clasificación TDC
  system_type system_type,               -- ¿Es F0 o F1 esta teoría?
  viability_score DECIMAL(5,2),
  
  -- Geometría
  geometric_signature TEXT,              -- "fractal", "espiral", "atractor extraño"
  r_proximity DECIMAL(5,3),              -- Proximidad a r=3.57
  
  -- Validación
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  UNIQUE(project_id, name)
);

-- Relación Teorías ↔ Artefactos (N:M)
CREATE TABLE IF NOT EXISTS cog_artifact_theories (
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  theory_id UUID NOT NULL REFERENCES cog_theories(id) ON DELETE CASCADE,
  
  -- Contexto de mención
  context_snippet TEXT,                  -- Fragmento donde se menciona
  relevance_score DECIMAL(3,2),          -- 0-1 qué tan relevante
  is_primary_topic BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (artifact_id, theory_id)
);

-- Índices teorías
CREATE INDEX IF NOT EXISTS idx_theories_project ON cog_theories(project_id);
CREATE INDEX IF NOT EXISTS idx_theories_system_type ON cog_theories(system_type);
CREATE INDEX IF NOT EXISTS idx_artifact_theories_artifact ON cog_artifact_theories(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_theories_theory ON cog_artifact_theories(theory_id);

-- ============================================================
-- PARTE 4: CORRIENTES DE PENSAMIENTO (NUEVO)
-- ============================================================

CREATE TABLE IF NOT EXISTS cog_thought_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identificación
  name TEXT NOT NULL,                    -- "Humanismo", "Fenomenología", "Sistemas Complejos"
  aliases TEXT[],
  
  -- Contexto
  description TEXT,
  era TEXT,                              -- "Renacimiento", "Siglo XX", "Contemporáneo"
  geographic_origin TEXT,                -- "Europa", "Estados Unidos", "Global"
  
  -- Relaciones
  parent_stream_id UUID REFERENCES cog_thought_streams(id), -- Corriente madre
  related_theories TEXT[],               -- IDs o nombres de teorías relacionadas
  key_figures TEXT[],                    -- Pensadores clave
  
  -- Clasificación TDC
  system_type system_type,
  typical_friction_range INT4RANGE,      -- [0,30] para F0, [60,100] para F1
  
  -- Validación
  is_validated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  UNIQUE(project_id, name)
);

-- Relación Corrientes ↔ Artefactos
CREATE TABLE IF NOT EXISTS cog_artifact_streams (
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES cog_thought_streams(id) ON DELETE CASCADE,
  
  context_snippet TEXT,
  relevance_score DECIMAL(3,2),
  
  PRIMARY KEY (artifact_id, stream_id)
);

-- Índices corrientes
CREATE INDEX IF NOT EXISTS idx_streams_project ON cog_thought_streams(project_id);
CREATE INDEX IF NOT EXISTS idx_artifact_streams_artifact ON cog_artifact_streams(artifact_id);

-- ============================================================
-- PARTE 5: EQUIVALENCIAS SEMÁNTICO-GEOMÉTRICAS (GRANJAS ENRIQUECIDAS)
-- ============================================================

-- Agregar campos a semantic_farms para equivalencias geométricas
ALTER TABLE cog_semantic_farms 
ADD COLUMN IF NOT EXISTS geometric_equivalence JSONB,
-- Estructura: {
--   "shape": "spiral", 
--   "r_value": 3.57, 
--   "pattern": "golden_ratio",
--   "symmetry": "rotational"
-- }
ADD COLUMN IF NOT EXISTS cross_domain_mappings JSONB,
-- Estructura: [{
--   "domain_a": "física",
--   "domain_b": "psicología",
--   "equivalent_concept": "atractor",
--   "confidence": 0.85
-- }]
ADD COLUMN IF NOT EXISTS viability_consensus DECIMAL(5,2),
-- Promedio de viabilidad de las semillas en la granja
ADD COLUMN IF NOT EXISTS tdc_status_consensus tdc_status;

-- Tabla para mapear equivalencias entre conceptos de diferentes dominios
CREATE TABLE IF NOT EXISTS cog_semantic_equivalences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Los dos conceptos que son equivalentes
  concept_a_id UUID NOT NULL REFERENCES cog_fractal_seeds(id) ON DELETE CASCADE,
  concept_b_id UUID NOT NULL REFERENCES cog_fractal_seeds(id) ON DELETE CASCADE,
  
  -- Dominios de origen
  domain_a TEXT NOT NULL,               -- "física", "psicología", "neurociencia"
  domain_b TEXT NOT NULL,
  
  -- Tipo de equivalencia
  equivalence_type TEXT NOT NULL,       -- "isomorfismo", "analogía", "metáfora", "identidad"
  
  -- Geometría común
  shared_geometry TEXT,                  -- "fractal", "espiral", "atractor"
  geometric_confidence DECIMAL(3,2),
  
  -- Descripción de la equivalencia
  description TEXT,
  evidence TEXT,                         -- Fragmento que soporta la equivalencia
  
  -- Validación
  confidence DECIMAL(3,2),
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados en ambas direcciones
  UNIQUE(concept_a_id, concept_b_id),
  CHECK (concept_a_id != concept_b_id)
);

-- Índices equivalencias
CREATE INDEX IF NOT EXISTS idx_equivalences_project ON cog_semantic_equivalences(project_id);
CREATE INDEX IF NOT EXISTS idx_equivalences_concept_a ON cog_semantic_equivalences(concept_a_id);
CREATE INDEX IF NOT EXISTS idx_equivalences_concept_b ON cog_semantic_equivalences(concept_b_id);
CREATE INDEX IF NOT EXISTS idx_equivalences_type ON cog_semantic_equivalences(equivalence_type);

-- ============================================================
-- PARTE 6: PIPELINE AVATAR DR. JUNG (Imágenes)
-- ============================================================

-- Prompts de imágenes generados a partir de semillas fractales
CREATE TABLE IF NOT EXISTS cog_image_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES cog_fractal_seeds(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  
  -- Prompt
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  style_modifiers TEXT[],               -- ["fractal", "sacred geometry", "r=3.57"]
  
  -- Metadata generación
  generated_by TEXT NOT NULL,           -- "claude-sonnet-4" | "gemini-2.0"
  model_version TEXT,
  temperature DECIMAL(3,2),
  
  -- Estado
  status TEXT DEFAULT 'pending',        -- pending | generated | error | disabled
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imágenes generadas
CREATE TABLE IF NOT EXISTS cog_generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES cog_image_prompts(id) ON DELETE CASCADE,
  
  -- Storage
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  
  -- Generación
  provider TEXT NOT NULL,               -- "stability-ai" | "google-imagen" | "ideogram"
  model_name TEXT,
  generation_params JSONB,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  mime_type TEXT,
  
  -- Costos (para tracking de budget)
  cost_usd DECIMAL(10,4),
  
  -- Estado
  status TEXT DEFAULT 'generated',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interpretaciones visuales (Gemini Vision)
CREATE TABLE IF NOT EXISTS cog_visual_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES cog_generated_images(id) ON DELETE CASCADE,
  
  -- Análisis
  geometric_patterns TEXT[],            -- Patrones detectados
  fractal_detected BOOLEAN,
  coherence_with_concept TEXT,          -- "high" | "medium" | "low"
  new_insights TEXT,                    -- Insights emergentes
  
  -- TDC Visual
  visual_perception TEXT,               -- "clear" | "ambiguous" | "obscure"
  visual_interpretation TEXT,           -- "coherent" | "partial" | "incoherent"
  visual_action TEXT,                   -- "generates_understanding" | "neutral" | "confuses"
  
  -- Metadata
  interpreted_by TEXT NOT NULL,
  model_version TEXT,
  confidence DECIMAL(3,2),
  raw_response JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validación cruzada modal (texto → imagen → texto')
CREATE TABLE IF NOT EXISTS cog_cross_modal_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES cog_fractal_seeds(id),
  image_id UUID NOT NULL REFERENCES cog_generated_images(id),
  interpretation_id UUID NOT NULL REFERENCES cog_visual_interpretations(id),
  
  -- Métricas de coherencia
  semantic_similarity DECIMAL(3,2),     -- Cosine similarity texto ↔ texto'
  visual_fidelity DECIMAL(3,2),         -- ¿La imagen refleja el concepto?
  emergent_insights_count INTEGER,      -- Nuevos conceptos en interpretación
  
  -- Validación TDC
  tdc_coherence_preserved BOOLEAN,      -- ¿El ciclo mantiene coherencia?
  
  -- Estado
  validation_status TEXT DEFAULT 'pending_review',  -- validated | rejected | pending_review
  reviewed_by TEXT,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices Avatar Dr. Jung
CREATE INDEX IF NOT EXISTS idx_image_prompts_seed ON cog_image_prompts(seed_id);
CREATE INDEX IF NOT EXISTS idx_image_prompts_artifact ON cog_image_prompts(artifact_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_prompt ON cog_generated_images(prompt_id);
CREATE INDEX IF NOT EXISTS idx_visual_interp_image ON cog_visual_interpretations(image_id);
CREATE INDEX IF NOT EXISTS idx_cross_modal_seed ON cog_cross_modal_validation(seed_id);

-- ============================================================
-- PARTE 7: ENRIQUECER TABLAS EXISTENTES
-- ============================================================

-- Agregar campos de clasificación TDC a cog_fractal_seeds
ALTER TABLE cog_fractal_seeds
ADD COLUMN IF NOT EXISTS system_type system_type,
ADD COLUMN IF NOT EXISTS viability_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS geometric_signature TEXT,     -- "fractal", "spiral", "attractor"
ADD COLUMN IF NOT EXISTS origin_discipline_id UUID REFERENCES cog_disciplines(id),
ADD COLUMN IF NOT EXISTS origin_theory_id UUID REFERENCES cog_theories(id),
ADD COLUMN IF NOT EXISTS origin_stream_id UUID REFERENCES cog_thought_streams(id);

-- Agregar campos a cog_references para pensadores
ALTER TABLE cog_references
ADD COLUMN IF NOT EXISTS is_thinker BOOLEAN DEFAULT FALSE,  -- ¿Es pensador/científico?
ADD COLUMN IF NOT EXISTS primary_discipline_id UUID REFERENCES cog_disciplines(id),
ADD COLUMN IF NOT EXISTS associated_theories TEXT[],
ADD COLUMN IF NOT EXISTS associated_streams TEXT[],
ADD COLUMN IF NOT EXISTS key_contributions TEXT[];           -- Contribuciones principales

-- Agregar campos a cog_disciplines
ALTER TABLE cog_disciplines
ADD COLUMN IF NOT EXISTS typical_system_type system_type,   -- F0 o F1 predominante
ADD COLUMN IF NOT EXISTS parent_discipline_id UUID REFERENCES cog_disciplines(id),
ADD COLUMN IF NOT EXISTS geometric_affinity TEXT;            -- Geometría típica

-- ============================================================
-- PARTE 8: RLS (Row Level Security)
-- ============================================================

ALTER TABLE cog_viability_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_theories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_artifact_theories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_thought_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_artifact_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_semantic_equivalences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_image_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_visual_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_cross_modal_validation ENABLE ROW LEVEL SECURITY;

-- Política para viability_analysis (SELECT)
CREATE POLICY "Users can view viability analysis in their projects"
  ON cog_viability_analysis FOR SELECT
  USING (
    artifact_id IN (
      SELECT id FROM cog_artifacts 
      WHERE project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política para viability_analysis (INSERT/UPDATE/DELETE)
CREATE POLICY "Users can modify viability analysis in their projects"
  ON cog_viability_analysis FOR ALL
  USING (
    artifact_id IN (
      SELECT id FROM cog_artifacts 
      WHERE project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política para theories (SELECT)
CREATE POLICY "Users can view theories in their projects"
  ON cog_theories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Política para theories (INSERT/UPDATE/DELETE)
CREATE POLICY "Users can modify theories in their projects"
  ON cog_theories FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Política para thought_streams
CREATE POLICY "Users can view thought streams in their projects"
  ON cog_thought_streams FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify thought streams in their projects"
  ON cog_thought_streams FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Política para semantic_equivalences
CREATE POLICY "Users can view equivalences in their projects"
  ON cog_semantic_equivalences FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify equivalences in their projects"
  ON cog_semantic_equivalences FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para tablas de imágenes (heredan del artifact)
CREATE POLICY "Users can view image prompts in their projects"
  ON cog_image_prompts FOR SELECT
  USING (
    artifact_id IN (
      SELECT id FROM cog_artifacts 
      WHERE project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can modify image prompts in their projects"
  ON cog_image_prompts FOR ALL
  USING (
    artifact_id IN (
      SELECT id FROM cog_artifacts 
      WHERE project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- PARTE 9: TRIGGERS PARA UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a nuevas tablas
DROP TRIGGER IF EXISTS update_viability_updated_at ON cog_viability_analysis;
CREATE TRIGGER update_viability_updated_at
  BEFORE UPDATE ON cog_viability_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_theories_updated_at ON cog_theories;
CREATE TRIGGER update_theories_updated_at
  BEFORE UPDATE ON cog_theories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streams_updated_at ON cog_thought_streams;
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON cog_thought_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PARTE 10: DATOS SEMILLA (Disciplinas y Teorías base)
-- ============================================================

-- Insertar disciplinas base si no existen
-- (Se ejecutará por proyecto cuando se cree el artefacto)

-- Vista útil: Artefactos con análisis completo
CREATE OR REPLACE VIEW cog_artifacts_full AS
SELECT 
  a.*,
  t.full_text AS transcription_text,
  t.confidence_score AS transcription_confidence,
  v.friction_score,
  v.ethical_debt_score,
  v.viability_score,
  v.tdc_status,
  v.system_type,
  v.hope_memory_type,
  COALESCE(
    (SELECT COUNT(*) FROM cog_fractal_seeds s WHERE s.artifact_id = a.id),
    0
  ) AS seeds_count,
  COALESCE(
    (SELECT COUNT(*) FROM cog_artifact_theories at WHERE at.artifact_id = a.id),
    0
  ) AS theories_count,
  COALESCE(
    (SELECT COUNT(*) FROM cog_artifact_references ar WHERE ar.artifact_id = a.id),
    0
  ) AS references_count
FROM cog_artifacts a
LEFT JOIN cog_transcriptions t ON t.artifact_id = a.id
LEFT JOIN cog_viability_analysis v ON v.artifact_id = a.id;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
COMMENT ON TABLE cog_viability_analysis IS 'Análisis TDC-QUIPU de viabilidad para artefactos';
COMMENT ON TABLE cog_theories IS 'Teorías y paradigmas científicos mencionados en artefactos';
COMMENT ON TABLE cog_thought_streams IS 'Corrientes de pensamiento detectadas';
COMMENT ON TABLE cog_semantic_equivalences IS 'Equivalencias semántico-geométricas entre conceptos de diferentes dominios';
COMMENT ON TABLE cog_image_prompts IS 'Prompts generados para visualización Avatar Dr. Jung';
COMMENT ON TABLE cog_generated_images IS 'Imágenes generadas por el pipeline Avatar Dr. Jung';
COMMENT ON TABLE cog_visual_interpretations IS 'Interpretaciones de Gemini Vision sobre imágenes generadas';
COMMENT ON TABLE cog_cross_modal_validation IS 'Validación cruzada texto→imagen→texto para coherencia modal';
