-- Crear tabla para resaltados de abstracts de artículos
CREATE TABLE IF NOT EXISTS public.article_abstract_highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Versión del abstract (original o traducida)
    version_type TEXT NOT NULL CHECK (version_type IN ('original', 'translated')),
    
    -- Contenido del abstract con marcas HTML
    highlighted_content TEXT NOT NULL,
    
    -- Metadatos de los resaltados (JSON array)
    highlights_metadata JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint único: un usuario solo puede tener un resaltado por artículo y versión
    UNIQUE(article_id, user_id, version_type)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_article_abstract_highlights_article_user 
ON public.article_abstract_highlights(article_id, user_id);

CREATE INDEX IF NOT EXISTS idx_article_abstract_highlights_user_project 
ON public.article_abstract_highlights(user_id, project_id);

CREATE INDEX IF NOT EXISTS idx_article_abstract_highlights_created_at 
ON public.article_abstract_highlights(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_article_abstract_highlights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_article_abstract_highlights_updated_at
    BEFORE UPDATE ON public.article_abstract_highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_article_abstract_highlights_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.article_abstract_highlights ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver sus propios resaltados de proyectos donde son miembros
CREATE POLICY "article_abstract_highlights_select_policy"
ON public.article_abstract_highlights
FOR SELECT
TO public
USING (
    is_user_member_of_project(auth.uid(), project_id)
    AND user_id = auth.uid()
);

-- Política RLS: Los usuarios solo pueden insertar resaltados en proyectos donde son miembros
CREATE POLICY "article_abstract_highlights_insert_policy"
ON public.article_abstract_highlights
FOR INSERT
TO public
WITH CHECK (
    is_user_member_of_project(auth.uid(), project_id)
    AND user_id = auth.uid()
);

-- Política RLS: Los usuarios solo pueden actualizar sus propios resaltados
CREATE POLICY "article_abstract_highlights_update_policy"
ON public.article_abstract_highlights
FOR UPDATE
TO public
USING (
    is_user_member_of_project(auth.uid(), project_id)
    AND user_id = auth.uid()
)
WITH CHECK (
    is_user_member_of_project(auth.uid(), project_id)
    AND user_id = auth.uid()
);

-- Política RLS: Los usuarios solo pueden eliminar sus propios resaltados
CREATE POLICY "article_abstract_highlights_delete_policy"
ON public.article_abstract_highlights
FOR DELETE
TO public
USING (
    is_user_member_of_project(auth.uid(), project_id)
    AND user_id = auth.uid()
);

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.article_abstract_highlights IS 'Almacena los resaltados personalizados de abstracts de artículos por usuario';
COMMENT ON COLUMN public.article_abstract_highlights.version_type IS 'Indica si el resaltado es sobre la versión original o traducida del abstract';
COMMENT ON COLUMN public.article_abstract_highlights.highlighted_content IS 'Contenido del abstract con las marcas HTML de resaltado aplicadas';
COMMENT ON COLUMN public.article_abstract_highlights.highlights_metadata IS 'Metadatos JSON con información de cada resaltado (texto, posición, etc.)';
