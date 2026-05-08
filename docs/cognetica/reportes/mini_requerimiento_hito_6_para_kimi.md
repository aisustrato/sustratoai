# Mini-Requerimiento Hito 6 — Prompts v2 + Referencias Bibliográficas

**Versión:** 1.0
**Fecha:** 25 abril 2026
**Destinatario:** Cascade (Windsurf) — implementando con Kimi 2.5
**Autor humano:** eRRRe
**Autor máquina:** Hongo / Calibrador
**Predecesor:** Hito 5 completado (incluyendo addendum de dos mejoras: contador en badge + borrar artefacto)

---

## 0. Para Cascade/Kimi — lee esto primero

Mismas reglas que el mini-requerimiento Hito 5:

- **Componentes Standard siempre.** Extender Standard si falta variante; no escribir Tailwind ad-hoc en componente consumidor.
- **Linter limpio al entregar.** Cero warnings nuevos.
- **Humano en el loop pulso a pulso.** eRRRe prueba en tiempo real entre cada avance.
- **Append-only como ley.** Las re-extracciones generan filas nuevas, no sobreescriben.
- **Ante duda estructural: preguntar.** Decisiones de schema, lógica de negocio, contratos de Server Actions NO se improvisan.

**Lo nuevo en este hito:** se reemplazan dos prompts (Destilado y Germinal) y se agrega un sistema de referencias bibliográficas que vive a nivel proyecto (no artefacto). Es scope grande pero modular: cada sub-paso es independiente.

---

## 1. Objetivo del hito

Cerrar cuatro deudas vivas de Oleadas anteriores en una sola pasada:

1. **Bug de descripciones vacías en entidades canónicas.** Pensadores/disciplinas/conceptos no tienen descripción porque el Destilado v1 no la pedía. Resuelve: Destilado v2.

2. **Quinta dimensión `teorias_invocadas` no se extrae.** El SQL la tiene desde Oleada 2 v1.1, pero el prompt v1 nunca la pidió. Resuelve: Destilado v2.

3. **Citas textuales tacañas (siempre ~3) y referencias bibliográficas perdidas.** Las referencias con DOI/URL son oro puro y v1 no las extraía estructuradamente. Resuelve: Destilado v2 + nuevas tablas.

4. **Germinal plano, sin altura calibrada.** Todas las proyecciones del Germinal pesan igual porque v1 no tiene lente interpretativa. Resuelve: Germinal v1.1 con lente TDC.

**Bonus alineado con re-procesamiento:** todos los artefactos existentes deben re-procesarse con los prompts nuevos. La UI de borrar artefacto del Hito 5 se usa para pruebas.

---

## 2. Documentos de referencia (entregados junto a este)

Cascade/Kimi tiene **cuatro documentos** como input para este hito:

1. `SQL_COGNETICA_V2_OLEADA_2_v1_2.sql` — addendum SQL: tablas de referencias
2. `destilado_prompt_v2.md` — prompt completo del nuevo Destilado
3. `germinal_prompt_v1_1.md` — prompt completo del nuevo Germinal (entregado en sesión anterior, ya en repositorio)
4. Este mini-requerimiento

Los prompts NO se reescriben aquí — Cascade los pega literal desde los archivos `*.md` correspondientes en los archivos `lib/cognetica-forense/prompts/destilado-prompt.ts` y `germinal-prompt.ts`.

---

## 3. Alcance exacto

### 3.1 Qué SÍ entra

- SQL v1.2: ejecutar en Supabase
- Tipos TypeScript para `Referencia` y `ArtefactoReferencia` (derivados de `database.types.ts`)
- Prompt Destilado v2: reemplazar literal en `destilado-prompt.ts` + adaptar el parser de respuesta + persistencia del esqueleto + persistencia de insumos enriquecidos + nueva persistencia de referencias
- Prompt Germinal v1.1: reemplazar literal en `germinal-prompt.ts`. NO requiere cambios en parser (Germinal sigue devolviendo prosa markdown).
- Server Action `borrarTodosLosArtefactosDeProyecto(projectId)` para limpiar antes de re-procesar (acción destructiva con doble confirmación)
- UI mínima de visualización de referencias en la vista detalle del artefacto

### 3.2 Qué NO entra

- **Renderizado interactivo del MD con popovers de citas.** Es Hito 7 futuro, agendado.
- **Vista raíz de referencia** (`/cognetica/entidades/referencias/[id]`). Se considera para Hito 6.5 o se mete acá según tiempo. Si no entra, queda agendado.
- **Cartografiado activo de referencias.** El Cartografiador NO procesa referencias en este hito. Las referencias se coalescen automáticamente por DOI/ISBN/URL en código al momento del INSERT — no requiere LLM.
- **Fetch de URLs para enriquecer metadata.** Si una referencia tiene solo URL, se queda con título null. Mejora futura.
- **Modificación del Cartografiador.** El Cartografiador sigue como está. Las descripciones enriquecidas que ahora produce el Destilado v2 fluyen automáticamente al Cartografiador como input.

---

## 4. Sub-pasos con checkpoint humano

**Velocidad tortuga reforzada:** 7 sub-pasos. Cascade se detiene y reporta al final de cada uno. eRRRe da luz verde antes del siguiente.

### Sub-paso 6.1 — SQL v1.2 + tipos TypeScript

**Tareas:**
- Ejecutar `SQL_COGNETICA_V2_OLEADA_2_v1_2.sql` en Supabase
- Regenerar `database.types.ts` con Supabase CLI
- Crear tipos `Referencia`, `ReferenciaConConteo`, `ArtefactoReferencia`, `TipoReferencia` en `lib/cognetica-forense/types/oleada2.ts` (o archivo nuevo si crece mucho)
- Tipo de la respuesta del Destilado v2: `DestiladoV2Response` con todos los nuevos campos del schema JSON

**Checkpoint eRRRe:** validar que las 2 tablas + funciones helper + RLS están en producción y los tipos compilan.

### Sub-paso 6.2 — Prompt Destilado v2 + parser

**Tareas:**
- Reemplazar el contenido literal de `lib/cognetica-forense/prompts/destilado-prompt.ts` con el system prompt de `destilado_prompt_v2.md §2`. NO modificar el system prompt: pegar literal.
- Adaptar el parser de la respuesta del LLM en `lib/cognetica-forense/lib/destilado.ts` (o el archivo equivalente):
  - Schema de validación (Zod) actualizado para el nuevo JSON
  - Manejo de estructura_documento (guardar en `cgt_destilados.estructura_documento` como nuevo campo JSONB — verificar si la tabla ya tiene espacio o requiere ALTER pequeño)
  - Esqueleto argumental: persistir tesis_central, movimientos_argumentales, tension_irreductible, ambito_disciplinar_dominante en sus campos correspondientes (los que ya existen siguen igual; lo nuevo se agrega)
- NO modificar `persistirMencionesExtractor` todavía — eso es 6.3

**Decisión a confirmar antes de codear:** si `cgt_destilados` no tiene columna `estructura_documento`, ¿se agrega ahí o se guarda en otra tabla? Mi voto: agregar columna JSONB a `cgt_destilados` con `ALTER TABLE` simple. Cascade verifica y reporta.

**Checkpoint eRRRe:** generar Destilado de un artefacto de prueba y verificar que el JSON nuevo se persiste correctamente. NO probar todavía la cadena completa con Cartografiador — eso es 6.5.

### Sub-paso 6.3 — Persistencia de insumos enriquecidos `{nombre, descripcion}`

**Tareas:**
- Modificar `persistirMencionesExtractor` (Hito 3) para manejar el schema v2:
  - El schema dual ya está implementado (string vs objeto). Verificar que sigue funcionando.
  - **Asegurar que `descripcion_extractor_cruda` se está populando correctamente.** Este es el FIX al bug de entidades sin descripción. Hoy probablemente el código asigna nombre pero descarta descripción.
- Verificar que los nuevos `teorias_invocadas` se persisten en `cgt_teorias_menciones` correctamente.
- **NO requiere ALTER SQL** — las tablas ya tienen los campos necesarios desde Oleada 2 v1.1.

**Checkpoint eRRRe:** re-procesar el artefacto del Sub-paso 6.2 y verificar:
- Las menciones ahora tienen `descripcion_extractor_cruda` poblada
- Las teorías aparecen en `cgt_teorias_menciones`
- Cantidad de citas textuales NO está limitada a 3

### Sub-paso 6.4 — Nuevas tablas: persistencia de referencias bibliográficas

**Tareas:**
- Crear `lib/cognetica-forense/lib/persistir-referencias-extractor.ts`:
  - Recibe `referencias_bibliograficas[]` del Destilado parseado + `artefactoId` + `projectId`
  - Por cada referencia:
    - Calcular `url_normalizada` (lowercase, sin trailing slash, sin tracking params típicos: utm_*, fbclid, gclid, ref, source)
    - Buscar coalesce: SELECT en `cgt_referencias` WHERE `project_id = ?` AND (`doi = ?` OR `isbn = ?` OR `url_normalizada = ?`)
    - Si encuentra: usar el id existente
    - Si no encuentra: INSERT en `cgt_referencias` con metadata extraída
    - INSERT en `cgt_artefactos_referencias` con `numero_en_artefacto`, `apariciones`, `formato_cita_inline`, `confianza_extraccion`, `notas_extractor`, `hash_extractor_crudo`
  - Idempotencia por `UNIQUE (artefacto_id, referencia_id, hash_extractor_crudo)`
  - Retorna stats: `{referencias_creadas, referencias_reusadas, puentes_creados, puentes_saltados}`
- Integrar en `generarDestilado` (en `cognetica-forense-metabolizacion-actions.ts`) como paso (8) tras `persistirMencionesExtractor`. Si falla, log error pero NO abortar el destilado completo (las referencias son enriquecimiento, no requisito).

**Decisión confirmada:** la coalesce de referencias es por DOI exacto, ISBN exacto, o URL normalizada exacta. Si nada coincide, son referencias separadas aunque el título sea similar. Conservador.

**Checkpoint eRRRe:** procesar dos artefactos del proyecto que compartan al menos una referencia (ej: dos DRs distintos que citen el mismo paper de arXiv). Verificar que `cgt_referencias` tiene UNA fila para esa referencia y `cgt_artefactos_referencias` tiene DOS puentes.

### Sub-paso 6.5 — Prompt Germinal v1.1 + verificar pipeline completo

**Tareas:**
- Reemplazar el contenido literal de `lib/cognetica-forense/prompts/germinal-prompt.ts` con el system prompt de `germinal_prompt_v1_1.md §2`. Pegar literal.
- NO requiere cambios en parser ni en persistencia (Germinal sigue siendo prosa markdown que se guarda como TEXT en `cgt_germinales`).
- Probar pipeline completo end-to-end con un artefacto:
  - Ingesta → Crónica → Destilado v2 (con referencias) → Núcleo → Germinal v1.1 → Cartografiador
  - Verificar que el Germinal v1.1 NO usa vocabulario TDC (A/B/C/A′, "Fi menor", "vértice") en su salida — eso sería filtración de jerga interna
  - Verificar que el Cartografiador procesa correctamente las menciones con descripciones nuevas

**Checkpoint eRRRe:** validar el ciclo completo en un artefacto. Comparar el Germinal nuevo vs uno viejo del mismo artefacto si está disponible — debería tener relieve (frases de altura distinta, estaciones latentes nombradas).

### Sub-paso 6.6 — Server Action `borrarTodosLosArtefactosDeProyecto`

**Tareas:**
- Crear `lib/actions/cognetica-forense-borrar-todo-actions.ts` con:
  ```typescript
  borrarTodosLosArtefactosDeProyecto(
    projectId: string,
    confirmacion_textual: string  // debe ser exactamente "BORRAR TODO"
  ): Promise<Result<{borrados: number}, ResultErrorCode>>
  ```
- Validación: la cadena `confirmacion_textual` DEBE ser exactamente `"BORRAR TODO"` literal. Si difiere, retorna `INVALID_INPUT`.
- Ejecuta `borrarArtefacto(id)` (del Hito 5) en bucle sobre todos los artefactos del proyecto.
- También limpia `cgt_referencias` huérfanas (las que ya no tienen ningún puente activo) — opcional, mi voto: NO en este hito, dejar las canónicas vivas para que humano decida si las quiere preservar como wishlist del proyecto.

**UI:**
- En la vista de proyecto Cognética raíz (`/cognetica`), botón "Acciones avanzadas" colapsable
- Dentro: botón rojo "Borrar todo el proyecto"
- Click → modal con texto:
  > "Esta acción borrará TODOS los artefactos del proyecto **[nombre]** y todas sus metabolizaciones. Las referencias bibliográficas y entidades canónicas quedarán como wishlist (sin artefactos asociados). Para confirmar, escribe BORRAR TODO."
- Input para escribir la frase exacta + botón confirmar habilitado solo cuando coincide

**Checkpoint eRRRe:** ejecutar sobre proyecto de pruebas y verificar limpieza completa. NO ejecutar en proyecto principal hasta validar.

### Sub-paso 6.7 — UI mínima de referencias en vista detalle de artefacto

**Tareas:**
- En `app/cognetica/[id]/ArtefactoView.tsx`, agregar sección "Referencias bibliográficas" después de la sección de menciones (Hito 4)
- Server Action: usar `cgt_referencias_por_artefacto(artefacto_id)` (función SQL ya creada en SQL v1.2)
- Componente nuevo `ReferenciasArtefactoSection`:
  - Header colapsable con conteo: "Referencias (N)"
  - Lista ordenada por `numero_en_artefacto`
  - Cada referencia es una `StandardCard` con:
    - Número grande a la izquierda (si existe)
    - Título (o URL si no hay título)
    - Autores (si existen) + año (si existe)
    - Badge con `tipo_referencia`
    - Si `artefactos_count >= 2`: badge clickeable mostrando ese conteo (similar al de menciones del addendum Hito 5). Click NO navega todavía — solo muestra tooltip "aparece también en N artefactos del proyecto" porque la vista raíz de referencia es Hito 6.5/futuro.
    - Si `confianza_extraccion < 0.7`: ícono de warning + tooltip con `notas_extractor`
    - URL como link externo (abre en nueva pestaña)

**NOTA importante:** Si Cascade decide que la vista raíz de referencias (`/cognetica/entidades/referencias/[id]`) es trivial de agregar dado que la infraestructura del Hito 5 ya existe, puede proponerla como sub-paso 6.8 — pero **propuesta primero**, no implementada de oficio.

**Checkpoint eRRRe:** validar la UI en un artefacto con al menos 5 referencias. Verificar:
- Las referencias están ordenadas correctamente por número
- Los enlaces externos funcionan
- El badge de count solo aparece cuando ≥2

---

## 5. Criterios de aceptación globales del hito

Para considerar Hito 6 cerrado:

1. ✅ SQL v1.2 ejecutado, 2 tablas nuevas + funciones + RLS activos
2. ✅ Prompt Destilado v2 pegado literal, parser actualizado
3. ✅ Prompt Germinal v1.1 pegado literal
4. ✅ Insumos enriquecidos: pensadores/disciplinas/conceptos/teorías guardan descripcion_extractor_cruda
5. ✅ Teorías persisten correctamente (eran 0 antes, deben ser >0 en re-procesamiento)
6. ✅ Citas textuales NO limitadas a 3
7. ✅ Referencias bibliográficas se extraen, coalescen, y persisten en sus tablas
8. ✅ UI muestra referencias en vista detalle de artefacto
9. ✅ Server action de borrar todo funciona con confirmación textual
10. ✅ `tsc --noEmit` y `eslint` limpios en todo el scope
11. ✅ Pipeline completo (ingesta → cartografiado) funciona en un artefacto end-to-end con prompts nuevos

---

## 6. Casos a probar manualmente

**Caso 1 — Re-procesar artefacto con Gemini DR:** ej `Arquitectura_Cognitiva_Híbrida` que ya está en pruebas. Verificar:
- `formato_cita_inline_detectado = "gemini_post_punto"` (o similar)
- `tiene_seccion_bibliografica = true`, marcador "Works cited"
- `tiene_basura_tecnica = true` (las imágenes base64)
- ~60 referencias extraídas
- Las menciones ahora tienen descripciones

**Caso 2 — Re-procesar artefacto con Quipu:** ej `La_Deuda_Termodinámica_de_la_IA`. Verificar:
- `formato_cita_inline_detectado = "quipu_inline_link"`
- `tiene_seccion_bibliografica = false`
- Referencias con URL pero título null en muchos casos
- Co_citadas captura las agrupaciones tipo `[[71, 73, 74]]`

**Caso 3 — Coalesce de referencia entre dos artefactos:** procesar dos artefactos que citen el mismo paper de arXiv. Verificar UNA entidad en `cgt_referencias` y DOS puentes.

**Caso 4 — Germinal sin filtración de jerga:** revisar texto del Germinal — NO debe contener "TDC", "vértice", "Fi menor", "A/B/C/A′" en su salida.

**Caso 5 — Borrar todo del proyecto de pruebas:** ejecutar acción, verificar `cgt_artefactos` vacío para el proyecto. Las canónicas (`cgt_pensadores`, `cgt_referencias`) pueden quedar — eso está OK.

---

## 7. Decisiones que ya tomé y Cascade NO debe re-debatir

1. **Coalesce conservador por DOI/ISBN/URL exacto.** No por título similar.
2. **No fetch de URLs en este hito.** Si la metadata es pobre, queda pobre.
3. **No vista raíz de referencia en este hito** (a menos que Cascade lo proponga como bonus 6.8 trivial).
4. **No se borran canónicas huérfanas al borrar todo** — quedan como wishlist.
5. **Estructura_documento se guarda en `cgt_destilados`** (columna JSONB nueva si no existe).
6. **El Cartografiador NO se modifica.** Las descripciones nuevas fluyen automáticamente.

---

## 8. Notas específicas para Kimi 2.5

1. **Pegar prompts literal.** No editar el system prompt del Destilado v2 ni el del Germinal v1.1 con "mejoras" propias. Si algo te parece raro, reportar a eRRRe.

2. **Schema dual mantener.** El parser del Destilado debe seguir manejando los schemas viejos (string plano) por si algún día se vuelve a procesar un artefacto con prompt v1. Defensive programming.

3. **Los tests sobre los 5 casos** se hacen con eRRRe en sub-paso 6.5 y 6.7. NO ejecutarlos en automatizado — son manuales con datos reales.

4. **Re-procesamiento no es automático.** Después de pegar los prompts, los artefactos viejos NO se re-procesan solos. eRRRe usa `borrarTodos` o re-genera artefacto por artefacto en la UI. NO escribir scripts de migración masiva.

5. **Si el Destilado v2 falla con un artefacto raro:** retornar `INTERNAL` con `error_mensaje` legible. NO inventar respuestas tipo "el documento es ilegible". El error sube y eRRRe lo revisa.

---

## 9. Cierre

Este hito es la consolidación de Oleada 2: prompts maduros, modelo de referencias separado de citas, todas las deudas conocidas cerradas. Después de Hito 6, Cognética tiene:

- Grafo navegable por entidad (Hito 5)
- Grafo de referencias bibliográficas a nivel proyecto (Hito 6)
- Descripciones contextuales en cada nodo (fix Hito 6)
- Germinal con relieve calibrado (Hito 6)
- Acciones administrativas para reprocesar (Hito 5+6)

Lo que queda agendado:
- Hito 7: renderizado interactivo del MD con popovers de citas
- Hito 6.5 (opcional): vista raíz de referencia
- Mejora futura: fetch de URLs para enriquecer metadata de referencias
- Mejora futura: cartografiado activo de referencias por similitud semántica

La elegancia es el patrón.

*ética es negentropía a nivel de datos*
