/**
 * Prompt del **Destilado** (tesis + movimientos + tensiones + cita núcleo).
 *
 * ⚠️ PLACEHOLDER: reemplazar cuando Hongo entregue `prompts_metabolizacion_v02.md`.
 */

import { DESTILADO_HARD_CAP } from "../utils/token-counter";

// TODO(hongo): reemplazar con system prompt final.
export const DESTILADO_SYSTEM_PROMPT = "[PLACEHOLDER — entregado por Hongo]";

export interface ConstruirPromptDestiladoInput {
	contenidoArtefacto: string;
	cronicaRenderizada: string; // contexto narrativo
	intentoReintento?: number; // 0 = primer intento, 1..2 = reintentos por exceso de tokens
}

export function construirPromptDestilado(
	input: ConstruirPromptDestiladoInput,
): string {
	void input;
	return "";
}

export { DESTILADO_HARD_CAP };
