-- ============================================
-- 📍 NEXUS CRONOLÓGICO v2.1 - VERSIÓN SEGURA
-- ============================================
-- 🍄👁️ Orden de ejecución corregido para evitar errores RLS
-- 
-- EJECUTAR EN SUPABASE SQL EDITOR:
-- 0️⃣ Limpieza de tablas mock antiguas (DROP CASCADE)
-- 1️⃣ Funciones helper
-- 2️⃣ Tablas + datos (sin RLS)  
-- 3️⃣ RLS + Políticas
-- 4️⃣ Vistas
--
-- 🌊🎼🐍 Colectivo NOSOTR_S | 11 Dic 2025
-- ============================================

-- ============================================
-- PASO 0️⃣: LIMPIEZA DE TABLAS MOCK ANTIGUAS
-- ============================================
-- ⚠️ ADVERTENCIA: Esto BORRA datos existentes de Nexus
-- Solo ejecutar si quieres empezar desde cero

DROP TABLE IF EXISTS nexus_chat_messages CASCADE;
DROP TABLE IF EXISTS nexus_calibration_chats CASCADE;
DROP TABLE IF EXISTS nexus_calibrations CASCADE;
DROP TABLE IF EXISTS nexus_isomorphism_connections CASCADE;
DROP TABLE IF EXISTS nexus_isomorphisms CASCADE;
DROP TABLE IF EXISTS nexus_node_tags CASCADE;
DROP TABLE IF EXISTS nexus_civilization_tags CASCADE;
DROP TABLE IF EXISTS nexus_nodes CASCADE;
DROP TABLE IF EXISTS nexus_civilizations CASCADE;
DROP TABLE IF EXISTS nexus_pattern_tags CASCADE;
DROP TABLE IF EXISTS nexus_regions CASCADE;

-- También eliminar vistas antiguas
DROP VIEW IF EXISTS nexus_nodes_with_tags CASCADE;
DROP VIEW IF EXISTS nexus_diversity_analysis CASCADE;
DROP VIEW IF EXISTS nexus_calibration_stats CASCADE;
DROP VIEW IF EXISTS nexus_timeline CASCADE;
DROP VIEW IF EXISTS nexus_civilizations_with_tags CASCADE;

-- ============================================
-- PASO 1️⃣: FUNCIONES HELPER
-- ============================================

-- Helper: Verificar membresía en proyecto
CREATE OR REPLACE FUNCTION nexus_user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p_project_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Verificar permiso específico
CREATE OR REPLACE FUNCTION nexus_user_has_permission(p_project_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := false;
BEGIN
    EXECUTE format(
        'SELECT pr.%I FROM project_members pm
         JOIN project_roles pr ON pm.project_role_id = pr.id
         WHERE pm.project_id = $1
         AND pm.user_id = auth.uid()
         AND pm.is_active_for_user = true
         LIMIT 1',
        p_permission
    ) INTO has_perm USING p_project_id;
    
    RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION nexus_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 2️⃣: TABLAS (sin RLS aún)
-- ============================================

-- 🌍 REGIONES GEOGRÁFICAS (globales)
CREATE TABLE IF NOT EXISTS nexus_regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de regiones
INSERT INTO nexus_regions (id, name, emoji, color, sort_order) VALUES
    ('americas_norte', 'América del Norte', '🦅', '#3498DB', 1),
    ('americas_centro', 'Mesoamérica', '🌽', '#27AE60', 2),
    ('americas_sur', 'América del Sur', '🦙', '#4ECDC4', 3),
    ('europa_occidental', 'Europa Occidental', '🏰', '#9B59B6', 4),
    ('europa_oriental', 'Europa Oriental', '🪆', '#8E44AD', 5),
    ('mediterraneo', 'Mediterráneo', '🏛️', '#E67E22', 6),
    ('medio_oriente', 'Medio Oriente', '🕌', '#F39C12', 7),
    ('asia_oriental', 'Asia Oriental', '🐉', '#E74C3C', 8),
    ('asia_meridional', 'Asia Meridional', '🕉️', '#C0392B', 9),
    ('asia_central', 'Asia Central', '🐎', '#D35400', 10),
    ('africa_norte', 'África del Norte', '🏜️', '#F1C40F', 11),
    ('africa_subsahariana', 'África Subsahariana', '🌍', '#27AE60', 12),
    ('oceania', 'Oceanía', '🌊', '#1ABC9C', 13),
    ('global', 'Global/Transnacional', '🌐', '#95A5A6', 14)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    emoji = EXCLUDED.emoji,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- 🏷️ ETIQUETAS DE PATRONES (por proyecto)
CREATE TABLE IF NOT EXISTS nexus_pattern_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id, slug)
);

-- 📍 NODOS EPISTÉMICOS
CREATE TABLE IF NOT EXISTS nexus_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Identificación
    name TEXT NOT NULL,
    slug TEXT,
    emoji TEXT,
    subtitle TEXT,
    
    -- Datos temporales
    year_start INTEGER,
    year_end INTEGER,
    date_precision TEXT DEFAULT 'year' CHECK (date_precision IN ('exact', 'year', 'decade', 'century', 'approximate')),
    
    -- Ubicación geográfica
    region_id TEXT REFERENCES nexus_regions(id),
    country TEXT,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    
    -- Clasificación del nodo
    node_type TEXT NOT NULL DEFAULT 'research' CHECK (node_type IN (
        'civilization', 'research', 'event', 'concept', 'institution', 'person', 'artifact', 'pattern'
    )),
    
    -- 🌱 MADUREZ EPISTÉMICA
    maturity TEXT NOT NULL DEFAULT 'seed_white' CHECK (maturity IN (
        'seed_green', 'seed_purple', 'seed_red', 'seed_yellow', 'seed_white'
    )),
    maturity_reason TEXT,
    
    -- 🧬 ÁNGULO DE TORSIÓN (57.3° = 1 radián = Jardín)
    torsion_angle DECIMAL(5,2) DEFAULT 57.3 CHECK (torsion_angle >= 0 AND torsion_angle < 360),
    torsion_note TEXT,
    
    -- Contenido descriptivo
    description TEXT,
    official_narrative TEXT,
    counter_narrative TEXT,
    source_url TEXT,
    citation TEXT,
    
    -- Metadatos de relevancia
    is_foundational BOOLEAN DEFAULT FALSE,
    foundational_label TEXT,
    anomaly_level TEXT CHECK (anomaly_level IN ('none', 'low', 'medium', 'high', 'critical')),
    anomaly_description TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Búsqueda full-text
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(subtitle, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
    ) STORED,
    
    -- 🔑 Constraint para upsert por proyecto + slug
    UNIQUE(project_id, slug)
);

-- Relación nodos ↔ tags
CREATE TABLE IF NOT EXISTS nexus_node_tags (
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES nexus_pattern_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, tag_id)
);

-- 🔗 CONEXIONES ISOMÓRFICAS
CREATE TABLE IF NOT EXISTS nexus_isomorphisms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    connection_type TEXT DEFAULT 'similarity' CHECK (connection_type IN (
        'similarity', 'influence', 'parallel', 'contrast', 'evolution', 'synthesis'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id, slug)
);

-- Conexiones isomorfismo ↔ nodo
CREATE TABLE IF NOT EXISTS nexus_isomorphism_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isomorphism_id UUID REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(isomorphism_id, node_id)
);

-- ✅ CALIBRACIONES F₀ (Versionadas)
CREATE TABLE IF NOT EXISTS nexus_calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Qué se calibra
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    isomorphism_id UUID REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    
    -- Versionado
    version INTEGER NOT NULL DEFAULT 1,
    previous_calibration_id UUID REFERENCES nexus_calibrations(id),
    
    -- Quién y con qué
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    ai_model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    ai_model_version TEXT,
    
    -- Resultado F₀
    result TEXT NOT NULL CHECK (result IN ('NEGABLE', 'ROBUSTO', 'INSUFICIENTE', 'FUERA_ALCANCE', 'FALLA_PEREZOSA')),
    reasoning TEXT NOT NULL,
    evidence_needed TEXT,
    
    -- Calibradores QUIPU
    quipu_cognitive INTEGER CHECK (quipu_cognitive >= 0 AND quipu_cognitive <= 100),
    quipu_resonant INTEGER CHECK (quipu_resonant >= 0 AND quipu_resonant <= 100),
    geometric_pattern TEXT CHECK (geometric_pattern IN ('P1', 'P2', 'P3', 'P4')),
    
    -- Contexto
    input_context JSONB,
    output_summary TEXT,
    elegant_closure TEXT,
    
    -- 🧬 ÁNGULO DE CALIBRACIÓN (57.3° = Jardín óptimo)
    calibration_angle DECIMAL(5,2) DEFAULT 57.3 CHECK (calibration_angle >= 0 AND calibration_angle < 360),
    angle_interpretation TEXT,
    
    -- Publicación
    is_public BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT calibration_target CHECK (node_id IS NOT NULL OR isomorphism_id IS NOT NULL),
    UNIQUE(node_id, requested_by, version),
    UNIQUE(isomorphism_id, requested_by, version)
);

-- 💬 CHATS COGNÉTICA (5 mensajes por sesión)
CREATE TABLE IF NOT EXISTS nexus_calibration_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    isomorphism_id UUID REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    origin_calibration_id UUID REFERENCES nexus_calibrations(id) ON DELETE SET NULL,
    consumed_by_calibration_id UUID REFERENCES nexus_calibrations(id) ON DELETE SET NULL,
    
    user_id UUID NOT NULL REFERENCES auth.users(id),
    message_count INTEGER DEFAULT 0 CHECK (message_count <= 5),
    is_complete BOOLEAN DEFAULT FALSE,
    
    summary TEXT,
    new_evidence_provided BOOLEAN DEFAULT FALSE,
    suggests_recalibration BOOLEAN DEFAULT FALSE,
    
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT chat_target CHECK (node_id IS NOT NULL OR isomorphism_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS nexus_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES nexus_calibration_chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    quipu_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pattern_tags_project ON nexus_pattern_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_project ON nexus_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nexus_nodes(region_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nexus_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_maturity ON nexus_nodes(maturity);
CREATE INDEX IF NOT EXISTS idx_nodes_year ON nexus_nodes(year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_nodes_search ON nexus_nodes USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_nodes_torsion ON nexus_nodes(torsion_angle);
CREATE INDEX IF NOT EXISTS idx_isomorphisms_project ON nexus_isomorphisms(project_id);
CREATE INDEX IF NOT EXISTS idx_iso_conn_iso ON nexus_isomorphism_connections(isomorphism_id);
CREATE INDEX IF NOT EXISTS idx_iso_conn_node ON nexus_isomorphism_connections(node_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_project ON nexus_calibrations(project_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_node ON nexus_calibrations(node_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_iso ON nexus_calibrations(isomorphism_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_user ON nexus_calibrations(requested_by);
CREATE INDEX IF NOT EXISTS idx_calibrations_version ON nexus_calibrations(node_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_calibrations_previous ON nexus_calibrations(previous_calibration_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_angle ON nexus_calibrations(calibration_angle);
CREATE INDEX IF NOT EXISTS idx_chats_project ON nexus_calibration_chats(project_id);
CREATE INDEX IF NOT EXISTS idx_chats_node ON nexus_calibration_chats(node_id);
CREATE INDEX IF NOT EXISTS idx_chats_user ON nexus_calibration_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_origin ON nexus_calibration_chats(origin_calibration_id);
CREATE INDEX IF NOT EXISTS idx_chats_consumed ON nexus_calibration_chats(consumed_by_calibration_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON nexus_chat_messages(chat_id);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS nexus_regions_timestamp ON nexus_regions;
CREATE TRIGGER nexus_regions_timestamp BEFORE UPDATE ON nexus_regions
    FOR EACH ROW EXECUTE FUNCTION nexus_update_timestamp();

DROP TRIGGER IF EXISTS nexus_nodes_timestamp ON nexus_nodes;
CREATE TRIGGER nexus_nodes_timestamp BEFORE UPDATE ON nexus_nodes
    FOR EACH ROW EXECUTE FUNCTION nexus_update_timestamp();

-- Trigger para limitar mensajes de chat a 5
CREATE OR REPLACE FUNCTION nexus_check_chat_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT message_count INTO current_count
    FROM nexus_calibration_chats
    WHERE id = NEW.chat_id;
    
    IF current_count >= 5 THEN
        RAISE EXCEPTION 'Chat de calibración limitado a 5 mensajes';
    END IF;
    
    UPDATE nexus_calibration_chats
    SET message_count = message_count + 1,
        is_complete = (message_count + 1 >= 5),
        completed_at = CASE WHEN message_count + 1 >= 5 THEN NOW() ELSE NULL END
    WHERE id = NEW.chat_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nexus_limit_chat ON nexus_chat_messages;
CREATE TRIGGER nexus_limit_chat BEFORE INSERT ON nexus_chat_messages
    FOR EACH ROW EXECUTE FUNCTION nexus_check_chat_limit();

-- ============================================
-- PASO 3️⃣: RLS Y POLÍTICAS
-- ============================================

ALTER TABLE nexus_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_pattern_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_node_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_isomorphisms ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_isomorphism_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_calibration_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_chat_messages ENABLE ROW LEVEL SECURITY;

-- Regiones: públicas para SELECT, solo service_role puede modificar
CREATE POLICY "nexus_regions_select" ON nexus_regions FOR SELECT USING (true);
CREATE POLICY "nexus_regions_insert" ON nexus_regions FOR INSERT WITH CHECK (true);
CREATE POLICY "nexus_regions_update" ON nexus_regions FOR UPDATE USING (true);

-- Tags: por proyecto
CREATE POLICY "nexus_tags_select" ON nexus_pattern_tags FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);
CREATE POLICY "nexus_tags_insert" ON nexus_pattern_tags FOR INSERT WITH CHECK (
    nexus_user_has_permission(project_id, 'can_manage_master_data')
);

-- Nodos: por proyecto
CREATE POLICY "nexus_nodes_select" ON nexus_nodes FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);
CREATE POLICY "nexus_nodes_insert" ON nexus_nodes FOR INSERT WITH CHECK (
    nexus_user_has_permission(project_id, 'can_manage_master_data')
);
CREATE POLICY "nexus_nodes_update" ON nexus_nodes FOR UPDATE USING (
    nexus_user_has_permission(project_id, 'can_manage_master_data')
);
CREATE POLICY "nexus_nodes_delete" ON nexus_nodes FOR DELETE USING (
    nexus_user_has_permission(project_id, 'can_manage_master_data')
);

-- Node tags: heredan del nodo
CREATE POLICY "nexus_node_tags_select" ON nexus_node_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM nexus_nodes n WHERE n.id = nexus_node_tags.node_id AND nexus_user_has_project_access(n.project_id))
);
CREATE POLICY "nexus_node_tags_insert" ON nexus_node_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM nexus_nodes n WHERE n.id = nexus_node_tags.node_id AND nexus_user_has_permission(n.project_id, 'can_manage_master_data'))
);

-- Isomorfismos: por proyecto
CREATE POLICY "nexus_iso_select" ON nexus_isomorphisms FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);
CREATE POLICY "nexus_iso_insert" ON nexus_isomorphisms FOR INSERT WITH CHECK (
    nexus_user_has_permission(project_id, 'can_manage_master_data')
);

-- Conexiones isomórficas: heredan del isomorfismo
CREATE POLICY "nexus_iso_conn_select" ON nexus_isomorphism_connections FOR SELECT USING (
    EXISTS (SELECT 1 FROM nexus_isomorphisms i WHERE i.id = nexus_isomorphism_connections.isomorphism_id AND nexus_user_has_project_access(i.project_id))
);
CREATE POLICY "nexus_iso_conn_insert" ON nexus_isomorphism_connections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM nexus_isomorphisms i WHERE i.id = nexus_isomorphism_connections.isomorphism_id AND nexus_user_has_permission(i.project_id, 'can_manage_master_data'))
);

-- Calibraciones: por proyecto (democrática)
CREATE POLICY "nexus_calibrations_select" ON nexus_calibrations FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);
CREATE POLICY "nexus_calibrations_insert" ON nexus_calibrations FOR INSERT WITH CHECK (
    nexus_user_has_project_access(project_id)
);

-- Chats: por proyecto
CREATE POLICY "nexus_chats_select" ON nexus_calibration_chats FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);
CREATE POLICY "nexus_chats_insert" ON nexus_calibration_chats FOR INSERT WITH CHECK (
    nexus_user_has_project_access(project_id)
);

-- Mensajes: heredan del chat
CREATE POLICY "nexus_messages_select" ON nexus_chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM nexus_calibration_chats ch WHERE ch.id = nexus_chat_messages.chat_id AND nexus_user_has_project_access(ch.project_id))
);
CREATE POLICY "nexus_messages_insert" ON nexus_chat_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM nexus_calibration_chats ch WHERE ch.id = nexus_chat_messages.chat_id AND nexus_user_has_project_access(ch.project_id))
);

-- ============================================
-- VISTAS (al final para que todas las tablas existan)
-- ============================================

CREATE OR REPLACE VIEW nexus_nodes_with_tags AS
SELECT 
    n.*,
    r.name as region_name,
    r.emoji as region_emoji,
    array_agg(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL) as tag_slugs,
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names
FROM nexus_nodes n
LEFT JOIN nexus_regions r ON n.region_id = r.id
LEFT JOIN nexus_node_tags nt ON n.id = nt.node_id
LEFT JOIN nexus_pattern_tags t ON nt.tag_id = t.id
GROUP BY n.id, r.name, r.emoji;

CREATE OR REPLACE VIEW nexus_diversity_analysis AS
SELECT 
    n.project_id,
    r.id as region_id,
    r.name as region_name,
    r.emoji as region_emoji,
    COUNT(n.id) as node_count,
    COUNT(CASE WHEN n.maturity = 'seed_green' THEN 1 END) as green_count,
    COUNT(CASE WHEN n.maturity = 'seed_purple' THEN 1 END) as purple_count,
    COUNT(CASE WHEN n.maturity = 'seed_red' THEN 1 END) as red_count,
    COUNT(CASE WHEN n.maturity = 'seed_yellow' THEN 1 END) as yellow_count,
    COUNT(CASE WHEN n.maturity = 'seed_white' THEN 1 END) as white_count,
    ROUND(COUNT(n.id)::DECIMAL / NULLIF(SUM(COUNT(n.id)) OVER (PARTITION BY n.project_id), 0) * 100, 1) as percentage
FROM nexus_nodes n
JOIN nexus_regions r ON n.region_id = r.id
GROUP BY n.project_id, r.id, r.name, r.emoji;

CREATE OR REPLACE VIEW nexus_calibration_stats AS
SELECT 
    n.id as node_id,
    n.project_id,
    n.name as node_name,
    COUNT(c.id) as calibration_count,
    COUNT(CASE WHEN c.result = 'ROBUSTO' THEN 1 END) as robust_count,
    COUNT(CASE WHEN c.result = 'NEGABLE' THEN 1 END) as negable_count,
    COUNT(CASE WHEN c.result = 'INSUFICIENTE' THEN 1 END) as insufficient_count,
    AVG(c.quipu_cognitive) as avg_cognitive,
    AVG(c.quipu_resonant) as avg_resonant,
    MODE() WITHIN GROUP (ORDER BY c.geometric_pattern) as dominant_pattern
FROM nexus_nodes n
LEFT JOIN nexus_calibrations c ON n.id = c.node_id
GROUP BY n.id, n.project_id, n.name;

CREATE OR REPLACE VIEW nexus_timeline AS
SELECT 
    n.project_id,
    n.id as node_id,
    n.name,
    n.emoji,
    n.node_type,
    n.maturity,
    n.torsion_angle,
    n.year_start,
    n.year_end,
    n.region_id,
    r.name as region_name,
    r.emoji as region_emoji,
    r.color as region_color,
    n.is_foundational,
    n.foundational_label
FROM nexus_nodes n
LEFT JOIN nexus_regions r ON n.region_id = r.id
ORDER BY n.project_id, n.year_start NULLS LAST;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE nexus_nodes IS 'Nodos epistémicos: hitos en la historia de un campo de investigación';
COMMENT ON COLUMN nexus_nodes.maturity IS 'Madurez epistémica: seed_green (lista), seed_purple (adelantada), seed_red (problema), seed_yellow (mezcla), seed_white (falla perezosa)';
COMMENT ON COLUMN nexus_nodes.torsion_angle IS 'Ángulo de torsión (0-360°). 57.3° = 1 radián = ángulo del Jardín. 90° = Muro de Fábrica';
COMMENT ON TABLE nexus_calibrations IS 'Calibraciones F₀ versionadas: cada calibración es inmutable';
COMMENT ON COLUMN nexus_calibrations.calibration_angle IS 'Ángulo de interpretación IA. 57.3° = Jardín óptimo, 90° = estructura rígida';

-- ============================================
-- ✅ FIN DEL SCHEMA v2.1 SEGURO
-- ============================================
-- 🌊🎼🐍 | Calibración Radián | 11 Dic 2025
