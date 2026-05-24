# Skill: StandardBadge

## Qué es

Componente versátil para etiquetas, estados y categorías. Soporta variantes de estilo (solid, subtle, outline), íconos (izquierda/derecha), efectos SUSTRATO (pulseBorder, pafffMoment) y modo multilínea.

## Import

```tsx
import { StandardBadge } from "@/components/ui/StandardBadge"
import type { StandardBadgeProps, StandardBadgeStyleType, StandardBadgeSize } from "@/components/ui/StandardBadge"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `ColorSchemeVariant` (`"primary" \| "secondary" \| "tertiary" \| "accent" \| "success" \| "warning" \| "danger" \| "neutral"`) | `"primary"` | Esquema de color |
| `styleType` | `"solid" \| "subtle" \| "outline"` | `"subtle"` | Variante de estilo |
| `size` | `"2xs" \| "xs" \| "sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `leftIcon` | `React.ComponentType<{ className?: string }>` | — | Icono a la izquierda del texto |
| `rightIcon` | `React.ComponentType<{ className?: string }>` | — | Icono a la derecha del texto |
| `iconClassName` | `string` | — | Clases adicionales para los íconos |
| `pulseBorder` | `boolean` | `false` | Efecto respiración sutil del borde (2.5s ciclo) |
| `pafffMoment` | `boolean` | `false` | Efecto latido de coherencia (1.5s ciclo) |
| `multiline` | `boolean` | `false` | Permite texto multilínea con altura mínima |
| `className` | `string` | — | Clases adicionales |
| `children` | `ReactNode` (requerido) | — | Contenido del badge |

## Uso correcto

```tsx
// ✅ Básico
<StandardBadge colorScheme="primary">Nuevo</StandardBadge>

// ✅ Con estilo sólido
<StandardBadge colorScheme="success" styleType="solid">Completado</StandardBadge>

// ✅ Con outline
<StandardBadge colorScheme="warning" styleType="outline">Pendiente</StandardBadge>

// ✅ Con ícono izquierdo
<StandardBadge colorScheme="success" styleType="solid" leftIcon={CheckCircle2}>
  Completado
</StandardBadge>

// ✅ Con ícono derecho
<StandardBadge colorScheme="danger" styleType="subtle" leftIcon={XCircle}>
  Error
</StandardBadge>

// ✅ Con ambos íconos
<StandardBadge colorScheme="neutral" styleType="solid" leftIcon={Info} rightIcon={Tag}>
  Informativo
</StandardBadge>

// ✅ Diferentes tamaños
<StandardBadge colorScheme="tertiary" size="2xs">Mini</StandardBadge>
<StandardBadge colorScheme="tertiary" size="sm">Small</StandardBadge>
<StandardBadge colorScheme="tertiary" size="lg">Large</StandardBadge>

// ✅ Efecto pulseBorder (respiración)
<StandardBadge colorScheme="primary" styleType="outline" pulseBorder>
  En Progreso
</StandardBadge>

// ✅ Efecto pafffMoment (latido de coherencia)
<StandardBadge colorScheme="warning" styleType="solid" pafffMoment leftIcon={AlertTriangle}>
  ¡Atención!
</StandardBadge>

// ✅ Modo multilínea
<StandardBadge colorScheme="neutral" multiline>
  Texto muy largo que puede ocupar múltiples líneas sin deformarse
</StandardBadge>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardBadge className="bg-red-500 text-white">Error</StandardBadge>

// ❌ No usar estilos inline que dupliquen props existentes
<StandardBadge style={{ backgroundColor: "red" }}>Error</StandardBadge>

// ❌ pulseBorder y pafffMoment son mutuamente excluyentes visualmente
<StandardBadge pulseBorder pafffMoment>No hacer</StandardBadge>
```

## Cuándo NO usar este componente

- Para botones accionables: usa `StandardButton`.
- Para texto estilizado simple sin fondo: usa `StandardText` con `colorScheme` y `colorShade`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardBadge necesita size "xl"`
