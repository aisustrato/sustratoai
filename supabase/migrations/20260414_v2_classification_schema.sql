-- ═══════════════════════════════════════════════════════════════════════
-- SPRINT 0: ESQUEMA V2 DE CLASIFICACIÓN — SUSTRATO.AI
-- ═══════════════════════════════════════════════════════════════════════
-- Documento de referencia: /docs/ARQUITECTURA_BD_PRECLASIFICACION.md v2.1
-- Paper de referencia: paper_sustrato_v1_8_pre_zenodo.md
-- Fecha: 2026-04-14
-- Propósito: Crear todas las tablas, enums, funciones, vistas y triggers
--            del modelo v2 de clasificación. NO toca tablas v1.
-- ═══════════════════════════════════════════════════════════════════════

-- Extensión requerida para pgcrypto (sha256)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 1: ENUMS
-- ═══════════════════════════════════════════════════════════════════════

-- Status de fase de clasificación
DO $$ BEGIN
  CREATE TYPE phase_status AS ENUM (
    'draft',
    'active',
    'completed',
    'annulled',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status de clasificación en el ledger
DO $$ BEGIN
  CREATE TYPE classification_status AS ENUM (
    'pending',
    'classified',
    'validated',
    'contested',
    'reconciled',
    'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rol del clasificador
DO $$ BEGIN
  CREATE TYPE classifier_role AS ENUM ('ai', 'human');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de dimensión
DO $$ BEGIN
  CREATE TYPE dimension_type AS ENUM ('finite', 'open');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Preparación lingüística del artículo
DO $$ BEGIN
  CREATE TYPE article_prep_status AS ENUM (
    'raw',
    'translated',
    'summarized',
    'ready'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status del lote para retroalimentación al investigador
DO $$ BEGIN
  CREATE TYPE batch_work_status AS ENUM (
    'pending',
    'translating',
    'classifying',
    'reviewing',
    'reconciling',
    'review_reconciliation',
    'completed',
    'sealed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 2: CAPA 1 — CONFIGURACIÓN
-- ═══════════════════════════════════════════════════════════════════════

-- 2.1 classification_phases — Embudo lógico
CREATE TABLE IF NOT EXISTS classification_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,

  name TEXT NOT NULL,
  description TEXT,
  phase_number SMALLINT NOT NULL,
  status phase_status NOT NULL DEFAULT 'draft',

  -- Linaje de fases (§4.4: output de una fase alimenta la siguiente)
  source_phase_id UUID REFERENCES classification_phases(id),
  universe_criteria JSONB,

  -- Anulación (error humano al configurar dimensiones, etc.)
  annulment_reason TEXT,
  annulled_at TIMESTAMPTZ,
  annulled_by UUID REFERENCES auth.users(id),

  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: una sola fase activa por proyecto
  CONSTRAINT uq_one_active_phase_per_project
    EXCLUDE USING btree (project_id WITH =) WHERE (status = 'active')
);

-- 2.2 classification_dimensions — Criterios de análisis
CREATE TABLE IF NOT EXISTS classification_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES classification_phases(id) ON DELETE RESTRICT,

  name TEXT NOT NULL,
  description TEXT,
  type dimension_type NOT NULL,
  icon TEXT,
  ordering SMALLINT NOT NULL DEFAULT 0,

  -- Instrucciones para la IA (§4.6: calibración)
  ai_instructions TEXT,

  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_dimension_name_per_phase UNIQUE (phase_id, name)
);

-- 2.3 dimension_options — Opciones predefinidas (solo tipo 'finite')
CREATE TABLE IF NOT EXISTS dimension_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES classification_dimensions(id) ON DELETE RESTRICT,

  value TEXT NOT NULL,
  description TEXT,
  justification TEXT,
  emoticon TEXT,
  ordering SMALLINT NOT NULL DEFAULT 0,
  is_serendipity_option BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT uq_option_value_per_dimension UNIQUE (dimension_id, value)
);

-- 2.4 dimension_questions — Preguntas guía para calibración
CREATE TABLE IF NOT EXISTS dimension_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES classification_dimensions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  ordering SMALLINT NOT NULL DEFAULT 0
);

-- 2.5 dimension_examples — Ejemplos de clasificación
CREATE TABLE IF NOT EXISTS dimension_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES classification_dimensions(id) ON DELETE CASCADE,
  example_input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  explanation TEXT,
  ordering SMALLINT NOT NULL DEFAULT 0
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 3: CAPA 2 — UNIVERSOS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS phase_article_universe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES classification_phases(id) ON DELETE RESTRICT,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,

  inclusion_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_article_per_phase_v2 UNIQUE (phase_id, article_id)
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 4: CAPA 3 — ASIGNACIÓN
-- ═══════════════════════════════════════════════════════════════════════

-- 4.1 work_batches — Lotes de trabajo
CREATE TABLE IF NOT EXISTS work_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES classification_phases(id) ON DELETE RESTRICT,

  batch_number SMALLINT NOT NULL,
  name TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  -- Status para retroalimentación al investigador
  status batch_work_status NOT NULL DEFAULT 'pending',
  status_updated_at TIMESTAMPTZ,

  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_batch_number_per_phase_v2 UNIQUE (phase_id, batch_number)
);

-- 4.2 batch_articles — Artículos dentro del lote
CREATE TABLE IF NOT EXISTS batch_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES work_batches(id) ON DELETE RESTRICT,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,

  position SMALLINT,

  -- Preparación lingüística (equipos no angloparlantes)
  prep_status article_prep_status NOT NULL DEFAULT 'raw',
  translated_title TEXT,
  translated_abstract TEXT,
  summary TEXT,
  original_language TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_article_per_batch_v2 UNIQUE (batch_id, article_id)
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 5: CAPA 5 — TRAZABILIDAD DEL PROMPT Y MODELO
-- (Se crea ANTES del ledger porque el ledger referencia estas tablas)
-- ═══════════════════════════════════════════════════════════════════════

-- 5.1 model_configs — Registro de modelos utilizados
CREATE TABLE IF NOT EXISTS model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT,
  temperature NUMERIC(3,2),
  max_tokens INTEGER,
  additional_params JSONB,

  config_hash TEXT NOT NULL,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_model_config_hash UNIQUE (config_hash)
);

-- 5.2 prompt_snapshots — Prompts exactos enviados
CREATE TABLE IF NOT EXISTS prompt_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  system_message TEXT,
  prompt_template TEXT NOT NULL,
  prompt_rendered TEXT NOT NULL,

  phase_id UUID NOT NULL REFERENCES classification_phases(id),
  dimension_ids UUID[] NOT NULL,
  article_count SMALLINT NOT NULL,

  model_config_id UUID NOT NULL REFERENCES model_configs(id),

  prompt_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 6: CAPA 4 — LEDGER APPEND-ONLY
-- (Ahora puede referenciar model_configs y prompt_snapshots)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS classification_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Claves de contexto
  batch_article_id UUID NOT NULL REFERENCES batch_articles(id) ON DELETE RESTRICT,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
  dimension_id UUID NOT NULL REFERENCES classification_dimensions(id) ON DELETE RESTRICT,
  option_id UUID REFERENCES dimension_options(id),

  -- Iteración y rol (§4.2: diálogo de 3 iteraciones)
  iteration SMALLINT NOT NULL CHECK (iteration BETWEEN 1 AND 3),
  classifier_role classifier_role NOT NULL,
  classifier_id UUID REFERENCES auth.users(id),

  -- Datos de clasificación
  classification_value TEXT NOT NULL,
  rationale TEXT,
  confidence_level SMALLINT CHECK (confidence_level BETWEEN 1 AND 3),
  is_serendipity BOOLEAN NOT NULL DEFAULT false,

  -- Status y finalización
  status classification_status NOT NULL DEFAULT 'pending',
  is_final BOOLEAN NOT NULL DEFAULT false,

  -- Trazabilidad del prompt (§9)
  prompt_snapshot_id UUID REFERENCES prompt_snapshots(id),
  model_config_id UUID REFERENCES model_configs(id),
  api_cost_usd NUMERIC(10,8),
  api_latency_ms INTEGER,

  -- Integridad criptográfica (§4.3)
  record_hash TEXT NOT NULL,
  previous_hash TEXT,

  -- Timestamp inmutable
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO updated_at — APPEND-ONLY
  -- NO deleted_at — APPEND-ONLY
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 7: CAPA 6 — CALIBRACIÓN
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS calibration_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  phase_id UUID NOT NULL REFERENCES classification_phases(id),
  article_id UUID NOT NULL REFERENCES articles(id),
  dimension_id UUID NOT NULL REFERENCES classification_dimensions(id),

  classification_value TEXT NOT NULL,
  rationale TEXT,
  confidence_level SMALLINT,

  prompt_snapshot_id UUID REFERENCES prompt_snapshots(id),
  model_config_id UUID REFERENCES model_configs(id),

  researcher_notes TEXT,
  led_to_dimension_change BOOLEAN DEFAULT false,
  change_description TEXT,

  record_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 8: CAPA 7 — SELLADO Y EXPORTACIÓN
-- ═══════════════════════════════════════════════════════════════════════

-- 8.1 batch_seals — Sellado criptográfico de lotes
CREATE TABLE IF NOT EXISTS batch_seals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES work_batches(id),

  merkle_root TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  total_articles INTEGER NOT NULL,
  total_dimensions INTEGER NOT NULL,

  stats_at_seal JSONB NOT NULL,
  friction_rate NUMERIC(5,2),

  sealed_by UUID NOT NULL REFERENCES auth.users(id),
  sealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_one_seal_per_batch UNIQUE (batch_id)
);

-- 8.2 certified_exports — Exportaciones verificables
CREATE TABLE IF NOT EXISTS certified_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  phase_id UUID NOT NULL REFERENCES classification_phases(id),
  batch_ids UUID[],
  export_format TEXT NOT NULL CHECK (export_format IN ('json', 'csv', 'svg', 'markdown')),

  article_count INTEGER NOT NULL,
  dimension_count INTEGER NOT NULL,
  classification_count INTEGER NOT NULL,

  export_hash TEXT NOT NULL,
  merkle_root TEXT,
  filename TEXT NOT NULL,

  exported_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 9: TRIGGERS APPEND-ONLY
-- ═══════════════════════════════════════════════════════════════════════

-- Función: bloquear UPDATE y DELETE en el ledger
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'classification_ledger es APPEND-ONLY. No se permiten UPDATE ni DELETE.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: bloquear UPDATE
DROP TRIGGER IF EXISTS enforce_append_only_no_update ON classification_ledger;
CREATE TRIGGER enforce_append_only_no_update
  BEFORE UPDATE ON classification_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- Trigger: bloquear DELETE
DROP TRIGGER IF EXISTS enforce_append_only_no_delete ON classification_ledger;
CREATE TRIGGER enforce_append_only_no_delete
  BEFORE DELETE ON classification_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- Trigger: bloquear inserciones en lotes sellados
CREATE OR REPLACE FUNCTION prevent_insert_on_sealed_batch()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM batch_seals bs
    JOIN batch_articles ba ON ba.batch_id = bs.batch_id
    WHERE ba.id = NEW.batch_article_id
  ) THEN
    RAISE EXCEPTION 'Este lote está SELLADO. No se permiten nuevas clasificaciones.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_sealed_batch ON classification_ledger;
CREATE TRIGGER enforce_sealed_batch
  BEFORE INSERT ON classification_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_insert_on_sealed_batch();


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 10: ÍNDICES DEL LEDGER
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ledger_batch_article
  ON classification_ledger(batch_article_id);
CREATE INDEX IF NOT EXISTS idx_ledger_article_dimension
  ON classification_ledger(article_id, dimension_id);
CREATE INDEX IF NOT EXISTS idx_ledger_iteration
  ON classification_ledger(iteration);
CREATE INDEX IF NOT EXISTS idx_ledger_status
  ON classification_ledger(status);
CREATE INDEX IF NOT EXISTS idx_ledger_serendipity
  ON classification_ledger(is_serendipity) WHERE is_serendipity = true;
CREATE INDEX IF NOT EXISTS idx_ledger_is_final
  ON classification_ledger(is_final) WHERE is_final = true;
CREATE INDEX IF NOT EXISTS idx_ledger_created_at
  ON classification_ledger(created_at);
-- Índice compuesto para DISTINCT ON (usado por v_current_classifications)
CREATE INDEX IF NOT EXISTS idx_ledger_ba_dim_created
  ON classification_ledger(batch_article_id, dimension_id, created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 11: VISTA REGULAR — Estado actual en tiempo real
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_current_classifications AS
SELECT DISTINCT ON (cl.batch_article_id, cl.dimension_id)
  cl.id as ledger_entry_id,
  cl.batch_article_id,
  cl.article_id,
  cl.dimension_id,
  cl.option_id,
  ba.batch_id,
  wb.phase_id,
  cl.iteration,
  cl.classifier_role,
  cl.classification_value,
  cl.rationale,
  cl.confidence_level,
  cl.status,
  cl.is_final,
  cl.is_serendipity,
  cl.record_hash,
  cl.created_at
FROM classification_ledger cl
JOIN batch_articles ba ON ba.id = cl.batch_article_id
JOIN work_batches wb ON wb.id = ba.batch_id
ORDER BY cl.batch_article_id, cl.dimension_id, cl.created_at DESC;


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 12: FUNCIONES HELPER
-- ═══════════════════════════════════════════════════════════════════════

-- Status calculado de un artículo en un lote (el peor status gana)
CREATE OR REPLACE FUNCTION get_batch_article_status(p_batch_article_id UUID)
RETURNS classification_status AS $$
  SELECT COALESCE(
    (SELECT status FROM v_current_classifications
     WHERE batch_article_id = p_batch_article_id
     ORDER BY
       CASE status
         WHEN 'disputed' THEN 1
         WHEN 'contested' THEN 2
         WHEN 'pending' THEN 3
         WHEN 'classified' THEN 4
         WHEN 'reconciled' THEN 5
         WHEN 'validated' THEN 6
       END
     LIMIT 1),
    'pending'::classification_status
  );
$$ LANGUAGE sql STABLE;

-- Status calculado de un lote completo
CREATE OR REPLACE FUNCTION get_batch_status_summary(p_batch_id UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'total_articles', COUNT(DISTINCT ba.article_id),
    'total_dimensions', COUNT(*),
    'by_prep_status', jsonb_build_object(
      'raw', COUNT(DISTINCT ba.article_id) FILTER (WHERE ba.prep_status = 'raw'),
      'translated', COUNT(DISTINCT ba.article_id) FILTER (WHERE ba.prep_status = 'translated'),
      'summarized', COUNT(DISTINCT ba.article_id) FILTER (WHERE ba.prep_status = 'summarized'),
      'ready', COUNT(DISTINCT ba.article_id) FILTER (WHERE ba.prep_status = 'ready')
    ),
    'by_classification_status', jsonb_build_object(
      'pending', COUNT(*) FILTER (WHERE vcc.status = 'pending' OR vcc.status IS NULL),
      'classified', COUNT(*) FILTER (WHERE vcc.status = 'classified'),
      'validated', COUNT(*) FILTER (WHERE vcc.status = 'validated'),
      'contested', COUNT(*) FILTER (WHERE vcc.status = 'contested'),
      'reconciled', COUNT(*) FILTER (WHERE vcc.status = 'reconciled'),
      'disputed', COUNT(*) FILTER (WHERE vcc.status = 'disputed')
    ),
    'is_complete', BOOL_AND(COALESCE(vcc.is_final, false)),
    'is_sealed', EXISTS (SELECT 1 FROM batch_seals bs WHERE bs.batch_id = p_batch_id)
  )
  FROM batch_articles ba
  LEFT JOIN v_current_classifications vcc ON vcc.batch_article_id = ba.id
  WHERE ba.batch_id = p_batch_id;
$$ LANGUAGE sql STABLE;

-- Recalcular status del lote basándose en el estado real
CREATE OR REPLACE FUNCTION refresh_batch_work_status(p_batch_id UUID)
RETURNS batch_work_status AS $$
DECLARE
  v_summary JSONB;
  v_new_status batch_work_status;
BEGIN
  v_summary := get_batch_status_summary(p_batch_id);

  IF (v_summary->>'is_sealed')::boolean THEN
    v_new_status := 'sealed';
  ELSIF (v_summary->>'is_complete')::boolean THEN
    v_new_status := 'completed';
  ELSIF (v_summary->'by_classification_status'->>'reconciled')::int > 0
     OR (v_summary->'by_classification_status'->>'disputed')::int > 0 THEN
    v_new_status := 'review_reconciliation';
  ELSIF (v_summary->'by_classification_status'->>'contested')::int > 0 THEN
    v_new_status := 'reconciling';
  ELSIF (v_summary->'by_classification_status'->>'validated')::int > 0
     OR (v_summary->'by_classification_status'->>'classified')::int > 0 THEN
    v_new_status := 'reviewing';
  ELSIF (v_summary->'by_prep_status'->>'raw')::int > 0
    AND (v_summary->'by_prep_status'->>'ready')::int > 0 THEN
    v_new_status := 'translating';
  ELSE
    v_new_status := 'pending';
  END IF;

  UPDATE work_batches
  SET status = v_new_status, status_updated_at = now()
  WHERE id = p_batch_id AND status IS DISTINCT FROM v_new_status;

  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 13: FUNCIONES DE HASHING CRIPTOGRÁFICO
-- ═══════════════════════════════════════════════════════════════════════

-- Generar SHA-256 de un registro del ledger
CREATE OR REPLACE FUNCTION generate_ledger_hash(
  p_batch_article_id UUID,
  p_article_id UUID,
  p_dimension_id UUID,
  p_iteration SMALLINT,
  p_classifier_role classifier_role,
  p_classification_value TEXT,
  p_rationale TEXT,
  p_confidence_level SMALLINT,
  p_created_at TIMESTAMPTZ
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    sha256(
      convert_to(
        COALESCE(p_batch_article_id::text, '') || '|' ||
        COALESCE(p_article_id::text, '') || '|' ||
        COALESCE(p_dimension_id::text, '') || '|' ||
        COALESCE(p_iteration::text, '') || '|' ||
        COALESCE(p_classifier_role::text, '') || '|' ||
        COALESCE(p_classification_value, '') || '|' ||
        COALESCE(p_rationale, '') || '|' ||
        COALESCE(p_confidence_level::text, '') || '|' ||
        COALESCE(p_created_at::text, ''),
        'UTF8'
      )
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Obtener el hash anterior en la cadena (article_id, dimension_id)
CREATE OR REPLACE FUNCTION get_previous_hash(
  p_article_id UUID,
  p_dimension_id UUID
) RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT record_hash
    FROM classification_ledger
    WHERE article_id = p_article_id
      AND dimension_id = p_dimension_id
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Generar Merkle root para un lote completo (usado en sellado)
CREATE OR REPLACE FUNCTION generate_batch_merkle_root(p_batch_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_hashes TEXT[];
  v_combined TEXT;
BEGIN
  SELECT ARRAY_AGG(record_hash ORDER BY created_at)
  INTO v_hashes
  FROM classification_ledger cl
  JOIN batch_articles ba ON ba.id = cl.batch_article_id
  WHERE ba.batch_id = p_batch_id;

  v_combined := array_to_string(v_hashes, '|');

  RETURN encode(sha256(convert_to(v_combined, 'UTF8')), 'hex');
END;
$$ LANGUAGE plpgsql STABLE;


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 14: VISTAS MATERIALIZADAS (Analytics)
-- ═══════════════════════════════════════════════════════════════════════

-- 14.1 mv_current_classifications — Estado actual por artículo/dimensión
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_classifications AS
SELECT DISTINCT ON (cl.batch_article_id, cl.dimension_id)
  cl.batch_article_id,
  cl.article_id,
  cl.dimension_id,
  ba.batch_id,
  wb.phase_id,
  cl.iteration,
  cl.classifier_role,
  cl.classification_value,
  cl.confidence_level,
  cl.status,
  cl.is_final,
  cl.is_serendipity,
  cl.record_hash,
  cl.created_at
FROM classification_ledger cl
JOIN batch_articles ba ON ba.id = cl.batch_article_id
JOIN work_batches wb ON wb.id = ba.batch_id
ORDER BY cl.batch_article_id, cl.dimension_id, cl.created_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_current_ba_dim
  ON mv_current_classifications(batch_article_id, dimension_id);
CREATE INDEX IF NOT EXISTS idx_mv_current_phase
  ON mv_current_classifications(phase_id);
CREATE INDEX IF NOT EXISTS idx_mv_current_status
  ON mv_current_classifications(status);

-- 14.2 mv_batch_progress — Progreso por lote
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_batch_progress AS
SELECT
  wb.id as batch_id,
  wb.phase_id,
  wb.batch_number,
  wb.assigned_to,
  wb.status as work_status,
  COUNT(DISTINCT ba.article_id) as total_articles,
  jsonb_build_object(
    'pending', COUNT(*) FILTER (WHERE mcc.status = 'pending'),
    'classified', COUNT(*) FILTER (WHERE mcc.status = 'classified'),
    'validated', COUNT(*) FILTER (WHERE mcc.status = 'validated'),
    'contested', COUNT(*) FILTER (WHERE mcc.status = 'contested'),
    'reconciled', COUNT(*) FILTER (WHERE mcc.status = 'reconciled'),
    'disputed', COUNT(*) FILTER (WHERE mcc.status = 'disputed')
  ) as status_counts,
  BOOL_AND(mcc.is_final) as is_complete,
  EXISTS (SELECT 1 FROM batch_seals bs WHERE bs.batch_id = wb.id) as is_sealed
FROM work_batches wb
JOIN batch_articles ba ON ba.batch_id = wb.id
LEFT JOIN mv_current_classifications mcc ON mcc.batch_article_id = ba.id
GROUP BY wb.id, wb.phase_id, wb.batch_number, wb.assigned_to, wb.status;

-- 14.3 mv_friction_metrics — Métricas de fricción (§5.7)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_friction_metrics AS
SELECT
  wb.phase_id,
  cl.dimension_id,
  cd.name as dimension_name,
  COUNT(DISTINCT cl.article_id) as total_classified,
  COUNT(DISTINCT cl.article_id) FILTER (
    WHERE cl.iteration >= 2
  ) as with_disagreement,
  COUNT(DISTINCT cl.article_id) FILTER (
    WHERE cl.iteration = 3
  ) as required_reconciliation,
  COUNT(DISTINCT cl.article_id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM classification_ledger cl2
      WHERE cl2.article_id = cl.article_id
        AND cl2.dimension_id = cl.dimension_id
        AND cl2.status = 'disputed'
    )
  ) as disputed_count,
  ROUND(100.0 *
    COUNT(DISTINCT cl.article_id) FILTER (WHERE cl.iteration >= 2) /
    NULLIF(COUNT(DISTINCT cl.article_id), 0), 1
  ) as friction_rate_pct
FROM classification_ledger cl
JOIN batch_articles ba ON ba.id = cl.batch_article_id
JOIN work_batches wb ON wb.id = ba.batch_id
JOIN classification_dimensions cd ON cd.id = cl.dimension_id
WHERE cl.iteration = 1
GROUP BY wb.phase_id, cl.dimension_id, cd.name;

-- 14.4 mv_serendipity_analysis — Análisis de serendipia (§5.8)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_serendipity_analysis AS
SELECT
  wb.phase_id,
  cp.name as phase_name,
  cl.dimension_id,
  cd.name as dimension_name,
  cl.classification_value,
  COUNT(*) as occurrence_count,
  ROUND(100.0 * COUNT(*) /
    NULLIF(SUM(COUNT(*)) OVER (PARTITION BY wb.phase_id, cl.dimension_id), 0), 1
  ) as serendipity_rate_pct,
  ARRAY_AGG(DISTINCT cl.article_id) as article_ids
FROM classification_ledger cl
JOIN batch_articles ba ON ba.id = cl.batch_article_id
JOIN work_batches wb ON wb.id = ba.batch_id
JOIN classification_phases cp ON cp.id = wb.phase_id
JOIN classification_dimensions cd ON cd.id = cl.dimension_id
WHERE cl.is_serendipity = true
  AND cl.is_final = true
GROUP BY wb.phase_id, cp.name, cl.dimension_id, cd.name, cl.classification_value;

-- 14.5 mv_cost_tracking — Economía de la investigación (§4.7)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cost_tracking AS
SELECT
  wb.phase_id,
  cp.name as phase_name,
  mc.provider,
  mc.model_name,
  COUNT(*) as total_api_calls,
  SUM(cl.api_cost_usd) as total_cost_usd,
  AVG(cl.api_latency_ms) as avg_latency_ms,
  MIN(cl.created_at) as first_call,
  MAX(cl.created_at) as last_call
FROM classification_ledger cl
JOIN batch_articles ba ON ba.id = cl.batch_article_id
JOIN work_batches wb ON wb.id = ba.batch_id
JOIN classification_phases cp ON cp.id = wb.phase_id
LEFT JOIN model_configs mc ON mc.id = cl.model_config_id
WHERE cl.classifier_role = 'ai'
GROUP BY wb.phase_id, cp.name, mc.provider, mc.model_name;

-- Función para refrescar todas las vistas materializadas
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_current_classifications;
  REFRESH MATERIALIZED VIEW mv_batch_progress;
  REFRESH MATERIALIZED VIEW mv_friction_metrics;
  REFRESH MATERIALIZED VIEW mv_serendipity_analysis;
  REFRESH MATERIALIZED VIEW mv_cost_tracking;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════
-- SECCIÓN 15: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- classification_phases
ALTER TABLE classification_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classification_phases: lectura autenticados"
  ON classification_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "classification_phases: inserción autenticados"
  ON classification_phases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "classification_phases: actualización autenticados"
  ON classification_phases FOR UPDATE
  USING (auth.role() = 'authenticated');

-- classification_dimensions
ALTER TABLE classification_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classification_dimensions: lectura autenticados"
  ON classification_dimensions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "classification_dimensions: inserción autenticados"
  ON classification_dimensions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- dimension_options
ALTER TABLE dimension_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dimension_options: lectura autenticados"
  ON dimension_options FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "dimension_options: inserción autenticados"
  ON dimension_options FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- dimension_questions
ALTER TABLE dimension_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dimension_questions: lectura autenticados"
  ON dimension_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "dimension_questions: inserción autenticados"
  ON dimension_questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- dimension_examples
ALTER TABLE dimension_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dimension_examples: lectura autenticados"
  ON dimension_examples FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "dimension_examples: inserción autenticados"
  ON dimension_examples FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- phase_article_universe
ALTER TABLE phase_article_universe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phase_article_universe: lectura autenticados"
  ON phase_article_universe FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "phase_article_universe: inserción autenticados"
  ON phase_article_universe FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- work_batches
ALTER TABLE work_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_batches: lectura autenticados"
  ON work_batches FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "work_batches: inserción autenticados"
  ON work_batches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "work_batches: actualización status"
  ON work_batches FOR UPDATE
  USING (auth.role() = 'authenticated');

-- batch_articles
ALTER TABLE batch_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_articles: lectura autenticados"
  ON batch_articles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "batch_articles: inserción autenticados"
  ON batch_articles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "batch_articles: actualización prep_status"
  ON batch_articles FOR UPDATE
  USING (auth.role() = 'authenticated');

-- classification_ledger — SOLO INSERT + SELECT
ALTER TABLE classification_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classification_ledger: lectura autenticados"
  ON classification_ledger FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "classification_ledger: inserción autenticados"
  ON classification_ledger FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
-- NO HAY POLICY PARA UPDATE
-- NO HAY POLICY PARA DELETE

-- model_configs
ALTER TABLE model_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_configs: lectura autenticados"
  ON model_configs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "model_configs: inserción autenticados"
  ON model_configs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- prompt_snapshots
ALTER TABLE prompt_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_snapshots: lectura autenticados"
  ON prompt_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prompt_snapshots: inserción autenticados"
  ON prompt_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- calibration_records
ALTER TABLE calibration_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calibration_records: lectura autenticados"
  ON calibration_records FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "calibration_records: inserción autenticados"
  ON calibration_records FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- batch_seals
ALTER TABLE batch_seals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_seals: lectura autenticados"
  ON batch_seals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "batch_seals: inserción autenticados"
  ON batch_seals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- certified_exports
ALTER TABLE certified_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certified_exports: lectura autenticados"
  ON certified_exports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "certified_exports: inserción autenticados"
  ON certified_exports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════════════
-- FIN DEL SPRINT 0
-- ═══════════════════════════════════════════════════════════════════════
-- Tablas creadas:    14
-- Enums creados:      6
-- Vistas regulares:   1 (v_current_classifications)
-- Vistas mat.:        5 (mv_current/progress/friction/serendipity/cost)
-- Funciones:          7 (helpers + hashing + refresh)
-- Triggers:           3 (append-only + sellado)
-- Índices:            8 (ledger) + 3 (materialized views)
-- RLS policies:      26
-- ═══════════════════════════════════════════════════════════════════════
