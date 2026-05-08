//. 📍 lib/cognetica-forense/result.ts
/**
 * Helpers de construcción para el tipo `Result<T, E>` de Hongo, más el
 * vocabulario estable de códigos de error del módulo Cognética Forense.
 *
 * Vive en un archivo separado de `types.ts` para poder re-exportarse vía
 * `export *` sin colisionar con el re-export del contrato canónico (el tipo
 * `Result` se define en `cognetica_forense_types.ts` y no se vuelve a declarar
 * aquí — solo se consume).
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type { Result } from "./cognetica_forense_types";
//#endregion ![head]

//#region [def] - 🎯 CÓDIGOS DE ERROR 🎯
/**
 * Vocabulario estable de códigos de error del módulo.
 *
 * Permite consumo programático (ej: mostrar UIs distintas según el código)
 * sin depender del contenido textual del `error`. Uso sugerido:
 *
 * ```ts
 * type IngestaResult = Result<CgtArtefacto, ResultErrorCode>;
 * return fail<ResultErrorCode>("NOT_IMPLEMENTED");
 * ```
 *
 * Cuando no se necesita discriminador tipado, `Result<T>` (E = string por
 * defecto) sigue siendo válido y está pensado para errores user-facing.
 */
export type ResultErrorCode =
	| "NOT_IMPLEMENTED"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "INVALID_INPUT"
	| "DUPLICATE"
	| "STORAGE_ERROR"
	| "TRANSCRIPTION_ERROR"
	| "LLM_ERROR"
	/** Faltante de un formato upstream requerido (ej. Núcleo requiere Destilado). */
	| "MISSING_UPSTREAM"
	/** Umbral no cumplido (ej. Germinal requiere ≥3 artefactos con Núcleo previos). */
	| "THRESHOLD_NOT_MET"
	| "INTERNAL";
//#endregion ![def]

//#region [helpers] - 🛠️ CONSTRUCTORES 🛠️
/**
 * Construye un `Result` exitoso.
 *
 * ```ts
 * return ok(artefacto);
 * ```
 */
export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });

/**
 * Construye un `Result` fallido. `E` es genérico con default `string`.
 *
 * ```ts
 * return fail("El archivo excede el tamaño permitido");
 * return fail<ResultErrorCode>("NOT_IMPLEMENTED");
 * ```
 */
export const fail = <E = string>(error: E): Result<never, E> => ({
	ok: false,
	error,
});
//#endregion ![helpers]
