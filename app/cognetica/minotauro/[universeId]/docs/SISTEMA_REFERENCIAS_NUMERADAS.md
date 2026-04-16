# Sistema de Referencias Numeradas para Fuentes Curadas

## 🎯 Objetivo
Crear un sistema simple y elegante donde cada fuente curada tiene un número asignado (1, 2, 3...) que se puede citar en el texto. Los arquetipos usan estos números para dar peso a sus argumentos sin necesidad de verificar URLs o metadatos.

---

## 📐 Principio de Diseño

### **Lenguaje Común de Referencias**
- Cada fuente curada = 1 número único
- Sintaxis de citación: `Altman 2022 (1)` o simplemente `(1)`
- Los arquetipos trabajan en "geometría y viabilidad", no en verificación de fuentes
- El humano ve las referencias numeradas y puede consultarlas si quiere

---

## 🗄️ Estructura de Datos

### **Fuente Curada con Número**
```typescript
interface CuratedSourceWithNumber {
  id: string;
  numero: number;  // ← Número asignado automáticamente
  titulo: string;
  autor?: string;
  año?: number;
  url?: string;
  tipo: 'paper' | 'libro' | 'articulo' | 'web' | 'otro';
  resumen?: string;
  timestamp: string;
}
```

### **Metadata de Galaxy (actualizado)**
```typescript
{
  // ... campos existentes
  
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
    },
    {
      id: "uuid-2",
      numero: 2,
      titulo: "GPT-4 Technical Report",
      autor: "OpenAI",
      año: 2023,
      tipo: "paper",
      timestamp: "2026-02-18T15:30:00Z"
    }
  ]
}
```

---

## 🎨 Visualización de Referencias

### **Panel de Referencias (Sidebar o Sección)**
```
┌─────────────────────────────────────────┐
│ 📚 Referencias Curadas (3)             │
├─────────────────────────────────────────┤
│ [1] Vaswani et al. 2017                │
│     "Attention Is All You Need"        │
│     📄 Paper                            │
│                                         │
│ [2] OpenAI 2023                        │
│     "GPT-4 Technical Report"           │
│     📄 Paper                            │
│                                         │
│ [3] Altman 2022                        │
│     "Planning for AGI and beyond"      │
│     🌐 Web                              │
└─────────────────────────────────────────┘
```

### **Citación en el Texto**
```
El modelo Transformer (1) revolucionó el procesamiento 
de lenguaje natural. Posteriormente, GPT-4 (2) demostró 
capacidades emergentes. Según Altman 2022 (3), la 
planificación para AGI requiere...
```

### **Tooltip al Hover sobre (1)**
```
┌─────────────────────────────────────┐
│ [1] Vaswani et al. 2017            │
│ "Attention Is All You Need"        │
│ 📄 Paper                            │
│ [Ver fuente completa]               │
└─────────────────────────────────────┘
```

---

## 🤖 Uso por Arquetipos

### **Prompt Actualizado para Arquetipos**
```
Tienes acceso a las siguientes fuentes curadas:

[1] Vaswani et al. 2017 - "Attention Is All You Need"
    Resumen: Introduce el modelo Transformer...

[2] OpenAI 2023 - "GPT-4 Technical Report"
    Resumen: Describe las capacidades de GPT-4...

[3] Altman 2022 - "Planning for AGI and beyond"
    Resumen: Visión sobre el desarrollo de AGI...

INSTRUCCIONES:
- Usa los números entre paréntesis para citar: (1), (2), (3)
- Puedes mencionar autor y año antes: "Vaswani et al. 2017 (1)"
- Usa las referencias para dar peso a tus argumentos
- NO inventes referencias que no estén en la lista
- Si quieres enfatizar un punto, cita la fuente relevante

Ejemplo de uso:
"El mecanismo de atención (1) permite procesar secuencias 
de manera más eficiente. Esto se refleja en GPT-4 (2), 
donde las capacidades emergentes..."
```

### **Ejemplo: Bufón Usando Referencias**
```
🃏 Bufón: "Mira, aquí estás citando a Altman (3) pero 
¿realmente necesitas toda esa introducción? Ve directo 
al grano: 'Según Altman 2022 (3), la planificación para 
AGI requiere...' ¡Boom! Más impacto, menos palabrería."
```

### **Ejemplo: Deslixador Usando Referencias**
```
🛠️ Deslixador: "Este párrafo tiene 3 ideas mezcladas. 
Sepáralas:
1. Transformers revolucionaron NLP (1)
2. GPT-4 mostró capacidades emergentes (2)
3. La planificación de AGI requiere consideraciones éticas (3)

Cada idea merece su propio espacio."
```

---

## 🔧 Implementación Técnica

### **1. Asignación Automática de Números**
```typescript
// Al agregar una fuente curada
const agregarFuente = (fuente: Omit<CuratedSourceWithNumber, 'numero'>) => {
  const fuentesActuales = metadata.fuentes_curadas || [];
  const siguienteNumero = fuentesActuales.length + 1;
  
  const nuevaFuente = {
    ...fuente,
    numero: siguienteNumero
  };
  
  metadata.fuentes_curadas.push(nuevaFuente);
};
```

### **2. Componente ReferencesPanel**
```typescript
interface ReferencesPanelProps {
  fuentes: CuratedSourceWithNumber[];
  onSelectReference: (numero: number) => void;
}

export function ReferencesPanel({ fuentes, onSelectReference }: ReferencesPanelProps) {
  return (
    <StandardCard className="p-4">
      <h3 className="text-sm font-medium mb-3">📚 Referencias Curadas ({fuentes.length})</h3>
      <div className="space-y-2">
        {fuentes.map(fuente => (
          <div 
            key={fuente.id}
            className="p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectReference(fuente.numero)}
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-xs font-bold">[{fuente.numero}]</span>
              <div className="flex-1">
                <div className="text-xs font-medium">
                  {fuente.autor} {fuente.año}
                </div>
                <div className="text-xs text-muted-foreground">
                  "{fuente.titulo}"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getTipoEmoji(fuente.tipo)} {fuente.tipo}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </StandardCard>
  );
}
```

### **3. Detección de Referencias en el Texto**
```typescript
// Regex para detectar referencias: (1), (2), etc.
const REFERENCE_REGEX = /\((\d+)\)/g;

// Componente para renderizar texto con referencias clickeables
const renderTextWithReferences = (text: string, onReferenceClick: (num: number) => void) => {
  const parts = text.split(REFERENCE_REGEX);
  
  return parts.map((part, idx) => {
    // Si es un número de referencia
    if (idx % 2 === 1) {
      const refNum = parseInt(part);
      return (
        <span 
          key={idx}
          className="text-primary font-medium cursor-pointer hover:underline"
          onClick={() => onReferenceClick(refNum)}
        >
          ({refNum})
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};
```

### **4. Tooltip de Referencia**
```typescript
const ReferenceTooltip = ({ numero, fuente }: { numero: number, fuente: CuratedSourceWithNumber }) => (
  <div className="p-3 bg-popover border rounded-lg shadow-lg max-w-xs">
    <div className="font-mono text-xs font-bold mb-1">[{numero}]</div>
    <div className="text-xs font-medium">{fuente.autor} {fuente.año}</div>
    <div className="text-xs text-muted-foreground mt-1">"{fuente.titulo}"</div>
    <div className="text-xs text-muted-foreground mt-1">
      {getTipoEmoji(fuente.tipo)} {fuente.tipo}
    </div>
    {fuente.url && (
      <a 
        href={fuente.url} 
        target="_blank"
        className="text-xs text-primary hover:underline mt-2 block"
      >
        Ver fuente completa →
      </a>
    )}
  </div>
);
```

---

## 🎯 Flujo de Uso

### **1. Humano Agrega Fuentes**
```
Usuario hace clic en "Agregar Fuente"
→ Completa formulario (título, autor, año, URL, tipo)
→ Sistema asigna número automáticamente (siguiente disponible)
→ Fuente aparece en panel de referencias con su número
```

### **2. Arquetipo Analiza con Referencias**
```
Arquetipo recibe:
- Texto actual
- Lista de referencias numeradas con resúmenes
- Sentido de la intervención

Arquetipo genera comentarios usando referencias:
"Este argumento necesita respaldo. Cita (1) aquí para dar peso."
"Estás repitiendo lo que ya dice (2). Elimina redundancia."
```

### **3. Humano Ejecuta Nueva Versión**
```
Arquetipo genera texto con referencias:
"El modelo Transformer (1) revolucionó el procesamiento 
de lenguaje natural al introducir el mecanismo de atención..."

Usuario ve referencias clickeables en el texto
Hover sobre (1) → Tooltip con info de la fuente
Click en (1) → Scroll al panel de referencias
```

---

## 📊 Beneficios

✅ **Simplicidad**: Solo números, no URLs largas ni metadatos complejos
✅ **Lenguaje común**: Arquetipos y humano hablan el mismo idioma
✅ **Libertad creativa**: Arquetipos se enfocan en geometría/viabilidad, no en verificación
✅ **Trazabilidad**: Cada argumento puede respaldarse con fuentes
✅ **Elegancia**: Referencias discretas que no interrumpen la lectura
✅ **Escalabilidad**: Fácil agregar más fuentes (siguiente número disponible)

---

## 🚀 Integración con Arquitectura Append-Only

Las referencias se mantienen en el metadata de la galaxy y son **inmutables**:
- Una vez asignado un número, nunca cambia
- Si se elimina una fuente, su número queda "reservado" (no se reutiliza)
- Cada versión del texto mantiene sus referencias intactas

```typescript
interface GalaxyMetadataAppendOnly {
  // ... campos existentes
  
  fuentes_curadas: CuratedSourceWithNumber[];
  siguiente_numero_referencia: number;  // Para asignar nuevos números
}
```

---

## 💡 Ejemplo Completo

**Panel de Referencias:**
```
[1] Vaswani et al. 2017 - "Attention Is All You Need"
[2] OpenAI 2023 - "GPT-4 Technical Report"
[3] Altman 2022 - "Planning for AGI and beyond"
```

**Texto con Referencias:**
```
El desarrollo de modelos de lenguaje ha experimentado 
avances significativos. El modelo Transformer (1) 
introdujo el mecanismo de atención, permitiendo procesar 
secuencias de manera más eficiente. Posteriormente, 
GPT-4 (2) demostró capacidades emergentes en razonamiento 
y creatividad. Según Altman 2022 (3), la planificación 
para AGI requiere consideraciones éticas desde el inicio.
```

**Comentario de Bufón:**
```
🃏 "¿Tres referencias en un solo párrafo? Estás haciendo 
un desfile académico. Divide esto:

Párrafo 1: Transformers (1)
Párrafo 2: GPT-4 (2) 
Párrafo 3: Planificación AGI (3)

Cada idea merece su momento estelar."
```
