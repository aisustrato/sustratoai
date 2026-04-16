-- DIAGNÓSTICO ESTRUCTURAL PROFUNDO: FASES, LOTES Y RELACIONES
-- Objetivo: Detectar desconexiones lógicas (Fases sin lotes, Lotes sin fases, Dimensiones huérfanas).

-- 1. FASES ACTIVAS Y SU CONTENIDO
SELECT 
    p.name as proyecto,
    ph.id as fase_id,
    ph.name as fase,
    ph.is_active as activa,
    count(distinct b.id) as lotes_vinculados,
    count(distinct d.id) as dimensiones_configuradas
FROM preclassification_phases ph
JOIN projects p ON ph.project_id = p.id
LEFT JOIN article_batches b ON ph.id = b.phase_id
LEFT JOIN preclass_dimensions d ON ph.id = d.phase_id
GROUP BY p.name, ph.id, ph.name, ph.is_active
ORDER BY p.name, ph.created_at DESC;

-- 2. LOTES HUÉRFANOS DE FASE (El posible culpable)
-- Muestra lotes que tienen project_id pero phase_id NULL o inválido
SELECT 
    b.id as lote_id,
    b.batch_number,
    b.name as nombre_lote,
    p.name as proyecto,
    b.phase_id,
    CASE WHEN b.phase_id IS NULL THEN 'HUÉRFANO' ELSE 'OK' END as estado
FROM article_batches b
JOIN projects p ON b.project_id = p.id
WHERE b.phase_id IS NULL
ORDER BY b.created_at DESC;

-- 3. DIMENSIONES HUÉRFANAS O DESCONECTADAS
-- Dimensiones que existen pero no están ligadas a una fase activa
SELECT 
    d.id as dimension_id,
    d.name as dimension,
    d.phase_id,
    ph.name as fase_nombre
FROM preclass_dimensions d
LEFT JOIN preclassification_phases ph ON d.phase_id = ph.id
WHERE d.phase_id IS NULL OR ph.id IS NULL;

-- 4. INCONSISTENCIA DE PROYECTO (Lote en proyecto A, Fase en proyecto B)
SELECT 
    b.id as lote_id,
    b.name as lote,
    p_lote.name as proyecto_del_lote,
    ph.name as fase_asignada,
    p_fase.name as proyecto_de_la_fase
FROM article_batches b
JOIN projects p_lote ON b.project_id = p_lote.id
JOIN preclassification_phases ph ON b.phase_id = ph.id
JOIN projects p_fase ON ph.project_id = p_fase.id
WHERE b.project_id != ph.project_id;
