-- EXTENSIÓN COGNÉTICA: Pensadores, Disciplinas y Normalización
-- Objetivo: Gestionar entidades referenciales con soporte para desambiguación (IA + Humano).

-- 0. PRE-REQUISITO: Habilitar extensión para búsquedas difusas (Trigramas)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. TABLA: Referentes / Pensadores (El "Panteón")
CREATE TABLE public.cog_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- Nombre canónico (ej: "Gottfried Leibniz")
    aliases TEXT[] DEFAULT '{}', -- Variaciones aceptadas (ej: ["Leibnitz", "Von Leibniz"])
    
    -- Metadatos
    era TEXT, -- Ej: "Barroco", "Siglo XVII"
    bio_snippet TEXT, -- Resumen breve generado por IA o manual
    
    -- Estado de Curaduría
    is_validated BOOLEAN DEFAULT false, -- True = Canon confirmado por humano. False = Propuesta por IA.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: Disciplinas / Campos de Estudio
CREATE TABLE public.cog_disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- Ej: "Cibernética", "Teoría de Sistemas"
    description TEXT,
    
    is_validated BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RELACIÓN: Artefacto <-> Referentes (N a N)
CREATE TABLE public.cog_artifact_references (
    artifact_id UUID NOT NULL REFERENCES public.cog_artifacts(id) ON DELETE CASCADE,
    reference_id UUID NOT NULL REFERENCES public.cog_references(id) ON DELETE CASCADE,
    
    -- Contexto de la mención
    relevance_score FLOAT, -- Qué tan central es este pensador en el texto (0-1)
    context_snippet TEXT, -- Fragmento donde se le menciona
    
    PRIMARY KEY (artifact_id, reference_id)
);

-- 4. RELACIÓN: Artefacto <-> Disciplinas (N a N)
CREATE TABLE public.cog_artifact_disciplines (
    artifact_id UUID NOT NULL REFERENCES public.cog_artifacts(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.cog_disciplines(id) ON DELETE CASCADE,
    
    relevance_score FLOAT,
    
    PRIMARY KEY (artifact_id, discipline_id)
);

-- 5. RELACIÓN: Semillas <-> Referentes (Opcional pero potente)
-- Una semilla fractal puede estar inspirada en un pensador específico
ALTER TABLE public.cog_fractal_seeds 
ADD COLUMN derived_from_reference_id UUID REFERENCES public.cog_references(id) ON DELETE SET NULL;

-- Índices para búsquedas de texto (útil para el "fuzzy matching" simple)
CREATE INDEX idx_cog_references_name_gin ON public.cog_references USING gin (name gin_trgm_ops);
CREATE INDEX idx_cog_references_aliases_gin ON public.cog_references USING gin (aliases);

-- Políticas RLS (Seguridad)
ALTER TABLE public.cog_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_artifact_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cog_artifact_disciplines ENABLE ROW LEVEL SECURITY;

-- Política simple de lectura/escritura para miembros
CREATE POLICY "Miembros gestionan referentes" ON public.cog_references
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = public.cog_references.project_id AND pm.user_id = auth.uid())
    );

CREATE POLICY "Miembros gestionan disciplinas" ON public.cog_disciplines
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = public.cog_disciplines.project_id AND pm.user_id = auth.uid())
    );

CREATE POLICY "Miembros vinculan referentes" ON public.cog_artifact_references
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cog_artifacts a
            JOIN public.project_members pm ON pm.project_id = a.project_id
            WHERE a.id = public.cog_artifact_references.artifact_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Miembros vinculan disciplinas" ON public.cog_artifact_disciplines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cog_artifacts a
            JOIN public.project_members pm ON pm.project_id = a.project_id
            WHERE a.id = public.cog_artifact_disciplines.artifact_id AND pm.user_id = auth.uid()
        )
    );
