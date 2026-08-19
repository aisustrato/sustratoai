//. 📍 workflows/translation-workflow.ts
/**
 * Clon del flujo de traducción (`startBatchTranslation` → `runTranslationJob`
 * en `lib/actions/preclassification-actions.ts`) usando Vercel Workflows,
 * para que la ejecución total no tenga techo de duración (a diferencia de la
 * invocación única con `waitUntil()` del flujo original).
 *
 * Ver docs/preclasificacion-auditoria-funcional/07_Requerimiento_Preclasificacion_Workflow_Vercel.md
 *
 * Deliberadamente aislado: NO importa nada de `preclassification-actions.ts`
 * salvo `saveBatchTranslations` (ya exportada, se reutiliza tal cual para no
 * duplicar la escritura en `article_translations`/`article_batches`). El
 * resto de la lógica (prompt, parseo, reintentos) está clonada acá.
 *
 * Nota de seguridad: la API key de DeepSeek (BYOK) se resuelve DENTRO de
 * cada step, nunca se pasa como retorno entre steps — el estado del
 * workflow se persiste en la infraestructura de Vercel (event sourcing), y
 * un secreto desencriptado no debe terminar ahí.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { createSupabaseServiceRoleClient } from "@/lib/server";
import { callDeepSeekAPI } from "@/lib/deepseek/api";
import { resolveDeepSeekApiKey } from "@/lib/deepseek/resolve-key";
import { saveBatchTranslations } from "@/lib/actions/preclassification-actions";
import type { TranslatedArticlePayload } from "@/lib/types/preclassification-types";
//#endregion ![head]

//#region [def] - 🎯 CONSTANTES 🎯
export const DEEPSEEK_MODEL = "deepseek-chat";
//#endregion ![def]

//#region [def] - 📦 TYPES 📦
interface ArticleForTranslation {
	id: string;
	title: string | null;
	abstract: string | null;
}

interface TranslateArticleResult {
	translation: TranslatedArticlePayload | null;
	inputTokens: number;
	outputTokens: number;
}
//#endregion ![def]

//#region [helpers] - 🛠️ PROMPT (clon exacto de buildTranslationPrompt) 🛠️
function buildTranslationPrompt(title: string, abstract: string): string {
	return `Eres un traductor experto y un sintetizador académico. Tu tarea tiene dos partes:
1. Traduce el título (title) y el resumen (abstract) del siguiente texto científico del inglés al español de forma profesional.
2. Crea un resumen muy conciso del abstract traducido, en español, con un máximo de 250 caracteres, que capture la esencia del texto.

Debes devolver el resultado ÚNICAMENTE como un objeto JSON válido con tres claves: "translatedTitle", "translatedAbstract" y "translatedSummary".

Texto a procesar:
"""
Title: ${title}

Abstract: ${abstract}
"""`;
}
//#endregion ![helpers]

//#region [steps] - 🔧 STEPS 🔧
async function prepareTranslationJobStep(
	jobId: string,
	batchId: string,
): Promise<{ articles: ArticleForTranslation[]; totalArticles: number }> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();

	const { data: batchData, error: batchError } = await admin
		.from("article_batches")
		.select("batch_number, projects(id, name)")
		.eq("id", batchId)
		.single();
	if (batchError) {
		throw new Error(`Error obteniendo lote: ${batchError.message}`);
	}
	if (!batchData?.projects) {
		throw new Error("Datos del lote o proyecto no encontrados.");
	}

	const { data: items, error: itemsError } = await admin
		.from("article_batch_items")
		.select("id, articles(id, title, abstract)")
		.eq("batch_id", batchId);
	if (itemsError) {
		throw new Error(`Error obteniendo artículos: ${itemsError.message}`);
	}
	if (!items || items.length === 0) {
		throw new Error("No se encontraron artículos para traducir.");
	}

	const articles: ArticleForTranslation[] = items
		.map((item) => item.articles)
		.filter((a): a is ArticleForTranslation => !!a);

	await admin
		.from("ai_job_history")
		.update({
			details: {
				batchId,
				total: articles.length,
				processed: 0,
				step: `Preparado para traducir ${articles.length} artículos`,
			},
			progress: 5,
		})
		.eq("id", jobId);

	return { articles, totalArticles: articles.length };
}

async function translateArticleStep(
	jobId: string,
	article: ArticleForTranslation,
	index: number,
	total: number,
	userId: string,
): Promise<TranslateArticleResult> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();
	const { apiKey } = await resolveDeepSeekApiKey(userId, admin);

	await admin
		.from("ai_job_history")
		.update({
			progress: Math.round(5 + (index / total) * 90),
			details: {
				total,
				processed: index,
				step: `Traduciendo artículo ${index + 1} de ${total}...`,
			},
		})
		.eq("id", jobId);

	const MAX_RETRIES = 2;
	let lastError = "";

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const prompt = buildTranslationPrompt(
				article.title || "",
				article.abstract || "",
			);

			const { result, usage } = await callDeepSeekAPI(
				DEEPSEEK_MODEL,
				prompt,
				apiKey,
			);

			const cleanedString = result
				.replace(/`{3}json\n?/, "")
				.replace(/\n?`{3}$/, "");
			const parsedResult = JSON.parse(cleanedString);

			if (!parsedResult.translatedTitle || !parsedResult.translatedAbstract) {
				throw new Error(
					"El JSON de respuesta no contiene las claves esperadas.",
				);
			}

			return {
				translation: {
					articleId: article.id,
					title: parsedResult.translatedTitle,
					abstract: parsedResult.translatedAbstract,
					summary: parsedResult.translatedSummary,
					translated_by: userId,
					translator_system: DEEPSEEK_MODEL,
				},
				inputTokens: usage?.promptTokenCount || 0,
				outputTokens: usage?.candidatesTokenCount || 0,
			};
		} catch (error) {
			lastError = error instanceof Error ? error.message : "Error desconocido";
			if (attempt === MAX_RETRIES) {
				throw new Error(
					`Artículo ${index + 1} falló después de ${MAX_RETRIES} reintentos: ${lastError}`,
				);
			}
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	// Inalcanzable — el último intento del loop tira o retorna.
	throw new Error(lastError || "Error desconocido traduciendo artículo.");
}

async function finalizeTranslationJobStep(
	jobId: string,
	batchId: string,
	translations: TranslatedArticlePayload[],
	totalInputTokens: number,
	totalOutputTokens: number,
): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();

	await admin
		.from("ai_job_history")
		.update({
			progress: 95,
			details: {
				batchId,
				total: translations.length,
				processed: translations.length,
				step: "Guardando traducciones en base de datos...",
			},
		})
		.eq("id", jobId);

	const saveResult = await saveBatchTranslations(batchId, translations);
	if (!saveResult.success) {
		throw new Error(
			saveResult.error || "Error desconocido al guardar traducciones.",
		);
	}

	await admin
		.from("ai_job_history")
		.update({
			status: "completed",
			progress: 100,
			completed_at: new Date().toISOString(),
			input_tokens: totalInputTokens,
			output_tokens: totalOutputTokens,
			details: {
				batchId,
				total: translations.length,
				processed: translations.length,
				step: "¡Traducción completada exitosamente!",
			},
		})
		.eq("id", jobId);
}

async function markTranslationJobFailedStep(
	jobId: string,
	errorMessage: string,
): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();
	await admin
		.from("ai_job_history")
		.update({
			status: "failed",
			progress: 100,
			completed_at: new Date().toISOString(),
			error_message: errorMessage,
		})
		.eq("id", jobId);
}
//#endregion ![steps]

//#region [main] - 🔧 ORQUESTADOR 🔧
export async function translationWorkflow(
	jobId: string,
	batchId: string,
	userId: string,
): Promise<void> {
	"use workflow";

	try {
		const { articles, totalArticles } = await prepareTranslationJobStep(
			jobId,
			batchId,
		);

		const translations: TranslatedArticlePayload[] = [];
		let totalInputTokens = 0;
		let totalOutputTokens = 0;

		for (let i = 0; i < articles.length; i++) {
			const result = await translateArticleStep(
				jobId,
				articles[i],
				i,
				totalArticles,
				userId,
			);
			totalInputTokens += result.inputTokens;
			totalOutputTokens += result.outputTokens;
			if (result.translation) translations.push(result.translation);
		}

		await finalizeTranslationJobStep(
			jobId,
			batchId,
			translations,
			totalInputTokens,
			totalOutputTokens,
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		await markTranslationJobFailedStep(jobId, errorMessage);
		throw error;
	}
}
//#endregion ![main]
