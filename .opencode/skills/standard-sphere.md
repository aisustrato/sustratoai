# Skill: StandardSphere

## Qué es

Esfera visual interactiva — el corazón del sistema SUSTRATO. Renderiza una esfera con contenido interno (ícono, emoji, texto), badge de estado, tooltip, y efectos animados (breathing, shimmer, subtle). Los tamaños se adaptan semánticamente al diámetro.

## Import

```tsx
import { StandardSphere } from "@/components/ui/StandardSphere"
import type { StatusBadgeInfo } from "@/components/ui/StandardSphere"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `diameter` | `number` (requerido) | — | Diámetro en píxeles de la esfera |
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `styleType` | `"solid" \| "subtle" \| "outline"` | `"solid"` | Variante de estilo |
| `icon` | `React.ComponentType` | — | Icono interno (lucide-react) |
| `emoji` | `string` | — | Emoji interno |
| `label` | `string` | — | Texto interno |
| `badge` | `StatusBadgeInfo` | — | Badge de estado superpuesto |
| `tooltip` | `string` | — | Tooltip al hover |
| `animation` | `"breathing" \| "shimmer" \| "subtle"` | — | Efecto de animación |
| `onClick` | `() => void` | — | Hace la esfera clickeable |
| `className` | `string` | — | Clases adicionales |

### StatusBadgeInfo shape

```ts
interface StatusBadgeInfo {
  text: string
  colorScheme?: ColorSchemeVariant
  styleType?: StandardBadgeStyleType
  size?: StandardBadgeSize
  icon?: React.ComponentType
}
```

## Uso correcto

```tsx
// ✅ Básico con ícono
<StandardSphere
  diameter={64}
  colorScheme="primary"
  icon={Star}
  animation="breathing"
/>

// ✅ Con emoji
<StandardSphere diameter={80} colorScheme="accent" emoji="🌸" animation="shimmer" />

// ✅ Con label
<StandardSphere diameter={96} colorScheme="success" label="OK" styleType="subtle" />

// ✅ Con badge
<StandardSphere
  diameter={80}
  colorScheme="warning"
  icon={Zap}
  badge={{ text: "3", colorScheme: "danger" }}
  tooltip="Notificaciones pendientes"
/>

// ✅ Clickeable
<StandardSphere diameter={64} colorScheme="primary" icon={Heart} onClick={handleClick} />
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardSphere className="bg-red-500" />

// ❌ El badge requiere diámetro >= MINIMUM_SPHERE_DIAMETER_FOR_BADGE
// Si no se cumple, simplemente no se renderiza
```

## Cuándo NO usar este componente

- Para grids de esferas: usa `StandardSphereGrid` que acepta `SphereItemData[]`.
- Para iconos simples sin fondo: usa `StandardIcon`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardSphere necesita animation "pulse"`
