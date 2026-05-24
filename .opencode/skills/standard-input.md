# Skill: StandardInput

## Qué es

Input estándar con validación visual en tiempo real, soporte de íconos (leading/trailing), toggle de password, clear button, contador de caracteres, y efectos SUSTRATO (pulseBorder, pafffMoment).

## Import

```tsx
import { StandardInput } from "@/components/ui/StandardInput"
import type { StandardInputSize, StandardInputVariant } from "@/components/ui/StandardInput"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `"default" \| "primary" \| "secondary" \| "tertiary" \| "accent" \| "neutral"` | `"default"` | Esquema de color del input |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `type` | `HTML input type` | `"text"` | Tipo de input (text, password, email, number) |
| `leadingIcon` | `React.ComponentType<IconProps>` | — | Icono al inicio del input |
| `trailingIcon` | `React.ComponentType<IconProps>` | — | Icono al final (no visible si hay error/success/password) |
| `error` | `string` | — | Mensaje de error. Activa estado visual de error |
| `success` | `boolean` | `false` | Estado de éxito (check verde) |
| `isEditing` | `boolean` | `false` | Estado de edición activa |
| `disabled` | `boolean` | — | Deshabilita el input |
| `readOnly` | `boolean` | — | Solo lectura |
| `showCharacterCount` | `boolean` | `false` | Muestra contador (requiere `maxLength`) |
| `maxLength` | `number` | — | Límite de caracteres |
| `onClear` | `() => void` | — | Muestra botón X para limpiar el valor |
| `isRequired` | `boolean` | — | Marca como requerido (aria) |
| `pulseBorder` | `boolean` | `false` | Efecto respiración sutil del borde |
| `pafffMoment` | `boolean` | `false` | Efecto latido de coherencia |
| `className` | `string` | — | Clases adicionales |
| `value` | `string` | — | Valor controlado |
| `onChange` | `(e) => void` | — | Handler de cambio |
| `placeholder` | `string` | — | Placeholder |

Todas las props nativas de `<input>` también están disponibles (extiende `InputHTMLAttributes`).

## Uso correcto

```tsx
// ✅ Básico
<StandardInput placeholder="Nombre" value={value} onChange={handleChange} />

// ✅ Con leadingIcon
<StandardInput placeholder="Email" leadingIcon={Mail} type="email" />

// ✅ Password con toggle automático
<StandardInput placeholder="Contraseña" type="password" />

// ✅ Con error
<StandardInput placeholder="Campo" error="Este campo es requerido" />

// ✅ Con éxito
<StandardInput placeholder="Campo" success value="Correcto" />

// ✅ Con clear button
<StandardInput placeholder="Buscar" value={value} onChange={setValue} onClear={() => setValue("")} leadingIcon={Search} />

// ✅ Con contador de caracteres
<StandardInput placeholder="Bio" showCharacterCount maxLength={100} />

// ✅ Con efecto pulseBorder
<StandardInput placeholder="Campo activo" pulseBorder />

// ✅ Con efecto pafffMoment (insight/coherencia)
<StandardInput placeholder="Descubrimiento..." pafffMoment />

// ✅ Diferentes tamaños
<StandardInput size="sm" placeholder="Small" />
<StandardInput size="md" placeholder="Medium" />
<StandardInput size="lg" placeholder="Large" />

// ✅ Diferentes esquemas
<StandardInput colorScheme="primary" placeholder="Primary" />
<StandardInput colorScheme="accent" placeholder="Accent" />
<StandardInput colorScheme="neutral" placeholder="Neutral" />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardInput className="border-red-500 bg-blue-100" />

// ❌ No usar estilos inline que dupliquen props existentes
<StandardInput style={{ borderColor: "red" }} />

// ❌ pulseBorder y pafffMoment son mutuamente excluyentes en la práctica
// Se desactivan si hay error o success
```

## Cuándo NO usar este componente

- Para texto multilínea: usa `StandardTextarea`.
- Para selección de opciones: usa `StandardSelect`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardInput necesita colorScheme "warning"`
