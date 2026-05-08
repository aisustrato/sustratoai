//. 📍 lib/cognetica-forense/parsear-json-llm.ts
/**
 * Parser tolerante para outputs JSON de LLMs.
 *
 * Los modelos de DeepSeek (especialmente `deepseek-reasoner` en modo
 * `response_format: json_object`) ocasionalmente emiten JSON con defectos
 * menores pero fatales para `JSON.parse`:
 *
 *   - Envoltorios de code fence (```json ... ```).
 *   - Texto preámbulo/postámbulo fuera del JSON.
 *   - Trailing commas en arrays/objetos.
 *   - Comillas tipográficas (“ ”) en lugar de ASCII (").
 *   - Newlines literales sin escapar dentro de strings (causa típica de
 *     "Unterminated string in JSON at position N").
 *
 * Este parser aplica reparaciones heurísticas **conservadoras** y en
 * cascada: intenta el parse crudo primero; si falla, aplica una reparación,
 * reintenta; si sigue fallando, aplica la siguiente, etc. Siempre
 * devuelve el objeto parseado o un error detallado que incluye la primera
 * excepción (útil para debugging).
 *
 * No garantiza éxito: si el output está irremediablemente corrupto (ej.
 * truncado a la mitad por `finish_reason: "length"`), falla con `ok: false`.
 */

//#region [def] - 📦 TYPES 📦
export type ParseResult<T = unknown> =
	| { ok: true; data: T; reparaciones: string[] }
	| { ok: false; error: string; reparaciones: string[] };
//#endregion ![def]

//#region [main] - 🔧 parsearJsonLLM 🔧
/**
 * Intenta parsear `raw` como JSON aplicando reparaciones heurísticas en
 * cascada si la primera pasada falla. Retorna el objeto parseado o un
 * error detallado con la lista de reparaciones que se intentaron.
 */
export function parsearJsonLLM<T = unknown>(raw: string): ParseResult<T> {
	const reparaciones: string[] = [];
	let texto = raw;
	let primerError = "";

	// Pasada 0: parse directo.
	try {
		return { ok: true, data: JSON.parse(texto) as T, reparaciones };
	} catch (err) {
		primerError = (err as Error).message;
	}

	// Reparación 1: quitar code fences ```json ... ``` o ``` ... ```.
	const fenceMatch = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	if (fenceMatch && fenceMatch[1]) {
		texto = fenceMatch[1];
		reparaciones.push("quitar-code-fence");
		try {
			return { ok: true, data: JSON.parse(texto) as T, reparaciones };
		} catch {
			/* intenta siguiente */
		}
	}

	// Reparación 2: recortar al primer { y al último }.
	const inicio = texto.indexOf("{");
	const fin = texto.lastIndexOf("}");
	if (inicio >= 0 && fin > inicio) {
		const recortado = texto.slice(inicio, fin + 1);
		if (recortado !== texto) {
			texto = recortado;
			reparaciones.push("recortar-a-llaves");
			try {
				return { ok: true, data: JSON.parse(texto) as T, reparaciones };
			} catch {
				/* intenta siguiente */
			}
		}
	}

	// Reparación 3: normalizar comillas tipográficas.
	const conComillasRectas = texto
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2018\u2019]/g, "'");
	if (conComillasRectas !== texto) {
		texto = conComillasRectas;
		reparaciones.push("normalizar-comillas");
		try {
			return { ok: true, data: JSON.parse(texto) as T, reparaciones };
		} catch {
			/* intenta siguiente */
		}
	}

	// Reparación 4: quitar trailing commas antes de } o ].
	const sinTrailingCommas = texto.replace(/,(\s*[}\]])/g, "$1");
	if (sinTrailingCommas !== texto) {
		texto = sinTrailingCommas;
		reparaciones.push("quitar-trailing-commas");
		try {
			return { ok: true, data: JSON.parse(texto) as T, reparaciones };
		} catch {
			/* intenta siguiente */
		}
	}

	// Reparación 5: escapar newlines literales dentro de strings.
	//
	// Recorre el texto caracter por caracter manteniendo un flag de "dentro
	// de string". Si encontramos \n o \r estando dentro de un string y el
	// caracter no fue ya escapado, lo reemplazamos por \n / \r literales.
	// Esta es la causa más común de "Unterminated string in JSON" con
	// DeepSeek reasoner cuando un movimiento o cita contiene saltos de
	// línea que el modelo no escapa.
	const escapado = escaparNewlinesEnStrings(texto);
	if (escapado !== texto) {
		texto = escapado;
		reparaciones.push("escapar-newlines");
		try {
			return { ok: true, data: JSON.parse(texto) as T, reparaciones };
		} catch {
			/* cae a fail */
		}
	}

	return {
		ok: false,
		error: primerError,
		reparaciones,
	};
}
//#endregion ![main]

//#region [helpers] - 🛠️ ESCAPE DE NEWLINES 🛠️
/**
 * Recorre el texto y reemplaza saltos de línea literales (`\n`, `\r`) que
 * aparezcan dentro de strings JSON por sus formas escapadas.
 *
 * No altera newlines que estén fuera de strings (entre campos del objeto,
 * por ejemplo), ni los ya escapados (precedidos por `\`).
 */
function escaparNewlinesEnStrings(texto: string): string {
	let out = "";
	let dentroDeString = false;
	let escapadoAnterior = false;

	for (let i = 0; i < texto.length; i++) {
		const c = texto[i];

		if (!dentroDeString) {
			if (c === '"') {
				dentroDeString = true;
			}
			out += c;
			continue;
		}

		// Dentro de string.
		if (escapadoAnterior) {
			out += c;
			escapadoAnterior = false;
			continue;
		}

		if (c === "\\") {
			out += c;
			escapadoAnterior = true;
			continue;
		}

		if (c === '"') {
			dentroDeString = false;
			out += c;
			continue;
		}

		if (c === "\n") {
			out += "\\n";
			continue;
		}
		if (c === "\r") {
			out += "\\r";
			continue;
		}
		if (c === "\t") {
			out += "\\t";
			continue;
		}

		out += c;
	}

	return out;
}
//#endregion ![helpers]
