# Especificación: Selector Granular de Artefactos en Minotauro

**Fecha:** 6 de marzo de 2026  
**Objetivo:** Implementar control granular de selección de elementos de artefactos cognéticos con gestión de tokens antes de enviar a arquetipos.

---

## 🎯 Requerimientos del Usuario

### **1. Interfaz Similar al Jardín**
Replicar la interfaz del Jardín que muestra desglose de tokens por elemento:
- 📝 Transcripción: X tokens
- 📖 Ensayo: X tokens  
- 🧠 Cognitivos: X tokens
- 📅 Cronológicos: X tokens
- 🍄 Micelio: X tokens
- 💬 Chat: X tokens
- **Total: X tokens**

### **2. Checkboxes por Elemento**
Cada artefacto debe tener un **StandardCheckbox principal** para seleccionarlo, y dentro:
- Checkboxes individuales por cada elemento disponible
- Usuario decide qué elementos enviar según límite de tokens

### **3. Barra de Progreso de Tokens**
- Límite: **130,000 tokens**
- Suma de todos los elementos seleccionados de todos los artefactos
- Visual: StandardProgressBar mostrando uso actual vs límite

### **4. Lógica de Selección Inteligente**
**Ejemplo de decisión del investigador:**
- 1 artefacto solo → Puede enviar transcripción completa
- 3+ artefactos → Debe decidir enviar solo ensayo destilado + elementos
- Sistema debe indicar claramente qué se está enviando

### **5. StandardDialog Obligatorio**
Al hacer clic en arquetipo, mostrar dialog con:

**Contenido del Dialog:**
```
📊 Resumen de Datos a Enviar al Arquetipo

🎯 Arquetipo: [Nombre del arquetipo]

📚 ARTEFACTOS SELECCIONADOS (X tokens):
  
  #1 Por_qué_la_academia_está_desincronizada.m4a
  ├─ ✅ Ensayo Destilado: 3,077 tokens
  ├─ ✅ Cognitivos: 689 tokens
  ├─ ✅ Micelio: 797 tokens
  └─ ❌ Transcripción: 76,184 tokens (excluida por límite)
  Subtotal: 4,563 tokens

  #2 Otro_artefacto.pdf
  ├─ ✅ Transcripción completa: 12,000 tokens
  └─ ✅ Cognitivos: 450 tokens
  Subtotal: 12,450 tokens

📝 HISTORIAL DE ITERACIONES PREVIAS (Y tokens):
  
  Iteración 1 - Deslixador (hace 2 días)
  ├─ 3 observaciones
  ├─ Calibración: "Mejorar claridad argumentativa"
  └─ Tokens: 1,234
  
  Iteración 2 - Polinizador (hace 1 día)
  ├─ 5 observaciones
  ├─ Calibración: "Agregar conexiones interdisciplinarias"
  └─ Tokens: 1,567

📄 TEXTO ORIGINAL ACTUAL (Z tokens):
  Versión 3 - 2,500 palabras
  Tokens: 3,200

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL: 21,447 / 130,000 tokens (16.5%)

[Cancelar]  [Enviar al Arquetipo]
```

---

## 🏗️ Arquitectura de Implementación

### **Componentes Nuevos a Crear**

#### **1. ArtifactTokenBreakdown.tsx**
Componente que muestra el desglose de tokens de un artefacto con checkboxes.

**Props:**
```typescript
interface ArtifactTokenBreakdownProps {
  artifact: CuratedSourceWithDetails;
  tokenData: GardenTokenBreakdown;
  selectedElements: Set<string>; // IDs de elementos seleccionados
  onElementToggle: (elementId: string) => void;
  isMainSelected: boolean;
}
```

**Estructura visual:**
```
┌─────────────────────────────────────────────────────┐
│ ☑ #1 Por_qué_la_academia_está_desincronizada.m4a   │
├─────────────────────────────────────────────────────┤
│   ☑ 📝 Transcripción: 76,184 tokens                │
│   ☑ 📖 Ensayo Destilado: 3,077 tokens              │
│   ☑ 🧠 Cognitivos: 689 tokens                      │
│   ☑ 📅 Cronológicos: 297 tokens                    │
│   ☑ 🍄 Micelio: 797 tokens                         │
│   ☐ 💬 Chat: 0 tokens (no disponible)             │
│   ─────────────────────────────────────────────────│
│   Total seleccionado: 81,044 tokens                │
└─────────────────────────────────────────────────────┘
```

#### **2. TokenProgressBar.tsx**
Barra de progreso que muestra uso de tokens vs límite.

**Props:**
```typescript
interface TokenProgressBarProps {
  currentTokens: number;
  maxTokens: number; // 130,000
  colorScheme?: ColorScheme;
}
```

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│ 💰 Tokens Utilizados                                │
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 21,447 / 130,000 tokens (16.5%)                    │
└─────────────────────────────────────────────────────┘
```

#### **3. ArchetypeConfirmationDialog.tsx**
Dialog que muestra resumen completo antes de enviar.

**Props:**
```typescript
interface ArchetypeConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  archetype: ArchetypeTone;
  selectedArtifacts: SelectedArtifactForArchetype[];
  previousIterations: ArchetypeAnalysis[];
  currentText: string;
  currentTextTokens: number;
}
```

---

### **Modificaciones a Componentes Existentes**

#### **1. CuratedSourcesPanel.tsx**

**Cambios:**
- Agregar estado `selectedElements` por artefacto
- Integrar `ArtifactTokenBreakdown` en lugar de selector simple de versión
- Calcular tokens progresivamente al cargar artefactos
- Exponer función `getSelectedArtifactsWithElements()` vía ref

**Nueva estructura de datos:**
```typescript
interface SelectedArtifactElements {
  artifactId: string;
  sourceId: string;
  selectedElements: {
    transcripcion?: boolean;
    ensayo_destilado?: boolean;
    elementos_cognitivos?: boolean;
    datos_cronologicos?: boolean;
    metabolizacion_micelio?: boolean;
    chat_calibrador?: boolean;
  };
  tokenBreakdown: GardenTokenBreakdown;
}
```

#### **2. page.tsx (Minotauro Universe)**

**Cambios:**
- Agregar `TokenProgressBar` arriba del panel de artefactos
- Modificar `handleProcessArchetype` para abrir `ArchetypeConfirmationDialog`
- Calcular tokens totales de selección actual
- Pasar datos completos al dialog

#### **3. useArchetypeProcessor.ts**

**Cambios:**
- Aceptar `selectedArtifactsWithElements` en lugar de `fuentesCuradas`
- Incluir historial de iteraciones previas en el payload
- Calcular tokens de cada sección

---

## 📊 Estructura de Datos

### **Payload al Backend**

```typescript
interface ArchetypeProcessPayload {
  galaxyId: string;
  archetype: ArchetypeTone;
  projectId: string;
  sentido: string;
  
  // NUEVO: Artefactos con selección granular
  selectedArtifacts: {
    sourceId: string;
    artifactId: string;
    elements: {
      transcripcion?: { included: boolean; tokens: number; preview: string };
      ensayo_destilado?: { included: boolean; tokens: number; preview: string };
      elementos_cognitivos?: { included: boolean; tokens: number; items: string[] };
      datos_cronologicos?: { included: boolean; tokens: number; preview: string };
      metabolizacion_micelio?: { included: boolean; tokens: number; parts: { nombre: string; preview: string }[] };
      chat_calibrador?: { included: boolean; tokens: number; preview: string };
    };
    totalTokens: number;
  }[];
  
  // NUEVO: Historial de iteraciones previas
  previousIterations: {
    archetype: ArchetypeTone;
    timestamp: string;
    sentido: string;
    comments: { point: string; observation: string }[];
    tokens: number;
  }[];
  
  // Texto actual
  currentText: {
    content: string;
    version: number;
    tokens: number;
  };
  
  // Totales
  totalTokens: number;
}
```

---

## 🔄 Flujo de Interacción

### **Paso 1: Usuario Entra a Galaxia**
1. `CuratedSourcesPanel` carga artefactos curados
2. Para cada artefacto, llama a `getArtifactTokens()` (ya existe en Jardín)
3. Muestra `ArtifactTokenBreakdown` con todos los elementos
4. Por defecto: todos los artefactos seleccionados con versión "ligera"

### **Paso 2: Usuario Ajusta Selección**
1. Usuario marca/desmarca artefactos completos
2. Usuario marca/desmarca elementos individuales
3. `TokenProgressBar` se actualiza en tiempo real
4. Si excede 130k → warning visual

### **Paso 3: Usuario Hace Clic en Arquetipo**
1. Se abre `ArchetypeConfirmationDialog`
2. Muestra resumen completo:
   - Artefactos seleccionados con elementos
   - Historial de iteraciones previas
   - Texto actual
   - Total de tokens
3. Usuario revisa y confirma o cancela

### **Paso 4: Envío al Backend**
1. `useArchetypeProcessor` construye payload completo
2. POST a `/api/minotauro/process-galaxy`
3. Backend construye prompt con toda la información
4. Respuesta se guarda en `historial_arquetipos`

---

## 🎨 Diseño Visual

### **Colores por Tipo de Elemento**
```typescript
const ELEMENT_COLORS = {
  transcripcion: 'primary',      // Azul
  ensayo_destilado: 'primary',   // Azul
  elementos_cognitivos: 'secondary', // Verde
  datos_cronologicos: 'accent',  // Púrpura
  metabolizacion_micelio: 'accent', // Púrpura
  chat_calibrador: 'tertiary',   // Naranja
};
```

### **Iconos por Elemento**
```typescript
const ELEMENT_ICONS = {
  transcripcion: '📝',
  ensayo_destilado: '📖',
  elementos_cognitivos: '🧠',
  datos_cronologicos: '📅',
  metabolizacion_micelio: '🍄',
  chat_calibrador: '💬',
};
```

---

## 🔧 Funciones Auxiliares

### **1. Cálculo de Tokens**
```typescript
function calculateSelectedTokens(
  artifacts: SelectedArtifactElements[]
): number {
  return artifacts.reduce((total, artifact) => {
    const elements = artifact.selectedElements;
    let artifactTotal = 0;
    
    if (elements.transcripcion) artifactTotal += artifact.tokenBreakdown.transcripcion;
    if (elements.ensayo_destilado) artifactTotal += artifact.tokenBreakdown.ensayo_destilado;
    if (elements.elementos_cognitivos) artifactTotal += artifact.tokenBreakdown.elementos_cognitivos;
    if (elements.datos_cronologicos) artifactTotal += artifact.tokenBreakdown.datos_cronologicos;
    if (elements.metabolizacion_micelio) artifactTotal += artifact.tokenBreakdown.metabolizacion_micelio;
    if (elements.chat_calibrador) artifactTotal += artifact.tokenBreakdown.chat_calibrador;
    
    return total + artifactTotal;
  }, 0);
}
```

### **2. Validación de Límite**
```typescript
function validateTokenLimit(
  selectedTokens: number,
  maxTokens: number = 130000
): { valid: boolean; message?: string } {
  if (selectedTokens > maxTokens) {
    return {
      valid: false,
      message: `Excede el límite de ${maxTokens.toLocaleString()} tokens por ${(selectedTokens - maxTokens).toLocaleString()} tokens`
    };
  }
  return { valid: true };
}
```

---

## 📁 Archivos a Crear/Modificar

### **Nuevos Archivos**
1. `/app/cognetica/minotauro/[universeId]/galaxy/[galaxyId]/components/ArtifactTokenBreakdown.tsx`
2. `/app/cognetica/minotauro/[universeId]/components/TokenProgressBar.tsx`
3. `/app/cognetica/minotauro/[universeId]/components/ArchetypeConfirmationDialog.tsx`

### **Archivos a Modificar**
1. `/app/cognetica/minotauro/[universeId]/galaxy/[galaxyId]/components/CuratedSourcesPanel.tsx`
2. `/app/cognetica/minotauro/[universeId]/page.tsx`
3. `/app/cognetica/minotauro/[universeId]/hooks/useArchetypeProcessor.ts`
4. `/app/api/minotauro/process-galaxy/route.ts`
5. `/lib/types/minotauro-append-types.ts`
6. `/docs/AUDITORIA_FLUJO_ARQUETIPOS_MINOTAURO.md`

---

## ✅ Criterios de Aceptación

1. **Interfaz de Artefactos:**
   - [ ] Cada artefacto muestra desglose de tokens por elemento
   - [ ] Checkboxes funcionan correctamente
   - [ ] Tooltips muestran previews de contenido

2. **Barra de Progreso:**
   - [ ] Muestra tokens totales seleccionados
   - [ ] Se actualiza en tiempo real
   - [ ] Warning visual si excede 130k

3. **Dialog de Confirmación:**
   - [ ] Muestra artefactos seleccionados con elementos
   - [ ] Muestra historial de iteraciones previas
   - [ ] Muestra texto actual con tokens
   - [ ] Muestra total general
   - [ ] Botones Cancelar/Enviar funcionan

4. **Backend:**
   - [ ] Recibe payload con selección granular
   - [ ] Construye prompt con toda la información
   - [ ] Incluye contexto de iteraciones previas
   - [ ] Respeta elementos seleccionados

5. **Persistencia:**
   - [ ] Análisis se guarda correctamente
   - [ ] Historial se mantiene
   - [ ] Próxima iteración ve las anteriores

---

## 🚀 Plan de Implementación

### **Fase 1: Componentes Base**
1. Crear `ArtifactTokenBreakdown`
2. Crear `TokenProgressBar`
3. Crear `ArchetypeConfirmationDialog`

### **Fase 2: Integración en CuratedSourcesPanel**
1. Agregar cálculo de tokens
2. Integrar `ArtifactTokenBreakdown`
3. Exponer función de selección vía ref

### **Fase 3: Integración en Page Principal**
1. Agregar `TokenProgressBar`
2. Modificar `handleProcessArchetype`
3. Integrar `ArchetypeConfirmationDialog`

### **Fase 4: Backend**
1. Actualizar tipos
2. Modificar `useArchetypeProcessor`
3. Actualizar `/api/minotauro/process-galaxy`
4. Incluir historial de iteraciones en prompt

### **Fase 5: Testing y Documentación**
1. Probar flujo completo
2. Verificar cálculos de tokens
3. Actualizar documentación
