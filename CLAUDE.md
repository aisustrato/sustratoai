# sustrato.ai — Claude Code context

## Stack

- Next.js 14, App Router, TypeScript strict
- Supabase (dev: local docker, prod: cloud via Vercel)
- Tailwind CSS — SOLO clases core, no compiler custom
- Sistema de componentes Standard* con variantes propias (no aplicar Tailwind inline sobre ellos)
- Deploy: Vercel

## Comandos clave

- Dev: `npm run dev` (localhost:3000)
- Build check: `npm run build` (SIEMPRE antes de marcar listo)
- Lint: `npm run lint` (0 warnings es el estandar)
- Update types: `npm run update-types` (regenera lib/database.types.ts desde Supabase)

## Estructura del proyecto

- `app/` — App Router pages y API routes
- `app/cognetica/` — Modulo Cognetica Forense (foco actual de desarrollo)
- `components/ui/Standard*.tsx` — Componentes UI del sistema de diseno
- `lib/actions/` — Server actions (patron: `cognetica-forense-*-actions.ts`)
- `lib/cognetica-forense/` — Logica de negocio, prompts, tipos, parsers
- `lib/cognetica-forense/prompts/` — Prompts para LLM (cronica, destilado, germinal, etc.)
- `lib/cognetica-forense/types/` — Tipos TypeScript del modulo
- `docs/cognetica/` — Documentacion y specs del modulo
- `supabase/migrations/` — Migraciones SQL (zona protegida)
- `.opencode/` — Config de OpenCode (NO tocar, ecosistema separado)

## Modulo activo: Cognetica Forense

El desarrollo actual se centra en la Oleada 1 de Cognetica Forense v2.
Flujo principal: ingesta de documentos -> triada (cronica/destilado/germinal) -> metabolizacion -> cartografiado -> exportacion.
Entidades clave: artefactos, menciones, referencias, slides.

## Hard rules

- NUNCA instalar npm packages sin preguntar primero
- NUNCA tocar /supabase/migrations sin confirmacion explicita
- NUNCA modificar tablas de produccion — solo dev
- Si hay duda entre dev y prod: preguntar
- TypeScript: cero `any` implicito, cero warnings nuevos
- SHA-256 append-only en data_export_registry — NUNCA modificar registros existentes
- No inyectar estilos dinamicos en Standard* components
- StandardDialog usa backdrop-blur-sm — NO poner listas virtualizadas adentro

## Las 4 reglas de oro

1. **Errores siempre visibles**: ningun catch vacio, ningun callback silencioso. Todo error se loguea con contexto: `console.error('[modulo:funcion]', err)`
2. **Codigo modular**: archivos > 300 lineas son deuda tecnica (senalar). Funciones > 50 lineas: candidatas a extraccion
3. **Estilos sin conflictos**: Tailwind para layout entre elementos. Standard* para componentes propios. No mezclar
4. **Lint limpio en entregas**: `npm run lint` sin warnings. `// eslint-disable` solo como ultimo recurso con justificacion

## Workflow preferido

1. Explorar antes de tocar (plan mode para cambios multi-archivo)
2. Un commit por unidad logica, mensaje en espanol
3. Correr build + lint antes de confirmar terminado
4. Documentacion de specs en `docs/cognetica/` cuando aplique

## Lo que NO hacer

- No refactorizar codigo que no fue pedido
- No "mejorar" nombres de variables silenciosamente
- No crear archivos de prueba sin avisar
- No tocar `.opencode/` ni `AGENTS.md` (ecosistema de OpenCode, separado)

## Coexistencia con OpenCode

Este proyecto usa dos herramientas de desarrollo con IA:
- **Claude Code** (este): trabajo en repo, refactors, debugging profundo, arquitectura
- **OpenCode** (`.opencode/` + `AGENTS.md`): exploraciones rapidas, snippets, flujo multi-agente propio

Cada uno tiene su config independiente. No interferir con el otro.
