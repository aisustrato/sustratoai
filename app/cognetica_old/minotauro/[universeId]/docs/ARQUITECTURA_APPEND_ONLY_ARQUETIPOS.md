# Arquitectura Append-Only para Arquetipos Minotauro

## 🎯 Objetivo
Crear una arquitectura sólida, inmutable y elegante donde cada interacción con un arquetipo es un registro independiente que nunca se sobrescribe.

---

## 📐 Principios de Diseño

### 1. **Append-Only (Solo Agregar)**
- Cada análisis de arquetipo = 1 registro inmutable
- NUNCA se sobrescribe un análisis previo
- El historial crece como un log de eventos

### 2. **Campo "Sentido" (Pre-Calibración)**
- Instrucción breve del humano ANTES de que el arquetipo analice
- Ejemplo: "Acortar pero no diluir el argumento principal"
- El arquetipo recibe este "sentido" como contexto adicional

### 3. **Visualización Dual**
```
┌─────────────────────────────────────────────────┐
│  📄 VISOR DE TEXTO (Estilo PDF)                │
│  ← [v1] [v2] [v3] [v4] →  (Navegación)        │
│                                                 │
│  [Contenido del texto en versión seleccionada] │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📚 HISTORIAL DE ARQUETIPOS (Cronológico)      │
│                                                 │
│  🛠️ Deslixador • v1 • 18 feb 15:00            │
│  Sentido: "Acortar sin diluir"                 │
│  ✅ Ejecutado → Generó v2                      │
│                                                 │
│  🌸 Polinizador • v2 • 18 feb 16:30           │
│  Sentido: "Enriquecer con ejemplos"            │
│  ⏳ Pendiente calibración                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Estructura de Datos

### **Metadata de Galaxy**
```typescript
{
  // Contenido actual (última versión)
  content: string,
  word_count: number,
  char_count: number,
  estimated_pages: number,
  
  // Historial de versiones del texto
  versiones_texto: [
    {
      version: 1,
      content: "Texto original...",
      timestamp: "2026-02-18T15:00:00Z",
      origen: "humano" // o "arquetipo"
    },
    {
      version: 2,
      content: "Texto después de Deslixador...",
      timestamp: "2026-02-18T15:30:00Z",
      origen: "arquetipo",
      arquetipo_id: "ref-al-analisis-1"
    }
  ],
  
  // Historial de análisis de arquetipos (append-only)
  historial_arquetipos: [
    {
      id: "uuid-1",
      version_entrada: 1,  // Versión del texto que analizó
      version_salida: 2,   // Versión del texto que generó (si ejecutó)
      archetype: "Deslixador",
      sentido: "Acortar pero no diluir el argumento principal",
      timestamp_analisis: "2026-02-18T15:00:00Z",
      timestamp_ejecucion: "2026-02-18T15:30:00Z",
      status: "executed", // pending_calibration | calibrated | executed
      
      // Comentarios del arquetipo
      comments: [
        {
          id: "c1",
          point: "Párrafo 2 muy extenso",
          observation: "Se puede reducir a la mitad sin perder sustancia",
          respuesta_humano: "aceptado",
          nota_humano: "Sí, es redundante"
        }
      ],
      
      // Instrucción final del humano
      instruccion_final: "Reformula el párrafo 3 para que sea más conciso",
      
      // Tokens usados
      tokens: {
        totalTokenCount: 1500,
        promptTokenCount: 1000,
        candidatesTokenCount: 500
      }
    }
  ],
  
  // Índice de versión actual visualizada
  version_actual: 2
}
```

---

## 🎨 Componentes UI

### **1. TextVersionViewer (Arriba)**
- Muestra el texto de la versión seleccionada
- Estilo PDF: fondo blanco, tipografía legible, márgenes
- Navegación: `← [v1] [v2] [v3] [v4] →`
- Indicador de origen: "📝 Original" | "🤖 Generado por Deslixador"

### **2. ArchetypeTimeline (Abajo)**
- Lista cronológica de todos los análisis
- Cada card muestra:
  - Emoji + nombre del arquetipo
  - Versión entrada → versión salida
  - Campo "Sentido" (si existe)
  - Status: ⏳ Pendiente | 📊 Calibrado | ✅ Ejecutado
  - Botón "Ver análisis completo" (expande comentarios)
  - Botón "Ver texto generado" (navega a esa versión)

### **3. SentidoInput (Nuevo)**
- Textarea pequeño (2-3 líneas)
- Placeholder: "Ej: Acortar sin diluir, Enriquecer con ejemplos, Simplificar lenguaje técnico"
- Se muestra ANTES de seleccionar arquetipo
- Se guarda con el análisis

---

## 🔄 Flujo de Interacción

### **Paso 1: Definir Sentido**
```
Usuario escribe: "Acortar pero mantener el argumento principal"
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
- projectId: "..."

API responde:
- comments: [...]
- tokens: {...}
```

### **Paso 4: Guardar Análisis (Append-Only)**
```typescript
const nuevoAnalisis = {
  id: generateUUID(),
  version_entrada: metadata.version_actual,
  version_salida: null, // Aún no ejecutado
  archetype: "Deslixador",
  sentido: "Acortar pero mantener el argumento principal",
  timestamp_analisis: new Date().toISOString(),
  status: "pending_calibration",
  comments: [...],
  tokens: {...}
};

// Append al historial (NO sobrescribir)
metadata.historial_arquetipos.push(nuevoAnalisis);
```

### **Paso 5: Calibración Humana**
```
Usuario responde a cada comentario:
- ✅ Aceptado
- ❌ Rechazado sin razón
- 📝 Rechazado con razón: "No es redundante, es necesario"
- 🤔 Neutral
```

### **Paso 6: Instrucción Final**
```
Usuario escribe: "Reformula el párrafo 3 para que sea más directo"
```

### **Paso 7: Ejecutar Nueva Versión**
```
API recibe:
- galaxyId
- archetype
- calibracion: [respuestas humanas]
- instruccion_final: "Reformula el párrafo 3..."
- ejecutar_version: true

API responde:
- nueva_version: "Texto reformulado..."
- tokens: {...}
```

### **Paso 8: Guardar Nueva Versión (Append-Only)**
```typescript
// Crear nueva versión del texto
const nuevaVersion = {
  version: metadata.versiones_texto.length + 1,
  content: nueva_version,
  timestamp: new Date().toISOString(),
  origen: "arquetipo",
  arquetipo_id: nuevoAnalisis.id
};

metadata.versiones_texto.push(nuevaVersion);

// Actualizar análisis con versión de salida
nuevoAnalisis.version_salida = nuevaVersion.version;
nuevoAnalisis.timestamp_ejecucion = new Date().toISOString();
nuevoAnalisis.status = "executed";
nuevoAnalisis.instruccion_final = "Reformula el párrafo 3...";
nuevoAnalisis.calibracion_humana = [...];

// Actualizar versión actual
metadata.version_actual = nuevaVersion.version;
metadata.content = nueva_version; // Por compatibilidad
```

---

## 🛡️ Garantías de Integridad

### **1. Inmutabilidad**
- Una vez creado, un análisis NUNCA se modifica
- Solo se actualiza su `status`, `version_salida`, `timestamp_ejecucion`, `instruccion_final`, `calibracion_humana`

### **2. Trazabilidad Completa**
- Cada versión del texto sabe qué arquetipo la generó
- Cada análisis sabe qué versión analizó y qué versión generó

### **3. Navegación Temporal**
- Usuario puede ver cualquier versión previa del texto
- Usuario puede ver qué arquetipo generó cada versión

### **4. Preservación de Contexto**
- El "sentido" se guarda con cada análisis
- Las calibraciones humanas se preservan
- Las instrucciones finales se preservan

---

## 🚀 Migración de Datos Existentes

```sql
-- Convertir metadata actual a nuevo formato
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
  jsonb_set(
    metadata,
    '{versiones_texto}',
    jsonb_build_array(
      jsonb_build_object(
        'version', 1,
        'content', metadata->'content',
        'timestamp', COALESCE(metadata->>'timestamp_analisis', NOW()::text),
        'origen', 'humano'
      )
    )
  ),
  '{historial_arquetipos}',
  COALESCE(metadata->'historial_analisis', '[]'::jsonb)
)
WHERE metadata IS NOT NULL;
```

---

## 📊 Beneficios de Esta Arquitectura

1. ✅ **Historial completo**: Nunca se pierde información
2. ✅ **Navegación temporal**: Ver cualquier versión del texto
3. ✅ **Trazabilidad**: Saber qué arquetipo generó qué versión
4. ✅ **Pre-calibración**: El "sentido" orienta al arquetipo desde el inicio
5. ✅ **Elegante**: UI clara con visor PDF + timeline de arquetipos
6. ✅ **Escalable**: Fácil agregar más arquetipos o versiones
7. ✅ **Debuggeable**: Cada paso está registrado

---

## 🎯 Próximos Pasos de Implementación

1. Actualizar tipos TypeScript con nueva estructura
2. Crear componente `TextVersionViewer`
3. Crear componente `ArchetypeTimeline`
4. Crear componente `SentidoInput`
5. Actualizar `useArchetypeProcessor` para append-only
6. Actualizar API para recibir "sentido"
7. Migrar datos existentes
8. Probar flujo completo
