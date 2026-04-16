-- ============================================================================
-- Migración: Tabla de Logs de Exportación de Discrepancias
-- Fecha: 2026-04-16
-- Propósito: Registrar exportaciones de análisis de discrepancias
-- ============================================================================

-- Crear tabla para logs de exportación
CREATE TABLE IF NOT EXISTS public.discrepancy_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    batch_id UUID NOT NULL REFERENCES public.article_batches(id) ON DELETE CASCADE,
    
    -- Datos de la exportación
    total_discrepancies INTEGER NOT NULL DEFAULT 0,
    export_format TEXT NOT NULL DEFAULT 'csv', -- 'csv', 'json', 'excel'
    file_size_bytes BIGINT,
    storage_path TEXT, -- Si se guarda el archivo
    
    -- Metadata
    export_metadata JSONB, -- Filtros aplicados, configuración, etc.
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_export_format CHECK (export_format IN ('csv', 'json', 'excel'))
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_project_id 
    ON public.discrepancy_export_logs(project_id);

CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_user_id 
    ON public.discrepancy_export_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_batch_id 
    ON public.discrepancy_export_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_discrepancy_export_logs_created_at 
    ON public.discrepancy_export_logs(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.discrepancy_export_logs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias exportaciones
CREATE POLICY "Users can view their own export logs"
    ON public.discrepancy_export_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias exportaciones
CREATE POLICY "Users can insert their own export logs"
    ON public.discrepancy_export_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Los miembros del proyecto pueden ver exportaciones del proyecto
CREATE POLICY "Project members can view project export logs"
    ON public.discrepancy_export_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.project_members pm
            WHERE pm.project_id = discrepancy_export_logs.project_id
              AND pm.user_id = auth.uid()
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE public.discrepancy_export_logs IS 
    'Registro de exportaciones de análisis de discrepancias en preclasificación';

COMMENT ON COLUMN public.discrepancy_export_logs.export_metadata IS 
    'Metadata de la exportación: filtros aplicados, configuración, dimensiones incluidas, etc.';

COMMENT ON COLUMN public.discrepancy_export_logs.storage_path IS 
    'Ruta de almacenamiento del archivo exportado (si aplica)';
