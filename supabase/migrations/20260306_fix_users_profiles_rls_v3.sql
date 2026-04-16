-- Fix RLS para users_profiles - Versión 3 (limpieza completa)
-- Fecha: 2026-03-06
-- Problema: Recursión infinita en políticas RLS

-- Deshabilitar RLS temporalmente para limpiar
ALTER TABLE users_profiles DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes (sin importar el nombre)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users_profiles', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS nuevamente
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples y claras
CREATE POLICY "users_profiles_select_policy"
ON users_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_profiles_insert_policy"
ON users_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_profiles_update_policy"
ON users_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_profiles_delete_policy"
ON users_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'users_profiles';
    
    IF policy_count != 4 THEN
        RAISE EXCEPTION 'Expected 4 policies but found %', policy_count;
    END IF;
    
    RAISE NOTICE 'Successfully created % RLS policies for users_profiles', policy_count;
END $$;
