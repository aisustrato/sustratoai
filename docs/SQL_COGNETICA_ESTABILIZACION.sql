-- ============================================
-- 🧠🪢 COGNÉTICA - SQL DE ESTABILIZACIÓN
-- Ejecutar en Supabase SQL Editor
-- Fecha: Diciembre 2025
-- Objetivo: Completar estructura para artefactos + chat QUIPU
-- ============================================

-- ============================================
-- 1️⃣ TABLA: cog_chat_sessions
-- Chat con calibrador QUIPU + Microscopio Ético
-- ============================================

CREATE TABLE IF NOT EXISTS cog_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referencias (usa projects, no cog_projects)
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Metadata de la sesión
    session_title TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Historial completo como JSONB
    -- Estructura: [{ role, content, timestamp, quipuCalibrations, isParalloros, f0Score, geometricPattern }]
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- Métricas agregadas de la sesión
    total_messages INTEGER DEFAULT 0,
    avg_f0_score NUMERIC(5,2),           -- Promedio de resonancia f₀
    paralloros_count INTEGER DEFAULT 0,   -- Veces que se aplicó paralloros
    
    -- Microscopio Ético (Ciclo 10)
    dominant_pattern TEXT,                -- P1, P2, P3 o P4
    pattern_distribution JSONB,           -- {P1: 2, P2: 5, P3: 1, P4: 0}
    
    -- Contexto usado en la sesión
    artifact_context TEXT,
    inference_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cog_chat_sessions_artifact 
    ON cog_chat_sessions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_cog_chat_sessions_project 
    ON cog_chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_cog_chat_sessions_started 
    ON cog_chat_sessions(started_at DESC);

-- Trigger updated_at
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
-- 2️⃣ RLS PARA cog_chat_sessions
-- ============================================

ALTER TABLE cog_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Ver sesiones de proyectos propios
DROP POLICY IF EXISTS "Users can view chat sessions of their projects" ON cog_chat_sessions;
CREATE POLICY "Users can view chat sessions of their projects"
    ON cog_chat_sessions FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política: Crear sesiones en proyectos propios
DROP POLICY IF EXISTS "Users can create chat sessions in their projects" ON cog_chat_sessions;
CREATE POLICY "Users can create chat sessions in their projects"
    ON cog_chat_sessions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política: Actualizar sesiones propias
DROP POLICY IF EXISTS "Users can update their chat sessions" ON cog_chat_sessions;
CREATE POLICY "Users can update their chat sessions"
    ON cog_chat_sessions FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política: Eliminar sesiones propias
DROP POLICY IF EXISTS "Users can delete their chat sessions" ON cog_chat_sessions;
CREATE POLICY "Users can delete their chat sessions"
    ON cog_chat_sessions FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- 3️⃣ VERIFICAR RLS EN cog_artifacts
-- ============================================

-- Asegurar que RLS está habilitado
ALTER TABLE cog_artifacts ENABLE ROW LEVEL SECURITY;

-- Política: Ver artefactos de proyectos propios
DROP POLICY IF EXISTS "Users can view their project artifacts" ON cog_artifacts;
CREATE POLICY "Users can view their project artifacts"
    ON cog_artifacts FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política: Crear artefactos en proyectos propios
DROP POLICY IF EXISTS "Users can create artifacts in their projects" ON cog_artifacts;
CREATE POLICY "Users can create artifacts in their projects"
    ON cog_artifacts FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política: Actualizar artefactos propios
DROP POLICY IF EXISTS "Users can update their artifacts" ON cog_artifacts;
CREATE POLICY "Users can update their artifacts"
    ON cog_artifacts FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política: Eliminar artefactos propios
DROP POLICY IF EXISTS "Users can delete their artifacts" ON cog_artifacts;
CREATE POLICY "Users can delete their artifacts"
    ON cog_artifacts FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- 4️⃣ VERIFICAR RLS EN cog_transcriptions
-- ============================================

ALTER TABLE cog_transcriptions ENABLE ROW LEVEL SECURITY;

-- Política: Acceso a transcripciones vía artefacto
DROP POLICY IF EXISTS "Users can access transcriptions of their artifacts" ON cog_transcriptions;
CREATE POLICY "Users can access transcriptions of their artifacts"
    ON cog_transcriptions FOR ALL
    USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
            )
        )
    );

-- ============================================
-- 5️⃣ VERIFICAR RLS EN cog_fractal_seeds
-- ============================================

ALTER TABLE cog_fractal_seeds ENABLE ROW LEVEL SECURITY;

-- Política: Acceso a semillas vía artefacto
DROP POLICY IF EXISTS "Users can access seeds of their artifacts" ON cog_fractal_seeds;
CREATE POLICY "Users can access seeds of their artifacts"
    ON cog_fractal_seeds FOR ALL
    USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
            )
        )
    );

-- ============================================
-- 6️⃣ VERIFICAR RLS EN cog_generated_images
-- ============================================

ALTER TABLE cog_generated_images ENABLE ROW LEVEL SECURITY;

-- Política: Acceso a imágenes vía prompt → artifact
-- Cadena: cog_generated_images.prompt_id → cog_image_prompts.artifact_id → cog_artifacts
DROP POLICY IF EXISTS "Users can access images of their artifacts" ON cog_generated_images;
CREATE POLICY "Users can access images of their artifacts"
    ON cog_generated_images FOR ALL
    USING (
        prompt_id IN (
            SELECT id FROM cog_image_prompts WHERE artifact_id IN (
                SELECT id FROM cog_artifacts WHERE project_id IN (
                    SELECT id FROM projects WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- ============================================
-- ✅ VERIFICACIÓN
-- ============================================

-- Ejecutar estas consultas para verificar:

-- 1. Ver estructura de cog_chat_sessions
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'cog_chat_sessions' ORDER BY ordinal_position;

-- 2. Ver políticas RLS
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename LIKE 'cog_%';

-- 3. Probar inserción (reemplazar UUIDs reales)
-- INSERT INTO cog_chat_sessions (artifact_id, project_id, messages, total_messages)
-- VALUES ('uuid-artefacto', 'uuid-proyecto', '[]', 0);

-- ============================================
-- 📊 RESUMEN DE CAMBIOS
-- ============================================
-- ✅ cog_chat_sessions: Tabla creada con campos para QUIPU + Microscopio
-- ✅ RLS en cog_chat_sessions: 4 políticas (SELECT, INSERT, UPDATE, DELETE)
-- ✅ RLS en cog_artifacts: 4 políticas verificadas
-- ✅ RLS en cog_transcriptions: Política ALL
-- ✅ RLS en cog_fractal_seeds: Política ALL
-- ✅ RLS en cog_generated_images: Política ALL
