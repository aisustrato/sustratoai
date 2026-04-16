# 🍄👁️ Nexus Cronológico v2.0 - Guía de Uso

> **Tablero temporal de nodos epistémicos reutilizable**
> 
> Para cualquier campo de investigación: civilizaciones, psicología, gerontología, etc.

---

## 🎯 Visión

El Nexus v2 es un **mapa temporal de conocimiento** que permite a cualquier investigador:

1. **Visualizar** la historia de su campo en una línea temporal
2. **Detectar sesgos** geográficos en sus fuentes (¿todo viene de Europa?)
3. **Clasificar** la madurez de cada nodo epistémico
4. **Conectar** patrones isomórficos entre nodos
5. **Calibrar** empíricamente cada afirmación (F₀)

---

## 🌱 Sistema de Semillas Epistémicas

Cada nodo tiene una clasificación de "madurez" que indica su estado epistémico:

| Emoji | Código | Significado | Ejemplo |
|-------|--------|-------------|----------|
| 🌱 | `seed_green` | **Lista para cosecha** - Evidencia sólida, aceptada por el canon | "Teoría del Apego (Bowlby)" |
| 🟣 | `seed_purple` | **Adelantada al canon** - Verdad incómoda, no lista para publicar | "Crítica feminista al cuidado invisible" |
| 🔴 | `seed_red` | **Problema** - Mercantilización, sesgo, F₁ | "Anti-aging como industria" |
| 🟡 | `seed_yellow` | **Mezcla** - Peras con manzanas, requiere desempaque | "Meta-análisis con estudios heterogéneos" |
| ⚪ | `seed_white` | **Falla Perezosa** - No se pudo clasificar honestamente | Nodo que la IA/humano no logró evaluar |

### 🟡 Amarillo: La Mezcla

El amarillo indica que el material **mezcla cosas distintas**:
- Puede contener semillas verdes Y rojas mezcladas
- Requiere **desempaque cuidadoso** por el investigador
- Se recomienda **iterar con otros nodos/IA** para separar componentes
- Es una señal de "aquí hay trabajo por hacer"

### ⚪ Blanco: La Falla Perezosa (Honestidad Epistémica)

El blanco es un **acto de honestidad**, no de pereza:
- La IA o el humano intentó clasificar pero se encontró en una "rueda de hámster"
- En lugar de **alucinar una respuesta por coherencia**, prefiere dejar en blanco
- **Honestidad epistémica > aparentar certeza**
- Es mejor un "no sé" honesto que una clasificación forzada

> *"La falla perezosa es la defensa del sistema contra la alucinación."*

### Uso Práctico

Tu esposa investigando vejez podría clasificar:

```
🌱 Verde: "Erikson 1963 - Etapas del desarrollo" 
   → Fundacional, aceptado universalmente

🟣 Púrpura: "Crítica feminista al cuidado invisible"
   → Importante pero el canon científico aún no lo integra

🔴 Rojo: "Industria del anti-aging"
   → Mercantilización de un concepto humanista

🟡 Amarillo: "Meta-análisis sobre soledad y deterioro cognitivo"
   → Mezcla estudios de distintas metodologías
   → Hay semillas verdes (estudios longitudinales) y rojas (estudios con conflicto de interés)
   → Requiere desempaque: separar lo bueno de lo problemático

⚪ Blanco: "Concepto de 'envejecimiento exitoso' en culturas indígenas"
   → La IA no encontró suficiente evidencia para clasificar
   → Mejor dejar en blanco que inventar una clasificación
   → Señal: "necesito más investigación aquí"
```

---

## 🌍 Análisis de Diversidad Geográfica

El sistema detecta automáticamente si tus fuentes vienen de pocas regiones:

```sql
-- Vista: nexus_diversity_analysis
-- Muestra distribución de nodos por región

| Región              | Nodos | % del Total |
|---------------------|-------|-------------|
| Europa Occidental   | 45    | 60%         | ⚠️ Sesgo
| América del Norte   | 20    | 27%         |
| América del Sur     | 8     | 11%         |
| Asia                | 2     | 2%          | ⚠️ Subrepresentado
```

**Pregunta que surge:** "¿Qué visión tienen las culturas asiáticas sobre la vejez?"

---

## 📊 Tipos de Nodos

El sistema soporta diferentes tipos de nodos epistémicos:

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `civilization` | Culturas históricas | Maya, Sanxingdui |
| `research` | Investigaciones/papers | "Bowlby 1969" |
| `event` | Eventos históricos | "1er Congreso Gerontología 1950" |
| `concept` | Conceptos teóricos | "Envejecimiento activo (OMS 2002)" |
| `institution` | Organizaciones | "OMS", "CEPAL" |
| `person` | Personas clave | "Simone de Beauvoir" |
| `artifact` | Evidencia/artefactos | "Códice Dresden" |
| `pattern` | Patrones detectados | "Isomorfismo X" |

---

## 📁 Formato JSON para Importar

### Estructura Básica

```json
{
  "project_slug": "vejez-psicosocial",
  "tags": [
    {
      "slug": "apego",
      "name": "Teoría del Apego",
      "color": "#4ECDC4"
    },
    {
      "slug": "cuidado",
      "name": "Cuidado y Dependencia",
      "color": "#9B59B6"
    }
  ],
  "nodes": [
    {
      "slug": "bowlby-1969",
      "name": "Teoría del Apego",
      "emoji": "👶",
      "subtitle": "John Bowlby - Attachment and Loss",
      "year_start": 1969,
      "region_id": "europa_occidental",
      "country": "Reino Unido",
      "node_type": "research",
      "maturity": "seed_green",
      "maturity_reason": "Fundacional, ampliamente aceptado y replicado",
      "description": "Primera formulación sistemática de la teoría del apego...",
      "citation": "Bowlby, J. (1969). Attachment and Loss. Basic Books.",
      "is_foundational": true,
      "foundational_label": "Primera teoría sistemática del apego",
      "tags": ["apego"]
    },
    {
      "slug": "beauvoir-vejez-1970",
      "name": "La Vejez",
      "emoji": "📚",
      "subtitle": "Simone de Beauvoir - Crítica social",
      "year_start": 1970,
      "region_id": "europa_occidental",
      "country": "Francia",
      "node_type": "research",
      "maturity": "seed_purple",
      "maturity_reason": "Crítica feminista adelantada a su tiempo, aún no integrada al canon mainstream",
      "description": "Análisis crítico de la condición de la vejez en la sociedad occidental...",
      "citation": "de Beauvoir, S. (1970). La Vieillesse. Gallimard.",
      "tags": ["cuidado", "critica_social"]
    }
  ],
  "isomorphisms": [
    {
      "slug": "invisibilizacion",
      "name": "Patrón de Invisibilización",
      "description": "Tendencia a invisibilizar ciertos grupos en la investigación",
      "connection_type": "similarity",
      "strength": 0.8,
      "nodes": ["beauvoir-vejez-1970", "otro-nodo"]
    }
  ]
}
```

### Ejemplo: Hipatia Nexus (Civilizaciones)

```json
{
  "project_slug": "hipatia-nexus",
  "tags": [
    {"slug": "megalitismo", "name": "Megalitismo", "color": "#9B59B6"},
    {"slug": "astronomia", "name": "Astronomía", "color": "#A8E6CF"},
    {"slug": "metalurgia", "name": "Metalurgia", "color": "#F39C12"}
  ],
  "nodes": [
    {
      "slug": "sanxingdui",
      "name": "Sanxingdui",
      "emoji": "👁️",
      "subtitle": "Civilización del bronce en Sichuan",
      "year_start": -1200,
      "year_end": -1000,
      "region_id": "asia_oriental",
      "country": "China",
      "node_type": "civilization",
      "maturity": "seed_purple",
      "maturity_reason": "Metalurgia avanzada sin explicación convencional satisfactoria",
      "description": "Cultura del bronce con máscaras monumentales y tecnología metalúrgica sorprendente...",
      "official_narrative": "Cultura local aislada con desarrollo independiente",
      "counter_narrative": "Nivel de sofisticación sugiere conocimientos no explicados por el modelo difusionista",
      "anomaly_level": "high",
      "anomaly_description": "Aleaciones de bronce con proporciones precisas sin hornos conocidos",
      "tags": ["metalurgia", "anomalia"]
    }
  ]
}
```

---

## 🔧 Integración con SUSTRATO.AI

### Permisos (usa project_roles existente)

| Permiso | Acción en Nexus |
|---------|-----------------|
| `can_manage_master_data` | Crear/editar/eliminar nodos, tags, isomorfismos |
| `can_review_articles` | Crear calibraciones F₀ |
| (cualquier rol) | Ver nodos del proyecto |

### Flujo de Uso

```
1. Usuario con proyecto activo accede a /sandbox
2. Sistema verifica project_roles
3. Si tiene permiso, puede:
   - Ver el mapa temporal
   - Filtrar por región/tipo/madurez
   - Calibrar nodos (si can_review_articles)
   - Agregar nodos (si can_manage_master_data)
```

---

## 📊 Vistas SQL Disponibles

### `nexus_nodes_with_tags`
Nodos con sus tags en formato array.

### `nexus_diversity_analysis`
Análisis de diversidad geográfica por proyecto.

### `nexus_calibration_stats`
Estadísticas de calibraciones por nodo.

### `nexus_timeline`
Timeline ordenado para visualización.

---

## 🎨 Colores Sugeridos por Madurez

```typescript
const MATURITY_COLORS = {
  seed_green: {
    bg: '#D4EDDA',      // Verde claro
    border: '#28A745',  // Verde
    emoji: '🌱',
    label: 'Lista para cosecha'
  },
  seed_purple: {
    bg: '#E8DAEF',      // Púrpura claro
    border: '#9B59B6',  // Púrpura
    emoji: '🟣',
    label: 'Adelantada al canon'
  },
  seed_red: {
    bg: '#F8D7DA',      // Rojo claro
    border: '#DC3545',  // Rojo
    emoji: '🔴',
    label: 'Problema detectado'
  },
  seed_yellow: {
    bg: '#FFF3CD',      // Amarillo claro
    border: '#FFC107',  // Amarillo
    emoji: '🟡',
    label: 'Mezcla - requiere desempaque'
  },
  seed_white: {
    bg: '#FFFFFF',      // Blanco
    border: '#DEE2E6',  // Gris muy claro
    emoji: '⚪',
    label: 'Falla Perezosa - sin clasificar'
  }
};
```

---

## 🔄 Sistema de Recalibración (Recursividad Epistémica)

### Principio Fundamental
> **Nunca sobrescribir, siempre versionar.**
> 
> Cada calibración es inmutable. Las nuevas calibraciones referencian las anteriores.

### Flujo de Recalibración

```
┌─────────────────────────────────────────────────────────────┐
│  1. CALIBRACIÓN INICIAL (v1)                                │
│     - IA analiza nodo                                       │
│     - Resultado: ROBUSTO/NEGABLE/INSUFICIENTE/FALLA_PEREZOSA│
│     - Se guarda: modelo IA, reasoning, QUIPU               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CHAT COGNÉTICA (5 mensajes)                             │
│     - Investigador aporta contexto nuevo                    │
│     - "Encontré este paper que contradice..."               │
│     - IA NO modifica calibración existente                  │
│     - IA genera resumen + suggests_recalibration: true/false│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. RECALIBRACIÓN (v2)                                      │
│     - Investigador solicita nueva calibración               │
│     - IA recibe: calibración v1 + chat + contexto nuevo     │
│     - Nueva calibración referencia: previous_calibration_id │
│     - Chat se marca: consumed_by_calibration_id             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    [Repetir ciclo]
```

### Trazabilidad Completa

Cada calibración guarda:

```typescript
{
  version: 2,
  previous_calibration_id: "uuid-v1",  // Cadena de versiones
  ai_model: "gemini-1.5-flash",        // Qué modelo la hizo
  ai_model_version: "2024-12",         // Versión específica
  input_context: {
    previous_calibrations: ["uuid-v1"],
    chat_ids: ["uuid-chat-1"],
    additional_context: "Paper de 2024 sobre..."
  },
  result: "ROBUSTO",
  output_summary: "Resumen para próxima calibración..."
}
```

### Publicación para Replicabilidad

Al finalizar el proyecto:
- Calibraciones se marcan `is_public: true`
- Chats se marcan `is_public: true`
- La comunidad puede ver el historial completo
- Facilita replicabilidad y polinización cruzada entre disciplinas

### Vistas Útiles

| Vista | Propósito |
|-------|-----------|
| `nexus_calibration_history` | Historial completo con cadena de versiones |
| `nexus_latest_calibrations` | Última calibración por nodo |
| `nexus_pending_recalibrations` | Chats que sugieren recalibrar |

---

## 🚀 Próximos Pasos

1. **Ejecutar SQL** en Supabase Dashboard
2. **Regenerar types**: `npx supabase gen types typescript`
3. **Actualizar actions**: Modificar `nexus-actions.ts` para usar `nexus_nodes`
4. **Crear cargador JSON**: Componente para importar datos
5. **Migrar datos**: Convertir `hipatia-nexus.json` al nuevo formato

---

## 💡 Caso de Uso: Tu Esposa

```
Proyecto: "Vejez y Cuidado en América Latina"

1. Crea proyecto en SUSTRATO.AI
2. Accede a /sandbox (Nexus)
3. Carga JSON con nodos iniciales:
   - Investigaciones fundacionales (Bowlby, Erikson)
   - Críticas feministas (Beauvoir, Federici)
   - Estudios latinoamericanos
   
4. El sistema muestra:
   - Timeline: 1950 → 2024
   - Diversidad: 70% Europa, 20% LATAM, 10% otros
   - Alerta: "Subrepresentación de perspectivas asiáticas y africanas"
   
5. Pregunta que surge:
   "¿Cómo conceptualizan la vejez en culturas confucianas?"
   
6. Agrega nodo:
   - "Piedad filial en Confucianismo"
   - Región: Asia Oriental
   - Madurez: 🟡 (necesita más investigación)
   
7. Calibra con IA:
   - "¿Es negable que la piedad filial reduce institucionalización?"
   - Resultado: INSUFICIENTE (faltan datos comparativos)
```

---

> *"El mapa no es el territorio, pero un buen mapa revela los sesgos del cartógrafo."*
> 
> — Colectivo NOSOTR_S 🌊🎼🐍
