-- ========================================================================
-- MIGRACIÓN: Tabla para persistir exports con hash SHA-256
-- Fecha: 27 Enero 2025
-- Objetivo: Sistema de verificación de integridad para exports redundantes
-- ========================================================================

-- 1. Crear tabla para persistir JSON canónico + hash
CREATE TABLE IF NOT EXISTS cog_artifact_exports (
    artifact_id UUID PRIMARY KEY REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    canonical_json JSONB NOT NULL,
    exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índice para búsqueda rápida por hash
CREATE INDEX IF NOT EXISTS idx_cog_artifact_exports_hash 
    ON cog_artifact_exports(content_hash);

-- 3. Índice para búsqueda por fecha de exportación
CREATE INDEX IF NOT EXISTS idx_cog_artifact_exports_exported_at 
    ON cog_artifact_exports(exported_at DESC);

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cog_artifact_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cog_artifact_exports_updated_at
    BEFORE UPDATE ON cog_artifact_exports
    FOR EACH ROW
    EXECUTE FUNCTION update_cog_artifact_exports_updated_at();

-- 5. Habilitar RLS
ALTER TABLE cog_artifact_exports ENABLE ROW LEVEL SECURITY;

-- 6. Política RLS: Misma lógica que cog_artifacts
-- Los miembros del proyecto pueden ver los exports de artefactos del proyecto
CREATE POLICY "Miembros del proyecto ven exports"
    ON cog_artifact_exports 
    FOR ALL 
    USING (
        EXISTS ( 
            SELECT 1 
            FROM cog_artifacts ca
            JOIN project_members pm ON pm.project_id = ca.project_id
            WHERE ca.id = cog_artifact_exports.artifact_id
              AND pm.user_id = auth.uid()
        )
    );

-- 7. Comentarios para documentación
COMMENT ON TABLE cog_artifact_exports IS 'Almacena JSON canónico y hash SHA-256 de exports de artefactos Cognética para verificación de integridad';
COMMENT ON COLUMN cog_artifact_exports.artifact_id IS 'ID del artefacto exportado';
COMMENT ON COLUMN cog_artifact_exports.content_hash IS 'Hash SHA-256 del JSON canónico (formato: sha256:abc123...)';
COMMENT ON COLUMN cog_artifact_exports.canonical_json IS 'JSON canónico normalizado del artefacto (fuente de verdad para hash)';
COMMENT ON COLUMN cog_artifact_exports.exported_at IS 'Timestamp de la última exportación';
