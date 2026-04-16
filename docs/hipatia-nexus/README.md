# 🍄👁️ Hipatia Nexus - Documentación

> Jardín Civilizatorio Nodal - Mapeo fractal de patrones civilizatorios emergentes

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Schema SQL](#schema-sql)
4. [Server Actions](#server-actions)
5. [Componentes UI](#componentes-ui)
6. [Flujo de Datos](#flujo-de-datos)
7. [Setup Inicial](#setup-inicial)

---

## 🌸 Visión General

Hipatia Nexus es un módulo de visualización interactiva que mapea civilizaciones antiguas, 
sus patrones compartidos (isomorfismos) y anomalías temporales (glitches fértiles).

### Conceptos Clave

| Concepto | Descripción |
|----------|-------------|
| **Civilización** | Nodo principal - cultura histórica con coordenadas temporales y geográficas |
| **Isomorfismo** | Patrón que conecta múltiples civilizaciones (ej: "Agricultura temprana") |
| **Glitch Fértil** | Anomalía temporal que desafía la narrativa oficial |
| **Pattern Tag** | Etiqueta de categorización (ej: "astronomía", "hidráulica") |
| **Validación F0** | Calibración empírica - no es verdad/falsedad, es negabilidad |

---

## 🏗️ Arquitectura

```
app/sandbox/
├── page.tsx                    # Página principal con flujo empty/loaded
├── components/
│   ├── MapaTemporal.tsx        # Visualización SVG principal
│   ├── NodoUniversal.tsx       # Componente de nodo civilización
│   ├── NexusEmptyState.tsx     # Estado vacío + cargador JSON
│   └── SimbolosCivilizaciones.tsx  # Iconos SVG por civilización
├── data/
│   └── hipatia-nexus.json      # Mock data (27 civilizaciones)
├── hooks/
│   └── useNexusColors.ts       # Hook de colores armónicos
└── sql/
    └── hipatia-nexus-schema.sql  # Schema completo para Supabase

lib/actions/
└── nexus-actions.ts            # Server Actions para CRUD
```

---

## 🗄️ Schema SQL

### Tablas Principales

```sql
nexus_regions           -- Continentes/zonas geográficas
nexus_civilizations     -- Nodos principales (27+ civs)
nexus_technologies      -- Tecnologías por civilización
nexus_pattern_tags      -- Etiquetas de patrones
nexus_isomorphisms      -- Patrones que conectan civs
nexus_fertile_glitches  -- Anomalías temporales
nexus_researchers       -- Control de acceso
nexus_validations       -- Calibraciones F0
nexus_validation_chats  -- Chat Cognética (5 msgs max)
```

### Tablas de Relación

```sql
nexus_civilization_tags         -- civilización ↔ tags
nexus_isomorphism_connections   -- isomorfismo ↔ civilizaciones
nexus_civilization_glitches     -- civilización ↔ glitches
```

### Vistas

```sql
nexus_civilizations_with_tags       -- Civs con array de tags
nexus_isomorphisms_with_civilizations -- Isos con array de civs
nexus_validation_stats              -- Estadísticas de validación
```

### RLS (Row Level Security)

Todas las tablas tienen RLS habilitado con políticas:
- **SELECT**: Público para datos base, restringido para validaciones
- **INSERT**: Solo usuarios autenticados
- **UPDATE/DELETE**: Solo investigadores con proyecto activo

---

## ⚡ Server Actions

Ubicación: `lib/actions/nexus-actions.ts`

### Acciones Disponibles

```typescript
// Verificar si hay datos en el Nexus
checkNexusDataAction(): Promise<ResultadoOperacion<{ hasData: boolean; count: number }>>

// Cargar JSON completo al Nexus
loadJsonToNexusAction(jsonData: NexusJsonData): Promise<ResultadoOperacion<{ message: string; stats: LoadStats }>>

// Limpiar todos los datos (para recarga)
clearNexusDataAction(): Promise<ResultadoOperacion<{ cleared: boolean }>>
```

### Tipos

```typescript
interface NexusJsonData {
  regions: NexusRegion[];
  civilizations: NexusCivilization[];
  isomorphisms: NexusIsomorphism[];
}

interface LoadStats {
  regions: number;
  civilizations: number;
  isomorphisms: number;
  connections: number;
  tags: number;
}
```

---

## 🎨 Componentes UI

### `NexusEmptyState`

Estado vacío con dos opciones de carga:
1. **Cargar Hipatia Nexus v0.3** - Datos default del repo (27 civilizaciones)
2. **Cargar JSON personalizado** - Upload de archivo JSON

Props:
```typescript
interface NexusEmptyStateProps {
  onDataLoaded: () => void;  // Callback al completar carga
}
```

### `MapaTemporal`

Visualización SVG interactiva con:
- Eje temporal (12000 BCE - 500 CE)
- Nodos por civilización con tamaño según longevidad
- Colores por región/tipo
- Conexiones de isomorfismos
- Panel de detalle al seleccionar
- Leyenda de simbología
- Exportar a Markdown

### `NodoUniversal`

Nodo individual de civilización con:
- Símbolo único por cultura
- Indicador de anomalía
- Tooltip con info básica
- Estados: normal, selected, ghost

---

## 🔄 Flujo de Datos

```
/sandbox
    │
    ▼
checkNexusDataAction()
    │
    ├─── hasData: false ───► NexusEmptyState
    │                             │
    │                             ▼
    │                    [Botón: Cargar v0.3]
    │                             │
    │                             ▼
    │                    loadJsonToNexusAction()
    │                             │
    │                             ▼
    │                    ┌─────────────────┐
    │                    │ 1. Regiones     │
    │                    │ 2. Tags         │
    │                    │ 3. Civs         │
    │                    │ 4. Civ↔Tags     │
    │                    │ 5. Isos         │
    │                    │ 6. Iso↔Civs     │
    │                    └─────────────────┘
    │                             │
    │                             ▼
    │                    onDataLoaded() → refresh
    │                             │
    └─── hasData: true ◄──────────┘
              │
              ▼
        MapaTemporal
```

---

## 🚀 Setup Inicial

### 1. Ejecutar SQL en Supabase

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Copiar contenido de `app/sandbox/sql/hipatia-nexus-schema.sql`
3. Ejecutar

### 2. Agregar Políticas RLS de INSERT

```sql
-- Permitir INSERT a usuarios autenticados
CREATE POLICY "nexus_regions_insert" ON nexus_regions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_civilizations_insert" ON nexus_civilizations
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_pattern_tags_insert" ON nexus_pattern_tags
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_civilization_tags_insert" ON nexus_civilization_tags
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_isomorphisms_insert" ON nexus_isomorphisms
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "nexus_isomorphism_connections_insert" ON nexus_isomorphism_connections
    FOR INSERT TO authenticated WITH CHECK (true);
```

### 3. Regenerar Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```

### 4. Probar

```bash
npm run dev
# Ir a /sandbox
# Click en "🌱 Cargar Hipatia Nexus v0.3"
```

---

## 📊 Datos Mock (v0.3)

El archivo `app/sandbox/data/hipatia-nexus.json` contiene:

- **8 Regiones**: Mesopotamia, Egipto, Valle del Indo, China, Mesoamérica, Sudamérica, Mediterráneo, Mundo
- **27 Civilizaciones**: Desde Göbekli Tepe (10000 BCE) hasta Roma (500 CE)
- **12 Isomorfismos**: Patrones como "Agricultura Temprana", "Monumentos Megalíticos", etc.

---

## 🔮 Futuro

- [ ] Integrar módulo Cognética - chat validación 5 msgs
- [ ] API Sustrato calibración empírica
- [ ] Conexión con sistema de colores armónicos del tema
- [ ] Exportar visualización como imagen
- [ ] Filtros por región/período/patrón

---

*🌊 El jardín tiene raíces SQL ahora*
