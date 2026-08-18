-- 📍 supabase/migrations/20260817_user_api_keys_byok.sql
-- BYOK (Bring Your Own Key) DeepSeek para preclasificación.
--
-- Cada investigador puede guardar su propia API key de DeepSeek desde
-- /personal/configuracion. Se persiste encriptada (pgcrypto) y nunca en
-- texto plano. El secreto de encriptación vive en el env var
-- API_KEYS_ENCRYPTION_SECRET (server-only, nunca en la BD ni en el cliente).
--
-- Ver docs/preclasificacion-auditoria-funcional/05_Requerimiento_BYOK_DeepSeek.md
--
-- ADITIVA · IDEMPOTENTE · NO destructiva. Aplicar a mano en Studio.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      text NOT NULL CHECK (provider IN ('deepseek')),
  encrypted_key bytea NOT NULL,
  -- Últimos 4 caracteres de la key en texto plano, solo para mostrar en UI
  -- ("...a3f9") sin tener que desencriptar. No es sensible por sí solo.
  key_last4     text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- RLS: cada usuario solo ve y modifica su propia key. Estricta desde el
-- inicio (no transicional) porque es una tabla de secretos personales, no
-- de datos de proyecto compartido.
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_api_keys_select_own" ON user_api_keys;
CREATE POLICY "user_api_keys_select_own" ON user_api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_api_keys_insert_own" ON user_api_keys;
CREATE POLICY "user_api_keys_insert_own" ON user_api_keys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_api_keys_update_own" ON user_api_keys;
CREATE POLICY "user_api_keys_update_own" ON user_api_keys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_api_keys_delete_own" ON user_api_keys;
CREATE POLICY "user_api_keys_delete_own" ON user_api_keys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RPCs de encriptación ──────────────────────────────────────────────────────
-- Wrappers puros sobre pgcrypto. No tocan tablas, así que no necesitan
-- SECURITY DEFINER: el secreto viaja como parámetro en cada llamada desde
-- el servidor (API_KEYS_ENCRYPTION_SECRET), nunca se guarda en la BD.
CREATE OR REPLACE FUNCTION encrypt_api_key(p_plain text, p_secret text)
RETURNS bytea
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT pgp_sym_encrypt(p_plain, p_secret);
$$;

CREATE OR REPLACE FUNCTION decrypt_api_key(p_encrypted bytea, p_secret text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT pgp_sym_decrypt(p_encrypted, p_secret);
$$;

GRANT EXECUTE ON FUNCTION encrypt_api_key(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION decrypt_api_key(bytea, text) TO authenticated, service_role;
