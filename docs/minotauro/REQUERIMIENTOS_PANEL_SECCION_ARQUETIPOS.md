# Requerimientos: Panel de Sección con Arquetipos

## 🎯 Objetivo
Crear un componente aislado y elegante para gestionar secciones (galaxias) con editor MD, arquetipos de IA, control de versiones y sugerencias inline.

---

## 📋 Componentes Standard a Usar

### **Obligatorios:**
- `StandardCard` - Contenedor principal del panel
- `StandardButton` - Todos los botones (guardar, arquetipos, expandir/colapsar)
- `StandardBadge` - Indicadores de estado (versión, tokens, pruebas)
- `StandardInput` - Título de la sección
- `StandardTextarea` - Descripción breve
- `StandardAccordion` - Para expandir/colapsar el panel (INVESTIGAR props)

### **Props Críticos a Entender:**
```typescript
// StandardButton
colorScheme: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'neutral'
size: 'xs' | 'sm' | 'md' | 'lg'
styleType: 'filled' | 'outline' | 'ghost' | 'subtle'

// StandardCard
colorScheme: igual que StandardButton
padding: 'none' | 'sm' | 'md' | 'lg'

// StandardBadge
colorScheme: igual que StandardButton
size: 'xs' | 'sm' | 'md'
```

---

## 🎨 Estructura Visual

```
┌─────────────────────────────────────────────────────┐
│ 📄 Sección 1: Introducción              [▼ Expandir]│
├─────────────────────────────────────────────────────┤
│ Descripción: Introducción al tema...                │
│ 📊 150 palabras • v3 • Última edición: hace 2h      │
└─────────────────────────────────────────────────────┘

Al expandir ▼:

┌─────────────────────────────────────────────────────┐
│ 📄 Sección 1: Introducción              [▲ Colapsar]│
├─────────────────────────────────────────────────────┤
│ Título: [Introducción                             ] │
│ Descripción: [Introducción al tema...             ] │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ # Introducción                                 │ │
│ │                                                │ │
│ │ Este es el contenido MD de la sección...      │ │
│ │                                                │ │
│ │ [Editor MD con vista previa lado a lado]      │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ [💾 Guardar]  [🃏 Bufón] [📊 Auditor] [✍️ Editor]   │
│                          [☕ Colega]                 │
│                                                      │
│ ┌─ 🤖 Sugerencia del Editor (v3) ─────────────[X]─┐ │
│ │ 📊 1,234 tokens • 📥 800 in • 📤 434 out        │ │
│ │                                                  │ │
│ │ [Contenido de la sugerencia en MD renderizado]  │ │
│ │                                                  │ │
│ │ [📋 Copiar] [✅ Insertar en Editor]             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ 📜 Historial de Versiones ──────────────────────┐ │
│ │ • v3 (actual) - Editor - hace 2h                │ │
│ │ • v2 - Auditor - hace 5h                        │ │
│ │ • v1 (original) - hace 1d                       │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Funcionalidades

### **1. Panel Expandible/Colapsable**
- **Estado colapsado:** Solo muestra título, descripción breve, métricas
- **Estado expandido:** Muestra editor MD completo, arquetipos, sugerencias, historial
- **Transición suave** al expandir/colapsar

### **2. Editor MD con Vista Dual**
- **Lado izquierdo:** Textarea para editar MD
- **Lado derecho:** Vista previa renderizada con ReactMarkdown
- **Sincronización en tiempo real**

### **3. Botones de Arquetipos**
- **4 arquetipos:** Bufón 🃏, Auditor 📊, Editor ✍️, Colega ☕
- **Comportamiento:** 
  1. Auto-guarda contenido actual
  2. Muestra loading mientras procesa
  3. Muestra sugerencia inline debajo del editor
- **Estado visual:** Disabled mientras procesa

### **4. Panel de Sugerencias Inline**
- **Aparece debajo del editor** cuando hay sugerencia
- **Muestra:**
  - Título con arquetipo usado
  - Badge "Pruebas Iniciales"
  - Métricas de tokens
  - Contenido MD renderizado
  - Botones: Copiar, Insertar en Editor, Cerrar (X)
- **Insertar:** Agrega al final del contenido actual con separador `---`

### **5. Control de Versiones**
- **Historial simple:** Lista de versiones con timestamp
- **Cada versión guarda:**
  - Número de versión (v1, v2, v3...)
  - Arquetipo usado (si aplica)
  - Timestamp
  - Contenido MD completo
- **Vista:** Solo lectura en este mock

### **6. Botón Guardar**
- **Comportamiento:**
  - Guarda contenido actual
  - Incrementa versión
  - Muestra toast de confirmación
  - Actualiza métricas (palabras, caracteres)

---

## 📊 Datos Mock para Pruebas

```typescript
const mockSections = [
  {
    id: '1',
    title: 'Introducción',
    description: 'Introducción al tema principal del paper',
    content: '# Introducción\n\nEste es el contenido MD de la introducción...\n\n## Contexto\n\nEl contexto del estudio es...',
    version: 3,
    wordCount: 150,
    charCount: 890,
    lastEdited: '2 horas',
    versions: [
      { version: 3, archetype: 'editor', timestamp: '2 horas', content: '...' },
      { version: 2, archetype: 'auditor', timestamp: '5 horas', content: '...' },
      { version: 1, archetype: null, timestamp: '1 día', content: '...' },
    ]
  },
  {
    id: '2',
    title: 'Metodología',
    description: 'Descripción de los métodos utilizados',
    content: '# Metodología\n\n## Diseño del Estudio\n\nSe utilizó un diseño...',
    version: 2,
    wordCount: 320,
    charCount: 1850,
    lastEdited: '1 día',
    versions: [
      { version: 2, archetype: 'colega', timestamp: '1 día', content: '...' },
      { version: 1, archetype: null, timestamp: '3 días', content: '...' },
    ]
  }
];

const mockSuggestion = {
  archetype: 'editor',
  suggestion: '# Sugerencia del Editor\n\nConsidero que podrías mejorar la introducción agregando...\n\n## Estructura sugerida\n\n1. Contexto general\n2. Problema específico\n3. Objetivo del estudio',
  tokens: {
    totalTokenCount: 1234,
    promptTokenCount: 800,
    candidatesTokenCount: 434
  }
};
```

---

## 🎯 Criterios de Éxito

1. ✅ **Componentes Standard:** Solo usar componentes del sistema Standard
2. ✅ **Props correctos:** Entender y usar correctamente colorScheme, size, styleType
3. ✅ **Expandible/Colapsable:** Transición suave y estado persistente
4. ✅ **Editor MD funcional:** Vista dual con sincronización
5. ✅ **Arquetipos funcionales:** Simulación de llamada a IA con loading
6. ✅ **Sugerencias inline:** Panel elegante debajo del editor
7. ✅ **Control de versiones:** Historial visible y navegable
8. ✅ **Datos mock:** Funciona completamente con datos falsos
9. ✅ **Sin errores:** 0 errores de TypeScript, 0 warnings críticos
10. ✅ **Responsive:** Se ve bien en diferentes tamaños de pantalla

---

## 📁 Ubicación del Mock

```
/public/showroom/panel-seccion/
├── page.tsx              # Componente principal del mock
├── SectionPanel.tsx      # Componente del panel de sección
├── MDEditor.tsx          # Editor MD con vista dual
├── ArchetypeButtons.tsx  # Botones de arquetipos
├── SuggestionPanel.tsx   # Panel de sugerencias inline
├── VersionHistory.tsx    # Historial de versiones
└── mockData.ts           # Datos falsos para pruebas
```

---

## 🚀 Próximos Pasos

1. **Crear mock aislado** en showroom con datos falsos
2. **Probar interfaz** sin conexión a backend
3. **Refinar UX** hasta que sea perfecta
4. **Documentar props** y comportamientos
5. **Integrar** con el sistema real de Minotauro

---

## 💡 Notas Importantes

- **NO usar modales** - Todo inline y expandible
- **NO inventar props** - Solo usar los documentados en Standard
- **NO CSS global** - Todo inline con componentes Standard
- **SÍ usar ReactMarkdown** para renderizar MD
- **SÍ simular delays** para loading states realistas
- **SÍ agregar toasts** para feedback visual
