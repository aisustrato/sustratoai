//. 📍 lib/deepseek/api.ts
/**
 * Cliente DeepSeek compartido por toda la app.
 *
 * Dos APIs coexisten:
 *
 *   1. `callDeepSeekAPI(model, text)` — **legacy**, usado por papers y
 *      preclasificación académica. Minimalista (temperature 0.2, max 8192,
 *      user prompt único). No se extiende.
 *
 *   2. `callDeepSeek(config)` — **nuevo**, introducido por pipeline de
 *      metabolización v1 (`docs/cognetica/pipeline_metabolizacion_v1.md §4`).
 *      Soporta config per-llamada completa: modelo, temperatura, system +
 *      user separados, `response_format` (text/json_object), backoff
 *      exponencial, timeout duro, cálculo de costo con cache hit,
 *      separación de `reasoning_content` vs `content`.
 *
 * Ambas conviven. La legacy se mantiene por retrocompatibilidad.
 */

//#region [head] - �️ IMPORTS 🏷️
import type {
	DeepSeekCallConfig,
	DeepSeekCallResult,
	DeepSeekModelo,
} from "@/lib/cognetica-forense/cognetica_forense_types_addendum_v11";
//#endregion ![head]

//#region [def] - 🎯 TARIFAS Y CONSTANTES 🎯
/**
 * Tarifas DeepSeek vigentes a abril 2026 (pipeline §1 y §10).
 *
 * Precios en USD por 1M de tokens. `cachePorMillon` aplica al fragmento
 * del input que la API reporta como cacheado (prefijo idéntico a llamadas
 * previas — 90% de descuento aproximado).
 *
 * **Actualizar** cuando DeepSeek publique cambios. Centralizado aquí para
 * no hardcodear en cada llamada.
 */
export const TARIFAS_DEEPSEEK: Record<
	DeepSeekModelo,
	{ inputPorMillon: number; cachePorMillon: number; outputPorMillon: number }
> = {
	"deepseek-chat": {
		inputPorMillon: 0.28,
		cachePorMillon: 0.028,
		outputPorMillon: 0.42,
	},
	"deepseek-reasoner": {
		inputPorMillon: 0.55,
		cachePorMillon: 0.14,
		outputPorMillon: 2.19,
	},
};

/** Secuencia de backoff exponencial en ms (pipeline §9). */
const BACKOFF_SEQUENCE_MS = [1000, 2000, 4000, 8000];

/** Timeout duro default por llamada (10 min — DeepSeek cierra conexiones largas). */
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

/** HTTP status codes que ameritan reintento con backoff. */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
//#endregion ![def]

//#region [helpers] - �️ CÁLCULO DE COSTO 🛠️
/**
 * Calcula el costo USD de una llamada según el modelo y el reporte de
 * tokens (input, output, cache hit). Pipeline §10.
 */
export function calcularCostoDeepSeek(
	modelo: DeepSeekModelo,
	tokensInput: number,
	tokensOutput: number,
	tokensCached: number,
): number {
	const tarifas = TARIFAS_DEEPSEEK[modelo];
	const tokensInputNoCacheados = Math.max(0, tokensInput - tokensCached);
	return (
		(tokensInputNoCacheados / 1_000_000) * tarifas.inputPorMillon +
		(tokensCached / 1_000_000) * tarifas.cachePorMillon +
		(tokensOutput / 1_000_000) * tarifas.outputPorMillon
	);
}
//#endregion ![helpers]

//#region [main] - 🔧 CLIENTE LEGACY 🔧
/**
 * Cliente DeepSeek legacy. **No usar en código nuevo** — queda para compat
 * con papers/preclasificación. Convierte el texto en un único user prompt,
 * temperatura y `max_tokens` fijos, sin system ni response_format.
 */
export async function callDeepSeekAPI(model: string, text: string) {
	const apiKey = process.env.DEEPSEEK_API_KEY;
	if (!apiKey) {
		throw new Error("La clave de API de DeepSeek no está configurada.");
	}

	const response = await fetch(DEEPSEEK_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: model,
			messages: [{ role: "user", content: text }],
			temperature: 0.2,
			max_tokens: 8192,
			top_p: 1,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Error en API de DeepSeek: ${response.status} - ${errorText}`,
		);
	}

	const data = await response.json();
	const textResult = data.choices?.[0]?.message?.content ?? "";
	const usageMetadata = {
		promptTokenCount: data.usage?.prompt_tokens || 0,
		candidatesTokenCount: data.usage?.completion_tokens || 0,
		totalTokenCount: data.usage?.total_tokens || 0,
	};

	return { result: textResult, usage: usageMetadata };
}
//#endregion ![main]

//#region [main] - 🔧 CLIENTE NUEVO (callDeepSeek) 🔧
/**
 * Cliente DeepSeek completo para el pipeline de metabolización v1.
 *
 * Características:
 *   - System + user prompts separados (aprovecha cache hit del prefijo).
 *   - `response_format` opcional (`text` o `json_object`).
 *   - Backoff exponencial automático en errores 429/5xx.
 *   - Timeout duro configurable (default 10 min).
 *   - `reasoning_content` separado de `content` (solo `deepseek-reasoner`).
 *   - Cálculo de costo con cache hit reportado por la API.
 *
 * **No logea automáticamente a `cgt_logs_deepseek`**: el logging vive en
 * un helper a nivel Server Action (para que tenga acceso a `artefacto_id`,
 * `project_id`, y al cliente Supabase). Ver
 * `@/lib/cognetica-forense/deepseek-logger.ts`.
 */
export async function callDeepSeek(
	config: DeepSeekCallConfig,
): Promise<DeepSeekCallResult> {
	const apiKey = process.env.DEEPSEEK_API_KEY;
	if (!apiKey) {
		throw new Error("La clave de API de DeepSeek no está configurada.");
	}

	const maxRetries = config.retries ?? 3;
	const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	let lastError: unknown = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await callDeepSeekOnce(config, apiKey, timeoutMs);
		} catch (err) {
			lastError = err;
			if (!isRetryable(err) || attempt === maxRetries) {
				throw err;
			}
			const waitMs =
				BACKOFF_SEQUENCE_MS[Math.min(attempt, BACKOFF_SEQUENCE_MS.length - 1)];
			await sleep(waitMs);
		}
	}

	// Inalcanzable — el último intento tira o retorna. Satisface al linter.
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Una llamada individual a DeepSeek (sin backoff). La maneja `callDeepSeek`.
 *
 * Usa `AbortController` para timeout duro: si la respuesta no llega en
 * `timeoutMs`, se aborta y se propaga como `Error` retryable.
 */
async function callDeepSeekOnce(
	config: DeepSeekCallConfig,
	apiKey: string,
	timeoutMs: number,
): Promise<DeepSeekCallResult> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	const startedAt = Date.now();
	let response: Response;
	try {
		response = await fetch(DEEPSEEK_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: config.model,
				messages: [
					{ role: "system", content: config.systemPrompt },
					{ role: "user", content: config.userPrompt },
				],
				temperature: config.temperature,
				max_tokens: config.maxTokens,
				...(config.responseFormat ?
					{ response_format: config.responseFormat }
				:	{}),
			}),
			signal: controller.signal,
		});
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			throw new DeepSeekRetryableError(
				`Timeout tras ${timeoutMs}ms llamando a DeepSeek`,
			);
		}
		// Errores de red son retryable.
		throw new DeepSeekRetryableError(
			`Fallo de red llamando a DeepSeek: ${(err as Error).message}`,
		);
	} finally {
		clearTimeout(timer);
	}

	if (!response.ok) {
		const bodyText = await response.text().catch(() => "");
		const message = `DeepSeek ${response.status}: ${bodyText}`;
		if (RETRYABLE_STATUS.has(response.status)) {
			throw new DeepSeekRetryableError(message);
		}
		throw new Error(message);
	}

	const data = await response.json();
	const choice = data.choices?.[0];
	const finishReasonRaw = choice?.finish_reason ?? "error";
	const finishReason: DeepSeekCallResult["finishReason"] =
		(
			finishReasonRaw === "stop" ||
			finishReasonRaw === "length" ||
			finishReasonRaw === "content_filter"
		) ?
			finishReasonRaw
		:	"error";

	const content: string = choice?.message?.content ?? "";
	const reasoningContent: string | undefined =
		choice?.message?.reasoning_content ?? undefined;

	const tokensInput: number = data.usage?.prompt_tokens ?? 0;
	const tokensOutput: number = data.usage?.completion_tokens ?? 0;
	// DeepSeek reporta cache hit en `prompt_cache_hit_tokens`. Si el campo
	// no viene (modelo antiguo), asumimos 0.
	const tokensCached: number =
		data.usage?.prompt_cache_hit_tokens ??
		data.usage?.cache_creation_input_tokens ??
		0;
	// Tokens del chain-of-thought interno del reasoner. Sólo viene con
	// `deepseek-reasoner`; con `deepseek-chat` queda `undefined`. Ver JSDoc
	// de `DeepSeekCallResult.tokensReasoning` para el contrato.
	const tokensReasoningRaw =
		data.usage?.completion_tokens_details?.reasoning_tokens;
	const tokensReasoning: number | undefined =
		typeof tokensReasoningRaw === "number" ? tokensReasoningRaw : undefined;

	const costoUsd = calcularCostoDeepSeek(
		config.model,
		tokensInput,
		tokensOutput,
		tokensCached,
	);

	return {
		content,
		reasoningContent,
		tokensInput,
		tokensOutput,
		tokensReasoning,
		tokensCached,
		costoUsd,
		modelUsado: data.model ?? config.model,
		duracionMs: Date.now() - startedAt,
		finishReason,
	};
}
//#endregion ![main]

//#region [helpers] - 🛠️ UTILIDADES INTERNAS 🛠️
/**
 * Marcador de error retryable: status 429/5xx, timeout, error de red.
 * No-retryables: 400, 401, 403, 404, 422 (config inválida, auth, etc.).
 */
class DeepSeekRetryableError extends Error {
	readonly retryable = true;
	constructor(message: string) {
		super(message);
		this.name = "DeepSeekRetryableError";
	}
}

function isRetryable(err: unknown): boolean {
	return err instanceof DeepSeekRetryableError;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
//#endregion ![helpers]
