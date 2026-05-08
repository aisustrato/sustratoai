# Reporte — Hito 3 · Cognética Forense v2 · Oleada 2

**Fecha:** 23 abril 2026
**Ejecutor:** Cascade (Windsurf)
**Hito:** 3 — Cartografiador (segundo pipeline desacoplado)
**Estatus:** ✅ Completado (pendiente smoke test contra artefacto real)
**Predecesor:** Hito 2 (reporte en `reporte_hito_2.md`)

---

## 1. Cambio de rumbo arquitectural (decisión de eRRRe)

Antes de arrancar Hito 3, detecté un bloqueador: la guía asumía que el Destilado persistía los insumos como JSONB (`cgt_destilados.insumos_extraidos`), pero la tabla real no tiene esa columna y el código de `generarDestilado` tampoco los guardaba. Reporté a eRRRe y su propuesta eliminó el problema de raíz:

> **"Que el Destilado guarde directo en las tablas finales de menciones, no en JSONB. Así el Cartografiador toma siempre de la misma fuente. El primer extractor no sería necesario."**

Consecuencias:

- **La guía §3 HITO 3 describía dos transacciones** (A: poblar Capa 1 desde JSONB; B: resolver Capa 2). Con esta decisión, **Transacción A queda absorbida en `generarDestilado`** y el Cartografiador solo hace B.
- **Cero migraciones SQL** — la tabla `cgt_destilados` queda como está (sin `insumos_extraidos`).
- **Cero créditos Hongo** — no hay nada que aplicar en Supabase.
- Elimina duplicación de datos (JSONB intermedio que replicaría las menciones).
- Naturalmente append-only: dedup por `hash_extractor_crudo` al regenerar.

Esta decisión se documenta en los comentarios de cabecera de los archivos afectados.

---

## 2. Pre-Hito 3 — `generarDestilado` persiste menciones

**Archivo nuevo:**

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/lib/persistir-menciones-extractor.ts`

Expone `persistirMencionesExtractor(supabase, artefactoId, projectId, insumos)` que:

- Parsea cada array de insumos del Destilado con **schema dual** (string plano de prompt v1 **o** `{nombre, descripcion}` de prompt v2 — sin branch externo).
- Calcula `hash_extractor_crudo = SHA-256(JSON canónico del ítem)`.
- Dedup por hash: lee hashes ya presentes para el artefacto y filtra antes de insertar.
- Bulk insert en las 5 tablas `cgt_<tipo>_menciones` con `decision_cartografiador = 'sin_cartografiar'`.
- Retorna stats `{pensadores_insertados, disciplinas_insertadas, conceptos_insertados, teorias_insertadas, citas_insertadas, duplicados_saltados, malformados}`.

Las citas tienen parser especial (`texto/autor/referencia/tipo_cita/ubicacion`) — maneja `referencia` (prompt v2) y `ubicacion` (prompt v1) con precedencia por `referencia`.

**Integración:** `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/actions/cognetica-forense-metabolizacion-actions.ts` — paso (7) añadido tras el INSERT a `cgt_destilados`. Si falla, el Destilado queda persistido pero se retorna `INTERNAL`; la regeneración retomará gracias a la dedup por hash.

---

## 3. Artefactos del Hito 3

### 3.1 Prompt Cartografiador

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/prompts/cartografiador-prompt.ts`

- `CARTOGRAFIADOR_SYSTEM_PROMPT`: pegado literal desde `cartografiador_prompt_v1.md §1` (~1.200 tokens).
- Shapes tipados del universo y extracto (`UniversoProyecto`, `ExtractoCrudo`, `MencionCrudaSimple`, `MencionCrudaCita`, `EntidadUniversoSimple`, `CitaUniverso`).
- `construirUserPromptCartografiador(universo, extracto)`: user prompt según spec §2. Limpia los `mencion_id` internos antes de pasar al LLM (el LLM solo ve los UUIDs del universo).
- `calcularMaxTokensCartografiador(extracto)`: `max(1500, total_menciones * 120)` con tope 4000 (spec §3).
- Constantes de config: `CARTOGRAFIADOR_MODEL = "deepseek-chat"`, `TEMPERATURE = 0.3`, `TIMEOUT_MS = 5 min`.

### 3.2 Construcción de payload

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/lib/cartografiador/construir-payload.ts`

- `construirUniverso(supabase, projectId)`: 5 SELECT paralelos sobre las canónicas. Normaliza `aliases` JSONB → `string[]`.
- `construirExtracto(supabase, artefactoId)`: 5 SELECT paralelos de menciones con `decision_cartografiador = 'sin_cartografiar'`, ordenadas cronológicamente. Cada mención lleva su `mencion_id` para el UPDATE posterior.
- `totalMencionesExtracto(extracto)`: helper de corto-circuito — si es 0, no se llama al LLM.

### 3.3 Aplicación de decisiones

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/lib/cartografiador/aplicar-decisiones.ts`

El núcleo del Cartografiador. Valida respuesta del LLM con guards puros (`asDecision`, `asTipoCita`, `asUuid`, `asConfianza`, `asTextoRequerido`) y aplica:

- **`match_existente`** → UPDATE mención con `<tipo>_id = uuid` y campos Capa 2. Valida UUID contra el universo pasado al LLM.
- **`nueva_entidad`** → crea o reusa canónica con el helper `crearOReusarCanonica` (check previo por `nombre_canonico`, INSERT si no existe, fallback a SELECT-retry ante race UNIQUE 23505). Dedup intra-corrida con `canonicasRecien: Map<nombre, id>` para que dos menciones con el mismo `nombre_cartografiador` apunten al mismo canónico.
- **`ambigua`** → UPDATE mención con Capa 2 pero `<tipo>_id = NULL`.

**Degradaciones del sistema** (anotadas en la justificación con prefijo `[sistema]`):

1. LLM propone `nueva_entidad` pero ya existe canónica con ese nombre → degrada a `match_existente` contra la preexistente.
2. Segunda mención de `nueva_entidad` con el mismo `nombre_cartografiador` intra-corrida → degrada a `match_existente` contra la recién creada.

Citas tienen ruta propia (`procesarCitas`): sin dedup por "nombre" (no hay UNIQUE sobre texto), cada `nueva_entidad` crea una cita canónica fresca.

Stats retornadas: `{matches, nuevas, ambiguas, inconsistentes, canonicas_creadas}`.

### 3.4 Orquestador

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/actions/cognetica-forense-cartografiador-actions.ts`

Server Action `ejecutarCartografiador(artefactoId)`:

1. Validación de sesión + lookup del artefacto (RLS filtra por proyecto).
2. Construir universo + extracto en paralelo.
3. Si 0 menciones pendientes → retorna stats vacías con log informativo.
4. Llamada al LLM con `CARTOGRAFIADOR_*` constants + `parsearJsonLLM` tolerante.
5. Logging via `logLlamadaDeepseek` (reutiliza infraestructura Oleada 1) con `formato: "cartografiador"`.
6. Parsear + `normalizarRespuesta` defensiva (si el LLM omite un array, se trata como `[]`).
7. `aplicarDecisiones` ejecuta los UPDATE.
8. `registrarLogCartografiador` inserta fila en `cgt_logs_cartografiador` con contadores + universo counts + tokens/costo/duracion + finish_reason + error_mensaje. No bloqueante: si el log falla, se notifica consola pero la mutación principal queda.

Retorna `Result<ResultadoCartografiador, ResultErrorCode>`.

Errores mapeados:
- LLM throw → `LLM_ERROR`, log de corrida con `error_mensaje`.
- JSON inválido → `LLM_ERROR`, log con `error_mensaje`.
- Artefacto no existe / sin acceso → `NOT_FOUND`.
- Sin sesión → `UNAUTHORIZED`.

### 3.5 UI

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/app/cognetica/[id]/CartografiadorButton.tsx`

Componente cliente `StandardButton` con:

- Color `tertiary`, icono `Compass` (lucide).
- Habilitado cuando `data.cronica && data.destilado && data.nucleo && estado !== "metabolizando"`. Germinal puede estar `omitido` (umbral <3 artefactos previos); no bloquea (cartografiamos con lo que haya).
- Al click: `ejecutarCartografiador(artefactoId)` con loading state + `router.refresh()` al terminar.
- Muestra resumen con formato legible: `"X matches, Y nuevas, Z ambiguas · US$0.0042"`.
- Maneja error con `StandardAlert` colorScheme `danger` y mensaje para reintentar.

Integrado en `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/app/cognetica/[id]/ArtefactoView.tsx` junto al `MetabolizarButton` en el `StandardCard.Header`.

---

## 4. Quality gates

```
npx tsc --noEmit -p tsconfig.json              → 0 errores
npx eslint [scope Hito 3] --max-warnings=0     → 0 errores, 0 warnings
```

Scope lintado: los 6 archivos nuevos + los 2 modificados del Pre-Hito 3 + `ArtefactoView.tsx`.

---

## 5. Archivos

**Creados (6):**

- `lib/cognetica-forense/lib/persistir-menciones-extractor.ts`
- `lib/cognetica-forense/prompts/cartografiador-prompt.ts`
- `lib/cognetica-forense/lib/cartografiador/construir-payload.ts`
- `lib/cognetica-forense/lib/cartografiador/aplicar-decisiones.ts`
- `lib/actions/cognetica-forense-cartografiador-actions.ts`
- `app/cognetica/[id]/CartografiadorButton.tsx`

**Modificados (2):**

- `lib/actions/cognetica-forense-metabolizacion-actions.ts` — paso (7) en `generarDestilado`: persistir menciones crudas.
- `app/cognetica/[id]/ArtefactoView.tsx` — import + render del `CartografiadorButton`.

---

## 6. Qué se verifica en los smoke tests (ref. `tests_smoke_oleada_2.md`)

- **Escenario A** (proyecto vacío, 1er artefacto): todas `nueva_entidad`. Verificar que no hay matches espurios + canónicas creadas + contadores en 1 + log refleja `matches=0, nuevas>0, ambiguas=0`.
- **Escenario B** (2do artefacto con solapamientos): mix de `match_existente` + `nueva_entidad`. Verificar que el contador salta a 2, las justificaciones son específicas.
- **Escenario C** (ambigüedad forzada): al menos una `ambigua`. Verificar que la mención queda con `<tipo>_id = NULL` y el contador no suma.
- **Escenario D** (edición humana append-only): se corre sobre datos del Cartografiador — Capa 3 ejercitará las Server Actions del Hito 2.

---

## 7. Pre-requisito para correr smoke tests

**El artefacto del 21 abril (metabolizado bajo Oleada 1, pre-Pre-Hito-3) no tiene menciones persistidas.** Antes de correr el Cartografiador sobre él, hay que regenerar su Destilado para que `persistirMencionesExtractor` se ejecute y pueble las 4 tablas de menciones.

**Cómo regenerar:**

Opción 1 (UI): borrar manualmente la fila de `cgt_destilados` para ese artefacto desde Supabase, y darle click a "Continuar metabolización" en la UI del artefacto. Hito 6 está pendiente (prompt v2 con teorías), así que el Destilado regenerado tendrá el schema v1 (sin teorías, strings planos) — que el Cartografiador maneja igual.

Opción 2 (vía cliente): con el artefacto en estado `metabolizado` y borrando el Destilado por RPC, disparar otra metabolización. El pipeline hace resume-from-last y solo regenerará los formatos faltantes.

Recomiendo Opción 1 — una sola acción manual, sin riesgo colateral.

---

## 8. Limitaciones conocidas / próximos pasos

1. **Teorías siempre vacías** hasta Hito 6. El prompt v1 de Destilado no pide `teorias_invocadas`; el array quedará en `[]` en los destilados hasta que ejecutemos Hito 6. El Cartografiador maneja esto sin error.

2. **UI de resultados detallados** es Hito 4. Ahora el usuario solo ve el toast-resumen; para inspeccionar menciones individuales, su justificación y editar humanamente, hace falta Hito 4.

3. **Navegación por entidad** es Hito 5 (badges clickeables).

4. **Artefacto del 21 abril requiere regeneración** — cubierto en sección 7.

---

## 9. Detenido a la espera

Pendiente:

1. eRRRe confirma arquitectura aceptada (propuesta Pre-Hito 3).
2. eRRRe regenera el Destilado del artefacto del 21 abril (Opción 1 de §7).
3. Corremos juntos los 4 smoke tests (`docs/cognetica/tests_smoke_oleada_2.md`).
4. Con luz verde de los smoke tests, arrancamos Hito 4.

**No escribo una línea más hasta confirmación.**

---

*ética es negentropía a nivel de datos*
