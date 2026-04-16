-- ============================================
-- 🧠🪢 COGNÉTICA - CHAT HISTORY CON CALIBRADOR QUIPU
-- Ejecutar en Supabase SQL Editor
-- Fecha: Diciembre 2024
-- ============================================

-- Tabla para guardar sesiones de chat con calibradores
CREATE TABLE IF NOT EXISTS cog_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    
    -- Metadata de la sesión
    session_title TEXT, -- Título opcional para la sesión
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Historial completo como JSONB
    -- Estructura: [{ role, content, timestamp, quipuCalibrations, isParalloros, f0Score }]
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- Métricas agregadas de la sesión
    total_messages INTEGER DEFAULT 0,
    avg_f0_score NUMERIC(5,2), -- Promedio de resonancia f₀
    paralloros_count INTEGER DEFAULT 0, -- Veces que se aplicó paralloros
    
    -- Contexto usado en la sesión
    artifact_context TEXT, -- Snapshot del contexto enviado a la API
    inference_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_cog_chat_sessions_artifact 
    ON cog_chat_sessions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_cog_chat_sessions_project 
    ON cog_chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_cog_chat_sessions_started 
    ON cog_chat_sessions(started_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_cog_chat_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cog_chat_sessions_updated ON cog_chat_sessions;
CREATE TRIGGER trg_cog_chat_sessions_updated
    BEFORE UPDATE ON cog_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_cog_chat_sessions_timestamp();

-- ============================================
-- 🔐 POLÍTICAS RLS
-- ============================================

ALTER TABLE cog_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver sesiones de sus proyectos
CREATE POLICY "Users can view chat sessions of their projects"
    ON cog_chat_sessions FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM cog_projects WHERE user_id = auth.uid()
        )
    );

-- Política: Usuarios pueden crear sesiones en sus proyectos
CREATE POLICY "Users can create chat sessions in their projects"
    ON cog_chat_sessions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM cog_projects WHERE user_id = auth.uid()
        )
    );

-- Política: Usuarios pueden actualizar sus sesiones
CREATE POLICY "Users can update their chat sessions"
    ON cog_chat_sessions FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM cog_projects WHERE user_id = auth.uid()
        )
    );

-- Política: Usuarios pueden eliminar sus sesiones
CREATE POLICY "Users can delete their chat sessions"
    ON cog_chat_sessions FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM cog_projects WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- ✅ VERIFICACIÓN
-- ============================================
-- Ejecutar para verificar:
-- SELECT * FROM cog_chat_sessions LIMIT 5;
