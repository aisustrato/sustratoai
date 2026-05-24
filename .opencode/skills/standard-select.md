# Skill: StandardSelect

## Qué es

Select personalizado con dropdown en portal, soporte para selección simple y múltiple, opciones con iconos y descripciones, clearable, estados de error/success/editing, y accesibilidad completa (aria, teclado).

## Import

```tsx
import { StandardSelect } from "@/components/ui/StandardSelect"
import type { SelectOption, StandardSelectSize, StandardSelectVariant } from "@/components/ui/StandardSelect"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | `[]` | Array de opciones `{ value, label, disabled?, description?, icon? }` |
| `value` | `string \| string[] \| undefined` | — | Valor(es) seleccionado(s) (controlado) |
| `defaultValue` | `string \| string[] \| undefined` | — | Valor inicial no controlado |
| `onChange` | `(value: string \| string[] \| undefined) => void` | — | Callback al cambiar selección |
| `onBlur` | `() => void` | — | Callback al perder foco |
| `colorScheme` | `"default" \| "primary" \| "secondary" \| "tertiary" \| "accent" \| "neutral"` | `"default"` | Esquema de color |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `placeholder` | `string` | `"Seleccione una opción"` | Texto cuando no hay selección |
| `multiple` | `boolean` | `false` | Selección múltiple (chips) |
| `clearable` | `boolean` | `false` | Botón para limpiar selección |
| `leadingIcon` | `React.ComponentType<IconProps>` | — | Icono al inicio |
| `error` | `string` | — | Mensaje de error |
| `success` | `boolean` | `false` | Estado de éxito |
| `isEditing` | `boolean` | `false` | Estado de edición |
| `disabled` | `boolean` | — | Deshabilita el select |
| `readOnly` | `boolean` | — | Solo lectura |
| `isRequired` | `boolean` | — | Requerido (aria) |
| `fullWidth` | `boolean` | `true` | Ocupa todo el ancho |
| `autoFocus` | `boolean` | `false` | Auto-focus al montar |
| `id` | `string` | — | ID HTML |
| `name` | `string` | — | Name para formularios |
| `pulseBorder` | `boolean` | `false` | Efecto respiración (no implementado aún) |
| `pafffMoment` | `boolean` | `false` | Efecto latido (no implementado aún) |
| `disableRipple` | `boolean` | `false` | Desactiva ripple al click |
| `className` | `string` | — | Clases adicionales |

### SelectOption shape

```ts
interface SelectOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
  icon?: React.ComponentType<IconProps>
}
```

## Uso correcto

```tsx
// ✅ Selección simple
const options = [
  { value: "op1", label: "Opción 1" },
  { value: "op2", label: "Opción 2" },
]

<StandardSelect
  options={options}
  value={selected}
  onChange={setSelected}
  placeholder="Selecciona..."
  clearable
/>

// ✅ Selección múltiple
<StandardSelect
  options={options}
  value={selectedMultiple}
  onChange={setSelectedMultiple}
  multiple
  clearable
  placeholder="Selecciona varias..."
/>

// ✅ Con icono en opciones
const iconOptions = [
  { value: "edit", label: "Editar", icon: Edit3 },
  { value: "delete", label: "Eliminar", icon: Trash2 },
]

<StandardSelect
  options={iconOptions}
  value={action}
  onChange={setAction}
/>

// ✅ Con descripciones
const descOptions = [
  { value: "a", label: "Opción A", description: "Descripción detallada" },
]

// ✅ Con error
<StandardSelect
  options={options}
  value={selected}
  onChange={setSelected}
  error="Campo requerido"
/>

// ✅ Con colorScheme
<StandardSelect
  options={options}
  value={selected}
  onChange={setSelected}
  colorScheme="primary"
  size="lg"
/>

// ✅ Deshabilitado
<StandardSelect options={options} value={selected} onChange={setSelected} disabled />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardSelect className="bg-red-500" />

// ❌ No mezclar value y defaultValue
// Usa uno u otro (controlado vs no controlado)

// ❌ No pasar options con value objects que cambian referencia cada render
// Usa useMemo para estabilizar el array de options
const options = useMemo(() => [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
], [])
```

## Cuándo NO usar este componente

- Para opciones nativas simples con pocas opciones: `<select>` HTML nativo puede bastar.
- Para búsqueda con autocomplete: StandardSelect no soporta filtrado por texto.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardSelect necesita soporte de búsqueda/filtrado`
