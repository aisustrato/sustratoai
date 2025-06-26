# StandardText: Guía de Referencia Rápida

`StandardText` es el componente fundamental para renderizar todo el texto en la aplicación. Asegura consistencia tipográfica y se integra completamente con el sistema de temas para la gestión de colores y estilos.

---

### 1. Uso con Presets (Recomendado)

La forma más sencilla de usar `StandardText` es a través de los `presets`, que aplican estilos semánticos predefinidos.

-   `'heading'`: Título principal (h1, grande, negrita, con gradiente).
-   `'subheading'`: Subtítulo principal (h2, grande, semibold).
-   `'title'`: Título de sección (h3, xl, semibold).
-   `'subtitle'`: Subtítulo de sección (h4, lg, medium).
-   `'body'` (defecto): Texto de párrafo normal.
-   `'caption'`: Texto pequeño para notas o leyendas.

```tsx
import { StandardText } from "@/components/ui/StandardText";

<StandardText preset="heading">Título Principal</StandardText>
<StandardText preset="subheading">Un subtítulo impactante</StandardText>
<StandardText preset="body">
  Este es un párrafo de texto normal que utiliza los estilos base del cuerpo.
</StandardText>
<StandardText preset="caption">Nota al pie de página.</StandardText>
```

### 2. Personalización Granular

Puedes sobreescribir cualquier propiedad de un `preset` o construir tu propio estilo desde cero.

```tsx
// Un párrafo 'body' pero centrado y en negrita
<StandardText preset="body" align="center" weight="bold">
  Texto importante y centrado.
</StandardText>

// Un texto completamente personalizado
<StandardText asElement="span" size="5xl" weight="bold" colorScheme="accent">
  ¡WOW!
</StandardText>
```

### 3. Propiedades Clave

-   **`asElement`**: Cambia la etiqueta HTML renderizada (ej. `'h1'`, `'p'`, `'span'`).
-   **`size`**: Tamaño de la fuente (de `'3xs'` a `'5xl'`).
-   **`weight`**: Grosor de la fuente (`'normal'`, `'medium'`, `'semibold'`, `'bold'`).
-   **`align`**: Alineación del texto (`'left'`, `'center'`, `'right'`, `'justify'`).
-   **`truncate`**: Si es `true`, trunca el texto con `...` si no cabe.

### 4. Colores y Gradientes

#### Color Sólido
Usa `colorScheme` y `colorShade` para aplicar un color del tema.

```tsx
// Texto de éxito usando el color 'text' de la paleta 'success'
<StandardText colorScheme="success" colorShade="text">
  Operación completada con éxito.
</StandardText>

// Texto de advertencia usando el color 'pure' (más intenso)
<StandardText colorScheme="warning" colorShade="pure">
  Atención: esto no se puede deshacer.
</StandardText>
```

#### Texto con Gradiente (`applyGradient`)

Aplica un gradiente de color al texto. Es ideal para títulos destacados. Por defecto, el `preset="heading"` ya lo aplica.

```tsx
// Aplicar el gradiente primario por defecto
<StandardText preset="title" applyGradient={true}>
  Título con Gradiente
</StandardText>

// Aplicar un gradiente específico
<StandardText preset="title" applyGradient="accent">
  Título con Gradiente de Acento
</StandardText>
```
