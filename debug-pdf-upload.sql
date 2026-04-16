-- Verificar últimos artefactos creados
SELECT 
    id,
    title,
    type,
    mime_type,
    status,
    created_at
FROM cog_artifacts
ORDER BY created_at DESC
LIMIT 5;
