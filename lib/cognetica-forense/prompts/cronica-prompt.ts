/**
 * Prompt de la **Crónica** (metabolización narrativa fiel).
 *
 * ⚠️ PLACEHOLDER: el contenido definitivo será entregado por Hongo/Calibrador
 * en `prompts_metabolizacion_v02.md`. Cuando llegue, reemplazar el cuerpo
 * de `CRONICA_SYSTEM_PROMPT` y de `construirPromptCronica` sin modificar
 * la firma — el flujo completo ya está cableado al resto del sistema.
 */

// TODO(hongo): reemplazar con system prompt final (§5 del requerimiento).
export const CRONICA_SYSTEM_PROMPT = "[PLACEHOLDER — entregado por Hongo]";

export interface ConstruirPromptCronicaInput {
	contenidoArtefacto: string;
	tipoArtefacto: string; // CgtTipoArtefacto cuando types.ts esté completo
	incluirContracalibracion: boolean;
	floorTokens: number;
	ceilingTokens: number;
}

/**
 * Construye el user prompt para generar la Crónica.
 * Por ahora devuelve string vacío — la generación real está deshabilitada
 * hasta que llegue el prompt definitivo.
 */
export function construirPromptCronica(
	input: ConstruirPromptCronicaInput,
): string {
	// Placeholder intencional: el input se consumirá cuando llegue el prompt final.
	void input;
	return "";
}
