# Skill: StandardButton

## Qué es

Botón estándar del sistema con tokens precalculados, soporte de íconos, loading, tooltip y efectos visuales (ripple, breathing). Usa inline styles para colores y CSS classes para animaciones.

## Import

```tsx
import { StandardButton } from "@/components/ui/StandardButton"
```

Tipos auxiliares (opcional):

```tsx
import type {
  StandardButtonStyleType,
  StandardButtonModifier,
  StandardButtonSize,
  StandardButtonRounded,
} from "@/lib/theme/components/standard-button-tokens"
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `"primary" \| "secondary" \| "tertiary" \| "accent" \| "success" \| "warning" \| "danger" \| "neutral"` | `"primary"` | Esquema de color |
| `styleType` | `"solid" \| "outline" \| "ghost" \| "subtle" \| "link"` | `"solid"` | Variante de estilo |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Tamaño del botón |
| `rounded` | `"none" \| "sm" \| "md" \| "lg" \| "full"` | `"md"` | Radio de borde |
| `modifiers` | `("gradient" \| "elevated")[]` | `[]` | Modificadores visuales |
| `leftIcon` | `React.ComponentType<IconProps>` | — | Icono a la izquierda del texto |
| `rightIcon` | `React.ComponentType<IconProps>` | — | Icono a la derecha del texto |
| `iconOnly` | `boolean` | `false` | Solo icono sin texto. Pasa el icono como children |
| `loading` | `boolean` | `false` | Muestra spinner y deshabilita |
| `loadingText` | `string` | `"Cargando..."` | Texto durante loading (no aplica si `iconOnly`) |
| `fullWidth` | `boolean` | `false` | Ocupa todo el ancho del contenedor |
| `disabled` | `boolean` | — | Deshabilita el botón (HTML nativo) |
| `tooltip` | `string \| ReactNode` | — | Tooltip al hacer hover |
| `breathing` | `boolean` | `false` | Animación sutil de respiración para CTAs |
| `disableRipple` | `boolean` | `false` | Desactiva el efecto ripple al click |
| `asChild` | `boolean` | `false` | Renderiza como hijo (Radix Slot) |
| `className` | `string` | — | Clases CSS adicionales |
| `children` | `ReactNode` | — | Contenido del botón |

## Uso correcto

```tsx
// ✅ Básico
<StandardButton colorScheme="primary" onClick={handleSave}>
  Guardar
</StandardButton>

// ✅ Con íconos
<StandardButton colorScheme="accent" leftIcon={Star} rightIcon={Rocket}>
  Explorar
</StandardButton>

// ✅ Icon-only
<StandardButton colorScheme="primary" iconOnly>
  <Star />
</StandardButton>

// ✅ Loading
<StandardButton colorScheme="success" loading loadingText="Procesando...">
  Aprobar
</StandardButton>

// ✅ Con tooltip
<StandardButton colorScheme="danger" tooltip="Eliminar permanentemente" styleType="ghost">
  Eliminar
</StandardButton>

// ✅ Con modificadores
<StandardButton colorScheme="primary" modifiers={["gradient", "elevated"]}>
  Destacado
</StandardButton>

// ✅ Breathing para CTAs importantes
<StandardButton colorScheme="accent" breathing>
  Comenzar ahora
</StandardButton>

// ✅ Disabled
<StandardButton colorScheme="neutral" disabled>
  No disponible
</StandardButton>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar Tailwind encima del componente
<StandardButton className="bg-blue-500 px-4">Guardar</StandardButton>

// ❌ No usar estilos inline que dupliquen props existentes
<StandardButton style={{ backgroundColor: "blue" }}>Guardar</StandardButton>

// ❌ No crear variante nueva fuera del componente
<StandardButton className="rounded-full shadow-lg">Guardar</StandardButton>
// → Si necesitas esa variante, pídela al componente, no la pongas inline
```

## Cuándo NO usar este componente

- Para links de navegación: usa `<a>` con estilos de link o `next/link`.
- Para acciones dentro de un formulario: StandardButton ya extiende `<button>`, es correcto usarlo con `type="submit"`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardButton necesita variante "destructive"`
