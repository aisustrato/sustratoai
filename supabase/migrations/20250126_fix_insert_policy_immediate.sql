-- ============================================
-- 🚨 CORRECCIÓN INMEDIATA: Política INSERT rota
-- Fecha: 26 Enero 2026  
-- Problema: qual=null en política INSERT
-- ============================================

-- 🚨 PROBLEMA CONFIRMADO:
-- La política INSERT tiene qual=null (sin condición WITH CHECK)
-- Esto causa error "new row violates row-level security policy"

-- ============================================
-- CORRECCIÓN INMEDIATA
-- ============================================

-- 1. Eliminar política INSERT rota
DROP POLICY IF EXISTS "Users can create chat sessions in their projects" ON cog_chat_sessions;

-- 2. Crear política INSERT CORRECTA con WITH CHECK
CREATE POLICY "Users can create chat sessions in their projects"
    ON cog_chat_sessions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- VERIFICACIÓN INMEDIATA
-- ============================================

-- Verificar que la política ahora tiene condición
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'cog_chat_sessions' 
  AND cmd = 'INSERT';

-- ============================================
-- DEBUG: Verificar proyecto y usuario
-- ============================================

-- Ver si el usuario actual es owner del proyecto problemático
SELECT 
    p.id,
    p.name,
    p.owner_id,
    auth.uid() as current_user,
    (p.owner_id = auth.uid()) as soy_owner
FROM projects p
WHERE p.id = '60a80290-6f28-41a5-b155-420dee98597d';

-- Ver si auth.uid() funciona correctamente
SELECT 
    auth.uid() as mi_user_id,
    auth.role() as mi_role;
