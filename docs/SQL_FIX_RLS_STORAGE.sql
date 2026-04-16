-- ==============================================================================
-- 🛠️ ARREGLO DE PERMISOS (RLS) Y STORAGE PARA COGNÉTICA
-- ==============================================================================

-- 1. CREACIÓN DEL BUCKET DE ALMACENAMIENTO
-- Intentamos insertar el bucket si no existe
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'cognetica-files', 
    'cognetica-files', 
    false, -- Privado (requiere URL firmada para acceso)
    104857600, -- 100MB límite (ajustar si necesitas más, ej: 500MB = 524288000)
    '{audio/*,video/*,application/pdf}' -- Mimes permitidos
)
on conflict (id) do update set 
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2. POLÍTICAS DE STORAGE (Permisos de archivos)
-- Habilitar RLS en objetos de storage (normalmente ya está activo)
alter table storage.objects enable row level security;

-- Política: Permitir a usuarios autenticados SUBIR archivos a su propia carpeta de proyecto/artefacto
-- Nota: Asumimos estructura: {project_id}/{artifact_id}/{filename}
create policy "Usuarios autenticados pueden subir archivos Cognetica"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'cognetica-files' );

-- Política: Permitir a usuarios autenticados VER/DESCARGAR archivos
-- (Podrías restringirlo más si quisieras que solo miembros del proyecto vean)
create policy "Usuarios autenticados pueden ver archivos Cognetica"
on storage.objects for select
to authenticated
using ( bucket_id = 'cognetica-files' );

-- Política: Permitir a usuarios autenticados BORRAR/ACTUALIZAR sus archivos
create policy "Usuarios autenticados pueden editar archivos Cognetica"
on storage.objects for update
to authenticated
using ( bucket_id = 'cognetica-files' );

create policy "Usuarios autenticados pueden borrar archivos Cognetica"
on storage.objects for delete
to authenticated
using ( bucket_id = 'cognetica-files' );

-- ==============================================================================
-- 3. POLÍTICAS DE TABLAS DE DATOS (Evita el "login y desconexión")
-- ==============================================================================

-- Habilitar RLS
alter table public.cog_artifacts enable row level security;
alter table public.cog_transcriptions enable row level security;
alter table public.cog_fractal_seeds enable row level security;

-- ARTEFACTOS: Permitir todo a autenticados (para MVP). 
-- En prod idealmente validarías: auth.uid() in (select user_id from project_members where project_id = cog_artifacts.project_id)
create policy "Auth users full access artifacts"
on public.cog_artifacts for all
to authenticated
using (true)
with check (true);

-- TRANSCRIPCIONES
create policy "Auth users full access transcriptions"
on public.cog_transcriptions for all
to authenticated
using (true)
with check (true);

-- SEMILLAS
create policy "Auth users full access seeds"
on public.cog_fractal_seeds for all
to authenticated
using (true)
with check (true);

-- ==============================================================================
-- 4. (OPCIONAL) FIX SI USERS_PROFILES ESTÁ BLOQUEANDO LOGIN
-- A veces el login falla porque el usuario no puede leer su propio perfil
-- ==============================================================================
-- Descomenta si users_profiles existe y da problemas:

-- create policy "Users can read own profile"
-- on public.users_profiles for select
-- to authenticated
-- using ( auth.uid() = id );
