-- 🔐 FIX: Políticas RLS Simples para Nexus
-- 📅 Ejecutar en Supabase SQL Editor
-- 🎯 Sigue el mismo patrón que el resto del proyecto: auth.role() = 'authenticated'

-- ============================================
-- 1️⃣ ELIMINAR POLÍTICAS COMPLEJAS EXISTENTES
-- ============================================

-- Tags
DROP POLICY IF EXISTS "nexus_tags_select" ON nexus_pattern_tags;
DROP POLICY IF EXISTS "nexus_tags_insert" ON nexus_pattern_tags;

-- Nodos
DROP POLICY IF EXISTS "nexus_nodes_select" ON nexus_nodes;
DROP POLICY IF EXISTS "nexus_nodes_insert" ON nexus_nodes;

-- Node Tags
DROP POLICY IF EXISTS "nexus_node_tags_select" ON nexus_node_tags;
DROP POLICY IF EXISTS "nexus_node_tags_insert" ON nexus_node_tags;

-- Isomorfismos
DROP POLICY IF EXISTS "nexus_iso_select" ON nexus_isomorphisms;
DROP POLICY IF EXISTS "nexus_iso_insert" ON nexus_isomorphisms;

-- Conexiones
DROP POLICY IF EXISTS "nexus_iso_conn_select" ON nexus_isomorphism_connections;
DROP POLICY IF EXISTS "nexus_iso_conn_insert" ON nexus_isomorphism_connections;

-- Calibraciones
DROP POLICY IF EXISTS "nexus_calibrations_select" ON nexus_calibrations;
DROP POLICY IF EXISTS "nexus_calibrations_insert" ON nexus_calibrations;

-- Chats
DROP POLICY IF EXISTS "nexus_chats_select" ON nexus_calibration_chats;
DROP POLICY IF EXISTS "nexus_chats_insert" ON nexus_calibration_chats;

-- Mensajes
DROP POLICY IF EXISTS "nexus_messages_select" ON nexus_chat_messages;
DROP POLICY IF EXISTS "nexus_messages_insert" ON nexus_chat_messages;

-- ============================================
-- 2️⃣ CREAR POLÍTICAS SIMPLES (mismo patrón que projects/articles)
-- ============================================

-- nexus_pattern_tags: acceso completo para usuarios autenticados del proyecto
CREATE POLICY "Enable all for authenticated" ON nexus_pattern_tags 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_nodes: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_nodes 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_node_tags: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_node_tags 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_isomorphisms: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_isomorphisms 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_isomorphism_connections: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_isomorphism_connections 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_calibrations: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_calibrations 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_calibration_chats: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_calibration_chats 
FOR ALL USING (auth.role() = 'authenticated');

-- nexus_chat_messages: acceso completo para usuarios autenticados
CREATE POLICY "Enable all for authenticated" ON nexus_chat_messages 
FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- ✅ VERIFICACIÓN
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename LIKE 'nexus_%'
ORDER BY tablename;
