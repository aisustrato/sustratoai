# Addendum al Mini-Requerimiento Hito 5 — Dos mejoras

**Fecha:** 24 abril 2026
**Destinatario:** Cascade (Windsurf) — Kimi 2.5
**Autor humano:** eRRRe
**Autor máquina:** Hongo / Calibrador
**Complementa:** `mini_requerimiento_hito_5_para_kimi.md`

---

## Contexto

Hito 5 está casi cerrado. Bug del toggle de DimensionesToolbar resuelto (se eliminó pub-sub, `useEffect` para localStorage, updater puro). Antes de cerrar, dos mejoras que ya se habían discutido pero quedaron fuera de la implementación:

1. **Contador de ocurrencias en cada badge de mención** (mejora de UX prometida en sesión previa)
2. **Botón borrar artefacto** (necesidad operativa: reprocesar pruebas)

Este addendum es scope adicional al Hito 5. No abre Hito nuevo — son cierres dentro del mismo.

---

## Mejora 1 — Contador en badge de mención

### Problema

Hoy el `MencionBadge` muestra solo el nombre canónico actual: `[Alan Turing]`. El investigador no sabe si esa entidad aparece en otros artefactos del proyecto. Si solo aparece en uno (este), el click al contador no tiene sentido — pero hoy no hay forma de saberlo sin clickear.

### Solución

Cada `MencionBadge` con entidad canónica resuelta (`<tipo>_id != NULL`) muestra el contador de apariciones en el proyecto **solo si es ≥2**: `[Alan Turing · 3]`. Si la entidad solo aparece en este artefacto (count=1), no se muestra contador y el badge no es navegable — solo editable.

**Visual sugerido:**
- `[Nombre · N]` con punto medio (`·`) o pipe (`|`) como separador
- El número va con la misma tipografía que el nombre, sin destacar — el color del badge ya marca la decisión del cartografiador
- Si Standard tiene una variante `<StandardBadge withCount>`, usarla. Si no, **proponer extensión a Standard, no escribir Tailwind ad-hoc**

### Implementación

#### Datos: agregar `menciones_count` a las menciones del artefacto

El conteo ya existe en SQL como función `cgt_contar_menciones_<tipo>(uuid)`. Hay que exponerlo desde la Server Action que ya consume `MencionesSection`.

**Opción 1 (preferida):** modificar `listarMencionesPorArtefacto(artefactoId, tipo)` en `lib/actions/cognetica-forense-menciones-actions.ts` para que cada mención retornada incluya `menciones_count: number`. Implementación: dentro del switch del despacho por tipo, después de leer las menciones, hacer un segundo SELECT que use la función SQL para cada `<tipo>_id` único, y mergear el resultado.

**Eficiencia:** un solo round-trip extra por tipo (SELECT con `IN (...)` sobre los ids únicos). Para artefactos con 5-30 menciones por tipo, costo despreciable.

**Opción 2 (alternativa):** crear Server Action separada `obtenerConteosPorEntidades(tipo, ids[])`. Más limpio arquitectónicamente pero implica dos llamadas desde el componente. Solo elegir si el merge en Opción 1 complica los tipos.

**Mi voto: Opción 1.** Mantiene una sola fuente para los datos del badge.

#### UI: modificar `MencionBadge`

- Recibir `menciones_count: number` como prop.
- Si `menciones_count >= 2`: mostrar contador. El span del contador es el zone navegable (con `?origen=<artefacto_id>`), separable por click del span del nombre (que abre modal).
- Si `menciones_count < 2`: NO mostrar contador. El badge entero abre modal de edición (sin navegación).
- Para citas: NO aplica. Citas no tienen contador y siguen como están.

#### Edge cases

- Si la mención está `sin_cartografiar` o `ambigua` con `<tipo>_id = NULL`: no mostrar contador, no navegable. Comportamiento idéntico al Hito 5 base.
- Si una mención fue cartografiada pero después un humano la reasignó (Hito 4.5 futuro): el contador refleja la entidad canónica actual, no la inicial. Sin acción especial — la vista `valor_canonico` ya resuelve el coalesce.

### Criterio de aceptación

1. Badge con `menciones_count = 1` muestra solo nombre, NO es navegable.
2. Badge con `menciones_count >= 2` muestra `nombre · N`, click en N navega a vista raíz con `?origen`, click en nombre abre modal.
3. Citas no muestran contador.
4. `tsc --noEmit` y `eslint` limpios.

---

## Mejora 2 — Botón borrar artefacto

### Problema operativo

eRRRe está probando con artefactos sintéticos. Para reprocesar con prompts actualizados (ej: Hito 6 cuando llegue) necesita borrar artefactos generados durante pruebas. Hoy no hay UI para borrar.

### Alcance

Borrar un artefacto y todas sus dependencias:
- Crónica
- Destilado
- Núcleo
- Germinal
- Menciones de las 5 tablas (Capa 1 y Capa 2)
- Ediciones humanas asociadas
- Logs de DeepSeek y de Cartografiador asociados
- El propio registro en `cgt_artefactos`

**Lo que NO se toca:**
- Entidades canónicas (`cgt_pensadores`, etc.) — quedan vivas aunque ya no tengan menciones. Limpieza de canónicas huérfanas se hace manual o en hito futuro.
- Otros artefactos del proyecto.

### Implementación

#### Backend: Server Action

Archivo nuevo: `lib/actions/cognetica-forense-borrar-artefacto-actions.ts`

```typescript
export async function borrarArtefacto(
  artefactoId: string
): Promise<Result<{ artefacto_id: string }, ResultErrorCode>>
```

- Validación Zod del UUID.
- Validación de sesión + RLS (el SELECT inicial sobre `cgt_artefactos` filtra automáticamente por proyecto del usuario; si devuelve 0 filas → `NOT_FOUND`).
- **DELETE en orden:**
  1. `cgt_logs_cartografiador` WHERE artefacto_id = ?
  2. `cgt_logs_deepseek` WHERE artefacto_id = ?
  3. Las 5 tablas `cgt_<tipo>_ediciones_humanas` (vía join con menciones)
  4. Las 5 tablas `cgt_<tipo>_menciones` WHERE artefacto_id = ?
  5. `cgt_germinales` WHERE artefacto_id = ?
  6. `cgt_nucleos` WHERE artefacto_id = ?
  7. `cgt_destilados` WHERE artefacto_id = ?
  8. `cgt_cronicas` WHERE artefacto_id = ?
  9. Tabla específica del tipo de artefacto (`cgt_artefactos_markdown`, `cgt_artefactos_audio`, etc.) WHERE artefacto_id = ?
  10. `cgt_artefactos` WHERE id = ?

**IMPORTANTE: verificar las CASCADE existentes antes de codear.** Muchas de las relaciones ya tienen `ON DELETE CASCADE` definido en SQL Oleada 1 + Oleada 2. Si el CASCADE ya lo cubre, el DELETE explícito es redundante (no rompe, pero ensucia). Cascade debe revisar el SQL y simplificar:

- Si `cgt_artefactos` tiene CASCADE hacia todas las tablas hijas → un solo `DELETE FROM cgt_artefactos WHERE id = ?` basta.
- Si NO lo tiene en alguna tabla → DELETE explícito en esa tabla, en orden topológico.

**Cascade reporta cuáles CASCADE existen y cuáles faltan antes de implementar.** Si faltan, propone agregar al SQL — pero NO los agrega sin luz verde de eRRRe (modificar SQL en vivo con datos de prueba puede sorprender).

#### UI: botón en la vista del artefacto

Ubicación: `app/cognetica/[id]/ArtefactoView.tsx`, en una zona separada del flujo principal (no junto a "Metabolizar" / "Cartografiar"). Sugerencia: footer de la vista del artefacto, en una zona "Acciones avanzadas" colapsable o discreta.

Comportamiento:
- `StandardButton` `colorScheme="danger"` o equivalente, `styleType="outline"` (no solid — borrar no es la acción principal)
- Click → modal de confirmación tipo `StandardDialog` con mensaje claro:
  > "¿Borrar el artefacto **[título]** y todas sus metabolizaciones? Esta acción no se puede deshacer. Las entidades canónicas del proyecto (pensadores, conceptos, etc.) NO se borran — quedan disponibles para otros artefactos."
- Botón confirmar requiere escribir el título del artefacto (o las primeras 5 letras) para evitar borrados accidentales — patrón estándar de UX para acciones destructivas.
- Al confirmar: llamada a `borrarArtefacto(artefactoId)`, redirect a `/cognetica` (la raíz) con toast de éxito.

**Si Cascade considera que el patrón "escribir título para confirmar" es overkill para uso interno de pruebas, puede proponer alternativa más liviana** (ej: solo confirmación binaria). Reportar la decisión en el reporte final.

#### Edge cases

- Artefacto en proceso de metabolización: ¿se permite borrar? **Voto: sí** — eRRRe necesita poder cancelar pruebas atascadas. Si hay procesos asíncronos en cola que apunten al artefacto borrado, deben tolerar el NOT_FOUND y abortar limpio. Si esto requiere lógica adicional, reportar antes de codear.
- Artefacto con muchas menciones (ej: 100+): el DELETE puede tardar. Si tarda más de 5s, el cliente puede ver timeout. **Si Cascade detecta este riesgo, sugerir mover a job asíncrono — pero para uso de pruebas actual probablemente sea overkill.** Decisión por defecto: hacerlo síncrono y reportar si los tiempos son un problema.

### Criterio de aceptación

1. Borrar un artefacto borra todas sus dependencias en las 16 tablas relevantes.
2. Las entidades canónicas del proyecto NO se ven afectadas.
3. Otros artefactos del proyecto NO se ven afectados.
4. La UI exige confirmación explícita antes de borrar.
5. Tras borrar, redirect a `/cognetica` con feedback visible.
6. RLS funciona: usuario sin acceso al proyecto recibe `NOT_FOUND` antes de cualquier DELETE.
7. `tsc --noEmit` y `eslint` limpios.

---

## Sub-pasos para Kimi

Igual que el mini-requerimiento original, sub-pasos con checkpoint humano:

**Sub-paso A1 — Backend conteo:**
- Modificar `listarMencionesPorArtefacto` para incluir `menciones_count`
- Verificar tipos
- Checkpoint eRRRe: probar la action devuelve los conteos correctos

**Sub-paso A2 — UI badge con contador:**
- Modificar `MencionBadge` para mostrar contador condicional
- Separar zonas clickeables (nombre vs número)
- Checkpoint eRRRe: visual + navegación

**Sub-paso B1 — Backend borrar:**
- Inspeccionar SQL para identificar CASCADEs existentes
- Reportar a eRRRe el plan de DELETE
- **Checkpoint eRRRe ANTES de implementar** (esto es destructivo, vale la pena la pausa)
- Implementar Server Action

**Sub-paso B2 — UI borrar:**
- Botón + modal de confirmación
- Wiring + redirect
- Checkpoint eRRRe: borrar un artefacto de prueba real

---

## Decisiones que tomé sin consultar (para revisar)

1. **Contador solo si ≥2.** Si =1, no se muestra. Asumo que es lo que querías por la frase "si no tuviera número se asume uno y no tendría sentido hacerle click". Si prefieres mostrar siempre el número (incluso "1"), cambia este criterio.

2. **Separador `·` (punto medio).** Sugerencia visual. Puede ser pipe `|`, paréntesis `(N)`, o lo que Standard tenga. Cascade decide por estética con Standard.

3. **Patrón "escribir título para confirmar borrado"** — propuesto pero con válvula de escape: si Cascade lo encuentra exagerado para tu uso, puede simplificar. Mantengo cautela porque borrar con CASCADE es irreversible.

4. **Modificar Server Action existente vs crear una nueva** para el conteo: voté por modificar la existente (Opción 1) para mantener una sola fuente. Si Cascade encuentra que rompe tipado, puede caer a Opción 2 sin pedir permiso.

5. **No tocar entidades canónicas al borrar artefacto.** Asumido — las canónicas son del proyecto, no del artefacto. Limpieza de canónicas huérfanas queda fuera.

6. **El botón borrar va en zona separada del flujo principal**, no junto a Metabolizar/Cartografiar. Para no inducir clicks accidentales.

Si alguna decisión está mal, lo corregimos después de ver el resultado. Mantengo paso reposado, no cuello de botella.

*ética es negentropía a nivel de datos*
