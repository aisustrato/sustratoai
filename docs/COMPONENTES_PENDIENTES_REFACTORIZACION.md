# 📋 Componentes Standard* Pendientes de Refactorización

**Fecha:** 22 Mar 2026  
**Análisis:** Componentes que usan `useTheme()` en lugar de `useDesignTokens()`

---

## 🎯 OBJETIVO

Migrar componentes del sistema antiguo (`useTheme()` + generación de tokens inline) al sistema nuevo (`useDesignTokens()` con tokens precalculados).

---

## ✅ COMPONENTES YA REFACTORIZADOS (Confirmados)

1. ✅ **StandardButton** - Usa `useDesignTokens()`
2. ✅ **StandardCard** - Usa `useDesignTokens()`
3. ✅ **StandardInput** - Usa `useDesignTokens()`
4. ✅ **StandardTextarea** - Usa `useDesignTokens()`
5. ✅ **StandardSelect** - Usa `useDesignTokens()`
6. ✅ **StandardTooltip** - Usa `useDesignTokens()`
7. ✅ **StandardAlert** - Usa `useDesignTokens()`
8. ✅ **StandardBadge** - Usa `useDesignTokens()`
9. ✅ **StandardSlider** - Usa `useDesignTokens()`
10. ✅ **StandardDivider** - Usa `useDesignTokens()`
11. ✅ **StandardText** - Usa `useDesignTokens()`
12. ✅ **StandardIcon** / **StandardIconEnhanced** - Usa `useDesignTokens()`

---

## ⚠️ COMPONENTES PENDIENTES DE REFACTORIZACIÓN

### 🔴 PRIORIDAD ALTA (Tokens ya generados en DesignTokensProvider)

#### 1. **StandardNote** 
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardNote.tsx`
- **Complejidad:** ALTA (Editor markdown completo con toolbar, preview, scroll sync)
- **Usa:** `useTheme()` + `generateStandardNoteBetaTokens()`
- **Debe usar:** `useDesignTokens()` → `tokens.note`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider.generateAllNoteTokens()`
- **Comentario en código:** `// ⚠️ PENDIENTE MIGRACIÓN V4`

#### 2. **StandardDatePicker**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardDatePicker/StandardDatePicker.tsx`
- **Complejidad:** MEDIA (Integración con react-day-picker)
- **Usa:** `useTheme()` + `generateStandardDatePickerTokens()`
- **Debe usar:** `useDesignTokens()` → `tokens.datePicker`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

#### 3. **StandardFileUpload**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardFileUpload.tsx`
- **Complejidad:** MEDIA (Drag & drop, validación, preview)
- **Usa:** `useTheme()` + generación inline
- **Debe usar:** `useDesignTokens()` → `tokens.fileUpload`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

#### 4. **StandardStepper**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardStepper.tsx`
- **Complejidad:** MEDIA (Estados, animaciones)
- **Usa:** `useTheme()` + generación inline
- **Debe usar:** `useDesignTokens()` → `tokens.stepper`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

#### 5. **StandardAccordion**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardAccordion/StandardAccordion.tsx`
- **Complejidad:** MEDIA (Radix UI, contexto)
- **Usa:** `useTheme()` + `generateStandardAccordionTokens()`
- **Debe usar:** `useDesignTokens()` → `tokens.accordion`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

---

### 🟡 PRIORIDAD MEDIA (Componentes complejos)

#### 6. **StandardTable**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardTable.tsx`
- **Complejidad:** ALTA (TanStack Table, sorting, filtering, pagination)
- **Usa:** `useTheme()` + `generateTableTokens()`
- **Debe usar:** `useDesignTokens()` → `tokens.table`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

#### 7. **StandardPopupWindow**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardPopupWindow.tsx`
- **Complejidad:** MEDIA (Radix Dialog)
- **Usa:** `useTheme()` + `generateDialogTokens()`
- **Debe usar:** `useDesignTokens()` → `tokens.dialog`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

#### 8. **StandardNavbar**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardNavbar.tsx`
- **Complejidad:** ALTA (Navegación compleja, responsive)
- **Usa:** `useTheme()` + `generateStandardNavbarTokens()`
- **Debe usar:** `useDesignTokens()` → `tokens.navbar`
- **Tokens disponibles:** ✅ Ya están en `DesignTokensProvider`

---

### 🟢 PRIORIDAD BAJA (Componentes especializados)

#### 9. **StandardSphere** / **StandardSphereGrid**
- **Estado:** Tokens generados, componente NO refactorizado
- **Archivo:** `/components/ui/StandardSphere.tsx`, `/components/ui/StandardSphereGrid.tsx`
- **Complejidad:** ALTA (Visualización 3D, física, animaciones)
- **Usa:** `useTheme()` + generación inline
- **Debe usar:** `useDesignTokens()` → `tokens.sphere`
- **Tokens disponibles:** ⚠️ Verificar si están en `DesignTokensProvider`

#### 10. **StandardProgressBar**
- **Estado:** Componente funcional, refactor menor pendiente
- **Archivo:** `/components/ui/StandardProgressBar.tsx`
- **Complejidad:** BAJA
- **Nota:** `// TODO: Considerar refactorizar a StandardText en el futuro`
- **Prioridad:** Muy baja (solo mejora cosmética)

---

## 📊 RESUMEN

### Por Estado:
- ✅ **Refactorizados:** 12 componentes
- ⚠️ **Pendientes:** 10 componentes

### Por Prioridad:
- 🔴 **Alta:** 5 componentes (Note, DatePicker, FileUpload, Stepper, Accordion)
- 🟡 **Media:** 3 componentes (Table, PopupWindow, Navbar)
- 🟢 **Baja:** 2 componentes (Sphere/SphereGrid, ProgressBar)

### Por Complejidad:
- **ALTA:** 4 componentes (Note, Table, Navbar, Sphere)
- **MEDIA:** 5 componentes (DatePicker, FileUpload, Stepper, Accordion, PopupWindow)
- **BAJA:** 1 componente (ProgressBar)

---

## 🎯 PLAN DE REFACTORIZACIÓN RECOMENDADO

### Fase 1: Componentes de Formulario (Prioridad Alta)
1. **StandardDatePicker** - Complejidad Media, muy usado
2. **StandardFileUpload** - Complejidad Media, muy usado
3. **StandardStepper** - Complejidad Media, usado en wizards

### Fase 2: Componentes de Contenido (Prioridad Alta)
4. **StandardAccordion** - Complejidad Media, muy usado
5. **StandardNote** - Complejidad Alta, pero tokens listos

### Fase 3: Componentes de Layout (Prioridad Media)
6. **StandardPopupWindow** - Complejidad Media, muy usado
7. **StandardNavbar** - Complejidad Alta, crítico pero estable

### Fase 4: Componentes de Datos (Prioridad Media)
8. **StandardTable** - Complejidad Alta, pero muy estable

### Fase 5: Componentes Especializados (Prioridad Baja)
9. **StandardSphere** / **StandardSphereGrid** - Complejidad Alta, poco usado
10. **StandardProgressBar** - Complejidad Baja, mejora cosmética

---

## 🔧 PATRÓN DE REFACTORIZACIÓN

### Antes (Sistema Antiguo):
```typescript
import { useTheme } from "@/app/theme-provider";
import { generateStandardXTokens } from "@/lib/theme/components/standard-x-tokens";

const MyComponent = () => {
  const { appColorTokens, mode } = useTheme();
  const tokens = useMemo(() => 
    generateStandardXTokens(appColorTokens, mode),
    [appColorTokens, mode]
  );
  
  // Usar tokens...
};
```

### Después (Sistema Nuevo):
```typescript
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";

const MyComponent = () => {
  const { tokens } = useDesignTokens();
  
  // Usar tokens.x directamente (ya precalculados)
};
```

### Beneficios:
- ✅ **Performance:** Tokens precalculados una sola vez
- ✅ **Simplicidad:** Menos código, menos imports
- ✅ **Consistencia:** Todos los componentes usan el mismo patrón
- ✅ **Mantenibilidad:** Cambios centralizados en `DesignTokensProvider`

---

## 📝 NOTAS IMPORTANTES

1. **Todos los tokens ya están generados** en `DesignTokensProvider` para los componentes de prioridad alta
2. **No hay breaking changes** - La API pública de los componentes se mantiene igual
3. **Solo cambia la implementación interna** - De `useTheme()` a `useDesignTokens()`
4. **Los componentes .old.tsx y .backup.tsx** pueden ignorarse (son versiones antiguas)

---

**¿Por dónde empezamos, Rodolfo?** 💪

Recomiendo empezar con **StandardDatePicker** o **StandardFileUpload** (complejidad media, muy usados).
