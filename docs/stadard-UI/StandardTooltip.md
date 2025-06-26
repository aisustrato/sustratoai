# StandardTooltip: Guía de Referencia Rápida

`StandardTooltip` es un componente que muestra información contextual al pasar el cursor o hacer foco sobre un elemento. Es ideal para iconos, botones truncados o para ofrecer ayuda adicional sin saturar la interfaz. Está construido sobre Radix UI para garantizar una accesibilidad completa.

---

### 1. Uso Básico

El componente funciona con dos props principales: `trigger` y `children`.

-   `trigger`: Es el elemento React que activará el tooltip (ej. un botón, un icono).
-   `children`: Es el contenido que se mostrará dentro del tooltip.

```tsx
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardIcon } from "@/components/ui/StandardIcon";

<StandardTooltip trigger={<StandardIcon icon="info" />}>
  <p>Esta es una información adicional importante.</p>
</StandardTooltip>
```

### 2. Posicionamiento

Puedes controlar con precisión dónde aparece el tooltip.

-   **`side`**: Define el lado del trigger donde aparece. Opciones: `'top'` (defecto), `'bottom'`, `'left'`, `'right'`.
-   **`align`**: Alinea el tooltip con respecto al lado. Opciones: `'start'`, `'center'` (defecto), `'end'`.
-   **`sideOffset`**: La distancia en píxeles entre el trigger y el tooltip.

```tsx
<StandardTooltip 
  trigger={<button>Ver a la Derecha</button>}
  side="right"
  align="start"
  sideOffset={10}
>
  Aparezco al inicio del lado derecho.
</StandardTooltip>
```

### 3. Personalización Visual

El tooltip se puede estilizar para adaptarse a diferentes contextos.

-   **`colorScheme`**: Define la paleta de colores (`'neutral'`, `'primary'`, `'accent'`, etc.).
-   **`styleType`**: El estilo de fondo (`'solid'` o `'gradient'`).
-   **`isAccentuated`**: Un booleano (`true` por defecto) que aplica un estilo más destacado (con sombra y sin flecha). Ponlo en `false` para un look más sutil.
-   **`hideArrow`**: Oculta la flecha del tooltip.

```tsx
// Tooltip sutil, sin acentuación y con flecha
<StandardTooltip 
  trigger={<button>Sutil</button>}
  isAccentuated={false}
  hideArrow={false}
>
  Tooltip simple.
</StandardTooltip>

// Tooltip con gradiente de acento
<StandardTooltip 
  trigger={<button>Destacado</button>}
  colorScheme="accent"
  styleType="gradient"
>
  ¡Llamativo!
</StandardTooltip>
```

### 4. Modo de Texto Largo (`isLongText`)

Para mostrar contenido extenso, como definiciones o ayuda detallada, activa el modo `isLongText`. Esto transforma el tooltip en una ventana flotante centrada en la pantalla, con scroll interno.

```tsx
<StandardTooltip 
  trigger={<button>Leer Términos</button>}
  isLongText={true}
>
  <h2>Términos y Condiciones</h2>
  <p>Aquí iría un texto muy largo explicando todos los detalles legales que el usuario necesita leer...</p>
</StandardTooltip>
```
