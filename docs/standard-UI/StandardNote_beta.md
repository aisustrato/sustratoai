# StandardNote Beta - Editor de Notas con Markdown

Un componente de editor de texto enriquecido que permite escribir y previsualizar contenido en formato Markdown de manera simple y funcional, sin dependencias externas.

### Características Principales

- ✅ **Sin dependencias externas** - Parser Markdown propio
- ✅ **Toolbar integrada** con botones para formatos comunes
- ✅ **Vista previa en tiempo real** con toggle edit/preview y modo live preview
- ✅ **Soporte multilínea** para listas y títulos con lógica inteligente
- ✅ **Enlaces** con renderizado completo y apertura en nueva pestaña
- ✅ **Conversión inteligente** entre tipos de listas sin acumular formatos
- ✅ **Tokens de color** consistentes con el sistema Standard UI
- ✅ **Accesibilidad** completa con tooltips y navegación por teclado
- ✅ **Estados** disabled, readOnly y focus manejados correctamente
- ✅ **Responsive** y compatible con temas claro/oscuro

## Uso Básico

El editor más simple posible. Heredará los valores por defecto: `colorScheme="neutral"`, `size="md"`, `showToolbar=true`.

```tsx
<StandardNoteBeta 
  value={content} 
  onChange={setContent} 
/>
```

## Esquemas de Color (colorScheme)

Define la paleta de colores del editor.

```tsx
// Editor neutro (por defecto)
<StandardNoteBeta colorScheme="neutral" />

// Editor con acento primario
<StandardNoteBeta colorScheme="primary" />

// Editor con tonos secundarios
<StandardNoteBeta colorScheme="secondary" />

// Editor con tonos terciarios
<StandardNoteBeta colorScheme="tertiary" />

// Editor con color de acento
<StandardNoteBeta colorScheme="accent" />
```

## Tamaños (size)

Controla las dimensiones y espaciado del editor.

```tsx
// Editor pequeño
<StandardNoteBeta size="sm" />

// Editor mediano (por defecto)
<StandardNoteBeta size="md" />

// Editor grande
<StandardNoteBeta size="lg" />
```

## Modos de Visualización

### Modo Inicial

```tsx
// Iniciar en modo edición (por defecto)
<StandardNoteBeta initialMode="edit" />

// Iniciar en modo vista previa
<StandardNoteBeta initialMode="preview" />
```

### Control de Toolbar y Vista Previa

```tsx
// Sin toolbar
<StandardNoteBeta showToolbar={false} />

// Sin botón de vista previa
<StandardNoteBeta showPreview={false} />

// Solo editor, sin controles adicionales
<StandardNoteBeta 
  showToolbar={false} 
  showPreview={false} 
/>
```

## Estados del Componente

### Estados Interactivos

```tsx
// Editor deshabilitado
<StandardNoteBeta disabled={true} />

// Editor de solo lectura
<StandardNoteBeta readOnly={true} />
```

### Personalización de Altura

```tsx
// Altura mínima personalizada
<StandardNoteBeta minHeight="min-h-[200px]" />

// Editor más compacto
<StandardNoteBeta minHeight="min-h-[80px]" />
```

## Formatos Soportados

### Formatos de Texto Inline

- **Negrita**: `**texto**` → **texto**
- **Itálica**: `*texto*` → *texto*
- **Resaltado**: `<mark>texto</mark>` → <mark>texto</mark>
- **Enlaces**: `[texto](https://url)` → [texto](https://url)

### Formatos de Línea

- **Título 1**: `# Título` → 
  # Título
- **Título 2**: `## Título` → 
  ## Título
- **Título 3**: `### Título` → 
  ### Título

### Listas

- **Lista con viñetas**: `- Item` o `* Item`
  - Item 1
  - Item 2
- **Lista numerada**: `1. Item`
  1. Item 1
  2. Item 2

## Funcionalidad de la Toolbar

### Botones de Formato Inline

| Botón | Acción | Atajo | Tooltip |
|-------|--------|-------|---------|
| **B** | Negrita | Ctrl+B | "Negrita (Ctrl+B)" |
| *I* | Itálica | Ctrl+I | "Itálica (Ctrl+I)" |
| 🖍️ | Resaltado | - | "Resaltar texto" |
| 🔗 | Enlace | - | "Agregar enlace" |

### Botones de Títulos

| Botón | Acción | Resultado |
|-------|--------|-----------|
| H1 | Título 1 | `# Texto` |
| H2 | Título 2 | `## Texto` |
| H3 | Título 3 | `### Texto` |

### Botones de Listas

| Botón | Acción | Resultado |
|-------|--------|-----------|
| • | Lista con viñetas | `- Item` |
| 1. | Lista numerada | `1. Item` |

### Botón de Vista Previa

| Estado | Icono | Acción |
|--------|-------|---------|
| Editando | 👁️ | Cambiar a vista previa |
| Previsualizando | 📄 | Cambiar a edición |

## Lógica Toggle Inteligente

### Formatos Inline
- Si hay texto seleccionado → Aplica formato al texto seleccionado
- Si no hay selección → Inserta formato con placeholder
- Si el texto ya tiene formato → Remueve el formato

### Formatos de Línea
- Si la línea actual tiene el formato → Lo remueve
- Si la línea tiene otro formato de título → Lo reemplaza
- Si no tiene formato → Lo aplica

### Listas
- Si la línea es una lista del mismo tipo → La convierte a texto normal
- Si no es lista → La convierte a lista
- Mantiene coherencia en numeración para listas ordenadas

## Ejemplo Completo

```tsx
import { useState } from 'react';
import { StandardNoteBeta } from '@/components/ui/StandardNote_beta';

export function NotesEditor() {
  const [content, setContent] = useState(`# Mi Nota

Esta es una **nota de ejemplo** con *diferentes formatos*.

## Lista de tareas
- [x] Implementar editor
- [ ] Agregar más formatos
- [ ] Mejorar vista previa

### Características importantes
1. Sin dependencias externas
2. Renderizado rápido
3. <mark>Fácil de usar</mark>
`);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <StandardNoteBeta
        value={content}
        onChange={setContent}
        colorScheme="primary"
        size="lg"
        placeholder="Escribe tu nota aquí..."
        showToolbar={true}
        showPreview={true}
        initialMode="edit"
      />
    </div>
  );
}
```

## Props API

```tsx
interface StandardNoteBetaProps {
  value?: string;                    // Contenido del editor
  onChange?: (value: string) => void; // Callback al cambiar contenido
  placeholder?: string;              // Texto placeholder
  colorScheme?: ColorSchemeVariant;  // Esquema de colores
  size?: "sm" | "md" | "lg";        // Tamaño del editor
  disabled?: boolean;                // Estado deshabilitado
  readOnly?: boolean;                // Estado de solo lectura
  className?: string;                // Clases CSS adicionales
  id?: string;                       // ID del elemento
  name?: string;                     // Nombre del campo
  showToolbar?: boolean;             // Mostrar toolbar (default: true)
  showPreview?: boolean;             // Mostrar botón de vista previa (default: true)
  initialMode?: "edit" | "preview";  // Modo inicial (default: "edit")
  livePreview?: boolean;             // Activar vista previa en vivo (pantalla dividida)
  previewDebounceMs?: number;        // Tiempo de debounce para actualizar preview en vivo
  minHeight?: string;                // Altura mínima personalizada
}
```

## Integración con Formularios

```tsx
import { useForm } from 'react-hook-form';

function ArticleForm() {
  const { register, handleSubmit, watch, setValue } = useForm();
  const content = watch('content');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StandardNoteBeta
        value={content}
        onChange={(value) => setValue('content', value)}
        colorScheme="secondary"
        placeholder="Escribe el contenido del artículo..."
      />
    </form>
  );
}
```

## Personalización Avanzada

### Altura Dinámica

```tsx
// Editor que se adapta al contenido
<StandardNoteBeta 
  minHeight="min-h-[100px]"
  className="max-h-[400px] overflow-y-auto"
/>
```

### Estilos Personalizados

```tsx
// Editor con estilos personalizados
<StandardNoteBeta 
  className="border-2 border-dashed"
  colorScheme="accent"
/>
```

## Notas de Implementación

### Arquitectura del Componente

- **Componente Orquestador**: Maneja lógica y estado, agnóstico a estilos
- **Sistema de Tokens**: Consume colores del sistema de temas
- **Renderizado Propio**: Parser Markdown simple y eficiente
- **Sin Dependencias**: Implementación completamente nativa

### Filosofía de Diseño

- **Simplicidad**: Solo formatos esenciales, sin complejidad innecesaria
- **Performance**: Renderizado rápido sin librerías pesadas
- **Consistencia**: Integración perfecta con el ecosistema Standard*
- **Accesibilidad**: Soporte completo para navegación por teclado

### Limitaciones Actuales

- No soporta tablas Markdown
- No soporta imágenes embebidas
- No soporta código con syntax highlighting
- Parser básico, no compatible con todas las extensiones Markdown
- Los enlaces se abren en nueva pestaña por seguridad

## Migración desde StandardNote

Si vienes del `StandardNote` original:

```tsx
// Antes (con dependencia externa)
<StandardNote 
  value={content} 
  onChange={setContent}
  showToolbar={true}
/>

// Ahora (sin dependencias)
<StandardNoteBeta 
  value={content} 
  onChange={setContent}
  showToolbar={true}
/>
```

## Roadmap Futuro

- [ ] Soporte para tablas básicas
- [ ] Atajos de teclado personalizables
- [ ] Modo de pantalla completa
- [ ] Exportación a diferentes formatos
- [ ] Plugins de extensión

---

*StandardNote Beta es parte del ecosistema Standard UI de Sustrato.AI - Diseñado para ser simple, rápido y completamente funcional.*

Este archivo será actualizado con cada iteración de la nueva implementación.
