# Skill: StandardCard

## Qué es

Card polimórfica con tokens precalculados, subcomponentes composables (Header, Title, Content, Actions, Footer, Media), efectos SUSTRATO (pulseBorder, pafffMoment, shimmer) y estados (loading, inactive, selected, approved).

## Import

```tsx
import { StandardCard } from "@/components/ui/StandardCard"
import type { StandardCardColorScheme } from "@/components/ui/StandardCard"
```

## Props disponibles (StandardCard)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `"primary" \| "secondary" \| "tertiary" \| "accent" \| "success" \| "warning" \| "danger" \| "neutral"` | `"primary"` | Esquema de color base |
| `styleType` | `"filled" \| "subtle" \| "transparent"` | `"subtle"` | Variante de estilo |
| `shadow` | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Sombra de la card |
| `hasOutline` | `boolean` | `false` | Borde visible alrededor de la card |
| `outlineColorScheme` | `CardVariant` | — | ColorScheme del borde |
| `accentPlacement` | `"none" \| "top" \| "left" \| "right" \| "bottom"` | `"none"` | Posición de la barra de acento |
| `accentColorScheme` | `CardVariant` | — | ColorScheme del acento |
| `selected` | `boolean` | `false` | Card seleccionada (borde + overlay) |
| `loading` | `boolean` | `false` | Estado de carga con loader animado |
| `loadingText` | `string` | — | Texto durante loading |
| `loadingVariant` | `"spin" \| "pulse" \| "spin-pulse" \| "dash" \| "progress"` | `"spin-pulse"` | Variante del loader |
| `loaderSize` | `number` | `32` | Tamaño del loader en px |
| `inactive` | `boolean` | `false` | Card inactiva (overlay gris) |
| `noPadding` | `boolean` | `false` | Elimina padding interno |
| `disableShadowHover` | `boolean` | `true` | Desactiva elevación al hover |
| `animateEntrance` | `boolean` | `true` | Animación de entrada |
| `showSelectionCheckbox` | `boolean` | `false` | Muestra checkbox de selección |
| `onSelectionChange` | `(selected: boolean) => void` | — | Callback al cambiar selección |
| `onCardClick` | `MouseEventHandler` | — | Hace la card clickeable |
| `disableRipple` | `boolean` | `false` | Desactiva ripple al click |
| `approved` | `boolean` | `false` | Estado de aprobación (cambia colorScheme) |
| `approvedColorScheme` | `CardVariant` | `"success"` | ColorScheme cuando approved=true |
| `animateOnChangeKey` | `string \| number \| boolean` | — | Fuerza re-animación (giro) al cambiar |
| `pulseBorder` | `boolean` | `false` | Efecto respiración sutil del borde |
| `pafffMoment` | `boolean` | `false` | Efecto latido de coherencia |
| `shimmer` | `boolean` | `false` | Brillo sutil que recorre la card |
| `contentCanScroll` | `boolean` | `false` | Permite scroll en Content |
| `className` | `string` | — | Clases adicionales |

## Subcomponentes

| Subcomponente | Props destacables |
|---|---|
| `StandardCard.Header` | `className`, `children` |
| `StandardCard.Title` | `size`, `colorScheme`, `colorShade`, `weight`, `applyGradient`, `truncate` |
| `StandardCard.Subtitle` | `size`, `colorScheme`, `colorShade`, `weight`, `applyGradient`, `truncate` |
| `StandardCard.Media` | `className`, `children` |
| `StandardCard.Content` | `className`, `children` |
| `StandardCard.Actions` | `className`, `children` |
| `StandardCard.Footer` | `className`, `children` |

## Uso correcto

```tsx
// ✅ Básico
<StandardCard colorScheme="primary" styleType="subtle">
  <StandardCard.Header>
    <StandardCard.Title>Título</StandardCard.Title>
    <StandardCard.Subtitle>Subtítulo</StandardCard.Subtitle>
  </StandardCard.Header>
  <StandardCard.Content>
    <StandardText>Contenido de la card.</StandardText>
  </StandardCard.Content>
  <StandardCard.Actions>
    <StandardButton>Acción</StandardButton>
  </StandardCard.Actions>
</StandardCard>

// ✅ Con título directo (prop title)
<StandardCard title="Mi Card" colorScheme="success">
  <StandardCard.Content>Contenido</StandardCard.Content>
</StandardCard>

// ✅ Con acento lateral
<StandardCard colorScheme="secondary" accentPlacement="left" accentColorScheme="accent">
  <StandardCard.Header>
    <StandardCard.Title>Con acento</StandardCard.Title>
  </StandardCard.Header>
</StandardCard>

// ✅ Card clickeable seleccionable
<StandardCard
  colorScheme="primary"
  selected={selected}
  showSelectionCheckbox
  onSelectionChange={setSelected}
  onCardClick={() => handleClick()}
>
  <StandardCard.Content>Clickéame</StandardCard.Content>
</StandardCard>

// ✅ Estado loading
<StandardCard colorScheme="primary" loading loadingText="Cargando datos...">
  <StandardCard.Header><StandardCard.Title>Datos</StandardCard.Title></StandardCard.Header>
</StandardCard>

// ✅ Con efectos SUSTRATO
<StandardCard colorScheme="accent" styleType="subtle" hasOutline pulseBorder>
  <StandardCard.Content>Con pulse border</StandardCard.Content>
</StandardCard>

// ✅ Con shimmer (interactividad)
<StandardCard colorScheme="primary" styleType="filled" shimmer>
  <StandardCard.Content>Brillo sutil</StandardCard.Content>
</StandardCard>

// ✅ Card con imagen (noPadding)
<StandardCard colorScheme="neutral" styleType="subtle" noPadding>
  <StandardCard.Media>
    <Image src="..." alt="..." fill className="object-cover" />
  </StandardCard.Media>
  <div className="p-4">
    <StandardCard.Title>Título</StandardCard.Title>
  </div>
</StandardCard>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardCard className="bg-red-500">Error</StandardCard>

// ❌ No usar estilos inline para colores
<StandardCard style={{ backgroundColor: "blue" }}>Card</StandardCard>

// ❌ Los efectos se desactivan automáticamente con selected/loading/inactive
// No intentes forzarlos con clases adicionales
```

## Cuándo NO usar este componente

- Para layouts de página: usa `StandardPageBackground` o HTML nativo.
- Para listados simples sin jerarquía visual: un `<div>` con Tailwind puede bastar.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardCard necesita variante "outlined"`
