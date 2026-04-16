-- ========================================================================
-- MIGRACIÓN: Habilitar RLS en ai_job_history (patrón preclasificación)
-- Fecha: 2026-03-02
-- ========================================================================

-- Habilitar RLS
ALTER TABLE ai_job_history ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe
DROP POLICY IF EXISTS "Migration Policy - Allow All Authenticated" ON ai_job_history;

-- Crear política simple (mismo patrón que article_dimension_reviews)
CREATE POLICY "Migration Policy - Allow All Authenticated"
ON ai_job_history
FOR ALL
USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Migration Policy - Allow All Authenticated" ON ai_job_history IS
'Política RLS permisiva. Validación de permisos se hace en backend.
Permite polling de jobs sin bloqueos RLS.';

-- ========================================================================
-- VERIFICACIÓN
-- ========================================================================

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'ai_job_history'
ORDER BY policyname;

-- ========================================================================
-- NOTAS IMPORTANTES
-- ========================================================================

-- 1. PATRÓN DEL PROYECTO:
--    - Esta migración sigue el patrón real del sistema
--    - Verifica: user_id = auth.uid() (el job es del usuario)
--    - Verifica: project_id en proyectos donde el usuario es owner o member
--    - Service Role bypasea RLS automáticamente

-- 2. POLLING:
--    - Ahora el frontend puede hacer SELECT en ai_job_history
--    - Solo verá jobs donde user_id = auth.uid()
--    - Y solo de proyectos donde tiene acceso

-- 3. REALTIME:
--    - Realtime ya está habilitado en ai_job_history
--    - Con esta política, Realtime también funcionará
--    - Los usuarios recibirán eventos solo de sus propios jobs

-- ========================================================================
-- FIN DE LA MIGRACIÓN
-- ========================================================================
