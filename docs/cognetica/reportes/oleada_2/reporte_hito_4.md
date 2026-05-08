# Reporte — Hito 4 · Cognética Forense v2 · Oleada 2

**Fecha:** 23 abril 2026
**Ejecutor:** Cascade (Windsurf)
**Hito:** 4 — UI de menciones cartografiadas + edición humana (Capa 3)
**Estatus:** ✅ Completado

---

## 1. Contexto de arranque

eRRRe reportó en la sesión previa:

> Todo funcionando maravilloso hasta aquí — borrado, preprocesado y cartografiado en verde. Vamos por la UI tanto en el detalle del documento como en el raíz: que los elementos buscables estén como badges en la tarjeta y tenga una botonera para mostrar o no estas dimensiones; por ejemplo, puedo decir "ocultar" para vista más minimalista.

Dos decisiones pedidas y respondidas:

1. **Edición humana inline** — SÍ: click en badge abre modal de edición con las Server Actions `editarMencionHumana` del Hito 2.
2. **Raíz, modo híbrido** — default *counter* compacto (pills con emoji + cuenta); al togglear se expanden a nombres canónicos.

Estas decisiones definen todo el scope del Hito.

---

## 2. Artefactos creados

### 2.1 Backend — un nuevo Server Action

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/actions/cognetica-forense-menciones-resumen-actions.ts`

`listarResumenMencionesPorProyecto(projectId)` — lee las 5 vistas `cgt_vw_<tipo>_valor_canonico` filtradas por `project_id` en paralelo y agrupa en memoria por `artefacto_id`. Retorna `Record<artefactoId, ResumenMencionesArtefacto>` donde cada resumen trae por dimensión:

- `count` — cantidad de menciones (no dedup; refleja frecuencia real).
- `topNombres` — primeros **5** nombres canónicos únicos ordenados alfabéticamente (es-ES). Citas usan `texto_canonico_actual` truncado a 80 chars.

Los actions del Hito 2 (`listarMencionesPorArtefacto`, `editarMencionHumana`) se reutilizan tal cual — no hubo necesidad de tocarlos.

### 2.2 Helpers de UI compartidos

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/ui/menciones-ui-helpers.ts`

- `DIMENSIONES`: orden canónico de las 5 dimensiones con `icon`, `emoji`, `colorScheme`, `labelPlural`, `labelSingular`. Garantiza presentación consistente entre tarjeta raíz y detalle.
- `colorDesdeDecision(decision)` → `success | primary | warning | neutral`. Mapea el enum del Cartografiador a colorScheme de Standard. Usado por `MencionBadge` y por el modal.
- `etiquetaDecision(decision)` → string legible.
- `CAMPOS_EDICION_BASICOS[tipo]`: descriptor de campos editables (nombre/descripción para 4 entidades; texto/autor/referencia/tipo_cita para citas). Ignora operaciones especializadas del Hito 2 (`reasignar_entidad_canonica`, `marcar_semilla_fractal`, `asignar_disciplina_madre`, `actualizar_autores`) — requieren UI dedicada que se deja para hito posterior.

### 2.3 Componentes del detalle (`/cognetica/[id]`)

**`MencionBadge`** — átomo clickeable. Muestra el valor canónico actual (desde la vista) con color según decisión + tooltip nativo con decisión y confianza. Opcionalmente muestra confianza inline como sufijo discreto.

**`MencionEditModal`** — modal de edición (Capa 3).
- Despacha controles según tipo: `text`, `multiline`, `select` (para `tipo_cita`).
- Pre-puebla con el valor canónico actual (coalesce humano → cartografiador → extractor que ya resolvió la vista).
- Detecta **campos modificados** por diff contra original; el botón Guardar muestra cuántos son.
- **Justificación obligatoria** (≥5 chars). Indica a la Server Action la razón de la edición; se archiva en `cgt_<tipo>_ediciones_humanas`.
- Emite **una llamada por campo modificado** (`editarMencionHumana` es single-field). Si una falla, aborta y muestra error — las previas ya están append-only, es aceptable.
- Al terminar: `onSaved` dispara refetch del padre.

**`MencionesSection`** — sección bajo el Stepper del `ArtefactoView`.
- Paralelamente pide las 5 dimensiones via `listarMencionesPorArtefacto(artefactoId, tipo)`.
- Muestra header con total y por cada dimensión **con menciones** un bloque colapsable (chevron + icono + label + badge con cuenta).
- Todas expandidas por default; el usuario colapsa las que no le interesen (estado efímero local — no persiste, es dentro del artefacto).
- Click en badge → abre `MencionEditModal`.
- Post-save → recarga las 5 dimensiones (barato).

### 2.4 Componentes de la raíz (`/cognetica`)

**`useDimensionesVisibles` hook** — estado global UI persistido en `localStorage` (`cognetica.raiz.dimensiones.v1`):
- `visibles: Set<DimensionKey>` — qué dimensiones se muestran en las tarjetas.
- `modo: "counter" | "expandido"` — cómo se muestran.
- Pub-sub in-memory para sincronizar múltiples instancias del hook (por si la app monta dos).
- Validación defensiva al leer del storage (descarta claves desconocidas).
- Default conservador: todas visibles, modo compacto.

**`DimensionesToolbar`** — botonera global sobre el grid de tarjetas.
- 5 `StandardButton` con `colorScheme` de dimensión (activo = solid, inactivo = outline).
- Atajos "Todas" / "Ninguna" para reset rápido.
- Botón "Expandir nombres / Compactar" alterna `modo`.

**`MencionesResumenInline`** — render interno de la tarjeta, decide counter vs expandido.
- *counter*: fila de pills `emoji count` por dimensión visible con datos.
- *expandido*: bloque por dimensión con pill de cuenta + lista de badges outline con los top 5 nombres + `+N` si hay más.
- Si ninguna dimensión visible tiene datos para el artefacto, no renderiza nada.

**`ArtefactoCard`** extendida — mantiene toda la funcionalidad previa, añade `MencionesResumenInline` en el `Content`.

---

## 3. Archivos

**Creados (6):**

- `lib/actions/cognetica-forense-menciones-resumen-actions.ts`
- `lib/cognetica-forense/ui/menciones-ui-helpers.ts`
- `app/cognetica/[id]/MencionBadge.tsx`
- `app/cognetica/[id]/MencionEditModal.tsx`
- `app/cognetica/[id]/MencionesSection.tsx`
- `app/cognetica/useDimensionesVisibles.ts`

**Modificados (2):**

- `app/cognetica/[id]/ArtefactoView.tsx` — import + render de `MencionesSection`.
- `app/cognetica/page.tsx` — import + carga paralela de resumen + `DimensionesToolbar` + `ArtefactoCard` extendida + `MencionesResumenInline`.

**Reutilizados sin tocar:**

- `listarMencionesPorArtefacto` del Hito 2 (5 fetches paralelos desde `MencionesSection`).
- `editarMencionHumana` del Hito 2 (una llamada por campo modificado desde el modal).

---

## 4. Mapeo UX → arquitectura

| Gesto del usuario                   | Componente           | Server Action                               | Tabla afectada                   |
| ----------------------------------- | -------------------- | ------------------------------------------- | -------------------------------- |
| Abrir artefacto                     | `MencionesSection`   | `listarMencionesPorArtefacto` × 5           | (read) vistas `cgt_vw_*_valor_canonico` |
| Click en un badge                   | `MencionBadge`       | —                                           | —                                |
| Guardar edición en modal            | `MencionEditModal`   | `editarMencionHumana` × N campos            | `cgt_<tipo>_ediciones_humanas` (append-only) |
| Abrir directorio raíz               | `CogneticaForenseHome` | `listarArtefactosConNucleo` + `listarResumenMencionesPorProyecto` | (read) vistas de valor canónico |
| Togglear dimensión en botonera      | `DimensionesToolbar` | — (solo `localStorage`)                     | —                                |
| Alternar counter / expandido        | `DimensionesToolbar` | — (solo `localStorage`)                     | —                                |

**Append-only garantizado:** ninguna acción de UI modifica las menciones raw (Capa 1) ni las ediciones del Cartografiador (Capa 2). Toda edición humana se archiva.

**Valor canónico:** la UI nunca reconstruye el coalesce — siempre consume `<campo>_canonico_actual` de la vista, que ya lo resuelve (`humano_ultimo → cartografiador → extractor`).

---

## 5. Quality gates

```
npx tsc --noEmit -p tsconfig.json                              → 0 errores
npx eslint app/cognetica/ lib/cognetica-forense/ui/ ...        → 0 errores, 0 warnings
```

Scope lintado: los 6 archivos nuevos + los 2 modificados + toda la ruta `app/cognetica/` para detectar regresiones colaterales.

---

## 6. Limitaciones conocidas (diferidas a hito posterior)

1. **Reasignación a otra entidad canónica** (`campo: reasignar_entidad_canonica` del Hito 2) no tiene UI. Requiere un combobox con autocomplete sobre `listarEntidadesCanonicasProyecto` — más complejo, mejor en su propio hito.

2. **Operaciones especializadas** del Hito 2 no tienen UI:
   - `marcar_semilla_fractal` (conceptos).
   - `asignar_disciplina_madre` (jerarquía de disciplinas).
   - `actualizar_autores` (teorías, autores_principales JSONB).

3. **Historial de ediciones humanas** (`listarEdicionesHumanasPorMencion` del Hito 2) no se muestra todavía. El modal solo ve el estado actual; no hay timeline de correcciones previas. Natural de añadir en el mismo modal como tab o accordion.

4. **Navegación por entidad canónica** (click en badge → página de la entidad con todos los artefactos que la mencionan) es el **Hito 5** original. Aquí solo cableamos click a edición.

---

## 7. Flujo de verificación manual

1. Entrar a `/cognetica` con un proyecto cartografiado.
2. Verificar que la botonera aparece arriba del grid; todas las dimensiones en solid.
3. Togglear "Expandir nombres" — las tarjetas deben mostrar los top 5 nombres por dimensión.
4. Click en un artefacto → `MencionesSection` bajo el Stepper debe cargar.
5. Click en un badge cartografiado → modal de edición con el valor canónico actual pre-poblado.
6. Modificar el nombre + poner justificación ≥5 chars → "Guardar (1)".
7. Tras el guardado, el modal se cierra y el badge muestra el nuevo valor (ya que `decision_cartografiador` aparece igual pero el `nombre_canonico_actual` de la vista cambió).
8. Colapsar una dimensión desde su chevron → los badges desaparecen; el contador de ese grupo no cambia.
9. Volver a `/cognetica` — la preferencia de toggles/modo se recuerda (localStorage).

---

## 8. Siguiente

El ciclo completo de Oleada 2 está ahora funcional:

1. Metabolizar (Oleada 1).
2. Cartografiar (Hito 3).
3. Revisar y corregir (Hito 4 ← este).

Propuestas para siguiente hito, en orden de valor estimado:

- **Hito 5 (navegación por entidad):** click en badge → vista de entidad con todos los artefactos + todas las menciones + aliases editables. Habilita el "recorrido conceptual" del proyecto.
- **Hito 4.5 (reasignación + historial):** completar la UI del Hito 4 con las operaciones especializadas y el historial de ediciones.
- **Hito 6 (prompt v2 Destilado):** añadir `teorias` + forzar schema de objetos en pensadores/disciplinas/conceptos para que el extractor devuelva descripciones.

**Detenido acá para tu criterio.**

---

*ética es negentropía a nivel de datos*
