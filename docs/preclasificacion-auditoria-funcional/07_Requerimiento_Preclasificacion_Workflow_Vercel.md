## Requerimiento: Traducción y Preclasificación vía Vercel Workflows (versión clonada, ruta paralela)

### Fecha: 2026-08-18

### Contexto

`docs/preclasificacion-auditoria-funcional/06_Nota_Vercel_Job_Manager.md` documentó dos hallazgos:

1. Los 4 job runners de preclasificación corrían "fire and forget" sin garantía en Vercel → ya corregido con `waitUntil()` (`@vercel/functions`).
2. Aunque `waitUntil()` mantiene viva la invocación, el techo sigue siendo el `maxDuration` de la ruta (300s en Hobby/Pro con Fluid Compute por default). El chunking interno de `miniBatchSize = 5` en `runPreclassificationJob` **no ayuda con esto** — es un solo loop secuencial dentro de la misma invocación, el reloj se acumula entre chunks. Un lote de ~200 artículos (40 chunks) puede rondar 200-400s, cerca o por encima del techo.

**Vercel Workflows** resuelve esto de raíz: un *workflow run* completo no tiene límite de duración (solo cada *step* individual respeta el límite normal de Function). Está disponible en el plan **Hobby gratis** — 50.000 eventos/mes y 1GB de datos escritos incluidos, muy por encima del volumen esperado (un lote de 200 artículos ≈ 40 steps ≈ ~120 eventos por corrida). Es 100% programable (paquete npm `workflow`, directivas `"use workflow"`/`"use step"`), no es configuración de consola.

### Decisión de diseño: clon completo, cero contacto con lo existente

El usuario fue explícito: **lo que existe hoy (`startInitialPreclassification` → `runPreclassificationJob`, disparado con `waitUntil()`) debe seguir funcionando exactamente igual, sin tocarlo**. La versión con Vercel Workflows se construye como una **ruta enteramente paralela**: archivos nuevos, endpoint nuevo, página de prueba nueva. Ni un solo archivo del flujo actual se modifica.

Esto implica **duplicación deliberada de lógica** (construcción del prompt, parseo/validación de la respuesta de DeepSeek, manejo de "Otros", mapeo de confidence, repechaje) entre `preclassification-actions.ts` (intacto) y los nuevos archivos del workflow. Es un costo consciente a cambio de riesgo cero sobre el flujo probado. Una vez que la versión Workflow esté validada con lotes reales, se puede evaluar (en un requerimiento futuro, no ahora) extraer la lógica compartida a un módulo común y hacer que ambos flujos la usen — pero eso sí tocaría el archivo actual, por eso queda fuera de este alcance.

### Alcance v1 (actualizado)

Se clonan **dos** flujos, no uno solo — decisión ajustada tras revisar cómo se usa realmente el sistema:

1. **`startBatchTranslation` → `runTranslationJob`** (traducción).
2. **`startInitialPreclassification` → `runPreclassificationJob`** (clasificación inicial).

**Por qué se suma traducción**: el patrón de uso real es que el primer lote de cada fase es el más pesado (universo amplio, clasificaciones triviales que despejan el camino para fases posteriores), y es justo en ese primer lote donde se dispara la traducción — un paso que corre **una sola vez por artículo** (una vez traducido, no se vuelve a mandar). Es decir: el lote más grande del ciclo de vida de un proyecto pasa, sí o sí, por traducción antes que por clasificación — así que el riesgo de duración es tan real ahí como en la clasificación, si no más.

Los otros 2 flujos (reclasificación de un artículo individual, reconciliación de discrepancias) **no se tocan ni se clonan en esta entrega** — se disparan sobre volúmenes mucho menores (un artículo, o solo las discrepancias detectadas), menor riesgo real. Quedan para un requerimiento posterior si hiciera falta.

### Objetivo

Tener una segunda vía, aislada y probable de forma independiente, que ejecute traducción y clasificación inicial de un lote completo sin el riesgo de terminación prematura por límite de duración de Vercel — usando Vercel Workflows para que la ejecución total no tenga techo de tiempo, aunque el lote sea grande.

**Criterios de aceptación**

- Existen dos endpoints nuevos (traducción y clasificación) que disparan su workflow correspondiente para un `batchId`, con las mismas validaciones que sus equivalentes actuales (permiso, estado del lote, duplicados).
- Cada workflow procesa el lote completo en steps (uno por artículo o mini-chunk, según corresponda a cada flujo — ver detalle por flujo más abajo), cada step respetando el límite normal de Function, sin que el run total tenga techo.
- Los resultados se persisten exactamente en las mismas tablas que hoy (`article_translations` para traducción; `article_dimension_reviews`, `article_batches`, `article_batch_items` para clasificación) con el mismo contrato de datos — para que el resto del pipeline no note ninguna diferencia entre un lote procesado por la vía vieja o la nueva.
- El progreso se puede observar en tiempo real desde una página de prueba aislada, sin depender de la UI de producción de preclasificación.
- Los flujos actuales (`startBatchTranslation`, `startInitialPreclassification`) siguen funcionando exactamente igual — se verifica con `npm run build` + que el diff de `preclassification-actions.ts` quede vacío.

### Archivos involucrados

**Nuevos (todo el feature vive acá):**
- `workflows/translation-workflow.ts` — orquestador + steps: `prepareTranslationJobStep` (setup: lote, artículos, fila en `ai_job_history`), `translateArticleStep` (uno **por artículo**, no por chunk — el flujo actual traduce de a uno: prompt + `callDeepSeekAPI` con BYOK + persistencia en `article_translations` — clon de la lógica dentro de `runTranslationJob`), `finalizeTranslationJobStep`.
- `workflows/preclassification-workflow.ts` — orquestador + steps: `prepareClassificationJobStep` (setup: batch, proyecto, dimensiones, artículos, fila en `ai_job_history`), `processChunkStep` (uno por mini-lote de 5 artículos: prompt + `callDeepSeekAPI` con BYOK + validación + persistencia de reviews — clon de `processArticleChunk`), `finalizeClassificationJobStep`.
- Nota técnica común a ambos: los steps son funciones que se serializan/persisten (event sourcing) — no pueden recibir un cliente de Supabase como argumento; cada step crea el suyo internamente con `createSupabaseServiceRoleClient()`.
- `app/api/workflows/translation/start/route.ts` — Route Handler que recibe `{ batchId }`, repite las validaciones de `startBatchTranslation`, y llama a `start(translationWorkflow, [batchId, userId])`.
- `app/api/workflows/preclassification/start/route.ts` — Route Handler que recibe `{ batchId }`, repite las validaciones de `startInitialPreclassification` (auth, `has_permission_in_project` + `can_upload_files`, estado `'translated'` del lote, chequeo de duplicados en `ai_job_history`), y llama a `start(preclassificationWorkflow, [batchId, userId])`.
- `app/datos-maestros/preclasificacion-workflow-test/page.tsx` — página de prueba aislada: input de `batchId`, dos botones ("Traducir vía Workflow" / "Clasificar vía Workflow"), y polling simple a `ai_job_history` para ver progreso en vivo. No reutiliza `PreclassificationJobHandler.tsx`/`TranslationJobHandler.tsx` (evita acoplarse a componentes compartidos) — polling propio, autocontenido.
- `lib/workflows/types.ts` (si hace falta) — tipos compartidos entre los workflows y la página de prueba.

**Tocados (mínimo, aditivo, no rompe nada existente):**
- `next.config.ts` — envolver con `withWorkflow()` del paquete `workflow`. Requerido por el SDK para habilitar las directivas; no cambia ningún comportamiento existente.
- `package.json` — nueva dependencia `workflow`. **Requiere tu confirmación explícita antes de instalar** (regla dura del proyecto).

**No tocados en absoluto:** `lib/actions/preclassification-actions.ts`, `components/jobs/PreclassificationJobHandler.tsx`, `components/jobs/TranslationJobHandler.tsx`, cualquier página de preclasificación de producción (`app/articulos/preclasificacion/**`).

### Identificación en `ai_job_history`

Se reutilizan dos valores del enum `job_type` que **ya existen en la base y no tienen ningún uso actual en el código** (mismo hallazgo que `import_articles` sin usar para el harvester de OpenAlex) — así se evita una migración de enum:

- Clasificación (workflow) → `job_type: 'preclassification'` (minúscula; distinto del `'PRECLASSIFICATION'` mayúscula que usa el flujo viejo).
- Traducción (workflow) → `job_type: 'batch_processing'` (nombre genérico reutilizado pragmáticamente — no hay un valor libre que diga literalmente "traducción"; se documenta acá para que no confunda a futuro).

**Limitación conocida**: los chequeos de duplicados de los flujos viejos filtran por `'PRECLASSIFICATION'`/`'TRANSLATION'`; los nuevos endpoints filtran por sus propios valores. Las vías vieja y nueva no se detectan entre sí — si alguien dispara ambas sobre el mismo lote al mismo tiempo, no hay bloqueo cruzado. Aceptable para esta fase de prueba (uso deliberado, no concurrente); se resolvería más adelante si el workflow reemplaza al flujo viejo.

### Plan de implementación

1. Confirmar con el usuario e instalar `npm install workflow`. Envolver `next.config.ts` con `withWorkflow()`.
2. Escribir `workflows/translation-workflow.ts`: clonar la lógica de `buildTranslationPrompt`, llamada a DeepSeek, y persistencia en `article_translations` desde `runTranslationJob` — adaptada a `step`/`workflow`.
3. Escribir `app/api/workflows/translation/start/route.ts` con las validaciones de `startBatchTranslation`, apuntando a `job_type: 'batch_processing'`.
4. Escribir `workflows/preclassification-workflow.ts`: clonar la lógica de `buildPreclassificationPrompt`, limpieza de JSON, validación de opciones/confidence, manejo de "Otros", y persistencia en `article_dimension_reviews` desde `runPreclassificationJob`.
5. Escribir `app/api/workflows/preclassification/start/route.ts` con las validaciones de `startInitialPreclassification`, apuntando a `job_type: 'preclassification'`.
6. Escribir la página de prueba aislada con los dos disparadores y polling propio.
7. `npm run build` + `npm run lint` — confirmar que compila y que el flujo viejo no cambió (diff de `preclassification-actions.ts` debe seguir vacío).
8. Probar cada flujo con un lote real chico primero (5-10 artículos) para validar el contrato de datos end-to-end, después con un lote grande (150-200 artículos) para confirmar que efectivamente supera lo que antes se acercaba al límite de 300s.
9. Verificar en el dashboard de Vercel (Observability → Workflows) que los runs aparecen, sus steps, y el consumo de eventos/datos.

### Riesgos

- **Duplicación de lógica de negocio, ahora en dos flujos**: el prompt, la validación, el manejo de "Otros" y el repechaje (clasificación) y la lógica de traducción quedan clonados en dos lugares cada uno. Cualquier cambio futuro a las reglas de negocio (ej. un ajuste al prompt) va a requerir aplicarse en ambos lados mientras convivan las dos vías, para ambos flujos — deuda técnica consciente, aceptada a cambio de no tocar el flujo probado.
- **SDK nuevo para el equipo**: primera vez que se usa Vercel Workflows en el proyecto. Curva de aprendizaje en la primera implementación (serialización de steps, límites de payload de 50MB, límite de 240s para "replay" de un workflow).
- **`next.config.ts` es un archivo compartido**: aunque `withWorkflow()` es aditivo y no debería romper nada, es el único punto de contacto con la app existente — probar el build completo después de este cambio antes de seguir.
- **Costo si el volumen crece mucho**: hoy el uso esperado está muy por debajo del free tier de Hobby (50k eventos/mes), pero si en el futuro se usa a gran escala hay que revisar `docs/workflows/pricing` de Vercel para no sorprenderse con la facturación.
- **No reemplaza el flujo viejo todavía**: mientras conviven ambas vías, hay dos lugares donde se puede disparar preclasificación de un mismo lote — la página de prueba es intencionalmente separada de la UI de producción para minimizar el riesgo de que alguien la use por error en un lote real de un investigador sin saber que es la versión experimental.
