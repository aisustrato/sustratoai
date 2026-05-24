# Skill: StandardText

## Qué es

Componente tipográfico fundamental del sistema. Soporta presets, control granular (size, weight, align, colorScheme, colorShade), gradientes de texto, truncado, i18n vía next-intl, y es polimórfico (renderiza cualquier elemento HTML).

## Import

```tsx
import { StandardText } from "@/components/ui/StandardText"
import type {
  StandardTextPreset,
  StandardTextSize,
  StandardTextWeight,
  StandardTextAlign,
  StandardTextColorShade,
} from "@/components/ui/StandardText"
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `preset` | `"heading" \| "subheading" \| "title" \| "subtitle" \| "body" \| "caption"` | — | Preset que define defaults de size, weight, color |
| `size` | `"xs" \| "sm" \| "base" \| "lg" \| "xl" \| "2xl" \| "3xl" \| "4xl" \| "5xl"` | Depende del preset | Tamaño de fuente |
| `weight` | `"normal" \| "medium" \| "semibold" \| "bold"` | Depende del preset | Peso de fuente |
| `align` | `"left" \| "center" \| "right" \| "justify"` | — | Alineación |
| `colorScheme` | `"primary" \| "secondary" \| "tertiary" \| "accent" \| "success" \| "warning" \| "danger" \| "neutral" \| "white"` | Depende del preset | Esquema de color |
| `colorShade` | `"pure" \| "text" \| "textShade" \| "contrastText" \| "subtle"` | `"text"` | Tonalidad dentro del esquema |
| `applyGradient` | `ColorSchemeVariant \| boolean` | — | Aplica gradiente al texto. `true` = primary |
| `truncate` | `boolean` | `false` | Trunca con puntos suspensivos |
| `asElement` | `React.ElementType` | Depende del preset | Elemento HTML a renderizar |
| `i18nKey` | `string` | — | Key de traducción (ej. `"common.save"`) |
| `i18nNamespace` | `string` | — | Namespace explícito para traducciones |
| `i18nValues` | `Record<string, string \| number>` | — | Valores para interpolación |
| `children` | `ReactNode` | — | Contenido (tiene prioridad sobre i18nKey) |
| `className` | `string` | — | Clases adicionales |

### Presets y sus defaults

| Preset | Elemento | Size | Weight | ColorScheme | Gradient |
|---|---|---|---|---|---|
| `heading` | `h1` | `3xl` | `bold` | — | `true` (primary) |
| `subheading` | `h2` | `2xl` | `semibold` | `secondary` | — |
| `title` | `h3` | `xl` | `semibold` | — | — |
| `subtitle` | `h4` | `lg` | `medium` | `neutral` | — |
| `body` | `p` | `base` | `normal` | — | — |
| `caption` | `span` | `sm` | `normal` | `neutral` | — |

## Uso correcto

```tsx
// ✅ Presets
<StandardText preset="heading">Título Principal</StandardText>
<StandardText preset="body">Párrafo de texto normal.</StandardText>
<StandardText preset="caption" colorScheme="neutral" colorShade="subtle">
  Texto pequeño secundario
</StandardText>

// ✅ Control granular
<StandardText size="2xl" weight="bold" colorScheme="primary">
  Título personalizado
</StandardText>

// ✅ Gradiente
<StandardText preset="title" applyGradient>Título con gradiente</StandardText>
<StandardText preset="title" applyGradient="danger">Gradiente danger</StandardText>

// ✅ Truncado
<StandardText truncate>
  Texto muy largo que será truncado con puntos suspensivos...
</StandardText>

// ✅ i18n (next-intl)
<StandardText i18nKey="common.save" />
<StandardText i18nKey="errors.required" colorScheme="danger" />

// ✅ i18n con interpolación
<StandardText i18nKey="common.remaining" i18nValues={{ count: 5 }} />

// ✅ Children gana sobre i18nKey (escape hatch)
<StandardText i18nKey="common.save">Override Manual</StandardText>

// ✅ Polimórfico (renderiza cualquier tag)
<StandardText asElement="label" size="sm" weight="medium">
  Etiqueta de formulario
</StandardText>
<StandardText asElement="h1" size="4xl" weight="bold" colorScheme="primary">
  Hero Title
</StandardText>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores de texto con Tailwind encima
<StandardText className="text-red-500">Error</StandardText>

// ❌ No usar style para colores
<StandardText style={{ color: "blue" }}>Texto</StandardText>

// ❌ No mezclar preset con i18nKey esperando que funcione mágicamente
// Los presets definen estilos, i18nKey define contenido
<StandardText preset="heading" i18nKey="common.save" />
// ✅ Esto sí funciona: estilos del preset + texto traducido
```

## Cuándo NO usar este componente

- Para texto puramente decorativo inline sin semántica: `<span>` nativo.
- Para código/monospace: usa `<code>` nativo con Tailwind.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardText necesita size "6xl"`
