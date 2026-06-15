# Rearquitectura Sustrato — Ecosistema Unificado

> Documento vivo de requerimientos. Última actualización: 2026-05-28.
> Origen: spike en Rust (`rustsustrato/`) validó arquitectura base. Este documento la adapta al ecosistema `sustratoai/`.

---

## 1. Visión General

Unificar el sistema de tematizado en una arquitectura de 3 capas agnósticas al renderizador:

```
┌──────────────────────────────────────────────┐
│  TEMA (fuente de verdad de tokens)           │
│  ColorScheme × Mode → AppColorTokens         │
│  + Typography × FontPair → AppFontTokens     │
│  + Spacing / BorderRadius / Shadows          │
├──────────────────────────────────────────────┤
│  COMPONENTE (agnóstico de renderizado)       │
│  Define: variant, size, state                │
│  resolve(theme) → ResolvedStyle              │
├──────────────────────────────────────────────┤
│  RENDERIZADOR (React / egui / lo que sea)   │
│  ResolvedStyle → inline styles / CSS / paint │
└──────────────────────────────────────────────┘
```

**Principio fundamental:** los componentes NO conocen colores hex ni fuentes concretas. Solo conocen variantes semánticas (`"primary"`, `"solid"`, `"md"`). El tema resuelve todo.

Esto ya está implementado y funcionando en Rust (`rustsustrato/`):

| Crate | Rol | Equivalente en `sustratoai/` |
|-------|-----|------------------------------|
| `sustrato-theme` | Theme trait, tokens, dark/light | `lib/theme/ColorToken.ts` + `colors.ts` |
| `sustrato-core` | Component trait, ResolvedStyle | Nuevo: `lib/theme/resolved-style.ts` |
| `sustrato-components` | StandardButton, etc. | `components/ui/StandardButton.tsx` |
| `sustrato-render-egui` | Puente Theme → egui | `DesignTokensProvider` (ya existe) |

---

## 2. Consolidación de Temas: 11 → 8

### 2.1 Nuevo catálogo de 8 ColorSchemes

Cada uno con `light` + `dark` = **16 modos visuales totales**.

| # | ColorScheme | Personalidad | Se absorbe de… |
|---|-------------|-------------|-----------------|
| 1 | **blue** | Tech, corporativo, confianza | — |
| 2 | **green** | Naturaleza, bienestar, salud | absorbe `artisticGreen` (esmeralda) |
| 3 | **orange** | Energía, creatividad, calidez | absorbe `coral` (salmón/playful) |
| 4 | **graphite** | Neutral, profesional, minimal | — |
| 5 | **midnight** | Formal, serio, nocturno | absorbe `burgundy` + `roseGold` en saturaciones |
| 6 | **zenith** | Armonía, balance, calma | — |
| 7 | **ocean** | Futuro, innovación, tech premium | — |
| 8 | **crimson** | Elegancia, distinción, poder | fusión `burgundy` + `roseGold` |

### 2.2 Migración semántica (cada viejo → nuevo)

| Antes (11) | Después (8) | Nota |
|-------------|-------------|------|
| `blue` | `blue` | Sin cambios |
| `green` | `green` | Conserva su primary, la tertiary absorbe artisticGreen |
| `artisticGreen` | — | Se fusiona en `green` como tertiary opcional |
| `orange` | `orange` | Conserva primary, tertiary absorbe coral |
| `coral` | — | El salmón pasa a ser tertiary de `orange` |
| `graphite` | `graphite` | Sin cambios |
| `midnight` | `midnight` | Sin cambios |
| `burgundy` | `crimson` | Se fusiona con roseGold |
| `roseGold` | `crimson` | El oro rosado se vuelve secondary del crimson |
| `zenith` | `zenith` | Sin cambios |
| `ocean` | `ocean` | Sin cambios |

### 2.3 Estructura de cada ColorScheme

Cada tema mantiene la estructura `primary / secondary / tertiary` con `ColorShade`:
```typescript
type ColorShade = {
  pure: string;        // color base
  pureShade: string;   // más oscuro/intenso
  text: string;        // texto sobre bg claro
  contrastText: string;// texto sobre pure
  textShade: string;   // variante más oscura de text
  bg: string;          // fondo
  bgShade: string;     // variante más oscura de bg
};
```

**Los colores semánticos** (`accent`, `success`, `warning`, `danger`, `neutral`, `white`) **se mantienen sin cambios** — varían solo por `light`/`dark`, no por ColorScheme.

---

## 3. Sistema de Fuentes: 5 Pares

### 3.1 Estructura FontPair

```typescript
type FontPair = {
  id: string;
  display: string;      // fuente para headings y UI
  body: string;         // fuente para texto corrido
  mono: string;         // fuente para código y datos
  category: "sans" | "serif" | "mixed";
};
```

### 3.2 Catálogo de 5 pares

| # | Nombre | Display | Body | Mono | Categoría |
|---|--------|---------|------|------|-----------|
| 1 | **Inter** (default) | Inter | Inter | JetBrains Mono | sans |
| 2 | **Geometric** | DM Sans | DM Sans | DM Mono | sans |
| 3 | **Editorial** | Georgia | Merriweather | Fira Code | serif |
| 4 | **Bold** | Space Grotesk | Space Grotesk | Source Code Pro | sans |
| 5 | **Enterprise** | IBM Plex Sans | IBM Plex Sans | IBM Plex Mono | sans |

### 3.3 Cómo se integran con el Theme

```typescript
interface AppThemeTokens {
  colorTokens: AppColorTokens;
  fontTokens: AppFontTokens;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
}

interface AppFontTokens {
  fontPairId: string;
  displayFont: string;    // "Inter", "DM Sans", etc.
  bodyFont: string;
  monoFont: string;
  scale: {
    xs:  number;  // 12px
    sm:  number;  // 14px
    md:  number;  // 16px
    lg:  number;  // 18px
    xl:  number;  // 24px
    xxl: number;  // 32px
  };
  weight: {
    light:   number;  // 300
    regular: number;  // 400
    medium:  number;  // 500
    semibold:number;  // 600
    bold:    number;  // 700
  };
  lineHeight: {
    tight:   number;  // 1.2
    normal:  number;  // 1.5
    relaxed: number;  // 1.75
  };
}
```

### 3.4 Implementación en Next.js

Ya existe `app/font-provider.tsx` y `app/font-config.tsx`. Extender:

```tsx
// font-config.ts
export const FONT_PAIRS: Record<string, FontPairConfig> = {
  inter: {
    display: { family: "Inter", weights: [400, 500, 600, 700] },
    body:    { family: "Inter", weights: [300, 400, 500] },
    mono:    { family: "JetBrains Mono", weights: [400, 500] },
  },
  geometric: {
    display: { family: "DM Sans", weights: [400, 500, 700] },
    body:    { family: "DM Sans", weights: [400, 500] },
    mono:    { family: "DM Mono", weights: [400, 500] },
  },
  // ... etc
};
```

---

## 4. Componentes: del Rust al TypeScript

### 4.1 El trait Component (Rust) → interface ComponentProps (TS)

**Rust** (validado):
```rust
pub trait Component {
    fn id(&self) -> &str;
    fn component_type(&self) -> &str;
    fn state(&self) -> ComponentState;
    fn resolve(&self, theme: &dyn Theme) -> ResolvedStyle;
    fn describe(&self) -> String;
}
```

**TypeScript** (a implementar):
```typescript
interface ComponentConfig<V extends string, S extends string> {
  id: string;
  componentType: string;
  variant: V;
  size: S;
  state: ComponentState;
  disabled: boolean;
}

interface ResolvedStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontSize: string;
  fontWeight: number;
  paddingH: string;
  paddingV: string;
  borderRadius: string;
  boxShadow: string | null;
}
```

### 4.2 StandardButton: estado actual vs propuesto

**Hoy** (`components/ui/StandardButton.tsx`):
- Props: `colorScheme`, `styleType`, `size`, `rounded`, `modifiers`, `loading`, `disabled`
- Los tokens vienen precalculados de `useDesignTokens()`
- Aplica **inline styles** directamente

**Propuesto (fase 2):**
- El componente llama internamente a `resolve(colorScheme, styleType, size, state)`
- `resolve()` devuelve `ResolvedStyle` ya calculado
- El renderizado aplica `ResolvedStyle` → inline styles
- **El componente no sabe de paletas hex**, solo de variantes semánticas

```tsx
// Fase 2 — StandardButton usa resolve()
function StandardButton(props: StandardButtonProps) {
  const theme = useTheme();
  const style = resolveButtonStyle(theme, {
    variant: props.colorScheme,
    styleType: props.styleType,
    size: props.size,
    state: props.disabled ? "disabled" : "default",
  });
  
  return (
    <button style={{
      background: style.backgroundColor,
      color: style.textColor,
      padding: `${style.paddingV} ${style.paddingH}`,
      borderRadius: style.borderRadius,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      boxShadow: style.boxShadow ?? undefined,
    }}>
      {props.children}
    </button>
  );
}
```

### 4.3 Plan de migración de componentes

| Fase | Qué | Cuándo |
|------|-----|--------|
| Fase 0 | Este documento existe | Ya |
| Fase 1 | `ColorToken.ts` acepta 8 ColorSchemes (no 11) | Próximo sprint |
| Fase 2 | Crear `lib/theme/resolved-style.ts` + `resolveButtonStyle()` | Próximo sprint |
| Fase 3 | Migrar `StandardButton` a usar `resolve()` | Siguiente |
| Fase 4 | `StandardText`, `StandardContainer`, resto de Standard* | Progresivo |
| Fase 5 | FontProvider acepta 5 pares + `AppFontTokens` | Paralelo |
| Fase 6 | Showroom unificado que cambia tema + fuente en caliente | Final |

---

## 5. Showroom Unificado

### 5.1 Visión

Un showroom donde cada componente expone **todas** sus variantes interactivamente:

```
┌──────────────────────────────────────────────────┐
│  SUSTRATO SHOWROOM                              │
│  Tema: [blue ▾]  Modo: [◐ claro]  Fuente: [Inter ▾] │
├────────────────┬─────────────────────────────────┤
│ StandardButton │  Preview en vivo:                │
│                │  ┌──────────────────────┐        │
│  Variant:      │  │   Primary / Solid    │        │
│  [primary ▾]   │  │   ┌──────────────┐   │        │
│  StyleType:    │  │   │  Click me     │   │        │
│  [solid ▾]     │  │   └──────────────┘   │        │
│  Size: [md ▾]  │  │   ┌──────────────┐   │        │
│  Rounded: [md] │  │   │  │ Outline    │   │        │
│  Disabled: ☐   │  │   │  └──────────────┘   │        │
│  Loading: ☐    │  │   ┌──────────────┐   │        │
│                │  │   │    Ghost      │   │        │
│  Info:         │  │   └──────────────┘   │        │
│  bg: #3D7DF6   │  └──────────────────────┘        │
│  text: #ECF2FE │                                   │
│  radius: 8px   │                                   │
│  padding: 8×16 │                                   │
│  font: 14/500  │                                   │
└────────────────┴───────────────────────────────────┘
```

### 5.2 Showroom actual vs propuesto

| | Actual (`app/showroom/`) | Propuesto |
|---|---|---|
| Páginas | 39 subdirectorios separados | 1 sola SPA con tabs |
| Tema | Fijo por página | Selector en caliente |
| Fuente | No expuesto | Selector en caliente |
| Interactividad | Estática | Sliders, toggles, copiar código |
| Generación de código | No | "Copiar JSX" con las props actuales |

---

## 6. Checklist de Implementación

### Sprint 1: Fundación
- [ ] Reducir `ColorScheme` de 11 a 8 en `ColorToken.ts`
- [ ] Migrar paletas de los 3 eliminados a tertiary de los absorbentes
- [ ] Verificar que los 8 × 2 modos se compilan sin errores
- [ ] Actualizar `ThemeProvider` y `theme-switcher.tsx` para 8 opciones

### Sprint 2: FontPairs
- [ ] Implementar `FontPair` type y `AppFontTokens` en `lib/theme/`
- [ ] Extender `font-provider.tsx` para consumir `FontPair`
- [ ] Cargar los 5 pares de Google Fonts vía `next/font`
- [ ] Agregar selector de fuente en `ThemeProvider`

### Sprint 3: ResolvedStyle
- [ ] Crear `lib/theme/resolved-style.ts`
- [ ] `resolveColorTokens(theme, variant) → ColorShade`
- [ ] `resolveButtonStyle(theme, config) → ResolvedStyle`
- [ ] `resolveTextStyle(theme, config) → ResolvedStyle`
- [ ] Tests unitarios: mismo botón en 8 temas debe dar 8 colores distintos

### Sprint 4: Migración de componentes
- [ ] `StandardButton` → adopta `resolve()`
- [ ] `StandardText` → adopta `resolve()`
- [ ] `StandardCard` → `StandardContainer` (renombrar, unificar API)
- [ ] Verificar que no se rompe ningún showroom existente

### Sprint 5: Showroom unificado
- [ ] Crear `app/showroom-v2/page.tsx`
- [ ] Panel izquierdo: selectores de componente + variantes
- [ ] Panel derecho: preview en vivo con `ResolvedStyle`
- [ ] Selector de tema + modo + fuente en caliente
- [ ] Botón "Copiar JSX"

---

## 7. Notas de Diseño

### 7.1 Lo que NO cambia
- Las paletas **semánticas** (`accent`, `success`, `warning`, `danger`, `neutral`, `white`) permanecen intactas
- La arquitectura de **proveedores** (`ThemeProvider` → `DesignTokensProvider`)
- El sistema de **inline styles** (no CSS variables globales)
- Los **gradientes** y animaciones existentes

### 7.2 Lo que SÍ cambia
- `ColorScheme` type pasa de 11 a 8 opciones
- Los componentes obtienen una capa intermedia `resolve()` que desacopla props → tokens → estilos
- Aparece el concepto de **FontPair** como parte del tema
- El showroom se unifica

### 7.3 Riesgos
- **Breaking change:** quien tenga `colorScheme="artisticGreen"` en base de datos/configs debe migrar a `"green"`
- **Performance:** `resolve()` se llama por componente. Usar `useMemo` como ya hace `DesignTokensProvider`
- **Complejidad:** no sobre-ingenierizar. Mantener `resolve()` como funciones puras sin efectos

---

## 8. Apéndice: Mapeo Rust ↔ TypeScript

| Concepto | Rust (`rustsustrato/`) | TypeScript (`sustratoai/`) |
|----------|------------------------|---------------------------|
| Color token | `Color { r, g, b, a }` | `string` (hex `#RRGGBB`) |
| Color scheme | `ColorScheme` struct | `ColorShade` type |
| Theme trait | `trait Theme` | `ThemeContext` + providers |
| Dark/light | `DefaultTheme` / `DarkTheme` | `Mode = "light" \| "dark"` |
| Component | `trait Component` | `interface ComponentConfig` |
| Variant | `enum ButtonVariant` | `type ColorSchemeVariant` |
| State | `enum ComponentState` | `"default" \| "hover" \| "active" \| "disabled"` |
| Resolved style | `struct ResolvedStyle` | `interface ResolvedStyle` |
| Spacing | `struct Spacing` | `tailwind.config.ts` spacing scale |
| Border radius | `struct BorderRadius` | `tailwind.config.ts` borderRadius |
| Showroom | `sustrato-showroom-egui` app nativa | `app/showroom-v2/` Next.js page |
