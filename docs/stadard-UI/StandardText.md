# StandardText: Guía de Referencia Rápida

`StandardText` es el componente fundamental para renderizar todo el texto en la aplicación. Asegura consistencia tipográfica y se integra completamente con el sistema de temas para la gestión de colores y estilos.

**Versión:** v4.4 - Patrón Flex + Tokens Provider + i18n  
**Arquitectura:** Consume tokens precalculados desde `DesignTokensProvider` con soporte completo de internacionalización.

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

---

## 🌍 Internacionalización (i18n)

StandardText v4.4 incluye soporte completo para internacionalización mediante `next-intl`.

### 5. Uso Básico de i18n

Usa `i18nKey` para mostrar traducciones automáticamente según el idioma del usuario:

```tsx
// Traducción simple
<StandardText i18nKey="common.save">
  {/* Fallback si no hay traducción */}
</StandardText>

// Con namespace explícito
<StandardText i18nKey="save" i18nNamespace="common">
  Guardar
</StandardText>
```

**Estructura de archivos de traducción:**
```
messages/
  ├── en.json
  └── es.json
```

**Ejemplo `es.json`:**
```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar"
  },
  "errors": {
    "required": "Este campo es obligatorio",
    "invalid": "Valor inválido"
  }
}
```

### 6. Interpolación de Valores

Usa `i18nValues` para insertar valores dinámicos en las traducciones:

```tsx
// Traducción: "Quedan {count} caracteres"
<StandardText 
  i18nKey="editor.charactersLeft" 
  i18nValues={{ count: 150 }}
/>

// Traducción: "Hola, {name}!"
<StandardText 
  i18nKey="greeting.welcome" 
  i18nValues={{ name: "María" }}
/>
```

### 7. Prioridad de Contenido

StandardText resuelve el contenido en el siguiente orden:

1. **`children`** (siempre gana - escape hatch)
2. **`i18nKey`** (traducción automática)
3. **Fallback vacío**

```tsx
// Caso 1: children tiene prioridad
<StandardText i18nKey="common.save">
  Guardar Ahora {/* Este texto se muestra, ignora i18nKey */}
</StandardText>

// Caso 2: Solo i18nKey
<StandardText i18nKey="common.save" />
{/* Muestra traducción según idioma */}

// Caso 3: Traducción no encontrada
<StandardText i18nKey="nonexistent.key" />
{/* Muestra: [nonexistent.key] + warning en consola */}
```

### 8. Combinando i18n con Estilos

Todas las props de estilo funcionan con i18n:

```tsx
// Título traducido con gradiente
<StandardText 
  preset="heading" 
  i18nKey="home.mainTitle"
  applyGradient
/>

// Error traducido con color
<StandardText 
  colorScheme="danger" 
  colorShade="text"
  i18nKey="errors.invalidEmail"
  i18nValues={{ email: userEmail }}
/>

// Caption traducido
<StandardText 
  preset="caption" 
  i18nKey="footer.copyright"
  i18nValues={{ year: 2026 }}
/>
```

---

## 📋 Props Completas

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `preset` | `StandardTextPreset` | - | Estilo semántico predefinido |
| `asElement` | `React.ElementType` | `"p"` o según preset | Etiqueta HTML a renderizar |
| `size` | `TextSize` | `"base"` o según preset | Tamaño de fuente |
| `weight` | `TextWeight` | `"normal"` o según preset | Grosor de fuente |
| `align` | `TextAlign` | - | Alineación del texto |
| `truncate` | `boolean` | `false` | Truncar con `...` |
| `colorScheme` | `ColorSchemeVariant` | - | Esquema de color |
| `colorShade` | `TextColorShade` | `"text"` | Sombra de color |
| `applyGradient` | `ColorSchemeVariant \| boolean` | - | Aplicar gradiente |
| `i18nKey` | `string` | - | Clave de traducción |
| `i18nNamespace` | `string` | - | Namespace de traducción |
| `i18nValues` | `Record<string, string \| number>` | - | Valores para interpolación |
| `children` | `ReactNode` | - | Contenido del texto |
| `className` | `string` | - | Clases CSS adicionales |

---

## 🏗️ Arquitectura v4.4

StandardText utiliza el **Patrón Flex** con tokens precalculados:

1. **Tokens Precalculados**: Los colores y gradientes se generan una sola vez en `DesignTokensProvider`
2. **Sin Recálculos**: El componente NO recalcula estilos en cada render
3. **Performance**: O(1) para obtener tokens de color
4. **i18n Integrado**: Soporte nativo de internacionalización con `next-intl`

**Beneficios:**
- ⚡ Performance óptima (sin recálculos)
- 🎨 Colores consistentes con el sistema de diseño
- 🌍 Interfaces multiidioma sin esfuerzo
- 🧠 Lógica de resolución de contenido inteligente
- 📐 Tipografía semántica con presets

---

## 🎯 Casos de Uso Recomendados

### Títulos Principales
```tsx
<StandardText preset="heading" i18nKey="pages.home.title">
  Bienvenido a SUSTRATO.AI
</StandardText>
```

### Mensajes de Error
```tsx
<StandardText 
  colorScheme="danger" 
  colorShade="text"
  i18nKey="errors.validation.required"
  i18nValues={{ field: "Email" }}
/>
```

### Texto de Ayuda
```tsx
<StandardText 
  preset="caption" 
  colorScheme="neutral"
  colorShade="textShade"
  i18nKey="help.passwordRequirements"
/>
```

### Contenido Dinámico
```tsx
<StandardText 
  preset="body"
  i18nKey="dashboard.articlesCount"
  i18nValues={{ count: totalArticles }}
/>
```

---

## 💡 Tips y Mejores Prácticas

1. **Usa presets primero**: Son semánticamente correctos y mantienen consistencia
2. **i18n por defecto**: Siempre que sea posible, usa `i18nKey` en lugar de texto hardcodeado
3. **Namespace explícito**: Para keys sin punto, especifica `i18nNamespace`
4. **Gradientes con moderación**: Solo para títulos principales o elementos destacados
5. **ColorShade apropiado**: `text` para cuerpo, `pure` para énfasis, `subtle` para secundario
