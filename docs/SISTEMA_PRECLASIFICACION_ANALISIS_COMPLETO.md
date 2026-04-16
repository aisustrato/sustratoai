# 📋 Sistema de Preclasificación de Artículos - Análisis Completo

**Fecha:** 10 de marzo de 2026  
**Estado:** Documentación técnica completa del flujo iterativo

---

## 🎯 Propósito del Sistema

El sistema de preclasificación permite a investigadores revisar y clasificar artículos académicos según dimensiones predefinidas, con un flujo iterativo que combina clasificación automática por IA y validación/corrección humana.

---

## 📊 Arquitectura de Datos

### Estados del Lote (`batch_preclass_status`)

```typescript
type BatchStatus = 
  | 'pending'                    // Lote creado, sin traducir
  | 'translated'                 // Traducido, listo para preclasificar
  | 'review_pending'             // Preclasificado por IA, esperando revisión humana
  | 'reconciliation_pending'     // Hay desacuerdos, esperando reconciliación
  | 'validated'                  // Aprobado en iteración 1
  | 'reconciled'                 // Reconciliado en iteración 3
  | 'disputed'                   // Enviado a arbitraje superior
```

### Estados de Dimensión Individual (`status` en `article_dimension_reviews`)

```typescript
type DimensionStatus = 
  | 'pending'                    // Sin revisar
  | 'review_pending'             // Esperando revisión humana
  | 'reconciliation_pending'     // Esperando reconciliación (iter 2 o 3)
  | 'validated'                  // ✅ Aprobado en iteración 1
  | 'reconciled'                 // 🎯 Reconciliado en iteración 3
  | 'disputed'                   // ⚡ Enviado a arbitraje
```

---

## 🔄 Flujo Iterativo Completo

### **Iteración 1: Clasificación Inicial por IA**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario inicia preclasificación desde UI            │
│    - Lote en estado 'translated'                       │
│    - Click en botón "Iniciar Preclasificación con IA" │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. PreclassificationJobHandler ejecuta trabajo         │
│    - Llama a Gemini 2.5 Pro por cada artículo         │
│    - Analiza título, abstract, año, revista            │
│    - Clasifica según dimensiones del proyecto          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Se crean reviews en BD                              │
│    - reviewer_type: 'ai'                               │
│    - iteration: 1                                      │
│    - status: 'review_pending'                          │
│    - value: clasificación de la IA                     │
│    - confidence: 1-3 (Baja/Media/Alta)                 │
│    - rationale: justificación de la IA                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Lote cambia a estado 'review_pending'               │
│    - Usuario puede revisar las clasificaciones         │
└─────────────────────────────────────────────────────────┘
```

### **Iteración 1: Revisión Humana**

```
┌─────────────────────────────────────────────────────────┐
│ Usuario revisa cada dimensión de cada artículo:        │
│                                                         │
│ OPCIÓN A: APROBAR (✅)                                  │
│   - Click en botón Check verde                        │
│   - status cambia a 'validated'                        │
│   - Dimensión queda en color SUCCESS (verde)           │
│   - UI muestra estado "aprobado"                       │
│                                                         │
│ OPCIÓN B: DESACUERDO (👎)                              │
│   - Click en botón ThumbsDown amarillo                 │
│   - Abre modal "Desacuerdo del Investigador"          │
│   - Usuario ingresa:                                   │
│     * Nueva clasificación                              │
│     * Nivel de confianza (Alta/Media/Baja)            │
│     * Justificación                                    │
│   - Se crea nueva review:                              │
│     * reviewer_type: 'human'                           │
│     * iteration: 2                                     │
│     * status: 'reconciliation_pending'                 │
│   - Dimensión queda en color WARNING (amarillo)        │
└─────────────────────────────────────────────────────────┘
```

### **Iteración 2: Estado de Desacuerdo**

```
┌─────────────────────────────────────────────────────────┐
│ Cuando hay desacuerdos (iter 1 AI + iter 2 humano):   │
│                                                         │
│ - Lote cambia a 'reconciliation_pending'               │
│ - Aparece botón "Revisar Discrepancias con IA (N)"    │
│ - Dimensiones en desacuerdo:                           │
│   * Color: WARNING (amarillo)                          │
│   * Quipu muestra iteración 2                          │
│   * Botones de aprobar/rechazar visibles               │
└─────────────────────────────────────────────────────────┘
```

### **Iteración 3: Reconciliación por IA**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario click en "Revisar Discrepancias con IA"    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. ReconciliationJobHandler procesa discrepancias      │
│    - Por cada discrepancia:                            │
│      * Obtiene iter 1 (IA) e iter 2 (humano)          │
│      * Construye prompt neutral presentando ambas      │
│      * IA puede: mantener su postura, adoptar la      │
│        del humano, o proponer tercera opción          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Se crean reviews de iteración 3                     │
│    - reviewer_type: 'ai'                               │
│    - iteration: 3                                      │
│    - status: 'reconciliation_pending'                  │
│    - value: decisión de reconciliación                 │
│    - Dimensión cambia a color ACCENT (púrpura)         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Usuario revisa reconciliación:                      │
│                                                         │
│ OPCIÓN A: APROBAR RECONCILIACIÓN (✅)                   │
│   - Click en botón Check verde                        │
│   - status cambia a 'reconciled'                       │
│   - Color: PRIMARY (azul)                              │
│                                                         │
│ OPCIÓN B: RECHAZAR → ARBITRAJE (👎)                    │
│   - Click en botón ThumbsDown rojo                     │
│   - status cambia a 'disputed'                         │
│   - Color: DANGER (rojo)                               │
│   - Dimensión marcada para arbitraje superior          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Sistema de Colores por Estado

### Jerarquía de Criticidad (de más a menos crítico)

```typescript
const COLOR_CRITICALITY_RANK = {
  danger: 6,    // 🔴 Disputado (arbitraje) - ROJO
  warning: 5,   // 🟡 Desacuerdo iter 2 - AMARILLO
  accent: 4,    // 🟣 Reconciliación pendiente iter 3 - PÚRPURA
  primary: 3,   // 🔵 Reconciliado iter 3 - AZUL
  neutral: 2,   // ⚪ Sin revisar - GRIS
  success: 1    // 🟢 Validado iter 1 - VERDE
}
```

### Mapeo Status → Color

| Status | Iteración | Color | Emoticon | Significado |
|--------|-----------|-------|----------|-------------|
| `pending` | - | neutral | ⏳ | Sin clasificar |
| `review_pending` | 1 | neutral | 🔔 | Esperando revisión humana |
| `validated` | 1 | success | ✅ | Aprobado en iter 1 |
| `reconciliation_pending` | 2 | warning | 🔄 | Desacuerdo humano |
| `reconciliation_pending` | 3 | accent | 🟣 | Esperando decisión sobre reconciliación |
| `reconciled` | 3 | primary | 🎯 | Reconciliado y aprobado |
| `disputed` | 3 | danger | ⚡ | Enviado a arbitraje |

### Color del Artículo Completo

El artículo (tarjeta completa) toma el color del **estado más crítico** de todas sus dimensiones:

```typescript
// Ejemplo: Si un artículo tiene:
// - 3 dimensiones validated (verde)
// - 1 dimensión disputed (rojo)
// - 2 dimensiones reconciled (azul)
//
// → El artículo completo será ROJO (danger)
// porque 'disputed' es el más crítico
```

---

## 🔒 Sistema de Finalización de Lotes

### Condiciones para Finalizar un Lote

Un lote puede cerrarse **SOLO SI**:

1. **Iteración 1**: Todas las dimensiones están en `validated` (verde)
2. **Iteración 3**: Todas las dimensiones están en `reconciled` (azul) o `disputed` (rojo)

**NO puede haber:**
- Dimensiones en iteración 2 (estado incompleto)
- Dimensiones sin decisión en iteración 3

### Proceso de Finalización

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario click en "Finalizar Lote"                   │
│    - Botón solo habilitado si pasa validación         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Diálogo de confirmación (colorScheme: danger)       │
│    - Advierte que es IRREVERSIBLE                      │
│    - Usuario debe confirmar explícitamente             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Backend marca todas las reviews                     │
│    - is_final = true (para TODAS las reviews)         │
│    - Actualiza status del lote según resultado:        │
│      * Si hay disputed → lote = 'disputed'            │
│      * Si hay reconciled → lote = 'reconciled'        │
│      * Si solo validated → lote = 'validated'         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. UI actualiza automáticamente                        │
│    - Título muestra "🔒 (CERRADO)"                     │
│    - Botón "Finalizar Lote" desaparece                 │
│    - Botones de aprobar/rechazar NO se renderizan      │
│    - Lote es inmutable                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes Principales

### 1. **Página de Lista de Lotes** (`/articulos/preclasificacion/page.tsx`)

**Responsabilidades:**
- Mostrar lotes asignados al usuario en StandardSphereGrid
- Visualizar resumen agregado en StandardPieChart
- Detectar cambios de estado en tiempo real (Supabase Realtime)
- Aplicar efecto shimmer a esferas que cambiaron de estado
- Diferenciar lotes cerrados (subtle) vs abiertos (filled)

**Estados clave:**
```typescript
- batches: BatchWithCounts[]           // Lotes del usuario
- selectedSphereId: string | null      // Lote seleccionado
- spheresWithShimmer: Set<string>      // Lotes con cambio reciente
- previousBatchStates: Map<string, string> // Para detectar cambios
```

**Flujo de interacción:**
```typescript
handleSphereClick(batch) {
  if (batch.status === 'pending') 
    → Iniciar Traducción
  
  if (batch.status === 'translated') 
    → Iniciar Preclasificación
  
  else 
    → Navegar a detalle del lote
}
```

### 2. **Página de Detalle de Lote** (`/articulos/preclasificacion/[batchId]/page.tsx`)

**Responsabilidades:**
- Cargar detalles completos del lote (artículos + clasificaciones)
- Gestionar estado de notas y grupos por artículo
- Detectar discrepancias (iter 1 + iter 2 sin iter 3)
- Validar condiciones para finalizar lote
- Detectar si lote está cerrado (is_final = true en todas las reviews)
- Coordinar acciones globales (aprobar todo, resetear todo)

**Estados clave:**
```typescript
- batchDetails: BatchDetails | null
- notesPresenceByItemId: Record<string, boolean>
- groupsPresenceByItemId: Record<string, boolean>
- showOriginalAsPrimary: boolean
- compactView: boolean
- allMarked: boolean
- isBulkPersisting: boolean
```

**Memos importantes:**
```typescript
// Detectar discrepancias
discrepancies = useMemo(() => {
  // Busca dimensiones con iter 1 (AI) + iter 2 (humano) sin iter 3
}, [batchDetails?.rows])

// Validar si puede finalizar
batchFinalizationValidation = useMemo(() => {
  // Verifica que no haya iter 2 incompletas
  // Verifica que iter 1 estén validated
  // Verifica que iter 3 estén reconciled o disputed
}, [batchDetails?.rows])

// Detectar si está cerrado
isBatchClosed = useMemo(() => {
  // Cuenta reviews con is_final = true
  // Retorna true solo si 100% están finalizadas
}, [batchDetails?.rows])
```

### 3. **TableLikeView** (`components/TableLikeView.tsx`)

**Responsabilidades:**
- Renderizar artículos como tarjetas (StandardCard)
- Mostrar dimensiones en grid horizontal scrolleable
- Gestionar estado UI de aprobación/rechazo por dimensión
- Persistir cambios en backend
- Aplicar colores según estado de dimensión
- Ocultar botones de acción si dimensión está finalizada

**Estados clave:**
```typescript
- dimensionStatusByArticle: Record<string, Record<string, 'none' | 'approved' | 'rejected'>>
- disagreementOpen: boolean
- selectedArticle: TableLikeViewArticle | null
- selectedDimId: string | null
```

**Funciones críticas:**
```typescript
// Determinar color de dimensión según reviews
getDimensionColorScheme(reviews: ClassificationReview[]): DimensionColorScheme

// Determinar color de artículo (más crítico de sus dimensiones)
getArticleColorScheme(dimensionColors: DimensionColorScheme[]): DimensionColorScheme

// Persistir cambio de status
setAndPersistDimensionStatus(articleId, dimId, status, maxIteration)

// Handlers de botones
handleApproveClick(articleId, dimId, isApproved, maxIteration)
handleDisagreementClick(article, dimId, maxIteration)
```

**Lógica de botones según iteración:**
```typescript
// ITER 1-2: Aprobar → validated, Rechazar → abre modal
if (maxIteration < 3) {
  aprobar → status = 'validated'
  rechazar → abre HumanDisagreementModal → crea iter 2
}

// ITER 3+: Aprobar → reconciled, Rechazar → disputed
if (maxIteration >= 3) {
  aprobar → status = 'reconciled'
  rechazar → status = 'disputed' (arbitraje directo, sin modal)
}
```

### 4. **DimensionDisplay** (`components/DimensionDisplay.tsx`)

**Responsabilidades:**
- Mostrar clasificación de una dimensión
- Resolver emoticon desde mapa de opciones
- Mostrar badge de confianza con color
- Mostrar rationale en tooltip si existe

**Props:**
```typescript
interface DimensionDisplayProps {
  dimensionName: string
  review: ClassificationReview | undefined
  dimensionIcon?: string | null
  optionEmoticons?: Record<string, string | null>
  variant?: 'default' | 'card'
}
```

### 5. **HumanDisagreementModal** (dentro de TableLikeView)

**Responsabilidades:**
- Capturar desacuerdo humano en iter 1-2
- Mostrar valor previo de la IA
- Permitir selección de nueva clasificación
- Capturar nivel de confianza y justificación
- Diferenciar entre "Desacuerdo" (iter 2) y "Arbitraje" (iter 3+)

**Campos del formulario:**
```typescript
- value: string                    // Nueva clasificación
- confidence: '1' | '2' | '3'     // Baja/Media/Alta
- rationale: string               // Justificación
```

---

## 🔄 Flujo de Datos en Tiempo Real

### Suscripciones Supabase Realtime

**En página de lista:**
```typescript
// Canal: realtime-lotes-de-trabajo
// Tabla: article_batches
// Evento: UPDATE
// → Recarga todos los lotes cuando alguno cambia
```

**En página de detalle:**
```typescript
// Canal 1: batch-{batchId}
// Tabla: article_batches
// Evento: *
// → Actualiza metadatos del lote (status, name, batch_number)

// Canal 2: reviews-{batchId}
// Tabla: article_dimension_reviews
// Evento: INSERT, UPDATE
// → Actualiza clasificaciones en tiempo real sin recargar página
```

### Eventos Personalizados

```typescript
// Emitido por JobHandlers al completar trabajos
window.dispatchEvent(new CustomEvent('batch-updated', {
  detail: { batchId }
}))

// Escuchado en página de lista para refrescar
window.addEventListener('batch-updated', handleBatchUpdate)
```

---

## 🎯 Indicadores Visuales Clave

### StandardQuipuIndicator

Muestra el estado de una dimensión con color y número de iteración:

```typescript
<StandardQuipuIndicator 
  status={effectiveQuipuStatus}  // 'pending' | 'validated' | 'reconciled' | 'disputed'
  iteration={latestIteration}    // 1, 2, 3, etc.
  size="md"
/>
```

**Colores del Quipu:**
- `pending` → neutral (gris)
- `validated` → success (verde)
- `reconciliation_pending` → warning/accent (amarillo/púrpura según iter)
- `reconciled` → primary (azul)
- `disputed` → danger (rojo)

### StandardBadge "Listo"

Aparece cuando todas las dimensiones de un artículo están aprobadas:

```typescript
{allApproved && (
  <StandardBadge size="xs" colorScheme="success" styleType="subtle">
    Listo
  </StandardBadge>
)}
```

---

## 🔐 Permisos y Seguridad

### Permisos Requeridos

```typescript
export const PERMISOS = {
  GESTIONAR_PRECLASIFICACION: "can_create_batches",
  GESTIONAR_DATOS_MAESTROS: "can_manage_master_data"
} as const
```

### RLS (Row Level Security)

- Los lotes solo son visibles para el usuario asignado (`assigned_to`)
- Las reviews se filtran por `article_batch_item_id` del lote
- Las notas se filtran por `article_id` y permisos del proyecto

---

## 📡 API Endpoints

### `/api/preclassification/batch-details` (POST)

**Payload:**
```typescript
{ batchId: string }
```

**Response:**
```typescript
{
  data: {
    columns: DimensionColumn[]
    rows: ArticleForReview[]
    batch_number: number
    id: string
    name: string | null
    status: batch_preclass_status
  }
}
```

### `/api/preclassification/reviews/update-status` (POST)

**Payload:**
```typescript
{
  articleBatchItemId: string
  dimensionId: string
  status: 'validated' | 'reconciled' | 'disputed' | 'review_pending'
}
```

### `/api/preclassification/reviews/human` (POST)

**Payload:**
```typescript
{
  article_batch_item_id: string
  dimension_id: string
  human_value: string
  human_confidence: number
  human_rationale: string
  human_option_id?: string | null
}
```

### `/api/preclassification/batches/finalize` (POST)

**Payload:**
```typescript
{ batchId: string }
```

**Response:**
```typescript
{
  success: true
  data: {
    finalStatus: 'validated' | 'reconciled' | 'disputed'
    updatedCount: number
    stats: { ... }
  }
}
```

---

## 🐛 Problemas Reportados por el Usuario

### 1. **Parpadeos extraños al pasar el mouse sobre las cajas**

**Posible causa:**
- Re-renders innecesarios en `StandardCard` de dimensiones
- Efectos hover conflictivos entre tarjeta padre y tarjeta hija
- Transiciones CSS mal configuradas en `group-hover/DimCard`

**Ubicación del código:**
```typescript
// TableLikeView.tsx líneas 700-770
<StandardCard
  className="h-full relative group/DimCard"
  colorScheme={dimColor}
  styleType={isApproved || isRejected ? 'filled' : 'subtle'}
  // ... efectos hover en botones línea 724
  className="... opacity-0 transition-opacity duration-150 group-hover/DimCard:opacity-100 ..."
>
```

### 2. **Botones de aprobar/rechazar no se renderizan sobre las tarjetas de dimensiones**

**Posible causa:**
- Condición `{!isFinal && (...)}` está evaluando incorrectamente
- Z-index insuficiente en botones (actualmente `z-20`)
- Overflow o clip-path en StandardCard padre cortando los botones
- Problema de layout con `absolute top-2 right-2`

**Ubicación del código:**
```typescript
// TableLikeView.tsx líneas 722-750
{!isFinal && (
  <div className="absolute top-2 right-2 z-20 opacity-0 transition-opacity duration-150 group-hover/DimCard:opacity-100 flex items-center gap-1">
    <StandardButton ... />
    <StandardButton ... />
  </div>
)}
```

---

## 🔍 Próximos Pasos de Diagnóstico

1. **Verificar logs de console** para detectar re-renders excesivos
2. **Inspeccionar DOM** con DevTools para ver si botones están presentes pero ocultos
3. **Revisar CSS de StandardCard** para overflow/clip-path
4. **Analizar dependencias de useMemo/useCallback** que puedan causar re-renders
5. **Verificar lógica de `isFinal`** con datos reales

---

## 📚 Referencias Técnicas

- **Tipos:** `/lib/types/preclassification-types.ts`
- **Acciones:** `/lib/actions/preclassification-actions.ts`
- **Componentes:**
  - `/app/articulos/preclasificacion/page.tsx`
  - `/app/articulos/preclasificacion/[batchId]/page.tsx`
  - `/app/articulos/preclasificacion/[batchId]/components/TableLikeView.tsx`
  - `/app/articulos/preclasificacion/[batchId]/components/DimensionDisplay.tsx`
- **Handlers de Jobs:**
  - `/components/jobs/PreclassificationJobHandler.tsx`
  - `/components/jobs/ReconciliationJobHandler.tsx`
  - `/components/jobs/TranslationJobHandler.tsx`

---

**Fin del documento de análisis**
