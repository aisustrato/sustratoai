# Refactorización del Home Dashboard - SUSTRATO.AI

## 🎯 Objetivo

Transformar el home actual (histórico y desactualizado) en un **dashboard visual e informativo** que presente el estado del proyecto de investigación de forma clara, bonita y funcional para investigadores humanistas.

---

## 📊 Estructura Propuesta

### **Sección 1: Información del Proyecto** (Siempre visible)
**Componente:** `StandardCard` con `styleType="outline"`

**Contenido:**
- **Nombre del proyecto** (título principal)
- **Institución** (subtítulo)
- **Descripción general** (texto truncado con tooltip si es largo)
- **Icono:** Brain o Sparkles (identidad Sustrato)

**Datos desde:**
- Tabla `projects` (campos: `name`, `institution`, `description`)
- Context actual del proyecto activo

---

### **Sección 2: Datos Maestros del Proyecto**
**Componente:** `StandardCard` con header y secciones internas

**Subsecciones:**

#### **2.1 Equipo y Roles**
- **Icono:** Users
- **Métrica:** Número de miembros del proyecto
- **Detalle:** Roles creados (ej: "3 roles: Investigador Principal, Asistente, Revisor")
- **Botón:** "Ver Equipo" → `/datos-maestros/miembros`

**Datos desde:**
- `project_members` (count de miembros)
- `project_roles` (listado de roles únicos)

#### **2.2 Biblioteca de Artículos**
- **Icono:** BookOpen
- **Métrica:** Número de artículos cargados
- **Estado:** 
  - ✅ "X artículos cargados" (si > 0)
  - ⚠️ "Sin artículos cargados" (si = 0)
- **Botón:** "Ver Biblioteca" → `/articulos/base-original`

**Datos desde:**
- `articles` WHERE `project_id` (count)

#### **2.3 Fases de Investigación**
- **Icono:** Layers
- **Métrica:** Número de fases creadas
- **Detalle:** Fase activa actual (si existe)
- **Botón:** "Gestionar Fases" → `/datos-maestros/fases`

**Datos desde:**
- `project_phases` (count total)
- `project_phases` WHERE `is_active = true` (fase activa)

#### **2.4 Dimensiones de Análisis**
- **Icono:** Grid3x3
- **Métrica:** Número de dimensiones creadas
- **Detalle:** Por fase (ej: "Fase 1: 5 dimensiones, Fase 2: 3 dimensiones")
- **Botón:** "Ver Dimensiones" → `/datos-maestros/dimensiones`

**Datos desde:**
- `preclass_dimensions` (count total y agrupado por `phase_id`)

#### **2.5 Lotes de Preclasificación**
- **Icono:** Package
- **Métrica:** Número de lotes creados
- **Estado:**
  - ✅ "X lotes creados" (si > 0)
  - ⚠️ "Sin lotes creados" (si = 0)
- **Botón:** "Ver Lotes" → `/datos-maestros/lote`

**Datos desde:**
- `article_batches` (count total)

---

### **Sección 3: Estado de la Fase Activa de Preclasificación**
**Componente:** `StandardCard` con gráfico y estadísticas

**Condiciones de visualización:**
- ✅ **Si existe fase activa CON lotes creados:** Mostrar dashboard completo
- ⚠️ **Si existe fase activa SIN lotes:** Mensaje "Fase activa sin lotes. Crea lotes para comenzar."
- 🚫 **Si NO existe fase activa:** Ocultar esta sección

**Contenido (cuando aplica):**

#### **3.1 Header**
- **Título:** "Fase Activa: [Nombre de la Fase]"
- **Subtítulo:** "Estado de Preclasificación"
- **Icono:** Target

#### **3.2 Gráfico del Universo**
- **Componente:** `StandardPieChart` (mismo de `/articulos/preclasificacion`)
- **Datos:** Agregación de estados de artículos en lotes de la fase activa
  - Pendientes
  - Traducidos
  - Pendientes de Revisión
  - Pendientes de Reconciliación
  - Validados
  - Reconciliados
  - En Disputa

**Datos desde:**
- RPC `get_user_batches_with_detailed_counts` filtrado por fase activa
- Agregación de `article_counts` de todos los lotes

#### **3.3 Estadísticas Clave**
- **Total de artículos en la fase**
- **Lotes activos** (no cerrados)
- **Lotes completados** (cerrados)
- **Progreso general** (% de artículos validados/reconciliados vs total)

#### **3.4 Botón de Acción**
- **Texto:** "Ir a Preclasificación"
- **Destino:** `/articulos/preclasificacion`
- **StyleType:** `filled` con `colorScheme="primary"`

---

### **Sección 4: Trabajo Personal del Investigador**
**Componente:** `StandardCard` personalizada

**Condiciones de visualización:**
- Siempre visible (aunque esté vacía)

**Contenido:**

#### **4.1 Header Personalizado**
- **Título:** "Hola, [Nombre del Usuario]"
- **Subtítulo:** "Tu Espacio Personal"
- **Icono:** User

#### **4.2 Notas Personales**
- **Icono:** StickyNote
- **Métrica:** Número de notas creadas
- **Estado:**
  - ✅ "X notas personales" (si > 0)
  - 💡 "Aún no has creado notas" (si = 0)
- **Botón:** "Ver Notas" → `/personal/notas` (si existe esta ruta)

**Datos desde:**
- `article_notes` WHERE `user_id = auth.uid()` (count)

#### **4.3 Grupos de Artículos**
- **Icono:** FolderOpen
- **Métrica:** Número de grupos creados
- **Detalle:** Artículos totales en grupos
- **Estado:**
  - ✅ "X grupos con Y artículos" (si > 0)
  - 💡 "Aún no has creado grupos" (si = 0)
- **Botón:** "Ver Grupos" → `/articulos/grupos` (si existe esta ruta)

**Datos desde:**
- `article_groups` WHERE `user_id = auth.uid()` (count de grupos)
- `article_group_items` (count de artículos en esos grupos)

#### **4.4 Historial de Trabajos IA**
- **Icono:** History
- **Métrica:** Trabajos recientes completados
- **Botón:** "Ver Historial" → `/personal/historial_ai`

**Datos desde:**
- `ai_job_history` WHERE `user_id = auth.uid()` ORDER BY `completed_at` DESC LIMIT 5

---

## 🎨 Diseño Visual

### **Layout General**
```
┌─────────────────────────────────────────────────────┐
│  📍 Información del Proyecto (Card outline)         │
│  [Nombre] - [Institución]                           │
│  [Descripción truncada...]                          │
└─────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│  📊 Datos Maestros       │  🎯 Fase Activa          │
│  ├─ 👥 Equipo (X)        │  [Nombre Fase]           │
│  ├─ 📚 Artículos (X)     │  [Gráfico Pie]           │
│  ├─ 📐 Fases (X)         │  [Estadísticas]          │
│  ├─ 🔢 Dimensiones (X)   │  [Botón Ir]              │
│  └─ 📦 Lotes (X)         │                          │
└──────────────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  👤 Hola, [Usuario]                                  │
│  ├─ 📝 Notas (X)                                     │
│  ├─ 📁 Grupos (X)                                    │
│  └─ 🕐 Historial IA                                  │
└─────────────────────────────────────────────────────┘
```

### **Paleta de Colores**
- **Card Proyecto:** `colorScheme="primary"` con `styleType="outline"`
- **Card Datos Maestros:** `colorScheme="secondary"` con `styleType="subtle"`
- **Card Fase Activa:** `colorScheme="accent"` con `styleType="filled"`
- **Card Personal:** `colorScheme="tertiary"` con `styleType="subtle"`

### **Iconografía**
- Usar `lucide-react` para consistencia
- Tamaño: `size={20}` para iconos de métricas
- Tamaño: `size={24}` para iconos de headers

---

## 🔧 Implementación Técnica

### **Archivo Principal**
`/app/page.tsx` (home raíz)

### **Server Actions Necesarias**
Crear `/lib/actions/dashboard-actions.ts`:

```typescript
// 1. Información del proyecto
export async function getProjectInfo(projectId: string)

// 2. Datos maestros agregados
export async function getProjectMasterData(projectId: string)
// Retorna: { members, roles, articles, phases, dimensions, batches }

// 3. Estado de fase activa
export async function getActivePhaseStatus(projectId: string)
// Retorna: { phase, batchCounts, articleCounts, progress }

// 4. Datos personales del usuario
export async function getUserPersonalData(userId: string, projectId: string)
// Retorna: { notes, groups, recentJobs }
```

### **Componentes Reutilizables**
- `StandardCard` (ya existe)
- `StandardPieChart` (ya existe)
- `StandardButton` (ya existe)
- `StandardBadge` (para métricas)
- `StandardDivider` (para separar secciones)

### **Nuevos Componentes Específicos**
- `DashboardMetricCard.tsx` - Card pequeña para métricas individuales
- `DashboardEmptyState.tsx` - Estado vacío bonito con ilustración

---

## 📋 Casos de Uso y Estados

### **Caso 1: Proyecto Nuevo (Sin Datos)**
- ✅ Mostrar info del proyecto
- ⚠️ Datos Maestros: Todos en 0 con mensajes motivadores
- 🚫 Fase Activa: Oculta
- 💡 Personal: "Comienza creando tu primer grupo de artículos"

### **Caso 2: Proyecto con Datos Maestros (Sin Fase Activa)**
- ✅ Mostrar info del proyecto
- ✅ Datos Maestros: Métricas reales
- 🚫 Fase Activa: Oculta
- 💡 Personal: Mostrar notas/grupos si existen

### **Caso 3: Proyecto con Fase Activa (Sin Lotes)**
- ✅ Mostrar info del proyecto
- ✅ Datos Maestros: Métricas reales
- ⚠️ Fase Activa: Mensaje "Crea lotes para comenzar"
- ✅ Personal: Datos reales

### **Caso 4: Proyecto Operativo (Con Todo)**
- ✅ Mostrar info del proyecto
- ✅ Datos Maestros: Métricas reales
- ✅ Fase Activa: Dashboard completo con gráfico
- ✅ Personal: Datos reales

---

## 🚀 Plan de Ejecución

### **Fase 1: Preparación**
1. Crear `/lib/actions/dashboard-actions.ts`
2. Crear tipos en `/lib/types/dashboard-types.ts`
3. Crear componentes auxiliares (`DashboardMetricCard`, `DashboardEmptyState`)

### **Fase 2: Implementación de Secciones**
1. Refactorizar `/app/page.tsx` - Sección Proyecto
2. Implementar Sección Datos Maestros
3. Implementar Sección Fase Activa (condicional)
4. Implementar Sección Personal

### **Fase 3: Pulido Visual**
1. Aplicar paleta de colores consistente
2. Agregar animaciones sutiles (fade-in)
3. Responsive design (mobile-first)
4. Verificar accesibilidad

### **Fase 4: Testing**
1. Probar con proyecto vacío
2. Probar con datos parciales
3. Probar con proyecto completo
4. Verificar performance (lazy loading si es necesario)

---

## 🎯 Criterios de Aceptación

- [ ] Home carga en < 2 segundos
- [ ] Todas las métricas son precisas
- [ ] Estados vacíos son motivadores, no frustrantes
- [ ] Navegación fluida a todas las secciones
- [ ] Gráfico de fase activa funciona igual que en `/articulos/preclasificacion`
- [ ] Responsive en mobile, tablet y desktop
- [ ] Accesible (WCAG AA)
- [ ] Sin errores en consola
- [ ] Linter pasa sin warnings

---

## 📝 Notas Adicionales

### **Consideraciones UX para Humanistas**
- **Lenguaje claro:** Evitar jerga técnica
- **Iconos descriptivos:** Cada métrica con icono relevante
- **Colores semánticos:** Verde = completo, Amarillo = en progreso, Gris = vacío
- **Mensajes motivadores:** "Comienza tu investigación creando..." en lugar de "0 artículos"
- **Acciones claras:** Botones con verbos de acción ("Ver", "Crear", "Gestionar")

### **Performance**
- Usar `React.Suspense` para secciones que requieren datos pesados
- Implementar `loading.tsx` para feedback visual
- Considerar `revalidate` en Server Components para cache inteligente

### **Extensibilidad Futura**
- Dejar espacio para widget de "Últimas Actividades"
- Considerar sección de "Recomendaciones IA" (sugerencias de dimensiones, etc.)
- Posibilidad de personalizar qué cards se muestran (preferencias de usuario)

---

## 🔗 Referencias

- Ruta actual de preclasificación: `/app/articulos/preclasificacion/page.tsx`
- Gráfico de pie: `/components/charts/StandardPieChart.tsx`
- RPC de lotes: `get_user_batches_with_detailed_counts`
- Sistema de cards: `/docs/standard-UI/StandardCard.md`

---

**Fecha de Creación:** 23 Mar 2026  
**Estado:** Propuesta Lista para Implementación  
**Prioridad:** Alta (Home es la primera impresión del sistema)
