-- Migration: Agregar columna `origen` a cgt_citas_menciones
--
-- Permite distinguir el origen de cada mención de cita:
--   - 'llm'    → extraída por el pipeline (Destilado / extractor)
--   - 'humano' → creada manualmente por un humano (ej. desde el visor de audio)
--
-- El enum cgt_origen ya existe en el esquema (llm | humano | nodo | sistema),
-- por lo que no hace falta crearlo.
--
-- Aditiva y NO destructiva: las filas existentes (todas provienen del pipeline)
-- quedan con el default 'llm'. Idempotente (IF NOT EXISTS) para poder re-correr.

ALTER TABLE cgt_citas_menciones
  ADD COLUMN IF NOT EXISTS origen cgt_origen NOT NULL DEFAULT 'llm';
