-- 📍 supabase/migrations/20260618_cgt_artefactos_direcciones_resueltas.sql
-- Fase 3 (visor MDJ): marcador de "direcciones ya resueltas" por artefacto.
--
-- Permite saber si las direcciones MDJ de un artefacto ya fueron computadas y
-- persistidas (cgt_menciones_direcciones), para:
--   - que el lazy legacy corra UNA sola vez (aunque haya 0 matches),
--   - mostrar en la UI un "✓ normalizado".
-- El resolver lo setea a now() al terminar; `asegurarDireccionesArtefacto`
-- chequea este campo (no el conteo de filas).
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio.

ALTER TABLE cgt_artefactos
  ADD COLUMN IF NOT EXISTS direcciones_resueltas_at timestamptz;
