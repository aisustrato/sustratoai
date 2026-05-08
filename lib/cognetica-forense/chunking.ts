//. 📍 lib/cognetica-forense/chunking.ts
/**
 * Utilidades de chunking para metabolización de contenido largo.
 *
 * Aplicación: cuando el contenido procesado excede el umbral (`LIMITE_TOKENS_SIN_CHUNKING`,
 * default 50.000), el pipeline (§7) necesita partirlo en fragmentos procesables y,
 * previamente al generador final, sintetizar cada fragmento en un resumen acumulativo.
 *
 * **Reutilización v1**: idea de `splitIntoChunks` de
 * `lib/actions/cognetica-old-distillation-actions.ts`. Acá se reescribe respetando
 * secciones (separadores `\n\n---\n\n`, `\n## `, `\n# `, párrafos), no cortando
 * oraciones por la mitad. El estimador de tokens es el mismo (`estimateTokens`
 * en `utils/token-counter.ts`).
 *
 * **Acoplamiento con LLM**: este módulo sólo parte texto. La síntesis parcial
 * (paso 2 del chunking) vive en el orquestador de metabolización, que usa
 * `callDeepSeek` con `deepseek-chat` (barato) por fragmento.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { estimateTokens } from "./utils/token-counter";
//#endregion ![head]

//#region [def] - 🎯 CONSTANTES 🎯
/**
 * Umbral a partir del cual se activa chunking. Pipeline §7.
 * DeepSeek tiene contexto 128K; dejamos margen para system prompt y respuesta.
 */
export const LIMITE_TOKENS_SIN_CHUNKING = 50_000;

/**
 * Tokens por chunk cuando se parte. Inferior a `LIMITE_TOKENS_SIN_CHUNKING`
 * para que cada chunk entre cómodo con system prompt + espacio para respuesta.
 */
export const TOKENS_POR_CHUNK = 30_000;
//#endregion ![def]

//#region [main] - 🔧 CHUNKING 🔧
export interface ResultadoChunking {
	/** `true` si el contenido cabe entero; los callers pueden saltarse la síntesis. */
	requiere_chunking: boolean;
	chunks: string[];
	tokens_estimados_total: number;
}

/**
 * Divide un contenido largo en fragmentos respetando separadores naturales.
 *
 * Estrategia (de más fuerte a más débil):
 *   1. Separador horizontal: `\n---\n` (secciones explícitas)
 *   2. Títulos H1/H2: `\n# `, `\n## `
 *   3. Párrafos: doble salto de línea
 *   4. Oraciones: split por `. ` o `\n`
 *
 * Si un único segmento aún excede `TOKENS_POR_CHUNK`, se parte
 * por caracteres como último recurso (misma heurística que v1).
 */
export function prepararContenidoLargo(
	contenido: string,
	tokensPorChunk: number = TOKENS_POR_CHUNK,
	limiteSinChunking: number = LIMITE_TOKENS_SIN_CHUNKING,
): ResultadoChunking {
	const totalTokens = estimateTokens(contenido);

	if (totalTokens <= limiteSinChunking) {
		return {
			requiere_chunking: false,
			chunks: [contenido],
			tokens_estimados_total: totalTokens,
		};
	}

	const unidades = partirEnUnidades(contenido);
	const chunks: string[] = [];
	let buffer: string[] = [];
	let tokensBuffer = 0;

	for (const unidad of unidades) {
		const tokensUnidad = estimateTokens(unidad);

		// Unidad por sí sola excede el límite: partir a la fuerza.
		if (tokensUnidad > tokensPorChunk) {
			if (buffer.length) {
				chunks.push(buffer.join("\n\n"));
				buffer = [];
				tokensBuffer = 0;
			}
			chunks.push(...partirPorCaracteres(unidad, tokensPorChunk));
			continue;
		}

		if (tokensBuffer + tokensUnidad > tokensPorChunk && buffer.length > 0) {
			chunks.push(buffer.join("\n\n"));
			buffer = [unidad];
			tokensBuffer = tokensUnidad;
		} else {
			buffer.push(unidad);
			tokensBuffer += tokensUnidad;
		}
	}

	if (buffer.length) {
		chunks.push(buffer.join("\n\n"));
	}

	return {
		requiere_chunking: true,
		chunks,
		tokens_estimados_total: totalTokens,
	};
}
//#endregion ![main]

//#region [helpers] - 🛠️ UTILIDADES INTERNAS 🛠️
/**
 * Parte el contenido en unidades semánticas de granularidad creciente. El
 * objetivo es NO cortar oraciones por la mitad.
 */
function partirEnUnidades(contenido: string): string[] {
	// 1) Intenta partir por separadores horizontales de nivel de sección.
	const porSeparadores = contenido
		.split(/\n\s*---\s*\n/)
		.map((x) => x.trim())
		.filter(Boolean);
	if (porSeparadores.length > 1) return porSeparadores;

	// 2) Intenta partir por H1/H2 (sin descartar el heading, se mantiene con su sección).
	const porHeadings = splitManteniendoDelim(contenido, /\n(?=#{1,2}\s)/g);
	if (porHeadings.length > 1) {
		return porHeadings.map((x) => x.trim()).filter(Boolean);
	}

	// 3) Párrafos (doble salto de línea).
	const porParrafos = contenido
		.split(/\n{2,}/)
		.map((x) => x.trim())
		.filter(Boolean);
	if (porParrafos.length > 1) return porParrafos;

	// 4) Sin separadores: devolver como una única unidad — el caller partirá
	//    por caracteres si supera el cap.
	return [contenido];
}

/**
 * Split por regex que conserva el delimitador adherido al fragmento siguiente
 * (no estándar en `String.prototype.split` con grupos cero-ancho en todos los
 * motores; esta implementación lo garantiza manualmente).
 */
function splitManteniendoDelim(texto: string, delim: RegExp): string[] {
	const resultado: string[] = [];
	let ultimo = 0;
	// Asegura flag global
	const re = new RegExp(delim.source, "g");
	let m: RegExpExecArray | null;
	while ((m = re.exec(texto)) !== null) {
		if (m.index > ultimo) {
			resultado.push(texto.slice(ultimo, m.index));
		}
		ultimo = m.index + 1; // conserva el `\n` inicial como pivote
	}
	if (ultimo < texto.length) {
		resultado.push(texto.slice(ultimo));
	}
	return resultado;
}

/**
 * Último recurso: parte un bloque muy grande por cantidad de caracteres
 * (misma heurística que v1 `splitIntoChunks`).
 */
function partirPorCaracteres(texto: string, tokensPorChunk: number): string[] {
	const charsPorChunk = tokensPorChunk * 4;
	const chunks: string[] = [];
	for (let i = 0; i < texto.length; i += charsPorChunk) {
		chunks.push(texto.slice(i, i + charsPorChunk));
	}
	return chunks;
}
//#endregion ![helpers]
