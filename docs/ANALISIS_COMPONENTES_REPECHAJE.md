# 📋 Análisis de Componentes "Repechaje"

**Fecha:** 22 Mar 2026  
**Componentes Analizados:** 4  
**Objetivo:** Determinar uso, necesidad de refactorización, limpieza y estandarización de nombres

---

## 🎯 RESUMEN EJECUTIVO

| Componente | En Uso | Necesita Refactorización | Necesita Limpieza | Estandarizar Nombre |
|------------|--------|-------------------------|-------------------|---------------------|
| `dark-mode-switcher.tsx` | ✅ SÍ | ✅ SÍ | ❌ NO | ✅ SÍ |
| `font-theme-switcher.tsx` | ✅ SÍ | ✅ SÍ | ❌ NO | ✅ SÍ |
| `ProjectStatusBadge.tsx` | ✅ SÍ | ❌ NO | ❌ NO | ✅ SÍ |
| `sidebar-nav-animations.tsx` | ✅ SÍ | ⚠️ PARCIAL | ❌ NO | ✅ SÍ |

---

## 1️⃣ DARK-MODE-SWITCHER.TSX

### **Estado:** ✅ EN USO ACTIVO

### **Ubicaciones de Uso:**
- `components/ui/theme-switcher.tsx` - Importado y usado
- Usado en `ThemeSwitcher` que se muestra en navbar y otros lugares

### **Análisis:**

#### **Código Actual:**
```typescript
export function DarkModeSwitcher() {
  const { mode, toggleMode } = useDarkMode();
  // Usa useTheme() internamente
  const { mode, setMode } = useTheme();
  // ...
}
```

#### **Problemas Detectados:**
1. ❌ **Usa `useTheme()`** en lugar de `useDesignTokens()`
2. ❌ **No usa tokens precalculados** - genera tokens inline
3. ❌ **Nombre no estandarizado** - Debería ser `StandardDarkModeSwitcher`
4. ✅ **Lógica bien separada** - Usa custom hook `useDarkMode()`
5. ✅ **Componente funcional** - Trabaja correctamente

#### **Refactorización Necesaria:**
- **Prioridad:** MEDIA
- **Complejidad:** BAJA
- **Cambios:**
  1. Cambiar `useTheme()` por `useDesignTokens()` en el hook `useDarkMode()`
  2. Eliminar generación inline de tokens (si existe)
  3. Renombrar a `StandardDarkModeSwitcher`
  4. Actualizar imports en `theme-switcher.tsx`

#### **Estandarización de Nombre:**
- **Actual:** `DarkModeSwitcher`
- **Propuesto:** `StandardDarkModeSwitcher`
- **Archivo:** `dark-mode-switcher.tsx` → `StandardDarkModeSwitcher.tsx`

---

## 2️⃣ FONT-THEME-SWITCHER.TSX

### **Estado:** ✅ EN USO ACTIVO

### **Ubicaciones de Uso:**
- `components/ui/user-avatar.tsx` - Importado y usado
- `components/ui/StandardNavbar.tsx` - Importado y usado (2 veces)
- Usado en navbar y menú de usuario

### **Análisis:**

#### **Código Actual:**
```typescript
export function FontThemeSwitcher() {
  const { mode, appColorTokens } = useTheme();
  const fontTokens = generateFontSelectorTokens(appColorTokens, mode);
  // ...
}
```

#### **Problemas Detectados:**
1. ❌ **Usa `useTheme()`** directamente
2. ❌ **Genera tokens inline** con `generateFontSelectorTokens()`
3. ❌ **Nombre no estandarizado** - Debería ser `StandardFontThemeSwitcher`
4. ❌ **Usa `appColorTokens` directamente** en estilos inline (líneas 262, 275, 322, 326, 345)
5. ✅ **Lógica optimista** bien implementada
6. ✅ **Persistencia silenciosa** correcta

#### **Refactorización Necesaria:**
- **Prioridad:** ALTA (muy usado)
- **Complejidad:** MEDIA
- **Cambios:**
  1. Cambiar `useTheme()` por `useDesignTokens()`
  2. Usar tokens precalculados `designTokens.fontSelector` (crear si no existe)
  3. Eliminar `generateFontSelectorTokens()` inline
  4. Reemplazar referencias directas a `appColorTokens` por tokens
  5. Renombrar a `StandardFontThemeSwitcher`
  6. Actualizar imports en `user-avatar.tsx` y `StandardNavbar.tsx`

#### **Estandarización de Nombre:**
- **Actual:** `FontThemeSwitcher`
- **Propuesto:** `StandardFontThemeSwitcher`
- **Archivo:** `font-theme-switcher.tsx` → `StandardFontThemeSwitcher.tsx`

---

## 3️⃣ PROJECTSTATUSBADGE.TSX

### **Estado:** ✅ EN USO ACTIVO

### **Ubicaciones de Uso:**
- `app/layout.tsx` - Importado y usado
- Renderizado en posición fija (top-right)
- Hook `useComponentVisibility` lo controla

### **Análisis:**

#### **Código Actual:**
```typescript
const ProjectStatusBadge: React.FC = () => {
  const { proyectoActual } = useAuth();
  const { shouldShowProjectStatusBadge } = useComponentVisibility();
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 ...">
      <StandardText size="2xs" ...>
        {proyectoActual.name}
      </StandardText>
    </div>
  );
};
```

#### **Problemas Detectados:**
1. ❌ **Nombre no estandarizado** - Debería ser `StandardProjectStatusBadge`
2. ❌ **Usa clases Tailwind hardcodeadas** en lugar de tokens
3. ✅ **Ya usa `StandardText`** - Componente Standard
4. ✅ **Lógica de visibilidad** bien implementada
5. ✅ **Componente simple y funcional**

#### **Refactorización Necesaria:**
- **Prioridad:** BAJA (funciona bien)
- **Complejidad:** BAJA
- **Cambios:**
  1. Renombrar a `StandardProjectStatusBadge`
  2. **Opcional:** Reemplazar clases Tailwind por tokens (si se desea máxima consistencia)
  3. Actualizar import en `app/layout.tsx`

#### **Estandarización de Nombre:**
- **Actual:** `ProjectStatusBadge`
- **Propuesto:** `StandardProjectStatusBadge`
- **Archivo:** `ProjectStatusBadge.tsx` → `StandardProjectStatusBadge.tsx`

---

## 4️⃣ SIDEBAR-NAV-ANIMATIONS.TSX

### **Estado:** ✅ EN USO ACTIVO

### **Ubicaciones de Uso:**
- `components/ui/sidebar-nav.tsx` - Importado y usado
- Componente de navegación lateral con animaciones

### **Análisis:**

#### **Código Actual:**
```typescript
interface SidebarNavAnimationsProps {
  appColorTokens: AppColorTokens; // ❌ Recibe tokens como prop
  // ...
}

export function SidebarNavAnimations({
  appColorTokens,
  // ...
}: SidebarNavAnimationsProps) {
  // Usa appColorTokens directamente
  // ...
}
```

#### **Problemas Detectados:**
1. ⚠️ **Recibe `appColorTokens` como prop** - Arquitectura antigua
2. ⚠️ **No usa hooks de tokens** - Depende del padre
3. ❌ **Nombre no estandarizado** - Debería ser `StandardSidebarNavAnimations`
4. ✅ **Ya usa componentes Standard** - `StandardText`, `StandardIcon`, `StandardTooltip`
5. ✅ **Animaciones bien implementadas** con Framer Motion
6. ✅ **Ripple effect integrado**

#### **Refactorización Necesaria:**
- **Prioridad:** MEDIA
- **Complejidad:** MEDIA
- **Cambios:**
  1. **Opción A (Recomendada):** Usar `useDesignTokens()` internamente y eliminar prop `appColorTokens`
  2. **Opción B:** Mantener como componente "tonto" pero que el padre use `useDesignTokens()`
  3. Renombrar a `StandardSidebarNavAnimations`
  4. Actualizar `sidebar-nav.tsx` para pasar tokens desde `useDesignTokens()`

#### **Estandarización de Nombre:**
- **Actual:** `SidebarNavAnimations`
- **Propuesto:** `StandardSidebarNavAnimations`
- **Archivo:** `sidebar-nav-animations.tsx` → `StandardSidebarNavAnimations.tsx`

---

## 📊 RESUMEN DE ACCIONES RECOMENDADAS

### **Prioridad ALTA:**
1. ✅ **FontThemeSwitcher** → Refactorizar + Renombrar
   - Muy usado (navbar + user avatar)
   - Genera tokens inline
   - Usa `appColorTokens` directamente

### **Prioridad MEDIA:**
2. ✅ **DarkModeSwitcher** → Refactorizar + Renombrar
   - Usado en theme switcher
   - Usa `useTheme()` internamente

3. ✅ **SidebarNavAnimations** → Refactorizar + Renombrar
   - Recibe tokens como prop
   - Arquitectura antigua

### **Prioridad BAJA:**
4. ✅ **ProjectStatusBadge** → Solo Renombrar
   - Funciona bien
   - Solo necesita estandarizar nombre
   - Opcional: usar tokens en lugar de Tailwind

---

## 🎯 PLAN DE REFACTORIZACIÓN SUGERIDO

### **Fase 1 - Renombrado (Rápido):**
1. `ProjectStatusBadge` → `StandardProjectStatusBadge`
2. `DarkModeSwitcher` → `StandardDarkModeSwitcher`
3. `FontThemeSwitcher` → `StandardFontThemeSwitcher`
4. `SidebarNavAnimations` → `StandardSidebarNavAnimations`

**Impacto:** Estandarización de nombres  
**Tiempo estimado:** 10 minutos  
**Archivos a actualizar:** 6 (4 componentes + 2 imports)

### **Fase 2 - Refactorización de Tokens (Medio):**
1. **DarkModeSwitcher:**
   - Cambiar `useTheme()` por `useDesignTokens()` en hook
   - Verificar si genera tokens inline

2. **FontThemeSwitcher:**
   - Cambiar `useTheme()` por `useDesignTokens()`
   - Crear `fontSelector` tokens en DesignTokensProvider
   - Eliminar `generateFontSelectorTokens()` inline
   - Reemplazar referencias a `appColorTokens`

3. **SidebarNavAnimations:**
   - Usar `useDesignTokens()` internamente
   - Eliminar prop `appColorTokens`
   - Actualizar `sidebar-nav.tsx`

**Impacto:** Consistencia total con sistema de tokens  
**Tiempo estimado:** 30-40 minutos  
**Archivos a actualizar:** 5 (3 componentes + DesignTokensProvider + sidebar-nav.tsx)

---

## 📝 CHECKLIST DE REFACTORIZACIÓN

### **DarkModeSwitcher:**
- [ ] Renombrar archivo a `StandardDarkModeSwitcher.tsx`
- [ ] Renombrar componente a `StandardDarkModeSwitcher`
- [ ] Cambiar `useTheme()` por `useDesignTokens()` en hook `useDarkMode()`
- [ ] Actualizar import en `theme-switcher.tsx`
- [ ] Validar con linter
- [ ] Probar funcionalidad

### **FontThemeSwitcher:**
- [ ] Renombrar archivo a `StandardFontThemeSwitcher.tsx`
- [ ] Renombrar componente a `StandardFontThemeSwitcher`
- [ ] Cambiar `useTheme()` por `useDesignTokens()`
- [ ] Crear tokens `fontSelector` en DesignTokensProvider
- [ ] Eliminar `generateFontSelectorTokens()` inline
- [ ] Reemplazar `appColorTokens` por tokens precalculados
- [ ] Actualizar imports en `user-avatar.tsx` y `StandardNavbar.tsx`
- [ ] Validar con linter
- [ ] Probar funcionalidad

### **ProjectStatusBadge:**
- [ ] Renombrar archivo a `StandardProjectStatusBadge.tsx`
- [ ] Renombrar componente a `StandardProjectStatusBadge`
- [ ] Actualizar import en `app/layout.tsx`
- [ ] (Opcional) Reemplazar Tailwind por tokens
- [ ] Validar con linter
- [ ] Probar funcionalidad

### **SidebarNavAnimations:**
- [ ] Renombrar archivo a `StandardSidebarNavAnimations.tsx`
- [ ] Renombrar componente a `StandardSidebarNavAnimations`
- [ ] Usar `useDesignTokens()` internamente
- [ ] Eliminar prop `appColorTokens` de interfaz
- [ ] Actualizar `sidebar-nav.tsx` para eliminar paso de tokens
- [ ] Validar con linter
- [ ] Probar funcionalidad

---

## ✅ CONCLUSIÓN

**Todos los 4 componentes están en uso activo y son necesarios.**

**Ninguno debe eliminarse.**

**Todos necesitan estandarización de nombre.**

**3 de 4 necesitan refactorización para usar el sistema de tokens precalculados.**

**Recomendación:** Proceder con Fase 1 (renombrado) primero para estandarizar, luego Fase 2 (refactorización) para completar la migración al sistema de tokens.

---

**¿Procedemos con la refactorización, Rodolfo?** 💪
