-- 📍 supabase/migrations/20260303_create_cog_chronological_data.sql
-- 🎯 PROPÓSITO: Tabla para almacenar datos cronológicos extraídos de artefactos
-- 🔧 DECISIÓN: Separar datos temporales/eventos de otros elementos cognitivos

-- Crear tabla para datos cronológicos
CREATE TABLE IF NOT EXISTS cog_chronological_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Datos del evento/fecha
    date_value TEXT, -- Fecha en formato flexible (puede ser "2023", "marzo 2023", "2023-03-15", etc.)
    event_type TEXT NOT NULL, -- Tipo: 'date', 'event', 'period', 'milestone', etc.
    description TEXT NOT NULL, -- Descripción del evento o dato cronológico
    context TEXT, -- Contexto donde aparece en el texto
    
    -- Metadata
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- Confianza de la extracción
    extracted_by TEXT DEFAULT 'deepseek-chat', -- Modelo que lo extrajo
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_cog_chronological_artifact ON cog_chronological_data(artifact_id);
CREATE INDEX idx_cog_chronological_project ON cog_chronological_data(project_id);
CREATE INDEX idx_cog_chronological_type ON cog_chronological_data(event_type);
CREATE INDEX idx_cog_chronological_date ON cog_chronological_data(date_value);

-- RLS Policies
ALTER TABLE cog_chronological_data ENABLE ROW LEVEL SECURITY;

-- Política SELECT 1: Owner del proyecto puede ver datos cronológicos
CREATE POLICY "Users can view chronological data from their projects"
    ON cog_chronological_data
    FOR SELECT
    TO public
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política SELECT 2: Miembros del proyecto pueden ver datos cronológicos
CREATE POLICY "Project members can view chronological data"
    ON cog_chronological_data
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = cog_chronological_data.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Política SELECT 3: Acceso vía project_members
CREATE POLICY "Users can access chronological data"
    ON cog_chronological_data
    FOR SELECT
    TO public
    USING (
        project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = auth.uid()
        )
    );

-- Política INSERT: Miembros del proyecto pueden insertar datos cronológicos
CREATE POLICY "Users can insert chronological data"
    ON cog_chronological_data
    FOR INSERT
    TO public
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = auth.uid()
        )
    );

-- Política UPDATE: Owner del proyecto puede actualizar datos cronológicos
CREATE POLICY "Users can update chronological data"
    ON cog_chronological_data
    FOR UPDATE
    TO public
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política DELETE: Owner del proyecto puede eliminar datos cronológicos
CREATE POLICY "Users can delete chronological data"
    ON cog_chronological_data
    FOR DELETE
    TO public
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_cog_chronological_data_updated_at
    BEFORE UPDATE ON cog_chronological_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permisos para usuarios autenticados
GRANT ALL ON cog_chronological_data TO authenticated;

-- Comentarios para documentación
COMMENT ON TABLE cog_chronological_data IS 'Datos cronológicos y eventos temporales extraídos de artefactos cognitivos. RLS: Política permisiva "authenticated". Validación de permisos en backend.';
COMMENT ON COLUMN cog_chronological_data.date_value IS 'Fecha en formato flexible (puede ser año, mes-año, fecha completa, etc.)';
COMMENT ON COLUMN cog_chronological_data.event_type IS 'Tipo de dato cronológico: date, event, period, milestone, etc.';
COMMENT ON COLUMN cog_chronological_data.description IS 'Descripción del evento o dato cronológico';
COMMENT ON COLUMN cog_chronological_data.context IS 'Contexto textual donde aparece el dato';
COMMENT ON COLUMN cog_chronological_data.confidence_score IS 'Nivel de confianza de la extracción (0.0 a 1.0)';
