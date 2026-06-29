# Spec técnica — MDJ por direcciones (de monolito a repositorio dinámico)

> Especificación técnica de la arquitectura MDJ de Cognética.
> Ciclo 19 · 2026-06-29 · borrador vivo
> Acompaña a la visión: `2026-06-18_vision-cognetica-mdj-soberania.md` (el "para qué").

Este documento es el "cómo". Define el modelo de datos y los flujos para que el
MDJ deje de ser un **monolito que es fuente de verdad** y pase a ser un
**repositorio dinámico**: una capa de estructura inmutable + una capa de
anotaciones direccionadas (curables fila a fila) + un monolito **derivado** para
el pintado en frío y la portabilidad.

---

## 1. El modelo en dos capas (recordatorio)

El MDJ son **dos conceptos que viven juntos y se potencian**:

- **Capa 1 — Pintado EN FRÍO.** El MDJ se resalta SOLO, sin DB. Es un documento
  autosuficiente (así se demostró en el showroom). Guarda la *posición* del
  resaltado (`nodo_id` + offsets + `entidad_id`). No necesita las entidades para
  pintarse.
- **Capa 2 — Interacción VIVA.** El tooltip y los menús de selección conversan
  con la DB de entidades **en vivo** (nombre/descripción actuales). Las
  **direcciones** son el índice entidad↔documento: una entidad sabe exactamente
  en qué dirección de qué documento está.

La Capa 1 pinta sin esperar a nadie; la Capa 2 habilita navegar *después*.

---

## 2. El problema actual: el monolito como fuente de verdad

Hoy el MDJ horneado **es** la fuente de verdad: se serializa a JSON y **pisa el
MD** en su lugar (`cgt_cronicas.contenido`, `cgt_germinales.resumen`, Storage
`storage_path_md`). Eso tiene dos costos que matan el dinamismo:

1. **Cada edición es O(documento entero).** Para tocar una anotación (p.ej. un
   autor en una sola sección de un PDF de 50 páginas) hay que parsear el JSON
   completo, mutarlo, re-serializarlo y re-escribir todo el blob (MB a Storage por
   un cambio mínimo).
2. **Concurrencia = last-write-wins.** Dos cambios sobre el mismo blob → uno pisa
   al otro. No hay granularidad por ocurrencia.

Para un repositorio de información curada que aspira a ser dinámico, no escala.

---

## 3. Insight clave: lo dinámico son las anotaciones, no la estructura

Los documentos de Cognética **no cambian de estructura** (no se agregan/quitan
párrafos; a lo sumo se corrige un typo). Lo que se cura es la **capa de
anotaciones** (qué entidades, qué links, qué direcciones). Entonces **no hace
falta descomponer todo el grafo de nodos**: alcanza con

> **Fuente de verdad = estructura (MD/nodos, estable) + filas de anotaciones**
> (`cgt_menciones_direcciones`), y el **monolito MDJ pasa a ser un DERIVADO**.

Con eso, **editar una anotación = O(1 fila)** y "reconstruir MDJ" =
`merge(estructura, filas)` on-demand. La cirugía es sobre las anotaciones, no
sobre los nodos.

---

## 4. Arquitectura propuesta

### 4.1 Fuentes de verdad

| Pieza | Qué es | Mutabilidad |
|---|---|---|
| **Estructura** | El MD del documento (o sus nodos parseados). `nodo_id` deterministas. | Inmutable salvo typos (ver §6). |
| **Anotaciones** | Filas en `cgt_menciones_direcciones`: una por OCURRENCIA (entidad/cita en un nodo+offset). | Curable fila a fila. |
| **Entidades** | Tablas `cgt_<tipo>_*` (nombre, descripción canónica, etc.). | Editable; las lee la Capa 2 en vivo. |

### 4.2 Derivado

- **Monolito MDJ** = `merge(estructura, anotaciones)`. Se **genera on-demand**
  para: (a) export/portabilidad (la demo "fría" del showroom), (b) opcionalmente
  como cache de pintado. **No es el master.**

### 4.3 Dos consumos, dos caminos

- **In-app (Capa 2, viva):** el visor pinta desde `estructura + filas` → siempre
  al día; tooltips/fichas leen entidades en vivo. No requiere reconstruir nada.
- **Export (Capa 1, fría):** se reconstruye el monolito autosuficiente al
  compartir/descargar. Es una *propiedad del artefacto exportado*, no la fuente.

Así el monolito sale del camino crítico de la edición.

---

## 5. Modelo de datos: `cgt_menciones_direcciones`

La tabla ya existe (migración `20260618_cgt_menciones_direcciones.sql`) pero **hoy
no se escribe ni se lee**. Pasa a ser el índice/"grafo" de direcciones:

```
cgt_menciones_direcciones
  id            uuid pk
  project_id    uuid
  artefacto_id  uuid
  tipo_mencion  text  (pensador|concepto|teoria|disciplina|cita)
  mencion_id    uuid  (fila en cgt_<tipo>_menciones — polimórfico)
  documento     text  (cronica|destilado|nucleo|germinal|original)
  nodo_id       text  (dirección estructural estable)
  offset_inicio int
  offset_fin    int
  origen        text  (llm|humano)
```

- **Una fila por ocurrencia** (una entidad puede aparecer N veces por documento).
- El resolver ya calcula estas posiciones (`UbicacionMencion` en
  `direcciones/matcher.ts`); falta **persistirlas** (delete+insert por artefacto).

---

## 6. El pitfall técnico: offset drift

El `nodo_id` es **estructural** → estable ante typos. Pero corregir un typo
**corre los offsets** de las anotaciones de ese nodo (todo lo que viene después en
el párrafo se desplaza). Si guardamos offsets crudos, quedan desalineados.

**Mitigación:** al editar el texto de un nodo, **re-resolver (re-match) solo las
anotaciones de ese nodo** (acotado, no el documento), y/o anclar también por
**fragmento** además del offset. La estructura (nodo_id) no cambia, así que el
re-match es local.

---

## 7. Flujos

- **Pintar in-app:** `parse(estructura)` + overlay de filas → render. Tooltips por
  `entidad_id` → fetch vivo de la entidad.
- **Editar entidad (descripción/nombre):** update en tabla de entidad. El tooltip
  refleja al instante (lee en vivo). **No re-hornea.**
- **Crear anotación (selección de texto):** inserta entidad/mención + su **fila de
  dirección** (nodo_id+offsets de la selección).
- **Borrar anotación:** delete de la fila de dirección (+ mención si corresponde).
  El pintado in-app deja de mostrarla en el acto.
- **Exportar / compartir:** reconstruir el monolito `merge(estructura, filas)`.
- **Compartir con IA (futuro):** "la entidad X está en estas direcciones de estos
  documentos" → compartir solo esos párrafos, no el documento entero.

---

## 8. Coexistencia con el editor (no romper)

El editor MDJ vive **solo en el showroom** y es para **otros módulos** (no para
cognética; los docs de cognética son fuente de verdad inalterable en su texto).
Pero **comparte** los componentes `components/mdj-viewer/`:

- `StandardMDJViewerClient` expone callbacks de edición
  (`onAgregarFraseNotable`/`Referencia`/`Nota`, `onSeleccion`) y un **cliente
  abstracto** (`ClienteFalso` en el showroom).
- Cognética lo usa **read-only** (sin esos callbacks).

**Regla:** los cambios para la Capa 2 de cognética (tooltips vivos, navegación por
dirección) deben entrar por **props/adaptadores nuevos**, sin alterar el seam de
edición ni el contrato del cliente abstracto. Si algo compartido necesita cambiar,
se separa primero para que el editor del showroom siga funcionando.

---

## 9. Plan por bricks (incremental, no big-bang)

1. **Brick #1 — Persistir direcciones (additivo, bajo riesgo).** El resolver
   escribe las `UbicacionMencion` en `cgt_menciones_direcciones` al hornear
   (delete+insert por artefacto). No cambia el monolito todavía; solo puebla el
   índice. Da señal concreta.
2. **Brick #2 — Navegar + tooltips vivos.** "Buscar en texto" salta a la dirección
   (`scrollIntoView` al `data-nodo-id`). `EntidadTooltip` lee la entidad en vivo
   por `entidad_id` (no el `nota_texto` congelado). Re-hornear tras editar/borrar
   con **error visible** (no silencioso) mientras el monolito siga siendo master.
3. **Brick #3 — El flip.** Invertir la fuente de verdad: estructura + filas como
   master; monolito como derivado/export. Edición fila a fila; reconstrucción
   on-demand; manejo de offset drift (§6).

---

## 10. Decisiones abiertas

- ¿La estructura se guarda como **MD** (re-parsear al reconstruir) o como **nodos
  parseados** cacheados? (MD es más simple; nodos evitan re-parsear PDFs grandes.)
- ¿El visor in-app pinta desde `estructura+filas` siempre, o mantiene un **cache
  monolito** que se invalida al cambiar filas? (Trade-off simplicidad vs. costo de
  merge en cada render.)
- Granularidad de reconstrucción: ¿documento completo o por nodo afectado?
- RLS de `cgt_menciones_direcciones`: hoy transicional (`authenticated`/`true`);
  ¿espejar membresía por proyecto?

---

*Borrador vivo. Se corrige append-only, como todo acá.*
