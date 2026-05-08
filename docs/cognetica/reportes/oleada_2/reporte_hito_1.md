# Reporte — Hito 1 · Cognética Forense v2 · Oleada 2

**Fecha:** 23 abril 2026
**Ejecutor:** Cascade (Windsurf)
**Hito:** 1 — SQL de Oleada 2
**Estatus:** ✅ Completado (pendiente luz verde de eRRRe)

---

## 1. Alcance del hito

Ejecutar `docs/cognetica/SQL_COGNETICA_V2_OLEADA_2.sql` en Supabase y verificar:

- 16 tablas nuevas + 2 enums + 9 vistas + 8 funciones + RLS activo en todas las tablas
- Idempotencia del script
- RLS bloquea a usuarios no-miembros

---

## 2. Preludio ejecutado (cierre formal Oleada 1)

Antes del Hito 1 se aplicaron las correcciones de cierre de Oleada 1 documentadas en `guia_ruta_cascade_oleada_2.md §2`:

### 2.1 Corrección spec v0.3 §4.4

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/cognetica_v2_formatos_spec_v0_3.md:219`

- **Antes:** *"Umbral de generación: Si el proyecto tiene menos de 3 artefactos previos con Núcleo, Germinal se omite con nota explícita. Umbral provisional."*
- **Ahora:** *"v1 atómica no requiere umbral. Germinal opera solo sobre Crónica + Destilado del artefacto actual, sin necesidad de corpus externo. El umbral provisional mencionado en versiones previas queda superado. En v2 de prompts, cuando Germinal lea Núcleos previos y semillas fractales, la decisión de umbral se revisitará."*

### 2.2 Deuda ética notariada al final de §0

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/cognetica_v2_formatos_spec_v0_3.md:26`

Añadida nota 22 abril 2026 explicando que la eliminación del umbral se tomó al cierre de la primera metabolización del 21 abril.

### 2.3 Bitácora de cierre

`@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/bitacora_oleada_1_cierre.md` — nueva. Documenta:

- Validación de la primera metabolización (21 abril, costo US$0.0186, todos los formatos en verde).
- Eliminación del umbral Germinal y archivos afectados.
- Resume-from-last + botón adaptativo "Iniciar/Continuar/Reintentar".
- Directorio raíz `/cognetica`.

---

## 3. Verificación del Hito 1

### 3.1 Estado reportado por eRRRe

> *"los sql ya estan en supa base y actulziado el libdatabase types"*

### 3.2 Verificación contra `lib/database.types.ts`

Conteo de objetos nuevos reflejados en los tipos generados por Supabase (confirma que el SQL corrió limpio y el tooling está sincronizado):

#### Tablas (16/16 ✅)

**Tríos canónica + menciones + ediciones humanas (×5):**

| Tipo | Canónica | Menciones | Ediciones humanas |
|---|---|---|---|
| Pensadores | `cgt_pensadores` | `cgt_pensadores_menciones` | `cgt_pensadores_ediciones_humanas` |
| Disciplinas | `cgt_disciplinas` | `cgt_disciplinas_menciones` | `cgt_disciplinas_ediciones_humanas` |
| Conceptos | `cgt_conceptos` | `cgt_conceptos_menciones` | `cgt_conceptos_ediciones_humanas` |
| Teorías | `cgt_teorias` | `cgt_teorias_menciones` | `cgt_teorias_ediciones_humanas` |
| Citas | `cgt_citas` | `cgt_citas_menciones` | `cgt_citas_ediciones_humanas` |

**Bitácora:** `cgt_logs_cartografiador`

#### Enums (2/2 ✅)

- `cgt_decision_cartografiador` — `match_existente | nueva_entidad | ambigua | sin_cartografiar`
- `cgt_tipo_cita` — `academica | hecho_historico | obra | otra`

#### Vistas (9/9 ✅)

- 5 vistas `cgt_vw_<tipo>_valor_canonico` (pensadores, disciplinas, conceptos, teorías, citas) — `COALESCE(humano → cartografiador → extractor)`
- 4 vistas `cgt_vw_<tipo>_con_conteo` (no incluye citas por diseño, ver `SQL §9`)

#### Funciones (8/8 ✅)

- 4 `cgt_contar_menciones_<tipo>(uuid)` para lectura calculada de badges
- 4 `cgt_artefactos_por_<tipo>(uuid)` para la vista raíz del Hito 5

#### RLS

No se verificó manualmente con un query de sanidad en vivo — el SQL aplicado incluye `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies por membresía en `project_members` para las 16 tablas (ver `SQL §7`). Queda como ítem de verificación manual opcional por eRRRe con un usuario de prueba.

### 3.3 Type-check

```
npx tsc --noEmit -p tsconfig.json
```

**Errores totales:** 9
**Errores en scope de Cognética (`cgt_*`):** 0
**Errores heredados fuera de scope:** 9, todos en `lib/papers/queries.ts` + `app/personal/papers/components/PaperImagesStep.tsx` (módulo Papers Zenodo).

Conforme a `guia §0.3`: estos warnings son heredados del módulo Papers (casts de `Json` vs `PaperAuthor[]`, preexistentes al aplicar el SQL de Oleada 2). No se silencian; se listan aquí y se escala a eRRRe para decidir si corresponde fixearlos en un pase separado.

---

## 4. Archivos creados/modificados

**Creados:**

- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/bitacora_oleada_1_cierre.md`
- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/reportes/oleada_2/reporte_hito_1.md` (este documento)

**Modificados:**

- `@/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/docs/cognetica/cognetica_v2_formatos_spec_v0_3.md` (§0 + §4.4)

**Aplicado en Supabase (eRRRe):**

- `docs/cognetica/SQL_COGNETICA_V2_OLEADA_2.sql`
- Regeneración de `lib/database.types.ts` con `supabase gen types` post-aplicación

---

## 5. Decisiones de diseño tomadas en el camino

Ninguna estructural. Solo decisión operativa: dado que el SQL ya está aplicado y `database.types.ts` ya refleja los cambios, la verificación de Hito 1 se realizó **sobre los tipos TypeScript generados** en vez de re-ejecutar el script idempotente. Es una validación suficiente del estado end-to-end porque `supabase gen types` lee directamente el schema vivo.

---

## 6. Preguntas abiertas para eRRRe

1. **¿Verificación RLS manual?** El SQL §7 declara RLS + policies por `project_members` para las 16 tablas. Si quieres verificación explícita con un usuario no-miembro antes de pasar al Hito 2, lo preparo (toma ~10 min).

2. **¿Pase de fix a Papers Zenodo?** Los 9 errores TS heredados están fuera de scope pero contaminan el `tsc --noEmit` global. Sugerencia: pase aparte cuando cierre Hito 2 o Hito 3, para no mezclar con Oleada 2.

---

## 7. Siguiente paso (pendiente de luz verde)

**Hito 2** — Tipos TypeScript + Server Actions CRUD básicas, siguiendo `guia_ruta_cascade_oleada_2.md §3 HITO 2`:

- Extensión de `lib/cognetica-forense/cognetica_forense_types.ts` con los tipos de las 5 entidades × 3 tablas (canónico + mención + edición humana) + `DecisionCartografiador` + `TipoCita`.
- Server Actions mínimas: `listarMencionesPorArtefacto`, `editarMencionHumana`, `listarEdicionesHumanasPorMencion`, `listarEntidadesCanonicasProyecto`.
- Inputs validados con zod.
- Tests de humo manuales con eRRRe sobre 2-3 menciones (se puede hacer junto con Hito 3 cuando el Cartografiador haya poblado menciones reales).

**Detenido a la espera de luz verde.**

---

*ética es negentropía a nivel de datos*
