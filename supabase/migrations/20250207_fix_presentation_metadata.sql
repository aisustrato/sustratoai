-- Actualizar source_metadata de presentaciones existentes para agregar isPresentation: true
-- Esto es necesario para que extractCognitiveElements detecte correctamente las presentaciones

UPDATE cog_artifacts 
SET source_metadata = jsonb_set(
    COALESCE(source_metadata, '{}'::jsonb), 
    '{isPresentation}', 
    'true'::jsonb
)
WHERE source_metadata->>'processing_mode' = 'presentacion'
  AND (source_metadata->>'isPresentation' IS NULL OR source_metadata->>'isPresentation' != 'true');

-- Verificar el resultado
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM cog_artifacts
    WHERE source_metadata->>'isPresentation' = 'true';
    
    RAISE NOTICE 'Presentaciones actualizadas: %', updated_count;
END $$;
