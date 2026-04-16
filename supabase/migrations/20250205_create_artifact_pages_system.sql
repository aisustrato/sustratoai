-- ============================================================================
-- MIGRACIÓN: Sistema de Páginas para Artefactos (Presentaciones/Documentos)
-- Fecha: 2025-02-05
-- Descripción: Implementa soporte multi-página para presentaciones y documentos
--              con procesamiento granular y traducción batch
-- ============================================================================

-- ============================================================================
-- 1. TABLA PRINCIPAL: cog_artifact_pages
-- ============================================================================
-- Almacena páginas individuales de presentaciones/documentos
-- Cada página tiene su propio PDF, markdown original y traducido

CREATE TABLE IF NOT EXISTS cog_artifact_pages (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  
  -- Storage del PDF individual de la página
  -- Formato: 'presentations/{artifact_id}/page_{N}.pdf'
  pdf_storage_path TEXT,
  
  -- Markdowns en diferentes etapas
  markdown_original TEXT,      -- Output directo de Marker API (con descripciones en inglés)
  markdown_translated TEXT,     -- Con traducciones insertadas por DeepSeek/Claude
  
  -- Estado de procesamiento
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'processed', 'translated', 'failed')
  ),
  
  -- Metadata de Marker API
  marker_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Control de errores y reintentos
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  processed_at TIMESTAMPTZ,
  translated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_artifact_page UNIQUE(artifact_id, page_number),
  CONSTRAINT positive_page_number CHECK (page_number > 0),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- ============================================================================
-- 2. ÍNDICES PARA QUERIES EFICIENTES
-- ============================================================================

-- Índice para buscar páginas por artefacto y estado
CREATE INDEX idx_artifact_pages_artifact_status 
  ON cog_artifact_pages(artifact_id, status);

-- Índice para ordenar por número de página
CREATE INDEX idx_artifact_pages_page_number 
  ON cog_artifact_pages(artifact_id, page_number);

-- Índice para búsqueda fulltext en markdown original
CREATE INDEX idx_artifact_pages_markdown_original_fts
  ON cog_artifact_pages USING gin(to_tsvector('spanish', markdown_original));

-- Índice para búsqueda fulltext en markdown traducido
CREATE INDEX idx_artifact_pages_markdown_translated_fts
  ON cog_artifact_pages USING gin(to_tsvector('spanish', markdown_translated));

-- Índice para páginas con errores (debugging)
CREATE INDEX idx_artifact_pages_failed
  ON cog_artifact_pages(artifact_id, status)
  WHERE status = 'failed';

-- ============================================================================
-- 3. ÍNDICE EN cog_artifacts PARA METADATA
-- ============================================================================

-- Índice para buscar artefactos por modo de procesamiento
CREATE INDEX IF NOT EXISTS idx_artifacts_processing_mode 
  ON cog_artifacts((source_metadata->>'processing_mode'))
  WHERE source_metadata->>'processing_mode' IS NOT NULL;

-- Índice para artefactos con páginas
CREATE INDEX IF NOT EXISTS idx_artifacts_has_pages
  ON cog_artifacts((source_metadata->>'has_pages'))
  WHERE (source_metadata->>'has_pages')::boolean = true;

-- ============================================================================
-- 4. FUNCIÓN: Calcular Progreso de Procesamiento
-- ============================================================================
-- Evita duplicación de datos en source_metadata
-- Source of truth: estado real de las páginas en DB

CREATE OR REPLACE FUNCTION get_artifact_progress(artifact_uuid UUID)
RETURNS JSON AS $$
  SELECT COALESCE(
    json_build_object(
      'total_pages', COUNT(*),
      'pending', COUNT(*) FILTER (WHERE status = 'pending'),
      'processing', COUNT(*) FILTER (WHERE status = 'processing'),
      'processed', COUNT(*) FILTER (WHERE status = 'processed'),
      'translated', COUNT(*) FILTER (WHERE status = 'translated'),
      'failed', COUNT(*) FILTER (WHERE status = 'failed'),
      'completion_percentage', 
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(*) FILTER (WHERE status IN ('processed', 'translated'))::numeric / COUNT(*)::numeric) * 100, 2)
          ELSE 0
        END
    ),
    json_build_object(
      'total_pages', 0,
      'pending', 0,
      'processing', 0,
      'processed', 0,
      'translated', 0,
      'failed', 0,
      'completion_percentage', 0
    )
  )
  FROM cog_artifact_pages
  WHERE artifact_id = artifact_uuid;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_artifact_progress IS 
'Calcula el progreso de procesamiento de páginas de un artefacto en tiempo real. Evita duplicación de datos en source_metadata.';

-- ============================================================================
-- 5. CONSTRAINT DE INTEGRIDAD EN cog_artifacts
-- ============================================================================
-- Valida que si un artefacto tiene páginas, debe tener total_pages definido

ALTER TABLE cog_artifacts
DROP CONSTRAINT IF EXISTS check_pages_consistency;

ALTER TABLE cog_artifacts
ADD CONSTRAINT check_pages_consistency
CHECK (
  (source_metadata->>'has_pages' IS NULL) OR
  (source_metadata->>'has_pages' = 'false') OR
  (
    (source_metadata->>'has_pages' = 'true') AND
    (source_metadata->>'total_pages' IS NOT NULL)
  )
);

COMMENT ON CONSTRAINT check_pages_consistency ON cog_artifacts IS
'Valida que artefactos con páginas tengan total_pages definido en source_metadata';

-- ============================================================================
-- 6. TRIGGER: Actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_artifact_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_artifact_pages_updated_at
  BEFORE UPDATE ON cog_artifact_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_pages_updated_at();

-- ============================================================================
-- 7. RLS (Row Level Security) - Políticas de Acceso
-- ============================================================================
-- Misma lógica que dimension-actions.ts: verificar membresía en proyecto
-- Usa función has_permission_in_project que valida project_members + project_roles

ALTER TABLE cog_artifact_pages ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: Ver páginas de artefactos de proyectos donde eres miembro
CREATE POLICY "Users can view pages of artifacts in their projects"
  ON cog_artifact_pages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE a.id = cog_artifact_pages.artifact_id
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- Política de INSERT: Crear páginas en artefactos de proyectos donde tienes permiso
-- Validación de permiso específico se hace en backend con has_permission_in_project
CREATE POLICY "Users can create pages in artifacts of their projects"
  ON cog_artifact_pages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE a.id = cog_artifact_pages.artifact_id
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- Política de UPDATE: Actualizar páginas en artefactos de proyectos donde tienes permiso
-- Validación de permiso específico se hace en backend con has_permission_in_project
CREATE POLICY "Users can update pages in artifacts of their projects"
  ON cog_artifact_pages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE a.id = cog_artifact_pages.artifact_id
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- Política de DELETE: Eliminar páginas en artefactos de proyectos donde tienes permiso
-- Validación de permiso específico se hace en backend con has_permission_in_project
CREATE POLICY "Users can delete pages in artifacts of their projects"
  ON cog_artifact_pages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cog_artifacts a
      INNER JOIN project_members pm ON a.project_id = pm.project_id
      WHERE a.id = cog_artifact_pages.artifact_id
      AND pm.user_id = auth.uid()
      AND pm.is_active_for_user = true
    )
  );

-- ============================================================================
-- 8. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE cog_artifact_pages IS 
'Almacena páginas individuales de presentaciones y documentos multi-página. Cada página tiene su propio PDF, markdown original (Marker) y traducido (DeepSeek/Claude).';

COMMENT ON COLUMN cog_artifact_pages.pdf_storage_path IS 
'Ruta en Supabase Storage del PDF individual de esta página. Formato: presentations/{artifact_id}/page_{N}.pdf';

COMMENT ON COLUMN cog_artifact_pages.markdown_original IS 
'Markdown generado por Marker API. Puede contener descripciones de imágenes en inglés.';

COMMENT ON COLUMN cog_artifact_pages.markdown_translated IS 
'Markdown con traducciones insertadas por DeepSeek/Claude. Mantiene original + agrega traducción en itálico.';

COMMENT ON COLUMN cog_artifact_pages.status IS 
'Estado de procesamiento: pending (inicial) → processing (Marker trabajando) → processed (Marker completo) → translated (DeepSeek completo) | failed (error)';

COMMENT ON COLUMN cog_artifact_pages.marker_metadata IS 
'Metadata retornada por Marker API: conteo de imágenes, tablas, ecuaciones, etc.';

-- ============================================================================
-- 9. GRANTS DE PERMISOS
-- ============================================================================

-- Permitir acceso a usuarios autenticados (RLS maneja la seguridad)
GRANT SELECT, INSERT, UPDATE, DELETE ON cog_artifact_pages TO authenticated;

-- Permitir ejecución de función de progreso
GRANT EXECUTE ON FUNCTION get_artifact_progress TO authenticated;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
