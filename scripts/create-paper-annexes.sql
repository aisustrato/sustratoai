-- Crear tabla paper_annexes para anexos / material suplementario
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.paper_annexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  language TEXT NOT NULL DEFAULT 'text', -- python, jupyter, csv, json, zip, text
  description TEXT NOT NULL DEFAULT '',
  "position" INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_paper_annexes_paper_id ON public.paper_annexes(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_annexes_position ON public.paper_annexes(paper_id, "position");

-- RLS: solo el creador del paper puede gestionar anexos
ALTER TABLE public.paper_annexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver anexos de papers públicos"
  ON public.paper_annexes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = paper_annexes.paper_id
      AND (papers.is_published = true OR papers.created_by = auth.uid())
    )
  );

CREATE POLICY "Usuarios pueden crear anexos en sus papers"
  ON public.paper_annexes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = paper_annexes.paper_id
      AND papers.created_by = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar anexos de sus papers"
  ON public.paper_annexes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = paper_annexes.paper_id
      AND papers.created_by = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar anexos de sus papers"
  ON public.paper_annexes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      WHERE papers.id = paper_annexes.paper_id
      AND papers.created_by = auth.uid()
    )
  );
