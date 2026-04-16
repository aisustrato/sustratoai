# 🧠 Arquitectura de Cognética: Artefactos y Jardines de Resonancia

## 📋 Propósito de este Documento

Este documento define la estructura de datos de Cognética para establecer un lenguaje común entre todos los componentes del sistema. Es fundamental entender esta arquitectura antes de trabajar con jardines y artefactos.

---

## 🎯 Concepto Central: El Artefacto

Un **artefacto** es la unidad fundamental de conocimiento en Cognética. Representa cualquier pieza de contenido que el investigador sube al sistema para análisis.

### Tipos de Artefactos

Según `cognetica-helpers.ts`, los artefactos se clasifican por su `type`:

| Tipo | Descripción | Fuente de Texto | Tabla BD |
|------|-------------|-----------------|----------|
| `audio` | Archivo de audio | Transcripción | `cog_transcriptions.full_text` |
| `video` | Archivo de video | Transcripción | `cog_transcriptions.full_text` |
| `pdf_report` | PDF de documento/reporte | Transcripción (OCR/extracción) | `cog_transcriptions.full_text` |
| `pdf_slides` | PDF de presentación | Páginas individuales en markdown | `cog_artifact_pages.markdown_original` |
| `markdown` | Documento markdown | Texto directo | `cog_transcriptions.full_text` |
| `chat` | Sesión de chat QUIPU | Mensajes concatenados | `cog_chat_sessions.messages` |
| `document` | Documento legacy | Páginas o transcripción | `cog_artifact_pages` o `cog_transcriptions` |
| `image` | Imagen | Sin texto extraíble | N/A |

### Estructura de un Artefacto

```typescript
interface CogArtifact {
  id: string;              // UUID único
  project_id: string;      // Proyecto al que pertenece
  title: string;           // Título del artefacto
  type: string;            // Tipo (ver tabla arriba)
  description?: string;    // Descripción opcional
  mime_type?: string;      // Tipo MIME del archivo
  status: string | null;   // Estado de procesamiento
  created_at: string;      // Fecha de creación
  source_metadata?: any;   // Metadata adicional (incluyendo micelio_chronicle)
}
```

### Contenido Textual de Artefactos

**Principio clave:** "El humano y la IA ven lo mismo"

La función `getArtifactTextContent(artifactId)` retorna:

```typescript
interface ArtifactTextContent {
  text: string;                              // Texto completo del artefacto
  source: 'transcription' | 'pages' | 'none'; // De dónde viene el texto
  category: 'audio_video' | 'document' | 'slides'; // Categoría general
  pageCount?: number;                        // Número de páginas (si aplica)
  artifactType: string;                      // Tipo original del artefacto
}
```

---

## 🌱 Elementos Cognitivos

Los artefactos se analizan para extraer **elementos cognitivos**. Estos son conceptos, personas, disciplinas y teorías mencionadas en el contenido.

### Tipos de Elementos

```typescript
type GardenElementType = 'seed' | 'discipline' | 'theory' | 'thinker';
```

| Tipo | Descripción | Emoji | Ejemplo |
|------|-------------|-------|---------|
| `seed` | Semilla fractal (concepto/idea clave) | 🌱 | "Terra Preta", "Compostaje digital" |
| `discipline` | Disciplina académica | 🔬 | "Antropología", "Ciencias de la Computación" |
| `theory` | Teoría o marco conceptual | 💡 | "Teoría de Sistemas", "Actor-Red" |
| `thinker` | Pensador/autor citado | 👤 | "Bruno Latour", "Donna Haraway" |

### Estructura de un Elemento

```typescript
interface GardenElement {
  id: string;                    // UUID único
  garden_id: string;             // Jardín al que pertenece
  element_type: GardenElementType; // Tipo de elemento
  element_id: string | null;     // ID en tabla específica (ej: cog_disciplines.id)
  element_content: string | null; // Contenido directo (para seeds)
  element_label: string;         // Etiqueta/nombre del elemento
  added_at: string;              // Fecha de agregado
}
```

**Nota importante:**
- **Seeds**: Usan `element_content` (texto libre) y NO tienen `element_id`
- **Disciplines/Theories/Thinkers**: Usan `element_id` (referencia a tabla) y NO tienen `element_content`

---

## 🌺 Jardines de Resonancia

Un **jardín** es un **contenedor conceptual** que agrupa elementos cognitivos relacionados. Es una forma de organizar el conocimiento temáticamente.

### Concepto Clave

**Un jardín NO contiene artefactos directamente.**

En su lugar:
1. El jardín contiene **elementos cognitivos** (seeds, disciplines, theories, thinkers)
2. El sistema busca **qué artefactos contienen esos elementos**
3. Esos artefactos se consideran "resonantes" con el jardín

### Estructura de un Jardín

```typescript
interface ResonanceGarden {
  id: string;                  // UUID único
  project_id: string;          // Proyecto al que pertenece
  created_by: string;          // Usuario creador
  name: string;                // Nombre del jardín
  description: string | null;  // Descripción opcional
  emoji: string;               // Emoji identificador
  created_at: string;          // Fecha de creación
  updated_at: string;          // Última actualización
  elements?: GardenElement[];  // Elementos del jardín
  artifacts_count?: number;    // Cantidad de artefactos resonantes
}
```

### Artefactos Resonantes

```typescript
interface GardenArtifact {
  id: string;                  // UUID del artefacto
  title: string;               // Título del artefacto
  type: string;                // Tipo de artefacto
  status: string | null;       // Estado
  created_at: string | null;   // Fecha de creación
  has_chronicle: boolean;      // ¿Tiene crónica de Micelio?
  has_chat: boolean;           // ¿Tiene sesión de chat?
  micelio_destilada?: string;  // Versión destilada de Micelio
  matched_elements: string[];  // Elementos que matchearon
  relevance_score: number;     // Score de relevancia (0-1)
}
```

**Cómo se calculan los artefactos resonantes:**

La función `getArtifactsForGarden(gardenId, projectId)`:

1. Obtiene todos los elementos del jardín
2. Para cada tipo de elemento:
   - **Seeds**: Busca en `cog_fractal_seeds` qué artefactos contienen ese contenido
   - **Disciplines**: Busca en `cog_artifact_disciplines` qué artefactos están asociados
   - **Theories**: Busca en `cog_artifact_theories` qué artefactos están asociados
   - **Thinkers**: Busca en `cog_artifact_references` qué artefactos citan a ese pensador
3. Agrega todos los artefactos encontrados (sin duplicados)
4. Calcula `relevance_score` = (elementos matcheados) / (total elementos del jardín)
5. Ordena por relevancia descendente

---

## 🔄 Relación entre Artefactos y Jardines

```
┌─────────────────────────────────────────────────────────────┐
│                         PROYECTO                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  ARTEFACTOS  │         │   JARDINES   │                 │
│  │              │         │              │                 │
│  │ • Audio      │         │ • Elementos  │                 │
│  │ • Video      │         │   - Seeds    │                 │
│  │ • PDF        │         │   - Discip.  │                 │
│  │ • Markdown   │         │   - Teorías  │                 │
│  │ • Chat       │         │   - Pensad.  │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         │    ┌───────────────────┘                          │
│         │    │                                              │
│         ▼    ▼                                              │
│  ┌─────────────────┐                                        │
│  │ ELEMENTOS       │                                        │
│  │ COGNITIVOS      │                                        │
│  │                 │                                        │
│  │ Extraídos de    │◄─── Agrupados en                      │
│  │ artefactos      │      jardines                         │
│  └─────────────────┘                                        │
│                                                              │
│  Búsqueda inversa:                                          │
│  Jardín → Elementos → ¿Qué artefactos los contienen?       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Payload de Jardín para Minotauro

Cuando se conecta un jardín a Minotauro, se genera un **payload** que contiene:

### Versiones de Payload

```typescript
type GardenPayloadVersion = 'ligera' | 'estandar' | 'completa';
```

| Versión | Contenido | Uso |
|---------|-----------|-----|
| `ligera` | Título + elementos básicos (limitados) + count de artefactos | Contexto mínimo, ahorro de tokens |
| `estandar` | Ligera + descripción + todos los elementos | Balance tokens/información |
| `completa` | Estándar + lista de artefactos resonantes (hasta 20) | Máximo contexto |

### Estructura del Payload

```typescript
interface GardenPayload {
  garden_id: string;           // ID del jardín
  referencia_formal: string;   // "🌺 Jardín 'X' (N elementos, M artefactos)"
  fragmento: string;           // Texto formateado según versión
  version: GardenPayloadVersion; // Versión del payload
  token_count: number;         // Tokens estimados
  metadata: {
    elementos_count: {
      seeds: number;
      disciplines: number;
      theories: number;
      thinkers: number;
    };
    artifacts_count: number;
  };
}
```

### Ejemplo de Fragmento (versión completa)

```markdown
# 🌺 Terra Preta Digital

Jardín sobre compostaje de conocimiento digital

## 🌱 Semillas (5)
- Terra Preta
- Compostaje digital
- Conocimiento como suelo
- Metabolización cognitiva
- Resonancia conceptual

## 🔬 Disciplinas (3)
- Antropología
- Ciencias de la Computación
- Filosofía de la Tecnología

## 💡 Teorías (2)
- Teoría Actor-Red
- Sistemas Complejos

## 👤 Pensadores (4)
- Bruno Latour
- Donna Haraway
- Tim Ingold
- Anna Tsing

---

## 📚 Artefactos Resonantes (8)

- 🎙️ **Compostar el caos digital con Terra Preta**
- 📝 **Notas sobre metabolización cognitiva**
- 📊 **Reporte: Sistemas de conocimiento distribuido**
- 🎬 **Charla: Antropología de la tecnología**
- 📝 **Conversación QUIPU sobre resonancia**
- 📽️ **Presentación: Actor-Red en práctica**
- 🎙️ **Podcast: Suelos cognitivos**
- 📝 **Artículo: Compostaje conceptual**
```

---

## 🎯 Implicaciones para Minotauro

Cuando se conecta un jardín a una sección de Minotauro:

1. **NO se conectan los artefactos individuales** del jardín
2. **Se conecta el jardín completo** como una fuente curada única
3. El payload del jardín **contiene referencias** a los artefactos resonantes
4. El arquetipo recibe el **contexto conceptual** del jardín
5. Los artefactos se mencionan por nombre pero **no se envía su contenido completo**

### Diferencia Clave

```
❌ INCORRECTO:
Conectar jardín → Agregar cada artefacto como fuente curada individual

✅ CORRECTO:
Conectar jardín → Agregar jardín como fuente curada única
              → Payload incluye lista de artefactos resonantes
              → Arquetipo ve el mapa conceptual completo
```

---

## 🔍 Flujo de Datos Completo

```
1. INVESTIGADOR SUBE ARTEFACTO
   ↓
2. SISTEMA PROCESA ARTEFACTO
   - Extrae texto (según tipo)
   - Guarda en cog_artifacts
   ↓
3. MICELIO ANALIZA ARTEFACTO (opcional)
   - Extrae elementos cognitivos
   - Guarda en cog_fractal_seeds, cog_artifact_disciplines, etc.
   - Genera crónica en source_metadata.micelio_chronicle
   ↓
4. INVESTIGADOR CREA JARDÍN
   - Selecciona elementos cognitivos
   - Guarda en cog_resonance_gardens + cog_garden_elements
   ↓
5. SISTEMA CALCULA ARTEFACTOS RESONANTES
   - Busca qué artefactos contienen los elementos del jardín
   - Calcula relevance_score
   ↓
6. INVESTIGADOR CONECTA JARDÍN A MINOTAURO
   - Selecciona versión de payload (ligera/estándar/completa)
   - Sistema genera payload con elementos + lista de artefactos
   - Guarda en minotauro_curated_sources con source_type='garden'
   ↓
7. ARQUETIPO PROCESA SECCIÓN
   - Recibe payload del jardín en el contexto
   - Ve mapa conceptual + artefactos resonantes
   - Genera propuesta basada en ese contexto
```

---

## 📊 Tablas de Base de Datos Relevantes

| Tabla | Propósito |
|-------|-----------|
| `cog_artifacts` | Artefactos principales |
| `cog_transcriptions` | Texto extraído de artefactos |
| `cog_artifact_pages` | Páginas de PDFs/slides |
| `cog_chat_sessions` | Sesiones de chat QUIPU |
| `cog_fractal_seeds` | Semillas fractales extraídas |
| `cog_disciplines` | Catálogo de disciplinas |
| `cog_theories` | Catálogo de teorías |
| `cog_references` | Catálogo de pensadores/autores |
| `cog_artifact_disciplines` | Relación artefacto-disciplina |
| `cog_artifact_theories` | Relación artefacto-teoría |
| `cog_artifact_references` | Relación artefacto-pensador |
| `cog_resonance_gardens` | Jardines de resonancia |
| `cog_garden_elements` | Elementos de cada jardín |
| `minotauro_curated_sources` | Fuentes curadas en Minotauro |

---

## ✅ Resumen Ejecutivo

1. **Artefacto** = Unidad de conocimiento (audio, video, PDF, markdown, chat)
2. **Elementos Cognitivos** = Conceptos extraídos de artefactos (seeds, disciplines, theories, thinkers)
3. **Jardín** = Agrupación temática de elementos cognitivos
4. **Artefactos Resonantes** = Artefactos que contienen los elementos de un jardín
5. **Payload de Jardín** = Representación textual del jardín para enviar a arquetipos
6. **Conexión a Minotauro** = Jardín completo como fuente curada, NO artefactos individuales

---

**Última actualización:** 23 de febrero de 2026
**Autor:** Sistema Cascade (basado en análisis de código)
**Propósito:** Establecer lenguaje común para desarrollo
