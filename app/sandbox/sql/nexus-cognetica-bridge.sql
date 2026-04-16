-- ============================================
-- 🌉 PUENTE COGNÉTICA ↔ NEXUS
-- ============================================
-- Unificación de módulos bajo patrón "Mud Pit → Notary"
-- 
-- FILOSOFÍA:
-- - Cognética = MOTOR (procesa, extrae, propone)
-- - Nexus = MAPA (canoniza, versiona, publica)
-- 
-- El humano deposita en "mud_pit", el sistema procesa,
-- la IA propone, y solo lo validado asciende a Nexus.
--
-- 🌊🎼🐍 Colectivo NOSOTR_S | Diciembre 2025
-- ============================================

-- ============================================
-- 🏗️ PARTE 1: MUD PIT (Zona de Aterrizaje)
-- ============================================
-- Acepta entrada sucia de múltiples fuentes:
-- - Chats, URLs, PDFs, audio transcrito, import JSON
-- Todo pasa por aquí antes de canonizarse

CREATE TABLE IF NOT EXISTS nexus_mud_pit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto del proyecto (soporta legacy y nuevo)
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    cog_project_id UUID REFERENCES cog_projects(id) ON DELETE CASCADE,
    -- Al menos uno debe existir
    CONSTRAINT mud_pit_has_project CHECK (project_id IS NOT NULL OR cog_project_id IS NOT NULL),
    
    -- Quién depositó esto
    deposited_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Fuente del contenido
    source_type TEXT NOT NULL CHECK (source_type IN (
        'chat',           -- Mensaje de chat (Cognética o Nexus)
        'audio',          -- Transcripción de audio
        'document',       -- PDF, documento
        'url',            -- Contenido de URL
        'json_import',    -- Import masivo JSON
        'ai_extraction',  -- Extracción automática de IA
        'manual'          -- Entrada manual del usuario
    )),
    
    -- Referencia al origen (opcional)
    source_artifact_id UUID REFERENCES cog_artifacts(id) ON DELETE SET NULL,
    source_chat_session_id UUID REFERENCES cog_chat_sessions(id) ON DELETE SET NULL,
    source_calibration_id UUID REFERENCES nexus_calibrations(id) ON DELETE SET NULL,
    
    -- Contenido crudo
    raw_content JSONB NOT NULL,  -- El dato como llegó
    -- Estructura esperada: {
    --   title: string,
    --   description: string,
    --   suggested_type: 'node' | 'isomorphism' | 'tag',
    --   suggested_maturity: 'seed_green' | 'seed_purple' | etc,
    --   metadata: {...cualquier cosa adicional}
    -- }
    
    -- Propuesta de la IA (se llena después del procesamiento)
    ai_proposal JSONB,  -- Lo que la IA sugiere crear
    ai_model TEXT,      -- Qué modelo procesó esto
    ai_confidence DECIMAL(3,2),  -- Confianza de la propuesta
    
    -- Estado del flujo
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Recién llegado, esperando proceso
        'incubating',   -- En cool-down (24h tras chat intenso)
        'processing',   -- IA procesando
        'proposed',     -- IA terminó, esperando revisión humana
        'canonized',    -- Convertido en nodo/isomorfismo de Nexus
        'rejected',     -- Descartado por humano o IA
        'archived'      -- Guardado pero no activo
    )),
    
    -- Control de incubación (cool-down)
    incubation_until TIMESTAMPTZ,  -- Hasta cuándo está en incubación
    incubation_reason TEXT,        -- Por qué está incubando
    
    -- Resultado de canonización
    canonized_as_type TEXT CHECK (canonized_as_type IN ('node', 'isomorphism', 'tag', 'calibration')),
    canonized_id UUID,             -- ID del elemento creado en Nexus
    canonized_at TIMESTAMPTZ,
    canonized_by UUID REFERENCES auth.users(id),
    
    -- Razón de rechazo (si aplica)
    rejection_reason TEXT,
    rejected_by UUID REFERENCES auth.users(id),
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Marcador legacy
    is_legacy_import BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mud_pit_project ON nexus_mud_pit(project_id);
CREATE INDEX IF NOT EXISTS idx_mud_pit_cog_project ON nexus_mud_pit(cog_project_id);
CREATE INDEX IF NOT EXISTS idx_mud_pit_status ON nexus_mud_pit(status);
CREATE INDEX IF NOT EXISTS idx_mud_pit_source ON nexus_mud_pit(source_type);
CREATE INDEX IF NOT EXISTS idx_mud_pit_incubation ON nexus_mud_pit(incubation_until) WHERE status = 'incubating';

-- ============================================
-- 🔗 PARTE 2: ENLACE COGNÉTICA → NEXUS
-- ============================================
-- Tabla de mapeo para elementos que existen en ambos sistemas

CREATE TABLE IF NOT EXISTS nexus_cognetica_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lado Cognética
    cog_element_type TEXT NOT NULL CHECK (cog_element_type IN (
        'seed', 'thinker', 'theory', 'stream', 'discipline', 'wormhole', 'quote'
    )),
    cog_element_id UUID NOT NULL,
    cog_project_id UUID REFERENCES cog_projects(id) ON DELETE CASCADE,
    
    -- Lado Nexus
    nexus_element_type TEXT NOT NULL CHECK (nexus_element_type IN (
        'node', 'isomorphism', 'tag', 'calibration'
    )),
    nexus_element_id UUID NOT NULL,
    nexus_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Metadata del enlace
    link_type TEXT DEFAULT 'derived' CHECK (link_type IN (
        'derived',     -- Nexus derivado de Cognética
        'referenced',  -- Nexus referencia a Cognética
        'merged'       -- Ambos fusionados
    )),
    
    link_confidence DECIMAL(3,2) DEFAULT 1.0,  -- 1.0 = enlace manual, <1.0 = sugerido por IA
    link_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(cog_element_type, cog_element_id, nexus_element_type, nexus_element_id)
);

CREATE INDEX IF NOT EXISTS idx_cog_links_cog ON nexus_cognetica_links(cog_element_type, cog_element_id);
CREATE INDEX IF NOT EXISTS idx_cog_links_nexus ON nexus_cognetica_links(nexus_element_type, nexus_element_id);

-- ============================================
-- 🕐 PARTE 3: CONTROL DE COOL-DOWN
-- ============================================
-- Gestiona el período de incubación de 24h

CREATE TABLE IF NOT EXISTS nexus_cooldown_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Puede ser de Cognética o Nexus
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    cog_project_id UUID REFERENCES cog_projects(id) ON DELETE CASCADE,
    
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Tipo de sesión que generó el cool-down
    session_type TEXT NOT NULL CHECK (session_type IN (
        'cog_chat',           -- Chat QUIPU de Cognética
        'nexus_calibration',  -- Chat de calibración de Nexus
        'intense_extraction'  -- Extracción intensiva de IA
    )),
    
    -- Referencia a la sesión
    session_id UUID,  -- ID del chat o calibración
    
    -- Conteo de interacciones
    message_count INTEGER DEFAULT 0,
    
    -- Control temporal
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cooldown_until TIMESTAMPTZ,  -- NOW() + 24 hours tras completar
    
    -- Estado
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cooling_down', 'ready')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooldown_user ON nexus_cooldown_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cooldown_until ON nexus_cooldown_sessions(cooldown_until) WHERE status = 'cooling_down';

-- Función para verificar si usuario está en cool-down
CREATE OR REPLACE FUNCTION user_is_in_cooldown(p_user_id UUID, p_project_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM nexus_cooldown_sessions
        WHERE user_id = p_user_id
        AND status = 'cooling_down'
        AND cooldown_until > NOW()
        AND (p_project_id IS NULL OR project_id = p_project_id OR cog_project_id IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para iniciar cool-down automáticamente tras 5 mensajes
CREATE OR REPLACE FUNCTION trigger_cooldown_on_chat_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el chat alcanzó 5 mensajes y se completó
    IF NEW.message_count >= 5 AND NEW.is_complete = TRUE AND OLD.is_complete = FALSE THEN
        -- Crear/actualizar sesión de cool-down
        INSERT INTO nexus_cooldown_sessions (
            project_id,
            user_id,
            session_type,
            session_id,
            message_count,
            completed_at,
            cooldown_until,
            status
        ) VALUES (
            NEW.project_id,
            NEW.user_id,
            'nexus_calibration',
            NEW.id,
            NEW.message_count,
            NOW(),
            NOW() + INTERVAL '24 hours',
            'cooling_down'
        );
        
        -- También incubar cualquier mud_pit pendiente de este usuario/proyecto
        UPDATE nexus_mud_pit
        SET status = 'incubating',
            incubation_until = NOW() + INTERVAL '24 hours',
            incubation_reason = 'Post-chat cool-down de 24 horas'
        WHERE deposited_by = NEW.user_id
          AND project_id = NEW.project_id
          AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a chats de calibración de Nexus
DROP TRIGGER IF EXISTS trg_cooldown_nexus_chat ON nexus_calibration_chats;
CREATE TRIGGER trg_cooldown_nexus_chat
    AFTER UPDATE ON nexus_calibration_chats
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cooldown_on_chat_complete();

-- ============================================
-- 🔄 PARTE 4: CAMPOS ADICIONALES PARA CALIBRACIONES
-- ============================================
-- Añadir métricas de Cognética a calibraciones existentes

-- Verificar si las columnas ya existen antes de añadirlas
DO $$
BEGIN
    -- Campo para dimensión fractal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nexus_calibrations' AND column_name = 'fractal_dimension') THEN
        ALTER TABLE nexus_calibrations ADD COLUMN fractal_dimension DECIMAL(5,3);
    END IF;
    
    -- Campo para coherencia ética
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nexus_calibrations' AND column_name = 'ethics_coherence_score') THEN
        ALTER TABLE nexus_calibrations ADD COLUMN ethics_coherence_score DECIMAL(3,2);
    END IF;
    
    -- Campo para referenciar análisis cognitivo origen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nexus_calibrations' AND column_name = 'source_cog_artifact_id') THEN
        ALTER TABLE nexus_calibrations ADD COLUMN source_cog_artifact_id UUID REFERENCES cog_artifacts(id) ON DELETE SET NULL;
    END IF;
    
    -- Campo para enlace a mud_pit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nexus_calibrations' AND column_name = 'source_mud_pit_id') THEN
        ALTER TABLE nexus_calibrations ADD COLUMN source_mud_pit_id UUID REFERENCES nexus_mud_pit(id) ON DELETE SET NULL;
    END IF;
END;
$$;

-- ============================================
-- 📊 PARTE 5: VISTA UNIFICADA (Legacy Compatibility)
-- ============================================
-- Vista que muestra entradas de ambos sistemas

CREATE OR REPLACE VIEW unified_inputs_view AS
-- Entradas del Mud Pit (sistema nuevo)
SELECT 
    'mud_pit' as source_system,
    mp.id,
    COALESCE(mp.project_id, mp.cog_project_id) as unified_project_id,
    mp.source_type,
    mp.raw_content->>'title' as title,
    mp.raw_content->>'description' as description,
    mp.raw_content->>'suggested_type' as suggested_type,
    mp.status,
    mp.is_legacy_import,
    mp.created_at,
    mp.deposited_by as user_id
FROM nexus_mud_pit mp

UNION ALL

-- Semillas de Cognética (legacy)
SELECT 
    'cog_seeds' as source_system,
    cs.id,
    cs.project_id as unified_project_id,
    'ai_extraction' as source_type,
    cs.content as title,
    cs.context as description,
    'node' as suggested_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM nexus_cognetica_links ncl WHERE ncl.cog_element_id = cs.id)
        THEN 'canonized'
        ELSE 'pending'
    END as status,
    TRUE as is_legacy_import,
    cs.created_at,
    (SELECT user_id FROM cog_projects WHERE id = cs.project_id) as user_id
FROM cog_fractal_seeds cs

UNION ALL

-- Wormholes de Cognética como isomorfismos potenciales
SELECT 
    'cog_wormholes' as source_system,
    cw.id,
    cw.project_id as unified_project_id,
    'ai_extraction' as source_type,
    cw.isomorphism_description as title,
    NULL as description,
    'isomorphism' as suggested_type,
    CASE 
        WHEN cw.status = 'accepted' THEN 'canonized'
        WHEN cw.status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END as status,
    TRUE as is_legacy_import,
    cw.created_at,
    (SELECT user_id FROM cog_projects WHERE id = cw.project_id) as user_id
FROM cog_wormholes cw;

-- ============================================
-- 🔒 PARTE 6: RLS PARA NUEVAS TABLAS
-- ============================================

ALTER TABLE nexus_mud_pit ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_cognetica_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_cooldown_sessions ENABLE ROW LEVEL SECURITY;

-- Mud Pit: Usuario puede ver/crear en sus proyectos
CREATE POLICY "mud_pit_select" ON nexus_mud_pit FOR SELECT USING (
    deposited_by = auth.uid()
    OR (project_id IS NOT NULL AND nexus_user_has_project_access(project_id))
    OR (cog_project_id IN (SELECT id FROM cog_projects WHERE user_id = auth.uid()))
);

CREATE POLICY "mud_pit_insert" ON nexus_mud_pit FOR INSERT WITH CHECK (
    deposited_by = auth.uid()
);

CREATE POLICY "mud_pit_update" ON nexus_mud_pit FOR UPDATE USING (
    deposited_by = auth.uid()
    OR (project_id IS NOT NULL AND nexus_user_has_permission(project_id, 'can_manage_master_data'))
);

-- Links: Lectura libre para miembros, escritura restringida
CREATE POLICY "links_select" ON nexus_cognetica_links FOR SELECT USING (
    (nexus_project_id IS NOT NULL AND nexus_user_has_project_access(nexus_project_id))
    OR (cog_project_id IN (SELECT id FROM cog_projects WHERE user_id = auth.uid()))
);

CREATE POLICY "links_insert" ON nexus_cognetica_links FOR INSERT WITH CHECK (
    created_by = auth.uid()
);

-- Cooldown: Solo el propio usuario
CREATE POLICY "cooldown_select" ON nexus_cooldown_sessions FOR SELECT USING (
    user_id = auth.uid()
);

CREATE POLICY "cooldown_insert" ON nexus_cooldown_sessions FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- ============================================
-- 📝 PARTE 7: COMENTARIOS
-- ============================================

COMMENT ON TABLE nexus_mud_pit IS 'Zona de aterrizaje para contenido crudo. El humano deposita, la IA procesa, solo lo validado asciende a Nexus.';
COMMENT ON COLUMN nexus_mud_pit.status IS 'pending→incubating(24h cooldown)→processing→proposed→canonized/rejected';
COMMENT ON COLUMN nexus_mud_pit.incubation_until IS 'Si está en cool-down, hasta cuándo debe esperar antes de procesarse';

COMMENT ON TABLE nexus_cognetica_links IS 'Mapeo entre elementos de Cognética (personal) y Nexus (colaborativo)';
COMMENT ON TABLE nexus_cooldown_sessions IS 'Control de períodos de incubación de 24h tras sesiones intensas';

COMMENT ON VIEW unified_inputs_view IS 'Vista unificada de entradas: Mud Pit + Legacy Cognética. Permite ver todo sin migrar datos.';

-- ============================================
-- 🔄 PARTE 8: TRIGGERS DE TIMESTAMP
-- ============================================

DROP TRIGGER IF EXISTS trg_mud_pit_updated ON nexus_mud_pit;
CREATE TRIGGER trg_mud_pit_updated
    BEFORE UPDATE ON nexus_mud_pit
    FOR EACH ROW
    EXECUTE FUNCTION nexus_update_timestamp();

-- ============================================
-- 🎯 FIN DEL PUENTE
-- ============================================
-- 
-- FLUJO COMPLETO:
-- 
-- 1. INGESTA (Cognética)
--    Usuario sube audio → Deepgram transcribe → Gemini extrae
--    
-- 2. DEPÓSITO (Mud Pit)
--    Semillas/pensadores extraídos → nexus_mud_pit (status: pending)
--    
-- 3. INCUBACIÓN (Cool-down)
--    Si hubo chat de 5 mensajes → status: incubating (24h)
--    
-- 4. PROCESAMIENTO (IA)
--    IA propone qué crear en Nexus → status: proposed
--    
-- 5. CANONIZACIÓN (Humano)
--    Humano revisa y aprueba → Crea nodo/isomorfismo en Nexus
--    Se crea link en nexus_cognetica_links
--    status: canonized
--
-- 🌊🎼🐍
