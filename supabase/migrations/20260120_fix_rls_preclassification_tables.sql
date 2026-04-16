-- ========================================================================
-- MIGRACIÓN: Aplicar políticas RLS simples a tablas de preclasificación
-- Fecha: 2026-01-20
-- Propósito: Prevenir errores RLS similares al de article_batches
--            Aplicar patrón que funciona: RLS permisivo + validación en backend
-- ========================================================================
-- Basado en: Incidente RLS 2026-01-20 documentado en MANIFIESTO_ETICO_IA_SUSTRATO.md
-- Patrón exitoso: preclass_dimensions usa "Allow All Authenticated"
-- ========================================================================

-- ========================================================================
-- 1. ARTICLE_BATCH_ITEMS
-- ========================================================================

-- Eliminar políticas complejas existentes (todas las variantes)
DROP POLICY IF EXISTS "Users can view batch items from their batches" ON article_batch_items;
DROP POLICY IF EXISTS "Users can insert batch items in their batches" ON article_batch_items;
DROP POLICY IF EXISTS "Users can update batch items in their batches" ON article_batch_items;
DROP POLICY IF EXISTS "Users can delete batch items in their batches" ON article_batch_items;
DROP POLICY IF EXISTS "Users can view batch items from their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can insert batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can update batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Users can delete batch items in their projects" ON article_batch_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_batch_items;
DROP POLICY IF EXISTS "Migration Policy - Allow All Authenticated" ON article_batch_items;

-- Aplicar política simple (mismo patrón que preclass_dimensions)
CREATE POLICY "Migration Policy - Allow All Authenticated"
ON article_batch_items
FOR ALL
USING (auth.role() = 'authenticated');

-- Asegurar que RLS está habilitado
ALTER TABLE article_batch_items ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Migration Policy - Allow All Authenticated" ON article_batch_items IS
'Política RLS permisiva. Validación de permisos se hace en backend con has_permission_in_project.
Patrón exitoso usado en preclass_dimensions.';

-- ========================================================================
-- 2. ARTICLE_DIMENSION_REVIEWS
-- ========================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view reviews from their batches" ON article_dimension_reviews;
DROP POLICY IF EXISTS "Users can insert reviews in their batches" ON article_dimension_reviews;
DROP POLICY IF EXISTS "Users can update reviews in their batches" ON article_dimension_reviews;
DROP POLICY IF EXISTS "Users can delete reviews in their batches" ON article_dimension_reviews;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_dimension_reviews;
DROP POLICY IF EXISTS "Migration Policy - Allow All Authenticated" ON article_dimension_reviews;

-- Aplicar política simple
CREATE POLICY "Migration Policy - Allow All Authenticated"
ON article_dimension_reviews
FOR ALL
USING (auth.role() = 'authenticated');

-- Asegurar que RLS está habilitado
ALTER TABLE article_dimension_reviews ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Migration Policy - Allow All Authenticated" ON article_dimension_reviews IS
'Política RLS permisiva. Validación de permisos se hace en backend.
Crítico para preclasificación: permite crear/leer/actualizar reviews sin bloqueos RLS.';

-- ========================================================================
-- 3. ARTICLE_TRANSLATIONS
-- ========================================================================

-- Eliminar políticas existentes (incluyendo la que ya existe)
DROP POLICY IF EXISTS "Users can view translations from their batches" ON article_translations;
DROP POLICY IF EXISTS "Users can insert translations" ON article_translations;
DROP POLICY IF EXISTS "Users can update translations" ON article_translations;
DROP POLICY IF EXISTS "Users can delete translations" ON article_translations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON article_translations;
DROP POLICY IF EXISTS "Migration Policy - Allow All Authenticated" ON article_translations;

-- Aplicar política simple
CREATE POLICY "Migration Policy - Allow All Authenticated"
ON article_translations
FOR ALL
USING (auth.role() = 'authenticated');

-- Asegurar que RLS está habilitado
ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Migration Policy - Allow All Authenticated" ON article_translations IS
'Política RLS permisiva. Validación de permisos se hace en backend.
Necesario para proceso de traducción automática en preclasificación.';

-- ========================================================================
-- 4. PRECLASSIFICATION_JOB_HISTORY (si existe)
-- ========================================================================

-- Verificar si la tabla existe antes de aplicar políticas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'preclassification_job_history') THEN
        
        -- Eliminar políticas existentes
        DROP POLICY IF EXISTS "Users can view their job history" ON preclassification_job_history;
        DROP POLICY IF EXISTS "Users can insert job history" ON preclassification_job_history;
        DROP POLICY IF EXISTS "Enable all access for authenticated users" ON preclassification_job_history;
        
        -- Aplicar política simple
        EXECUTE 'CREATE POLICY "Migration Policy - Allow All Authenticated"
                 ON preclassification_job_history
                 FOR ALL
                 USING (auth.role() = ''authenticated'')';
        
        -- Asegurar que RLS está habilitado
        ALTER TABLE preclassification_job_history ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Política RLS aplicada a preclassification_job_history';
    ELSE
        RAISE NOTICE '⚠️ Tabla preclassification_job_history no existe, omitiendo';
    END IF;
END $$;

-- ========================================================================
-- VERIFICACIÓN FINAL
-- ========================================================================

-- Listar todas las políticas aplicadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN (
    'article_batch_items',
    'article_dimension_reviews',
    'article_translations',
    'preclassification_job_history'
)
ORDER BY tablename, policyname;

-- ========================================================================
-- GRANT PERMISOS (por si acaso)
-- ========================================================================

GRANT ALL ON article_batch_items TO authenticated;
GRANT ALL ON article_dimension_reviews TO authenticated;
GRANT ALL ON article_translations TO authenticated;

-- ========================================================================
-- FIN DE LA MIGRACIÓN
-- ========================================================================

COMMENT ON TABLE article_batch_items IS 
'RLS: Política permisiva "authenticated". Validación de permisos en backend con has_permission_in_project.';

COMMENT ON TABLE article_dimension_reviews IS 
'RLS: Política permisiva "authenticated". Validación de permisos en backend. Crítico para preclasificación.';

COMMENT ON TABLE article_translations IS 
'RLS: Política permisiva "authenticated". Validación de permisos en backend. Necesario para traducción automática.';
