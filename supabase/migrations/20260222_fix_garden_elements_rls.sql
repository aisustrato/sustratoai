-- Fix RLS policies for cog_garden_elements
-- Ensure policies are correctly applied

-- Drop existing policies
DROP POLICY IF EXISTS "garden_elements_select" ON cog_garden_elements;
DROP POLICY IF EXISTS "garden_elements_insert" ON cog_garden_elements;
DROP POLICY IF EXISTS "garden_elements_update" ON cog_garden_elements;
DROP POLICY IF EXISTS "garden_elements_delete" ON cog_garden_elements;

-- Recreate policies with correct permissions
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

CREATE POLICY "garden_elements_update" ON cog_garden_elements
    FOR UPDATE USING (
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

-- Enable RLS
ALTER TABLE cog_garden_elements ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cog_garden_elements TO authenticated;
