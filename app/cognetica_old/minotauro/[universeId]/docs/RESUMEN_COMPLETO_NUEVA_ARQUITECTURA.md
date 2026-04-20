# Resumen Completo: Nueva Arquitectura Minotauro

## 🎯 Visión General

Arquitectura sólida, elegante e inmutable que resuelve todos los problemas previos:
- ✅ **Append-only**: Cada interacción es un registro inmutable
- ✅ **Versiones del texto**: Navegación temporal completa
- ✅ **Campo "Sentido"**: Pre-calibración para orientar arquetipos
- ✅ **Referencias numeradas**: Sistema simple de citación (1, 2, 3...)
- ✅ **UI dual**: Visor PDF arriba + Timeline arquetipos abajo

---

## 📐 Arquitectura Implementada

### **1. Estructura de Datos (Metadata de Galaxy)**

```typescript
{
  // Contenido actual
  content: string,
  word_count: number,
  char_count: number,
  estimated_pages: number,
  
  // Historial de versiones del texto (append-only)
  versiones_texto: [
    {
      version: 1,
      content: "Texto original...",
      timestamp: "2026-02-18T15:00:00Z",
      origen: "humano"
    },
    {
      version: 2,
      content: "Texto después de Deslixador...",
      timestamp: "2026-02-18T15:30:00Z",
      origen: "arquetipo",
      arquetipo_id: "uuid-analisis-1"
    }
  ],
  
  // Historial de análisis de arquetipos (append-only)
  historial_arquetipos: [
    {
      id: "uuid-1",
      version_entrada: 1,
      version_salida: 2,
      archetype: "Deslixador",
      sentido: "Acortar pero no diluir el argumento principal",
      timestamp_analisis: "2026-02-18T15:00:00Z",
      timestamp_ejecucion: "2026-02-18T15:30:00Z",
      status: "executed",
      comments: [...],
      instruccion_final: "Reformula el párrafo 3...",
      tokens: {...}
    }
  ],
  
  // Fuentes curadas con números asignados
  fuentes_curadas: [
    {
      id: "uuid-1",
      numero: 1,
      titulo: "Attention Is All You Need",
      autor: "Vaswani et al.",
      año: 2017,
      tipo: "paper",
      resumen: "Introduce el modelo Transformer...",
      timestamp: "2026-02-18T15:00:00Z"
    }
  ],
  siguiente_numero_referencia: 2,
  
  // Versión actual visualizada
  version_actual: 2
}
```

---

## 🎨 Componentes UI Creados

### **1. SentidoInput** (Pre-calibración)
**Ubicación**: `components/SentidoInput.tsx`

```
┌─────────────────────────────────────────────────┐
│ 🎯 Sentido de la Intervención (Opcional)       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Acortar sin diluir el argumento principal  │ │
│ └─────────────────────────────────────────────┘ │
│ 💡 Orienta al arquetipo con una instrucción... │
└─────────────────────────────────────────────────┘
```

**Propósito**: Instrucción breve del humano ANTES de que el arquetipo analice.

---

### **2. TextVersionViewer** (Visor PDF)
**Ubicación**: `components/TextVersionViewer.tsx`

```
┌─────────────────────────────────────────────────┐
│ 📄 Visor de Texto  [🤖 Generado por IA]        │
│ ← [v1] [v2] [v3] [v4] →                        │
│                                                 │
│ [Texto con estilo PDF, fondo blanco, serif]    │
│                                                 │
│ 450 palabras • 2,500 caracteres                │
└─────────────────────────────────────────────────┘
```

**Características**:
- Navegación entre versiones con flechas
- Índice clickeable de versiones
- Badge indica origen: 📝 Original | 🤖 Generado por IA
- Estilo PDF: Georgia serif, fondo blanco, márgenes amplios
- Estadísticas en footer

---

### **3. ArchetypeTimeline** (Historial cronológico)
**Ubicación**: `components/ArchetypeTimeline.tsx`

```
┌─────────────────────────────────────────────────┐
│ 📚 Historial de Arquetipos (3)                 │
│ Cronológico (más reciente primero)             │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🛠️ Deslixador  ✅ Ejecutado                │ │
│ │ v1 → v2 • 18 feb 15:00                     │ │
│ │ 🎯 Sentido: "Acortar sin diluir"          │ │
│ │ [Ver texto] [Ver más ▼]                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🌸 Polinizador  ⏳ Pendiente               │ │
│ │ v2 → (sin ejecutar) • 18 feb 16:30        │ │
│ │ [Ver más ▼]                                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Características**:
- Cards expandibles con comentarios completos
- Botón "Ver texto" navega a la versión generada
- Muestra sentido, calibración, instrucción final
- Status visual: ⏳ Pendiente | 📊 Calibrado | ✅ Ejecutado

---

### **4. ReferencesPanel** (Fuentes curadas)
**Ubicación**: `components/ReferencesPanel.tsx`

```
┌─────────────────────────────────────────────────┐
│ 📚 Referencias Curadas (3)        [+ Agregar]  │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [1]  Vaswani et al. 2017                   │ │
│ │      "Attention Is All You Need"           │ │
│ │      📄 Paper  [Ver fuente →]              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [2]  OpenAI 2023                           │ │
│ │      "GPT-4 Technical Report"              │ │
│ │      📄 Paper  [Ver fuente →]              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 💡 Cómo citar en el texto:                     │
│ • Usa el número: (1)                           │
│ • O con autor: Altman 2022 (1)                 │
└─────────────────────────────────────────────────┘
```

**Características**:
- Número único asignado automáticamente
- Clickeable para ver detalles
- Link externo a fuente original
- Tipos: 📄 Paper, 📚 Libro, 📰 Artículo, 🌐 Web
- Ayuda de uso integrada

---

## 🔄 Flujo Completo de Uso

### **Paso 1: Definir Sentido**
```
Usuario escribe en SentidoInput:
"Acortar pero mantener el argumento principal"
```

### **Paso 2: Seleccionar Arquetipo**
```
Usuario hace clic en: 🛠️ Deslixador
```

### **Paso 3: Arquetipo Analiza**
```
API recibe:
- content: texto de version_actual
- archetype: "Deslixador"
- sentido: "Acortar pero mantener el argumento principal"
- fuentes_curadas: [lista con números]

Arquetipo usa referencias en sus comentarios:
"Este argumento necesita respaldo. Cita (1) aquí."
```

### **Paso 4: Guardar Análisis (Append-Only)**
```typescript
const nuevoAnalisis = {
  id: generateUUID(),
  version_entrada: metadata.version_actual,
  version_salida: null,
  archetype: "Deslixador",
  sentido: "Acortar pero mantener el argumento principal",
  timestamp_analisis: new Date().toISOString(),
  status: "pending_calibration",
  comments: [...],
  tokens: {...}
};

metadata.historial_arquetipos.push(nuevoAnalisis);
```

### **Paso 5: Calibración Humana**
```
Usuario responde a cada comentario:
✅ Aceptado
❌ Rechazado
📝 Rechazado con nota
```

### **Paso 6: Instrucción Final**
```
Usuario escribe:
"Reformula el párrafo 3 para que sea más directo"
```

### **Paso 7: Ejecutar Nueva Versión**
```
Arquetipo genera texto con referencias:
"El modelo Transformer (1) revolucionó el procesamiento 
de lenguaje natural..."

Sistema guarda:
- Nueva versión en versiones_texto[]
- Actualiza análisis con version_salida
- Actualiza version_actual
```

### **Paso 8: Visualización**
```
TextVersionViewer muestra nueva versión
ArchetypeTimeline muestra análisis completo
Referencias (1) son clickeables
```

---

## 🤖 Integración con Arquetipos

### **Prompt Actualizado**

```
CONTEXTO DEL ANÁLISIS:
Sentido de la intervención: "Acortar pero no diluir el argumento principal"

REFERENCIAS DISPONIBLES:
[1] Vaswani et al. 2017 - "Attention Is All You Need"
    Resumen: Introduce el modelo Transformer...

[2] OpenAI 2023 - "GPT-4 Technical Report"
    Resumen: Describe las capacidades de GPT-4...

INSTRUCCIONES:
- Usa los números entre paréntesis para citar: (1), (2)
- Puedes mencionar autor y año: "Vaswani et al. 2017 (1)"
- Usa las referencias para dar peso a tus argumentos
- NO inventes referencias que no estén en la lista
- Considera el "sentido" al hacer tus recomendaciones

TEXTO A ANALIZAR:
[contenido actual]
```

### **Ejemplo de Comentario con Referencias**

```json
{
  "point": "Argumento sin respaldo",
  "observation": "Este párrafo afirma que los Transformers revolucionaron NLP, pero no cita evidencia. Agrega referencia a Vaswani et al. 2017 (1) para dar peso al argumento."
}
```

---

## 📊 Beneficios de la Arquitectura

### **1. Inmutabilidad**
- ✅ Cada análisis es un registro permanente
- ✅ Nunca se pierde información
- ✅ Trazabilidad completa

### **2. Navegación Temporal**
- ✅ Ver cualquier versión previa del texto
- ✅ Comparar versiones
- ✅ Saber qué arquetipo generó cada versión

### **3. Pre-calibración con "Sentido"**
- ✅ Orienta al arquetipo desde el inicio
- ✅ Reduce iteraciones innecesarias
- ✅ Resultados más alineados con expectativas

### **4. Referencias Numeradas**
- ✅ Lenguaje común entre humano y arquetipos
- ✅ Citación simple y elegante
- ✅ Arquetipos se enfocan en geometría, no en verificación
- ✅ Trazabilidad de fuentes

### **5. UI Elegante**
- ✅ Visor PDF profesional
- ✅ Timeline cronológico claro
- ✅ Referencias discretas pero accesibles
- ✅ Navegación intuitiva

---

## 🗂️ Archivos Creados

### **Documentación**
1. `/docs/ARQUITECTURA_APPEND_ONLY_ARQUETIPOS.md` - Especificación completa
2. `/docs/SISTEMA_REFERENCIAS_NUMERADAS.md` - Sistema de citación
3. `/docs/RESUMEN_IMPLEMENTACION_APPEND_ONLY.md` - Guía de implementación
4. `/docs/RESUMEN_COMPLETO_NUEVA_ARQUITECTURA.md` - Este documento

### **Tipos TypeScript**
5. `/lib/types/minotauro-append-types.ts` - Tipos completos

### **Componentes UI**
6. `/components/SentidoInput.tsx` - Pre-calibración
7. `/components/TextVersionViewer.tsx` - Visor PDF
8. `/components/ArchetypeTimeline.tsx` - Timeline arquetipos
9. `/components/ReferencesPanel.tsx` - Panel de referencias

---

## 🚀 Próximos Pasos de Integración

### **Fase 1: Backend**
1. Actualizar `useArchetypeProcessor` para append-only
2. Actualizar API para recibir "sentido" y "fuentes_curadas"
3. Modificar prompt de arquetipos para incluir referencias

### **Fase 2: Frontend**
4. Integrar componentes en `page.tsx`
5. Agregar lógica de navegación entre versiones
6. Implementar detección de referencias en texto (regex)
7. Agregar tooltips para referencias

### **Fase 3: Migración**
8. Ejecutar SQL para convertir datos existentes
9. Probar flujo completo con datos reales
10. Ajustar según feedback

---

## 💡 Ejemplo Completo de Uso

**Usuario agrega fuente:**
```
Título: "Attention Is All You Need"
Autor: Vaswani et al.
Año: 2017
Tipo: Paper
→ Sistema asigna número [1]
```

**Usuario define sentido:**
```
"Acortar pero no diluir el argumento principal"
```

**Usuario selecciona arquetipo:**
```
🛠️ Deslixador
```

**Arquetipo analiza y comenta:**
```
"Párrafo 2 es muy extenso. Puedes reducirlo a la mitad 
sin perder sustancia. El argumento sobre Transformers (1) 
es sólido, pero está enterrado en detalles innecesarios."
```

**Usuario calibra:**
```
✅ Aceptado: "Sí, es redundante"
```

**Usuario da instrucción final:**
```
"Mantén la referencia a Transformers (1) pero hazla más directa"
```

**Arquetipo ejecuta:**
```
"El modelo Transformer (1) revolucionó el procesamiento 
de lenguaje natural al introducir el mecanismo de atención, 
permitiendo procesar secuencias de manera más eficiente."
```

**Sistema guarda:**
- ✅ Nueva versión en `versiones_texto[]`
- ✅ Análisis completo en `historial_arquetipos[]`
- ✅ Referencias preservadas
- ✅ Sentido registrado

**Usuario navega:**
- Ver versión anterior: Click en [v1]
- Ver análisis completo: Expandir card en timeline
- Ver fuente: Click en (1) → Tooltip → Link externo

---

## 🎯 Estado Actual

- ✅ **Arquitectura diseñada**: Completa y documentada
- ✅ **Tipos TypeScript**: Definidos y exportados
- ✅ **Componentes UI**: 4 componentes creados
- ⏳ **Integración**: Pendiente en `page.tsx`
- ⏳ **Backend**: Pendiente actualizar hooks y API
- ⏳ **Migración**: Pendiente SQL para datos existentes

---

## 🔧 Para Continuar

**Opción A (Rápida)**: Integrar componentes en `page.tsx` con datos mock para ver la UI

**Opción B (Completa)**: Actualizar toda la lógica backend primero, luego integrar UI

**Opción C (Incremental)**: Implementar una feature a la vez (ej: primero "sentido", luego versiones, luego referencias)

¿Qué prefieres?
