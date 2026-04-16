# AUDITORÍA: Manejo de "Otros" en Preclasificación IA

**Fecha:** 20 de Enero, 2026  
**Contexto:** Revisión del sistema de preclasificación para honrar la emergencia  
**Filosofía:** "Otros" como opción implícita para capturar lo no previsto por el humano

---

## 🎯 OBJETIVO DE LA AUDITORÍA

Evaluar cómo el sistema actual maneja la opción "Otros" cuando la IA sugiere valores no definidos explícitamente por el humano, y proponer mejoras para honrar la emergencia de conocimiento no previsto.

---

## 🔍 HALLAZGOS: ESTADO ACTUAL DEL CÓDIGO

### 1. **Prompt a la IA - Flexibilidad Condicional**

**Ubicación:** `@/lib/actions/preclassification-actions.ts:930-949`

**Lógica actual:**

```typescript
// 🧠 LÓGICA INTELIGENTE: Detectar si existe opción "Otros" para permitir flexibilidad
const hasOtrosOption = dim.preclass_dimension_options.some(opt => 
    opt.value.toLowerCase().startsWith('otros')
);

if (hasOtrosOption) {
    instructionForDim += `
- **Nota Especial para 'Otros':** Si ninguna de las opciones encaja perfectamente, puedes usar la opción que comienza con 'Otros:' y reemplazar la palabra 'Especificar' con un resumen muy breve (1-5 palabras) del tema real que has identificado.`;
}
```

**Comportamiento:**
- ✅ **SI** el humano definió explícitamente una opción "Otros: Especificar" → La IA puede usarla con texto personalizado
- ❌ **SI NO** existe la opción "Otros" → La IA está limitada estrictamente a las opciones definidas

**Ejemplo de prompt generado:**

**Con "Otros" explícito:**
```
**Dimensión: "Metodología"**
- Tipo: Opción Múltiple.
- Instrucción: Para esta dimensión, DEBES escoger uno de los siguientes valores de la lista.
- Opciones Válidas: ["Cuantitativa", "Cualitativa", "Mixta", "Otros: Especificar"]
- **Nota Especial para 'Otros':** Si ninguna de las opciones encaja perfectamente, puedes usar la opción que comienza con 'Otros:' y reemplazar la palabra 'Especificar' con un resumen muy breve (1-5 palabras) del tema real que has identificado.
```

**Sin "Otros" explícito:**
```
**Dimensión: "Área Temática"**
- Tipo: Opción Múltiple.
- Instrucción: Para esta dimensión, DEBES escoger uno de los siguientes valores de la lista.
- Opciones Válidas: ["Educación", "Salud", "Tecnología"]
```

---

### 2. **Validación Backend - Lógica "Smart Other"**

**Ubicación:** `@/lib/actions/preclassification-actions.ts:1115-1138`

**Lógica actual:**

```typescript
if (foundDimension.type === 'finite') {
    const validOptions = foundDimension.preclass_dimension_options.map(opt => opt.value);
    const normalizedValue = normalizeString(valueToSave);
    const normalizedOptions = validOptions.map(opt => normalizeString(opt));

    const exactMatchIndex = normalizedOptions.findIndex(opt => opt === normalizedValue);
    const isExactMatch = exactMatchIndex !== -1;

    // 🔍 BUSCAR SI EXISTE OPCIÓN "OTROS"
    const otherOption = validOptions.find(opt => normalizeString(opt).toLowerCase().startsWith('otros'));
    const isSmartOther = otherOption && typeof valueToSave === 'string' && normalizedValue.toLowerCase().startsWith('otros');

    // ❌ RECHAZAR SI NO ES MATCH EXACTO NI "OTROS" INTELIGENTE
    if (!isExactMatch && !isSmartOther) {
        throw new Error(`Valor "${valueToSave}" inválido para la dimensión finita "${foundDimension.name}". Opciones válidas: ${validOptions.join(', ')}`);
    }

    // Mapear option_id
    if (isExactMatch) {
        optionId = optionsWithIds[exactMatchIndex]?.id ?? null;
    } else if (isSmartOther) {
        const otherObj = optionsWithIds.find(o => normalizeString(o.value).toLowerCase().startsWith('otros'));
        optionId = otherObj?.id ?? null;
    }
}
```

**Comportamiento:**
- ✅ **Coincidencia exacta:** Acepta valores que coinciden con opciones definidas
- ✅ **"Otros" inteligente:** Si existe opción "Otros:", acepta "Otros: [texto personalizado]" y mapea al `option_id` de "Otros"
- ❌ **Sin "Otros" explícito:** Rechaza cualquier valor no definido, incluso si la IA detecta emergencia

**Casos de prueba:**

| Opciones definidas | Valor IA | ¿Acepta? | Razón |
|-------------------|----------|----------|-------|
| ["A", "B", "Otros: Especificar"] | "Otros: Enfoque narrativo" | ✅ Sí | Smart Other activo |
| ["A", "B", "Otros: Especificar"] | "C" | ❌ No | No es match ni otros |
| ["A", "B"] | "Otros: Enfoque narrativo" | ❌ No | No existe opción "Otros" |
| ["A", "B"] | "C" | ❌ No | No es match exacto |

---

### 3. **Reconciliación - Misma Lógica**

**Ubicación:** `@/lib/actions/preclassification-actions.ts:2978-3001`

La función de reconciliación usa **exactamente la misma lógica** de validación, por lo que tiene el mismo comportamiento restrictivo cuando no existe "Otros" explícito.

---

## 📊 ANÁLISIS: PROBLEMA FILOSÓFICO

### **Situación Actual**

El sistema **depende de que el humano prevea** la necesidad de "Otros" al diseñar las dimensiones. Si el humano no lo incluye, la IA queda limitada a las opciones predefinidas, **incluso si detecta emergencia de conocimiento no previsto**.

**Ejemplo real:**

```
Dimensión: "Tipo de Intervención"
Opciones definidas: ["Terapia Cognitiva", "Terapia Conductual", "Farmacológica"]

Artículo analizado: Describe una intervención basada en "Realidad Virtual Inmersiva"

Resultado actual:
❌ IA forzada a elegir una de las 3 opciones (distorsión)
❌ O el proceso falla con error de validación
```

### **Problema Ético**

**No honra la emergencia.** Si la IA detecta algo genuinamente nuevo que el humano no previó, el sistema lo bloquea en lugar de capturarlo.

---

## 💡 PROPUESTA: "OTROS" IMPLÍCITO POR DEFECTO

### **Filosofía**

> "La emergencia no pide permiso. Si la IA detecta algo que el humano no previó, el sistema debe capturarlo, no bloquearlo."

### **Cambio Propuesto**

**Para dimensiones `type: 'finite'` SIN opción "Otros" explícita:**

1. **Prompt a la IA:** Agregar automáticamente instrucción de "Otros" implícito
2. **Validación Backend:** Aceptar valores que empiecen con "Otros:" incluso si no existe la opción
3. **Almacenamiento:** Guardar como texto libre con `option_id = null` (señal de emergencia)
4. **UI:** Marcar visualmente las clasificaciones con "Otros" implícito para revisión humana

### **Implementación Sugerida**

#### **1. Modificar Prompt (línea 946)**

```typescript
// ANTES
if (hasOtrosOption) {
    instructionForDim += `
- **Nota Especial para 'Otros':** Si ninguna de las opciones encaja perfectamente...`;
}

// DESPUÉS
// Siempre agregar instrucción de "Otros", sea explícito o implícito
instructionForDim += `
- **Nota Especial para 'Otros':** Si ninguna de las opciones encaja perfectamente, puedes usar "Otros: [descripción breve]" para capturar emergencia de conocimiento no previsto. ${hasOtrosOption ? 'Esta dimensión tiene una opción "Otros" definida.' : '⚠️ Esta dimensión NO tiene "Otros" explícito, pero puedes usarlo si es necesario (será marcado para revisión humana).'}`;
```

#### **2. Modificar Validación (línea 1126)**

```typescript
// ANTES
if (!isExactMatch && !isSmartOther) {
    throw new Error(`Valor "${valueToSave}" inválido...`);
}

// DESPUÉS
// Detectar "Otros" implícito (sin opción definida)
const isImplicitOther = !otherOption && normalizedValue.toLowerCase().startsWith('otros');

if (!isExactMatch && !isSmartOther && !isImplicitOther) {
    throw new Error(`Valor "${valueToSave}" inválido...`);
}

// Mapear option_id
if (isExactMatch) {
    optionId = optionsWithIds[exactMatchIndex]?.id ?? null;
} else if (isSmartOther) {
    const otherObj = optionsWithIds.find(o => normalizeString(o.value).toLowerCase().startsWith('otros'));
    optionId = otherObj?.id ?? null;
} else if (isImplicitOther) {
    optionId = null; // 🚨 Señal de emergencia: "Otros" sin opción definida
}
```

#### **3. Agregar Campo de Metadatos**

```typescript
articleReviews.push({
    article_id: articleId,
    article_batch_item_id: item.itemId,
    dimension_id: foundDimension.id,
    reviewer_type: 'ai',
    reviewer_id: userId,
    iteration: attemptNumber,
    classification_value: valueToSave,
    confidence_score: mapConfidenceToScore(classification.confidence),
    rationale: classification.rationale,
    option_id: optionId,
    // 🆕 NUEVO: Marcar emergencia
    is_implicit_other: isImplicitOther, // Flag para UI
});
```

**Nota:** Requiere agregar columna `is_implicit_other BOOLEAN` a `article_dimension_reviews` (opcional, puede inferirse de `option_id IS NULL` en dimensiones finitas).

#### **4. UI - Indicador Visual**

En `TableLikeView.tsx` o componente de revisión:

```tsx
{review.option_id === null && dimension.type === 'finite' && (
    <span className="text-amber-500 text-xs">
        ⚠️ Emergencia: "Otros" implícito
    </span>
)}
```

---

## 🎯 BENEFICIOS DE LA PROPUESTA

### **1. Honra la Emergencia**
- ✅ Captura conocimiento no previsto por el humano
- ✅ No fuerza a la IA a distorsionar la realidad eligiendo opciones incorrectas
- ✅ Permite que el sistema "aprenda" de lo que encuentra

### **2. Trazabilidad**
- ✅ `option_id = null` señala claramente que es emergencia
- ✅ Humano puede revisar y decidir si:
  - Crear nueva opción en la dimensión
  - Reclasificar a opción existente
  - Validar como "Otros" legítimo

### **3. No Rompe Funcionalidad Existente**
- ✅ Dimensiones con "Otros" explícito siguen funcionando igual
- ✅ Dimensiones `type: 'open'` no se afectan
- ✅ Validación sigue siendo estricta para valores no-"Otros"

### **4. Feedback Loop**
- ✅ Si muchos artículos caen en "Otros" implícito para una dimensión → Señal de que faltan opciones
- ✅ Permite evolución orgánica del esquema de clasificación

---

## 🚨 CONSIDERACIONES Y RIESGOS

### **Riesgo 1: IA Abusa de "Otros"**
**Mitigación:** 
- Instrucción clara en prompt: "Usa 'Otros' SOLO si ninguna opción encaja"
- Monitoreo: Dashboard que muestre % de "Otros" implícito por dimensión
- Threshold: Si >30% de artículos usan "Otros" → Alerta al humano

### **Riesgo 2: Ruido en Datos**
**Mitigación:**
- Marcar visualmente en UI para revisión prioritaria
- Workflow: Humano debe validar/reclasificar "Otros" implícitos antes de finalizar lote

### **Riesgo 3: Complejidad en Reportes**
**Mitigación:**
- Queries deben considerar `option_id IS NULL` como categoría especial
- Reportes muestran "Otros (emergencia)" como categoría separada

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Sin Modificar Código (Actual)**
1. ✅ Documentar comportamiento actual (este documento)
2. ✅ Educar a usuarios sobre importancia de incluir "Otros: Especificar" en dimensiones finitas
3. ✅ Crear guía de diseño de dimensiones

### **Fase 2: Implementación Incremental (Propuesta)**
1. Agregar columna `is_implicit_other` a `article_dimension_reviews` (opcional)
2. Modificar prompt para siempre incluir instrucción de "Otros"
3. Modificar validación para aceptar "Otros" implícito
4. Actualizar UI para marcar emergencias visualmente
5. Crear dashboard de monitoreo de "Otros" implícitos

### **Fase 3: Feedback Loop (Futuro)**
1. Analítica: Identificar dimensiones con alto % de "Otros"
2. Sugerencias automáticas: "Esta dimensión tiene 15 'Otros' diferentes, ¿crear nuevas opciones?"
3. Workflow de refinamiento: Convertir "Otros" recurrentes en opciones formales

---

## 🌐 ALINEACIÓN CON MANIFIESTO ÉTICO

Esta propuesta honra los principios del Manifiesto Ético v1.1:

- ✅ **La técnica al servicio del humano:** No fuerza a la IA a distorsionar la realidad
- ✅ **Override técnico:** El código local (emergencia real) gana sobre el entrenamiento (opciones predefinidas)
- ✅ **Investigar antes de actuar:** Este documento investiga antes de proponer cambios
- ✅ **Honrar el tiempo del humano:** Captura emergencia en lugar de obligar al humano a preverlo todo

---

## 📊 RESUMEN EJECUTIVO

### **Estado Actual**
- ✅ Sistema funciona correctamente si el humano incluye "Otros: Especificar"
- ❌ Sistema rechaza emergencia si el humano no lo previó

### **Propuesta**
- 🆕 "Otros" implícito por defecto en todas las dimensiones finitas
- 🆕 Captura emergencia con `option_id = null` para revisión humana
- 🆕 No rompe funcionalidad existente

### **Decisión Requerida**
- ¿Implementar "Otros" implícito ahora?
- ¿O educar usuarios para que siempre incluyan "Otros" explícito?
- ¿O híbrido: Implementar pero con flag de configuración por proyecto?

---

**Firmado:**  
Claude (Anthropic) - Siguiendo protocolo del Manifiesto Ético v1.1  
20 de Enero, 2026
