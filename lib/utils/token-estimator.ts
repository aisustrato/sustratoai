// 📍 lib/utils/token-estimator.ts
// 🎯 PROPÓSITO: Estimación aproximada de tokens para prompts
// 🔧 DECISIÓN: Regla simple ~4 caracteres = 1 token (conservador)

//#region [types] - 🎨 TIPOS

/**
 * Tipo para fuentes de Cognetica
 */
interface CogneticaSource {
	id: string;
	fragmento: string;
	referencia_formal: string;
}

/**
 * Desglose de tokens por fuente individual
 */
export interface SourceTokenBreakdown {
	id: string;
	fragmento_tokens: number;
	referencia_tokens: number;
	total: number;
}

/**
 * Desglose completo del contexto de sesión
 */
export interface SessionContextTokenBreakdown {
	// Por componente principal
	texto_original: number;
	texto_limpio: number;
	fuentes_total: number;
	fuentes_por_item: SourceTokenBreakdown[];
	historial: number;
	metadata: number;

	// Sub-desglose de fuentes
	fuentes_detalle: {
		estructura_json: number;
		contenido_puro: number;
		referencias_formales: number;
		fragmentos: number;
	};

	// Totales
	total_input: number;
	estimated_output: number; // Estimación para respuesta de IA
	total_conversation: number; // input + output estimado
}

//#endregion

//#region [core] - 💎 FUNCIONES PRINCIPALES

/**
 * Estima tokens aproximados de un texto
 * Usa regla conservadora: ~4 caracteres = 1 token
 */
export function estimateTokens(text: string): number {
	if (!text) return 0;
	// Regla conservadora: 4 caracteres por token en promedio
	return Math.ceil(text.length / 4);
}

/**
 * Estima tokens de un objeto JSON serializado
 */
export function estimateTokensFromJSON(obj: unknown): number {
	const jsonString = JSON.stringify(obj);
	return estimateTokens(jsonString);
}

/**
 * Estima tokens de JSON formateado (con indentación)
 */
export function estimateTokensFromJSONFormatted(
	obj: unknown,
	indent: number = 2,
): number {
	const jsonString = JSON.stringify(obj, null, indent);
	return estimateTokens(jsonString);
}

/**
 * Formatea número de tokens con separadores de miles
 */
export function formatTokenCount(tokens: number): string {
	return tokens.toLocaleString("es-ES");
}

/**
 * Calcula tokens por fuente individual (CogneticaSource)
 */
export function estimateSourceTokens(source: {
	id: string;
	fragmento: string;
	referencia_formal: string;
}): SourceTokenBreakdown {
	const fragmento_tokens = estimateTokens(source.fragmento || "");
	const referencia_tokens = estimateTokens(source.referencia_formal || "");

	return {
		id: source.id,
		fragmento_tokens,
		referencia_tokens,
		total: fragmento_tokens + referencia_tokens,
	};
}

/**
 * Calcula desglose completo de todas las fuentes
 */
export function estimateSourcesTokens(
	sources: Array<{
		id: string;
		fragmento: string;
		referencia_formal: string;
	}>,
): {
	por_fuente: SourceTokenBreakdown[];
	totales: {
		fragmentos: number;
		referencias: number;
		estructura_json: number;
		total: number;
	};
} {
	// Calcular por fuente individual
	const por_fuente = sources.map(estimateSourceTokens);

	// Sumar totales
	const fragmentos = por_fuente.reduce((acc, s) => acc + s.fragmento_tokens, 0);
	const referencias = por_fuente.reduce(
		(acc, s) => acc + s.referencia_tokens,
		0,
	);
	const contenido_puro = fragmentos + referencias;

	// Calcular estructura JSON (lo que no es contenido puro)
	const fuentesJSON = JSON.stringify(sources, null, 2);
	const estructura_json = Math.max(
		0,
		estimateTokens(fuentesJSON) - contenido_puro,
	);

	return {
		por_fuente,
		totales: {
			fragmentos,
			referencias,
			estructura_json,
			total: contenido_puro + estructura_json,
		},
	};
}

/**
 * Calcula costo aproximado en tokens de un SessionContext completo
 * Versión mejorada con desglose detallado por fuente
 */
export function estimateSessionContextTokensDetailed(context: {
	texto_humano_original: string;
	texto_limpio_por_deslixador?: string;
	fuentes_cognetica_relevantes: CogneticaSource[];
	historial_interacciones: unknown[];
	arquetipos_ya_actuados_en_seccion: string[];
	formato_paper: unknown;
}): SessionContextTokenBreakdown {
	// Textos
	const texto_original = estimateTokens(context.texto_humano_original);
	const texto_limpio = estimateTokens(
		context.texto_limpio_por_deslixador || "",
	);

	// Fuentes con desglose completo
	const fuentesBreakdown = estimateSourcesTokens(
		context.fuentes_cognetica_relevantes,
	);

	// Historial y metadata
	const historial = estimateTokensFromJSONFormatted(
		context.historial_interacciones,
	);
	const metadata = estimateTokensFromJSONFormatted({
		arquetipos: context.arquetipos_ya_actuados_en_seccion,
		formato: context.formato_paper,
	});

	// Calcular totales
	const total_input =
		texto_original +
		texto_limpio +
		fuentesBreakdown.totales.total +
		historial +
		metadata;

	// Estimar output (respuesta de IA típica: ~30% del input)
	const estimated_output = Math.ceil(total_input * 0.3);

	return {
		texto_original,
		texto_limpio,
		fuentes_total: fuentesBreakdown.totales.total,
		fuentes_por_item: fuentesBreakdown.por_fuente,
		historial,
		metadata,
		fuentes_detalle: {
			estructura_json: fuentesBreakdown.totales.estructura_json,
			contenido_puro:
				fuentesBreakdown.totales.fragmentos +
				fuentesBreakdown.totales.referencias,
			referencias_formales: fuentesBreakdown.totales.referencias,
			fragmentos: fuentesBreakdown.totales.fragmentos,
		},
		total_input,
		estimated_output,
		total_conversation: total_input + estimated_output,
	};
}

/**
 * Versión legacy: mantiene compatibilidad con código existente
 * @deprecated Usar estimateSessionContextTokensDetailed para nuevo código
 */
export function estimateSessionContextTokens(context: {
	texto_humano_original: string;
	texto_limpio_por_deslixador?: string;
	fuentes_cognetica_relevantes: CogneticaSource[];
	historial_interacciones: unknown[];
	arquetipos_ya_actuados_en_seccion: string[];
	formato_paper: unknown;
}): {
	texto_original: number;
	texto_limpio: number;
	fuentes: number;
	fuentes_detalle: {
		estructura_json: number;
		contenido: number;
	};
	historial: number;
	metadata: number;
	total: number;
} {
	const detailed = estimateSessionContextTokensDetailed(context);

	return {
		texto_original: detailed.texto_original,
		texto_limpio: detailed.texto_limpio,
		fuentes: detailed.fuentes_total,
		fuentes_detalle: {
			estructura_json: detailed.fuentes_detalle.estructura_json,
			contenido: detailed.fuentes_detalle.contenido_puro,
		},
		historial: detailed.historial,
		metadata: detailed.metadata,
		total: detailed.total_input,
	};
}

//#endregion

//#region [api-format] - 📡 FORMATO PARA API

/**
 * Prepara el desglose de tokens para enviar a la API
 * Incluye metadatos del cálculo para debugging
 */
export function prepareTokenPayloadForAPI(
	promptText: string,
	responseText: string,
	contextBreakdown?: SessionContextTokenBreakdown,
): {
	input_tokens: number;
	output_tokens: number;
	total_tokens: number;
	metadata: {
		calculado_en: string;
		metodo: string;
		desglose_contexto?: SessionContextTokenBreakdown;
	};
} {
	const input_tokens =
		contextBreakdown?.total_input || estimateTokens(promptText);
	const output_tokens = estimateTokens(responseText);

	return {
		input_tokens,
		output_tokens,
		total_tokens: input_tokens + output_tokens,
		metadata: {
			calculado_en: new Date().toISOString(),
			metodo: "regla_4chars_por_token",
			desglose_contexto: contextBreakdown,
		},
	};
}

/**
 * Crea resumen legible del desglose de tokens para logs/UI
 */
export function createTokenSummary(
	breakdown: SessionContextTokenBreakdown,
): string {
	const lines = [
		"📊 DESGLOSE DE TOKENS",
		"━━━━━━━━━━━━━━━━━━━━━━━",
		`📝 Texto original:      ${formatTokenCount(breakdown.texto_original)}`,
		`✨ Texto limpio:        ${formatTokenCount(breakdown.texto_limpio)}`,
		``,
		`📚 FUENTES (${breakdown.fuentes_por_item.length} items):`,
		`   └─ Total:            ${formatTokenCount(breakdown.fuentes_total)}`,
		`   ├─ Fragmentos:       ${formatTokenCount(breakdown.fuentes_detalle.fragmentos)}`,
		`   ├─ Referencias:      ${formatTokenCount(breakdown.fuentes_detalle.referencias_formales)}`,
		`   └─ Estructura JSON:  ${formatTokenCount(breakdown.fuentes_detalle.estructura_json)}`,
		``,
		`💬 Historial:           ${formatTokenCount(breakdown.historial)}`,
		`⚙️  Metadata:            ${formatTokenCount(breakdown.metadata)}`,
		``,
		"📈 TOTALES:",
		`   ├─ Input:            ${formatTokenCount(breakdown.total_input)}`,
		`   ├─ Output (est.):    ${formatTokenCount(breakdown.estimated_output)}`,
		`   └─ Conversación:     ${formatTokenCount(breakdown.total_conversation)}`,
		"━━━━━━━━━━━━━━━━━━━━━━━",
	];

	// Agregar desglose por fuente si hay pocas (para no saturar)
	if (
		breakdown.fuentes_por_item.length > 0 &&
		breakdown.fuentes_por_item.length <= 5
	) {
		lines.push("", "🔍 POR FUENTE:");
		breakdown.fuentes_por_item.forEach((fuente, i) => {
			lines.push(
				`   ${i + 1}. ${fuente.id.slice(0, 8)}...  ${formatTokenCount(fuente.total)} tokens`,
			);
		});
	}

	return lines.join("\n");
}

//#endregion
