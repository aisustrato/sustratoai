# StandardSelect: Guía de Referencia Rápida

`StandardSelect` es un componente de selección altamente personalizable y avanzado. Reemplaza al elemento `<select>` nativo para ofrecer una integración total con el sistema de temas, animaciones y funcionalidades enriquecidas como la selección múltiple y opciones con iconos.

---

### 1. Uso Básico (Selección Única)
Para un menú desplegable simple, proporciona un array de `options`, el `value` seleccionado y un manejador `onChange`.

```tsx
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";

const opcionesDePrioridad: SelectOption[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

const [prioridad, setPrioridad] = useState('media');

<StandardSelect 
  options={opcionesDePrioridad}
  value={prioridad}
  onChange={(newValue) => setPrioridad(newValue as string)}
  placeholder="Seleccionar prioridad..."
/>
```

### 2. Selección Múltiple (`multiple`)
Al activar la prop `multiple`, el componente permite seleccionar varios valores. El `value` debe ser un array de strings.

```tsx
const [categorias, setCategorias] = useState(['react', 'typescript']);

<StandardSelect 
  multiple
  options={/* ... */}
  value={categorias}
  onChange={(newValues) => setCategorias(newValues as string[])}
  placeholder="Seleccionar categorías..."
/>
```

### 3. Opciones Enriquecidas
Las opciones pueden incluir un `icon`, una `description` y un estado `disabled`.

```tsx
import { Code, Database, Server, CloudOff } from "lucide-react";

const techOptions: SelectOption[] = [
  { value: "frontend", label: "Frontend", description: "React, Vue, etc.", icon: Code },
  { value: "backend", label: "Backend", description: "Node.js, Python, etc.", icon: Server },
  { value: "db", label: "Base de Datos", description: "PostgreSQL, MongoDB", icon: Database },
  { value: "cloud", label: "Cloud", description: "Servicio no disponible", icon: CloudOff, disabled: true },
];

<StandardSelect options={techOptions} /* ... */ />
```

### 4. Personalización y Estilos

-   **`colorScheme`**: Define la paleta de colores base (borde, fondo, anillo de foco) para los estados normal y de foco. Opciones: `default`, `primary`, `accent`, etc.
-   **`size`**: Ajusta la altura y el tamaño de la fuente. Opciones: `sm`, `md`, `lg`.

```tsx
<StandardSelect
  options={opciones}
  colorScheme="accent"
  size="lg"
/>
```

### 5. Estados Visuales
El componente reacciona a diferentes props de estado, cambiando su apariencia (color de borde, fondo) según el tema.

-   **`error`**: Muestra un estado de error. Recibe un string con el mensaje.
-   **`success`**: Muestra un estado de éxito.
-   **`disabled`**: Deshabilita completamente el componente.
-   **`readOnly`**: Muestra el valor pero no permite la interacción.

```tsx
// Ejemplo de estado de error
<StandardSelect 
  options={opciones}
  value={valor}
  error={errors.miCampo ? "Este campo es requerido" : undefined}
/>

// Ejemplo de estado deshabilitado
<StandardSelect options={opciones} value="valor" disabled />
```

### 6. Funcionalidades Adicionales

-   **`clearable`**: Muestra un botón (X) que permite al usuario limpiar la selección actual.
-   **`leadingIcon`**: Añade un icono al inicio del campo para dar un contexto visual.

```tsx
import { Filter } from "lucide-react";

<StandardSelect 
  options={opciones}
  value={filtro}
  onChange={setFiltro}
  clearable
  leadingIcon={Filter}
  placeholder="Filtrar por..."
/>
```
