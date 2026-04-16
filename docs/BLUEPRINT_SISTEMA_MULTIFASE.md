# Blueprint Técnico: Sistema Multi-Fase con Universos Elegibles

## 🎯 Objetivo Estratégico

Permitir que el sistema de preclasificación evolucione a través de múltiples fases, donde cada fase puede:
1. **Reutilizar el mismo universo** de artículos (agregar dimensiones nuevas) ✅ **CASO 1 - PRIORIDAD**
2. **Crear universos filtrados** (fases embudo - subconjunto de artículos) ✅ **CASO 2 - PRIORIDAD**
3. ~~**Visualizar dimensiones de múltiples fases** simultáneamente~~ ⏸️ **FUTURO**

## ⚠️ DESCUBRIMIENTO IMPORTANTE

**La infraestructura base YA EXISTE:**
- ✅ Tabla `phase_eligible_articles` (equivalente a `universo_articulos`)
- ✅ Tabla `preclass_dimensions` con columna `phase_id`
- ✅ Tabla `preclassification_phases` con estructura base

**Lo que FALTA implementar:**
- 🔧 Metadatos de universo (nombre, descripción, filtros aplicados)
- 🔧 UI para crear universos elegibles desde análisis
- 🔧 Tipos de fase (aditiva/embudo)
- 🔧 Visualización multi-fase

---

## 📊 Casos de Uso a Implementar (Solo 1 y 2)

### **✅ Caso 1: Fase Aditiva (Mismo Universo) - PRIORIDAD ALTA**
**Escenario:** "Me di cuenta clasificando la primera fase que faltan dimensiones"

- **Universo:** 100% de artículos de Fase 1 (257 artículos)
- **Dimensiones:** Fase 1 (8 ya clasificadas) + Fase 2 (3 nuevas)
- **Objetivo:** Enriquecer clasificación sin reducir universo
- **Ejemplo Real:** Fase 1 tiene "Metodología", Fase 2 agrega "Consideraciones Éticas"
- **Implementación:** Reutilizar registros de `phase_eligible_articles` de Fase 1

### **✅ Caso 2: Fase Embudo (Universo Filtrado) - PRIORIDAD MEDIA**
**Escenario:** "Solo seleccionar los que tienen consideraciones éticas"

- **Universo:** Subconjunto filtrado de Fase 1 (ej: 45 de 257 artículos)
- **Dimensiones:** Solo Fase 2 (dimensiones específicas para este subconjunto)
- **Objetivo:** Análisis profundo de un segmento específico
- **Ejemplo Real:** De 257 artículos → filtrar por "Consideraciones Éticas = Sí" → 45 artículos
- **Implementación:** Crear nuevos registros en `phase_eligible_articles` solo con artículos filtrados

### **⏸️ Caso 3: Fase Paralela - FUTURO (No implementar ahora)**
~~Clasificar otro conjunto de artículos con las mismas dimensiones~~

---

## 🏗️ Arquitectura Actual y Cambios Necesarios

### **1. ✅ EXISTE: Tabla `phase_eligible_articles`**

```typescript
// YA EXISTE en database.types.ts
interface PhaseEligibleArticles {
  Row: {
    article_id: string;
    created_at: string | null;
    id: string;
    phase_id: string;
  }
}
```

**Propósito actual:** Define qué artículos pertenecen a cada fase.

### **2. 🔧 AGREGAR: Metadatos de Universo en `preclassification_phases`**

```typescript
// AGREGAR estos campos a preclassification_phases
interface PreclassificationPhase {
  // ... campos existentes ...
  id: string;
  project_id: string;
  name: string;
  phase_number: number;
  description: string | null;
  status: 'draft' | 'active' | 'completed';
  created_at: string | null;
  
  // 🆕 NUEVOS CAMPOS
  universe_name?: string; // "Artículos con Consideraciones Éticas"
  universe_type?: 'complete' | 'filtered'; // Completo o filtrado
  source_phase_id?: string; // Si es filtrado, de qué fase viene
  applied_filters?: Json; // Filtros que se usaron para crear el universo
  total_articles?: number; // Cache del total de artículos
}
```

**Cambios en tabla:** Agregar 5 columnas nuevas a `preclassification_phases`

---

### **3. ✅ EXISTE: Tabla `preclass_dimensions` con `phase_id`**

```typescript
// YA EXISTE en database.types.ts
interface PreclassDimension {
  Row: {
    id: string;
    project_id: string;
    phase_id: string | null; // ✅ YA EXISTE - vincula dimensión a fase
    name: string;
    description: string | null;
    type: 'finite' | 'open';
    icon: string | null;
    ordering: number | null;
    status: 'active' | 'inactive';
    created_at: string | null;
    updated_at: string | null;
  }
}
```

**Propósito:** Cada dimensión ya está vinculada a una fase específica.

**Implicación:** Para Caso 1 (Fase Aditiva), simplemente crear nuevas dimensiones con `phase_id = fase_2_id`

---

### **3. Flujo de Creación de Universo Elegible**

#### **Desde Análisis de Preclasificación:**

```typescript
// Botón "Crear Universo Elegible" en página de análisis
async function crearUniversoElegible(params: {
  nombre: string;
  descripcion?: string;
  projectId: string;
  faseOrigenId?: string; // Si es filtrado
  filtrosActivos?: Record<string, Record<string, 'include' | 'exclude'>>;
  confidenceFilter?: number[];
}) {
  // 1. Calcular total de artículos que cumplen filtros
  const articulos = await getFilteredArticles(params);
  
  // 2. Crear registro en universos_elegibles
  const universo = await supabase
    .from('universos_elegibles')
    .insert({
      project_id: params.projectId,
      nombre: params.nombre,
      descripcion: params.descripcion,
      tipo: params.faseOrigenId ? 'filtrado' : 'completo',
      fase_origen_id: params.faseOrigenId,
      filtros_aplicados: params.filtrosActivos ? {
        dimensiones: params.filtrosActivos,
        confianza: params.confidenceFilter
      } : null,
      total_articulos: articulos.length
    });
  
  // 3. Crear tabla intermedia universo_articulos
  await supabase
    .from('universo_articulos')
    .insert(
      articulos.map(a => ({
        universo_id: universo.id,
        article_id: a.id
      }))
    );
  
  return universo;
}
```

---

### **4. ✅ EXISTE: Tabla `phase_eligible_articles` (equivalente)**

```sql
-- YA EXISTE
CREATE TABLE phase_eligible_articles (
  id UUID PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES preclassification_phases(id),
  article_id UUID NOT NULL REFERENCES articles(id),
  created_at TIMESTAMPTZ,
  
  UNIQUE(phase_id, article_id) -- Probablemente existe
);
```

**Propósito:** Ya materializa qué artículos pertenecen a cada fase.

**Para Caso 1 (Aditiva):** Copiar registros de Fase 1 a Fase 2
**Para Caso 2 (Embudo):** Insertar solo artículos filtrados

---

## 🎨 UX: Flujo de Usuario

### **Paso 1: Crear Universo Elegible**

**Ubicación:** `/app/articulos/analisis-preclasificacion/page.tsx`

```tsx
// Nuevo botón junto a "Descargar CSV"
<StandardButton
  onClick={() => setShowCrearUniversoDialog(true)}
  colorScheme="accent"
  disabled={allFilteredArticles.length === 0}
>
  <Globe size={16} />
  Crear Universo Elegible ({allFilteredArticles.length} artículos)
</StandardButton>

// Dialog para crear universo
<StandardDialog
  title="Crear Universo Elegible"
  content={
    <div>
      <StandardInput
        label="Nombre del Universo"
        placeholder="Ej: Artículos con Consideraciones Éticas"
        value={nombreUniverso}
        onChange={setNombreUniverso}
      />
      
      <StandardTextarea
        label="Descripción (opcional)"
        placeholder="Describe qué artículos incluye este universo..."
        value={descripcionUniverso}
        onChange={setDescripcionUniverso}
      />
      
      {/* Resumen de filtros aplicados */}
      {activeFiltersCount > 0 && (
        <StandardCard>
          <StandardText weight="semibold">Filtros Aplicados:</StandardText>
          {/* Mostrar resumen de filtros activos */}
        </StandardCard>
      )}
      
      <StandardText colorShade="subtle">
        Este universo contendrá {allFilteredArticles.length} artículos
        {activeFiltersCount > 0 
          ? ` (filtrados de ${allArticles.length} totales)`
          : ' (universo completo)'
        }
      </StandardText>
    </div>
  }
  confirmText="Crear Universo"
  onConfirm={handleCrearUniverso}
/>
```

---

### **Paso 2: Seleccionar Universo al Crear Fase**

**Ubicación:** `/app/articulos/page.tsx` (o donde se crean fases)

```tsx
// Al crear nueva fase
<StandardSelect
  label="Universo de Artículos"
  options={universosDisponibles.map(u => ({
    value: u.id,
    label: `${u.nombre} (${u.total_articulos} artículos)`
  }))}
  value={universoSeleccionado}
  onChange={setUniversoSeleccionado}
/>

// Selector de tipo de fase
<StandardSelect
  label="Tipo de Fase"
  options={[
    { value: 'aditiva', label: 'Aditiva - Agregar dimensiones al mismo universo' },
    { value: 'embudo', label: 'Embudo - Análisis profundo de subconjunto' },
    { value: 'paralela', label: 'Paralela - Nuevo universo independiente' }
  ]}
  value={tipoFase}
  onChange={setTipoFase}
/>

{/* Si es aditiva, mostrar selector de fase anterior */}
{tipoFase === 'aditiva' && (
  <StandardSelect
    label="Heredar Dimensiones de Fase"
    options={fasesAnteriores.map(f => ({
      value: f.id,
      label: `Fase ${f.numero_fase}: ${f.nombre}`
    }))}
    value={faseAnteriorId}
    onChange={setFaseAnteriorId}
  />
)}
```

---

### **Paso 3: Visualización Multi-Fase**

**Ubicación:** `/app/articulos/analisis-preclasificacion/page.tsx`

```tsx
// Selector de fases a visualizar
<StandardCard>
  <StandardText weight="semibold">Fases a Visualizar:</StandardText>
  
  <div className="flex flex-wrap gap-2">
    {fasesDelProyecto.map(fase => (
      <StandardBadge
        key={fase.id}
        styleType={fasesSeleccionadas.includes(fase.id) ? "solid" : "outline"}
        colorScheme={fasesSeleccionadas.includes(fase.id) ? "primary" : "neutral"}
        onClick={() => toggleFaseSeleccionada(fase.id)}
      >
        Fase {fase.numero_fase}: {fase.nombre}
        {fase.tipo_fase === 'aditiva' && ' 🔗'}
        {fase.tipo_fase === 'embudo' && ' 🔽'}
      </StandardBadge>
    ))}
  </div>
</StandardCard>

// En visualización de gráficos
{fasesSeleccionadas.map(faseId => {
  const dimensionesFase = getDimensionesPorFase(faseId);
  
  return (
    <StandardCard key={faseId}>
      <StandardText size="lg" weight="bold">
        Fase {getFaseNumero(faseId)}: {getFaseNombre(faseId)}
      </StandardText>
      
      {/* Gráficos de dimensiones de esta fase */}
      <UniverseVisualization
        articles={getArticulosPorFase(faseId)}
        dimensions={dimensionesFase}
      />
    </StandardCard>
  );
})}
```

---

## 🔧 Cambios Técnicos Requeridos

### **Backend (Supabase)**

#### **1. ✅ Tablas que YA EXISTEN (No crear)**
```sql
-- ✅ YA EXISTE
CREATE TABLE phase_eligible_articles (
  id UUID PRIMARY KEY,
  phase_id UUID REFERENCES preclassification_phases(id),
  article_id UUID REFERENCES articles(id),
  created_at TIMESTAMPTZ
);

-- ✅ YA EXISTE
CREATE TABLE preclass_dimensions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  phase_id UUID REFERENCES preclassification_phases(id), -- ✅ Clave para multi-fase
  name TEXT,
  description TEXT,
  type TEXT, -- 'finite' | 'open'
  icon TEXT,
  ordering INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### **2. 🔧 Modificar Tabla `preclassification_phases`**
```sql
-- Migración: Agregar metadatos de universo
ALTER TABLE preclassification_phases 
ADD COLUMN universe_name TEXT,
ADD COLUMN universe_type TEXT CHECK (universe_type IN ('complete', 'filtered')),
ADD COLUMN source_phase_id UUID REFERENCES preclassification_phases(id),
ADD COLUMN applied_filters JSONB,
ADD COLUMN total_articles INTEGER;

-- Índice para consultas de fases relacionadas
CREATE INDEX idx_phases_source_phase ON preclassification_phases(source_phase_id);
```

---

### **Backend (Actions)**

#### **Nuevas Funciones en `/lib/actions/preclassification-actions.ts`**

```typescript
// 1. Crear Fase Aditiva (Caso 1)
export async function createAdditivePhase(params: {
  projectId: string;
  sourcePhaseId: string; // Fase 1 de donde copiar artículos
  name: string;
  description?: string;
}): Promise<ResultadoOperacion<Phase>> {
  // 1. Crear nueva fase
  const newPhase = await supabase
    .from('preclassification_phases')
    .insert({
      project_id: params.projectId,
      name: params.name,
      description: params.description,
      phase_number: (await getMaxPhaseNumber(params.projectId)) + 1,
      universe_type: 'complete',
      source_phase_id: params.sourcePhaseId,
      status: 'draft'
    })
    .select()
    .single();
  
  // 2. Copiar artículos de fase origen
  const { data: sourceArticles } = await supabase
    .from('phase_eligible_articles')
    .select('article_id')
    .eq('phase_id', params.sourcePhaseId);
  
  await supabase
    .from('phase_eligible_articles')
    .insert(
      sourceArticles.map(a => ({
        phase_id: newPhase.id,
        article_id: a.article_id
      }))
    );
  
  // 3. Actualizar total_articles
  await supabase
    .from('preclassification_phases')
    .update({ total_articles: sourceArticles.length })
    .eq('id', newPhase.id);
  
  return { success: true, data: newPhase };
}

// 2. Crear Fase Embudo (Caso 2)
export async function createFilteredPhase(params: {
  projectId: string;
  sourcePhaseId: string;
  name: string;
  description?: string;
  filters: {
    dimensions: Record<string, Record<string, 'include' | 'exclude'>>;
    confidence?: number[];
  };
}): Promise<ResultadoOperacion<Phase>> {
  // 1. Obtener artículos filtrados de fase origen
  const filteredArticles = await getFilteredArticlesFromPhase(
    params.sourcePhaseId,
    params.filters
  );
  
  // 2. Crear nueva fase
  const newPhase = await supabase
    .from('preclassification_phases')
    .insert({
      project_id: params.projectId,
      name: params.name,
      description: params.description,
      phase_number: (await getMaxPhaseNumber(params.projectId)) + 1,
      universe_type: 'filtered',
      source_phase_id: params.sourcePhaseId,
      applied_filters: params.filters,
      total_articles: filteredArticles.length,
      status: 'draft'
    })
    .select()
    .single();
  
  // 3. Insertar solo artículos filtrados
  await supabase
    .from('phase_eligible_articles')
    .insert(
      filteredArticles.map(a => ({
        phase_id: newPhase.id,
        article_id: a.id
      }))
    );
  
  return { success: true, data: newPhase };
}

// 3. Obtener dimensiones de múltiples fases (para visualización)
export async function getDimensionsForPhases(
  phaseIds: string[]
): Promise<ResultadoOperacion<DimensionsByPhase>> {
  const { data, error } = await supabase
    .from('preclass_dimensions')
    .select('*')
    .in('phase_id', phaseIds)
    .order('phase_id', { ascending: true })
    .order('ordering', { ascending: true });
  
  if (error) return { success: false, error: error.message };
  
  // Agrupar por fase
  const byPhase = data.reduce((acc, dim) => {
    if (!acc[dim.phase_id]) acc[dim.phase_id] = [];
    acc[dim.phase_id].push(dim);
    return acc;
  }, {} as Record<string, Dimension[]>);
  
  return { success: true, data: byPhase };
}
```

---

### **Frontend (Componentes)**

#### **Nuevos Componentes**

1. **`CrearUniversoDialog.tsx`**
   - Form para nombre, descripción
   - Resumen de filtros aplicados
   - Confirmación de cantidad de artículos

2. **`UniversoSelector.tsx`**
   - Dropdown para seleccionar universo al crear fase
   - Muestra tipo y cantidad de artículos

3. **`MultiPhaseVisualization.tsx`**
   - Selector de fases a visualizar
   - Gráficos agrupados por fase
   - Comparativa entre fases (opcional)

#### **Componentes a Modificar**

1. **`/app/articulos/analisis-preclasificacion/page.tsx`**
   - Agregar botón "Crear Universo Elegible"
   - Agregar selector multi-fase

2. **`/app/articulos/page.tsx`** (o donde se crean fases)
   - Agregar selector de universo
   - Agregar selector de tipo de fase
   - Agregar selector de fase anterior (si aditiva)

---

## 🚧 Estrategia de Implementación SIMPLIFICADA (Casos 1 y 2)

### **Sprint 1: Migración de BD (2-3 días)**
✅ **Objetivo:** Agregar metadatos de universo a tabla existente

1. Crear migración SQL para agregar columnas a `preclassification_phases`
2. Ejecutar migración en Supabase
3. Regenerar tipos TypeScript (`npm run update-types`)
4. **Prueba:** Verificar que fase actual sigue funcionando

**Riesgo:** Bajo - Solo agrega columnas opcionales

**Archivos:**
- `/supabase/migrations/YYYYMMDD_add_universe_metadata_to_phases.sql`

---

### **Sprint 2: Backend - Caso 1 Aditiva (3-4 días)**
✅ **Objetivo:** Crear Fase 2 con mismo universo que Fase 1

1. Implementar `createAdditivePhase` en `preclassification-actions.ts`
2. Implementar helper `getMaxPhaseNumber`
3. Crear API route `/api/preclassification/phases/create-additive`
4. **Prueba:** Llamar API y verificar que copia artículos correctamente

**Riesgo:** Bajo - Usa tablas existentes

**Archivos:**
- `/lib/actions/preclassification-actions.ts` (agregar funciones)
- `/app/api/preclassification/phases/create-additive/route.ts` (nuevo)

---

### **Sprint 3: Frontend - UI Crear Fase Aditiva (3-4 días)**
✅ **Objetivo:** Botón en análisis para crear Fase 2

1. Agregar botón "Crear Fase Aditiva" en `/app/articulos/analisis-preclasificacion/page.tsx`
2. Crear dialog con form (nombre, descripción)
3. Mostrar resumen: "Se copiarán {N} artículos de Fase {X}"
4. Llamar API al confirmar
5. Redirigir a configuración de dimensiones de nueva fase
6. **Prueba:** Crear Fase 2, agregar 3 dimensiones, clasificar

**Riesgo:** Bajo - UI simple

**Archivos:**
- `/app/articulos/analisis-preclasificacion/page.tsx` (modificar)
- Posible: `/app/articulos/analisis-preclasificacion/components/CreateAdditivePhaseDialog.tsx` (nuevo)

---

### **Sprint 4: Backend - Caso 2 Embudo (3-4 días)**
✅ **Objetivo:** Crear Fase 2 con artículos filtrados

1. Implementar `createFilteredPhase` en `preclassification-actions.ts`
2. Implementar `getFilteredArticlesFromPhase` (reutilizar lógica de filtros actual)
3. Crear API route `/api/preclassification/phases/create-filtered`
4. **Prueba:** Crear fase embudo con filtros complejos

**Riesgo:** Medio - Requiere lógica de filtrado robusta

**Archivos:**
- `/lib/actions/preclassification-actions.ts` (agregar funciones)
- `/app/api/preclassification/phases/create-filtered/route.ts` (nuevo)

---

### **Sprint 5: Frontend - UI Crear Fase Embudo (3-4 días)**
✅ **Objetivo:** Botón en análisis para crear fase filtrada

1. Agregar botón "Crear Fase Embudo" (solo visible si hay filtros activos)
2. Crear dialog mostrando:
   - Filtros aplicados (resumen legible)
   - Total de artículos que se incluirán
   - Advertencia: "Esta fase tendrá menos artículos que la anterior"
3. Llamar API al confirmar
4. **Prueba:** Filtrar por "Consideraciones Éticas = Sí" → Crear fase embudo

**Riesgo:** Bajo - Reutiliza lógica de filtros existente

**Archivos:**
- `/app/articulos/analisis-preclasificacion/page.tsx` (modificar)
- Posible: `/app/articulos/analisis-preclasificacion/components/CreateFilteredPhaseDialog.tsx` (nuevo)

---


**Solución:**
```sql
-- En la migración, actualizar fase existente con valores por defecto
UPDATE preclassification_phases
SET 
  universe_name = 'Universo Completo - ' || name,
  universe_type = 'complete',
  total_articles = (
    SELECT COUNT(*) 
    FROM phase_eligible_articles 
    WHERE phase_id = preclassification_phases.id
  )
WHERE universe_name IS NULL;
```

**Resultado:** Fase 1 sigue funcionando sin cambios

---

### **Riesgo 2: Performance con Múltiples Fases**
**Problema:** Cargar datos de 3+ fases puede ser lento
→ Ver 11 dimensiones juntas

---

## 🚀 Entregables Simplificados

### **Documentos:**
1. ✅ Blueprint técnico (este archivo)
2. 🔧 Migración SQL (1 archivo)
3. ⏸️ Wireframes (opcional - UI es simple)

### **Código a Desarrollar:**
1. **Migraciones SQL:** 1 archivo
   - `YYYYMMDD_add_universe_metadata_to_phases.sql`

2. **Backend:** 2 archivos modificados
   - `/lib/actions/preclassification-actions.ts` (agregar 3 funciones)
   - `/app/api/preclassification/phases/create-additive/route.ts` (nuevo)
   - `/app/api/preclassification/phases/create-filtered/route.ts` (nuevo)

3. **Frontend:** 1 archivo modificado, 0-2 nuevos
   - `/app/articulos/analisis-preclasificacion/page.tsx` (modificar)
   - Opcional: Componentes dialog separados

4. **Types:** Auto-generados
   - `npm run update-types` después de migración

---

## 💡 Decisiones de Diseño Clave

- **Detección de inconsistencias:** Comparar dimensiones relacionadas
- **Flexibilidad:** Usuario decide qué ver

---

## 🎯 Próximos Pasos Inmediatos

### **Decisión: Implementar Solo Casos 1 y 2**
✅ **Aprobado:** Enfoque en Fase Aditiva y Fase Embudo
❌ **Pospuesto:** Visualización multi-fase (Caso 3)

### **Plan de Acción:**

1. **Sprint 1 (2-3 días):** Migración de BD
   - Crear archivo SQL
   - Ejecutar en Supabase
   - Regenerar tipos

2. **Sprint 2 (3-4 días):** Backend Caso 1
   - Implementar `createAdditivePhase`
   - Crear API route
   - Probar con Postman/curl

3. **Sprint 3 (3-4 días):** Frontend Caso 1
   - Botón + Dialog
   - Integración con API
   - Prueba end-to-end

4. **Sprint 4 (3-4 días):** Backend Caso 2
   - Implementar `createFilteredPhase`
   - Reutilizar lógica de filtros

5. **Sprint 5 (3-4 días):** Frontend Caso 2
   - Botón condicional
   - Dialog con resumen de filtros

**Total estimado:** 14-19 días (~3-4 semanas)

---

## 📝 Notas Finales

### **Ventajas de Este Enfoque:**
- ✅ **Usa infraestructura existente** - No crear tablas nuevas
- ✅ **Migración simple** - Solo agregar columnas opcionales
- ✅ **Incremental** - Cada sprint entrega valor
- ✅ **No destructivo** - Fase 1 sigue funcionando
- ✅ **Testeable** - Cada sprint tiene pruebas claras

### **Complejidad Reducida:**
- **Original:** 4 semanas + migración compleja
- **Simplificado:** 3-4 semanas + migración simple
- **Riesgo:** Bajo (usa tablas existentes)

### **Valor Entregado:**
- ✅ Caso 1: Agregar dimensiones sin perder clasificaciones
- ✅ Caso 2: Análisis profundo de subconjuntos
- 🚀 Fundación sólida para Caso 3 (futuro)

### **Siguiente Paso:**
➡️ **Comenzar Sprint 1:** Crear migración SQL
