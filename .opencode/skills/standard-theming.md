# Standard Theming System

## Core Principle
sustrato.ai does NOT use global CSS variables for colors. Colors flow through:
`AppColorTokens → DesignTokensProvider (precomputed via useMemo) → useDesignTokens() → inline styles`

## The Provider Chain
```
ThemeProvider (app/theme-provider.tsx) — provides colorScheme, mode, appColorTokens
  └─ DesignTokensProvider (app/providers/DesignTokensProvider.tsx) — precomputes ALL component tokens
       └─ Standard Components access via useDesignTokens()
```

## Available ColorSchemeVariants
```
"primary"    | Theme palette (varies per colorScheme like zenith, green, blue)
"secondary"  | Theme palette
"tertiary"   | Theme palette ✅ EXISTS
"accent"     | Semantic, fixed purple (#8A4EF6)
"neutral"    | Semantic, fixed gray
"white"      | Semantic
"success"    | Semantic, fixed green
"warning"    | Semantic, fixed amber
"danger"     | Semantic, fixed red
```

## How Standard Components Use Colors
All Standard components accept a `colorScheme` prop of type `ColorSchemeVariant`. They look up precomputed tokens from `useDesignTokens()` and apply colors as **inline styles**. Never use Tailwind for colors on Standard components.

Example pattern:
```tsx
const { tokens } = useDesignTokens();
const style = tokens.button.styles[colorScheme][styleType];
// Apply: style={{ background: style.background, color: style.color }}
```

## Color Distribution
- **Theme palettes** (primary, secondary, tertiary): vary per theme (zenith, green, blue, etc.)
- **Semantic palettes** (accent, success, warning, danger, neutral, white): consistent across all themes, only vary by light/dark mode

## Gradients
`StandardText.applyGradient` accepts a `ColorSchemeVariant`. Each variant has a precomputed gradient string in `tokens.text.gradients[colorScheme]`. Applied via inline style with `backgroundImage`, `WebkitBackgroundClip: "text"`, `color: "transparent"`.

## Common Pitfalls
- ❌ NEVER use `--primary`, `--secondary`, `--accent` CSS custom properties for colors
- ❌ NEVER use Tailwind color classes on Standard components (e.g., `bg-primary-500`)
- ❌ NEVER hardcode theme-specific hex colors
- ✅ ALWAYS use the `colorScheme` prop on Standard components
- ✅ For custom (non-Standard) components, either consume `useDesignTokens()` or accept the limitation of not being theme-adaptive

## Adding a New Color Scheme
If you need a new `ColorSchemeVariant`:
1. It must be added to the `ColorSchemeVariant` type
2. Every theme palette must define it
3. Every component token generator must loop over it
4. This is a MAJOR change — consult with the Ingeniero first
