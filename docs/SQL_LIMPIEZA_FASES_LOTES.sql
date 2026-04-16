-- LIMPIEZA PROFUNDA DE PROCESOS DE TRABAJO (TÁBULA RASA CONTROLADA)
-- Objetivo: Eliminar fases, lotes y revisiones corruptas para reiniciar limpio.
-- ⚠️ ADVERTENCIA: ESTO BORRA TODO EL TRABAJO DE PRECLASIFICACIÓN.
-- NO BORRA: Artículos base, Proyectos ni Usuarios.

BEGIN;

RAISE NOTICE '🔥 INICIANDO LIMPIEZA DE ZONA DE TRABAJO...';

-- 1. Eliminar Revisiones (La capa más baja)
DELETE FROM article_dimension_reviews;
RAISE NOTICE '✅ Revisiones eliminadas.';

-- 2. Eliminar Traducciones de Artículos (Opcional, si quieres reprocesar traducciones limpias)
-- DELETE FROM article_translations; 
-- RAISE NOTICE '✅ Traducciones eliminadas.'; -- Descomentar si se desea

-- 3. Eliminar Items de Lotes
DELETE FROM article_batch_items;
RAISE NOTICE '✅ Items de lotes eliminados.';

-- 4. Eliminar Lotes
DELETE FROM article_batches;
RAISE NOTICE '✅ Lotes eliminados.';

-- 5. Eliminar Opciones de Dimensiones
DELETE FROM preclass_dimension_options;
RAISE NOTICE '✅ Opciones de dimensiones eliminadas.';

-- 6. Eliminar Dimensiones
DELETE FROM preclass_dimensions;
RAISE NOTICE '✅ Dimensiones eliminadas.';

-- 7. Eliminar Fases
DELETE FROM preclassification_phases;
RAISE NOTICE '✅ Fases eliminadas.';

-- 8. Reiniciar secuencias (Opcional, para que los IDs numéricos empiecen ordenados si son seriales)
-- ALTER SEQUENCE some_sequence RESTART WITH 1;

RAISE NOTICE '✨ ZONA DE TRABAJO LIMPIA. LISTO PARA CREAR FASES NUEVAS.';

COMMIT;
