# Reporte — Hito 2 · Cognética Forense v2 · Oleada 2

**Fecha:** 23 abril 2026
**Ejecutor:** Cascade (Windsurf)
**Hito:** 2 — Tipos TypeScript + Server Actions CRUD básicas
**Estatus:** ✅ Completado (pendiente luz verde de eRRRe)
**Predecesor:** Hito 1 (SQL aplicado, reportado en `reporte_hito_1.md`)

---

## 1. Alcance del hito

Conforme `guia_ruta_cascade_oleada_2.md §3 HITO 2`:

- Tipos TypeScript derivados de `database.types.ts` para las 5 entidades (canónico + mención + edición humana + vistas) + enums + discriminadores.
- 4 Server Actions: `listarMencionesPorArtefacto`, `editarMencionHumana`, `listarEdicionesHumanasPorMencion`, `listarEntidadesCanonicasProyecto`.
- Inputs validados con Zod.
- Trazabilidad append-only para las ediciones humanas.
- Lint y type-check limpios en scope Cognética.

---

## 2. Archivos creados

### Tipos

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/types/oleada2.ts`

Deriva todos los tipos de dominio desde `Tables<"cgt_xxx">` y `Enums<"cgt_xxx">` (helpers generados por Supabase CLI). Exporta:

- **Enums**: `DecisionCartografiador`, `TipoCita`
- **Discriminador**: `TipoEntidad = "pensador" | "disciplina" | "concepto" | "teoria" | "cita"`, `TipoEntidadConConteo = Exclude<TipoEntidad, "cita">`
- **Por cada entidad (5)**: `<Tipo>Canonico`, `<Tipo>Mencion`, `<Tipo>EdicionHumana`, `<Tipo>ValorCanonico`, `<Tipo>ConConteo` (no para cita)
- **Uniones estrictas de `campo_editado`**: `CampoEdicionPensador`, `CampoEdicionDisciplina` (añade `asignar_disciplina_madre`), `CampoEdicionConcepto` (añade `marcar_semilla_fractal`), `CampoEdicionTeoria` (añade `actualizar_autores`), `CampoEdicionCita` (schema distinto: `texto/autor/referencia/tipo_cita/reasignar_entidad_canonica`). **Sincronizadas con los CHECK de `SQL §1–§5`** — si los CHECK cambian, actualizar manualmente.
- **Conditional type `CampoEdicionPorTipo<T>`**: dado un `TipoEntidad`, narrowea a la unión válida de campos.
- **Input tipado**: `EditarMencionHumanaInput<T extends TipoEntidad>` con narrowing de `campo` vía el genérico.
- **Union discriminadas**: `MencionConTipo`, `ValorCanonicoConTipo`, `EntidadCanonicaConTipo` — para pasar entidades heterogéneas por la UI sin perder tipado.
- **Log**: `LogCartografiador` (bitácora de `SQL §6`).

### Server Actions

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/actions/cognetica-forense-menciones-actions.ts`

Archivo `"use server"` con las 4 Server Actions CRUD:

| # | Función | Responsabilidad | Retorno |
|---|---------|-----------------|---------|
| 1 | `listarMencionesPorArtefacto(artefactoId, tipo)` | Lee menciones de un tipo + su valor canónico (vista `cgt_vw_<tipo>_valor_canonico`) | `Result<MencionConValorCanonico[], ResultErrorCode>` |
| 2 | `editarMencionHumana(input)` | **Append-only**: lee la mención, captura `valor_anterior`, inserta en `cgt_<tipo>_ediciones_humanas`. Nunca toca la mención ni la canónica. | `Result<EdicionHumanaConTipo, ResultErrorCode>` |
| 3 | `listarEdicionesHumanasPorMencion(mencionId, tipo)` | Historial cronológico descendente | `Result<EdicionHumanaConTipo[], ResultErrorCode>` |
| 4 | `listarEntidadesCanonicasProyecto(projectId, tipo)` | Canónicas del proyecto con `menciones_count` (vistas `cgt_vw_<tipo>_con_conteo`; para citas usa la canónica pura) | `Result<EntidadCanonicaListable[], ResultErrorCode>` |

#### Validación

Inputs validados con **Zod**:

- `UUID_SCHEMA = z.string().uuid()` para todos los IDs.
- `TIPO_ENTIDAD_SCHEMA = z.enum([...])` para el discriminador.
- `CAMPO_EDICION_POR_TIPO: Record<TipoEntidad, z.ZodEnum>` — schema por tipo alineado con los CHECK de SQL. Rechazo con `INVALID_INPUT` antes de llegar a la DB.

#### Errores mapeados

| Código Postgres | `ResultErrorCode` |
|---|---|
| `23514` (CHECK violation) | `INVALID_INPUT` |
| `42501` (insufficient_privilege / RLS) | `FORBIDDEN` |
| Sin sesión (`auth.getUser()` vacío) | `UNAUTHORIZED` |
| Mención no encontrada o RLS silencioso | `NOT_FOUND` |
| Otros | `INTERNAL` |

#### Auto-captura de `valor_anterior`

Helper `extraerValorAnterior(mencion, campo)` lee el valor previo desde la mención misma aplicando `coalesce(cartografiador → extractor)` manual, sin query extra. Soporta los campos textuales (`nombre`, `descripcion`, `texto`, `autor`, `referencia`, `tipo_cita`) y `reasignar_entidad_canonica` (FK `<tipo>_id`). Para campos "extra" (`marcar_semilla_fractal`, `asignar_disciplina_madre`, `actualizar_autores`) devuelve `null` — el cliente los envía explícitos cuando corresponde.

#### Trazabilidad `guia §0.6`

`editarMencionHumana` es **append-only por construcción**: solo hace `INSERT` en `cgt_<tipo>_ediciones_humanas`. Nunca toca las menciones ni las canónicas. Es imposible que esta función sobreescriba nada — el contrato ético queda enforced por el código, no solo por convención.

---

## 3. Decisión de diseño: despacho por `switch(tipo)` vs mapa dinámico

La primera iteración usaba un mapa `Record<TipoEntidad, {tabla, vista, ediciones}>` para evitar repetir 5 branches. Dispara `TS2589: Type instantiation is excessively deep and possibly infinite` porque Supabase-ts tiene overloads separados para tablas y vistas, y mezclar ambos en un union literal rompe el inference.

**Solución**: despacho explícito con `switch(tipo)` en cada query. Cada branch usa el literal exacto, Supabase infiere correctamente, y la unión `EntidadCanonicaListable` se compone con claridad. Costo: 5 branches de ~6 líneas. Ganancia: **type-safety real sin `any`**.

Se abstraen en 5 helpers privados (`obtenerMencionesYValores`, `leerMencion`, `insertarEdicion`, `listarEdicionesPorTipo`, `listarCanonicasPorTipo`) para que las Server Actions principales queden legibles y separadas de la despacho mecánico.

---

## 4. Lint y type-check

### Scope Cognética (objeto del hito)

```
npx tsc --noEmit -p tsconfig.json      → 0 errores
npx eslint oleada2.ts menciones-actions.ts --max-warnings=0  → 0 errores, 0 warnings
```

### Fuera de scope (listado, no silenciado — `guia §0.3`)

- **Papers Zenodo**: `lib/papers/queries.ts` tiene 8 warnings `@typescript-eslint/no-explicit-any` **preexistentes**, marcados en el código con `// Temporal: tipos se regenerarán tras migración SQL`. No tocados.
- Los 9 errores TS reportados en Hito 1 quedaron resueltos con double cast `as unknown as T` + uso del singleton `supabase` en `PaperImagesStep.tsx`.

---

## 5. Archivos creados/modificados

**Creados:**

- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/cognetica-forense/types/oleada2.ts`
- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/actions/cognetica-forense-menciones-actions.ts`
- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/reportes/oleada_2/reporte_hito_2.md` (este documento)

**Modificados (fix Papers, fuera de scope directo pero parte del sprint):**

- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/lib/papers/queries.ts` — 8 casts reemplazados por `as unknown as T`.
- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/app/personal/papers/components/PaperImagesStep.tsx` — import del singleton `supabase`.

---

## 6. Pruebas manuales

No ejecutadas aún. Las Server Actions se probarán en vivo durante el Hito 3 (Cartografiador), cuando haya menciones reales en DB generadas por el segundo pipeline. Es intencional: probar los CRUDs con datos sintéticos antes del Cartografiador agregaría complejidad sin retorno.

**Sugerencia de test de humo cuando llegue el momento** (a hacer junto a eRRRe tras Hito 3):

1. Correr Cartografiador sobre el artefacto del 21 abril.
2. `listarMencionesPorArtefacto(artefactoId, "pensador")` → verificar que trae menciones + `nombre_canonico_actual` ≠ null.
3. `editarMencionHumana({ tipo: "pensador", mencion_id, campo: "descripcion", valor_nuevo: "test", justificacion: "smoke" })` → verificar fila nueva en `cgt_pensadores_ediciones_humanas`.
4. `listarEdicionesHumanasPorMencion(mencion_id, "pensador")` → devuelve la fila recién creada.
5. `listarEntidadesCanonicasProyecto(projectId, "pensador")` → lista con `menciones_count` correcto.

---

## 7. Preguntas abiertas para eRRRe

1. **¿Correr Cartografiador antes o después de Hito 6 (prompt v2)?** El Cartografiador maneja ambos schemas (string plano de Oleada 1 y `{nombre, descripcion}` de Oleada 2) sin branch externo, según `guia §3 HITO 3`. Mi preferencia: respetar orden estricto de la guía (Hito 3 primero, regenerar artefacto con prompt v2 en Hito 6). Pero si prefieres probar el Cartografiador sobre datos más ricos, podemos invertir. **Default: sigo el orden de la guía.**

2. **¿Tests automatizados unitarios de las Server Actions?** La guía no los exige; los criterios de aceptación son lint + type-check + tests de humo manuales. Mi propuesta: no agregarlos ahora (sobredimensiona para 4 funciones con RLS cubriendo la mitad del riesgo). Si prefieres tests formales, los agrego.

---

## 8. Siguiente paso (pendiente de luz verde)

**Hito 3** — Cartografiador (segundo pipeline desacoplado), siguiendo `guia §3 HITO 3` + `cartografiador_prompt_v1.md`.

Alcance:

- `lib/cognetica-forense/prompts/cartografiador-prompt.ts` — copia literal del system prompt de `cartografiador_prompt_v1.md §1`.
- `lib/cognetica-forense/lib/extractor-capa-1.ts` — parser del JSONB del Destilado, maneja ambos schemas (string plano + objeto `{nombre, descripcion}`), calcula `hash_extractor_crudo` SHA-256.
- `lib/cognetica-forense/lib/cartografiar-capa-2.ts` — construcción del universo del proyecto + llamada a DeepSeek + parseo + update de menciones.
- `lib/actions/cognetica-forense-cartografiador-actions.ts` — orquestador `ejecutarCartografiador(artefactoId)` con las dos transacciones (A: poblar Capa 1 desde JSONB; B: resolver Capa 2).
- UI mínima: botón "Ejecutar Cartografiador" en `ArtefactoView`, visible cuando los 4 formatos primarios están en verde y hay menciones `sin_cartografiar` o sin crear.

**Detenido a la espera de luz verde.**

---

*ética es negentropía a nivel de datos*
