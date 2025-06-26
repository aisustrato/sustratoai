# StandardCard: Guía de Referencia Rápida

`StandardCard` es un sistema de componentes altamente versátil y componible para mostrar contenido en un contenedor agrupado. Utiliza una API de composición y está enriquecido con animaciones y múltiples estados visuales.

---

### 1. API de Composición

La fortaleza de `StandardCard` reside en su estructura componible. Debes anidar sus subcomponentes para construir la tarjeta.

-   `StandardCard.Header`: Contenedor para el título y subtítulo.
-   `StandardCard.Title`: El título principal (un `StandardText` `h3`).
-   `StandardCard.Subtitle`: El subtítulo (un `StandardText` `p`).
-   `StandardCard.Media`: Contenedor para imágenes o videos.
-   `StandardCard.Content`: El cuerpo principal de la tarjeta.
-   `StandardCard.Actions`: Contenedor para botones de acción.
-   `StandardCard.Footer`: Un pie de tarjeta, usualmente para metadatos.

#### Ejemplo de Estructura

```tsx
import { StandardCard } from "@/components/ui/StandardCard";

<StandardCard>
  <StandardCard.Header>
    <StandardCard.Title>Título de la Tarjeta</StandardCard.Title>
    <StandardCard.Subtitle>Un subtítulo descriptivo</StandardCard.Subtitle>
  </StandardCard.Header>
  <StandardCard.Content>
    <p>Este es el contenido principal de la tarjeta.</p>
  </StandardCard.Content>
  <StandardCard.Actions>
    <button>Acción 1</button>
    <button>Acción 2</button>
  </StandardCard.Actions>
</StandardCard>
```

### 2. Estados Visuales y Funcionales

`StandardCard` puede manejar múltiples estados complejos.

-   **`loading`**: Muestra una superposición con el logo animado de Sustrato, bloqueando la interacción.
-   **`selected`**: Aplica un borde y un overlay de color para indicar selección.
-   **`inactive`**: Aplica una superposición que deshabilita la tarjeta visual y funcionalmente.
-   **`showSelectionCheckbox`**: Muestra un checkbox en la esquina para una selección explícita.

```tsx
// Tarjeta en estado de carga
<StandardCard loading={true} loadingText="Cargando datos...">
  {/* ...contenido... */}
</StandardCard>

// Tarjeta seleccionable
<StandardCard 
  selected={isSelected}
  showSelectionCheckbox={true}
  onSelectionChange={setIsSelected}
  onCardClick={() => console.log('Tarjeta clickeada')}
>
  {/* ...contenido... */}
</StandardCard>
```

### 3. Personalización Visual Profunda

Ofrece un control granular sobre la apariencia.

-   **`colorScheme`**: Paleta de colores base para fondo y texto.
-   **`styleType`**: Estilo del fondo (`'subtle'`, `'solid'`, `'transparent'`).
-   **`shadow`**: Nivel de sombra (`'sm'`, `'md'`, `'lg'`, `'xl'`).
-   **`hasOutline`**: Añade un borde a la tarjeta.
-   **`accentPlacement`**: Añade una barra de color de acento (`'top'`, `'left'`, `'bottom'`, `'right'`).
-   **`accentColorScheme`**: Define el color de la barra de acento.

```tsx
<StandardCard
  colorScheme="secondary"
  styleType="solid"
  shadow="xl"
  accentPlacement="left"
  accentColorScheme="accent"
>
  {/* ...contenido... */}
</StandardCard>
```

### 4. Animaciones

La tarjeta utiliza `framer-motion` para una experiencia de usuario fluida.

-   **`animateEntrance`**: Anima la aparición de la tarjeta.
-   **`disableShadowHover`**: Por defecto está en `true`. Si se pone en `false`, la tarjeta reacciona al hover con una animación de escala y sombra.
-   La tarjeta también tiene una animación de `tap` (pulsación) si tiene un evento `onCardClick`.
