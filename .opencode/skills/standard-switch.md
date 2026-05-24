# Skill: StandardSwitch

## Qué es

Switch/Toggle basado en Radix UI Switch con tokens de diseño precalculados. Soporta múltiples colorSchemes y tamaños, con transiciones suaves entre estados on/off.

## Import

```tsx
import { StandardSwitch } from "@/components/ui/StandardSwitch"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `size` | `SwitchSize` (`"sm" \| "md" \| "lg"`) | `"md"` | Tamaño |
| `checked` | `boolean` | — | Estado controlado |
| `defaultChecked` | `boolean` | — | Estado inicial no controlado |
| `onCheckedChange` | `(checked: boolean) => void` | — | Callback al cambiar |
| `disabled` | `boolean` | — | Deshabilita |
| `required` | `boolean` | — | Requerido (formularios) |
| `className` | `string` | — | Clases adicionales |

Todas las props de `SwitchPrimitive.Root` (Radix) también disponibles.

## Uso correcto

```tsx
// ✅ Básico controlado
const [enabled, setEnabled] = useState(false)

<StandardSwitch checked={enabled} onCheckedChange={setEnabled} />

// ✅ Con colorScheme
<StandardSwitch colorScheme="success" checked={enabled} onCheckedChange={setEnabled} />
<StandardSwitch colorScheme="danger" checked={enabled} onCheckedChange={setEnabled} />

// ✅ Deshabilitado
<StandardSwitch disabled checked={true} />

// ✅ Con label
<StandardLabel htmlFor="notif-switch">Notificaciones</StandardLabel>
<StandardSwitch id="notif-switch" checked={enabled} onCheckedChange={setEnabled} />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardSwitch className="bg-red-500" />

// ❌ No usar estilos inline para colores
<StandardSwitch style={{ backgroundColor: "blue" }} />
```

## Cuándo NO usar este componente

- Para toggle con texto dentro (como "On/Off"): no soporta labels internos.
- Para checkbox binario simple: usa `StandardCheckbox`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardSwitch necesita size "xl"`
