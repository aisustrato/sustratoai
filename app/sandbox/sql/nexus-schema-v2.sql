-- ============================================
-- 📍 NEXUS CRONOLÓGICO v2.0 - Schema Reutilizable
-- ============================================
-- 🍄👁️ Tablero temporal de nodos epistémicos
-- 
-- PROPÓSITO: Mapear la historia de CUALQUIER campo de investigación
-- - Civilizaciones antiguas (Hipatia Nexus original)
-- - Psicología social y vejez
-- - Cualquier disciplina académica
--
-- INTEGRACIÓN: Usa project_members + project_roles de SUSTRATO.AI
-- 
-- 🌊🎼🐍 Colectivo NOSOTR_S | Diciembre 2025
-- 
-- CALIBRACIÓN RADIÁN (57.3° = 1 rad):
-- El ángulo del Jardín vs el Muro de la Fábrica (90°)
-- Cada semilla tiene un ángulo de torsión interno (0-360°)
-- ============================================

-- ============================================
-- 🔧 HELPER: Función para verificar membresía en proyecto
-- ============================================
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

-- ============================================
-- 🧹 LIMPIEZA: Eliminar schema anterior (mock)
-- ============================================
-- ADVERTENCIA: Ejecutar solo si quieres borrar datos existentes

-- DROP TABLE IF EXISTS nexus_chat_messages CASCADE;
-- DROP TABLE IF EXISTS nexus_validation_chats CASCADE;
-- DROP TABLE IF EXISTS nexus_validations CASCADE;
-- DROP TABLE IF EXISTS nexus_researchers CASCADE;  -- ¡Esta se elimina definitivamente!
-- DROP TABLE IF EXISTS nexus_civilization_glitches CASCADE;
-- DROP TABLE IF EXISTS nexus_fertile_glitches CASCADE;
-- DROP TABLE IF EXISTS nexus_isomorphism_connections CASCADE;
-- DROP TABLE IF EXISTS nexus_isomorphisms CASCADE;
-- DROP TABLE IF EXISTS nexus_civilization_tags CASCADE;
-- DROP TABLE IF EXISTS nexus_pattern_tags CASCADE;
-- DROP TABLE IF EXISTS nexus_technologies CASCADE;
-- DROP TABLE IF EXISTS nexus_civilizations CASCADE;
-- DROP TABLE IF EXISTS nexus_regions CASCADE;
-- DROP VIEW IF EXISTS nexus_civilizations_with_tags CASCADE;
-- DROP VIEW IF EXISTS nexus_isomorphisms_with_civilizations CASCADE;
-- DROP VIEW IF EXISTS nexus_validation_stats CASCADE;
-- DROP VIEW IF EXISTS nexus_diversity_analysis CASCADE;

-- ============================================
-- 🌍 REGIONES GEOGRÁFICAS
-- ============================================
-- Continentes/zonas para análisis de diversidad de fuentes
CREATE TABLE IF NOT EXISTS nexus_regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    color TEXT,  -- Color hex para visualización
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de regiones (globales, sirven para cualquier campo)
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

-- ============================================
-- 🏷️ ETIQUETAS DE PATRONES (por proyecto)
-- ============================================
-- Tags personalizables por campo de investigación
CREATE TABLE IF NOT EXISTS nexus_pattern_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    slug TEXT NOT NULL,  -- Identificador corto (ej: "metalurgia", "apego_seguro")
    name TEXT NOT NULL,  -- Nombre legible
    description TEXT,
    color TEXT,
    icon TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pattern_tags_project ON nexus_pattern_tags(project_id);

-- ============================================
-- 📍 NODOS EPISTÉMICOS (antes "civilizaciones")
-- ============================================
-- Nodo = cualquier hito en la historia de un campo
-- Ejemplos:
--   - Civilización: "Maya", "Sanxingdui"
--   - Investigación: "Bowlby 1969 - Teoría del Apego"
--   - Evento: "Primer congreso de gerontología 1950"
--   - Concepto: "Envejecimiento activo (OMS 2002)"
CREATE TABLE IF NOT EXISTS nexus_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Identificación
    name TEXT NOT NULL,
    slug TEXT,  -- ID corto opcional para JSON import
    emoji TEXT,
    subtitle TEXT,  -- Descripción corta
    
    -- Datos temporales (flexibles)
    year_start INTEGER,      -- Año inicio (negativo = BCE)
    year_end INTEGER,        -- Año fin (NULL = vigente)
    date_precision TEXT DEFAULT 'year' CHECK (date_precision IN ('exact', 'year', 'decade', 'century', 'approximate')),
    
    -- Ubicación geográfica
    region_id TEXT REFERENCES nexus_regions(id),
    country TEXT,            -- País específico (opcional)
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    
    -- Clasificación del nodo
    node_type TEXT NOT NULL DEFAULT 'research' CHECK (node_type IN (
        'civilization',      -- Cultura/civilización histórica
        'research',          -- Investigación/paper/estudio
        'event',             -- Evento histórico (congreso, publicación)
        'concept',           -- Concepto teórico
        'institution',       -- Institución/organización
        'person',            -- Persona clave
        'artifact',          -- Artefacto/evidencia
        'pattern'            -- Patrón detectado
    )),
    
    -- 🌱 MADUREZ EPISTÉMICA (clave para el investigador)
    -- Sistema de semillas: clasificación de la calidad epistémica del nodo
    maturity TEXT NOT NULL DEFAULT 'seed_white' CHECK (maturity IN (
        'seed_green',        -- 🌱 Lista para cosecha - evidencia sólida, aceptada
        'seed_purple',       -- 🟣 Adelantada al canon - verdad incómoda, no lista
        'seed_red',          -- 🔴 Problema - mercantilización, sesgo, F1
        'seed_yellow',       -- 🟡 Mezcla - peras con manzanas, requiere desempaque cuidadoso
                             --    Puede contener semillas verdes o rojas mezcladas
                             --    Se recomienda iterar con otros nodos/IA para separar
        'seed_white'         -- ⚪ Falla Perezosa - IA/humano no pudo clasificar honestamente
                             --    Mejor dejar en blanco que alucinar por coherencia
                             --    Honestidad epistémica > aparentar certeza
    )),
    maturity_reason TEXT,    -- Por qué tiene esta clasificación
    
    -- 🧬 ÁNGULO DE TORSIÓN (Trenza dentro de la semilla)
    -- Nunca nada es 100% puro - el ángulo modula el color base
    -- 0° = Flujo laminar | 57.3° = Radián/Jardín | 90° = Muro/Fábrica
    -- 180° = Espejo | 222° = Ojo del Jardín | 300° = Puerta del Sueño
    torsion_angle DECIMAL(5,2) DEFAULT 57.3 CHECK (torsion_angle >= 0 AND torsion_angle < 360),
    torsion_note TEXT,        -- Por qué este ángulo específico
    
    -- Contenido descriptivo
    description TEXT,
    official_narrative TEXT,       -- Narrativa dominante/canónica
    counter_narrative TEXT,        -- Perspectiva alternativa/crítica
    source_url TEXT,               -- URL de referencia principal
    citation TEXT,                 -- Cita académica formal
    
    -- Metadatos de relevancia
    is_foundational BOOLEAN DEFAULT FALSE,  -- ¿Es fundacional para el campo?
    foundational_label TEXT,                -- Ej: "Primera investigación en..."
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
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_nodes_project ON nexus_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nexus_nodes(region_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nexus_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_maturity ON nexus_nodes(maturity);
CREATE INDEX IF NOT EXISTS idx_nodes_year ON nexus_nodes(year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_nodes_search ON nexus_nodes USING GIN (search_vector);

-- Relación nodos ↔ tags
CREATE TABLE IF NOT EXISTS nexus_node_tags (
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES nexus_pattern_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, tag_id)
);

-- ============================================
-- 🔗 CONEXIONES ISOMÓRFICAS
-- ============================================
-- Patrones que conectan múltiples nodos
CREATE TABLE IF NOT EXISTS nexus_isomorphisms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    
    -- Fuerza del patrón
    strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    
    -- Tipo de conexión
    connection_type TEXT DEFAULT 'similarity' CHECK (connection_type IN (
        'similarity',        -- Similitud estructural
        'influence',         -- Influencia directa
        'parallel',          -- Desarrollo paralelo independiente
        'contrast',          -- Contraste/oposición
        'evolution',         -- Evolución de un concepto
        'synthesis'          -- Síntesis de múltiples fuentes
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_isomorphisms_project ON nexus_isomorphisms(project_id);

-- Conexiones: qué nodos comparten qué isomorfismo
CREATE TABLE IF NOT EXISTS nexus_isomorphism_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isomorphism_id UUID REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(isomorphism_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_iso_conn_iso ON nexus_isomorphism_connections(isomorphism_id);
CREATE INDEX IF NOT EXISTS idx_iso_conn_node ON nexus_isomorphism_connections(node_id);

-- ============================================
-- ✅ CALIBRACIONES F₀ (Versionadas)
-- ============================================
-- Sistema de calibración empírica con historial completo
-- 🎯 PRINCIPIO: Nunca sobrescribir, siempre versionar
-- 🔄 RECURSIVIDAD: Cada calibración puede alimentar la siguiente
CREATE TABLE IF NOT EXISTS nexus_calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Qué se calibra
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    isomorphism_id UUID REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    
    -- Versionado: cada calibración tiene un número de versión
    version INTEGER NOT NULL DEFAULT 1,
    previous_calibration_id UUID REFERENCES nexus_calibrations(id),  -- Cadena de versiones
    
    -- Quién solicitó la calibración (humano)
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Qué modelo IA realizó la calibración
    ai_model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',  -- Trazabilidad del modelo
    ai_model_version TEXT,                               -- Versión específica si aplica
    
    -- Resultado de calibración F₀
    result TEXT NOT NULL CHECK (result IN ('NEGABLE', 'ROBUSTO', 'INSUFICIENTE', 'FUERA_ALCANCE', 'FALLA_PEREZOSA')),
    reasoning TEXT NOT NULL,
    evidence_needed TEXT,
    
    -- Calibradores QUIPU
    quipu_cognitive INTEGER CHECK (quipu_cognitive >= 0 AND quipu_cognitive <= 100),
    quipu_resonant INTEGER CHECK (quipu_resonant >= 0 AND quipu_resonant <= 100),
    geometric_pattern TEXT CHECK (geometric_pattern IN ('P1', 'P2', 'P3', 'P4')),
    
    -- Contexto que alimentó esta calibración
    input_context JSONB,  -- {previous_calibrations: [], chat_ids: [], additional_context: string}
    
    -- Resultado estructurado para futuras calibraciones
    output_summary TEXT,           -- Resumen ejecutivo para la próxima calibración
    elegant_closure TEXT,          -- Cierre elegante de la sesión
    
    -- 🧬 ÁNGULO DE CALIBRACIÓN (F0/F1)
    -- El ángulo con que la IA interpretó esta calibración
    -- 57.3° (1 rad) = Jardín óptimo | 90° = Estructura rígida
    calibration_angle DECIMAL(5,2) DEFAULT 57.3 CHECK (calibration_angle >= 0 AND calibration_angle < 360),
    angle_interpretation TEXT,     -- Cómo el ángulo afectó el resultado
    
    -- Estado de publicación (para replicabilidad comunitaria)
    is_public BOOLEAN DEFAULT FALSE,       -- ¿Visible para la comunidad?
    published_at TIMESTAMPTZ,              -- Cuándo se publicó
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: al menos un target
    CONSTRAINT calibration_target CHECK (node_id IS NOT NULL OR isomorphism_id IS NOT NULL),
    
    -- Constraint: versión única por nodo/isomorfismo/usuario
    -- (permite múltiples calibraciones, pero cada una con versión única)
    UNIQUE(node_id, requested_by, version),
    UNIQUE(isomorphism_id, requested_by, version)
);

CREATE INDEX IF NOT EXISTS idx_calibrations_project ON nexus_calibrations(project_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_node ON nexus_calibrations(node_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_iso ON nexus_calibrations(isomorphism_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_user ON nexus_calibrations(requested_by);
CREATE INDEX IF NOT EXISTS idx_calibrations_version ON nexus_calibrations(node_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_calibrations_previous ON nexus_calibrations(previous_calibration_id);

-- Nota: Los índices de chats se crean después de la tabla

-- ============================================
-- 💬 CHATS COGNÉTICA (5 mensajes por sesión)
-- ============================================
-- Los chats son conversaciones que ALIMENTAN la próxima calibración
-- El investigador aporta contexto, la IA no modifica calibración existente
-- Pero el contenido del chat se usa como INPUT para recalibrar
CREATE TABLE IF NOT EXISTS nexus_calibration_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- A qué nodo/isomorfismo se refiere (independiente de calibración específica)
    node_id UUID REFERENCES nexus_nodes(id) ON DELETE CASCADE,
    isomorphism_id UUID REFERENCES nexus_isomorphisms(id) ON DELETE CASCADE,
    
    -- Calibración que originó este chat (opcional - puede ser chat exploratorio)
    origin_calibration_id UUID REFERENCES nexus_calibrations(id) ON DELETE SET NULL,
    
    -- Calibración que CONSUMIÓ este chat (se llena cuando se recalibra)
    consumed_by_calibration_id UUID REFERENCES nexus_calibrations(id) ON DELETE SET NULL,
    
    -- Quién inició el chat
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Control de mensajes
    message_count INTEGER DEFAULT 0 CHECK (message_count <= 5),
    is_complete BOOLEAN DEFAULT FALSE,
    
    -- Resumen del chat (generado por IA al completar)
    summary TEXT,                    -- Resumen ejecutivo del chat
    new_evidence_provided BOOLEAN DEFAULT FALSE,  -- ¿El humano aportó evidencia nueva?
    suggests_recalibration BOOLEAN DEFAULT FALSE, -- ¿El chat sugiere recalibrar?
    
    -- Estado de publicación
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
    
    -- Datos QUIPU del mensaje (para assistant)
    quipu_data JSONB,  -- {calibrations: [], f0_score: number, pattern: string, is_paralloros: boolean}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON nexus_chat_messages(chat_id);

-- Índices de chats (movidos aquí después de crear la tabla)
CREATE INDEX IF NOT EXISTS idx_chats_project ON nexus_calibration_chats(project_id);
CREATE INDEX IF NOT EXISTS idx_chats_node ON nexus_calibration_chats(node_id);
CREATE INDEX IF NOT EXISTS idx_chats_user ON nexus_calibration_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_origin ON nexus_calibration_chats(origin_calibration_id);
CREATE INDEX IF NOT EXISTS idx_chats_consumed ON nexus_calibration_chats(consumed_by_calibration_id);
CREATE INDEX IF NOT EXISTS idx_nodes_torsion ON nexus_nodes(torsion_angle);
CREATE INDEX IF NOT EXISTS idx_calibrations_angle ON nexus_calibrations(calibration_angle);

-- ============================================
-- 🔒 ROW LEVEL SECURITY (RLS)
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

-- Regiones: públicas (son globales)
CREATE POLICY "nexus_regions_select" ON nexus_regions FOR SELECT USING (true);

-- Tags: visibles por proyecto
CREATE POLICY "nexus_tags_select" ON nexus_pattern_tags FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);

CREATE POLICY "nexus_tags_insert" ON nexus_pattern_tags FOR INSERT WITH CHECK (
    nexus_user_has_permission(project_id, 'can_manage_master_data')
);

-- Nodos: visibles por proyecto
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

-- Node tags: heredan permisos del nodo
CREATE POLICY "nexus_node_tags_select" ON nexus_node_tags FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM nexus_nodes n
        WHERE n.id = nexus_node_tags.node_id
        AND nexus_user_has_project_access(n.project_id)
    )
);

CREATE POLICY "nexus_node_tags_insert" ON nexus_node_tags FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM nexus_nodes n
        WHERE n.id = nexus_node_tags.node_id
        AND nexus_user_has_permission(n.project_id, 'can_manage_master_data')
    )
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
    EXISTS (
        SELECT 1 FROM nexus_isomorphisms i
        WHERE i.id = nexus_isomorphism_connections.isomorphism_id
        AND nexus_user_has_project_access(i.project_id)
    )
);

CREATE POLICY "nexus_iso_conn_insert" ON nexus_isomorphism_connections FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM nexus_isomorphisms i
        WHERE i.id = nexus_isomorphism_connections.isomorphism_id
        AND nexus_user_has_permission(i.project_id, 'can_manage_master_data')
    )
);

-- Calibraciones: por proyecto + usuario
CREATE POLICY "nexus_calibrations_select" ON nexus_calibrations FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);

-- Nota: Usamos can_manage_master_data porque can_review_articles puede no existir en todos los proyectos
CREATE POLICY "nexus_calibrations_insert" ON nexus_calibrations FOR INSERT WITH CHECK (
    nexus_user_has_project_access(project_id)
    -- Cualquier miembro activo puede calibrar (la calibración es democrática)
);

-- Chats: por proyecto (tienen project_id propio)
CREATE POLICY "nexus_chats_select" ON nexus_calibration_chats FOR SELECT USING (
    nexus_user_has_project_access(project_id)
);

CREATE POLICY "nexus_chats_insert" ON nexus_calibration_chats FOR INSERT WITH CHECK (
    nexus_user_has_project_access(project_id)
);

-- Mensajes: heredan del chat
CREATE POLICY "nexus_messages_select" ON nexus_chat_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM nexus_calibration_chats ch
        WHERE ch.id = nexus_chat_messages.chat_id
        AND nexus_user_has_project_access(ch.project_id)
    )
);

CREATE POLICY "nexus_messages_insert" ON nexus_chat_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM nexus_calibration_chats ch
        WHERE ch.id = nexus_chat_messages.chat_id
        AND nexus_user_has_project_access(ch.project_id)
    )
);

-- ============================================
-- 📊 VISTAS ÚTILES
-- ============================================

-- Vista: Nodos con sus tags
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

-- Vista: Análisis de diversidad geográfica por proyecto
-- Incluye conteo por cada tipo de semilla epistémica
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

-- Vista: Estadísticas de calibración por nodo
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

-- Vista: Timeline de nodos por proyecto
CREATE OR REPLACE VIEW nexus_timeline AS
SELECT 
    n.project_id,
    n.id as node_id,
    n.name,
    n.emoji,
    n.node_type,
    n.maturity,
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

-- Vista: Historial de calibraciones con cadena de versiones
CREATE OR REPLACE VIEW nexus_calibration_history AS
SELECT 
    c.id,
    c.project_id,
    c.node_id,
    c.isomorphism_id,
    c.version,
    c.previous_calibration_id,
    c.requested_by,
    u.email as requested_by_email,
    c.ai_model,
    c.result,
    c.reasoning,
    c.quipu_cognitive,
    c.quipu_resonant,
    c.geometric_pattern,
    c.output_summary,
    c.is_public,
    c.created_at,
    -- Contar chats asociados
    (SELECT COUNT(*) FROM nexus_calibration_chats ch 
     WHERE ch.origin_calibration_id = c.id) as chats_originated,
    (SELECT COUNT(*) FROM nexus_calibration_chats ch 
     WHERE ch.consumed_by_calibration_id = c.id) as chats_consumed,
    -- Nodo info
    n.name as node_name,
    n.emoji as node_emoji,
    n.maturity as node_maturity
FROM nexus_calibrations c
LEFT JOIN auth.users u ON c.requested_by = u.id
LEFT JOIN nexus_nodes n ON c.node_id = n.id
ORDER BY c.node_id, c.version DESC;

-- Vista: Última calibración por nodo (la más reciente)
CREATE OR REPLACE VIEW nexus_latest_calibrations AS
SELECT DISTINCT ON (c.node_id)
    c.*,
    n.name as node_name,
    n.emoji as node_emoji
FROM nexus_calibrations c
JOIN nexus_nodes n ON c.node_id = n.id
ORDER BY c.node_id, c.version DESC, c.created_at DESC;

-- Vista: Chats pendientes de consumir (sugieren recalibración)
CREATE OR REPLACE VIEW nexus_pending_recalibrations AS
SELECT 
    ch.id as chat_id,
    ch.project_id,
    ch.node_id,
    ch.user_id,
    ch.summary,
    ch.new_evidence_provided,
    ch.created_at as chat_created_at,
    ch.completed_at as chat_completed_at,
    n.name as node_name,
    n.emoji as node_emoji,
    lc.id as last_calibration_id,
    lc.version as last_calibration_version,
    lc.result as last_calibration_result
FROM nexus_calibration_chats ch
JOIN nexus_nodes n ON ch.node_id = n.id
LEFT JOIN nexus_latest_calibrations lc ON ch.node_id = lc.node_id
WHERE ch.is_complete = true
  AND ch.suggests_recalibration = true
  AND ch.consumed_by_calibration_id IS NULL;

-- ============================================
-- 🔄 TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION nexus_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas con updated_at
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
-- 📝 COMENTARIOS
-- ============================================
COMMENT ON TABLE nexus_nodes IS 'Nodos epistémicos: cualquier hito en la historia de un campo de investigación';
COMMENT ON COLUMN nexus_nodes.maturity IS 'Madurez epistémica: seed_green (lista), seed_purple (adelantada), seed_red (problema), seed_yellow (mezcla), seed_white (falla perezosa)';
COMMENT ON COLUMN nexus_nodes.node_type IS 'Tipo de nodo: civilization, research, event, concept, institution, person, artifact, pattern';
COMMENT ON COLUMN nexus_nodes.torsion_angle IS 'Ángulo de torsión dentro de la semilla (0-360°). 57.3° = 1 radián = ángulo del Jardín. 90° = Muro de Fábrica';
COMMENT ON COLUMN nexus_calibrations.calibration_angle IS 'Ángulo con que la IA interpretó esta calibración. 57.3° = Jardín óptimo, 90° = estructura rígida';
COMMENT ON TABLE nexus_calibrations IS 'Calibraciones F₀ versionadas: cada calibración es inmutable, las nuevas referencian las anteriores';
COMMENT ON COLUMN nexus_calibrations.version IS 'Número de versión de la calibración para este nodo/usuario';
COMMENT ON COLUMN nexus_calibrations.previous_calibration_id IS 'Referencia a la calibración anterior que esta versión mejora';
COMMENT ON COLUMN nexus_calibrations.input_context IS 'JSON con contexto que alimentó esta calibración: calibraciones previas, chats, etc.';
COMMENT ON TABLE nexus_calibration_chats IS 'Chats de 5 mensajes que alimentan futuras recalibraciones - el humano aporta contexto';
COMMENT ON COLUMN nexus_calibration_chats.consumed_by_calibration_id IS 'Calibración que usó este chat como input - trazabilidad completa';
COMMENT ON VIEW nexus_diversity_analysis IS 'Análisis de diversidad geográfica de fuentes por proyecto - detecta sesgos regionales';

-- ============================================
-- 🎯 FIN DEL SCHEMA v2.0
-- ============================================
-- 
-- PRÓXIMOS PASOS:
-- 1. Ejecutar este SQL en Supabase
-- 2. Regenerar types: npx supabase gen types typescript
-- 3. Actualizar nexus-actions.ts para usar nexus_nodes
-- 4. Crear componente de carga JSON genérico
-- 5. Migrar datos de hipatia-nexus.json al nuevo formato
--
-- 🌊🎼🐍 | Calibración Radián v2.1 | 10 Dic 2025
