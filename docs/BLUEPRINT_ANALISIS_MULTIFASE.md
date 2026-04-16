# 🎯 Blueprint: Análisis de Clasificación Multifase

## 📋 Contexto Actual

### Estado del Sistema (Marzo 2026)
✅ **Sistema Multifase Implementado:**
- Creación de fases (Aditivas y Embudo)
- Gestión de dimensiones por fase
- Lotes por fase
- Preclasificación por fase
- Filtro por fase en lista de lotes

### Situación Actual del Análisis
❌ **Limitación:** El análisis de clasificación (`/articulos/analisis-preclasificacion`) solo muestra dimensiones de la **fase activa**
- Fase 1: 7 dimensiones
- Fase 2: 5 dimensiones
- **Problema:** No se pueden analizar dimensiones de ambas fases simultáneamente

---

## 🎯 Objetivo: Análisis Multifase Flexible

### Visión del Usuario
El investigador debe poder:

1. **Seleccionar qué fases analizar:**
   - Fase 1 sola
   - Fase 2 sola
   - **Ambas fases simultáneamente** (12 dimensiones)

2. **Seleccionar dimensiones específicas:**
   - Ejemplo: 3 dimensiones de Fase 1 + 2 dimensiones de Fase 2 = 5 dimensiones activas
   - Cada fase agrupada visualmente en su propio contenedor

3. **Aplicar filtros y visualizaciones:**
   - Solo las dimensiones seleccionadas aparecen como filtros
   - Solo las dimensiones seleccionadas aparecen en gráficos
   - Tabla muestra solo columnas de dimensiones seleccionadas

---

## 🏗️ Arquitectura de Solución

### **Opción 1: Selector Simple + Dialog Avanzado** ⭐ (RECOMENDADA)

#### **Componente 1: Selector de Fase (Simple)**
**Ubicación:** Arriba del título de página

```tsx
<StandardSelect
  value={selectedPhaseMode} // 'phase1' | 'phase2' | 'both'
  options={[
    { value: 'phase1', label: 'Fase 1: [Nombre]' },
    { value: 'phase2', label: 'Fase 2: [Nombre]' },
    { value: 'both', label: 'Ambas Fases' }
  ]}
/>
```

**Comportamiento:**
- Por defecto: Fase activa
- Al cambiar: Recarga dimensiones de la(s) fase(s) seleccionada(s)
- Si "Ambas": Carga dimensiones de ambas fases

#### **Componente 2: Configurador de Dimensiones (Avanzado)**
**Trigger:** Botón "Configurar Dimensiones" (visible solo si hay múltiples fases)

**UI:** `StandardPopup` (más espacio que Dialog para checkboxes)

**Estructura:**
```tsx
<StandardPopup>
  <StandardPopup.Header>
    <StandardPopup.Title>
      Seleccionar Dimensiones para Análisis
    </StandardPopup.Title>
  </StandardPopup.Header>
  
  <StandardPopup.Body>
    {/* Fase 1 */}
    <StandardCard styleType="subtle" colorScheme="primary">
      <StandardCard.Header>
        <StandardText weight="semibold">
          Fase 1: {phase1.name} ({phase1.dimensions.length} dimensiones)
        </StandardText>
      </StandardCard.Header>
      <StandardCard.Content>
        <div className="grid grid-cols-2 gap-2">
          {phase1.dimensions.map(dim => (
            <StandardCheckbox
              key={dim.id}
              checked={selectedDimensions.includes(dim.id)}
              onCheckedChange={(checked) => toggleDimension(dim.id, checked)}
              label={
                <div className="flex items-center gap-2">
                  <StandardIcon icon={dim.icon} size="sm" />
                  <span>{dim.name}</span>
                </div>
              }
            />
          ))}
        </div>
      </StandardCard.Content>
    </StandardCard>

    {/* Fase 2 */}
    <StandardCard styleType="subtle" colorScheme="secondary">
      <StandardCard.Header>
        <StandardText weight="semibold">
          Fase 2: {phase2.name} ({phase2.dimensions.length} dimensiones)
        </StandardText>
      </StandardCard.Header>
      <StandardCard.Content>
        {/* Similar a Fase 1 */}
      </StandardCard.Content>
    </StandardCard>
  </StandardPopup.Body>

  <StandardPopup.Footer>
    <StandardText size="sm" colorScheme="neutral">
      {selectedDimensions.length} dimensiones seleccionadas
    </StandardText>
    <StandardButton onClick={applyDimensionSelection}>
      Aplicar Selección
    </StandardButton>
  </StandardPopup.Footer>
</StandardPopup>
```

---

## 🔧 Implementación Técnica

### **1. Backend: Obtener Dimensiones Multifase**

**Nueva función:** `getDimensionsForAnalysis`

```typescript
export async function getDimensionsForAnalysis(params: {
  projectId: string;
  phaseIds: string[]; // Array de IDs de fases
  dimensionIds?: string[]; // Opcional: filtrar dimensiones específicas
}) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from('preclass_dimensions')
    .select('id, name, type, icon, phase_id, preclass_dimension_options(value, emoticon)')
    .in('phase_id', params.phaseIds)
    .eq('status', 'active')
    .order('ordering');
  
  if (params.dimensionIds && params.dimensionIds.length > 0) {
    query = query.in('id', params.dimensionIds);
  }
  
  const { data, error } = await query;
  
  if (error) return { success: false, error: error.message };
  
  // Agrupar por fase
  const dimensionsByPhase = data.reduce((acc, dim) => {
    if (!acc[dim.phase_id]) acc[dim.phase_id] = [];
    acc[dim.phase_id].push(dim);
    return acc;
  }, {} as Record<string, typeof data>);
  
  return { success: true, data: dimensionsByPhase };
}
```

### **2. Backend: Obtener Artículos con Clasificaciones Multifase**

**Actualizar:** `getPreclassifiedArticlesForAnalysis`

```typescript
export async function getPreclassifiedArticlesForAnalysis(params: {
  projectId: string;
  phaseIds: string[]; // Múltiples fases
  dimensionIds?: string[]; // Opcional: solo dimensiones seleccionadas
  filters?: Record<string, Record<string, 'include' | 'exclude'>>;
  page?: number;
  limit?: number;
}) {
  // Lógica similar a la actual pero:
  // 1. JOIN con article_batch_items de CUALQUIER fase en phaseIds
  // 2. Filtrar clasificaciones solo de dimensionIds (si se provee)
  // 3. Agrupar clasificaciones por fase en el resultado
}
```

### **3. Frontend: Estado de Selección**

```typescript
// Estado de fases
const [availablePhases, setAvailablePhases] = useState<Phase[]>([]);
const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);

// Estado de dimensiones
const [dimensionsByPhase, setDimensionsByPhase] = useState<Record<string, Dimension[]>>({});
const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>([]);

// Modo de selección
const [phaseMode, setPhaseMode] = useState<'single' | 'multiple'>('single');
```

### **4. Frontend: Flujo de Carga**

```typescript
useEffect(() => {
  async function loadData() {
    // 1. Cargar fases disponibles del proyecto
    const phasesResult = await getPhasesForProject(projectId);
    setAvailablePhases(phasesResult.data);
    
    // 2. Por defecto: seleccionar fase activa
    const activePhase = phasesResult.data.find(p => p.status === 'active');
    if (activePhase) {
      setSelectedPhaseIds([activePhase.id]);
    }
    
    // 3. Cargar dimensiones de fase(s) seleccionada(s)
    await loadDimensions(selectedPhaseIds);
    
    // 4. Cargar artículos
    await loadArticles();
  }
  
  loadData();
}, [projectId]);
```

---

## 🎨 UX/UI Detallada

### **Escenario 1: Usuario con 1 Fase**
- **Selector de fase:** NO se muestra (innecesario)
- **Configurador de dimensiones:** NO se muestra
- **Comportamiento:** Igual que ahora (todas las dimensiones de la fase activa)

### **Escenario 2: Usuario con Múltiples Fases**

#### **Vista Inicial:**
```
┌─────────────────────────────────────────────┐
│ [Selector: Fase 2 (Activa) ▼]              │
│ [Botón: ⚙️ Configurar Dimensiones]          │
└─────────────────────────────────────────────┘
│ Análisis de Clasificación                   │
│ 5 dimensiones activas de Fase 2            │
└─────────────────────────────────────────────┘
```

#### **Usuario selecciona "Ambas Fases":**
```
┌─────────────────────────────────────────────┐
│ [Selector: Ambas Fases ▼]                  │
│ [Botón: ⚙️ Configurar Dimensiones (12)]     │ ← Badge con total
└─────────────────────────────────────────────┘
│ Análisis de Clasificación                   │
│ 12 dimensiones activas (7 de Fase 1, 5 de  │
│ Fase 2)                                     │
└─────────────────────────────────────────────┘
```

#### **Usuario abre Configurador:**
```
┌─────────────────────────────────────────────┐
│ Seleccionar Dimensiones para Análisis      │
├─────────────────────────────────────────────┤
│ ┌─ Fase 1: Análisis Inicial ─────────────┐ │
│ │ ☑ 📅 Año de Publicación               │ │
│ │ ☑ 🔬 Metodología                       │ │
│ │ ☑ ⚖️ Consideraciones Éticas            │ │
│ │ ☐ 🎯 Tipo de Ocio                      │ │
│ │ ☐ 👥 Población Objetivo                │ │
│ │ ☐ 🌍 Contexto Geográfico               │ │
│ │ ☐ 📊 Tipo de Estudio                   │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ┌─ Fase 2: Análisis Profundo ────────────┐ │
│ │ ☑ 🎨 Actividad Específica              │ │
│ │ ☑ 💡 Innovación                         │ │
│ │ ☐ 🔗 Colaboración                       │ │
│ │ ☐ 📈 Impacto                            │ │
│ │ ☐ 🌱 Sostenibilidad                     │ │
│ └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 5 dimensiones seleccionadas    [Aplicar]   │
└─────────────────────────────────────────────┘
```

---

## 📊 Impacto en Componentes

### **Filtros Laterales**
```tsx
{/* Solo mostrar filtros de dimensiones seleccionadas */}
{selectedDimensions.map(dimension => (
  <FilterGroup
    key={dimension.id}
    dimension={dimension}
    phaseLabel={dimension.phase_name} // Mostrar de qué fase es
  />
))}
```

### **Tabla de Artículos**
```tsx
// Columnas dinámicas basadas en dimensiones seleccionadas
const columns = useMemo(() => {
  const baseCols = [/* columnas fijas */];
  
  const dimensionCols = selectedDimensions.map(dim => ({
    id: dim.id,
    header: (
      <div>
        <StandardIcon icon={dim.icon} />
        {dim.name}
        <StandardBadge size="xs">{dim.phase_name}</StandardBadge>
      </div>
    ),
    cell: ({ row }) => row.classifications[dim.id]?.value
  }));
  
  return [...baseCols, ...dimensionCols];
}, [selectedDimensions]);
```

### **Visualizaciones (Gráficos)**
```tsx
<UniverseVisualization
  dimensions={selectedDimensions} // Solo dimensiones seleccionadas
  articles={allArticles}
  groupByPhase={true} // Agrupar gráficos por fase
/>
```

---

## 🚀 Plan de Implementación

### **Sprint 1: Backend Multifase** (2-3 horas)
1. ✅ Crear `getDimensionsForAnalysis` con soporte multifase
2. ✅ Actualizar `getPreclassifiedArticlesForAnalysis` para múltiples fases
3. ✅ Actualizar `getAllPreclassifiedArticlesForAnalysis` (para gráficos)
4. ✅ Crear tipos TypeScript para respuestas multifase

### **Sprint 2: Selector Simple** (1-2 horas)
1. ✅ Agregar selector de fase (Fase 1 | Fase 2 | Ambas)
2. ✅ Cargar dimensiones según selección
3. ✅ Actualizar estado de filtros y tabla
4. ✅ Testing básico

### **Sprint 3: Configurador Avanzado** (3-4 horas)
1. ✅ Crear componente `DimensionSelectorPopup`
2. ✅ Implementar checkboxes por fase
3. ✅ Persistir selección en estado
4. ✅ Aplicar filtrado de dimensiones
5. ✅ Actualizar todos los componentes dependientes

### **Sprint 4: Refinamientos UX** (2 horas)
1. ✅ Badges de fase en columnas de tabla
2. ✅ Agrupación visual de gráficos por fase
3. ✅ Indicadores de "X dimensiones seleccionadas"
4. ✅ Tooltips explicativos
5. ✅ Testing end-to-end

---

## 📝 Actualización de Documentación

### **Archivo a Actualizar:** `/docs/modulo preclasificacion.md`

**Nueva Sección:**

```markdown
## 7. Análisis Multifase: Visión Transversal

Una de las innovaciones más potentes de Sustrato es la capacidad de analizar clasificaciones **a través de múltiples fases** simultáneamente.

### 7.1. El Problema de la Fragmentación

En investigaciones iterativas, es común que:
- **Fase 1** capture criterios generales (año, metodología, ética)
- **Fase 2** profundice en aspectos específicos (tipo de actividad, impacto)

Sin embargo, el investigador necesita ver el **panorama completo**: ¿Qué artículos de metodología cualitativa (Fase 1) también promueven innovación (Fase 2)?

### 7.2. Selector de Fases y Dimensiones

Sustrato permite:
1. **Selección de Fases:** Elegir analizar Fase 1, Fase 2, o ambas simultáneamente
2. **Selección Granular de Dimensiones:** Dentro de cada fase, elegir solo las dimensiones relevantes para el análisis actual

**Ejemplo de Uso:**
- Investigador selecciona: 3 dimensiones de Fase 1 + 2 dimensiones de Fase 2
- El sistema muestra solo esas 5 dimensiones en:
  - Filtros laterales
  - Columnas de tabla
  - Gráficos de distribución

### 7.3. Agrupación Visual por Fase

Para evitar confusión, las dimensiones se agrupan visualmente:
- **Fase 1:** Contenedor con colorScheme "primary"
- **Fase 2:** Contenedor con colorScheme "secondary"
- Cada dimensión muestra un badge indicando su fase de origen

Esto permite al investigador mantener claridad sobre el origen de cada criterio mientras explora patrones transversales.
```

---

## 🎯 Resultado Final

**Antes:**
- ❌ Solo dimensiones de fase activa
- ❌ No se pueden comparar criterios entre fases
- ❌ Análisis fragmentado

**Después:**
- ✅ Análisis de 1, 2 o más fases simultáneamente
- ✅ Selección granular de dimensiones (ej: 3 de Fase 1 + 2 de Fase 2)
- ✅ Filtros, tabla y gráficos reflejan solo dimensiones seleccionadas
- ✅ Agrupación visual clara por fase
- ✅ Flexibilidad total para el investigador

---

## 🔍 Consideraciones Técnicas

### **Performance**
- Cargar solo dimensiones necesarias (no todas las fases por defecto)
- Paginar artículos (ya implementado)
- Cachear selección de dimensiones en localStorage

### **Validación**
- Mínimo 1 dimensión seleccionada
- Advertir si se seleccionan >15 dimensiones (tabla muy ancha)

### **Edge Cases**
- Fase sin dimensiones activas → mostrar mensaje
- Artículo sin clasificación en alguna dimensión → mostrar "N/A"
- Cambio de fase activa → actualizar selector automáticamente

---

**Fecha de Creación:** 13 de Marzo, 2026  
**Estado:** Diseño Completo - Listo para Implementación  
**Prioridad:** Alta - Funcionalidad Core del Sistema Multifase
