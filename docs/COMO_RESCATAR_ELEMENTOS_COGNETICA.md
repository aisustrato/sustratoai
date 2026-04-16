# 🔍 Cómo Rescatar Elementos de Cognetica

## 🎯 Propósito
Guía de referencia para futuras sesiones de IA sobre cómo obtener correctamente los distintos elementos de un artefacto cognitivo en el sistema Cognetica.
>>>-2_"R·_·
R:º
---

## 📦 Estructura General

Todos los artefactos cognitivos se almacenan en la tabla `cog_artifacts` y tienen elementos relacionados en múltiples tablas. La función principal para exportación es `getArtifactExportData(artifactId)` en `/lib/actions/cognetica-export-actions.ts`.

---

## 🗂️ Elementos por Tipo

### 1. **Transcripción / Contenido Base**

**Tabla:** `cog_transcriptions`

**Campos clave:**
- `full_text` - Texto completo de la transcripción
- `segments` - Segmentos con speakers y timestamps (JSON)
- `language` - Idioma detectado
- `confidence_score` - Confianza de la transcripción
- `distilled_essay` - Ensayo destilado (Minotauro Destilador) ⭐
- `distilled_essay_metadata` - Metadata del ensayo (JSON)

**Query ejemplo:**
```typescript
const { data: transcriptions } = await supabase
    .from('cog_transcriptions')
    .select('full_text, segments, language, confidence_score, distilled_essay, distilled_essay_metadata')
    .eq('artifact_id', artifactId)
    .order('created_at', { ascending: false })
    .limit(1);
```

**Nota:** Para presentaciones (slides), el texto viene de `cog_presentation_pages` en lugar de transcripciones.

---

### 2. **Ensayo Destilado (Minotauro Destilador)**

**Ubicación:** Campo `distilled_essay` en `cog_transcriptions`

**Metadata incluye:**
- `ejecutado_en` - Timestamp de ejecución
- `modelo` - Modelo de IA usado
- `tokens_usados` - Tokens consumidos

**Función helper:**
```typescript
import { getDistilledEssay } from '@/lib/actions/cognetica-distillation-actions';

const result = await getDistilledEssay(artifactId);
if (result.success && result.data) {
    const essay = result.data.essay;
    const metadata = result.data.metadata;
}
```

**Uso en descarga SHA256:** Incluir el ensayo destilado en lugar del audio crudo para artefactos de tipo `audio` o `video`.

---

### 3. **Crónica del Micelio (Micelio Cronista Forense)**

**Ubicación:** Campo `source_metadata.micelio_chronicle` en `cog_artifacts`

**Estructura:**
```typescript
{
    ejecutado_en: string;        // Timestamp ISO
    version_extendida: string;   // Narrativa forense completa
    version_destilada: string;   // Resumen ejecutivo
}
```

**Query ejemplo:**
```typescript
const { data: artifact } = await supabase
    .from('cog_artifacts')
    .select('source_metadata')
    .eq('id', artifactId)
    .single();

const sourceMeta = artifact.source_metadata as any || {};
const chronicle = sourceMeta.micelio_chronicle || null;
```

**Función helper:**
```typescript
import { getChronicleForArtifact } from '@/lib/actions/cognetica-actions';

const result = await getChronicleForArtifact(artifactId);
if (result.success && result.data.has_chronicle) {
    const chronicle = result.data.chronicle;
}
```

**Uso en descarga SHA256:** Incluir ambas versiones (destilada y extendida) en la exportación.

---

### 4. **Semillas Fractales**

**Tabla:** `cog_fractal_seeds`

**Campos:**
- `content` - Contenido de la semilla

**Query ejemplo:**
```typescript
const { data: seeds } = await supabase
    .from('cog_fractal_seeds')
    .select('content')
    .eq('artifact_id', artifactId)
    .order('created_at', { ascending: false });
```

---

### 5. **Referencias (Pensadores/Autores)**

**Tablas:** `cog_artifact_references` + `cog_references` + `cog_disciplines`

**Query ejemplo:**
```typescript
const { data: references } = await supabase
    .from('cog_artifact_references')
    .select(`
        context_snippet,
        cog_references!inner(
            name,
            era,
            bio_snippet,
            key_contributions,
            cog_disciplines(name)
        )
    `)
    .eq('artifact_id', artifactId);
```

---

### 6. **Disciplinas**

**Tablas:** `cog_artifact_disciplines` + `cog_disciplines`

**Query ejemplo:**
```typescript
const { data: disciplines } = await supabase
    .from('cog_artifact_disciplines')
    .select('cog_disciplines!inner(name)')
    .eq('artifact_id', artifactId);
```

---

### 7. **Teorías**

**Tablas:** `cog_artifact_theories` + `cog_theories`

**Query ejemplo:**
```typescript
const { data: theories } = await supabase
    .from('cog_artifact_theories')
    .select('cog_theories!inner(name)')
    .eq('artifact_id', artifactId);
```

---

### 8. **Sesiones de Chat QUIPU**

**Tabla:** `cog_chat_sessions`

**Campos clave:**
- `session_title` - Título de la sesión
- `started_at` - Fecha de inicio
- `total_messages` - Total de mensajes
- `avg_f0_score` - Score promedio F0
- `paralloros_count` - Cantidad de paralloros
- `inference_enabled` - Si inferencia activa está habilitada
- `messages` - Array de mensajes (JSON)

**Query ejemplo:**
```typescript
const { data: chatSessions } = await supabase
    .from('cog_chat_sessions')
    .select('*')
    .eq('artifact_id', artifactId)
    .order('started_at', { ascending: false });
```

---

### 9. **Imágenes de Infografías**

**Tablas:** `cog_image_prompts` + `cog_generated_images`

**Ubicación Storage:** `cognetica-files/infographics/{artifactId}/`

**Query ejemplo:**
```typescript
// 1. Obtener prompts
const { data: prompts } = await supabase
    .from('cog_image_prompts')
    .select('id, prompt_text, style_modifiers')
    .eq('artifact_id', artifactId);

const promptIds = prompts.map(p => p.id);

// 2. Obtener imágenes
const { data: images } = await supabase
    .from('cog_generated_images')
    .select('id, prompt_id, storage_path, width, height, status, created_at')
    .in('prompt_id', promptIds)
    .order('created_at', { ascending: true });

// 3. Generar URLs firmadas (NO públicas)
const { data: signedUrlData } = await supabase.storage
    .from('cognetica-files')
    .createSignedUrl(image.storage_path, 3600); // 1 hora
```

**⚠️ IMPORTANTE:** Usar `createSignedUrl()` en lugar de `getPublicUrl()` para mantener consistencia con el patrón de audio.

**Función helper:**
```typescript
import { getInfographicImages } from '@/lib/actions/cognetica-infographic-images-actions';

const result = await getInfographicImages(artifactId);
if (result.success) {
    const images = result.data; // Array con URLs firmadas
}
```

---

### 10. **Archivos de Audio**

**Ubicación Storage:** `cognetica-files/audio/{artifactId}/`

**Patrón de acceso:**
```typescript
const storagePath = `audio/${artifactId}/original.mp3`;

// Generar URL firmada temporal
const { data: signedUrlData } = await supabase.storage
    .from('cognetica-files')
    .createSignedUrl(storagePath, 3600); // 1 hora validez

const audioUrl = signedUrlData.signedUrl;
```

**⚠️ CRÍTICO:** El bucket `cognetica-files` NO es público. Siempre usar URLs firmadas.

---

### 11. **Páginas de Presentaciones**

**Tabla:** `cog_presentation_pages`

**Campos:**
- `page_number` - Número de página
- `extracted_text` - Texto extraído (Markdown)
- `storage_path` - Path del PDF de la página

**Query ejemplo:**
```typescript
const { data: pages } = await supabase
    .from('cog_presentation_pages')
    .select('page_number, extracted_text, storage_path')
    .eq('artifact_id', artifactId)
    .order('page_number', { ascending: true });
```

---

## 🔐 Patrón de Acceso a Storage

### **Bucket:** `cognetica-files`

**Estructura de directorios:**
```
cognetica-files/
├── audio/{artifactId}/
│   └── original.mp3
├── infographics/{artifactId}/
│   ├── {timestamp}-0.png
│   ├── {timestamp}-1.png
│   └── ...
├── presentations/{artifactId}/
│   ├── page_1.pdf
│   ├── page_2.pdf
│   └── ...
└── documents/{artifactId}/
    └── ...
```

**Patrón de acceso:**
```typescript
// ✅ CORRECTO: URL firmada temporal
const { data: signedUrlData } = await supabase.storage
    .from('cognetica-files')
    .createSignedUrl(storagePath, 3600);

// ❌ INCORRECTO: URL pública (no funciona en bucket privado)
const { data: publicUrlData } = supabase.storage
    .from('cognetica-files')
    .getPublicUrl(storagePath);
```

---

## 📥 Descarga SHA256

### **Elementos a Incluir:**

1. **Metadata del artefacto** (título, tipo, fecha, proyecto)
2. **Ensayo destilado** (en lugar de audio crudo) ⭐
3. **Crónica del Micelio** (versión destilada y extendida) ⭐
4. **Semillas fractales**
5. **Referencias** (pensadores)
6. **Disciplinas**
7. **Teorías**
8. **Sesiones de chat QUIPU**
9. **Imágenes de infografías** (URLs firmadas)

### **Elementos a EXCLUIR:**

- ❌ Audio crudo (usar ensayo destilado en su lugar)
- ❌ Transcripción completa (usar ensayo destilado)
- ❌ Archivos binarios (solo metadata y URLs)

---

## 🧪 Función de Referencia

Ver implementación completa en:
- `@/lib/actions/cognetica-export-actions.ts:123-385` - `getArtifactExportData()`
- `@/lib/actions/cognetica-export-actions.ts:390-702` - `exportArtifactToMarkdown()`
- `@/lib/actions/cognetica-infographic-images-actions.ts:30-96` - `getInfographicImages()`

---

## 📋 Checklist de Verificación

Al implementar rescate de elementos, verificar:

- [ ] Usar `createSignedUrl()` para archivos en Storage
- [ ] Incluir `distilled_essay` y `distilled_essay_metadata` en queries de transcripciones
- [ ] Verificar `source_metadata.micelio_chronicle` para crónica
- [ ] Manejar caso de presentaciones (páginas vs transcripciones)
- [ ] Generar URLs firmadas con validez apropiada (3600s = 1 hora)
- [ ] Incluir ensayo destilado en lugar de audio en exportaciones
- [ ] Incluir ambas versiones de crónica (destilada y extendida)

---

## 🚀 Ejemplo Completo

```typescript
import { createSupabaseServerClient } from '@/lib/supabase';

async function rescatarElementosCognetica(artifactId: string) {
    const supabase = await createSupabaseServerClient();
    
    // 1. Artefacto base
    const { data: artifact } = await supabase
        .from('cog_artifacts')
        .select('*, projects!inner(id, name)')
        .eq('id', artifactId)
        .single();
    
    // 2. Transcripción + Ensayo Destilado
    const { data: transcription } = await supabase
        .from('cog_transcriptions')
        .select('full_text, distilled_essay, distilled_essay_metadata')
        .eq('artifact_id', artifactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    // 3. Crónica del Micelio
    const sourceMeta = artifact.source_metadata as any || {};
    const chronicle = sourceMeta.micelio_chronicle || null;
    
    // 4. Semillas fractales
    const { data: seeds } = await supabase
        .from('cog_fractal_seeds')
        .select('content')
        .eq('artifact_id', artifactId);
    
    // 5. Imágenes con URLs firmadas
    const { data: imagePrompts } = await supabase
        .from('cog_image_prompts')
        .select('id')
        .eq('artifact_id', artifactId);
    
    const { data: images } = await supabase
        .from('cog_generated_images')
        .select('storage_path')
        .in('prompt_id', imagePrompts.map(p => p.id));
    
    const imageUrls = await Promise.all(
        images.map(async (img) => {
            const { data } = await supabase.storage
                .from('cognetica-files')
                .createSignedUrl(img.storage_path, 3600);
            return data?.signedUrl;
        })
    );
    
    return {
        artifact,
        transcription,
        ensayo_destilado: transcription?.distilled_essay,
        cronica_micelio: chronicle,
        semillas: seeds,
        imagenes: imageUrls
    };
}
```

---

## 📚 Referencias Adicionales

- **Documentación de fuentes de datos:** `@/docs/FUENTE_DATOS_ARTEFACTOS_COGNETICOS.md`
- **Acciones de destilación:** `@/lib/actions/cognetica-distillation-actions.ts`
- **Acciones de crónica:** `@/lib/actions/cognetica-actions.ts:971-1011`
- **Acciones de imágenes:** `@/lib/actions/cognetica-infographic-images-actions.ts`
