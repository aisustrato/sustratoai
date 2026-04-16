-- =====================================================================
-- MIGRACIÓN: Corrección de owner_id NULL y Políticas RLS
-- Fecha: 2026-01-20
-- Problema RAÍZ: owner_id es NULL en proyectos, causando fallo en RLS
-- =====================================================================

-- PASO 1: ASIGNAR owner_id A PROYECTOS EXISTENTES
-- Estrategia: Usar el primer miembro activo del proyecto como owner
-- Si no hay miembros, usar el usuario que creó más contenido

DO $$
DECLARE
    proyecto RECORD;
    nuevo_owner UUID;
BEGIN
    -- Iterar sobre proyectos sin owner
    FOR proyecto IN 
        SELECT id, name FROM projects WHERE owner_id IS NULL
    LOOP
        -- Intentar encontrar un miembro activo del proyecto
        SELECT user_id INTO nuevo_owner
        FROM project_members
        WHERE project_id = proyecto.id
        AND is_active_for_user = true
        ORDER BY joined_at ASC
        LIMIT 1;
        
        -- Si no hay miembros, buscar usuario que creó artículos
        IF nuevo_owner IS NULL THEN
            SELECT user_id INTO nuevo_owner
            FROM article_notes
            WHERE project_id = proyecto.id
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;
        
        -- Si aún no hay owner, buscar en article_groups
        IF nuevo_owner IS NULL THEN
            SELECT user_id INTO nuevo_owner
            FROM article_groups
            WHERE project_id = proyecto.id
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;
        
        -- Actualizar el proyecto con el owner encontrado
        IF nuevo_owner IS NOT NULL THEN
            UPDATE projects 
            SET owner_id = nuevo_owner
            WHERE id = proyecto.id;
            
            RAISE NOTICE 'Proyecto % asignado a owner %', proyecto.name, nuevo_owner;
        ELSE
            RAISE WARNING 'No se pudo asignar owner al proyecto %', proyecto.name;
        END IF;
    END LOOP;
END $$;

-- PASO 2: ELIMINAR POLÍTICAS RLS EXISTENTES
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_batches;
DROP POLICY IF EXISTS "Users can view batches from their projects" ON article_batches;
DROP POLICY IF EXISTS "Users can insert batches in their projects" ON article_batches;
DROP POLICY IF EXISTS "Users can update batches in their projects" ON article_batches;
DROP POLICY IF EXISTS "Users can delete batches in their projects" ON article_batches;

-- PASO 3: CREAR POLÍTICAS RLS SIMPLIFICADAS (sin función auxiliar)
-- Estas políticas verifican directamente si el usuario es miembro del proyecto

-- Política SELECT: Ver lotes de proyectos donde soy miembro
CREATE POLICY "Users can view batches from their projects"
ON article_batches
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = article_batches.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
);

-- Política INSERT: Crear lotes en proyectos donde soy miembro
CREATE POLICY "Users can insert batches in their projects"
ON article_batches
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = article_batches.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
);

-- Política UPDATE: Actualizar lotes de proyectos donde soy miembro
CREATE POLICY "Users can update batches in their projects"
ON article_batches
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = article_batches.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = article_batches.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
);

-- Política DELETE: Eliminar lotes si tengo permisos de gestión
CREATE POLICY "Users can delete batches in their projects"
ON article_batches
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM project_members pm
        JOIN project_roles pr ON pm.project_role_id = pr.id
        WHERE pm.project_id = article_batches.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
        AND pr.can_create_batches = true
    )
);

-- PASO 4: POLÍTICAS PARA article_batch_items
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_batch_items;
DROP POLICY IF EXISTS "Users can view batch items from their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can insert batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can update batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can delete batch items in their projects" ON article_batch_items;

CREATE POLICY "Users can view batch items from their projects"
ON article_batch_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM article_batches ab
        JOIN project_members pm ON pm.project_id = ab.project_id
        WHERE ab.id = article_batch_items.batch_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
);

CREATE POLICY "Users can insert batch items in their projects"
ON article_batch_items
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM article_batches ab
        JOIN project_members pm ON pm.project_id = ab.project_id
        WHERE ab.id = article_batch_items.batch_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
);

CREATE POLICY "Users can update batch items in their projects"
ON article_batch_items
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM article_batches ab
        JOIN project_members pm ON pm.project_id = ab.project_id
        WHERE ab.id = article_batch_items.batch_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM article_batches ab
        JOIN project_members pm ON pm.project_id = ab.project_id
        WHERE ab.id = article_batch_items.batch_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
    )
);

CREATE POLICY "Users can delete batch items in their projects"
ON article_batch_items
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM article_batches ab
        JOIN project_members pm ON pm.project_id = ab.project_id
        JOIN project_roles pr ON pm.project_role_id = pr.id
        WHERE ab.id = article_batch_items.batch_id
        AND pm.user_id = auth.uid()
        AND pm.is_active_for_user = true
        AND pr.can_create_batches = true
    )
);

-- PASO 5: VERIFICAR QUE RLS ESTÉ HABILITADO
ALTER TABLE article_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_batch_items ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
