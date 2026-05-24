# Rotación de claves Supabase + deuda de limpieza histórica

**Fecha:** 2026-05-24
**Detectado por:** revisión de seguridad pre-merge a main.
**Estado:** riesgo operativo cerrado. Deuda cosmética/histórica abierta.

## Qué pasó

Dos JWTs de Supabase estaban hardcoded en HEAD y en toda la historia git desde el commit `4bffa94`:

1. **`scripts/list-supabase-tables.ts` línea 8** — contenía la `service_role` key (la peligrosa, bypass de RLS) como string literal.
2. **`.vscode/settings.json` línea 852** — contenía la `anon` key dentro del config del MCP server de Supabase para VSCode.

Origen: el commit "Actualización general del proyecto - múltiples mejoras y refactorizaciones" del 2026-05-08 introdujo ambos. Todas las ramas descendientes (oleada-1, grafo, mdj, paper) los heredaron en su historia.

El repo es privado, lo que limitó el blast radius — pero **integraciones, colaboradores, CI, backups, GitHub Apps** podían leer.

## Lo que se hizo (cierre operativo)

1. **Rotación en Supabase Dashboard**:
   - Generadas las nuevas keys con la nomenclatura nueva (Publishable + Secret).
   - Las legacy (anon + service_role) **revocadas manualmente** en la sección "Legacy API keys".
   - `.env.local` (dev) y Vercel (prod) actualizados con las nuevas.
   - Dev local y deploy funcionando con las nuevas.

   Resultado: **los JWTs que quedaron en la historia git son texto muerto** — sintaxis JWT válida pero sin poder operativo (Supabase los rechaza).

2. **HEAD limpio** (commit fechado 2026-05-24):
   - `scripts/list-supabase-tables.ts`: ahora lee `process.env.SUPABASE_SERVICE_ROLE_KEY` con guard de error si falta. Uso documentado en comentario del archivo.
   - `.vscode/settings.json`: el `SUPABASE_ANON_KEY` del MCP server ahora usa `${env:SUPABASE_ANON_KEY}` — VSCode lo resuelve desde el entorno del shell que lanzó la sesión.

   Verificación: `git grep "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI"` no devuelve resultados en HEAD.

## Deuda abierta — limpieza de historia

Los JWTs siguen accesibles vía `git log -p` en commits viejos. Como ya están **revocados**, el contenido es arqueología sin riesgo operativo. Pero la deuda existe.

**Cuándo importaría limpiarla**:
- Si el repo se hace público o se transfiere.
- Si se invita un colaborador externo con acceso de lectura.
- Si se exporta el repo a otro destino fuera de control directo.

**Caminos disponibles cuando llegue ese momento**:

1. **`git filter-repo`** (recomendado, moderno). Reescribe la historia eliminando los archivos en TODOS los commits que los tocan, dejando los commits con los hashes nuevos. Requiere:
   - Backup completo del repo antes (clonado en otra carpeta).
   - Force-push a todas las ramas remotas (`git push --force-with-lease`).
   - Que cualquier clon existente (local de otra máquina, CI, etc.) sea **re-clonado** desde cero — sus refs apuntan a hashes que ya no existen.
   - Reescribir tags si los hay.

2. **`BFG Repo-Cleaner`**: alternativa más simple (sintaxis específica para keys). Mismo riesgo y mismas precauciones.

3. **Quedarse en el estado actual** (HEAD limpio + keys rotadas). Pragmáticamente defendible mientras el repo sea privado y no se invite acceso externo.

**Decisión actual:** caminamos con la opción 3. Documentamos la deuda acá. Si en algún momento se decide abrir el repo, ejecutar opción 1 con plan dedicado.

## Lecciones que quedan

- **`.env.local` está en `.gitignore`** (siempre lo estuvo, eso funcionó). El leak fue por hardcode literal en archivos que no estaban ignorados.
- **Lección operativa**: cualquier JWT, API key o token literal que el ojo vea como string en un commit es un riesgo. Buscar siempre patrones `eyJ...`, `sk-...`, `Bearer ...` en review.
- **Lección sistémica**: agregar un pre-commit hook (gitleaks, detect-secrets) cuando haya momento de invertir en CI/CD. Eso atrapa esto antes del commit.

## Estado de archivos protegidos por gitignore

Ya cubiertos:
- `.env*` (todos los .env)
- `.claude/settings.local.json`
- `CLAUDE.local.md`
- `.DS_Store`, `*.swp`, `*.bak`, `*.backup`

No cubiertos pero limpiados manualmente:
- `.vscode/settings.json` (queda versionado con `${env:...}` para la key, no hay hardcode).
- `scripts/list-supabase-tables.ts` (queda versionado leyendo `process.env`).
