-- Fix RLS para users_profiles - Versión 2 (sin recursión infinita)
-- Fecha: 2026-03-06
-- Problema: Recursión infinita en políticas RLS

-- Primero, eliminar TODAS las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Users can read own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users_profiles;

-- Asegurar que RLS está habilitado
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- Política simple para SELECT (lectura)
-- Solo permite leer el propio perfil
CREATE POLICY "users_profiles_select_policy"
ON users_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política simple para INSERT (creación)
-- Solo permite crear el propio perfil
CREATE POLICY "users_profiles_insert_policy"
ON users_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política simple para UPDATE (actualización)
-- Solo permite actualizar el propio perfil
CREATE POLICY "users_profiles_update_policy"
ON users_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política simple para DELETE (eliminación)
-- Solo permite eliminar el propio perfil
CREATE POLICY "users_profiles_delete_policy"
ON users_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
