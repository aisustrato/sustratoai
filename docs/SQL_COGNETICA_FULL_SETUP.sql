-- ==============================================================================
-- 🧠🌱 COGNÉTICA - SETUP COMPLETO DE TABLAS
-- Sustrato.AI - El Jardín
-- Fecha: Diciembre 2024 - Ciclo 9
-- 
-- EJECUTAR EN ORDEN - Este script crea todas las tablas necesarias
-- ==============================================================================

-- ============================================================================
-- PARTE 1: TABLAS BASE
-- ============================================================================

-- 1.1 Proyectos de Cognética
CREATE TABLE IF NOT EXISTS cog_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_projects_user ON cog_projects(user_id);

-- 1.2 Artefactos (audio, video, texto)
CREATE TABLE IF NOT EXISTS cog_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('audio', 'video', 'text', 'document')),
    file_path TEXT, -- Ruta en Storage
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    duration_seconds INTEGER, -- Para audio/video
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'transcribed', 'analyzed', 'completed', 'error')),
    source_metadata JSONB DEFAULT '{}', -- Metadata adicional, prompts de imagen, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_artifacts_project ON cog_artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_cog_artifacts_status ON cog_artifacts(status);

-- 1.3 Transcripciones
CREATE TABLE IF NOT EXISTS cog_transcriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    full_text TEXT,
    segments JSONB DEFAULT '[]', -- [{start, end, text, confidence}]
    language TEXT DEFAULT 'es',
    model_used TEXT DEFAULT 'deepgram-nova-2',
    confidence_score NUMERIC(4,3),
    word_count INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_transcriptions_artifact ON cog_transcriptions(artifact_id);

-- ============================================================================
-- PARTE 2: ELEMENTOS COGNITIVOS EXTRAÍDOS
-- ============================================================================

-- 2.1 Semillas Fractales
CREATE TABLE IF NOT EXISTS cog_fractal_seeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- El concepto/semilla
    context TEXT, -- Frase donde aparece
    relevance NUMERIC(3,2) DEFAULT 0.5, -- 0-1
    category TEXT CHECK (category IN ('concepto', 'metafora', 'principio', 'patron', 'cita', 'otro')),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_seeds_artifact ON cog_fractal_seeds(artifact_id);
CREATE INDEX IF NOT EXISTS idx_cog_seeds_project ON cog_fractal_seeds(project_id);

-- 2.2 Pensadores/Autores
CREATE TABLE IF NOT EXISTS cog_thinkers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    discipline TEXT,
    era TEXT, -- "siglo XX", "contemporáneo", etc.
    bio_snippet TEXT, -- Biografía breve
    key_contributions JSONB DEFAULT '[]', -- Array de strings
    avatar_prompt TEXT, -- Prompt para generar avatar
    avatar_url TEXT, -- URL del avatar generado
    source_artifacts JSONB DEFAULT '[]', -- IDs de artefactos donde se menciona
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name) -- Un pensador único por proyecto
);

CREATE INDEX IF NOT EXISTS idx_cog_thinkers_project ON cog_thinkers(project_id);

-- 2.3 Teorías
CREATE TABLE IF NOT EXISTS cog_theories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    related_thinkers JSONB DEFAULT '[]', -- IDs de pensadores relacionados
    source_artifacts JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_cog_theories_project ON cog_theories(project_id);

-- 2.4 Corrientes de Pensamiento
CREATE TABLE IF NOT EXISTS cog_thought_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    source_artifacts JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_cog_streams_project ON cog_thought_streams(project_id);

-- 2.5 Disciplinas
CREATE TABLE IF NOT EXISTS cog_disciplines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_artifacts JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_cog_disciplines_project ON cog_disciplines(project_id);

-- 2.6 Citas Célebres
CREATE TABLE IF NOT EXISTS cog_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    author TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_quotes_artifact ON cog_quotes(artifact_id);

-- ============================================================================
-- PARTE 3: CHAT QUIPU
-- ============================================================================

-- 3.1 Sesiones de Chat
CREATE TABLE IF NOT EXISTS cog_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    session_title TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    messages JSONB DEFAULT '[]', -- [{role, content, timestamp, quipuCalibrations, isParalloros, f0Score}]
    total_messages INTEGER DEFAULT 0,
    avg_f0_score NUMERIC(5,2),
    paralloros_count INTEGER DEFAULT 0,
    artifact_context TEXT,
    inference_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_chat_artifact ON cog_chat_sessions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_cog_chat_project ON cog_chat_sessions(project_id);

-- ============================================================================
-- PARTE 4: GRANJAS Y NAVEGACIÓN FRACTAL
-- ============================================================================

-- 4.1 Granjas de Conceptos
CREATE TABLE IF NOT EXISTS cog_farms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('artifacts', 'seeds', 'thinkers', 'theories', 'mixed', 'custom')),
    description TEXT,
    icon TEXT DEFAULT '🌾', -- emoji
    color TEXT DEFAULT '#8B5CF6', -- hex violet
    position JSONB DEFAULT '{"x": 0, "y": 0}', -- Para visualización
    member_count INTEGER DEFAULT 0, -- Cache de conteo
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_farms_project ON cog_farms(project_id);

-- 4.2 Membresía en Granjas
CREATE TABLE IF NOT EXISTS cog_farm_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES cog_farms(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL CHECK (element_type IN ('artifact', 'seed', 'thinker', 'theory', 'stream', 'discipline', 'quote')),
    element_id UUID NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by TEXT DEFAULT 'user' CHECK (added_by IN ('user', 'ai')),
    confidence NUMERIC(3,2), -- Si fue sugerido por AI
    notes TEXT -- Notas del usuario
);

CREATE INDEX IF NOT EXISTS idx_cog_farm_members_farm ON cog_farm_members(farm_id);
CREATE INDEX IF NOT EXISTS idx_cog_farm_members_element ON cog_farm_members(element_type, element_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cog_farm_members_unique ON cog_farm_members(farm_id, element_type, element_id);

-- 4.3 Agujeros de Gusano (Conexiones No-Obvias)
CREATE TABLE IF NOT EXISTS cog_wormholes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    isomorphism_description TEXT, -- Por qué están conectados
    confidence NUMERIC(3,2) DEFAULT 0.5,
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'rejected', 'exploring')),
    suggested_by TEXT DEFAULT 'ai' CHECK (suggested_by IN ('gemini', 'claude', 'user', 'system')),
    user_notes TEXT,
    explored_count INTEGER DEFAULT 0, -- Veces que el usuario lo exploró
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_wormholes_project ON cog_wormholes(project_id);
CREATE INDEX IF NOT EXISTS idx_cog_wormholes_source ON cog_wormholes(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_cog_wormholes_target ON cog_wormholes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_cog_wormholes_status ON cog_wormholes(status);

-- 4.4 Métricas de Nodos (Tráfico)
CREATE TABLE IF NOT EXISTS cog_node_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL,
    element_id UUID NOT NULL,
    visit_count INTEGER DEFAULT 0,
    connection_count INTEGER DEFAULT 0, -- Cuántas conexiones tiene
    wormhole_count INTEGER DEFAULT 0, -- Cuántos agujeros de gusano
    last_visited TIMESTAMPTZ,
    heat_score NUMERIC(5,2) DEFAULT 0, -- Calculado: visitas + conexiones ponderadas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, element_type, element_id)
);

CREATE INDEX IF NOT EXISTS idx_cog_metrics_project ON cog_node_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_cog_metrics_heat ON cog_node_metrics(heat_score DESC);

-- ============================================================================
-- PARTE 5: IMÁGENES GENERADAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cog_generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id UUID REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    thinker_id UUID REFERENCES cog_thinkers(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES cog_projects(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    style TEXT, -- 'conceptual', 'figurative', 'artistic'
    storage_path TEXT, -- Ruta en Supabase Storage
    public_url TEXT,
    model_used TEXT DEFAULT 'seedream-4.0',
    generation_params JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cog_images_artifact ON cog_generated_images(artifact_id);
CREATE INDEX IF NOT EXISTS idx_cog_images_thinker ON cog_generated_images(thinker_id);

-- ============================================================================
-- PARTE 6: TRIGGERS PARA TIMESTAMPS
-- ============================================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'cog_projects', 
            'cog_artifacts', 
            'cog_chat_sessions', 
            'cog_farms', 
            'cog_wormholes', 
            'cog_node_metrics'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%I_updated ON %I;
            CREATE TRIGGER trg_%I_updated
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- PARTE 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE cog_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_fractal_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_thinkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_theories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_thought_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_wormholes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_node_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_generated_images ENABLE ROW LEVEL SECURITY;

-- Políticas para cog_projects (tabla raíz)
CREATE POLICY "Users can view own projects" ON cog_projects
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create projects" ON cog_projects
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON cog_projects
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON cog_projects
    FOR DELETE USING (user_id = auth.uid());

-- Macro para crear políticas en tablas con project_id
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'cog_artifacts',
            'cog_fractal_seeds',
            'cog_thinkers',
            'cog_theories',
            'cog_thought_streams',
            'cog_disciplines',
            'cog_quotes',
            'cog_chat_sessions',
            'cog_farms',
            'cog_wormholes',
            'cog_node_metrics',
            'cog_generated_images'
        ])
    LOOP
        -- SELECT
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can view %I" ON %I;
            CREATE POLICY "Users can view %I" ON %I
                FOR SELECT USING (
                    project_id IN (SELECT id FROM cog_projects WHERE user_id = auth.uid())
                );
        ', t, t, t, t);
        
        -- INSERT
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can create %I" ON %I;
            CREATE POLICY "Users can create %I" ON %I
                FOR INSERT WITH CHECK (
                    project_id IN (SELECT id FROM cog_projects WHERE user_id = auth.uid())
                );
        ', t, t, t, t);
        
        -- UPDATE
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can update %I" ON %I;
            CREATE POLICY "Users can update %I" ON %I
                FOR UPDATE USING (
                    project_id IN (SELECT id FROM cog_projects WHERE user_id = auth.uid())
                );
        ', t, t, t, t);
        
        -- DELETE
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can delete %I" ON %I;
            CREATE POLICY "Users can delete %I" ON %I
                FOR DELETE USING (
                    project_id IN (SELECT id FROM cog_projects WHERE user_id = auth.uid())
                );
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- Políticas especiales para cog_transcriptions (usa artifact_id, no project_id)
DROP POLICY IF EXISTS "Users can view cog_transcriptions" ON cog_transcriptions;
CREATE POLICY "Users can view cog_transcriptions" ON cog_transcriptions
    FOR SELECT USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT id FROM cog_projects WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create cog_transcriptions" ON cog_transcriptions;
CREATE POLICY "Users can create cog_transcriptions" ON cog_transcriptions
    FOR INSERT WITH CHECK (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT id FROM cog_projects WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update cog_transcriptions" ON cog_transcriptions;
CREATE POLICY "Users can update cog_transcriptions" ON cog_transcriptions
    FOR UPDATE USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT id FROM cog_projects WHERE user_id = auth.uid()
            )
        )
    );

-- Políticas para cog_farm_members (usa farm_id)
DROP POLICY IF EXISTS "Users can view farm_members" ON cog_farm_members;
CREATE POLICY "Users can view farm_members" ON cog_farm_members
    FOR SELECT USING (
        farm_id IN (
            SELECT id FROM cog_farms WHERE project_id IN (
                SELECT id FROM cog_projects WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage farm_members" ON cog_farm_members;
CREATE POLICY "Users can manage farm_members" ON cog_farm_members
    FOR ALL USING (
        farm_id IN (
            SELECT id FROM cog_farms WHERE project_id IN (
                SELECT id FROM cog_projects WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- PARTE 8: STORAGE BUCKET
-- ============================================================================

-- Crear bucket para archivos de Cognética (ejecutar en Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cognetica-files', 'cognetica-files', false);

-- Políticas de Storage (ejecutar después de crear el bucket)
-- CREATE POLICY "Users can upload cognetica files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'cognetica-files' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can view own cognetica files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'cognetica-files' AND auth.uid() IS NOT NULL);

-- ============================================================================
-- PARTE 9: VERIFICACIÓN
-- ============================================================================

-- Verificar todas las tablas creadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'cog_%'
ORDER BY table_name;

-- ============================================================================
-- ✅ SETUP COMPLETO
-- Tablas creadas: 15
-- Incluye: proyectos, artefactos, transcripciones, semillas, pensadores,
--          teorías, corrientes, disciplinas, citas, chat, granjas,
--          membresías, wormholes, métricas, imágenes
-- ============================================================================
