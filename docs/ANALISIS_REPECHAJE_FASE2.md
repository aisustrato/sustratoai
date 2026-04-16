# 📊 Análisis de Componentes "Repechaje Fase 2"

**Fecha:** 22 Mar 2026  
**Componentes Analizados:** 8  
**Objetivo:** Determinar uso, necesidad de refactorización y normalización de nombres

---

## 📋 RESUMEN EJECUTIVO

| # | Componente | Usado | Refactorizar | Renombrar | Prioridad |
|---|------------|-------|--------------|-----------|-----------|
| 1 | sidebar.tsx | ❌ NO | ❌ | ❌ | - |
| 2 | solid-navbar-wrapper.tsx | ✅ SÍ | ✅ | ✅ | 🔴 ALTA |
| 3 | sustrato-logo.tsx | ✅ SÍ | ❌ | ❌ | - |
| 4 | sustrato-logo-reactive.tsx | ❌ NO | ✅ | ✅ | 🟡 BAJA |
| 5 | sustrato-logo-rotating.tsx | ✅ SÍ | ❌ | ❌ | - |
| 6 | sustrato-logo-with-fixed-text.tsx | ✅ SÍ | ✅ | ✅ | 🟠 MEDIA |
| 7 | StandardCheckboxGroup.tsx | ✅ SÍ | ❌ | ❌ | - |
| 8 | StandardFormField.tsx | ✅ SÍ | ❌ | ❌ | - |

**Componentes a Refactorizar:** 3  
**Componentes OK:** 4  
**Componentes No Usados:** 1

---

## 🔍 ANÁLISIS DETALLADO

### **1. sidebar.tsx** ❌

**Archivo:** `/components/ui/sidebar.tsx`

#### **Estado:**
- ✅ **Archivo vacío** (1 línea en blanco)
- ❌ **NO se usa** en ninguna parte del proyecto

#### **Hallazgos:**
```bash
# Búsqueda de imports:
- 0 imports encontrados
```

#### **Recomendación:**
🗑️ **ELIMINAR** - Archivo vacío sin uso

#### **Acción:**
```bash
rm /components/ui/sidebar.tsx
```

---

### **2. solid-navbar-wrapper.tsx** 🔴

**Archivo:** `/components/ui/solid-navbar-wrapper.tsx`

#### **Estado:**
- ✅ **Usado activamente** en `auth-layout-wrapper.tsx`
- ❌ **Usa `useTheme()`** (código legacy)
- ❌ **Genera tokens inline** con `generateStandardNavbarTokens`
- ❌ **Nombre no estandarizado** (falta prefijo `Standard`)

#### **Uso Actual:**
```typescript
// auth-layout-wrapper.tsx
import { SolidNavbarWrapper } from "@/components/ui/solid-navbar-wrapper";
```

#### **Código Problemático:**
```typescript
// ❌ ANTES: Usa useTheme y genera tokens inline
const { appColorTokens, mode } = useTheme()

const currentNavTokens: StandardNavbarTokens | null = useMemo(() => {
  if (!appColorTokens || !mode) return null
  return generateStandardNavbarTokens(appColorTokens, mode)
}, [appColorTokens, mode])
```

#### **Refactorización Necesaria:**
```typescript
// ✅ DESPUÉS: Usa useDesignTokens con tokens precalculados
const { tokens: designTokens } = useDesignTokens()
const currentNavTokens = designTokens?.navbar || null
```

#### **Recomendación:**
🔧 **REFACTORIZAR + RENOMBRAR**

**Cambios:**
1. ✅ Renombrar: `solid-navbar-wrapper.tsx` → `StandardSolidNavbarWrapper.tsx`
2. ✅ Renombrar componente: `SolidNavbarWrapper` → `StandardSolidNavbarWrapper`
3. ✅ Cambiar `useTheme()` por `useDesignTokens()`
4. ✅ Usar tokens precalculados `designTokens.navbar`
5. ✅ Eliminar import de `generateStandardNavbarTokens`
6. ✅ Actualizar import en `auth-layout-wrapper.tsx`

**Prioridad:** 🔴 **ALTA** - Componente crítico en layout principal

---

### **3. sustrato-logo.tsx** ✅

**Archivo:** `/components/ui/sustrato-logo.tsx`

#### **Estado:**
- ✅ **Usado activamente** en 2 archivos:
  - `sustrato-loading-logo.tsx`
  - `StandardNavbar.tsx`
- ✅ **Sin dependencias de theme** (recibe colores como props)
- ✅ **Componente puro** (solo SVG)

#### **Código:**
```typescript
export function SustratoLogo({
  className = "",
  size = 28,
  primaryColor,
  accentColor,
}: {
  className?: string
  size?: number
  primaryColor?: string
  accentColor?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 65 65" fill="none">
      {/* SVG paths */}
    </svg>
  )
}
```

#### **Recomendación:**
✅ **NO REFACTORIZAR** - Componente puro, funciona correctamente

**Razón:** No usa `useTheme()`, no genera tokens, es agnóstico al sistema de diseño. Perfecto como está.

---

### **4. sustrato-logo-reactive.tsx** 🟡

**Archivo:** `/components/ui/sustrato-logo-reactive.tsx`

#### **Estado:**
- ❌ **NO se usa** en ninguna parte del proyecto
- ❌ **Usa `useTheme()`** (código legacy)
- ❌ **Genera colores inline** con lógica hardcodeada
- ❌ **Nombre no estandarizado** (falta prefijo `Standard`)

#### **Búsqueda de Uso:**
```bash
# Búsqueda de imports:
- 0 imports encontrados
```

#### **Código Problemático:**
```typescript
// ❌ Usa useTheme
const { colorScheme, mode } = useTheme();

// ❌ Colores hardcodeados
const themeColors = useMemo(() => ({
  blue: {
    primary: mode === "dark" ? "#2E5EB9" : "#3D7DF6",
    secondary: mode === "dark" ? "#1EA4E9" : "#516e99",
  },
  // ...
}), [mode]);
```

#### **Recomendación:**
🔧 **REFACTORIZAR (cuando se use)** + RENOMBRAR

**Cambios (si decides usarlo):**
1. ✅ Renombrar: `sustrato-logo-reactive.tsx` → `StandardSustratoLogoReactive.tsx`
2. ✅ Renombrar componentes: `SustratoLogoReactive` → `StandardSustratoLogoReactive`
3. ✅ Cambiar `useTheme()` por `useDesignTokens()`
4. ✅ Usar tokens precalculados en lugar de colores hardcodeados
5. ✅ Eliminar lógica de `themeColors` inline

**Prioridad:** 🟡 **BAJA** - No se usa actualmente

**Nota:** Como mencionaste, "debiera refactorizarse igual para cuando use". Recomiendo hacerlo ahora para evitar deuda técnica.

---

### **5. sustrato-logo-rotating.tsx** ✅

**Archivo:** `/components/ui/sustrato-logo-rotating.tsx`

#### **Estado:**
- ✅ **Usado activamente** en `sustrato-logo-with-fixed-text.tsx`
- ⚠️ **Usa `useTheme` de `next-themes`** (NO el legacy `useTheme` de theme-provider)
- ✅ **Colores hardcodeados** pero es intencional (rotación de temas)
- ✅ **Componente especializado** para animación

#### **Código:**
```typescript
import { useTheme } from "next-themes"; // ✅ next-themes, NO theme-provider

export function SustratoLogoRotating({
  className = "",
  size = 65,
  speed = "normal",
  initialTheme = "blue",
}: {...}) {
  // Lógica de rotación de colores entre temas
}
```

#### **Recomendación:**
✅ **NO REFACTORIZAR** - Componente especializado con propósito específico

**Razón:** 
- Usa `next-themes` (no el legacy `theme-provider`)
- Los colores hardcodeados son intencionales para la rotación automática
- Es un componente de animación, no de sistema de diseño
- Funciona correctamente como está

---

### **6. sustrato-logo-with-fixed-text.tsx** 🟠

**Archivo:** `/components/ui/sustrato-logo-with-fixed-text.tsx`

#### **Estado:**
- ✅ **Usado activamente** en 4 archivos:
  - `login/page.tsx`
  - `reset-password/page.tsx`
  - `update-password/page.tsx`
  - `signup/page.tsx`
- ❌ **Usa `useTheme()`** (código legacy de theme-provider)
- ❌ **Accede a `appColorTokens.primary.pure`** directamente
- ❌ **Nombre no estandarizado** (falta prefijo `Standard`)

#### **Código Problemático:**
```typescript
// ❌ Usa useTheme legacy
const { appColorTokens } = useTheme();

const primaryTextColor = appColorTokens.primary?.pure || "#3D7DF6";
const accentTextColor = "#8A4EF6";
```

#### **Refactorización Necesaria:**
```typescript
// ✅ Usa useDesignTokens
const { tokens: designTokens } = useDesignTokens();

const primaryTextColor = designTokens?.text?.primary?.pure || "#3D7DF6";
const accentTextColor = designTokens?.text?.accent?.pure || "#8A4EF6";
```

#### **Recomendación:**
🔧 **REFACTORIZAR + RENOMBRAR**

**Cambios:**
1. ✅ Renombrar: `sustrato-logo-with-fixed-text.tsx` → `StandardSustratoLogoWithFixedText.tsx`
2. ✅ Renombrar componente: `SustratoLogoWithFixedText` → `StandardSustratoLogoWithFixedText`
3. ✅ Cambiar `useTheme()` por `useDesignTokens()`
4. ✅ Usar tokens de texto en lugar de `appColorTokens.primary.pure`
5. ✅ Actualizar imports en 4 archivos de autenticación

**Prioridad:** 🟠 **MEDIA** - Usado en páginas de autenticación

---

### **7. StandardCheckboxGroup.tsx** ✅

**Archivo:** `/components/ui/StandardCheckboxGroup.tsx`

#### **Estado:**
- ✅ **Usado activamente** en 2 archivos:
  - `articulos/notas/GroupNotesTabClient.tsx`
  - `showroom/CheckboxGroup/page.tsx`
- ✅ **Nombre estandarizado** (prefijo `Standard`)
- ✅ **No usa `useTheme()`** ni genera tokens
- ✅ **Usa componentes Standard** (`StandardCheckbox`, `StandardText`)
- ✅ **Código limpio** y bien estructurado

#### **Código:**
```typescript
export const StandardCheckboxGroup: React.FC<StandardCheckboxGroupProps> = ({
  options,
  value,
  colorScheme,
  size = 'md',
  // ...
}) => {
  // Lógica de estado local
  // Usa StandardCheckbox y StandardText
}
```

#### **Recomendación:**
✅ **NO REFACTORIZAR** - Componente ya estandarizado y correcto

**Razón:** Ya sigue todas las mejores prácticas del ecosistema Standard.

---

### **8. StandardFormField.tsx** ✅

**Archivo:** `/components/ui/StandardFormField.tsx`

#### **Estado:**
- ✅ **Usado activamente** en 11 archivos (muy usado)
- ✅ **Nombre estandarizado** (prefijo `Standard`)
- ✅ **No usa `useTheme()`** ni genera tokens
- ✅ **Usa componentes Standard** (`StandardLabel`, `StandardText`)
- ✅ **Código limpio** con lógica de focus reactiva

#### **Uso Extensivo:**
```bash
# Usado en:
- reset-password/page.tsx
- login/page.tsx
- datos-maestros/roles/components/RolForm.tsx
- datos-maestros/proyecto/components/ProjectEditForm.tsx
- datos-maestros/miembros/components/MiembroForm.tsx
- datos-maestros/dimensiones/components/DimensionForm.tsx
- datos-maestros/fases-preclasificacion/components/FaseForm.tsx
- update-password/page.tsx
- articulos/grupos/CreateGroupPopup.tsx
- articulos/grupos/GroupsManagerClient.tsx
- contact/page.tsx
- showroom/formbeta/page.tsx
- showroom/gemini/page.tsx
```

#### **Código:**
```typescript
export function StandardFormField({
  label,
  htmlFor,
  children,
  hint,
  error,
  isRequired,
}: StandardFormFieldProps) {
  // Lógica de focus reactiva
  // Usa StandardLabel y StandardText
  // Maneja accesibilidad correctamente
}
```

#### **Recomendación:**
✅ **NO REFACTORIZAR** - Componente ya estandarizado y correcto

**Razón:** 
- Ya sigue todas las mejores prácticas
- Muy usado en el proyecto (11 archivos)
- Código limpio y bien estructurado
- No tiene dependencias legacy

---

## 📊 ESTADÍSTICAS

### **Por Estado de Uso:**
- ✅ **Usados:** 6 componentes (75%)
- ❌ **No usados:** 2 componentes (25%)

### **Por Necesidad de Refactorización:**
- 🔧 **Refactorizar:** 3 componentes (37.5%)
- ✅ **OK:** 4 componentes (50%)
- 🗑️ **Eliminar:** 1 componente (12.5%)

### **Por Prioridad:**
- 🔴 **Alta:** 1 componente (`SolidNavbarWrapper`)
- 🟠 **Media:** 1 componente (`SustratoLogoWithFixedText`)
- 🟡 **Baja:** 1 componente (`SustratoLogoReactive`)

---

## 🎯 PLAN DE REFACTORIZACIÓN RECOMENDADO

### **Fase 1: Componentes Críticos (Prioridad Alta)** 🔴

#### **1. StandardSolidNavbarWrapper**
- **Archivo:** `solid-navbar-wrapper.tsx` → `StandardSolidNavbarWrapper.tsx`
- **Cambios:**
  1. Renombrar archivo y componente
  2. Cambiar `useTheme()` → `useDesignTokens()`
  3. Usar `designTokens.navbar` precalculado
  4. Eliminar `generateStandardNavbarTokens` import
  5. Actualizar import en `auth-layout-wrapper.tsx`

---

### **Fase 2: Componentes de Autenticación (Prioridad Media)** 🟠

#### **2. StandardSustratoLogoWithFixedText**
- **Archivo:** `sustrato-logo-with-fixed-text.tsx` → `StandardSustratoLogoWithFixedText.tsx`
- **Cambios:**
  1. Renombrar archivo y componente
  2. Cambiar `useTheme()` → `useDesignTokens()`
  3. Usar `designTokens.text.primary.pure`
  4. Actualizar imports en 4 archivos de auth

---

### **Fase 3: Componentes No Usados (Prioridad Baja)** 🟡

#### **3. StandardSustratoLogoReactive** (Opcional)
- **Archivo:** `sustrato-logo-reactive.tsx` → `StandardSustratoLogoReactive.tsx`
- **Cambios:**
  1. Renombrar archivo y componentes
  2. Cambiar `useTheme()` → `useDesignTokens()`
  3. Usar tokens precalculados
  4. Eliminar `themeColors` hardcodeados

#### **4. Eliminar sidebar.tsx**
- **Acción:** `rm components/ui/sidebar.tsx`

---

## 📋 CHECKLIST DE REFACTORIZACIÓN

### **StandardSolidNavbarWrapper** 🔴
- [ ] Renombrar archivo a `StandardSolidNavbarWrapper.tsx`
- [ ] Renombrar componente a `StandardSolidNavbarWrapper`
- [ ] Cambiar export a named export
- [ ] Cambiar `useTheme()` por `useDesignTokens()`
- [ ] Usar `designTokens.navbar` precalculado
- [ ] Eliminar `useMemo` innecesario
- [ ] Eliminar import de `generateStandardNavbarTokens`
- [ ] Actualizar import en `auth-layout-wrapper.tsx`
- [ ] Validar con linter
- [ ] Probar en runtime

### **StandardSustratoLogoWithFixedText** 🟠
- [ ] Renombrar archivo a `StandardSustratoLogoWithFixedText.tsx`
- [ ] Renombrar componente a `StandardSustratoLogoWithFixedText`
- [ ] Cambiar export a named export
- [ ] Cambiar `useTheme()` por `useDesignTokens()`
- [ ] Usar `designTokens.text.primary.pure`
- [ ] Actualizar import en `login/page.tsx`
- [ ] Actualizar import en `reset-password/page.tsx`
- [ ] Actualizar import en `update-password/page.tsx`
- [ ] Actualizar import en `signup/page.tsx`
- [ ] Validar con linter
- [ ] Probar en runtime

### **StandardSustratoLogoReactive** 🟡 (Opcional)
- [ ] Renombrar archivo a `StandardSustratoLogoReactive.tsx`
- [ ] Renombrar componentes a `StandardSustratoLogoReactive`
- [ ] Cambiar exports a named exports
- [ ] Cambiar `useTheme()` por `useDesignTokens()`
- [ ] Usar tokens precalculados
- [ ] Eliminar `themeColors` hardcodeados
- [ ] Validar con linter

### **Limpieza**
- [ ] Eliminar `sidebar.tsx`

---

## 🎯 IMPACTO ESTIMADO

### **Archivos a Modificar:**
- **Componentes:** 3 archivos
- **Imports:** 5 archivos
- **Total:** 8 archivos

### **Líneas de Código:**
- **Eliminadas:** ~50 líneas (lógica legacy)
- **Modificadas:** ~30 líneas (refactorización)
- **Total:** ~80 líneas

### **Tiempo Estimado:**
- **Fase 1 (Alta):** ~15 minutos
- **Fase 2 (Media):** ~20 minutos
- **Fase 3 (Baja):** ~15 minutos
- **Total:** ~50 minutos

---

## ✅ COMPONENTES QUE NO REQUIEREN CAMBIOS

1. ✅ **sustrato-logo.tsx** - Componente puro, funciona perfectamente
2. ✅ **sustrato-logo-rotating.tsx** - Usa `next-themes`, no legacy
3. ✅ **StandardCheckboxGroup.tsx** - Ya estandarizado
4. ✅ **StandardFormField.tsx** - Ya estandarizado

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

### **Opción A: Refactorización Completa** (Recomendado)
Ejecutar todas las fases en orden de prioridad:
1. 🔴 Fase 1: `StandardSolidNavbarWrapper`
2. 🟠 Fase 2: `StandardSustratoLogoWithFixedText`
3. 🟡 Fase 3: `StandardSustratoLogoReactive` + Eliminar `sidebar.tsx`

### **Opción B: Solo Críticos**
Ejecutar solo Fase 1 (prioridad alta):
1. 🔴 `StandardSolidNavbarWrapper`

### **Opción C: Incremental**
Ejecutar fase por fase con validación entre cada una:
1. 🔴 Fase 1 → Validar → Continuar
2. 🟠 Fase 2 → Validar → Continuar
3. 🟡 Fase 3 → Validar → Finalizar

---

## 📄 DOCUMENTOS RELACIONADOS

1. `ANALISIS_COMPONENTES_REPECHAJE.md` - Análisis Fase 1
2. `REFACTORIZACION_REPECHAJE_COMPLETA.md` - Refactorización Fase 1
3. `ANALISIS_REPECHAJE_FASE2.md` - Este documento

---

**Generado:** 22 Mar 2026  
**Autor:** Cascade AI + Rodolfo Leiva  
**Versión:** 1.0 - Análisis Repechaje Fase 2
