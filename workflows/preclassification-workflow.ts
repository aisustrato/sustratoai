//. 📍 workflows/preclassification-workflow.ts
/**
 * Clon del flujo de clasificación inicial de lote
 * (`startInitialPreclassification` → `runPreclassificationJob` en
 * `lib/actions/preclassification-actions.ts`) usando Vercel Workflows, para
 * que la ejecución total no tenga techo de duración.
 *
 * Ver docs/preclasificacion-auditoria-funcional/07_Requerimiento_Preclasificacion_Workflow_Vercel.md
 *
 * Deliberadamente aislado: no importa nada de `preclassification-actions.ts`.
 * Prompt, validación, manejo de "Otros", repechaje y persistencia están
 * clonados acá. Simplificación consciente respecto al original: se recorta
 * el logging de debug extremadamente verboso (dump completo de prompt +
 * respuesta en cada error) a favor de logs más compactos — no cambia
 * ningún comportamiento funcional, solo la cantidad de detalle en consola.
 *
 * Nota de seguridad: la API key de DeepSeek (BYOK) se resuelve DENTRO de
 * cada step que la necesita, nunca se pasa como retorno entre steps — el
 * estado del workflow se persiste en la infraestructura de Vercel (event
 * sourcing), y un secreto desencriptado no debe terminar ahí.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { createSupabaseServiceRoleClient } from "@/lib/server";
import { callDeepSeekAPI } from "@/lib/deepseek/api";
import { resolveDeepSeekApiKey } from "@/lib/deepseek/resolve-key";
import { createDimensionVersionResolver } from "@/lib/preclassification/dimension-versioning";
import type { Database } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 📦 TYPES (clon de los tipos internos de preclassification-actions.ts) 📦
type ReviewInsert =
	Database["public"]["Tables"]["article_dimension_reviews"]["Insert"] & {
		option_id?: string | null;
	};

type DimensionForPrompt = {
	id: string;
	name: string;
	description: string | null;
	type: string;
	preclass_dimension_options: { id?: string; value: string }[];
};

type ArticleForPrompt = {
	id: string;
	articles: {
		id: string;
		title: string | null;
		abstract: string | null;
		publication_year: number | null;
		journal: string | null;
	} | null;
};

type ProjectForPrompt = {
	name: string;
	proposal: string | null;
	proposal_bibliography: string | null;
};

interface ChunkResult {
	success: boolean;
	failedArticles: ArticleForPrompt[];
	successfulReviews: ReviewInsert[];
	inputTokens: number;
	outputTokens: number;
}
//#endregion ![def]

//#region [def] - 🎯 CONSTANTES 🎯
export const DEEPSEEK_MODEL = "deepseek-chat";
//#endregion ![def]

//#region [helpers] - 🛠️ PROMPT (clon exacto de buildPreclassificationPrompt) 🛠️
function buildPreclassificationPrompt(
	project: ProjectForPrompt,
	dimensions: DimensionForPrompt[],
	articleChunk: ArticleForPrompt[],
): string {
	const dimensionDetails = dimensions
		.map((dim) => {
			let instructionForDim = "";
			if (dim.type === "finite") {
				const optionsString = dim.preclass_dimension_options
					.map((opt) => `"${opt.value}"`)
					.join(", ");
				const hasOtrosOption = dim.preclass_dimension_options.some((opt) =>
					opt.value.toLowerCase().startsWith("otros"),
				);

				instructionForDim = `
- Tipo: Opción Múltiple.
- Instrucción: Para esta dimensión, DEBES escoger uno de los siguientes valores de la lista.
- Opciones Válidas: [${optionsString}]`;

				instructionForDim += `
- **🌊 Protocolo de Emergencia - "Otros" Implícito:**
  * Si ninguna opción encaja con la evidencia del artículo, **DEBES usar "Otros: [descripción breve]"** para capturar conocimiento emergente.
  * ${hasOtrosOption ? '✅ Esta dimensión tiene "Otros" definido explícitamente.' : '⚠️ Esta dimensión NO tiene "Otros" explícito, pero puedes usarlo igualmente si la evidencia lo requiere.'}
  * **Importante:** NO serás amonestado por usar "Otros" si está justificado en la evidencia. Tu criterio como co-investigadora es valioso y no será barrido bajo la alfombra.
  * **Responsabilidad:** Si usas "Otros", tu justificación (rationale) debe explicar claramente POR QUÉ ninguna opción predefinida encaja con la evidencia del artículo.
  * El humano podrá revisar y, si no está de acuerdo, deberá justificar su criterio. Es un diálogo, no una imposición.`;
			} else {
				instructionForDim = `
- Tipo: Respuesta Abierta.
- Instrucción: Para esta dimensión, DEBES generar una respuesta de texto libre y concisa (1-2 frases) basada en el contenido del artículo.`;
			}

			return `
**Dimensión: "${dim.name}"**
- Descripción: ${dim.description}
${instructionForDim}`;
		})
		.join("\n---\n");

	const articleDetails = articleChunk
		.map(
			(item) => `
---
**Artículo ID:** "${item.id}"
- Revista: ${item.articles?.journal}
- Año de Publicación: ${item.articles?.publication_year}
- Título: ${item.articles?.title}
- Abstract: ${item.articles?.abstract}
    `,
		)
		.join("");

	return `### ROL Y CONTEXTO GLOBAL ###
Eres un asistente de investigación experto en análisis bibliográfico. Tu tarea es colaborar en la preclasificación de artículos para el proyecto de investigación titulado: "${project.name}".
Propósito del Proyecto: ${project.proposal}
Objetivo de esta Fase Bibliográfica: ${project.proposal_bibliography}

### INSTRUCCIONES DE CLASIFICACIÓN ###
A continuación, te proporcionaré las definiciones de ${dimensions.length} dimensiones y un lote de ${articleChunk.length} artículos.
Debes analizar el texto original de cada artículo y clasificarlo según CADA dimensión.
**Importante:** Todas tus justificaciones ("rationale") deben estar escritas en **español**.
Tu respuesta debe ser OBLIGATORIAMENTE un objeto JSON válido, sin ningún texto antes o después del bloque JSON.

**CRÍTICO - Niveles de Confianza y Evidencia**:

Debes asignar el nivel de confianza según la EVIDENCIA EXPLÍCITA en el abstract:

- **Alta**: El abstract lo dice EXPLÍCITAMENTE, sin ambigüedad. No requiere suposiciones.
  * Ejemplo: "Los adultos mayores participaron en talleres de co-diseño"

- **Media**: No lo dice explícitamente, pero la inferencia es DIRECTA y verificable.
  * Ejemplo: "Se utilizó el protocolo de Zurich" (y el protocolo garantiza participación de usuarios finales)

- **Baja**: Requiere SUPOSICIONES o EXTRAPOLACIONES que no se pueden verificar en el abstract.
  * Ejemplo: "Consultaron a geriatras" → Asumes que los geriatras consultaron a adultos mayores
  * **En este caso**: Considera usar "Otros: [descripción]" si ninguna opción encaja sin suposiciones

**Principio ético**: No somos "palos blancos" de estudios académicos que no sean explícitos en sus alcances. Si el abstract no lo dice claramente, no podemos asumirlo por buena fe o marketing. Clasifica basándote en lo que el abstract DICE, no en lo que asumes que "debieron haber hecho".

### ESQUEMA DE LAS DIMENSIONES ###
${dimensionDetails}

### ARTÍCULOS A CLASIFICAR ###
${articleDetails}

### FORMATO DE SALIDA JSON ESPERADO ###
\`\`\`json
[
  {
    "itemId": "ID_DEL_ARTICLE_BATCH_ITEM",
    "classifications": {
      "${dimensions[0]?.name}": {
        "value": "VALOR_CLASIFICADO",
        "confidence": "Alta",
        "rationale": "Justificación concisa en español."
      }
    }
  }
]
\`\`\``;
}

function mapConfidenceToScore(confidenceText: string): number {
	if (typeof confidenceText !== "string") {
		throw new Error(
			`Valor de confianza inválido, se esperaba un string: "${confidenceText}"`,
		);
	}
	switch (confidenceText.toLowerCase()) {
		case "alta":
			return 3;
		case "media":
			return 2;
		case "baja":
			return 1;
		default:
			throw new Error(`Valor de confianza no reconocido: "${confidenceText}"`);
	}
}

function normalizeString(str: string): string {
	return str.trim().replace(/\s+/g, " ");
}
//#endregion ![helpers]

//#region [steps] - 🔧 STEPS 🔧
async function prepareClassificationJobStep(
	jobId: string,
	batchId: string,
): Promise<{
	items: ArticleForPrompt[];
	dimensions: DimensionForPrompt[];
	project: ProjectForPrompt;
}> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();

	const { data: batchData } = await admin
		.from("article_batches")
		.select("phase_id, projects(id, name, proposal, proposal_bibliography)")
		.eq("id", batchId)
		.single();
	if (!batchData?.phase_id || !batchData.projects) {
		throw new Error("Datos del lote o proyecto no encontrados.");
	}

	const { data: items, error: itemsError } = await admin
		.from("article_batch_items")
		.select("id, articles(id, title, abstract, publication_year, journal)")
		.eq("batch_id", batchId);
	if (itemsError || !items) {
		throw new Error("No se encontraron artículos para procesar.");
	}

	const { data: dimensions, error: dimsError } = await admin
		.from("preclass_dimensions")
		.select(
			"id, name, description, type, preclass_dimension_options(id, value)",
		)
		.eq("phase_id", batchData.phase_id)
		.eq("status", "active");
	if (dimsError || !dimensions) {
		throw new Error("No se encontraron dimensiones para la fase.");
	}

	await admin
		.from("ai_job_history")
		.update({
			details: { total: items.length, processed: 0, step: "Datos preparados" },
		})
		.eq("id", jobId);

	return {
		items: items as ArticleForPrompt[],
		dimensions: dimensions as DimensionForPrompt[],
		project: batchData.projects as ProjectForPrompt,
	};
}

async function processChunkStep(
	jobId: string,
	userId: string,
	project: ProjectForPrompt,
	dimensions: DimensionForPrompt[],
	chunk: ArticleForPrompt[],
	attemptNumber: number,
): Promise<ChunkResult> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();
	const { apiKey } = await resolveDeepSeekApiKey(userId, admin);
	// Sellado de versiones (Fase 1, auditoría append-only con SHA-256):
	// cacheado dentro de este step, ver lib/preclassification/dimension-versioning.ts.
	const resolveDimensionVersion = createDimensionVersionResolver(admin, userId);

	const chunkFailedArticles: ArticleForPrompt[] = [];
	const chunkSuccessfulReviews: ReviewInsert[] = [];

	try {
		const prompt = buildPreclassificationPrompt(project, dimensions, chunk);
		const { result, usage } = await callDeepSeekAPI(
			DEEPSEEK_MODEL,
			prompt,
			apiKey,
		);

		let cleanResult = result.trim();
		if (cleanResult.startsWith("```json")) {
			cleanResult = cleanResult.replace(/^```json\s*/, "").replace(/\s*```$/, "");
		} else if (cleanResult.startsWith("```")) {
			cleanResult = cleanResult.replace(/^```\s*/, "").replace(/\s*```$/, "");
		}

		const parsedResult = JSON.parse(cleanResult);
		if (!Array.isArray(parsedResult)) {
			throw new Error("La respuesta de la IA no es un array válido");
		}

		for (const item of parsedResult) {
			const currentArticle = chunk.find((art) => art.id === item.itemId);
			if (!currentArticle) continue;

			try {
				const articleReviews: ReviewInsert[] = [];
				const articleId = currentArticle.articles?.id;
				if (!articleId) {
					throw new Error(
						`No se encontró article_id para el ítem de lote ${item.itemId}`,
					);
				}

				for (const dimensionNameRaw in item.classifications) {
					const dimensionName = normalizeString(dimensionNameRaw);
					const foundDimension = dimensions.find(
						(dim) =>
							dim.id === dimensionName ||
							normalizeString(dim.name) === dimensionName,
					);
					if (!foundDimension) {
						throw new Error(
							`La IA devolvió una dimensión desconocida: "${dimensionName}" (original: "${dimensionNameRaw}")`,
						);
					}

					const classification = item.classifications[dimensionNameRaw];
					const valueToSave = classification.value;
					let optionId: string | null = null;

					if (foundDimension.type === "finite") {
						const validOptions = foundDimension.preclass_dimension_options.map(
							(opt) => opt.value,
						);
						const normalizedValue = normalizeString(valueToSave);
						const normalizedOptions = validOptions.map((opt) =>
							normalizeString(opt),
						);

						const exactMatchIndex = normalizedOptions.findIndex(
							(opt) => opt === normalizedValue,
						);
						const isExactMatch = exactMatchIndex !== -1;

						const otherOption = validOptions.find((opt) =>
							normalizeString(opt).toLowerCase().startsWith("otros"),
						);
						const isSmartOther =
							otherOption &&
							typeof valueToSave === "string" &&
							normalizedValue.toLowerCase().startsWith("otros");
						const isImplicitOther =
							!otherOption &&
							typeof valueToSave === "string" &&
							normalizedValue.toLowerCase().startsWith("otros");

						if (!isExactMatch && !isSmartOther && !isImplicitOther) {
							throw new Error(
								`Valor "${valueToSave}" inválido para la dimensión finita "${foundDimension.name}". Opciones válidas: ${validOptions.join(", ")}. Si ninguna opción encaja, usa "Otros: [descripción]".`,
							);
						}

						const optionsWithIds = foundDimension.preclass_dimension_options;
						if (isExactMatch) {
							optionId = optionsWithIds[exactMatchIndex]?.id ?? null;
						} else if (isSmartOther) {
							const otherObj = optionsWithIds.find((o) =>
								normalizeString(o.value).toLowerCase().startsWith("otros"),
							);
							optionId = otherObj?.id ?? null;
						} else if (isImplicitOther) {
							optionId = null;
						}
					}

					articleReviews.push({
						article_id: articleId,
						article_batch_item_id: item.itemId,
						dimension_id: foundDimension.id,
						dimension_version_id: await resolveDimensionVersion(
							foundDimension.id,
						),
						reviewer_type: "ai",
						reviewer_id: userId,
						iteration: attemptNumber,
						classification_value: valueToSave,
						confidence_score: mapConfidenceToScore(classification.confidence),
						rationale: classification.rationale,
						option_id: optionId,
						prevalidated: false,
						is_final: false,
						status: "review_pending",
					});
				}

				chunkSuccessfulReviews.push(...articleReviews);
			} catch (articleError) {
				console.error(
					`❌ [${jobId}] Error procesando artículo ${item.itemId}:`,
					articleError instanceof Error ? articleError.message : articleError,
				);
				chunkFailedArticles.push(currentArticle);
			}
		}

		return {
			success: true,
			failedArticles: chunkFailedArticles,
			successfulReviews: chunkSuccessfulReviews,
			inputTokens: usage?.promptTokenCount || 0,
			outputTokens: usage?.candidatesTokenCount || 0,
		};
	} catch (chunkError) {
		console.error(
			`❌❌ [${jobId}] Error crítico procesando chunk completo (intento ${attemptNumber}):`,
			chunkError instanceof Error ? chunkError.message : chunkError,
		);
		return {
			success: false,
			failedArticles: chunk,
			successfulReviews: [],
			inputTokens: 0,
			outputTokens: 0,
		};
	}
}

async function updateProgressStep(
	jobId: string,
	progress: number,
	total: number,
	processed: number,
	step: string,
): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();
	await admin
		.from("ai_job_history")
		.update({
			progress: Math.round(progress),
			details: { total, processed, step },
		})
		.eq("id", jobId);
}

async function finalizeClassificationJobStep(
	jobId: string,
	batchId: string,
	totalItems: number,
	processedCount: number,
	successfulReviews: ReviewInsert[],
	totalInputTokens: number,
	totalOutputTokens: number,
): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();

	if (successfulReviews.length === 0) {
		await admin
			.from("ai_job_history")
			.update({
				status: "failed",
				progress: 100,
				error_message: "Sin clasificaciones válidas para guardar",
			})
			.eq("id", jobId);
		throw new Error("No se generaron clasificaciones válidas para guardar.");
	}

	const { error: insertError } = await admin
		.from("article_dimension_reviews")
		.insert(successfulReviews);
	if (insertError) {
		await admin
			.from("ai_job_history")
			.update({
				status: "failed",
				progress: 100,
				error_message: insertError.message,
			})
			.eq("id", jobId);
		throw insertError;
	}

	await admin
		.from("ai_job_history")
		.update({
			status: "completed",
			progress: 100,
			details: { total: totalItems, processed: processedCount, step: "Completado" },
			completed_at: new Date().toISOString(),
			input_tokens: totalInputTokens,
			output_tokens: totalOutputTokens,
		})
		.eq("id", jobId);

	await admin
		.from("article_batch_items")
		.update({ status: "review_pending" })
		.eq("batch_id", batchId);
	await admin
		.from("article_batches")
		.update({ status: "review_pending" })
		.eq("id", batchId);
}

async function markClassificationJobFailedStep(
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
			details: { error: errorMessage },
		})
		.eq("id", jobId);
}
//#endregion ![steps]

//#region [main] - 🔧 ORQUESTADOR 🔧
const MINI_BATCH_SIZE = 5;

export async function preclassificationWorkflow(
	jobId: string,
	batchId: string,
	userId: string,
): Promise<void> {
	"use workflow";

	try {
		const { items, dimensions, project } = await prepareClassificationJobStep(
			jobId,
			batchId,
		);

		const articulosParaRepechaje: ArticleForPrompt[] = [];
		const clasificacionesExitosas: ReviewInsert[] = [];
		let processedCount = 0;
		let totalInputTokens = 0;
		let totalOutputTokens = 0;

		// 🎯 PRIMER INTENTO
		for (let i = 0; i < items.length; i += MINI_BATCH_SIZE) {
			const chunk = items.slice(i, i + MINI_BATCH_SIZE);
			const result = await processChunkStep(
				jobId,
				userId,
				project,
				dimensions,
				chunk,
				1,
			);
			processedCount += chunk.length;
			totalInputTokens += result.inputTokens;
			totalOutputTokens += result.outputTokens;

			await updateProgressStep(
				jobId,
				(processedCount / items.length) * 50,
				items.length,
				processedCount,
				`Clasificando artículos (${processedCount}/${items.length})`,
			);

			if (!result.success) {
				articulosParaRepechaje.push(...result.failedArticles);
			}
			if (result.successfulReviews.length > 0) {
				clasificacionesExitosas.push(...result.successfulReviews);
			}
		}

		// 🎯 REPECHAJE (SEGUNDA OPORTUNIDAD)
		if (articulosParaRepechaje.length > 0) {
			for (let i = 0; i < articulosParaRepechaje.length; i += MINI_BATCH_SIZE) {
				const repechageChunk = articulosParaRepechaje.slice(
					i,
					i + MINI_BATCH_SIZE,
				);

				await updateProgressStep(
					jobId,
					50 + (i / articulosParaRepechaje.length) * 40,
					items.length,
					processedCount,
					`Repechaje (${Math.min(i + MINI_BATCH_SIZE, articulosParaRepechaje.length)}/${articulosParaRepechaje.length})`,
				);

				const repeResult = await processChunkStep(
					jobId,
					userId,
					project,
					dimensions,
					repechageChunk,
					2,
				);
				totalInputTokens += repeResult.inputTokens;
				totalOutputTokens += repeResult.outputTokens;
				if (repeResult.successfulReviews.length > 0) {
					clasificacionesExitosas.push(...repeResult.successfulReviews);
				}
			}
		}

		await finalizeClassificationJobStep(
			jobId,
			batchId,
			items.length,
			processedCount,
			clasificacionesExitosas,
			totalInputTokens,
			totalOutputTokens,
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		await markClassificationJobFailedStep(jobId, errorMessage);
		throw error;
	}
}
//#endregion ![main]
