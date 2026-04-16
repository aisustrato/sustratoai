-- 1. CONSULTA DE DIAGNÓSTICO: VER LA "ENSALADA" COMPLETA
-- Muestra usuarios de `auth.users` cruzados con `public.user_profiles` y sus roles en proyectos.
-- Esto revelará los duplicados y correos huérfanos.

SELECT 
    au.id as auth_id,
    au.email as email_auth,
    au.last_sign_in_at,
    up.user_id as profile_id,
    up.public_contact_email as email_profile,
    up.full_name,
    count(pm.project_id) as proyectos_asignados
FROM auth.users au
FULL OUTER JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.project_members pm ON au.id = pm.user_id
GROUP BY au.id, au.email, up.user_id, up.public_contact_email, up.full_name, au.last_sign_in_at
ORDER BY au.email NULLS LAST;

-- 2. CONSULTA PARA VER A QUIÉN PERTENECEN LOS DATOS (LOTES Y REVISIONES)
-- Antes de borrar o fusionar, veamos qué usuario tiene el trabajo hecho.
SELECT 
    u.email,
    count(distinct b.id) as lotes_asignados,
    count(distinct r.id) as revisiones_hechas
FROM auth.users u
LEFT JOIN article_batches b ON u.id = b.assigned_to
LEFT JOIN article_dimension_reviews r ON u.id = r.reviewer_id
GROUP BY u.email
ORDER BY revisiones_hechas DESC;
