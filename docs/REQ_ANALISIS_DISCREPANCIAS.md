# Requerimiento: Análisis de Discrepancias de Preclasificación

**Ruta:** `/articulos/analisis-discrepancias`
**Fecha:** 2026-04-08
**Estado:** En construcción
**Referencia:** Similar a `/articulos/analisis-preclasificacion`

---

## 🎯 Propósito

Página de análisis global que permite visualizar y navegar las **discrepancias** entre las iteraciones del proceso de preclasificación:
- **Iteración 1 (IA):** Clasificación automática inicial
- **Iteración 2 (Humano):** Corrección/validación del investigador
- **Iteración 3 (IA Reconciliación):** Re-evaluación de la IA considerando ambas posturas

El objetivo es entender **dónde, cómo y por qué** divergen las clasificaciones entre IA y humano, y cuál fue el resultado de la reconciliación.

---

## 📊 Datos Fuente

Tabla principal: `article_dimension_reviews`

Campos clave:
| Campo | Uso |
|-------|-----|
| `article_id` | Artículo clasificado |
| `dimension_id` | Dimensión de análisis |
| `article_batch_item_id` | Vínculo con el lote |
| `iteration` | 1=IA, 2=Humano, 3=Reconciliación IA |
| `reviewer_type` | `'ai'` o `'human'` |
| `classification_value` | Valor asignado |
| `confidence_score` | 1=Baja, 2=Media, 3=Alta |
| `rationale` | Justificación textual |
| `status` | `validated`, `reconciled`, `disputed`, etc. |
| `is_final` | Si la clasificación es definitiva |

---

## 🧩 Funcionalidades

### 1. **Dashboard de Discrepancias (Vista Global)**

**KPIs principales (cards superiores):**
- Total de clasificaciones (artículo × dimensión)
- % de acuerdo IA-Humano (iter 1 = iter 2)
- % con discrepancia (iter 1 ≠ iter 2)
- % reconciliados (iter 3 con `status = 'reconciled'`)
- % en disputa (iter 3 con `status = 'disputed'`)

### 2. **Análisis por Dimensión**

Para cada dimensión:
- **Tasa de acuerdo:** % de artículos donde IA y humano coincidieron
- **Matriz de confusión:** Qué clasificó la IA vs qué clasificó el humano (heatmap)
- **Distribución de cambios:** De qué valor a qué valor cambió el humano
- **Confianza vs Acierto:** ¿La confianza alta de la IA correlaciona con acuerdo?

### 3. **Historial de Iteraciones (Drill-down por artículo)**

Al hacer clic en un artículo, mostrar timeline:
```
Iter 1 (IA) → "Cuantitativo" (Confianza: Alta)
    Justificación: "El abstract menciona estadísticas descriptivas..."
         ↓ ❌ Discrepancia
Iter 2 (Humano) → "Cualitativo" (Confianza: Media)
    Justificación: "El enfoque principal es fenomenológico..."
         ↓ 🔄 Reconciliación
Iter 3 (IA) → "Cualitativo" (Confianza: Alta) ✅ Reconciliado
    Justificación: "Re-evaluando, el colega tiene razón..."
```

### 4. **Tabla de Discrepancias**

Tabla filtrable con:
- Artículo (título)
- Dimensión
- Valor Iter 1 (IA)
- Valor Iter 2 (Humano)
- ¿Coinciden? (badge verde/rojo)
- Valor Iter 3 (Reconciliación) si existe
- Status final (`reconciled`, `disputed`, etc.)
- Navegación a detalle del artículo

### 5. **Filtros**

- Por fase
- Por dimensión
- Por tipo de discrepancia (acuerdo / desacuerdo / disputado)
- Por confianza de la IA
- Por lote

---

## 🎨 Componentes Standard UI

- `StandardPageTitle` — Título con breadcrumbs
- `StandardCard` — Contenedores de KPIs y secciones
- `StandardTable` — Tabla de discrepancias con paginación
- `StandardBadge` — Indicadores de estado/acuerdo
- `StandardBarChart` / `StandardPieChart` — Gráficos de distribución
- `StandardSelect` — Filtros de fase/dimensión
- `StandardButton` — Acciones
- `StandardText` — Tipografía

---

## 🔧 Server Actions Necesarias

### `getDiscrepancyAnalysisData`
```typescript
// Input
{
  projectId: string;
  phaseIds: string[];
  dimensionIds?: string[];
  batchId?: string;
}

// Output
{
  summary: {
    totalPairs: number;          // total artículo×dimensión con iter 1
    agreements: number;          // iter1.value === iter2.value
    discrepancies: number;       // iter1.value !== iter2.value
    reconciled: number;          // iter3 con status='reconciled'
    disputed: number;            // iter3 con status='disputed'
    pendingReconciliation: number; // tiene iter2 pero no iter3
    onlyIter1: number;           // solo tiene iter 1 (sin revisión humana)
  };
  byDimension: Array<{
    dimensionId: string;
    dimensionName: string;
    dimensionIcon: string | null;
    totalPairs: number;
    agreements: number;
    discrepancies: number;
    reconciled: number;
    disputed: number;
    confusionMatrix: Record<string, Record<string, number>>; // [iter1_val][iter2_val] = count
  }>;
  details: Array<{
    articleId: string;
    articleTitle: string;
    correlativo: string | null;
    dimensionId: string;
    dimensionName: string;
    batchNumber: number | null;
    iter1: { value: string; confidence: number; rationale: string; } | null;
    iter2: { value: string; confidence: number; rationale: string; } | null;
    iter3: { value: string; confidence: number; rationale: string; status: string; } | null;
    isAgreement: boolean;
    finalStatus: string | null;
  }>;
}
```

---

## 🗺️ Navegación

- **Desde:** Navbar → Artículos → Análisis de Discrepancias
- **Hacia:** Click en artículo → `/articulos/detalle?articleId=...`
- **Hacia:** Click en lote → `/articulos/preclasificacion/[batchId]`

---

## 📁 Archivos a Crear

1. `/app/articulos/analisis-discrepancias/page.tsx` — Página principal
2. `/app/articulos/analisis-discrepancias/components/DiscrepancyVisualization.tsx` — Gráficos
3. `/app/articulos/analisis-discrepancias/components/IterationTimeline.tsx` — Timeline por artículo
4. `/lib/actions/preclassification-actions.ts` — Agregar `getDiscrepancyAnalysisData`

---

## 🎯 Criterios de Aceptación

1. ✅ KPIs visibles al cargar la página
2. ✅ Gráficos de distribución de discrepancias por dimensión
3. ✅ Tabla navegable con drill-down a historial de iteraciones
4. ✅ Filtros por fase, dimensión y tipo de discrepancia
5. ✅ Navegación a detalle de artículo y lote
6. ✅ Uso exclusivo de componentes Standard UI
7. ✅ Responsive y coherente con la estética de `/analisis-preclasificacion`
