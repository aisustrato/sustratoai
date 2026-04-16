-- DIAGNÓSTICO CRÍTICO: ¿El usuario actual es OWNER o MEMBER del proyecto?

-- 1. Ver qué usuario está actualmente autenticado
SELECT 
    auth.uid() as current_user_id,
    'Usuario autenticado actualmente ^' as info;

-- 2. Ver si el usuario es OWNER del proyecto usado en el chat
-- REEMPLAZA '60a80290-6f28-41a5-b155-420dee98597d' con el project_id real del error
SELECT 
    id as project_id,
    owner_id,
    name as project_name,
    CASE 
        WHEN owner_id = auth.uid() THEN '✅ USUARIO ES OWNER'
        ELSE '❌ USUARIO NO ES OWNER'
    END as ownership_status
FROM projects 
WHERE id = '60a80290-6f28-41a5-b155-420dee98597d';

-- 3. Ver si el usuario es MEMBER del proyecto
SELECT 
    pm.project_id,
    pm.user_id,
    pm.role,
    p.name as project_name,
    CASE 
        WHEN pm.user_id = auth.uid() THEN '✅ USUARIO ES MEMBER'
        ELSE '❌ USUARIO NO ES MEMBER'
    END as membership_status
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.project_id = '60a80290-6f28-41a5-b155-420dee98597d'
  AND pm.user_id = auth.uid();

-- 4. RESULTADO ESPERADO:
-- Si usuario es OWNER → Políticas actuales deberían funcionar
-- Si usuario es MEMBER pero NO OWNER → Necesitamos ajustar políticas RLS
