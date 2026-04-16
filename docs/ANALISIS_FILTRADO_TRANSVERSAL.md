# Análisis Profundo: Sistema de Filtrado Transversal

**Fecha:** 18 Mar 2026
**Estado:** DIAGNÓSTICO COMPLETO
**Problema:** Filtros no funcionan - universo no se actualiza, dimensiones aparecen vacías

---

## 🔍 FLUJO DE DATOS ACTUAL

### 1. Estados Principales

```typescript
// page.tsx - Estados clave
const [allArticles, setAllArticles] = useState([]);           // Artículos completos SIN paginar
const [articles, setArticles] = useState([]);                 // Artículos paginados para tabla
const [dimensions, setDimensions] = useState([]);             // Dimensiones con statistics
const [activeFilters, setActiveFilters] = useState({});       // Filtros activos por dimensión
const [confidenceFilter, setConfidenceFilter] = useState([]); // Filtros de confianza
const [showVisualization, setShowVisualization] = useState(true);
const [showTable, setShowTable] = useState(false);
```

### 2. Flujo de Carga de Datos

#### A. Carga Inicial (sin filtros)
```
useEffect (selectedPhaseIds change)
  ↓
loadDimensionsAndStats()
  ↓
getDimensionStatisticsMultiphase(phaseIds)
  ↓
setDimensions([...]) con statistics: { total_articles, classified_count, by_option }
  ↓
allArticles = [] (vacío)
  ↓
UniverseVisualization recibe:
  - articles: [] (vacío)
  - dimensions: [...] con statistics
```

#### B. Activación de Filtro
```
toggleFilter(dimensionId, value)
  ↓
if (allArticles.length === 0) {
  loadArticles() // Carga artículos completos
}
  ↓
setActiveFilters({...})
  ↓
allFilteredArticles = useMemo(() => {
  // Filtra allArticles según activeFilters
})
  ↓
UniverseVisualization recibe:
  - articles: allFilteredArticles
  - dimensions: [...] con statistics (SIN CAMBIAR)
```

### 3. Cálculo de Artículos Filtrados

```typescript
// page.tsx líneas 558-620
const allFilteredArticles = useMemo(() => {
  let filtered = allArticles;
  
  // Filtro por dimensión
  if (Object.keys(activeFilters).length > 0) {
    filtered = filtered.filter((article) => {
      return Object.entries(activeFilters).every(([dimId, filterMap]) => {
        const classification = article.classifications[dimId];
        if (!classification || !classification.value) return false;
        
        const articleValue = classification.value;
        
        // Lógica de include/exclude
        const includeValues = Object.entries(filterMap)
          .filter(([_, mode]) => mode === "include")
          .map(([val]) => val);
        const excludeValues = Object.entries(filterMap)
          .filter(([_, mode]) => mode === "exclude")
          .map(([val]) => val);
        
        // Exclusión tiene prioridad
        if (excludeValues.length > 0) {
          const shouldExclude = excludeValues.some((val) => {
            if (val === "Otros" && isOtherValue(articleValue)) return true;
            return val === articleValue;
          });
          if (shouldExclude) return false;
        }
        
        // Inclusión
        if (includeValues.length > 0) {
          const isIncluded = includeValues.some((val) => {
            if (val === "Otros" && isOtherValue(articleValue)) return true;
            return val === articleValue;
          });
          return isIncluded;
        }
        
        return true;
      });
    });
  }
  
  // Filtro por confianza
  if (confidenceFilter.length > 0) {
    filtered = filtered.filter((article) => {
      return Object.values(article.classifications).some((classification) => {
        return classification && confidenceFilter.includes(classification.confidence || 0);
      });
    });
  }
  
  return filtered;
}, [allArticles, activeFilters, confidenceFilter, isOtherValue]);
```

### 4. UniverseVisualization - Lógica de Datos

```typescript
// UniverseVisualization.tsx líneas 83-108
const chartDimensions = useMemo(() => {
  return dimensions
    .filter((dim) => dim.options.length > 0)
    .map((dim) => {
      let valueCounts: Record<string, number> = {};
      
      // 🎯 PRIORIDAD: Si hay artículos cargados, usarlos
      if (articles.length > 0) {
        // Calcular desde artículos filtrados
        dim.options.forEach((opt) => {
          valueCounts[opt.value] = 0;
        });
        
        articles.forEach((article) => {
          const classification = article.classifications[dim.id];
          if (classification && classification.value) {
            const value = classification.value;
            if (valueCounts[value] !== undefined) {
              valueCounts[value]++;
            } else {
              valueCounts[value] = 1; // Serendipia
            }
          }
        });
      } else if (dim.statistics?.by_option) {
        // Usar estadísticas pre-calculadas
        valueCounts = { ...dim.statistics.by_option };
      }
      
      // Agrupar "Otros"
      const groupedCounts = groupOtherValues(valueCounts);
      
      // ... resto del código
    });
}, [articles, dimensions, activeFilters, groupOtherValues, isOtherValue]);
```

### 5. Estadísticas Globales

```typescript
// UniverseVisualization.tsx líneas 145-206
const stats = useMemo(() => {
  if (articles.length > 0) {
    // Calcular desde artículos filtrados
    const totalClassifications = articles.reduce((sum, article) => {
      return sum + Object.keys(article.classifications).length;
    }, 0);
    
    return {
      totalArticles: articles.length,  // ✅ Debería reflejar filtrado
      classifiedArticles,
      totalClassifications,
      avgClassificationsPerArticle,
      coveragePercentage,
      totalDimensions: dimensions.length,
    };
  }
  
  // Usar estadísticas pre-calculadas
  const hasPreCalculatedStats = dimensions.some((d) => d.statistics);
  if (hasPreCalculatedStats) {
    const totalArticles = dimensions[0]?.statistics?.total_articles || 0;
    // ...
    return {
      totalArticles,  // ✅ Total sin filtrar
      classifiedArticles: totalArticles,
      avgClassificationsPerArticle,
      coveragePercentage: "100",
    };
  }
  
  // Fallback
  return {
    totalArticles: 0,
    classifiedArticles: 0,
    avgClassificationsPerArticle: "0",
    coveragePercentage: "0",
  };
}, [articles, dimensions]);
```

---

## 🐛 PROBLEMAS IDENTIFICADOS

### Problema 1: `activeFilters` no se usa en `chartDimensions`

**Ubicación:** `UniverseVisualization.tsx` línea 142

```typescript
}, [articles, dimensions, activeFilters, groupOtherValues, isOtherValue]);
//                        ^^^^^^^^^^^^^ Está en dependencias pero NO se usa
```

**Impacto:** Los filtros están en las dependencias del `useMemo` pero no se aplican a los datos. El componente se re-renderiza cuando cambian los filtros, pero los gráficos no reflejan el filtrado.

**Evidencia:** En la imagen del usuario, los badges de filtro están activos (verde/rojo) pero los gráficos muestran el universo completo (257 artículos).

### Problema 2: Paso de datos a `UniverseVisualization`

**Ubicación:** `page.tsx` línea 1416-1421

```typescript
<UniverseVisualization
  articles={allFilteredArticles}  // ✅ Artículos filtrados
  dimensions={dimensions}          // ❌ Dimensiones SIN filtrar (con statistics del universo total)
  activeFilters={activeFilters}    // ⚠️ Se pasa pero no se usa correctamente
  confidenceFilter={confidenceFilter}
/>
```

**Impacto:** 
- `allFilteredArticles` contiene solo los artículos que cumplen los filtros
- Pero `dimensions` sigue teniendo `statistics` del universo total (257 artículos)
- `UniverseVisualization` prioriza artículos sobre statistics cuando `articles.length > 0`
- **PERO** si `allFilteredArticles` está vacío (ningún artículo cumple filtros), usa `statistics` del universo total

### Problema 3: Lógica de Prioridad Confusa

**Ubicación:** `UniverseVisualization.tsx` líneas 85-108

```typescript
if (articles.length > 0) {
  // Calcular desde artículos filtrados
  // ✅ CORRECTO cuando hay artículos
} else if (dim.statistics?.by_option) {
  // Usar estadísticas pre-calculadas
  // ❌ INCORRECTO: usa stats del universo total, no del filtrado
}
```

**Escenarios problemáticos:**

1. **Filtro muy restrictivo:** Si `allFilteredArticles` queda vacío, usa `statistics` del universo total
2. **Carga lenta:** Mientras `loadArticles()` está en progreso, `allArticles` está vacío, usa `statistics` del universo total
3. **Dimensiones vacías:** Si una dimensión no tiene clasificaciones en los artículos filtrados, aparece vacía (flechas rojas en imagen)

### Problema 4: Contadores de Filtros

**Ubicación:** `page.tsx` líneas 1313-1335

```typescript
if (dim.statistics?.by_option) {
  // Usar estadísticas pre-calculadas
  optionCounts = { ...dim.statistics.by_option };
} else {
  // Fallback: Calcular desde artículos
  optionCounts = allFilteredArticles.reduce(...);
}
```

**Impacto:** 
- Si hay `statistics`, usa contadores del universo total
- Solo usa `allFilteredArticles` si NO hay `statistics`
- **Resultado:** Los badges de filtro muestran contadores incorrectos (del universo total, no del filtrado)

---

## 🎯 ESTADO ESPERADO vs ESTADO ACTUAL

### Escenario: Usuario filtra "Sí (Cualitativo / Experiencia de Usuario)" con 67 artículos

| Elemento | Estado Esperado | Estado Actual | ¿Funciona? |
|----------|----------------|---------------|------------|
| **Badge del filtro** | Verde, "Sí (67)" | Verde, "Sí (67)" | ✅ |
| **Universo total** | 67 artículos | 257 artículos | ❌ |
| **Gráfico Dimensión A** | Solo datos de esos 67 artículos | Datos de 257 artículos | ❌ |
| **Gráfico Dimensión B** | Solo datos de esos 67 artículos | Datos de 257 artículos | ❌ |
| **Dimensiones sin datos en filtrado** | Mostrar 0 o vacío | Mostrar datos del universo total | ❌ |

---

## 🔧 CAUSA RAÍZ

El sistema tiene **dos fuentes de verdad** que no están sincronizadas:

1. **`allFilteredArticles`**: Artículos que cumplen los filtros (correcto)
2. **`dimensions.statistics`**: Estadísticas del universo total (incorrecto cuando hay filtros)

`UniverseVisualization` intenta usar `allFilteredArticles` cuando está disponible, pero:
- Si está vacío (filtro muy restrictivo o carga en progreso), cae back a `statistics` del universo total
- Las estadísticas globales (`stats`) se calculan desde `articles.length` que puede ser 0
- Los contadores de filtros usan `statistics` si está disponible, ignorando el filtrado

---

## 💡 SOLUCIÓN PROPUESTA

### Opción A: Recalcular Statistics en Frontend (Recomendada)

**Concepto:** Cuando hay filtros activos, recalcular `statistics` desde `allFilteredArticles` antes de pasar a `UniverseVisualization`.

```typescript
// page.tsx - Nuevo useMemo
const dimensionsWithFilteredStats = useMemo(() => {
  if (Object.keys(activeFilters).length === 0 && confidenceFilter.length === 0) {
    // Sin filtros: usar statistics originales
    return dimensions;
  }
  
  if (allArticles.length === 0) {
    // Artículos no cargados: usar statistics originales
    return dimensions;
  }
  
  // Con filtros: recalcular statistics desde allFilteredArticles
  return dimensions.map(dim => {
    const by_option: Record<string, number> = {};
    let classified_count = 0;
    
    allFilteredArticles.forEach(article => {
      const classification = article.classifications[dim.id];
      if (classification?.value) {
        const value = classification.value;
        by_option[value] = (by_option[value] || 0) + 1;
        classified_count++;
      }
    });
    
    return {
      ...dim,
      statistics: {
        total_articles: allFilteredArticles.length,
        classified_count,
        by_option,
      },
    };
  });
}, [dimensions, allFilteredArticles, activeFilters, confidenceFilter]);

// Pasar dimensionsWithFilteredStats en lugar de dimensions
<UniverseVisualization
  articles={allFilteredArticles}
  dimensions={dimensionsWithFilteredStats}  // ✅ Statistics actualizadas
  activeFilters={activeFilters}
  confidenceFilter={confidenceFilter}
/>
```

**Ventajas:**
- ✅ Una sola fuente de verdad
- ✅ `UniverseVisualization` no necesita cambios
- ✅ Contadores de filtros correctos
- ✅ Estadísticas globales correctas

**Desventajas:**
- ⚠️ Recalcula statistics en cada cambio de filtro (puede ser costoso con muchos artículos)

### Opción B: Eliminar Dependencia de Statistics en UniverseVisualization

**Concepto:** Forzar a `UniverseVisualization` a usar SOLO `articles`, nunca `statistics`.

```typescript
// UniverseVisualization.tsx
const chartDimensions = useMemo(() => {
  return dimensions
    .filter((dim) => dim.options.length > 0)
    .map((dim) => {
      let valueCounts: Record<string, number> = {};
      
      // SIEMPRE calcular desde artículos
      dim.options.forEach((opt) => {
        valueCounts[opt.value] = 0;
      });
      
      articles.forEach((article) => {
        const classification = article.classifications[dim.id];
        if (classification && classification.value) {
          const value = classification.value;
          if (valueCounts[value] !== undefined) {
            valueCounts[value]++;
          } else {
            valueCounts[value] = 1;
          }
        }
      });
      
      // ... resto
    });
}, [articles, dimensions]);
```

**Ventajas:**
- ✅ Lógica simple y predecible
- ✅ Sin ambigüedad de fuentes de datos

**Desventajas:**
- ❌ Pierde la optimización de vista inicial rápida (sin cargar artículos)
- ❌ Requiere cargar artículos completos siempre

### Opción C: Híbrida (Recomendada para tu caso)

**Concepto:** Mantener optimización inicial, pero recalcular statistics cuando hay filtros.

```typescript
// page.tsx
const dimensionsForVisualization = useMemo(() => {
  const hasActiveFilters = Object.keys(activeFilters).length > 0 || confidenceFilter.length > 0;
  
  if (!hasActiveFilters) {
    // Sin filtros: usar statistics originales (optimización)
    return dimensions;
  }
  
  if (allArticles.length === 0) {
    // Filtros activos pero artículos no cargados: forzar carga
    // (esto ya lo haces en toggleFilter)
    return dimensions;
  }
  
  // Filtros activos y artículos cargados: recalcular statistics
  return dimensions.map(dim => {
    const by_option: Record<string, number> = {};
    let classified_count = 0;
    
    allFilteredArticles.forEach(article => {
      const classification = article.classifications[dim.id];
      if (classification?.value) {
        const value = classification.value;
        by_option[value] = (by_option[value] || 0) + 1;
        classified_count++;
      }
    });
    
    return {
      ...dim,
      statistics: {
        total_articles: allFilteredArticles.length,
        classified_count,
        by_option,
      },
    };
  });
}, [dimensions, allFilteredArticles, activeFilters, confidenceFilter]);
```

**Ventajas:**
- ✅ Mantiene optimización inicial (vista rápida sin cargar artículos)
- ✅ Filtrado transversal correcto
- ✅ Una sola fuente de verdad cuando hay filtros

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Paso 1: Crear `dimensionsWithFilteredStats` en `page.tsx`
- Nuevo `useMemo` que recalcula `statistics` desde `allFilteredArticles` cuando hay filtros
- Mantiene `statistics` originales cuando NO hay filtros (optimización)

### Paso 2: Actualizar paso de props a `UniverseVisualization`
- Pasar `dimensionsWithFilteredStats` en lugar de `dimensions`

### Paso 3: Limpiar `UniverseVisualization`
- Eliminar `activeFilters` de dependencias de `chartDimensions` (ya no se necesita)
- Simplificar lógica: confiar en que `dimensions.statistics` ya refleja el filtrado

### Paso 4: Actualizar contadores de filtros
- Usar `dimensionsWithFilteredStats` para calcular `optionCounts`

### Paso 5: Testing
- Sin filtros: debe mostrar universo total con statistics pre-calculadas (rápido)
- Con filtros: debe cargar artículos y recalcular statistics (correcto)
- Filtro restrictivo: debe mostrar universo reducido correctamente
- Dimensiones sin datos en filtrado: deben aparecer vacías o con 0

---

## 🎯 CONCLUSIÓN

El problema NO es la lógica de filtrado de `allFilteredArticles` (esa funciona).

El problema ES que `UniverseVisualization` recibe dos fuentes de datos contradictorias:
- `articles`: filtrados ✅
- `dimensions.statistics`: del universo total ❌

**Solución:** Recalcular `dimensions.statistics` desde `allFilteredArticles` cuando hay filtros activos, antes de pasar a `UniverseVisualization`.

Esto mantiene la optimización inicial (vista rápida sin artículos) pero garantiza coherencia cuando hay filtros.
