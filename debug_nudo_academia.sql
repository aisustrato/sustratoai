-- Debug: Buscar la semilla "nudo academia" específicamente
SELECT 
    id,
    content,
    artifact_id,
    project_id,
    tags,
    created_at,
    created_by
FROM cog_fractal_seeds 
WHERE content ILIKE '%nudo academia%'
   OR content ILIKE '%nudo%'
   OR content ILIKE '%academia%';

-- Verificar si tiene el tag 'cita'
SELECT 
    content,
    tags,
    CASE 
        WHEN tags @> '{"cita"}' THEN 'TIENE tag cita (sería excluida)'
        WHEN tags @> '{"manual"}' THEN 'TIENE tag manual (debería incluirse)'
        ELSE 'Tags especiales: ' || COALESCE(array_to_string(tags, ', '), 'sin tags')
    END as tag_analysis
FROM cog_fractal_seeds 
WHERE content ILIKE '%nudo academia%';
