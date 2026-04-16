-- Tabla para registrar exportaciones de análisis de discrepancias
-- Guarda timestamp y hash SHA-256 de cada exportación para trazabilidad

CREATE TABLE IF NOT EXISTS public.discrepancy_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información del archivo exportado
    file_name TEXT NOT NULL,
    file_hash_sha256 TEXT NOT NULL, -- Hash SHA-256 del contenido del archivo
    
    -- Metadatos de la exportación
    total_records INTEGER NOT NULL, -- Número de filas exportadas
    phase_ids UUID[] NOT NULL, -- IDs de las fases incluidas en la exportación
    filter_type TEXT, -- Tipo de filtro aplicado (all, agreement, discrepancy, etc.)
    filter_dimension_id UUID, -- ID de dimensión si se filtró por dimensión
    
    -- Timestamps
    exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para búsqueda rápida
    CONSTRAINT unique_file_hash UNIQUE (file_hash_sha256)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_project_id 
    ON public.discrepancy_export_logs(project_id);

CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_user_id 
    ON public.discrepancy_export_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_exported_at 
    ON public.discrepancy_export_logs(exported_at DESC);

CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_file_hash 
    ON public.discrepancy_export_logs(file_hash_sha256);

-- RLS (Row Level Security)
ALTER TABLE public.discrepancy_export_logs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias exportaciones
CREATE POLICY "Users can view their own export logs"
    ON public.discrepancy_export_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias exportaciones
CREATE POLICY "Users can insert their own export logs"
    ON public.discrepancy_export_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.discrepancy_export_logs IS 
    'Registro de exportaciones de análisis de discrepancias con hash SHA-256 para trazabilidad';

COMMENT ON COLUMN public.discrepancy_export_logs.file_hash_sha256 IS 
    'Hash SHA-256 del contenido del archivo CSV exportado para verificación de integridad';

COMMENT ON COLUMN public.discrepancy_export_logs.phase_ids IS 
    'Array de UUIDs de las fases incluidas en la exportación';

COMMENT ON COLUMN public.discrepancy_export_logs.filter_type IS 
    'Tipo de filtro aplicado: all, agreement, discrepancy, reconciled, disputed, pending_reconciliation, only_iter1';
