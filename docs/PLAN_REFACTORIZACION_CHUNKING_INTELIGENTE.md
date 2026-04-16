# 🔄 Plan de Refactorización: Chunking Inteligente y Destilación como Fuente Primaria

## 🚨 Problema Crítico Identificado

**Descubrimiento:** Los procesos actuales de elementos cognitivos y micelio están usando **truncado simple** (`fullText.slice(0, 30000)`), procesando solo **~7.5k tokens** de transcripciones que pueden tener **100k-200k tokens**.

**Impacto:**
- ❌ **80-95% del contenido se pierde**
- ❌ **Sesgo hacia el inicio** (conclusiones y desarrollo profundo ignorados)
- ❌ **Elementos cognitivos incompletos** (semillas, teorías, pensadores del final no detectados)
- ❌ **Micelio con contexto parcial** (metabolización sobre fragmento, no totalidad)
- ❌ **Chat Quipu con base deficiente** (responde sobre contenido truncado)

---

## 🎯 Solución: Arquitectura de Destilación Primaria

### **Nuevo Flujo de Procesamiento**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRANSCRIPCIÓN COMPLETA (100k-200k tokens)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. DESTILACIÓN CON CHUNKING INTELIGENTE                     │
│    - Dividir en chunks de ~40k tokens                       │
│    - Procesar con contexto acumulativo                      │
│    - Consolidar en ensayo coherente (~6-8k tokens)          │
│    - Modelo: deepseek-reasoner (mejor síntesis)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ENSAYO DESTILADO (6-8k tokens)                           │
│    ✅ Preserva profundidad conceptual                       │
│    ✅ Cubre TODO el contenido original                      │
│    ✅ Estructura académica coherente                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ELEMENTOS    │  │ MICELIO      │  │ CHAT QUIPU   │
│ COGNITIVOS   │  │ METABOL.     │  │              │
│              │  │              │  │              │
│ Fuente:      │  │ Fuente:      │  │ Fuente:      │
│ Ensayo       │  │ Ensayo       │  │ Ensayo       │
│ Destilado    │  │ Destilado    │  │ Destilado    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📋 Plan de Ruta Detallado

### **FASE 1: Implementar Chunking Inteligente en Destilación**

#### **1.1 Función de Chunking con Contexto Acumulativo**

**Archivo:** `/lib/actions/cognetica-distillation-actions.ts`

**Estrategia:**
```typescript
// Dividir transcripción en 3 chunks
const chunkSize = Math.ceil(fullText.length / 3);
const chunks = [
  fullText.slice(0, chunkSize),
  fullText.slice(chunkSize, chunkSize * 2),
  fullText.slice(chunkSize * 2)
];

// Procesar con contexto acumulativo
let previousSummaries = '';

for (let i = 0; i < chunks.length; i++) {
  const prompt = `
    ${i === 0 ? 'PRIMERA PARTE (de 3)' : i === 1 ? 'SEGUNDA PARTE (de 3)' : 'TERCERA PARTE (de 3)'}
    
    ${previousSummaries ? `CONTEXTO PREVIO:\n${previousSummaries}\n\n` : ''}
    
    CONTENIDO DE ESTA PARTE:
    ${chunks[i]}
    
    Genera un resumen académico de esta parte, manteniendo coherencia con el contexto previo.
  `;
  
  const summary = await callDeepSeekAPI('deepseek-reasoner', prompt);
  previousSummaries += `\n\n--- RESUMEN PARTE ${i + 1} ---\n${summary}`;
}

// Consolidación final
const finalEssay = await callDeepSeekAPI('deepseek-reasoner', `
  Consolida estos resúmenes en un ensayo académico coherente de 6-8k tokens:
  ${previousSummaries}
`);
```

**Ventajas:**
- ✅ Procesa **100% del contenido**
- ✅ **Contexto acumulativo** (cada parte conoce las anteriores)
- ✅ **Coherencia narrativa** (no son fragmentos aislados)
- ✅ **Preserva conclusiones** (tercera parte incluida)

---

#### **1.2 Migrar a deepseek-reasoner**

**Cambios:**
```typescript
// ANTES
model: 'deepseek-chat',
max_tokens: 8192

// DESPUÉS
model: 'deepseek-reasoner',
max_tokens: 16000  // Más capacidad para razonamiento + ensayo
```

**Justificación:**
- ✅ **Mejor síntesis conceptual** (razonamiento paso a paso)
- ✅ **Mayor capacidad de salida** (hasta 64k vs 8k)
- ✅ **Mismo costo por token** (solo pagas lo generado)
- ✅ **Ideal para tareas académicas** (destilación requiere análisis profundo)

---

#### **1.3 Actualizar Metadata**

**Nuevos campos:**
```typescript
interface DistilledEssayMetadata {
  model: 'deepseek-reasoner';
  generated_at: string;
  token_count: number;
  prompt_version: 'v2.0-chunked';  // Nueva versión
  source_token_count: number;
  compression_ratio: number;
  chunking_strategy: {
    total_chunks: number;
    chunk_size_avg: number;
    processing_method: 'accumulative_context';
  };
}
```

---

### **FASE 2: Migrar Elementos Cognitivos a Ensayo Destilado**

#### **2.1 Modificar `extractCognitiveElements`**

**Archivo:** `/lib/actions/cognetica-extraction-actions.ts`

**Cambio crítico:**
```typescript
// ANTES: Usar transcripción truncada
const userPrompt = `Analiza este contenido:
${fullText.slice(0, 30000)}  // ❌ Solo 7.5k tokens
`;

// DESPUÉS: Usar ensayo destilado
const { data: distilledEssay } = await supabase
  .from('cog_transcriptions')
  .select('distilled_essay')
  .eq('artifact_id', artifactId)
  .single();

if (!distilledEssay?.distilled_essay) {
  // Si no existe, generarlo primero
  await generateDistilledEssay(artifactId);
  // Luego obtenerlo
  const { data: newEssay } = await supabase
    .from('cog_transcriptions')
    .select('distilled_essay')
    .eq('artifact_id', artifactId)
    .single();
  
  fullText = newEssay.distilled_essay;
} else {
  fullText = distilledEssay.distilled_essay;
}

const userPrompt = `Analiza este ensayo académico destilado:
${fullText}  // ✅ 6-8k tokens con TODO el contenido
`;
```

**Migrar a deepseek-reasoner:**
```typescript
// ANTES
await callDeepSeekAPI("deepseek-chat", fullPrompt);

// DESPUÉS
await callDeepSeekAPI("deepseek-reasoner", fullPrompt);
```

---

#### **2.2 Botón de Reprocesamiento en UI**

**Archivo:** `/app/cognetica/[id]/page.tsx`

**Nuevo componente:**
```tsx
<StandardButton
  onClick={async () => {
    await fetch('/api/cognetica/reprocess-cognitive', {
      method: 'POST',
      body: JSON.stringify({ artifactId })
    });
    toast.success('Elementos cognitivos reprocesados');
  }}
  leftIcon={RefreshCw}
  colorScheme="warning"
  styleType="outline"
>
  Reprocesar Elementos Cognitivos
</StandardButton>
```

---

### **FASE 3: Migrar Micelio a Ensayo Destilado**

#### **3.1 Modificar Metabolización Micelio**

**Archivo:** Buscar función de metabolización micelio

**Cambio:**
```typescript
// ANTES: Usar transcripción completa o truncada
const transcriptionText = fullText.slice(0, X);

// DESPUÉS: Usar ensayo destilado
const { data: distilledEssay } = await getDistilledEssay(artifactId);
const sourceText = distilledEssay?.essay || fullText.slice(0, 30000);
```

**Migrar a deepseek-reasoner:**
```typescript
model: 'deepseek-reasoner',
max_tokens: 8192
```

---

#### **3.2 Botón de Reprocesamiento Micelio**

```tsx
<StandardButton
  onClick={async () => {
    await fetch('/api/cognetica/reprocess-micelium', {
      method: 'POST',
      body: JSON.stringify({ artifactId })
    });
    toast.success('Micelio reprocesado');
  }}
  leftIcon={RefreshCw}
  colorScheme="accent"
  styleType="outline"
>
  Reprocesar Micelio
</StandardButton>
```

---

### **FASE 4: Migrar Chat Quipu a Ensayo Destilado**

#### **4.1 Modificar Contexto del Chat**

**Archivo:** `/app/cognetica/[id]/CogneticaChat.tsx` o similar

**Cambio:**
```typescript
// ANTES: Usar transcripción truncada como contexto
const context = transcription.slice(0, 10000);

// DESPUÉS: Usar ensayo destilado
const { data: distilledEssay } = await getDistilledEssay(artifactId);
const context = distilledEssay?.essay || transcription.slice(0, 10000);
```

**Migrar a deepseek-reasoner:**
```typescript
model: 'deepseek-reasoner',
max_tokens: 4096  // Respuestas más razonadas
```

---

### **FASE 5: Tipos de Artefactos Afectados**

#### **Requieren Destilación:**
- ✅ **Audio** (`type: 'audio'`)
- ✅ **Video** (`type: 'video'`)
- ✅ **Markdown** (`type: 'markdown'`)
- ✅ **PDF Informe** (`type: 'pdf_report'`)

#### **NO requieren Destilación:**
- ❌ **PDF Slides** (`type: 'pdf_slides'`) - Ya procesados por página

**Lógica condicional:**
```typescript
const requiresDistillation = [
  'audio', 
  'video', 
  'markdown', 
  'pdf_report'
].includes(artifact.type);

if (requiresDistillation) {
  await generateDistilledEssay(artifactId);
}
```

---

### **FASE 6: Flujo de Procesamiento Actualizado**

#### **Nuevo Orden de Ejecución:**

```typescript
// 1. Transcripción (Whisper/Marker/etc)
await processTranscription(artifactId);

// 2. Destilación (NUEVO - PRIMERO)
if (requiresDistillation) {
  await generateDistilledEssay(artifactId);
}

// 3. Elementos Cognitivos (usa ensayo destilado)
await extractCognitiveElements(artifactId);

// 4. Micelio (usa ensayo destilado)
await metabolizeWithMicelio(artifactId);

// 5. Chat Quipu (usa ensayo destilado como contexto)
// Se ejecuta on-demand por el usuario
```

---

### **FASE 7: UI - Panel de Reprocesamiento**

#### **Nuevo Panel en Página de Artefacto**

**Ubicación:** Debajo del panel de ensayo destilado

```tsx
<StandardCard>
  <StandardCard.Header>
    <div className="flex items-center gap-2">
      <RefreshCw className="w-5 h-5 text-warning" />
      <StandardText weight="semibold" size="lg">
        Reprocesamiento
      </StandardText>
    </div>
  </StandardCard.Header>
  
  <StandardCard.Content>
    <div className="space-y-3">
      <StandardText size="sm" colorScheme="neutral">
        Reprocesa los análisis usando el ensayo destilado actualizado.
        Útil si regeneraste el ensayo o si los análisis previos usaron truncado.
      </StandardText>
      
      <div className="flex gap-2">
        <StandardButton
          onClick={handleReprocessCognitive}
          leftIcon={Brain}
          colorScheme="primary"
          styleType="outline"
          size="sm"
        >
          Elementos Cognitivos
        </StandardButton>
        
        <StandardButton
          onClick={handleReprocessMicelium}
          leftIcon={Network}
          colorScheme="accent"
          styleType="outline"
          size="sm"
        >
          Micelio
        </StandardButton>
        
        <StandardButton
          onClick={handleReprocessAll}
          leftIcon={RefreshCw}
          colorScheme="warning"
          styleType="solid"
          size="sm"
        >
          Reprocesar Todo
        </StandardButton>
      </div>
    </div>
  </StandardCard.Content>
</StandardCard>
```

---

### **FASE 8: API Routes para Reprocesamiento**

#### **8.1 `/api/cognetica/reprocess-cognitive/route.ts`**

```typescript
export async function POST(req: Request) {
  const { artifactId } = await req.json();
  
  // 1. Verificar que existe ensayo destilado
  const { data: essay } = await getDistilledEssay(artifactId);
  
  if (!essay) {
    // Generar primero
    await generateDistilledEssay(artifactId);
  }
  
  // 2. Reprocesar elementos cognitivos
  await extractCognitiveElements(artifactId);
  
  return Response.json({ success: true });
}
```

#### **8.2 `/api/cognetica/reprocess-micelium/route.ts`**

```typescript
export async function POST(req: Request) {
  const { artifactId } = await req.json();
  
  const { data: essay } = await getDistilledEssay(artifactId);
  
  if (!essay) {
    await generateDistilledEssay(artifactId);
  }
  
  await metabolizeWithMicelio(artifactId);
  
  return Response.json({ success: true });
}
```

#### **8.3 `/api/cognetica/reprocess-all/route.ts`**

```typescript
export async function POST(req: Request) {
  const { artifactId } = await req.json();
  
  // 1. Regenerar ensayo destilado
  await generateDistilledEssay(artifactId);
  
  // 2. Reprocesar elementos cognitivos
  await extractCognitiveElements(artifactId);
  
  // 3. Reprocesar micelio
  await metabolizeWithMicelio(artifactId);
  
  return Response.json({ success: true });
}
```

---

## 🎯 Migración de Modelos a deepseek-reasoner

### **Archivos a Actualizar:**

1. **`/lib/actions/cognetica-distillation-actions.ts`**
   - ✅ Chunking inteligente
   - ✅ `model: 'deepseek-reasoner'`
   - ✅ `max_tokens: 16000`

2. **`/lib/actions/cognetica-extraction-actions.ts`**
   - ✅ Usar ensayo destilado
   - ✅ `model: 'deepseek-reasoner'`
   - ✅ `max_tokens: 8192`

3. **`/lib/actions/cognetica-micelio-actions.ts`** (o similar)
   - ✅ Usar ensayo destilado
   - ✅ `model: 'deepseek-reasoner'`
   - ✅ `max_tokens: 8192`

4. **`/app/cognetica/[id]/CogneticaChat.tsx`**
   - ✅ Usar ensayo destilado como contexto
   - ✅ `model: 'deepseek-reasoner'`
   - ✅ `max_tokens: 4096`

---

## 📊 Comparación: Antes vs Después

### **ANTES (Truncado Simple)**

| Proceso | Fuente | Tokens Procesados | Cobertura |
|---------|--------|-------------------|-----------|
| Elementos Cognitivos | Transcripción truncada | ~7.5k | 5-10% |
| Micelio | Transcripción truncada | ~7.5k | 5-10% |
| Chat Quipu | Transcripción truncada | ~10k | 10-15% |
| **TOTAL** | - | **~25k** | **~10%** |

**Problemas:**
- ❌ 90% del contenido ignorado
- ❌ Sesgo hacia inicio
- ❌ Conclusiones perdidas
- ❌ Elementos cognitivos incompletos

---

### **DESPUÉS (Chunking Inteligente + Destilación)**

| Proceso | Fuente | Tokens Procesados | Cobertura |
|---------|--------|-------------------|-----------|
| **Destilación** | Transcripción completa (chunks) | 100k-200k | 100% |
| Elementos Cognitivos | Ensayo destilado | ~6-8k | 100% |
| Micelio | Ensayo destilado | ~6-8k | 100% |
| Chat Quipu | Ensayo destilado | ~6-8k | 100% |
| **TOTAL** | - | **~120k-220k** | **100%** |

**Beneficios:**
- ✅ 100% del contenido procesado
- ✅ Sin sesgo temporal
- ✅ Conclusiones incluidas
- ✅ Elementos cognitivos completos
- ✅ Coherencia narrativa preservada

---

## 🚀 Orden de Implementación Recomendado

### **Sprint 1: Fundación (Crítico)**
1. ✅ Implementar chunking inteligente en destilación
2. ✅ Migrar destilación a `deepseek-reasoner`
3. ✅ Testear con transcripción larga (100k+ tokens)
4. ✅ Validar calidad del ensayo destilado

### **Sprint 2: Migración de Procesos**
5. ✅ Migrar elementos cognitivos a ensayo destilado
6. ✅ Migrar micelio a ensayo destilado
7. ✅ Migrar chat Quipu a ensayo destilado
8. ✅ Actualizar todos a `deepseek-reasoner`

### **Sprint 3: UI y Reprocesamiento**
9. ✅ Crear API routes de reprocesamiento
10. ✅ Agregar panel de reprocesamiento en UI
11. ✅ Agregar botones individuales por proceso
12. ✅ Agregar feedback visual (toasts, loading states)

### **Sprint 4: Validación y Documentación**
13. ✅ Reprocesar artefactos existentes (batch)
14. ✅ Comparar calidad antes/después
15. ✅ Actualizar documentación
16. ✅ Crear guía de uso para usuarios

---

## 📝 Documentación a Actualizar

1. **`/docs/FUENTE_DATOS_ARTEFACTOS_COGNETICOS.md`**
   - Actualizar flujo de procesamiento
   - Documentar chunking inteligente
   - Explicar destilación como fuente primaria

2. **Nuevo: `/docs/CHUNKING_INTELIGENTE.md`**
   - Explicar estrategia de chunks
   - Documentar contexto acumulativo
   - Ejemplos de uso

3. **Nuevo: `/docs/REPROCESAMIENTO_ARTEFACTOS.md`**
   - Guía para reprocesar artefactos antiguos
   - Cuándo reprocesar
   - Qué esperar de la mejora

---

## ⚠️ Consideraciones Importantes

### **Costo de API**
- **Destilación con chunking:** ~3-4x más llamadas que truncado
- **deepseek-reasoner:** Genera más tokens (razonamiento visible)
- **Estimado por artefacto:** $0.05-0.15 USD (vs $0.01-0.02 actual)
- **Justificación:** Calidad 10x superior justifica costo 5x mayor

### **Tiempo de Procesamiento**
- **Destilación:** ~2-3 minutos (vs ~30 segundos actual)
- **Elementos cognitivos:** ~1-2 minutos (igual o mejor)
- **Micelio:** ~1-2 minutos (igual o mejor)
- **Total:** ~5-7 minutos por artefacto completo

### **Artefactos Existentes**
- **Opción 1:** Reprocesar todos (batch job nocturno)
- **Opción 2:** Reprocesar on-demand (botón manual)
- **Recomendación:** Opción 2 + batch para artefactos críticos

---

## 🎯 Criterios de Éxito

### **Técnicos**
- ✅ Destilación procesa 100% del contenido
- ✅ Ensayo destilado coherente y académico
- ✅ Elementos cognitivos completos (inicio + final)
- ✅ Micelio con contexto total
- ✅ Chat Quipu responde sobre contenido completo

### **Calidad**
- ✅ Semillas del final de transcripción detectadas
- ✅ Teorías mencionadas en conclusiones incluidas
- ✅ Pensadores referenciados tarde aparecen
- ✅ Micelio metaboliza insights finales
- ✅ Chat responde preguntas sobre cualquier parte

### **UX**
- ✅ Botones de reprocesamiento funcionales
- ✅ Feedback claro durante procesamiento
- ✅ Indicadores de progreso
- ✅ Mensajes de error descriptivos

---

## 🔄 Próximos Pasos Inmediatos

1. **Aprobar este plan** ✋
2. **Implementar chunking inteligente** (Sprint 1)
3. **Testear con artefacto real** (validar calidad)
4. **Migrar procesos** (Sprint 2)
5. **Agregar UI de reprocesamiento** (Sprint 3)
6. **Documentar y validar** (Sprint 4)

---

## 📌 Notas Finales

Este plan transforma Cognética de un sistema que procesa **fragmentos** a uno que procesa **totalidades**. La destilación inteligente se convierte en el **corazón del sistema**, garantizando que ningún insight, teoría o pensador se pierda por limitaciones técnicas.

**Filosofía:** "Mejor sintetizar TODO que analizar POCO"

---

**Documento creado:** 27 de febrero de 2026  
**Autor:** Sistema Cascade + Rodolfo Leiva  
**Estado:** Pendiente de aprobación  
**Prioridad:** 🔥 CRÍTICA
