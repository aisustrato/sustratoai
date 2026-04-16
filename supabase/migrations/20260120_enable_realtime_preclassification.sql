-- ========================================================================
-- MIGRACIÓN: Habilitar Realtime en tablas de preclasificación
-- Fecha: 2026-01-20
-- Propósito: Permitir actualizaciones en tiempo real en la app
-- ========================================================================
-- Basado en: Análisis de suscripciones Realtime en el código frontend
-- Tablas identificadas que necesitan Realtime:
--   1. article_batches (estado de lotes)
--   2. article_batch_items (items de lotes)
--   3. article_dimension_reviews (clasificaciones/reviews)
--   4. article_translations (traducciones)
--   5. ai_job_history (historial de trabajos IA)
-- ========================================================================

-- ========================================================================
-- 1. ARTICLE_BATCHES
-- ========================================================================
-- Usado en: /articulos/preclasificacion/page.tsx (lista de lotes)
--           /articulos/preclasificacion/[batchId]/page.tsx (detalle de lote)
-- Eventos: UPDATE (cambios de status, assigned_to, etc.)

ALTER PUBLICATION supabase_realtime ADD TABLE article_batches;

COMMENT ON TABLE article_batches IS 
'Realtime habilitado. Frontend escucha cambios para actualizar lista de lotes y estado del lote actual.';

-- ========================================================================
-- 2. ARTICLE_BATCH_ITEMS
-- ========================================================================
-- Usado en: /articulos/preclasificacion/[batchId]/page.tsx (items del lote)
-- Eventos: UPDATE (cambios de status de items)

ALTER PUBLICATION supabase_realtime ADD TABLE article_batch_items;

COMMENT ON TABLE article_batch_items IS 
'Realtime habilitado. Frontend escucha cambios en status de items individuales del lote.';

-- ========================================================================
-- 3. ARTICLE_DIMENSION_REVIEWS (CRÍTICO)
-- ========================================================================
-- Usado en: /articulos/preclasificacion/[batchId]/page.tsx (clasificaciones)
-- Eventos: INSERT (nuevas clasificaciones de IA), UPDATE (cambios de status, is_final)
-- Esta es la tabla MÁS IMPORTANTE para Realtime en preclasificación

ALTER PUBLICATION supabase_realtime ADD TABLE article_dimension_reviews;

COMMENT ON TABLE article_dimension_reviews IS 
'Realtime habilitado. Frontend escucha INSERT/UPDATE para mostrar clasificaciones de IA en tiempo real.
CRÍTICO: Permite ver progreso de preclasificación mientras la IA trabaja.';

-- ========================================================================
-- 4. ARTICLE_TRANSLATIONS
-- ========================================================================
-- Usado en: Proceso de traducción automática
-- Eventos: INSERT (nuevas traducciones), UPDATE (status de traducción)

ALTER PUBLICATION supabase_realtime ADD TABLE article_translations;

COMMENT ON TABLE article_translations IS 
'Realtime habilitado. Frontend puede mostrar progreso de traducción en tiempo real.';

-- ========================================================================
-- 5. AI_JOB_HISTORY
-- ========================================================================
-- Usado en: JobManager (componente de trabajos en background)
-- Eventos: INSERT (nuevo trabajo), UPDATE (progreso, status)

ALTER PUBLICATION supabase_realtime ADD TABLE ai_job_history;

COMMENT ON TABLE ai_job_history IS 
'Realtime habilitado. JobManager escucha cambios para actualizar progreso de trabajos IA.';

-- ========================================================================
-- VERIFICACIÓN: Listar tablas con Realtime habilitado
-- ========================================================================

SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN (
    'article_batches',
    'article_batch_items',
    'article_dimension_reviews',
    'article_translations',
    'ai_job_history'
)
ORDER BY tablename;

-- ========================================================================
-- NOTAS IMPORTANTES
-- ========================================================================

-- 1. PERFORMANCE:
--    Realtime consume recursos. Solo habilitar en tablas que realmente lo necesitan.
--    Las 5 tablas identificadas son críticas para la UX de preclasificación.

-- 2. SEGURIDAD:
--    Realtime respeta las políticas RLS. Los usuarios solo recibirán eventos
--    de filas que pueden ver según sus permisos.

-- 3. FRONTEND:
--    El código ya tiene las suscripciones implementadas:
--    - article_batches: channel `batch-${batchId}` y `realtime-lotes-de-trabajo`
--    - article_dimension_reviews: channel `reviews-${batchId}`
--    Esta migración solo habilita el backend para que funcionen.

-- 4. TESTING:
--    Después de ejecutar esta migración:
--    a) Abrir /articulos/preclasificacion/[batchId]
--    b) Iniciar preclasificación IA
--    c) Verificar que las clasificaciones aparecen en tiempo real sin refrescar

-- ========================================================================
-- FIN DE LA MIGRACIÓN
-- ========================================================================
