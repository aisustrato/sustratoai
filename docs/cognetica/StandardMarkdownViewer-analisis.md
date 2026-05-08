# Análisis: StandardMarkdownViewer

## 📋 Resumen Ejecutivo

Componente React para visualización avanzada de Markdown con sistema de acordeones para títulos, búsqueda integrada y sanitización de contenido. Actualmente ubicado en `/components/ui/StandardMarkdownViewer.tsx`.

**Líneas de código:** ~1,200  
**Complejidad:** Alta  
**Dependencias:** React, Lucide React, StandardText, StandardCard, cn (utils)

---

## 🎯 Funcionalidades Actuales

### 1. Sanitizador de Markdown (`sanitizeMarkdown`)

**Propósito:** Limpia caracteres y patrones problemáticos antes del parsing.

**Correcciones aplicadas:**
- Normalización de saltos de línea (CRLF → LF)
- Eliminación de caracteres de control invisibles
- Normalización de espacios en blanco múltiples
- Detección y corrección de bloques de código mal cerrados (` ``` `)
- Normalización de comillas tipográficas (`""` → `"`, `''` → `'`)
- Eliminación de secuencias de >3 saltos de línea consecutivos
- Escapado de asteriscos sueltos que rompen negritas
- Normalización de headers con espacios inconsistentes
- Limpieza de asteriscos desbalanceados (heurísticas específicas)
- Rotura de líneas extremadamente largas (>500 caracteres)

**Logging:** Muestra en consola las correcciones aplicadas para debugging.

### 2. Pre-procesador de Headers (`preprocessMarkdownWithHeaders`)

**Propósito:** Genera estructura automática si el markdown carece de headers.

**Lógica:**
- Detecta si ya existe al menos un header (`/^#{1,6}\s+.+$/m`)
- Si no hay headers: genera H1 del primer párrafo (primeras 10 palabras)
- Agrupa párrafos en secciones H2 (cada 3-4 párrafos)
- Títulos de sección basados en primeras 6 palabras del párrafo

**Caso de uso:** PDFs convertidos a MD sin estructura de títulos.

### 3. Parser de Secciones (`parseMarkdownToSections`)

**Propósito:** Convierte markdown en estructura jerárquica de secciones.

**Estructura de salida:**
```typescript
interface MarkdownSection {
  level: number;      // 0-6 (0 = contenido sin header)
  title: string;    // Título del header
  content: string;  // Contenido hasta el siguiente header
  id: string;       // ID único (section-{counter})
}
```

**Proceso:**
1. Sanitizar markdown
2. Pre-procesar headers si es necesario
3. Parsear línea por línea detectando headers
4. Acumular contenido entre headers
5. Guardar sección anterior al encontrar nuevo header

### 4. Renderizador de Contenido (`renderMarkdownContent`)

**Soporte de elementos:**
- Headers (H1-H6) con colores y tamaños jerárquicos
- Tablas (con bordes, filas alternadas, hover)
- Listas ordenadas y desordenadas
- Bloques de código (sin syntax highlighting)
- Párrafos con formato inline
- **Inline:** Negritas (`**texto**`, `__texto__`), cursivas (`*texto*`, `_texto_`), código inline (`` `código` ``), enlaces (`[texto](url)`)

**Truncamiento:**
- Límite: 50,000 caracteres por sección (`MAX_CONTENT_LENGTH`)
- Aviso visual cuando se trunca con contador de caracteres

### 5. Sistema de Acordeones (Collapsible Sections)

**Jerarquía visual:**
- **Level 1 (H1):** Siempre expandido, sin chevron, borde izquierdo `border-primary/30`
- **Level 2 (H2):** Colapsable, chevron ▼/▶, borde izquierdo `border-secondary/30`, indentación `pl-4`
- **Level 3 (H3):** Colapsable, chevron ▼/▶, borde izquierdo `border-muted`, indentación `pl-6`
- **Level 4-6:** No implementados (no hay niveles 4-6 en el parser actual)

**Estilos tipográficos por nivel:**
```typescript
H1: { color: "primary", size: "xl", weight: "bold", gradient: true }
H2: { color: "secondary", size: "lg", weight: "semibold" }
H3: { color: "tertiary", size: "base", weight: "semibold" }
H4: { color: "neutral", size: "sm", weight: "medium" }
H5: { color: "neutral", size: "sm", weight: "medium" }
H6: { color: "neutral", size: "xs", weight: "normal" }
```

### 6. Sistema de Búsqueda (`searchTerm`, `currentMatchIndex`, `onSearch`)

**Características:**
- Búsqueda case-insensitive en títulos y contenido
- Uso de `indexOf` (no regex, evita errores con caracteres especiales)
- Callback `onSearch(matches)` devuelve array de coincidencias
- Resaltado de sección activa según `currentMatchIndex`
- Scroll automático a sección resaltada

**Estructura de matches:**
```typescript
interface SearchMatch {
  sectionId: string;
  sectionTitle: string;
  position: number;
}
```

### 7. Gestión de Estado de Expansión

**Estados:**
- `expandedSections`: Secciones actualmente expandidas (búsqueda + manual)
- `manuallyExpandedSections`: Solo las expandidas manualmente por el usuario
- `highlightedSectionId`: Sección activa en la búsqueda

**Comportamientos:**
- Búsqueda expande automáticamente secciones con coincidencias
- Expansión manual persiste entre búsquedas
- Colapso manual respeta la intención del usuario

### 8. Función de Descarga

**`downloadSanitized()`:**
- Descarga el markdown sanitizado como archivo `.md`
- Útil para debugging del proceso de limpieza

---

## 🔧 Props del Componente

```typescript
interface StandardMarkdownViewerProps {
  content: string;                    // Markdown a renderizar
  className?: string;                 // Clases CSS adicionales
  expandAll?: boolean;                // Expandir todas las secciones (default: false)
  searchTerm?: string;                // Término de búsqueda
  currentMatchIndex?: number;         // Índice de coincidencia activa
  onSearch?: (matches: SearchMatch[]) => void;  // Callback con resultados
}
```

---

## 🐛 Problemas Conocidos (del archivo warnings.txt)

```
./components/ui/StandardMarkdownViewer.tsx
112:11  Warning: 'originalAsterisks' is assigned a value but never used.
990:8   Warning: React Hook useEffect has a missing dependency: 'sections'. 
        Either include it or remove the dependency array.
```

### Problema 1: Variable no usada
**Línea 112:** `originalAsterisks` se asigna pero nunca se usa después.

### Problema 2: Dependencia faltante
**Línea 990:** `useEffect` para `performSearch` no incluye `sections` en el array de dependencias.

---

## 💡 Oportunidades de Mejora

### 1. Rendimiento

**Problema:** Parsing de markdown linea por linea con React elements en caliente.

**Soluciones posibles:**
- Usar librería estable como `react-markdown` con plugins
- Implementar virtualización para documentos muy largos
- Web Worker para el parsing pesado

### 2. Syntax Highlighting

**Problema:** Bloques de código no tienen colores de sintaxis.

**Solución:**
- Integrar `prismjs` o `shiki` para highlighting
- Detectar lenguaje en el bloque (```javascript)

### 3. Búsqueda Avanzada

**Mejoras posibles:**
- Búsqueda con regex opcional
- Resaltado de términos dentro del contenido (no solo expandir sección)
- Fuzzy search para errores de tipeo
- Contador de coincidencias por sección

### 4. Navegación Mejorada

**Features a agregar:**
- TOC (Table of Contents) flotante
- Breadcrumbs de navegación
- Navegación con teclado (flechas, Enter para expandir)
- Historial de secciones visitadas

### 5. Accesibilidad

**Problemas actuales:**
- Botones de acordeón no tienen `aria-expanded`
- No hay skip links
- Falto `aria-live` para resultados de búsqueda

### 6. Limpieza de Código

**Deuda técnica:**
- Eliminar `console.log` de debugging (muy numerosos)
- Simplificar el sanitizador (algunas heurísticas pueden ser innecesarias)
- Extraer componentes internos a archivos separados
- Tipar mejor las funciones de renderizado

### 7. Sistema de Plugins

**Arquitectura propuesta:**
```typescript
interface MarkdownPlugin {
  name: string;
  transform?: (markdown: string) => string;
  render?: (node: ASTNode) => ReactNode;
}
```

Permitiría:
- Mermaid diagrams
- MathJax/KaTeX
- Embeds de video
- Componentes custom

---

## 🎯 Integración en Cognetica Forense (Nuevo Módulo)

### Casos de Uso Identificados

1. **Visualización de Documento Original**
   - Mostrar el contenido del artefacto markdown ingestado
   - Permitir navegación rápida por secciones
   - Búsqueda dentro del documento

2. **Visualización de Crónica**
   - Renderizar la Crónica generada (texto narrativo)
   - Secciones colapsables por capítulos

3. **Visualización de Destilado**
   - Estructura argumental con tesis, movimientos, tensiones
   - Colores distintivos para cada tipo de elemento

4. **Visualización de Núcleo y Germinal**
   - Contenido más denso, beneficiado por acordeones

### Propsuesta de Integración

#### Opción A: Uso Directo (Mínimo Cambio)

```tsx
// En ArtefactoView.tsx
<StandardAccordionItem value="original" colorScheme="neutral">
  <StandardAccordionTrigger>Contenido Original</StandardAccordionTrigger>
  <StandardAccordionContent>
    <StandardMarkdownViewer 
      content={markdownContent}
      expandAll={false}
    />
  </StandardAccordionContent>
</StandardAccordionItem>
```

**Pros:** Rápido, reutiliza código existente  
**Contras:** Mantiene deuda técnica, dependencias del viejo sistema

#### Opción B: Wrapper con Estándares UI (Recomendado)

Crear componente envoltorio que use `Standard*`:

```tsx
// app/cognetica/[id]/DocumentoMarkdownViewer.tsx
"use client";

import { StandardMarkdownViewer } from "@/components/ui/StandardMarkdownViewer";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardButton } from "@/components/ui/StandardButton";
import { Search, Download } from "lucide-react";

interface DocumentoMarkdownViewerProps {
  content: string;
  titulo?: string;
  mostrarBusqueda?: boolean;
  mostrarDescarga?: boolean;
}

export function DocumentoMarkdownViewer({
  content,
  titulo = "Documento",
  mostrarBusqueda = true,
  mostrarDescarga = true,
}: DocumentoMarkdownViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);

  return (
    <StandardCard colorScheme="neutral" styleType="subtle">
      {/* Header con título y acciones */}
      <div className="flex items-center justify-between mb-4">
        <StandardText weight="semibold">{titulo}</StandardText>
        
        {mostrarBusqueda && (
          <div className="flex items-center gap-2">
            <StandardInput
              placeholder="Buscar en documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={Search}
            />
            {matches.length > 0 && (
              <StandardText size="sm" colorScheme="neutral">
                {currentMatch + 1} / {matches.length}
              </StandardText>
            )}
          </div>
        )}
        
        {mostrarDescarga && (
          <StandardButton
            variant="ghost"
            size="sm"
            leftIcon={Download}
            onClick={handleDownload}
          >
            Descargar MD
          </StandardButton>
        )}
      </div>
      
      {/* Contenido con StandardMarkdownViewer */}
      <StandardMarkdownViewer
        content={content}
        searchTerm={searchTerm}
        currentMatchIndex={currentMatch}
        onSearch={setMatches}
      />
    </StandardCard>
  );
}
```

**Pros:** Consistente con Standard UI, controllable, testeable  
**Contras:** Más código inicial

#### Opción C: Refactor Completo (Ideal a largo plazo)

Reescribir `StandardMarkdownViewer` usando:
- `react-markdown` como base
- Plugins de remark/rehype
- Componentes `Standard*` para cada elemento
- Sistema de acordeones propio con `StandardAccordion`

**Pros:** Mantenible, performante, consistente  
**Contras:** Alta inversión inicial, riesgo de regresiones

---

## 📁 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `components/ui/StandardMarkdownViewer.tsx` | Componente principal (~1,200 líneas) |
| `components/ui/StandardNote.tsx` | Editor markdown (dependencia heredada) |
| `components/ui/StandardNote.module.css` | Estilos para preview markdown |
| `docs/cognetica2` | Documentación del sistema Cognetica v2 |

---

## 🚀 Roadmap de Implementación

### Fase 1: Integración Rápida (1-2 días)
1. Usar `StandardMarkdownViewer` directamente en `ArtefactoView`
2. Reemplazar sección "Contenido original" actual
3. Mantener comportamiento existente

### Fase 2: Wrapper Standard (3-4 días)
1. Crear `DocumentoMarkdownViewer` con Standard UI
2. Integrar búsqueda con `StandardInput`
3. Agregar controles de navegación de matches
4. Tests básicos

### Fase 3: Mejoras Incrementales (1-2 semanas)
1. Syntax highlighting con Prism/Shiki
2. TOC flotante
3. Navegación con teclado
4. Limpieza de código (quitar console.logs)

### Fase 4: Refactor Completo (Futuro)
1. Reescribir con `react-markdown`
2. Arquitectura de plugins
3. Virtualización para documentos largos
4. Eliminación de dependencias legacy

---

## 🎨 Diseño Visual Esperado (Cognetica Forense)

```
┌─────────────────────────────────────────────────────┐
│ 📄 Contenido Original                    [🔍] [⬇️] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ # Título del Documento                              │
│                                                     │
│ ## ▼ Introducción              ← Acordeón nivel 2   │
│    Contenido de la introducción...                  │
│                                                     │
│ ## ▶ Sección Principal         ← Colapsado          │
│                                                     │
│ ## ▼ Metodología                                  │
│    ### ▼ Subsección            ← Anidado nivel 3   │
│       Detalles del método...                        │
│                                                     │
│ ## ▶ Conclusiones                                 │
│                                                     │
└─────────────────────────────────────────────────────┘

Colores de borde izquierdo:
- H1: primary (púrpura)
- H2: secondary (verde/azul)
- H3: muted (gris)
```

---

## ✅ Checklist para Implementación

- [ ] Limpiar `console.log` de debugging
- [ ] Corregir warnings de ESLint (dependencias, variables no usadas)
- [ ] Integrar en `ArtefactoView` para "Contenido original"
- [ ] Agregar controles de búsqueda visibles (input + navegación)
- [ ] Testear con documentos reales de Cognetica
- [ ] Documentar uso en README del módulo
- [ ] Considerar syntax highlighting si hay bloques de código

---

## 💬 Notas Finales

El componente `StandardMarkdownViewer` es **funcional pero acumula deuda técnica**. Para Cognetica Forense, la **Opción B (Wrapper con Standard UI)** ofrece el mejor balance:

- Reutiliza la lógica probada de parsing y acordeones
- Permite integración progresiva con el sistema Standard
- Facilita tests y mantenimiento
- Prepara terreno para el refactor completo futuro

**Prioridad inmediata:** Integración en la sección "Contenido original" del artefacto para permitir visualización con títulos plegables y búsqueda.

---

*Documento generado el 29/04/2026 para análisis de integración Cognetica Forense.*
