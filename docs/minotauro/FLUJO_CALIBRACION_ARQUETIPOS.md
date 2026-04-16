# Flujo Iterativo de Calibración con Arquetipos

## 🎯 Concepto Central

**No es un proceso automático, es un diálogo iterativo:**

1. **Arquetipo analiza** → Genera comentarios estructurados (no texto corrido)
2. **Usuario calibra** → Responde a cada comentario ("me gusta", "reforzar", "cambiar")
3. **Arquetipo ejecuta** → Genera nueva versión basada en calibración
4. **Siguiente arquetipo** → Ve la versión calibrada (no la original)

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuario escribe contenido MD inicial            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. Hace clic en Arquetipo (ej: Editor)             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. Arquetipo genera COMENTARIOS ESTRUCTURADOS      │
│    - Punto 1: "Apertura impactante"                │
│      Observación: "Necesitas gancho inicial..."    │
│    - Punto 2: "Contexto expandido"                 │
│      Observación: "Desarrollar en 2-3 párrafos..." │
│    - Punto 3: ...                                   │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. Usuario CALIBRA cada comentario:                │
│    ✅ Aprobar: "Sí, me gusta este punto"           │
│    ✏️ Modificar: "Reforzar esto" + nota            │
│    ❌ Rechazar: "No aplicar este cambio"           │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 5. Usuario hace clic en "Ejecutar Versión"         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 6. Arquetipo genera NUEVA VERSIÓN del contenido    │
│    basada en calibración (solo puntos aprobados/   │
│    modificados, ignorando rechazados)               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 7. Nueva versión se guarda en historial            │
│    v4 - Editor (calibrado) - hace unos segundos    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 8. Usuario puede usar otro arquetipo               │
│    (verá la v4 calibrada, no la v3 original)       │
└─────────────────────────────────────────────────────┘
```

## 🎨 Interfaz de Calibración

### **Panel de Comentarios del Arquetipo**

```
┌─ ✍️ Análisis del Editor ─────────────────────────[X]─┐
│ 📊 1,678 tokens • Estado: Pendiente calibración      │
│                                                        │
│ ┌─ Comentario 1/6 ────────────────────────────────┐  │
│ │ 📌 Punto: Apertura impactante                   │  │
│ │                                                  │  │
│ │ 💬 Observación:                                 │  │
│ │ Comienza con una estadística o pregunta         │  │
│ │ provocadora que capte la atención. La apertura  │  │
│ │ actual es demasiado plana.                      │  │
│ │                                                  │  │
│ │ Tu respuesta:                                    │  │
│ │ ○ ✅ Aprobar  ○ ✏️ Modificar  ○ ❌ Rechazar     │  │
│ │                                                  │  │
│ │ [Si selecciona Modificar, aparece textarea:]    │  │
│ │ Nota: [Reforzar con ejemplo de ChatGPT...     ] │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ┌─ Comentario 2/6 ────────────────────────────────┐  │
│ │ 📌 Punto: Contexto expandido                    │  │
│ │ ...                                              │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ [Progreso: 2/6 comentarios calibrados]                │
│                                                        │
│ [🚀 Ejecutar Nueva Versión] [💾 Guardar Calibración] │
└────────────────────────────────────────────────────────┘
```

## 🔄 Estados del Análisis

1. **`pending_calibration`** - Arquetipo generó comentarios, esperando respuesta del usuario
2. **`calibrated`** - Usuario respondió a todos los comentarios, listo para ejecutar
3. **`executed`** - Nueva versión generada y guardada

## 📝 Estructura de Datos

```typescript
interface ArchetypeComment {
  id: string;
  point: string; // "Apertura impactante"
  observation: string; // "Comienza con una estadística..."
  userResponse?: 'approve' | 'modify' | 'reject';
  userNote?: string; // Solo si userResponse === 'modify'
}

interface ArchetypeAnalysis {
  archetype: 'bufon' | 'auditor' | 'editor' | 'colega';
  comments: ArchetypeComment[];
  tokens: { totalTokenCount, promptTokenCount, candidatesTokenCount };
  status: 'pending_calibration' | 'calibrated' | 'executed';
}
```

## 🎯 Beneficios del Flujo Iterativo

✅ **Control total** - Usuario decide qué cambios aplicar
✅ **Calibración fina** - Puede reforzar o modificar sugerencias
✅ **Transparencia** - Ve exactamente qué va a cambiar
✅ **Aprendizaje** - El arquetipo aprende de las calibraciones
✅ **Historial claro** - Cada versión muestra qué arquetipo y calibración se usó
✅ **Flujo natural** - Diálogo humano-IA, no automatización ciega

## 🚀 Implementación en Mock

1. **Botón arquetipo** → Simula 2s de "análisis" → Muestra panel de comentarios
2. **Usuario calibra** → Responde a cada comentario con radio buttons
3. **Botón "Ejecutar"** → Simula 2s de "generación" → Crea nueva versión
4. **Nueva versión** → Se agrega al historial con badge "calibrado"
5. **Siguiente arquetipo** → Lee la última versión (la calibrada)

## 💡 Ejemplo Completo

**Versión original (v1):**
```markdown
# Introducción

Este es el contenido MD de la introducción...
```

**Editor analiza → 6 comentarios**

**Usuario calibra:**
- Comentario 1 (Apertura): ✅ Aprobar
- Comentario 2 (Contexto): ✏️ Modificar + "Enfocarse en IA médica"
- Comentario 3 (Objetivo): ✅ Aprobar
- Comentario 4 (Redacción): ❌ Rechazar
- Comentario 5 (Conectores): ✅ Aprobar
- Comentario 6 (Alcance): ✏️ Modificar + "2020-2024"

**Usuario hace clic "Ejecutar Nueva Versión"**

**Editor genera v2 (calibrada):**
```markdown
# Introducción

¿Puede una IA diagnosticar mejor que un médico? [← Apertura aprobada]

Este es el contenido expandido sobre IA médica... [← Contexto modificado]

El objetivo es evaluar... [← Objetivo aprobado]

[Conectores agregados entre párrafos] [← Conectores aprobados]

Alcance temporal: 2020-2024 [← Alcance modificado]

[Redacción original mantenida] [← Redacción rechazada, no cambió]
```

**Historial:**
- v2 - Editor (calibrado) - hace unos segundos
- v1 - Original - hace 1 hora

**Ahora puede usar Auditor, que verá v2, no v1**
