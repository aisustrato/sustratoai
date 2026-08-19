## Nota técnica: Job manager de preclasificación en Vercel

### Fecha: 2026-08-18

### Contexto

Los 4 flujos de preclasificación (`startInitialPreclassification`, `startSingleArticlePreclassification`, `startBatchTranslation`, `startDiscrepancyReconciliation`, todos en `lib/actions/preclassification-actions.ts`) disparan su job runner en background **sin `await`** ("fire and forget"): la server action crea el registro en `ai_job_history` y retorna de inmediato, mientras el runner sigue procesando chunks y llamando a DeepSeek.

Esto funciona sin problema en local (el proceso de Node sigue vivo), pero en el modelo serverless de Vercel **no está garantizado**: la documentación oficial de Vercel/Next.js es explícita — "background tasks (fire-and-forget) no están soportadas por default; una vez que la función retorna la respuesta, deja de procesar, incluyendo cualquier tarea pendiente." El runtime puede congelar/terminar la invocación apenas se envía la respuesta al cliente, dejando el job runner huérfano a mitad de camino.

### Fix aplicado (2026-08-18)

Se envolvieron las 4 llamadas fire-and-forget en `waitUntil()` de `@vercel/functions` (paquete instalado con autorización explícita del usuario). `waitUntil(promise)` le indica a Vercel que mantenga viva la invocación hasta que la promesa se resuelva, sin bloquear ni demorar la respuesta ya enviada al cliente.

**Por qué `waitUntil()` y no `after()` de Next.js**: `after()` es la API nativa recomendada para esto, pero recién es estable desde Next.js 15.1. Este proyecto está en **Next.js 14.2.33** — `after()`/`unstable_after()` no existen en esa versión. `waitUntil()` es el primitivo equivalente a nivel de plataforma Vercel, funciona igual en Next 14.

### Límites de duración vigentes (verificado contra docs oficiales, julio 2026)

Con Fluid Compute (activado por default en Vercel):

| Plan | Default | Máximo | Máximo extendido |
|---|---|---|---|
| Hobby | 300s (5 min) | 300s (5 min) | — |
| Pro | 300s (5 min) | 800s | 1800s (30 min, beta) |

Es decir: **no es tan restrictivo como se asumía inicialmente** ("Hobby = 10s" es información desactualizada que sigue circulando en blogs de terceros). El límite real hoy ronda los 5 minutos incluso en el plan gratuito, sin configuración adicional.

- `waitUntil()` por sí solo NO extiende ese límite — solo evita que el runtime mate la tarea *antes* de tiempo. El techo sigue siendo el `maxDuration` de la ruta.
- Para superar 300s (ej. si un lote grande de preclasificación tarda más), hay que:
  1. Estar en plan **Pro** (sube el máximo configurable a 800s, o 1800s en beta).
  2. Declarar explícitamente `export const maxDuration = N` — **en la página (`page.tsx`) o layout que dispara la Server Action**, no en el archivo de la action. Complicación real de este proyecto: tanto `app/articulos/layout.tsx` como `app/articulos/preclasificacion/[batchId]/page.tsx` son `"use client"`, y `maxDuration` no puede exportarse desde un archivo con esa directiva. Si se necesita subir el límite, va a requerir introducir un `layout.tsx` server component en ese segmento de ruta (hoy no existe) — pendiente, no implementado.

### Estado actual

- ✅ Fix de `waitUntil()` aplicado a los 4 flujos — corrige el riesgo de terminación prematura.
- ⏳ Sin verificar en producción todavía (recién se hizo push a Vercel).
- ⏳ `maxDuration` no configurado explícitamente en ningún lado — corre con el default de la plataforma (300s Hobby/Pro). Si algún lote real se acerca a ese techo, hay que: (a) confirmar con logs de `ai_job_history` cuánto tardan los lotes más grandes probados, (b) si hace falta más margen, evaluar upgrade a Pro + resolver el problema de `"use client"` en la jerarquía de layouts para poder declarar `maxDuration` más alto.
- 📌 Opción de fondo si el volumen crece mucho: migrar a **Vercel Workflows**, pensado específicamente para jobs que pausan/reanudan sin límite de duración — no evaluado en profundidad, mencionado por Vercel como la alternativa "sin límite" a este patrón.

### Cómo verificar que funciona en producción

Correr una preclasificación real desde la app deployada en Vercel y confirmar en `ai_job_history` que el job llega a `status: 'completed'` (no se queda colgado en `'running'` indefinidamente, que sería la señal de que el runtime mató la invocación a mitad de camino).
