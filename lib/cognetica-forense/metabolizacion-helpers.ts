//. 📍 lib/cognetica-forense/metabolizacion-helpers.ts
/**
 * Helpers compartidos por los Server Actions de metabolización.
 *
 * No son server actions — son utilidades de módulo que los generadores
 * consumen. Vivir fuera de `/lib/actions/` permite importarlos sin forzar
 * `"use server"` en los consumidores (ej. rutas API o scripts).
 *
 * Cubre:
 *   - Autenticación + validación de proyecto (RPC `has_permission_in_project`).
 *   - Detección de placeholders de prompts (gate de seguridad hasta que
 *     Hongo entregue `prompts_metabolizacion_v1.md`).
 *   - Renderizado Destilado → Markdown (para alimentar al Núcleo y al
 *     Germinal) y Destilado → JSON canónico (para hashear).
 *   - Actualización del estado del artefacto y campo `error_mensaje`.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type { SupabaseClient } from "@supabase/supabase-js";

import { sha256Hex } from "./hash";
import type {
	CgtCronica,
	CgtDestilado,
	CgtEstadoMetabolizacion,
	DeepSeekCallResult,
	Result,
	ResultErrorCode,
} from "./types";
import { fail, ok } from "./result";
import { canonicalStringify } from "./utils/json-canonical";
import type { Database } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 🎯 CONSTANTES 🎯
/** Permiso requerido para metabolizar (mismo que ingesta). */
export const PERMISO_GESTIONAR_COGNETICA = "can_manage_master_data";

/**
 * Marcador que usan los archivos `*-prompt.ts` placeholder. Si la constante
 * `SYSTEM_PROMPT` contiene este substring, la generación aborta con
 * `NOT_IMPLEMENTED` y mensaje explicando que faltan los prompts reales.
 */
export const PROMPT_PLACEHOLDER_MARKER = "PLACEHOLDER";

/** Versión de esquema de los formatos generados por el pipeline v1. */
export const VERSION_ESQUEMA_FORMATOS = "v0.3";

/** Nombre del "nodo generador" que firma los artefactos creados por Cascade. */
export const NODO_GENERADOR_CASCADE = "cascade-pipeline-v1";
//#endregion ![def]

//#region [helpers] - 🛠️ AUTENTICACIÓN Y PERMISOS 🛠️
/**
 * Obtiene el usuario autenticado y verifica permiso de gestión sobre el
 * proyecto del artefacto. Retorna `ok({ userId, projectId })` o un código
 * de error discriminado.
 */
export async function asegurarAccesoArtefacto(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<
	Result<
		{ userId: string; projectId: string; estado: CgtEstadoMetabolizacion },
		ResultErrorCode
	>
> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return fail<ResultErrorCode>("UNAUTHORIZED");

	const { data: art, error } = await supabase
		.from("cgt_artefactos")
		.select("project_id, estado")
		.eq("id", artefactoId)
		.maybeSingle();

	if (error) {
		console.error("[metabolizacion-helpers] lookup artefacto:", error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!art) return fail<ResultErrorCode>("NOT_FOUND");

	const { data: permitido, error: rpcError } = await supabase.rpc(
		"has_permission_in_project",
		{
			p_user_id: user.id,
			p_project_id: art.project_id,
			p_permission_column: PERMISO_GESTIONAR_COGNETICA,
		},
	);
	if (rpcError || permitido !== true) {
		return fail<ResultErrorCode>("FORBIDDEN");
	}

	return ok({
		userId: user.id,
		projectId: art.project_id,
		estado: art.estado as CgtEstadoMetabolizacion,
	});
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ GATE DE PROMPTS 🛠️
/**
 * Devuelve `true` si el `systemPrompt` y el `userPrompt` están implementados
 * (no placeholder ni vacío). Cuando Hongo entregue los prompts reales y se
 * reemplacen las constantes, este gate abrirá automáticamente.
 */
export function promptsListos(
	systemPrompt: string,
	userPrompt: string,
): boolean {
	if (!systemPrompt || !userPrompt) return false;
	if (systemPrompt.includes(PROMPT_PLACEHOLDER_MARKER)) return false;
	return true;
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ ESTADO DEL ARTEFACTO 🛠️
/**
 * Actualiza `cgt_artefactos.estado` (y opcionalmente `error_mensaje`).
 * No-op silencioso si el artefacto no existe o el update falla — los
 * callers deben haber asegurado acceso antes.
 */
export async function actualizarEstadoArtefacto(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
	estado: CgtEstadoMetabolizacion,
	errorMensaje: string | null = null,
): Promise<void> {
	const { error } = await supabase
		.from("cgt_artefactos")
		.update({ estado, error_mensaje: errorMensaje })
		.eq("id", artefactoId);
	if (error) {
		console.error(
			"[metabolizacion-helpers] update estado falló (no bloquea):",
			error,
		);
	}
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ RENDERIZADO Y HASH DE DESTILADO 🛠️
/**
 * Renderiza un Destilado a Markdown legible. Usado como:
 *   - Input del Núcleo (contexto de derivación).
 *   - Fragmento del Germinal.
 *   - Contenido de descarga del formato Destilado (`descargarFormato`).
 */
export function renderizarDestiladoComoMarkdown(d: CgtDestilado): string {
	const mov = Array.isArray(d.movimientos) ? d.movimientos : [];
	const ten = Array.isArray(d.tensiones) ? d.tensiones : [];

	const movStr =
		mov.length ?
			mov
				.map(
					(m, i) =>
						`${i + 1}. **${m.desde ?? "—"} → ${m.hacia ?? "—"}**: ${m.texto}`,
				)
				.join("\n")
		:	"_(sin movimientos detectados)_";

	const tenStr =
		ten.length ?
			ten.map((t) => `- [${t.tipo}] ${t.texto}`).join("\n")
		:	"_(sin tensiones identificadas)_";

	const citaStr =
		d.cita_nucleo ?
			`> "${d.cita_nucleo.texto}"\n> — ${d.cita_nucleo.ubicacion}` +
			(d.cita_nucleo.autor ? ` · ${d.cita_nucleo.autor}` : "")
		:	"_(sin cita núcleo)_";

	return [
		`## Tesis`,
		d.tesis,
		``,
		`## Movimientos`,
		movStr,
		``,
		`## Tensiones`,
		tenStr,
		``,
		`## Cita núcleo`,
		citaStr,
	].join("\n");
}

/**
 * Calcula el hash SHA-256 del JSON canónico de los campos centrales del
 * Destilado. Lo usan `cgt_nucleos.hash_destilado_upstream` y
 * `cgt_germinales.hash_destilado_upstream` para la cascada de invalidación
 * (spec v0.3 §5).
 */
export async function hashCanonicoDestilado(d: CgtDestilado): Promise<string> {
	const canonico = {
		tesis: d.tesis,
		movimientos: d.movimientos,
		tensiones: d.tensiones,
		cita_nucleo: d.cita_nucleo,
		version_esquema: d.version_esquema,
	};
	return sha256Hex(canonicalStringify(canonico));
}

/**
 * Hash del `contenido` de la Crónica. Usa `sha256Hex` sobre el string plano
 * (no canonicalización; la Crónica es texto, no estructura).
 */
export async function hashCronica(c: CgtCronica): Promise<string> {
	return sha256Hex(c.contenido);
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ TOKENS DE CONTENIDO 🛠️
/**
 * Calcula los **tokens efectivos del output semántico** de una llamada
 * LLM, excluyendo el chain-of-thought interno del reasoner.
 *
 * Es el valor que debe persistirse como `tokens_count` en cada formato
 * (`cgt_cronicas`, `cgt_destilados`, `cgt_nucleos`, `cgt_germinales`)
 * para cumplir los CHECK constraints de cap semántico de la DB
 * (p. ej. `chk_destilado_tokens_cap` ≤ 1500).
 *
 * Con `deepseek-chat`: `tokensReasoning === undefined` → retorna
 * `tokensOutput` tal cual.
 *
 * Con `deepseek-reasoner`: retorna `tokensOutput - tokensReasoning`, que
 * representa los tokens del JSON/texto final entregado, sin el CoT.
 *
 * El valor nunca es negativo (se clamp-ea a 0 por defensa).
 */
export function tokensContentDe(result: DeepSeekCallResult): number {
	return Math.max(0, result.tokensOutput - (result.tokensReasoning ?? 0));
}
//#endregion ![helpers]
