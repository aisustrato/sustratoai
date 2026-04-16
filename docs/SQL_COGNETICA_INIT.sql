-- INICIALIZACIÓN DEL MÓDULO DE COGNÉTICA FORENSE (Sustrato v3)
-- Objetivo: Estructura para almacenar artefactos multimedia, transcripciones y análisis fractal.

-- 1. ENUM: Tipos de Artefactos
CREATE TYPE public.cog_artifact_type AS ENUM (
    'video',
    'audio',
    'document', -- PDF, DOCX
    'image',
    'other'
);

-- 2. ENUM: Estado de Procesamiento
CREATE TYPE public.cog_processing_status AS ENUM (
    'pending',
    'uploading',
    'transcribing',
    'analyzing',
    'completed',
    'error'
);

-- 3. TABLA PRINCIPAL: Artefactos (La "Materia Prima")
CREATE TABLE public.cog_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Metadatos Básicos
    title TEXT NOT NULL,
    description TEXT,
    type public.cog_artifact_type NOT NULL,
    
    -- Archivo Físico (Supabase Storage)
    storage_path TEXT NOT NULL, -- Ruta en el bucket 'cognetica-files'
    file_size_bytes BIGINT,
    mime_type TEXT,
    duration_seconds INTEGER, -- Para audio/video
    
    -- Metadatos de Origen
    source_metadata JSONB DEFAULT '{}'::jsonb, 
    -- Ej: { "author": "Humano", "date_recorded": "2023-10-01", "device": "iPhone 14" }
    
    -- Estado del Pipeline
    status public.cog_processing_status DEFAULT 'pending',
    error_log TEXT, -- Si falla algo
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. TABLA: Transcripciones y Contenido (El "Texto Base")
CREATE TABLE public.cog_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES public.cog_artifacts(id) ON DELETE CASCADE,
    
    -- Contenido
    full_text TEXT, -- Markdown completo
    segments JSONB DEFAULT '[]'::jsonb, 
    -- Ej: [{ "start": 0, "end": 10, "speaker": "A", "text": "Hola..." }]
    
    -- Metadatos de Procesamiento
    provider TEXT, -- 'deepgram', 'openai', 'manual'
    language TEXT DEFAULT 'es',
    confidence_score FLOAT, -- 0.0 a 1.0
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: Semillas Fractales (Las "Ideas Z" y Elementos de No-Simulabilidad)
CREATE TABLE public.cog_fractal_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    artifact_id UUID REFERENCES public.cog_artifacts(id) ON DELETE SET NULL, -- Puede ser una semilla global o de un artefacto
    
    -- La Esencia
    content TEXT NOT NULL, -- La cita, frase o idea
    context TEXT, -- Contexto de dónde salió
    
    -- Dimensiones Cognéticas (JSONB para flexibilidad máxima)
    properties JSONB DEFAULT '{}'::jsonb,
    -- Estructura esperada:
    -- {
    --   "temperature": "hot", // o numérico 0-100
    --   "altitude": "high_level", // abstract vs concrete
    --   "is_nonsimulable": true, // Elemento humano irreproducible por IA
    --   "z_factor": 0.95 // Potencia de la idea
    -- }
    
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. TABLA: Granjas Semánticas (Agrupadores Polimórficos)
CREATE TABLE public.cog_semantic_farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configuración de la Granja
    farm_type TEXT DEFAULT 'cluster', -- 'cluster', 'sequence', 'network'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA RELACIONAL: Semillas en Granjas (N a N)
CREATE TABLE public.cog_seeds_in_farms (
    farm_id UUID NOT NULL REFERENCES public.cog_semantic_farms(id) ON DELETE CASCADE,
    seed_id UUID NOT NULL REFERENCES public.cog_fractal_seeds(id) ON DELETE CASCADE,
    
    -- Metadatos de la Relación (El "Pegamento")
    connection_strength FLOAT DEFAULT 1.0,
    role_in_farm TEXT, -- 'core', 'peripheral', 'bridge'
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (farm_id, seed_id)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_cog_artifacts_project ON public.cog_artifacts(project_id);
CREATE INDEX idx_cog_seeds_project ON public.cog_fractal_seeds(project_id);
CREATE INDEX idx_cog_seeds_artifact ON public.cog_fractal_seeds(artifact_id);
CREATE INDEX idx_cog_transcriptions_artifact ON public.cog_transcriptions(artifact_id);

-- Políticas RLS (Seguridad Row Level Security)
ALTER TABLE public.cog_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_fractal_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_semantic_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_seeds_in_farms ENABLE ROW LEVEL SECURITY;

-- Política Genérica: Ver/Editar si eres miembro del proyecto (Simplificada para MVP)
CREATE POLICY "Miembros del proyecto ven artefactos" ON public.cog_artifacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm 
            WHERE pm.project_id = public.cog_artifacts.project_id 
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Miembros ven semillas" ON public.cog_fractal_seeds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm 
            WHERE pm.project_id = public.cog_fractal_seeds.project_id 
            AND pm.user_id = auth.uid()
        )
    );

-- Notificaciones para actualizaciones en Realtime (Opcional)
-- CREATE PUBLICATION supabase_realtime FOR TABLE public.cog_artifacts;
