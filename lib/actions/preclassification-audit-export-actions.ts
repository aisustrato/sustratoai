// lib/actions/preclassification-audit-export-actions.ts
"use server";

/**
 * Fase 4 de la auditoría append-only con SHA-256: exportar de un solo gesto
 * TODO el rastro verificable de una fase de preclasificación — definiciones
 * de dimensiones (con sus versiones selladas), historial COMPLETO de
 * revisiones (todas las iteraciones, IA y humanas), las interacciones
 * exactas con la IA (prompt + respuesta cruda) que las produjeron, las
 * traducciones, y el hash de ingesta original de cada artículo comparado
 * contra su estado actual.
 *
 * No inventa un nuevo mecanismo de registro: el bundle se hashea con
 * `sha256CanonicalJson` (el mismo punto de hasheo de todo el proyecto,
 * lib/cognetica-forense/hash.ts) y se registra vía `registerDataExport`
 * (lib/actions/data-export-actions.ts), que ya existe para este propósito.
 */

import { createSupabaseServerClient } from "@/lib/server";
import { sha256CanonicalJson, sha256Hex } from "@/lib/cognetica-forense/hash";
import { registerDataExport } from "./data-export-actions";
import type { ResultadoOperacion } from "./types";
import type { Database } from "@/lib/database.types";

type ReviewRow = Database["public"]["Tables"]["article_dimension_reviews"]["Row"];

export interface PreclassificationAuditBundle {
	generatedAt: string;
	generatedBy: string;
	phase: {
		id: string;
		projectId: string;
		name: string;
		phaseNumber: number;
		description: string | null;
	};
	dimensions: Array<{
		id: string;
		name: string;
		description: string | null;
		type: string;
		versions: Array<{
			id: string;
			versionNumber: number;
			contentSha256: string;
			sealedAt: string;
			sealedBy: string | null;
			name: string;
			description: string | null;
			type: string;
			optionsSnapshot: unknown;
			questionsSnapshot: unknown;
			examplesSnapshot: unknown;
		}>;
	}>;
	batches: Array<{
		id: string;
		batchNumber: number;
		status: string | null;
	}>;
	reviews: ReviewRow[];
	translations: Array<{
		articleId: string;
		language: string;
		title: string | null;
		abstract: string | null;
		translatedAt: string | null;
		translatorSystem: string | null;
		aiInteractionId: string | null;
	}>;
	aiInteractions: Array<{
		id: string;
		jobId: string;
		step: string;
		promptSent: string;
		promptSha256: string;
		responseReceived: string | null;
		responseSha256: string | null;
		aiModel: string;
		inputTokens: number | null;
		outputTokens: number | null;
		success: boolean;
		errorMessage: string | null;
		createdAt: string;
	}>;
	ingestion: Array<{
		articleId: string;
		source: string;
		abstractSha256AtIngestion: string | null;
		titleSha256AtIngestion: string | null;
		ingestedAt: string;
		currentAbstractMatchesIngestion: boolean | null;
		currentTitleMatchesIngestion: boolean | null;
	}>;
}

export interface ExportPreclassificationAuditResult {
	bundle: PreclassificationAuditBundle;
	sha256: string;
	fileName: string;
}

export async function exportPreclassificationAudit(
	phaseId: string,
): Promise<ResultadoOperacion<ExportPreclassificationAuditResult>> {
	if (!phaseId) {
		return { success: false, error: "Se requiere el ID de la fase." };
	}

	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return { success: false, error: "Usuario no autenticado." };

		// 1) Fase
		const { data: phase, error: phaseError } = await supabase
			.from("preclassification_phases")
			.select("id, project_id, name, phase_number, description")
			.eq("id", phaseId)
			.single();
		if (phaseError || !phase) {
			return {
				success: false,
				error: `No se encontró la fase: ${phaseError?.message || "sin datos"}`,
			};
		}

		// 2) Dimensiones de la fase + todas sus versiones selladas
		const { data: dimensions, error: dimsError } = await supabase
			.from("preclass_dimensions")
			.select("id, name, description, type")
			.eq("phase_id", phaseId);
		if (dimsError) {
			return {
				success: false,
				error: `Error obteniendo dimensiones: ${dimsError.message}`,
			};
		}
		const dimensionIds = (dimensions || []).map((d) => d.id);

		const { data: versions, error: versionsError } =
			dimensionIds.length > 0 ?
				await supabase
					.from("preclass_dimension_versions")
					.select("*")
					.in("dimension_id", dimensionIds)
					.order("version_number", { ascending: true })
			:	{ data: [], error: null };
		if (versionsError) {
			return {
				success: false,
				error: `Error obteniendo versiones de dimensiones: ${versionsError.message}`,
			};
		}

		// 3) Lotes de la fase
		const { data: batches, error: batchesError } = await supabase
			.from("article_batches")
			.select("id, batch_number, status")
			.eq("phase_id", phaseId);
		if (batchesError) {
			return {
				success: false,
				error: `Error obteniendo lotes: ${batchesError.message}`,
			};
		}
		const batchIds = (batches || []).map((b) => b.id);

		// 4) Items de esos lotes → artículos involucrados
		const { data: items, error: itemsError } =
			batchIds.length > 0 ?
				await supabase
					.from("article_batch_items")
					.select("id, article_id")
					.in("batch_id", batchIds)
			:	{ data: [], error: null };
		if (itemsError) {
			return {
				success: false,
				error: `Error obteniendo artículos del lote: ${itemsError.message}`,
			};
		}
		const itemIds = (items || []).map((i) => i.id);
		const articleIds = Array.from(
			new Set((items || []).map((i) => i.article_id)),
		);

		// 5) TODAS las reviews (todas las iteraciones, IA y humanas)
		const { data: reviews, error: reviewsError } =
			itemIds.length > 0 ?
				await supabase
					.from("article_dimension_reviews")
					.select("*")
					.in("article_batch_item_id", itemIds)
					.order("iteration", { ascending: true })
			:	{ data: [], error: null };
		if (reviewsError) {
			return {
				success: false,
				error: `Error obteniendo revisiones: ${reviewsError.message}`,
			};
		}

		// 6) Traducciones de esos artículos
		const { data: translations, error: translationsError } =
			articleIds.length > 0 ?
				await supabase
					.from("article_translations")
					.select(
						"article_id, language, title, abstract, translated_at, translator_system, ai_interaction_id",
					)
					.in("article_id", articleIds)
			:	{ data: [], error: null };
		if (translationsError) {
			return {
				success: false,
				error: `Error obteniendo traducciones: ${translationsError.message}`,
			};
		}

		// 7) Interacciones con la IA referenciadas por reviews o traducciones
		const interactionIds = Array.from(
			new Set(
				[
					...(reviews || []).map((r) => r.ai_interaction_id),
					...(translations || []).map((t) => t.ai_interaction_id),
				].filter((id): id is string => !!id),
			),
		);
		const { data: aiInteractions, error: interactionsError } =
			interactionIds.length > 0 ?
				await supabase
					.from("ai_prompt_interactions")
					.select("*")
					.in("id", interactionIds)
			:	{ data: [], error: null };
		if (interactionsError) {
			return {
				success: false,
				error: `Error obteniendo interacciones con la IA: ${interactionsError.message}`,
			};
		}

		// 8) Log de ingesta de esos artículos + estado actual, para detectar
		// si el título/abstract cambió desde que entró a la base de datos.
		const { data: ingestionLog, error: ingestionError } =
			articleIds.length > 0 ?
				await supabase
					.from("article_ingestion_log")
					.select(
						"article_id, source, abstract_sha256, title_sha256, created_at",
					)
					.in("article_id", articleIds)
			:	{ data: [], error: null };
		if (ingestionError) {
			return {
				success: false,
				error: `Error obteniendo log de ingesta: ${ingestionError.message}`,
			};
		}

		const { data: currentArticles, error: articlesError } =
			articleIds.length > 0 ?
				await supabase
					.from("articles")
					.select("id, title, abstract")
					.in("id", articleIds)
			:	{ data: [], error: null };
		if (articlesError) {
			return {
				success: false,
				error: `Error obteniendo artículos: ${articlesError.message}`,
			};
		}
		const currentArticleById = new Map(
			(currentArticles || []).map((a) => [a.id, a]),
		);

		const ingestion = await Promise.all(
			(ingestionLog || []).map(async (log) => {
				const current = currentArticleById.get(log.article_id);
				const currentAbstractHash =
					current?.abstract ? await sha256Hex(current.abstract) : null;
				const currentTitleHash =
					current?.title ? await sha256Hex(current.title) : null;
				return {
					articleId: log.article_id,
					source: log.source,
					abstractSha256AtIngestion: log.abstract_sha256,
					titleSha256AtIngestion: log.title_sha256,
					ingestedAt: log.created_at,
					currentAbstractMatchesIngestion:
						log.abstract_sha256 !== null ?
							log.abstract_sha256 === currentAbstractHash
						:	null,
					currentTitleMatchesIngestion:
						log.title_sha256 !== null ?
							log.title_sha256 === currentTitleHash
						:	null,
				};
			}),
		);

		// 9) Armar el bundle
		const versionsByDimension = new Map<
			string,
			PreclassificationAuditBundle["dimensions"][number]["versions"]
		>();
		for (const v of versions || []) {
			const list = versionsByDimension.get(v.dimension_id) || [];
			list.push({
				id: v.id,
				versionNumber: v.version_number,
				contentSha256: v.content_sha256,
				sealedAt: v.sealed_at,
				sealedBy: v.sealed_by,
				name: v.name,
				description: v.description,
				type: v.type,
				optionsSnapshot: v.options_snapshot,
				questionsSnapshot: v.questions_snapshot,
				examplesSnapshot: v.examples_snapshot,
			});
			versionsByDimension.set(v.dimension_id, list);
		}

		const bundle: PreclassificationAuditBundle = {
			generatedAt: new Date().toISOString(),
			generatedBy: user.id,
			phase: {
				id: phase.id,
				projectId: phase.project_id,
				name: phase.name,
				phaseNumber: phase.phase_number,
				description: phase.description,
			},
			dimensions: (dimensions || []).map((d) => ({
				id: d.id,
				name: d.name,
				description: d.description,
				type: d.type,
				versions: versionsByDimension.get(d.id) || [],
			})),
			batches: (batches || []).map((b) => ({
				id: b.id,
				batchNumber: b.batch_number,
				status: b.status,
			})),
			reviews: reviews || [],
			translations: (translations || []).map((t) => ({
				articleId: t.article_id,
				language: t.language,
				title: t.title,
				abstract: t.abstract,
				translatedAt: t.translated_at,
				translatorSystem: t.translator_system,
				aiInteractionId: t.ai_interaction_id,
			})),
			aiInteractions: (aiInteractions || []).map((i) => ({
				id: i.id,
				jobId: i.job_id,
				step: i.step,
				promptSent: i.prompt_sent,
				promptSha256: i.prompt_sha256,
				responseReceived: i.response_received,
				responseSha256: i.response_sha256,
				aiModel: i.ai_model,
				inputTokens: i.input_tokens,
				outputTokens: i.output_tokens,
				success: i.success,
				errorMessage: i.error_message,
				createdAt: i.created_at,
			})),
			ingestion,
		};

		// 10) Hash del bundle completo (mismo punto de hasheo de todo el proyecto)
		const sha256 = await sha256CanonicalJson(bundle);
		const fileName = `auditoria-preclasificacion-fase-${phase.phase_number}-${Date.now()}.json`;

		// 11) Registrar la exportación (reusa el registro existente, no uno nuevo)
		const registerResult = await registerDataExport({
			projectId: phase.project_id,
			phaseId: phase.id,
			sha256Hash: sha256,
			exportType: "json",
			articleCount: articleIds.length,
			dimensionCount: (dimensions || []).length,
			fileName,
			metadata: {
				phaseName: phase.name,
				batchCount: (batches || []).length,
				reviewCount: (reviews || []).length,
				aiInteractionCount: (aiInteractions || []).length,
			},
		});
		if (!registerResult.success) {
			return {
				success: false,
				error: `El bundle se generó pero no se pudo registrar: ${registerResult.error}`,
			};
		}

		return { success: true, data: { bundle, sha256, fileName } };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("[exportPreclassificationAudit] Error:", error);
		return { success: false, error: `Error interno: ${msg}` };
	}
}
