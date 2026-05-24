# Cognética Forense v2 · Oleada 1 — Pase de estado

**Fecha:** 2026-05-18
**Pase realizado por:** Claude Opus 4.7 (interlocutor) con dos sub-pases Explore (mapeo flujo + auditoría silenciosos)
**Rama:** `feat/cognetica-forense-oleada-1`
**Propósito:** Tomar foto del módulo previo a la fase de estabilización. Documentar qué está conectado, qué cuelga suelto, y dónde hay tensión entre el estado declarado ("Oleada 1 cerrada el 22 abril 2026", `bitacora_oleada_1_cierre.md`) y el estado real del código.

---

## 0. Resumen ejecutivo

La cadena UI → Server Action → Supabase está **conectada en ~80%** del pipeline Oleada 1. El esqueleto funciona y es coherente con `cognetica_v2_formatos_spec_v0_3.md`. Lo que falta para considerar el módulo **estable** son cinco cosas concretas, en orden de impacto:

1. **Exportación de Tríada (`exportarTriada`)** sigue siendo un STUB que retorna `NOT_IMPLEMENTED`. Sin esto, el ciclo completo `ingesta → metabolización → descarga` no cierra. Es el bloqueador más visible.
2. **Auto-disparo de metabolización tras ingesta** está pendiente (TODO declarado en código). El artefacto queda en `estado='ingresado'` esperando que el usuario apriete el botón. Esto está reconocido en `cognetica-forense-ingesta-actions.ts:232-235`.
3. **6 violaciones del protocolo "errores siempre visibles"** en `cognetica-forense-ingesta-actions.ts` (líneas 449, 486, 568, 604, 681, 717) y 1 en `cognetica-forense-slides-actions.ts:270`. Todas `.catch(() => {})` o equivalente, sin log.
4. **Deuda project-aware** documentada en `2026-05-06_DEUDA_TECNICA_project-aware.md` no abordada: ningún path verifica que el artefacto pertenezca al `project_id` del usuario activo.
5. **Brecha entre cierre formal y estado real**: la bitácora del 22 abril declaró Oleada 1 cerrada y "sin pendientes". Sin embargo, posterior a esa fecha aparecen artefactos nuevos (job-actions untracked, migración del 11 mayo, exportación aún STUB). El cierre formal estaba prematuro o la Oleada 1 mutó.

El núcleo de metabolización (Crónica → Destilado → Núcleo → Germinal) funciona end-to-end con resume-from-last y registro de jobs. El cartografiador funciona en lógica pero sin UI de detalle. Los prompts del sistema están escritos y reales (no son placeholders) — el gate `promptsListos()` debería estar pasando.

---

## 1. Mapa del pipeline (9 etapas)

| # | Etapa | Punto UI | Action principal | Tablas tocadas | Estado |
|---|-------|----------|------------------|----------------|--------|
| 1 | Ingesta | `app/cognetica/upload/page.tsx:141` | `ingestaArtefactoFromFormData` (`ingesta-actions.ts`) | `cgt_artefactos`, `cgt_artefactos_markdown/_pdf_informe/_pdf_slides/_audio`, Storage `cognetica-files` | 🟡 funcional markdown / PDF / audio. Imagen y video → `NOT_IMPLEMENTED`. No auto-dispara metabolización. |
| 2 | Lectura artefacto | `app/cognetica/[id]/page.tsx` | `obtenerArtefactoCompleto` (`lecturas-actions.ts:46`) | 11 SELECT paralelos a artefactos + 4 formatos + tipos + segmentos + jobs | 🟢 completo |
| 3 | Metabolización | `app/cognetica/[id]/MetabolizarButton.tsx:116` | `metabolizarArtefacto` (`metabolizacion-actions.ts`) | `cgt_cronicas/destilados/nucleos/germinales`, `cgt_*_menciones`, `cgt_artefactos.estado`, `ai_job_history` | 🟢 funcional con resume-from-last. Gate `promptsListos()` actualmente pasa (prompts reales). |
| 4 | Cartografiado | `app/cognetica/[id]/CartografiadorButton.tsx:48` | `ejecutarCartografiador` (`cartografiador-actions.ts:94`) | Universo (5 catálogos canónicos), `cgt_*_menciones` UPDATE, `cgt_*_decisiones_cartografiador` INSERT, `cgt_logs_cartografiador` | 🟡 lógica completa, UI mínima (sin detalle por mención) |
| 5 | Extracción referencias | `app/cognetica/[id]/ExtractorReferenciasButton.tsx:46` | `ejecutarExtraccionReferencias` (`extractor-referencias-actions.ts`) | `cgt_destilados` (lee), `cgt_referencias_bibliograficas`, `cgt_referencias_entidades` | 🟡 esqueleto presente, requiere verificar idempotencia en re-ejecución |
| 6 | Menciones (lectura+edición) | `app/cognetica/[id]/MencionesSection.tsx`, `MencionEditModal.tsx` | `menciones-actions.ts` (listar/editar/resumir) | Vistas `cgt_vw_*_valor_canonico`, tablas `cgt_*_ediciones_humanas` (append-only) | 🟢 completo, patrón append-only respetado |
| 7 | Slides (PDF→páginas) | `app/cognetica/[id]/SlidesViewer.tsx:36` | `splitPDFIntoPagesV2` + `listArtifactPagesV2` + `getPageImageUrlV2` (`slides-actions.ts`) | `cgt_artefactos.metadata`, Storage `presentations/{id}/page_{n}.pdf` | 🟡 split funciona; Marker (PDF→Markdown) delegado a `/api/cognetica/process-pdf` no auditado aquí |
| 8 | Exportación Obsidian | (botón en `ArtefactoView`) | `exportarTriada` (`exportacion-actions.ts:68`) | (previsto: 4 formatos + Storage + `cgt_artefactos.storage_path_*`) | 🔴 **STUB — retorna `NOT_IMPLEMENTED`** |
| 9 | Jobs background | (transversal, instrumentado en metabolización) | `iniciarJobCognetica`/`completar`/`fallar`/`obtenerActivo` (`job-actions.ts`, untracked) | `ai_job_history` (con `job_type='cognetica_metabolizacion'`, migración `20260511`) | 🟢 completo, cumple regla de oro de logueo |

---

## 2. Qué está conectado y verde

- **`obtenerArtefactoCompleto`** carga todo el estado de un artefacto en 11 SELECT paralelos. Es el único punto de verdad para `ArtefactoView`. Sólido.
- **Pipeline de metabolización con resume-from-last**: el orquestador escanea qué formatos ya están persistidos y saltea sus generadores. `MetabolizarButton` adapta su label en 3 modos (Iniciar / Reintentar / Continuar) y muestra los formatos faltantes. Cumple el cierre Oleada 1.
- **Sistema de jobs (`ai_job_history`)** instrumentado en cada uno de los 4 generadores (Crónica/Destilado/Núcleo/Germinal). Cada paso enciende un job, ejecuta el LLM, y cierra el job con tokens consumidos. Patrón consistente. Logging explícito con prefijo `[funcion]`. Migración `20260511_add_cognetica_job_type.sql` agrega `cognetica_metabolizacion` al enum y ya está reflejada en `lib/database.types.ts:7699`.
- **Menciones append-only**: edición humana nunca toca menciones ni canónicas — sólo INSERT en `cgt_*_ediciones_humanas`. Vista `cgt_vw_*_valor_canonico` resuelve coalesce humano → cartografiador → extractor. Patrón limpio.
- **Tipos TS ↔ schema SQL alineados**: `lib/cognetica-forense/types/oleada2.ts` deriva de `Tables<"cgt_*">` desde `database.types.ts`, evitando duplicación. No se hallaron campos huérfanos en ninguna dirección.
- **Listado raíz `/cognetica`** con grid de `StandardCard` (`page.tsx` reescrito en cierre Oleada 1) tira de `listarArtefactosConNucleo(projectId)`.
- **Prompts del sistema reales** (no placeholders). `CRONICA_SYSTEM_PROMPT`, `DESTILADO_SYSTEM_PROMPT`, etc. contienen texto definitivo de Hongo. El gate `promptsListos()` debería estar pasando — verificar en runtime que ningún generador devuelva `NOT_IMPLEMENTED` por placeholder.

---

## 3. Qué cuelga suelto

### 3.1 Bloqueadores duros del ciclo completo

| # | Item | Ubicación | Por qué importa |
|---|------|-----------|-----------------|
| B1 | `exportarTriada` es STUB | `exportacion-actions.ts:68-76` | Sin esto, lo metabolizado nunca sale del sistema. El artefacto vive sólo en BD. Bloquea el caso de uso central (descarga Obsidian). |
| B2 | Metabolización no se auto-dispara tras ingesta | TODO declarado en `ingesta-actions.ts:232-235` | El artefacto queda en `'ingresado'`. El usuario debe ir manualmente a `/cognetica/[id]` y apretar Metabolizar. Riesgo: artefactos huérfanos. |
| B3 | Audio/Video sin metabolización | `cognetica_forense_actions.ts` (wrapper de contrato) — falta transcripción → metabolización | Tipos se aceptan en ingesta pero no se procesan. Imagen y video retornan `NOT_IMPLEMENTED` en el dispatcher (`ingesta-actions.ts:780`). |
| B4 | Cascada de invalidación incompleta | `metabolizacion-helpers.ts` define `NODO_GENERADOR_CASCADE` pero su invocación entre formatos no fue verificada en este pase | Si se re-genera Crónica, Destilado/Núcleo/Germinal deberían marcarse inválidos. Si esa lógica falta, el usuario ve Destilado viejo sobre Crónica nueva. |

### 3.2 Deuda visible documentada

| # | Item | Doc fuente | Estado |
|---|------|------------|--------|
| D1 | Cognética no es project-aware | `2026-05-06_DEUDA_TECNICA_project-aware.md` | Sin abordar. Afecta autorización, navegación, exportación y deduplicación. |
| D2 | Brecha cierre formal vs. estado real | `bitacora_oleada_1_cierre.md` declara cierre el 22-abr-2026 | Sin embargo aparecen artefactos post-cierre: `job-actions.ts` (untracked), migración `20260511`, sigue exportación STUB. La "Oleada 1" mutó tras cerrarse. |
| D3 | Cartografiador sin UI de detalle | `guia_ruta_cascade_oleada_2.md` Hito 3 vs Hito 4 | Hoy sólo resumen numérico. Detalle por mención → Hito 4, no implementado. |
| D4 | ExtractorReferencias requiere verificación de idempotencia | `extractor-referencias-actions.ts` | Si se re-ejecuta, ¿duplica referencias? No verificado. |

### 3.3 Violaciones al protocolo "errores siempre visibles"

Confirmadas por el sub-pase de auditoría. Total: **7 sitios**. Todos en rutas de compensación (cleanup post-fallo), pero ocultan información de fallos que ya ocurrieron — exactamente el patrón que la regla de oro quiere prevenir.

| # | Archivo | Líneas | Patrón |
|---|---------|--------|--------|
| E1 | `lib/actions/cognetica-forense-ingesta-actions.ts` | 449, 486, 568, 604, 681, 717 | `await supabase.storage.remove([...]).catch(() => {})` sin log |
| E2 | `lib/actions/cognetica-forense-slides-actions.ts` | 270 | `await response.json().catch(() => ({}))` sin log |

Adicionalmente, en `job-actions.ts:215`, `obtenerJobActivoCognetica` ante un job sin `step_name` emite `console.warn` y retorna `{ success: true, data: null }`. No es silencioso (loguea), pero esconde una inconsistencia de datos detrás de un `success: true`. Discutible si se prefiere `success: false` con código `DATA_INCONSISTENT`.

### 3.4 Inconsistencias documentales

- `lib/cognetica-forense/README.md:14-15` apunta a `/docs/standard-UI/cognetica_v2_oleada_1.sql` y `/docs/cognetica2` — ninguno existe. El SQL de Oleada 2 vive en `docs/cognetica/SQL_COGNETICA_V2_OLEADA_2.sql`. El README está desactualizado.
- `README.md` no menciona el subsistema de jobs ni el cartografiador ni el extractor de referencias, que son parte sustantiva de Oleada 1.

---

## 4. Tensiones de diseño

### 4.1 Cierre formal prematuro
La `bitacora_oleada_1_cierre.md` declara: "No hay pendientes Oleada 1". Pero:
- `exportarTriada` sigue STUB y se documenta en su propio header como "Oleada 1 cierre o Oleada 1.5".
- TODO de auto-disparo en ingesta sigue presente.
- Tipos audio/video sin metabolización.

Una de dos lecturas posibles: (a) la bitácora hablaba del *cierre del núcleo metabolizador* y los demás items son Oleada 1.5; (b) el cierre fue prematuro. La diferencia importa para definir el alcance de la fase "estabilizar".

### 4.2 Job activo y RLS
`job-actions.ts` usa `createSupabaseServiceRoleClient()` (bypass RLS). Es necesario porque los jobs deben escribirse aun cuando el usuario no tenga RLS write directo, pero implica que la única validación de pertenencia (`project_id`) es la que pasa el caller. Si el caller pasa un `project_id` que no corresponde al usuario, el job se inserta igual. Mitigación posible: validar en la action superior (metabolización) que el `project_id` del artefacto coincida con el `project_id` del proyecto activo del usuario antes de invocar job-actions.

### 4.3 Convivencia con legacy `cognetica-old-*`
`lib/actions/` contiene 30+ archivos `cognetica-old-*` (incluyendo `.bak` y `.backup`). El README del módulo dice "permanece funcional hasta que Oleada 1 sea aceptada". Si Oleada 1 está cerrada, este código es **deuda visible para eliminar**. Limpieza recomendada en sprint de estabilización (no mezclar con feature work).

---

## 5. Recomendación de orden para estabilizar

Sugerencia priorizada para abrir la fase de correcciones (sujeto a decisión del usuario al volver):

**Pasada 1 — Higiene del protocolo (1-2 horas)**
1. Resolver las 7 violaciones de errores silenciosos (E1, E2). Cambio puramente aditivo: `.catch((err) => console.error('[cognetica-forense:contexto]', err))`. Riesgo bajo, ganancia inmediata en observabilidad.
2. Decidir el contrato de `obtenerJobActivoCognetica` ante datos inconsistentes (¿`null` con warn, o error explícito?).

**Pasada 2 — Cerrar el ciclo (medio día / día)**
3. Implementar `exportarTriada` (B1). Es la pieza que falta para que el módulo tenga un caso de uso end-to-end. Spec ya está en el header de la action (8 pasos) y en `docs/cognetica/STORAGE_POLICY.md`.
4. Decidir si auto-disparar metabolización tras ingesta de markdown (B2). Es una decisión de producto: ¿quieres que el usuario controle el momento, o que el sistema sea más eager? Si eager, agregar al final de `ingestaArtefactoMarkdown` un `metabolizarArtefacto(id, { background: true })`.

**Pasada 3 — Project-awareness (medio día)**
5. Aplicar la mitigación inmediata del doc de deuda: en `useDescargaObsidiana`, validar `artefacto.project_id === proyectoActual.id`.
6. Plan más amplio (sprint dedicado): pasar `project_id` como parámetro a `obtenerArtefactoCompleto` y filtrar todas las queries.

**Pasada 4 — Cascada de invalidación (1-2 horas)**
7. Confirmar/implementar que regenerar un formato upstream marca los downstream como inválidos. Verificar contra `metabolizacion-helpers.ts`.

**Pasada 5 — Limpieza (1 hora)**
8. Borrar archivos `cognetica-old-*.bak` y `.backup` (confirmar primero que el código activo no los importa por error).
9. Actualizar `lib/cognetica-forense/README.md`: corregir paths rotos y añadir mención de jobs, cartografiador y extractor.
10. Reconciliar `bitacora_oleada_1_cierre.md` con el estado real (apéndice con los items que aparecieron post-cierre).

---

## 6. Lo que NO se tocó en este pase

Para honestidad del informe:
- `cartografiador-actions.ts` y `lib/cognetica-forense/lib/cartografiador/*` se mapearon pero no se leyeron en profundidad — la lógica de aplicar decisiones debe verificarse antes de tocarla.
- El procesamiento Marker (PDF → markdown) vive en `/api/cognetica/process-pdf` y no fue auditado aquí.
- El sistema de búsqueda avanzada por elementos cognitivos descrito en `MODULO_COGNETICA_AUDITORIA.md` (popup modal, breadcrumb inteligente, toggles) no fue verificado contra código — esa auditoría declara funcionalidad que no se contrastó con el estado real.
- Componentes de la vista `/cognetica/entidades/*` (raíz por concepto/teoría/disciplina/pensador) sólo se identificaron por filename.

---

## 7. Próximo paso sugerido

Acordar contigo:
1. ¿La fase de estabilización incluye implementar `exportarTriada`, o el alcance es sólo cerrar deuda visible y dejar exportación para Oleada 1.5?
2. ¿Auto-disparo de metabolización es una decisión de producto que quieres tomar ahora, o lo dejamos manual?
3. ¿Ataco las violaciones del protocolo "errores silenciosos" en una primera pasada barata, sin tocar nada más?

Confirma alcance y arranco por donde digas.

---

*Pase de Opus 4.7, hoy 18 de mayo de 2026. Si hay cosas que no encajan con lo que ves desde tu lado del editor, márcalas — este informe se construyó leyendo el código pero algunas piezas son inferencia (especialmente la pasada 3 del cartografiador y el procesamiento Marker).*
