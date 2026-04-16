-- ============================================
-- FIX: Políticas RLS para Imágenes de Infografías
-- ============================================
-- PROBLEMA: Las políticas actuales usan owner_id de projects,
-- pero la aplicación usa project_members para autorización.
-- SOLUCIÓN: Actualizar políticas para seguir el patrón estándar.
-- ============================================

-- ============================================
-- 1️⃣ FIX: cog_image_prompts
-- ============================================

ALTER TABLE cog_image_prompts ENABLE ROW LEVEL SECURITY;

-- Política: Acceso a prompts vía membresía del proyecto
DROP POLICY IF EXISTS "Users can access image prompts of their projects" ON cog_image_prompts;
CREATE POLICY "Users can access image prompts of their projects"
    ON cog_image_prompts FOR ALL
    USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- 2️⃣ FIX: cog_generated_images
-- ============================================

ALTER TABLE cog_generated_images ENABLE ROW LEVEL SECURITY;

-- Política: Acceso a imágenes vía membresía del proyecto
-- Cadena: cog_generated_images.prompt_id → cog_image_prompts.artifact_id → cog_artifacts.project_id → project_members
DROP POLICY IF EXISTS "Users can access images of their projects" ON cog_generated_images;
CREATE POLICY "Users can access images of their projects"
    ON cog_generated_images FOR ALL
    USING (
        prompt_id IN (
            SELECT id FROM cog_image_prompts WHERE artifact_id IN (
                SELECT id FROM cog_artifacts WHERE project_id IN (
                    SELECT project_id FROM project_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- ============================================
-- 3️⃣ OPCIONAL: Actualizar otras tablas cogneticas
-- ============================================
-- Si quieres aplicar el mismo patrón a otras tablas:

-- cog_artifacts
DROP POLICY IF EXISTS "Users can access their artifacts" ON cog_artifacts;
CREATE POLICY "Users can access their artifacts"
    ON cog_artifacts FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert artifacts" ON cog_artifacts;
CREATE POLICY "Users can insert artifacts"
    ON cog_artifacts FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their artifacts" ON cog_artifacts;
CREATE POLICY "Users can update their artifacts"
    ON cog_artifacts FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their artifacts" ON cog_artifacts;
CREATE POLICY "Users can delete their artifacts"
    ON cog_artifacts FOR DELETE
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- cog_transcriptions
DROP POLICY IF EXISTS "Users can access transcriptions of their artifacts" ON cog_transcriptions;
CREATE POLICY "Users can access transcriptions of their artifacts"
    ON cog_transcriptions FOR ALL
    USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cog_fractal_seeds
DROP POLICY IF EXISTS "Users can access seeds of their artifacts" ON cog_fractal_seeds;
CREATE POLICY "Users can access seeds of their artifacts"
    ON cog_fractal_seeds FOR ALL
    USING (
        artifact_id IN (
            SELECT id FROM cog_artifacts WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- ✅ VERIFICACIÓN
-- ============================================
-- Para verificar que las políticas están correctas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('cog_image_prompts', 'cog_generated_images', 'cog_artifacts', 'cog_transcriptions', 'cog_fractal_seeds')
-- ORDER BY tablename, policyname;
