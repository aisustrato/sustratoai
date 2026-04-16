# StandardTooltip v2.1

> 💬 Tooltip con tokens + soporte texto largo + animaciones orgánicas

## Ubicación

```
components/ui/StandardTooltip.tsx
```

## Propósito

Mostrar información contextual al hover. Soporta dos modos: tooltip compacto (posicionado cerca del trigger) y texto largo (centrado en pantalla para abstracts/descripciones extensas).

---

## Props Principales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `trigger` | `React.ReactElement` | **requerido** | Elemento que activa el tooltip |
| `content` | `React.ReactNode` | - | Contenido del tooltip |
| `children` | `React.ReactNode` | - | Contenido alternativo (retrocompatibilidad) |
| `colorScheme` | `ColorSchemeVariant` | `"neutral"` | Esquema de color |
| `styleType` | `"solid" \| "gradient"` | `"solid"` | Tipo de estilo |
| `isLongText` | `boolean` | `false` | 📖 Modo texto largo (centrado) |
| `isAccentuated` | `boolean` | `true` | Estilo acentuado |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"top"` | Posición |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alineación |
| `sideOffset` | `number` | `8` | Distancia al trigger |
| `delayDuration` | `number` | `300` | Delay antes de mostrar (ms) |
| `hideArrow` | `boolean` | `false` | Ocultar flecha |

---

## Uso Básico

```tsx
import { StandardTooltip } from "@/components/ui/StandardTooltip";

// Tooltip simple
<StandardTooltip 
  trigger={<button>Hover me</button>}
  content="Información adicional"
/>

// Con colorScheme
<StandardTooltip 
  trigger={<StandardButton>Guardar</StandardButton>}
  content="Guarda los cambios actuales"
  colorScheme="primary"
  side="bottom"
/>
```

---

## 📖 Modo Texto Largo (isLongText)

Para abstracts, descripciones extensas, o cualquier texto que no cabe en un tooltip normal.

```tsx
const abstract = `En este estudio exhaustivo, exploramos 
la convergencia de la inteligencia artificial y la 
filosofía posestructuralista...`;

<StandardTooltip 
  trigger={
    <span className="cursor-help underline">
      Ver abstract completo
    </span>
  }
  content={abstract}
  isLongText  // 👈 Activa modo centrado
/>
```

### Comportamiento isLongText:
- 🎯 Se centra en la pantalla (no sigue al trigger)
- 🌫️ Backdrop blur sutil detrás
- 📐 Max width: 800px, max height: 600px
- 📜 Scroll interno si el contenido es muy largo
- ❌ Sin flecha (siempre oculta)
- 🎭 Animación zoom-in desde el centro

---

## Animaciones (v2.1)

### Tooltip Normal
- **Entrada**: fade-in + zoom-in-95 + slide desde dirección (150ms)
- **Salida**: fade-out + zoom-out-95 (100ms)

### isLongText
- **Entrada**: fade-in + zoom-in-90 + backdrop blur (200ms)
- **Salida**: fade-out (automático)

---

## Formato de Texto

El contenido soporta formato básico:

```tsx
// Saltos de línea
<StandardTooltip content="Línea 1\nLínea 2\nLínea 3" />

// Texto en negrita con asteriscos
<StandardTooltip content="Esto es *importante* y esto normal" />
```

---

## Posiciones

```tsx
// Superior (default)
<StandardTooltip side="top" ... />

// Inferior  
<StandardTooltip side="bottom" ... />

// Derecha
<StandardTooltip side="right" ... />

// Izquierda
<StandardTooltip side="left" ... />
```

---

## Integración con StandardCard

El tooltip mantiene el hover de la card mientras está abierto:

```tsx
<StandardCard>
  <StandardTooltip 
    trigger={<span>Más info</span>}
    content="Detalles adicionales"
  />
</StandardCard>
// La card mantiene su estado hover mientras el tooltip está visible
```

---

## Z-Index

| Modo | Z-Index | Sobre... |
|------|---------|----------|
| Normal | 3500 | Popups (2000s), Dialogs (3000s) |
| isLongText | 5000 | Todo |

---

## Arquitectura Interna

### Variables CSS

```css
--st-bg: color de fondo
--st-text-color: color de texto
--st-border-color: color de borde
--st-shadow: sombra
```

### Tokens

```tsx
const tooltipTokens = generateStandardTooltipTokens(
  appColorTokens, 
  mode, 
  isAccentuated
);
```

---

## Showroom

```
/showroom/standard-tooltip
```

Incluye demos de posiciones y modo isLongText con abstract de ejemplo.

---

📍 `docs/standard-UI/StandardTooltip.md`  
🎯 v2.1 - Animaciones orgánicas + backdrop blur  
💬 Información contextual fluida
