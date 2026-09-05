// lib/preclassification/ai-interaction-log.ts
/**
 * Registro append-only de interacciones con la IA (Fase 2 de la auditoría
 * SHA-256 de preclasificación).
 *
 * Ni el prompt exacto que se le envía a la IA ni su respuesta cruda se
 * guardaban en ningún lado — solo el resultado ya parseado/validado. Esto
 * incumple lo que exige PRISMA-trAIce ("reportar los prompts", "documentar
 * el proceso de calibración") y COPE (auditabilidad/prevención de
 * falsificación vía hashes). `logAiInteraction` registra CADA intento
 * (éxito o fallo — un intento fallido también es evidencia real del
 * proceso) con el hash SHA-256 de ambos textos.
 *
 * Igual que `dimension-versioning.ts`, vive fuera de `lib/actions/` para
 * poder importarse tanto desde las server actions como desde los workflows
 * aislados (`workflows/*.ts`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sha256Hex } from "@/lib/cognetica-forense/hash";

type DbClient = SupabaseClient<Database>;

export type AiInteractionStep = "translation" | "classification" | "reconciliation";

export interface LogAiInteractionParams {
	jobId: string;
	step: AiInteractionStep;
	promptSent: string;
	responseReceived: string | null;
	aiModel: string;
	inputTokens?: number | null;
	outputTokens?: number | null;
	success: boolean;
	errorMessage?: string | null;
}

export interface LogAiInteractionResult {
	interactionId: string | null;
	error?: string;
}

export async function logAiInteraction(
	db: DbClient,
	params: LogAiInteractionParams,
): Promise<LogAiInteractionResult> {
	const promptSha256 = await sha256Hex(params.promptSent);
	const responseSha256 =
		params.responseReceived !== null ?
			await sha256Hex(params.responseReceived)
		:	null;

	const { data, error } = await db
		.from("ai_prompt_interactions")
		.insert({
			job_id: params.jobId,
			step: params.step,
			prompt_sent: params.promptSent,
			prompt_sha256: promptSha256,
			response_received: params.responseReceived,
			response_sha256: responseSha256,
			ai_model: params.aiModel,
			input_tokens: params.inputTokens ?? null,
			output_tokens: params.outputTokens ?? null,
			success: params.success,
			error_message: params.errorMessage ?? null,
		})
		.select("id")
		.single();

	if (error || !data) {
		console.error(
			`[ai-interaction-log] Error registrando interacción (job ${params.jobId}, step ${params.step}): ${error?.message}`,
		);
		return { interactionId: null, error: error?.message };
	}
	return { interactionId: data.id };
}
