-- =============================================================================
-- SQL — Cognética Forense v2 Oleada 2 (v1.2) — Addendum Referencias
-- =============================================================================
-- Agrega el modelo de referencias bibliográficas a Oleada 2.
--
-- Razón:
--   En Oleada 2 v1.1, las "referencias académicas" se modelaron como cgt_citas
--   con tipo_cita = 'academica'. Se reveló error conceptual: una referencia
--   bibliográfica NO es una mención dentro de un artefacto — es una entidad
--   externa (paper, libro, web) que vive a nivel proyecto y puede ser citada
--   por múltiples artefactos. Una cita textual sí es una mención (frase
--   notable del autor del artefacto). Son cosas distintas con vida distinta.
--
-- Cambios:
--   1) NUEVA TABLA cgt_referencias — entidad canónica del proyecto
--   2) NUEVA TABLA cgt_artefactos_referencias — puente artefacto↔referencia
--      con metadata de ubicación, contexto local, agrupaciones, formato detectado
--   3) cgt_citas se re-enfoca: SOLO citas textuales (frases notables del autor).
--      tipo_cita queda solo como clasificación adicional, NO como discriminador
--      academica vs hecho_historico.
--   4) Funciones helper de conteo + vista de valor canónico para referencias.
--   5) RLS por membresía en project_members.
--
-- Diseño operativo:
--   - Coalesce duro: dos referencias coalescen si comparten DOI exacto, ISBN
--     exacto, O url normalizada exacta. Si no comparten ninguno → entidades
--     separadas. Conservador: evita falsos matches por título similar.
--   - Apariciones JSONB: array de {linea_aprox, contexto_local, co_citadas}.
--     Permite capturar agrupaciones tipo Quipu (varias referencias juntas
--     sosteniendo la misma afirmación) sin estructura SQL extra.
--   - Confianza extracción: campo NUMERIC(3,2) en el puente para auditoría
--     del juicio LLM. Bajo = humano debe revisar. Alto = LLM seguro.
--
-- Idempotente. Ejecutar en Supabase SQL Editor.
-- =============================================================================


-- =============================================================================
-- (1) ENUM tipo_referencia
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cgt_tipo_referencia') THEN
        CREATE TYPE cgt_tipo_referencia AS ENUM (
            'paper',         -- artículo académico (arxiv, journal, conference)
            'libro',         -- libro completo o capítulo
            'web',           -- artículo web, blog, post
            'dataset',       -- dataset o conjunto de datos
            'video',         -- video, charla, conferencia grabada
            'norma_legal',   -- ley, decreto, regulación
            'reporte',       -- reporte técnico, white paper
            'otro',          -- cualquier otra cosa con URL
            'desconocido'    -- el LLM no pudo clasificar
        );
    END IF;
END$$;


-- =============================================================================
-- (2) cgt_referencias — entidad canónica del proyecto
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_referencias (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identidad: al menos UNO de estos tres debe existir para coalesce.
    -- Si los tres son NULL, la referencia se identifica solo por título +
    -- proyecto, lo cual es frágil pero válido como fallback.
    doi                   TEXT,
    isbn                  TEXT,
    url                   TEXT,

    -- url_normalizada: para coalesce. Lower-case, sin trailing slash, sin
    -- query strings de tracking (utm_*, fbclid, etc.). Calculada en código,
    -- no en DB para mantener portabilidad de la lógica de normalización.
    url_normalizada       TEXT,

    -- Metadata bibliográfica (NULLABLE — lo que el LLM pueda extraer)
    titulo                TEXT,
    autores               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["Smith, J.", "Doe, A."]
    ano                   TEXT,    -- string: admite "2024", "s.d.", "~1200 AC", etc.
    fuente                TEXT,    -- "ResearchGate", "arXiv", "Nature", "Wikipedia"
    tipo_referencia       cgt_tipo_referencia NOT NULL DEFAULT 'desconocido',

    -- Aliases: variantes de título o referencia detectadas. Permite que la
    -- misma fuente citada con título ligeramente distinto en dos artefactos
    -- coalesca si humano marca el alias.
    aliases               JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Descripción canónica: qué dice o hace esta fuente. Inicialmente la
    -- propone el LLM al detectarla; humano la edita en hito futuro.
    descripcion_canonica  TEXT,

    -- Trazabilidad mínima
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Coalesce: una referencia es única dentro de un proyecto por cualquiera
    -- de sus tres claves duras. Permitimos múltiples NULL pero al menos uno
    -- cuando sea posible.
    CONSTRAINT chk_referencia_tiene_identidad
        CHECK (doi IS NOT NULL OR isbn IS NOT NULL OR url_normalizada IS NOT NULL OR titulo IS NOT NULL)
);

-- Unicidad por clave dura, parcial (admite múltiples NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cgt_referencias_doi_proyecto
    ON cgt_referencias(project_id, doi)
    WHERE doi IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cgt_referencias_isbn_proyecto
    ON cgt_referencias(project_id, isbn)
    WHERE isbn IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cgt_referencias_url_proyecto
    ON cgt_referencias(project_id, url_normalizada)
    WHERE url_normalizada IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cgt_referencias_project ON cgt_referencias(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_referencias_tipo    ON cgt_referencias(tipo_referencia);
CREATE INDEX IF NOT EXISTS idx_cgt_referencias_titulo  ON cgt_referencias USING GIN (to_tsvector('spanish', coalesce(titulo, '')));

DROP TRIGGER IF EXISTS trg_cgt_referencias_updated ON cgt_referencias;
CREATE TRIGGER trg_cgt_referencias_updated
    BEFORE UPDATE ON cgt_referencias
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_referencias IS
    'Entidad canónica de referencia bibliográfica del proyecto. Vive a nivel proyecto, no artefacto. Coalesce por DOI/ISBN/URL normalizada.';
COMMENT ON COLUMN cgt_referencias.url_normalizada IS
    'URL en lower-case sin trailing slash y sin query strings de tracking. Calculada en código.';


-- =============================================================================
-- (3) cgt_artefactos_referencias — puente artefacto↔referencia
-- =============================================================================

CREATE TABLE IF NOT EXISTS cgt_artefactos_referencias (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id          UUID NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    referencia_id         UUID NOT NULL REFERENCES cgt_referencias(id) ON DELETE CASCADE,
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Número con que aparece en el artefacto. Ej: si en el cuerpo dice
    -- "frase.15", numero_en_artefacto = 15. Si el formato no usa números
    -- (ej: APA "Smith, 2020"), queda NULL y el campo formato_cita_inline
    -- lo explica.
    numero_en_artefacto   INTEGER,

    -- Apariciones: dónde aparece la referencia dentro del artefacto.
    -- Array de objetos con esquema:
    --   {
    --     "linea_aprox": 11,
    --     "contexto_local": "<2-3 párrafos circundantes>",
    --     "co_citadas": [73, 74, 76]  -- otros números de referencia citados junto a esta
    --   }
    -- JSONB para flexibilidad y porque la cantidad de apariciones por
    -- artefacto es típicamente 1-5.
    apariciones           JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Formato de cita inline detectado (auditoría + entrada para Hito 7
    -- de renderizado).
    -- Valores típicos: 'gemini_post_punto', 'quipu_inline_link',
    --                  'apa_paren', 'numero_corchetes', 'footnote', 'otro'
    formato_cita_inline   TEXT,

    -- Confianza del extractor en haber identificado correctamente la
    -- referencia. 0.00-1.00. Bajo = humano debe revisar.
    confianza_extraccion  NUMERIC(3,2) NOT NULL DEFAULT 1.00,

    -- Notas del extractor cuando hay ambigüedad. Ej: "El número 92 aparece
    -- también como referencia 86 con la misma URL — posible duplicado en
    -- el documento original."
    notas_extractor       TEXT,

    -- Hash del contenido extraído (para cascada de invalidación si el
    -- artefacto se regenera).
    hash_extractor_crudo  CHAR(64) NOT NULL,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_referencias_confianza
        CHECK (confianza_extraccion >= 0 AND confianza_extraccion <= 1),

    -- Unicidad por (artefacto, referencia, hash) para idempotencia de
    -- re-extracción. Si el contenido cambia, hash cambia, fila nueva
    -- como historial.
    UNIQUE (artefacto_id, referencia_id, hash_extractor_crudo)
);

CREATE INDEX IF NOT EXISTS idx_cgt_artrefs_artefacto    ON cgt_artefactos_referencias(artefacto_id);
CREATE INDEX IF NOT EXISTS idx_cgt_artrefs_referencia   ON cgt_artefactos_referencias(referencia_id);
CREATE INDEX IF NOT EXISTS idx_cgt_artrefs_project      ON cgt_artefactos_referencias(project_id);
CREATE INDEX IF NOT EXISTS idx_cgt_artrefs_numero       ON cgt_artefactos_referencias(artefacto_id, numero_en_artefacto);

COMMENT ON TABLE cgt_artefactos_referencias IS
    'Puente artefacto↔referencia. Una fila por aparición de referencia en artefacto. Apariciones JSONB captura múltiples ubicaciones, contexto local, agrupaciones.';


-- =============================================================================
-- (4) Funciones helper — lectura calculada
-- =============================================================================

-- Conteo de artefactos que citan una referencia
CREATE OR REPLACE FUNCTION cgt_contar_artefactos_referencia(p_referencia_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT COUNT(DISTINCT artefacto_id)::INTEGER
    FROM cgt_artefactos_referencias
    WHERE referencia_id = p_referencia_id;
$$;

-- Listado de artefactos donde aparece una referencia (para vista raíz +
-- navegación tipo "Smith 2020 → ver los 3 artefactos del proyecto que lo citan")
CREATE OR REPLACE FUNCTION cgt_artefactos_por_referencia(p_referencia_id UUID)
RETURNS TABLE (
    artefacto_id UUID,
    puente_id UUID,
    numero_en_artefacto INTEGER,
    apariciones_count INTEGER,
    formato_cita_inline TEXT,
    primera_aparicion TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT
        ar.artefacto_id,
        ar.id AS puente_id,
        ar.numero_en_artefacto,
        jsonb_array_length(ar.apariciones)::INTEGER AS apariciones_count,
        ar.formato_cita_inline,
        ar.created_at AS primera_aparicion
    FROM cgt_artefactos_referencias ar
    WHERE ar.referencia_id = p_referencia_id
    ORDER BY ar.created_at DESC;
$$;

-- Listado de referencias por artefacto (para mostrar la "bibliografía"
-- estructurada del artefacto en su vista detalle)
CREATE OR REPLACE FUNCTION cgt_referencias_por_artefacto(p_artefacto_id UUID)
RETURNS TABLE (
    referencia_id UUID,
    puente_id UUID,
    numero_en_artefacto INTEGER,
    titulo TEXT,
    autores JSONB,
    ano TEXT,
    fuente TEXT,
    tipo_referencia cgt_tipo_referencia,
    url TEXT,
    doi TEXT,
    apariciones JSONB,
    formato_cita_inline TEXT,
    confianza_extraccion NUMERIC,
    notas_extractor TEXT,
    artefactos_count INTEGER  -- cuántos artefactos del proyecto la citan
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT
        r.id AS referencia_id,
        ar.id AS puente_id,
        ar.numero_en_artefacto,
        r.titulo,
        r.autores,
        r.ano,
        r.fuente,
        r.tipo_referencia,
        r.url,
        r.doi,
        ar.apariciones,
        ar.formato_cita_inline,
        ar.confianza_extraccion,
        ar.notas_extractor,
        cgt_contar_artefactos_referencia(r.id) AS artefactos_count
    FROM cgt_artefactos_referencias ar
    JOIN cgt_referencias r ON r.id = ar.referencia_id
    WHERE ar.artefacto_id = p_artefacto_id
    ORDER BY ar.numero_en_artefacto NULLS LAST, r.titulo;
$$;

-- Vista con conteo (paralela a las del Hito 5 base)
CREATE OR REPLACE VIEW cgt_vw_referencias_con_conteo AS
SELECT
    r.*,
    cgt_contar_artefactos_referencia(r.id) AS artefactos_count
FROM cgt_referencias r;

COMMENT ON FUNCTION cgt_artefactos_por_referencia(UUID) IS
    'Devuelve artefactos del proyecto que citan una referencia. Usado por UI vista raíz de referencia.';
COMMENT ON FUNCTION cgt_referencias_por_artefacto(UUID) IS
    'Devuelve referencias bibliográficas extraídas de un artefacto, ordenadas por número en artefacto.';


-- =============================================================================
-- (5) RLS
-- =============================================================================

ALTER TABLE cgt_referencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_referencias_all" ON cgt_referencias;
CREATE POLICY "cgt_referencias_all" ON cgt_referencias FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

ALTER TABLE cgt_artefactos_referencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgt_artefactos_referencias_all" ON cgt_artefactos_referencias;
CREATE POLICY "cgt_artefactos_referencias_all" ON cgt_artefactos_referencias FOR ALL
    USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));


-- =============================================================================
-- (6) Verificación opcional (descomentar)
-- =============================================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('cgt_referencias', 'cgt_artefactos_referencias');
--
-- SELECT proname FROM pg_proc
-- WHERE proname IN ('cgt_contar_artefactos_referencia',
--                   'cgt_artefactos_por_referencia',
--                   'cgt_referencias_por_artefacto');
