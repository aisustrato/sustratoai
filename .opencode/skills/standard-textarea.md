# Skill: StandardTextarea

## Qué es

Textarea multilínea con validación visual en tiempo real. Soporta colorSchemes, tamaños, estados (error, success, editing, disabled, readonly), contador de caracteres y efectos SUSTRATO (pulseBorder, pafffMoment). Misma arquitectura que StandardInput.

## Import

```tsx
import { StandardTextarea } from "@/components/ui/StandardTextarea"
import type { StandardTextareaSize, StandardTextareaVariant } from "@/components/ui/StandardTextarea"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `"default" \| "primary" \| "secondary" \| "tertiary" \| "accent" \| "neutral"` | `"default"` | Esquema de color |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `error` | `string` | — | Mensaje de error |
| `success` | `boolean` | `false` | Estado de éxito |
| `isEditing` | `boolean` | `false` | Estado de edición activa |
| `disabled` | `boolean` | — | Deshabilita |
| `readOnly` | `boolean` | — | Solo lectura |
| `showCharacterCount` | `boolean` | `false` | Muestra contador (requiere `maxLength`) |
| `maxLength` | `number` | — | Límite de caracteres |
| `isRequired` | `boolean` | — | Requerido (aria) |
| `pulseBorder` | `boolean` | `false` | Efecto respiración sutil del borde |
| `pafffMoment` | `boolean` | `false` | Efecto latido de coherencia |
| `rows` | `number` | `3` | Filas visibles |
| `className` | `string` | — | Clases adicionales |
| `value` | `string` | — | Valor controlado |
| `onChange` | `(e) => void` | — | Handler de cambio |
| `placeholder` | `string` | — | Placeholder |

Todas las props nativas de `<textarea>` también disponibles.

## Uso correcto

```tsx
// ✅ Básico
<StandardTextarea
  placeholder="Descripción"
  value={value}
  onChange={handleChange}
/>

// ✅ Con contador de caracteres
<StandardTextarea
  placeholder="Bio"
  value={value}
  onChange={handleChange}
  showCharacterCount
  maxLength={500}
/>

// ✅ Con error
<StandardTextarea
  placeholder="Requerido"
  value={value}
  onChange={handleChange}
  error="Este campo es obligatorio"
/>

// ✅ Con éxito
<StandardTextarea
  placeholder="Completado"
  value="Texto correcto"
  success
/>

// ✅ Diferentes tamaños
<StandardTextarea size="sm" placeholder="Small" />
<StandardTextarea size="md" placeholder="Medium" />
<StandardTextarea size="lg" placeholder="Large" />

// ✅ Con colorScheme
<StandardTextarea colorScheme="primary" placeholder="Primary" />
<StandardTextarea colorScheme="accent" placeholder="Accent" />

// ✅ Con efecto pulseBorder
<StandardTextarea placeholder="Campo activo" pulseBorder />

// ✅ Con efecto pafffMoment
<StandardTextarea placeholder="Insight..." pafffMoment />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardTextarea className="border-red-500 bg-blue-100" />

// ❌ No usar estilos inline que dupliquen props existentes
<StandardTextarea style={{ borderColor: "red" }} />

// ❌ pulseBorder y pafffMoment se desactivan si hay error o success
```

## Cuándo NO usar este componente

- Para inputs de una línea: usa `StandardInput`.
- Para editores de texto enriquecido: no soporta formato.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardTextarea necesita soporte de resize horizontal`
