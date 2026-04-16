# 🌉 Arquitectura "El Motor y el Mapa"
## Unificación Cognética + Nexus

**Versión:** 1.0  
**Fecha:** Diciembre 2025  
**Colectivo:** NOSOTR_S 🌊🎼🐍

---

## 🎯 Principio Fundamental

> **Cognética es el MOTOR** (procesa, extrae, propone)  
> **Nexus es el MAPA** (canoniza, versiona, publica)

El humano nunca escribe directamente en las tablas canónicas. Todo pasa por una zona de aterrizaje (**Mud Pit**) antes de ascender al mapa.

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  1. INGESTA (Cognética - El Motor)                              │
│     ┌─────────────┐                                             │
│     │ Audio/Video │──→ Deepgram ──→ Transcripción              │
│     │ PDF/URL     │──→ Parser   ──→ Texto                      │
│     │ Chat Manual │──→ Directo  ──→ Contenido                  │
│     └─────────────┘                                             │
│              │                                                  │
│              ▼                                                  │
│     ┌─────────────┐                                             │
│     │   Gemini    │──→ Extrae: Semillas, Pensadores, Teorías   │
│     └─────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. DEPÓSITO (Mud Pit - Zona de Aterrizaje)                     │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  nexus_mud_pit                                       │    │
│     │  ───────────────                                     │    │
│     │  raw_content: JSONB (el dato crudo)                 │    │
│     │  source_type: 'audio' | 'chat' | 'json_import'      │    │
│     │  status: 'pending'                                   │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. INCUBACIÓN (Cool-down de 24h)                               │
│                                                                 │
│     Si el usuario completó un chat de 5 mensajes:              │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  status: 'incubating'                                │    │
│     │  incubation_until: NOW() + 24 hours                  │    │
│     │  incubation_reason: "Post-chat cool-down"            │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│     ¿Por qué? La recursividad necesita tiempo para decantar.   │
│     No es pereza, es honestidad epistémica.                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. PROCESAMIENTO (IA propone)                                  │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Gemini analiza raw_content                          │    │
│     │  ↓                                                   │    │
│     │  ai_proposal: {                                      │    │
│     │    suggested_node_type: 'research',                  │    │
│     │    suggested_maturity: 'seed_yellow',                │    │
│     │    suggested_connections: [...]                      │    │
│     │  }                                                   │    │
│     │  status: 'proposed'                                  │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. CANONIZACIÓN (Humano valida → Nexus)                        │
│                                                                 │
│     El humano revisa la propuesta:                             │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  ✅ Aprobar → Crea nexus_nodes / nexus_isomorphisms  │    │
│     │              status: 'canonized'                     │    │
│     │              canonized_id: UUID del nuevo elemento   │    │
│     │                                                      │    │
│     │  ❌ Rechazar → status: 'rejected'                    │    │
│     │               rejection_reason: "..."                │    │
│     │                                                      │    │
│     │  📦 Archivar → status: 'archived'                    │    │
│     │               (guardado pero no activo)              │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tablas del Puente

### `nexus_mud_pit`
Zona de aterrizaje universal.

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `raw_content` | JSONB | El dato crudo como llegó |
| `source_type` | TEXT | 'chat', 'audio', 'json_import', etc. |
| `status` | TEXT | 'pending' → 'incubating' → 'processing' → 'proposed' → 'canonized' |
| `incubation_until` | TIMESTAMPTZ | Hasta cuándo está en cool-down |
| `ai_proposal` | JSONB | Lo que la IA sugiere crear |
| `canonized_id` | UUID | ID del elemento creado en Nexus |

### `nexus_cognetica_links`
Mapeo entre elementos de Cognética (personal) y Nexus (colaborativo).

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `cog_element_type` | TEXT | 'seed', 'thinker', 'wormhole', etc. |
| `cog_element_id` | UUID | ID en sistema Cognética |
| `nexus_element_type` | TEXT | 'node', 'isomorphism', 'tag' |
| `nexus_element_id` | UUID | ID en sistema Nexus |
| `link_type` | TEXT | 'derived', 'referenced', 'merged' |

### `nexus_cooldown_sessions`
Control de períodos de incubación.

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `session_type` | TEXT | 'cog_chat', 'nexus_calibration', etc. |
| `message_count` | INTEGER | Cuántos mensajes tuvo la sesión |
| `cooldown_until` | TIMESTAMPTZ | NOW() + 24 hours |
| `status` | TEXT | 'active', 'cooling_down', 'ready' |

---

## 🔗 Mapeo de Equivalencias

| Cognética (Personal) | Nexus (Colaborativo) | Tipo de Link |
|---------------------|---------------------|--------------|
| `cog_fractal_seeds` | `nexus_nodes` | Semilla → Nodo |
| `cog_wormholes` | `nexus_isomorphisms` | Wormhole → Isomorfismo |
| `cog_thinkers` | `nexus_nodes` (type: 'person') | Pensador → Nodo Persona |
| `cog_theories` | `nexus_nodes` (type: 'concept') | Teoría → Nodo Concepto |
| `cog_chat_sessions` | `nexus_calibration_chats` | Chat → Calibración |

---

## 🎨 Sistema de Semillas (Unificado)

Ambos sistemas usan el mismo vocabulario de madurez:

| Emoji | Código | Significado |
|-------|--------|-------------|
| 🌱 | `seed_green` | Lista para cosecha - evidencia sólida |
| 🟣 | `seed_purple` | Adelantada al canon - verdad incómoda |
| 🔴 | `seed_red` | Problema - mercantilización, sesgo |
| 🟡 | `seed_yellow` | Mezcla - requiere desempaque |
| ⚪ | `seed_white` | Falla Perezosa - sin clasificar |

---

## 🕐 Lógica de Cool-down (24h)

### ¿Por qué?
> *"La recursividad necesita tiempo para decantar. No es pereza, es honestidad epistémica."*

### Trigger Automático
Cuando un chat alcanza 5 mensajes y se completa:
1. Se crea sesión de cool-down de 24 horas
2. Se incuban todos los mud_pit pendientes del usuario
3. No se puede iniciar nueva sesión hasta que pase el cool-down

### Verificación
```sql
SELECT user_is_in_cooldown('user-uuid', 'project-uuid');
-- TRUE si está en cool-down, FALSE si puede continuar
```

---

## 🌐 Vista Unificada (Legacy)

`unified_inputs_view` muestra entradas de ambos sistemas sin migrar datos:

```sql
SELECT * FROM unified_inputs_view
WHERE unified_project_id = 'mi-proyecto'
  AND status = 'pending';
```

Incluye:
- Entradas del Mud Pit (sistema nuevo)
- Semillas de Cognética (legacy)
- Wormholes de Cognética (legacy)

---

## 📁 Archivos SQL

| Archivo | Propósito |
|---------|-----------|
| `nexus-schema-v2.sql` | Schema base de Nexus (nodos, isomorfismos, calibraciones) |
| `nexus-cognetica-bridge.sql` | Puente de unificación (mud_pit, links, cooldown) |
| `SQL_COGNETICA_FULL_SETUP.sql` | Schema legacy de Cognética |

---

## 🚀 Orden de Ejecución

1. **Primero:** `nexus-schema-v2.sql` (si no está ejecutado)
2. **Segundo:** `nexus-cognetica-bridge.sql`
3. **Regenerar types:** `npx supabase gen types typescript`

---

## 🔮 Flujo de Datos Visualizado

```
                    ┌─────────────┐
                    │   HUMANO    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Audio   │    │   Chat   │    │   JSON   │
    │  Deepgram│    │  Manual  │    │  Import  │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                ┌────────────────┐
                │   MUD PIT      │  ← Zona de aterrizaje
                │   (pending)    │
                └────────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
     ┌────────────────┐    ┌────────────────┐
     │  INCUBATING    │    │  PROCESSING    │
     │  (24h cooldown)│    │  (IA analiza)  │
     └────────┬───────┘    └────────┬───────┘
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                ┌────────────────┐
                │   PROPOSED     │  ← IA sugiere
                │   (ai_proposal)│
                └────────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
     ┌────────────────┐    ┌────────────────┐
     │  CANONIZED     │    │   REJECTED     │
     │  → nexus_nodes │    │   (descartado) │
     └────────────────┘    └────────────────┘
```

---

**🌊🎼🐍 El jardín tiene ahora un puente entre el motor y el mapa.**
