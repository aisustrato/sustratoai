# StandardIcon v2.3

> 🎨 Wrapper de iconos SVG con tokens de color y tamaño

## Ubicación

```
components/ui/StandardIcon.tsx
```

## Propósito

Envolver iconos SVG (Lucide, Heroicons, etc.) para aplicar tokens de color, tamaño y efectos de manera consistente. Soporta cualquier librería de iconos SVG.

---

## Props Principales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | **requerido** | El icono SVG a envolver |
| `size` | `"xs" \| "sm" \| "base" \| "lg" \| "xl" \| "2xl"` | `"md"` | Tamaño |
| `colorScheme` | `ColorSchemeVariant` | `"neutral"` | Esquema de color |
| `styleType` | `"outline" \| "filled" \| "gradient"` | `"outline"` | Tipo de estilo |
| `colorShade` | `"pure" \| "text" \| "textShade" \| "bg" \| "contrastText" \| "subtle"` | `"pure"` | Tono del color |
| `isSpinning` | `boolean` | `false` | Activar animación de giro |

---

## Uso Básico

```tsx
import { StandardIcon } from "@/components/ui/StandardIcon";
import { Heart, Star, Bell } from "lucide-react";

// Básico
<StandardIcon>
  <Heart />
</StandardIcon>

// Con color y tamaño
<StandardIcon colorScheme="danger" size="xl">
  <Heart />
</StandardIcon>

// Spinning (para loading)
<StandardIcon isSpinning colorScheme="primary">
  <Loader />
</StandardIcon>
```

---

## StyleTypes

### outline
Icono con borde/stroke visible, relleno transparente.

```tsx
<StandardIcon styleType="outline" colorScheme="primary">
  <Heart />
</StandardIcon>
```

### filled
Icono con relleno sólido del color.

```tsx
<StandardIcon styleType="filled" colorScheme="danger">
  <Heart />
</StandardIcon>
```

### gradient
Icono con relleno de gradiente.

```tsx
<StandardIcon styleType="gradient" colorScheme="accent">
  <Star />
</StandardIcon>
```

---

## Tamaños

| Size | Valor |
|------|-------|
| `xs` | 12px |
| `sm` | 16px |
| `base` | 20px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 40px |

---

## ColorShades

| Shade | Uso |
|-------|-----|
| `pure` | Color puro del colorScheme |
| `text` | Color de texto |
| `textShade` | Variante de texto |
| `bg` | Color de fondo |
| `contrastText` | Texto de contraste |
| `subtle` | Versión suave |

---

## Factory Helper

Para crear iconos pre-configurados:

```tsx
import { createStandardIcon } from "@/components/ui/StandardIcon";
import { Heart, Star } from "lucide-react";

// Crear iconos con defaults
const HeartIcon = createStandardIcon(Heart, { 
  colorScheme: "danger" 
});

const StarIcon = createStandardIcon(Star, { 
  colorScheme: "warning",
  styleType: "filled"
});

// Uso
<HeartIcon size="xl" />
<StarIcon />
```

---

## Integración con Otros Componentes

### En StandardButton

```tsx
<StandardButton leftIcon={Heart} colorScheme="danger">
  Me gusta
</StandardButton>
```

### En StandardInput

```tsx
<StandardInput 
  leadingIcon={Search} 
  placeholder="Buscar..." 
/>
```

### En StandardCard

```tsx
<StandardCard>
  <StandardCard.Header>
    <StandardIcon colorScheme="success" size="lg">
      <CheckCircle />
    </StandardIcon>
    <StandardCard.Title>Éxito</StandardCard.Title>
  </StandardCard.Header>
</StandardCard>
```

---

## Arquitectura Interna

### Variables CSS

```css
--si-fill: color de relleno
--si-stroke: color de borde
--si-stroke-width: 1.5
```

### Tokens

```tsx
const recipe = generateStandardIconTokens(
  appColorTokens, 
  mode, 
  colorScheme, 
  styleType, 
  colorShade
);
```

---

## Showroom

```
/showroom/standard-icon
```

Tabs: Interactivo, Esquemas, Variantes, Estilos

---

📍 `docs/standard-UI/StandardIcon.md`  
🎯 v2.3 - Con isSpinning  
🎨 Iconos consistentes en todo el sistema
