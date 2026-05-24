# Skill: StandardSlider

## Qué es

Slider basado en Radix UI Slider con tokens de diseño precalculados. Soporta modo simple y rango (multi-thumb), orientación horizontal/vertical, tooltip en portal, y variantes solid/gradient.

## Import

```tsx
import { StandardSlider } from "@/components/ui/StandardSlider"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `styleType` | `"solid" \| "gradient"` | `"solid"` | Variante visual |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Tamaño del thumb y track |
| `showTooltip` | `boolean` | `false` | Muestra tooltip con valor al interactuar |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Orientación |
| `value` | `number[]` | — | Valor(es) controlado(s) |
| `defaultValue` | `number[]` | `[0]` | Valor inicial |
| `onValueChange` | `(value: number[]) => void` | — | Callback al cambiar |
| `min` | `number` | `0` | Valor mínimo |
| `max` | `number` | `100` | Valor máximo |
| `step` | `number` | `1` | Incremento |
| `disabled` | `boolean` | — | Deshabilita |
| `className` | `string` | — | Clases adicionales |

Todas las props de `SliderPrimitive.Root` (Radix) también están disponibles.

## Uso correcto

```tsx
// ✅ Simple (single thumb)
const [value, setValue] = useState([50])

<StandardSlider
  value={value}
  onValueChange={setValue}
  max={100}
  step={1}
/>

// ✅ Rango (multi-thumb)
const [range, setRange] = useState([25, 75])

<StandardSlider
  value={range}
  onValueChange={setRange}
  colorScheme="accent"
  styleType="gradient"
/>

// ✅ Vertical
<StandardSlider
  defaultValue={[65]}
  orientation="vertical"
  colorScheme="tertiary"
/>

// ✅ Diferentes tamaños
<StandardSlider size="xs" defaultValue={[50]} />
<StandardSlider size="xl" defaultValue={[50]} colorScheme="secondary" styleType="gradient" />

// ✅ Con tooltip
<StandardSlider showTooltip defaultValue={[50]} />

// ✅ Deshabilitado
<StandardSlider disabled defaultValue={[50]} />

// ✅ Con colorScheme
<StandardSlider colorScheme="success" defaultValue={[75]} />
<StandardSlider colorScheme="danger" defaultValue={[30]} />

// ✅ Con styleType gradient
<StandardSlider colorScheme="primary" styleType="gradient" defaultValue={[60]} />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardSlider className="bg-red-500" />

// ❌ No pasar value como número suelto
<StandardSlider value={50} />  // ❌ debe ser [50]

// ✅ Siempre usar array
<StandardSlider value={[50]} />
```

## Cuándo NO usar este componente

- Para valores discretos con etiquetas: considera `StandardRadioGroup` o `StandardSelect`.
- Para input numérico preciso: usa `StandardInput type="number"`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardSlider necesita marcas (ticks) visibles`
