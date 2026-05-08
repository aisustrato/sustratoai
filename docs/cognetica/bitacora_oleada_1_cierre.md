# Bitácora — Cierre formal de Cognética Forense v2 · Oleada 1

**Fecha de cierre:** 22 abril 2026
**Registro redactado por:** Cascade (en ejecución de la `guia_ruta_cascade_oleada_2.md §2`)
**Aprobación pendiente:** eRRRe (nodo central)

---

## Validación de primera metabolización

La primera metabolización completa del pipeline v1 atómica se ejecutó sobre un artefacto markdown real (portada de *Nature* sobre materiales 2D — ingresado el 21 abril 2026, proyecto activo del usuario).

### Formatos validados

Los cuatro formatos de la tríada + Germinal salieron en verde, con calidad literaria apreciable (lectura aprobada por eRRRe y evaluada por Hongo):

- **Crónica** — apertura narrativa fuerte ("En febrero de 2026…"), voz del cronista discreta pero presente, metáfora con peso argumental ("judo epistemológico"), cierre abierto. No minuta. Crónica real.
- **Destilado** — tesis clara, 3–5 movimientos con dirección, tensiones irreductibles, cita núcleo literal.
- **Núcleo** — compresión a tarjeta de presentación. Dentro del hard cap semántico (≤600 tokens).
- **Germinal** — generado con el prompt v1 atómico (sin corpus previo). Voz especulativa sobria, no placeholder "omitido".

### Costo medido

**US$0.0186 por artefacto metabolizado completo** (Crónica + Destilado + Núcleo + Germinal). Dentro del presupuesto proyectado en `pipeline_metabolizacion_v1.md §6` (target pilot $0.028–0.15; realista $0.016–0.020).

---

## Ajustes de diseño aplicados al cierre

Dos ajustes menores pero con trazabilidad explícita:

### 1. Umbral de Germinal → eliminado en v1 atómica

El umbral provisional de `≥3 artefactos previos con Núcleo` (documentado en `spec v0.3 §4.4`) era vestigio de un diseño donde Germinal requería corpus comparativo. Con Germinal v1 atómico (opera sólo sobre Crónica + Destilado del artefacto actual), el umbral sobra y contradice la arquitectura v1 acordada.

**Decisión de eRRRe:** eliminar el umbral. Siempre se parte por uno. El primer artefacto de un proyecto tiene derecho a Germinal completo.

**Archivos afectados por el cambio:**

- `docs/cognetica/cognetica_v2_formatos_spec_v0_3.md` — §4.4 reformulado (umbral ya no aplica en v1 atómica) + nota notariada al final de §0.
- `lib/actions/cognetica-forense-metabolizacion-actions.ts` — eliminada constante `UMBRAL_GERMINAL`, eliminado chequeo previo, eliminado SELECT de núcleos previos. `contexto_snapshot` del germinal ahora lleva metadata explícita: `version_prompt: "v1_atomica"`, `modo: "atomico"`, `artefactos_previos_consultados: 0`.

### 2. Pipeline de metabolización → resume-from-last + botón adaptativo

Efecto colateral benéfico del cierre: el orquestador `metabolizarArtefacto` se volvió resume-from-last. Al arrancar escanea qué formatos ya están persistidos y saltea sus generadores; reutiliza filas existentes sin re-gastar LLM.

Frontend: `MetabolizarButton` adapta su label en 3 modos (**Iniciar** / **Reintentar** / **Continuar**) y debajo del botón muestra los formatos faltantes explícitos (*"Se generará: Germinal"*).

**Archivos afectados:**

- `lib/actions/cognetica-forense-metabolizacion-actions.ts` — nuevo helper interno `existeFormato()` + parámetro opcional `{ forzar?: boolean }`.
- `lib/cognetica-forense/metabolizacion-shared.ts` — `ResumenMetabolizacion` ampliado con estado `"reutilizado"`.
- `app/cognetica/[id]/MetabolizarButton.tsx` — botón con 3 modos mutuamente excluyentes según `estado` + `faltantes`.
- `app/cognetica/[id]/ArtefactoView.tsx` — deriva `faltantes` desde `data.cronica/destilado/nucleo/germinal === null`.

### 3. Directorio raíz de Cognética

Además del cierre formal, al finalizar Oleada 1 quedó montado el directorio raíz `/cognetica` con grid de `StandardCard` por artefacto, tesis del Núcleo como descripción, badge de estado, indicador de fase (`n/4 · Siguiente`), emojis por tipo (`📝 🎙️ 🎬 📊 📄 🖼️`) y CTAs de subida + refresh.

**Archivos:**

- `lib/actions/cognetica-forense-listado-actions.ts` — `listarArtefactosConNucleo(projectId)`.
- `app/cognetica/page.tsx` — reescrito como directorio.

---

## No hay pendientes Oleada 1

No quedan otros ajustes de Oleada 1 pendientes. Oleada 1 se cierra formalmente con esta bitácora.

---

## Siguiente paso

Apertura de Oleada 2 conforme a `docs/cognetica/guia_ruta_cascade_oleada_2.md`. Hito 1 (SQL) ya aplicado en Supabase + `lib/database.types.ts` actualizado. Próximo paso operativo: verificación formal del Hito 1 y reporte en `docs/cognetica/reportes/oleada_2/reporte_hito_1.md`.

---

*ética es negentropía a nivel de datos*
