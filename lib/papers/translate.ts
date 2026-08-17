// 📍 lib/papers/translate.ts
"use server";
// Traducción automática ES↔EN de un paper vía DeepSeek. Reusa el cliente
// compartido (lib/deepseek/api.ts) y el parser tolerante de JSON de LLM ya
// usados por el pipeline de cognética — sin dependencias nuevas.

import { callDeepSeek } from "@/lib/deepseek/api";
import { parsearJsonLLM } from "@/lib/cognetica-forense/parsear-json-llm";
import type { PaperIdioma } from "./i18n";

export interface PaperTranslatableFields {
	title: string;
	subtitle?: string | null;
	abstract: string;
	contentMd: string;
	keywords: string[];
}

const IDIOMA_NOMBRE: Record<PaperIdioma, string> = {
	es: "español",
	en: "inglés",
};

function buildSystemPrompt(target: PaperIdioma): string {
	return `Eres un traductor académico ES↔EN. Traduce el paper completo al ${IDIOMA_NOMBRE[target]}.

Reglas estrictas:
- Preserva íntegramente la estructura Markdown (headings, listas, tablas, énfasis, enlaces).
- Preserva citas, referencias bibliográficas, fórmulas y notas al pie tal cual (no las traduzcas ni las reformatees).
- No resumas, no omitas párrafos, no agregues contenido que no esté en el original.
- Términos técnicos: usa la traducción académica estándar del campo; si no existe una traducción establecida, deja el término original.
- Responde EXCLUSIVAMENTE con un objeto JSON con esta forma exacta, sin texto adicional:
{"title": string, "subtitle": string | null, "abstract": string, "contentMd": string, "keywords": string[]}`;
}

/**
 * Traduce título, subtítulo, abstract, cuerpo y keywords de un paper.
 * Lanza si DeepSeek falla o si la respuesta no cumple la forma esperada —
 * el caller debe abortar el publish/guardado, nunca persistir campos
 * parciales (regla del proyecto: errores siempre visibles, sin fallback
 * silencioso).
 */
export async function translatePaperContent(
	fields: PaperTranslatableFields,
	target: PaperIdioma,
): Promise<PaperTranslatableFields> {
	const userPrompt = JSON.stringify({
		title: fields.title,
		subtitle: fields.subtitle ?? null,
		abstract: fields.abstract,
		contentMd: fields.contentMd,
		keywords: fields.keywords,
	});

	const result = await callDeepSeek({
		model: "deepseek-v4-pro",
		temperature: 0.2,
		maxTokens: 32000,
		responseFormat: { type: "json_object" },
		systemPrompt: buildSystemPrompt(target),
		userPrompt,
		timeoutMs: 3 * 60 * 1000,
	});

	if (result.finishReason !== "stop") {
		throw new Error(
			`[papers:translate] DeepSeek terminó con finishReason="${result.finishReason}" (posible corte por longitud) al traducir a ${target}.`,
		);
	}

	const parsed = parsearJsonLLM<PaperTranslatableFields>(result.content);
	if (!parsed.ok) {
		console.error("[papers:translate] fallo al parsear respuesta de DeepSeek", parsed.error);
		throw new Error(`No se pudo parsear la traducción generada: ${parsed.error}`);
	}

	const { title, abstract, contentMd, keywords } = parsed.data;
	if (!title || !abstract || !contentMd || !Array.isArray(keywords)) {
		throw new Error(
			"La traducción generada por DeepSeek llegó incompleta (falta title, abstract, contentMd o keywords).",
		);
	}

	return parsed.data;
}

function buildMarkdownSystemPrompt(target: PaperIdioma): string {
	return `Eres un traductor académico ES↔EN. Traduce el siguiente documento Markdown completo al ${IDIOMA_NOMBRE[target]}.

Reglas estrictas:
- Preserva íntegramente la estructura Markdown (headings, listas, tablas, énfasis, enlaces, bloques de código).
- Preserva citas, referencias bibliográficas, fórmulas y notas al pie tal cual (no las traduzcas ni las reformatees).
- No resumas, no omitas párrafos, no agregues contenido que no esté en el original.
- Términos técnicos: usa la traducción académica estándar del campo; si no existe una traducción establecida, deja el término original.
- Responde EXCLUSIVAMENTE con el Markdown traducido, sin JSON, sin comillas envolventes, sin texto adicional antes o después.`;
}

/**
 * Traduce solo el cuerpo Markdown de un paper (sin título/abstract/keywords
 * — útil en el paso de edición de contenido, antes de llegar a metadatos).
 * A diferencia de `translatePaperContent`, la respuesta es Markdown crudo,
 * no JSON — evita el riesgo de romper el escape JSON con un documento largo.
 * Lanza si DeepSeek falla o devuelve vacío; el caller no debe persistir nada
 * a medias (misma regla: errores siempre visibles, sin fallback silencioso).
 */
export async function translatePaperMarkdown(
	contentMd: string,
	target: PaperIdioma,
): Promise<string> {
	const result = await callDeepSeek({
		model: "deepseek-v4-pro",
		temperature: 0.2,
		maxTokens: 32000,
		systemPrompt: buildMarkdownSystemPrompt(target),
		userPrompt: contentMd,
		timeoutMs: 3 * 60 * 1000,
	});

	if (result.finishReason !== "stop") {
		throw new Error(
			`[papers:translate] DeepSeek terminó con finishReason="${result.finishReason}" (posible corte por longitud) al traducir el cuerpo a ${target}.`,
		);
	}

	if (!result.content.trim()) {
		throw new Error("DeepSeek devolvió una traducción vacía del cuerpo del paper.");
	}

	return result.content;
}
