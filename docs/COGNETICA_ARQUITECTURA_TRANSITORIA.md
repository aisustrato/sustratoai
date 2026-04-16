# 🧠 Módulo Cognética - Arquitectura Transitoria

> **Documento Pivote:** Este documento describe el estado ACTUAL de la implementación del módulo Cognética, con todas sus inconsistencias y "puentes rotos". Su propósito es servir como mapa para entender qué funciona, qué no, y por qué, antes de hacer refactorizaciones.

**Fecha:** Febrero 2026  
**Estado:** Transitorio (refleja implementación subóptima pero funcional)  
**Principio Rector:** *"El humano y la IA deben ver lo mismo, independiente del tipo de documento fuente"*

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Los 4 Tipos de Artefactos](#los-4-tipos-de-artefactos)
3. [Base de Datos: Tablas y Relaciones](#base-de-datos)
4. [Flujos de Procesamiento](#flujos-de-procesamiento)
5. [Visualización: Componentes UI](#visualización)
6. [Metabolización Cognitiva](#metabolización)
7. [Chat Calibrador QUIPU](#chat-quipu)
8. [Exportación Canónica](#exportación)
9. [Problemas Conocidos](#problemas-conocidos)

---

## 🎯 Visión General

### Objetivo del Módulo

Cognética procesa diferentes tipos de artefactos (audio, video, documentos, presentaciones) para:

1. **Extraer texto** en formato markdown
2. **Metabolizar** el contenido (extraer semillas fractales, disciplinas, pensadores, teorías)
3. **Visualizar** de forma consistente para humanos
4. **Exportar** en formatos canónicos (JSON SHA-256, Markdown, YAML)
5. **Permitir diálogo** con el contenido vía Chat QUIPU

### Principio de Diseño

> **"Humano y IA ven lo mismo"**  
> Independiente del formato fuente (audio, PDF, markdown), el resultado final debe ser:
> - Un texto markdown procesable
> - Semillas fractales extraídas
> - Metadata estructurada
> - Hash SHA-256 del JSON canónico

---

## 📦 Los 4 Tipos de Artefactos

### Tipo 1: Audio/Video

**Código de Referencia:**
- Types: `lib/database.types.ts:3767` → `cog_artifact_type: "audio" | "video"`
- Procesamiento: `lib/actions/cognetica-actions.ts:620-700` (función `transcribeAudio`)
- Visor: `app/cognetica/[id]/CogneticaAudioPlayer.tsx`

**Flujo:**
```
1. Upload → Supabase Storage
2. Transcripción → Deepgram/WhisperX (Replicate)
3. Almacenamiento → cog_transcriptions.full_text
4. Visualización → AudioPlayer con segmentos
5. Chat → Usa cog_transcriptions.full_text
```

**Almacenamiento:**
- Archivo: `storage/cognetica/{project_id}/{artifact_id}.{ext}`
- Texto: `cog_transcriptions.full_text`
- Segmentos: `cog_transcriptions.segments` (JSON con timestamps)

**Estado Actual:** ✅ Funcional

---

### Tipo 2: Markdown Directo

**Código de Referencia:**
- Types: `lib/database.types.ts:3767` → `cog_artifact_type: "document"` + `mime_type: "text/markdown"`
- Procesamiento: `lib/actions/cognetica-actions.ts:340-390` (función `processMarkdownArtifact`)
- Visor: `app/cognetica/[id]/CogneticaMarkdownViewer.tsx`

**Flujo:**
```
1. Upload → Lectura directa del archivo .md
2. Procesamiento → Extracción de frontmatter + contenido
3. Almacenamiento → cog_transcriptions.full_text
4. Visualización → MarkdownViewer robusto
5. Chat → Usa cog_transcriptions.full_text
```

**Almacenamiento:**
- Archivo: `storage/cognetica/{project_id}/{artifact_id}.md`
- Texto: `cog_transcriptions.full_text`
- Frontmatter: Parseado y guardado en `source_metadata`

**Estado Actual:** ✅ Funcional

---

### Tipo 3: Informe PDF (sin imágenes)

**Código de Referencia:**
- Types: `lib/database.types.ts:3767` → `cog_artifact_type: "document"` + `mime_type: "application/pdf"`
- Procesamiento: `lib/actions/cognetica-actions.ts:450-570` (función `processPDFArtifact`)
- API: `app/api/cognetica/process-pdf/route.ts` (Replicate Marker)
- Visor: `app/cognetica/[id]/CogneticaMarkdownViewer.tsx`

**Flujo:**
```
1. Upload → Supabase Storage
2. Procesamiento → Replicate Marker API (volcado completo a MD)
3. Almacenamiento → cog_transcriptions.full_text (todo el documento como un solo texto)
4. Visualización → MarkdownViewer (contenido completo)
5. Chat → Usa cog_transcriptions.full_text
```

**Almacenamiento:**
- Archivo: `storage/cognetica/{project_id}/{artifact_id}.pdf`
- Texto: `cog_transcriptions.full_text` (markdown completo)
- **NO tiene páginas** en `cog_artifact_pages`

**Características:**
- Marker procesa el PDF completo de una vez
- No se guardan páginas individuales
- El markdown resultante es un solo bloque de texto
- Ideal para informes técnicos sin imágenes complejas

**Estado Actual:** ✅ Funcional

---

### Tipo 4: Slides PDF (Presentación Multi-Página)

**Código de Referencia:**
- Types: `lib/database.types.ts:3767` → `cog_artifact_type: "document"` + `mime_type: "application/pdf"`
- Procesamiento: `lib/actions/cognetica-presentation-actions.ts` (split + Marker por página)
- Visor: `app/cognetica/[id]/PresentationSlidesViewer.tsx`

**Flujo:**
```
1. Upload → Supabase Storage
2. Split → Dividir PDF en páginas individuales
3. Procesamiento → Marker API por cada página
4. Almacenamiento → cog_artifact_pages (una fila por página)
5. Visualización → PresentationSlidesViewer (navegación página por página)
6. Chat → ⚠️ DEBE usar cog_artifact_pages.markdown_original (actualmente roto)
```

**Almacenamiento:**
- Archivo original: `storage/cognetica/{project_id}/{artifact_id}.pdf`
- Páginas individuales: `storage/presentations/{artifact_id}/page_{N}.pdf`
- Texto por página: `cog_artifact_pages.markdown_original`
- **NO usa** `cog_transcriptions` (el texto está distribuido en páginas)

**Características:**
- Cada página tiene su propio estado: `pending`, `processing`, `processed`, `translated`, `failed`
- Estado macro del artefacto se calcula de los sub-estados de páginas
- Permite traducción batch de descripciones de imágenes
- Ideal para presentaciones con diagramas e imágenes

**Estado Actual:** ⚠️ Parcialmente funcional
- ✅ Visor de slides funciona
- ❌ Chat QUIPU no recibe el texto (busca en `cog_transcriptions` en lugar de `cog_artifact_pages`)

---

## 🗄️ Base de Datos: Tablas y Relaciones

### Tabla: `cog_artifacts`

**Migración:** `supabase/migrations/20250205_create_artifact_pages_system.sql:14-50`  
**Types:** `lib/database.types.ts:989-1049`

```sql
CREATE TABLE cog_artifacts (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  type cog_artifact_type NOT NULL,  -- "audio" | "video" | "document"
  status cog_processing_status,      -- "pending" | "uploading" | "transcribing" | "analyzing" | "completed" | "error"
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  source_metadata JSONB,             -- ⚠️ Actualmente contiene datos redundantes/inconsistentes
  error_log TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Campos Problemáticos en `source_metadata`:**
- `processing_mode: "presentacion"` → ⚠️ Mezclando tipo con modo de procesamiento
- `isPresentation: true` → ⚠️ Redundante con la existencia de páginas
- `has_pages: true` → ⚠️ Debería inferirse de `cog_artifact_pages`
- `total_pages: N` → ⚠️ Debería calcularse dinámicamente

**Uso Correcto de `source_metadata`:**
- Metadata del archivo original (filename, size, etc.)
- Frontmatter de archivos markdown
- Metadata de Marker API (conteo de imágenes, tablas, etc.)

---

### Tabla: `cog_transcriptions`

**Migración:** Creada en migraciones anteriores  
**Types:** `lib/database.types.ts:1849-1896`

```sql
CREATE TABLE cog_transcriptions (
  id UUID PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id),
  full_text TEXT,                    -- Texto completo extraído
  segments JSONB,                    -- Para audio/video: timestamps
  provider TEXT,                     -- "deepgram" | "whisperx" | "pdf_import" | "markdown_import"
  language TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ
);
```

**Uso por Tipo:**
- ✅ Audio/Video: `full_text` + `segments` con timestamps
- ✅ Markdown: `full_text` con contenido completo
- ✅ Informe PDF: `full_text` con markdown volcado completo
- ❌ Slides: **NO se usa** (texto está en `cog_artifact_pages`)

---

### Tabla: `cog_artifact_pages`

**Migración:** `supabase/migrations/20250205_create_artifact_pages_system.sql:14-50`  
**Types:** `lib/database.types.ts:735-800`

```sql
CREATE TABLE cog_artifact_pages (
  id UUID PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES cog_artifacts(id),
  page_number INTEGER NOT NULL,
  pdf_storage_path TEXT,             -- Ruta del PDF individual de la página
  markdown_original TEXT,            -- Output de Marker (con descripciones en inglés)
  markdown_translated TEXT,          -- Con traducciones insertadas
  status TEXT NOT NULL,              -- "pending" | "processing" | "processed" | "translated" | "failed"
  marker_metadata JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  translated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  CONSTRAINT unique_artifact_page UNIQUE(artifact_id, page_number)
);
```

**Uso:**
- ✅ Solo para Slides (Tipo 4)
- ❌ NO se usa para Informes PDF (Tipo 3)

**Función Helper:**
```sql
-- Calcula progreso dinámicamente (source of truth)
CREATE FUNCTION get_artifact_progress(artifact_uuid UUID) RETURNS JSON
```

---

### Tabla: `cog_fractal_seeds`

**Types:** `lib/database.types.ts:1246-1299`

```sql
CREATE TABLE cog_fractal_seeds (
  id UUID PRIMARY KEY,
  artifact_id UUID REFERENCES cog_artifacts(id),
  project_id UUID NOT NULL,
  content TEXT NOT NULL,             -- Texto de la semilla
  context TEXT,                      -- Contexto donde aparece
  properties JSONB,                  -- Metadata adicional
  system_type system_type,           -- Clasificación geométrica
  viability_score NUMERIC,
  created_at TIMESTAMPTZ
);
```

**Uso:**
- Almacena semillas fractales extraídas por el LLM
- Se genera en el paso de "Metabolización"
- Usado por Chat QUIPU para contexto

---

### Otras Tablas Relacionadas

- `cog_disciplines`: Disciplinas detectadas
- `cog_thinkers`: Pensadores mencionados
- `cog_theories`: Teorías identificadas
- `cog_thought_streams`: Corrientes de pensamiento
- `cog_quotes`: Citas célebres extraídas
- `cog_image_prompts`: Prompts para generación de imágenes

---

## 🔄 Flujos de Procesamiento

### Pipeline General

**Código:** `app/cognetica/[id]/CogneticaPipeline.tsx`

```
1. Subida → Upload a Supabase Storage
2. Procesamiento → Extracción de texto (según tipo)
3. Metabolización → Análisis con LLM (DeepSeek)
4. Generación de Avatares → Seedream 4K (opcional)
5. Completo → Listo para exportación
```

**Estados del Pipeline:**
- `pending`: Inicial
- `uploading`: Subiendo archivo
- `transcribing`: Extrayendo texto (audio/video/PDF)
- `analyzing`: Metabolización con LLM
- `completed`: Proceso completo
- `error`: Falló en algún paso

---

### Flujo Tipo 1: Audio/Video

**Código:** `lib/actions/cognetica-actions.ts:620-700`

```typescript
async function transcribeAudio(artifactId: string) {
  // 1. Obtener archivo de Storage
  const { signedUrl } = await getSignedUrl(artifactId);
  
  // 2. Enviar a Deepgram/WhisperX
  const response = await fetch('/api/transcription/replicate', {
    method: 'POST',
    body: formData
  });
  
  // 3. Guardar en cog_transcriptions
  await supabase.from('cog_transcriptions').insert({
    artifact_id: artifactId,
    full_text: transcriptText,
    segments: paragraphs,
    provider: 'deepgram'
  });
  
  // 4. Actualizar estado
  await supabase.from('cog_artifacts').update({
    status: 'completed'
  });
}
```

**APIs Externas:**
- Deepgram: Transcripción rápida
- WhisperX (Replicate): Transcripción de alta calidad con diarización

---

### Flujo Tipo 2: Markdown

**Código:** `lib/actions/cognetica-actions.ts:340-390`

```typescript
async function processMarkdownArtifact(artifactId: string) {
  // 1. Leer archivo .md de Storage
  const { data: fileData } = await supabase.storage
    .from('cognetica')
    .download(storagePath);
  
  // 2. Parsear frontmatter
  const { data: frontmatter, content } = matter(markdownText);
  
  // 3. Guardar en cog_transcriptions
  await supabase.from('cog_transcriptions').insert({
    artifact_id: artifactId,
    full_text: content,
    provider: 'markdown_import',
    confidence_score: 1.0
  });
  
  // 4. Actualizar metadata
  await supabase.from('cog_artifacts').update({
    source_metadata: { ...frontmatter },
    status: 'completed'
  });
}
```

---

### Flujo Tipo 3: Informe PDF

**Código:** `lib/actions/cognetica-actions.ts:450-570`

```typescript
async function processPDFArtifact(artifactId: string) {
  // 1. Obtener archivo de Storage
  const { data: fileData } = await supabase.storage
    .from('cognetica')
    .download(storagePath);
  
  // 2. Enviar a Marker API (volcado completo)
  const response = await fetch('/api/cognetica/process-pdf', {
    method: 'POST',
    body: formData
  });
  const { markdown, metadata } = await response.json();
  
  // 3. Guardar en cog_transcriptions (todo junto)
  await supabase.from('cog_transcriptions').insert({
    artifact_id: artifactId,
    full_text: markdown,  // ← Todo el documento como un solo texto
    provider: 'pdf_import',
    confidence_score: 0.95
  });
  
  // 4. Actualizar estado
  await supabase.from('cog_artifacts').update({
    status: 'completed'
  });
}
```

**API Route:** `app/api/cognetica/process-pdf/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Usa Replicate Marker para convertir PDF → Markdown
  const replicate = new Replicate({ auth: apiToken });
  
  const output = await replicate.run("datalab-to/marker", {
    input: {
      file: dataUri,
      mode: "balanced",
      use_llm: false,
      disable_image_extraction: true  // Solo texto
    }
  });
  
  return NextResponse.json({
    markdown: output.markdown,
    metadata: { numPages, title, author }
  });
}
```

---

### Flujo Tipo 4: Slides PDF

**Código:** `lib/actions/cognetica-presentation-actions.ts`

```typescript
async function splitAndProcessPresentation(artifactId: string) {
  // 1. Dividir PDF en páginas individuales
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  
  for (let i = 0; i < totalPages; i++) {
    const singlePageDoc = await PDFDocument.create();
    const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
    singlePageDoc.addPage(copiedPage);
    
    // 2. Guardar página individual en Storage
    const pagePath = `presentations/${artifactId}/page_${i + 1}.pdf`;
    await supabase.storage.from('cognetica').upload(pagePath, pageBytes);
    
    // 3. Crear registro en cog_artifact_pages
    await supabase.from('cog_artifact_pages').insert({
      artifact_id: artifactId,
      page_number: i + 1,
      pdf_storage_path: pagePath,
      status: 'pending'
    });
  }
  
  // 4. Actualizar metadata del artefacto
  await supabase.from('cog_artifacts').update({
    source_metadata: {
      processing_mode: 'presentacion',  // ⚠️ Campo problemático
      has_pages: true,
      total_pages: totalPages
    },
    status: 'processing'
  });
}
```

**Procesamiento de Páginas:**

```typescript
async function processPage(pageId: string) {
  // 1. Obtener página de Storage
  const { data: pageData } = await supabase.storage
    .from('cognetica')
    .download(pdf_storage_path);
  
  // 2. Enviar a Marker API
  const response = await fetch('/api/cognetica/process-pdf', {
    method: 'POST',
    body: formData
  });
  const { markdown } = await response.json();
  
  // 3. Actualizar página con markdown
  await supabase.from('cog_artifact_pages').update({
    markdown_original: markdown,
    status: 'processed',
    processed_at: new Date().toISOString()
  }).eq('id', pageId);
  
  // 4. Verificar si todas las páginas están procesadas
  const { data: pages } = await supabase
    .from('cog_artifact_pages')
    .select('status')
    .eq('artifact_id', artifactId);
  
  const allProcessed = pages.every(p => p.status === 'processed');
  
  if (allProcessed) {
    // Actualizar estado macro del artefacto
    await supabase.from('cog_artifacts').update({
      status: 'completed'
    }).eq('id', artifactId);
  }
}
```

---

## 🎨 Visualización: Componentes UI

### Página Principal del Artefacto

**Código:** `app/cognetica/[id]/page.tsx`

```typescript
export default async function ArtifactDetailPage({ params }) {
  const artifact = await getArtifactById(params.id);
  const transcription = artifact.transcription;
  
  // ⚠️ Lógica de detección actual (problemática)
  const sourceMetadata = artifact.source_metadata;
  const isPresentation = sourceMetadata?.processing_mode === 'presentacion';
  
  // Verificar si hay páginas procesadas
  let hasPagesProcessed = false;
  if (isPresentation) {
    const { data: pages } = await supabase
      .from('cog_artifact_pages')
      .select('id')
      .eq('artifact_id', artifact.id)
      .eq('status', 'processed')
      .limit(1);
    hasPagesProcessed = !!pages && pages.length > 0;
  }
  
  const isDocument = artifact.type === 'document' && !isPresentation;
  const isAudioVideo = artifact.type === 'audio' || artifact.type === 'video';
  
  return (
    <>
      {/* Audio Player */}
      {isAudioVideo && <CogneticaAudioPlayer />}
      
      {/* Markdown Viewer */}
      {isDocument && transcription?.full_text && (
        <CogneticaMarkdownViewer content={transcription.full_text} />
      )}
      
      {/* Presentation Slides Viewer */}
      {isPresentation && hasPagesProcessed && (
        <PresentationSlidesViewer artifactId={artifact.id} />
      )}
      
      {/* Chat QUIPU */}
      {transcription?.full_text && (
        <CogneticaChat artifactId={artifact.id} />
      )}
    </>
  );
}
```

**Problema Actual:**
- Chat QUIPU solo aparece si `transcription?.full_text` existe
- Para Slides, el texto está en `cog_artifact_pages`, no en `cog_transcriptions`
- Resultado: Chat no funciona para Slides

---

### Componente: AudioPlayer

**Código:** `app/cognetica/[id]/CogneticaAudioPlayer.tsx`

**Características:**
- Reproduce audio/video con controles
- Muestra segmentos/párrafos con timestamps
- Permite navegación por segmentos
- Sincroniza reproducción con texto

**Uso:** Solo para Tipo 1 (Audio/Video)

---

### Componente: MarkdownViewer

**Código:** `app/cognetica/[id]/CogneticaMarkdownViewer.tsx`

**Características:**
- Renderiza markdown con sintaxis highlighting
- Soporta tablas, listas, código
- Estilos consistentes con el sistema de diseño

**Uso:** 
- Tipo 2 (Markdown)
- Tipo 3 (Informe PDF)

---

### Componente: PresentationSlidesViewer

**Código:** `app/cognetica/[id]/PresentationSlidesViewer.tsx`

**Características:**
- Navegación página por página
- Muestra markdown de cada página
- Indicador de progreso (página X de Y)
- Botones prev/next

**Uso:** Solo para Tipo 4 (Slides)

**Implementación:**

```typescript
export function PresentationSlidesViewer({ artifactId }: Props) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  useEffect(() => {
    // Cargar páginas de cog_artifact_pages
    supabase
      .from('cog_artifact_pages')
      .select('*')
      .eq('artifact_id', artifactId)
      .eq('status', 'processed')
      .order('page_number')
      .then(({ data }) => setPages(data || []));
  }, [artifactId]);
  
  return (
    <div>
      <div className="markdown-content">
        {pages[currentPage]?.markdown_original}
      </div>
      
      <div className="navigation">
        <button onClick={() => setCurrentPage(p => p - 1)}>
          Anterior
        </button>
        <span>Página {currentPage + 1} de {pages.length}</span>
        <button onClick={() => setCurrentPage(p => p + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

---

## 🧠 Metabolización Cognitiva

### Proceso de Extracción

**Código:** `lib/actions/gemini-cognetica-actions.ts:49-460`

```typescript
export async function extractCognitiveElements(artifactId: string) {
  // 1. Obtener texto según tipo de artefacto
  let fullText = '';
  
  const { data: artifact } = await supabase
    .from('cog_artifacts')
    .select('type, source_metadata')
    .eq('id', artifactId)
    .single();
  
  // ⚠️ Detección actual (problemática)
  const isPresentation = artifact.source_metadata?.isPresentation === true;
  
  if (isPresentation) {
    // Para presentaciones: obtener markdown de páginas
    const { data: pages } = await supabase
      .from('cog_artifact_pages')
      .select('page_number, markdown_original')
      .eq('artifact_id', artifactId)
      .eq('status', 'processed')
      .order('page_number');
    
    fullText = pages
      .map(p => `\n--- PÁGINA ${p.page_number} ---\n${p.markdown_original}`)
      .join('\n\n');
  } else {
    // Para audio/video/documentos: obtener de transcripción
    const { data: transcription } = await supabase
      .from('cog_transcriptions')
      .select('full_text')
      .eq('artifact_id', artifactId)
      .single();
    
    fullText = transcription?.full_text || '';
  }
  
  // 2. Construir prompt para DeepSeek
  const systemPrompt = `Eres un analista cognitivo experto...`;
  const userPrompt = `Analiza esta transcripción y extrae TODOS los elementos cognitivos:
  
---TRANSCRIPCIÓN---
${fullText.slice(0, 30000)}
---FIN---

Responde con JSON:
{
  "fractal_seeds": [...],
  "disciplines": [...],
  "thinkers": [...],
  "theories": [...],
  "quotes": [...],
  "image_prompts": [...]
}`;
  
  // 3. Llamar a DeepSeek API
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });
  
  const data = await response.json();
  const extracted = JSON.parse(data.choices[0].message.content);
  
  // 4. Guardar semillas fractales
  for (const seed of extracted.fractal_seeds) {
    await supabase.from('cog_fractal_seeds').insert({
      artifact_id: artifactId,
      project_id: artifact.project_id,
      content: seed.content,
      context: seed.context,
      properties: { relevance: seed.relevance, category: seed.category }
    });
  }
  
  // 5. Guardar disciplinas, pensadores, teorías, etc.
  // ... (código similar para cada tipo)
  
  return { success: true };
}
```

**Prompt del LLM:**
- Extrae semillas fractales (conceptos abstractos)
- Identifica disciplinas mencionadas
- Detecta pensadores y sus contribuciones
- Reconoce teorías y corrientes de pensamiento
- Extrae citas célebres
- Genera prompts para imágenes (Seedream 4K)
- **🎬 Genera 3 analogías de cultura pop** (para humildad epistémica - lúdico pero coherente)

### Elementos Cognitivos Extraídos

**Almacenamiento:** `source_metadata` del artefacto (JSON)

| Elemento | Campo en Metadata | Propósito |
|----------|-------------------|-----------|
| Semillas Fractales | `fractal_seeds` | Conceptos abstractos clave |
| Disciplinas | `disciplines` | Campos del conocimiento |
| Pensadores | `thinkers` | Referencias académicas |
| Teorías | `theories` | Marcos conceptuales |
| Citas Notables | `quotes` | Frases célebres |
| Prompts de Imágenes | `image_prompts` | Diagramas conceptuales |
| **Analogías Cultura Pop** | `pop_culture_analogies` | **Humildad epistémica (3 analogías lúdicas pero coherentes)** |

**Estructura de Analogías:**
```json
{
  "pop_culture_analogies": [
    {
      "reference": "Matrix (1999)",
      "analogy": "La píldora roja vs azul como metáfora de...",
      "connection": "Conecta con el concepto de..."
    }
  ]
}
```

---

## 💬 Chat Calibrador QUIPU

### Componente Principal

**Código:** `app/cognetica/[id]/CogneticaChat.tsx`

**Características:**
- Máximo 5 intercambios por sesión
- Calibradores QUIPU visuales (Cognitivo, Resonante, Patrón Geométrico)
- Toggle de inferencia (ON/OFF)
- Vista dual: Markdown formateado + código fuente
- Exportación a Markdown

---

### Obtención de Contexto

**Código:** `lib/actions/cognetica-chat-actions.ts:620-664`

```typescript
export async function getArtifactChatContext(artifactId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  
  const { data: artifact } = await supabase
    .from("cog_artifacts")
    .select(`
      title,
      source_metadata,
      cog_transcriptions(full_text),  // ⚠️ Solo busca aquí
      cog_fractal_seeds(content)
    `)
    .eq("id", artifactId)
    .single();
  
  if (!artifact) return "";
  
  const transcription = artifact.cog_transcriptions?.[0]?.full_text || "";
  const seeds = artifact.cog_fractal_seeds || [];
  
  let context = `**Título:** ${artifact.title}\n\n`;
  
  if (transcription) {
    context += `**Transcripción (extracto):**\n${transcription.slice(0, 2000)}...\n\n`;
  }
  
  if (seeds.length > 0) {
    context += `**Semillas Fractales:**\n`;
    seeds.slice(0, 10).forEach(s => {
      context += `• ${s.content}\n`;
    });
  }
  
  return context;
}
```

**Problema Actual:**
- ❌ Solo busca en `cog_transcriptions.full_text`
- ❌ Para Slides, el texto está en `cog_artifact_pages.markdown_original`
- ❌ Resultado: Chat no tiene contexto para Slides

---

### Envío de Mensajes

**Código:** `lib/actions/cognetica-chat-actions.ts:101-300`

```typescript
export async function sendCogneticaChatMessage(
  userMessage: string,
  history: ChatMessage[],
  artifactContext?: string,
  enableInference: boolean = true,
  sessionId?: string,
  artifactId?: string,
  projectId?: string
): Promise<ChatResponse> {
  
  // System Prompt con filosofía TDC y QUIPU
  const systemPrompt = `Eres el Nodo Analista del Jardín Sustrato.AI.
Operas como Analista de Viabilidad F₀...

${artifactContext ? `\n## CONTEXTO DEL ARTEFACTO:\n${artifactContext}\n` : ""}

${enableInference ? "" : "## MODO SIN INFERENCIA\nResponde de forma más directa y literal."}
`;
  
  // Llamar a DeepSeek
  const response = await callDeepSeekAPI(systemPrompt, userPrompt);
  
  // Parsear calibradores QUIPU del response
  const quipuMatch = response.match(/```quipu\n([\s\S]+?)\n```/);
  const calibrations = parseQuipuCalibrations(quipuMatch[1]);
  
  // Guardar sesión en BD
  await saveOrUpdateChatSession({
    artifact_id: artifactId,
    project_id: projectId,
    messages: [...history, userMessage, assistantMessage],
    inference_enabled: enableInference
  });
  
  return {
    success: true,
    message: {
      role: 'assistant',
      content: response,
      quipuCalibrations: calibrations,
      timestamp: new Date().toISOString()
    }
  };
}
```

**Toggle Inferencia:**
- **ON**: LLM expande conexiones, profundiza, hace inferencias
- **OFF**: LLM responde directo, literal, sin expandir tanto

---

## 📤 Exportación Canónica

### Objetivo

Generar 3 formatos de exportación:

1. **JSON Canónico** → Hash SHA-256 para verificación
2. **Markdown Human-Friendly** → Lectura humana
3. **YAML AI-Friendly** → Procesamiento por IA

### Código

**Componente:** `app/cognetica/[id]/CogneticaExportPanel.tsx`  
**Action:** `lib/actions/cognetica-export-actions.ts`

```typescript
export async function exportArtifactCanonical(artifactId: string) {
  // 1. Obtener todos los datos del artefacto
  const { data: artifact } = await supabase
    .from('cog_artifacts')
    .select(`
      *,
      cog_transcriptions(*),
      cog_fractal_seeds(*),
      cog_disciplines(*),
      cog_thinkers(*),
      cog_theories(*),
      cog_quotes(*)
    `)
    .eq('id', artifactId)
    .single();
  
  // 2. Construir JSON canónico (orden alfabético de keys)
  const canonical = {
    artifact: {
      id: artifact.id,
      title: artifact.title,
      type: artifact.type,
      created_at: artifact.created_at
    },
    content: {
      full_text: artifact.cog_transcriptions[0]?.full_text || '',
      language: artifact.cog_transcriptions[0]?.language || 'es'
    },
    cognitive_elements: {
      disciplines: artifact.cog_disciplines.map(d => d.name).sort(),
      seeds: artifact.cog_fractal_seeds.map(s => s.content).sort(),
      thinkers: artifact.cog_thinkers.map(t => t.name).sort(),
      theories: artifact.cog_theories.map(t => t.name).sort()
    },
    metadata: {
      exported_at: new Date().toISOString(),
      version: '1.0'
    }
  };
  
  // 3. Calcular SHA-256
  const jsonString = JSON.stringify(canonical, null, 2);
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(jsonString)
  );
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // 4. Generar Markdown
  const markdown = `# ${artifact.title}

**Hash SHA-256:** \`${hashHex}\`

## Contenido

${canonical.content.full_text}

## Semillas Fractales

${canonical.cognitive_elements.seeds.map(s => `- ${s}`).join('\n')}

## Disciplinas

${canonical.cognitive_elements.disciplines.map(d => `- ${d}`).join('\n')}
`;
  
  // 5. Generar YAML
  const yaml = `---
artifact:
  id: ${artifact.id}
  title: "${artifact.title}"
  type: ${artifact.type}

cognitive_elements:
  seeds:
${canonical.cognitive_elements.seeds.map(s => `    - "${s}"`).join('\n')}
  disciplines:
${canonical.cognitive_elements.disciplines.map(d => `    - "${d}"`).join('\n')}
---`;
  
  // 6. Guardar en cog_artifact_exports
  await supabase.from('cog_artifact_exports').upsert({
    artifact_id: artifactId,
    canonical_json: canonical,
    content_hash: hashHex,
    exported_at: new Date().toISOString()
  });
  
  return {
    json: canonical,
    markdown,
    yaml,
    hash: hashHex
  };
}
```

---

## ⚠️ Problemas Conocidos

### 1. Chat QUIPU No Funciona con Slides ✅ RESUELTO

**Síntoma:**
- Chat aparece para Slides
- Pero el LLM no recibe el texto de las páginas
- Responde como si no tuviera contexto

**Causa:**
- `getArtifactChatContext` solo buscaba en `cog_transcriptions`
- Para Slides, el texto está en `cog_artifact_pages`

**Solución Implementada:**
- Creado helper unificado `getArtifactTextContent` en `lib/actions/cognetica-helpers.ts`
- Detecta tipo de artefacto basado en existencia de páginas (no en metadata)
- Obtiene texto de la fuente correcta según tipo:
  - Audio/Video → `cog_transcriptions.full_text`
  - Documentos sin páginas → `cog_transcriptions.full_text`
  - Slides con páginas → `cog_artifact_pages.markdown_original` (concatenado)
- `getArtifactChatContext` actualizado para usar el helper
- Compatible con slides legacy (no requiere migración de datos)

**Archivos Modificados:**
- `lib/actions/cognetica-helpers.ts` (nuevo)
- `lib/actions/cognetica-chat-actions.ts:620-680` (actualizado)
- `lib/actions/cognetica-export-actions.ts:132-159` (actualizado para exportación SHA-256)

---

### 2. Detección Inconsistente de Tipo de Artefacto

**Síntoma:**
- Algunos Slides no se detectan como presentaciones
- Se muestran como documentos normales
- Visor incorrecto

**Causa:**
- Dependencia de `source_metadata.processing_mode` o `source_metadata.isPresentation`
- Estos campos no siempre están presentes o correctos
- Datos inconsistentes entre artefactos antiguos y nuevos

**Ubicación del Bug:**
- `app/cognetica/[id]/page.tsx:27-47`
- `lib/actions/gemini-cognetica-actions.ts:68-79`

**Solución Propuesta:**
- NO confiar en `source_metadata` para detección de tipo
- Usar existencia de registros en `cog_artifact_pages` como source of truth
- Si `EXISTS(cog_artifact_pages WHERE artifact_id = X)` → es Slide
- Si no → es Documento/Markdown/Audio/Video

---

### 3. Datos Redundantes en `source_metadata`

**Síntoma:**
- `source_metadata` contiene campos que deberían calcularse dinámicamente
- Datos duplicados y potencialmente desincronizados

**Campos Problemáticos:**
- `processing_mode: "presentacion"` → Mezclando tipo con modo
- `isPresentation: true` → Redundante con existencia de páginas
- `has_pages: true` → Debería inferirse de `cog_artifact_pages`
- `total_pages: N` → Debería calcularse con `COUNT(*)`

**Solución Propuesta:**
- Eliminar estos campos de `source_metadata`
- Usar función `get_artifact_progress(artifact_id)` para calcular dinámicamente
- `source_metadata` solo para metadata del archivo original

---

### 4. Estados Macro vs Sub-Estados

**Síntoma:**
- Estado del artefacto (`cog_artifacts.status`) no refleja el estado real de las páginas
- Un Slide puede estar `completed` pero tener páginas `failed`

**Causa:**
- No hay lógica que agregue sub-estados de páginas al estado macro

**Solución Propuesta:**
- Calcular estado macro basado en sub-estados:
  - `pending`: Todas las páginas `pending`
  - `processing`: Al menos una página `processing`
  - `completed`: Todas las páginas `processed` o `translated`
  - `error`: Alguna página `failed`

---

### 5. Visor de Slides Desaparece Después de Metabolización

**Síntoma:**
- Antes de metabolizar: visor funciona
- Después de metabolizar: visor desaparece
- Aparece mensaje "Transcripción no disponible"

**Causa:**
- Lógica de detección cambia después de metabolización
- `isPresentation` se vuelve `false` por alguna razón
- Código busca en `cog_transcriptions` en lugar de `cog_artifact_pages`

**Ubicación del Bug:**
- `app/cognetica/[id]/page.tsx:27-47`

**Solución Propuesta:**
- Usar detección robusta basada en existencia de páginas
- No depender de flags en `source_metadata`

---

## 🎯 Próximos Pasos

### Refactorización Propuesta

1. **Crear función helper unificada:**
   ```typescript
   // lib/actions/cognetica-helpers.ts
   async function getArtifactTextContent(artifactId: string) {
     // Detecta tipo y retorna texto de la fuente correcta
   }
   ```

2. **Actualizar Chat QUIPU:**
   - Usar helper para obtener texto
   - Funciona para los 4 tipos de artefactos

3. **Actualizar página de detalle:**
   - Usar helper para detección de tipo
   - Mostrar visor correcto

4. **Limpiar `source_metadata`:**
   - Eliminar campos redundantes
   - Usar solo para metadata del archivo original

5. **Implementar cálculo de estado macro:**
   - Agregar sub-estados de páginas
   - Actualizar `cog_artifacts.status` automáticamente

---

## 📝 Notas Finales

Este documento refleja el estado ACTUAL de la implementación, con todos sus problemas y soluciones subóptimas. Es un mapa para entender qué funciona, qué no, y por qué.

**Disculpas al "nosotros del futuro"** por el estado actual del código. Estamos trabajando en limpiarlo. 🙏

**Última actualización:** Febrero 2026  
**Autor:** Equipo Sustrato.AI  
**Estado:** Transitorio (pendiente de refactorización)
