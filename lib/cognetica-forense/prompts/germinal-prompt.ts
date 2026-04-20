/**
 * Prompt del **Germinal parcial** (Oleada 1).
 *
 * Genera únicamente el resumen narrativo de conexiones potenciales.
 * Capa A (resonancias) y Capa B (proyecciones) se difieren a Oleada 2.
 *
 * ⚠️ PLACEHOLDER: reemplazar cuando Hongo entregue los prompts finales.
 */

// TODO(hongo): reemplazar con system prompt final.
export const GERMINAL_SYSTEM_PROMPT = "[PLACEHOLDER — entregado por Hongo]";

export interface ConstruirPromptGerminalInput {
	destiladoActual: string;
	destiladosPreviosDelProyecto: Array<{
		id: string;
		tesis: string;
	}>;
}

export function construirPromptGerminal(
	input: ConstruirPromptGerminalInput,
): string {
	void input;
	return "";
}
