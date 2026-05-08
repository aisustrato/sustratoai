/**
 * Constantes y tipos compartidos del pipeline de metabolización.
 *
 * Este módulo existe porque `lib/actions/cognetica-forense-metabolizacion-actions.ts`
 * declara `"use server"`, y Next.js 14 sólo permite exportar funciones `async`
 * desde archivos server action (cualquier otro `export` — strings, interfaces,
 * constantes — rompe el build con "A 'use server' file can only export async
 * functions").
 *
 * No agregar `"use server"` aquí. Este archivo es consumido por:
 *   - el orquestador (server-side)
 *   - la UI (client-side) para mapear resultados y mensajes
 */

/**
 * Mensaje de error que devuelve el orquestador cuando los system prompts de
 * metabolización todavía son placeholders. En la v1 de prompts esto ya no
 * debería dispararse en runtime, pero se mantiene como salvavidas por si
 * un prompt vuelve a dejarse vacío durante una refactorización.
 */
export const ERR_PROMPT_PENDIENTE =
	"Los system prompts de metabolización aún no fueron entregados. " +
	"Reemplazar los placeholders en `/lib/cognetica-forense/prompts/*-prompt.ts` " +
	"cuando llegue `prompts_metabolizacion_v1.md` de Hongo.";

/**
 * Resumen del resultado del orquestador `metabolizarArtefacto`.
 *
 * Cada paso puede estar en uno de cinco estados:
 *   - `"no_corrido"`  → el orquestador ni siquiera llegó a evaluarlo
 *     (p. ej. falló un paso upstream irrecuperable).
 *   - `"generado"`    → generado en esta invocación.
 *   - `"reutilizado"` → la fila ya existía en DB y se usó tal cual
 *     (resume-from-last). No hubo llamada al LLM.
 *   - `"omitido"`     → sólo aplica al Germinal — omitido porque el
 *     proyecto no alcanza el umbral de corpus previo (v2 de prompts).
 *     En v1 atómica nunca se emite.
 *   - `"error"`       → falló su generación (accionable: "Reintentar").
 */
export type EstadoPaso =
	| "no_corrido"
	| "generado"
	| "reutilizado"
	| "omitido"
	| "error";

export interface ResumenMetabolizacion {
	cronica: EstadoPaso;
	destilado: EstadoPaso;
	nucleo: EstadoPaso;
	germinal: EstadoPaso;
}
