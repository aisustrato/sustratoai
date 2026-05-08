# Pipeline de Metabolización — v1

**Versión:** 1.0
**Fecha:** 21 abril 2026
**Autor humano:** eRRRe
**Autor máquina:** Hongo / Calibrador
**Relación con otros docs:** Complementa spec v0.3 con detalle técnico. Destinado a Cascade/Windsurf como contrato de implementación.

---

## 0. Propósito de este documento

Este documento especifica el **cómo técnico** de la metabolización: qué modelo de DeepSeek usar para cada formato, qué parámetros, cómo manejar contenido que excede el contexto, cómo parsear respuestas, cómo encadenar las llamadas.

No contiene los system prompts reales (se entregan en documento posterior). Contiene todo lo que rodea a los prompts.

**Si este documento contradice otros, consultar antes de implementar.** En particular:
- Spec v0.3 manda sobre qué es cada formato
- Addendum v1.1 al requerimiento manda sobre estructura de archivos y descargas
- Este documento manda sobre llamadas a DeepSeek y pipeline de generación

---

## 1. Modelos DeepSeek disponibles (referencia operativa, abril 2026)

Datos verificados con documentación oficial de DeepSeek:

| Modelo | Alias API | Context window | Max output | Costo input | Costo output | Cache hit |
|--------|-----------|----------------|------------|-------------|--------------|-----------|
| DeepSeek V3.2 (Chat) | `deepseek-chat` | 128K tokens | 8K tokens | $0.28/M | $0.42/M | $0.028/M |
| DeepSeek R1/R2 (Reasoner) | `deepseek-reasoner` | 128K tokens | 64K tokens | $0.55/M | $2.19/M | $0.14/M |
| DeepSeek V4 | (si disponible) | 128K tokens | 8K tokens | $0.30/M | $0.50/M | $0.03/M |

**Notas operativas:**

- Ambos modelos aceptan `response_format: {type: "json_object"}` para salida JSON estructurada
- `deepseek-reasoner` separa `reasoning_content` de `content` en la respuesta — el primero es chain-of-thought, el segundo es la respuesta final. **Solo persistir `content`, nunca `reasoning_content` en prompts siguientes.**
- Cache hits se disparan automáticamente cuando el prefijo del prompt es idéntico entre llamadas. Aprovechar colocando system prompt estable al inicio.
- Rate limits: dinámicos según carga. Implementar backoff exponencial con 3-4 reintentos.
- Temperatura recomendada por DeepSeek: 0.0 (código/matemáticas), 0.6 (reasoner default), 1.0 (análisis datos), 1.3 (conversación general), 1.5 (escritura creativa).

---

## 2. Asignación por formato — tabla maestra

| Formato | Modelo | Temperatura | response_format | max_tokens | Tipo de tarea |
|---------|--------|-------------|-----------------|------------|---------------|
| **Crónica** | `deepseek-reasoner` | 0.7 | `text` | 5000 | Generación literaria con juicio |
| **Destilado** | `deepseek-reasoner` | 0.6 | `json_object` | 2500 | Razonamiento estructural |
| **Núcleo** | `deepseek-chat` | 0.3 | `json_object` | 800 | Compresión mecánica |
| **Germinal (Oleada 1)** | `deepseek-reasoner` | 0.7 | `text` | 2500 | Razonamiento relacional |

**Justificación rápida:**

- **Crónica y Germinal usan reasoner con temp 0.7** porque requieren tanto razonamiento (detectar tensiones, conectar conceptos) como libertad narrativa. Temp 0.7 está por debajo del creative writing pero encima del análisis frío.
- **Destilado usa reasoner con temp 0.6** porque la compresión estructural es razonamiento puro: identificar tesis irreductible, ordenar movimientos con dirección, elegir la cita núcleo. Temp baja porque queremos precisión, no variación.
- **Núcleo usa chat con temp 0.3** porque es compresión mecánica: toma Destilado, selecciona los 3 movimientos más estructurales, condensa. No necesita razonamiento profundo ni creatividad — sí determinismo. Ahorro de costo significativo.

---

## 3. Presupuesto por artefacto — proyección

Para un artefacto típico de 5.000 tokens de contenido:

| Formato | Input estimado | Output estimado | Costo con cache miss | Costo con cache hit |
|---------|----------------|-----------------|----------------------|---------------------|
| Crónica | ~6.500 tokens | ~2.800 tokens | $0.0097 | $0.0053 |
| Destilado | ~9.500 tokens (incluye Crónica contexto) | ~1.400 tokens | $0.0083 | $0.0044 |
| Núcleo | ~1.600 tokens (solo Destilado) | ~450 tokens | $0.00064 | $0.00024 |
| Germinal | ~13.000 tokens (Crónica + Destilado + 3-5 Núcleos previos + semillas) | ~1.800 tokens | $0.0111 | $0.0061 |
| **Total** | | | **~$0.029** | **~$0.016** |

En línea con el target del pilot ($0.028–0.15 por artículo). Realista ~$0.016–0.020 por artefacto completo en producción normal.

**Para artefactos grandes (PDF informe de 50K+ tokens):** requiere chunking previo. Ver sección 7.

---

## 4. Estructura común de llamada a DeepSeek

Cliente recomendado (extensión del existente en `/lib/deepseek/api.ts`):

```typescript
interface DeepSeekCallConfig {
  model: "deepseek-chat" | "deepseek-reasoner";
  temperature: number;
  maxTokens: number;
  responseFormat?: { type: "text" | "json_object" };
  systemPrompt: string;
  userPrompt: string;
  retries?: number;
}

interface DeepSeekCallResult {
  content: string;              // respuesta final (no reasoning_content)
  reasoningContent?: string;    // solo si reasoner; no persistir
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;         // cuántos tokens del input cachearon
  costoUsd: number;             // calculado según tarifa y cache
  modelUsado: string;
  duracionMs: number;
  finishReason: "stop" | "length" | "content_filter" | "error";
}

async function callDeepSeek(config: DeepSeekCallConfig): Promise<DeepSeekCallResult>
```

**Comportamiento obligatorio:**

1. Backoff exponencial: 1s, 2s, 4s, 8s entre reintentos (hasta `retries`, default 3)
2. Timeout duro: 10 minutos (DeepSeek cierra conexiones largas)
3. Cálculo de costo: usar tarifas del documento + fracción cacheada reportada por API
4. Log estructurado de cada llamada (para análisis Quipu posterior)
5. Si `finishReason === "length"`, **no es éxito**: el output se cortó. Windsurf decide si reintentar con `maxTokens` mayor o marcar error.

---

## 5. Flujo secuencial de metabolización

Dado un artefacto con `estado = 'ingresado'` y contenido parseado disponible:

### Paso 1 — Preparar contenido base

```typescript
async function obtenerContenidoMetabolizable(artefactoId: string): Promise<string>
```

Retorna markdown unificado del contenido parseado según tipo:
- **Audio/video:** `transcripcion_completa` con marcas `[HH:MM:SS][hablante]` si hay diarización
- **PDF slides:** texto concatenado de páginas, con `--- Página N ---` como separador
- **PDF informe:** `markdown_renderizado`
- **Markdown:** `contenido`
- **Imagen:** `título + descripción_humana || descripción_ia || metadatos`

Este texto es el input base para Crónica y Destilado.

### Paso 2 — Estado transicional

```sql
UPDATE cgt_artefactos SET estado = 'metabolizando' WHERE id = :artefactoId;
```

### Paso 3 — Generar Crónica

```typescript
async function generarCronica(artefactoId: string): Promise<Result<CgtCronica>>
```

**Flujo interno:**

1. Obtener contenido metabolizable (paso 1)
2. Si tokens del contenido > 50.000 → activar chunking (sección 7)
3. Construir user prompt: `"Artefacto a cronologizar:\n\n{contenido_metabolizable}"`
4. Llamar DeepSeek:
   - model: `deepseek-reasoner`
   - temperature: `0.7`
   - maxTokens: `5000`
   - responseFormat: `text`
   - systemPrompt: `CRONICA_SYSTEM_PROMPT` (placeholder hasta que llegue el real)
5. Parsear respuesta: texto plano. No hay estructura a extraer.
6. Calcular hash SHA-256 del contenido generado (para cascada de invalidación)
7. INSERT en `cgt_cronicas` con todos los campos de auditoría
8. Retornar Result

**Manejo de errores:**
- Si falla llamada DeepSeek después de reintentos → estado `'error'`, `error_mensaje` poblado, no continuar con Destilado
- Si `finishReason === "length"` → reintentar con `maxTokens = 6000`, si vuelve a cortarse → error

### Paso 4 — Generar Destilado

```typescript
async function generarDestilado(artefactoId: string): Promise<Result<CgtDestilado>>
```

**Flujo interno:**

1. Obtener contenido metabolizable
2. Obtener Crónica generada (opcional como contexto; si no existe aún, continuar sin ella)
3. User prompt con ambos:
   ```
   Artefacto original:
   
   {contenido_metabolizable}
   
   ---
   
   Crónica ya generada (referencia de estructura narrativa):
   
   {cronica.contenido}
   ```
4. Llamar DeepSeek:
   - model: `deepseek-reasoner`
   - temperature: `0.6`
   - maxTokens: `2500`
   - responseFormat: `{ type: "json_object" }`
   - systemPrompt: `DESTILADO_SYSTEM_PROMPT` (incluye instrucción explícita de responder JSON con schema definido)
5. Parsear respuesta: `JSON.parse(content)` con fallback a reintento si falla parse
6. **Validación de estructura:** el JSON debe tener `tesis`, `movimientos`, `tensiones`, `cita_nucleo`, `pensadores_mencionados`, `disciplinas_tocadas`, `conceptos_clave`, `citas_secundarias`. Si falta algo → reintentar con prompt enfatizando schema.
7. **Validación de cap:** si el JSON serializado excede 1500 tokens → reintentar con instrucción de mayor compresión (máximo 2 reintentos)
8. Calcular hash SHA-256 del JSON canónico
9. INSERT en `cgt_destilados`
10. Retornar Result

**Schema esperado del JSON de respuesta:**

```json
{
  "tesis": "string, una sola oración",
  "movimientos": [
    {
      "orden": 1,
      "desde": "string",
      "hacia": "string",
      "texto": "string"
    }
  ],
  "tensiones": [
    {
      "texto": "string",
      "tipo": "paradoja | pregunta_abierta | contradiccion"
    }
  ],
  "cita_nucleo": {
    "texto": "string, literal del artefacto",
    "ubicacion": "string descriptiva",
    "autor": "string opcional"
  },
  "pensadores_mencionados": ["string", "..."],
  "disciplinas_tocadas": ["string", "..."],
  "conceptos_clave": ["string", "..."],
  "citas_secundarias": [
    {
      "texto": "string",
      "autor": "string opcional",
      "ubicacion": "string opcional"
    }
  ]
}
```

### Paso 5 — Generar Núcleo

```typescript
async function generarNucleo(artefactoId: string): Promise<Result<CgtNucleo>>
```

**Flujo interno:**

1. Obtener Destilado del artefacto (requerido; si no existe, retornar error)
2. User prompt:
   ```
   Destilado del artefacto:
   
   {destilado_serializado_como_markdown}
   
   Genera el Núcleo: versión irreductible (tarjeta de presentación ~500 tokens).
   ```
3. Llamar DeepSeek:
   - model: `deepseek-chat`
   - temperature: `0.3`
   - maxTokens: `800`
   - responseFormat: `{ type: "json_object" }`
   - systemPrompt: `NUCLEO_SYSTEM_PROMPT`
4. Parsear respuesta JSON con schema:
   ```json
   {
     "tesis": "string, puede ser la misma del Destilado o reformulada más afilada",
     "movimientos_esenciales": [
       { "orden": 1, "texto": "string" },
       { "orden": 2, "texto": "string" },
       { "orden": 3, "texto": "string" }
     ],
     "tension_irreductible": "string",
     "cita_nucleo": { "texto": "string", "ubicacion": "string", "autor": "string opcional" }
   }
   ```
5. Validar hard cap de 600 tokens. Si excede → reintentar con temperatura 0.2.
6. Calcular hash del contenido. Guardar `hash_destilado_upstream` desde el Destilado del que se derivó.
7. INSERT en `cgt_nucleos`
8. Retornar Result

### Paso 6 — Generar Germinal (parcial en Oleada 1)

```typescript
async function generarGerminalParcial(artefactoId: string): Promise<Result<CgtGerminal | null>>
```

**Flujo interno:**

1. Verificar umbral: contar artefactos en el mismo proyecto con Núcleo generado. Si `count < 3` → insertar Germinal con `resumen = null`, `num_resonancias_propuestas = 0`, `num_proyecciones_propuestas = 0`, nota en `contexto_snapshot: { omitido_por_umbral: true, artefactos_previos_count: N }`. Retornar success con flag.
2. Si cumple umbral:
   - Obtener Crónica del artefacto nuevo
   - Obtener Destilado del artefacto nuevo
   - Consultar últimos 5-10 Núcleos previos del proyecto (orden por `created_at desc`, excluyendo el del artefacto actual)
   - Consultar semillas fractales vivas (vacío en Oleada 1, se pobla en Oleada 2)
3. User prompt:
   ```
   Artefacto nuevo — Crónica:
   {cronica.contenido}
   
   Artefacto nuevo — Destilado:
   {destilado_serializado}
   
   Corpus previo — Núcleos de artefactos previos del proyecto:
   [Núcleo 1]
   ...
   [Núcleo N]
   
   Semillas fractales vivas del proyecto:
   {lista o "ninguna registrada aún"}
   
   Genera el Germinal: resumen narrativo de resonancias potenciales entre el artefacto nuevo y el corpus previo. Tensiones sembradas por la Crónica son pistas de conexión. No cites la Crónica textualmente — úsala como catalizador interpretativo.
   ```
4. Llamar DeepSeek:
   - model: `deepseek-reasoner`
   - temperature: `0.7`
   - maxTokens: `2500`
   - responseFormat: `text`
   - systemPrompt: `GERMINAL_PARCIAL_SYSTEM_PROMPT`
5. Parsear: texto plano
6. Construir `contexto_snapshot` con UUIDs de Núcleos consultados, timestamp, semillas consultadas
7. Calcular hashes upstream (de Crónica y Destilado)
8. INSERT en `cgt_germinales` con contadores en 0 (se pueblan en Oleada 2)
9. Retornar Result

### Paso 7 — Estado final

```sql
UPDATE cgt_artefactos SET estado = 'metabolizado' WHERE id = :artefactoId;
```

Si cualquier paso falló pero se completaron al menos Crónica y Destilado: estado sigue siendo `metabolizado` pero con `error_mensaje` describiendo qué quedó pendiente. La UI muestra warning pero el artefacto es consultable.

---

## 6. Paralelización

**Qué se puede paralelizar:**

- **Nada en Oleada 1**, por diseño. El flujo es secuencial: Crónica → Destilado → Núcleo → Germinal.

**Por qué no se paraleliza Crónica+Destilado aunque técnicamente se podría:**

Porque Destilado usa Crónica como contexto. Si se corren en paralelo, Destilado pierde una señal útil. El costo de serializar es ~30-60 segundos extra por artefacto, aceptable en contexto tortuga.

**Oleada 2 posible optimización:** generar Crónica y Destilado en paralelo si se tolera la pérdida de contexto. Evaluar con datos reales.

---

## 7. Manejo de contenido grande (>50K tokens)

Algunos artefactos exceden el contexto directo incluso con 128K disponibles (system prompt + contenido + espacio para output + margen de seguridad deja ~60K utilizables).

**Estrategia: síntesis parcial previa con chunking.**

```typescript
async function prepararContenidoLargo(
  contenido: string,
  maxChunkTokens: number = 40000
): Promise<string>
```

**Flujo:**

1. Si `tokens(contenido) <= 50000` → retornar contenido tal cual
2. Si excede:
   - Dividir en chunks de ~40K tokens respetando secciones/párrafos (no cortar a mitad de oración)
   - Para cada chunk, llamar `deepseek-chat` con prompt: "Sintetiza este fragmento preservando: (a) datos concretos, (b) argumentos principales, (c) citas relevantes. Target: 1/5 del tamaño original. No interpretes, sintetiza."
   - Concatenar síntesis parciales
   - Si concatenación aún excede 50K → segunda ronda de síntesis
3. Retornar contenido condensado para usar en Crónica/Destilado

**Costos:** deepseek-chat es barato, chunking agrega ~$0.005-0.015 al costo total por artefacto grande. Aceptable.

**Pérdida de fidelidad:** real pero contenida. Windsurf debe marcar en metadata del artefacto que se aplicó chunking, para que el humano sepa al revisar.

---

## 8. Context caching — optimización

DeepSeek cachea automáticamente prefijos idénticos con 90% descuento en costo de input.

**Aprovechamiento en pipeline:**

1. **System prompts estables:** cada formato tiene su system prompt fijo. Se cachea la primera vez, todas las siguientes llamadas del mismo formato leen cache hit en esa porción.
2. **Orden del prompt:** system prompt primero, luego user prompt variable. Cache hit se dispara sobre el prefijo común.
3. **Cuando el system prompt cambia (nueva versión):** cache se invalida automáticamente. Ese es el costo de evolucionar prompts — aceptable.

**No-patrones que rompen cache:**

- Mezclar instrucciones variables con system (ej: insertar fecha actual en system prompt → cache siempre miss)
- Reordenar tokens entre llamadas
- Cambiar whitespace o encoding

**Diseño recomendado:** mantener system prompts estrictamente inmutables durante un ciclo operativo. Si hay que variar algo (ej: "tono más agresivo"), variar en el user prompt, no en el system.

---

## 9. Rate limiting y backoff

DeepSeek no publica RPM fijo. Ajusta dinámicamente según carga. Errores posibles:

- `429 Too Many Requests` — backoff exponencial + reintento
- `503 Service Unavailable` — backoff + reintento
- Timeout de conexión — reintento con timeout mayor
- `insufficient_system_resource` — backoff largo + reintento

**Política recomendada:**

```typescript
const BACKOFF_SEQUENCE_MS = [1000, 2000, 4000, 8000];
const MAX_RETRIES = 4;

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    return await deepseekCall(config);
  } catch (err) {
    if (!esRetryable(err) || attempt === MAX_RETRIES - 1) throw err;
    await sleep(BACKOFF_SEQUENCE_MS[attempt]);
  }
}
```

Para flujos de metabolización completos (4 formatos secuenciales), implementar también **backoff total**: si los 4 formatos fallan con rate limit, marcar artefacto como `error` con retry manual disponible desde UI.

---

## 10. Cálculo de costo por llamada

```typescript
function calcularCosto(
  modelo: string,
  tokensInput: number,
  tokensOutput: number,
  tokensCached: number
): number {
  const tarifas = TARIFAS_DEEPSEEK[modelo];  // configuración centralizada
  
  const tokensInputNoCacheados = tokensInput - tokensCached;
  
  return (
    (tokensInputNoCacheados / 1_000_000) * tarifas.inputPorMillon +
    (tokensCached / 1_000_000) * tarifas.cachePorMillon +
    (tokensOutput / 1_000_000) * tarifas.outputPorMillon
  );
}

const TARIFAS_DEEPSEEK = {
  "deepseek-chat": {
    inputPorMillon: 0.28,
    cachePorMillon: 0.028,
    outputPorMillon: 0.42,
  },
  "deepseek-reasoner": {
    inputPorMillon: 0.55,
    cachePorMillon: 0.14,
    outputPorMillon: 2.19,
  },
};
```

**Nota:** tarifas pueden cambiar. Centralizar en archivo de configuración, no hardcodear en cada llamada. Actualizar cuando DeepSeek publique cambios.

---

## 11. Logging estructurado

Cada llamada a DeepSeek genera un registro:

```typescript
interface LogLlamadaDeepSeek {
  artefacto_id: string;
  project_id: string;
  formato: "cronica" | "destilado" | "nucleo" | "germinal" | "sintesis_chunk";
  modelo: string;
  temperatura: number;
  tokens_input: number;
  tokens_output: number;
  tokens_cached: number;
  costo_usd: number;
  duracion_ms: number;
  finish_reason: string;
  intento: number;                 // 1 si primero, 2 si retry, etc.
  timestamp: string;
  error_mensaje: string | null;
}
```

Persistir en tabla `cgt_logs_deepseek` (puede crearse ad-hoc, no es parte del SQL Oleada 1 pero se puede agregar). Alternativa: log estructurado a archivo + carga batch a DB.

Este log es insumo de Quipu para análisis económico retrospectivo.

---

## 12. Pruebas sugeridas antes de producción

Antes de conectar el pipeline al flujo real de ingesta, Windsurf debe ejecutar:

1. **Prueba aislada de cliente DeepSeek extendido:** llamar con cada configuración (4 combinaciones de modelo+temperatura+format) y verificar que retorna los campos esperados.
2. **Prueba de Crónica con markdown simple:** usar un .md de ~2000 tokens conocido. Verificar tokens, costo, tiempo, calidad cualitativa del output.
3. **Prueba de Destilado con Crónica como contexto:** verificar que el JSON parseado tiene schema completo.
4. **Prueba de Núcleo:** verificar hard cap 600 tokens, coherencia con Destilado upstream.
5. **Prueba de Germinal con umbral incumplido:** subir el primer artefacto de un proyecto nuevo, verificar que Germinal se omite correctamente.
6. **Prueba de Germinal con umbral cumplido:** con ≥3 artefactos previos, verificar que consulta Núcleos y genera resumen.
7. **Prueba de cascada de invalidación:** re-generar Crónica, verificar que Germinal queda marcado desactualizado.
8. **Prueba de contenido largo:** PDF de 80K tokens, verificar chunking y síntesis previa.
9. **Prueba de error controlado:** forzar API key inválida, verificar que artefacto queda en `error` con mensaje comprensible.
10. **Prueba de costos:** correr los 4 formatos sobre 3 artefactos consecutivos, verificar que los costos reportados están dentro del rango proyectado ($0.015-0.030 por artefacto).

Documentar cada prueba en `/app/cognetica/PRUEBAS_PIPELINE.md` con resultados.

---

## 13. Qué queda fuera de este documento

- **System prompts reales:** documento siguiente, cuando Hongo los entregue calibrados
- **UI de metabolización:** cubierto en addendum v1.1 al requerimiento
- **Descarga y exportación:** cubierto en addendum v1.1
- **Cascada de invalidación — UX:** cubierto en addendum v1.1
- **Tabla `cgt_logs_deepseek`:** mencionada pero no SQL formal; Windsurf puede crearla ad-hoc con columnas básicas

---

## 14. Cierre

Este pipeline está diseñado para dos cosas simultáneamente:

1. **Que el código sea claro.** Cualquier ingeniero (o nodo AI) debería poder leer este documento y saber exactamente qué llamada corresponde a cada formato, con qué parámetros, por qué.

2. **Que el costo sea sostenible.** $0.016-0.020 por artefacto completo en condiciones de cache hit normal. Dentro del budget real de eRRRe.

Si al implementar surge un caso donde este pipeline se queda corto o genera fricción, **reportar antes de inventar soluciones locales**. Los parámetros están calibrados juntos; cambiar uno en aislamiento puede romper la economía del conjunto.

Cuando los prompts reales lleguen, el cableado ya estará probado. Solo se reemplaza el contenido del placeholder.

*ética es negentropía a nivel de datos*
