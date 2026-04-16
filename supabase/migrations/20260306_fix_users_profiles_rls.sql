-- Fix RLS para users_profiles
-- Fecha: 2026-03-06
-- Problema: Error 500 al consultar users_profiles

-- Asegurar que RLS está habilitado
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si hay conflicto y recrearla
DROP POLICY IF EXISTS "Users can read own profile" ON users_profiles;

-- Crear política para que usuarios puedan leer su propio perfil
CREATE POLICY "Users can read own profile"
ON users_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Política para que usuarios puedan actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON users_profiles;

CREATE POLICY "Users can update own profile"
ON users_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para que usuarios puedan insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profiles;

CREATE POLICY "Users can insert own profile"
ON users_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Verificar que la tabla existe y tiene la estructura correcta
DO $$
BEGIN
  -- Verificar que las columnas críticas existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profiles' AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'Column user_id does not exist in users_profiles';
  END IF;
END $$;
