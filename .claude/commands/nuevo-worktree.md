Crear un git worktree nuevo y dejarlo **autónomo** (capaz de correr `npm run dev` sin depender del worktree principal).

## Por qué existe esta skill

Un `git worktree add` solo trae los archivos versionados. NO trae:
- `node_modules/` (gitignored)
- `.env.local` (gitignored)
- `.claude/`, `.opencode/`, `CLAUDE.local.md` (gitignored)
- Otros archivos no-versionados que el proyecto necesita

Sin esos, `npm run dev` falla con "next: command not found" o "Missing env vars". Esta skill los copia desde el worktree principal y luego instala dependencias.

## Pasos

1. **Detectar contexto.** Correr:
   - `git worktree list` para ver worktrees existentes y el path del principal
   - `pwd` para saber dónde estamos
   - Asumir que el worktree principal es el primero listado por `git worktree list` (suele ser el clone original)

2. **Pedir al usuario los datos** con AskUserQuestion:
   - **Nombre de la rama** (ej: `feat/nueva-feature` o `chore/limpieza`)
   - **Tipo de rama**: ¿crear nueva desde main? ¿checkout de una existente?
   - **Sufijo del directorio** (ej: si el repo es `SUSTRATOAI`, sufijo `nueva-feature` → directorio hermano `SUSTRATOAI-nueva-feature`)

3. **Crear el worktree.**
   - Nuevo branch: `git worktree add ../<repo>-<sufijo> -b <rama> main`
   - Branch existente: `git worktree add ../<repo>-<sufijo> <rama>`
   - El directorio es **hermano** del worktree actual, no hijo.

4. **Copiar archivos no-versionados** desde el worktree principal al nuevo. Usar paths absolutos. Lista por defecto:
   - `.env.local` (cp si existe)
   - `.env` (cp si existe)
   - `CLAUDE.local.md` (cp si existe)
   - `.claude/` (cp -R)
   - `.opencode/` (rsync excluyendo `node_modules` para no copiar deps de la skill)

   Si alguno de estos no existe en el principal, saltarlo silenciosamente. NO copiar:
   - `node_modules/` (se reinstala)
   - `.next/` (se regenera)
   - `tsconfig.tsbuildinfo`, `next-env.d.ts` (se regeneran)
   - `supabase-cli`, `*.tar.gz`, directorios con nombres tipo "copy" o "backup" (sospechosos, requieren contexto)

5. **Instalar dependencias.** `cd` al nuevo worktree y correr `npm install`. Lanzar en background (`run_in_background: true`) y esperar la notificación de finalización — no usar sleep.

6. **Smoke test mínimo.** Cuando termine `npm install`, verificar:
   - `ls node_modules/.bin/next` existe
   - No correr `npm run build` (puede fallar por deuda preexistente en ramas con limpieza parcial)
   - Confirmar al usuario que puede correr `npm run dev` desde el nuevo path

7. **Reportar al usuario** en español:
   - Path absoluto del nuevo worktree
   - Branch en la que quedó
   - Archivos copiados (solo nombres, sin contenido)
   - Cómo entrar: `cd <path>`
   - Cómo arrancar dev: `cd <path> && npm run dev`

## Lo que NO debe hacer la skill

- **No ejecutar `npm run build`** — muchas ramas tienen deuda preexistente que hace fallar el build sin que afecte al dev server.
- **No copiar `node_modules/`** del principal — siempre `npm install` desde cero para evitar estado mutable compartido.
- **No copiar archivos con nombres sospechosos** (`*copy*`, `*backup*`, binarios sueltos en la raíz) sin preguntar.
- **No hacer commits ni push automáticos** — solo crear la infraestructura.
- **No modificar el worktree principal** salvo lectura.

## Si algo falla

- `git worktree add` falla con "branch already checked out": el branch ya está en otro worktree. Preguntar al usuario si quiere otro nombre o hacer checkout de una rama distinta.
- `npm install` falla: reportar el error completo, no intentar fixes automáticos.
- Si falta `.env.local` en el principal: avisar al usuario que el nuevo worktree puede no arrancar el dev server hasta que provea las variables.
