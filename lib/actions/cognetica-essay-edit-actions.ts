// 📍 lib/actions/cognetica-essay-edit-actions.ts
// 🎯 PROPÓSITO: Server actions para gestión de historial de ediciones de ensayos destilados
// 🔧 DECISIÓN: Sistema append-only - cada edición crea nueva versión, nunca se modifica
// ⚠️ ADVERTENCIA: NO implementar funciones de UPDATE o DELETE - solo INSERT y SELECT

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import { estimateTokens } from "@/lib/utils/token-estimator";

// ========================================================================
// TYPES
// ========================================================================

export interface EssayVersion {
	id: string;
	artifact_id: string;
	transcription_id: string | null;
	essay_content: string;
	version_number: number;
	edit_type: "ai_generated" | "manual_edit" | "format_fix";
	edited_by: string | null;
	edit_reason: string | null;
	changes_summary: string | null;
	character_count: number | null;
	estimated_tokens: number | null;
	generation_metadata: any;
	created_at: string;
}

export interface EssayVersionHistoryItem {
	version_number: number;
	edit_type: string;
	edited_by: string | null;
	editor_email: string | null;
	edit_reason: string | null;
	changes_summary: string | null;
	character_count: number | null;
	created_at: string;
}

export interface SaveManualEditResult {
	success: boolean;
	data?: {
		version_number: number;
		essay_content: string;
		previous_version: number;
	};
	error?: string;
}

// ========================================================================
// FUNCIÓN: Obtener versión actual del ensayo
// ========================================================================

/**
 * Obtiene la versión más reciente del ensayo destilado
 * Primero busca en el historial, si no existe, busca en cog_transcriptions
 */
export async function getCurrentEssayVersion(artifactId: string): Promise<{
	success: boolean;
	data?: {
		essay_content: string;
		version_number: number;
		edit_type: string;
		is_manual_edit: boolean;
		created_at: string;
	} | null;
	error?: string;
}> {
	try {
		const supabase = await createSupabaseServerClient();

		// Intentar obtener desde el historial primero
		const { data: historyData, error: historyError } = await supabase
			.rpc("get_current_essay_version", { p_artifact_id: artifactId })
			.single();

		if (historyError && historyError.code !== "PGRST116") {
			// PGRST116 = no rows
			console.error(
				"Error obteniendo versión actual desde historial:",
				historyError,
			);
		}

		if (historyData) {
			return {
				success: true,
				data: {
					essay_content: historyData.essay_content,
					version_number: historyData.version_number,
					edit_type: historyData.edit_type,
					is_manual_edit: historyData.is_manual_edit,
					created_at: historyData.created_at,
				},
			};
		}

		// Si no hay historial, buscar en cog_transcriptions (versión original)
		const { data: transcriptionData, error: transcriptionError } =
			await supabase
				.from("cog_transcriptions")
				.select("distilled_essay, distilled_essay_metadata, created_at")
				.eq("artifact_id", artifactId)
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

		if (transcriptionError) {
			if (transcriptionError.code === "PGRST116") {
				return { success: true, data: null };
			}
			throw transcriptionError;
		}

		if (!transcriptionData?.distilled_essay) {
			return { success: true, data: null };
		}

		return {
			success: true,
			data: {
				essay_content: transcriptionData.distilled_essay,
				version_number: 0, // Versión original (no versionada aún)
				edit_type: "ai_generated",
				is_manual_edit: false,
				created_at: transcriptionData.created_at ?? new Date().toISOString(),
			},
		};
	} catch (error) {
		console.error("Error obteniendo versión actual del ensayo:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN: Guardar edición manual del ensayo
// ========================================================================

/**
 * Guarda una nueva versión editada manualmente del ensayo
 * CRÍTICO: Sistema append-only - NUNCA modifica versiones anteriores
 */
export async function saveManualEssayEdit(params: {
	artifactId: string;
	editedContent: string;
	editReason: string;
	changesSummary?: string;
}): Promise<SaveManualEditResult> {
	const opId = `EDIT-${Math.floor(Math.random() * 10000)}`;
	console.log(
		`✏️ [${opId}] Guardando edición manual para artifact: ${params.artifactId}`,
	);

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener usuario actual
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError || !user) {
			throw new Error("Usuario no autenticado");
		}

		// 2. Verificar que el artefacto existe y obtener transcription_id
		const { data: artifact, error: artifactError } = await supabase
			.from("cog_artifacts")
			.select("id, project_id")
			.eq("id", params.artifactId)
			.single();

		if (artifactError || !artifact) {
			throw new Error("Artefacto no encontrado");
		}

		// 3. Obtener transcription_id y metadata original
		const { data: transcription, error: transcriptionError } = await supabase
			.from("cog_transcriptions")
			.select("id, distilled_essay_metadata")
			.eq("artifact_id", params.artifactId)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (transcriptionError) {
			console.error(
				`❌ [${opId}] Error obteniendo transcripción:`,
				transcriptionError,
			);
		}

		// 4. Obtener el número de versión más alto actual
		const { data: latestVersion, error: versionError } = await supabase
			.from("cog_essay_edit_history")
			.select("version_number")
			.eq("artifact_id", params.artifactId)
			.order("version_number", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (versionError && versionError.code !== "PGRST116") {
			console.error(
				`❌ [${opId}] Error obteniendo última versión:`,
				versionError,
			);
		}

		const previousVersionNumber = latestVersion?.version_number || 0;
		const newVersionNumber = previousVersionNumber + 1;

		console.log(
			`📊 [${opId}] Versión anterior: ${previousVersionNumber}, Nueva versión: ${newVersionNumber}`,
		);

		// 5. Si es la primera versión (1), guardar también la versión original (0)
		if (newVersionNumber === 1) {
			console.log(
				`🔄 [${opId}] Primera edición - guardando versión original (v0) primero`,
			);

			// Obtener el ensayo original de cog_transcriptions
			const { data: originalTranscription } = await supabase
				.from("cog_transcriptions")
				.select("distilled_essay, distilled_essay_metadata")
				.eq("artifact_id", params.artifactId)
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

			if (originalTranscription?.distilled_essay) {
				const originalTokens = estimateTokens(
					originalTranscription.distilled_essay,
				);

				await supabase.from("cog_essay_edit_history").insert({
					artifact_id: params.artifactId,
					transcription_id: transcription?.id || null,
					essay_content: originalTranscription.distilled_essay,
					version_number: 0,
					edit_type: "ai_generated",
					edited_by: null,
					edit_reason: "Versión original generada por IA",
					character_count: originalTranscription.distilled_essay.length,
					estimated_tokens: originalTokens,
					generation_metadata: originalTranscription.distilled_essay_metadata,
				});

				console.log(`✅ [${opId}] Versión original (v0) guardada`);
			}
		}

		// 6. Calcular estadísticas del nuevo contenido
		const characterCount = params.editedContent.length;
		const estimatedTokensCount = estimateTokens(params.editedContent);

		// 7. Insertar nueva versión editada
		const { data: newVersion, error: insertError } = await supabase
			.from("cog_essay_edit_history")
			.insert({
				artifact_id: params.artifactId,
				transcription_id: transcription?.id || null,
				essay_content: params.editedContent,
				version_number: newVersionNumber,
				edit_type: "manual_edit",
				edited_by: user.id,
				edit_reason: params.editReason,
				changes_summary: params.changesSummary || null,
				character_count: characterCount,
				estimated_tokens: estimatedTokensCount,
				generation_metadata: transcription?.distilled_essay_metadata || null,
			})
			.select()
			.single();

		if (insertError) {
			console.error(
				`❌ [${opId}] Error insertando nueva versión:`,
				insertError,
			);
			throw new Error(`Error guardando edición: ${insertError.message}`);
		}

		console.log(`✅ [${opId}] Nueva versión guardada exitosamente`);
		console.log(
			`📊 [${opId}] Versión ${newVersionNumber}: ${characterCount} caracteres, ~${estimatedTokensCount} tokens`,
		);

		// 8. Actualizar también cog_transcriptions.distilled_essay con la nueva versión
		// (para compatibilidad con código existente)
		await supabase
			.from("cog_transcriptions")
			.update({
				distilled_essay: params.editedContent,
			})
			.eq("artifact_id", params.artifactId);

		console.log(`✅ [${opId}] cog_transcriptions.distilled_essay actualizado`);

		return {
			success: true,
			data: {
				version_number: newVersionNumber,
				essay_content: params.editedContent,
				previous_version: previousVersionNumber,
			},
		};
	} catch (error) {
		console.error(`❌ [${opId}] Error guardando edición manual:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN: Obtener historial de versiones
// ========================================================================

/**
 * Obtiene el historial completo de versiones de un ensayo
 */
export async function getEssayVersionHistory(artifactId: string): Promise<{
	success: boolean;
	data?: EssayVersionHistoryItem[];
	error?: string;
}> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase.rpc("get_essay_version_history", {
			p_artifact_id: artifactId,
		});

		if (error) {
			throw error;
		}

		return {
			success: true,
			data: data || [],
		};
	} catch (error) {
		console.error("Error obteniendo historial de versiones:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

// ========================================================================
// FUNCIÓN: Obtener versión específica del ensayo
// ========================================================================

/**
 * Obtiene una versión específica del ensayo por número de versión
 */
export async function getEssayVersionByNumber(
	artifactId: string,
	versionNumber: number,
): Promise<{
	success: boolean;
	data?: EssayVersion | null;
	error?: string;
}> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("cog_essay_edit_history")
			.select("*")
			.eq("artifact_id", artifactId)
			.eq("version_number", versionNumber)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return { success: true, data: null };
			}
			throw error;
		}

		return {
			success: true,
			data: data as EssayVersion,
		};
	} catch (error) {
		console.error("Error obteniendo versión específica:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}
