# 🕸️ Cognética: Propuesta de Hipergrafo Inteligente

> **Documento de Planificación:** Arquitectura para transformar la página raíz de Cognética en un sistema de navegación inteligente basado en hipergrafo, con filtros por elementos cognitivos, búsqueda avanzada y paginación.

**Fecha:** Febrero 2026  
**Estado:** Propuesta (sin implementación de código)  
**Objetivo:** Ayudar al humano a interactuar con artefactos mediante conexiones semánticas

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Análisis del Estado Actual](#análisis-del-estado-actual)
3. [Fase 1: Hipergrafo e Inteligencia de Filtros](#fase-1-hipergrafo-e-inteligencia-de-filtros)
4. [Fase 2: Jardines de Resonancia](#fase-2-jardines-de-resonancia)
5. [Arquitectura Técnica](#arquitectura-técnica)
6. [Componentes UI Propuestos](#componentes-ui-propuestos)
7. [Flujos de Interacción](#flujos-de-interacción)
8. [Queries y Performance](#queries-y-performance)
9. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Visión General

### Problema Actual

La página raíz de Cognética (`/app/cognetica/page.tsx`) actualmente:
- ✅ Muestra lista simple de artefactos recientes (últimos 10)
- ❌ **No tiene paginación** (solo muestra 10 items)
- ❌ **No tiene búsqueda** por título o tipo
- ❌ **No permite filtrar** por elementos cognitivos (semillas, disciplinas, teorías)
- ❌ **No muestra conexiones** entre artefactos (hipergrafo)
- ❌ **No permite explorar** relaciones semánticas

### Visión Propuesta

Transformar la página raíz en un **"Explorador de Hipergrafo Cognitivo"** que permita:

1. **Búsqueda Inteligente:**
   - Por título de artefacto
   - Por tipo (audio, video, documento, presentación)
   - Por elementos cognitivos (semillas fractales, disciplinas, teorías, pensadores)

2. **Filtros Dinámicos:**
   - Seleccionar una semilla fractal → ver todos los artefactos que la contienen
   - Seleccionar una disciplina → ver artefactos relacionados
   - Seleccionar un pensador → ver dónde se menciona
   - Combinar filtros (AND/OR)

3. **Navegación por Hipergrafo:**
   - Visualizar conexiones entre artefactos
   - Ver "artefactos relacionados" por elementos compartidos
   - Explorar clusters temáticos

4. **Paginación Robusta:**
   - Reutilizar `StandardPagination` existente
   - Soporte para grandes volúmenes de artefactos
   - Mantener estado de filtros al paginar

---

## 📊 Análisis del Estado Actual

### Página Raíz Actual (`/app/cognetica/page.tsx`)

**Componentes Presentes:**
- `StandardPageTitle`: Título y subtítulo
- `StandardCard`: Tarjetas para stats y lista
- `StandardButton`: Botón "Nuevo Artefacto"
- `StandardBadge`: Estados de procesamiento
- `StandardEmptyState`: Cuando no hay artefactos

**Query Actual:**
```typescript
const { data } = await supabase
    .from('cog_artifacts')
    .select('id, title, type, status, created_at, duration_seconds, project_id')
    .eq('project_id', auth.proyectoActual.id)
    .order('created_at', { ascending: false })
    .limit(10); // ⚠️ Solo 10 items, sin paginación
```

**Limitaciones:**
- No trae elementos cognitivos (semillas, disciplinas, etc.)
- No permite filtrar ni buscar
- No muestra conexiones entre artefactos

---

### Componente StandardPagination

**Ubicación:** `/components/ui/StandardPagination.tsx`

**Props:**
```typescript
interface StandardPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
    className?: string;
}
```

**Características:**
- ✅ Lógica de paginación con siblings (dots inteligentes)
- ✅ Botones "Anterior" / "Siguiente"
- ✅ Muestra rango de items ("Mostrando 1-20 de 150")
- ✅ Compatible con sistema de tokens v4
- ✅ **Reutilizable** para Cognética

---

### Tablas de Base de Datos Relevantes

**Artefactos:**
- `cog_artifacts`: Artefacto principal (título, tipo, status)

**Elementos Cognitivos:**
- `cog_fractal_seeds`: Semillas fractales extraídas
- `cog_disciplines`: Catálogo de disciplinas
- `cog_artifact_disciplines`: Relación N:M (artefacto ↔ disciplina)
- `cog_theories`: Catálogo de teorías
- `cog_artifact_theories`: Relación N:M (artefacto ↔ teoría)
- `cog_thinkers`: Pensadores/referencias
- `cog_artifact_references`: Relación N:M (artefacto ↔ pensador)

**Metadata:**
- `source_metadata` (JSONB en `cog_artifacts`): Contiene `quotes`, `image_prompts`, `pop_culture_analogies`

---

## 🕸️ Fase 1: Hipergrafo e Inteligencia de Filtros

### Objetivos de Fase 1

1. **Búsqueda por Texto:**
   - Campo de búsqueda por título de artefacto
   - Búsqueda en tiempo real (debounced)

2. **Filtros por Tipo:**
   - Checkboxes: Audio, Video, Documento, Presentación
   - Filtro múltiple (OR)

3. **Filtros por Elementos Cognitivos:**
   - **Semillas Fractales:** Dropdown/autocomplete con todas las semillas del proyecto
   - **Disciplinas:** Dropdown con disciplinas únicas
   - **Teorías:** Dropdown con teorías únicas
   - **Pensadores:** Dropdown con pensadores únicos

4. **Paginación:**
   - Integrar `StandardPagination`
   - 20 items por página (configurable)
   - Mantener filtros al cambiar de página

5. **Vista de Hipergrafo (Simple):**
   - Mostrar "Artefactos Relacionados" en cada tarjeta
   - Basado en elementos cognitivos compartidos
   - Contador: "3 artefactos comparten semillas con este"

---

### UI Propuesta para Fase 1

```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 Cognética Forense                    [+ Nuevo Artefacto]     │
│ Análisis fractal, transcripción y minería de conocimiento       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Búsqueda y Filtros                                           │
├─────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar por título...]                                       │
│                                                                  │
│ Tipo: [✓ Audio] [✓ Video] [✓ Documento] [✓ Presentación]      │
│                                                                  │
│ Semilla Fractal: [Seleccionar semilla... ▼]                    │
│ Disciplina:      [Seleccionar disciplina... ▼]                 │
│ Teoría:          [Seleccionar teoría... ▼]                     │
│ Pensador:        [Seleccionar pensador... ▼]                   │
│                                                                  │
│ [🗑️ Limpiar Filtros]  [🔍 Aplicar]                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📊 Resultados (45 artefactos encontrados)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🎙️ Entrevista con Dr. Jung                                │  │
│ │ hace 2 días • 45:30 • [✅ Procesado]                       │  │
│ │                                                             │  │
│ │ 🌱 3 semillas | 🔬 2 disciplinas | 👤 5 pensadores         │  │
│ │ 🕸️ Relacionado con 7 artefactos                            │  │
│ │                                                             │  │
│ │                                    [Ver Estudio →]         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 📄 Informe Sustrato Q4                                     │  │
│ │ hace 1 semana • [⚠️ Analizando...]                         │  │
│ │                                                             │  │
│ │ 🌱 12 semillas | 🔬 4 disciplinas | 👤 8 pensadores        │  │
│ │ 🕸️ Relacionado con 3 artefactos                            │  │
│ │                                                             │  │
│ │                                    [Ver Estudio →]         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Mostrando 1-20 de 45 resultados                                 │
│                                                                  │
│ [← Anterior]  [1] [2] [3] ... [23]  [Siguiente →]              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Lógica de Filtros (Hipergrafo)

**Cuando el usuario selecciona una semilla fractal:**

1. Query a `cog_fractal_seeds` para obtener `artifact_id`s que contienen esa semilla
2. Filtrar lista de artefactos por esos IDs
3. Mostrar resultados con indicador: "Contiene semilla: [nombre]"

**Cuando el usuario selecciona una disciplina:**

1. Query a `cog_artifact_disciplines` → JOIN con `cog_disciplines`
2. Obtener `artifact_id`s asociados a esa disciplina
3. Filtrar lista

**Combinación de filtros (AND):**

```sql
-- Ejemplo: Artefactos que tienen AMBOS:
-- - Semilla "sistemas complejos"
-- - Disciplina "física"

SELECT DISTINCT a.id, a.title, a.type, a.status, a.created_at
FROM cog_artifacts a
INNER JOIN cog_fractal_seeds s ON s.artifact_id = a.id
INNER JOIN cog_artifact_disciplines ad ON ad.artifact_id = a.id
INNER JOIN cog_disciplines d ON d.id = ad.discipline_id
WHERE a.project_id = $1
  AND s.content ILIKE '%sistemas complejos%'
  AND d.name = 'física'
ORDER BY a.created_at DESC
LIMIT 20 OFFSET 0;
```

---

### Contador de Relaciones (Hipergrafo Simple)

Para cada artefacto, calcular cuántos otros artefactos comparten elementos cognitivos:

```typescript
// Pseudo-código
async function getRelatedArtifactsCount(artifactId: string): Promise<number> {
    // 1. Obtener semillas del artefacto actual
    const { data: seeds } = await supabase
        .from('cog_fractal_seeds')
        .select('content')
        .eq('artifact_id', artifactId);
    
    // 2. Buscar otros artefactos con semillas similares
    const { data: related } = await supabase
        .from('cog_fractal_seeds')
        .select('artifact_id')
        .neq('artifact_id', artifactId) // Excluir el actual
        .in('content', seeds.map(s => s.content));
    
    // 3. Contar artefactos únicos
    const uniqueArtifacts = new Set(related.map(r => r.artifact_id));
    return uniqueArtifacts.size;
}
```

**Optimización:** Precalcular esto en un campo `related_count` o usar una vista materializada.

---

## 🌱 Fase 2: Jardines de Resonancia

### Concepto

**"Jardín de Resonancia"** = Colección curada por el humano de elementos cognitivos que considera **isométricos** o **pertinentes** para su investigación.

**Ejemplo:**
- Usuario investiga "Física de la Viabilidad"
- Crea jardín: "Fundamentos Termodinámicos"
- Agrega semillas: "entropía", "sistemas abiertos", "autoorganización"
- Agrega disciplinas: "termodinámica", "teoría de sistemas"
- Agrega pensadores: "Prigogine", "Maturana"

**Resultado:** El jardín actúa como un **filtro persistente** que muestra todos los artefactos relacionados con esos elementos.

---

### Funcionalidades de Jardines

1. **Crear Jardín:**
   - Nombre y descripción
   - Seleccionar elementos cognitivos (semillas, disciplinas, teorías, pensadores)
   - Guardar como entidad persistente

2. **Ver Jardín:**
   - Lista de artefactos que contienen AL MENOS UNO de los elementos del jardín
   - Ordenar por "relevancia" (cuántos elementos del jardín contiene cada artefacto)
   - Visualización de grafo: nodos = artefactos, aristas = elementos compartidos

3. **Editar Jardín:**
   - Agregar/quitar elementos cognitivos
   - Renombrar jardín
   - Compartir con otros usuarios del proyecto

4. **Comparar Jardines:**
   - Ver intersección entre dos jardines
   - Detectar "resonancias" (elementos que aparecen en múltiples jardines)

---

### Tabla de Base de Datos Propuesta

```sql
-- Jardines de resonancia
CREATE TABLE cog_resonance_gardens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Elementos del jardín (polimórfico)
CREATE TABLE cog_garden_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID NOT NULL REFERENCES cog_resonance_gardens(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL, -- 'seed', 'discipline', 'theory', 'thinker'
    element_id UUID, -- ID de la tabla correspondiente (nullable para seeds que son texto)
    element_content TEXT, -- Para semillas fractales (texto libre)
    added_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_garden_elements_garden ON cog_garden_elements(garden_id);
CREATE INDEX idx_garden_elements_type ON cog_garden_elements(element_type);
```

---

### UI Propuesta para Jardines (Fase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🌱 Mis Jardines de Resonancia                [+ Crear Jardín]   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🌱 Fundamentos Termodinámicos                                   │
│ Elementos clave para entender sistemas disipativos              │
│                                                                  │
│ 🌱 3 semillas | 🔬 2 disciplinas | 👤 4 pensadores              │
│ 📊 15 artefactos relacionados                                   │
│                                                                  │
│ [Ver Artefactos] [Editar] [Compartir]                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🌱 Cognición Distribuida                                        │
│ Explorando la mente extendida y sistemas cognitivos             │
│                                                                  │
│ 🌱 8 semillas | 🔬 3 disciplinas | 👤 6 pensadores              │
│ 📊 23 artefactos relacionados                                   │
│                                                                  │
│ [Ver Artefactos] [Editar] [Compartir]                           │
└─────────────────────────────────────────────────────────────────┘
```

**Vista de Artefactos en un Jardín:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🌱 Jardín: Fundamentos Termodinámicos                           │
│ 15 artefactos encontrados                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🎙️ Entrevista con Prigogine                               │  │
│ │ Relevancia: ████████░░ 80% (4/5 elementos del jardín)     │  │
│ │                                                             │  │
│ │ ✓ entropía | ✓ sistemas abiertos | ✓ termodinámica        │  │
│ │ ✓ Prigogine                                                │  │
│ │                                                             │  │
│ │                                    [Ver Estudio →]         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 📄 Paper sobre Autoorganización                            │  │
│ │ Relevancia: ██████░░░░ 60% (3/5 elementos del jardín)     │  │
│ │                                                             │  │
│ │ ✓ autoorganización | ✓ sistemas abiertos                  │  │
│ │ ✓ teoría de sistemas                                       │  │
│ │                                                             │  │
│ │                                    [Ver Estudio →]         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura Técnica

### Estructura de Carpetas Propuesta

```
app/cognetica/
├── page.tsx                          # Página raíz (lista con filtros)
├── [id]/page.tsx                     # Detalle de artefacto (existente)
├── nuevo/page.tsx                    # Crear artefacto (existente)
├── jardines/                         # NUEVO: Jardines de Resonancia
│   ├── page.tsx                      # Lista de jardines
│   ├── nuevo/page.tsx                # Crear jardín
│   └── [gardenId]/page.tsx           # Ver artefactos del jardín
└── components/
    ├── ArtifactFilters.tsx           # NUEVO: Panel de filtros
    ├── ArtifactCard.tsx              # NUEVO: Tarjeta de artefacto con relaciones
    ├── CognitiveElementSelector.tsx  # NUEVO: Selector de elementos cognitivos
    └── GardenCard.tsx                # NUEVO: Tarjeta de jardín

lib/actions/
├── cognetica-actions.ts              # Existente
├── cognetica-filters-actions.ts      # NUEVO: Queries con filtros
└── cognetica-gardens-actions.ts      # NUEVO: CRUD de jardines

components/ui/
└── StandardPagination.tsx            # Existente (reutilizar)
```

---

### Actions Propuestas (Fase 1)

**`lib/actions/cognetica-filters-actions.ts`**

```typescript
export interface ArtifactFilters {
    searchText?: string;
    types?: Array<'audio' | 'video' | 'document' | 'image'>;
    seedContent?: string;
    disciplineId?: string;
    theoryId?: string;
    thinkerId?: string;
}

export interface PaginatedArtifacts {
    artifacts: Array<{
        id: string;
        title: string;
        type: string;
        status: string;
        created_at: string;
        duration_seconds: number | null;
        // Contadores de elementos cognitivos
        seeds_count: number;
        disciplines_count: number;
        theories_count: number;
        thinkers_count: number;
        // Contador de relaciones
        related_artifacts_count: number;
    }>;
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

export async function getFilteredArtifacts(
    projectId: string,
    filters: ArtifactFilters,
    page: number = 1,
    itemsPerPage: number = 20
): Promise<PaginatedArtifacts> {
    // Implementación con queries complejas
}

export async function getCognitiveElementsForProject(
    projectId: string
): Promise<{
    seeds: Array<{ content: string; count: number }>;
    disciplines: Array<{ id: string; name: string; count: number }>;
    theories: Array<{ id: string; name: string; count: number }>;
    thinkers: Array<{ id: string; name: string; count: number }>;
}> {
    // Para poblar los dropdowns de filtros
}
```

---

### Componente ArtifactFilters (Fase 1)

```typescript
// app/cognetica/components/ArtifactFilters.tsx
interface ArtifactFiltersProps {
    filters: ArtifactFilters;
    onFiltersChange: (filters: ArtifactFilters) => void;
    availableElements: {
        seeds: Array<{ content: string; count: number }>;
        disciplines: Array<{ id: string; name: string; count: number }>;
        theories: Array<{ id: string; name: string; count: number }>;
        thinkers: Array<{ id: string; name: string; count: number }>;
    };
}

export const ArtifactFilters: React.FC<ArtifactFiltersProps> = ({
    filters,
    onFiltersChange,
    availableElements
}) => {
    // UI con StandardInput, StandardSelect, StandardCheckbox
    // Debounced search para búsqueda en tiempo real
    // Botón "Limpiar Filtros"
};
```

---

### Componente ArtifactCard (Fase 1)

```typescript
// app/cognetica/components/ArtifactCard.tsx
interface ArtifactCardProps {
    artifact: {
        id: string;
        title: string;
        type: string;
        status: string;
        created_at: string;
        duration_seconds: number | null;
        seeds_count: number;
        disciplines_count: number;
        theories_count: number;
        thinkers_count: number;
        related_artifacts_count: number;
    };
    onClick: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({
    artifact,
    onClick
}) => {
    // StandardCard con:
    // - Icono según tipo
    // - Título y fecha
    // - Badge de status
    // - Contadores de elementos cognitivos
    // - Indicador de relaciones: "🕸️ Relacionado con X artefactos"
    // - Botón "Ver Estudio"
};
```

---

## 🔍 Queries y Performance

### Query Principal con Filtros

```sql
-- Query optimizada para obtener artefactos con filtros y contadores
WITH filtered_artifacts AS (
    SELECT DISTINCT a.id
    FROM cog_artifacts a
    LEFT JOIN cog_fractal_seeds s ON s.artifact_id = a.id
    LEFT JOIN cog_artifact_disciplines ad ON ad.artifact_id = a.id
    LEFT JOIN cog_disciplines d ON d.id = ad.discipline_id
    LEFT JOIN cog_artifact_theories at ON at.artifact_id = a.id
    LEFT JOIN cog_theories t ON t.id = at.theory_id
    LEFT JOIN cog_artifact_references ar ON ar.artifact_id = a.id
    LEFT JOIN cog_thinkers th ON th.id = ar.thinker_id
    WHERE a.project_id = $1
      AND ($2::text IS NULL OR a.title ILIKE '%' || $2 || '%')
      AND ($3::text[] IS NULL OR a.type = ANY($3))
      AND ($4::text IS NULL OR s.content ILIKE '%' || $4 || '%')
      AND ($5::uuid IS NULL OR d.id = $5)
      AND ($6::uuid IS NULL OR t.id = $6)
      AND ($7::uuid IS NULL OR th.id = $7)
),
artifact_counts AS (
    SELECT 
        a.id,
        COUNT(DISTINCT s.id) as seeds_count,
        COUNT(DISTINCT ad.discipline_id) as disciplines_count,
        COUNT(DISTINCT at.theory_id) as theories_count,
        COUNT(DISTINCT ar.thinker_id) as thinkers_count
    FROM cog_artifacts a
    LEFT JOIN cog_fractal_seeds s ON s.artifact_id = a.id
    LEFT JOIN cog_artifact_disciplines ad ON ad.artifact_id = a.id
    LEFT JOIN cog_artifact_theories at ON at.artifact_id = a.id
    LEFT JOIN cog_artifact_references ar ON ar.artifact_id = a.id
    WHERE a.id IN (SELECT id FROM filtered_artifacts)
    GROUP BY a.id
)
SELECT 
    a.id,
    a.title,
    a.type,
    a.status,
    a.created_at,
    a.duration_seconds,
    COALESCE(ac.seeds_count, 0) as seeds_count,
    COALESCE(ac.disciplines_count, 0) as disciplines_count,
    COALESCE(ac.theories_count, 0) as theories_count,
    COALESCE(ac.thinkers_count, 0) as thinkers_count,
    0 as related_artifacts_count -- Calcular en segunda query o precalcular
FROM cog_artifacts a
LEFT JOIN artifact_counts ac ON ac.id = a.id
WHERE a.id IN (SELECT id FROM filtered_artifacts)
ORDER BY a.created_at DESC
LIMIT $8 OFFSET $9;
```

### Índices Necesarios

```sql
-- Índices para mejorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_fractal_seeds_content_gin 
    ON cog_fractal_seeds USING gin(to_tsvector('spanish', content));

CREATE INDEX IF NOT EXISTS idx_artifacts_title_gin 
    ON cog_artifacts USING gin(to_tsvector('spanish', title));

CREATE INDEX IF NOT EXISTS idx_artifacts_type 
    ON cog_artifacts(type);

CREATE INDEX IF NOT EXISTS idx_artifacts_project_created 
    ON cog_artifacts(project_id, created_at DESC);
```

### Vista Materializada para Relaciones (Opcional)

```sql
-- Precalcular relaciones entre artefactos
CREATE MATERIALIZED VIEW cog_artifact_relations AS
SELECT 
    a1.id as artifact_id,
    COUNT(DISTINCT a2.id) as related_count
FROM cog_artifacts a1
INNER JOIN cog_fractal_seeds s1 ON s1.artifact_id = a1.id
INNER JOIN cog_fractal_seeds s2 ON s2.content = s1.content AND s2.artifact_id != a1.id
INNER JOIN cog_artifacts a2 ON a2.id = s2.artifact_id
GROUP BY a1.id;

CREATE INDEX idx_artifact_relations_id ON cog_artifact_relations(artifact_id);

-- Refrescar periódicamente (trigger o cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY cog_artifact_relations;
```

---

## 📱 Componentes UI Propuestos

### 1. ArtifactFilters

**Responsabilidad:** Panel de filtros con búsqueda y selección de elementos cognitivos

**Componentes Standard Usados:**
- `StandardCard` (contenedor)
- `StandardInput` (búsqueda por texto)
- `StandardCheckbox` (filtros de tipo)
- `StandardSelect` o `StandardCombobox` (selección de elementos cognitivos)
- `StandardButton` (limpiar filtros, aplicar)

**Estado:**
```typescript
const [filters, setFilters] = useState<ArtifactFilters>({
    searchText: '',
    types: [],
    seedContent: undefined,
    disciplineId: undefined,
    theoryId: undefined,
    thinkerId: undefined
});
```

---

### 2. ArtifactCard

**Responsabilidad:** Tarjeta individual de artefacto con metadata y relaciones

**Componentes Standard Usados:**
- `StandardCard`
- `StandardIcon` (icono según tipo)
- `StandardText` (título, fecha)
- `StandardBadge` (status)
- `StandardButton` (ver estudio)

**Indicadores Visuales:**
- 🌱 X semillas
- 🔬 X disciplinas
- 💡 X teorías
- 👤 X pensadores
- 🕸️ Relacionado con X artefactos

---

### 3. CognitiveElementSelector

**Responsabilidad:** Selector reutilizable para elegir elementos cognitivos (semillas, disciplinas, etc.)

**Props:**
```typescript
interface CognitiveElementSelectorProps {
    type: 'seed' | 'discipline' | 'theory' | 'thinker';
    options: Array<{ id?: string; name: string; count: number }>;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
}
```

**Características:**
- Autocomplete con búsqueda
- Muestra contador de artefactos por elemento
- Permite limpiar selección

---

### 4. GardenCard (Fase 2)

**Responsabilidad:** Tarjeta de jardín de resonancia

**Componentes Standard Usados:**
- `StandardCard`
- `StandardText`
- `StandardBadge` (contadores)
- `StandardButton` (ver, editar, compartir)

---

## 🔄 Flujos de Interacción

### Flujo 1: Búsqueda por Texto

```
Usuario escribe "Jung" en campo de búsqueda
    ↓
Debounce de 300ms
    ↓
Query a BD con filtro ILIKE '%Jung%' en title
    ↓
Actualizar lista de artefactos
    ↓
Mantener paginación en página 1
```

---

### Flujo 2: Filtro por Semilla Fractal

```
Usuario abre dropdown "Semilla Fractal"
    ↓
Cargar todas las semillas únicas del proyecto
    (con contador de artefactos)
    ↓
Usuario selecciona "sistemas complejos"
    ↓
Query a BD:
    - JOIN con cog_fractal_seeds
    - Filtrar por content ILIKE '%sistemas complejos%'
    ↓
Actualizar lista de artefactos
    ↓
Mostrar badge: "Filtrando por semilla: sistemas complejos"
```

---

### Flujo 3: Combinación de Filtros

```
Usuario tiene filtros activos:
    - Tipo: Audio
    - Disciplina: Física
    ↓
Usuario agrega filtro:
    - Semilla: "entropía"
    ↓
Query a BD con AND de todos los filtros:
    WHERE type = 'audio'
      AND discipline_id = '...'
      AND seed_content ILIKE '%entropía%'
    ↓
Actualizar lista (puede quedar vacía)
    ↓
Mostrar mensaje: "3 artefactos encontrados"
```

---

### Flujo 4: Paginación con Filtros

```
Usuario tiene filtros activos
    ↓
Lista muestra 45 resultados (3 páginas de 20)
    ↓
Usuario hace clic en "Página 2"
    ↓
Query a BD con OFFSET 20 LIMIT 20
    (manteniendo filtros)
    ↓
Actualizar lista
    ↓
Scroll automático al inicio de la lista
```

---

### Flujo 5: Ver Artefactos Relacionados

```
Usuario ve tarjeta de artefacto:
    "🕸️ Relacionado con 7 artefactos"
    ↓
Usuario hace clic en el indicador
    ↓
Abrir modal o navegar a vista:
    "Artefactos relacionados con [título]"
    ↓
Mostrar lista de artefactos que comparten:
    - Semillas fractales
    - Disciplinas
    - Teorías
    - Pensadores
    ↓
Ordenar por "relevancia" (más elementos compartidos primero)
```

---

### Flujo 6: Crear Jardín de Resonancia (Fase 2)

```
Usuario hace clic en "Crear Jardín"
    ↓
Formulario:
    - Nombre del jardín
    - Descripción
    - Seleccionar elementos cognitivos:
        * Semillas (multi-select)
        * Disciplinas (multi-select)
        * Teorías (multi-select)
        * Pensadores (multi-select)
    ↓
Usuario guarda jardín
    ↓
INSERT en cog_resonance_gardens
    ↓
INSERT en cog_garden_elements (uno por cada elemento)
    ↓
Navegar a vista del jardín
    ↓
Mostrar artefactos que contienen AL MENOS UNO de los elementos
    ↓
Ordenar por "relevancia" (cuántos elementos del jardín contiene)
```

---

## 📋 Plan de Implementación

### Fase 1: Hipergrafo e Inteligencia de Filtros

**Sprint 1: Búsqueda y Filtros Básicos (1-2 días)**

1. ✅ Crear `lib/actions/cognetica-filters-actions.ts`
   - `getFilteredArtifacts()` con paginación
   - `getCognitiveElementsForProject()` para dropdowns

2. ✅ Crear componente `ArtifactFilters.tsx`
   - Campo de búsqueda por texto
   - Checkboxes de tipo
   - Botón "Limpiar Filtros"

3. ✅ Actualizar `app/cognetica/page.tsx`
   - Integrar `ArtifactFilters`
   - Integrar `StandardPagination`
   - Estado de filtros y paginación

4. ✅ Testing:
   - Búsqueda por título
   - Filtro por tipo
   - Paginación mantiene filtros

---

**Sprint 2: Filtros por Elementos Cognitivos (2-3 días)**

1. ✅ Crear componente `CognitiveElementSelector.tsx`
   - Autocomplete con búsqueda
   - Mostrar contador de artefactos

2. ✅ Agregar selectors a `ArtifactFilters`:
   - Semillas fractales
   - Disciplinas
   - Teorías
   - Pensadores

3. ✅ Actualizar query en `getFilteredArtifacts()`:
   - JOINs con tablas de elementos cognitivos
   - Filtros combinados (AND)

4. ✅ Testing:
   - Filtro por semilla
   - Filtro por disciplina
   - Combinación de filtros

---

**Sprint 3: Tarjetas con Relaciones (2 días)**

1. ✅ Crear componente `ArtifactCard.tsx`
   - Contadores de elementos cognitivos
   - Indicador de relaciones

2. ✅ Implementar cálculo de relaciones:
   - Query para contar artefactos relacionados
   - Precalcular en vista materializada (opcional)

3. ✅ Agregar modal/vista de "Artefactos Relacionados"

4. ✅ Testing:
   - Contador de relaciones correcto
   - Modal muestra artefactos relacionados

---

**Sprint 4: Optimización y Pulido (1-2 días)**

1. ✅ Crear índices en BD
2. ✅ Optimizar queries (EXPLAIN ANALYZE)
3. ✅ Loading states y error handling
4. ✅ Responsive design
5. ✅ Testing de performance con 100+ artefactos

---

### Fase 2: Jardines de Resonancia

**Sprint 5: CRUD de Jardines (2-3 días)**

1. ✅ Crear tablas `cog_resonance_gardens` y `cog_garden_elements`
2. ✅ Crear `lib/actions/cognetica-gardens-actions.ts`
3. ✅ Crear página `/app/cognetica/jardines/page.tsx`
4. ✅ Crear página `/app/cognetica/jardines/nuevo/page.tsx`
5. ✅ Testing: Crear, listar, editar jardines

---

**Sprint 6: Vista de Artefactos en Jardín (2 días)**

1. ✅ Crear página `/app/cognetica/jardines/[gardenId]/page.tsx`
2. ✅ Query para obtener artefactos del jardín
3. ✅ Cálculo de relevancia (% de elementos del jardín)
4. ✅ Ordenar por relevancia
5. ✅ Testing: Vista funcional y performante

---

**Sprint 7: Funcionalidades Avanzadas (2-3 días)**

1. ✅ Compartir jardines con otros usuarios
2. ✅ Comparar jardines (intersección)
3. ✅ Visualización de grafo (opcional, con D3.js o similar)
4. ✅ Exportar jardín a JSON/MD

---

## 🎯 Métricas de Éxito

### Fase 1

- ✅ Usuario puede buscar artefactos por título en <1s
- ✅ Usuario puede filtrar por tipo y ver resultados inmediatos
- ✅ Usuario puede filtrar por semilla fractal y ver artefactos relacionados
- ✅ Paginación funciona con 100+ artefactos sin lag
- ✅ Contador de relaciones es preciso

### Fase 2

- ✅ Usuario puede crear jardín en <2 minutos
- ✅ Jardín muestra artefactos relevantes ordenados por relevancia
- ✅ Usuario puede compartir jardín con colaboradores
- ✅ Comparación de jardines muestra intersecciones útiles

---

## 🚀 Beneficios Esperados

### Para el Humano Investigador

1. **Descubrimiento de Conexiones:**
   - Ver qué artefactos comparten semillas fractales
   - Identificar patrones temáticos

2. **Navegación Eficiente:**
   - Encontrar rápidamente artefactos por elementos cognitivos
   - No perderse en listas largas

3. **Curación de Conocimiento:**
   - Crear jardines temáticos para investigaciones específicas
   - Compartir jardines con colaboradores

4. **Humildad Epistémica:**
   - Ver la red de conocimiento como hipergrafo
   - Reconocer múltiples perspectivas y conexiones

### Para el Sistema

1. **Escalabilidad:**
   - Paginación permite manejar miles de artefactos
   - Índices optimizan queries complejas

2. **Reutilización:**
   - `StandardPagination` ya existe
   - Componentes Standard para UI consistente

3. **Extensibilidad:**
   - Arquitectura permite agregar más filtros
   - Jardines son base para futuras features (grafos, recomendaciones)

---

## 📝 Notas Finales

### Decisiones de Diseño

1. **Paginación Server-Side:**
   - Queries con LIMIT/OFFSET en BD
   - No cargar todos los artefactos en cliente

2. **Filtros Combinados con AND:**
   - Más restrictivo pero más preciso
   - Futuro: Permitir toggle AND/OR

3. **Relaciones Basadas en Contenido:**
   - Semillas fractales como principal conector
   - Futuro: Agregar peso por disciplinas/teorías compartidas

4. **Jardines como Filtros Persistentes:**
   - No son "vistas guardadas" sino entidades con identidad
   - Pueden evolucionar y compartirse

### Próximos Pasos

1. **Validar propuesta con usuario** ✅
2. **Priorizar sprints según necesidad**
3. **Crear issues/tickets en sistema de gestión**
4. **Comenzar implementación de Fase 1, Sprint 1**

---

## 🔗 Referencias

- **Página raíz actual:** `/app/cognetica/page.tsx`
- **StandardPagination:** `/components/ui/StandardPagination.tsx`
- **Arquitectura Cognética:** `/docs/COGNETICA_ARQUITECTURA_TRANSITORIA.md`
- **Ejemplo de filtros:** `/app/articulos/preclasificacion/page.tsx` (SphereGrid con filtros)

---

**Fin del Documento de Propuesta**

*Este documento es un plan vivo que se actualizará según feedback y descubrimientos durante la implementación.*
