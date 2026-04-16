# Implementación: Sistema de Menús Condicionales por Proyecto

**Fecha:** 2 Abril 2026  
**Estado:** ✅ Ruta de análisis agregada | 📋 Plan de refactorización completo

---

## ✅ Parte 1: Ruta de Análisis Agregada (COMPLETADO)

### **Cambios Realizados**

**Archivo:** `@/components/ui/StandardNavbar.tsx`

1. **Importación del icono:**
   ```typescript
   import { BarChart3 } from "lucide-react"; // Línea 33
   ```

2. **Nueva ruta en submenú de Artículos:**
   ```typescript
   {
     label: "Análisis de Preclasificación",
     href: "/articulos/analisis-preclasificacion",
     icon: () => createMenuIcon(BarChart3),
   }
   ```

### **Resultado**

El menú de Artículos ahora incluye:
- Preclasificación
- **Análisis de Preclasificación** ← NUEVO
- Grupos
- Notas

---

## 📋 Parte 2: Sistema de Menús Condicionales (PLANIFICADO)

### **Objetivo**

Hacer que el menú "Cognética" (y otros) sea condicional según **datos reales del proyecto**, no solo un campo booleano.

**Ejemplo:**
- ❌ **Antes:** `if (proyectoActual.module_cognetica)` → Solo verifica booleano
- ✅ **Después:** `if (módulo habilitado Y configurado)` → Verifica datos reales

---

## 🏗️ Arquitectura Propuesta

### **Tabla: `project_module_config`**

```sql
CREATE TABLE project_module_config (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  module_name TEXT CHECK (module_name IN (
    'bibliography', 'cognetica', 'interviews', 
    'planning', 'minotauro', 'jardines'
  )),
  
  is_enabled BOOLEAN DEFAULT false,      -- ¿Está habilitado?
  is_configured BOOLEAN DEFAULT false,   -- ¿Tiene configuración necesaria?
  config_data JSONB DEFAULT '{}',        -- Configuración específica
  
  configured_at TIMESTAMPTZ,
  configured_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, module_name)
);
```

### **Criterios de Configuración por Módulo**

| Módulo | `is_configured = true` cuando... |
|--------|----------------------------------|
| **bibliography** | Proyecto tiene dimensiones de preclasificación (`preclass_dimensions`) |
| **cognetica** | Proyecto tiene artefactos cogneticos (`cog_artifacts`) |
| **interviews** | TBD (por definir con usuario) |
| **planning** | TBD (por definir con usuario) |
| **minotauro** | TBD (por definir con usuario) |
| **jardines** | TBD (por definir con usuario) |

---

## 🔄 Flujo de Implementación

### **1. Backend: Migración SQL** ✅ CREADA

**Archivo:** `@/supabase/migrations/20260402_create_project_module_config.sql`

**Incluye:**
- Creación de tabla `project_module_config`
- Índices para performance
- Triggers para `updated_at`
- Funciones helper:
  - `is_module_configured(project_id, module_name)`
  - `get_project_modules_config(project_id)`
- Migración de datos existentes desde `projects.module_*`
- RLS (Row Level Security)

### **2. Backend: Actualizar Actions**

**Archivo:** `@/lib/actions/project-dashboard-actions.ts`

**Cambios necesarios:**

```typescript
// 1. Actualizar tipo UserProjectSetting
export interface UserProjectSetting extends Project {
  project_role_id: string;
  ui_theme: string | null;
  ui_font_pair: string | null;
  ui_is_dark_mode: boolean | null;
  is_active_for_user: boolean;
  contextual_notes?: string | null;
  contact_email_for_project?: string | null;
  permissions?: RolePermissions | null;
  
  // ✅ NUEVO: Configuración de módulos
  module_configs?: {
    [key: string]: {
      is_enabled: boolean;
      is_configured: boolean;
      config_data?: any;
    };
  };
}

// 2. Actualizar obtenerProyectosConSettingsUsuario()
export async function obtenerProyectosConSettingsUsuario(
  userId: string
): Promise<ResultadoOperacion<UserProjectSetting[]>> {
  // ... código existente ...
  
  const { data, error } = await supabase
    .from('user_project_settings')
    .select(`
      *,
      projects!inner (
        *,
        module_configs:project_module_config (
          module_name,
          is_enabled,
          is_configured,
          config_data
        )
      )
    `)
    .eq('user_id', userId);
  
  // Transformar module_configs de array a objeto
  const projectsWithConfigs = data.map(project => ({
    ...project,
    module_configs: project.projects.module_configs.reduce(
      (acc, config) => ({
        ...acc,
        [config.module_name]: {
          is_enabled: config.is_enabled,
          is_configured: config.is_configured,
          config_data: config.config_data,
        },
      }),
      {}
    ),
  }));
  
  return { success: true, data: projectsWithConfigs };
}
```

### **3. Frontend: Actualizar StandardNavbar**

**Archivo:** `@/components/ui/StandardNavbar.tsx`

**Cambios necesarios:**

```typescript
// ANTES
if (proyectoActual.module_bibliography) {
  menuItems.push({
    id: "articulos",
    label: "Artículos",
    // ...
  });
}

// DESPUÉS
const bibliographyConfig = proyectoActual.module_configs?.bibliography;
if (bibliographyConfig?.is_enabled && bibliographyConfig?.is_configured) {
  menuItems.push({
    id: "articulos",
    label: "Artículos",
    // ...
  });
}

// ANTES
if (proyectoActual.module_cognetica) {
  menuItems.push({
    id: "cognetica",
    label: "Cognética",
    // ...
  });
}

// DESPUÉS
const cogneticaConfig = proyectoActual.module_configs?.cognetica;
if (cogneticaConfig?.is_enabled && cogneticaConfig?.is_configured) {
  menuItems.push({
    id: "cognetica",
    label: "Cognética",
    // ...
  });
}
```

### **4. Funciones Helper para Configuración**

**Archivo:** `@/lib/actions/module-config-actions.ts` (NUEVO)

```typescript
"use server";

import { createSupabaseServerClient } from "@/lib/server";

/**
 * Marca un módulo como configurado
 */
export async function markModuleAsConfigured(
  projectId: string,
  moduleName: string,
  configData?: any
) {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from('project_module_config')
    .upsert({
      project_id: projectId,
      module_name: moduleName,
      is_configured: true,
      configured_at: new Date().toISOString(),
      configured_by: (await supabase.auth.getUser()).data.user?.id,
      config_data: configData || {},
    });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Verifica si un módulo está configurado
 */
export async function isModuleConfigured(
  projectId: string,
  moduleName: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  
  const { data } = await supabase.rpc('is_module_configured', {
    p_project_id: projectId,
    p_module_name: moduleName,
  });
  
  return data || false;
}

/**
 * Obtiene toda la configuración de módulos de un proyecto
 */
export async function getProjectModulesConfig(projectId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.rpc('get_project_modules_config', {
    p_project_id: projectId,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}
```

---

## 🎯 Beneficios del Sistema

### **1. Precisión**
- Menús solo aparecen cuando realmente hay datos configurados
- No más menús vacíos o sin funcionalidad

### **2. Escalabilidad**
- Fácil agregar nuevos módulos sin modificar tabla `projects`
- Configuración flexible por módulo (JSONB)

### **3. Auditoría**
- Se registra quién y cuándo configuró cada módulo
- Histórico de cambios con `updated_at`

### **4. Performance**
- Índices optimizados para queries frecuentes
- Una sola query trae toda la configuración

### **5. Seguridad**
- RLS garantiza que solo miembros del proyecto vean configuración
- Solo usuarios con permisos pueden modificar

---

## 📝 Checklist de Implementación

### **Backend**
- [x] Crear migración SQL
- [ ] Ejecutar migración en Supabase
- [ ] Crear `module-config-actions.ts`
- [ ] Actualizar `project-dashboard-actions.ts`
- [ ] Probar funciones RPC

### **Frontend**
- [ ] Actualizar tipo `UserProjectSetting`
- [ ] Modificar `obtenerProyectosConSettingsUsuario()`
- [ ] Actualizar lógica en `StandardNavbar.tsx`
- [ ] Probar carga de menús condicionales

### **Testing**
- [ ] Proyecto sin módulos configurados → No debe mostrar menús
- [ ] Proyecto con módulo habilitado pero sin configurar → No debe mostrar menú
- [ ] Proyecto con módulo habilitado y configurado → Debe mostrar menú
- [ ] Cambiar configuración → Menú debe actualizarse

### **Documentación**
- [x] Documentar arquitectura
- [x] Documentar criterios de configuración
- [ ] Actualizar README del proyecto
- [ ] Crear guía para agregar nuevos módulos

---

## 🚀 Próximos Pasos

1. **Definir con el usuario:**
   - ¿Qué determina que Cognética esté "configurada"?
   - ¿Qué otros módulos necesitan este sistema?

2. **Ejecutar migración:**
   ```bash
   # En Supabase Dashboard → SQL Editor
   # Ejecutar: 20260402_create_project_module_config.sql
   ```

3. **Implementar cambios en código:**
   - Crear `module-config-actions.ts`
   - Actualizar `project-dashboard-actions.ts`
   - Modificar `StandardNavbar.tsx`

4. **Testing exhaustivo:**
   - Verificar todos los escenarios
   - Probar con múltiples proyectos

---

## 📚 Referencias

- **Plan completo:** `@/docs/PLAN_REFACTORIZACION_MENUS_CONDICIONALES.md`
- **Migración SQL:** `@/supabase/migrations/20260402_create_project_module_config.sql`
- **Navbar actual:** `@/components/ui/StandardNavbar.tsx`
- **Auth provider:** `@/app/auth-provider.tsx`

---

## 💡 Notas Importantes

### **Compatibilidad hacia atrás**

Los campos `module_*` en la tabla `projects` se mantienen por compatibilidad, pero la fuente de verdad será `project_module_config`.

### **Migración gradual**

Se puede implementar módulo por módulo:
1. Primero: Cognética (caso de uso principal)
2. Luego: Bibliography (mejorar lógica actual)
3. Finalmente: Otros módulos según necesidad

### **Fallback**

Si `module_configs` no está disponible, el sistema puede hacer fallback a los campos booleanos de `projects` para evitar romper funcionalidad existente.

```typescript
// Lógica con fallback
const isCogneticaAvailable = 
  proyectoActual.module_configs?.cognetica?.is_enabled && 
  proyectoActual.module_configs?.cognetica?.is_configured ||
  proyectoActual.module_cognetica; // Fallback
```
