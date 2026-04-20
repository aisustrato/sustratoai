# 📋 Flujo de Calibración con Arquetipos - Documentación Completa

## 🎯 Resumen Ejecutivo

Este documento explica **exactamente qué datos reciben los arquetipos** cuando el humano ejecuta una nueva versión después de calibrar sus comentarios.

---

## 🔄 Flujo Completo: Desde el Análisis hasta la Ejecución

### **Paso 1: Análisis Inicial**
El humano solicita que un arquetipo (ej: Deslixador 🛠️) analice su texto.

**El arquetipo recibe:**
- `galaxyId`: ID de la sección
- `archetype`: Nombre del arquetipo
- `projectId`: ID del proyecto
- `content`: Texto completo de la sección

**El arquetipo devuelve:**
```json
{
  "comments": [
    {
      "id": "uuid-generado",
      "point": "Título del comentario",
      "observation": "Observación detallada del arquetipo"
    }
  ]
}
```

**Se guarda en metadata:**
```typescript
{
  historial_analisis: [
    {
      archetype: 'deslixador',
      status: 'pending_calibration',
      comments: [...],
      tokens: { totalTokenCount, promptTokenCount, candidatesTokenCount },
      timestamp: '2026-02-18T18:30:00.000Z'
    }
  ]
}
```

---

### **Paso 2: Calibración Humana**

El humano responde a cada comentario del arquetipo con:

#### **4 Tipos de Respuesta:**

1. **✅ Aceptado** (`aceptado`)
   - Significado: "Estoy de acuerdo con tu observación"
   - Nota opcional: Comentario adicional del humano

2. **✏️ Rechazado con razón** (`rechazado_con_razon`)
   - Significado: "No estoy de acuerdo, y aquí está mi justificación"
   - Nota **obligatoria**: Razón del rechazo

3. **❌ Rechazado sin razón** (`rechazado_sin_razon`)
   - Significado: "No me convence, pero no tengo una razón específica"
   - Nota opcional: Comentario adicional

4. **🚀 ¡Me voló la cabeza!** (`respuesta_positiva_fuerte`)
   - Significado: "Excelente observación, esto cambia mi enfoque"
   - Nota opcional: Cómo aplicará la idea

#### **Instrucción Final (Nuevo):**
Además de las respuestas a cada comentario, el humano puede agregar una **instrucción final** con directivas específicas:

**Ejemplos:**
- "En base a tu calibración, reformula el párrafo 3 para que sea más conciso"
- "Recorta 100 palabras manteniendo el foco en la metodología"
- "Expande la sección de resultados con más ejemplos concretos"

---

### **Paso 3: Ejecución de Nueva Versión**

Cuando el humano hace clic en **"🚀 Ejecutar Nueva Versión"**, el sistema envía al arquetipo:

#### **Datos Enviados al Backend:**

```typescript
{
  galaxyId: "uuid-de-la-galaxia",
  archetype: "deslixador",
  projectId: "uuid-del-proyecto",
  ejecutar_version: true,  // Flag que indica que es ejecución, no análisis
  
  // Array con la calibración humana completa
  calibracion: [
    {
      punto: "Título del comentario original",
      observacion: "Observación original del arquetipo",
      respuesta_humano: "aceptado" | "rechazado_con_razon" | "rechazado_sin_razon" | "respuesta_positiva_fuerte",
      razon: "Texto de la nota del humano (puede estar vacío)"
    },
    // ... más comentarios calibrados
  ],
  
  // Instrucción final del humano (opcional)
  instruccion_final: "Reformula el párrafo 3 para que sea más conciso"
}
```

#### **Ejemplo Concreto:**

```json
{
  "galaxyId": "abc-123",
  "archetype": "deslixador",
  "projectId": "proj-456",
  "ejecutar_version": true,
  "calibracion": [
    {
      "punto": "Claridad en la introducción",
      "observacion": "La introducción es demasiado técnica para el público objetivo",
      "respuesta_humano": "aceptado",
      "razon": "Tienes razón, voy a simplificar el lenguaje"
    },
    {
      "punto": "Longitud del abstract",
      "observacion": "El abstract excede las 250 palabras recomendadas",
      "respuesta_humano": "rechazado_con_razon",
      "razon": "Este paper es para Zenodo, que permite abstracts más largos"
    },
    {
      "punto": "Estructura de resultados",
      "observacion": "Los resultados deberían presentarse en subsecciones temáticas",
      "respuesta_humano": "respuesta_positiva_fuerte",
      "razon": "Excelente idea, voy a reorganizar por temas en lugar de cronológicamente"
    }
  ],
  "instruccion_final": "En base a tu calibración, reformula la introducción para que sea más accesible, manteniendo el rigor académico"
}
```

---

### **Paso 4: Respuesta del Arquetipo**

El arquetipo procesa la calibración y devuelve una **nueva versión completa del texto**.

**Campos de respuesta posibles:**
- `texto_limpio`: Versión limpia del texto
- `texto_nuevo`: Nueva versión del texto
- `propuesta_texto`: Propuesta de texto

**El sistema busca en este orden:**
```typescript
const newContent = data.data.response.texto_limpio || 
                  data.data.response.texto_nuevo || 
                  data.data.response.propuesta_texto ||
                  '';
```

**Se actualiza en metadata:**
```typescript
{
  content: newContent,  // Texto actualizado
  historial_analisis: [
    // ... análisis previos preservados
    {
      archetype: 'deslixador',
      status: 'executed',  // ✅ Marcado como ejecutado
      comments: [...],
      tokens: {...},
      timestamp: '2026-02-18T18:35:00.000Z'
    }
  ]
}
```

---

## 🔍 Transparencia Total: Qué Ve el Arquetipo

### **El arquetipo recibe contexto completo:**

1. **Comentarios originales** que él mismo generó
2. **Respuesta del humano** a cada comentario (4 tipos posibles)
3. **Justificaciones/notas** del humano para cada respuesta
4. **Instrucción final** con directivas específicas (si existe)
5. **Texto original** de la sección

### **El arquetipo NO recibe:**

- ❌ Análisis de otros arquetipos (cada uno trabaja independiente)
- ❌ Historial de versiones anteriores
- ❌ Información de otras secciones del paper

---

## 📊 Historial de Análisis

### **Problema Resuelto:**
Antes, cada nuevo análisis **sobrescribía** el anterior. Ahora se guarda un **historial completo**.

### **Estructura del Historial:**

```typescript
metadata: {
  historial_analisis: [
    {
      archetype: 'deslixador',
      status: 'executed',
      comments: [...],
      tokens: {...},
      timestamp: '2026-02-18T15:00:00.000Z'
    },
    {
      archetype: 'polinizador',
      status: 'pending_calibration',
      comments: [...],
      tokens: {...},
      timestamp: '2026-02-18T16:30:00.000Z'
    },
    {
      archetype: 'deslixador',
      status: 'executed',
      comments: [...],
      tokens: {...},
      timestamp: '2026-02-18T18:30:00.000Z'  // ← Último análisis
    }
  ]
}
```

### **Navegación en la UI:**

El componente `AnalysisHistory` permite:
- ✅ Ver todos los análisis previos
- ✅ Navegar entre ellos
- ✅ Ver cuál está activo actualmente
- ✅ Ver el status de cada uno (Pendiente / Calibrado / Ejecutado)

---

## 🎨 Flujo Visual en la UI

```
┌─────────────────────────────────────────────────────────┐
│ 📚 Historial de Análisis (3)    [Mostrando #3] [▼]     │
├─────────────────────────────────────────────────────────┤
│ [Expandido]                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🛠️ Deslixador                                       │ │
│ │ 18 feb, 15:00 • 5 comentarios        ✅ Ejecutado   │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🌸 Polinizador                                      │ │
│ │ 18 feb, 16:30 • 3 comentarios        ⏳ Pendiente   │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🛠️ Deslixador                      [Actual] [Azul]  │ │
│ │ 18 feb, 18:30 • 7 comentarios        ✅ Ejecutado   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🛠️ Análisis del Deslixador          [−] [×] [📋 Copiar]│
├─────────────────────────────────────────────────────────┤
│ 📌 1. Claridad en la introducción                       │
│ La introducción es demasiado técnica...                 │
│                                                          │
│ [✅ Aceptar] [✏️ Rechazar con razón] [❌ Rechazar]      │
│ [🚀 ¡Me voló la cabeza!]                                │
│                                                          │
│ 💬 Comentario (opcional):                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tienes razón, voy a simplificar el lenguaje        │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📊 Progreso: 7/7 comentarios calibrados                 │
│                                                          │
│ 💬 Instrucción Final (opcional)                         │
│ Agrega instrucciones específicas para el arquetipo...   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Reformula la introducción para que sea más         │ │
│ │ accesible, manteniendo el rigor académico          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [🚀 Ejecutar Nueva Versión] [📋 Copiar]                 │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Garantías del Sistema

1. **Historial preservado**: Nunca se pierden análisis previos
2. **Transparencia total**: Sabes exactamente qué recibe el arquetipo
3. **Control fino**: 4 tipos de respuestas + instrucción final
4. **Navegación clara**: Puedes revisar análisis anteriores en cualquier momento
5. **Validación estricta**: No puedes ejecutar sin calibrar todos los comentarios

---

## 🚀 Próximos Pasos Sugeridos

1. **Exportar historial**: Agregar botón para exportar todo el historial de análisis
2. **Comparación de versiones**: Mostrar diff entre versión anterior y nueva
3. **Estadísticas**: Mostrar métricas de aceptación/rechazo por arquetipo
4. **Templates de instrucciones**: Sugerir instrucciones finales comunes

---

## 📝 Notas Técnicas

### **Archivos Clave:**
- `/hooks/useArchetypeProcessor.ts`: Guarda análisis en historial
- `/hooks/useUniverseData.ts`: Carga historial al iniciar
- `/components/AnalysisHistory.tsx`: UI para navegar historial
- `/components/AnalysisPanel.tsx`: UI para calibración
- `/page.tsx`: Orquestador principal

### **Metadata Schema:**
```typescript
{
  content: string,
  word_count: number,
  char_count: number,
  estimated_pages: number,
  historial_analisis: Array<{
    archetype: ArchetypeTone,
    status: 'pending_calibration' | 'calibrated' | 'executed',
    comments: Array<{
      id: string,
      point: string,
      observation: string
    }>,
    tokens: {
      totalTokenCount: number,
      promptTokenCount: number,
      candidatesTokenCount: number
    },
    timestamp: string
  }>,
  ultimo_analisis: {...},  // Mantener por compatibilidad
  ultimo_arquetipo: string,
  timestamp_analisis: string,
  timestamp_ejecucion?: string
}
```
