-- =============================================================================
-- SQL — Cognética Forense v2 Oleada 2 (v1.1)
-- =============================================================================
-- Migración de insumos del Destilado (JSONB) a tablas relacionales con
-- trazabilidad de tres capas: extractor LLM → cartografiador LLM → humano.
--
-- Cambios v1.0 → v1.1 (23 abril 2026):
--   - Sin columnas denormalizadas de conteo. La cuenta de menciones por
--     entidad canónica es LECTURA CALCULADA vía funciones helper (sección 9).
--   - Razón: simplicidad de mantenimiento sobre micro-optimización.
--     Postgres con índice sobre <tipo>_id resuelve el COUNT en
--     milisegundos para corpus de tamaño esperado. Si en el futuro el
--     costo se nota, se agrega trigger sin cambiar contrato público.
--   - Las 4 vistas de valor canónico faltantes en v1.0 quedan incluidas
--     completas (disciplinas, conceptos, teorías, citas).
--   - NO se elimina/migra nada de Oleada 1: en Oleada 1 el código no
--     pobló entidades; solo existen los insumos como JSONB en cgt_destilados.
--     El Cartografiador lee ese JSONB como fuente de verdad del extractor.
--
-- Contexto y decisiones de diseño vigentes:
--
--   (1) Insumos como ENTIDADES CANÓNICAS del proyecto + MENCIONES por
--       artefacto + EDICIONES HUMANAS append-only. Trío de tablas por tipo
--       de entidad (pensadores, disciplinas, conceptos, teorías, citas).
--
--   (2) Cada mención preserva TRES CAPAS DE AUTORÍA:
--         - Capa 1 (extractor): nombre_extractor_crudo, descripcion_extractor_cruda
--         - Capa 2 (cartografiador): nombre_cartografiador, descripcion_cartografiador,
--                                    decision_cartografiador, confianza_cartografiador
--         - Capa 3 (humano): via cgt_*_ediciones_humanas (append-only)
--       Ninguna capa se sobreescribe. Valor canónico actual = coalesce(humano → cartografiador → extractor).
--
--   (3) Objetos {nombre, descripcion} en vez de strings planos. Ej: pensador
--       no es solo "Spinoza" sino {nombre: "Baruch Spinoza", descripcion:
--       "filósofo racionalista neerlandés del s. XVII"}. Esto resuelve la
--       ambigüedad de normalización (A. Turing vs Alan Turing) con contexto
--       semántico adicional.
--
--   (4) TEORÍAS como quinto array, nuevo en Oleada 2. Distinción
--       conceptual: una teoría es un sistema explicativo articulado
--       (ej. "teoría de la información de Shannon", "relatividad general"),
--       mientras un concepto es una unidad semántica ("entropía",
--       "antifragilidad"). El extractor recibe esta distinción en el prompt.
--
--   (5) El Cartografiador corre ON-DEMAND (segundo pipeline desfasado).
--       Se activa manual cuando Crónica+Destilado+Núcleo+Germinal están en
--       verde. Nunca bloquea ingesta ni metabolización primaria.
--
--   (6) RLS por membresía en project_members. Patrón consistente con
--       Oleada 1 y addendum.
--
-- Idempotente: usa IF NOT EXISTS / DROP POLICY IF EXISTS.
-- Las tablas JSONB de Destilado NO se eliminan en este script — se
-- mantienen como respaldo histórico y como fuente del migrador inicial.
-- Limpieza de columnas JSONB obsoletas queda diferida a Oleada 3 cuando
-- haya confianza operativa con el modelo relacional.
--
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================


-- =============================================================================
-- (0) TIPO ENUM para decisiones del cartografiador
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cgt_decision_cartografiador') THEN
        CREATE TYPE cgt_decision_cartografiador AS ENUM (
            'match_existente',   -- coincide con entidad ya existente en el proyecto
            'nueva_entidad',     -- no existe, se crea nueva entidad canónica
            'ambigua',           -- no puede decidir, requiere curaduría humana
            'sin_cartografiar'   -- default al crear la mención, antes de ejecutar el cartografiador
        );
    END IF;
END$$;


-- =============================================================================
-- (1) TRÍO DE TABLAS — PENSADORES
-- =============================================================================

-- Entidad canónica del proyecto
CREATE TABLE IF NOT EXISTS cgt_pensadores (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    nombre_canonico       TEXT NOT NULL,
    descripcion_canonica  TEXT,
    aliases               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de strings: variantes aceptadas
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, nombre_canonico)
);

CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_project ON cgt_pensadores(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_nombre  ON cgt_pensadores USING GIN (to_tsvector('spanish', nombre_canonico));

DROP TRIGGER IF EXISTS trg_cgt_pensadores_updated ON cgt_pensadores;
CREATE TRIGGER trg_cgt_pensadores_updated
    BEFORE UPDATE ON cgt_pensadores
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_pensadores IS
    'Entidad canónica de pensador en el proyecto. Una fila por pensador único. Aliases guarda variantes tipográficas aceptadas.';

-- Menciones — una fila por aparición en artefacto
CREATE TABLE IF NOT EXISTS cgt_pensadores_menciones (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id                 UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id                   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pensador_id                  UUID REFERENCES cgt_pensadores(id) ON DELETE SET NULL,

    -- Capa 1: Extractor LLM (inmutable por diseño)
    nombre_extractor_crudo       TEXT NOT NULL,
    descripcion_extractor_cruda  TEXT,

    -- Capa 2: Cartografiador LLM (se llena al correr el 2do pipeline)
    nombre_cartografiador        TEXT,
    descripcion_cartografiador   TEXT,
    decision_cartografiador      cgt_decision_cartografiador NOT NULL DEFAULT 'sin_cartografiar',
    confianza_cartografiador     NUMERIC(3,2),  -- 0.00 a 1.00
    justificacion_cartografiador TEXT,          -- por qué decidió match / nueva / ambigua

    -- Hash del snapshot de la Capa 1. Si el Destilado se regenera y los
    -- valores crudos cambian, este hash cambia y la Capa 2 queda marcada
    -- como desactualizada (cascada de invalidación).
    hash_extractor_crudo         CHAR(64) NOT NULL,

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    cartografiado_at             TIMESTAMPTZ,

    CONSTRAINT chk_pensadores_confianza
        CHECK (confianza_cartografiador IS NULL OR (confianza_cartografiador >= 0 AND confianza_cartografiador <= 1))
);

CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_menciones_artefacto ON cgt_pensadores_menciones(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_menciones_pensador  ON cgt_pensadores_menciones(pensador_id);
CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_menciones_project   ON cgt_pensadores_menciones(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_menciones_decision  ON cgt_pensadores_menciones(decision_cartografiador);

COMMENT ON TABLE cgt_pensadores_menciones IS
    'Una fila por mención de pensador en un artefacto. Preserva Capa 1 (extractor) y Capa 2 (cartografiador) sin sobreescritura.';

-- Ediciones humanas append-only
CREATE TABLE IF NOT EXISTS cgt_pensadores_ediciones_humanas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mencion_id      UUID NOT NULL REFERENCES cgt_pensadores_menciones(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    campo_editado   TEXT NOT NULL,  -- 'nombre' | 'descripcion' | 'reasignar_entidad_canonica'
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    justificacion   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_pensadores_edicion_campo
        CHECK (campo_editado IN ('nombre', 'descripcion', 'reasignar_entidad_canonica'))
);

CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_ediciones_mencion ON cgt_pensadores_ediciones_humanas(mencion_id);
CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_ediciones_user    ON cgt_pensadores_ediciones_humanas(user_id);
CREATE INDEX IF NOT EXISTS idx_cgt_pensadores_ediciones_created ON cgt_pensadores_ediciones_humanas(created_at DESC);

COMMENT ON TABLE cgt_pensadores_ediciones_humanas IS
    'Append-only. Cada edición humana sobre una mención es una fila nueva. Nunca se sobreescribe ni se borra.';


-- =============================================================================
-- (2) TRÍO DE TABLAS — DISCIPLINAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_disciplinas (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    nombre_canonico       TEXT NOT NULL,
    descripcion_canonica  TEXT,
    aliases               JSONB NOT NULL DEFAULT '[]'::jsonb,
    disciplina_madre_id   UUID REFERENCES cgt_disciplinas(id) ON DELETE SET NULL,  -- jerarquía opcional madre/sub
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, nombre_canonico)
);

CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_project ON cgt_disciplinas(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_madre   ON cgt_disciplinas(disciplina_madre_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_nombre  ON cgt_disciplinas USING GIN (to_tsvector('spanish', nombre_canonico));

DROP TRIGGER IF EXISTS trg_cgt_disciplinas_updated ON cgt_disciplinas;
CREATE TRIGGER trg_cgt_disciplinas_updated
    BEFORE UPDATE ON cgt_disciplinas
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_disciplinas IS
    'Entidad canónica de disciplina. Admite jerarquía madre/sub vía disciplina_madre_id (resuelve punto 4 del cierre de Oleada 1).';

CREATE TABLE IF NOT EXISTS cgt_disciplinas_menciones (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id                 UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id                   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    disciplina_id                UUID REFERENCES cgt_disciplinas(id) ON DELETE SET NULL,

    nombre_extractor_crudo       TEXT NOT NULL,
    descripcion_extractor_cruda  TEXT,

    nombre_cartografiador        TEXT,
    descripcion_cartografiador   TEXT,
    decision_cartografiador      cgt_decision_cartografiador NOT NULL DEFAULT 'sin_cartografiar',
    confianza_cartografiador     NUMERIC(3,2),
    justificacion_cartografiador TEXT,

    hash_extractor_crudo         CHAR(64) NOT NULL,

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    cartografiado_at             TIMESTAMPTZ,

    CONSTRAINT chk_disciplinas_confianza
        CHECK (confianza_cartografiador IS NULL OR (confianza_cartografiador >= 0 AND confianza_cartografiador <= 1))
);

CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_menciones_artefacto  ON cgt_disciplinas_menciones(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_menciones_disciplina ON cgt_disciplinas_menciones(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_menciones_project    ON cgt_disciplinas_menciones(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_menciones_decision   ON cgt_disciplinas_menciones(decision_cartografiador);

CREATE TABLE IF NOT EXISTS cgt_disciplinas_ediciones_humanas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mencion_id      UUID NOT NULL REFERENCES cgt_disciplinas_menciones(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    campo_editado   TEXT NOT NULL,  -- 'nombre' | 'descripcion' | 'reasignar_entidad_canonica' | 'asignar_disciplina_madre'
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    justificacion   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_disciplinas_edicion_campo
        CHECK (campo_editado IN ('nombre', 'descripcion', 'reasignar_entidad_canonica', 'asignar_disciplina_madre'))
);

CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_ediciones_mencion ON cgt_disciplinas_ediciones_humanas(mencion_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_ediciones_user    ON cgt_disciplinas_ediciones_humanas(user_id);
CREATE INDEX IF NOT EXISTS idx_cgt_disciplinas_ediciones_created ON cgt_disciplinas_ediciones_humanas(created_at DESC);


-- =============================================================================
-- (3) TRÍO DE TABLAS — CONCEPTOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_conceptos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    nombre_canonico       TEXT NOT NULL,
    descripcion_canonica  TEXT,
    aliases               JSONB NOT NULL DEFAULT '[]'::jsonb,
    es_semilla_fractal    BOOLEAN NOT NULL DEFAULT false,  -- marca manual de humano si el concepto escaló a semilla
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, nombre_canonico)
);

CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_project ON cgt_conceptos(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_semilla ON cgt_conceptos(es_semilla_fractal) WHERE es_semilla_fractal = true;
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_nombre  ON cgt_conceptos USING GIN (to_tsvector('spanish', nombre_canonico));

DROP TRIGGER IF EXISTS trg_cgt_conceptos_updated ON cgt_conceptos;
CREATE TRIGGER trg_cgt_conceptos_updated
    BEFORE UPDATE ON cgt_conceptos
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_conceptos IS
    'Unidad semántica. Distinto de teoría (sistema explicativo articulado). Admite marca es_semilla_fractal para conceptos escalados.';

CREATE TABLE IF NOT EXISTS cgt_conceptos_menciones (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id                 UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id                   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    concepto_id                  UUID REFERENCES cgt_conceptos(id) ON DELETE SET NULL,

    nombre_extractor_crudo       TEXT NOT NULL,
    descripcion_extractor_cruda  TEXT,

    nombre_cartografiador        TEXT,
    descripcion_cartografiador   TEXT,
    decision_cartografiador      cgt_decision_cartografiador NOT NULL DEFAULT 'sin_cartografiar',
    confianza_cartografiador     NUMERIC(3,2),
    justificacion_cartografiador TEXT,

    hash_extractor_crudo         CHAR(64) NOT NULL,

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    cartografiado_at             TIMESTAMPTZ,

    CONSTRAINT chk_conceptos_confianza
        CHECK (confianza_cartografiador IS NULL OR (confianza_cartografiador >= 0 AND confianza_cartografiador <= 1))
);

CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_menciones_artefacto ON cgt_conceptos_menciones(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_menciones_concepto  ON cgt_conceptos_menciones(concepto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_menciones_project   ON cgt_conceptos_menciones(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_menciones_decision  ON cgt_conceptos_menciones(decision_cartografiador);

CREATE TABLE IF NOT EXISTS cgt_conceptos_ediciones_humanas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mencion_id      UUID NOT NULL REFERENCES cgt_conceptos_menciones(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    campo_editado   TEXT NOT NULL,
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    justificacion   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_conceptos_edicion_campo
        CHECK (campo_editado IN ('nombre', 'descripcion', 'reasignar_entidad_canonica', 'marcar_semilla_fractal'))
);

CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_ediciones_mencion ON cgt_conceptos_ediciones_humanas(mencion_id);
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_ediciones_user    ON cgt_conceptos_ediciones_humanas(user_id);
CREATE INDEX IF NOT EXISTS idx_cgt_conceptos_ediciones_created ON cgt_conceptos_ediciones_humanas(created_at DESC);


-- =============================================================================
-- (4) TRÍO DE TABLAS — TEORÍAS (nuevas en Oleada 2)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_teorias (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    nombre_canonico       TEXT NOT NULL,
    descripcion_canonica  TEXT,
    aliases               JSONB NOT NULL DEFAULT '[]'::jsonb,
    autores_principales   JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de nombres; FK blanda a pensadores vía nombres
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, nombre_canonico)
);

CREATE INDEX IF NOT EXISTS idx_cgt_teorias_project ON cgt_teorias(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_teorias_nombre  ON cgt_teorias USING GIN (to_tsvector('spanish', nombre_canonico));

DROP TRIGGER IF EXISTS trg_cgt_teorias_updated ON cgt_teorias;
CREATE TRIGGER trg_cgt_teorias_updated
    BEFORE UPDATE ON cgt_teorias
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_teorias IS
    'Sistema explicativo articulado con autor(es) identificables. Distinto de concepto (unidad semántica sin autoría necesaria). Ej: "teoría de la información de Shannon", "relatividad general".';

CREATE TABLE IF NOT EXISTS cgt_teorias_menciones (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id                 UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id                   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    teoria_id                    UUID REFERENCES cgt_teorias(id) ON DELETE SET NULL,

    nombre_extractor_crudo       TEXT NOT NULL,
    descripcion_extractor_cruda  TEXT,

    nombre_cartografiador        TEXT,
    descripcion_cartografiador   TEXT,
    decision_cartografiador      cgt_decision_cartografiador NOT NULL DEFAULT 'sin_cartografiar',
    confianza_cartografiador     NUMERIC(3,2),
    justificacion_cartografiador TEXT,

    hash_extractor_crudo         CHAR(64) NOT NULL,

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    cartografiado_at             TIMESTAMPTZ,

    CONSTRAINT chk_teorias_confianza
        CHECK (confianza_cartografiador IS NULL OR (confianza_cartografiador >= 0 AND confianza_cartografiador <= 1))
);

CREATE INDEX IF NOT EXISTS idx_cgt_teorias_menciones_artefacto ON cgt_teorias_menciones(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_teorias_menciones_teoria    ON cgt_teorias_menciones(teoria_id);
CREATE INDEX IF NOT EXISTS idx_cgt_teorias_menciones_project   ON cgt_teorias_menciones(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_teorias_menciones_decision  ON cgt_teorias_menciones(decision_cartografiador);

CREATE TABLE IF NOT EXISTS cgt_teorias_ediciones_humanas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mencion_id      UUID NOT NULL REFERENCES cgt_teorias_menciones(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    campo_editado   TEXT NOT NULL,
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    justificacion   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_teorias_edicion_campo
        CHECK (campo_editado IN ('nombre', 'descripcion', 'reasignar_entidad_canonica', 'actualizar_autores'))
);

CREATE INDEX IF NOT EXISTS idx_cgt_teorias_ediciones_mencion ON cgt_teorias_ediciones_humanas(mencion_id);
CREATE INDEX IF NOT EXISTS idx_cgt_teorias_ediciones_user    ON cgt_teorias_ediciones_humanas(user_id);
CREATE INDEX IF NOT EXISTS idx_cgt_teorias_ediciones_created ON cgt_teorias_ediciones_humanas(created_at DESC);


-- =============================================================================
-- (5) TRÍO DE TABLAS — CITAS (distingue académicas de hechos históricos)
-- =============================================================================
-- Resuelve punto 6 del cierre Oleada 1: las citas académicas (DOI, paper)
-- son distintas de los hechos históricos/biológicos/conocimiento común
-- verificable. Ambos son "fuentes confiables" pero de magnitud distinta.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cgt_tipo_cita') THEN
        CREATE TYPE cgt_tipo_cita AS ENUM (
            'academica',        -- paper, libro, DOI, ISBN
            'hecho_historico',  -- fecha, evento, dato factual verificable
            'obra',             -- obra literaria, artística, película
            'otra'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS cgt_citas (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tipo_cita             cgt_tipo_cita NOT NULL DEFAULT 'otra',

    -- Para 'academica': texto = cita textual, referencia = DOI/ISBN/URL
    -- Para 'hecho_historico': texto = el hecho, referencia = contexto de verificación
    -- Para 'obra': texto = título o cita, referencia = autor + año
    texto                 TEXT NOT NULL,
    autor                 TEXT,
    referencia            TEXT,  -- DOI, ISBN, URL, o descripción de fuente
    ano                   TEXT,  -- string porque "s. XVII" o "~1200 AC" son válidos

    aliases               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- variantes textuales de la misma cita
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cgt_citas_project ON cgt_citas(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_tipo    ON cgt_citas(tipo_cita);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_texto   ON cgt_citas USING GIN (to_tsvector('spanish', texto));
CREATE INDEX IF NOT EXISTS idx_cgt_citas_autor   ON cgt_citas USING GIN (to_tsvector('spanish', coalesce(autor, '')));

DROP TRIGGER IF EXISTS trg_cgt_citas_updated ON cgt_citas;
CREATE TRIGGER trg_cgt_citas_updated
    BEFORE UPDATE ON cgt_citas
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_citas IS
    'Entidad canónica de cita. Distingue tipo_cita académica (con DOI/ISBN) de hecho histórico (verificable sin paper) y obra (literaria/artística).';

CREATE TABLE IF NOT EXISTS cgt_citas_menciones (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id                 UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id                   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cita_id                      UUID REFERENCES cgt_citas(id) ON DELETE SET NULL,

    -- Capa 1: extractor crudo (para citas el "nombre" es el texto, "descripcion" puede ser el autor/año)
    texto_extractor_crudo        TEXT NOT NULL,
    autor_extractor_crudo        TEXT,
    referencia_extractor_cruda   TEXT,
    tipo_cita_extractor          cgt_tipo_cita,
    ubicacion_en_artefacto       TEXT,  -- dónde aparece dentro del artefacto (sección, timestamp)

    -- Capa 2: cartografiador
    texto_cartografiador         TEXT,
    autor_cartografiador         TEXT,
    referencia_cartografiador    TEXT,
    tipo_cita_cartografiador     cgt_tipo_cita,
    decision_cartografiador      cgt_decision_cartografiador NOT NULL DEFAULT 'sin_cartografiar',
    confianza_cartografiador     NUMERIC(3,2),
    justificacion_cartografiador TEXT,

    hash_extractor_crudo         CHAR(64) NOT NULL,

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    cartografiado_at             TIMESTAMPTZ,

    CONSTRAINT chk_citas_confianza
        CHECK (confianza_cartografiador IS NULL OR (confianza_cartografiador >= 0 AND confianza_cartografiador <= 1))
);

CREATE INDEX IF NOT EXISTS idx_cgt_citas_menciones_artefacto ON cgt_citas_menciones(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_menciones_cita      ON cgt_citas_menciones(cita_id);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_menciones_project   ON cgt_citas_menciones(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_menciones_decision  ON cgt_citas_menciones(decision_cartografiador);

CREATE TABLE IF NOT EXISTS cgt_citas_ediciones_humanas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mencion_id      UUID NOT NULL REFERENCES cgt_citas_menciones(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    campo_editado   TEXT NOT NULL,
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    justificacion   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_citas_edicion_campo
        CHECK (campo_editado IN ('texto', 'autor', 'referencia', 'tipo_cita', 'reasignar_entidad_canonica'))
);

CREATE INDEX IF NOT EXISTS idx_cgt_citas_ediciones_mencion ON cgt_citas_ediciones_humanas(mencion_id);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_ediciones_user    ON cgt_citas_ediciones_humanas(user_id);
CREATE INDEX IF NOT EXISTS idx_cgt_citas_ediciones_created ON cgt_citas_ediciones_humanas(created_at DESC);


-- =============================================================================
-- (6) LOG DE EJECUCIONES DEL CARTOGRAFIADOR
-- =============================================================================
-- Bitácora de cada corrida del cartografiador sobre un artefacto. Análogo a
-- cgt_logs_deepseek pero específico para el 2do pipeline.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_logs_cartografiador (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id              UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id                UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- quien disparó el on-demand

    modelo                    TEXT NOT NULL,
    temperatura               NUMERIC(3,2) NOT NULL,

    -- Contadores por tipo de decisión
    total_menciones           INTEGER NOT NULL DEFAULT 0,
    total_match_existente     INTEGER NOT NULL DEFAULT 0,
    total_nueva_entidad       INTEGER NOT NULL DEFAULT 0,
    total_ambigua             INTEGER NOT NULL DEFAULT 0,

    -- Contadores de contexto pasado al cartografiador
    universo_pensadores_count INTEGER NOT NULL DEFAULT 0,
    universo_disciplinas_count INTEGER NOT NULL DEFAULT 0,
    universo_conceptos_count  INTEGER NOT NULL DEFAULT 0,
    universo_teorias_count    INTEGER NOT NULL DEFAULT 0,
    universo_citas_count      INTEGER NOT NULL DEFAULT 0,

    tokens_input              INTEGER NOT NULL DEFAULT 0,
    tokens_output             INTEGER NOT NULL DEFAULT 0,
    tokens_cached             INTEGER NOT NULL DEFAULT 0,
    costo_usd                 NUMERIC(10,6) NOT NULL DEFAULT 0,
    duracion_ms               INTEGER NOT NULL DEFAULT 0,

    finish_reason             TEXT,
    intento                   INTEGER NOT NULL DEFAULT 1,
    error_mensaje             TEXT,

    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cgt_logs_cartografiador_artefacto ON cgt_logs_cartografiador(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_logs_cartografiador_project   ON cgt_logs_cartografiador(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_logs_cartografiador_created   ON cgt_logs_cartografiador(created_at DESC);

COMMENT ON TABLE cgt_logs_cartografiador IS
    'Bitácora append-only de corridas del 2do pipeline (Cartografiador). Insumo para análisis económico y para mostrar historial en UI.';


-- =============================================================================
-- (7) RLS — todas las nuevas tablas
-- =============================================================================
-- Patrón: autorización por membresía en project_members.
-- =============================================================================

-- Helper inline repetido por cada tabla: project_id IN (SELECT ... WHERE user_id = auth.uid())
-- Se mantiene inline en vez de función para consistencia con patrón de Oleada 1.

-- PENSADORES
ALTER TABLE cgt_pensadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_pensadores_all" ON cgt_pensadores;
CREATE POLICY "cgt_pensadores_all" ON cgt_pensadores FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_pensadores_menciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_pensadores_menciones_all" ON cgt_pensadores_menciones;
CREATE POLICY "cgt_pensadores_menciones_all" ON cgt_pensadores_menciones FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_pensadores_ediciones_humanas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_pensadores_ediciones_all" ON cgt_pensadores_ediciones_humanas;
CREATE POLICY "cgt_pensadores_ediciones_all" ON cgt_pensadores_ediciones_humanas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- DISCIPLINAS
ALTER TABLE cgt_disciplinas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_disciplinas_all" ON cgt_disciplinas;
CREATE POLICY "cgt_disciplinas_all" ON cgt_disciplinas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_disciplinas_menciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_disciplinas_menciones_all" ON cgt_disciplinas_menciones;
CREATE POLICY "cgt_disciplinas_menciones_all" ON cgt_disciplinas_menciones FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_disciplinas_ediciones_humanas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_disciplinas_ediciones_all" ON cgt_disciplinas_ediciones_humanas;
CREATE POLICY "cgt_disciplinas_ediciones_all" ON cgt_disciplinas_ediciones_humanas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- CONCEPTOS
ALTER TABLE cgt_conceptos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_conceptos_all" ON cgt_conceptos;
CREATE POLICY "cgt_conceptos_all" ON cgt_conceptos FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_conceptos_menciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_conceptos_menciones_all" ON cgt_conceptos_menciones;
CREATE POLICY "cgt_conceptos_menciones_all" ON cgt_conceptos_menciones FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_conceptos_ediciones_humanas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_conceptos_ediciones_all" ON cgt_conceptos_ediciones_humanas;
CREATE POLICY "cgt_conceptos_ediciones_all" ON cgt_conceptos_ediciones_humanas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- TEORÍAS
ALTER TABLE cgt_teorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_teorias_all" ON cgt_teorias;
CREATE POLICY "cgt_teorias_all" ON cgt_teorias FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_teorias_menciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_teorias_menciones_all" ON cgt_teorias_menciones;
CREATE POLICY "cgt_teorias_menciones_all" ON cgt_teorias_menciones FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_teorias_ediciones_humanas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_teorias_ediciones_all" ON cgt_teorias_ediciones_humanas;
CREATE POLICY "cgt_teorias_ediciones_all" ON cgt_teorias_ediciones_humanas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- CITAS
ALTER TABLE cgt_citas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_citas_all" ON cgt_citas;
CREATE POLICY "cgt_citas_all" ON cgt_citas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_citas_menciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_citas_menciones_all" ON cgt_citas_menciones;
CREATE POLICY "cgt_citas_menciones_all" ON cgt_citas_menciones FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_citas_ediciones_humanas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_citas_ediciones_all" ON cgt_citas_ediciones_humanas;
CREATE POLICY "cgt_citas_ediciones_all" ON cgt_citas_ediciones_humanas FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- LOGS DEL CARTOGRAFIADOR
ALTER TABLE cgt_logs_cartografiador ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_logs_cartografiador_all" ON cgt_logs_cartografiador;
CREATE POLICY "cgt_logs_cartografiador_all" ON cgt_logs_cartografiador FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));


-- =============================================================================
-- (8) VISTA DE APOYO — valor canónico actual por mención
-- =============================================================================
-- Resuelve coalesce(humano → cartografiador → extractor) como lectura única.
-- Cascade la puede usar desde el front sin recalcular la lógica cada vez.
-- =============================================================================

CREATE OR REPLACE VIEW cgt_vw_pensadores_valor_canonico AS
SELECT
    m.id                     AS mencion_id,
    m.artefacto_id,
    m.project_id,
    m.pensador_id,

    -- Capa 1 cruda siempre disponible
    m.nombre_extractor_crudo,
    m.descripcion_extractor_cruda,

    -- Última edición humana (si existe)
    (SELECT valor_nuevo FROM cgt_pensadores_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
     ORDER BY e.created_at DESC LIMIT 1)  AS nombre_humano_ultimo,
    (SELECT valor_nuevo FROM cgt_pensadores_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
     ORDER BY e.created_at DESC LIMIT 1)  AS descripcion_humano_ultimo,

    -- Valor canónico actual (coalesce humano → cartografiador → extractor)
    COALESCE(
        (SELECT valor_nuevo FROM cgt_pensadores_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
         ORDER BY e.created_at DESC LIMIT 1),
        m.nombre_cartografiador,
        m.nombre_extractor_crudo
    ) AS nombre_canonico_actual,

    COALESCE(
        (SELECT valor_nuevo FROM cgt_pensadores_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
         ORDER BY e.created_at DESC LIMIT 1),
        m.descripcion_cartografiador,
        m.descripcion_extractor_cruda
    ) AS descripcion_canonica_actual,

    m.decision_cartografiador,
    m.confianza_cartografiador,
    m.cartografiado_at

FROM cgt_pensadores_menciones m;

COMMENT ON VIEW cgt_vw_pensadores_valor_canonico IS
    'Valor canónico actual de cada mención. Aplica coalesce(humano → cartografiador → extractor).';

-- Análogas para las otras 4 entidades.

CREATE OR REPLACE VIEW cgt_vw_disciplinas_valor_canonico AS
SELECT
    m.id AS mencion_id,
    m.artefacto_id,
    m.project_id,
    m.disciplina_id,
    m.nombre_extractor_crudo,
    m.descripcion_extractor_cruda,
    (SELECT valor_nuevo FROM cgt_disciplinas_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
     ORDER BY e.created_at DESC LIMIT 1) AS nombre_humano_ultimo,
    (SELECT valor_nuevo FROM cgt_disciplinas_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
     ORDER BY e.created_at DESC LIMIT 1) AS descripcion_humano_ultimo,
    COALESCE(
        (SELECT valor_nuevo FROM cgt_disciplinas_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
         ORDER BY e.created_at DESC LIMIT 1),
        m.nombre_cartografiador,
        m.nombre_extractor_crudo
    ) AS nombre_canonico_actual,
    COALESCE(
        (SELECT valor_nuevo FROM cgt_disciplinas_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
         ORDER BY e.created_at DESC LIMIT 1),
        m.descripcion_cartografiador,
        m.descripcion_extractor_cruda
    ) AS descripcion_canonica_actual,
    m.decision_cartografiador,
    m.confianza_cartografiador,
    m.cartografiado_at
FROM cgt_disciplinas_menciones m;

COMMENT ON VIEW cgt_vw_disciplinas_valor_canonico IS
    'Valor canónico actual de cada mención de disciplina. Aplica coalesce(humano → cartografiador → extractor).';


CREATE OR REPLACE VIEW cgt_vw_conceptos_valor_canonico AS
SELECT
    m.id AS mencion_id,
    m.artefacto_id,
    m.project_id,
    m.concepto_id,
    m.nombre_extractor_crudo,
    m.descripcion_extractor_cruda,
    (SELECT valor_nuevo FROM cgt_conceptos_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
     ORDER BY e.created_at DESC LIMIT 1) AS nombre_humano_ultimo,
    (SELECT valor_nuevo FROM cgt_conceptos_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
     ORDER BY e.created_at DESC LIMIT 1) AS descripcion_humano_ultimo,
    COALESCE(
        (SELECT valor_nuevo FROM cgt_conceptos_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
         ORDER BY e.created_at DESC LIMIT 1),
        m.nombre_cartografiador,
        m.nombre_extractor_crudo
    ) AS nombre_canonico_actual,
    COALESCE(
        (SELECT valor_nuevo FROM cgt_conceptos_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
         ORDER BY e.created_at DESC LIMIT 1),
        m.descripcion_cartografiador,
        m.descripcion_extractor_cruda
    ) AS descripcion_canonica_actual,
    m.decision_cartografiador,
    m.confianza_cartografiador,
    m.cartografiado_at
FROM cgt_conceptos_menciones m;

COMMENT ON VIEW cgt_vw_conceptos_valor_canonico IS
    'Valor canónico actual de cada mención de concepto. Aplica coalesce(humano → cartografiador → extractor).';


CREATE OR REPLACE VIEW cgt_vw_teorias_valor_canonico AS
SELECT
    m.id AS mencion_id,
    m.artefacto_id,
    m.project_id,
    m.teoria_id,
    m.nombre_extractor_crudo,
    m.descripcion_extractor_cruda,
    (SELECT valor_nuevo FROM cgt_teorias_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
     ORDER BY e.created_at DESC LIMIT 1) AS nombre_humano_ultimo,
    (SELECT valor_nuevo FROM cgt_teorias_ediciones_humanas e
     WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
     ORDER BY e.created_at DESC LIMIT 1) AS descripcion_humano_ultimo,
    COALESCE(
        (SELECT valor_nuevo FROM cgt_teorias_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'nombre'
         ORDER BY e.created_at DESC LIMIT 1),
        m.nombre_cartografiador,
        m.nombre_extractor_crudo
    ) AS nombre_canonico_actual,
    COALESCE(
        (SELECT valor_nuevo FROM cgt_teorias_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'descripcion'
         ORDER BY e.created_at DESC LIMIT 1),
        m.descripcion_cartografiador,
        m.descripcion_extractor_cruda
    ) AS descripcion_canonica_actual,
    m.decision_cartografiador,
    m.confianza_cartografiador,
    m.cartografiado_at
FROM cgt_teorias_menciones m;

COMMENT ON VIEW cgt_vw_teorias_valor_canonico IS
    'Valor canónico actual de cada mención de teoría. Aplica coalesce(humano → cartografiador → extractor).';


-- Citas: estructura de valor canónico distinta (texto/autor/referencia/tipo en vez de nombre/descripción)
CREATE OR REPLACE VIEW cgt_vw_citas_valor_canonico AS
SELECT
    m.id AS mencion_id,
    m.artefacto_id,
    m.project_id,
    m.cita_id,
    m.ubicacion_en_artefacto,

    -- Capa 1
    m.texto_extractor_crudo,
    m.autor_extractor_crudo,
    m.referencia_extractor_cruda,
    m.tipo_cita_extractor,

    -- Valor canónico actual por campo
    COALESCE(
        (SELECT valor_nuevo FROM cgt_citas_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'texto'
         ORDER BY e.created_at DESC LIMIT 1),
        m.texto_cartografiador,
        m.texto_extractor_crudo
    ) AS texto_canonico_actual,

    COALESCE(
        (SELECT valor_nuevo FROM cgt_citas_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'autor'
         ORDER BY e.created_at DESC LIMIT 1),
        m.autor_cartografiador,
        m.autor_extractor_crudo
    ) AS autor_canonico_actual,

    COALESCE(
        (SELECT valor_nuevo FROM cgt_citas_ediciones_humanas e
         WHERE e.mencion_id = m.id AND e.campo_editado = 'referencia'
         ORDER BY e.created_at DESC LIMIT 1),
        m.referencia_cartografiador,
        m.referencia_extractor_cruda
    ) AS referencia_canonica_actual,

    COALESCE(
        m.tipo_cita_cartografiador,
        m.tipo_cita_extractor
    ) AS tipo_cita_canonico_actual,

    m.decision_cartografiador,
    m.confianza_cartografiador,
    m.cartografiado_at
FROM cgt_citas_menciones m;

COMMENT ON VIEW cgt_vw_citas_valor_canonico IS
    'Valor canónico actual de cada mención de cita. Aplica coalesce por campo (texto/autor/referencia/tipo).';


-- =============================================================================
-- (9) FUNCIONES HELPER DE CONTEO — lectura calculada
-- =============================================================================
-- Diseño: las cuentas de menciones por entidad canónica son lectura
-- calculada, no columnas denormalizadas. Postgres resuelve COUNT con
-- índice sobre <tipo>_id en tiempo despreciable para corpus de tamaño
-- esperado. Si en el futuro se nota costo, se agrega trigger sin
-- cambiar el contrato público de estas funciones.
--
-- Regla de conteo: solo menciones con <tipo>_id NOT NULL cuentan.
-- Menciones con decision='ambigua' y <tipo>_id = NULL NO cuentan hasta
-- que humano las resuelva (asignando entidad canónica o creando nueva).
-- Esto preserva la distinción "resuelto vs pendiente" en el badge.
--
-- Citas NO tienen función de conteo porque cada aparición es
-- conceptualmente única (una cita textual no se "repite" en el sentido
-- que un pensador se repite entre artefactos).
-- =============================================================================

-- Conteo individual por entidad canónica
CREATE OR REPLACE FUNCTION cgt_contar_menciones_pensador(p_pensador_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM cgt_pensadores_menciones
    WHERE pensador_id = p_pensador_id;
$$;

CREATE OR REPLACE FUNCTION cgt_contar_menciones_disciplina(p_disciplina_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM cgt_disciplinas_menciones
    WHERE disciplina_id = p_disciplina_id;
$$;

CREATE OR REPLACE FUNCTION cgt_contar_menciones_concepto(p_concepto_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM cgt_conceptos_menciones
    WHERE concepto_id = p_concepto_id;
$$;

CREATE OR REPLACE FUNCTION cgt_contar_menciones_teoria(p_teoria_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM cgt_teorias_menciones
    WHERE teoria_id = p_teoria_id;
$$;

-- Vistas con contador inline para navegación rápida (lista de entidades del proyecto)
-- Cascade puede usar estas vistas directamente en server actions que pueblan
-- dropdowns de reasignación o listas de "entidades del proyecto".

CREATE OR REPLACE VIEW cgt_vw_pensadores_con_conteo AS
SELECT
    p.*,
    cgt_contar_menciones_pensador(p.id) AS menciones_count
FROM cgt_pensadores p;

CREATE OR REPLACE VIEW cgt_vw_disciplinas_con_conteo AS
SELECT
    d.*,
    cgt_contar_menciones_disciplina(d.id) AS menciones_count
FROM cgt_disciplinas d;

CREATE OR REPLACE VIEW cgt_vw_conceptos_con_conteo AS
SELECT
    c.*,
    cgt_contar_menciones_concepto(c.id) AS menciones_count
FROM cgt_conceptos c;

CREATE OR REPLACE VIEW cgt_vw_teorias_con_conteo AS
SELECT
    t.*,
    cgt_contar_menciones_teoria(t.id) AS menciones_count
FROM cgt_teorias t;

-- Listado de artefactos donde aparece una entidad (para navegación
-- desde badge clickeable en UI). Cascade usa estas funciones cuando el
-- usuario clickea el badge "Alan Turing (3)" → carga los 3 artefactos.

CREATE OR REPLACE FUNCTION cgt_artefactos_por_pensador(p_pensador_id UUID)
RETURNS TABLE (
    artefacto_id UUID,
    mencion_id UUID,
    nombre_canonico_actual TEXT,
    primera_aparicion TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        m.artefacto_id,
        m.id AS mencion_id,
        COALESCE(m.nombre_cartografiador, m.nombre_extractor_crudo) AS nombre_canonico_actual,
        MIN(m.created_at) OVER (PARTITION BY m.artefacto_id) AS primera_aparicion
    FROM cgt_pensadores_menciones m
    WHERE m.pensador_id = p_pensador_id
    ORDER BY primera_aparicion DESC;
$$;

CREATE OR REPLACE FUNCTION cgt_artefactos_por_disciplina(p_disciplina_id UUID)
RETURNS TABLE (
    artefacto_id UUID,
    mencion_id UUID,
    nombre_canonico_actual TEXT,
    primera_aparicion TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        m.artefacto_id,
        m.id AS mencion_id,
        COALESCE(m.nombre_cartografiador, m.nombre_extractor_crudo) AS nombre_canonico_actual,
        MIN(m.created_at) OVER (PARTITION BY m.artefacto_id) AS primera_aparicion
    FROM cgt_disciplinas_menciones m
    WHERE m.disciplina_id = p_disciplina_id
    ORDER BY primera_aparicion DESC;
$$;

CREATE OR REPLACE FUNCTION cgt_artefactos_por_concepto(p_concepto_id UUID)
RETURNS TABLE (
    artefacto_id UUID,
    mencion_id UUID,
    nombre_canonico_actual TEXT,
    primera_aparicion TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        m.artefacto_id,
        m.id AS mencion_id,
        COALESCE(m.nombre_cartografiador, m.nombre_extractor_crudo) AS nombre_canonico_actual,
        MIN(m.created_at) OVER (PARTITION BY m.artefacto_id) AS primera_aparicion
    FROM cgt_conceptos_menciones m
    WHERE m.concepto_id = p_concepto_id
    ORDER BY primera_aparicion DESC;
$$;

CREATE OR REPLACE FUNCTION cgt_artefactos_por_teoria(p_teoria_id UUID)
RETURNS TABLE (
    artefacto_id UUID,
    mencion_id UUID,
    nombre_canonico_actual TEXT,
    primera_aparicion TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        m.artefacto_id,
        m.id AS mencion_id,
        COALESCE(m.nombre_cartografiador, m.nombre_extractor_crudo) AS nombre_canonico_actual,
        MIN(m.created_at) OVER (PARTITION BY m.artefacto_id) AS primera_aparicion
    FROM cgt_teorias_menciones m
    WHERE m.teoria_id = p_teoria_id
    ORDER BY primera_aparicion DESC;
$$;

COMMENT ON FUNCTION cgt_artefactos_por_pensador(UUID) IS
    'Devuelve artefactos donde aparece un pensador. Usado por UI para badge clickeable "Alan Turing (3)" → vista raíz del pensador con sus 3 artefactos.';


-- =============================================================================
-- VERIFICACIÓN (opcional, descomentar)
-- =============================================================================
-- SELECT
--     table_name,
--     COUNT(*) AS columnas
-- FROM information_schema.columns
-- WHERE table_name LIKE 'cgt_%'
--   AND table_name NOT IN ('cgt_artefactos', 'cgt_artefactos_audio', 'cgt_artefactos_pdf_slides',
--                          'cgt_artefactos_pdf_informe', 'cgt_artefactos_markdown',
--                          'cgt_artefactos_video', 'cgt_artefactos_imagen',
--                          'cgt_grupos', 'cgt_cronicas', 'cgt_destilados',
--                          'cgt_germinales', 'cgt_nucleos', 'cgt_logs_deepseek')
-- GROUP BY table_name
-- ORDER BY table_name;
--
-- SELECT tablename, COUNT(*) AS politicas
-- FROM pg_policies
-- WHERE tablename LIKE 'cgt_%' AND tablename NOT IN (...)
-- GROUP BY tablename;
