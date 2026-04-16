-- ========================================================================
-- MIGRACIÓN: Sistema de Historial de Ediciones de Ensayos Destilados
-- ========================================================================
-- 🎯 PROPÓSITO: Implementar sistema append-only para ediciones manuales
--              de ensayos destilados, preservando integridad de versiones
-- 🔧 DECISIÓN: Cada edición manual crea un nuevo registro, nunca se modifica
-- ⚠️ ADVERTENCIA: NO borrar registros de esta tabla - es append-only

-- ========================================================================
-- TABLA: cog_essay_edit_history
-- ========================================================================
-- Almacena TODAS las versiones de ensayos destilados (originales + editadas)
-- Lógica append-only: cada edición manual genera un nuevo registro

CREATE TABLE IF NOT EXISTS cog_essay_edit_history (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    transcription_id UUID REFERENCES cog_transcriptions(id) ON DELETE SET NULL,
    
    -- Contenido del ensayo en esta versión
    essay_content TEXT NOT NULL,
    
    -- Metadata de la versión
    version_number INTEGER NOT NULL, -- 1, 2, 3, etc. (incremental por artifact)
    edit_type TEXT NOT NULL CHECK (edit_type IN ('ai_generated', 'manual_edit', 'format_fix')),
    
    -- Información de edición manual
    edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    edit_reason TEXT, -- Por qué se editó manualmente (ej: "Corregir formato Markdown roto")
    changes_summary TEXT, -- Resumen de cambios (opcional)
    
    -- Metadata técnica
    character_count INTEGER,
    estimated_tokens INTEGER,
    
    -- Metadata de generación original (si aplica)
    generation_metadata JSONB, -- Copia del metadata original de distilled_essay_metadata
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para búsqueda eficiente
    CONSTRAINT unique_artifact_version UNIQUE (artifact_id, version_number)
);

-- ========================================================================
-- ÍNDICES
-- ========================================================================

-- Índice para buscar versiones por artefacto (ordenadas por versión)
CREATE INDEX idx_essay_history_artifact_version 
ON cog_essay_edit_history(artifact_id, version_number DESC);

-- Índice para buscar ediciones por usuario
CREATE INDEX idx_essay_history_edited_by 
ON cog_essay_edit_history(edited_by, created_at DESC);

-- Índice para buscar por tipo de edición
CREATE INDEX idx_essay_history_edit_type 
ON cog_essay_edit_history(edit_type, created_at DESC);

-- ========================================================================
-- RLS (Row Level Security)
-- ========================================================================

ALTER TABLE cog_essay_edit_history ENABLE ROW LEVEL SECURITY;

-- Política de lectura: usuarios pueden ver historial de sus proyectos
CREATE POLICY "Users can view essay history from their projects"
ON cog_essay_edit_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM cog_artifacts a
        INNER JOIN projects p ON a.project_id = p.id
        WHERE a.id = cog_essay_edit_history.artifact_id
        AND p.owner_id = auth.uid()
    )
);

-- Política de inserción: usuarios pueden crear versiones en sus proyectos
CREATE POLICY "Users can create essay versions in their projects"
ON cog_essay_edit_history
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM cog_artifacts a
        INNER JOIN projects p ON a.project_id = p.id
        WHERE a.id = cog_essay_edit_history.artifact_id
        AND p.owner_id = auth.uid()
    )
);

-- ⚠️ NO hay política de UPDATE ni DELETE - tabla es append-only

-- ========================================================================
-- FUNCIÓN: Obtener versión actual del ensayo
-- ========================================================================

CREATE OR REPLACE FUNCTION get_current_essay_version(p_artifact_id UUID)
RETURNS TABLE (
    version_number INTEGER,
    essay_content TEXT,
    edit_type TEXT,
    edited_by UUID,
    created_at TIMESTAMPTZ,
    is_manual_edit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.version_number,
        h.essay_content,
        h.edit_type,
        h.edited_by,
        h.created_at,
        (h.edit_type = 'manual_edit' OR h.edit_type = 'format_fix') AS is_manual_edit
    FROM cog_essay_edit_history h
    WHERE h.artifact_id = p_artifact_id
    ORDER BY h.version_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================================================
-- FUNCIÓN: Obtener historial completo de versiones
-- ========================================================================

CREATE OR REPLACE FUNCTION get_essay_version_history(p_artifact_id UUID)
RETURNS TABLE (
    version_number INTEGER,
    edit_type TEXT,
    edited_by UUID,
    editor_email TEXT,
    edit_reason TEXT,
    changes_summary TEXT,
    character_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.version_number,
        h.edit_type,
        h.edited_by,
        u.email AS editor_email,
        h.edit_reason,
        h.changes_summary,
        h.character_count,
        h.created_at
    FROM cog_essay_edit_history h
    LEFT JOIN auth.users u ON h.edited_by = u.id
    WHERE h.artifact_id = p_artifact_id
    ORDER BY h.version_number DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================================================
-- COMENTARIOS
-- ========================================================================

COMMENT ON TABLE cog_essay_edit_history IS 
'Historial append-only de todas las versiones de ensayos destilados. 
Cada edición manual crea un nuevo registro preservando la versión anterior.';

COMMENT ON COLUMN cog_essay_edit_history.version_number IS 
'Número de versión incremental por artefacto (1, 2, 3...). La versión más alta es la actual.';

COMMENT ON COLUMN cog_essay_edit_history.edit_type IS 
'Tipo de versión: ai_generated (original de IA), manual_edit (edición humana), format_fix (corrección de formato)';

COMMENT ON COLUMN cog_essay_edit_history.edit_reason IS 
'Razón por la que se editó manualmente (ej: "Corregir headers Markdown rotos")';

COMMENT ON FUNCTION get_current_essay_version IS 
'Obtiene la versión actual (más reciente) del ensayo destilado de un artefacto';

COMMENT ON FUNCTION get_essay_version_history IS 
'Obtiene el historial completo de versiones de un ensayo con información del editor';
