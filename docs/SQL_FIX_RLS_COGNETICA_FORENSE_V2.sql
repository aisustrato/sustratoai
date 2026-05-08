-- =============================================================================
-- FIX RLS: Cognética Forense v2 — tablas cgt_*
-- =============================================================================
-- PROBLEMA: Al implementar Oleada 1 (ingesta markdown), el INSERT en
-- cgt_artefactos falla con:
--     code: '42501'
--     message: 'new row violates row-level security policy for table "cgt_artefactos"'
--
-- CAUSA: Las tablas cgt_* fueron creadas con RLS habilitado pero sin
-- políticas permisivas. Postgres rechaza por default.
--
-- SOLUCIÓN: Aplicar el mismo patrón estándar del proyecto (ver
-- docs/SQL_FIX_RLS_COGNETICA_IMAGES.sql): autorizar por membresía en
-- project_members, con cadena de autorización para tablas hijas que
-- referencian al artefacto vía artefacto_id.
--
-- Ejecutar este script en Supabase SQL Editor con rol de servicio.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLA MADRE: cgt_artefactos (project_id directo)
-- -----------------------------------------------------------------------------
ALTER TABLE cgt_artefactos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cgt_artefactos_select" ON cgt_artefactos;
CREATE POLICY "cgt_artefactos_select"
    ON cgt_artefactos FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cgt_artefactos_insert" ON cgt_artefactos;
CREATE POLICY "cgt_artefactos_insert"
    ON cgt_artefactos FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cgt_artefactos_update" ON cgt_artefactos;
CREATE POLICY "cgt_artefactos_update"
    ON cgt_artefactos FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cgt_artefactos_delete" ON cgt_artefactos;
CREATE POLICY "cgt_artefactos_delete"
    ON cgt_artefactos FOR DELETE
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- GRUPOS: cgt_grupos_artefactos (project_id directo)
-- -----------------------------------------------------------------------------
ALTER TABLE cgt_grupos_artefactos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cgt_grupos_artefactos_all" ON cgt_grupos_artefactos;
CREATE POLICY "cgt_grupos_artefactos_all"
    ON cgt_grupos_artefactos FOR ALL
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- TABLAS HIJAS POR TIPO (cadena via artefacto_id → cgt_artefactos.project_id)
-- -----------------------------------------------------------------------------

-- Helper function: macro para aplicar política vía artefacto_id.
-- Nota: se genera INLINE aquí, una tabla a la vez, para claridad y para que
-- los DROP POLICY previos funcionen si ya existen variantes con otro nombre.

-- cgt_artefactos_markdown
ALTER TABLE cgt_artefactos_markdown ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_markdown_all" ON cgt_artefactos_markdown;
CREATE POLICY "cgt_artefactos_markdown_all"
    ON cgt_artefactos_markdown FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_artefactos_audio
ALTER TABLE cgt_artefactos_audio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_audio_all" ON cgt_artefactos_audio;
CREATE POLICY "cgt_artefactos_audio_all"
    ON cgt_artefactos_audio FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_artefactos_video
ALTER TABLE cgt_artefactos_video ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_video_all" ON cgt_artefactos_video;
CREATE POLICY "cgt_artefactos_video_all"
    ON cgt_artefactos_video FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_artefactos_imagen
ALTER TABLE cgt_artefactos_imagen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_imagen_all" ON cgt_artefactos_imagen;
CREATE POLICY "cgt_artefactos_imagen_all"
    ON cgt_artefactos_imagen FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_artefactos_pdf_informe
ALTER TABLE cgt_artefactos_pdf_informe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_pdf_informe_all" ON cgt_artefactos_pdf_informe;
CREATE POLICY "cgt_artefactos_pdf_informe_all"
    ON cgt_artefactos_pdf_informe FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_artefactos_pdf_slides
ALTER TABLE cgt_artefactos_pdf_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_pdf_slides_all" ON cgt_artefactos_pdf_slides;
CREATE POLICY "cgt_artefactos_pdf_slides_all"
    ON cgt_artefactos_pdf_slides FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- -----------------------------------------------------------------------------
-- SEGMENTOS Y CONTENIDO DERIVADO (cadena via artefacto_id)
-- -----------------------------------------------------------------------------

-- cgt_audio_segmentos
ALTER TABLE cgt_audio_segmentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_audio_segmentos_all" ON cgt_audio_segmentos;
CREATE POLICY "cgt_audio_segmentos_all"
    ON cgt_audio_segmentos FOR ALL
    USING (
        artefacto_id IN (
            SELECT artefacto_id FROM cgt_artefactos_audio WHERE artefacto_id IN (
                SELECT id FROM cgt_artefactos WHERE project_id IN (
                    SELECT project_id FROM project_members WHERE user_id = auth.uid()
                )
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT artefacto_id FROM cgt_artefactos_audio WHERE artefacto_id IN (
                SELECT id FROM cgt_artefactos WHERE project_id IN (
                    SELECT project_id FROM project_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- cgt_video_segmentos
ALTER TABLE cgt_video_segmentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_video_segmentos_all" ON cgt_video_segmentos;
CREATE POLICY "cgt_video_segmentos_all"
    ON cgt_video_segmentos FOR ALL
    USING (
        artefacto_id IN (
            SELECT artefacto_id FROM cgt_artefactos_video WHERE artefacto_id IN (
                SELECT id FROM cgt_artefactos WHERE project_id IN (
                    SELECT project_id FROM project_members WHERE user_id = auth.uid()
                )
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT artefacto_id FROM cgt_artefactos_video WHERE artefacto_id IN (
                SELECT id FROM cgt_artefactos WHERE project_id IN (
                    SELECT project_id FROM project_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- cgt_imagenes_descritas
ALTER TABLE cgt_imagenes_descritas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_imagenes_descritas_all" ON cgt_imagenes_descritas;
CREATE POLICY "cgt_imagenes_descritas_all"
    ON cgt_imagenes_descritas FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- -----------------------------------------------------------------------------
-- METABOLIZACIONES (cadena via artefacto_id)
-- -----------------------------------------------------------------------------

-- cgt_cronicas
ALTER TABLE cgt_cronicas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_cronicas_all" ON cgt_cronicas;
CREATE POLICY "cgt_cronicas_all"
    ON cgt_cronicas FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_destilados
ALTER TABLE cgt_destilados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_destilados_all" ON cgt_destilados;
CREATE POLICY "cgt_destilados_all"
    ON cgt_destilados FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- cgt_germinales
ALTER TABLE cgt_germinales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_germinales_all" ON cgt_germinales;
CREATE POLICY "cgt_germinales_all"
    ON cgt_germinales FOR ALL
    USING (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        artefacto_id IN (
            SELECT id FROM cgt_artefactos WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- =============================================================================
-- VERIFICACIÓN: ejecutar después para listar las políticas aplicadas
-- =============================================================================
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename LIKE 'cgt_%'
-- ORDER BY tablename, cmd;
