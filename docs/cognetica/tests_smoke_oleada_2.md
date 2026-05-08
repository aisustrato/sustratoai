# Tests de Humo — Cognética Forense v2 · Oleada 2

**Propósito:** validar la arquitectura base del Cartografiador + la capa de edición humana antes de metabolizar a volumen. Cubrir las 3 decisiones del Cartografiador (`match_existente`, `nueva_entidad`, `ambigua`) y la append-only humana.

**Método:** 4 escenarios manuales guiados, ejecutados por eRRRe + Cascade en sesión conjunta.

**Criterio de paso global:** cada escenario produce el resultado esperado **Y** los logs de `cgt_logs_cartografiador` reflejan correctamente los contadores (matches / nuevas / ambiguas / costo). Un error silencioso en logs es tan grave como uno visible en UI.

---

## Escenario A — Proyecto vacío, primer artefacto

**Precondición:** proyecto sin entidades canónicas (ninguna fila en `cgt_pensadores`, `cgt_disciplinas`, `cgt_conceptos`, `cgt_teorias`, `cgt_citas` para el `project_id`).

**Pasos:**

- [ ] Metabolización completa del primer artefacto (Crónica + Destilado + Núcleo + Germinal).
- [ ] Ejecutar Cartografiador sobre el artefacto.

**Resultado esperado:** todas las decisiones son `nueva_entidad` (universo vacío). Se crean entidades canónicas nuevas. Capa 1 (extractor) y Capa 2 (cartografiador) pobladas en las tablas de menciones.

**Qué verificar:**

- [ ] No hay matches espurios (el Cartografiador no alucina un universo que no existe).
- [ ] Entidades canónicas creadas correctamente (contadores en 1, `nombre_canonico` poblado).
- [ ] `cgt_logs_cartografiador` muestra `nuevas > 0`, `matches = 0`, `ambiguas = 0`, `costo_usd` razonable.

---

## Escenario B — Segundo artefacto con solapamientos parciales

**Precondición:** Escenario A pasó. Existen entidades canónicas del primer artefacto.

**Pasos:**

- [ ] Metabolizar un segundo artefacto que comparta al menos un pensador o concepto con el primero.
- [ ] Ejecutar Cartografiador.

**Resultado esperado:** algunos `match_existente` (para los solapamientos), algunos `nueva_entidad` (para lo nuevo).

**Qué verificar:**

- [ ] Contadores en entidades matcheadas saltan de 1 a 2.
- [ ] Badges clickeables llevan a los 2 artefactos.
- [ ] Las justificaciones del Cartografiador mencionan evidencia concreta (no genérica).
- [ ] `cgt_logs_cartografiador` muestra `matches > 0` y `nuevas > 0` coherentes.

---

## Escenario C — Tercer artefacto con ambigüedad forzada

**Precondición:** Escenarios A y B pasaron.

**Pasos:**

- [ ] Metabolizar un artefacto donde un pensador aparezca con nombre ambiguo (ej: solo apellido sin contexto, o nombre común).
- [ ] Ejecutar Cartografiador.

**Resultado esperado:** al menos una decisión `ambigua`.

**Qué verificar:**

- [ ] La mención ambigua queda en estado pendiente (`pensador_id = NULL` en `cgt_pensadores_menciones`, `decision_cartografiador = 'ambigua'`).
- [ ] El contador no suma a ninguna entidad canónica.
- [ ] La UI muestra el estado ambiguo con claridad (badge + call-to-action para desambiguar).
- [ ] `cgt_logs_cartografiador` muestra `ambiguas > 0`.

---

## Escenario D — Edición humana append-only

**Precondición:** Escenarios A, B, C pasaron. Hay menciones con valores del Cartografiador en DB.

**Pasos:**

- [ ] Editar el nombre de una mención (ej: corregir `"Turing"` a `"Alan Mathison Turing"`).

**Qué verificar (lista dura — cada punto con query directa cuando se indique):**

- [ ] La edición se registra en `cgt_pensadores_ediciones_humanas` (fila nueva, NO update).
- [ ] La vista `cgt_vw_pensadores_valor_canonico` devuelve el valor humano (no el del Cartografiador ni el del extractor).
- [ ] **Capa 1 (`nombre_extractor_crudo`) permanece intacta** — verificar con `SELECT nombre_extractor_crudo FROM cgt_pensadores_menciones WHERE id = ...` antes y después de la edición. **Este punto es crítico.**
- [ ] Segunda edición sobre la misma mención: aparecen **2 filas** en `cgt_pensadores_ediciones_humanas`, el coalesce devuelve la más reciente.
- [ ] El historial (Server Action `listarEdicionesHumanasPorMencion`) muestra ambas ediciones cronológicamente descendente.

---

## Registro de resultados

| Escenario | Fecha | Resultado | Notas |
|-----------|-------|-----------|-------|
| A | — | ⬜ | — |
| B | — | ⬜ | — |
| C | — | ⬜ | — |
| D | — | ⬜ | — |

**Leyenda:** ⬜ pendiente · ✅ pasó · ❌ falló · ⚠️ pasó con observaciones.

Ante ❌ o ⚠️, abrir bitácora en `docs/cognetica/bitacora_oleada_2_*.md` con diagnóstico y fix propuesto antes de continuar con el siguiente escenario.

---

*Cuellos de botella identificados, negentropía aplicada.*
