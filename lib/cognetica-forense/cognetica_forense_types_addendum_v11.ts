/**
 * Cognética Forense — Tipos TypeScript Addendum v1.1
 *
 * Extiende el contrato canónico `cognetica_forense_types.ts` (de Hongo)
 * con los tipos nuevos introducidos por el addendum v1.1 al requerimiento
 * (ver `docs/cognetica/addendum_requerimiento_windsurf_v11.md`) y por el
 * pipeline de metabolización v1 (`docs/cognetica/pipeline_metabolizacion_v1.md`).
 *
 * **Regla de coordinación**: el archivo canónico de Hongo **no se toca**.
 * Cualquier cambio de spec entra aquí. Si algo del canónico queda obsoleto,
 * este archivo lo reemplaza explícitamente (con comentario que lo diga).
 *
 * Novedades cubiertas:
 *   - `CgtNucleo` — 4° formato (spec v0.3 §4.3)
 *   - Hashes upstream para cascada de invalidación (addendum §8)
 *   - Cliente DeepSeek extendido: config y resultado (pipeline §4)
 *   - Logging estructurado: `CgtLogDeepseek` (pipeline §11)
 *   - Tipos de descarga granular (addendum §5.2)
 *   - Tipo de exportación de tríada (addendum §5.3)
 *   - `ArtefactoCompletoV11` que incluye el núcleo
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type {
	CgtCitaNucleo,
	CgtGerminal,
	CgtOrigen,
	CgtVisibilidad,
	ArtefactoCompleto as ArtefactoCompletoBase,
} from "./cognetica_forense_types";
//#endregion ![head]

//#region [def] - 📦 NÚCLEO (4° FORMATO) 📦

/**
 * Núcleo: tarjeta de presentación irreductible derivada del Destilado.
 *
 * Shape alineado a `cgt_nucleos` (ver `SQL_COGNETICA_V2_OLEADA_1_ADDENDUM.sql`).
 * Hard cap de 600 tokens enforzado también a nivel DB.
 */
export interface CgtNucleo {
	id: string;
	artefacto_id: string;
	project_id: string;

	tesis: string;
	movimientos_esenciales: CgtMovimientoNucleo[];
	tension_irreductible: string | null;
	cita_nucleo: CgtCitaNucleo | null;

	tokens_count: number | null;

	/** Hash SHA-256 del JSON canónico del Destilado del que se derivó. */
	hash_destilado_upstream: string;

	generado_por: CgtOrigen;
	nodo_generador: string | null;
	modelo_ia: string | null;
	version_esquema: string;

	costo_usd: number | null;
	tokens_input: number | null;
	tokens_output: number | null;

	visibilidad: CgtVisibilidad;

	created_at: string;
	updated_at: string;
}

/**
 * Movimiento esencial del Núcleo: compresión del `CgtMovimiento` del Destilado
 * (pierde `desde`/`hacia` explícitos; conserva solo `orden` y `texto`).
 */
export interface CgtMovimientoNucleo {
	orden: number;
	texto: string;
}

//#endregion ![def]

//#region [def] - 📦 CASCADA DE INVALIDACIÓN 📦

/**
 * Extensión de `CgtGerminal` con hashes upstream (addendum §8).
 *
 * Se introduce via `ALTER TABLE cgt_germinales ADD COLUMN`. El tipo base
 * de Hongo no los tiene — este override los hace visibles a TS.
 */
export interface CgtGerminalV11 extends CgtGerminal {
	/** SHA-256 del contenido de la Crónica al momento de generar el Germinal. */
	hash_cronica_upstream: string | null;
	/** SHA-256 del JSON canónico del Destilado al momento de generar el Germinal. */
	hash_destilado_upstream: string | null;
}

/** Nombre canónico de los 4 formatos de metabolización v1.1. */
export type CgtFormato = "cronica" | "destilado" | "nucleo" | "germinal";

/** Estado visible de un formato, usado por la UI (addendum §4.4). */
export type CgtEstadoFormato =
	| "pendiente"
	| "generando"
	| "generado"
	| "desactualizado"
	| "error"
	| "omitido";

//#endregion ![def]

//#region [def] - 📦 CLIENTE DEEPSEEK EXTENDIDO (pipeline §4) 📦

/** Modelos habilitados por el pipeline v1.
 *
 * - `deepseek-chat` y `deepseek-reasoner`: modelos clásicos. DeepSeek anunció
 *   que se discontinúan el 2026-07-24 (redirigen a `deepseek-v4-flash`).
 * - `deepseek-v4-pro`: modelo nuevo con 1M tokens de contexto, hasta 384k
 *   de output, modo thinking por defecto (devuelve `reasoning_content`).
 */
export type DeepSeekModelo =
	| "deepseek-chat"
	| "deepseek-reasoner"
	| "deepseek-v4-pro";

/**
 * Configuración de una llamada individual al LLM.
 *
 * Alineada a `lib/deepseek/api.ts::callDeepSeek`. Incluye solo lo mínimo
 * necesario por el pipeline v1; si se agrega `top_p`, `frequency_penalty`,
 * etc., extender acá.
 */
export interface DeepSeekCallConfig {
	model: DeepSeekModelo;
	temperature: number;
	maxTokens: number;
	responseFormat?: { type: "text" | "json_object" };
	systemPrompt: string;
	userPrompt: string;
	/** Reintentos con backoff exponencial (default: 3). */
	retries?: number;
	/** Timeout duro por request (default: 10 min, pipeline §4). */
	timeoutMs?: number;
}

/**
 * Resultado de una llamada individual al LLM.
 *
 * `reasoning_content` se expone para inspección pero **no debe persistirse
 * en prompts subsiguientes** (pipeline §1 — solo `content`).
 */
export interface DeepSeekCallResult {
	content: string;
	reasoningContent?: string;
	tokensInput: number;
	/**
	 * Total de `completion_tokens` reportado por DeepSeek (API completa).
	 *
	 * ⚠️ Con `deepseek-reasoner`, este número **incluye los tokens del
	 * chain-of-thought interno** (`reasoning_content`), no sólo el JSON/texto
	 * final entregado en `content`. Usar `tokensOutput` para el cálculo de
	 * **costo** (la API cobra por ambos), pero usar `tokensContent` (derivado,
	 * abajo) como `tokens_count` persistido en cada formato — de lo contrario
	 * se violan los CHECK constraints de cap semántico (p. ej. Destilado ≤1500).
	 */
	tokensOutput: number;
	/**
	 * Tokens gastados en reasoning interno (`completion_tokens_details.reasoning_tokens`).
	 *
	 * Solo disponible con modelos reasoner (`deepseek-reasoner`). `undefined`
	 * en `deepseek-chat`. Usado por los generadores de formato para calcular
	 * el tamaño semántico real del output (`tokensOutput - tokensReasoning`).
	 */
	tokensReasoning?: number;
	tokensCached: number;
	costoUsd: number;
	modelUsado: string;
	duracionMs: number;
	finishReason: "stop" | "length" | "content_filter" | "error";
}

//#endregion ![def]

//#region [def] - 📦 LOG ESTRUCTURADO (pipeline §11) 📦

/**
 * Bitácora append-only de llamadas al LLM. Espejo de `cgt_logs_deepseek`.
 */
export interface CgtLogDeepseek {
	id: string;
	artefacto_id: string | null;
	project_id: string | null;

	formato: CgtFormato | "sintesis_chunk" | string;

	modelo: string;
	temperatura: number;

	tokens_input: number;
	tokens_output: number;
	tokens_cached: number;

	costo_usd: number;
	duracion_ms: number;

	finish_reason: string | null;
	intento: number;
	error_mensaje: string | null;

	created_at: string;
}

//#endregion ![def]

//#region [def] - 📦 DESCARGA Y EXPORTACIÓN (addendum §5) 📦

/**
 * Retorno de `descargarFormato` y `descargarContenidoProcesado`.
 *
 * El `contenido_md` es autocontenido: frontmatter con hash + trazabilidad,
 * luego el cuerpo. Validable por terceros con `shasum -a 256` (addendum §5.4).
 */
export interface ArchivoDescargable {
	contenido_md: string;
	/** SHA-256 del `contenido_md` completo (incluye frontmatter). */
	sha256: string;
	filename: string;
}

/**
 * Retorno de `exportarTriada`. Los tres paths apuntan al bucket ya populado;
 * si se implementa ZIP, `zip_download_url` viene poblado (opcional).
 */
export interface TriadaExportadaV11 {
	storage_path_md: string;
	storage_path_yaml: string;
	storage_path_json: string;
	/** SHA-256 del JSON canónico empaquetado (contenido + metabolizaciones). */
	sha256_triada_canonica: string;
	zip_download_url?: string;
}

//#endregion ![def]

//#region [def] - 📦 ARTEFACTO COMPLETO EXTENDIDO 📦

/**
 * Extensión del `ArtefactoCompleto` de Hongo que incluye el Núcleo.
 *
 * Usar este tipo en `obtenerArtefactoCompleto()` — los consumidores reciben
 * ya todo lo necesario para renderizar la vista con 5 secciones (addendum
 * §4.3).
 */
export interface ArtefactoCompletoV11 extends ArtefactoCompletoBase {
	nucleo?: CgtNucleo;
	/** Override del germinal con hashes upstream (cascada de invalidación). */
	germinal?: CgtGerminalV11;
	/** Estado calculado de cada formato, listo para la UI del stepper. */
	estado_formatos?: Record<CgtFormato, CgtEstadoFormato>;
}

//#endregion ![def]
