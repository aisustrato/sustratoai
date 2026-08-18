## Requerimiento: OpenAlex Harvester & Staging Buffer

### Fecha: 2026-08-17

### Contexto

Hoy la única vía de ingesta de artículos al proyecto es `app/datos-maestros/cargar-articulos/page.tsx`: sube un CSV en formato Web of Science, lo parsea en el cliente con PapaParse, y lo inserta directo en la tabla maestra `articles` vía `uploadAndProcessArticles` (`lib/actions/article-actions.ts:19`). Este flujo:

- Es **bloqueante y de una sola vez**: `checkIfProjectHasArticles` impide volver a subir si el proyecto ya tiene artículos; hay que borrar todo (`deleteUploadedArticles`) para reintentar.
- **No deduplica nada**: inserta el CSV completo tal cual, sin chequear DOI, título ni ningún identificador repetido.
- Depende de que el usuario ya tenga un CSV exportado desde otra herramienta (WoS, Scopus, etc.) — no hay descubrimiento activo de literatura dentro de Sustrato.

La tabla `articles` (`lib/database.types.ts:501`) es plana: `project_id, correlativo, title, authors, journal, publication_year, abstract, doi, metadata(jsonb)`. No tiene campos para metadatos de OpenAlex (id, conceptos, OA, citas).

Río abajo, el pipeline de preclasificación (`phase_eligible_articles` → `article_batches`/`article_batch_items` → `lib/actions/preclassification-actions.ts` [7811 líneas] → `article_dimension_reviews`) **no se toca** con este requerimiento — sigue tomando artículos desde `articles` de la misma forma que hoy.

Se decidió construir esta funcionalidad como un **flujo nuevo y paralelo**, sin modificar `cargar-articulos` ni su bloqueo actual.

### Objetivo

Agregar un módulo de **pesca masiva vía OpenAlex** con un buffer de staging para triaje, que permita:

1. **Buscar en OpenAlex** por: palabras clave (`title_and_abstract.search`), conceptos, rango de años, tipo de documento, mínimo de citas, acceso abierto, fuente/revista — y también **por semilla** (DOI de un artículo, trayendo sus citas o referencias directas, estilo Litmaps).
2. **Volcar resultados en `staging_articles`** (nueva tabla, por proyecto), con **deduplicación en capa 0** antes de insertar, contra:
   - `staging_articles` existente del proyecto (evita duplicar entre búsquedas distintas)
   - `articles` ya promovidos del proyecto
   - Criterio: OpenAlex ID exacto → DOI exacto (normalizado) → título+año normalizado (fallback difuso)
3. **UI de triaje** sobre `staging_articles`: tarjetas/tabla con estado `pending | promoted | discarded`, semáforo de Acceso Abierto (OA), atajos de teclado (`A` promover, `X` descartar, `S` siguiente, `P` pausar) para procesar en velocidad.
4. **Promoción en lote**: los artículos `promoted` se insertan en `articles` (nuevas columnas `openalex_id`, `is_oa`, `cited_by_count`, `concepts` jsonb). Promover **no** los agrega automáticamente a `phase_eligible_articles` — quedan disponibles para que el mecanismo de fases existente los tome cuando corresponda.
5. Permiso: reutiliza `can_upload_files` (mismo gate que `cargar-articulos` hoy).
6. Ubicación: nueva ruta `app/datos-maestros/harvest-openalex/`, hermana de `cargar-articulos`.

**Criterios de aceptación**

- Una búsqueda con filtros (keyword + año + tipo) trae resultados de OpenAlex y los inserta en `staging_articles`, sin duplicar contra staging ni contra `articles` ya existentes en el proyecto.
- El triaje permite aprobar/descartar artículos individualmente y en lote, con feedback visual del estado OA.
- "Promover" mueve el/los artículo(s) `promoted` a `articles` con sus campos OpenAlex poblados, y los marca en staging como ya promovidos (o los elimina de staging — a definir en implementación).
- `cargar-articulos` sigue funcionando exactamente igual que hoy; cero regresión.
- El pipeline de preclasificación no se modifica ni se ve afectado.

### Archivos involucrados

**Nuevos:**
- `supabase/migrations/*_openalex_harvest.sql` — tabla `staging_articles` + columnas nuevas en `articles` (`openalex_id`, `is_oa`, `cited_by_count`, `concepts jsonb`) + índice único de dedup en staging. **Requiere confirmación explícita antes de tocar `/supabase/migrations` (regla dura del proyecto) y aplicación manual en Supabase Studio (única instancia cloud, sin dev/prod separado).**
- `lib/actions/openalex-actions.ts` — server actions: `searchOpenAlex`, `harvestBySeed` (citas/referencias), `insertIntoStaging` (con dedup), `promoteStagingArticles`, `discardStagingArticles`.
- `lib/openalex/client.ts` — cliente HTTP hacia la API pública de OpenAlex (Polite Pool: header `mailto`), mapeo de respuesta OpenAlex → forma interna.
- `lib/openalex/dedup.ts` — normalización de título/año y lógica de matching capa 0.
- `lib/types/openalex-types.ts` — tipos de request/response y de `staging_articles`.
- `app/datos-maestros/harvest-openalex/page.tsx` — página de búsqueda + configuración de filtros.
- `app/datos-maestros/harvest-openalex/components/StagingTriageView.tsx` — UI de triaje (tarjetas + atajos de teclado).
- `app/datos-maestros/harvest-openalex/components/SearchFiltersPanel.tsx` — formulario de filtros (conceptos, años, citas, OA, tipo, fuente, semilla).

**Tocados (mínimo, no destructivo):**
- `lib/database.types.ts` — regenerar con `npm run update-types` tras la migración.
- Posible entrada en navegación (`components/ui/StandardNavbar.tsx` o el menú de `datos-maestros`) apuntando a la nueva ruta.

**No tocados:** `cargar-articulos/page.tsx`, `article-actions.ts` (uploadAndProcessArticles), todo `preclassification-actions.ts`, `batch-actions.ts`, `phase-eligible-articles-actions.ts`.

### Plan de implementación

1. Diseñar y confirmar con el usuario el DDL exacto de `staging_articles` (columnas, índice único de dedup, RLS por proyecto) y las columnas nuevas en `articles`. Aplicar manualmente en Supabase Studio (no `db push`). Regenerar tipos.
2. Construir `lib/openalex/client.ts`: función de búsqueda con filtros (mapeo directo a query params de la API OpenAlex `/works`), y función de "por semilla" (obtener works citando/citados por un DOI).
3. Construir `lib/openalex/dedup.ts` con la cascada de matching (OpenAlex ID → DOI → título+año normalizado).
4. Construir `lib/actions/openalex-actions.ts`: `searchOpenAlex` (llama al cliente, aplica dedup, inserta en staging), `harvestBySeed`, `listStagingArticles`, `promoteStagingArticles`, `discardStagingArticles` — todas con el mismo patrón de permiso (`has_permission_in_project` + `can_upload_files`) que usa `article-actions.ts` hoy.
5. Construir la UI de búsqueda (`SearchFiltersPanel`) usando componentes `Standard*` existentes (mismo patrón visual que `cargar-articulos`).
6. Construir la UI de triaje (`StagingTriageView`): tabla/tarjetas con badge de estado y OA, acciones promover/descartar individuales y en lote, atajos de teclado.
7. Construir `harvest-openalex/page.tsx` integrando ambas piezas con navegación entre "buscar" y "triaje".
8. Cablear promoción: al confirmar, insertar en lote en `articles` (reusando la lógica de `correlativo` incremental ya existente en `uploadAndProcessArticles` — posible extracción a helper compartido si aplica, solo si es trivial).
9. `npm run build` + `npm run lint` antes de dar por terminado.
10. Probar manualmente: búsqueda real contra OpenAlex, dedup contra artículos ya cargados por CSV en el mismo proyecto, triaje con atajos, promoción, verificación en `articles`.

### Riesgos

- **Rate limiting / Polite Pool**: hay que mandar el header `mailto` en todas las llamadas a OpenAlex; sin eso, degradan las respuestas. Definir de dónde sale ese email (config de proyecto vs. variable de entorno).
- **Volumen**: búsquedas amplias pueden traer miles de resultados; hay que paginar la API de OpenAlex y probablemente poner un tope duro por búsqueda (ej. 200) para no saturar `staging_articles` ni la UI.
- **Dedup difuso (título+año)** es probabilístico — falsos positivos (descarta algo distinto) o falsos negativos (deja pasar un duplicado real) son posibles. Debe quedar claro en la UI cuándo un resultado fue bloqueado por "posible duplicado" vs. insertado limpio.
- **Migración de esquema**: agregar columnas a `articles` y crear `staging_articles` toca la única instancia de base de datos (cloud, sin dev/prod) — aplicar con cuidado y confirmación explícita antes de ejecutar.
- **`preclassification-actions.ts` ya tiene 7811 líneas**: cualquier tentación de "aprovechar y tocarlo" debe resistirse — este requerimiento es explícitamente aguas arriba de ese archivo.
- **Enum `job_type`** en BD ya tiene un valor `import_articles` sin uso actual en código — candidato natural para el job de harvesting si se decide correrlo en background (patrón `ai_job_history` + `PreclassificationJobHandler.tsx`), evitando así una migración de enum. A confirmar si el volumen esperado justifica correrlo como job async o alcanza con síncrono.

### Pendiente futuro (no implementado en v1)

- **Email del Polite Pool por investigador**: hoy `OPENALEX_POLITE_POOL_EMAIL` es una única env var global (todo el tráfico de la app se identifica con el mismo email ante OpenAlex). Con varios investigadores usando el harvester en simultáneo (ej. beta testers), todo ese volumen cae sobre un solo email — mismo problema conceptual que motivó BYOK para DeepSeek, aunque de menor severidad (OpenAlex es gratuito y sin límites duros de cuota, el Polite Pool es solo prioridad de respuesta). Mejora natural: mismo patrón que `/personal/configuracion` (BYOK), pero más simple — el email no es secreto, así que sería un campo de texto plano en `users_profiles` o una tabla liviana, sin encriptación ni RPCs. Implementar cuando haya varios investigadores usando el harvester activamente, no antes.
