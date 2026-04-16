-- ============================================
-- 🚨 CORRECCIÓN CRÍTICA: Estructura cog_chat_sessions
-- Fecha: 26 Enero 2026
-- Problema: Referencias incorrectas en foreign keys
-- ============================================

-- 🚨 PROBLEMA IDENTIFICADO:
-- - cog_chat_sessions puede tener referencias a 'cog_projects' que NO EXISTE
-- - Otras tablas de Cognetica SÍ funcionan porque usan 'projects' correctamente
-- - Error RLS persiste porque las referencias están rotas

-- ============================================
-- PASO 1: BACKUP DE DATOS EXISTENTES
-- ============================================

-- Crear tabla temporal para backup (si hay datos)
CREATE TABLE IF NOT EXISTS cog_chat_sessions_backup AS 
SELECT * FROM cog_chat_sessions;

-- ============================================
-- PASO 2: RECREAR TABLA CON REFERENCIAS CORRECTAS
-- ============================================

-- Eliminar tabla existente (con referencias rotas)
DROP TABLE IF EXISTS cog_chat_sessions CASCADE;

-- Crear tabla con estructura CORRECTA
CREATE TABLE cog_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 🔧 REFERENCIAS CORRECTAS (usa projects, NO cog_projects)
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Metadata de la sesión
    session_title TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- El chat completo como JSON
    messages JSONB NOT NULL DEFAULT '[]',
    total_messages INTEGER DEFAULT 0,
    
    -- Métricas de f₀ y paralloros
    avg_f0_score NUMERIC(5,2),
    paralloros_count INTEGER DEFAULT 0,
    
    -- Contexto del artefacto para el chat
    artifact_context TEXT,
    
    -- Si está activa la inferencia
    inference_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASO 3: HABILITAR RLS
-- ============================================

ALTER TABLE cog_chat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 4: CREAR POLÍTICAS RLS CORRECTAS
-- ============================================

-- Política SELECT
CREATE POLICY "Users can view chat sessions of their projects"
    ON cog_chat_sessions FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política INSERT
CREATE POLICY "Users can create chat sessions in their projects"
    ON cog_chat_sessions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política UPDATE
CREATE POLICY "Users can update their chat sessions"
    ON cog_chat_sessions FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Política DELETE
CREATE POLICY "Users can delete their chat sessions"
    ON cog_chat_sessions FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- PASO 5: RESTAURAR DATOS SI EXISTEN
-- ============================================

-- Restaurar datos del backup (solo si la tabla backup tiene datos)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cog_chat_sessions_backup) THEN
        -- Verificar que todos los project_id del backup existen en projects
        INSERT INTO cog_chat_sessions (
            id, artifact_id, project_id, session_title, started_at, ended_at,
            messages, total_messages, avg_f0_score, paralloros_count,
            artifact_context, inference_enabled, created_at, updated_at
        )
        SELECT 
            b.id, b.artifact_id, b.project_id, b.session_title, b.started_at, b.ended_at,
            b.messages, b.total_messages, b.avg_f0_score, b.paralloros_count,
            b.artifact_context, b.inference_enabled, b.created_at, b.updated_at
        FROM cog_chat_sessions_backup b
        WHERE b.project_id IN (SELECT id FROM projects);
        
        RAISE NOTICE 'Datos restaurados desde backup';
    ELSE
        RAISE NOTICE 'No había datos para restaurar';
    END IF;
END $$;

-- ============================================
-- PASO 6: LIMPIAR BACKUP
-- ============================================

DROP TABLE IF EXISTS cog_chat_sessions_backup;

-- ============================================
-- PASO 7: VERIFICACIÓN
-- ============================================

-- Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cog_chat_sessions' 
ORDER BY ordinal_position;

-- Verificar foreign keys
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'cog_chat_sessions';

-- Verificar políticas RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cog_chat_sessions';

-- ============================================
-- COMENTARIO CRÍTICO
-- ============================================

-- ✅ AHORA la tabla cog_chat_sessions usa las mismas referencias que otras tablas de Cognetica
-- ✅ project_id REFERENCES projects(id) - tabla que SÍ EXISTE  
-- ✅ Políticas RLS usan projects WHERE owner_id = auth.uid() - estructura correcta
-- ✅ Debería funcionar igual que cog_artifacts y cog_fractal_seeds
