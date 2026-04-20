/**
 * Barrel de tipos del módulo Cognética Forense v2 — Oleada 1.
 *
 * Re-exporta el contrato canónico de Hongo/Calibrador
 * (`cognetica_forense_types.ts`) y agrega **helpers de construcción** y un
 * **vocabulario de códigos de error** específico de este módulo.
 *
 * Entrada preferida de los consumidores:
 *   ```ts
 *   import type { CgtArtefacto, Result } from "@/lib/cognetica-forense/types";
 *   import { ok, fail } from "@/lib/cognetica-forense/types";
 *   ```
 *
 * El archivo fuente `cognetica_forense_types.ts` es el **entregable de Hongo**.
 * No se modifica sin coordinación — aquí solo se extiende.
 */

//#region [re-export] - 🔁 CONTRATO CANÓNICO + HELPERS 🔁
// Tipos de tabla, enums, inputs, Result<T,E> — entregable de Hongo.
export * from "./cognetica_forense_types";
// Helpers ok()/fail() y ResultErrorCode específicos del módulo.
export * from "./result";
//#endregion ![re-export]
