# StandardNote_betaFriendly - Especificación Técnica

## 🎯 Objetivo

Crear una versión humanista-friendly del editor de notas que mantenga la funcionalidad completa de Markdown en el backend pero presente una interfaz accesible para investigadores no técnicos (psicólogos, sociólogos, trabajadores sociales).

## 📋 Principios de Diseño

### **Lenguaje y Terminología**
- ❌ **Evitar:** "Markdown", "sintaxis", "markup", tecnicismos
- ✅ **Usar:** Terminología familiar de Word/Google Docs
- 🎯 **Tono:** Profesional académico, claro, directo (no florido)

### **Persistencia de Datos**
- **Backend:** Markdown puro para compatibilidad con sistemas AI
- **Frontend:** Experiencia visual amigable sin exposición de sintaxis
- **Compatibilidad:** Total con StandardNote_beta existente

## 🏗️ Arquitectura de Componentes

### **Componente Principal**
- `StandardNote_betaFriendly.tsx` - Versión humanista del editor
- Hereda toda la funcionalidad de `StandardNote_beta.tsx`
- Agrega capas de experiencia de usuario mejorada

### **Componentes Auxiliares**
1. **`ScrollSync.tsx`** - Sincronización inteligente editor-preview
2. **`SyntaxHighlight.tsx`** - Resaltado sutil sin tecnicismos
3. **`ToolbarFriendly.tsx`** - Toolbar con lenguaje académico
4. **`NavigationHelper.tsx`** - Ayudas de navegación contextual

## 🎨 Especificaciones de UI/UX

### **Toolbar Rediseñada**
```
Antes (Técnico):     [B] [I] [H1] [H2] [H3] [•] [1.] [🔗] [<mark>]
Después (Académico): [Negrita] [Cursiva] [Título] [Subtítulo] [Sección] [Lista] [Numerada] [Enlace] [Resaltado]
```

### **Hints Visuales**
- **Iconos contextuales:** 📝 títulos, 📋 listas, 🔗 enlaces
- **Colores sutiles:** Highlighting discreto que no distrae
- **Tooltips académicos:** "Título principal de sección", "Lista con viñetas"

### **Scroll Sincronizado**
- **Mapeo inteligente:** Líneas del editor ↔ elementos del preview
- **Highlight activo:** Elemento actual resaltado sutilmente
- **Centrado automático:** Contenido relevante siempre visible
- **Bidireccional:** Funciona en ambas direcciones

## 🔄 Funcionalidades Fase 1

### **1. Scroll Sincronizado Inteligente**
- [ ] Mapeo preciso línea-elemento
- [ ] Highlight sutil del elemento activo
- [ ] Scroll proporcional bidireccional
- [ ] Centrado inteligente del contenido

### **2. Toolbar Académica**
- [ ] Botones con texto descriptivo
- [ ] Iconos universales + etiquetas
- [ ] Agrupación lógica por función
- [ ] Tooltips explicativos

### **3. Syntax Highlighting Sutil**
- [ ] Colores discretos para marcadores
- [ ] Iconos pequeños contextuales
- [ ] Hover hints informativos
- [ ] Sin exposición de sintaxis MD

### **4. Navegación Mejorada**
- [ ] Indicador de posición en documento
- [ ] Breadcrumbs académicos
- [ ] Salto rápido entre secciones
- [ ] Minimap de estructura (opcional)

## 🎯 Audiencia Objetivo

### **Perfil Principal**
- **Investigadores humanistas:** Psicólogos, sociólogos, trabajadores sociales
- **Nivel técnico:** Bajo a medio (usuarios de Word/Google Docs)
- **Contexto de uso:** Revisión bibliográfica, preclasificación de artículos
- **Necesidades:** Reducir carga cognitiva, enfoque en contenido académico

### **Casos de Uso**
1. **Revisión bibliográfica** - Notas estructuradas sobre artículos
2. **Preclasificación** - Categorización y análisis temático
3. **Colaboración** - Compartir y revisar con pares
4. **Navegación bidireccional** - Conexión entre fuentes y análisis

## 📁 Estructura de Archivos

```
components/ui/
├── StandardNote_beta.tsx              # Original protegido
├── StandardNote_betaFriendly.tsx      # Nueva versión humanista
├── helpers/
│   ├── ScrollSync.tsx                 # Sincronización scroll
│   ├── SyntaxHighlight.tsx           # Highlighting sutil
│   ├── ToolbarFriendly.tsx           # Toolbar académica
│   └── NavigationHelper.tsx          # Navegación contextual

app/showroom/
├── standardnotemd/                   # Showroom original
└── standardnote-friendly/            # Nuevo showroom

docs/
├── standard-UI/StandardNote_beta.md  # Documentación original
└── StandardNote_betaFriendly.md      # Esta especificación
```

## 🚀 Plan de Implementación

### **Sprint 1: Fundación (Semana 1-2)**
1. Duplicar `StandardNote_beta.tsx` → `StandardNote_betaFriendly.tsx`
2. Crear estructura de componentes auxiliares
3. Implementar toolbar con lenguaje académico
4. Crear nuevo showroom básico

### **Sprint 2: Scroll Sincronizado (Semana 2-3)**
1. Implementar `ScrollSync.tsx`
2. Mapeo línea-elemento inteligente
3. Highlight activo y centrado automático
4. Pruebas de sincronización bidireccional

### **Sprint 3: Experiencia Visual (Semana 3-4)**
1. Implementar `SyntaxHighlight.tsx`
2. Hints visuales y tooltips académicos
3. Navegación contextual mejorada
4. Refinamiento de UX

## 🎨 Tokens y Estilos

### **Colores Académicos**
- **Primarios:** Azules y grises profesionales
- **Acentos:** Verde sutil para elementos activos
- **Highlighting:** Amarillo muy tenue para resaltado
- **Estados:** Colores discretos para hover/focus

### **Tipografía**
- **Consistente** con el sistema Standard UI
- **Legible** para lectura académica extendida
- **Jerarquía clara** sin ser intimidante

## 📊 Métricas de Éxito

### **Cuantitativas**
- Reducción del 50% en tiempo de aprendizaje inicial
- Aumento del 80% en adopción por usuarios no técnicos
- Mantenimiento del 100% de funcionalidad MD

### **Cualitativas**
- Feedback positivo sobre facilidad de uso
- Reducción de fricción en flujo de trabajo académico
- Percepción de herramienta "académica" vs "técnica"

## 🔄 Roadmap Futuro

### **Fase 2: Edición Contextual**
- Click-to-edit en preview
- Editor inline con contexto
- Elementos académicos específicos

### **Fase 3: Colaboración Académica**
- Comentarios y sugerencias
- Versionado simple
- Exportación a formatos académicos

---

**Versión:** 1.0  
**Fecha:** 2025-01-20  
**Estado:** En desarrollo - Sprint 1  
**Responsable:** Equipo SUSTRATO.AI
