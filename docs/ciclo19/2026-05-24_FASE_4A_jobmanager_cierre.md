# Fase 4A — Cierre del refactor Cognética a JobManager (fire-and-forget)

**Fecha cierre:** 2026-05-24
**Sesión técnica:** Claude Code (claude-opus-4-7) con operador eRRRe
**Punto de partida:** Documento técnico de estado del 2026-05-18 (`docs/cognetica/2026-05-18_ESTADO_OLEADA_1_pase_opus.md`).
**Contexto:** ver [Crónica - Soberanía digital con veinte dólares al mes](Crónica%20-%20Soberanía_digital_con_veinte_dólares_al_mes.md).

## Problema raíz que se atacó

`metabolizarArtefacto` era una server action que ejecutaba en el RTT del cliente todo el pipeline de metabolización (3+ minutos para PDF/audio). Next.js serializa las server actions del mismo cliente — durante esos 3 minutos **todos los `router.refresh()` quedaban en cola**. Resultado: el stepper sólo se actualizaba al final del proceso. Si el cliente cerraba la pestaña, perdía tracking. El estado intermedio (`cgt_artefactos.estado="ingresado"` reseteado por side-effects de pre-procesos) se confundía con el estado del proceso.

## Lo que se hizo (en orden)

### Fase 1 — Pipeline declarativo
`lib/cognetica-forense/pipelines.ts`: `PIPELINES_POR_TIPO` con la secuencia ordenada de steps por tipo de artefacto (markdown / pdf_informe / pdf_slides / audio). Cada step lleva `name`, `label`, `descripcion`. **Una sola fuente de verdad** que orquestador y stepper consumen. Agregar nuevo tipo = sumar entrada al diccionario.

### Fase 2 — Split del orquestador
`metabolizarArtefacto` quedó como **starter corta**: valida acceso, crea job maestro en `ai_job_history` con `details.es_job_maestro=true` + `step_name=primerStep`, cambia `cgt_artefactos.estado="metabolizando"`, **lanza `runMetabolizacionConTracking` sin await** (fire-and-forget) y retorna `{jobId}` en ms.

`runMetabolizacionConTracking` (runner background): llama `_orquestarMetabolizacion` (lo que era el orquestador completo), actualiza `details.step_name` antes de cada paso vía `marcarStepEnJobMaestro`, cierra el job maestro como `completed`/`failed` al final + actualiza `cgt_artefactos.estado` a `metabolizado`/`error`.

`procesarPdfInforme` recibió un flag `orquestadoPor: { jobId }` — en modo orquestado **no toca `cgt_artefactos.estado`** ni crea jobs paralelos. Mata el "fantasma 'ingresado'" que aparecía como evento Realtime intermedio.

### Fase 3 — ArtefactoView reactivo
Realtime al row del job maestro filtrado por `project_id=eq.X` (el filtro por `job_type` enum cerraba el canal silenciosamente — descubierto por prueba). State local `jobMaestroLive` con `{step_name, status, progress}` alimentado en vivo. `derivarEstados` usa **el job manager como autoridad del proceso** (no `data.artefacto.estado`): si `jobLive.status==="running"` el cliente sabe que sigue procesando aunque el campo de BD haya rebotado por algún side-effect. Idem para `completed` y `failed`.

**Optimismo del stepper**: al recibir el `{jobId}` de la starter, `MetabolizarButton` inicializa el state local con el primer step del pipeline. El stepper enciende al instante sin esperar el primer evento Realtime.

### Fase 4A — JobManager UI conectado
`JobType` extendido con `COGNETICA_METABOLIZE`. `Job.payload` migrado a discriminated union (`JobPayloadLegacy` con `batchId` para los 3 tipos viejos + `JobPayloadCognetica` con `artefactoId, jobIdBackend, originPath`). Handlers legacy con `Extract<Job, {type: "X"}>` para narrowing.

`CogneticaJobHandler` nuevo:
- Patrón distinto a los handlers legacy: **no dispara la action**, sólo se suscribe al row de `ai_job_history` ya existente (la starter lo creó).
- SELECT inicial al montar + suscripción Realtime → cubre el caso del primer mount y de rehidratación tras refresh.
- Callbacks del context via `useRef` para no aparecer en deps del useEffect (evita re-suscripciones cuando el panel se expande/colapsa).

`listarJobsCogneticaActivos` trae jobs activos **+ recientemente terminados** (últimos 5 min). El handler de rehidratación en `JobManager.tsx` los registra con `status` real (`running` / `completed` / `error`). Resuelve "el front nunca se enteró" cuando un job falla rápido en otra pestaña.

`isJobManagerExpanded` persiste en `localStorage` (`jobManager:isExpanded`). El panel no se auto-minimiza al refrescar si el usuario lo dejó abierto.

`JobManager.tsx` refactorizado: el panel expandido vive en el DOM con `hidden` cuando minimizado, **no se desmonta**. Los handlers conservan sus suscripciones Realtime aunque el usuario tenga el panel cerrado.

### Mejoras UX que se sumaron en el camino
- **Origen + "Ir al artefacto"**: el job guarda `originPath` (capturado al click). Cuando termina y el usuario está en otra ruta, el handler muestra botón "Ir al artefacto" que navega + invalida cache del router con `setTimeout(0) → router.refresh()` para que el destino llegue con data fresca.
- **No se minimiza fuera de origen**: si terminó y estás en otra ruta, el row queda visible sin tiempo límite hasta que cliquees el botón o navegues manualmente a origen. El `useEffect` que escucha `pathname` cierra el row al llegar a origen.
- **Auto-expand al terminar**: si el panel está minimizado y el job pasa a terminal, `expandJobManager()` lo abre solo. Te alerta sin invadir si ya estabas mirando.
- **Acordeones se actualizan mid-process**: detección de transición de step en `ArtefactoView` dispara `router.refresh()`. Sumado a `unstable_noStore()` en `obtenerArtefactoCompleto`, ahora el contenido de la Crónica aparece en su acordeón apenas termina, sin esperar al final.
- **"Ver error" amigable**: `lib/cognetica-forense/error-amigable.ts` mapea códigos técnicos a mensajes en español. El handler muestra el mensaje amigable como statusMessage + dialog "Ver error" con el código técnico crudo + Job ID/Artefacto ID para soporte.

## Cambios de modelo (atajo durante la sesión)

Durante la prueba con un MD largo, la Crónica vino cortada por `max_tokens=5000`. Aprovechamos para migrar la Crónica a **`deepseek-v4-pro`** (1M tokens de contexto, 384k de output):
- Registro en `lib/cognetica-forense/cognetica_forense_types_addendum_v11.ts` y `lib/deepseek/api.ts`.
- `CONFIG_CRONICA.maxTokens` subido a 30000 (margen amplio sin desperdiciar tarifa).
- **Chequeo de `finishReason === "length"`** agregado en `generarCronica` (Destilado, Núcleo y Germinal ya lo tenían). Si la API corta por max_tokens, la Crónica truncada **no se persiste** y se retorna `fail("LLM_ERROR")` visible — antes pasaba silenciosamente y nadie se enteraba.

## Anti-patrones cazados y registrados como memoria local

Durante el refactor aparecieron tres anti-patrones que ya conocíamos pero que se repetían por inercia. Quedaron como memoria local de Claude Code para futuras sesiones:

1. **Fallback que disfraza el bug** (`feedback-no-fallback-disfraz`): "adivinar por primer faltante" cuando el job activo no estaba disponible. Reemplazado por reportar inconsistencia visible al usuario vía toast con `duration: Infinity`. La función `obtenerJobActivoCognetica` también devolvía `data: null` cuando encontraba un job con `step_name=null` — ahora retorna `success: false` con código.
2. **Standard-first** (`feedback-standard-first`): improvisé un portal manual con `createPortal` para un dropdown cuando ya existía `StandardDropdownMenu` (Radix con Portal + auto-flip + accessibility). Regla: antes de tocar un componente no-Standard, buscar el equivalente; si no existe, parar y proponer crearlo.
3. **Feedback inline vs Sonner** (`feedback-sonner`): bloques `<StandardAlert>` debajo de botones para errores transitorios. Migrado a toasts Sonner con cierre manual (`duration: Infinity`) para errores. Componente `StandardToaster` cableado al theme provider con degradados 135° por tipo desde `appColorTokens`.

## Estado actual del módulo

✅ Ingesta → metabolización end-to-end funcionando para `markdown`, `pdf_informe`, `pdf_slides`, `audio`.
✅ Job manager con tracking en vivo + rehidratación + UX cuidada.
✅ Errores visibles en consola y como toasts/dialog para el usuario.
✅ El cliente puede cerrar la pestaña y volver — el proceso vive en `ai_job_history`.

## Lo que queda (Fases 4B y 4C)

- **Fase 4B — Persistir costo en `ai_job_history`** (con migración SQL autorizada por el operador):
  - Columna nueva `cost_usd` (numeric).
  - Tabla de tarifas en código (DeepSeek V4 Pro, Marker por página, WhisperX por segundo).
  - Cálculo en el runner sumando por step y persistencia incremental en el job maestro.
- **Fase 4C — Mostrar costo en `/personal/historial_ai/`**: columna "Costo USD" + sumas por periodo y proyecto. Tracking de gasto por usuario para el presupuesto C0.

## Deuda técnica que se mantiene visible

- Los jobs **per-step** (`iniciarJobCognetica` / `completarJobCognetica`) siguen existiendo en paralelo al job maestro. Dan granularidad de tokens por paso, pero **convivir 2 sistemas de tracking en la misma tabla es deuda**. Decisión pendiente: o se ven juntos como historia rica, o se consolidan en `details.steps[]` del job maestro y se eliminan los per-step.
- `transcribirAudio` y `procesarPdfSlides` **siguen sin el flag `orquestadoPor`** (sólo `procesarPdfInforme` lo recibió). El cliente está blindado contra los fantasmas de estado que generan, pero la deuda existe — meterles el flag mata el fantasma desde la raíz.
- El SHA-256 del artefacto y el ciclo de vida cuando se edita post-ingesta sigue siendo un tema cabezón sin resolver (tarea #11 del backlog).

## Cómo se usa esto desde otra sesión

Si volvés a tocar esta zona con otra instancia de Claude Code (yo o un sucesor):
- Las **memorias locales** del repo (`~/.claude/projects/-Users-rodolfoleiva-Documents-respaldo-SUSTRATOAI/memory/`) tienen las reglas duras: idioma español, no fallback disfraz, Standard-first, feedback Sonner, theming sustrato.
- El **skill canónico** del Sonner está en `.opencode/skills/standard-toaster.md`.
- Este documento + el README del ciclo dan el panorama operativo.

eRRRe — sigamos.
