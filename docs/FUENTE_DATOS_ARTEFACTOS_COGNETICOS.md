# 📚 Fuente de Datos: Artefactos Cogneticos

## 🎯 Propósito
Este documento describe **dónde se almacenan los diferentes tipos de contenido** para cada tipo de artefacto en el sistema Cognetica. Es fundamental para cálculo de tokens, exportación, y cualquier procesamiento que requiera acceder al contenido completo de un artefacto.

---

## 📊 Resumen por Tipo de Artefacto

### **Contenido Principal**

| Tipo de Artefacto | Tabla Principal | Campo de Contenido | Notas |
|-------------------|-----------------|-------------------|-------|
| `audio` | `cog_transcriptions` | `full_text` | Transcripción generada por Whisper |
| `video` | `cog_transcriptions` | `full_text` | Transcripción generada por Whisper |
| `pdf_report` | `cog_transcriptions` | `full_text` | Contenido extraído por Marker API |
| `pdf_slides` | `cog_artifact_pages` | `markdown_original` | **Por páginas**, concatenar ordenadas |
| `markdown` | `cog_transcriptions` | `full_text` | Contenido parseado del .md |

### **Ensayo Destilado (Opcional)**

Para artefactos con transcripciones muy largas (>100k tokens), existe un **ensayo destilado** que sintetiza el contenido:

| Campo | Tabla | Descripción | Tokens Aprox. |
|-------|-------|-------------|---------------|
| `distilled_essay` | `cog_transcriptions` | Ensayo académico destilado | ~10,000 |
| `distilled_essay_metadata` | `cog_transcriptions` | Metadata: modelo, fecha, ratio compresión | - |

**Propósito:** Reducir transcripciones de 100k+ tokens a ~10k tokens manteniendo profundidad conceptual.

**Generación:** 
- Llamar a `/api/cognetica/distilled-essay` (POST) con `artifactId`
- Usa DeepSeek para generar ensayo académico coherente
- Preserva conceptos clave sin diluirlos

**Consulta:**
```sql
SELECT distilled_essay, distilled_essay_metadata
FROM cog_transcriptions
WHERE artifact_id = '<artifact_id>'
  AND distilled_essay IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔍 Detalle por Tipo de Artefacto

### 1️⃣ Audio (`audio`)

**Tabla:** `cog_transcriptions`  
**Campo:** `full_text`  
**Proceso:**
1. Audio se procesa con **Whisper** (via Replicate)
2. Transcripción se guarda en `cog_transcriptions.full_text`
3. Metadata adicional en `cog_artifacts.source_metadata`

**Query de ejemplo:**
```sql
SELECT full_text 
FROM cog_transcriptions 
WHERE artifact_id = '<artifact_id>' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Archivo de procesamiento:** `/lib/actions/cognetica-actions.ts` → `processAudioVideo()`

---

### 2️⃣ Video (`video`)

**Tabla:** `cog_transcriptions`  
**Campo:** `full_text`  
**Proceso:**
1. Video se procesa con **Whisper** (via Replicate)
2. Solo se extrae el audio para transcripción
3. Transcripción se guarda en `cog_transcriptions.full_text`

**Query de ejemplo:**
```sql
SELECT full_text 
FROM cog_transcriptions 
WHERE artifact_id = '<artifact_id>' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Archivo de procesamiento:** `/lib/actions/cognetica-actions.ts` → `processAudioVideo()`

---

### 3️⃣ PDF Informe (`pdf_report`)

**Tabla:** `cog_transcriptions`  
**Campo:** `full_text`  
**Proceso:**
1. PDF se procesa con **Marker API** (via Replicate)
2. Se extrae todo el contenido como markdown
3. Se guarda como "transcripción sintética" en `cog_transcriptions.full_text`
4. Metadata (título, autor, páginas) en `cog_artifacts.source_metadata`

**Query de ejemplo:**
```sql
SELECT full_text 
FROM cog_transcriptions 
WHERE artifact_id = '<artifact_id>' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Archivo de procesamiento:** `/lib/actions/cognetica-actions.ts` → `processDocumentPDF()`

---

### 4️⃣ PDF Presentación/Slides (`pdf_slides`) ⚠️ ESPECIAL

**Tabla:** `cog_artifact_pages`  
**Campo:** `markdown_original`  
**Proceso:**
1. PDF se **divide en páginas individuales**
2. Cada página se procesa con **Marker API**
3. Cada página se guarda en `cog_artifact_pages` con su `page_number`
4. Para obtener contenido completo: **concatenar todas las páginas ordenadas**

**Query de ejemplo:**
```sql
SELECT markdown_original, page_number
FROM cog_artifact_pages
WHERE artifact_id = '<artifact_id>'
ORDER BY page_number ASC;
```

**Concatenación en código:**
```typescript
const { data: pages } = await supabase
    .from('cog_artifact_pages')
    .select('markdown_original, page_number')
    .eq('artifact_id', artifactId)
    .order('page_number', { ascending: true });

const fullContent = pages
    .map(p => p.markdown_original)
    .filter(Boolean)
    .join('\n\n');
```

**Archivos de procesamiento:**
- `/lib/actions/cognetica-presentation-actions.ts` → `splitPDFIntoPages()`
- `/lib/actions/cognetica-presentation-actions.ts` → `processPageWithMarker()`

**Metadata adicional:**
```typescript
// En cog_artifacts.source_metadata
{
  isPresentation: true,
  processing_mode: "presentacion",
  has_pages: true,
  total_pages: <number>
}
```

---

### 5️⃣ Markdown (`markdown`)

**Tabla:** `cog_transcriptions`  
**Campo:** `full_text`  
**Proceso:**
1. Archivo .md se descarga de Storage
2. Se parsea con `parseMarkdown()` (extrae frontmatter)
3. Contenido se guarda como "transcripción sintética" en `cog_transcriptions.full_text`
4. Frontmatter (si existe) en metadata

**Query de ejemplo:**
```sql
SELECT full_text 
FROM cog_transcriptions 
WHERE artifact_id = '<artifact_id>' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Archivo de procesamiento:** `/lib/actions/cognetica-actions.ts` → `processMarkdownDocument()`

---

## 🍄 Metabolización Micelio (Crónica Forense)

**Tabla:** `cog_artifacts`  
**Campo:** `source_metadata.micelio_chronicle`  
**Estructura:**
```typescript
{
  micelio_chronicle: {
    version_destilada: string,
    version_completa: string,
    // Puede tener más propiedades según evolución del sistema
  }
}
```

**Query de ejemplo:**
```sql
SELECT source_metadata->'micelio_chronicle' as chronicle
FROM cog_artifacts
WHERE id = '<artifact_id>';
```

**Notas:**
- Para cálculo de tokens: iterar sobre **todas las propiedades** del objeto `micelio_chronicle`
- No asumir solo `version_destilada` y `version_completa`
- Filtrar solo valores tipo `string` con longitud > 0

**Archivo de procesamiento:** `/lib/actions/cognetica-actions.ts` → `getChronicleForArtifact()`

---

## 🧠 Elementos Cognitivos

### Semillas Fractales
**Tabla:** `cog_fractal_seeds`  
**Campo:** `content`  
**Filtro:** Excluir tags que contengan `"cita"`

```sql
SELECT content 
FROM cog_fractal_seeds 
WHERE artifact_id = '<artifact_id>' 
AND NOT tags @> '["cita"]';
```

### Disciplinas
**Tabla:** `cog_artifact_disciplines`  
**Join:** `cog_disciplines.name`

```sql
SELECT d.name 
FROM cog_artifact_disciplines ad
JOIN cog_disciplines d ON d.id = ad.discipline_id
WHERE ad.artifact_id = '<artifact_id>';
```

### Teorías
**Tabla:** `cog_artifact_theories`  
**Join:** `cog_theories.name`

```sql
SELECT t.name 
FROM cog_artifact_theories at
JOIN cog_theories t ON t.id = at.theory_id
WHERE at.artifact_id = '<artifact_id>';
```

### Pensadores
**Tabla:** `cog_artifact_thinkers`  
**Join:** `cog_references.name`

```sql
SELECT r.name 
FROM cog_artifact_thinkers at
JOIN cog_references r ON r.id = at.thinker_id
WHERE at.artifact_id = '<artifact_id>';
```

---

## 💬 Chat Calibrador Quipu

**Tabla:** `cog_chat_sessions`  
**Campo:** `messages` (JSONB array)  
**Estructura:**
```typescript
messages: Array<{
  role: 'user' | 'assistant',
  content: string
}>
```

**Query de ejemplo:**
```sql
SELECT messages 
FROM cog_chat_sessions 
WHERE artifact_id = '<artifact_id>';
```

**Cálculo de tokens:**
```typescript
let totalTokens = 0;
chatSessions.forEach(session => {
    const messages = session.messages as Array<{content: string}>;
    messages.forEach(msg => {
        totalTokens += estimateTokens(msg.content);
    });
});
```

---

## � Datos Cronológicos

**Tabla:** `cog_chronological_data`  
**Campos:** `date_value`, `event_type`, `description`, `context`  
**Estructura:**
```typescript
interface ChronologicalData {
  id: string;
  artifact_id: string;
  project_id: string;
  date_value: string | null;        // Fecha en formato flexible
  event_type: string;                // 'date', 'event', 'period', 'milestone'
  description: string;               // Descripción del evento
  context: string | null;            // Contexto adicional
  confidence_score: number | null;   // 0.0 - 1.0
  extracted_by: string | null;       // 'lightweight' o 'deep'
  created_at: string;
}
```

**Query de ejemplo:**
```sql
SELECT date_value, event_type, description, context, confidence_score
FROM cog_chronological_data
WHERE artifact_id = '<artifact_id>'
ORDER BY created_at DESC;
```

**Cálculo de tokens:**
```typescript
const { data: chronologicalData } = await supabase
    .from('cog_chronological_data')
    .select('date_value, event_type, description, context')
    .eq('artifact_id', artifactId);

let totalTokens = 0;
chronologicalData?.forEach(item => {
    const text = `${item.date_value || ''} ${item.event_type || ''} ${item.description || ''} ${item.context || ''}`;
    totalTokens += estimateTokens(text);
});
```

**Tipos de eventos:**
- `date`: Fecha específica mencionada
- `event`: Evento histórico o acontecimiento
- `period`: Período temporal (ej: "siglo XX", "década de los 90")
- `milestone`: Hito importante en una cronología

**Extracción:**
- **Ligera (`lightweight`)**: Desde transcripción completa via `/api/cognetica/lightweight-extraction`
- **Profunda (`deep`)**: Desde ensayo destilado (futuro)

**Archivo de procesamiento:** `/lib/actions/cognetica-lightweight-extraction-actions.ts`

---

## � Implementación de Referencia

### Función: `getArtifactTokens()`
**Archivo:** `/lib/actions/cognetica-gardens-actions.ts`

Esta función implementa correctamente la lógica de obtención de contenido para todos los tipos:

```typescript
// 1. TRANSCRIPCIÓN
if (artifact.type === 'pdf_slides') {
    // Caso especial: buscar en cog_artifact_pages
    const { data: pages } = await supabase
        .from('cog_artifact_pages')
        .select('markdown_original, page_number')
        .eq('artifact_id', artifactId)
        .order('page_number', { ascending: true });
    
    const fullContent = pages
        .map(p => p.markdown_original)
        .filter(Boolean)
        .join('\n\n');
} else {
    // Caso general: buscar en cog_transcriptions
    const { data: transcriptionData } = await supabase
        .from('cog_transcriptions')
        .select('full_text')
        .eq('artifact_id', artifactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
}

// 2. MICELIO
const chronicle = meta?.micelio_chronicle as Record<string, unknown>;
for (const [key, value] of Object.entries(chronicle)) {
    if (typeof value === 'string' && value.length > 0) {
        // Procesar cada parte
    }
}
```

---

## ⚠️ Errores Comunes

### ❌ Error 1: Buscar transcripción en `source_metadata`
**Incorrecto:**
```typescript
const transcription = artifact.source_metadata?.transcription;
```

**Correcto:**
```typescript
const { data } = await supabase
    .from('cog_transcriptions')
    .select('full_text')
    .eq('artifact_id', artifactId)
    .single();
```

### ❌ Error 2: No diferenciar `pdf_slides`
**Incorrecto:**
```typescript
// Tratar todos los PDFs igual
```

**Correcto:**
```typescript
if (artifact.type === 'pdf_slides') {
    // Buscar en cog_artifact_pages
} else if (artifact.type === 'pdf_report') {
    // Buscar en cog_transcriptions
}
```

### ❌ Error 3: Asumir solo 2 partes en micelio
**Incorrecto:**
```typescript
const destilada = chronicle.version_destilada;
const completa = chronicle.version_completa;
```

**Correcto:**
```typescript
for (const [key, value] of Object.entries(chronicle)) {
    if (typeof value === 'string' && value.length > 0) {
        // Procesar dinámicamente
    }
}
```

---

## 📝 Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-02-27 | Documento creado con todas las fuentes de datos identificadas |
| 2026-02-27 | Agregada lógica especial para `pdf_slides` en `cog_artifact_pages` |
| 2026-02-27 | Documentada iteración dinámica sobre `micelio_chronicle` |
| 2026-03-03 | Agregada sección de Datos Cronológicos (`cog_chronological_data`) |

---

## 🔗 Referencias

- **Procesamiento de artefactos:** `/lib/actions/cognetica-actions.ts`
- **Procesamiento de slides:** `/lib/actions/cognetica-presentation-actions.ts`
- **Cálculo de tokens:** `/lib/actions/cognetica-gardens-actions.ts` → `getArtifactTokens()`
- **Estimación de tokens:** `/lib/utils/token-estimator.ts`

---

**Última actualización:** 27 de febrero de 2026  
**Mantenedor:** Sistema Cognetica
