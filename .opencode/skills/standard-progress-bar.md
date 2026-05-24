# Skill: StandardProgressBar

## Qué es

Barra de progreso con múltiples variantes de estilo (solid, gradient, accent-gradient, thermometer), animaciones por hitos cada 25%, efecto de celebración al 100%, y modo indeterminado. Usa framer-motion para las animaciones.

## Import

```tsx
import { StandardProgressBar } from "@/components/ui/StandardProgressBar"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number` | `0` | Valor actual del progreso |
| `max` | `number` | `100` | Valor máximo |
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `styleType` | `"solid" \| "gradient" \| "accent-gradient" \| "thermometer"` | `"gradient"` | Variante visual |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Altura de la barra |
| `label` | `string` | — | Etiqueta sobre la barra |
| `showValue` | `boolean` | `false` | Muestra el porcentaje numérico |
| `indeterminate` | `boolean` | `false` | Modo indeterminado (carga sin progreso definido) |
| `animated` | `boolean` | `true` | Transiciones animadas al cambiar valor |
| `celebrateOnComplete` | `boolean` | `false` | Efecto PAFFF de celebración al llegar a 100% |
| `className` | `string` | — | Clases adicionales |

## Uso correcto

```tsx
// ✅ Básico
<StandardProgressBar value={65} />

// ✅ Con label y porcentaje
<StandardProgressBar
  value={75}
  colorScheme="success"
  styleType="gradient"
  label="Progreso de carga"
  showValue
/>

// ✅ Estilo thermometer
<StandardProgressBar
  value={80}
  colorScheme="primary"
  styleType="thermometer"
  size="lg"
  showValue
/>

// ✅ Indeterminado (loading spinner-like)
<StandardProgressBar indeterminate colorScheme="primary" styleType="gradient" />

// ✅ Con celebración al 100%
<StandardProgressBar
  value={100}
  colorScheme="success"
  styleType="gradient"
  label="Completado"
  showValue
  celebrateOnComplete
/>

// ✅ Sin animación
<StandardProgressBar value={50} colorScheme="warning" styleType="solid" animated={false} />

// ✅ Diferentes tamaños
<StandardProgressBar value={70} colorScheme="secondary" styleType="gradient" size="xs" />
<StandardProgressBar value={70} colorScheme="secondary" styleType="gradient" size="xl" />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardProgressBar className="bg-red-500" />

// ❌ No implementar tu propia barra de progreso con divs
// Usa StandardProgressBar
```

## Cuándo NO usar este componente

- Para indicadores de carga circulares: usa `SustratoLoadingLogo`.
- Para pasos secuenciales: usa `StandardStepper`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardProgressBar necesita styleType "segmented"`
