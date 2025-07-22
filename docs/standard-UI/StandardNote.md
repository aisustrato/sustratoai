# StandardNote - Editor de Markdown Avanzado con Sincronización

Un componente de editor de texto enriquecido que permite escribir y previsualizar contenido en formato Markdown con sincronización de scroll, highlight de línea activa, y múltiples modos de visualización.

## Características Principales

- ✅ **Mapeo línea-elemento exacto** - Sincronización 1:1 entre editor y preview
- ✅ **Highlight de línea activa** - Resalta visualmente la línea siendo editada
- ✅ **Sincronización de scroll bidireccional** - Scroll automático entre editor y preview
- ✅ **Tres modos de visualización** - Dividido, solo editor, solo preview
- ✅ **Toolbar minimalista opcional** - Interfaz simplificada para humanistas
- ✅ **Parser Markdown robusto** - Renderizado completo sin dependencias externas
- ✅ **Botones de utilidad** - Copiar al portapapeles y descargar como .md
- ✅ **Tokens de tema integrados** - Colores consistentes con el sistema Standard UI
- ✅ **Fondo blanco del editor** - Diferenciación visual clara del contenedor
- ✅ **Accesibilidad completa** - Tooltips, navegación por teclado, ARIA labels
- ✅ **Responsive** - Adaptable a diferentes tamaños de pantalla

## Uso Básico

El editor más simple posible con configuración por defecto:

```tsx
import { StandardNote } from "@/components/ui/StandardNote";

<StandardNote 
  value={content} 
  onChange={setContent} 
/>
```

## Props Principales

### Contenido y Control

```tsx
interface StandardNoteProps {
  // Contenido del editor
  value?: string;
  onChange?: (value: string) => void;
  
  // Configuración básica
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  
  // Identificación
  id?: string;
  name?: string;
}
```

### Esquemas de Color (colorScheme)

Define la paleta de colores del editor y preview:

```tsx
// Editor neutro (por defecto)
<StandardNote colorScheme="neutral" />

// Editor con acento primario
<StandardNote colorScheme="primary" />

// Editor con tonos secundarios
<StandardNote colorScheme="secondary" />

// Editor con tonos terciarios  
<StandardNote colorScheme="tertiary" />

// Editor con color de acento
<StandardNote colorScheme="accent" />
```

### Tamaños (size)

Controla las dimensiones y espaciado del componente:

```tsx
// Tamaño pequeño
<StandardNote size="sm" />

// Tamaño mediano (por defecto)
<StandardNote size="md" />

// Tamaño grande
<StandardNote size="lg" />

// Tamaño extra grande
<StandardNote size="xl" />
```

## Modos de Visualización (viewMode)

### Modo Dividido (por defecto)
Muestra editor y preview lado a lado con sincronización:

```tsx
<StandardNote 
  viewMode="divided"
  value={content}
  onChange={setContent}
/>
```

### Solo Editor
Enfoque completo en la escritura:

```tsx
<StandardNote 
  viewMode="editor"
  value={content}
  onChange={setContent}
/>
```

### Solo Preview
Visualización de solo lectura del contenido renderizado:

```tsx
<StandardNote 
  viewMode="preview"
  value={content}
  onChange={setContent}
/>
```

## Toolbar y Controles

### Toolbar Completa (por defecto)
Incluye etiquetas de texto y todos los controles:

```tsx
<StandardNote 
  showToolbar={true}
  minimalToolbar={false}
/>
```

### Toolbar Minimalista
Solo iconos con tooltips, ideal para interfaces humanistas:

```tsx
<StandardNote 
  showToolbar={true}
  minimalToolbar={true}
/>
```

### Sin Toolbar
Editor limpio sin controles:

```tsx
<StandardNote 
  showToolbar={false}
/>
```

## Funcionalidades Avanzadas

### Preview en Tiempo Real
Actualización automática del preview mientras se escribe:

```tsx
<StandardNote 
  livePreview={true}
  previewDebounceMs={300} // Retraso para optimizar rendimiento
/>
```

### Sincronización de Scroll
Control de la sincronización automática entre editor y preview:

```tsx
<StandardNote 
  scrollSync={true} // Por defecto: true
/>
```

### Altura Personalizada
Control del tamaño vertical del editor:

```tsx
<StandardNote 
  minHeight="400px"
  maxHeight="800px"
/>
```

## Casos de Uso Comunes

### Editor de Notas de Artículos
Para investigadores que toman notas sobre artículos académicos:

```tsx
<StandardNote
  value={noteContent}
  onChange={setNoteContent}
  placeholder="Escribe tus notas sobre este artículo..."
  colorScheme="primary"
  size="lg"
  minimalToolbar={true}
  viewMode="divided"
  showToolbar={true}
  livePreview={true}
  previewDebounceMs={300}
  minHeight="400px"
/>
```

### Editor de Documentación
Para escribir documentación técnica:

```tsx
<StandardNote
  value={docContent}
  onChange={setDocContent}
  placeholder="Escribe la documentación..."
  colorScheme="neutral"
  size="xl"
  minimalToolbar={false}
  viewMode="divided"
  showToolbar={true}
  livePreview={true}
  minHeight="600px"
/>
```

### Visor de Solo Lectura
Para mostrar contenido Markdown renderizado:

```tsx
<StandardNote
  value={readOnlyContent}
  viewMode="preview"
  readOnly={true}
  showToolbar={false}
  colorScheme="neutral"
  size="md"
/>
```

## Integración con Formularios

### Con React Hook Form

```tsx
import { Controller } from "react-hook-form";

<Controller
  name="content"
  control={form.control}
  render={({ field, fieldState }) => (
    <StandardNote
      {...field}
      placeholder="Escribe el contenido..."
      colorScheme={fieldState.error ? "danger" : "primary"}
      minimalToolbar={true}
    />
  )}
/>
```

### Con Estado Local

```tsx
const [content, setContent] = useState("");
const [hasChanges, setHasChanges] = useState(false);

const handleChange = (newContent: string) => {
  setContent(newContent);
  setHasChanges(true);
};

<StandardNote
  value={content}
  onChange={handleChange}
  placeholder="Escribe aquí..."
/>
```

## Funciones de Utilidad

### Copiar al Portapapeles
El botón de copiar utiliza la Clipboard API del navegador:

```tsx
// Se activa automáticamente con el botón en la toolbar
// Copia el contenido Markdown raw al portapapeles
```

### Descargar como Archivo
El botón de descarga genera un archivo .md:

```tsx
// Se activa automáticamente con el botón en la toolbar
// Descarga el contenido como archivo "nota.md"
```

## Personalización de Estilos

### Tokens de Tema
El componente utiliza tokens del sistema de temas:

```tsx
// Los colores se adaptan automáticamente al tema claro/oscuro
// Highlight: usa accent.pure con 8% de opacidad
// Bordes: usa accent.pure con 60% de opacidad
// Fondo del editor: siempre blanco para máximo contraste
```

### CSS Custom Properties
Para personalización avanzada:

```css
.standard-note {
  --note-bg: var(--color-background);
  --note-border: var(--color-border);
  --note-text: var(--color-text);
  --note-placeholder: var(--color-text-muted);
}
```

## Limitaciones y Consideraciones

### Rendimiento
- El debounce del preview está optimizado para 300ms por defecto
- La sincronización de scroll usa throttling para evitar lag
- El mapeo línea-elemento se recalcula solo cuando cambia el contenido

### Compatibilidad
- Requiere navegadores modernos con soporte para Clipboard API
- La sincronización de scroll funciona mejor en contenedores con altura fija
- El highlight de línea requiere JavaScript habilitado

### Markdown Soportado
- Títulos (H1-H6)
- Texto en **negrita** e *cursiva*
- Listas ordenadas y no ordenadas
- Enlaces y código inline
- Bloques de código
- Citas (blockquotes)
- Líneas horizontales

## Troubleshooting

### El highlight no es visible
- Verificar que `scrollSync={true}`
- Asegurar que el contenedor tenga altura definida
- Comprobar que no hay conflictos de CSS con z-index

### La sincronización está desfasada
- Aumentar el `previewDebounceMs` si hay lag
- Verificar que el contenido no tenga caracteres especiales problemáticos
- Asegurar que el mapeo línea-elemento esté funcionando

### El select no se despliega
- Usar la API correcta con `options` array
- No usar la estructura de subcomponentes `<Select.Item>`
- Verificar que el z-index del contenedor permita el dropdown

## Ejemplos Avanzados

### Editor con Persistencia
```tsx
const [content, setContent] = useState("");
const [title, setTitle] = useState("");
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

const handleContentChange = (newContent: string) => {
  setContent(newContent);
  setHasUnsavedChanges(true);
};

const handleSave = async () => {
  await saveNote({ title, content });
  setHasUnsavedChanges(false);
};

<div className="space-y-4">
  <StandardInput
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Título de la nota"
  />
  
  <StandardNote
    value={content}
    onChange={handleContentChange}
    placeholder="Contenido de la nota..."
    minimalToolbar={true}
    viewMode="divided"
  />
  
  <StandardButton 
    onClick={handleSave}
    disabled={!hasUnsavedChanges}
  >
    Guardar Nota
  </StandardButton>
</div>
```

### Editor en Modal/Popup
```tsx
<StandardPopupWindow open={isOpen} onOpenChange={setIsOpen}>
  <StandardPopupWindow.Content size="lg">
    <StandardPopupWindow.Header>
      <StandardPopupWindow.Title>
        Editar Nota
      </StandardPopupWindow.Title>
    </StandardPopupWindow.Header>
    
    <StandardPopupWindow.Body>
      <StandardNote
        value={noteContent}
        onChange={setNoteContent}
        minimalToolbar={true}
        viewMode="divided"
        minHeight="400px"
      />
    </StandardPopupWindow.Body>
    
    <StandardPopupWindow.Footer>
      <StandardButton onClick={() => setIsOpen(false)}>
        Cerrar
      </StandardButton>
      <StandardButton onClick={handleSave}>
        Guardar
      </StandardButton>
    </StandardPopupWindow.Footer>
  </StandardPopupWindow.Content>
</StandardPopupWindow>
```

## Migración desde StandardNote_betaFriendly

Si estás migrando desde la versión beta:

```tsx
// Antes (beta)
<StandardNote_betaFriendly
  value={content}
  onChange={setContent}
  humanistFriendly={true}
  showPreview={true}
/>

// Después (actual)
<StandardNote
  value={content}
  onChange={setContent}
  minimalToolbar={true}
  viewMode="divided"
/>
```

## Contribución y Desarrollo

### Estructura del Componente
- `StandardNote.tsx` - Componente principal
- `useScrollSync.tsx` - Hook para sincronización de scroll
- `generateStandardNoteTokens.ts` - Generador de tokens de tema

### Testing
- Probar en diferentes tamaños de pantalla
- Validar sincronización con contenido largo
- Verificar accesibilidad con lectores de pantalla
- Comprobar rendimiento con contenido extenso

---

**Versión**: 2.0 (Enero 2025)  
**Mantenedor**: Equipo SUSTRATO.AI  
**Última actualización**: 21 de Julio, 2025
