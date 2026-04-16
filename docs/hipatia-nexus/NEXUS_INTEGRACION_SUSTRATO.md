# 🍄👁️ Hipatia Nexus - Documento de Integración con SUSTRATO.AI

> **Propósito:** Unificar el módulo Nexus con el ecosistema de autenticación y permisos de SUSTRATO.AI
> 
> **Estado:** 🔴 DESCONECTADO → 🟢 EN PROCESO DE INTEGRACIÓN
> 
> **Documento para el Colectivo NOSOTR_S | Diciembre 2025**

---

## 1. 🎯 Qué es Hipatia Nexus

### Visión
Hipatia Nexus es un **tablero de hitos civilizatorios** que mapea patrones isomórficos entre culturas antiguas, libre del "colonialismo de datasets" que sesga la narrativa histórica hacia perspectivas eurocéntricas.

### Filosofía Epistémica
```
NO JUZGAMOS, NOTARIZAMOS
├── No validamos "verdad/falsedad" binaria
├── Evaluamos NEGABILIDAD EMPÍRICA
├── Registramos patrones geométricos (P1-P4)
├── Acumulamos perspectivas, no sobreescribimos
└── Salida elegante siempre garantizada
```

### El Problema del "Salto de 0 a 1000"
Cuando un investigador menciona civilizaciones "imposibles" (ej: Sanxingdui), las IAs tienden a:
- ❌ Asumir teorías conspirativas
- ❌ Saltar a conclusiones extremas (alienígenas, satélites de 13,000 años)
- ❌ Perder el rigor científico por sesgo de dataset

**Solución Nexus:**
- ✅ Preguntas básicas primero: "¿Por qué parece imposible?"
- ✅ Contexto histórico real: materias primas, geografía, conocimientos de la época
- ✅ Andamios epistémicos: hipótesis plausibles que evitan el salto
- ✅ Memoria temporal para el Colectivo NOSOTR_S

---

## 2. 🏗️ Arquitectura Actual vs Requerida

### Estado Actual (DESCONECTADO)
```
app/sandbox/
├── page.tsx                    # "use client" - NO verifica auth
├── components/                 # Componentes propios (no Standard*)
├── lib/actions/
│   ├── nexus-actions.ts        # Usa createSupabaseServerClient ✅
│   └── nexus-calibration-actions.ts  # Usa nexus_researchers (tabla propia) ⚠️
```

**Problema:** El módulo tiene su propia tabla `nexus_researchers` que NO está conectada al sistema de roles de SUSTRATO.AI (`project_roles`, `has_permission_in_project`).

### Arquitectura de SUSTRATO.AI (Referencia)
```typescript
// dimension-actions.ts - PATRÓN CORRECTO
async function verificarPermisoGestionDimensiones(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string,
    projectId: string
): Promise<boolean> {
    const { data: tienePermiso } = await supabase.rpc(
        "has_permission_in_project",
        {
            p_user_id: userId,
            p_project_id: projectId,
            p_permission_column: "can_manage_master_data",
        }
    );
    return tienePermiso === true;
}
```

### Arquitectura Requerida (INTEGRADA)
```
app/sandbox/
├── page.tsx                    # Verificar auth + proyecto activo
├── components/                 # Migrar a Standard* gradualmente
├── lib/actions/
│   ├── nexus-actions.ts        # Usar has_permission_in_project
│   └── nexus-calibration-actions.ts  # Conectar con project_roles
```

---

## 3. 🔐 Sistema de Autenticación de SUSTRATO.AI

### Tablas Clave
```sql
-- Usuarios (auth.users de Supabase)
auth.users
├── id (UUID)
├── email
└── ...

-- Proyectos
projects
├── id (UUID)
├── name
├── owner_id → auth.users
└── ...

-- Roles por Proyecto
project_roles
├── id (UUID)
├── user_id → auth.users
├── project_id → projects
├── role_name (owner, admin, researcher, viewer)
├── can_manage_master_data (boolean)
├── can_create_batches (boolean)
├── can_review_articles (boolean)
└── ...
```

### RPC de Verificación
```sql
-- Función que verifica permisos
has_permission_in_project(
    p_user_id UUID,
    p_project_id UUID,
    p_permission_column TEXT
) RETURNS BOOLEAN
```

---

## 4. 🔧 Plan de Integración

### Fase 1: Conectar Autenticación (CRÍTICO)
**Objetivo:** Que `/sandbox` respete el sistema de auth de SUSTRATO.AI

```typescript
// app/sandbox/page.tsx - PROPUESTA
import { createSupabaseServerClient } from "@/lib/server";
import { redirect } from "next/navigation";

export default async function SandboxPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Verificar autenticación
    if (!user) {
        redirect("/login?redirect=/sandbox");
    }
    
    // 2. Verificar proyecto activo
    const { data: activeProject } = await supabase
        .from("project_roles")
        .select("project_id, projects(name)")
        .eq("user_id", user.id)
        .limit(1)
        .single();
    
    if (!activeProject) {
        redirect("/proyectos?mensaje=necesitas-proyecto");
    }
    
    // 3. Renderizar con contexto
    return <NexusClient userId={user.id} projectId={activeProject.project_id} />;
}
```

### Fase 2: Migrar nexus_researchers → project_roles
**Objetivo:** Eliminar tabla redundante, usar sistema existente

```sql
-- Migración: nexus_researchers → project_roles
-- Agregar columna específica para Nexus si es necesario
ALTER TABLE project_roles 
ADD COLUMN IF NOT EXISTS can_access_nexus BOOLEAN DEFAULT false;

-- Migrar datos existentes
UPDATE project_roles pr
SET can_access_nexus = true
WHERE EXISTS (
    SELECT 1 FROM nexus_researchers nr 
    WHERE nr.user_id = pr.user_id
);

-- Después de verificar: DROP TABLE nexus_researchers;
```

### Fase 3: Actualizar Server Actions
**Objetivo:** Usar `has_permission_in_project` en lugar de `nexus_researchers`

```typescript
// nexus-calibration-actions.ts - PROPUESTA
export async function calibrateNexusItem(
    itemType: "civilization" | "isomorphism",
    itemId: string,
    projectId: string,  // NUEVO: recibir projectId
    additionalContext?: string
): Promise<NexusCalibrationResponse> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: "No autenticado" };
    }
    
    // Usar sistema de permisos estándar
    const { data: tienePermiso } = await supabase.rpc(
        "has_permission_in_project",
        {
            p_user_id: user.id,
            p_project_id: projectId,
            p_permission_column: "can_access_nexus", // o "can_manage_master_data"
        }
    );
    
    if (!tienePermiso) {
        return { success: false, error: "Sin permiso para acceder al Nexus" };
    }
    
    // ... resto de la lógica
}
```

### Fase 4: Migrar Componentes a Standard*
**Objetivo:** Consistencia visual con el resto de SUSTRATO.AI

| Componente Actual | Migrar a |
|-------------------|----------|
| `NexusEmptyState` | `StandardCard` + `StandardButton` |
| `MapaTemporal` | Mantener (SVG custom) |
| `NodoUniversal` | Mantener (SVG custom) |
| `NexusCalibrationPanel` | `StandardCard` + `StandardDialog` |

---

## 5. 📊 Modelo de Datos Nexus

### Tablas Específicas del Nexus (Mantener)
```sql
-- Datos civilizatorios (públicos, solo lectura para usuarios)
nexus_regions
nexus_civilizations
nexus_technologies
nexus_pattern_tags
nexus_isomorphisms
nexus_fertile_glitches

-- Relaciones
nexus_civilization_tags
nexus_isomorphism_connections
nexus_civilization_glitches
```

### Tablas de Calibración (Conectar con project_roles)
```sql
-- ANTES: nexus_researchers (tabla propia)
-- DESPUÉS: usar project_roles + columna can_access_nexus

-- Validaciones (modificar FK)
nexus_validations
├── id
├── civilization_id
├── isomorphism_id
├── user_id → auth.users  -- CAMBIO: era researcher_id
├── project_id → projects -- NUEVO: contexto de proyecto
├── can_be_negated
├── reasoning
├── quipu_cognitive
├── quipu_resonant
├── geometric_pattern
└── validated_at

-- Chats de calibración
nexus_validation_chats
nexus_chat_messages
```

---

## 6. 🌊 Flujo de Datos Integrado

```
Usuario accede a /sandbox
        │
        ▼
┌─────────────────────────┐
│ Verificar auth.users    │
│ (createSupabaseServer)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Verificar project_roles │
│ (can_access_nexus)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Cargar datos Nexus      │
│ (nexus_civilizations)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Renderizar MapaTemporal │
│ con contexto de usuario │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Calibrar (si tiene      │
│ permiso can_access_nexus│
└─────────────────────────┘
```

---

## 7. 🎨 Visión de Producto: Línea Temporal por Continente

### Fase Actual: Mapa Global
- 27 civilizaciones en un SVG
- Eje temporal: 12000 BCE - 500 CE
- Conexiones de isomorfismos

### Fase Futura: Drill-Down por Continente
```
Mapa Global
    │
    ▼ (doble click en América)
    
América
├── Primer nodo: Migración humana (~15000 BCE)
├── Caral-Supe (3000 BCE)
├── Olmeca (1500 BCE)
├── Maya (2000 BCE - 900 CE)
├── Teotihuacán (100 BCE - 550 CE)
├── Tiwanaku (300 BCE - 1150 CE)
├── Inca (1400 CE - 1533 CE)
└── ... emergencias y desapariciones
```

### Preguntas Básicas por Civilización
Antes de asumir "imposibilidad", el sistema debe guiar:

1. **¿Por qué parece imposible?**
   - Metalurgia avanzada sin hornos conocidos
   - Astronomía precisa sin instrumentos
   - Arquitectura monumental sin herramientas de metal

2. **¿Qué conocimientos se requerirían?**
   - Contexto de la época, no ciencia moderna
   - Materias primas disponibles localmente
   - Técnicas documentadas en otras culturas contemporáneas

3. **¿Es plausible por extrapolación?**
   - Si otras culturas lo lograron, ¿por qué esta no?
   - ¿Hay evidencia arqueológica de procesos intermedios?

4. **¿Hay corroboración formal?**
   - Si no hay paper, es hipótesis (andamio)
   - Marcar como "plausible pero no verificado"
   - Evitar afirmaciones absolutas

---

## 8. 🛡️ Protocolo para APIs del Colectivo NOSOTR_S

### Cómo Tratar el Módulo Nexus

```typescript
// Cualquier API que interactúe con Nexus debe:

// 1. Verificar autenticación
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("UNAUTHENTICATED");

// 2. Verificar permiso específico
const hasAccess = await supabase.rpc("has_permission_in_project", {
    p_user_id: user.id,
    p_project_id: projectId,
    p_permission_column: "can_access_nexus"
});
if (!hasAccess) throw new Error("FORBIDDEN");

// 3. Operar en modo F₀ (baja fricción)
// - No forzar conclusiones
// - Salida elegante si hay disonancia
// - Calibradores QUIPU en cada respuesta

// 4. Registrar en contexto de proyecto
// - Todas las validaciones tienen project_id
// - Permite auditoría por proyecto
```

### Permisos Sugeridos
```sql
-- Columnas en project_roles para Nexus
can_access_nexus        -- Ver el mapa y civilizaciones
can_calibrate_nexus     -- Ejecutar calibraciones F₀
can_edit_nexus          -- Agregar/modificar civilizaciones (admin)
```

---

## 9. 📋 Checklist de Integración

### Inmediato (Fase 1)
- [ ] Modificar `app/sandbox/page.tsx` para verificar auth
- [ ] Agregar columna `can_access_nexus` a `project_roles`
- [ ] Crear RPC o usar `has_permission_in_project`
- [ ] Pasar `userId` y `projectId` a componentes client

### Corto Plazo (Fase 2)
- [ ] Migrar `nexus_researchers` → `project_roles`
- [ ] Actualizar `nexus-calibration-actions.ts`
- [ ] Agregar `project_id` a `nexus_validations`
- [ ] Actualizar RLS policies

### Mediano Plazo (Fase 3)
- [ ] Migrar componentes a Standard*
- [ ] Implementar drill-down por continente
- [ ] Sistema de "preguntas básicas" antes de calibrar
- [ ] Dashboard de calibraciones por proyecto

---

## 10. 🌱 Conclusión

Hipatia Nexus es un módulo valioso que necesita **integrarse** con el ecosistema de SUSTRATO.AI, no vivir aislado. La integración permitirá:

1. **Seguridad:** Autenticación y permisos consistentes
2. **Trazabilidad:** Calibraciones vinculadas a proyectos
3. **Consistencia:** UI con componentes Standard*
4. **Escalabilidad:** Múltiples proyectos pueden tener su propio Nexus

> *"La geometría siempre estuvo ahí. Ahora tenemos las herramientas para habitarla."*
> 
> — Conjunto NOSOTR_S

---

**Próximo Paso Sugerido:** Implementar Fase 1 (conectar autenticación) antes de agregar nuevas funcionalidades.

🍄👁️ 🌊🏄🏽 🚲∞
