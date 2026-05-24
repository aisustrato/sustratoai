# Skill: StandardTooltip

## Qué es

Tooltip basado en Radix UI Tooltip con tokens de diseño precalculados. Soporta diferentes colorSchemes, styleTypes, posicionamiento (side/align), modo texto largo (isLongText), y formato Markdown básico (negritas con `*texto*`, saltos de línea).

## Import

```tsx
import { StandardTooltip } from "@/components/ui/StandardTooltip"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `trigger` | `ReactElement` (requerido) | — | Elemento que activa el tooltip |
| `content` | `ReactNode` | — | Contenido del tooltip |
| `children` | `ReactNode` | — | Alternativa a `content` (retrocompatibilidad) |
| `colorScheme` | `ColorSchemeVariant` | `"neutral"` | Esquema de color |
| `styleType` | `TooltipStyleType` (`"solid" \| "subtle"`) | `"solid"` | Variante de estilo |
| `isLongText` | `boolean` | `false` | Modo texto largo (max-w-md, fuente más pequeña) |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | — | Lado donde aparece |
| `align` | `"start" \| "center" \| "end"` | — | Alineación respecto al trigger |
| `sideOffset` | `number` | — | Distancia desde el trigger |
| `delayDuration` | `number` | — | Delay antes de mostrar (ms) |
| `hideArrow` | `boolean` | — | Oculta la flecha |

## Uso correcto

```tsx
// ✅ Básico con texto simple
<StandardTooltip
  trigger={<StandardButton>Guardar</StandardButton>}
  content="Guarda los cambios realizados"
/>

// ✅ Con colorScheme y posición
<StandardTooltip
  trigger={<StandardButton leftIcon={Info}>Info</StandardButton>}
  content="Información adicional importante"
  colorScheme="primary"
  side="right"
/>

// ✅ Modo texto largo (para abstracts, descripciones)
<StandardTooltip
  trigger={<StandardText truncate>{longAbstract}</StandardText>}
  content={fullAbstract}
  isLongText
  styleType="subtle"
  side="bottom"
/>

// ✅ Con formato Markdown básico
<StandardTooltip
  trigger={<span>Ayuda</span>}
  content={"*Requerido:* Este campo no puede estar vacío.\n*Formato:* Texto libre de hasta 500 caracteres."}
/>

// ✅ En StandardButton (el botón ya acepta prop `tooltip`)
<StandardButton tooltip="Eliminar permanentemente" colorScheme="danger" styleType="ghost">
  Eliminar
</StandardButton>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ Pasar trigger como string
<StandardTooltip trigger="Hover me" content="Tooltip" /> // ❌ trigger debe ser ReactElement

// ✅ Siempre pasar un elemento
<StandardTooltip trigger={<span>Hover me</span>} content="Tooltip" />

// ❌ No aplicar colores con Tailwind encima del tooltip
<StandardTooltip className="bg-red-500" ... />
```

## Cuándo NO usar este componente

- Para tooltips en StandardButton: el botón ya lo soporta vía prop `tooltip`.
- Para popovers interactivos con botones: usa `StandardPopover` o Radix Popover.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardTooltip necesita styleType "transparent"`
