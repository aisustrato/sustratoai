//. 📍 lib/cognetica-forense/deepseek-logger.ts
/**
 * Logger estructurado de llamadas DeepSeek a la tabla `cgt_logs_deepseek`.
 *
 * **Contrato:** los Server Actions que llaman a `callDeepSeek()` (en
 * `@/lib/deepseek/api.ts`) son responsables de invocar `logLlamadaDeepseek`
 * tras cada llamada (éxito o error), pasando el contexto que solo ellos
 * conocen: `artefacto_id`, `project_id`, `formato`.
 *
 * **Fail-safe:** si el INSERT falla, solo se loggea a consola y se continúa.
 * Nunca propaga el error: el logging es observabilidad, no debe romper el
 * flujo de metabolización.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import type { SupabaseClient } from "@supabase/supabase-js";

import type { CgtFormato, DeepSeekCallResult } from "@/lib/cognetica-forense/types";
import type { Database } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
/**
 * Contexto mínimo que los Server Actions proveen al logger.
 *
 * `formato` puede ser uno de los 4 canónicos o `sintesis_chunk` para las
 * llamadas intermedias del chunking (pipeline §7).
 */
export interface LogLlamadaDeepseekParams {
	supabase: SupabaseClient<Database>;
	artefactoId?: string | null;
	projectId?: string | null;
	formato: CgtFormato | "sintesis_chunk" | string;
	temperatura: number;
	/** Intento 1 = primera llamada, >1 = reintentos (opcional, default 1). */
	intento?: number;
	/** Si la llamada falló, pasar el error aquí (en vez de `result`). */
	errorMensaje?: string | null;
	/** Si la llamada tuvo éxito, pasar el result de `callDeepSeek`. */
	result?: DeepSeekCallResult;
}
//#endregion ![def]

//#region [main] - 🔧 LOGGER 🔧
/**
 * Persiste una entrada en `cgt_logs_deepseek`. No bloquea ni tira: si falla,
 * solo loggea a consola.
 */
export async function logLlamadaDeepseek(
	params: LogLlamadaDeepseekParams,
): Promise<void> {
	const {
		supabase,
		artefactoId = null,
		projectId = null,
		formato,
		temperatura,
		intento = 1,
		errorMensaje = null,
		result,
	} = params;

	try {
		const { error } = await supabase.from("cgt_logs_deepseek").insert({
			artefacto_id: artefactoId,
			project_id: projectId,
			formato,
			modelo: result?.modelUsado ?? "unknown",
			temperatura,
			tokens_input: result?.tokensInput ?? 0,
			tokens_output: result?.tokensOutput ?? 0,
			tokens_cached: result?.tokensCached ?? 0,
			costo_usd: result?.costoUsd ?? 0,
			duracion_ms: result?.duracionMs ?? 0,
			finish_reason: result?.finishReason ?? null,
			intento,
			error_mensaje: errorMensaje,
		});
		if (error) {
			console.error(
				"[cognetica-forense] log DeepSeek falló (no bloquea):",
				error,
			);
		}
	} catch (e) {
		console.error(
			"[cognetica-forense] log DeepSeek lanzó excepción (no bloquea):",
			e,
		);
	}
}
//#endregion ![main]
