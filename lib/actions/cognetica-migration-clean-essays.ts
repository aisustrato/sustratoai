// 📍 lib/actions/cognetica-migration-clean-essays.ts
// 🎯 PROPÓSITO: Migración para limpiar ensayos destilados que quedaron envueltos en JSON
// 🔧 USO: Ejecutar una sola vez para limpiar registros existentes

"use server";

import { createSupabaseServerClient } from "@/lib/server";

interface CleanupResult {
	success: boolean;
	cleaned: number;
	skipped: number;
	errors: number;
	details: Array<{
		transcription_id: string;
		artifact_id: string;
		status: "cleaned" | "skipped" | "error";
		message?: string;
	}>;
}

/**
 * Limpia ensayos destilados que quedaron envueltos en JSON
 * Extrae solo el campo 'essay' del JSON y actualiza la BD
 */
export async function cleanDistilledEssaysJSON(): Promise<CleanupResult> {
	const opId = `CLEAN-${Math.floor(Math.random() * 10000)}`;
	console.log(`🧹 [${opId}] Iniciando limpieza de ensayos destilados...`);

	const result: CleanupResult = {
		success: true,
		cleaned: 0,
		skipped: 0,
		errors: 0,
		details: [],
	};

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener todos los ensayos destilados
		const { data: transcriptions, error: fetchError } = await supabase
			.from("cog_transcriptions")
			.select("id, artifact_id, distilled_essay")
			.not("distilled_essay", "is", null);

		if (fetchError) {
			console.error(
				`❌ [${opId}] Error obteniendo transcripciones:`,
				fetchError,
			);
			return {
				success: false,
				cleaned: 0,
				skipped: 0,
				errors: 1,
				details: [
					{
						transcription_id: "N/A",
						artifact_id: "N/A",
						status: "error",
						message: fetchError.message,
					},
				],
			};
		}

		console.log(
			`📊 [${opId}] Encontradas ${transcriptions?.length || 0} transcripciones con ensayo destilado`,
		);

		if (!transcriptions || transcriptions.length === 0) {
			console.log(`ℹ️ [${opId}] No hay ensayos para limpiar`);
			return result;
		}

		// 2. Procesar cada transcripción
		for (const trans of transcriptions) {
			const essay = trans.distilled_essay;

			// Verificar si el ensayo está envuelto en JSON
			if (typeof essay === "string" && essay.trim().startsWith("{")) {
				try {
					const possibleJson = JSON.parse(essay);

					// Si tiene el campo 'essay', extraerlo
					if (possibleJson.essay && typeof possibleJson.essay === "string") {
						console.log(`🧹 [${opId}] Limpiando transcripción ${trans.id}...`);

						const cleanEssay = possibleJson.essay;

						// Actualizar en BD
						const { error: updateError } = await supabase
							.from("cog_transcriptions")
							.update({ distilled_essay: cleanEssay })
							.eq("id", trans.id);

						if (updateError) {
							console.error(
								`❌ [${opId}] Error actualizando ${trans.id}:`,
								updateError,
							);
							result.errors++;
							result.details.push({
								transcription_id: trans.id,
								artifact_id: trans.artifact_id || "N/A",
								status: "error",
								message: updateError.message,
							});
						} else {
							console.log(`✅ [${opId}] Limpiado ${trans.id}`);
							result.cleaned++;
							result.details.push({
								transcription_id: trans.id,
								artifact_id: trans.artifact_id || "N/A",
								status: "cleaned",
								message: `Extraído ensayo de ${cleanEssay.length} caracteres`,
							});
						}
					} else {
						// Es JSON pero no tiene campo 'essay'
						console.log(`⚠️ [${opId}] JSON sin campo 'essay' en ${trans.id}`);
						result.skipped++;
						result.details.push({
							transcription_id: trans.id,
							artifact_id: trans.artifact_id || "N/A",
							status: "skipped",
							message: "JSON sin campo essay",
						});
					}
				} catch (_parseError) {
					// No es JSON válido, probablemente ya está limpio
					console.log(
						`ℹ️ [${opId}] No es JSON válido (ya limpio): ${trans.id}`,
					);
					result.skipped++;
					result.details.push({
						transcription_id: trans.id,
						artifact_id: trans.artifact_id || "N/A",
						status: "skipped",
						message: "No es JSON, probablemente ya limpio",
					});
				}
			} else {
				// No empieza con '{', probablemente ya está limpio
				console.log(`ℹ️ [${opId}] Ya limpio: ${trans.id}`);
				result.skipped++;
				result.details.push({
					transcription_id: trans.id,
					artifact_id: trans.artifact_id || "N/A",
					status: "skipped",
					message: "Ya está limpio (no es JSON)",
				});
			}
		}

		console.log(`\n${"=".repeat(60)}`);
		console.log(`✅ [${opId}] LIMPIEZA COMPLETADA`);
		console.log(`📊 Resultados:`);
		console.log(`   ✅ Limpiados: ${result.cleaned}`);
		console.log(`   ⏭️  Omitidos: ${result.skipped}`);
		console.log(`   ❌ Errores: ${result.errors}`);
		console.log(`${"=".repeat(60)}\n`);

		return result;
	} catch (error) {
		console.error(`❌ [${opId}] Error en limpieza:`, error);
		return {
			success: false,
			cleaned: result.cleaned,
			skipped: result.skipped,
			errors: result.errors + 1,
			details: [
				...result.details,
				{
					transcription_id: "N/A",
					artifact_id: "N/A",
					status: "error",
					message: error instanceof Error ? error.message : "Error desconocido",
				},
			],
		};
	}
}
