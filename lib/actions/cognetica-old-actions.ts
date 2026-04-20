"use server";

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import Replicate from "replicate";

import { extractCognitiveElements } from "./cognetica-old-extraction-actions";
import { splitPDFIntoPages } from "./cognetica-old-presentation-actions";
import { ResultadoOperacion } from "./cognetica-old-filters-actions";

// Constante de permiso (patrón dimension-actions.ts)
const PERMISO_GESTIONAR_COGNETICA = "can_manage_master_data";

// ========================================================================
//	INTERNAL HELPER FUNCTION: VERIFY PERMISSION (patrón dimension-actions.ts)
// ========================================================================
/**
 * Verifica que el usuario tenga permiso para gestionar datos del proyecto.
 * Usa el mismo RPC que dimension-actions.ts para consistencia.
 */
async function verificarPermisoGestionCognetica(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	userId: string,
	projectId: string,
): Promise<boolean> {
	const { data: tienePermiso, error: rpcError } = await supabase.rpc(
		"has_permission_in_project",
		{
			p_user_id: userId,
			p_project_id: projectId,
			p_permission_column: PERMISO_GESTIONAR_COGNETICA,
		},
	);
	if (rpcError) {
		console.error(
			`[AUTH_CHECK_ERROR] RPC has_permission_in_project (cognetica-artifacts): ${rpcError.message}`,
		);
		return false;
	}
	return tienePermiso === true;
}

// Tipos para la respuesta de Whisper via Replicate (simplificados)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface WhisperReplicateResponse {
	metadata: {
		transaction_key: string;
		request_id: string;
		duration: number;
		channels: number;
	};
	results: {
		channels: Array<{
			alternatives: Array<{
				transcript: string;
				confidence: number;
				words: Array<{
					word: string;
					start: number;
					end: number;
					confidence: number;
					speaker?: number;
					punctuated_word?: string;
				}>;
				paragraphs?: {
					transcript: string;
					paragraphs: Array<{
						text: string;
						start: number;
						end: number;
						speaker?: number;
					}>;
				};
				topics?: Array<{
					topics: Array<{
						topic: string;
						confidence_score: number;
					}>;
					text: string;
					start: number;
					end: number;
				}>;
			}>;
		}>;
	};
}

/**
 * Paso 1: Crear el registro del artefacto en la base de datos antes de subir el archivo.
 * Retorna el ID para usarlo en el nombre del archivo y seguimiento.
 */
export async function createArtifactRecord(
	projectId: string,
	title: string,
	type: "audio" | "video" | "markdown" | "pdf_report" | "pdf_slides" | "image",
	fileName: string,
	fileSize?: number,
	mimeType?: string,
	createdBy?: string,
	fileCreatedAt?: Date,
): Promise<ResultadoOperacion<string>> {
	console.log("💾 [createArtifactRecord] Guardando:", {
		project_id: projectId,
		title,
		type,
		file_size: fileSize,
		mime_type: mimeType,
		created_by: createdBy,
	});

	// 🔄 REINTENTOS: Crear cliente Supabase con reintentos para evitar desconexiones intermitentes
	let supabase = await createServerClient();
	let currentUser = null;
	let retryCount = 0;
	const MAX_RETRIES = 3;

	// 🔐 VERIFICAR USUARIO AUTENTICADO CON REINTENTOS
	while (retryCount < MAX_RETRIES) {
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (user) {
			currentUser = user;
			console.log(
				`💾 [createArtifactRecord] ✅ Usuario autenticado: ${currentUser.id}`,
			);
			break;
		}

		if (authError) {
			console.warn(
				`💾 [createArtifactRecord] ⚠️ Error de autenticación (intento ${retryCount + 1}/${MAX_RETRIES}):`,
				authError.message,
			);
		}

		retryCount++;
		if (retryCount < MAX_RETRIES) {
			console.log(
				`💾 [createArtifactRecord] 🔄 Reintentando con nuevo cliente Supabase...`,
			);
			await new Promise((resolve) => setTimeout(resolve, 500)); // Esperar 500ms
			supabase = await createServerClient(); // Recrear cliente
		}
	}

	if (!currentUser) {
		console.error(
			"💾 [createArtifactRecord] ❌ Usuario no autenticado después de reintentos",
		);
		return {
			success: false,
			error:
				"Sesión expirada o no autenticado. Por favor, recarga la página e intenta nuevamente.",
		};
	}

	// 🔐 VERIFICAR PERMISOS EN PROYECTO (patrón dimension-actions.ts)
	const tienePermiso = await verificarPermisoGestionCognetica(
		supabase,
		currentUser.id,
		projectId,
	);
	if (!tienePermiso) {
		console.error(
			`💾 [createArtifactRecord] ❌ Usuario sin permisos en proyecto ${projectId}`,
		);
		return {
			success: false,
			error: "No tienes permiso para crear artefactos en este proyecto",
		};
	}
	console.log(
		`💾 [createArtifactRecord] ✅ Usuario tiene permisos en proyecto: ${projectId}`,
	);

	const { data, error } = await supabase
		.from("cog_artifacts")
		.insert({
			project_id: projectId,
			title: title,
			type: type,
			file_size_bytes: fileSize, // Nombre correcto según types.ts actualizado
			mime_type: mimeType,
			created_by: createdBy,
			storage_path: "temp", // Se actualizará tras la subida
			status: "uploading",
			source_metadata: {
				original_filename: fileName,
				file_size_bytes: fileSize,
				mime_type: mimeType,
				file_created_at: fileCreatedAt?.toISOString(),
			},
		})
		.select("id")
		.single();

	if (error) {
		console.error("❌ [createArtifactRecord] Error:", error);
		return { success: false, error: error.message };
	}

	console.log("✅ [createArtifactRecord] Artefacto creado con ID:", data.id);
	return { success: true, data: data.id };
}

// ─── Agregar/Modificar Semilla (Append Only) ────────────────────────────────

interface AddSeedInput {
	artifactId: string;
	content: string;
	context?: string;
	properties?: Record<string, unknown>;
	tags?: string[];
	isCorrection?: boolean; // true si es una corrección (ej: apellido mal escrito)
}

export async function addSeedToArtifact(
	input: AddSeedInput,
): Promise<ResultadoOperacion<Record<string, unknown>>> {
	try {
		const supabase = await createServerClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return { success: false, error: "No autenticado" };

		// Verificar que el usuario tiene acceso al artefacto
		const { data: artifact, error: artifactError } = await supabase
			.from("cog_artifacts")
			.select("project_id")
			.eq("id", input.artifactId)
			.single();

		if (artifactError || !artifact) {
			return { success: false, error: "Artefacto no encontrado" };
		}

		// Verificar acceso al proyecto
		const { data: member } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", artifact.project_id)
			.eq("user_id", user.id)
			.single();

		if (!member) {
			return { success: false, error: "Sin acceso al proyecto" };
		}

		// Preparar tags (siempre incluir 'manual' para distinguir de las automáticas)
		const tags = [
			"manual",
			...(input.isCorrection ? ["correction"] : []),
			...(input.tags || []),
		];

		// Insertar nueva semilla (append only - nunca modifica existentes)
		const { data: newSeed, error: seedError } = await supabase
			.from("cog_fractal_seeds")
			.insert({
				artifact_id: input.artifactId,
				project_id: artifact.project_id,
				content: input.content.trim(),
				context: input.context?.trim() || null,
				properties: {
					...input.properties,
					source: "manual",
					is_correction: input.isCorrection || false,
				},
				tags: tags,
				created_by: user.id,
			})
			.select()
			.single();

		if (seedError) {
			console.error("❌ Error insertando semilla:", seedError);
			return { success: false, error: seedError.message };
		}

		console.log(
			`✅ Semilla agregada: "${input.content}" ${input.isCorrection ? "(corrección)" : "(nueva)"}`,
		);

		return {
			success: true,
			data: {
				id: newSeed.id,
				content: newSeed.content,
				is_correction: input.isCorrection || false,
			},
		};
	} catch (error) {
		console.error("❌ Error en addSeedToArtifact:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

/**
 * Paso 2: Notificar que la subida terminó y lanzar el procesamiento.
 * Detecta el tipo de artefacto y rutea al procesador correcto.
 */
export async function finalizeUploadAndProcess(
	artifactId: string,
	storagePath: string,
) {
	console.log(
		`🚀 [finalizeUploadAndProcess] INICIANDO con artifactId: ${artifactId}, storagePath: ${storagePath}`,
	);

	const supabase = await createServerClient();

	// 1. Obtener tipo de artefacto para rutear al procesador correcto
	console.log(`🔍 [finalizeUploadAndProcess] Consultando artefacto en BD...`);
	const { data: artifact, error: fetchError } = await supabase
		.from("cog_artifacts")
		.select("type, mime_type")
		.eq("id", artifactId)
		.single();

	if (fetchError || !artifact) {
		console.error(
			`❌ [finalizeUploadAndProcess] Error obteniendo artefacto:`,
			fetchError,
		);
		return {
			success: false,
			error: fetchError?.message || "Artefacto no encontrado",
		};
	}

	console.log(`✅ [finalizeUploadAndProcess] Artefacto encontrado:`, {
		type: artifact.type,
		mime_type: artifact.mime_type,
	});

	console.log(`🔍 [Router] Artefacto ID: ${artifactId}`);
	console.log(`🔍 [Router] Type en DB: "${artifact.type}"`);
	console.log(`🔍 [Router] MIME Type en DB: "${artifact.mime_type}"`);
	console.log(`🔍 [Router] Storage Path: "${storagePath}"`);

	// 2. Actualizar path y estado
	const { error: updateError } = await supabase
		.from("cog_artifacts")
		.update({
			storage_path: storagePath,
			status: "analyzing",
		})
		.eq("id", artifactId);

	if (updateError) return { success: false, error: updateError.message };

	// 3. Rutear al procesador según tipo específico
	try {
		if (artifact.type === "markdown") {
			console.log(`📄 [Router] ✅ Ruteando a procesador de Markdown`);
			await processMarkdownDocument(artifactId, storagePath);
		} else if (artifact.type === "pdf_report") {
			console.log(
				`📕 [Router] ✅ Ruteando a procesador de PDF (Informe completo)`,
			);
			await processDocumentPDF(artifactId, storagePath);
		} else if (artifact.type === "pdf_slides") {
			console.log(
				`📊 [Router] ✅ Ruteando a procesador de PDF Slides (página por página)`,
			);
			// Para slides: dividir en páginas individuales
			const splitResult = await splitPDFIntoPages(artifactId, storagePath);
			if (!splitResult.success) {
				throw new Error(
					`Error dividiendo PDF en páginas: ${splitResult.error}`,
				);
			}
			console.log(
				`📊 [Router] ✅ PDF dividido en ${splitResult.data.totalPages} páginas`,
			);
			// Las páginas se procesarán individualmente desde la UI
		} else if (artifact.type === "audio" || artifact.type === "video") {
			console.log(
				`🎙️ [Router] ✅ Ruteando a procesador de Audio/Video (Whisper/Replicate)`,
			);
			await processWithWhisper(artifactId, storagePath);
		} else if (artifact.type === "image") {
			console.log(`🖼️ [Router] ⚠️ Tipo 'image' aún no tiene procesador`);
			return { success: true }; // No falla, solo no procesa
		} else {
			console.error(`❌ [Router] Tipo no reconocido:`, {
				type: artifact.type,
				mime: artifact.mime_type,
				path: storagePath,
			});
			throw new Error(
				`Tipo de archivo no soportado: ${artifact.type} (${artifact.mime_type})`,
			);
		}

		revalidatePath("/cognetica_old");
		return { success: true };
	} catch (error) {
		console.error("Error en procesamiento:", error);
		await supabase
			.from("cog_artifacts")
			.update({
				status: "error",
				error_log: String(error),
			})
			.eq("id", artifactId);
		return {
			success: false,
			error: "La subida funcionó pero el análisis falló. Revisa el log.",
		};
	}
}

/**
 * Obtener artefacto completo con URL firmada y transcripción
 */
export async function getArtifactWithUrl(artifactId: string) {
	const supabase = await createServerClient();

	// 1. Obtener metadata del artefacto
	const { data: artifact, error } = await supabase
		.from("cog_artifacts")
		.select("*")
		.eq("id", artifactId)
		.single();

	if (error || !artifact)
		return {
			success: false,
			error: error?.message || "Artefacto no encontrado",
		};

	// 2. Obtener transcripción si existe
	const { data: transcriptions } = await supabase
		.from("cog_transcriptions")
		.select("*")
		.eq("artifact_id", artifactId)
		.order("created_at", { ascending: false })
		.limit(1);

	const transcription = transcriptions?.[0] || null;

	// 3. Obtener semillas fractales
	const { data: seeds } = await supabase
		.from("cog_fractal_seeds")
		.select("id, content, context, properties, tags")
		.eq("artifact_id", artifactId)
		.order("created_at", { ascending: false });

	// 4. Obtener pensadores (references)
	const { data: thinkers } = await supabase
		.from("cog_artifact_references")
		.select(
			`
            context_snippet,
            reference:cog_references (
                id, name, era, bio_snippet, key_contributions,
                discipline:cog_disciplines (name)
            )
        `,
		)
		.eq("artifact_id", artifactId);

	// 5. Obtener disciplinas
	const { data: disciplines } = await supabase
		.from("cog_artifact_disciplines")
		.select("discipline:cog_disciplines (id, name)")
		.eq("artifact_id", artifactId);

	// 6. Obtener teorías
	const { data: theories } = await supabase
		.from("cog_artifact_theories")
		.select("theory:cog_theories (id, name)")
		.eq("artifact_id", artifactId);

	// 7. Obtener corrientes de pensamiento
	const { data: streams } = await supabase
		.from("cog_artifact_streams")
		.select("stream:cog_thought_streams (id, name)")
		.eq("artifact_id", artifactId);

	// 8. Generar URL firmada para reproducción (validez 1 hora)
	const { data: signedUrlData } = await supabase.storage
		.from("cognetica-files")
		.createSignedUrl(artifact.storage_path, 3600);

	return {
		success: true,
		data: {
			...artifact,
			signedUrl: signedUrlData?.signedUrl || null,
			transcription: transcription,
			seeds: seeds || [],
			thinkers: thinkers || [],
			disciplines: disciplines || [],
			theories: theories || [],
			streams: streams || [],
		},
	};
}

/**
 * Helper: Parsear Markdown con frontmatter opcional
 */
function parseMarkdown(markdownText: string): {
	content: string;
	frontmatter: Record<string, unknown> | null;
} {
	// Detectar frontmatter YAML (--- al inicio)
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
	const match = markdownText.match(frontmatterRegex);

	if (match) {
		// Tiene frontmatter
		const frontmatterText = match[1];
		const content = match[2];

		// Parsear YAML simple (solo key: value)
		const frontmatter: Record<string, unknown> = {};
		frontmatterText.split("\n").forEach((line) => {
			const colonIndex = line.indexOf(":");
			if (colonIndex > 0) {
				const key = line.substring(0, colonIndex).trim();
				const value = line.substring(colonIndex + 1).trim();
				if (key && value) {
					frontmatter[key] = value;
				}
			}
		});

		return { content, frontmatter };
	}

	// Sin frontmatter, todo es contenido
	return { content: markdownText, frontmatter: null };
}

/**
 * Procesador de Documentos Markdown
 * Metaboliza .md a texto en cog_transcriptions para que el core lógico sea idéntico
 */
async function processMarkdownDocument(
	artifactId: string,
	storagePath: string,
) {
	console.log(
		`📄 [Markdown] Iniciando procesamiento para artefacto: ${artifactId}`,
	);
	console.log(`📄 [Markdown] Storage path: ${storagePath}`);

	const supabase = await createServerClient();

	try {
		// 1. Descargar archivo .md desde Storage
		console.log(`📄 [Markdown] Descargando archivo desde Storage...`);
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(storagePath);

		if (downloadError || !fileData) {
			throw new Error(
				"Error descargando archivo .md: " + downloadError?.message,
			);
		}
		console.log(`📄 [Markdown] ✅ Archivo descargado (${fileData.size} bytes)`);

		// 2. Leer contenido como texto
		const markdownText = await fileData.text();
		console.log(
			`📄 [Markdown] ✅ Contenido leído (${markdownText.length} caracteres)`,
		);

		// 3. Parsear frontmatter (opcional) y extraer texto puro
		const { content, frontmatter } = parseMarkdown(markdownText);
		console.log(
			`📄 [Markdown] Frontmatter detectado:`,
			frontmatter ? "SÍ" : "NO",
		);

		// 4. Crear "transcripción sintética" en cog_transcriptions
		// Esto permite que todo el core lógico (QUIPU, export, etc.) funcione igual
		console.log(`📄 [Markdown] Creando transcripción sintética...`);
		const { error: transError } = await supabase
			.from("cog_transcriptions")
			.insert({
				artifact_id: artifactId,
				full_text: content,
				provider: "markdown_import",
				language: frontmatter?.language || frontmatter?.lang || "es",
				confidence_score: 1.0, // Confianza máxima (es texto directo)
				segments: null, // No hay segmentos temporales en Markdown
			} as any);

		if (transError)
			throw new Error("Error guardando transcripción: " + transError.message);
		console.log(`📄 [Markdown] ✅ Transcripción sintética creada`);

		// 5. Generar descripción automática con DeepSeek
		console.log(`🤖 [DeepSeek] Generando descripción automática...`);
		let autoDescription = null;
		try {
			const descriptionPrompt = `Analiza el siguiente documento Markdown y genera una descripción concisa (máximo 2-3 oraciones) que capture la esencia del contenido:

Documento:
${content.substring(0, 1500)}${content.length > 1500 ? "..." : ""}

Descripción:`;

			const deepseekResponse = await fetch(
				"https://api.deepseek.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
					},
					body: JSON.stringify({
						model: "deepseek-chat",
						messages: [
							{
								role: "system",
								content:
									"Eres un asistente experto en análisis de contenido. Genera descripciones concisas y precisas.",
							},
							{ role: "user", content: descriptionPrompt },
						],
						temperature: 0.3,
						max_tokens: 200,
					}),
				},
			);

			if (deepseekResponse.ok) {
				const deepseekData = await deepseekResponse.json();
				autoDescription = deepseekData.choices[0].message.content.trim();
				console.log(`🤖 [DeepSeek] ✅ Descripción generada:`, autoDescription);
			} else {
				console.error(
					`🤖 [DeepSeek] ⚠️ Error generando descripción:`,
					await deepseekResponse.text(),
				);
			}
		} catch (err) {
			console.error(
				`🤖 [DeepSeek] ⚠️ Error en generación de descripción (no bloqueante):`,
				err,
			);
		}

		// 6. Marcar como completado y guardar descripción
		await supabase
			.from("cog_artifacts")
			.update({
				status: "completed",
				description:
					autoDescription || frontmatter?.description || frontmatter?.title,
				updated_at: new Date().toISOString(),
			})
			.eq("id", artifactId);

		console.log(
			`📄 [Markdown] ✅ Documento procesado y marcado como completado`,
		);

		// 7. Extraer elementos cognitivos (fire & forget)
		// Mismo flujo que audio: extrae semillas, disciplinas, teorías, etc.
		extractCognitiveElements(artifactId).catch((err) => {
			console.error(
				`📄 [Markdown] ⚠️ Error en extracción cognitiva (no bloqueante):`,
				err,
			);
		});
	} catch (error) {
		console.error(`📄 [Markdown] ❌ Error fatal:`, error);
		throw error;
	}
}

/**
 * Procesador de Documentos PDF
 * Metaboliza PDF a Markdown estructurado usando pdf.js
 */
async function processDocumentPDF(artifactId: string, storagePath: string) {
	console.log(`📕 [PDF] Iniciando procesamiento para artefacto: ${artifactId}`);
	console.log(`📕 [PDF] Storage path: ${storagePath}`);

	const supabase = await createServerClient();

	try {
		// 1. Descargar archivo PDF desde Storage
		console.log(`📕 [PDF] Descargando archivo desde Storage...`);
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("cognetica-files")
			.download(storagePath);

		if (downloadError || !fileData) {
			throw new Error(
				"Error descargando archivo PDF: " + downloadError?.message,
			);
		}
		console.log(`📕 [PDF] ✅ Archivo descargado (${fileData.size} bytes)`);

		// 2. Procesar PDF usando API Route (evita problemas SSR con pdf.js)
		console.log(`📕 [PDF] Procesando con API Route...`);

		// Crear FormData con el archivo
		const formData = new FormData();
		formData.append("file", fileData);

		// Llamar a API Route para procesamiento
		const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const response = await fetch(`${apiUrl}/api/cognetica_old/process-pdf`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error en API de procesamiento PDF: ${errorText}`);
		}

		const { markdown: markdownContent, metadata } = await response.json();

		console.log(`📕 [PDF] ✅ Metadata extraída:`, {
			pages: metadata.numPages,
			title: metadata.title,
			author: metadata.author,
		});
		console.log(
			`📕 [PDF] ✅ Contenido extraído (${markdownContent.length} caracteres)`,
		);

		// 3. Crear "transcripción sintética" en cog_transcriptions
		console.log(`📕 [PDF] Creando transcripción sintética...`);
		const { error: transError } = await supabase
			.from("cog_transcriptions")
			.insert({
				artifact_id: artifactId,
				full_text: markdownContent,
				provider: "pdf_import",
				language: "es", // TODO: detectar idioma con IA
				confidence_score: 0.95, // Alta confianza (es texto extraído)
				segments: null, // No hay segmentos temporales en PDF
			});

		if (transError)
			throw new Error("Error guardando transcripción: " + transError.message);
		console.log(`📕 [PDF] ✅ Transcripción sintética creada`);

		// 4. Generar descripción automática con DeepSeek
		console.log(`🤖 [DeepSeek] Generando descripción automática...`);
		let autoDescription = metadata.title || null;
		try {
			const descriptionPrompt = `Analiza el siguiente documento PDF (${metadata.numPages} páginas) y genera una descripción concisa (máximo 2-3 oraciones) que capture la esencia del contenido:

Título: ${metadata.title || "Sin título"}
Autor: ${metadata.author || "Desconocido"}

Contenido:
${markdownContent.substring(0, 1500)}${markdownContent.length > 1500 ? "..." : ""}

Descripción:`;

			const deepseekResponse = await fetch(
				"https://api.deepseek.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
					},
					body: JSON.stringify({
						model: "deepseek-chat",
						messages: [
							{
								role: "system",
								content:
									"Eres un asistente experto en análisis de contenido. Genera descripciones concisas y precisas.",
							},
							{ role: "user", content: descriptionPrompt },
						],
						temperature: 0.3,
						max_tokens: 200,
					}),
				},
			);

			if (deepseekResponse.ok) {
				const deepseekData = await deepseekResponse.json();
				autoDescription = deepseekData.choices[0].message.content.trim();
				console.log(`🤖 [DeepSeek] ✅ Descripción generada:`, autoDescription);
			} else {
				console.error(
					`🤖 [DeepSeek] ⚠️ Error generando descripción:`,
					await deepseekResponse.text(),
				);
			}
		} catch (err) {
			console.error(
				`🤖 [DeepSeek] ⚠️ Error en generación de descripción (no bloqueante):`,
				err,
			);
		}

		// 5. Marcar como completado y guardar descripción
		await supabase
			.from("cog_artifacts")
			.update({
				status: "completed",
				description:
					autoDescription || `Documento PDF (${metadata.numPages} páginas)`,
				updated_at: new Date().toISOString(),
			})
			.eq("id", artifactId);

		console.log(`📕 [PDF] ✅ Documento procesado y marcado como completado`);
		console.log(
			`📕 [PDF] ℹ️ Extracción cognitiva disponible - Usuario debe presionar botón`,
		);

		// NOTA: NO auto-ejecutar extractCognitiveElements para PDFs
		// El usuario debe presionar "Ejecutar Análisis Cognitivo" explícitamente
		// Esto evita ejecuciones fantasma que no actualizan el cliente
	} catch (error) {
		console.error(`📕 [PDF] ❌ Error fatal:`, error);
		throw error;
	}
}

/**
 * Lógica Core: Whisper via Replicate Integration
 */
async function processWithWhisper(artifactId: string, storagePath: string) {
	console.log(
		`🎙️ [Whisper] Iniciando procesamiento para artefacto: ${artifactId}`,
	);
	console.log(`🎙️ [Whisper] Storage path: ${storagePath}`);

	const supabase = await createServerClient();
	const apiKey = process.env.REPLICATE_API_TOKEN;

	if (!apiKey) {
		console.error(
			"🎙️ [Whisper] ❌ REPLICATE_API_TOKEN no encontrada en variables de entorno",
		);
		throw new Error(
			"REPLICATE_API_TOKEN no configurada. Agrégala a tu archivo .env.local",
		);
	}
	console.log(
		`🎙️ [Whisper] ✅ API Key encontrada (${apiKey.substring(0, 8)}...)`,
	);

	// 1. Obtener URL firmada temporal para que Replicate pueda descargar el archivo
	console.log(
		`🎙️ [Whisper] Generando URL firmada para bucket 'cognetica-files'...`,
	);
	const { data: signedUrlData, error: signError } = await supabase.storage
		.from("cognetica-files")
		.createSignedUrl(storagePath, 3600); // 1 hora validez

	if (signError || !signedUrlData) {
		console.error("🎙️ [Whisper] ❌ Error generando URL firmada:", signError);
		throw new Error("No se pudo generar URL firmada: " + signError?.message);
	}
	console.log(`🎙️ [Whisper] ✅ URL firmada generada correctamente`);

	const fileUrl = signedUrlData.signedUrl;

	// 2. Inicializar SDK de Replicate
	const replicate = new Replicate({
		auth: apiKey,
	});

	console.log(`🎙️ [Whisper] Enviando audio a WhisperX Large v3...`);

	// 3. Ejecutar modelo WhisperX con configuración optimizada
	let output: unknown;
	try {
		output = await replicate.run(
			"victor-upmeet/whisperx:84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb",
			{
				input: {
					audio_file: fileUrl,
					debug: false,
					batch_size: 64,
					diarization: true, // Detectar hablantes
					align_output: true, // Timestamps precisos
					temperature: 0,
					vad_onset: 0.5,
					vad_offset: 0.363,
					language_detection_min_prob: 0,
					language_detection_max_tries: 5,
				},
			},
		);
		console.log(`🎙️ [Whisper] ✅ Transcripción exitosa`);
	} catch (error: unknown) {
		console.error(`🎙️ [Whisper] ❌ Error en transcripción:`, error);
		throw new Error(
			`Error en WhisperX: ${(error as Error).message || "Error desconocido"}`,
		);
	}

	// 4. Extraer texto y segmentos de la respuesta
	const transcriptText =
		typeof output === "string" ? output : (
			(output as { text?: string; transcription?: string }).text ||
			(output as { text?: string; transcription?: string }).transcription ||
			JSON.stringify(output)
		);

	console.log(
		`🎙️ [Whisper] Texto transcrito (primeros 200 chars):`,
		transcriptText.substring(0, 200),
	);

	// Extraer segmentos si están disponibles en el output
	let segments: Array<Record<string, unknown>> = [];
	if (typeof output === "object" && output !== null) {
		// WhisperX puede retornar segmentos en diferentes formatos
		const outputWithSegments = output as {
			segments?: Array<Record<string, unknown>>;
			words?: Array<Record<string, unknown>>;
		};
		if (Array.isArray(outputWithSegments.segments)) {
			segments = outputWithSegments.segments.map(
				(seg: Record<string, unknown>) => ({
					start: seg.start || 0,
					end: seg.end || 0,
					text: seg.text || "",
					speaker: seg.speaker || "SPEAKER_00",
				}),
			);
		} else if (Array.isArray(outputWithSegments.words)) {
			// Si solo hay words, agruparlos en segmentos de ~10 segundos
			const wordsPerSegment = 20;
			for (
				let i = 0;
				i < outputWithSegments.words.length;
				i += wordsPerSegment
			) {
				const chunk = outputWithSegments.words.slice(i, i + wordsPerSegment);
				if (chunk.length > 0) {
					segments.push({
						start: chunk[0].start || 0,
						end: chunk[chunk.length - 1].end || 0,
						text: chunk
							.map((w: Record<string, unknown>) => w.word || w.text || "")
							.join(" "),
						speaker: chunk[0].speaker || "SPEAKER_00",
					});
				}
			}
		}
	}

	console.log(`🎙️ [Whisper] Segmentos extraídos: ${segments.length}`);

	// 5. Guardar Transcripción
	const { error: transError } = await supabase
		.from("cog_transcriptions")
		.insert({
			artifact_id: artifactId,
			full_text: transcriptText,
			segments: segments,
			provider: "whisperx-replicate",
			language: "es",
			confidence_score: 0.9,
		} as any);

	if (transError)
		throw new Error("Error guardando transcripción: " + transError.message);

	// 6. Generar descripción automática con DeepSeek
	console.log(`🤖 [DeepSeek] Generando descripción automática...`);
	let autoDescription = null;
	try {
		const descriptionPrompt = `Analiza la siguiente transcripción de audio y genera una descripción concisa (máximo 2-3 oraciones) que capture la esencia del contenido:

Transcripción:
${transcriptText.substring(0, 1500)}${transcriptText.length > 1500 ? "..." : ""}

Descripción:`;

		const deepseekResponse = await fetch(
			"https://api.deepseek.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
				},
				body: JSON.stringify({
					model: "deepseek-chat",
					messages: [
						{
							role: "system",
							content:
								"Eres un asistente experto en análisis de contenido. Genera descripciones concisas y precisas.",
						},
						{ role: "user", content: descriptionPrompt },
					],
					temperature: 0.3,
					max_tokens: 200,
				}),
			},
		);

		if (deepseekResponse.ok) {
			const deepseekData = await deepseekResponse.json();
			autoDescription = deepseekData.choices[0].message.content.trim();
			console.log(`🤖 [DeepSeek] ✅ Descripción generada:`, autoDescription);
		} else {
			console.error(
				`🤖 [DeepSeek] ⚠️ Error generando descripción:`,
				await deepseekResponse.text(),
			);
		}
	} catch (err) {
		console.error(
			`🤖 [DeepSeek] ⚠️ Error en generación de descripción (no bloqueante):`,
			err,
		);
	}

	// 7. Marcar como completado y guardar descripción
	await supabase
		.from("cog_artifacts")
		.update({
			status: "completed",
			duration_seconds: null, // WhisperX no siempre retorna duración
			description: autoDescription,
			updated_at: new Date().toISOString(),
		})
		.eq("id", artifactId);

	console.log(`🎙️ [Whisper] ✅ Transcripción completada y guardada`);

	// 8. Revalidar rutas para que el frontend se actualice
	revalidatePath("/cognetica_old");
	revalidatePath(`/cognetica_old/${artifactId}`);

	// 9. ⚠️ DESCONECTADO: Extracción cognitiva ahora es manual desde el ensayo
	// extractCognitiveElements(artifactId).catch(err => {
	//     console.error(`🎙️ [Whisper] ⚠️ Error en extracción DeepSeek (no bloqueante):`, err);
	// });
}

/**
 * Reintentar transcripción para artefactos que fallaron o quedaron sin transcribir.
 * Útil cuando hay errores temporales (API key, red, etc.)
 */
export async function updateArtifactMetadata(
	artifactId: string,
	metadata: Record<string, unknown>,
) {
	console.log(
		`🔄 [UpdateMetadata] Actualizando metadata para artefacto: ${artifactId}`,
		metadata,
	);

	const supabase = await createServerClient();

	// Obtener metadata actual
	const { data: artifact, error: fetchError } = await supabase
		.from("cog_artifacts")
		.select("source_metadata")
		.eq("id", artifactId)
		.single();

	if (fetchError || !artifact) {
		console.error(
			`🔄 [UpdateMetadata] ❌ Artefacto no encontrado:`,
			fetchError,
		);
		return { success: false, error: "Artefacto no encontrado" };
	}

	// Merge metadata existente con nueva
	const currentMetadata =
		artifact.source_metadata && typeof artifact.source_metadata === "object" ?
			artifact.source_metadata
		:	{};
	const updatedMetadata = {
		...currentMetadata,
		...metadata,
	};

	// Actualizar
	const { error: updateError } = await supabase
		.from("cog_artifacts")
		.update({
			source_metadata: updatedMetadata as any,
			updated_at: new Date().toISOString(),
		})
		.eq("id", artifactId);

	if (updateError) {
		console.error(`🔄 [UpdateMetadata] ❌ Error actualizando:`, updateError);
		return { success: false, error: updateError.message };
	}

	console.log(`✅ [UpdateMetadata] Metadata actualizada exitosamente`);
	revalidatePath(`/cognetica_old/${artifactId}`);
	return { success: true };
}

export async function retryTranscription(artifactId: string) {
	console.log(
		`🔄 [Retry] Reintentando transcripción para artefacto: ${artifactId}`,
	);

	const supabase = await createServerClient();

	// 1. Obtener el artefacto para verificar que existe y tiene storage_path
	const { data: artifact, error: fetchError } = await supabase
		.from("cog_artifacts")
		.select("id, storage_path, status, project_id")
		.eq("id", artifactId)
		.single();

	if (fetchError || !artifact) {
		console.error(`🔄 [Retry] ❌ Artefacto no encontrado:`, fetchError);
		return { success: false, error: "Artefacto no encontrado" };
	}

	if (!artifact.storage_path || artifact.storage_path === "temp") {
		console.error(`🔄 [Retry] ❌ Artefacto sin archivo subido`);
		return {
			success: false,
			error: "El artefacto no tiene archivo subido. Sube el archivo primero.",
		};
	}

	// 2. Actualizar estado a "analyzing"
	await supabase
		.from("cog_artifacts")
		.update({
			status: "analyzing",
			error_log: null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", artifactId);

	// 3. Reintentar el proceso de Whisper
	try {
		await processWithWhisper(artifactId, artifact.storage_path);
		revalidatePath("/cognetica_old");
		revalidatePath(`/cognetica_old/${artifactId}`);
		return { success: true, message: "Transcripción completada exitosamente" };
	} catch (error) {
		console.error(`🔄 [Retry] ❌ Error en reintento:`, error);
		await supabase
			.from("cog_artifacts")
			.update({
				status: "error",
				error_log: String(error),
				updated_at: new Date().toISOString(),
			})
			.eq("id", artifactId);
		return { success: false, error: String(error) };
	}
}

/**
 * Obtiene la crónica forense ya guardada de un artefacto.
 * Lectura directa desde source_metadata.micelio_chronicle.
 */
export async function getChronicleForArtifact(artifactId: string): Promise<
	ResultadoOperacion<{
		has_chronicle: boolean;
		chronicle: {
			ejecutado_en: string;
			version_extendida: string;
			version_destilada: string;
			cronica: string;
			semillas_clave: string[];
			tension_central: string;
			nota_cronista: string;
			stats: {
				semillas_input: number;
				pensadores_input: number;
				disciplinas_input: number;
				chars_texto: number;
			};
		} | null;
	}>
> {
	const supabase = await createServerClient();

	const { data: artifact, error } = await supabase
		.from("cog_artifacts")
		.select("source_metadata")
		.eq("id", artifactId)
		.single();

	if (error || !artifact) {
		return { success: false, error: "Artefacto no encontrado" };
	}

	const sourceMeta =
		(artifact.source_metadata as Record<string, unknown>) || {};
	const chronicle = sourceMeta.micelio_chronicle || null;

	return {
		success: true,
		data: {
			has_chronicle: !!chronicle,
			chronicle: chronicle as any,
		},
	};
}

/**
 * Actualizar el título de un artefacto
 */
export async function updateArtifactTitle(
	artifactId: string,
	newTitle: string,
): Promise<{ success: boolean; error?: string }> {
	const trimmed = newTitle.trim();
	if (!trimmed)
		return { success: false, error: "El título no puede estar vacío" };

	const supabase = await createServerClient();
	const { error } = await supabase
		.from("cog_artifacts")
		.update({ title: trimmed })
		.eq("id", artifactId);

	if (error) return { success: false, error: error.message };

	revalidatePath("/cognetica_old");
	revalidatePath(`/cognetica_old/${artifactId}`);
	return { success: true };
}
