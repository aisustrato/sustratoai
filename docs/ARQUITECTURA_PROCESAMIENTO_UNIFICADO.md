# Arquitectura de Procesamiento Unificado: Ensayo Destilado + Elementos Cognitivos

## 🎯 Objetivo

Unificar la generación del **ensayo destilado** y los **elementos cognitivos** en un solo proceso chunkeado que garantiza que ambos se generen desde la **fuente original**, evitando pérdida de información y duplicación de procesamiento.

---

## 📊 Flujo Actual (Problemático)

```
Transcripción Original (234k chars, ~59k tokens)
    ↓
    ├─→ Ensayo Destilado (truncado a 30k chars) ❌
    │   └─→ Micelio trabaja sobre ensayo truncado ❌
    │
    └─→ Elementos Cognitivos (truncado a 30k chars) ❌
        └─→ Pérdida de información ❌
```

**Problemas:**
- ❌ Ambos procesos truncan el contenido original
- ❌ Pérdida de información en transcripciones largas
- ❌ Procesamiento duplicado (dos llamadas a DeepSeek)
- ❌ Micelio trabaja sobre datos incompletos

---

## 🚀 Nuevo Flujo Unificado (Propuesto)

```
Transcripción Original (234k chars, ~59k tokens)
    ↓
    Dividir en Chunks Inteligentes (ej: 3 chunks de ~40k tokens c/u)
    ↓
    ┌─────────────────────────────────────────────────────────┐
    │  PROCESAMIENTO POR CHUNK (Contexto Acumulativo)        │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  Chunk 1 → DeepSeek Reasoner                           │
    │    ├─→ Resumen del chunk                               │
    │    ├─→ Semillas (seeds)                                │
    │    ├─→ Pensadores (thinkers)                           │
    │    ├─→ Disciplinas (disciplines)                       │
    │    └─→ Frases Notables (notable_phrases)               │
    │                                                         │
    │  Chunk 2 → DeepSeek Reasoner (+ contexto Chunk 1)     │
    │    ├─→ Resumen del chunk                               │
    │    ├─→ Semillas                                        │
    │    ├─→ Pensadores                                      │
    │    ├─→ Disciplinas                                     │
    │    └─→ Frases Notables                                 │
    │                                                         │
    │  Chunk 3 → DeepSeek Reasoner (+ contexto Chunks 1-2)  │
    │    ├─→ Resumen del chunk                               │
    │    ├─→ Semillas                                        │
    │    ├─→ Pensadores                                      │
    │    ├─→ Disciplinas                                     │
    │    └─→ Frases Notables                                 │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
    ↓
    ┌─────────────────────────────────────────────────────────┐
    │  CONSOLIDACIÓN FINAL                                    │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  1. Consolidar Ensayo Destilado                        │
    │     └─→ Unificar resúmenes de todos los chunks         │
    │                                                         │
    │  2. Consolidar Elementos Cognitivos                    │
    │     ├─→ Unificar todas las semillas                    │
    │     ├─→ Unificar todos los pensadores                  │
    │     ├─→ Unificar todas las disciplinas                 │
    │     └─→ Unificar todas las frases notables             │
    │                                                         │
    │  3. Generar Referencias Culturales (NUEVO)             │
    │     ├─→ Analogía 1: Momento de película/serie          │
    │     ├─→ Analogía 2: Hecho histórico/cultural           │
    │     │   (ej: "momento Kodak")                          │
    │     └─→ Analogía 3: Meme                               │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
    ↓
    ┌─────────────────────────────────────────────────────────┐
    │  RESULTADO FINAL                                        │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  ✅ Ensayo Destilado Completo                          │
    │  ✅ Elementos Cognitivos Completos                     │
    │     ├─→ Seeds (consolidadas)                           │
    │     ├─→ Thinkers (consolidados)                        │
    │     ├─→ Disciplines (consolidadas)                     │
    │     ├─→ Notable Phrases (consolidadas)                 │
    │     └─→ Cultural References (3 analogías)              │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
    ↓
    Micelio trabaja sobre:
    - Ensayo Destilado Completo ✅
    - Elementos Cognitivos Completos ✅
```

---

## 🧠 Ventajas del Nuevo Flujo

### **1. Procesamiento Completo de la Fuente Original**
- ✅ Todos los chunks se procesan sin truncamiento
- ✅ Contexto acumulativo garantiza coherencia
- ✅ No se pierde información

### **2. Eficiencia**
- ✅ Un solo proceso genera ensayo + elementos
- ✅ Menos llamadas a DeepSeek
- ✅ Procesamiento paralelo conceptual (un chunk genera todo)

### **3. Calidad de Datos**
- ✅ Elementos cognitivos extraídos del contenido completo
- ✅ Ensayo destilado refleja todo el material
- ✅ Micelio trabaja sobre datos completos y precisos

### **4. Estandarización de Referencias Culturales**
- ✅ Tres tipos de analogías siempre presentes
- ✅ Formato consistente y predecible
- ✅ Facilita búsqueda y visualización

---

## 📋 Estructura de Datos por Chunk

### **Prompt para cada Chunk:**

```json
{
  "role": "user",
  "content": "Analiza el siguiente fragmento (chunk X de Y) de una transcripción.
  
  CONTEXTO PREVIO:
  [Resumen de chunks anteriores si existen]
  
  FRAGMENTO ACTUAL:
  [Texto del chunk actual]
  
  INSTRUCCIONES:
  1. Genera un resumen conciso de este fragmento
  2. Extrae los siguientes elementos cognitivos:
     - Seeds: Conceptos clave (máx 10)
     - Thinkers: Pensadores mencionados o relevantes (máx 5)
     - Disciplines: Disciplinas académicas relacionadas (máx 5)
     - Notable Phrases: Frases memorables o importantes (máx 5)
  
  Responde en formato JSON:
  {
    \"summary\": \"...\",
    \"seeds\": [{\"name\": \"...\", \"description\": \"...\"}],
    \"thinkers\": [{\"name\": \"...\", \"relevance\": \"...\"}],
    \"disciplines\": [{\"name\": \"...\", \"connection\": \"...\"}],
    \"notable_phrases\": [{\"phrase\": \"...\", \"context\": \"...\"}]
  }"
}
```

---

## 📋 Consolidación Final

### **1. Consolidar Ensayo Destilado**

```json
{
  "role": "user",
  "content": "Tienes los siguientes resúmenes de chunks:
  
  CHUNK 1: [resumen]
  CHUNK 2: [resumen]
  CHUNK 3: [resumen]
  
  Genera un ensayo destilado coherente y unificado que integre todos estos resúmenes en un texto fluido y bien estructurado."
}
```

### **2. Consolidar Elementos Cognitivos**

**Lógica:**
- **Seeds:** Unificar y deduplicar por nombre
- **Thinkers:** Unificar y deduplicar por nombre
- **Disciplines:** Unificar y deduplicar por nombre
- **Notable Phrases:** Mantener todas (sin deduplicar)

### **3. Generar Referencias Culturales (NUEVO)**

```json
{
  "role": "user",
  "content": "Basándote en el siguiente ensayo destilado y elementos cognitivos:
  
  ENSAYO: [ensayo consolidado]
  ELEMENTOS: [elementos consolidados]
  
  Genera 3 analogías culturales que ayuden a entender el contenido:
  
  1. PELÍCULA/SERIE: Un momento específico de una película o serie que ilustre el concepto principal
  2. HECHO HISTÓRICO/CULTURAL: Un evento histórico o fenómeno cultural (ej: 'momento Kodak')
  3. MEME: Un meme popular que capture la esencia del contenido
  
  Responde en formato JSON:
  {
    \"cultural_references\": [
      {
        \"type\": \"movie_series\",
        \"title\": \"...\",
        \"moment\": \"...\",
        \"connection\": \"...\"
      },
      {
        \"type\": \"historical_cultural\",
        \"event\": \"...\",
        \"description\": \"...\",
        \"connection\": \"...\"
      },
      {
        \"type\": \"meme\",
        \"name\": \"...\",
        \"description\": \"...\",
        \"connection\": \"...\"
      }
    ]
  }"
}
```

---

## 🗄️ Esquema de Base de Datos

### **Tabla: `cog_cultural_references` (NUEVA)**

```sql
CREATE TABLE cog_cultural_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL REFERENCES cog_artifacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('movie_series', 'historical_cultural', 'meme')),
    
    -- Para película/serie
    title TEXT,
    moment TEXT,
    
    -- Para hecho histórico/cultural
    event TEXT,
    description TEXT,
    
    -- Para meme
    name TEXT,
    
    -- Común
    connection TEXT NOT NULL, -- Cómo se conecta con el contenido
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(artifact_id, type) -- Solo una referencia de cada tipo por artefacto
);

CREATE INDEX idx_cultural_refs_artifact ON cog_cultural_references(artifact_id);
CREATE INDEX idx_cultural_refs_type ON cog_cultural_references(type);
```

---

## 🔄 Actualización del Flujo de Micelio

**Antes:**
```
Micelio recibe:
- Ensayo destilado (truncado) ❌
```

**Después:**
```
Micelio recibe:
- Ensayo destilado completo ✅
- Elementos cognitivos completos ✅
  - Seeds
  - Thinkers
  - Disciplines
  - Notable Phrases
  - Cultural References
```

**Ventaja:** El micelio puede generar conexiones más ricas y precisas basándose en datos completos.

---

## 📊 Comparación de Eficiencia

### **Flujo Actual (Separado)**

| Proceso | Llamadas DeepSeek | Tokens Procesados | Datos Completos |
|---------|-------------------|-------------------|-----------------|
| Ensayo Destilado | 1 (truncado) | ~30k | ❌ No |
| Elementos Cognitivos | 1 (truncado) | ~30k | ❌ No |
| **TOTAL** | **2** | **~60k** | **❌ No** |

### **Flujo Unificado (Propuesto)**

| Proceso | Llamadas DeepSeek | Tokens Procesados | Datos Completos |
|---------|-------------------|-------------------|-----------------|
| Chunk 1 (ensayo + elementos) | 1 | ~40k | ✅ Sí |
| Chunk 2 (ensayo + elementos) | 1 | ~40k | ✅ Sí |
| Chunk 3 (ensayo + elementos) | 1 | ~40k | ✅ Sí |
| Consolidación Ensayo | 1 | ~8k | ✅ Sí |
| Referencias Culturales | 1 | ~8k | ✅ Sí |
| **TOTAL** | **5** | **~136k** | **✅ Sí** |

**Análisis:**
- ✅ Más llamadas pero procesamiento completo
- ✅ Todos los datos se generan de la fuente original
- ✅ Calidad superior de elementos cognitivos
- ✅ Micelio trabaja sobre datos completos

---

## 🎯 Implementación Propuesta

### **Fase 1: Refactorizar `generateDistilledEssay`**
- Modificar para generar elementos cognitivos por chunk
- Implementar consolidación de elementos
- Guardar elementos en BD

### **Fase 2: Implementar Referencias Culturales**
- Crear tabla `cog_cultural_references`
- Implementar generación de 3 analogías estandarizadas
- Integrar en UI

### **Fase 3: Actualizar Micelio**
- Modificar para recibir ensayo + elementos completos
- Aprovechar referencias culturales para conexiones

### **Fase 4: Deprecar Proceso Antiguo**
- Marcar `extractCognitiveElements` como obsoleto
- Migrar artefactos existentes (opcional)

---

## 🚀 Beneficios Finales

1. **Integridad de Datos:** Todo se genera de la fuente original completa
2. **Eficiencia:** Un solo flujo unificado
3. **Calidad:** Elementos cognitivos más ricos y precisos
4. **Estandarización:** Referencias culturales consistentes
5. **Escalabilidad:** Funciona con transcripciones de cualquier tamaño
6. **Micelio Mejorado:** Trabaja sobre datos completos y precisos

---

## 📝 Notas de Implementación

- Usar `deepseek-reasoner` para todo el procesamiento
- Mantener logs detallados de cada chunk procesado
- Implementar retry logic para llamadas a DeepSeek
- Considerar caché de chunks ya procesados
- UI debe mostrar progreso chunk por chunk
- Validar formato JSON de respuestas de DeepSeek
