-- ============================================
-- AGREGAR política faltante para miembros del proyecto
-- ============================================

-- cog_artifacts tiene esta política que cog_chat_sessions NO tiene:
-- "Miembros del proyecto ven artefactos" con condición que permite project_members

CREATE POLICY "Miembros del proyecto ven chat sessions"
    ON cog_chat_sessions FOR ALL 
    USING (
        EXISTS ( 
            SELECT 1
            FROM project_members pm
            WHERE pm.project_id = cog_chat_sessions.project_id 
              AND pm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS ( 
            SELECT 1
            FROM project_members pm
            WHERE pm.project_id = cog_chat_sessions.project_id 
              AND pm.user_id = auth.uid()
        )
    );
