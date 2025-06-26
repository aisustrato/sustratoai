# StandardCheckbox: Guía de Referencia Rápida

`StandardCheckbox` es un control de selección enriquecido que extiende la funcionalidad de un checkbox HTML nativo. Permite al usuario marcar opciones, se integra con nuestro sistema de temas y soporta estados complejos como `indeterminate`.

---

### 1. API y Props Principales

La interacción se gestiona principalmente a través de estas propiedades.

-   **`label`**: El texto principal que describe la opción. Hacer clic en él activa el checkbox.
-   **`description`**: Un texto secundario opcional para proporcionar contexto adicional.
-   **`checked`**: Un booleano que determina si el checkbox está marcado. Es un componente controlado.
-   **`onChange`**: La función callback que se ejecuta cuando el estado del checkbox cambia.
-   **`id`**: Un identificador único para asociar la etiqueta (`label`) con el input, crucial para la accesibilidad.

#### Ejemplo Básico Controlado

```tsx
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { useState } from "react";

function TermsAgreement() {
  const [agreed, setAgreed] = useState(false);

  return (
    <StandardCheckbox
      id="terms-checkbox"
      label="Acepto los términos y condiciones"
      description="Revisa nuestra política de privacidad antes de continuar."
      checked={agreed}
      onChange={(e) => setAgreed(e.target.checked)}
    />
  );
}
```

### 2. Personalización Visual

Adapta la apariencia del checkbox al contexto de la interfaz.

-   **`size`**: Define el tamaño general del componente. Acepta `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`. El valor por defecto es `'md'`.
-   **`colorScheme`**: Aplica una paleta de colores del tema (`primary`, `secondary`, `accent`, etc.).

```tsx
// Checkbox grande y con el color de acento
<StandardCheckbox size="lg" colorScheme="accent" label="Opción Prioritaria" checked />

// Checkbox pequeño y secundario
<StandardCheckbox size="sm" colorScheme="secondary" label="Opción Menos Importante" checked />
```

### 3. Estados Clave

El componente puede representar varios estados importantes.

-   **`indeterminate`**: Un estado visual para indicar que el checkbox representa un grupo de sub-opciones con estados mixtos (algunas marcadas, otras no). Al interactuar, el estado se resuelve a `checked`.
-   **`disabled`**: Deshabilita el checkbox, impidiendo la interacción y reduciendo su opacidad.
-   **`error`**: Aplica un color de error (generalmente rojo) para indicar que la selección actual es inválida.

```tsx
// Estado Indeterminado (ej: un "Seleccionar Todo")
<StandardCheckbox label="Seleccionar todo" indeterminate={true} />

// Estado Deshabilitado
<StandardCheckbox label="Opción no disponible" disabled />

// Estado de Error
<StandardCheckbox label="Debes aceptar para continuar" error={true} />
```

### 4. Accesibilidad y Animaciones

-   **Accesibilidad**: `StandardCheckbox` renderiza un `<input type="checkbox">` real (aunque oculto visualmente) y lo asocia con su `label` a través del `id`. Esto asegura que sea completamente accesible para lectores de pantalla y navegación por teclado.
-   **Animaciones**: Utiliza `framer-motion` para animar suavemente la aparición del ícono de marca y del indicador de estado indeterminado, mejorando la retroalimentación visual.
