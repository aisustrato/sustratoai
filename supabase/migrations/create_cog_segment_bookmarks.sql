-- Tabla para persistir segmentos marcados de transcripciones
-- Permite marcar segmentos específicos de audio/video como importantes

CREATE TABLE IF NOT EXISTS cog_segment_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL, -- Índice del segmento en el array de transcripción
    segment_start FLOAT, -- Timestamp de inicio (opcional, para referencia)
    segment_end FLOAT, -- Timestamp de fin (opcional, para referencia)
    segment_text TEXT, -- Texto del segmento (opcional, para búsqueda)
    notes TEXT, -- Notas del usuario sobre este segmento (opcional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Un usuario solo puede marcar un segmento una vez por artefacto
    UNIQUE(artifact_id, user_id, segment_index)
);

-- Índices para optimizar consultas
CREATE INDEX idx_cog_segment_bookmarks_artifact ON cog_segment_bookmarks(artifact_id);
CREATE INDEX idx_cog_segment_bookmarks_user ON cog_segment_bookmarks(user_id);
CREATE INDEX idx_cog_segment_bookmarks_artifact_user ON cog_segment_bookmarks(artifact_id, user_id);

-- RLS (Row Level Security)
ALTER TABLE cog_segment_bookmarks ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios bookmarks
CREATE POLICY "Users can view their own bookmarks"
    ON cog_segment_bookmarks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear sus propios bookmarks
CREATE POLICY "Users can create their own bookmarks"
    ON cog_segment_bookmarks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propios bookmarks
CREATE POLICY "Users can update their own bookmarks"
    ON cog_segment_bookmarks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios bookmarks
CREATE POLICY "Users can delete their own bookmarks"
    ON cog_segment_bookmarks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_cog_segment_bookmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cog_segment_bookmarks_updated_at
    BEFORE UPDATE ON cog_segment_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_cog_segment_bookmarks_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE cog_segment_bookmarks IS 'Segmentos de transcripción marcados como importantes por usuarios';
COMMENT ON COLUMN cog_segment_bookmarks.segment_index IS 'Índice del segmento en el array de transcripción (0-based)';
COMMENT ON COLUMN cog_segment_bookmarks.notes IS 'Notas opcionales del usuario sobre por qué marcó este segmento';
