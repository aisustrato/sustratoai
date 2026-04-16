-- ============================================================================
-- MIGRACIÓN: Sistema de Relaciones entre Artefactos (Multi-Modo)
-- Fecha: 2025-02-05
-- Descripción: Permite rastrear generaciones derivadas entre artefactos
--              Ejemplo: Audio → Informe, Audio → Slides, Informe → Audio
-- NOTA: Esta tabla es para FASE 2 (futuro). Se crea ahora para preparar arquitectura.
-- ============================================================================

-- ============================================================================
-- 1. TABLA: cog_artifact_relations
-- ============================================================================
-- Almacena relaciones de generación entre artefactos
-- Permite grafo de transformaciones: audio → slides → informe → audio

CREATE TABLE IF NOT EXISTS cog_artifact_relations (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación
  source_artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  derived_artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  
  -- Tipo de transformación
  relation_type TEXT NOT NULL CHECK (
    relation_type IN (
      'audio_to_informe',
      'audio_to_slides',
      'video_to_informe',
      'video_to_slides',
      'informe_to_audio',
      'informe_to_slides',
      'slides_to_audio',
      'slides_to_informe',
      'transcription_to_informe',
      'transcription_to_slides'
    )
  ),
  
  -- Metadata de la generación
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_reference CHECK (source_artifact_id != derived_artifact_id),
  CONSTRAINT unique_relation UNIQUE(source_artifact_id, derived_artifact_id, relation_type)
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

-- Índice para buscar derivados de un artefacto
CREATE INDEX idx_artifact_relations_source
  ON cog_artifact_relations(source_artifact_id);

-- Índice para buscar origen de un artefacto derivado
CREATE INDEX idx_artifact_relations_derived
  ON cog_artifact_relations(derived_artifact_id);

-- Índice para buscar por tipo de relación
CREATE INDEX idx_artifact_relations_type
  ON cog_artifact_relations(relation_type);

-- Índice compuesto para queries bidireccionales
CREATE INDEX idx_artifact_relations_bidirectional
  ON cog_artifact_relations(source_artifact_id, derived_artifact_id);

-- ============================================================================
-- 3. FUNCIONES ÚTILES
-- ============================================================================

-- Función: Obtener todos los derivados de un artefacto
CREATE OR REPLACE FUNCTION get_artifact_derivatives(artifact_uuid UUID)
RETURNS TABLE (
  derived_id UUID,
  relation_type TEXT,
  created_at TIMESTAMPTZ,
  artifact_title TEXT,
  artifact_type TEXT
) AS $$
  SELECT 
    r.derived_artifact_id,
    r.relation_type,
    r.created_at,
    a.title,
    a.type::text
  FROM cog_artifact_relations r
  INNER JOIN cog_artifacts a ON r.derived_artifact_id = a.id
  WHERE r.source_artifact_id = artifact_uuid
  ORDER BY r.created_at DESC;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_artifact_derivatives IS
'Retorna todos los artefactos derivados de un artefacto fuente';

-- Función: Obtener el origen de un artefacto derivado
CREATE OR REPLACE FUNCTION get_artifact_source(artifact_uuid UUID)
RETURNS TABLE (
  source_id UUID,
  relation_type TEXT,
  created_at TIMESTAMPTZ,
  artifact_title TEXT,
  artifact_type TEXT
) AS $$
  SELECT 
    r.source_artifact_id,
    r.relation_type,
    r.created_at,
    a.title,
    a.type::text
  FROM cog_artifact_relations r
  INNER JOIN cog_artifacts a ON r.source_artifact_id = a.id
  WHERE r.derived_artifact_id = artifact_uuid
  ORDER BY r.created_at DESC;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_artifact_source IS
'Retorna el artefacto fuente de un artefacto derivado';

-- Función: Obtener árbol completo de relaciones (recursivo)
CREATE OR REPLACE FUNCTION get_artifact_family_tree(artifact_uuid UUID)
RETURNS TABLE (
  artifact_id UUID,
  artifact_title TEXT,
  artifact_type TEXT,
  relation_type TEXT,
  depth INTEGER
) AS $$
  WITH RECURSIVE artifact_tree AS (
    -- Caso base: el artefacto raíz
    SELECT 
      a.id,
      a.title,
      a.type::text,
      NULL::text as relation_type,
      0 as depth
    FROM cog_artifacts a
    WHERE a.id = artifact_uuid
    
    UNION ALL
    
    -- Caso recursivo: derivados
    SELECT 
      a.id,
      a.title,
      a.type::text,
      r.relation_type,
      t.depth + 1
    FROM artifact_tree t
    INNER JOIN cog_artifact_relations r ON t.id = r.source_artifact_id
    INNER JOIN cog_artifacts a ON r.derived_artifact_id = a.id
  )
  SELECT * FROM artifact_tree;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_artifact_family_tree IS
'Retorna el árbol completo de relaciones de un artefacto (recursivo)';

-- ============================================================================
-- 4. RLS (Row Level Security)
-- ============================================================================
-- Misma lógica que dimension-actions.ts: verificar membresía en proyecto
-- Usa función has_permission_in_project que valida project_members + project_roles

ALTER TABLE cog_artifact_relations ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: Ver relaciones de artefactos en proyectos donde eres miembro
CREATE POLICY "Users can view relations of artifacts in their projects"
  ON cog_artifact_relations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE (a.id = cog_artifact_relations.source_artifact_id 
             OR a.id = cog_artifact_relations.derived_artifact_id)
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- Política de INSERT: Crear relaciones en artefactos de proyectos donde tienes permiso
-- Validación de permiso específico se hace en backend con has_permission_in_project
CREATE POLICY "Users can create relations in artifacts of their projects"
  ON cog_artifact_relations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE a.id = cog_artifact_relations.source_artifact_id
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- Política de DELETE: Eliminar relaciones en artefactos de proyectos donde tienes permiso
-- Validación de permiso específico se hace en backend con has_permission_in_project
CREATE POLICY "Users can delete relations in artifacts of their projects"
  ON cog_artifact_relations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE a.id = cog_artifact_relations.source_artifact_id
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- ============================================================================
-- 5. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE cog_artifact_relations IS
'Almacena relaciones de generación entre artefactos. Permite rastrear transformaciones multi-modo (audio→slides, informe→audio, etc.)';

COMMENT ON COLUMN cog_artifact_relations.source_artifact_id IS
'Artefacto original del cual se generó el derivado';

COMMENT ON COLUMN cog_artifact_relations.derived_artifact_id IS
'Artefacto generado a partir del fuente';

COMMENT ON COLUMN cog_artifact_relations.relation_type IS
'Tipo de transformación aplicada. Define qué proceso se usó para generar el derivado.';

COMMENT ON COLUMN cog_artifact_relations.generation_metadata IS
'Metadata del proceso de generación: modelo usado, parámetros, costos, etc.';

-- ============================================================================
-- 6. GRANTS DE PERMISOS
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON cog_artifact_relations TO authenticated;
GRANT EXECUTE ON FUNCTION get_artifact_derivatives TO authenticated;
GRANT EXECUTE ON FUNCTION get_artifact_source TO authenticated;
GRANT EXECUTE ON FUNCTION get_artifact_family_tree TO authenticated;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================