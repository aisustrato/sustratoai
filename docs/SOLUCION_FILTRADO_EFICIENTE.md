# Solución Eficiente: Filtrado de Statistics sin Cargar Artículos

**Fecha:** 18 Mar 2026
**Problema:** Filtros requieren cargar todos los artículos (ineficiente)
**Solución:** Filtrar statistics directamente en SQL sin cargar artículos

---

## 🎯 Concepto Clave

**Actual (ineficiente):**
```
Usuario activa filtro
  ↓
Frontend carga TODOS los artículos completos (~2-5s, pesado)
  ↓
Frontend filtra artículos en memoria
  ↓
Frontend recalcula statistics desde artículos filtrados
  ↓
Muestra gráficos
```

**Propuesto (eficiente):**
```
Usuario activa filtro
  ↓
Frontend llama getDimensionStatisticsFiltered(phaseIds, filters)
  ↓
Backend filtra reviews en SQL (solo IDs de artículos que cumplen filtros)
  ↓
Backend calcula statistics solo de esos reviews (~500ms, ligero)
  ↓
Frontend recibe statistics filtradas
  ↓
Muestra gráficos (sin cargar artículos)
```

---

## 🔧 Implementación

### 1. Nueva Función Backend: `getDimensionStatisticsFiltered`

```typescript
// lib/actions/preclassification-actions.ts

export async function getDimensionStatisticsFiltered(params: {
  projectId: string;
  phaseIds: string[];
  dimensionIds?: string[];
  filters?: {
    // Filtros por dimensión (include/exclude)
    dimensionFilters?: Record<string, Record<string, "include" | "exclude">>;
    // Filtros por nivel de confianza
    confidenceFilters?: number[]; // [1, 2, 3]
  };
}): Promise<ResultadoOperacion<{
  dimensions: Array<{
    id: string;
    name: string;
    type: string;
    icon: string | null;
    phase_id: string;
    phase_name: string;
    phase_number: number;
    options: Array<{ value: string; emoticon: string | null }>;
    statistics: {
      total_articles: number;
      classified_count: number;
      by_option: Record<string, number>;
    };
  }>;
  totalArticles: number;
}>> {
  const { projectId, phaseIds, dimensionIds, filters } = params;

  // ... validaciones ...

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Obtener dimensiones (igual que antes)
    // ... código existente ...

    // 2. Obtener batches de las fases
    // ... código existente ...

    // 3. NUEVO: Si hay filtros, obtener solo los IDs de artículos que cumplen
    let filteredItemIds: string[] | null = null;

    if (filters?.dimensionFilters && Object.keys(filters.dimensionFilters).length > 0) {
      // Obtener artículos que cumplen TODOS los filtros de dimensión
      filteredItemIds = await getFilteredArticleIds(
        supabase,
        batchIds,
        filters.dimensionFilters,
        filters.confidenceFilters
      );
    }

    // 4. Contar artículos (filtrados o todos)
    const itemIdsToUse = filteredItemIds || (await getAllItemIds(supabase, batchIds));
    const totalArticles = itemIdsToUse.length;

    // 5. Obtener estadísticas solo de los artículos filtrados
    const { data: reviewStats, error: statsError } = await supabase
      .from("article_dimension_reviews")
      .select("dimension_id, classification_value")
      .in("dimension_id", finalDimensionIds)
      .in("article_batch_item_id", itemIdsToUse); // ✅ Solo reviews de artículos filtrados

    // 6. Procesar estadísticas (igual que antes)
    // ... código existente ...

    return {
      success: true,
      data: {
        dimensions: dimensionsWithStats,
        totalArticles,
      },
    };
  } catch (error: any) {
    console.error("Error en getDimensionStatisticsFiltered:", error);
    return {
      success: false,
      error: error.message || "Error desconocido",
    };
  }
}
```

### 2. Función Auxiliar: `getFilteredArticleIds`

Esta función es la clave: **filtra artículos usando solo reviews, sin cargar artículos completos**.

```typescript
async function getFilteredArticleIds(
  supabase: any,
  batchIds: string[],
  dimensionFilters: Record<string, Record<string, "include" | "exclude">>,
  confidenceFilters?: number[]
): Promise<string[]> {
  // Obtener todos los item_ids de los batches
  const { data: allItems } = await supabase
    .from("article_batch_items")
    .select("id")
    .in("batch_id", batchIds);

  if (!allItems || allItems.length === 0) return [];

  let candidateItemIds = new Set(allItems.map((item) => item.id));

  // Aplicar cada filtro de dimensión secuencialmente
  for (const [dimensionId, filterMap] of Object.entries(dimensionFilters)) {
    const includeValues = Object.entries(filterMap)
      .filter(([_, mode]) => mode === "include")
      .map(([val]) => val);
    const excludeValues = Object.entries(filterMap)
      .filter(([_, mode]) => mode === "exclude")
      .map(([val]) => val);

    // Obtener reviews de esta dimensión para los candidatos actuales
    const { data: reviews } = await supabase
      .from("article_dimension_reviews")
      .select("article_batch_item_id, classification_value, confidence_score")
      .eq("dimension_id", dimensionId)
      .in("article_batch_item_id", Array.from(candidateItemIds));

    if (!reviews) continue;

    // Crear mapa: itemId -> classification_value
    const itemToValue = new Map<string, string>();
    const itemToConfidence = new Map<string, number>();
    reviews.forEach((r) => {
      itemToValue.set(r.article_batch_item_id, r.classification_value || "");
      itemToConfidence.set(r.article_batch_item_id, r.confidence_score || 0);
    });

    // Filtrar candidatos según include/exclude
    const newCandidates = new Set<string>();

    for (const itemId of candidateItemIds) {
      const value = itemToValue.get(itemId);
      if (!value) continue; // Sin clasificación en esta dimensión

      // Verificar exclusión
      if (excludeValues.length > 0) {
        const shouldExclude = excludeValues.some((val) => {
          if (val === "Otros" && value.toLowerCase().startsWith("otros")) return true;
          return val === value;
        });
        if (shouldExclude) continue; // Excluir este artículo
      }

      // Verificar inclusión
      if (includeValues.length > 0) {
        const isIncluded = includeValues.some((val) => {
          if (val === "Otros" && value.toLowerCase().startsWith("otros")) return true;
          return val === value;
        });
        if (!isIncluded) continue; // No incluir este artículo
      }

      // Verificar confianza (si hay filtros de confianza)
      if (confidenceFilters && confidenceFilters.length > 0) {
        const confidence = itemToConfidence.get(itemId) || 0;
        if (!confidenceFilters.includes(confidence)) continue;
      }

      newCandidates.add(itemId);
    }

    candidateItemIds = newCandidates;

    // Si no quedan candidatos, terminar early
    if (candidateItemIds.size === 0) break;
  }

  return Array.from(candidateItemIds);
}
```

### 3. Función Auxiliar: `getAllItemIds`

```typescript
async function getAllItemIds(
  supabase: any,
  batchIds: string[]
): Promise<string[]> {
  const { data: items } = await supabase
    .from("article_batch_items")
    .select("id")
    .in("batch_id", batchIds);

  return items?.map((item) => item.id) || [];
}
```

---

## 🎨 Actualización Frontend

### 1. Llamar API Filtrada cuando hay Filtros Activos

```typescript
// page.tsx

// Función para cargar dimensiones y estadísticas
const loadDimensionsAndStats = useCallback(async () => {
  if (!proyectoActual?.id || selectedPhaseIds.length === 0) return;

  setIsLoading(true);
  try {
    const hasActiveFilters = 
      Object.keys(activeFilters).length > 0 || 
      confidenceFilter.length > 0;

    let result;

    if (hasActiveFilters) {
      // ✅ Con filtros: usar API filtrada (NO carga artículos)
      result = await getDimensionStatisticsFiltered({
        projectId: proyectoActual.id,
        phaseIds: selectedPhaseIds,
        dimensionIds: selectedDimensionIds.length > 0 ? selectedDimensionIds : undefined,
        filters: {
          dimensionFilters: activeFilters,
          confidenceFilters: confidenceFilter,
        },
      });
    } else {
      // ✅ Sin filtros: usar API normal (optimización inicial)
      result = await getDimensionStatisticsMultiphase({
        projectId: proyectoActual.id,
        phaseIds: selectedPhaseIds,
        dimensionIds: selectedDimensionIds.length > 0 ? selectedDimensionIds : undefined,
      });
    }

    if (result.success && result.data) {
      setDimensions(result.data.dimensions);
      // ... resto del código ...
    }
  } catch (error) {
    console.error("Error cargando dimensiones:", error);
  } finally {
    setIsLoading(false);
  }
}, [proyectoActual?.id, selectedPhaseIds, selectedDimensionIds, activeFilters, confidenceFilter]);
```

### 2. Recargar Statistics al Cambiar Filtros

```typescript
// page.tsx

const toggleFilter = useCallback((dimensionId: string, value: string) => {
  setActiveFilters((prev) => {
    // ... lógica de toggle ...
    return newFilters;
  });
  
  // ✅ Recargar statistics con filtros (NO carga artículos)
  loadDimensionsAndStats();
}, [loadDimensionsAndStats]);

const toggleConfidenceFilter = useCallback((level: number) => {
  setConfidenceFilter((prev) => {
    // ... lógica de toggle ...
    return newFilters;
  });
  
  // ✅ Recargar statistics con filtros
  loadDimensionsAndStats();
}, [loadDimensionsAndStats]);
```

### 3. Mantener Carga de Artículos Solo Bajo Demanda

```typescript
// page.tsx

// ✅ Solo cargar artículos cuando se necesiten realmente
const loadArticles = useCallback(async () => {
  // ... código existente ...
}, []);

// Casos donde SÍ cargar artículos:
// 1. Usuario presiona "Mostrar Tabla"
const handleShowTable = () => {
  setShowTable(true);
  if (allArticles.length === 0) {
    loadArticles();
  }
};

// 2. Usuario descarga CSV
const handleDownloadCSV = async () => {
  if (allArticles.length === 0) {
    await loadArticles();
  }
  // ... generar CSV ...
};

// 3. Usuario crea "Universo Elegible" (solo necesita IDs)
// Aquí podríamos crear una función que solo obtenga IDs, no artículos completos
```

---

## 📊 Comparación de Performance

### Sin Filtros (Optimización Inicial)
| Acción | Tiempo | Datos Cargados |
|--------|--------|----------------|
| Carga inicial | ~500ms | Solo statistics (ligero) |
| Mostrar gráficos | Instantáneo | Ya tiene statistics |
| Mostrar tabla | ~2-5s | Carga artículos bajo demanda |

### Con Filtros (Solución Eficiente)
| Acción | Tiempo | Datos Cargados |
|--------|--------|----------------|
| Activar filtro | ~800ms | Solo reviews filtrados (ligero) |
| Gráficos actualizados | Instantáneo | Statistics ya filtradas |
| Mostrar tabla | ~2-5s | Carga artículos bajo demanda |

### Con Filtros (Solución Ineficiente - Evitar)
| Acción | Tiempo | Datos Cargados |
|--------|--------|----------------|
| Activar filtro | ~2-5s | TODOS los artículos (pesado) ❌ |
| Gráficos actualizados | ~500ms | Recalcula en frontend |
| Mostrar tabla | Instantáneo | Ya tiene artículos |

---

## ✅ Beneficios de la Solución

1. **Performance Óptima:**
   - Sin filtros: ~500ms (solo statistics)
   - Con filtros: ~800ms (reviews filtrados, sin artículos completos)
   - Vs. solución ineficiente: ~2-5s (todos los artículos)

2. **Uso de Memoria:**
   - Solo carga reviews (IDs + valores), no artículos completos
   - Artículos solo bajo demanda (tabla, CSV, universo elegible)

3. **Escalabilidad:**
   - Funciona igual de bien con 100 o 10,000 artículos
   - SQL optimizado con índices

4. **Coherencia:**
   - Una sola fuente de verdad: statistics filtradas del backend
   - No hay discrepancia entre statistics y artículos

5. **Mantenibilidad:**
   - Lógica de filtrado centralizada en backend
   - Frontend solo consume statistics (simple)

---

## 🔄 Flujo Completo

### Escenario: Usuario filtra "Sí (Cualitativo)" con 67 artículos

```
1. Usuario clic en badge "Sí"
   ↓
2. toggleFilter() actualiza activeFilters
   ↓
3. loadDimensionsAndStats() detecta filtros activos
   ↓
4. Llama getDimensionStatisticsFiltered({
     phaseIds: [...],
     filters: {
       dimensionFilters: {
         "dim-123": { "Sí": "include" }
       }
     }
   })
   ↓
5. Backend:
   a. Obtiene todos los item_ids de los batches
   b. Filtra: solo items con classification_value = "Sí" en dim-123
   c. Resultado: 67 item_ids
   d. Obtiene reviews solo de esos 67 items
   e. Calcula statistics: total_articles=67, by_option={...}
   ↓
6. Frontend recibe statistics filtradas
   ↓
7. UniverseVisualization usa statistics:
   - Universo total: 67 ✅
   - Gráficos: solo datos de esos 67 ✅
   - Sin cargar artículos completos ✅
```

---

## 🎯 Próximos Pasos

1. **Implementar `getFilteredArticleIds` en backend**
2. **Implementar `getDimensionStatisticsFiltered` en backend**
3. **Actualizar frontend para llamar API filtrada**
4. **Testing exhaustivo**
5. **Optimización SQL (índices si es necesario)**

---

## 📝 Notas Importantes

- **Artículos solo bajo demanda:** Tabla, CSV, universo elegible
- **Gráficos sin artículos:** Usan statistics filtradas del backend
- **Performance crítica:** ~800ms con filtros vs ~2-5s cargando todos los artículos
- **Escalabilidad:** Funciona con cualquier cantidad de artículos
