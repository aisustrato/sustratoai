-- ============================================================================
-- Migración: Expandir ENUM cog_artifact_type para tipos específicos
-- ============================================================================
-- Fecha: 2026-02-11
-- Objetivo: Eliminar el tipo genérico 'document' y usar tipos específicos:
--   - markdown (archivos .md)
--   - pdf_report (PDFs procesados como documento completo)
--   - pdf_slides (PDFs procesados página por página)
-- 
-- Esto simplifica la lógica eliminando la necesidad de:
--   - Heurísticas para detectar subtipo
--   - Helpers complejos
--   - Flags en source_metadata (isPresentation, processing_mode)
-- ============================================================================

-- IMPORTANTE: Los nuevos valores de ENUM deben commitearse antes de usarlos
-- Por eso esta migración se divide en dos transacciones

-- ============================================================================
-- TRANSACCIÓN 1: Agregar nuevos valores al ENUM
-- ============================================================================
BEGIN;

ALTER TYPE cog_artifact_type ADD VALUE IF NOT EXISTS 'markdown';
ALTER TYPE cog_artifact_type ADD VALUE IF NOT EXISTS 'pdf_report';
ALTER TYPE cog_artifact_type ADD VALUE IF NOT EXISTS 'pdf_slides';

COMMIT;

-- ============================================================================
-- TRANSACCIÓN 2: Migrar datos existentes
-- ============================================================================
BEGIN;

-- Migrar datos existentes de 'document' a tipos específicos
-- Lógica:
--   - Si mime_type = 'text/markdown' → 'markdown'
--   - Si source_metadata.isPresentation = true → 'pdf_slides'
--   - Si tiene páginas en cog_artifact_pages → 'pdf_slides'
--   - Resto de PDFs → 'pdf_report'

UPDATE cog_artifacts 
SET type = 'markdown'::cog_artifact_type
WHERE type = 'document' 
  AND mime_type = 'text/markdown';

UPDATE cog_artifacts 
SET type = 'pdf_slides'::cog_artifact_type
WHERE type = 'document' 
  AND (
    (source_metadata->>'isPresentation')::boolean = true
    OR (source_metadata->>'processing_mode') = 'presentacion'
    OR id IN (
      SELECT DISTINCT artifact_id 
      FROM cog_artifact_pages 
      WHERE artifact_id IS NOT NULL
    )
  );

UPDATE cog_artifacts 
SET type = 'pdf_report'::cog_artifact_type
WHERE type = 'document' 
  AND mime_type = 'application/pdf';

-- 3. Verificar que no queden artefactos con type='document'
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM cog_artifacts
    WHERE type = 'document';
    
    IF remaining_count > 0 THEN
        RAISE WARNING 'Quedan % artefactos con type=document. Revisar manualmente.', remaining_count;
    ELSE
        RAISE NOTICE '✅ Todos los artefactos migrados correctamente';
    END IF;
END $$;

-- 4. Crear índice para mejorar queries por tipo
CREATE INDEX IF NOT EXISTS idx_cog_artifacts_type_specific 
ON cog_artifacts(type) 
WHERE type IN ('markdown', 'pdf_report', 'pdf_slides');

COMMIT;

-- ============================================================================
-- Notas Post-Migración:
-- ============================================================================
-- 1. Actualizar código TypeScript: ✅ COMPLETADO
--    - database.types.ts: cog_artifact_type union type ✅
--    - cognetica-actions.ts: createArtifactRecord signature ✅
--    - cognetica-actions.ts: router de procesamiento ✅
--    - app/cognetica/page.tsx: filtros UI actualizados ✅
--    - app/cognetica/nuevo/page.tsx: detección de tipo antes de subir ✅
--
-- 2. Eliminar campos obsoletos de source_metadata (opcional):
--    - isPresentation
--    - processing_mode
--    - has_pages (puede ser útil para UI)
--
-- 3. El tipo 'document' quedará deprecado pero no se elimina del ENUM
--    para evitar romper datos históricos si existen.
--
-- 4. Para ejecutar esta migración:
--    - Ir a Supabase Dashboard → SQL Editor
--    - Copiar y pegar este script completo
--    - Ejecutar
--    - Verificar mensaje de éxito
-- ============================================================================
