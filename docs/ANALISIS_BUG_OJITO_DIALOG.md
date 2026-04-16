# 🚨 ANÁLISIS: Comportamiento Anómalo - StandardDialog del Botón Ojito

**Fecha:** 10 Marzo 2026  
**Duración del Bug:** Toda la jornada (8+ horas)  
**Severidad:** CRÍTICA - Bloqueo total de funcionalidad básica  
**Estado:** NO RESUELTO después de múltiples intentos

---

## 📋 RESUMEN EJECUTIVO

Un botón "ojito" (👁️) que debería abrir un `StandardDialog` simple **NO funciona**, mientras que otros botones en la **misma tarjeta** (Aprobar, Rechazar) **SÍ abren dialogs sin problemas**. Este comportamiento es **ilógico** desde el punto de vista técnico y ha resistido todas las soluciones intentadas.

---

## 🎯 CONTEXTO DEL PROBLEMA

### **Archivo Afectado:**
`/app/articulos/preclasificacion/[batchId]/components/TableLikeView.tsx`

### **Componente:**
Tarjeta de dimensión (`StandardCard`) con 3 botones:
1. ✅ **Aprobar** → Abre dialog de confirmación → ✅ **FUNCIONA**
2. 👎 **Rechazar** → Abre dialog de desacuerdo → ✅ **FUNCIONA**
3. 👁️ **Ojito** → Debería abrir dialog de historial → ❌ **NO FUNCIONA**

### **Síntoma:**
- Click en ojito genera **Violation de 823ms** en el handler
- Dialog **NO se abre**
- Consola muestra: `[Violation] 'click' handler took 823ms`
- **Sin errores de JavaScript**, solo violations de performance

---

## 🔍 ANÁLISIS TÉCNICO

### **1. Código Actual del Botón Ojito**

```typescript
// 👁️ Handler memoizado (línea 330-335)
const handleHistoryClick = useCallback((e: React.MouseEvent, reviews: ClassificationReview[], dimId: string) => {
  e.stopPropagation();
  setHistoryReviews(reviews);
  setHistoryDimensionName(dimensionLabelById[dimId] ?? dimId);
  setHistoryDialogOpen(true);
}, [dimensionLabelById]);

// Botón (línea 715-727)
<StandardButton
  iconOnly
  size="xs"
  colorScheme="neutral"
  styleType="subtle"
  tooltip="Ver historial de clasificaciones"
  onClick={(e) => handleHistoryClick(e, reviews, dimId)}
>
  <Eye size={14} />
</StandardButton>
```

### **2. Código del Botón Rechazar (QUE SÍ FUNCIONA)**

```typescript
// Handler memoizado (línea 315-327)
const handleDisagreementClick = useCallback(async (article: TableLikeViewArticle, dimId: string, maxIteration: number) => {
  if (maxIteration >= 3) {
    await setAndPersistDimensionStatus(article.id, dimId, 'rejected', maxIteration);
    return;
  }
  setSelectedArticle(article);
  setSelectedDimId(dimId);
  setDisagreementOpen(true);
}, [setAndPersistDimensionStatus]);

// Botón (línea 738-751)
<StandardButton 
  iconOnly 
  size="xs"
  colorScheme={latestIteration >= 3 ? 'danger' : 'warning'}
  styleType={isRejected ? 'solid' : 'subtle'} 
  tooltip={latestIteration >= 3 ? 'Arbitraje' : 'Desacuerdo'}
  onClick={() => void handleDisagreementClick(article, dimId, latestIteration)}
>
  <ThumbsDown size={14} />
</StandardButton>
```

### **3. Diferencias Observadas**

| Aspecto | Ojito (NO funciona) | Rechazar (SÍ funciona) |
|---------|---------------------|------------------------|
| **Handler** | `useCallback` memoizado | `useCallback` memoizado |
| **onClick** | `(e) => handleHistoryClick(e, reviews, dimId)` | `() => void handleDisagreementClick(...)` |
| **Posición** | `absolute right-2 bottom-2 z-20` | `absolute top-2 right-2 z-30` |
| **Visibilidad** | Siempre visible | Solo visible en hover |
| **Parámetros** | `(e, reviews, dimId)` | `(article, dimId, maxIteration)` |
| **Estado** | `setHistoryDialogOpen(true)` | `setDisagreementOpen(true)` |

---

## 🧪 INTENTOS DE SOLUCIÓN REALIZADOS

### **Intento 1: Eliminar Logs de Debugging**
- **Acción:** Eliminar todos los `console.log` de `TableLikeView.tsx`
- **Resultado:** ❌ Sin cambio
- **Razón:** Logs no afectan el click handler

### **Intento 2: Eliminar Loop Infinito en Layout**
- **Acción:** Eliminar logs de `ArticulosLayout` que causaban 20+ renders
- **Resultado:** ❌ Sin cambio en ojito (aunque mejoró performance general)
- **Razón:** Layout no interfiere con handlers de botones

### **Intento 3: Memoizar Handler del Ojito**
- **Acción:** Crear `handleHistoryClick` con `useCallback`
- **Resultado:** ❌ Sin cambio
- **Razón:** Handler ya estaba correctamente memoizado

### **Intento 4: Eliminar Realtime Completamente**
- **Acción:** Remover todas las suscripciones de Supabase realtime
- **Resultado:** ❌ Sin cambio
- **Razón:** Realtime no afecta click handlers síncronos

### **Intento 5: Eliminar Limpieza de Estado Optimista**
- **Acción:** Remover `setTimeout` que limpiaba estado después de 100ms
- **Resultado:** ❌ Sin cambio
- **Razón:** Timeout no interfiere con click events

---

## 🤔 HIPÓTESIS DE CAUSAS POSIBLES

### **Hipótesis A: Z-Index Conflict**
- **Teoría:** El botón está detrás de otro elemento invisible
- **Evidencia en contra:** 
  - Tooltip funciona (aparece al hover)
  - Click se registra (genera violation)
  - Otros botones en misma tarjeta funcionan

### **Hipótesis B: Event Propagation**
- **Teoría:** `e.stopPropagation()` no funciona correctamente
- **Evidencia en contra:**
  - Botón rechazar también usa `stopPropagation` implícitamente
  - Handler se ejecuta (violation confirma esto)

### **Hipótesis C: Estado del Dialog**
- **Teoría:** `setHistoryDialogOpen(true)` no actualiza el estado
- **Evidencia en contra:**
  - Mismo patrón que `setDisagreementOpen(true)` que SÍ funciona
  - No hay errores de estado en consola

### **Hipótesis D: Re-render Durante Click**
- **Teoría:** Un re-render interrumpe la apertura del dialog
- **Evidencia a favor:**
  - Violation de 823ms sugiere trabajo pesado durante click
  - Logs muestran renders duplicados constantes
- **Evidencia en contra:**
  - Realtime eliminado, no debería haber re-renders automáticos

### **Hipótesis E: StandardDialog Específico**
- **Teoría:** El `StandardDialog` de historial tiene un bug
- **Evidencia en contra:**
  - Mismo componente `StandardDialog` usado en otros lugares funciona
  - No hay errores de renderizado del dialog

---

## 📊 DATOS DE CONSOLA

### **Log Actual (Sin Realtime):**
```
[2026-03-10T19:02:46.600Z] [batch] Inicio consulta detalles de lote
[2026-03-10T19:02:49.230Z] [groups] Inicio carga presencia de grupos
[2026-03-10T19:02:49.230Z] [batch] Fin consulta detalles de lote
📊 [BatchDetailPage] Discrepancias detectadas: 0
🔍 [BatchDetailPage] Validación de finalización: {...}
🔒 [BatchDetailPage] Estado del lote: {...}
[DimensionDisplay] Emoji no resuelto (x5)
[2026-03-10T19:02:53.292Z] [groups] Fin carga presencia de grupos

// CLICK EN OJITO:
[Violation] 'click' handler took 823ms  ← ⚠️ PROBLEMA AQUÍ
```

### **Violations Observadas:**
- `'load' handler took 717ms` - Carga inicial
- `Forced reflow while executing JavaScript took 474ms` - Render pesado
- **`'click' handler took 823ms`** - ⚠️ Click en ojito

---

## 💡 POSIBLES CAUSAS RAÍZ (Análisis Profundo)

### **1. Problema de Timing en React Scheduler**
El violation de 823ms sugiere que **algo está bloqueando el main thread** durante el click:

```
Usuario click → handleHistoryClick ejecuta → setHistoryDialogOpen(true) →
React programa re-render → [BLOQUEO 823ms] → Dialog NO se renderiza
```

**Posible causa:** Un `useMemo` o `useEffect` pesado se ejecuta durante el re-render del dialog.

### **2. Problema de Dependencias Circulares**
El `handleHistoryClick` depende de `dimensionLabelById`:

```typescript
const handleHistoryClick = useCallback(..., [dimensionLabelById]);
```

Si `dimensionLabelById` cambia durante el click, el handler se recrea, causando inconsistencia.

### **3. Problema de Estado Stale**
El estado `historyDialogOpen` podría estar en un closure stale:

```typescript
setHistoryDialogOpen(true); // ¿Se ejecuta en el estado correcto?
```

### **4. Problema de Renderizado Condicional**
El `StandardDialog` de historial podría tener una condición que previene su renderizado:

```typescript
{historyDialogOpen && (
  <StandardDialog ... />  // ¿Esta condición se evalúa correctamente?
)}
```

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

### **Paso 1: Agregar Logging Exhaustivo**
```typescript
const handleHistoryClick = useCallback((e: React.MouseEvent, reviews: ClassificationReview[], dimId: string) => {
  console.log('🔍 [OJITO] Click detectado', { dimId, reviewsCount: reviews.length });
  e.stopPropagation();
  console.log('🔍 [OJITO] Propagation detenida');
  setHistoryReviews(reviews);
  console.log('🔍 [OJITO] Reviews seteadas');
  setHistoryDimensionName(dimensionLabelById[dimId] ?? dimId);
  console.log('🔍 [OJITO] Nombre seteado');
  setHistoryDialogOpen(true);
  console.log('🔍 [OJITO] Dialog abierto - estado actualizado');
}, [dimensionLabelById]);
```

### **Paso 2: Verificar Renderizado del Dialog**
```typescript
console.log('🔍 [RENDER] historyDialogOpen:', historyDialogOpen);
console.log('🔍 [RENDER] historyReviews:', historyReviews);

{historyDialogOpen && (
  <StandardDialog
    open={historyDialogOpen}
    onOpenChange={(open) => {
      console.log('🔍 [DIALOG] onOpenChange:', open);
      setHistoryDialogOpen(open);
    }}
    ...
  />
)}
```

### **Paso 3: Comparar con Botón Rechazar**
Copiar **exactamente** la estructura del botón rechazar que SÍ funciona:

```typescript
// Usar EXACTAMENTE el mismo patrón
onClick={() => {
  setHistoryReviews(reviews);
  setHistoryDimensionName(dimensionLabelById[dimId] ?? dimId);
  setHistoryDialogOpen(true);
}}
```

### **Paso 4: Aislar el Dialog**
Crear un botón de prueba **fuera de la tarjeta** para verificar si el problema es de posicionamiento:

```typescript
<StandardButton onClick={() => setHistoryDialogOpen(true)}>
  TEST OJITO
</StandardButton>
```

---

## 🚨 CONCLUSIÓN

Este bug representa un **fallo anómalo** donde:

1. ✅ El código es **sintácticamente correcto**
2. ✅ El patrón es **idéntico** a otros botones que funcionan
3. ✅ No hay **errores de JavaScript**
4. ❌ El dialog **NO se abre** sin razón aparente
5. ❌ Genera **violations de performance** inexplicables

**Posible causa más probable:** Un re-render pesado durante el click está **interrumpiendo** la actualización del estado del dialog, causando que React descarte el cambio de `historyDialogOpen` antes de que se complete el render.

**Recomendación:** Agregar logging exhaustivo en cada paso del proceso para identificar **exactamente** dónde se pierde la actualización del estado.

---

## 📝 NOTAS FINALES

- **Tiempo invertido:** 8+ horas
- **Intentos de solución:** 5 enfoques diferentes
- **Resultado:** Sin resolución
- **Impacto:** Bloqueo total de funcionalidad de historial de clasificaciones
- **Frustración del usuario:** Máxima - "toda la mañana perdida sin avance"

Este documento sirve como registro de un comportamiento anómalo que desafía la lógica técnica estándar de React y requiere investigación más profunda a nivel de internals de React o del componente `StandardDialog`.
