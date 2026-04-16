-- =====================================================
-- Migración: Agregar Ensayo Destilado a Transcripciones
-- Fecha: 2026-02-27
-- Propósito: Agregar campos para almacenar ensayos destilados
--            de transcripciones largas (~10k tokens vs 100k+ originales)
-- =====================================================

-- 1. Agregar campo para ensayo destilado
ALTER TABLE cog_transcriptions 
ADD COLUMN IF NOT EXISTS distilled_essay TEXT;

-- 2. Agregar metadata del ensayo destilado
ALTER TABLE cog_transcriptions 
ADD COLUMN IF NOT EXISTS distilled_essay_metadata JSONB;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN cog_transcriptions.distilled_essay IS 
'Ensayo destilado de la transcripción completa (~10k tokens). Sintetiza conceptos clave sin diluirlos. Generado por IA. Para podcasts y contenido largo que requiere síntesis académica.';

COMMENT ON COLUMN cog_transcriptions.distilled_essay_metadata IS 
'Metadata del ensayo destilado. Estructura esperada:
{
  "model": "deepseek-chat",
  "generated_at": "2026-02-27T12:00:00Z",
  "token_count": 10000,
  "prompt_version": "v1.0",
  "source_token_count": 100000,
  "compression_ratio": 0.1
}';

-- 4. Crear índice para búsquedas eficientes de ensayos existentes
CREATE INDEX IF NOT EXISTS idx_cog_transcriptions_has_essay 
ON cog_transcriptions (artifact_id) 
WHERE distilled_essay IS NOT NULL;

-- 5. Crear índice GIN para búsquedas en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_cog_transcriptions_essay_metadata 
ON cog_transcriptions USING GIN (distilled_essay_metadata);

-- =====================================================
-- Verificación
-- =====================================================

-- Verificar que las columnas se crearon correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cog_transcriptions' 
        AND column_name = 'distilled_essay'
    ) THEN
        RAISE NOTICE '✅ Campo distilled_essay creado correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Campo distilled_essay no se creó';
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cog_transcriptions' 
        AND column_name = 'distilled_essay_metadata'
    ) THEN
        RAISE NOTICE '✅ Campo distilled_essay_metadata creado correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Campo distilled_essay_metadata no se creó';
    END IF;
END $$;
