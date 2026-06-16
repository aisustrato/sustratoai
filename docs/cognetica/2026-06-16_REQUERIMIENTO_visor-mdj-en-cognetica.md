# Requerimiento previo — Visor MDJ en Cognética (con anotación de autores)

- **Fecha:** 2026-06-16
- **Rama de trabajo:** `feat/cognetica-forense-oleada-1`
- **Estado:** propuesta para aprobación (previo a implementar)
- **Autor del doc:** Claude (pase Opus) a pedido del operador

---

## 1. Objetivo en una frase

Llevar la experiencia del **visor MDJ** (documento estructurado con anotaciones
y tooltips) al módulo **Cognética**, de modo que **todos los elementos de
Cognética** (autores/pensadores, citas, conceptos, teorías, disciplinas,
referencias) queden **reflejados dentro del texto** como anotaciones, **sin
romper** el visor actual.

> **Nota de vocabulario:** en Cognética, **autor = pensador** (es la misma
> entidad: `cgt_pensadores`). En este documento se usan como sinónimos.

---

## 2. Principios rectores (acordados con el operador)

1. **Cognética manda.** El MDJ se **normaliza al modelo de Cognética**
   (menciones), no al revés. Donde haya conflicto de nombres o de forma, gana
   Cognética.
2. **El módulo actual sigue funcionando.** Se construye en paralelo; el visor
   actual (`ArtefactoView` → `DocumentoMarkdownViewer` → `StandardMarkdownViewer`)
   no se toca hasta que el nuevo esté validado.
3. **Reusar lo que ya existe.** Las anotaciones humanas se crean con el **mismo
   action** que ya se hizo para transcripción:
   `lib/actions/cognetica-forense-aportes-humanos-actions.ts`.

---

## 3. Alcance: a qué documentos aplica

El MDJ aplica a **documentos de texto**. NO aplica a formatos tipo "card".

| Artefacto / producto | ¿MDJ? | Motivo |
|---|---|---|
| Crónica | ✅ | texto (producto de la tríada) |
| Destilado | ✅ | texto |
| Germinal | ✅ | texto |
| Núcleo | ✅ | texto |
| Artefacto `markdown` | ✅ | texto |
| Artefacto `pdf_informe` (markdown) | ✅ | texto |
| **Transcripción de audio (cruda)** | ❌ | formato **card** con segmentos/timestamps (`StandardAudioPlayer`) |
| `pdf_slides` | ❌ | formato visual por página |

> **Clave:** aunque el origen sea un audio, sus **productos** (ej. la crónica
> generada) **sí** se ven con MDJ. Lo que queda fuera es la transcripción cruda.

---

## 4. Normalización: MDJ → modelo de Cognética

El visor MDJ tiene su tipo `Anotacion` (`frase_notable | referencia | nota`,
ancladas por `nodo_id` + offsets). Cognética ya tiene su propio sistema de
**menciones** por entidad, que es el que manda:

- `cgt_pensadores_menciones` → **autores / pensadores** (misma entidad)
- `cgt_conceptos_menciones`, `cgt_teorias_menciones`, `cgt_disciplinas_menciones`
- `cgt_citas_menciones`, `cgt_referencias` / `cgt_artefactos_referencias`

Todos estos tipos son **anotaciones a reflejar en el texto**.

Cada mención ya distingue origen con el enum **`cgt_origen` = `llm | humano |
nodo | sistema`**, así que la anotación humana vs la extraída por el pipeline ya
está contemplada en el modelo.

> **Todos** estos elementos deben quedar reflejados en el texto. La división en
> fases (§8) es solo de implementación, no de alcance: el objetivo final es que
> autores/pensadores, citas, conceptos, teorías, disciplinas y referencias se
> vean como anotaciones in-line.

**Decisión de normalización:** la `Anotacion` del MDJ pasa a ser una **vista de
una mención de Cognética**, no una entidad nueva. El visor:

- **lee** las menciones del artefacto y las pinta como resaltados;
- sobre una anotación **ya existente**, el **tooltip** muestra la ficha de la
  entidad y permite **editar o borrar**.

### Modelo de interacción (importante)

- **Crear** una anotación → **seleccionar texto** → se abre el **menú de
  selección** (el `SeleccionPopover` / `useSeleccionMDJ` que el MDJ **ya
  tiene**) → se elige la entidad y se guarda (vía action de aportes humanos, §6).
- **Editar / Borrar** → desde el **tooltip** de la anotación ya creada.

> El tooltip NO crea: solo existe cuando la anotación ya está. Crear es siempre
> por selección de texto + menú.

### La mención es del artefacto, transversal a todos sus textos

Una mención **no pertenece a un texto puntual**, pertenece al **artefacto**
(las tablas `cgt_*_menciones` ligan `artefacto_id` ↔ entidad, no una sección).
Consecuencias:

- Si la entidad está mencionada en el artefacto, se **refleja en todas las
  secciones de texto** del mismo (crónica, destilado, germinal, núcleo, cuerpo).
- **Crear** o **borrar** una anotación desde **cualquier** sección impacta la
  **base de datos** y, por lo tanto, **toda la estructura de textos** del
  artefacto a la vez.
- Ejemplo: si quito un autor desde el cuerpo de un informe, **deja de verse en
  todos los demás textos** de ese artefacto (porque se borró la mención, no un
  resaltado local).

### Panel lateral de elementos — menú por badge (reemplaza el switch)

Hoy la lista lateral de menciones usa `ModoEdicionSwitch` (toggle global
**Navegar / Editar**) + `MencionBadge`. Se propone **reemplazar el switch** por
un **menú desplegable por badge**: al pinchar un badge (ej. un autor) se abre un
menú con estas acciones:

1. **Editar** — abre el modal de edición de la entidad (lo que hoy hace el modo
   edición → `MencionEditModal`).
2. **Navegar entre artefactos** — va a la pantalla de la entidad que lista
   **todos los artefactos que comparten** ese autor/concepto/etc. (ya existe:
   `app/cognetica/entidades/<tipo>/[id]/page.tsx`).
3. **Buscar en el texto** — **navega a la primera sección de texto** que la
   contiene y la **resalta como búsqueda**, reusando el buscador del MDJ (el
   mismo `BusquedaMarca` + scroll-to que ya funciona).
4. **Eliminar** — borra la mención (y por §"transversal", desaparece de todos
   los textos del artefacto).

> Implementación sugerida: `StandardDropdownMenu` (ya importado en
> `ArtefactoView`). El switch global desaparece; cada badge es autónomo.

---

## 5. Anclaje al texto — ya resuelto por el MDJ

**El MDJ ya resolvió esto.** Al transformar el documento, lo divide en nodos con
una **dirección determinista** (`nodo_id`): mismo documento → mismas direcciones,
**siempre** (ver `lib/mdj/id-generator.ts`: *"mismo MD → misma estructura →
mismos IDs"*). Cada parte del texto tiene, entonces, una **dirección estable**.

Por lo tanto, anclar una mención es directo: la mención **guarda su dirección
MDJ** (`nodo_id`, con offsets si se quiere precisión sub-nodo). No hay que
inventar un mecanismo nuevo ni resolver un problema difícil:

- **Crear** (selección humana) → se calcula el `nodo_id` del fragmento
  seleccionado y se guarda en la mención.
- **Pintar** → el visor ubica cada mención por su `nodo_id` (dirección) y la
  resalta. Determinista, sin adivinar.

En Cognética esa dirección viaja en el campo que ya existe,
`ubicacion_en_artefacto` (hoy para audio guarda `"ts:<inicio>"`; para texto
guardaría la dirección MDJ). Cognética sigue siendo la fuente de verdad: la
posición vive en la mención.

**Decisión (confirmada):** resaltado in-line **permanente**. Los textos de
Cognética son **notas de investigación**; sin las menciones siempre resaltadas
pierden el sentido — esa es la razón de ser del MDJ.

---

## 6. Reuso del action de aportes humanos

`cognetica-forense-aportes-humanos-actions.ts` ya está pensado para esto. Su
cabecera lo dice: *"A futuro: otras entidades manuales (pensadores, conceptos,
etc.) reusarán este mismo módulo y su lógica de hash"*.

Patrón existente (`crearCitaDesdeSegmento`):
- inserta en la tabla de menciones con `origen = 'humano'`;
- **idempotente** por hash SHA-256 determinístico;
- autorización por **RLS** (mapea errores a `FORBIDDEN`/`NOT_FOUND`/…);
- append-only (la edición vive en su propio mundo).

**Extensión propuesta (misma filosofía, mismo archivo):**
- `crearMencionDesdeTexto(...)` (o `crearCitaDesdeTexto`) que reciba
  `artefactoId`, la **entidad** (ej. `pensadorId` para autor) y el **ancla de
  texto** (§5), e inserte en la tabla de menciones que corresponda con
  `origen = 'humano'` y su hash.
- Reusar `eliminarCitaMencion` como modelo para el toggle "quitar".

> No se crea un mecanismo nuevo de hash/permisos: se reusa el que ya existe.

---

## 7. Coexistencia (no romper lo actual)

Estrategia propuesta (la menos invasiva):

- Construir el visor MDJ-Cognética como **componente nuevo** (ej.
  `components/cognetica/VisorMdjArtefacto.tsx`), montado detrás de un
  **switch/flag** dentro de `ArtefactoView`.
- El `StandardMarkdownViewer` actual sigue siendo el **default**.
- Cero cambios destructivos en `ArtefactoView` (solo el punto de montaje del
  nuevo visor bajo el flag).
- Migración SQL (si hace falta para el ancla de texto): **aditiva y NO
  destructiva**, idempotente, a mano en Studio (regla del proyecto: nunca
  `db push`, nunca tocar producción sin confirmación).

---

## 8. Fases sugeridas

| Fase | Entrega | Riesgo |
|---|---|---|
| 0 | Este requerimiento aprobado | — |
| 1 | Visor MDJ rendea crónica/destilado/germinal/núcleo en Cognética, **solo lectura**, detrás de flag | bajo |
| 2 | Persistir la **dirección MDJ** (`nodo_id`) de la mención en `ubicacion_en_artefacto` — el mecanismo de direcciones ya existe en el MDJ | bajo |
| 3 | Resaltado **permanente** de menciones de **autores/pensadores** con tooltip (lee de DB) | medio |
| 4 | **Menú por badge** en la lista lateral (editar / navegar entre artefactos / buscar en texto / eliminar), reemplazando el switch | medio |
| 5 | **Crear/borrar** anotación por selección de texto (reuso del action de aportes humanos); el borrado impacta todos los textos del artefacto | medio |
| 6 | Extender resaltado a conceptos/teorías/disciplinas/citas/referencias | medio |
| 7 | Evaluar si el MDJ reemplaza al visor actual (quitar flag) | a decidir |

---

## 9. Decisiones cerradas

No quedan preguntas abiertas. Resumen de lo acordado:

- **autor = pensador** (misma entidad); **todos** los tipos de mención se
  reflejan en el texto; la mención es **transversal al artefacto** (crear/borrar
  impacta DB + todos sus textos).
- **Resaltado in-line PERMANENTE** (opción B): todas las menciones siempre
  visibles con tooltip. El **anclaje ya está resuelto por el MDJ** (direcciones
  `nodo_id` deterministas, §5); la mención guarda su dirección.
- **Interacción:** crear = seleccionar texto + menú (`SeleccionPopover`);
  editar/borrar = tooltip de la anotación; lista lateral = **menú por badge**
  (editar / navegar entre artefactos / buscar en texto / eliminar).
- **Coexistencia:** visor MDJ nuevo detrás de flag; el actual sigue de default.

---

## 10. Persistencia y normalización (Fase 3+)

Notas del operador para una fase posterior (no se implementa ahora):

- **Detección de formato:** el sistema debe distinguir si un artefacto está
  guardado en el **formato viejo** o ya en **MDJ**.
- **Normalizar a MDJ en la base:** para los viejos, una fase de normalización que
  **persista el árbol MDJ** (o su representación) en la base de datos, en vez de
  re-parsear el markdown en cada lectura. Esto hace el sistema **más eficiente**.
- **Tabla de direcciones entidad↔dirección:** una tabla nueva que guarde, por
  documento, las **direcciones** donde aparece cada entidad. Una misma entidad
  (ej. un autor) puede estar en **varias direcciones** dentro de un documento
  (original: `x, y, z`) y en otras del mismo artefacto (crónica: `x`).
- **Estabilidad de las direcciones:** los textos son **solo lectura** — el
  contenido no cambia. A lo sumo se corrige el **nombre** de una entidad (ej. un
  autor mal escrito), pero la **arquitectura de direcciones permanece**.

> Pendiente de diseño detallado cuando lleguemos a la fase; aquí solo se deja
> registrada la intención.

---

## 11. Fuera de alcance (por ahora)

- Tocar la transcripción de audio cruda (formato card).
- Aplicar MDJ a `pdf_slides`.
- Limpiar la deuda de `cognetica-old-*` y `.bak` en `lib/actions/` (tarea aparte).
- Resolver los errores preexistentes de build (`app/sitemap.ts`,
  `app/showroom/standard-stepper/*`).

---

## Apéndice — referencias de código

- Visor actual: `app/cognetica/[id]/ArtefactoView.tsx` (2.014 líneas — deuda),
  `app/cognetica/[id]/DocumentoMarkdownViewer.tsx`.
- Visor MDJ: `components/mdj-viewer/*`, `lib/mdj/*`,
  `components/ui/StandardMDNoteViewer.tsx`.
- Action a reusar: `lib/actions/cognetica-forense-aportes-humanos-actions.ts`.
- Modelo de menciones: tablas `cgt_*_menciones` + `cgt_*_ediciones_humanas`,
  enum `cgt_origen`.
- Tipo de payload de lectura: `ArtefactoCompleto` en
  `lib/cognetica-forense/lecturas-shared.ts`.
