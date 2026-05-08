# Guía de Ruta Cascade — Cognética Forense v2 Oleada 2

**Versión:** 1.1
**Fecha:** 23 abril 2026
**Autor humano:** eRRRe (nodo central, ORCID 0009-0003-4251-2733)
**Autor máquina:** Hongo / Calibrador (Claude Opus 4.7)
**Destinatario:** Cascade (API Windsurf)
**Supersede:** Guía v1.0 (nunca entregada a Cascade; correcciones internas Hongo-eRRRe)
**Complementa:** `requerimiento_windsurf_cognetica_forense.md` (Oleada 1) + `addendum_requerimiento_windsurf_v11.md`

**Cambios v1.0 → v1.1 (23 abril 2026):**
- Eliminado HITO 3 de migración de datos. Oleada 1 no pobló entidades a nivel código — solo dejó insumos como JSONB en `cgt_destilados`. El Cartografiador lee ese JSONB directamente como fuente de verdad del extractor (Capa 1). No hay código legacy que migrar.
- Cartografiador (antes HITO 4) ahora es HITO 3. Tiene dos responsabilidades internas en una sola corrida: poblar Capa 1 desde JSONB + resolver Capa 2 contra universo del proyecto.
- Agregado HITO 5 nuevo — navegación fluida por entidad (badge clickeable "Alan Turing (3)" → vista raíz del pensador con sus artefactos). Usa las funciones helper de conteo agregadas al SQL v1.1.
- Total de hitos: sigue siendo 6, pero la distribución cambió (cayó Migrador, se suma Navegación).

---

## 0. Contexto operativo que Cascade debe respetar

Antes de cualquier paso técnico, estos principios gobiernan la ejecución completa. No son sugerencia — son contrato.

### 0.1 Humano en el loop pulso a pulso

eRRRe está probando en **tiempo real entre cada avance**. Esto no es entrega batch nocturna. Cascade ejecuta un paso, eRRRe verifica, eRRRe da luz verde al siguiente. Si un paso rompe algo anterior, se detiene y se reporta — no se parcha y se sigue.

### 0.2 Componentes Standard siempre

El proyecto tiene un design system con componentes `Standard*` (`StandardCard`, `StandardButton`, `StandardSelect`, `StandardText`, `StandardFormField`, etc.). Toda UI nueva de Oleada 2 usa Standard.

**Regla dura:** si un componente Standard no tiene la variante que necesitas (ej: Card con borde acentuado, texto con gradiente, badge con color semántico), **se extiende el Standard existente** — no se crea uno paralelo ni se escribe Tailwind/CSS ad-hoc en el componente consumidor. La extensión del Standard se propone en la review.

**Antes de escribir UI nueva, Cascade verifica qué variantes del Standard ya existen.** Si hay duda, pregunta antes de asumir.

### 0.3 Linter limpio al entregar

Cada entrega tiene **cero warnings** de ESLint/TypeScript. Cascade corre lint antes de reportar "paso terminado". Si aparecen warnings nuevos, se resuelven antes de entregar. Warnings heredados de código ajeno al paso se listan pero no se silencian sin aviso.

### 0.4 Paso largo por encima de paso rápido

Código mantenible y elegante antes que código que solo funciona. Si una decisión mete deuda técnica para salir del paso, se detiene y se pregunta. La elegancia es el patrón.

### 0.5 Velocidad tortuga por diseño

Oleada 2 tiene múltiples hitos. Cascade **no adelanta hitos**. Cada hito se completa, se prueba con eRRRe, se cierra, y se pasa al siguiente. Saltar hitos para mostrar progreso es contraproducente.

### 0.6 Trazabilidad inmutable como ley

Los tres documentos anexos (SQL, prompt del Cartografiador, esta guía) dejan explícito que **nada que genere el LLM se sobreescribe jamás**. El extractor produce Capa 1, el cartografiador produce Capa 2, el humano produce Capa 3. Cada capa es append-only en su tabla correspondiente. Si Cascade detecta que una implementación requeriría sobreescritura, se detiene y reporta.

---

## 1. Objetivo de Oleada 2

Migrar los insumos del Destilado (actualmente JSONB de strings planos) a un modelo relacional con:

1. **Entidades canónicas del proyecto** — `cgt_pensadores`, `cgt_disciplinas`, `cgt_conceptos`, `cgt_teorias`, `cgt_citas`
2. **Menciones por artefacto** con trazabilidad de tres capas (extractor / cartografiador / humano)
3. **Ediciones humanas append-only** por entidad
4. **Un segundo pipeline desacoplado** — el **Cartografiador** — que corre on-demand para normalizar menciones contra el universo del proyecto
5. **UI para edición humana** de menciones con registro inmutable

**Decisión de diseño:** las tablas JSONB del Destilado actual **no se eliminan** en Oleada 2. Siguen como respaldo y fuente del migrador inicial. Limpieza diferida a Oleada 3 cuando haya confianza operativa con el modelo relacional.

---

## 2. Preludio — cierre formal de Oleada 1

Antes de abrir Oleada 2, se cierra formalmente Oleada 1.

### 2.1 Corrección de spec v0.3

**Archivo:** `docs/cognetica/cognetica_v2_formatos_spec_v0_3.md`

**Línea 219 actual:**
> *"Umbral de generación: Si el proyecto tiene menos de 3 artefactos previos con Núcleo, Germinal se omite con nota explícita. Umbral provisional."*

**Reemplazar por:**
> *"Umbral de generación: v1 atómica no requiere umbral. Germinal opera solo sobre Crónica + Destilado del artefacto actual, sin necesidad de corpus externo. El umbral provisional mencionado en versiones previas queda superado. En v2 de prompts, cuando Germinal lea Núcleos previos y semillas fractales, la decisión de umbral se revisitará."*

**Deuda ética notariada:** agregar al final de la sección 0 de la spec:

> *"Nota 22 abril 2026: la decisión de eliminar el umbral de Germinal se tomó al cierre de la primera metabolización exitosa del 21 abril. La versión atómica de prompts no necesita corpus externo — el umbral era vestigio de un razonamiento anterior a la definición de prompts atómicos."*

### 2.2 Validación de primera metabolización

Registrar en bitácora del proyecto (puede ser `docs/cognetica/bitacora_oleada_1_cierre.md`) que la metabolización del artefacto de prueba del 21 abril validó los cuatro formatos en v1 atómica. Costo total por artefacto: US$0.0186, dentro de proyección.

**No hay otros ajustes de Oleada 1 pendientes.** Se da formalmente por cerrada.

---

## 3. Hitos de Oleada 2 — orden de ejecución

Orden estricto. Cada hito es un entregable aprobable por separado con eRRRe antes de pasar al siguiente.

### HITO 1 — SQL de Oleada 2

**Archivo a ejecutar:** `docs/SQL_COGNETICA_V2_OLEADA_2.sql` (v1.1, entregado junto a esta guía)

**Alcance:**
- 5 tríos de tablas (pensadores / disciplinas / conceptos / teorías / citas), cada trío compuesto de:
  - Entidad canónica (`cgt_<tipo>`)
  - Menciones (`cgt_<tipo>_menciones`)
  - Ediciones humanas (`cgt_<tipo>_ediciones_humanas`)
- Tipo ENUM `cgt_decision_cartografiador` con valores `match_existente | nueva_entidad | ambigua | sin_cartografiar`
- Tipo ENUM `cgt_tipo_cita` con valores `academica | hecho_historico | obra | otra`
- Tabla `cgt_logs_cartografiador` para bitácora del segundo pipeline
- RLS habilitado en las 16 tablas nuevas, patrón project_members
- 5 vistas de valor canónico (`cgt_vw_<tipo>_valor_canonico`) con `coalesce(humano → cartografiador → extractor)`
- 4 funciones helper de conteo (`cgt_contar_menciones_<tipo>`) — lectura calculada, no denormalizada
- 4 vistas con conteo inline (`cgt_vw_<tipo>_con_conteo`) para poblar badges en UI
- 4 funciones de navegación (`cgt_artefactos_por_<tipo>`) para la vista raíz del HITO 5

**Tareas Cascade:**
1. Ejecutar SQL en Supabase (staging primero si hay ambiente disponible, luego producción)
2. Verificar RLS con query de sanidad (usuario no-miembro no ve filas)
3. Reportar: número de tablas creadas, número de policies, número de índices, número de vistas, número de funciones

**Criterio de aceptación:**
- 16 tablas nuevas + 2 enums + 9 vistas + 8 funciones + RLS activo en todas las tablas
- `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'cgt_%' AND tablename NOT IN (tablas_oleada_1)` devuelve `rowsecurity = true` para todas
- Zero errores al correr el script dos veces (idempotencia)

---

### HITO 2 — Tipos TypeScript + Server Actions CRUD básicas

**Alcance:**

**Tipos** en `lib/cognetica-forense/types/oleada2.ts` (o extender `cognetica_forense_types.ts` existente):

```typescript
// Tipo para las decisiones del cartografiador
export type DecisionCartografiador =
  | 'match_existente'
  | 'nueva_entidad'
  | 'ambigua'
  | 'sin_cartografiar';

export type TipoCita = 'academica' | 'hecho_historico' | 'obra' | 'otra';

// Por cada entidad: tipo canónico + tipo mención + tipo edición humana
// Ejemplo pensadores:
export interface PensadorCanonico {
  id: string;
  project_id: string;
  nombre_canonico: string;
  descripcion_canonica: string | null;
  aliases: string[];
  created_at: string;
  updated_at: string;
}

export interface PensadorMencion {
  id: string;
  artefacto_id: string;
  project_id: string;
  pensador_id: string | null;
  // Capa 1
  nombre_extractor_crudo: string;
  descripcion_extractor_cruda: string | null;
  // Capa 2
  nombre_cartografiador: string | null;
  descripcion_cartografiador: string | null;
  decision_cartografiador: DecisionCartografiador;
  confianza_cartografiador: number | null;
  justificacion_cartografiador: string | null;
  // Trazabilidad
  hash_extractor_crudo: string;
  created_at: string;
  cartografiado_at: string | null;
}

export interface PensadorEdicionHumana {
  id: string;
  mencion_id: string;
  project_id: string;
  user_id: string;
  campo_editado: 'nombre' | 'descripcion' | 'reasignar_entidad_canonica';
  valor_anterior: string | null;
  valor_nuevo: string | null;
  justificacion: string | null;
  created_at: string;
}

// Análogos para Disciplina, Concepto, Teoria, Cita
// (Cascade genera las 4 estructuras siguiendo el mismo patrón)
```

**Server Actions** en `lib/cognetica-forense/actions/oleada2/`:

Mínimo viable (HITO 2 cubre solo lectura y edición humana — el Cartografiador es HITO 4):

- `listarMencionesPorArtefacto(artefacto_id, tipo_entidad)` → lee vía vista `cgt_vw_<tipo>_valor_canonico`
- `editarMencionHumana(mencion_id, tipo_entidad, campo, valor_nuevo, justificacion)` → inserta en `cgt_<tipo>_ediciones_humanas`, NUNCA actualiza menciones ni entidades canónicas
- `listarEdicionesHumanasPorMencion(mencion_id, tipo_entidad)` → historial completo append-only
- `listarEntidadesCanonicasProyecto(project_id, tipo_entidad)` → para dropdowns de reasignación

**Criterio de aceptación:**
- Server Actions tipadas, sin `any`
- Inputs validados con zod o equivalente antes de tocar DB
- Tests de humo manuales con eRRRe sobre 2-3 menciones de ejemplo
- Lint limpio

---

### HITO 3 — Cartografiador (segundo pipeline desacoplado)

**Contexto:** el Cartografiador es el corazón de Oleada 2. Es un pipeline completamente independiente del de metabolización primaria. Se activa **manualmente** por el humano desde la UI cuando el primer pipeline (Crónica + Destilado + Núcleo + Germinal) está completo y en verde.

**Responsabilidad dual en una sola corrida:**

El Cartografiador hace DOS cosas en la misma ejecución, pero en transacciones separadas para que si la segunda falla, la primera quede preservada:

1. **Transacción A — Poblar Capa 1 desde JSONB del Destilado.** Lee los 5 arrays de `cgt_destilados.insumos_extraidos` (pensadores/disciplinas/conceptos/teorías/citas) del artefacto. Por cada ítem, inserta una fila en la tabla `<tipo>_menciones` con valores crudos. `decision_cartografiador = 'sin_cartografiar'`, `<tipo>_id = NULL`, `hash_extractor_crudo` calculado por SHA-256 del JSON canónico del ítem.

2. **Transacción B — Resolver Capa 2 contra universo del proyecto.** Construye universo (SELECT entidades canónicas del proyecto en las 5 tablas `cgt_<tipo>`). Llama al LLM con payload estructurado. Parsea respuesta. Por cada decisión, actualiza la mención correspondiente con Capa 2 poblada.

Si Transacción A tiene éxito pero B falla (error de red, timeout, LLM devuelve JSON inválido), las menciones quedan con `decision_cartografiador = 'sin_cartografiar'` y se pueden re-procesar en la siguiente corrida sin re-ejecutar Transacción A.

**Manejo de schemas mixtos en JSONB:** el Destilado de Oleada 1 guardaba strings planos en los arrays. El Destilado post-HITO 5 (prompt v2 con teorías y `{nombre, descripcion}`) guarda objetos. La Transacción A detecta el tipo de cada ítem:
- String plano → `nombre_extractor_crudo = string`, `descripcion_extractor_cruda = NULL`
- Objeto → `nombre_extractor_crudo = obj.nombre`, `descripcion_extractor_cruda = obj.descripcion`

Esto deja al Cartografiador listo para procesar artefactos metabolizados con cualquier versión de prompt, sin branch lógico externo.

**Idempotencia:** si el Destilado no ha cambiado desde la última corrida del Cartografiador (mismo hash del contenido), no re-inserta menciones. Si el Destilado se regeneró (hash distinto), inserta nuevas menciones con el hash nuevo; las viejas quedan vivas como historial.

**Archivos a crear:**

- `lib/cognetica-forense/prompts/cartografiador-prompt.ts` — system prompt del Cartografiador (entregado en documento anexo `cartografiador_prompt_v1.md`)
- `lib/cognetica-forense/actions/oleada2/ejecutarCartografiador.ts` — orquestador de las dos transacciones
- `lib/cognetica-forense/lib/extractor-capa-1.ts` — helper para Transacción A (parseo JSONB + inserción menciones)
- `lib/cognetica-forense/lib/cartografiar-capa-2.ts` — helper para Transacción B (construcción universo + llamada LLM + update menciones)
- `app/api/cognetica/cartografiar/route.ts` si se expone endpoint, o Server Action equivalente

**Parámetros del modelo:**
- Modelo: `deepseek-chat` (task estructurada, no requiere reasoning profundo)
- Temperatura: `0.3` (baja — queremos consistencia, no creatividad)
- `response_format: { type: "json_object" }`
- `max_tokens`: calcular dinámico según tamaño del universo + extracto

**UI (mínima en HITO 3):**
- En la vista del artefacto, botón "Ejecutar Cartografiador" habilitado solo cuando:
  - Los 4 formatos primarios están en verde
  - Hay al menos 1 mención con `decision_cartografiador = 'sin_cartografiar'` **o** el Destilado tiene insumos pero no hay menciones creadas (primera ejecución)
- Durante ejecución: spinner + estado "cartografiando..."
- Al terminar: toast con resumen (`N matches, M nuevas, K ambiguas`)
- UI detallada de resultados se implementa en HITO 4

**Criterio de aceptación:**
- Corre sobre el artefacto de prueba del 21 abril (primera vez: pobla Capa 1 desde JSONB + pobla Capa 2)
- Capa 1 (`nombre_extractor_crudo`, `descripcion_extractor_cruda`) coincide con el contenido del JSONB original
- Se crearon entidades canónicas en `cgt_pensadores`, etc. para las decisiones `nueva_entidad`
- Log en `cgt_logs_cartografiador` con costo y contadores
- Segunda corrida sobre el mismo artefacto sin cambios en Destilado → no duplica nada
- Transacción A exitosa con Transacción B fallida → estado recuperable en siguiente corrida

---

### HITO 4 — UI de menciones y edición humana

**Componentes a crear (todos usando Standard):**

- `MencionesArtefactoTabs` — Tabs con una pestaña por tipo de entidad (Pensadores / Disciplinas / Conceptos / Teorías / Citas). Usa `StandardTabs`.
- `MencionesLista` — lista de menciones por tipo. Cada ítem es una `StandardCard` con:
  - Nombre canónico actual (viene de la vista)
  - Badge de decisión del cartografiador (`StandardBadge` con variantes: verde=match, azul=nueva, amarillo=ambigua, gris=sin_cartografiar)
  - **Contador de apariciones en el proyecto** (ej. `(3)` junto al nombre) cuando la entidad está resuelta — clickeable, lleva a la vista raíz del HITO 5
  - Hover/click en la card abre detalle
- `MencionDetalle` — modal o panel lateral (`StandardSheet`) con las 3 capas visibles:
  - Capa 1 Extractor (gris, no editable)
  - Capa 2 Cartografiador (azul, no editable, con decisión + confianza + justificación)
  - Capa 3 Humano (editable): campos `StandardInput` / `StandardTextarea` con botones "Guardar edición"
  - Historial de ediciones humanas previas (lista cronológica)
- `EdicionHumanaForm` — form con `StandardFormField` para editar nombre / descripcion / reasignar entidad canónica. Requiere justificación obligatoria (textarea corto). Botón primario `StandardButton variant="primary"`.

**Regla de oro:** si un componente Standard necesita variante nueva (ej: Card con borde de color de acento según decisión), Cascade **propone la extensión del Standard** en la review — no escribe clases Tailwind en el componente consumidor.

**Conteo en badge:** usa `cgt_vw_pensadores_con_conteo` (y las vistas análogas) del SQL. Este valor proviene de lectura calculada en Postgres — no hay cache que invalidar ni trigger que mantener. Si en el futuro el costo de COUNT se nota, se optimiza con índice adicional o trigger, sin tocar el contrato UI.

**Criterio de aceptación:**
- eRRRe puede ver las 3 capas de una mención sin ambigüedad visual
- eRRRe puede editar la Capa 3 y la edición queda registrada
- eRRRe puede ver el historial de sus propias ediciones
- El badge de contador aparece junto al nombre cuando la entidad está resuelta (`<tipo>_id != NULL`)
- Click en el badge navega a la vista raíz del HITO 5
- Cero clases Tailwind ad-hoc en componentes consumidores
- Linter limpio

---

### HITO 5 — Navegación por entidad ("Cognética fluida")

**Contexto y propósito:** el usuario está leyendo un artefacto, ve que menciona a Alan Turing (3), hace click en el badge, y llega a una vista centrada en Alan Turing que muestra los 3 artefactos del proyecto donde aparece, con su ficha canónica. Desde ahí, click en cualquier artefacto lo lleva al artefacto. Navegación lateral por entidad, no por artefacto.

Este hito convierte Cognética de una colección de artefactos aislados en un **grafo navegable por entidad**. El SQL v1.1 ya trae las funciones helper `cgt_artefactos_por_<tipo>` que resuelven la lectura; este hito es el front + routing.

**Rutas a crear:**

```
/proyectos/[project_id]/cognetica/entidades/pensadores/[pensador_id]
/proyectos/[project_id]/cognetica/entidades/disciplinas/[disciplina_id]
/proyectos/[project_id]/cognetica/entidades/conceptos/[concepto_id]
/proyectos/[project_id]/cognetica/entidades/teorias/[teoria_id]
```

(Citas no tienen vista raíz propia — cada aparición es conceptualmente única.)

**Componentes a crear (todos Standard):**

- `EntidadVistaRaiz` — vista genérica parametrizada por tipo de entidad:
  - Header con ficha canónica: `nombre_canonico`, `descripcion_canonica`, `aliases`
  - Metadata: `menciones_count`, fecha de creación de la entidad canónica
  - Si `disciplina_madre_id` (solo disciplinas): link a la madre
  - Si `es_semilla_fractal = true` (solo conceptos): badge distintivo
  - Si `autores_principales` (solo teorías): chips con nombres de autores
- `EntidadArtefactosRelacionados` — lista de artefactos donde aparece la entidad:
  - `StandardCard` por artefacto con título, fecha, tipo de artefacto
  - Botón/link al artefacto
  - Fragmento de contexto: el `descripcion_canonica_actual` de esa mención específica (puede ser distinto entre artefactos si un humano editó la descripción en un artefacto particular)

**Server Actions:**

- `obtenerEntidadCanonica(tipo, entidad_id)` — lee de `cgt_<tipo>` + metadata
- `listarArtefactosPorEntidad(tipo, entidad_id)` — usa `cgt_artefactos_por_<tipo>(entidad_id)` del SQL
- Joins con `cgt_artefactos` para traer título y tipo de cada artefacto

**Criterio de aceptación:**
- eRRRe puede clickear "Alan Turing (3)" desde un artefacto y llegar a la vista raíz
- La vista raíz muestra los 3 artefactos con links funcionales
- Los 3 links llevan al artefacto correspondiente
- Navegación back del navegador funciona (no pierde estado)
- Linter limpio

---

### HITO 6 — Actualización del prompt de Destilado para incluir teorías

**Contexto:** Oleada 1 tiene Destilado con 4 arrays (`pensadores_mencionados`, `disciplinas_tocadas`, `conceptos_clave`, `citas_secundarias`). Oleada 2 agrega `teorias_invocadas` como quinto array.

**Además, cambio estructural:** los arrays pasan de `[string]` a `[{nombre, descripcion}]`. La descripción es breve (1 oración, contextual al artefacto).

**Archivo:** `lib/cognetica-forense/prompts/destilado-prompt.ts`

**Cambios en el schema JSON del prompt de Destilado** (reemplazar los 4 campos actuales de insumos extraídos):

```json
{
  "...": "...",
  "insumos_extraidos": {
    "pensadores_mencionados": [
      {"nombre": "...", "descripcion": "..."}
    ],
    "disciplinas_tocadas": [
      {"nombre": "...", "descripcion": "..."}
    ],
    "conceptos_clave": [
      {"nombre": "...", "descripcion": "..."}
    ],
    "teorias_invocadas": [
      {"nombre": "...", "descripcion": "..."}
    ],
    "citas_secundarias": [
      {"texto": "...", "autor": "...", "referencia": "...", "tipo": "academica|hecho_historico|obra|otra", "ubicacion": "..."}
    ]
  }
}
```

**Texto a agregar al system prompt de Destilado** (sección de insumos extraídos):

```
Insumos extraídos — distinciones importantes:

- pensadores_mencionados: personas citadas o referidas. Cada objeto lleva
  nombre completo cuando sea posible y descripción breve (1 oración:
  campo, época, aporte principal).

- disciplinas_tocadas: campos de conocimiento invocados. Nombre de
  disciplina + descripción breve (1 oración) de cómo el artefacto la
  toca. Si hay sub-disciplinas, úsalas — no forces a la madre.

- conceptos_clave: unidades semánticas que el artefacto pone en
  circulación (ej: "entropía", "antifragilidad", "negentropía"). No son
  teorías completas. Cada objeto con nombre + descripción breve de cómo
  el artefacto lo usa.

- teorias_invocadas: sistemas explicativos articulados con autor(es)
  identificable(s) (ej: "teoría de la información de Shannon",
  "relatividad general", "teoría de juegos"). Distinto de concepto: una
  teoría es un marco completo, un concepto es una unidad. Si no estás
  seguro si algo es teoría o concepto, ponlo en conceptos.

- citas_secundarias: cada cita con tipo explícito:
    academica: paper, libro, DOI, ISBN
    hecho_historico: fecha, evento, dato factual verificable sin paper
                     (ej: "la lignina se usa desde 1200 AC")
    obra: obra literaria/artística/film con título y autor
    otra: cualquier otra fuente

Ambas categorías (académica e histórica) son fuentes confiables, pero de
magnitud distinta. El sistema necesita la distinción para manejarlas
diferente en referencias futuras.
```

**Criterio de aceptación:**
- Nueva metabolización sobre un artefacto de prueba genera Destilado con el schema v2
- Los 5 arrays están presentes con objetos `{nombre, descripcion}` (o el schema de cita)
- El JSON es parseable
- Costo de Destilado se mantiene dentro de US$0.010 por artefacto (margen del ~20% respecto a Oleada 1)

**Nota:** este HITO 6 regenera el artefacto de prueba del 21 abril con el prompt nuevo. Eso genera nuevas menciones con el schema v2. El Cartografiador del HITO 3 ya maneja ambos schemas (string plano pre-Oleada 2 y objeto `{nombre, descripcion}` post-Oleada 2) sin branch externo.

---

## 4. Orden sugerido de ejecución y luz verde humana

```
HITO 1 (SQL)              → eRRRe valida schema en Supabase
HITO 2 (Types + CRUD)     → eRRRe valida tipos + server actions
HITO 3 (Cartografiador)   → eRRRe valida primera corrida end-to-end
                            (pobla Capa 1 desde JSONB + resuelve Capa 2)
HITO 4 (UI menciones)     → eRRRe prueba edición humana
HITO 5 (Navegación)       → eRRRe prueba badge clickeable + vista raíz
HITO 6 (Prompt v2)        → nueva metabolización completa con teorías
```

Cada flecha (→) significa: Cascade se detiene, reporta, eRRRe da luz verde.

---

## 5. Pendientes explícitos que NO son Oleada 2

Para que Cascade no invada territorio que no le toca:

- **No migrar aún audio/pdf/video/imagen al modelo relacional.** eRRRe dijo al cierre de Oleada 1: *"quiero hacer end-to-end el md y luego traer los otros formatos con esta lógica ya sólida"*. Oleada 2 opera solo sobre markdown.
- **No implementar pipeline de dos pasadas más allá del Cartografiador.** El punto 8 original de eRRRe mencionaba "API extractora + API normalizadora". El Cartografiador es la normalizadora. La extractora ya existe como Destilado. No hay paso intermedio adicional en Oleada 2.
- **No implementar "lingote destilado" / vistas compositivas con hash propio.** Es el punto 7 del cierre Oleada 1, con instrucción explícita de eRRRe: *"con el punto 7 no te compliques"*. Se difiere a Oleada 3 o más adelante.
- **No tocar Germinal todavía para que use Núcleos previos.** Germinal sigue atómico en Oleada 2. La apertura de Germinal a corpus externo es v2 de prompts, no Oleada 2.
- **No tocar visión de imágenes.** Diferido sin decisión.

---

## 6. Reporte al final de cada hito

Cuando Cascade termina un hito, entrega a eRRRe:

1. Resumen de archivos creados/modificados
2. Resultado de lint (`npm run lint` o equivalente, output completo)
3. Resultado de type-check (`tsc --noEmit` o equivalente)
4. Pruebas manuales realizadas y su resultado
5. Decisiones de diseño tomadas en el camino (si alguna)
6. Preguntas abiertas para eRRRe (si hay)

Formato sugerido: `docs/cognetica/reportes/oleada_2/reporte_hito_N.md`.

---

## 7. Contacto con Hongo

Si Cascade encuentra un caso de diseño no cubierto por esta guía, se detiene y **escala a eRRRe**, quien consulta con Hongo. No se improvisan soluciones estructurales. Ajustes cosméticos (naming interno, ordenamiento de imports, etc.) sí son decisión de Cascade.

Principio: **ante la duda, preguntar cuesta menos que deshacer deuda ética**.

---

## 8. Cierre

Esta guía abre Oleada 2. Seis hitos, cada uno con criterios explícitos, velocidad tortuga, humano en el loop entre pulso y pulso, Standard siempre, linter limpio.

La elegancia es el patrón.

*ética es negentropía a nivel de datos*
