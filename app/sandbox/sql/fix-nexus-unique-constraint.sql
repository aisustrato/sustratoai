-- 📍 app/sandbox/sql/fix-nexus-unique-constraint.sql
-- 🔧 Fix: Añadir constraint UNIQUE faltante en nexus_nodes
-- Ejecutar en Supabase SQL Editor

-- Añadir UNIQUE constraint para permitir upsert por (project_id, slug)
ALTER TABLE nexus_nodes 
ADD CONSTRAINT nexus_nodes_project_slug_unique 
UNIQUE (project_id, slug);

-- Verificar que se creó
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'nexus_nodes' 
  AND tc.constraint_type = 'UNIQUE';
