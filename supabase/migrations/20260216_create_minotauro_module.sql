-- ============================================
-- MÓDULO MINOTAURO: Sistema de Escritura Híbrida
-- Fecha: 16 Febrero 2026
-- Propósito: Co-creación de papers con IA usando curaduría de Cognética
-- ============================================

-- ============================================
-- PASO 1: CREAR ENUMS
-- ============================================

-- Eliminar tipos si existen (para re-ejecutar migración)
DROP TYPE IF EXISTS archetype_tone CASCADE;
DROP TYPE IF EXISTS paragraph_status CASCADE;

-- Enum para arquetipos de tono
CREATE TYPE archetype_tone AS ENUM (
  'bufon',      -- Caos necesario, ironía, romper seriedad académica (Mistral)
  'auditor',    -- Estructura, termodinámica, rigor (DeepSeek)
  'editor',     -- Textura, curaduría, coherencia narrativa (Claude)
  'colega'      -- Conversación de café, indeterminado, puede no hacer nada o conectar con algo inesperado (Gemini)
);

-- Enum para estados del párrafo
CREATE TYPE paragraph_status AS ENUM (
  'draft',           -- Borrador inicial humano (solo inicial)
  'ai_processing',   -- IA procesando con arquetipo seleccionado
  'ai_proposal',     -- IA propuso cambios, esperando revisión humana
  'human_review',    -- Humano revisando propuesta
  'accepted',        -- Cambios aceptados, movidos a final_content
  'rejected',        -- Cambios rechazados, volver a procesar
  'final'            -- Finalizado, listo para exportar
);

-- ============================================
-- PASO 2: CREAR TABLAS
-- ============================================

-- Eliminar tablas si existen (para re-ejecutar migración)
DROP TABLE IF EXISTS minotauro_ai_interactions CASCADE;
DROP TABLE IF EXISTS minotauro_curated_sources CASCADE;
DROP TABLE IF EXISTS minotauro_paragraph_versions CASCADE;
DROP TABLE IF EXISTS minotauro_paragraphs CASCADE;
DROP TABLE IF EXISTS minotauro_galaxies CASCADE;
DROP TABLE IF EXISTS minotauro_universes CASCADE;

-- --------------------------------------------
-- TABLA: minotauro_universes (Escritos completos)
-- --------------------------------------------
CREATE TABLE minotauro_universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias (igual que cog_artifacts)
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenido
  title TEXT NOT NULL,
  subtitle TEXT,
  purpose TEXT, -- El "para qué" del escrito, la semilla del universo
  
  -- Metadata (tags, configuración, estado de exportación, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT minotauro_universes_title_check CHECK (char_length(title) >= 3)
);

-- Índices
CREATE INDEX idx_minotauro_universes_project ON minotauro_universes(project_id);
CREATE INDEX idx_minotauro_universes_user ON minotauro_universes(user_id);
CREATE INDEX idx_minotauro_universes_created ON minotauro_universes(created_at DESC);

-- --------------------------------------------
-- TABLA: minotauro_galaxies (Secciones/Capítulos)
-- --------------------------------------------
CREATE TABLE minotauro_galaxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID NOT NULL REFERENCES minotauro_universes(id) ON DELETE CASCADE,
  
  -- Contenido
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Contenido MD de la sección (lo que escribe el humano)
  ai_content TEXT, -- Propuesta de la IA tras procesar con arquetipo
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Estado y procesamiento
  status paragraph_status DEFAULT 'draft',
  last_archetype archetype_tone, -- Último arquetipo usado para procesar
  
  -- Metadata (incluye métricas: word_count, char_count, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT minotauro_galaxies_order_check CHECK (order_index >= 0)
);

-- Índices
CREATE INDEX idx_minotauro_galaxies_universe ON minotauro_galaxies(universe_id);
CREATE INDEX idx_minotauro_galaxies_order ON minotauro_galaxies(universe_id, order_index);

-- --------------------------------------------
-- TABLA: minotauro_paragraphs (Universos de bolsillo)
-- --------------------------------------------
CREATE TABLE minotauro_paragraphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galaxy_id UUID NOT NULL REFERENCES minotauro_galaxies(id) ON DELETE CASCADE,
  
  -- Contenido en diferentes estados
  title_tentative TEXT, -- Título tentativo del párrafo
  human_content TEXT NOT NULL, -- El "solo inicial" del humano (materia prima)
  ai_content TEXT, -- Propuesta de la IA (estructurada, corregida)
  final_content TEXT, -- Versión aceptada (la que se exporta)
  
  -- Estado y control
  status paragraph_status DEFAULT 'draft',
  order_index INTEGER NOT NULL DEFAULT 0,
  archetype_tone archetype_tone DEFAULT 'auditor',
  
  -- Metadatos del párrafo
  seed_concept TEXT, -- La "semilla" que se quiere transmitir (qué quiero decir aquí)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT minotauro_paragraphs_order_check CHECK (order_index >= 0)
);

-- Índices
CREATE INDEX idx_minotauro_paragraphs_galaxy ON minotauro_paragraphs(galaxy_id);
CREATE INDEX idx_minotauro_paragraphs_order ON minotauro_paragraphs(galaxy_id, order_index);
CREATE INDEX idx_minotauro_paragraphs_status ON minotauro_paragraphs(status);

-- --------------------------------------------
-- TABLA: minotauro_galaxy_versions (Control de cambios de secciones)
-- 🎯 PROPÓSITO: Guardar versión previa antes de procesar con arquetipo
-- --------------------------------------------
CREATE TABLE minotauro_galaxy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galaxy_id UUID NOT NULL REFERENCES minotauro_galaxies(id) ON DELETE CASCADE,
  
  -- Versión
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL, -- Contenido en este punto de la historia
  created_by TEXT NOT NULL CHECK (created_by IN ('human', 'ai')),
  archetype_tone archetype_tone, -- Arquetipo usado si fue creado por IA
  
  -- Cambios específicos
  changes_summary TEXT, -- Qué cambió (bullet points)
  ai_rationale TEXT, -- Por qué la IA hizo estos cambios
  
  -- Metadata (incluye métricas en ese momento: word_count, char_count)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT minotauro_galaxy_versions_number_check CHECK (version_number > 0),
  CONSTRAINT unique_galaxy_version UNIQUE (galaxy_id, version_number)
);

-- Índices
CREATE INDEX idx_minotauro_galaxy_versions_galaxy ON minotauro_galaxy_versions(galaxy_id);
CREATE INDEX idx_minotauro_galaxy_versions_created ON minotauro_galaxy_versions(galaxy_id, created_at DESC);

-- --------------------------------------------
-- TABLA: minotauro_paragraph_versions (DEPRECATED - mantener por compatibilidad)
-- --------------------------------------------
CREATE TABLE minotauro_paragraph_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_id UUID NOT NULL REFERENCES minotauro_paragraphs(id) ON DELETE CASCADE,
  
  -- Versión
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL CHECK (created_by IN ('human', 'ai')),
  archetype_tone archetype_tone,
  
  -- Cambios específicos
  changes_summary TEXT,
  ai_rationale TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT minotauro_versions_number_check CHECK (version_number > 0),
  CONSTRAINT unique_paragraph_version UNIQUE (paragraph_id, version_number)
);

-- Índices
CREATE INDEX idx_minotauro_versions_paragraph ON minotauro_paragraph_versions(paragraph_id);
CREATE INDEX idx_minotauro_versions_created ON minotauro_paragraph_versions(paragraph_id, created_at DESC);

-- --------------------------------------------
-- TABLA: minotauro_curated_sources (Fuentes desde Cognética)
-- 🔗 ENLACE CON ARTEFACTOS COGNÉTICOS
-- ⚠️ NOTA: cog_messages NO EXISTE - los mensajes están en JSONB dentro de cog_chat_sessions
-- --------------------------------------------
CREATE TABLE minotauro_curated_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_id UUID NOT NULL REFERENCES minotauro_paragraphs(id) ON DELETE CASCADE,
  
  -- 🔗 Referencias a Cognética (opcionales, puede ser fuente externa)
  chat_session_id UUID REFERENCES cog_chat_sessions(id) ON DELETE SET NULL,
  artifact_id UUID REFERENCES cog_artifacts(id) ON DELETE SET NULL,
  
  -- Contenido curado
  source_type TEXT NOT NULL, -- 'chat_session', 'artifact', 'external_link', 'article', etc.
  content_excerpt TEXT, -- Extracto del contenido relevante
  relevance_note TEXT, -- Por qué es relevante para este párrafo (textura)
  
  -- Orden y metadata
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT minotauro_sources_type_check CHECK (
    source_type IN ('chat_session', 'artifact', 'external_link', 'article', 'note', 'other')
  )
);

-- Índices
CREATE INDEX idx_minotauro_sources_paragraph ON minotauro_curated_sources(paragraph_id);
CREATE INDEX idx_minotauro_sources_chat ON minotauro_curated_sources(chat_session_id);
CREATE INDEX idx_minotauro_sources_artifact ON minotauro_curated_sources(artifact_id);
CREATE INDEX idx_minotauro_sources_type ON minotauro_curated_sources(source_type);

-- --------------------------------------------
-- TABLA: minotauro_ai_interactions (Registro de loops IA)
-- --------------------------------------------
CREATE TABLE minotauro_ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_id UUID NOT NULL REFERENCES minotauro_paragraphs(id) ON DELETE CASCADE,
  
  -- Datos del job
  ai_model TEXT NOT NULL, -- 'gemini-1.5-pro', 'deepseek-chat', etc.
  archetype_tone archetype_tone NOT NULL,
  
  -- Input/Output
  prompt_sent TEXT NOT NULL,
  response_received TEXT NOT NULL,
  
  -- Tokens (para auditoría)
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  -- Resultado
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_minotauro_interactions_paragraph ON minotauro_ai_interactions(paragraph_id);
CREATE INDEX idx_minotauro_interactions_created ON minotauro_ai_interactions(created_at DESC);
CREATE INDEX idx_minotauro_interactions_model ON minotauro_ai_interactions(ai_model);

-- ============================================
-- PASO 3: HABILITAR RLS
-- ============================================

ALTER TABLE minotauro_universes ENABLE ROW LEVEL SECURITY;
ALTER TABLE minotauro_galaxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE minotauro_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE minotauro_paragraph_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE minotauro_curated_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE minotauro_ai_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 4: CREAR POLÍTICAS RLS
-- (Basadas en el patrón de cog_chat_sessions y cog_artifacts)
-- ============================================

-- --------------------------------------------
-- Políticas para minotauro_universes
-- --------------------------------------------

-- SELECT: Ver universos de proyectos donde el usuario es owner o member
CREATE POLICY "Users can view universes of their projects"
  ON minotauro_universes FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Crear universos en proyectos propios o donde es member
CREATE POLICY "Users can create universes in their projects"
  ON minotauro_universes FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- UPDATE: Actualizar universos propios
CREATE POLICY "Users can update their universes"
  ON minotauro_universes FOR UPDATE
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Eliminar universos propios o de proyectos propios
CREATE POLICY "Users can delete their universes"
  ON minotauro_universes FOR DELETE
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- --------------------------------------------
-- Políticas para minotauro_galaxies
-- (Heredan permisos del universe)
-- --------------------------------------------

CREATE POLICY "Users can view galaxies of their universes"
  ON minotauro_galaxies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_universes u
      WHERE u.id = universe_id 
      AND u.project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage galaxies of their universes"
  ON minotauro_galaxies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_universes u
      WHERE u.id = universe_id 
      AND (
        u.user_id = auth.uid()
        OR u.project_id IN (
          SELECT id FROM projects WHERE owner_id = auth.uid()
          UNION
          SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- --------------------------------------------
-- Políticas para minotauro_paragraphs
-- (Heredan permisos de galaxy -> universe)
-- --------------------------------------------

CREATE POLICY "Users can view paragraphs of their galaxies"
  ON minotauro_paragraphs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_galaxies g
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE g.id = galaxy_id 
      AND u.project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage paragraphs of their galaxies"
  ON minotauro_paragraphs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_galaxies g
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE g.id = galaxy_id 
      AND (
        u.user_id = auth.uid()
        OR u.project_id IN (
          SELECT id FROM projects WHERE owner_id = auth.uid()
          UNION
          SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- --------------------------------------------
-- Políticas para minotauro_paragraph_versions
-- (Heredan permisos de paragraph)
-- --------------------------------------------

CREATE POLICY "Users can view versions of their paragraphs"
  ON minotauro_paragraph_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_paragraphs p
      INNER JOIN minotauro_galaxies g ON p.galaxy_id = g.id
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE p.id = paragraph_id 
      AND u.project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage versions of their paragraphs"
  ON minotauro_paragraph_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_paragraphs p
      INNER JOIN minotauro_galaxies g ON p.galaxy_id = g.id
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE p.id = paragraph_id 
      AND (
        u.user_id = auth.uid()
        OR u.project_id IN (
          SELECT id FROM projects WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- --------------------------------------------
-- Políticas para minotauro_curated_sources
-- (Heredan permisos de paragraph)
-- --------------------------------------------

CREATE POLICY "Users can view sources of their paragraphs"
  ON minotauro_curated_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_paragraphs p
      INNER JOIN minotauro_galaxies g ON p.galaxy_id = g.id
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE p.id = paragraph_id 
      AND u.project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage sources of their paragraphs"
  ON minotauro_curated_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_paragraphs p
      INNER JOIN minotauro_galaxies g ON p.galaxy_id = g.id
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE p.id = paragraph_id 
      AND (
        u.user_id = auth.uid()
        OR u.project_id IN (
          SELECT id FROM projects WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- --------------------------------------------
-- Políticas para minotauro_ai_interactions
-- (Heredan permisos de paragraph)
-- --------------------------------------------

CREATE POLICY "Users can view AI interactions of their paragraphs"
  ON minotauro_ai_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_paragraphs p
      INNER JOIN minotauro_galaxies g ON p.galaxy_id = g.id
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE p.id = paragraph_id 
      AND u.project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage AI interactions of their paragraphs"
  ON minotauro_ai_interactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_paragraphs p
      INNER JOIN minotauro_galaxies g ON p.galaxy_id = g.id
      INNER JOIN minotauro_universes u ON g.universe_id = u.id
      WHERE p.id = paragraph_id 
      AND (
        u.user_id = auth.uid()
        OR u.project_id IN (
          SELECT id FROM projects WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- PASO 5: FUNCIONES HELPER
-- ============================================

-- Función para obtener el universo completo con todas sus galaxias y párrafos
CREATE OR REPLACE FUNCTION get_minotauro_universe_full(p_universe_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'universe', row_to_json(u.*),
    'galaxies', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'galaxy', row_to_json(g.*),
          'paragraphs', (
            SELECT jsonb_agg(row_to_json(p.*) ORDER BY p.order_index)
            FROM minotauro_paragraphs p
            WHERE p.galaxy_id = g.id
          )
        ) ORDER BY g.order_index
      )
      FROM minotauro_galaxies g
      WHERE g.universe_id = u.id
    )
  ) INTO result
  FROM minotauro_universes u
  WHERE u.id = p_universe_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener fuentes curadas de un párrafo con detalles de Cognética
CREATE OR REPLACE FUNCTION get_paragraph_curated_sources_with_details(p_paragraph_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'source', row_to_json(s.*),
        'artifact', (
          SELECT row_to_json(a.*) 
          FROM cog_artifacts a 
          WHERE a.id = s.artifact_id
        ),
        'chat_session', (
          SELECT row_to_json(cs.*) 
          FROM cog_chat_sessions cs 
          WHERE cs.id = s.chat_session_id
        )
      ) ORDER BY s.order_index
    )
    FROM minotauro_curated_sources s
    WHERE s.paragraph_id = p_paragraph_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial de versiones de un párrafo
CREATE OR REPLACE FUNCTION get_paragraph_version_history(p_paragraph_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      row_to_json(v.*) ORDER BY v.version_number DESC
    )
    FROM minotauro_paragraph_versions v
    WHERE v.paragraph_id = p_paragraph_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 6: TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_minotauro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_universes_updated_at
  BEFORE UPDATE ON minotauro_universes
  FOR EACH ROW EXECUTE FUNCTION update_minotauro_updated_at();

CREATE TRIGGER update_galaxies_updated_at
  BEFORE UPDATE ON minotauro_galaxies
  FOR EACH ROW EXECUTE FUNCTION update_minotauro_updated_at();

CREATE TRIGGER update_paragraphs_updated_at
  BEFORE UPDATE ON minotauro_paragraphs
  FOR EACH ROW EXECUTE FUNCTION update_minotauro_updated_at();

-- ============================================
-- PASO 7: COMENTARIOS
-- ============================================

COMMENT ON TABLE minotauro_universes IS 'Escritos completos del Módulo Minotauro (co-creación híbrida IA)';
COMMENT ON TABLE minotauro_galaxies IS 'Secciones/capítulos de un escrito (universo)';
COMMENT ON TABLE minotauro_paragraphs IS 'Párrafos individuales (universos de bolsillo) con contenido humano, IA y final';
COMMENT ON TABLE minotauro_paragraph_versions IS 'Control de cambios de cada párrafo (historial de versiones)';
COMMENT ON TABLE minotauro_curated_sources IS 'Fuentes curadas desde Cognética enlazadas a párrafos específicos';
COMMENT ON TABLE minotauro_ai_interactions IS 'Registro de interacciones con IA (prompts, respuestas, tokens)';

COMMENT ON COLUMN minotauro_paragraphs.human_content IS 'El "solo inicial" del humano (materia prima, tripa)';
COMMENT ON COLUMN minotauro_paragraphs.ai_content IS 'Propuesta de la IA (estructurada según arquetipo)';
COMMENT ON COLUMN minotauro_paragraphs.final_content IS 'Versión aceptada que se exporta';
COMMENT ON COLUMN minotauro_paragraphs.seed_concept IS 'La semilla que se quiere transmitir en este párrafo';
COMMENT ON COLUMN minotauro_paragraphs.archetype_tone IS 'Arquetipo de tono: bufon (ironía), auditor (rigor), editor (textura)';

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
