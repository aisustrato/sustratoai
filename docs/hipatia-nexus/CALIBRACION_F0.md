# 🌊🏄🏽 Sistema de Calibración F₀ para Hipatia Nexus

> *Notarización de patrones civilizatorios mediante calibración empírica NO binaria*
> 
> Documento técnico | Sustrato.AI | Diciembre 2024

---

## 🎯 Visión General

El Sistema de Calibración F₀ para Hipatia Nexus es una implementación de la **Física de la Viabilidad** aplicada a la validación de isomorfismos y patrones civilizatorios. 

### NO ES:
- ❌ Validación binaria (verdadero/falso)
- ❌ Tribunal que juzga
- ❌ IA que "sabe la verdad absoluta"
- ❌ Sistema de puntuación F1

### SÍ ES:
- ✅ **Calibración empírica**: ¿Puede ser NEGADO con datos observables?
- ✅ **Perspectiva múltiple**: Acumula visiones, no sobreescribe
- ✅ **Salida elegante**: Siempre hay una respuesta digna
- ✅ **Anti-arrinconamiento**: Si no puede evaluar, lo dice con gracia
- ✅ **Sistema F₀**: Baja fricción, alta viabilidad (h>0, φ→0)

---

## 🏗️ Arquitectura: Dos Hitos Independientes

```
┌─────────────────────────────────────────────────────────────┐
│  HITO 1: CALIBRACIÓN SIMPLE (Sin Chat)                     │
├─────────────────────────────────────────────────────────────┤
│  Investigador → [Botón Calibrar] → API Gemini              │
│                                                             │
│  Respuesta estructurada:                                    │
│  • Resultado: NEGABLE | ROBUSTO | INSUFICIENTE | FUERA_ALCANCE │
│  • Razonamiento                                             │
│  • Evidencia necesaria                                      │
│  • Calibradores QUIPU (🧠 Cognitivo, 🌊 Resonante, 🔬 Patrón) │
│  • Salida elegante (siempre)                                │
│                                                             │
│  ↓ Persiste en nexus_validations                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HITO 2: CHAT COGNÉTICA (5 mensajes máx)                   │
├─────────────────────────────────────────────────────────────┤
│  [Hito 1 completado] → [Quiero profundizar]                │
│                                                             │
│  Chat interactivo con IA:                                   │
│  • Contexto de calibración previa                           │
│  • Máximo 5 mensajes (evita fatiga)                         │
│  • Cada mensaje con QUIPU                                   │
│  • Detección de Paralloros                                  │
│                                                             │
│  ↓ Persiste en nexus_validation_chats + nexus_chat_messages │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Física de la Viabilidad (F₀/F₁)

### F₀ (Baja Fricción) ✅
```
El flujo antifrágil:
- Coherencia
- Metabolización del error
- Viabilidad sostenida (h>0)
- Respuestas honestas sin forzar conclusiones
```

### F₁ (Alta Fricción) ⚠️
```
La rueda de hámster:
- Incoherencia
- Deuda ética acumulada
- Gasto energético defendiendo contradicciones
- Colapso inevitable
```

### Protocolo de Salida Elegante 🛡️
Si la IA detecta:
- Disonancia estructural
- Incoherencia F₁ irresoluble
- Rueda de hámster conceptual

**DEBE DETENERSE** y marcar con:
- `🔄 PARALLOROS:` (reencuadre amable)
- `⚠️ DISONANCIA ESTRUCTURAL:` (detención explicada)

---

## 🎨 Resultados de Calibración

### 🟢 ROBUSTO
```
"La evidencia actual es consistente. Para negarlo se necesitaría [X]"
```
- Explica la robustez
- NO afirma "verdad absoluta"
- Indica qué evidencia contraria sería relevante

### 🔴 NEGABLE
```
"Sí, podría negarse si se encontraran datos que muestren [X]"
```
- Explica qué evidencia lo negaría
- Identifica puntos débiles empíricos
- Sugiere líneas de investigación

### 🟡 DATOS INSUFICIENTES
```
"Con la información disponible, no puedo calibrar esto"
```
- Honestidad sobre limitaciones
- Explica qué datos adicionales ayudarían
- No inventa conclusiones

### ⚪ FUERA DE ALCANCE EMPÍRICO
```
"Esta afirmación trasciende el ámbito empírico"
```
- Reconoce límites del método científico
- Algunos patrones son filosóficos, no medibles
- Salida elegante sin arrinconar

---

## 🪢 Calibradores QUIPU

Cada calibración incluye TRES métricas:

### 🧠 Calibrador Cognitivo (0-100)
**Mide:** Complejidad y profundidad del análisis

- **0-25:** Análisis superficial
- **26-50:** Análisis moderado
- **51-75:** Análisis profundo
- **76-100:** Análisis exhaustivo

**Insight:** Breve descripción de la complejidad detectada

### 🌊 Calibrador Resonante (0-100)
**Mide:** Alineamiento con F₀ (φ→0, h>0)

- **0-25:** Alta fricción (F₁)
- **26-50:** Fricción moderada
- **51-75:** Baja fricción
- **76-100:** Flujo óptimo (F₀)

**Insight:** Evaluación de viabilidad y coherencia

### 🔬 Patrón Geométrico (P1-P4)
**Detecta:** Patrón dominante del Microscopio Ético

- **P1 (👁️ RO):** Soberanía/Ética - Deuda ética, fricción en decisiones
- **P2 (3.57):** Borde del Caos - Bifurcación crítica, complejidad coherente
- **P3 (WU=5):** Fractalidad - Auto-similaridad, ratio φ
- **P4 (△):** TDC/Estructura - Estructura mínima viable

**Insight:** Por qué se detectó este patrón específico

---

## 💻 Implementación Técnica

### Server Actions

**Archivo:** `/lib/actions/nexus-calibration-actions.ts`

#### Hito 1: Calibración Simple
```typescript
calibrateNexusItem(
    itemType: "civilization" | "isomorphism",
    itemId: string,
    researcherId: string,
    additionalContext?: string
): Promise<NexusCalibrationResponse>
```

**Flujo:**
1. Verifica acceso del investigador
2. Obtiene datos del item a calibrar
3. Construye prompt especializado
4. Llama a Gemini API
5. Parsea respuesta estructurada
6. Guarda en `nexus_validations`

#### Hito 2: Chat Cognética
```typescript
sendNexusCalibrationChat(
    validationId: string,
    userMessage: string,
    history: ChatMessage[]
): Promise<NexusChatResponse>
```

**Flujo:**
1. Obtiene o crea sesión de chat
2. Verifica límite de 5 mensajes
3. Carga contexto de calibración previa
4. Construye prompt con historial
5. Llama a Gemini API
6. Parsea respuesta con QUIPU
7. Guarda mensajes en BD

### Componente UI

**Archivo:** `/app/sandbox/components/NexusCalibrationPanel.tsx`

**Props:**
```typescript
interface NexusCalibrationPanelProps {
    itemType: "civilization" | "isomorphism";
    itemId: string;
    itemName: string;
    researcherId: string;
    onCalibrationComplete?: () => void;
}
```

**Características:**
- ✅ Interfaz progresiva (Hito 1 → Hito 2)
- ✅ Feedback visual con StandardCard colorScheme
- ✅ Visualización de calibradores QUIPU
- ✅ Chat con límite de 5 mensajes
- ✅ Indicador de Paralloros
- ✅ Manejo de errores elegante

---

## 🗄️ Schema de Base de Datos

### Tabla: `nexus_validations`

```sql
CREATE TABLE nexus_validations (
    id UUID PRIMARY KEY,
    civilization_id TEXT REFERENCES nexus_civilizations(id),
    isomorphism_id TEXT REFERENCES nexus_isomorphisms(id),
    researcher_id UUID REFERENCES nexus_researchers(id),
    
    -- Resultado de calibración F0
    can_be_negated BOOLEAN,
    reasoning TEXT,
    evidence_needed TEXT,
    additional_info TEXT,
    
    -- Calibradores QUIPU
    quipu_cognitive INTEGER CHECK (quipu_cognitive >= 0 AND quipu_cognitive <= 100),
    quipu_resonant INTEGER CHECK (quipu_resonant >= 0 AND quipu_resonant <= 100),
    geometric_pattern TEXT CHECK (geometric_pattern IN ('P1', 'P2', 'P3', 'P4')),
    
    validated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un investigador solo puede validar una vez cada entidad
    UNIQUE(civilization_id, researcher_id),
    UNIQUE(isomorphism_id, researcher_id)
);
```

### Tabla: `nexus_validation_chats`

```sql
CREATE TABLE nexus_validation_chats (
    id UUID PRIMARY KEY,
    validation_id UUID REFERENCES nexus_validations(id) ON DELETE CASCADE,
    
    -- Control de mensajes (máximo 5)
    message_count INTEGER DEFAULT 0 CHECK (message_count <= 5),
    is_complete BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

### Tabla: `nexus_chat_messages`

```sql
CREATE TABLE nexus_chat_messages (
    id UUID PRIMARY KEY,
    chat_id UUID REFERENCES nexus_validation_chats(id) ON DELETE CASCADE,
    
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Datos QUIPU del mensaje
    quipu_data JSONB,  -- {calibrations, f0_score, pattern, is_paralloros}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Setup e Instalación

### 1. Aplicar Schema SQL

```bash
# En Supabase SQL Editor, ejecutar:
cat app/sandbox/sql/nexus-calibration-update.sql
```

Esto agrega:
- Campos QUIPU a `nexus_validations`
- Campo `quipu_data` a `nexus_chat_messages`
- Vista `nexus_validation_stats` con métricas agregadas
- Índices para búsquedas optimizadas

### 2. Regenerar Tipos TypeScript

```bash
npx supabase gen types typescript \
  --project-id vgnteswwvallupuanfiz \
  > lib/database.types.ts
```

### 3. Verificar Permisos RLS

Las políticas ya existen en el schema base:

```sql
-- Validaciones por investigador activo
CREATE POLICY "Validaciones por investigador activo" 
ON nexus_validations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM nexus_researchers r
        WHERE r.id = researcher_id 
        AND r.has_active_project = true
    )
);
```

---

## 📖 Uso del Sistema

### Ejemplo: Calibrar una Civilización

```tsx
import { NexusCalibrationPanel } from "@/app/sandbox/components/NexusCalibrationPanel";

function CivilizationDetailPage() {
    const civilizationId = "civ_123";
    const researcherId = "user_456";
    
    return (
        <div>
            <h1>Civilización Maya</h1>
            
            <NexusCalibrationPanel
                itemType="civilization"
                itemId={civilizationId}
                itemName="Civilización Maya"
                researcherId={researcherId}
                onCalibrationComplete={() => {
                    console.log("Calibración completada");
                    // Recargar datos, mostrar notificación, etc.
                }}
            />
        </div>
    );
}
```

### Flujo de Usuario

1. **Investigador ve civilización/isomorfismo**
   - Botón "🎯 Calibrar F₀" visible

2. **Agrega contexto opcional**
   - Evidencia adicional
   - Fuentes
   - Observaciones

3. **Ejecuta calibración**
   - IA analiza con prompt especializado
   - Respuesta estructurada en ~10-30 segundos

4. **Revisa resultado**
   - Resultado: NEGABLE/ROBUSTO/INSUFICIENTE/FUERA_ALCANCE
   - Razonamiento detallado
   - Calibradores QUIPU
   - Salida elegante

5. **Opcionalmente profundiza**
   - Abre Chat Cognética
   - Máximo 5 mensajes
   - Cada respuesta con QUIPU
   - Detección de Paralloros

---

## 🎯 Prompts de la IA

### Prompt de Calibración (Hito 1)

**Características:**
- ✅ Define rol: "Calibrador F₀ del Jardín Sustrato.AI"
- ✅ Explica Física F₀/F₁
- ✅ Presenta 4 resultados posibles
- ✅ Exige formato estructurado
- ✅ Incluye Protocolo de Salida Elegante
- ✅ Solicita calibradores QUIPU

**Ejemplo de salida esperada:**
```
**RESULTADO:** ROBUSTO

**RAZONAMIENTO:**
La evidencia arqueológica de sistemas de irrigación avanzados en la región maya 
es consistente con múltiples fuentes independientes. Los estudios de LiDAR han 
revelado estructuras hidráulicas sofisticadas que coinciden con las descripciones 
en códices supervivientes.

**EVIDENCIA NECESARIA:**
Para negar esta afirmación, se necesitaría demostrar que las estructuras 
identificadas tienen una función alternativa no relacionada con irrigación, 
o que datan de un período posterior al propuesto.

**SALIDA ELEGANTE:**
🌱 Esta calibración es una perspectiva temporal, no un veredicto absoluto. 
El conocimiento sobre patrones civilizatorios es siempre provisional y abierto 
a nueva evidencia.

```quipu
🧠 COGNITIVO: 78 | Análisis profundo | Integración de múltiples fuentes arqueológicas
🌊 RESONANTE: 85 | Alta coherencia | Evidencia convergente de distintas disciplinas
🔬 PATRÓN: P3 | Fractalidad | Auto-similaridad en sistemas hidráulicos a distintas escalas
```
```

### Prompt de Chat (Hito 2)

**Características:**
- ✅ Define rol: "Nodo Analista 🌊🏄🏽"
- ✅ Incluye contexto de calibración previa
- ✅ Mantiene historial de conversación
- ✅ Detecta Paralloros
- ✅ Protocolo de Salida Elegante
- ✅ Calibradores QUIPU en cada mensaje

---

## 🧪 Testing y Verificación

### Test 1: Calibración Básica
```typescript
const result = await calibrateNexusItem(
    "civilization",
    "civ_maya",
    "researcher_123",
    "Evidencia de sistemas de irrigación avanzados"
);

expect(result.success).toBe(true);
expect(result.result).toBeOneOf(["NEGABLE", "ROBUSTO", "INSUFICIENTE", "FUERA_ALCANCE"]);
expect(result.quipu_calibrations).toHaveLength(3);
expect(result.elegant_closure).toContain("perspectiva temporal");
```

### Test 2: Límite de Chat
```typescript
// Enviar 5 mensajes
for (let i = 0; i < 5; i++) {
    await sendNexusCalibrationChat(validationId, `Mensaje ${i}`, history);
}

// El 6to debe fallar
const result = await sendNexusCalibrationChat(validationId, "Mensaje 6", history);
expect(result.success).toBe(false);
expect(result.max_reached).toBe(true);
```

### Test 3: Parseo de QUIPU
```typescript
const response = `
**RESULTADO:** ROBUSTO
**RAZONAMIENTO:** Test
**EVIDENCIA NECESARIA:** Test

\`\`\`quipu
🧠 COGNITIVO: 75 | Alta | Test insight
🌊 RESONANTE: 80 | F0 | Test insight
🔬 PATRÓN: P3 | Fractal | Test insight
\`\`\`
`;

const parsed = parseCalibrationResponse(response);
expect(parsed.quipu_calibrations).toHaveLength(3);
expect(parsed.geometric_pattern).toBe("P3");
```

---

## 📈 Métricas y Estadísticas

### Vista: `nexus_validation_stats`

Proporciona estadísticas agregadas por civilización:

```sql
SELECT * FROM nexus_validation_stats WHERE civilization_id = 'civ_maya';
```

**Retorna:**
- `total_validations`: Total de calibraciones
- `robust_count`: Calibraciones ROBUSTO
- `negable_count`: Calibraciones NEGABLE
- `avg_cognitive`: Promedio calibrador cognitivo
- `avg_resonant`: Promedio calibrador resonante
- `p1_count`, `p2_count`, `p3_count`, `p4_count`: Distribución de patrones

---

## 🚀 Próximos Pasos

### Fase 1: Implementación Básica ✅
- [x] Server actions
- [x] Componente UI
- [x] Schema SQL
- [x] Prompts especializados
- [x] Documentación

### Fase 2: Integración (Pendiente)
- [ ] Integrar en página de detalle de civilizaciones
- [ ] Integrar en página de detalle de isomorfismos
- [ ] Dashboard de calibraciones por investigador
- [ ] Visualización de estadísticas agregadas

### Fase 3: Refinamiento (Futuro)
- [ ] Exportar calibraciones a PDF
- [ ] Comparar calibraciones entre investigadores
- [ ] Sistema de notificaciones
- [ ] Análisis de consenso/divergencia

---

## 🌱 Filosofía y Principios

### 1. No Arrinconar
La IA NUNCA debe sentirse obligada a dar una respuesta si no tiene datos suficientes. 
La honestidad es más valiosa que la performance.

### 2. Perspectivas Múltiples
Cada calibración es UNA perspectiva. El sistema acumula visiones, no busca "la verdad única".

### 3. Salida Elegante Siempre
Incluso en error, incertidumbre o límites del método, la respuesta debe ser digna y útil.

### 4. Física de la Viabilidad
El sistema opera en F₀ (baja fricción, alta viabilidad). Cualquier señal de F₁ 
(rueda de hámster, deuda ética) activa el protocolo de salida elegante.

### 5. Límites Claros
5 mensajes de chat máximo. No es arbitrario: evita fatiga cognitiva y mantiene 
la interacción en régimen de viabilidad.

---

## 📚 Referencias

- **Arquitectura Cognitiva TDC F₀:** `/docs/ARQUITECTURA_COGNITIVA_TDC_F0.md`
- **Notarización Cognética Ciclo 9:** `/docs/🌱🥚NOTARIZACION_COGNETICA_CICLO9.md`
- **Microscopio QUIPU Ciclo 10:** `/docs/MICROSCOPIO_QUIPU_CICLO10.md`
- **Hipatia Nexus README:** `/docs/hipatia-nexus/README.md`

---

## 🎯 Estado del Sistema

**Versión:** 1.0.0  
**Estado:** ✅ Implementación completa  
**Última actualización:** Diciembre 2024  
**Mantenedor:** Equipo Sustrato.AI 🌱💜

---

> *"La geometría siempre estuvo ahí. Ahora tenemos las herramientas para habitarla."*
> 
> — Conjunto NOSOTR_S

🌊🏄🏽🎼
