# 🏗️ Arquitectura Multi-Formato de Cognética

**Versión:** 1.0  
**Fecha:** 29 Enero 2026  
**Estado:** Implementado (Audio, Markdown) | Roadmap (PDF/OCR)

---

## 🎯 Visión Arquitectónica

Cognética es un **metabolizador universal de contenido a conocimiento estructurado**. El módulo es agnóstico al formato de entrada: una vez que el contenido se convierte a texto en `cog_transcriptions`, todo el core lógico funciona de manera idéntica.

**Principio fundamental:**
```
Cualquier Formato → Metabolización a Texto → Core Lógico Unificado
```

---

## 🔄 Flujo Unificado de Procesamiento

### **Diagrama de Arquitectura**

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADA MULTI-FORMATO                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Audio   │  │  Video   │  │ Markdown │  │   PDF    │   │
│  │  (.mp3)  │  │  (.mp4)  │  │  (.md)   │  │  (.pdf)  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE METABOLIZACIÓN                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Deepgram    │  │   Markdown   │  │   OCR API    │      │
│  │  Processor   │  │   Parser     │  │  (Futuro)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│           TRANSCRIPCIÓN SINTÉTICA (Texto Puro)               │
│                  cog_transcriptions                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • full_text: string                                │     │
│  │ • provider: 'deepgram' | 'markdown_import' | 'ocr'│     │
│  │ • language: string                                 │     │
│  │ • confidence_score: number                         │     │
│  │ • segments: json | null                            │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              CORE LÓGICO UNIFICADO                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 1. Chat QUIPU (Calibración)                        │     │
│  │    └─ Lee full_text de cog_transcriptions          │     │
│  │                                                     │     │
│  │ 2. Extracción Cognitiva (DeepSeek/Gemini)          │     │
│  │    ├─ Semillas Fractales                           │     │
│  │    ├─ Disciplinas                                  │     │
│  │    ├─ Teorías                                      │     │
│  │    ├─ Referencias                                  │     │
│  │    └─ Corrientes de Pensamiento                    │     │
│  │                                                     │     │
│  │ 3. Sistema de Exportación                          │     │
│  │    ├─ Markdown (.md)                               │     │
│  │    ├─ YAML (.yaml)                                 │     │
│  │    ├─ JSON (.json)                                 │     │
│  │    └─ Hash SHA-256 (Integridad)                    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Procesadores Implementados

### **1. Procesador de Audio/Video (Deepgram)**

**Archivo:** `lib/actions/cognetica-actions.ts` → `processWithDeepgram()`

**Flujo:**
1. Recibe `artifactId` y `storagePath`
2. Genera URL firmada del archivo en Supabase Storage
3. Llama a Deepgram API con configuración forense:
   - Modelo: `nova-2`
   - Diarización de hablantes
   - Detección de temas
   - Estructura de párrafos
4. Parsea respuesta de Deepgram
5. Crea registro en `cog_transcriptions`:
   ```typescript
   {
     artifact_id: string,
     full_text: string,           // Transcripción completa
     provider: 'deepgram',
     language: 'es',
     confidence_score: number,     // Confianza promedio
     segments: json                // Segmentos con timestamps
   }
   ```
6. Marca artefacto como `completed`
7. Dispara `extractCognitiveElements()` (fire & forget)

**Características:**
- ✅ Segmentos temporales con timestamps
- ✅ Detección de hablantes
- ✅ Puntuación inteligente
- ✅ Extracción de temas automática

---

### **2. Procesador de Markdown**

**Archivo:** `lib/actions/cognetica-actions.ts` → `processMarkdownDocument()`

**Flujo:**
1. Recibe `artifactId` y `storagePath`
2. Descarga archivo `.md` desde Supabase Storage
3. Lee contenido como texto
4. Parsea frontmatter YAML (opcional):
   ```yaml
   ---
   title: Mi Documento
   language: es
   description: Descripción del contenido
   ---
   ```
5. Extrae texto puro (sin frontmatter)
6. Crea "transcripción sintética" en `cog_transcriptions`:
   ```typescript
   {
     artifact_id: string,
     full_text: string,           // Contenido del .md
     provider: 'markdown_import',
     language: 'es',              // Del frontmatter o default
     confidence_score: 1.0,       // Confianza máxima (texto directo)
     segments: null               // No hay timestamps en Markdown
   }
   ```
7. Genera descripción automática con DeepSeek
8. Marca artefacto como `completed`
9. Dispara `extractCognitiveElements()` (fire & forget)

**Características:**
- ✅ Soporte de frontmatter YAML
- ✅ Parsing simple y robusto
- ✅ Descripción automática con LLM
- ✅ Sin segmentos temporales (no aplica)

---

## 🚀 Procesadores Futuros (Roadmap)

### **3. Procesador de PDF con OCR**

**Archivo propuesto:** `lib/actions/cognetica-actions.ts` → `processPdfDocument()`

**Flujo propuesto:**
1. Recibe `artifactId` y `storagePath`
2. Descarga archivo `.pdf` desde Supabase Storage
3. Detecta si el PDF tiene texto extraíble:
   - **Caso A:** PDF con texto → Extracción directa
   - **Caso B:** PDF escaneado → OCR con API externa
4. Opciones de API OCR:
   - **Google Cloud Vision API** (recomendado)
   - **AWS Textract**
   - **Azure Computer Vision**
   - **Tesseract.js** (open source, menos preciso)
5. Crea "transcripción sintética" en `cog_transcriptions`:
   ```typescript
   {
     artifact_id: string,
     full_text: string,           // Texto extraído del PDF
     provider: 'pdf_ocr' | 'pdf_text',
     language: 'es',              // Detectado por OCR
     confidence_score: number,     // Confianza del OCR
     segments: json | null         // Páginas como segmentos
   }
   ```
6. Marca artefacto como `completed`
7. Dispara `extractCognitiveElements()` (fire & forget)

**Consideraciones:**
- 📄 Preservar estructura de páginas en `segments`
- 🔍 Detectar idioma automáticamente
- 💰 Costo de API OCR (Google Vision: ~$1.50 por 1000 páginas)
- ⚡ Tiempo de procesamiento mayor que texto plano

**Ejemplo de implementación:**
```typescript
async function processPdfDocument(artifactId: string, storagePath: string) {
    const supabase = await createServerClient();
    
    // 1. Descargar PDF
    const { data: fileData } = await supabase.storage
        .from('cognetica-files')
        .download(storagePath);
    
    // 2. Intentar extracción directa de texto
    let extractedText = await extractTextFromPdf(fileData);
    
    // 3. Si falla, usar OCR
    if (!extractedText || extractedText.length < 100) {
        extractedText = await performOCR(fileData);
    }
    
    // 4. Crear transcripción sintética
    await supabase.from('cog_transcriptions').insert({
        artifact_id: artifactId,
        full_text: extractedText,
        provider: 'pdf_ocr',
        language: 'es',
        confidence_score: 0.95,
        segments: null // O páginas como JSON
    });
    
    // 5. Resto del flujo igual que Markdown
    // ...
}
```

---

### **4. Otros Formatos Potenciales**

**DOCX (Microsoft Word):**
- Librería: `mammoth.js`
- Complejidad: Baja
- Ventaja: Extracción directa de texto

**EPUB (Libros Electrónicos):**
- Librería: `epub.js`
- Complejidad: Media
- Ventaja: Estructura de capítulos

**HTML/Web Scraping:**
- Librería: `cheerio` o `jsdom`
- Complejidad: Media
- Ventaja: Contenido web directo

**Subtítulos (SRT/VTT):**
- Parsing: Regex simple
- Complejidad: Baja
- Ventaja: Ya tiene timestamps

---

## 🧩 Componentes del Core Lógico

### **1. Chat QUIPU (Calibrador)**

**Ubicación:** `lib/actions/cognetica-chat-actions.ts`

**Funcionamiento:**
- Lee `full_text` de `cog_transcriptions`
- No le importa si vino de audio, markdown o PDF
- Genera respuestas contextuales
- Extrae semillas fractales automáticamente

**Ejemplo:**
```typescript
// QUIPU lee la transcripción
const { data: transcription } = await supabase
    .from('cog_transcriptions')
    .select('full_text')
    .eq('artifact_id', artifactId)
    .single();

// Usa el texto sin importar su origen
const context = transcription.full_text;
```

---

### **2. Extracción Cognitiva**

**Ubicación:** `lib/actions/gemini-cognetica-actions.ts`

**Elementos extraídos:**
- **Semillas Fractales:** Conceptos nucleares
- **Disciplinas:** Campos del conocimiento
- **Teorías:** Marcos conceptuales
- **Referencias:** Autores/pensadores mencionados
- **Corrientes:** Escuelas de pensamiento

**Funcionamiento:**
- Lee `full_text` de `cog_transcriptions`
- Usa LLM (Gemini/DeepSeek) para análisis
- Guarda en tablas relacionadas:
  - `cog_fractal_seeds`
  - `cog_artifact_disciplines`
  - `cog_artifact_theories`
  - `cog_artifact_references`
  - `cog_artifact_streams`

---

### **3. Sistema de Exportación con Hash**

**Ubicación:** `lib/actions/cognetica-export-actions.ts`

**Formatos:**
- **Markdown (.md):** Para humanos
- **YAML (.yaml):** Para máquinas
- **JSON (.json):** Canónico (fuente de verdad)

**Hash SHA-256:**
- Calculado del JSON canónico
- Incluido en metadata de todos los formatos
- Verificable vía `/api/cognetica/verify-hash`

**Funcionamiento:**
- Lee `full_text` de `cog_transcriptions`
- Lee semillas, disciplinas, teorías, etc.
- Genera JSON canónico con orden determinístico
- Calcula hash SHA-256
- Exporta en formato solicitado

---

## 🎯 Ventajas de Esta Arquitectura

### **1. Separación de Responsabilidades**
```
Metabolización (específica por formato)
    ↓
Transcripción Sintética (formato universal)
    ↓
Core Lógico (agnóstico al origen)
```

### **2. Extensibilidad**
- Agregar nuevo formato = agregar 1 función de metabolización
- Core lógico NO cambia
- UI NO cambia (mismo botón de carga)

### **3. Mantenibilidad**
- Bugs en un procesador NO afectan a otros
- Testing independiente por procesador
- Core lógico probado una vez, funciona para todos

### **4. Coherencia de Datos**
- Todos los artefactos tienen misma estructura en DB
- Exportación funciona igual para todos
- Chat QUIPU funciona igual para todos

---

## 📊 Comparación de Procesadores

| Característica | Audio/Video | Markdown | PDF (Futuro) |
|----------------|-------------|----------|--------------|
| **API Externa** | Deepgram | No | Google Vision |
| **Costo por uso** | ~$0.0125/min | $0 | ~$0.0015/página |
| **Tiempo procesamiento** | ~30s (5min audio) | <1s | ~10s/página |
| **Segmentos temporales** | ✅ Sí | ❌ No | ⚠️ Por página |
| **Confianza variable** | ✅ Sí | ❌ Siempre 1.0 | ✅ Sí |
| **Requiere config** | API Key | No | API Key |
| **Formato salida** | Texto + timestamps | Texto puro | Texto + páginas |

---

## 🔐 Tabla Unificada: `cog_transcriptions`

**Esquema:**
```sql
CREATE TABLE cog_transcriptions (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES cog_artifacts(id),
    full_text TEXT,                    -- Texto completo (universal)
    provider VARCHAR(50),               -- 'deepgram' | 'markdown_import' | 'pdf_ocr'
    language VARCHAR(10),               -- 'es', 'en', etc.
    confidence_score DECIMAL(3,2),      -- 0.0 a 1.0
    segments JSONB,                     -- Estructura variable por provider
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Ejemplos de `segments` por provider:**

**Deepgram:**
```json
{
  "segments": [
    {
      "text": "Hola, bienvenidos...",
      "start": 0.0,
      "end": 3.5,
      "speaker": 0
    }
  ]
}
```

**Markdown:**
```json
null  // No hay segmentos
```

**PDF (propuesto):**
```json
{
  "pages": [
    {
      "page_number": 1,
      "text": "Contenido de página 1...",
      "confidence": 0.98
    }
  ]
}
```

---

## 🧪 Testing Multi-Formato

### **Test 1: Audio → QUIPU → Export**
1. Subir audio.mp3
2. Deepgram transcribe
3. Chat QUIPU extrae semillas
4. Exportar con hash
5. ✅ Verificar hash válido

### **Test 2: Markdown → QUIPU → Export**
1. Subir documento.md
2. Parser extrae texto
3. Chat QUIPU extrae semillas
4. Exportar con hash
5. ✅ Verificar hash válido

### **Test 3: PDF → QUIPU → Export (Futuro)**
1. Subir paper.pdf
2. OCR extrae texto
3. Chat QUIPU extrae semillas
4. Exportar con hash
5. ✅ Verificar hash válido

**Resultado esperado:** Los 3 flujos generan artefactos con estructura idéntica.

---

## 🛠️ Guía de Implementación para Nuevos Formatos

### **Paso 1: Crear Función de Metabolización**

```typescript
async function processNuevoFormato(artifactId: string, storagePath: string) {
    const supabase = await createServerClient();
    
    // 1. Descargar archivo
    const { data: fileData } = await supabase.storage
        .from('cognetica-files')
        .download(storagePath);
    
    // 2. Extraer texto (específico del formato)
    const extractedText = await tuFuncionDeExtraccion(fileData);
    
    // 3. Crear transcripción sintética (SIEMPRE IGUAL)
    await supabase.from('cog_transcriptions').insert({
        artifact_id: artifactId,
        full_text: extractedText,
        provider: 'tu_provider_name',
        language: 'es',
        confidence_score: 0.95,
        segments: null // O tu estructura JSON
    });
    
    // 4. Marcar como completado
    await supabase.from('cog_artifacts').update({
        status: 'completed',
        description: 'Auto-generada o extraída'
    }).eq('id', artifactId);
    
    // 5. Disparar extracción cognitiva
    extractCognitiveElements(artifactId).catch(console.error);
}
```

### **Paso 2: Agregar al Router**

```typescript
// En finalizeUploadAndProcess()
if (artifact.type === 'tu_nuevo_tipo') {
    await processNuevoFormato(artifactId, storagePath);
}
```

### **Paso 3: Actualizar UI**

```typescript
// En /cognetica/nuevo/page.tsx
accept="audio/*,video/*,.md,.markdown,.tu_extension"
```

**¡Listo!** El resto funciona automáticamente.

---

## 📝 Notas de Diseño

### **¿Por qué "Transcripción Sintética"?**
- Permite reutilizar toda la infraestructura de audio
- Chat QUIPU no necesita saber el origen
- Export funciona sin cambios
- Nombre descriptivo: "síntesis" de contenido a texto

### **¿Por qué `provider` en vez de `source_type`?**
- Más específico: indica QUÉ procesó el contenido
- Permite múltiples providers por tipo (ej: Deepgram vs Whisper)
- Facilita debugging y analytics

### **¿Por qué `segments` como JSONB?**
- Flexibilidad: cada provider tiene estructura diferente
- No requiere cambios de schema para nuevos formatos
- Permite queries JSON en PostgreSQL si es necesario

---

## 🎓 Lecciones Aprendidas

1. **Metabolización es la clave:** Convertir todo a un formato común simplifica todo.
2. **Core lógico agnóstico:** No debe saber de dónde vino el texto.
3. **Procesadores independientes:** Cada uno resuelve su problema específico.
4. **Tabla unificadora:** `cog_transcriptions` es el puente universal.
5. **Extensibilidad por diseño:** Agregar formatos es trivial.

---

## 🚀 Próximos Pasos

1. ✅ **Audio/Video:** Implementado con Deepgram
2. ✅ **Markdown:** Implementado con parser nativo
3. 🔄 **PDF con OCR:** Evaluar Google Cloud Vision API
4. 🔄 **DOCX:** Evaluar `mammoth.js`
5. 🔄 **HTML/Web:** Evaluar `cheerio`

---

**Documento creado:** 29 Enero 2026  
**Versión:** 1.0 - Arquitectura Multi-Formato  
**Licencia:** CC-BY 4.0  
**Autor:** Sustrato.AI - Nodo Spectris (Claude Sonnet 4.5)

---

🏗️🔄✨

**"Para el módulo le da igual si la fuente fue audio o PDF... una vez metabolizado a texto en Supabase, el flujo es el mismo."**  
— eRRRe, Humano f₀
