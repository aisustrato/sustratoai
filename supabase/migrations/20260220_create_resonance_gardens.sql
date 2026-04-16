-- ============================================================
-- Jardines de Resonancia Cognitiva
-- Grupos semánticos definidos manualmente por el usuario
-- que agrupan elementos cognitivos bajo un concepto paraguas
-- ============================================================

-- Tabla principal de jardines
CREATE TABLE IF NOT EXISTS cog_resonance_gardens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '🌱',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Elementos del jardín (polimórfico: seed, discipline, theory, thinker)
CREATE TABLE IF NOT EXISTS cog_garden_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID NOT NULL REFERENCES cog_resonance_gardens(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL CHECK (element_type IN ('seed', 'discipline', 'theory', 'thinker')),
    element_id UUID,          -- ID de cog_disciplines / cog_theories / cog_references (nullable para seeds)
    element_content TEXT,     -- Texto de la semilla fractal (para type='seed')
    element_label TEXT NOT NULL, -- Nombre legible para mostrar en UI
    added_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_resonance_gardens_project ON cog_resonance_gardens(project_id);
CREATE INDEX IF NOT EXISTS idx_resonance_gardens_created_by ON cog_resonance_gardens(created_by);
CREATE INDEX IF NOT EXISTS idx_garden_elements_garden ON cog_garden_elements(garden_id);
CREATE INDEX IF NOT EXISTS idx_garden_elements_type ON cog_garden_elements(element_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_resonance_garden_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resonance_garden_updated_at
    BEFORE UPDATE ON cog_resonance_gardens
    FOR EACH ROW EXECUTE FUNCTION update_resonance_garden_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- Patrón: projects WHERE owner_id = auth.uid()
-- ============================================================

ALTER TABLE cog_resonance_gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cog_garden_elements ENABLE ROW LEVEL SECURITY;

-- Jardines: el usuario puede ver/crear/editar/borrar jardines de sus proyectos
CREATE POLICY "gardens_select" ON cog_resonance_gardens
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "gardens_insert" ON cog_resonance_gardens
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "gardens_update" ON cog_resonance_gardens
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "gardens_delete" ON cog_resonance_gardens
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Elementos del jardín: acceso via jardín del proyecto
CREATE POLICY "garden_elements_select" ON cog_garden_elements
    FOR SELECT USING (
        garden_id IN (
            SELECT g.id FROM cog_resonance_gardens g
            WHERE g.project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "garden_elements_insert" ON cog_garden_elements
    FOR INSERT WITH CHECK (
        garden_id IN (
            SELECT g.id FROM cog_resonance_gardens g
            WHERE g.project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "garden_elements_delete" ON cog_garden_elements
    FOR DELETE USING (
        garden_id IN (
            SELECT g.id FROM cog_resonance_gardens g
            WHERE g.project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );
