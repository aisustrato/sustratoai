-- ============================================================
-- Normalización de Semillas Fractales (Append-Only)
-- Fusiona variantes semánticas en una semilla canónica
-- preservando la historia completa de cada artefacto
-- ============================================================

-- 1. Campo merged_into en cog_fractal_seeds
--    Apunta al content canónico (no al id, para robustez)
ALTER TABLE cog_fractal_seeds
    ADD COLUMN IF NOT EXISTS canonical_content TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS merged_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Índice para buscar semillas por su canónica
CREATE INDEX IF NOT EXISTS idx_fractal_seeds_canonical
    ON cog_fractal_seeds(project_id, canonical_content)
    WHERE canonical_content IS NOT NULL;

-- 2. Log inmutable de normalizaciones
CREATE TABLE IF NOT EXISTS cog_seed_normalizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    -- Semillas originales fusionadas (array de contents)
    source_contents TEXT[] NOT NULL,
    -- Semilla canónica resultante
    canonical_content TEXT NOT NULL,
    -- Razón de la fusión (opcional pero recomendado)
    reason TEXT,
    -- Cuántos registros de cog_fractal_seeds fueron actualizados
    affected_rows INTEGER NOT NULL DEFAULT 0,
    -- Snapshot de los artifact_ids afectados para auditoría
    affected_artifact_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultar historial por proyecto
CREATE INDEX IF NOT EXISTS idx_seed_normalizations_project
    ON cog_seed_normalizations(project_id, created_at DESC);

-- RLS
ALTER TABLE cog_seed_normalizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seed_norm_select" ON cog_seed_normalizations
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "seed_norm_insert" ON cog_seed_normalizations
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
        AND performed_by = auth.uid()
    );

-- El log es inmutable: no UPDATE ni DELETE
