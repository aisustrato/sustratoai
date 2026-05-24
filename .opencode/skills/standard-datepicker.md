# Skill: StandardDatePicker

## Qué es

Date picker accesible que combina un input de texto con un popover de calendario (react-day-picker + Radix Popover). Soporta formato de fecha localizado, colorScheme, tamaños y estado de error.

## Import

```tsx
import { StandardDatePicker } from "@/components/ui/StandardDatePicker/StandardDatePicker"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `Date` | — | Fecha seleccionada (controlado) |
| `onValueChange` | `(date: Date \| undefined) => void` | — | Callback al seleccionar fecha |
| `defaultValue` | `Date` | — | Valor inicial no controlado |
| `label` | `string` | — | Etiqueta descriptiva |
| `error` | `string` | — | Mensaje de error (activa estado visual) |
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `disabled` | `boolean` | — | Deshabilita el date picker |
| `placeholder` | `string` | `"Selecciona una fecha"` | Placeholder del input |
| `id` | `string` | — | ID HTML |
| `name` | `string` | — | Name para formularios |
| `className` | `string` | — | Clases adicionales |

## Uso correcto

```tsx
// ✅ Básico controlado
const [date, setDate] = useState<Date | undefined>(new Date())

<StandardDatePicker
  label="Fecha de Nacimiento"
  value={date}
  onValueChange={setDate}
/>

// ✅ Con colorScheme y tamaño
<StandardDatePicker
  label="Fecha"
  colorScheme="accent"
  size="lg"
  value={date}
  onValueChange={setDate}
/>

// ✅ Con error
<StandardDatePicker
  label="Fecha requerida"
  value={date}
  onValueChange={setDate}
  error="Este campo es obligatorio"
/>

// ✅ Deshabilitado
<StandardDatePicker
  label="Fecha"
  value={date}
  onValueChange={setDate}
  disabled
/>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardDatePicker className="bg-blue-500" />

// ❌ No usar estilos inline que dupliquen props existentes
<StandardDatePicker style={{ borderColor: "red" }} />
```

## Cuándo NO usar este componente

- Para rangos de fecha: no soporta selección de rango.
- Para solo hora sin fecha: usa un input de tipo `time` nativo.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardDatePicker necesita soporte de rango de fechas`
