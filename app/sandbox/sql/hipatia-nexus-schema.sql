-- 📍 app/sandbox/sql/hipatia-nexus-schema.sql
-- 🍄👁️ Hipatia Nexus - Schema SQL para Supabase
-- v0.01 - Basado en mock v0.3
--
-- 🔧 DECISIÓN: Estructura normalizada con soporte para:
-- - Validaciones múltiples por convergencia
-- - Control de acceso por investigador
-- - Histórico de calibraciones

-- ============================================
-- 🌍 REGIONES (continentes/zonas geográficas)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    color TEXT,  -- Color hex para visualización
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de regiones
INSERT INTO nexus_regions (id, name, emoji, color, sort_order) VALUES
    ('americas', 'Américas', '🌎', '#4ECDC4', 1),
    ('mediterraneo', 'Mediterráneo', '🏛️', '#9B59B6', 2),
    ('mesopotamia', 'Mesopotamia', '🏺', '#F39C12', 3),
    ('asia', 'Asia', '🐉', '#E74C3C', 4),
    ('africa', 'África', '🌍', '#27AE60', 5),
    ('oceania', 'Oceanía', '🌊', '#3498DB', 6),
    ('europa', 'Europa', '⚔️', '#95A5A6', 7),
    ('subcontinente', 'Subcontinente Indio', '🕉️', '#8E44AD', 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 🏛️ CIVILIZACIONES (nodos principales)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_civilizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    subtitle TEXT,
    
    -- Datos temporales
    start_bce INTEGER,      -- Año inicio (antes de era común)
    start_ce INTEGER,       -- Año inicio (era común)
    end_bce INTEGER,        -- Año fin (antes de era común)
    end_ce INTEGER,         -- Año fin (era común)
    generations INTEGER,    -- Duración en generaciones (25 años c/u)
    
    -- Ubicación
    region_id TEXT REFERENCES nexus_regions(id),
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    
    -- Clasificación
    type TEXT DEFAULT 'civilization',  -- civilization, glitch, abundance_epoch, pattern
    anomaly_level TEXT CHECK (anomaly_level IN ('low', 'medium', 'high', 'critical')),
    glitch_type TEXT,
    
    -- Narrativas F0/F1
    official_narrative TEXT,       -- F1: Narrativa académica oficial
    evidence_contradiction TEXT,   -- F0: Evidencia que contradice F1
    anomaly TEXT,                  -- Descripción de la anomalía
    
    -- Metadatos
    world_first BOOLEAN DEFAULT FALSE,
    world_first_label TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Índices para búsqueda
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(official_narrative, ''))
    ) STORED
);

-- Índice para búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_civilizations_search ON nexus_civilizations USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_civilizations_region ON nexus_civilizations(region_id);
CREATE INDEX IF NOT EXISTS idx_civilizations_type ON nexus_civilizations(type);

-- ============================================
-- 🔧 TECNOLOGÍAS (por civilización)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    civilization_id TEXT REFERENCES nexus_civilizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,  -- construccion, navegacion, astronomia, metalurgia, etc.
    anomaly_level TEXT CHECK (anomaly_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technologies_civ ON nexus_technologies(civilization_id);

-- ============================================
-- 🏷️ PATTERN TAGS (etiquetas de patrones)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_pattern_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación muchos-a-muchos: civilización <-> tags
CREATE TABLE IF NOT EXISTS nexus_civilization_tags (
    civilization_id TEXT REFERENCES nexus_civilizations(id) ON DELETE CASCADE,
    tag_id TEXT REFERENCES nexus_pattern_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (civilization_id, tag_id)
);

-- Tags iniciales
INSERT INTO nexus_pattern_tags (id, name, color) VALUES
    ('megalitismo', 'Megalitismo', '#9B59B6'),
    ('astronomia', 'Astronomía', '#A8E6CF'),
    ('astronomia_precision', 'Astronomía de Precisión', '#27AE60'),
    ('momificacion', 'Momificación', '#8B4513'),
    ('navegacion', 'Navegación', '#3498DB'),
    ('colapso_ecologico', 'Colapso Ecológico', '#FF6B6B'),
    ('rigidez_F1', 'Rigidez F1', '#E74C3C'),
    ('abundancia', 'Abundancia', '#4ECDC4'),
    ('diversidad', 'Diversidad', '#2ECC71'),
    ('educacion', 'Educación', '#F39C12'),
    ('biblioteca', 'Biblioteca', '#D4AC0D')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 🔗 ISOMORFISMOS (patrones que conectan civilizaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_isomorphisms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    strength DECIMAL(3,2) DEFAULT 0.5,  -- 0.0 a 1.0
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conexiones: qué civilizaciones comparten qué isomorfismo
CREATE TABLE IF NOT EXISTS nexus_isomorphism_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isomorphism_id TEXT REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    civilization_id TEXT REFERENCES nexus_civilizations(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(isomorphism_id, civilization_id)
);

CREATE INDEX IF NOT EXISTS idx_iso_connections_iso ON nexus_isomorphism_connections(isomorphism_id);
CREATE INDEX IF NOT EXISTS idx_iso_connections_civ ON nexus_isomorphism_connections(civilization_id);

-- ============================================
-- ⚡ GLITCHES FÉRTILES
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_fertile_glitches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,  -- temporal, geografico, tecnologico, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Civilizaciones que exhiben glitches fértiles
CREATE TABLE IF NOT EXISTS nexus_civilization_glitches (
    civilization_id TEXT REFERENCES nexus_civilizations(id) ON DELETE CASCADE,
    glitch_id TEXT REFERENCES nexus_fertile_glitches(id) ON DELETE CASCADE,
    notes TEXT,
    PRIMARY KEY (civilization_id, glitch_id)
);

-- ============================================
-- 👩‍🔬 INVESTIGADORES (control de acceso)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_researchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    institution TEXT,
    specialization TEXT,
    
    -- Control de acceso
    project_active BOOLEAN DEFAULT FALSE,  -- ¿Tiene proyecto activo?
    access_enabled BOOLEAN DEFAULT TRUE,   -- ¿Puede acceder al Nexus?
    validation_enabled BOOLEAN DEFAULT FALSE,  -- ¿Puede validar?
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ,
    
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_researchers_user ON nexus_researchers(user_id);
CREATE INDEX IF NOT EXISTS idx_researchers_access ON nexus_researchers(access_enabled, project_active);

-- ============================================
-- ✅ VALIDACIONES / CALIBRACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Qué se valida
    civilization_id TEXT REFERENCES nexus_civilizations(id) ON DELETE CASCADE,
    isomorphism_id TEXT REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    
    -- Quién valida
    researcher_id UUID REFERENCES nexus_researchers(id),
    
    -- Resultado de calibración (no es F1 binario)
    can_be_negated BOOLEAN,           -- ¿Puede ser negado con datos empíricos?
    negation_evidence TEXT,            -- Si sí, ¿cuál es la evidencia?
    additional_info TEXT,              -- Información adicional (opcional)
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    
    -- Metadatos
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un investigador solo puede validar una vez cada entidad
    UNIQUE(civilization_id, researcher_id),
    UNIQUE(isomorphism_id, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_validations_civ ON nexus_validations(civilization_id);
CREATE INDEX IF NOT EXISTS idx_validations_iso ON nexus_validations(isomorphism_id);
CREATE INDEX IF NOT EXISTS idx_validations_researcher ON nexus_validations(researcher_id);

-- ============================================
-- 💬 CHAT DE VALIDACIÓN (Cognética)
-- ============================================
CREATE TABLE IF NOT EXISTS nexus_validation_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validation_id UUID REFERENCES nexus_validations(id) ON DELETE CASCADE,
    
    -- Control de mensajes (máximo 5)
    message_count INTEGER DEFAULT 0 CHECK (message_count <= 5),
    is_complete BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nexus_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES nexus_validation_chats(id) ON DELETE CASCADE,
    
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON nexus_chat_messages(chat_id);

-- ============================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE nexus_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_civilizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_pattern_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_civilization_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_isomorphisms ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_isomorphism_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_fertile_glitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_civilization_glitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_validation_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (cualquiera puede ver datos base)
CREATE POLICY "Regiones públicas" ON nexus_regions FOR SELECT USING (true);
CREATE POLICY "Civilizaciones públicas" ON nexus_civilizations FOR SELECT USING (true);
CREATE POLICY "Tecnologías públicas" ON nexus_technologies FOR SELECT USING (true);
CREATE POLICY "Tags públicos" ON nexus_pattern_tags FOR SELECT USING (true);
CREATE POLICY "Civ-tags públicos" ON nexus_civilization_tags FOR SELECT USING (true);
CREATE POLICY "Isomorfismos públicos" ON nexus_isomorphisms FOR SELECT USING (true);
CREATE POLICY "Conexiones públicas" ON nexus_isomorphism_connections FOR SELECT USING (true);
CREATE POLICY "Glitches públicos" ON nexus_fertile_glitches FOR SELECT USING (true);
CREATE POLICY "Civ-glitches públicos" ON nexus_civilization_glitches FOR SELECT USING (true);

-- Políticas de validación (solo investigadores con acceso)
CREATE POLICY "Validaciones por investigador activo" ON nexus_validations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM nexus_researchers r
            WHERE r.user_id = auth.uid()
            AND r.access_enabled = true
            AND r.project_active = true
        )
    );

CREATE POLICY "Chats por investigador activo" ON nexus_validation_chats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM nexus_researchers r
            WHERE r.user_id = auth.uid()
            AND r.access_enabled = true
            AND r.validation_enabled = true
        )
    );

CREATE POLICY "Mensajes por investigador activo" ON nexus_chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM nexus_researchers r
            WHERE r.user_id = auth.uid()
            AND r.access_enabled = true
            AND r.validation_enabled = true
        )
    );

-- Investigadores pueden ver su propio perfil
CREATE POLICY "Ver propio perfil" ON nexus_researchers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Actualizar propio perfil" ON nexus_researchers
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas de INSERT para usuarios autenticados (carga de datos)
CREATE POLICY "nexus_regions_insert" ON nexus_regions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_civilizations_insert" ON nexus_civilizations
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_technologies_insert" ON nexus_technologies
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_pattern_tags_insert" ON nexus_pattern_tags
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_civilization_tags_insert" ON nexus_civilization_tags
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_isomorphisms_insert" ON nexus_isomorphisms
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_isomorphism_connections_insert" ON nexus_isomorphism_connections
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_fertile_glitches_insert" ON nexus_fertile_glitches
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_civilization_glitches_insert" ON nexus_civilization_glitches
    FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 📊 VISTAS ÚTILES
-- ============================================

-- Vista: Civilizaciones con sus tags
CREATE OR REPLACE VIEW nexus_civilizations_with_tags AS
SELECT 
    c.*,
    array_agg(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL) as tag_ids,
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names
FROM nexus_civilizations c
LEFT JOIN nexus_civilization_tags ct ON c.id = ct.civilization_id
LEFT JOIN nexus_pattern_tags t ON ct.tag_id = t.id
GROUP BY c.id;

-- Vista: Isomorfismos con civilizaciones conectadas
CREATE OR REPLACE VIEW nexus_isomorphisms_with_civilizations AS
SELECT 
    i.*,
    array_agg(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as civilization_ids,
    array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as civilization_names,
    COUNT(DISTINCT ic.civilization_id) as connection_count
FROM nexus_isomorphisms i
LEFT JOIN nexus_isomorphism_connections ic ON i.id = ic.isomorphism_id
LEFT JOIN nexus_civilizations c ON ic.civilization_id = c.id
GROUP BY i.id;

-- Vista: Estadísticas de validación por civilización
CREATE OR REPLACE VIEW nexus_validation_stats AS
SELECT 
    c.id as civilization_id,
    c.name as civilization_name,
    COUNT(v.id) as validation_count,
    COUNT(CASE WHEN v.can_be_negated = true THEN 1 END) as negated_count,
    COUNT(CASE WHEN v.can_be_negated = false THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN v.additional_info IS NOT NULL THEN 1 END) as enriched_count
FROM nexus_civilizations c
LEFT JOIN nexus_validations v ON c.id = v.civilization_id
GROUP BY c.id, c.name;

-- ============================================
-- 🔄 TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON nexus_regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_civilizations_updated_at BEFORE UPDATE ON nexus_civilizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_researchers_updated_at BEFORE UPDATE ON nexus_researchers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para limitar mensajes de chat a 5
CREATE OR REPLACE FUNCTION check_chat_message_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT message_count INTO current_count
    FROM nexus_validation_chats
    WHERE id = NEW.chat_id;
    
    IF current_count >= 5 THEN
        RAISE EXCEPTION 'Chat de validación limitado a 5 mensajes';
    END IF;
    
    UPDATE nexus_validation_chats
    SET message_count = message_count + 1,
        is_complete = (message_count + 1 >= 5),
        completed_at = CASE WHEN message_count + 1 >= 5 THEN NOW() ELSE NULL END
    WHERE id = NEW.chat_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER limit_chat_messages BEFORE INSERT ON nexus_chat_messages
    FOR EACH ROW EXECUTE FUNCTION check_chat_message_limit();

-- ============================================
-- 📝 COMENTARIOS
-- ============================================
COMMENT ON TABLE nexus_civilizations IS 'Nodos principales del Hipatia Nexus - Civilizaciones, glitches y patrones';
COMMENT ON TABLE nexus_validations IS 'Calibraciones F0 - No es validación binaria, es negación empírica';
COMMENT ON TABLE nexus_researchers IS 'Control de acceso para investigadores - requiere proyecto activo';
COMMENT ON TABLE nexus_validation_chats IS 'Chat Cognética de 5 mensajes para validación interactiva';
COMMENT ON COLUMN nexus_validations.can_be_negated IS 'F0: ¿Puede ser negado con datos empíricos? No es verdad/falsedad';
