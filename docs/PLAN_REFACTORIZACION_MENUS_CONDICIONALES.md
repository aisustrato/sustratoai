# Plan de Refactorización: Menús Condicionales por Proyecto

**Fecha:** 2 Abril 2026  
**Objetivo:** Hacer que el menú "Cognética" (y potencialmente otros) sea condicional según la configuración del proyecto, similar a cómo funciona "Preclasificación".

---

## 🎯 Contexto

### **Situación Actual**

El sistema tiene dos tipos de menús condicionales:

1. **Basados en campos booleanos de `projects`** (✅ Funcionando):
   - `module_bibliography` → Muestra menú "Artículos"
   - `module_cognetica` → Muestra menú "Cognética"

2. **Basados en datos relacionados** (✅ Funcionando):
   - Preclasificación: Solo aparece si el proyecto tiene dimensiones de preclasificación configuradas

### **Problema Identificado**

El usuario quiere que "Cognética" funcione como "Preclasificación": **condicional según datos reales del proyecto**, no solo un booleano en la tabla `projects`.

---

## 📊 Análisis de Estructura Actual

### **Menú "Artículos" (module_bibliography)**

```typescript
// En StandardNavbar.tsx línea 382
if (proyectoActual.module_bibliography) {
  menuItems.push({
    id: "articulos",
    label: "Artículos",
    href: "/articulos",
    icon: () => createMenuIcon(BookOpen),
    submenu: [
      { label: "Preclasificación", href: "/articulos/preclasificacion" },
      { label: "Análisis de Preclasificación", href: "/articulos/analisis-preclasificacion" },
      { label: "Grupos", href: "/articulos/grupos" },
      { label: "Notas", href: "/articulos/notas" },
    ],
  });
}
```

**Lógica:** Campo booleano `module_bibliography` en tabla `projects`

### **Menú "Cognética" (module_cognetica)**

```typescript
// En StandardNavbar.tsx línea 414
if (proyectoActual.module_cognetica) {
  menuItems.push({
    id: "cognetica",
    label: "Cognética",
    href: "/cognetica",
    icon: (isActive) => createMenuIcon(Fingerprint, isActive),
    submenu: [
      { label: "Dashboard", href: "/cognetica" },
      { label: "Nuevo Artefacto", href: "/cognetica/nuevo" },
    ],
  });
}
```

**Lógica:** Campo booleano `module_cognetica` en tabla `projects`

### **Menú "Preclasificación" (condicional por datos)**

La preclasificación aparece dentro del menú "Artículos" solo si:
- `module_bibliography = true` (habilita el menú padre)
- El proyecto tiene dimensiones de preclasificación configuradas en la BD

**Pregunta clave:** ¿Cómo se verifica si hay dimensiones de preclasificación?

---

## 🔍 Investigación Necesaria

### **1. ¿Cómo funciona la condicionalidad de Preclasificación?**

Necesitamos revisar:
- ¿Se verifica en el frontend al cargar el menú?
- ¿Hay un campo adicional en `proyectoActual` que indica si hay dimensiones?
- ¿Se hace una query adicional para verificar?

**Archivos a revisar:**
- `@/app/auth-provider.tsx` - Para ver qué datos trae `proyectoActual`
- `@/lib/actions/preclassification-actions.ts` - Para ver queries de dimensiones
- Tabla `preclass_dimensions` en la BD

### **2. ¿Qué datos determinan si Cognética debe estar activa?**

Opciones posibles:
- Existencia de artefactos cogneticos en el proyecto
- Configuración específica de Cognética (similar a dimensiones)
- Tabla de configuración de módulos por proyecto

---

## 🏗️ Propuesta de Arquitectura

### **Opción A: Sistema de Verificación en Frontend (Recomendada)**

Similar a como probablemente funciona Preclasificación:

1. **En `auth-provider.tsx`:**
   - Al cargar `proyectoActual`, hacer queries adicionales para verificar:
     - ¿Tiene dimensiones de preclasificación? → `has_preclassification_setup`
     - ¿Tiene configuración de Cognética? → `has_cognetica_setup`
     - Etc.

2. **En `StandardNavbar.tsx`:**
   ```typescript
   // En lugar de solo verificar el booleano
   if (proyectoActual.module_cognetica && proyectoActual.has_cognetica_setup) {
     // Mostrar menú Cognética
   }
   ```

**Ventajas:**
- No requiere cambios en BD
- Flexible y fácil de mantener
- Queries adicionales solo al cargar proyecto

**Desventajas:**
- Queries adicionales al login/cambio de proyecto

### **Opción B: Tabla de Configuración de Módulos (Más Robusta)**

Crear una tabla `project_module_config`:

```sql
CREATE TABLE project_module_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- 'bibliography', 'cognetica', etc.
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false, -- ¿Tiene datos/setup necesario?
  config_data JSONB, -- Configuración específica del módulo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, module_name)
);
```

**Ventajas:**
- Centraliza toda la configuración de módulos
- Escalable para futuros módulos
- Permite configuración granular por módulo
- Auditable (created_at, updated_at)

**Desventajas:**
- Requiere migración de datos existentes
- Más complejo de implementar inicialmente

### **Opción C: Campos Adicionales en `projects` (Más Simple)**

Agregar campos `has_*_setup` a la tabla `projects`:

```sql
ALTER TABLE projects
ADD COLUMN has_preclassification_setup BOOLEAN DEFAULT false,
ADD COLUMN has_cognetica_setup BOOLEAN DEFAULT false;
```

**Ventajas:**
- Cambio mínimo en BD
- Fácil de implementar
- No requiere joins adicionales

**Desventajas:**
- Tabla `projects` crece con cada módulo nuevo
- Menos flexible para configuración compleja

---

## 📋 Plan de Implementación Recomendado

### **Fase 1: Investigación (1-2 horas)**

1. ✅ **Revisar cómo funciona actualmente Preclasificación**
   - Buscar en `auth-provider.tsx` cómo se carga `proyectoActual`
   - Verificar si hay campos adicionales para verificar setup
   - Documentar el patrón actual

2. **Definir criterios para "Cognética configurada"**
   - ¿Qué debe existir en BD para considerar Cognética activa?
   - ¿Tabla de configuración? ¿Artefactos existentes? ¿Otro?

### **Fase 2: Diseño (30 min - 1 hora)**

1. **Elegir arquitectura** (A, B o C según hallazgos de Fase 1)
2. **Diseñar esquema de BD** (si aplica)
3. **Planificar cambios en código**

### **Fase 3: Implementación Backend (1-2 horas)**

1. **Crear migración SQL** (si se elige Opción B o C)
2. **Crear/actualizar funciones de verificación**
   - `hasPreclassificationSetup(projectId)`
   - `hasCogneticaSetup(projectId)`
3. **Actualizar `auth-provider.tsx`** para incluir flags de setup

### **Fase 4: Implementación Frontend (30 min - 1 hora)**

1. **Actualizar `StandardNavbar.tsx`**
   - Cambiar lógica de `module_cognetica` a verificar también setup
2. **Actualizar tipos TypeScript**
   - Agregar campos de setup a tipo `Project`

### **Fase 5: Testing y Documentación (1 hora)**

1. **Probar escenarios:**
   - Proyecto con módulo habilitado pero sin configurar
   - Proyecto con módulo habilitado y configurado
   - Proyecto sin módulo habilitado
2. **Documentar sistema de menús condicionales**

---

## 🚀 Próximos Pasos Inmediatos

1. **Revisar `auth-provider.tsx`** para entender cómo se carga `proyectoActual`
2. **Buscar referencias a "preclassification" en el código** para ver el patrón actual
3. **Definir con el usuario:** ¿Qué determina que Cognética esté "configurada"?

---

## 📁 Archivos Clave a Modificar

- ✅ `/components/ui/StandardNavbar.tsx` - Lógica de menús condicionales
- `/app/auth-provider.tsx` - Carga de datos del proyecto
- `/lib/types/*.ts` - Tipos de proyecto
- `/supabase/migrations/*.sql` - Nueva migración (si aplica)
- `/lib/actions/*-actions.ts` - Funciones de verificación de setup

---

## 💡 Consideraciones Adicionales

### **Escalabilidad**

Si en el futuro se agregan más módulos (Minotauro, Jardines, etc.), el sistema debe:
- Ser fácil de extender
- No requerir cambios masivos en múltiples archivos
- Mantener consistencia en la lógica

### **Performance**

- Las verificaciones de setup no deben ralentizar la carga del navbar
- Considerar cacheo de flags de setup
- Queries eficientes (evitar N+1)

### **UX**

- Si un módulo está habilitado pero no configurado, ¿qué mostrar?
  - Opción 1: No mostrar el menú (comportamiento actual propuesto)
  - Opción 2: Mostrar menú con mensaje "Configurar módulo"
  - Opción 3: Mostrar menú pero deshabilitar opciones

---

## ✅ Estado Actual

- [x] Ruta "Análisis de Preclasificación" agregada al menú Artículos
- [ ] Investigación de patrón actual de Preclasificación
- [ ] Diseño de arquitectura para menús condicionales
- [ ] Implementación de cambios en BD
- [ ] Implementación de cambios en código
- [ ] Testing y documentación
