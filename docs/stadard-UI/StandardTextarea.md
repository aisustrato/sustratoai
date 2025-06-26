# StandardTextarea: Guía de Referencia Rápida

`StandardTextarea` es el componente estándar para la entrada de texto de formato largo, como comentarios o descripciones. Está diseñado para ser robusto, accesible y visualmente coherente con el sistema de diseño.

---

### 1. Uso Básico

En su forma más simple, `StandardTextarea` funciona como un elemento `<textarea>` nativo, pero con los estilos del sistema de diseño aplicados.

```tsx
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { useState } from 'react';

const [comentario, setComentario] = useState("");

<StandardTextarea 
  id="comentario"
  placeholder="Escribe tu comentario aquí..."
  value={comentario}
  onChange={(e) => setComentario(e.target.value)}
  rows={4}
/>
```

### 2. Estados Visuales

El componente reacciona visualmente a diferentes estados para proporcionar feedback claro al usuario.

-   **`error`**: Muestra un borde y un anillo de foco de color rojo. Se le pasa un string con el mensaje de error (aunque el mensaje se debe mostrar fuera, usando `StandardLabel` o `StandardText`).
-   **`success`**: Muestra un borde y anillo de foco de color verde.
-   **`disabled`**: Deshabilita el campo y le da una apariencia inactiva.
-   **`readOnly`**: El campo no se puede editar, pero su contenido se puede seleccionar.

```tsx
// Estado de error
<StandardTextarea error="El campo no puede estar vacío." />

// Estado de éxito
<StandardTextarea success={true} />

// Deshabilitado
<StandardTextarea disabled value="No se puede editar." />
```

### 3. Contador de Caracteres

Si se proporciona la prop `maxLength`, se puede activar un contador de caracteres con `showCharacterCount`. El contador cambia a color de error si el texto está vacío y el campo es requerido, o si se alcanza el límite.

```tsx
const [bio, setBio] = useState("Soy un desarrollador...");

<StandardTextarea 
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  maxLength={150}
  showCharacterCount={true}
/>
```

### 4. Personalización

-   **`size`**: Ajusta la altura, el padding y el tamaño de la fuente. Opciones: `'sm'`, `'md'` (defecto), `'lg'`.
-   **`colorScheme`**: Aunque los estados de `error` y `success` tienen prioridad, se puede definir un `colorScheme` para el estado normal y de foco.
-   **`rows`**: Controla el número de filas de texto visibles por defecto.

```tsx
<StandardTextarea 
  size="lg"
  colorScheme="secondary"
  placeholder="Un área de texto más grande"
  rows={6}
/>
```

### 5. Accesibilidad

Para una accesibilidad completa, siempre asocia `StandardTextarea` con un `StandardLabel` usando el par `id` y `htmlFor`. Además, puedes usar `aria-describedby` para vincular el campo con mensajes de error o ayuda adicionales.
