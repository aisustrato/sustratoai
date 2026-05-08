-- =============================================================================
-- ADDENDUM SQL — Cognética Forense v2 Oleada 1
-- =============================================================================
-- Aplica los cambios derivados del addendum v1.1 al requerimiento Windsurf
-- (docs/cognetica/addendum_requerimiento_windsurf_v11.md) + pipeline de
-- metabolización v1 (docs/cognetica/pipeline_metabolizacion_v1.md).
--
-- Cambios que este script implementa:
--
--   (1) NUEVA TABLA cgt_nucleos — cuarto formato (tarjeta de presentación
--       irreductible derivada del Destilado; spec v0.3 §4.3).
--
--   (2) NUEVA TABLA cgt_logs_deepseek — bitácora estructurada de cada llamada
--       al LLM (insumo para análisis Quipu posterior; pipeline §11).
--
--   (3) ALTER cgt_germinales — agrega hash_cronica_upstream y
--       hash_destilado_upstream para cascada de invalidación basada en hash
--       (addendum §8). Se usa hash en vez de flag booleano para preservar
--       contra qué versión del upstream está actualizado.
--
--   (4) RLS en las nuevas tablas, siguiendo el mismo patrón aplicado en
--       docs/SQL_FIX_RLS_COGNETICA_FORENSE_V2.sql (membresía en
--       project_members, cadena vía artefacto_id para tablas hijas).
--
-- Idempotente: usa IF NOT EXISTS / DROP POLICY IF EXISTS. Se puede correr
-- múltiples veces sin efectos colaterales.
--
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================


-- =============================================================================
-- (1) TABLA: cgt_nucleos
-- =============================================================================
-- Formato de metabolización derivado del Destilado. Tarjeta de presentación
-- irreductible (~400-500 tokens, hard cap 600). Introducido en spec v0.3.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_nucleos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id        UUID NOT NULL UNIQUE REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Contenido estructurado: derivado del Destilado correspondiente.
    -- Se guarda desnormalizado en columnas + JSONB para query flexible.
    tesis               TEXT NOT NULL,
    movimientos_esenciales JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de 3 movimientos
    tension_irreductible TEXT,
    cita_nucleo         JSONB,  -- {texto, ubicacion, autor?}

    -- Cap de tokens: hard constraint a nivel DB para que no entren núcleos
    -- inflados aunque el LLM se pase.
    tokens_count        INTEGER,

    -- Hash del destilado del que se derivó. Para cascada de invalidación:
    -- si el destilado se regenera, su nuevo hash != hash_destilado_upstream
    -- del núcleo → UI marca "desactualizado".
    hash_destilado_upstream CHAR(64) NOT NULL,

    -- Trazabilidad estándar (mismo patrón que cgt_cronicas, cgt_destilados).
    generado_por        cgt_origen NOT NULL DEFAULT 'llm',
    nodo_generador      TEXT,
    modelo_ia           TEXT,
    version_esquema     TEXT NOT NULL DEFAULT 'v0.3',

    costo_usd           NUMERIC(10,6),
    tokens_input        INTEGER,
    tokens_output       INTEGER,

    visibilidad         cgt_visibilidad NOT NULL DEFAULT 'privado',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_nucleo_tokens_cap
        CHECK (tokens_count IS NULL OR tokens_count <= 600)
);

CREATE INDEX IF NOT EXISTS idx_cgt_nucleos_project    ON cgt_nucleos(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_nucleos_artefacto  ON cgt_nucleos(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_nucleos_tesis
    ON cgt_nucleos USING GIN (to_tsvector('spanish', tesis));

-- Trigger de updated_at reutiliza la función ya existente en Oleada 1.
-- Si no existe cgt_set_updated_at() en tu DB, descomentar el CREATE FUNCTION
-- de más abajo antes de ejecutar este bloque.
DROP TRIGGER IF EXISTS trg_cgt_nucleos_updated ON cgt_nucleos;
CREATE TRIGGER trg_cgt_nucleos_updated
    BEFORE UPDATE ON cgt_nucleos
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_nucleos IS
    'Formato de metabolización derivado del Destilado. Tarjeta de presentación irreductible (~400-500 tokens, hard cap 600). Introducido en spec v0.3.';


-- =============================================================================
-- (2) TABLA: cgt_logs_deepseek
-- =============================================================================
-- Bitácora estructurada de cada llamada al LLM. Insumo para análisis Quipu
-- retrospectivo (pipeline §11). Append-only desde el código.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_logs_deepseek (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id        UUID REFERENCES cgt_artefactos(id) ON DELETE SET NULL,
    project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- 'cronica' | 'destilado' | 'nucleo' | 'germinal' | 'sintesis_chunk' | otro
    formato             TEXT NOT NULL,

    modelo              TEXT NOT NULL,
    temperatura         NUMERIC(3,2) NOT NULL,

    tokens_input        INTEGER NOT NULL DEFAULT 0,
    tokens_output       INTEGER NOT NULL DEFAULT 0,
    tokens_cached       INTEGER NOT NULL DEFAULT 0,

    costo_usd           NUMERIC(10,6) NOT NULL DEFAULT 0,
    duracion_ms         INTEGER NOT NULL DEFAULT 0,

    -- "stop" | "length" | "content_filter" | "error"
    finish_reason       TEXT,

    -- 1 si primera, 2 si retry, etc.
    intento             INTEGER NOT NULL DEFAULT 1,

    error_mensaje       TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cgt_logs_deepseek_artefacto
    ON cgt_logs_deepseek(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_logs_deepseek_project
    ON cgt_logs_deepseek(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_logs_deepseek_formato
    ON cgt_logs_deepseek(formato);
CREATE INDEX IF NOT EXISTS idx_cgt_logs_deepseek_created
    ON cgt_logs_deepseek(created_at DESC);

COMMENT ON TABLE cgt_logs_deepseek IS
    'Bitácora append-only de llamadas al LLM. Insumo para análisis económico Quipu.';


-- =============================================================================
-- (3) ALTER cgt_germinales — cascada de invalidación
-- =============================================================================
-- Agrega los hashes upstream que permiten detectar cuándo un germinal quedó
-- desactualizado respecto a su Crónica o Destilado origen (addendum §8).
-- =============================================================================

ALTER TABLE cgt_germinales
    ADD COLUMN IF NOT EXISTS hash_cronica_upstream    CHAR(64),
    ADD COLUMN IF NOT EXISTS hash_destilado_upstream  CHAR(64);

COMMENT ON COLUMN cgt_germinales.hash_cronica_upstream IS
    'SHA-256 del contenido de la Crónica al momento de generar este Germinal. Si la Crónica se regenera y su nuevo hash difiere, el Germinal queda desactualizado.';
COMMENT ON COLUMN cgt_germinales.hash_destilado_upstream IS
    'SHA-256 del JSON canónico del Destilado al momento de generar este Germinal. Cascada de invalidación análoga a hash_cronica_upstream.';


-- =============================================================================
-- (4) RLS — nuevas tablas
-- =============================================================================
-- Mismo patrón que docs/SQL_FIX_RLS_COGNETICA_FORENSE_V2.sql:
-- autorización por membresía en project_members; cadena via artefacto_id
-- para tablas hijas.
-- =============================================================================

-- cgt_nucleos (project_id directo — podemos ir por project_id sin pasar por
-- artefacto, más eficiente. El UNIQUE(artefacto_id) ya garantiza que no hay
-- núcleos huérfanos de artefacto).
ALTER TABLE cgt_nucleos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cgt_nucleos_all" ON cgt_nucleos;
CREATE POLICY "cgt_nucleos_all"
    ON cgt_nucleos FOR ALL
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

-- cgt_logs_deepseek (cadena via project_id). Los inserts típicamente vendrán
-- desde Server Actions corriendo en contexto de usuario autenticado que es
-- miembro del proyecto del artefacto. Si alguna llamada logea sin
-- project_id (ej. pruebas aisladas), queda accesible para todos los miembros
-- del proyecto nulo = ninguno; se reserva limpieza manual con rol de servicio.
ALTER TABLE cgt_logs_deepseek ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cgt_logs_deepseek_all" ON cgt_logs_deepseek;
CREATE POLICY "cgt_logs_deepseek_all"
    ON cgt_logs_deepseek FOR ALL
    USING (
        project_id IS NULL OR project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IS NULL OR project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );


-- =============================================================================
-- VERIFICACIÓN (opcional, descomentar para ejecutar)
-- =============================================================================
-- SELECT
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('cgt_nucleos', 'cgt_logs_deepseek', 'cgt_germinales')
--   AND column_name IN (
--       'id', 'artefacto_id', 'project_id',
--       'hash_cronica_upstream', 'hash_destilado_upstream',
--       'hash_destilado_upstream', 'tokens_count'
--   )
-- ORDER BY table_name, column_name;
--
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('cgt_nucleos', 'cgt_logs_deepseek')
-- ORDER BY tablename, cmd;
