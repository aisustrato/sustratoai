/**
 * Tipos del dominio Cognética Forense v2 — Oleada 1.
 *
 * Contrato de referencia: `docs/standard-UI/cognetica_v2_oleada_1.sql`.
 * Los tipos concretos (CgtArtefacto, CgtCronica, etc.) se completan cuando
 * se generan desde el esquema SQL. Por ahora, solo el tipo `Result<T>`
 * que es universal al módulo.
 *
 * Si hay discrepancia entre este archivo y el SQL, el SQL es la verdad.
 */

/**
 * Resultado tipo-Rust para Server Actions.
 *
 * Uso:
 * ```ts
 * const r = await accion();
 * if (!r.ok) {
 *   // r.error disponible
 * } else {
 *   // r.data disponible
 * }
 * ```
 *
 * No se lanzan excepciones hacia el cliente — todo error viaja en `error`.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: ResultErrorCode };

/**
 * Códigos de error estables para consumo programático.
 * Agregar aquí cuando se necesiten nuevos tipos de falla.
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
  | "INTERNAL";

/** Helper para construir un resultado exitoso. */
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

/** Helper para construir un resultado con error. */
export const fail = (
  error: string,
  code: ResultErrorCode = "INTERNAL"
): Result<never> => ({ ok: false, error, code });
