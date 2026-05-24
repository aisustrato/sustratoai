# Skill: StandardIcon

## Qué es

Wrapper de íconos SVG con tokens precalculados. Aplica colores (fill/stroke), tamaños y estilos (solid, outline, gradient) a cualquier icono lucide-react o SVG hijo. Soporta animación de giro (isSpinning).

## Import

```tsx
import { StandardIcon } from "@/components/ui/StandardIcon"
import type { StandardIconSize, StandardIconStyleType, StandardIconColorShade } from "@/components/ui/StandardIcon"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `ReactNode` (requerido) | — | El icono SVG a wrappear (ej. `<Heart />`) |
| `size` | `"xs" \| "sm" \| "base" \| "lg" \| "xl" \| "2xl"` | `"md"` | Tamaño del icono |
| `colorScheme` | `ColorSchemeVariant` | `"neutral"` | Esquema de color |
| `styleType` | `"solid" \| "outline" \| "outlineGradient" \| "inverseStroke"` | `"outline"` | Estilo de trazo/relleno |
| `colorShade` | `"pure" \| "text" \| "textShade" \| "bg" \| "contrastText" \| "subtle"` | `"pure"` | Tonalidad del color (ignorado para outlineGradient/inverseStroke) |
| `isSpinning` | `boolean` | `false` | Animación de giro continuo |
| `className` | `string` | — | Clases adicionales |

## Uso correcto

```tsx
// ✅ Básico con icono lucide-react
<StandardIcon colorScheme="primary" size="lg">
  <Heart />
</StandardIcon>

// ✅ Solid fill
<StandardIcon colorScheme="success" styleType="solid" size="2xl">
  <CheckCircle />
</StandardIcon>

// ✅ Outline con colorShade
<StandardIcon colorScheme="danger" styleType="outline" colorShade="text" size="xl">
  <AlertCircle />
</StandardIcon>

// ✅ Gradient outline
<StandardIcon colorScheme="accent" styleType="outlineGradient" size="2xl">
  <Sparkles />
</StandardIcon>

// ✅ Spinning (para loaders)
<StandardIcon colorScheme="primary" isSpinning size="lg">
  <Loader2 />
</StandardIcon>

// ✅ Dentro de StandardButton (el botón ya lo wrappea automáticamente)
<StandardButton leftIcon={Star}>Guardar</StandardButton>

// ✅ Usar createStandardIcon para preconfigurar
import { createStandardIcon } from "@/components/ui/StandardIcon"
const SuccessIcon = createStandardIcon(CheckCircle, { colorScheme: "success", size: "lg" })
<SuccessIcon />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No usar className para colores
<StandardIcon className="text-red-500"><Heart /></StandardIcon>

// ❌ No usar style para colores
<StandardIcon style={{ color: "blue" }}><Heart /></StandardIcon>

// ❌ styleType "outlineGradient" e "inverseStroke" ignoran colorShade
// No tiene sentido pasarlo
```

## Cuándo NO usar este componente

- Para íconos puramente decorativos sin vinculación al sistema de tokens: `<SomeIcon size={16} className="text-gray-500" />` directo.
- StandardButton ya wrappea los íconos con StandardIcon automáticamente al pasar `leftIcon`/`rightIcon`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardIcon necesita styleType "duotone"`
