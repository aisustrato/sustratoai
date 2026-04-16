# 🗺️ Roadmap: Sistema de Versionado y Diccionario de Términos - Cognética

**Fecha:** 27 Enero 2025  
**Estado:** Documentación para futura implementación  
**Contexto:** Sistema de exportación triple con hash SHA-256 implementado exitosamente

---

## 🎯 Visión General

El sistema actual de exportación con hash SHA-256 funciona como **snapshot en el tiempo**. Cada descarga genera un hash que representa el estado exacto del artefacto en ese momento. Esta roadmap documenta las mejoras necesarias para soportar **versionado completo con historial** y **diccionario de términos** para correcciones recurrentes.

---

## 📋 Sistema Actual (Implementado)

### ✅ Lo que Funciona Hoy

1. **Exportación Triple Formato:**
   - Markdown (.md) - Para humanos
   - YAML (.yaml) - Para máquinas
   - JSON (.json) - Canónico (fuente de verdad)

2. **Hash SHA-256:**
   - Calculado del JSON canónico
   - Incluido en metadata de todos los formatos
   - Persistido en `cog_artifact_exports`

3. **Verificación de Integridad:**
   - Endpoint: `/api/cognetica/verify-hash?hash=sha256:...`
   - Valida que el hash existe y pertenece al usuario

4. **Alert Preventivo (Nuevo):**
   - Detecta si no hay calibración QUIPU
   - Muestra StandardDialog de advertencia
   - Permite proceder con consentimiento informado

### ⚠️ Limitaciones Actuales

1. **Sin Historial de Versiones:**
   - Solo se guarda la versión más reciente
   - Hash anterior se sobrescribe (UPSERT)
   - No hay registro de qué cambió entre versiones

2. **Sin Detección de Cambios:**
   - No se sabe si el artefacto fue modificado
   - No hay descripción de cambios
   - No hay timeline de evolución

3. **Sin Diccionario de Términos:**
   - Errores recurrentes (ej: "Leiba" → "Leiva") no se previenen
   - No hay aprendizaje de correcciones
   - LLM no tiene contexto de términos específicos del proyecto

---

## 🚀 Fase 1: Sistema de Versionado con Historial

### **Objetivo**
Permitir que cada descarga genere una nueva versión, manteniendo historial completo de cambios.

### **Cambios en Base de Datos**

```sql
-- Migración: Agregar soporte de versionado
ALTER TABLE cog_artifact_exports DROP CONSTRAINT cog_artifact_exports_pkey;

ALTER TABLE cog_artifact_exports 
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN change_description TEXT,
  ADD COLUMN changed_by UUID REFERENCES auth.users(id),
  ADD PRIMARY KEY (artifact_id, version);

-- Índice para versión actual
CREATE INDEX idx_cog_artifact_exports_current 
  ON cog_artifact_exports(artifact_id, is_current) 
  WHERE is_current = true;

-- Índice para historial
CREATE INDEX idx_cog_artifact_exports_history 
  ON cog_artifact_exports(artifact_id, version DESC);
```

### **Flujo de Versionado**

```
1. Usuario descarga artefacto por primera vez:
   - version: 1
   - is_current: true
   - change_description: "Versión inicial"
   - content_hash: sha256:abc123

2. Usuario corrige error en transcripción (ej: nombre)
   - Sistema detecta cambio (hash diferente)
   - Marca version 1 como is_current = false
   - Inserta version 2:
     - is_current: true
     - change_description: "Corrección nombre: Leiba → Leiva"
     - content_hash: sha256:xyz789

3. Usuario agrega calibración QUIPU (nuevas semillas)
   - Marca version 2 como is_current = false
   - Inserta version 3:
     - is_current: true
     - change_description: "Agregada calibración QUIPU: 5 iteraciones"
     - content_hash: sha256:def456
```

### **Funciones Backend a Implementar**

```typescript
// lib/actions/cognetica-export-actions.ts

/**
 * Obtener historial de versiones de un artefacto
 */
export async function getArtifactVersionHistory(artifactId: string): Promise<{
    versions: Array<{
        version: number;
        content_hash: string;
        change_description: string;
        exported_at: string;
        is_current: boolean;
    }>;
}>;

/**
 * Comparar dos versiones de un artefacto
 */
export async function compareArtifactVersions(
    artifactId: string,
    version1: number,
    version2: number
): Promise<{
    differences: Array<{
        path: string; // ej: "semillas_fractales[2].contenido"
        old_value: unknown;
        new_value: unknown;
        change_type: 'added' | 'removed' | 'modified';
    }>;
}>;

/**
 * Persistir nueva versión con descripción de cambios
 */
export async function persistArtifactExportWithVersion(
    artifactId: string,
    changeDescription?: string
): Promise<{
    success: boolean;
    version: number;
    hash: string;
}>;
```

### **UI a Implementar**

1. **Timeline de Versiones:**
   - Componente visual mostrando historial
   - Cada versión con fecha, hash y descripción
   - Click en versión para ver detalles

2. **Comparador de Versiones:**
   - Selector de 2 versiones
   - Vista diff lado a lado
   - Resaltado de cambios

3. **Input de Descripción de Cambios:**
   - Modal al descargar si hash cambió
   - Sugerencias automáticas de cambios detectados
   - Usuario puede editar/confirmar

---

## 🔤 Fase 2: Diccionario de Términos y Correcciones

### **Objetivo**
Prevenir errores recurrentes y mejorar precisión de transcripciones/LLM mediante diccionario de términos específicos del proyecto.

### **Tabla en Base de Datos**

```sql
-- Nueva tabla: Diccionario de términos
CREATE TABLE cog_term_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    term_type VARCHAR(50) NOT NULL, -- 'name', 'acronym', 'technical', 'correction'
    incorrect_term TEXT NOT NULL,
    correct_term TEXT NOT NULL,
    context TEXT, -- Contexto donde aplica
    frequency INTEGER DEFAULT 1, -- Cuántas veces se ha corregido
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, incorrect_term)
);

-- Índice para búsqueda rápida
CREATE INDEX idx_cog_term_dictionary_project 
    ON cog_term_dictionary(project_id, term_type);

-- Índice para búsqueda por término incorrecto
CREATE INDEX idx_cog_term_dictionary_incorrect 
    ON cog_term_dictionary(incorrect_term);
```

### **Casos de Uso**

#### **1. Corrección de Nombres Propios**
```
Ejemplo Real del Usuario:
- Transcripción Deepgram: "Rodolfo Leiba"
- Correcto: "Rodolfo Leiva"

Flujo:
1. Usuario detecta error en export
2. Corrige manualmente en la app
3. Sistema pregunta: "¿Agregar 'Leiba → Leiva' al diccionario?"
4. Usuario confirma
5. Próximas transcripciones aplican corrección automáticamente
```

#### **2. Siglas y Acrónimos**
```
Ejemplo:
- LLM puede confundir: "IA" vs "I.A." vs "ia"
- Diccionario normaliza: "IA" (sin puntos, mayúsculas)

Flujo:
1. Usuario define sigla en diccionario
2. LLM consulta diccionario antes de procesar
3. Aplica formato correcto consistentemente
```

#### **3. Términos Técnicos del Proyecto**
```
Ejemplo:
- "Física de la Viabilidad" (concepto específico)
- "Semilla Fractal" (término del proyecto)
- "Calibración QUIPU" (proceso específico)

Flujo:
1. Usuario agrega términos clave al diccionario
2. LLM recibe contexto adicional en prompts
3. Mejora comprensión y extracción de semillas
```

### **Funciones Backend a Implementar**

```typescript
// lib/actions/cognetica-dictionary-actions.ts

/**
 * Agregar término al diccionario
 */
export async function addTermToDictionary(params: {
    projectId: string;
    termType: 'name' | 'acronym' | 'technical' | 'correction';
    incorrectTerm: string;
    correctTerm: string;
    context?: string;
}): Promise<ResultadoOperacion<{ termId: string }>>;

/**
 * Obtener diccionario del proyecto
 */
export async function getProjectDictionary(
    projectId: string
): Promise<Array<{
    id: string;
    termType: string;
    incorrectTerm: string;
    correctTerm: string;
    frequency: number;
}>>;

/**
 * Aplicar correcciones del diccionario a un texto
 */
export async function applyDictionaryCorrections(
    projectId: string,
    text: string
): Promise<{
    correctedText: string;
    corrections: Array<{
        original: string;
        corrected: string;
        position: number;
    }>;
}>;

/**
 * Sugerir términos para el diccionario basado en correcciones frecuentes
 */
export async function suggestDictionaryTerms(
    projectId: string
): Promise<Array<{
    incorrectTerm: string;
    suggestedCorrection: string;
    frequency: number;
    confidence: number;
}>>;
```

### **Integración con LLM**

```typescript
// Modificar prompts de calibración QUIPU para incluir diccionario

const dictionaryContext = await getProjectDictionary(projectId);
const dictionaryPrompt = `
DICCIONARIO DE TÉRMINOS DEL PROYECTO:
${dictionaryContext.map(t => `- "${t.incorrectTerm}" → "${t.correctTerm}"`).join('\n')}

Al analizar el contenido, usa estos términos correctos.
`;

// Agregar al prompt de calibración
const fullPrompt = `${basePrompt}\n\n${dictionaryPrompt}\n\n${userMessage}`;
```

### **UI a Implementar**

1. **Página de Diccionario:**
   - `/cognetica/[projectId]/dictionary`
   - Lista de términos con filtros por tipo
   - CRUD completo (agregar, editar, eliminar)
   - Estadísticas de uso (frecuencia)

2. **Modal de Corrección Inteligente:**
   - Al detectar cambio en transcripción
   - Sugerencia: "¿Agregar al diccionario?"
   - Preview de cómo afectará futuras transcripciones

3. **Indicador en Exports:**
   - Badge mostrando "X correcciones aplicadas"
   - Tooltip con lista de términos corregidos

---

## 📊 Fase 3: Detección Automática de Cambios

### **Objetivo**
Sistema inteligente que detecta y describe cambios entre versiones automáticamente.

### **Algoritmo de Detección**

```typescript
/**
 * Detectar cambios entre dos versiones de JSON canónico
 */
export async function detectChanges(
    oldJson: string,
    newJson: string
): Promise<{
    changeType: 'minor' | 'major';
    autoDescription: string;
    details: Array<{
        section: 'transcripcion' | 'semillas_fractales' | 'referencias' | 'chat';
        changeType: 'added' | 'removed' | 'modified';
        summary: string;
    }>;
}>;
```

### **Ejemplos de Detección**

```typescript
// Cambio menor: Corrección de typo
{
    changeType: 'minor',
    autoDescription: 'Corrección en transcripción: 1 cambio',
    details: [{
        section: 'transcripcion',
        changeType: 'modified',
        summary: 'Palabra corregida: "Leiba" → "Leiva"'
    }]
}

// Cambio mayor: Nueva calibración
{
    changeType: 'major',
    autoDescription: 'Calibración QUIPU agregada: 5 iteraciones, 12 semillas',
    details: [
        {
            section: 'chat',
            changeType: 'added',
            summary: '1 sesión de chat con 10 mensajes'
        },
        {
            section: 'semillas_fractales',
            changeType: 'added',
            summary: '12 semillas fractales extraídas'
        }
    ]
}
```

---

## 🔄 Fase 4: Flujo de Actualización Completo

### **Escenario Completo de Uso**

```
1. DESCARGA INICIAL (Sin Calibración)
   ├─ Usuario sube audio
   ├─ Transcripción Deepgram completa
   ├─ Usuario intenta descargar
   ├─ ⚠️ Alert: "Sin calibración QUIPU"
   ├─ Usuario confirma: "Sí, descargar sin calibración"
   └─ Version 1: sha256:abc123 (solo transcripción)

2. CORRECCIÓN DE ERROR
   ├─ Usuario detecta: "Leiba" debería ser "Leiva"
   ├─ Edita en la app
   ├─ Sistema pregunta: "¿Agregar al diccionario?"
   ├─ Usuario confirma
   ├─ Término agregado: "Leiba" → "Leiva"
   └─ Estado: Hash anterior marcado como "no actual, hay cambios pendientes"

3. CALIBRACIÓN QUIPU (5 iteraciones)
   ├─ Usuario realiza chat con IA
   ├─ Sistema extrae 12 semillas fractales
   ├─ Cooldown de 24 horas activado
   └─ Estado: Artefacto modificado, listo para nueva versión

4. DESCARGA ACTUALIZADA
   ├─ Usuario hace clic en descargar
   ├─ Sistema detecta cambios:
   │  ├─ Corrección en transcripción
   │  ├─ Calibración QUIPU agregada
   │  └─ 12 semillas fractales nuevas
   ├─ Modal: "Descripción de cambios"
   │  ├─ Sugerencia auto: "Corrección + Calibración QUIPU (5 iter, 12 semillas)"
   │  └─ Usuario puede editar
   ├─ Version 2: sha256:xyz789
   └─ Historial: v1 (sin calibración) → v2 (con calibración)

5. VERIFICACIÓN POSTERIOR
   ├─ Alguien verifica hash v1: sha256:abc123
   ├─ Sistema responde:
   │  ├─ ✅ "Hash válido"
   │  ├─ ⚠️ "Existe versión más reciente: v2"
   │  └─ 🔗 Link para ver cambios: v1 → v2
   └─ Usuario puede ver diff completo
```

---

## 🎯 Priorización Sugerida

### **Implementar Primero (Alta Prioridad)**
1. ✅ Alert preventivo sin calibración (HECHO HOY)
2. 🔄 Sistema de versionado básico (historial simple)
3. 🔄 Diccionario de términos (CRUD básico)

### **Implementar Después (Media Prioridad)**
4. 🔄 Detección automática de cambios
5. 🔄 Comparador de versiones (UI)
6. 🔄 Integración diccionario con LLM

### **Implementar Al Final (Baja Prioridad)**
7. 🔄 Timeline visual de versiones
8. 🔄 Sugerencias inteligentes de términos
9. 🔄 Estadísticas de uso del diccionario

---

## 📝 Notas de Implementación

### **Cooldown de 24 Horas**
```typescript
// Tabla para tracking de calibraciones
CREATE TABLE cog_calibration_cooldowns (
    artifact_id UUID PRIMARY KEY REFERENCES cog_artifacts(id),
    last_calibration_at TIMESTAMPTZ NOT NULL,
    calibration_count INTEGER DEFAULT 1,
    next_allowed_at TIMESTAMPTZ NOT NULL
);

// Función para verificar cooldown
export async function canCalibrateArtifact(artifactId: string): Promise<{
    canCalibrate: boolean;
    nextAllowedAt?: string;
    hoursRemaining?: number;
}>;
```

### **Límite de Calibraciones**
- Primera calibración: Sin límite
- Calibraciones adicionales: Máximo 1 cada 24 horas
- Razón: Fomentar reflexión y evitar sobre-calibración
- Mensaje: "Sal a caminar, piensa qué faltó o falló en la calibración"

---

## 🏁 Estado Final Deseado

**Sistema Completo de Integridad con Versionado:**
- ✅ Cada cambio genera nueva versión
- ✅ Historial completo auditable
- ✅ Diccionario previene errores recurrentes
- ✅ Detección automática de cambios
- ✅ Comparación entre versiones
- ✅ Verificación de integridad con contexto histórico
- ✅ Cooldown para calibraciones reflexivas

**Beneficios:**
- 🔒 Integridad total (nada se modifica sin registro)
- 📊 Trazabilidad completa (quién, cuándo, qué)
- 🎯 Precisión mejorada (diccionario de términos)
- 🧠 Aprendizaje continuo (correcciones se propagan)
- 🌊 Ritmo reflexivo (cooldown de 24h)

---

**Documento creado:** 27 Enero 2025  
**Próxima revisión:** Al iniciar implementación de Fase 1  
**Contacto:** eRRRe (Humano Semilla Calibrador) 🏄🏽
