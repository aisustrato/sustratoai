# Estrategia de Refactorización: Módulo Minotauro

## 🎯 Objetivo
Refactorizar el módulo Minotauro para aplicar el **look & feel del mock** del showroom, manteniendo la lógica funcional existente pero mejorando dramáticamente la UX.

---

## 📊 Análisis Comparativo: Estado Actual vs Mock

### **Estado Actual (Minotauro)**
```
❌ Problemas identificados:
- UI fragmentada y poco intuitiva
- Editor MD sin vista previa dual
- Fuentes curadas en panel separado colapsable
- Arquetipos solo en modo edición
- No hay sistema de calibración interactiva
- Sugerencias de IA en modal/panel básico
- Sin control de versiones visible
- Métricas dispersas
```

### **Mock (Showroom)**
```
✅ Mejoras implementadas:
- UI limpia, elegante, cohesiva
- Editor MD con vista previa dual lado a lado
- Fuentes curadas siempre visibles en card dedicado
- Arquetipos accesibles en cualquier momento
- Sistema de calibración interactiva completo
- Comentarios estructurados (no texto corrido)
- Control de versiones en historial claro
- Métricas integradas en contexto
```

---

## 🗄️ Análisis de Base de Datos

### **Esquema Actual**
```sql
minotauro_galaxies:
  - id, universe_id, title, description
  - content TEXT          -- ✅ Contenido MD (existe)
  - ai_content TEXT       -- ✅ Propuesta IA (existe)
  - status                -- ✅ Estado (existe)
  - last_archetype        -- ✅ Último arquetipo (existe)
  - metadata JSONB        -- ✅ Flexible (existe)
  - order_index, created_at, updated_at
```

### **Necesidades del Mock**
```typescript
// Fuentes curadas (artefactos Cognetica)
curatedSources: CuratedSource[] {
  id, title, type, summary, cogneticaId, addedAt
}

// Análisis de arquetipos con comentarios estructurados
archetypeAnalysis: {
  archetype, status, comments[], tokens
}

// Comentarios individuales
comments: {
  id, point, observation, userResponse?, userNote?
}

// Versiones con arquetipos
versions: {
  version, archetype, timestamp, content
}
```

### **✅ Cambios en BD: MÍNIMOS**

**NO necesitamos nuevas tablas**, solo ajustar metadata:

```sql
-- minotauro_galaxies.metadata estructura sugerida:
{
  "content": "texto MD",           -- Ya existe
  "word_count": 150,               -- Ya existe
  "char_count": 890,               -- Ya existe
  "estimated_pages": 3,            -- Ya existe
  
  -- NUEVO: Análisis de arquetipos
  "archetype_analysis": {
    "archetype": "editor",
    "status": "pending_calibration",
    "comments": [
      {
        "id": "edit-1",
        "point": "Apertura impactante",
        "observation": "Necesitas gancho inicial...",
        "userResponse": "approve",
        "userNote": "Me gusta esta idea"
      }
    ],
    "tokens": { "totalTokenCount": 1678, ... }
  },
  
  -- NUEVO: Versiones con arquetipos
  "versions": [
    {
      "version": 3,
      "archetype": "editor",
      "timestamp": "2026-02-17T10:00:00Z",
      "content": "# Introducción\n\n...",
      "calibration_summary": "2 aprobados, 1 modificado"
    }
  ]
}

-- minotauro_curated_sources (tabla existente)
-- ✅ Ya existe, solo necesitamos usarla correctamente
```

---

## 🏗️ Estrategia de Refactorización

### **Fase 1: Preparación (30 min)**
1. ✅ Crear documento de estrategia (este)
2. ⏳ Backup del código actual
3. ⏳ Crear branch de refactorización
4. ⏳ Verificar que migraciones de BD están aplicadas

### **Fase 2: Componentes Base (1-2 horas)**
1. **Copiar estructura del mock** → Minotauro
   - Layout de secciones expandibles
   - Editor MD dual (editor + preview)
   - Sistema de tabs/organización

2. **Adaptar componentes Standard**
   - Usar mismos componentes que el mock
   - Mantener props y estilos consistentes

### **Fase 3: Fuentes Curadas (30 min)**
1. **Integrar CuratedSourcesPanel**
   - Ya existe en `/galaxy/[galaxyId]/components/CuratedSourcesPanel.tsx`
   - Moverlo a nivel de galaxia inline
   - Mostrar siempre visible (no colapsable)
   - Formato: card con lista de artefactos Cognetica

2. **Conectar con BD**
   - Tabla `minotauro_curated_sources` ya existe
   - Solo necesitamos query correcta

### **Fase 4: Sistema de Arquetipos (2-3 horas)**
1. **Botones de arquetipos**
   - Mover de "solo en edición" → "siempre disponibles"
   - Mismo diseño que el mock (4 botones con iconos)

2. **Procesamiento con IA**
   - Mantener API `/api/minotauro/process-galaxy`
   - **MODIFICAR** respuesta para devolver comentarios estructurados
   - En lugar de texto corrido → array de comentarios

3. **Actualizar prompt de DeepSeek**
   ```typescript
   // Antes (texto corrido):
   "Analiza este texto y proporciona sugerencias..."
   
   // Después (comentarios estructurados):
   "Analiza este texto y proporciona comentarios estructurados en JSON:
   {
     comments: [
       {
         point: 'Título del punto',
         observation: 'Tu observación detallada'
       }
     ]
   }"
   ```

### **Fase 5: Sistema de Calibración (2-3 horas)**
1. **Panel de comentarios**
   - Copiar del mock: `analysis.comments.map(...)`
   - Radio buttons: ✅ Aprobar / ✏️ Modificar / ❌ Rechazar
   - Textarea condicional para notas

2. **Estado de calibración**
   ```typescript
   const [calibrations, setCalibrations] = useState<Record<string, Record<string, {
     response?: 'approve' | 'modify' | 'reject';
     note?: string;
   }>>>({});
   ```

3. **Validación y ejecución**
   - Copiar funciones del mock:
     - `handleCalibrationResponse`
     - `handleCalibrationNote`
     - `isCalibrationValid`
     - `handleExecuteVersion`

4. **Guardar en metadata**
   ```typescript
   await updateGalaxy(galaxyId, {
     metadata: {
       ...existingMetadata,
       archetype_analysis: {
         archetype,
         status: 'calibrated',
         comments: calibratedComments,
         tokens
       }
     }
   });
   ```

### **Fase 6: Control de Versiones (1 hora)**
1. **Historial visible**
   - Copiar del mock: sección de versiones
   - Mostrar: versión, arquetipo, timestamp
   - Badge con arquetipo usado

2. **Guardar versiones en metadata**
   ```typescript
   metadata: {
     versions: [
       {
         version: newVersion,
         archetype,
         timestamp: new Date().toISOString(),
         content: newContent,
         calibration_summary: `${approved} aprobados, ${modified} modificados`
       },
       ...previousVersions
     ]
   }
   ```

### **Fase 7: Métricas y Balance (30 min)**
1. **Mantener métricas existentes**
   - Ya están implementadas: `calculateTextMetrics`
   - Solo ajustar visualización para que sea inline

2. **Integrar con calibración**
   - Mostrar métricas en tiempo real durante edición
   - Actualizar tras ejecutar nueva versión

---

## 📋 Checklist de Implementación

### **Backend (API)**
- [ ] Modificar `/api/minotauro/process-galaxy/route.ts`
  - [ ] Actualizar prompt para generar comentarios estructurados
  - [ ] Parsear respuesta JSON de DeepSeek
  - [ ] Devolver `{ comments: [], tokens: {} }`

### **Frontend (UI)**
- [ ] Refactorizar `/app/cognetica/minotauro/[universeId]/page.tsx`
  - [ ] Copiar estructura de secciones expandibles del mock
  - [ ] Implementar editor MD dual (editor + preview)
  - [ ] Mover fuentes curadas inline (siempre visibles)
  - [ ] Botones de arquetipos siempre disponibles
  - [ ] Panel de comentarios estructurados
  - [ ] Sistema de calibración interactiva
  - [ ] Control de versiones visible
  - [ ] Integrar métricas inline

### **Estado y Lógica**
- [ ] Agregar estado de calibración
- [ ] Funciones de manejo de calibración
- [ ] Validación de calibración completa
- [ ] Ejecución de nueva versión
- [ ] Guardado en metadata

### **Componentes**
- [ ] Reutilizar componentes Standard del mock
- [ ] Mantener consistencia visual
- [ ] Props correctos (sin errores TS)

---

## 🎨 Principios de Diseño

1. **Look & Feel del Mock**
   - Copiar estructura visual exacta
   - Mismos componentes Standard
   - Misma organización espacial

2. **Lógica del Sistema Real**
   - Mantener conexión con BD
   - Mantener API de DeepSeek
   - Mantener sistema de fuentes curadas

3. **Mejoras UX**
   - Editor siempre visible con preview
   - Fuentes siempre accesibles
   - Arquetipos siempre disponibles
   - Calibración interactiva clara
   - Versiones visibles en historial

---

## 🚀 Plan de Ejecución

### **Orden Recomendado:**
1. **Backup y preparación** (15 min)
2. **Estructura base** - Copiar layout del mock (1 hora)
3. **Editor MD dual** - Implementar vista previa (30 min)
4. **Fuentes curadas** - Mover inline (30 min)
5. **Arquetipos** - Botones siempre disponibles (30 min)
6. **API comentarios** - Modificar respuesta estructurada (1 hora)
7. **Panel calibración** - Implementar UI interactiva (2 horas)
8. **Ejecución versión** - Lógica de guardado (1 hora)
9. **Historial versiones** - UI visible (30 min)
10. **Testing y ajustes** - Pruebas completas (1 hora)

**Total estimado: 8-10 horas**

---

## ⚠️ Consideraciones Importantes

### **NO Cambiar:**
- ✅ Estructura de BD (solo metadata)
- ✅ Tabla `minotauro_curated_sources`
- ✅ Tabla `minotauro_galaxies`
- ✅ Sistema de autenticación
- ✅ Lógica de proyectos

### **SÍ Cambiar:**
- ✅ UI completa (aplicar mock)
- ✅ Respuesta de API (comentarios estructurados)
- ✅ Prompt de DeepSeek (JSON estructurado)
- ✅ Estado del componente (agregar calibración)
- ✅ Metadata de galaxias (agregar análisis y versiones)

### **Mantener Compatibilidad:**
- ✅ Galaxias existentes deben seguir funcionando
- ✅ Metadata antiguo debe ser compatible
- ✅ Migración gradual sin romper datos

---

## 🎯 Resultado Esperado

### **Antes (Actual):**
```
❌ UI confusa y fragmentada
❌ Editor sin preview
❌ Fuentes ocultas en panel colapsable
❌ Arquetipos solo en edición
❌ Sugerencias como texto corrido
❌ Sin calibración interactiva
❌ Sin control de versiones visible
```

### **Después (Refactorizado):**
```
✅ UI elegante y cohesiva (como el mock)
✅ Editor MD con preview dual
✅ Fuentes siempre visibles en card dedicado
✅ Arquetipos siempre disponibles
✅ Comentarios estructurados por punto
✅ Calibración interactiva completa
✅ Historial de versiones visible
✅ Métricas integradas en contexto
```

---

## 📝 Notas Finales

- **Prioridad:** UX > Funcionalidad nueva
- **Enfoque:** Copiar lo que funciona del mock
- **Objetivo:** Mismo look & feel, misma lógica de negocio
- **Tiempo:** 1-2 días de trabajo enfocado
- **Riesgo:** Bajo (no cambiamos BD, solo UI y metadata)

---

## ✅ Aprobación para Proceder

**¿Estás de acuerdo con esta estrategia?**
- Cambios mínimos en BD (solo metadata)
- Refactorización completa de UI
- Copiar estructura del mock
- Mantener lógica de negocio

**Si apruebas, procedo a ejecutar la refactorización paso a paso.**
