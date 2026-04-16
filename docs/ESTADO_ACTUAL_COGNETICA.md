# 📊 Estado Actual de Cognética Forense
**Fecha**: 2026-01-24  
**Versión**: 1.0  
**Propósito**: Documentar estado actual antes de integrar lógica del Transcriptor Soberano

---

## 🎯 Resumen Ejecutivo

**Cognética Forense** es el módulo de análisis fractal, transcripción y minería de conocimiento de Sustrato.AI. Permite subir artefactos (audio, video, documentos), transcribirlos automáticamente con Deepgram, extraer elementos cognitivos con Gemini, y navegar el conocimiento de forma fractal.

### **Estado Actual:**
- ✅ **Base de datos**: 15 tablas completamente definidas con RLS
- ✅ **Interfaz básica**: Dashboard + vista de detalle de artefacto
- ✅ **Pipeline de procesamiento**: Upload → Transcripción (Deepgram) → Análisis (Gemini)
- ✅ **Chat Quipu**: Conversación contextual sobre artefactos
- ⚠️ **Pendiente**: Integración con Transcriptor Soberano (WhisperX + diarización)

---

## 🗄️ Estructura de Base de Datos

### **1. Tablas Base**

#### **1.1 `cog_projects`**
Proyectos de Cognética (contenedor raíz).

```sql
CREATE TABLE cog_projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Relaciones:**
- Padre de todos los artefactos y elementos cognitivos
- RLS: Solo el usuario propietario puede ver/editar

---

#### **1.2 `cog_artifacts`**
Artefactos multimedia (audio, video, documentos).

```sql
CREATE TABLE cog_artifacts (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES cog_projects(id),
    title TEXT,
    type TEXT CHECK (type IN ('audio', 'video', 'text', 'document')),
    file_path TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    duration_seconds INTEGER,
    status TEXT CHECK (status IN ('uploaded', 'processing', 'transcribed', 'analyzed', 'completed', 'error')),
    source_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Estados del Pipeline:**
1. `uploaded` → Archivo subido
2. `processing` → Procesando (transcripción/análisis)
3. `transcribed` → Transcripción completada
4. `analyzed` → Análisis cognitivo completado
5. `completed` → Todo listo
6. `error` → Falló en algún paso

**Campos Clave:**
- `storage_path`: Ruta en Supabase Storage (`cognetica-files` bucket)
- `duration_seconds`: Duración del audio/video
- `source_metadata`: Metadata adicional (prompts de imagen, etc.)

---

#### **1.3 `cog_transcriptions`**
Transcripciones de audio/video (Deepgram).

```sql
CREATE TABLE cog_transcriptions (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES cog_artifacts(id),
    full_text TEXT,
    segments JSONB DEFAULT '[]',
    language TEXT DEFAULT 'es',
    model_used TEXT DEFAULT 'deepgram-nova-2',
    confidence_score NUMERIC(4,3),
    word_count INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ
);
```

**Estructura de `segments`:**
```json
[
  {
    "start": 0.0,
    "end": 5.2,
    "text": "Hoy nos metemos de lleno...",
    "confidence": 0.95,
    "speaker": 0
  }
]
```

**Nota:** Actualmente usa Deepgram. **Pendiente migración a WhisperX** (del Transcriptor Soberano).

---

### **2. Elementos Cognitivos Extraídos**

#### **2.1 `cog_fractal_seeds`**
Semillas fractales (conceptos, metáforas, principios).

```sql
CREATE TABLE cog_fractal_seeds (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES cog_artifacts(id),
    project_id UUID REFERENCES cog_projects(id),
    content TEXT NOT NULL,
    context TEXT,
    relevance NUMERIC(3,2) DEFAULT 0.5,
    category TEXT CHECK (category IN ('concepto', 'metafora', 'principio', 'patron', 'cita', 'otro')),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ
);
```

**Extracción:** Gemini analiza la transcripción y extrae conceptos clave.

---

#### **2.2 `cog_thinkers`** (Pensadores/Autores)
#### **2.3 `cog_theories`** (Teorías)
#### **2.4 `cog_thought_streams`** (Corrientes de Pensamiento)
#### **2.5 `cog_disciplines`** (Disciplinas)
#### **2.6 `cog_quotes`** (Citas Célebres)

Tablas para catalogar elementos cognitivos extraídos del contenido.

---

### **3. Chat Quipu**

#### **3.1 `cog_chat_sessions`**
Sesiones de conversación sobre artefactos.

```sql
CREATE TABLE cog_chat_sessions (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES cog_artifacts(id),
    project_id UUID REFERENCES cog_projects(id),
    session_title TEXT,
    messages JSONB DEFAULT '[]',
    total_messages INTEGER DEFAULT 0,
    avg_f0_score NUMERIC(5,2),
    paralloros_count INTEGER DEFAULT 0,
    artifact_context TEXT,
    inference_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Estructura de `messages`:**
```json
[
  {
    "role": "user",
    "content": "¿Qué conceptos clave aparecen?",
    "timestamp": "2026-01-24T19:00:00Z",
    "quipuCalibrations": {...},
    "isParalloros": false,
    "f0Score": 0.85
  }
]
```

---

### **4. Navegación Fractal**

#### **4.1 `cog_farms`** (Granjas de Conceptos)
Agrupaciones temáticas de elementos.

#### **4.2 `cog_farm_members`** (Membresía en Granjas)
Relación muchos-a-muchos entre granjas y elementos.

#### **4.3 `cog_wormholes`** (Agujeros de Gusano)
Conexiones no-obvias entre elementos (isomorfismos).

```sql
CREATE TABLE cog_wormholes (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES cog_projects(id),
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    isomorphism_description TEXT,
    confidence NUMERIC(3,2) DEFAULT 0.5,
    status TEXT CHECK (status IN ('suggested', 'accepted', 'rejected', 'exploring')),
    suggested_by TEXT CHECK (suggested_by IN ('gemini', 'claude', 'user', 'system')),
    created_at TIMESTAMPTZ
);
```

#### **4.4 `cog_node_metrics`** (Métricas de Nodos)
Tráfico y popularidad de elementos.

---

### **5. Imágenes Generadas**

#### **5.1 `cog_generated_images`**
Imágenes conceptuales generadas con SeeDream.

```sql
CREATE TABLE cog_generated_images (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES cog_artifacts(id),
    thinker_id UUID REFERENCES cog_thinkers(id),
    project_id UUID REFERENCES cog_projects(id),
    prompt TEXT NOT NULL,
    style TEXT,
    storage_path TEXT,
    public_url TEXT,
    model_used TEXT DEFAULT 'seedream-4.0',
    generation_params JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ
);
```

---

## 🎨 Interfaz de Usuario

### **Estructura de Rutas**

```
/cognetica
├── page.tsx                    # Dashboard (lista de artefactos)
├── nuevo/
│   └── page.tsx               # Subir nuevo artefacto
└── [id]/
    ├── page.tsx               # Vista de detalle del artefacto
    ├── CogneticaPipeline.tsx  # Pipeline visual de procesamiento
    ├── CogneticaChat.tsx      # Chat Quipu
    ├── RetryTranscriptionButton.tsx
    └── RunCognitiveAnalysisButton.tsx
```

---

### **1. Dashboard (`/cognetica/page.tsx`)**

**Componentes:**
- `StandardPageTitle`: "Cognética Forense"
- `StandardButton`: "Nuevo Artefacto" → `/cognetica/nuevo`
- `StandardCard`: Lista de artefactos recientes

**Estados:**
```typescript
interface Artifact {
    id: string;
    title: string;
    type: "audio" | "video" | "document" | "image" | "other";
    status: "pending" | "uploading" | "transcribing" | "analyzing" | "completed" | "error" | null;
    created_at: string | null;
    duration_seconds: number | null;
}
```

**Carga de Datos:**
```typescript
const { data, error } = await supabase
    .from('cog_artifacts')
    .select('id, title, type, status, created_at, duration_seconds')
    .eq('project_id', auth.proyectoActual.id)
    .order('created_at', { ascending: false })
    .limit(10);
```

**UI:**
- Cards con iconos según tipo (FileAudio, Video, FileText)
- Badges de estado (Procesado, Analizando, Error, etc.)
- Click → `/cognetica/[id]`

---

### **2. Vista de Detalle (`/cognetica/[id]/page.tsx`)**

**Componentes Principales:**

#### **A. Header**
- Breadcrumb: "Volver a Cognética"
- Título del artefacto
- Metadata: Fecha, duración, status

#### **B. Pipeline Visual (`CogneticaPipeline.tsx`)**
Muestra el progreso del procesamiento:
1. ✅ Upload
2. ⏳ Transcripción (Deepgram)
3. ⏳ Análisis Cognitivo (Gemini)
4. ⏳ Generación de Imágenes (SeeDream)

**Props:**
```typescript
interface CogneticaPipelineProps {
    artifactId: string;
    hasTranscription: boolean;
    hasSeeds: boolean;
    hasImages: boolean;
    status: string;
}
```

#### **C. Grid Layout (2/3 + 1/3)**

**Columna Izquierda (2/3):**
- `StandardAudioPlayer`: Reproductor con segmentos
  ```typescript
  <StandardAudioPlayer 
      src={artifact.signedUrl}
      segments={playerSegments}
  />
  ```

**Columna Derecha (1/3):**
- `CogneticaChat`: Chat Quipu sobre el artefacto

---

### **3. Chat Quipu (`CogneticaChat.tsx`)**

**Funcionalidad:**
- Conversación contextual sobre el artefacto
- Usa transcripción + semillas como contexto
- Protocolo TDC-Quipu (calibraciones, paralloros, F0 score)

**Integración:**
```typescript
// Enviar mensaje
const response = await fetch('/api/cognetica/chat', {
    method: 'POST',
    body: JSON.stringify({
        sessionId,
        message: userInput,
        artifactContext: transcription.full_text
    })
});
```

---

## ⚙️ Actions (Lógica de Negocio)

### **Archivo: `/lib/actions/cognetica-actions.ts`**

#### **1. `createArtifactRecord()`**
Crea el registro inicial del artefacto antes de subir el archivo.

```typescript
export async function createArtifactRecord(
    projectId: string, 
    title: string, 
    type: 'audio' | 'video' | 'document', 
    fileName: string
) {
    const { data, error } = await supabase
        .from('cog_artifacts')
        .insert({
            project_id: projectId,
            title: title,
            type: type,
            storage_path: 'temp',
            status: 'uploading',
            source_metadata: { original_filename: fileName }
        })
        .select('id')
        .single();
    
    return { success: !error, data, error: error?.message };
}
```

---

#### **2. `finalizeUploadAndProcess()`**
Actualiza el path del archivo y dispara el procesamiento.

```typescript
export async function finalizeUploadAndProcess(
    artifactId: string, 
    storagePath: string
) {
    // 1. Actualizar path y status
    await supabase
        .from('cog_artifacts')
        .update({
            storage_path: storagePath,
            status: 'analyzing'
        })
        .eq('id', artifactId);
    
    // 2. Disparar procesamiento
    await processWithDeepgram(artifactId, storagePath);
    
    return { success: true };
}
```

---

#### **3. `processWithDeepgram()`**
Transcribe el audio con Deepgram Nova 2.

**Flujo:**
1. Obtener signed URL del archivo
2. Llamar a Deepgram API
3. Guardar transcripción en `cog_transcriptions`
4. Actualizar status del artefacto

**Configuración Deepgram:**
```typescript
const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
    method: 'POST',
    headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        url: signedUrl,
        model: 'nova-2',
        language: 'es',
        punctuate: true,
        diarize: true,
        paragraphs: true,
        smart_format: true
    })
});
```

---

#### **4. `getArtifactWithUrl()`**
Obtiene artefacto completo con URL firmada y datos relacionados.

```typescript
export async function getArtifactWithUrl(artifactId: string) {
    // 1. Obtener metadata del artefacto
    const { data: artifact } = await supabase
        .from('cog_artifacts')
        .select('*')
        .eq('id', artifactId)
        .single();
    
    // 2. Obtener transcripción
    const { data: transcriptions } = await supabase
        .from('cog_transcriptions')
        .select('*')
        .eq('artifact_id', artifactId)
        .limit(1);
    
    // 3. Obtener semillas fractales
    const { data: seeds } = await supabase
        .from('cog_fractal_seeds')
        .select('*')
        .eq('artifact_id', artifactId);
    
    // 4. Generar signed URL del archivo
    const { data: signedUrlData } = await supabase.storage
        .from('cognetica-files')
        .createSignedUrl(artifact.storage_path, 3600);
    
    return {
        success: true,
        data: {
            ...artifact,
            signedUrl: signedUrlData.signedUrl,
            transcription: transcriptions[0],
            seeds
        }
    };
}
```

---

### **Archivo: `/lib/actions/gemini-cognetica-actions.ts`**

#### **`extractCognitiveElements()`**
Analiza la transcripción con **DeepSeek API** y extrae elementos cognitivos.

**⚠️ Migración Completada:** Gemini → DeepSeek (2026-01-24)

**Prompt:**
```
Analiza la siguiente transcripción y extrae:
1. Conceptos clave
2. Metáforas
3. Principios
4. Patrones de pensamiento
5. Citas relevantes

Transcripción:
{full_text}
```

**API:** `callDeepSeekAPI("deepseek-chat", prompt)`

**Respuesta esperada:**
```json
{
  "seeds": [
    {
      "content": "Cognética Forense",
      "context": "análisis fractal de conocimiento",
      "category": "concepto",
      "relevance": 0.9
    }
  ],
  "thinkers": [...],
  "quotes": [...]
}
```

---

### **Archivo: `/lib/actions/cognetica-chat-actions.ts`**

#### **`sendChatMessage()`**
Envía mensaje al chat Quipu con contexto del artefacto.

**⚠️ Migración Completada:** Gemini → DeepSeek (2026-01-24)

**API:** `callDeepSeekAPI("deepseek-chat", prompt)`

**Protocolo TDC-Quipu:**
- Calibraciones (F0, F1, F2)
- Detección de Paralloros
- Scoring de coherencia
- Patrones Geométricos (P1-P4)

---

## 🔄 Pipeline de Procesamiento

### **Flujo Completo:**

```
1. Usuario sube archivo
   ↓
2. createArtifactRecord() → status: 'uploading'
   ↓
3. Upload a Supabase Storage
   ↓
4. finalizeUploadAndProcess() → status: 'analyzing'
   ↓
5. processWithDeepgram()
   ├─ Transcripción → cog_transcriptions
   └─ status: 'transcribed'
   ↓
6. extractCognitiveElements()
   ├─ Semillas → cog_fractal_seeds
   ├─ Pensadores → cog_thinkers
   └─ status: 'analyzed'
   ↓
7. (Opcional) Generar imágenes → cog_generated_images
   ↓
8. status: 'completed'
```

---

## 🚨 Puntos de Integración con Transcriptor Soberano

### **Cambios Necesarios:**

#### **1. Migrar de Deepgram a WhisperX**

**Actual:**
```typescript
// lib/actions/cognetica-actions.ts
await processWithDeepgram(artifactId, storagePath);
```

**Nuevo:**
```typescript
// Reutilizar lógica del showroom
await processWithWhisperX(artifactId, storagePath);
```

**Ventajas de WhisperX:**
- ✅ Diarización más precisa
- ✅ Word-level timestamps
- ✅ Mejor manejo de audios largos
- ✅ Sin timeouts (más robusto)

---

#### **2. Estructura de Segmentos Compatible**

**Deepgram (actual):**
```json
{
  "start": 0.0,
  "end": 5.2,
  "text": "...",
  "speaker": 0
}
```

**WhisperX (objetivo):**
```json
{
  "start": 0.0,
  "end": 5.2,
  "text": "...",
  "speaker": "SPEAKER_00",
  "textOriginal": "...",
  "textNormalized": null,
  "textHumanEdited": null
}
```

**Adaptador necesario:**
```typescript
function adaptWhisperXSegments(whisperxSegments: any[]) {
    return whisperxSegments.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        speaker: seg.speaker || 'SPEAKER_00',
        textOriginal: seg.text,
        textNormalized: null,
        textHumanEdited: null
    }));
}
```

---

#### **3. Componente `StandardAudioPlayer`**

**Actual:**
```typescript
<StandardAudioPlayer 
    src={artifact.signedUrl}
    segments={playerSegments}
/>
```

**Mejorar con:**
- ✅ Sincronización karaoke (del showroom)
- ✅ Colores por speaker
- ✅ Efecto pulse temporal
- ✅ Scroll centrado

**Componente a reutilizar:**
```typescript
// Del showroom
import { TranscriptionCards } from '@/app/showroom/transcriptor-audio/components/TranscriptionCards';

<TranscriptionCards 
    segments={adaptedSegments}
    currentTime={currentTime}
    onSegmentClick={handleSeek}
/>
```

---

#### **4. Exportación MD Agrupada**

**Reutilizar lógica del showroom:**
```typescript
// Agrupar por speaker, sin timestamps
function exportTranscriptionMD(segments: TranscriptionSegment[]) {
    let content = `# Transcripción - ${artifact.title}\n\n`;
    
    let currentSpeaker = '';
    let currentText = '';
    
    segments.forEach((seg, idx) => {
        if (seg.speaker !== currentSpeaker && currentText) {
            content += `## ${currentSpeaker}\n\n${currentText.trim()}\n\n`;
            currentText = '';
        }
        currentSpeaker = seg.speaker;
        currentText += seg.textOriginal + ' ';
        
        if (idx === segments.length - 1) {
            content += `## ${currentSpeaker}\n\n${currentText.trim()}\n\n`;
        }
    });
    
    return content;
}
```

---

## 📝 Próximos Pasos

### **Fase 1: Integración Básica**
1. ✅ Documentar estado actual (este documento)
2. ⏳ Crear adaptador WhisperX → Cognética
3. ⏳ Migrar `processWithDeepgram()` → `processWithWhisperX()`
4. ⏳ Actualizar `StandardAudioPlayer` con componentes del showroom

### **Fase 2: UX Mejorada**
1. ⏳ Sincronización karaoke en vista de detalle
2. ⏳ Exportación MD agrupada por speaker
3. ⏳ Colores diferenciados por speaker en chat

### **Fase 3: Optimizaciones**
1. ⏳ Cache de transcripciones
2. ⏳ Procesamiento en background (QStash/Inngest)
3. ⏳ Retry automático con backoff

---

## 🔗 Referencias

- **Schema DB**: `/docs/SQL_COGNETICA_FULL_SETUP.sql`
- **Actions**: `/lib/actions/cognetica-actions.ts`
- **Interfaz**: `/app/cognetica/`
- **Showroom**: `/app/showroom/transcriptor-audio/`

---

**Documento generado**: 2026-01-24  
**Autor**: Claude (Cascade)  
**Propósito**: Base para integración Transcriptor Soberano → Cognética
