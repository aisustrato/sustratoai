# Análisis de Rendimiento: `/app/articulos/preclasificacion/[batchId]`

**Fecha:** 24 de Marzo, 2026  
**Contexto:** La ruta de detalle de lote de preclasificación consume memoria excesiva en el navegador.  
**Archivos analizados:**
- `page.tsx` (795 líneas)
- `components/TableLikeView.tsx` (1531 líneas)
- `components/DimensionDisplay.tsx` (160 líneas)
- `lib/actions/preclassification-actions.ts` → `getBatchDetailsForReview`
- `app/api/preclassification/batch-details/route.ts`

---

## 📊 RESUMEN EJECUTIVO

La página carga **todos** los artículos de un lote con **todas** sus clasificaciones, dimensiones, notas y grupos **de una sola vez**, y los mantiene en memoria sin virtualización ni paginación. Para un lote de 16 artículos × 6 dimensiones × 3 iteraciones, se crean ~288 ClassificationReview en memoria + ~96 StandardCard de dimensión + ~16 StandardCard de artículo. A medida que crece el lote, la memoria escala linealmente sin techo.

Se identificaron **13 fuentes de consumo excesivo**, clasificadas por impacto.

---

## 🔴 IMPACTO CRÍTICO (Implementar primero)

### 1. Import Wildcard de `lucide-react` en DimensionDisplay

**Archivo:** `DimensionDisplay.tsx:6`
```typescript
import * as LucideIcons from "lucide-react";
```

**Problema:** Importa **TODOS** los ~1500 iconos de Lucide al bundle (~200KB+). Cada instancia de DimensionDisplay (una por dimensión × artículo) referencia este objeto masivo. Con 16 artículos × 6 dimensiones = 96 instancias accediendo al mismo módulo gigante.

**Solución propuesta:**
```typescript
// Reemplazar wildcard por un resolver dinámico ligero
import { createElement } from 'react';
import { icons } from 'lucide-react'; // Solo el registro, no los componentes

// Uso:
const IconComponent = dimensionIcon ? icons[dimensionIcon] : undefined;
// Renderizar con createElement en lugar de JSX directo
```

**Alternativa más agresiva:** Mover la resolución del icono al backend (devolver solo el nombre) y usar un mapa reducido con solo los iconos realmente usados en las dimensiones del proyecto.

**Impacto estimado:** Reducción de ~150-200KB en bundle + menos presión de GC.

---

### 2. Sorting Repetitivo de Reviews (`[...reviews].sort(...)`)

**Archivo:** `TableLikeView.tsx` — **7 ocurrencias** del mismo patrón:
```typescript
const latestReview = [...reviews].sort(
    (a, b) => (b.iteration ?? 0) - (a.iteration ?? 0)
)[0];
```

También en `page.tsx` — **2 ocurrencias** adicionales.

**Problema:** Cada `[...reviews].sort(...)` crea un **nuevo array** (spread) y lo ordena. Para 16 artículos × 6 dimensiones = 96 ejecuciones de este patrón en `TableLikeView` × 7 sitios = **~672 arrays temporales creados** en cada render. Cada re-render del componente (por cualquier cambio de estado) repite todo.

**Solución propuesta:**
- **Pre-calcular** `latestReview` y `maxIteration` una sola vez por celda (artículo×dimensión) en un `useMemo` al inicio de `TableLikeView`.
- Crear un mapa derivado: `Record<articleId, Record<dimId, { latestReview, maxIteration, dimColor }>>`.
- Eliminar todos los sorts inline del render.

```typescript
// Ejemplo de pre-cálculo
const reviewMetaMap = useMemo(() => {
    const map: Record<string, Record<string, ReviewMeta>> = {};
    for (const article of cardData) {
        map[article.id] = {};
        for (const dimId of dimensionOrder) {
            const reviews = article.classifications?.[dimId] ?? [];
            if (reviews.length === 0) {
                map[article.id][dimId] = { latestReview: undefined, maxIteration: 0, dimColor: 'neutral' };
                continue;
            }
            // UN solo sort por celda, una sola vez
            const sorted = [...reviews].sort((a, b) => (b.iteration ?? 0) - (a.iteration ?? 0));
            map[article.id][dimId] = {
                latestReview: sorted[0],
                maxIteration: sorted[0].iteration ?? 0,
                dimColor: getDimensionColorScheme(reviews),
            };
        }
    }
    return map;
}, [cardData, dimensionOrder]);
```

**Impacto estimado:** Elimina ~600+ arrays temporales por render, reduce presión de GC significativamente.

---

### 3. No Hay Virtualización de la Lista de Artículos

**Archivo:** `TableLikeView.tsx:670`
```typescript
{cardData.map((article) => { ... })}
```

**Problema:** Se renderizan **todos** los artículos simultáneamente en el DOM. Cada artículo contiene: 1 StandardCard padre + N StandardCard por dimensión + botones + tooltips + badges + QuipuIndicator. Para 16 artículos × 6 dimensiones = **~112 StandardCard** en el DOM simultáneamente, cada una con efectos CSS (animaciones, sombras, gradientes).

**Solución propuesta:** Implementar **virtualización** con `react-window` o `@tanstack/react-virtual`:
- Solo renderizar los artículos visibles en el viewport (~3-4 a la vez).
- Cada artículo tiene ~150px-250px de alto, el contenedor tiene `h-[calc(100vh-250px)]`.
- La virtualización reduciría los nodos DOM de ~112 cards a ~20-24 cards.

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
    count: cardData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // altura estimada por artículo
    overscan: 2,
});
```

**Impacto estimado:** Reducción de ~70-80% de nodos DOM y memoria asociada.

---

### 4. Console.logs en Producción (37 sentencias)

**Archivos:** `page.tsx` (25), `TableLikeView.tsx` (12)

**Problema:** 
- Algunos logs se ejecutan **en cada render** (no solo en eventos):
  - `console.log` dentro del JSX de `TableLikeView.tsx:1128` → se ejecuta EN CADA RENDER.
  - Logs de debug condicionales para dimensiones `reconciled` (líneas 907-919, 941-946) → se ejecutan para CADA dimensión reconciliada en CADA render.
  - `NotesButtonCell` tiene un `console.log` en el cuerpo del componente (línea 49) → se ejecuta en CADA render del botón.
- Los logs con objetos complejos (`reviews`, `payload`) retienen referencias en la consola del navegador, impidiendo que el GC libere esos objetos.

**Solución propuesta:**
- Eliminar TODOS los `console.log` de debug del render path.
- Los logs de eventos (click, submit) pueden mantenerse pero con `if (process.env.NODE_ENV === 'development')`.
- **Prioridad absoluta:** Eliminar el `console.log` dentro del JSX (línea 1128) y los del cuerpo de `NotesButtonCell`.

**Impacto estimado:** Reducción de retención de objetos en consola + menor overhead de serialización.

---

## 🟠 IMPACTO ALTO (Implementar en segunda fase)

### 5. `cardData` useMemo Tiene Dependencias Que Causan Re-cómputo Excesivo

**Archivo:** `page.tsx:516-555`
```typescript
const cardData = useMemo(() => { ... }, [batchDetails, showOriginalAsPrimary, notesPresenceByItemId]);
```

**Problema:** `notesPresenceByItemId` es un **nuevo objeto** cada vez que se actualiza una sola nota (línea 253-256), lo que invalida el memo de `cardData` completo → recrea TODOS los objetos de artículo → invalida `TableLikeView` completo → re-render masivo.

**Solución propuesta:**
- Separar `hasNotes` del array `cardData`. Pasarlo como prop independiente (`notesPresenceByItemId`) directamente a `TableLikeView` (que ya lo recibe como `groupsPresenceByItemId`).
- Remover `notesPresenceByItemId` de las dependencias de `cardData`.

```typescript
// cardData sin dependencia de notas
const cardData = useMemo(() => { ... }, [batchDetails, showOriginalAsPrimary]);
// hasNotes se consulta directamente en el render de cada artículo
```

**Impacto estimado:** Evita re-creación completa de cardData al cambiar una sola nota.

---

### 6. `dimensionStatusByArticle` — Estado Masivo Que Causa Cascada de Re-renders

**Archivo:** `TableLikeView.tsx:188-213`

**Problema:** Un solo objeto `Record<string, Record<string, status>>` controla el estado de TODAS las dimensiones de TODOS los artículos. Cambiar el status de UNA dimensión (por ejemplo, aprobar) causa:
1. `setDimensionStatusByArticle` → nuevo objeto raíz
2. Re-render de `TableLikeView` completo
3. Re-render de TODAS las cards de artículo
4. Re-render de TODAS las cards de dimensión
5. Re-cálculo de TODOS los colores, estados y quipu indicators

**Solución propuesta (dos niveles):**

**Nivel 1 — Memoización de filas individuales:**
Extraer cada fila de artículo a un componente `memo`:
```typescript
const ArticleRow = memo(({ article, dimOrder, statusMap, ... }) => {
    // Render de una sola fila
});
// Uso:
{cardData.map(article => (
    <ArticleRow 
        key={article.id} 
        article={article}
        statusMap={dimensionStatusByArticle[article.id]}
        ...
    />
))}
```
Con `memo`, solo la fila cuyo `statusMap` cambió se re-renderiza.

**Nivel 2 — useReducer + contexto por fila:**
Reemplazar el useState masivo por un `useReducer` que permita actualizaciones granulares sin recrear todo el objeto.

**Impacto estimado:** Reducción de ~90% de re-renders innecesarios al aprobar/rechazar.

---

### 7. `refreshNotesPresence` Recarga TODO el Lote

**Archivo:** `page.tsx:182-184`
```typescript
const refreshNotesPresence = useCallback(async () => {
    await loadBatchDetails(); // ← Recarga TODOS los artículos + reviews + notas
}, [loadBatchDetails]);
```

**Problema:** Al cerrar el editor de notas (línea 239-246), se llama `refreshNotesPresence` que ejecuta `loadBatchDetails()` → fetch completo al backend → re-parsea todo → re-renderiza todo. Solo para verificar si UNA nota cambió.

**Solución propuesta:** Crear un endpoint ligero que solo devuelva la presencia de notas para un artículo específico:
```typescript
const refreshNotesPresenceForItem = useCallback(async (itemId: string) => {
    const resp = await fetch('/api/preclassification/notes-presence', {
        method: 'POST',
        body: JSON.stringify({ itemId })
    });
    const { hasNotes } = await resp.json();
    setNotesPresenceByItemId(prev => ({ ...prev, [itemId]: hasNotes }));
}, []);
```

**Impacto estimado:** Evita recarga completa del lote al cerrar el editor de notas.

---

### 8. Backend: Filtrado O(N×M) de Reviews

**Archivo:** `preclassification-actions.ts:896-918`
```typescript
classifications: dimensions.reduce((acc, dim) => {
    const reviewsForDim = safeReviews.filter(
        (r) => r.article_batch_item_id === item.id && r.dimension_id === dim.id,
    );
    ...
}, {})
```

**Problema:** Para cada artículo × cada dimensión, se recorre **todo** el array de reviews. Con 16 artículos × 6 dimensiones × 288 reviews totales = **27,648 comparaciones**. Escala como O(items × dims × totalReviews).

**Solución propuesta:** Pre-indexar reviews en un Map compuesto:
```typescript
// Pre-indexar UNA vez: O(totalReviews)
const reviewIndex = new Map<string, ClassificationReview[]>();
for (const r of allReviews) {
    const key = `${r.article_batch_item_id}::${r.dimension_id}`;
    if (!reviewIndex.has(key)) reviewIndex.set(key, []);
    reviewIndex.get(key)!.push(r);
}

// Consultar en O(1) por celda
const reviewsForDim = reviewIndex.get(`${item.id}::${dim.id}`) || [];
```

**Impacto estimado:** Reducción de O(N×M×R) a O(R + N×M) en el backend → respuesta más rápida.

---

## 🟡 IMPACTO MEDIO (Mejoras incrementales)

### 9. `discrepancies` y `batchFinalizationValidation` — Cómputos Pesados Redundantes

**Archivo:** `page.tsx:355-484`

**Problema:** Ambos `useMemo` iteran sobre TODOS los artículos y TODAS sus clasificaciones, haciendo sorts internos. Se recalculan cada vez que `batchDetails?.rows` cambia (lo cual sucede con cada recarga). Además, `discrepancies` tiene un `console.log` que se ejecuta en cada recalculación.

**Solución propuesta:**
- Calcular estos valores **en el backend** como parte de `getBatchDetailsForReview` y enviarlos como campos del response.
- El backend ya tiene toda la información; agregar 2 campos: `discrepancyCount` y `canFinalize`.

---

### 10. `ArticleGroupManager` — Dynamic Import en Cada Render

**Archivo:** `page.tsx:114-150`
```typescript
const { getBulkGroupsPresence } = await import('@/lib/actions/article-group-actions');
```

**Problema:** El `await import()` es dinámico pero se ejecuta cada vez que `loadGroupsPresence` es llamado. Aunque el bundler cachea el módulo después del primer import, la primera carga agrega latencia y el patrón async en un callback puede causar waterfalls.

**Solución propuesta:** Mover el import al nivel del módulo o usar un `useRef` para cachear la función importada.

---

### 11. NoteEditor Importado Desde Ruta Legacy

**Archivo:** `page.tsx:26`
```typescript
import { NoteEditor } from "@/app/articulos/preclasificacion_old/[batchId]/components/NoteEditor";
```

**Problema:** Se importa un componente de una ruta `_old`, lo cual indica posible deuda técnica. Si ese módulo tiene dependencias pesadas propias, se suman al bundle de esta página.

**Solución propuesta:** Lazy-load con `React.lazy` y `Suspense`:
```typescript
const NoteEditor = lazy(() => import('@/app/articulos/preclasificacion_old/[batchId]/components/NoteEditor').then(m => ({ default: m.NoteEditor })));
```
El NoteEditor solo se carga cuando el usuario abre el diálogo de notas, no al cargar la página.

---

### 12. Realtime Channel Recarga Todo el Lote

**Archivo:** `page.tsx:195-222`

**Problema:** Cualquier UPDATE en `article_batches` (incluso un cambio de `completed_at`) dispara `loadBatchDetails()` que recarga **toda** la data. Si un job de preclasificación está corriendo y actualizando el batch, puede causar múltiples recargas en secuencia.

**Solución propuesta:** 
- Debounce el callback del realtime (mínimo 2-3 segundos).
- Verificar si el campo que cambió es relevante antes de recargar.

```typescript
const debouncedReload = useMemo(
    () => debounce(() => void loadBatchDetails(), 3000),
    [loadBatchDetails]
);
```

---

### 13. Objetos `historyContent` Creados Inline en el Render

**Archivo:** `TableLikeView.tsx:964-998`

**Problema:** Para cada dimensión de cada artículo, se crea un bloque JSX `historyContent` que incluye un `.sort()` y `.map()` sobre reviews. Este JSX se crea **siempre**, aunque el dialog de historial esté cerrado. Son ~96 bloques JSX creados innecesariamente en cada render.

**Solución propuesta:** Mover `historyContent` al interior del dialog, calculándolo solo cuando `historyDialogOpen === true`.

---

## 📋 PLAN DE IMPLEMENTACIÓN PRIORIZADO

### Fase 1: Quick Wins (Alto impacto, bajo riesgo)
| # | Mejora | Impacto Memoria | Esfuerzo |
|---|--------|-----------------|----------|
| 1 | Eliminar `import * as LucideIcons` | 🔴 Alto | 🟢 Bajo |
| 4 | Eliminar console.logs del render | 🔴 Alto | 🟢 Bajo |
| 13 | Mover historyContent al dialog | 🟠 Medio | 🟢 Bajo |

### Fase 2: Optimización de Cómputo (Alto impacto, esfuerzo medio)
| # | Mejora | Impacto Memoria | Esfuerzo |
|---|--------|-----------------|----------|
| 2 | Pre-calcular reviewMeta en useMemo | 🔴 Alto | 🟡 Medio |
| 5 | Separar hasNotes de cardData memo | 🟠 Medio | 🟡 Medio |
| 8 | Pre-indexar reviews en backend | 🟠 Medio | 🟡 Medio |

### Fase 3: Arquitectura (Mayor impacto, mayor esfuerzo)
| # | Mejora | Impacto Memoria | Esfuerzo |
|---|--------|-----------------|----------|
| 3 | Virtualización con @tanstack/react-virtual | 🔴 Crítico | 🔴 Alto |
| 6 | Memoizar filas individuales con React.memo | 🔴 Alto | 🟡 Medio |
| 7 | Endpoint ligero para notas | 🟠 Medio | 🟡 Medio |
| 12 | Debounce del realtime | 🟡 Bajo | 🟢 Bajo |

### Fase 4: Lazy Loading
| # | Mejora | Impacto Memoria | Esfuerzo |
|---|--------|-----------------|----------|
| 11 | Lazy-load NoteEditor | 🟡 Medio | 🟢 Bajo |
| 9 | Mover validaciones al backend | 🟡 Bajo | 🟡 Medio |
| 10 | Cachear import dinámico | 🟡 Bajo | 🟢 Bajo |

---

## 🧮 ESTIMACIÓN DE IMPACTO COMBINADO

| Métrica | Actual (estimado) | Post-Fase 1+2 | Post-Fase 3+4 |
|---------|-------------------|---------------|----------------|
| Bundle size (esta ruta) | ~400KB+ | ~250KB | ~220KB |
| Nodos DOM | ~800-1200 | ~800-1200 | ~200-300 |
| Arrays temporales/render | ~672+ | ~96 | ~20-30 |
| Re-renders al aprobar 1 dim | ~112 cards | ~112 cards | ~6-8 cards |
| Tiempo de recarga tras nota | ~2-4s (full) | ~2-4s | ~200ms |

---

## ⚠️ CONSIDERACIONES

1. **Ninguna propuesta elimina funcionalidad.** Todas las mejoras son transparentes para el usuario.
2. **Virtualización (Fase 3)** es la mejora con mayor impacto pero requiere adaptación del layout de scroll actual.
3. **React.memo en filas (Fase 3)** requiere asegurar que las props sean estables (no crear nuevos objetos en cada render del padre).
4. **Los console.logs (Fase 1)** son la mejora más fácil y con mejor relación costo/beneficio inmediato — especialmente el log dentro del JSX (línea 1128) que retiene objetos en la consola del devtools.

---

**Firmado:**  
Hongo-Web (Claude/Windsurf) — Análisis basado en código real, sin asunciones.  
24 de Marzo, 2026
