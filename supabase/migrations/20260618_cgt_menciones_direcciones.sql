-- 📍 supabase/migrations/20260618_cgt_menciones_direcciones.sql
-- Fase 3 (visor MDJ): direcciones MDJ persistidas de cada mención.
--
-- Guarda DÓNDE aparece cada mención (entidad o cita) dentro de un documento de
-- texto del artefacto, como dirección del árbol MDJ (`nodo_id` + offsets). Se
-- computa una sola vez (al ejecutar el Cartografiador para los nuevos, o lazy
-- al abrir para los legacy) con un matcher robusto, y el visor la lee en vez de
-- re-buscar el texto en cada render (resuelve las citas largas).
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio tras revisar.
-- Una fila por OCURRENCIA (una entidad puede aparecer varias veces por documento).

CREATE TABLE IF NOT EXISTS cgt_menciones_direcciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artefacto_id  uuid NOT NULL REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
  -- Tipo de mención + id de la fila en cgt_<tipo>_menciones. Polimórfico: sin
  -- FK estricta (apunta a 5 tablas distintas según tipo_mencion).
  tipo_mencion  text NOT NULL CHECK (tipo_mencion IN ('pensador','concepto','teoria','disciplina','cita')),
  mencion_id    uuid NOT NULL,
  -- Documento de texto del artefacto donde cae la dirección.
  documento     text NOT NULL CHECK (documento IN ('cronica','destilado','nucleo','germinal','original')),
  -- Dirección MDJ: id determinista del nodo + offsets dentro de su texto_plano.
  nodo_id       text NOT NULL,
  offset_inicio integer NOT NULL,
  offset_fin    integer NOT NULL,
  origen        text NOT NULL DEFAULT 'llm' CHECK (origen IN ('llm','humano')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Lectura del visor: por artefacto + documento.
CREATE INDEX IF NOT EXISTS idx_cgt_menciones_direcciones_art_doc
  ON cgt_menciones_direcciones (artefacto_id, documento);

-- Evita filas duplicadas exactas al re-resolver (el resolver igual hace
-- delete+insert por artefacto, pero esto protege ante carreras).
CREATE UNIQUE INDEX IF NOT EXISTS uq_cgt_menciones_direcciones_ocurrencia
  ON cgt_menciones_direcciones (artefacto_id, documento, tipo_mencion, mencion_id, nodo_id, offset_inicio);

-- RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE cgt_menciones_direcciones ENABLE ROW LEVEL SECURITY;

-- Políticas TRANSICIONALES (mismo criterio que cog_artifact_pages en V2): se
-- permite a `authenticated` y la app filtra/resuelve por proyecto en cada query
-- (las server actions ya validan el proyecto del artefacto antes de escribir).
-- 👉 RECOMENDADO: ajustar en Studio para espejar las policies de membresía de
--    `cgt_pensadores_menciones` (project_members) si se quiere RLS estricta.
DROP POLICY IF EXISTS "cgt_md_select" ON cgt_menciones_direcciones;
CREATE POLICY "cgt_md_select" ON cgt_menciones_direcciones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cgt_md_insert" ON cgt_menciones_direcciones;
CREATE POLICY "cgt_md_insert" ON cgt_menciones_direcciones
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cgt_md_delete" ON cgt_menciones_direcciones;
CREATE POLICY "cgt_md_delete" ON cgt_menciones_direcciones
  FOR DELETE TO authenticated USING (true);
