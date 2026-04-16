-- ============================================================================
-- 🔧 COGNÉTICA - Agregar Campos Faltantes
-- ============================================================================
-- Agrega campos created_by y description a la tabla cog_artifacts

-- 1. Agregar campo created_by (usuario que creó el artefacto)
ALTER TABLE cog_artifacts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Agregar campo description (descripción generada por LLM)
ALTER TABLE cog_artifacts 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Crear índice para created_by
CREATE INDEX IF NOT EXISTS idx_cog_artifacts_created_by ON cog_artifacts(created_by);

-- 4. Verificar que los campos se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cog_artifacts'
AND column_name IN ('created_by', 'description', 'file_size', 'mime_type', 'duration_seconds')
ORDER BY column_name;
