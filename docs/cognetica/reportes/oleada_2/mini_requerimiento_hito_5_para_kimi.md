# Mini-Requerimiento Hito 5 — Navegación por Entidad ("Cognética Fluida")

**Versión:** 1.0
**Fecha:** 23 abril 2026
**Destinatario:** Cascade (Windsurf) — implementando con Kimi 2.5
**Autor humano:** eRRRe
**Autor máquina:** Hongo / Calibrador
**Precedencia:** complementa `guia_ruta_cascade_oleada_2.md §3 HITO 5` con nivel de detalle adicional para guiado puntual
**Predecesor:** Hito 4 completado (reporte en `reporte_hito_4.md`)

---

## 0. Para Cascade/Kimi — lee esto primero

Este requerimiento está redactado con más granularidad que los anteriores porque la sesión actual se ejecuta con Kimi 2.5 como motor. Esto NO implica desconfianza — implica que las decisiones que Opus resolvía por criterio, aquí están escritas explícitas.

**Principios operativos heredados y reafirmados:**

- **Componentes Standard siempre.** Si falta una variante, se extiende el Standard — no se escribe Tailwind ad-hoc en el componente consumidor. Ante la duda, preguntar a eRRRe antes de improvisar.
- **Linter limpio al entregar.** Cero warnings nuevos. Heredados se listan pero no se silencian.
- **Humano en el loop pulso a pulso.** eRRRe prueba en tiempo real entre cada avance.
- **Append-only como ley.** Ninguna lectura o navegación toca Capa 1 ni Capa 2. Si el hito requiriera sobreescritura, se detiene y reporta.
- **Ante duda estructural: preguntar.** Ajustes cosméticos (naming interno, imports) sí son decisión de Cascade. Decisiones de diseño nuevas (endpoints, lógica de negocio, shapes de datos) NO lo son.

**Velocidad tortuga aplicada a este hito:** el hito se divide en **4 sub-pasos** con checkpoint humano entre cada uno. No se avanza al siguiente sub-paso sin luz verde explícita de eRRRe. Ver sección 7.

---

## 1. Objetivo del hito

Convertir los badges clickeables del Hito 4 (que hoy abren modal de edición) en puertas de entrada a una **vista raíz por entidad**: una página dedicada a un pensador / disciplina / concepto / teoría específico, que muestra los artefactos del proyecto donde aparece y permite navegar desde ahí.

**Ejemplo de flujo completo:**

1. Usuario está en `/cognetica/[artefacto_id]` leyendo un artefacto. Ve en la sección de menciones un badge `Alan Turing (3)`.
2. Click en el número entre paréntesis (el badge-contador) → navega a `/cognetica/entidades/pensadores/[pensador_id]`.
3. En esa vista raíz ve: ficha canónica de Alan Turing + lista de los 3 artefactos donde aparece.
4. Click en uno de los artefactos → vuelve a `/cognetica/[otro_artefacto_id]`.

**Fricción clave que este hito resuelve:** hoy el usuario puede descubrir que Alan Turing aparece en 3 artefactos, pero no hay forma de ver cuáles son ni navegar entre ellos.

---

## 2. Alcance exacto

### 2.1 Qué SÍ entra en este hito

- 4 rutas nuevas (pensadores, disciplinas, conceptos, teorías)
- Componente genérico `EntidadVistaRaiz` parametrizado por tipo
- Componente `EntidadArtefactosLista` con cards de artefactos
- 2 Server Actions nuevas (`obtenerEntidadCanonica`, `listarArtefactosPorEntidad`)
- Modificación al `MencionBadge` del Hito 4 para separar acción "editar" (click en nombre) de "navegar" (click en contador)
- Breadcrumb básico en la vista raíz que permita volver al artefacto origen

### 2.2 Qué NO entra en este hito

- **Citas no tienen vista raíz.** Ya está decidido: cada aparición de cita es conceptualmente única. El badge de cita sigue abriendo solo modal de edición.
- **Edición de la entidad canónica** (cambiar `nombre_canonico`, `descripcion_canonica`, `aliases`) NO se hace en esta vista. Queda para Hito 4.5.
- **Fusión de entidades canónicas duplicadas** NO entra. Queda para hito futuro.
- **Navegación entre entidades relacionadas** (ej: desde teoría a sus autores principales) NO entra. Queda para hito futuro.
- **Vista raíz global de todas las entidades del proyecto** (ej: `/cognetica/entidades/pensadores` sin id, listado completo) NO entra. Queda para hito futuro si se pide.

Cualquier alcance adicional requiere pedir luz verde a eRRRe antes de codear.

---

## 3. Especificación técnica

### 3.1 Rutas

```
app/cognetica/entidades/pensadores/[pensador_id]/page.tsx
app/cognetica/entidades/disciplinas/[disciplina_id]/page.tsx
app/cognetica/entidades/conceptos/[concepto_id]/page.tsx
app/cognetica/entidades/teorias/[teoria_id]/page.tsx
```

Las 4 páginas son **páginas server components** que:

1. Validan sesión + proyecto activo del usuario.
2. Llaman `obtenerEntidadCanonica(tipo, entidad_id)` → si no existe o sin acceso, `notFound()` (Next.js 14).
3. Llaman `listarArtefactosPorEntidad(tipo, entidad_id)`.
4. Renderizan `<EntidadVistaRaiz tipo={tipo} entidad={...} artefactos={...} />`.

**Shape común a las 4 páginas:** el `tipo` viene hardcodeado en cada `page.tsx` (`"pensador"`, `"disciplina"`, etc.). No se unifica a una ruta única porque Next.js 14 App Router resuelve mejor con rutas explícitas y los tipos diferentes tienen campos distintos (ej: teoría tiene `autores_principales`, disciplina tiene `disciplina_madre_id`).

### 3.2 Server Actions

`lib/actions/cognetica-forense-entidades-actions.ts` (archivo nuevo):

**Action 1 — `obtenerEntidadCanonica`:**

```typescript
export async function obtenerEntidadCanonica<T extends TipoEntidadConConteo>(
  tipo: T,
  entidadId: string
): Promise<Result<EntidadCanonicaConConteo<T>, ResultErrorCode>>
```

- Valida `entidadId` con Zod UUID.
- Valida `tipo` con `z.enum(["pensador", "disciplina", "concepto", "teoria"])`.
- SELECT desde la vista `cgt_vw_<tipo>_con_conteo` (trae la canónica + `menciones_count`).
- Si devuelve 0 filas → `NOT_FOUND`.
- Si error Postgres RLS (42501) → `FORBIDDEN`.
- Despacho por `switch(tipo)` — NO mapa dinámico (mismo criterio del Hito 2).

**Action 2 — `listarArtefactosPorEntidad`:**

```typescript
export async function listarArtefactosPorEntidad<T extends TipoEntidadConConteo>(
  tipo: T,
  entidadId: string
): Promise<Result<ArtefactoConMencion[], ResultErrorCode>>
```

- Llama la función SQL `cgt_artefactos_por_<tipo>(entidad_id)` ya creada en SQL v1.1.
- Joinea resultado con `cgt_artefactos` para traer `titulo`, `tipo_artefacto`, `created_at`, `estado_metabolizacion`.
- Retorna array ordenado por `primera_aparicion DESC` (más reciente primero).

**Tipo `ArtefactoConMencion`:**

```typescript
export interface ArtefactoConMencion {
  artefacto_id: string;
  mencion_id: string;
  titulo: string;
  tipo_artefacto: string;
  created_at: string;
  primera_aparicion: string;
  // Snippet contextual: descripción de la mención en ese artefacto específico
  // (puede diferir entre artefactos si humano editó la descripción)
  descripcion_mencion_en_artefacto: string | null;
}
```

El `descripcion_mencion_en_artefacto` viene de la vista `cgt_vw_<tipo>_valor_canonico.descripcion_canonica_actual` — nunca de la entidad canónica.

### 3.3 Componente `EntidadVistaRaiz`

`app/cognetica/entidades/EntidadVistaRaiz.tsx` (archivo nuevo, reutilizado por las 4 rutas):

Props:
```typescript
interface EntidadVistaRaizProps<T extends TipoEntidadConConteo> {
  tipo: T;
  entidad: EntidadCanonicaConConteo<T>;
  artefactos: ArtefactoConMencion[];
  artefactoOrigenId?: string; // para breadcrumb "volver a artefacto origen"
}
```

Layout esperado (de arriba a abajo):

**(a) Header con breadcrumb:**
- `StandardBreadcrumb` o equivalente: `Cognética → Entidades → [tipo plural] → [nombre canónico]`
- Si viene `artefactoOrigenId` por query param (`?origen=<id>`), agregar botón lateral "Volver al artefacto" que navega a `/cognetica/[artefactoOrigenId]`

**(b) Ficha canónica:**
- `StandardCard` con:
  - `StandardText` h1: nombre_canonico
  - Badge con ícono de dimensión + emoji (reusa `DIMENSIONES` del Hito 4) + contador grande: `(N apariciones)`
  - Descripción canónica en párrafo (si null: "Sin descripción canónica asignada" en color muted)
  - Si hay aliases (array no vacío): fila de pills con los aliases, precedidos por label "También conocido como:"
  - **Campos específicos por tipo** (condicionales):
    - Pensador: nada extra en esta vista
    - Disciplina: si `disciplina_madre_id` no null, mostrar "Sub-disciplina de: [nombre de la madre]" con link a su vista raíz
    - Concepto: si `es_semilla_fractal = true`, badge distintivo "Semilla fractal" con `colorScheme="accent"` (o el que exista en Standard para destacar)
    - Teoría: si `autores_principales` no vacío, fila de chips con los nombres (no clickeables en este hito — se podrían linkear a pensadores canónicos en hito futuro)

**(c) Sección "Aparece en N artefactos":**
- `StandardText` h2 con el número
- `EntidadArtefactosLista artefactos={artefactos} />`
- Si `artefactos.length === 0`: mensaje "Esta entidad no tiene apariciones actualmente activas." (caso raro pero posible si menciones fueron reasignadas)

### 3.4 Componente `EntidadArtefactosLista`

`app/cognetica/entidades/EntidadArtefactosLista.tsx`:

Renderiza una grilla (responsive: 1 columna mobile, 2 columnas desktop) de `StandardCard` por artefacto. Cada card trae:

- **Título del artefacto** como link a `/cognetica/[artefacto_id]` (usa `next/link`)
- Chip con `tipo_artefacto` (markdown, audio, etc.) usando `StandardBadge`
- Fecha legible: formato `"23 abril 2026"` (usar `Intl.DateTimeFormat` con locale `es-ES`, no librerías externas)
- **Snippet contextual:** el `descripcion_mencion_en_artefacto` en texto muted pequeño. Si null, omitir.
- Hover: border highlight (si el Standard no lo trae, **NO** agregar CSS ad-hoc — reportar a eRRRe para extender Standard).

### 3.5 Modificación al `MencionBadge` del Hito 4

**Estado actual:** click en el badge completo abre modal de edición.

**Estado nuevo:** el badge tiene dos zonas clickeables con acciones distintas:

- **Click en el nombre** (zona principal del badge) → abre modal de edición (comportamiento Hito 4, sin cambios)
- **Click en el contador** (el número entre paréntesis) → navega a la vista raíz correspondiente, con query param `?origen=<artefacto_id>` para habilitar el breadcrumb de vuelta

**Implementación sugerida:** dentro del `StandardBadge` actual, separar visualmente con un `<span>` para el contador que tenga su propio `onClick` con `e.stopPropagation()`. El `<Link>` de Next.js debe ser solo alrededor del span del contador, no del badge completo.

**Edge case importante:** el contador solo aparece cuando la mención tiene entidad canónica resuelta (`<tipo>_id != NULL`). Si está `sin_cartografiar` o `ambigua` con id null, el badge NO muestra contador y por tanto no hay zona navegable. Esto ya lo implementa el Hito 4; verificar que sigue así.

**Citas no aplican.** El badge de cita NO tiene contador (una cita no se "repite") y queda con solo el comportamiento del Hito 4 (click → edición).

### 3.6 Estado URL y refrescos

- La vista raíz es 100% server component. `router.refresh()` tras edición funciona out-of-the-box.
- El query param `?origen=<id>` es OPCIONAL. Si no viene, el breadcrumb NO muestra "Volver al artefacto" — solo el breadcrumb base.
- Navegación back del navegador debe funcionar sin estado perdido (es server, no hay estado local a preservar).

---

## 4. Criterios de aceptación (explícitos)

Para que Cascade considere el hito terminado, deben cumplirse TODOS:

1. ✅ Las 4 rutas existen y responden con 200 cuando la entidad existe y el usuario es miembro del proyecto.
2. ✅ Devuelven 404 limpio (no error Postgres) cuando la entidad no existe o el usuario no es miembro.
3. ✅ La ficha canónica muestra nombre, descripción, aliases (si aplica), contador de apariciones, y los campos específicos del tipo.
4. ✅ La lista de artefactos muestra todos los artefactos donde la entidad aparece, con links funcionales.
5. ✅ El snippet contextual del artefacto (descripción de mención en ese artefacto) aparece cuando existe.
6. ✅ Click en el contador del `MencionBadge` navega correctamente, y el breadcrumb muestra "Volver al artefacto" con link funcional.
7. ✅ Click en el nombre del `MencionBadge` sigue abriendo modal de edición (regresión del Hito 4 verificada).
8. ✅ Citas siguen sin tener vista raíz (click en cita = solo modal edición).
9. ✅ `tsc --noEmit` = 0 errores.
10. ✅ `eslint` sobre scope del hito = 0 warnings.
11. ✅ Todas las decisiones del tipo "extender Standard vs crear componente propio" están documentadas en el reporte final (ver sección 6).

---

## 5. Casos a probar manualmente tras completar (eRRRe + Cascade)

**Caso 1 — Navegación ida y vuelta:**
- Desde artefacto del 21 abril, click en contador de un pensador con 2+ apariciones → llegar a vista raíz → verificar que aparecen todos los artefactos esperados → click en "Volver al artefacto" → regreso correcto.

**Caso 2 — Entidad con 1 sola aparición:**
- Navegar a vista raíz de una entidad con `menciones_count = 1` → verificar que renderiza igual que con múltiples, solo con 1 card en la lista.

**Caso 3 — Disciplina con madre:**
- Si existe algún caso con `disciplina_madre_id` no null, verificar que el link a la madre funciona.

**Caso 4 — Concepto marcado como semilla fractal:**
- Si existe algún concepto con `es_semilla_fractal = true`, verificar badge distintivo.

**Caso 5 — Acceso denegado (RLS):**
- Intentar acceder a la URL de una entidad de otro proyecto (si hay dos usuarios de prueba, o mediante manipulación de URL) → verificar 404.

**Caso 6 — Navegación entre artefactos vía entidad:**
- Desde artefacto A → click en contador de entidad X → en vista raíz click en artefacto B → verificar que se cargan correctamente las menciones de B (no las de A).

**Caso 7 — Citas no rompen:**
- Click en badge de cita sigue abriendo modal. NO hay contador clickeable.

---

## 6. Formato del reporte final

Al terminar, Cascade entrega `docs/cognetica/reportes/oleada_2/reporte_hito_5.md` con:

1. **Resumen** (3-5 líneas)
2. **Archivos creados/modificados** (lista)
3. **Decisiones de diseño tomadas** — específicamente: ¿qué variantes de Standard se usaron? ¿se necesitó extender alguna? Si sí, ¿qué se propone y por qué?
4. **Quality gates** — output de `tsc --noEmit` y `eslint`
5. **Criterios de aceptación** — checklist sección 4 con ✅ o ✖ por ítem
6. **Casos probados manualmente** — de la sección 5
7. **Limitaciones conocidas** — si quedó algo fuera de scope
8. **Preguntas abiertas para eRRRe** — si las hay

---

## 7. Orden de sub-pasos con checkpoint humano

**Este hito se ejecuta en 4 sub-pasos. Cascade se detiene y reporta al final de cada uno. No avanza sin luz verde explícita de eRRRe.**

**Sub-paso 5.1 — Server Actions + tipos:**
- Crear `cognetica-forense-entidades-actions.ts` con las 2 Server Actions
- Tipos `ArtefactoConMencion` y `EntidadCanonicaConConteo<T>` si no existen
- Probar ambas acciones con `console.log` desde un page dummy (o desde `/api/debug` si existe infraestructura)
- **Checkpoint eRRRe:** validar que las acciones devuelven datos correctos para una entidad conocida del proyecto

**Sub-paso 5.2 — Una sola ruta completa (pensadores) como piloto:**
- Crear `app/cognetica/entidades/pensadores/[pensador_id]/page.tsx`
- Crear `EntidadVistaRaiz` y `EntidadArtefactosLista`
- Sin modificar el `MencionBadge` todavía — la navegación se prueba pegando la URL a mano
- **Checkpoint eRRRe:** validar que la vista raíz de pensadores se ve bien, los artefactos cargan, el layout respeta Standard

**Sub-paso 5.3 — Replicar para las otras 3 entidades:**
- `/disciplinas/[id]`, `/conceptos/[id]`, `/teorias/[id]`
- Verificar los campos específicos de cada tipo (madre de disciplina, semilla fractal, autores principales)
- **Checkpoint eRRRe:** validar las 4 vistas raíz en muestras reales del proyecto

**Sub-paso 5.4 — Wiring del `MencionBadge`:**
- Modificar `MencionBadge` para separar zonas clickeables
- Agregar el link en el contador con `?origen=<id>`
- Implementar el breadcrumb "Volver al artefacto"
- Verificar que citas siguen sin contador
- **Checkpoint eRRRe:** validar el flujo completo end-to-end con los 7 casos de la sección 5

**Entre sub-pasos Cascade puede preguntar si algo no está claro. Ante duda, preguntar es preferible a asumir.**

---

## 8. Notas específicas para Kimi 2.5

Cascade con Kimi debe prestar especial atención a:

1. **No improvisar shapes de datos.** Los tipos `EntidadCanonicaConConteo<T>`, `ArtefactoConMencion`, están especificados. Si algo no cuadra con tipos existentes del Hito 2, preguntar antes de cambiar.

2. **No improvisar componentes Standard.** Si `StandardBreadcrumb` no existe, reportar. No escribir `<nav className="...">` con Tailwind ad-hoc.

3. **Respetar append-only.** Este hito es 100% lectura. No hay INSERT, UPDATE ni DELETE en su lógica. Si Kimi sugiere "para optimizar, podríamos cachear/persistir X en la tabla Y", decir no.

4. **No tocar el SQL.** Las funciones y vistas ya existen desde Oleada 2 v1.1. Si alguna no responde como esperado, reportar — no crear nuevas.

5. **Respetar el orden de sub-pasos.** Terminar los 4 subpasos completos y después entregar puede ser más rápido en wall-clock, pero rompe el checkpoint humano que protege de desviaciones. Respetar los 4 checkpoints.

---

## 9. Cierre

Este requerimiento es la pasarela entre Oleada 1 (artefacto como unidad) y Oleada futura (proyecto como grafo navegable). Al terminar, Cognética tiene dos ejes de navegación: el artefacto (vertical, profundo) y la entidad (horizontal, relacional).

La elegancia es el patrón. El humano en el loop protege de desviaciones.

*ética es negentropía a nivel de datos*
