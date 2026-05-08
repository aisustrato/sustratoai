# Reporte de reutilización v1 → v2 (Cognética Forense)

**Obligatorio por §3 del addendum v1.1.** Trazabilidad de qué ideas/piezas se toman del módulo legacy `/app/cognetica_old/` + `/lib/actions/cognetica-old-*.ts` y qué se reescribe limpio alineado a la arquitectura v2.

**Principio (cita del addendum):**
> *"Si está funcionando en cognética pasado, ejemplo el ensayo de fechas, no inventes la rueda."* — eRRRe

---

## 1. Cliente DeepSeek

### Qué existe en v1
- `@/lib/deepseek/api.ts` — wrapper minimalista `callDeepSeekAPI(model, text)`:
  - Fetch directo a `https://api.deepseek.com/v1/chat/completions`
  - `temperature: 0.2` hardcoded, `max_tokens: 8192` hardcoded
  - Sin `response_format`, sin system prompt separado, sin backoff
  - Retorna `{ result, usage }` con `prompt_tokens`/`completion_tokens`/`total_tokens`
- `@/lib/actions/cognetica-old-distillation-actions.ts` — llamadas directas a DeepSeek con `deepseek-reasoner`, `response_format: json_object`, system+user separados, `temperature` variable. Patrón concreto a copiar estructuralmente.
- `@/lib/actions/cognetica-old-chat-actions.ts` y varios `*-lightweight-extraction-actions.ts` — mismo patrón de fetch directo.

### Reutilización v2
- **Idea tomada**: estructura de request (`messages: [{ role: 'system' }, { role: 'user' }]`, `response_format`, `temperature`, `max_tokens`) del patrón usado en `cognetica-old-distillation-actions.ts`.
- **Código nuevo**: `callDeepSeek()` en `@/lib/deepseek/api.ts` con
  - config completa (`DeepSeekCallConfig`),
  - backoff exponencial (1s, 2s, 4s, 8s — pipeline §9),
  - separación `reasoning_content` vs `content` para `deepseek-reasoner` (pipeline §1, "solo persistir `content`"),
  - cálculo de costo con cache hit (pipeline §10),
  - logging estructurado a `cgt_logs_deepseek`,
  - timeout duro 10 minutos.
- **Retrocompatibilidad**: se mantiene `callDeepSeekAPI()` legacy funcional — papers y preclasificación siguen usándolo.

---

## 2. Chunking para contenido largo

### Qué existe en v1
- `splitIntoChunks(text, maxTokens = 30000)` en `cognetica-old-distillation-actions.ts` — parte lineal por `chunkSize`, no respeta secciones.
- `processMultipleChunks()` — procesa chunks con **contexto acumulativo** (cada chunk recibe resúmenes previos). Bueno.
- `estimateTokens()` en `@/lib/utils/token-estimator.ts` — estimador heurístico (4 chars ≈ 1 token).

### Reutilización v2
- **Reutilizar directo**: `estimateTokens()` — importar sin modificar (es utilidad pura, sin dependencias de cognética legacy).
- **Idea tomada**: el patrón de contexto acumulativo de `processMultipleChunks`.
- **Código nuevo**: `prepararContenidoLargo()` en `@/lib/cognetica-forense/chunking.ts` con:
  - Chunking que **respeta secciones/párrafos** (no cortar a mitad de oración, pipeline §7),
  - Síntesis parcial de cada chunk con `deepseek-chat` (barato) — no contexto acumulativo por ahora, consolidación en segunda ronda si aún excede,
  - Marca en `metadata.chunking_aplicado = true` del artefacto para auditoría.
- **Diferencia clave**: pipeline v2 apunta a umbral 50K (no 30K como v1) porque el output target es Crónica (5K) vs Destilado v1 (8K).

---

## 3. Obtención de contenido procesado por tipo de artefacto

### Qué existe en v1
- `@/lib/actions/cognetica-old-helpers.ts::getArtifactTextContent(artifactId)`:
  - Dispatch por `artifactType`: `audio|video` → `cog_transcriptions.full_text`, `pdf_slides` → páginas concatenadas con separador, `pdf_report|markdown` → transcripción, `chat` → mensajes serializados.
  - Retorna `{ text, source, category, pageCount, artifactType }`.

### Reutilización v2
- **Idea tomada**: dispatch por tipo + separadores `--- PÁGINA N ---` para PDF slides.
- **Código nuevo**: `obtenerContenidoMetabolizable(artefactoId)` en `@/lib/cognetica-forense/contenido-metabolizable.ts`:
  - Mapea a tablas nuevas `cgt_*` (no `cog_*`):
    - `markdown` → `cgt_artefactos_markdown.contenido`
    - `audio` → `cgt_audio_segmentos` concatenados con `[HH:MM:SS][hablante]`
    - `video` → `cgt_video_segmentos` (mismo patrón)
    - `pdf_informe` → `cgt_artefactos_pdf_informe.markdown_renderizado`
    - `pdf_slides` → `cgt_artefactos_pdf_slides.paginas` con separador `--- Página N ---`
    - `imagen` → `cgt_imagenes_descritas.descripcion_humana || descripcion_ia || metadatos`
  - Retorna `string` markdown unificado (firma simplificada).

---

## 4. Manejo de fechas en metadatos / frontmatter

### Qué existe en v1
- `cognetica-old-essay-edit-actions.ts` y helpers — parsean frontmatter YAML del ensayo (autor, fecha, etc.) con `js-yaml`.
- Formato de fecha: ISO 8601 para `generated_at`, `YYYY-MM-DD` para fechas del artefacto original.

### Reutilización v2
- **Idea tomada**: formato ISO 8601 + campos `autor_original`, `fecha_original`.
- **Código nuevo**: `@/lib/cognetica-forense/parsers/markdown.ts` **ya existe** (Fase ingesta) y usa `gray-matter` — ya parsea frontmatter correctamente. Nada más que hacer acá.

---

## 5. Render PDF a páginas

### Qué existe en v1
- `PresentationSlidesViewer` (componente) + utilidades en `@/lib/utils/pdf-parser.ts`.

### Reutilización v2
- **Reutilizar mayormente como está** para `cgt_artefactos_pdf_slides` cuando se implemente en oleadas posteriores (fuera del scope actual Oleada 1 que solo hace `markdown`).
- **Nota**: Oleada 1 **no** implementa ingesta de PDF; cuando se haga, portar la lógica ajustando al schema v2.

---

## 6. Extracción de elementos cognitivos (semillas, pensadores, citas)

### Qué existe en v1
- `cognetica-old-extraction-actions.ts` y `cognetica-old-lightweight-extraction-actions.ts` — extraen seeds / thinkers / disciplines / notable_phrases del destilado usando `deepseek-chat` con JSON mode.
- Persisten en tablas `cog_fractal_seeds`, `cog_thinkers`, `cog_theories`, `cog_disciplines`, `cog_quotes`.

### Reutilización v2
- **Arquitectura distinta**: en v2 estos elementos viven **dentro** del Destilado (`cgt_destilados` con campos `pensadores_mencionados`, `disciplinas_tocadas`, `conceptos_clave`, `citas_secundarias` en JSONB — ver schema de `generarDestilado` pipeline §5).
- **No hay tablas maestras** de pensadores/disciplinas en Oleada 1 (se puede agregar en oleadas futuras si Hongo lo pide).
- **Idea tomada**: el shape JSON que solicita el prompt al modelo (arrays de strings para cada tipo).

---

## 7. Chat histórico con artefacto

### Qué existe en v1
- `cognetica-old-chat-actions.ts` + `cog_chat_sessions` — sesiones de chat con DeepSeek sobre un artefacto específico.

### Reutilización v2
- **Fuera de scope Oleada 1.** No está en el requerimiento actual. Si se porta, ajustar al schema `cgt_*`.

---

## 8. Ensayo destilado / prompt de destilación

### Qué existe en v1
- Prompt de destilación en `cognetica-old-distillation-actions.ts` (líneas 100-145 aprox.) — prompt "académico experto en síntesis conceptual" con instrucciones de chunking.

### Reutilización v2
- **No reutilizar directo**. Pipeline v1 define los prompts reales (placeholder `DESTILADO_SYSTEM_PROMPT`) y el addendum §9 es explícito: **Cascade NO escribe los prompts**, los entrega Hongo.
- **Idea tomada**: estructura de sección del user prompt (`Artefacto original: ... --- Crónica ya generada: ...`) — pipeline §5 la define igual.

---

## 9. Almacenamiento de archivos en Supabase Storage

### Qué existe en v1
- Bucket `cognetica-files` ya existe con paths `cognetica/{project_id}/{artifact_id}/`.
- Allowlist del bucket actual: `text/markdown`, `text/plain`, etc. (restrictiva).

### Reutilización v2
- **Reutilizar bucket**: v2 usa el mismo `cognetica-files` con paths `cognetica/{project_id}/{artefacto_id}/{nombre}`.
- **Ampliar allowlist**: addendum §5.3 pide agregar `application/json` y `application/yaml` (no servir como `text/plain`).

---

## 10. Resumen cuantitativo

| Pieza v1                     | Acción en v2                        | Resultado                           |
|------------------------------|-------------------------------------|-------------------------------------|
| `estimateTokens` util        | Importar tal cual                   | Reutilización directa               |
| `splitIntoChunks`            | Reescribir respetando secciones     | Idea tomada, código nuevo           |
| `getArtifactTextContent`     | Reescribir para `cgt_*`             | Idea tomada, código nuevo           |
| `callDeepSeekAPI`            | Mantener legacy + nuevo `callDeepSeek` | Convivencia                      |
| Prompt de destilación v1     | No reutilizar (Hongo entrega)       | Placeholder estructurado            |
| `PresentationSlidesViewer`   | Mantener para futura oleada PDF     | Reutilización diferida              |
| Extracción en tablas seeds/thinkers | No aplica en v2 (van en JSONB destilado) | Arquitectura distinta   |
| Bucket `cognetica-files`     | Reutilizar + ampliar MIMEs          | Reutilización con extensión         |
| Parseo frontmatter `js-yaml` | Ya migrado a `gray-matter` en v2    | Ya resuelto en ingesta              |
| Fechas ISO 8601              | Convención mantenida                | Reutilización conceptual            |

---

## 11. Conclusión

**Reutilización real**: 3 piezas (`estimateTokens`, patrón de request DeepSeek, convención de paths en Storage).

**Ideas tomadas, código reescrito**: chunking, obtención de contenido por tipo, contexto acumulativo.

**Sin reutilización (por diseño v2)**: extracción en tablas maestras, prompts específicos (los entrega Hongo), chat histórico.

**Compromiso Cascade**: al implementar cada server action de metabolización, incluir en el encabezado del archivo una sección `// Reutilización de v1:` nombrando la pieza concreta y citando este reporte.
