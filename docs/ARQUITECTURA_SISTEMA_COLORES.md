# 🎨 Arquitectura del Sistema de Colores - SUSTRATO.AI

## 📍 Contexto: La "Rareza" del Sistema

El sistema de colores de SUSTRATO.AI tiene una arquitectura única que puede parecer "rara" a primera vista, pero está diseñada con propósitos específicos de performance, mantenibilidad y agnosticismo de componentes.

---

## 🏗️ Estructura de 3 Capas

### **Capa 1: Paletas Base** (`lib/theme/colors.ts`)
**Propósito:** Fuente única de verdad para todos los valores hexadecimales de color.

#### Características:
- **Shades limitados pero potentes:** Cada color tiene solo 7 shades:
  - `pure` - Color principal
  - `pureShade` - Variante más oscura/intensa de pure
  - `text` - Para texto en fondos claros/oscuros (según modo)
  - `contrastText` - Para texto sobre el color `pure`
  - `textShade` - Variante más oscura/intensa de text
  - `bg` - Para fondos
  - `bgShade` - Variante más oscura/intensa de bg

- **Temas disponibles:** 10 esquemas de color (cada uno con versión light y dark)
  - `blue` / `blueDark`
  - `green` / `greenDark`
  - `orange` / `orangeDark`
  - `artisticGreen` / `artisticGreenDark`
  - `graphite` / `graphiteDark`
  - `roseGold` / `roseGoldDark`
  - `midnight` / `midnightDark`
  - `burgundy` / `burgundyDark`
  - `zenith` / `zenithDark` (tema por defecto)

- **Colores semánticos FIJOS:** No cambian entre temas
  - `accent` - Morado corporativo (#8A4EF6)
  - `success` - Verde
  - `warning` - Amarillo
  - `danger` - Rojo
  - `neutral` - Gris
  - `white` - Blanco/Gris muy claro

#### Estructura de Datos:
```typescript
export const themes = {
  zenith: {
    primary: {
      pure: "#51abbb",
      pureShade: "#3a9daf",
      text: "#3A5F66",
      contrastText: "#F0FAFB",
      textShade: "#2A454A",
      bg: "#E6F5F7",
      bgShade: "#D9EFF2",
    },
    secondary: { /* ... */ },
    tertiary: { /* ... */ }
  },
  // ... otros temas
};

export const semantic = {
  accent: { /* shades del morado */ },
  success: { /* shades del verde */ },
  // ... otros semánticos
};
```

---

### **Capa 2: Tokens de Aplicación** (`lib/theme/ColorToken.ts`)
**Propósito:** Agregador que combina paletas de tema + semánticas según el modo (light/dark).

#### Función Principal:
```typescript
export function createAppColorTokens(
  colorScheme: ColorScheme, // ej: "zenith"
  mode: Mode                // "light" | "dark"
): AppColorTokens {
  // Combina:
  // - primary/secondary/tertiary del tema seleccionado
  // - accent/success/warning/danger/neutral/white semánticos
  
  return {
    primary: themePalette.primary,
    secondary: themePalette.secondary,
    tertiary: themePalette.tertiary,
    accent: activeSemanticShades.accent,
    success: activeSemanticShades.success,
    warning: activeSemanticShades.warning,
    danger: activeSemanticShades.danger,
    neutral: activeSemanticShades.neutral,
    white: activeSemanticShades.white,
  };
}
```

#### Características:
- **Se ejecuta 1 vez** al inicio y cada vez que cambia tema/modo
- **Genera AppColorTokens:** Objeto con 9 paletas (3 del tema + 6 semánticas)
- **Cada paleta tiene 7 shades** (pure, pureShade, text, contrastText, textShade, bg, bgShade)

---

### **Capa 3: Tokens de Componentes** (`app/providers/DesignTokensProvider.tsx`)
**Propósito:** Precalcular TODOS los tokens de diseño para TODOS los componentes una sola vez.

#### Sistema v4 (Refactorización en Progreso):
**Estado:** 21/25 componentes migrados (84%)

#### Patrón de Precálculo:
```typescript
// Ejemplo: Tokens de botón
export interface ButtonTokens {
  sizes: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', ButtonSizeTokens>;
  styles: Record<ColorSchemeVariant, Record<'solid' | 'outline' | 'ghost' | 'subtle' | 'link', ButtonStyleTokens>>;
}

// Se precalculan TODAS las combinaciones:
// 5 sizes × 9 colorSchemes × 5 styleTypes = 225 combinaciones
```

#### Componentes Migrados (usan DesignTokensProvider):
- ✅ StandardButton
- ✅ StandardCard
- ✅ StandardInput
- ✅ StandardTextarea
- ✅ StandardSelect
- ✅ StandardBadge
- ✅ StandardDivider
- ✅ StandardSphere
- ✅ StandardIcon
- ✅ StandardText
- ✅ StandardCheckbox
- ✅ StandardRadio
- ✅ StandardSwitch
- ✅ StandardSlider
- ✅ StandardProgress
- ✅ StandardSkeleton
- ✅ StandardAlert
- ✅ StandardDialog
- ✅ StandardDropdown
- ✅ StandardTabs
- ✅ StandardAccordion

#### Componentes Pendientes:
- ⏳ StandardNote (tokens listos, falta refactor del componente)
- ⏳ StandardTooltip
- ⏳ StandardAvatar

---

## 🎯 Filosofía: Componentes Agnósticos

### Principio Central:
**Los componentes (.tsx) NO conocen valores de color concretos.**

#### Ejemplo: StandardButton
```typescript
// ❌ NUNCA hace esto:
const buttonStyle = {
  background: "#51abbb", // ¡NO!
  color: "#FFFFFF"       // ¡NO!
};

// ✅ SIEMPRE hace esto:
const { tokens } = useDesignTokens();
const styleTokens = tokens.button.styles[colorScheme][styleType];

const buttonStyle = {
  background: styleTokens.background,  // Valor precalculado
  color: styleTokens.color             // Valor precalculado
};
```

#### Responsabilidades:
- **Componente (.tsx):** Lógica, comportamiento, estructura
- **Tokens (DesignTokensProvider):** Valores de estilo concretos
- **Props del usuario:** `colorScheme`, `styleType`, `size`, etc.

---

## 🔄 Flujo de Datos

```
Usuario selecciona tema → ThemeProvider actualiza
                              ↓
                    createAppColorTokens(colorScheme, mode)
                              ↓
                    DesignTokensProvider precalcula tokens
                              ↓
                    Componentes consumen tokens precalculados
                              ↓
                    Render con estilos aplicados
```

### Ejemplo Completo:

1. **Usuario selecciona tema "zenith" en modo "light"**
   ```typescript
   // ThemeProvider.tsx
   setColorScheme("zenith");
   setMode("light");
   ```

2. **Se generan AppColorTokens**
   ```typescript
   // ColorToken.ts
   const appTokens = createAppColorTokens("zenith", "light");
   // appTokens.primary = { pure: "#51abbb", text: "#3A5F66", ... }
   ```

3. **DesignTokensProvider precalcula tokens de botón**
   ```typescript
   // DesignTokensProvider.tsx
   const buttonTokens = {
     sizes: { md: { height: "40px", ... } },
     styles: {
       primary: {
         solid: {
           background: appTokens.primary.pure,    // "#51abbb"
           color: appTokens.primary.contrastText, // "#F0FAFB"
           border: "none",
           // ... más tokens
         },
         outline: { /* ... */ },
         // ... más styleTypes
       },
       // ... más colorSchemes
     }
   };
   ```

4. **StandardButton consume tokens**
   ```typescript
   // StandardButton.tsx
   const { tokens } = useDesignTokens();
   const styleTokens = tokens.button.styles["primary"]["solid"];
   
   // styleTokens.background ya es "#51abbb"
   // styleTokens.color ya es "#F0FAFB"
   ```

---

## 🎨 "Laboratorio de Color" - Tokens de Componentes

### Filosofía Creativa:
Los archivos de tokens de componentes (ej. `standard-button-tokens.ts`) son **"laboratorios"** donde se experimenta creativamente con colores.

#### Libertad Artística:
- **NO están limitados** a mapeo 1:1 de la paleta base
- **Pueden usar tinycolor2** para derivar nuevos tonos
- **Pueden crear gradientes**, variaciones, estados hover personalizados
- **Dan personalidad única** a cada componente

#### Ejemplo:
```typescript
// standard-button-tokens.ts
import tinycolor from "tinycolor2";

// 🎨 "Ponerse loquillo" - Derivar colores creativos
const hoverBg = tinycolor(appTokens.primary.pure)
  .darken(10)
  .saturate(5)
  .toHexString();

const bgSubtle = tinycolor(appTokens.primary.bg)
  .setAlpha(0.3)
  .toRgbString();
```

---

## 🚀 Ventajas del Sistema

### 1. **Performance 10x**
- Tokens precalculados **una sola vez**
- Componentes NO recalculan en cada render
- Cambio de tema es instantáneo

### 2. **Mantenibilidad**
- Fuente única de verdad (`colors.ts`)
- Cambios en paleta se propagan automáticamente
- Componentes desacoplados de valores concretos

### 3. **Escalabilidad**
- Agregar nuevo tema: solo editar `colors.ts`
- Agregar nuevo componente: crear su generador de tokens
- Sin refactorización masiva

### 4. **Flexibilidad**
- Componentes agnósticos pueden cambiar de tema sin código
- "Laboratorios" permiten creatividad sin romper consistencia
- Sistema extensible sin tocar lógica core

---

## 📊 Estado Actual del Sistema

### Migración v4:
- **Completado:** 21/25 componentes (84%)
- **Patrón establecido:** Todos los nuevos componentes usan DesignTokensProvider
- **Retrocompatibilidad:** Componentes legacy siguen funcionando

### Componentes con Sistema Antiguo:
Algunos componentes aún usan `generateStandard*Tokens()` directamente en lugar de DesignTokensProvider. Estos se migrarán gradualmente.

---

## 🎯 Próximos Pasos: Mejora de Paletas

Ahora que entiendes la arquitectura, podemos mejorar las paletas en `colors.ts`:

### Áreas de Mejora:
1. **Enriquecer shades:** Agregar más variaciones sin romper la estructura
2. **Mejorar contraste:** Validar WCAG en todos los temas
3. **Refinar semánticos:** Ajustar accent/success/warning/danger
4. **Nuevos temas:** Agregar paletas adicionales si es necesario

### Restricciones:
- ✅ Mantener estructura de 7 shades por color
- ✅ Mantener nombres de temas existentes
- ✅ Mantener semánticos fijos (accent = morado)
- ✅ Cada tema debe tener versión light y dark

---

## 📝 Notas Finales

### La "Rareza" es Intencional:
- **Pocos shades:** Fuerza consistencia y previene caos
- **Semánticos fijos:** Identidad visual coherente
- **Precálculo:** Performance sobre conveniencia
- **Agnosticismo:** Componentes reutilizables y mantenibles

### Filosofía SUSTRATO:
> "Los componentes son orquestadores inteligentes, no diseñadores. 
> Los tokens son el laboratorio creativo, no una cárcel de valores."

---

**Documento creado:** 22 Mar 2026  
**Versión del sistema:** v4.3  
**Estado de migración:** 84% completado
