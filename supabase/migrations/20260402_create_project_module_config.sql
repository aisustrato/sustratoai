-- ============================================================================
-- Migración: Sistema de Configuración de Módulos por Proyecto
-- Fecha: 2 Abril 2026
-- Objetivo: Permitir que los menús sean condicionales según configuración real
--           del proyecto, no solo campos booleanos en la tabla projects
-- ============================================================================

-- 1. Crear tabla de configuración de módulos
CREATE TABLE IF NOT EXISTS project_module_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL CHECK (module_name IN (
    'bibliography',
    'cognetica',
    'interviews',
    'planning',
    'minotauro',
    'jardines'
  )),
  
  -- Control de habilitación y configuración
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  is_configured BOOLEAN DEFAULT false NOT NULL,
  
  -- Configuración específica del módulo (flexible)
  config_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadatos
  configured_at TIMESTAMPTZ,
  configured_by UUID REFERENCES auth.users(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint de unicidad
  UNIQUE(project_id, module_name)
);

-- 2. Crear índices para performance
CREATE INDEX idx_project_module_config_project_id 
  ON project_module_config(project_id);

CREATE INDEX idx_project_module_config_module_name 
  ON project_module_config(module_name);

CREATE INDEX idx_project_module_config_enabled 
  ON project_module_config(project_id, module_name) 
  WHERE is_enabled = true AND is_configured = true;

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_project_module_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_module_config_updated_at
  BEFORE UPDATE ON project_module_config
  FOR EACH ROW
  EXECUTE FUNCTION update_project_module_config_updated_at();

-- 4. Función helper para verificar si un módulo está configurado
CREATE OR REPLACE FUNCTION is_module_configured(
  p_project_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_module_config
    WHERE project_id = p_project_id
      AND module_name = p_module_name
      AND is_enabled = true
      AND is_configured = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Función para obtener configuración de todos los módulos de un proyecto
CREATE OR REPLACE FUNCTION get_project_modules_config(p_project_id UUID)
RETURNS TABLE (
  module_name TEXT,
  is_enabled BOOLEAN,
  is_configured BOOLEAN,
  config_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pmc.module_name,
    pmc.is_enabled,
    pmc.is_configured,
    pmc.config_data
  FROM project_module_config pmc
  WHERE pmc.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. Migrar datos existentes de la tabla projects
-- Crear registros en project_module_config basados en los campos booleanos actuales
INSERT INTO project_module_config (
  project_id,
  module_name,
  is_enabled,
  is_configured,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'bibliography',
  COALESCE(p.module_bibliography, false),
  -- Bibliography se considera configurado si tiene dimensiones de preclasificación
  EXISTS (
    SELECT 1 FROM preclass_dimensions pd 
    WHERE pd.project_id = p.id
  ),
  NOW(),
  NOW()
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_module_config pmc
  WHERE pmc.project_id = p.id AND pmc.module_name = 'bibliography'
)
ON CONFLICT (project_id, module_name) DO NOTHING;

INSERT INTO project_module_config (
  project_id,
  module_name,
  is_enabled,
  is_configured,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'cognetica',
  COALESCE(p.module_cognetica, false),
  -- Cognetica se considera configurado si tiene artefactos
  EXISTS (
    SELECT 1 FROM cog_artifacts ca 
    WHERE ca.project_id = p.id
  ),
  NOW(),
  NOW()
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_module_config pmc
  WHERE pmc.project_id = p.id AND pmc.module_name = 'cognetica'
)
ON CONFLICT (project_id, module_name) DO NOTHING;

INSERT INTO project_module_config (
  project_id,
  module_name,
  is_enabled,
  is_configured,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'interviews',
  COALESCE(p.module_interviews, false),
  false, -- Por ahora no hay criterio de configuración
  NOW(),
  NOW()
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_module_config pmc
  WHERE pmc.project_id = p.id AND pmc.module_name = 'interviews'
)
ON CONFLICT (project_id, module_name) DO NOTHING;

INSERT INTO project_module_config (
  project_id,
  module_name,
  is_enabled,
  is_configured,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'planning',
  COALESCE(p.module_planning, false),
  false, -- Por ahora no hay criterio de configuración
  NOW(),
  NOW()
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_module_config pmc
  WHERE pmc.project_id = p.id AND pmc.module_name = 'planning'
)
ON CONFLICT (project_id, module_name) DO NOTHING;

-- 7. RLS (Row Level Security)
ALTER TABLE project_module_config ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver la configuración de módulos de sus proyectos
CREATE POLICY "Users can view module config of their projects"
  ON project_module_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_module_config.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Política: Solo usuarios con permisos pueden modificar configuración de módulos
CREATE POLICY "Users with permissions can modify module config"
  ON project_module_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN project_roles pr ON pm.project_role_id = pr.id
      WHERE pm.project_id = project_module_config.project_id
        AND pm.user_id = auth.uid()
        AND pr.can_manage_master_data = true
    )
  );

-- 8. Comentarios para documentación
COMMENT ON TABLE project_module_config IS 
  'Configuración de módulos por proyecto. Permite control granular de qué módulos están habilitados y configurados.';

COMMENT ON COLUMN project_module_config.is_enabled IS 
  'Indica si el módulo está habilitado para el proyecto (equivalente a los campos module_* en projects)';

COMMENT ON COLUMN project_module_config.is_configured IS 
  'Indica si el módulo tiene la configuración necesaria para funcionar (ej: dimensiones de preclasificación)';

COMMENT ON COLUMN project_module_config.config_data IS 
  'Datos de configuración específicos del módulo en formato JSON flexible';

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
-- 
-- Para usar este sistema en el frontend:
-- 
-- 1. Actualizar el tipo UserProjectSetting para incluir module_configs:
--    module_configs?: {
--      [key: string]: {
--        is_enabled: boolean;
--        is_configured: boolean;
--        config_data?: any;
--      }
--    }
--
-- 2. Modificar obtenerProyectosConSettingsUsuario() para incluir:
--    SELECT 
--      p.*,
--      ups.*,
--      (
--        SELECT jsonb_object_agg(
--          pmc.module_name,
--          jsonb_build_object(
--            'is_enabled', pmc.is_enabled,
--            'is_configured', pmc.is_configured,
--            'config_data', pmc.config_data
--          )
--        )
--        FROM project_module_config pmc
--        WHERE pmc.project_id = p.id
--      ) as module_configs
--    FROM ...
--
-- 3. En StandardNavbar.tsx, cambiar:
--    if (proyectoActual.module_cognetica) { ... }
--    
--    Por:
--    if (proyectoActual.module_configs?.cognetica?.is_enabled && 
--        proyectoActual.module_configs?.cognetica?.is_configured) { ... }
--
-- ============================================================================
