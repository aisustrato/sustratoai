-- Fix RLS policies for cog_garden_elements - Simplified approach
-- Use direct project_id verification like other Cognetica tables

-- First, we need to add project_id to cog_garden_elements if it doesn't exist
ALTER TABLE cog_garden_elements 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Update existing elements to have project_id from their garden
UPDATE cog_garden_elements 
SET project_id = g.project_id 
FROM cog_resonance_gardens g 
WHERE cog_garden_elements.garden_id = g.id 
AND cog_garden_elements.project_id IS NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "garden_elements_select" ON cog_garden_elements;
DROP POLICY IF EXISTS "garden_elements_insert" ON cog_garden_elements;
DROP POLICY IF EXISTS "garden_elements_update" ON cog_garden_elements;
DROP POLICY IF EXISTS "garden_elements_delete" ON cog_garden_elements;

-- Create simplified policies like other Cognetica tables
CREATE POLICY "garden_elements_select" ON cog_garden_elements
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "garden_elements_insert" ON cog_garden_elements
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "garden_elements_update" ON cog_garden_elements
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "garden_elements_delete" ON cog_garden_elements
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE cog_garden_elements ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cog_garden_elements TO authenticated;
