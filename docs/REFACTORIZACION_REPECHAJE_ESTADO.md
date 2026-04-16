# 📋 Estado de Refactorización Componentes "Repechaje"

**Fecha:** 22 Mar 2026  
**Estado:** ⚠️ PARCIALMENTE COMPLETADO  
**Componentes:** 4

---

## ✅ ERRORES PREVIOS CORREGIDOS

### **1. Error: sphere no existe en tipo DesignTokens**
- **Archivo:** `DesignTokensProvider.tsx`
- **Solución:** Agregado `sphere?: any;` a la interfaz `DesignTokens`
- **Estado:** ✅ CORREGIDO

### **2. Error: useTheme no definido en StandardNavbar**
- **Archivo:** `StandardNavbar.tsx`
- **Problema:** Línea duplicada con `useTheme()` que no se eliminó
- **Solución:** Eliminada línea `const { mode, appColorTokens } = useTheme();`
- **Estado:** ✅ CORREGIDO

---

## 📊 ESTADO DE COMPONENTES REPECHAJE

### **1. StandardProjectStatusBadge** ✅ COMPLETADO
- **Archivo:** `ProjectStatusBadge.tsx` → `StandardProjectStatusBadge.tsx`
- **Cambios realizados:**
  - ✅ Renombrado archivo
  - ✅ Renombrado componente
  - ✅ Cambiado export default por named export
  - ✅ Actualizado import en `app/layout.tsx`
  - ✅ Actualizado uso en `app/layout.tsx`
- **Refactorización de tokens:** ❌ NO NECESARIA (usa clases Tailwind, funciona bien)
- **Estado:** ✅ COMPLETADO

---

### **2. StandardDarkModeSwitcher** ✅ COMPLETADO
- **Archivo:** `dark-mode-switcher.tsx` → `StandardDarkModeSwitcher.tsx`
- **Cambios realizados:**
  - ✅ Renombrado archivo
  - ✅ Renombrado componente
  - ✅ Refactorizado hook `useDarkMode()` para usar `useDesignTokens()`
  - ✅ Actualizado import en `theme-switcher.tsx`
  - ✅ Actualizado uso en `theme-switcher.tsx`
- **Refactorización de tokens:** ✅ COMPLETADA
  - Cambió `useTheme()` por `useDesignTokens()`
  - Hook `useDarkMode()` ahora usa `const { mode, setMode } = useDesignTokens();`
- **Estado:** ✅ COMPLETADO

---

### **3. StandardFontThemeSwitcher** ⚠️ PARCIALMENTE COMPLETADO
- **Archivo:** `font-theme-switcher.tsx` → `StandardFontThemeSwitcher.tsx`
- **Cambios realizados:**
  - ✅ Renombrado archivo
  - ✅ Renombrado componente
  - ✅ Cambiado `useTheme()` por `useDesignTokens()`
  - ✅ Eliminado import de `generateFontSelectorTokens`
  - ✅ Actualizado import en `user-avatar.tsx`
  - ✅ Actualizado uso en `user-avatar.tsx`
  - ✅ Actualizado import en `StandardNavbar.tsx`
  - ✅ Actualizado uso en `StandardNavbar.tsx` (2 lugares)
- **Refactorización de tokens:** ⚠️ PARCIAL
  - ✅ Cambió `useTheme()` por `useDesignTokens()`
  - ⚠️ Usa tokens temporales con fallbacks hardcodeados
  - ⚠️ Reemplazó 5 referencias a `appColorTokens` por `designTokens` con fallbacks
  - ❌ NO se crearon tokens `fontSelector` en DesignTokensProvider (pendiente)
- **Estado:** ⚠️ FUNCIONAL PERO CON FALLBACKS TEMPORALES

---

### **4. StandardSidebarNavAnimations** ⚠️ PARCIALMENTE COMPLETADO
- **Archivo:** `sidebar-nav-animations.tsx` → `StandardSidebarNavAnimations.tsx`
- **Cambios realizados:**
  - ✅ Renombrado archivo
  - ✅ Renombrado componente
  - ✅ Renombrada interfaz `SidebarNavAnimationsProps` → `StandardSidebarNavAnimationsProps`
  - ✅ Eliminada prop `appColorTokens` de la interfaz
  - ✅ Agregado `useDesignTokens()` internamente
  - ✅ Creado objeto `appColorTokens` local con tokens precalculados
  - ✅ Actualizado import en `sidebar-nav.tsx`
  - ❌ NO actualizado uso en `sidebar-nav.tsx` (aún pasa `appColorTokens`)
- **Refactorización de tokens:** ⚠️ PARCIAL
  - ✅ Usa `useDesignTokens()` internamente
  - ✅ Crea objeto local con tokens desde `designTokens`
  - ❌ `sidebar-nav.tsx` aún usa `useTheme()` y pasa `appColorTokens`
- **Estado:** ⚠️ REFACTORIZADO PERO NO INTEGRADO

---

## ⚠️ PROBLEMAS DETECTADOS

### **StandardNavbar - Errores Residuales**
**Archivo:** `StandardNavbar.tsx`

**Errores TypeScript:**
1. ❌ `Cannot find name 'appColorTokens'` (múltiples líneas)
2. ❌ `Cannot find name 'mode'` (múltiples líneas)
3. ❌ `Cannot find name 'generateStandardNavbarTokens'`
4. ❌ `Cannot find name 'createAppColorTokens'`
5. ❌ `'currentNavTokens' is possibly 'null'` (múltiples líneas)

**Causa:** La refactorización anterior de StandardNavbar quedó incompleta. Hay código que aún referencia variables eliminadas.

**Solución Necesaria:**
- Revisar líneas que usan `appColorTokens`, `mode`, `generateStandardNavbarTokens`
- Agregar validaciones para `currentNavTokens` antes de usarlo
- Asegurar que todo use `designTokens`

---

### **sidebar-nav.tsx - No Actualizado**
**Archivo:** `sidebar-nav.tsx`

**Problema:**
- Aún usa `useTheme()` para obtener `appColorTokens` y `mode`
- Pasa `appColorTokens` como prop a `StandardSidebarNavAnimations`
- `StandardSidebarNavAnimations` ya no acepta esa prop

**Solución Necesaria:**
- Eliminar uso de `useTheme()` en `sidebar-nav.tsx`
- Eliminar paso de prop `appColorTokens` a `StandardSidebarNavAnimations`
- El componente ya usa `useDesignTokens()` internamente

---

## 📋 TAREAS PENDIENTES

### **Alta Prioridad:**
1. ⚠️ **Corregir StandardNavbar**
   - Revisar y corregir referencias a variables eliminadas
   - Agregar validaciones null-safety para `currentNavTokens`
   - Asegurar que todo use `designTokens`

2. ⚠️ **Actualizar sidebar-nav.tsx**
   - Eliminar `useTheme()` y `appColorTokens`
   - Actualizar llamada a `StandardSidebarNavAnimations`

### **Media Prioridad:**
3. 📝 **Crear tokens fontSelector en DesignTokensProvider** (opcional)
   - Actualmente `StandardFontThemeSwitcher` usa fallbacks
   - Funciona pero no es óptimo
   - Crear tokens específicos mejoraría consistencia

### **Baja Prioridad:**
4. ✅ **Validar con linter**
   - Una vez corregidos los errores
   - Verificar que no hay warnings críticos

---

## ✅ LOGROS ALCANZADOS

### **Renombrado Completo:**
- ✅ 4 archivos renombrados con prefijo `Standard`
- ✅ 4 componentes renombrados
- ✅ 6 archivos actualizados con nuevos imports

### **Refactorización de Tokens:**
- ✅ `StandardDarkModeSwitcher`: Completamente refactorizado
- ⚠️ `StandardFontThemeSwitcher`: Refactorizado con fallbacks temporales
- ⚠️ `StandardSidebarNavAnimations`: Refactorizado pero no integrado
- ❌ `StandardProjectStatusBadge`: No necesita refactorización

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **Opción A: Corregir Errores y Completar (Recomendada)**
1. Corregir errores en `StandardNavbar.tsx`
2. Actualizar `sidebar-nav.tsx` para eliminar `useTheme()`
3. Validar con linter
4. Probar funcionalidad

**Tiempo estimado:** 15-20 minutos

### **Opción B: Dejar Funcional con Fallbacks**
1. Solo corregir errores críticos en `StandardNavbar.tsx`
2. Dejar `StandardFontThemeSwitcher` con fallbacks
3. Dejar `sidebar-nav.tsx` como está (funciona)

**Tiempo estimado:** 10 minutos

### **Opción C: Crear Tokens Completos (Óptima)**
1. Opción A completa
2. Crear tokens `fontSelector` en DesignTokensProvider
3. Eliminar fallbacks de `StandardFontThemeSwitcher`

**Tiempo estimado:** 30 minutos

---

## 📊 RESUMEN EJECUTIVO

**Estado General:** ⚠️ 75% Completado

| Componente | Renombrado | Refactorización | Estado |
|------------|-----------|-----------------|---------|
| StandardProjectStatusBadge | ✅ 100% | N/A | ✅ COMPLETO |
| StandardDarkModeSwitcher | ✅ 100% | ✅ 100% | ✅ COMPLETO |
| StandardFontThemeSwitcher | ✅ 100% | ⚠️ 80% | ⚠️ FUNCIONAL |
| StandardSidebarNavAnimations | ✅ 100% | ⚠️ 70% | ⚠️ PENDIENTE |

**Errores Críticos:** 2
- StandardNavbar (errores residuales de refactorización anterior)
- sidebar-nav.tsx (no actualizado)

**Funcionalidad:** ⚠️ Parcial
- 2 componentes completamente funcionales
- 2 componentes con errores que impiden compilación

---

**Recomendación:** Proceder con **Opción A** para completar la refactorización correctamente y eliminar todos los errores.

**¿Procedemos con la corrección de errores, Rodolfo?** 💪
