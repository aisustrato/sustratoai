# StandardCard v4.3

> 🏗️ Card polimórfica con tokens precalculados y efectos SUSTRATO

## Ubicación

```
components/ui/StandardCard.tsx
```

## Propósito

Componente contenedor flexible que consume tokens del `DesignTokensProvider`. Soporta composición (Header, Content, Footer), estados visuales, y efectos SUSTRATO.

---

## Props Principales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `CardVariant` | `"primary"` | Esquema de color |
| `styleType` | `"filled" \| "subtle" \| "transparent"` | `"subtle"` | Tipo de fondo |
| `shadow` | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Sombra |
| `hasOutline` | `boolean` | `false` | Mostrar borde |
| `accentPlacement` | `"none" \| "top" \| "left" \| "right" \| "bottom"` | `"none"` | Barra de acento |
| `selected` | `boolean` | `false` | Estado seleccionado |
| `loading` | `boolean` | `false` | Estado de carga |
| `inactive` | `boolean` | `false` | Estado inactivo |
| `approved` | `boolean` | `false` | Cambia a colorScheme de aprobación |
| `approvalAnimation` | `"spin" \| "flipY" \| "flipX"` | `"spin"` | Animación de aprobación |
| `pulseBorder` | `boolean` | `false` | 🌊 Efecto respiración |
| `pafffMoment` | `boolean` | `false` | 🪩 Efecto coherencia |
| `shimmer` | `boolean` | `false` | ✨ Efecto brillo |

---

## Composición

```tsx
<StandardCard>
  <StandardCard.Header>
    <StandardCard.Title>Título</StandardCard.Title>
    <StandardCard.Subtitle>Subtítulo</StandardCard.Subtitle>
  </StandardCard.Header>
  
  <StandardCard.Media>
    <Image ... />
  </StandardCard.Media>
  
  <StandardCard.Content>
    Contenido principal
  </StandardCard.Content>
  
  <StandardCard.Actions>
    <StandardButton>Acción</StandardButton>
  </StandardCard.Actions>
  
  <StandardCard.Footer>
    Pie de tarjeta
  </StandardCard.Footer>
</StandardCard>
```

---

## Efectos SUSTRATO

### 🌊 pulseBorder
Respiración sutil del borde. Se desactiva con `selected`, `loading`, `inactive`.

```tsx
<StandardCard pulseBorder hasOutline colorScheme="primary">
  // Card con borde que respira
</StandardCard>
```

### 🪩 pafffMoment
Efecto de coherencia/insight con glow. Mutuamente excluyente con `pulseBorder`.

```tsx
<StandardCard pafffMoment hasOutline colorScheme="success">
  // Card con efecto pafff
</StandardCard>
```

### ✨ shimmer
Brillo sutil que recorre la card.

```tsx
<StandardCard shimmer styleType="filled" colorScheme="accent">
  // Card con shimmer
</StandardCard>
```

---

## StyleTypes

### filled
Fondo con gradiente del colorScheme. Para cards principales.

### subtle
Fondo mixto con blanco/neutro. Para cards secundarias.

### transparent
Sin fondo. Para cards sobre fondos coloridos.

---

## Estados

```tsx
// Seleccionada
<StandardCard selected hasOutline>

// Cargando
<StandardCard loading loadingText="Procesando...">

// Inactiva
<StandardCard inactive>
```

---

## 🔄 Giro con Aprobación (Preclasificación)

Usado en flujos de validación (ej. preclasificación de artículos):

```tsx
const [approved, setApproved] = useState(false);
const [animKey, setAnimKey] = useState(0);

<StandardCard
  colorScheme="primary"
  approved={approved}
  approvedColorScheme="success"  // Color al aprobar
  approvalAnimation="spin"        // spin | flipY | flipX
  animateOnChangeKey={animKey}    // Fuerza nueva animación
>

// Al aprobar:
setApproved(true);
setAnimKey(k => k + 1);
```

**Comportamiento:**
- La tarjeta gira 360° y cambia de `primary` → `success`
- El contenido se contra-rota para mantenerse legible
- Solo se activa cuando `approved` cambia y `animateOnChangeKey` cambia

**Showroom:** Tab "🌊 Efectos" → sección "Giro con Aprobación"

---

## Acentos

```tsx
// Acento superior
<StandardCard accentPlacement="top" accentColorScheme="accent">

// Acento lateral
<StandardCard accentPlacement="left" accentColorScheme="primary">
```

---

## Clickeable

```tsx
<StandardCard 
  onCardClick={() => console.log('clicked')}
  showSelectionCheckbox
  onSelectionChange={(selected) => console.log(selected)}
>
```

---

## Arquitectura Interna

### Tokens desde DesignTokensProvider

```tsx
const { tokens } = useDesignTokens();
const styleTokens = tokens.card.styles[colorScheme][styleType];
```

### CSS Dinámico (Patrón Flex)

El componente inyecta un `<style>` tag con ID único para:
- Colores de fondo y texto
- Estados hover/selected
- Keyframes de animaciones SUSTRATO

---

## CardVariants Disponibles

- `default` (mapea a primary)
- `primary`
- `secondary`
- `tertiary`
- `accent`
- `neutral`
- `success`
- `warning`
- `danger`

---

## Showroom

```
/showroom/standard-card
```

Tab "🌊 Efectos" muestra todos los efectos SUSTRATO en acción.

---

📍 `docs/standard-UI/StandardCard.md`  
🎯 v4.3 - Patrón Flex + Efectos SUSTRATO  
🌊🏄🏽 SUSTRATO.AI
