// 📍 lib/actions/cognetica-lightweight-extraction-actions.ts
// 🎯 PROPÓSITO: Extracción ligera de pensadores y datos cronológicos desde transcripción completa
// 🔧 DECISIÓN: Usar DeepSeek Chat (modelo ligero) para procesar documento completo sin chunking

"use server";

import { createServerClient } from "@/lib/supabase";

/**
 * Borrar pensadores y datos cronológicos de un artefacto
 */
export async function deleteLightweightElements(artifactId: string) {
	console.log(
		`🗑️ [Lightweight] Iniciando borrado de pensadores y datos cronológicos para artefacto: ${artifactId}`,
	);

	const supabase = await createServerClient();

	try {
		// 0. Verificar qué datos existen ANTES de borrar
		const { data: existingChrono, error: checkChronoError } = await supabase
			.from("cog_chronological_data")
			.select("id", { count: "exact" })
			.eq("artifact_id", artifactId);

		console.log(
			`🔍 [Lightweight] Datos cronológicos existentes: ${existingChrono?.length || 0}`,
		);
		if (checkChronoError) {
			console.error(
				"⚠️ [Lightweight] Error verificando datos cronológicos:",
				checkChronoError,
			);
		}

		const { data: existingRefs, error: checkRefsError } = await supabase
			.from("cog_artifact_references")
			.select("reference_id", { count: "exact" })
			.eq("artifact_id", artifactId);

		console.log(
			`🔍 [Lightweight] Relaciones con pensadores existentes: ${existingRefs?.length || 0}`,
		);
		if (checkRefsError) {
			console.error(
				"⚠️ [Lightweight] Error verificando relaciones:",
				checkRefsError,
			);
		}

		// 1. Borrar datos cronológicos
		const { error: chronoError, count: chronoCount } = await supabase
			.from("cog_chronological_data")
			.delete({ count: "exact" })
			.eq("artifact_id", artifactId);

		if (chronoError) {
			console.error(
				"❌ [Lightweight] Error borrando datos cronológicos:",
				chronoError,
			);
			return {
				success: false,
				error: `Error borrando datos cronológicos: ${chronoError.message}`,
			};
		}

		console.log(
			`✅ [Lightweight] ${chronoCount || 0} datos cronológicos borrados`,
		);

		// 2. Borrar relaciones artefacto-pensadores (NO los pensadores en sí, solo la vinculación)
		const { error: refError, count: refCount } = await supabase
			.from("cog_artifact_references")
			.delete({ count: "exact" })
			.eq("artifact_id", artifactId);

		if (refError) {
			console.error(
				"❌ [Lightweight] Error borrando relaciones con pensadores:",
				refError,
			);
			return {
				success: false,
				error: `Error borrando relaciones con pensadores: ${refError.message}`,
			};
		}

		console.log(
			`✅ [Lightweight] ${refCount || 0} relaciones con pensadores borradas`,
		);

		return {
			success: true,
			data: {
				chronological_data_deleted: chronoCount || 0,
				thinker_relations_deleted: refCount || 0,
			},
		};
	} catch (error: unknown) {
		console.error("❌ [Lightweight] Error inesperado:", error);
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Error desconocido al borrar elementos ligeros",
		};
	}
}

/**
 * Interfaz para pensadores extraídos
 */
interface ExtractedThinker {
	name: string;
	discipline: string;
	era: string;
	bio_snippet: string;
	key_contributions: string[];
}

/**
 * Interfaz para datos cronológicos extraídos
 */
interface ExtractedChronologicalData {
	date_value: string;
	event_type: "date" | "event" | "period" | "milestone";
	description: string;
	context: string;
	confidence_score: number;
}

/**
 * Interfaz para la respuesta de la IA
 */
interface LightweightExtractionResponse {
	thinkers: ExtractedThinker[];
	chronological_data: ExtractedChronologicalData[];
}

/**
 * Extrae pensadores y datos cronológicos de la transcripción completa
 * usando DeepSeek Chat (modelo ligero y económico)
 */
export async function extractLightweightElements(artifactId: string) {
	console.log(
		`🧠 [Lightweight] Iniciando extracción ligera para artefacto: ${artifactId}`,
	);

	const supabase = await createServerClient();

	// 1. Obtener el project_id y tipo del artefacto
	const { data: artifact } = await supabase
		.from("cog_artifacts")
		.select("project_id, type, source_metadata")
		.eq("id", artifactId)
		.single();

	if (!artifact?.project_id) {
		return { success: false, error: "Artefacto sin proyecto asociado" };
	}

	let fullText = "";

	// 2. Obtener texto completo según tipo de artefacto
	console.log(`🧠 [Lightweight] Tipo de artefacto: ${artifact.type}`);

	// Detectar si es presentación
	const isPresentation =
		artifact.type === "pdf_slides" ||
		(artifact.source_metadata &&
			typeof artifact.source_metadata === "object" &&
			!Array.isArray(artifact.source_metadata) &&
			(("isPresentation" in artifact.source_metadata &&
				artifact.source_metadata.isPresentation === true) ||
				("processing_mode" in artifact.source_metadata &&
					artifact.source_metadata.processing_mode === "presentacion")));

	if (isPresentation) {
		// Para presentaciones: obtener markdown de todas las páginas
		console.log(
			`🧠 [Lightweight] Detectada presentación, obteniendo páginas...`,
		);

		const { data: pages, error: pagesError } = await supabase
			.from("cog_artifact_pages")
			.select("page_number, markdown_original")
			.eq("artifact_id", artifactId)
			.eq("status", "processed")
			.order("page_number", { ascending: true });

		if (pagesError || !pages || pages.length === 0) {
			console.error(
				"🧠 [Lightweight] ❌ No hay páginas procesadas:",
				pagesError,
			);
			return {
				success: false,
				error: "No hay páginas procesadas para analizar",
			};
		}

		fullText = pages
			.map(
				(p: { page_number: number; markdown_original: string | null }) =>
					`\n--- PÁGINA ${p.page_number} ---\n${p.markdown_original || ""}`,
			)
			.join("\n\n");

		console.log(
			`🧠 [Lightweight] ${pages.length} páginas encontradas: ${fullText.length} caracteres`,
		);
	} else {
		// Para audio/PDF/markdown: obtener de transcripción
		const { data: transcription, error: fetchError } = await supabase
			.from("cog_transcriptions")
			.select("id, full_text, artifact_id")
			.eq("artifact_id", artifactId)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (fetchError || !transcription?.full_text) {
			console.error(
				"🧠 [Lightweight] ❌ No hay transcripción disponible:",
				fetchError,
			);
			return { success: false, error: "No hay transcripción para analizar" };
		}

		fullText = transcription.full_text;
		console.log(
			`🧠 [Lightweight] Transcripción encontrada: ${fullText.length} caracteres`,
		);
	}

	// 3. Construir el prompt para DeepSeek Chat - EXTRACCIÓN LIGERA
	const systemPrompt = `Eres un analista experto en extracción de información estructurada.
Tu tarea es extraer PENSADORES y DATOS CRONOLÓGICOS de transcripciones completas.

**INSTRUCCIONES DETALLADAS:**

1. **PENSADORES (Thinkers):**
   - Extrae TODOS los pensadores, autores, investigadores o figuras mencionadas
   - Para cada uno incluye:
     * Nombre completo
     * Disciplina principal (ej: "Filosofía", "Física", "Sociología")
     * Era temporal (ej: "siglo XX", "contemporáneo", "1950-2020")
     * Mini biografía de 1-2 frases
     * Contribuciones clave (3-5 puntos breves)

2. **DATOS CRONOLÓGICOS:**
   - Extrae TODAS las fechas, eventos temporales y datos cronológicos mencionados
   - Para cada uno incluye:
     * date_value: La fecha en formato flexible (puede ser "2023", "marzo 2023", "2023-03-15", etc.)
     * event_type: Tipo de dato ('date', 'event', 'period', 'milestone')
     * description: Descripción clara del evento o dato
     * context: Fragmento del texto donde aparece (máximo 200 caracteres)
     * confidence_score: Nivel de confianza (0.0 a 1.0)

**EJEMPLOS DE DATOS CRONOLÓGICOS:**
- "2023 - Renuncia de X a la compañía Y" → event_type: 'event'
- "Entre 1990 y 2000" → event_type: 'period'
- "Marzo de 2024" → event_type: 'date'
- "Hito importante en 2022" → event_type: 'milestone'

**FORMATO DE RESPUESTA (JSON):**
\`\`\`json
{
  "thinkers": [
    {
      "name": "Nombre Completo",
      "discipline": "Disciplina",
      "era": "Época temporal",
      "bio_snippet": "Biografía breve de 1-2 frases",
      "key_contributions": ["Contribución 1", "Contribución 2", "Contribución 3"]
    }
  ],
  "chronological_data": [
    {
      "date_value": "2023",
      "event_type": "event",
      "description": "Descripción del evento",
      "context": "Fragmento del texto donde aparece",
      "confidence_score": 0.95
    }
  ]
}
\`\`\`

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

	// 3.5. Dividir en chunks si el texto es muy largo
	const estimateTokens = (text: string) => Math.ceil(text.length / 4);
	const textTokens = estimateTokens(fullText);
	const MAX_CHUNK_TOKENS = 30000; // Límite seguro para DeepSeek Chat

	console.log(`🧠 [Lightweight] Texto estimado: ~${textTokens} tokens`);

	let chunks: string[] = [];

	if (textTokens <= MAX_CHUNK_TOKENS) {
		// Texto cabe en un solo chunk
		chunks = [fullText];
		console.log(`🧠 [Lightweight] Procesando en chunk único`);
	} else {
		// Dividir en chunks
		const numChunks = Math.ceil(textTokens / MAX_CHUNK_TOKENS);
		const chunkSize = Math.ceil(fullText.length / numChunks);

		for (let i = 0; i < numChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min((i + 1) * chunkSize, fullText.length);
			chunks.push(fullText.slice(start, end));
		}

		console.log(`🧠 [Lightweight] Texto dividido en ${chunks.length} chunks`);
	}

	// 4. Procesar cada chunk y acumular resultados
	const allThinkers: ExtractedThinker[] = [];
	const allChronologicalData: ExtractedChronologicalData[] = [];

	for (let i = 0; i < chunks.length; i++) {
		const chunkNumber = i + 1;
		const chunk = chunks[i];

		console.log(
			`🧠 [Lightweight] Procesando chunk ${chunkNumber}/${chunks.length} (~${estimateTokens(chunk)} tokens)...`,
		);

		const userPrompt = `Analiza el siguiente fragmento (parte ${chunkNumber} de ${chunks.length}) y extrae TODOS los pensadores y datos cronológicos:

${chunk}

Genera ahora el análisis completo en formato JSON:`;

		// Llamar a DeepSeek Chat
		const apiKey = process.env.DEEPSEEK_API_KEY;
		if (!apiKey) {
			return { success: false, error: "DEEPSEEK_API_KEY no configurada" };
		}

		try {
			const response = await fetch(
				"https://api.deepseek.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						model: "deepseek-chat",
						messages: [
							{ role: "system", content: systemPrompt },
							{ role: "user", content: userPrompt },
						],
						temperature: 0.3,
						max_tokens: 8192,
						stream: false,
					}),
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`DeepSeek API error: ${response.status} - ${errorText}`,
				);
			}

			const result = await response.json();
			let responseContent = result.choices[0].message.content;

			console.log(
				`📥 [Lightweight] Chunk ${chunkNumber} respuesta recibida (${responseContent.length} caracteres)`,
			);

			// Limpiar markdown si viene con backticks
			if (responseContent.includes("```json")) {
				responseContent = responseContent
					.replace(/^```json\s*/, "")
					.replace(/\s*```$/, "");
			} else if (responseContent.includes("```")) {
				responseContent = responseContent
					.replace(/^```\s*/, "")
					.replace(/\s*```$/, "");
			}

			// Parsear respuesta JSON
			let extractedData: LightweightExtractionResponse;
			try {
				extractedData = JSON.parse(responseContent);
				console.log(
					`✅ [Lightweight] Chunk ${chunkNumber} parseado: ${extractedData.thinkers?.length || 0} pensadores, ${extractedData.chronological_data?.length || 0} datos`,
				);

				// 🔍 LOGGING DETALLADO: Mostrar pensadores extraídos
				if (extractedData.thinkers && extractedData.thinkers.length > 0) {
					console.log(
						`👤 [Lightweight] Pensadores extraídos en chunk ${chunkNumber}:`,
					);
					extractedData.thinkers.forEach((t, idx) => {
						console.log(
							`   ${idx + 1}. ${t.name} (${t.discipline || "sin disciplina"}) - ${t.era || "sin era"}`,
						);
					});
				} else {
					console.warn(
						`⚠️ [Lightweight] Chunk ${chunkNumber} NO extrajo pensadores`,
					);
				}

				// Acumular resultados de este chunk
				if (extractedData.thinkers) {
					allThinkers.push(...extractedData.thinkers);
				}
				if (extractedData.chronological_data) {
					allChronologicalData.push(...extractedData.chronological_data);
				}
			} catch (parseError) {
				console.error(
					`❌ [Lightweight] Error parseando JSON del chunk ${chunkNumber}:`,
					parseError,
				);
				console.log("Respuesta recibida:", responseContent.slice(0, 500));
				// Continuar con siguiente chunk en lugar de fallar completamente
				continue;
			}
		} catch (error: unknown) {
			console.error(
				`❌ [Lightweight] Error procesando chunk ${chunkNumber}:`,
				error,
			);
			// Continuar con siguiente chunk
			continue;
		}
	}

	// 5. Consolidar y guardar resultados de todos los chunks
	console.log(`\n✅ [Lightweight] Procesamiento completado:`);
	console.log(`   📦 Total pensadores extraídos: ${allThinkers.length}`);
	console.log(`   📅 Total datos cronológicos: ${allChronologicalData.length}`);

	if (allThinkers.length === 0 && allChronologicalData.length === 0) {
		return {
			success: false,
			error: "No se pudieron extraer datos de ningún chunk",
		};
	}

	// 6. Guardar pensadores en la base de datos
	console.log(`💾 [Lightweight] Guardando ${allThinkers.length} pensadores...`);

	if (allThinkers.length > 0) {
		console.log(`👤 [Lightweight] Lista completa de pensadores a guardar:`);
		allThinkers.forEach((t, idx) => {
			console.log(
				`   ${idx + 1}. ${t.name} | ${t.discipline || "sin disciplina"} | ${t.era || "sin era"}`,
			);
		});
	}

	try {
		let savedCount = 0;
		for (const thinker of allThinkers) {
			console.log(
				`\n🔄 [Lightweight] Procesando pensador: "${thinker.name}"...`,
			);

			// Buscar o crear disciplina
			let disciplineId: string | null = null;
			if (thinker.discipline) {
				const { data: existingDiscipline } = await supabase
					.from("cog_disciplines")
					.select("id")
					.eq("name", thinker.discipline)
					.eq("project_id", artifact.project_id)
					.single();

				if (existingDiscipline) {
					disciplineId = existingDiscipline.id;
					console.log(
						`   ✓ Disciplina existente: ${thinker.discipline} (${disciplineId})`,
					);
				} else {
					const { data: newDiscipline } = await supabase
						.from("cog_disciplines")
						.insert({
							project_id: artifact.project_id,
							name: thinker.discipline,
						})
						.select("id")
						.single();

					disciplineId = newDiscipline?.id || null;
					console.log(
						`   ✓ Disciplina creada: ${thinker.discipline} (${disciplineId})`,
					);
				}
			}

			// Buscar o crear referencia (pensador)
			const { data: existingRef } = await supabase
				.from("cog_references")
				.select("id")
				.eq("name", thinker.name)
				.eq("project_id", artifact.project_id)
				.single();

			let referenceId: string;

			if (existingRef) {
				referenceId = existingRef.id;
				console.log(
					`   ✓ Pensador ya existe en BD: ${thinker.name} (${referenceId})`,
				);
			} else {
				const { data: newRef, error: refError } = await supabase
					.from("cog_references")
					.insert({
						project_id: artifact.project_id,
						// ❌ discipline_id NO EXISTE en cog_references - eliminado
						name: thinker.name,
						era: thinker.era,
						bio_snippet: thinker.bio_snippet,
						key_contributions: thinker.key_contributions,
					})
					.select("id")
					.single();

				if (refError) {
					console.error(
						`   ❌ Error creando referencia para ${thinker.name}:`,
						refError,
					);
					continue;
				}

				referenceId = newRef.id;
				console.log(
					`   ✓ Pensador creado en BD: ${thinker.name} (${referenceId})`,
				);
			}

			// Crear relación artefacto-referencia
			const { error: linkError } = await supabase
				.from("cog_artifact_references")
				.insert({
					artifact_id: artifactId,
					reference_id: referenceId,
					context_snippet: `Mencionado en ${artifact.type}`,
				});

			if (linkError) {
				console.error(
					`   ❌ Error vinculando pensador ${thinker.name} al artefacto:`,
					linkError,
				);
			} else {
				console.log(`   ✓ Pensador vinculado al artefacto exitosamente`);
				savedCount++;
			}
		}

		console.log(
			`\n✅ [Lightweight] ${savedCount}/${allThinkers.length} pensadores guardados exitosamente`,
		);

		// 7. Guardar datos cronológicos
		console.log(
			`💾 [Lightweight] Guardando ${allChronologicalData.length} datos cronológicos...`,
		);

		const chronologicalDataToInsert = allChronologicalData.map(
			(data: ExtractedChronologicalData) => ({
				artifact_id: artifactId,
				project_id: artifact.project_id,
				date_value: data.date_value,
				event_type: data.event_type,
				description: data.description,
				context: data.context,
				confidence_score: data.confidence_score,
				extracted_by: "deepseek-chat",
			}),
		);

		if (chronologicalDataToInsert.length > 0) {
			const { error: chronoError } = await supabase
				.from("cog_chronological_data")
				.insert(chronologicalDataToInsert);

			if (chronoError) {
				console.error(`❌ Error guardando datos cronológicos:`, chronoError);
				return {
					success: false,
					error: "Error guardando datos cronológicos: " + chronoError.message,
				};
			}

			console.log(
				`✅ [Lightweight] ${chronologicalDataToInsert.length} datos cronológicos guardados`,
			);
		}

		return {
			success: true,
			data: {
				thinkers_count: allThinkers.length,
				chronological_data_count: allChronologicalData.length,
			},
		};
	} catch (error: unknown) {
		console.error(`❌ [Lightweight] Error guardando en BD:`, error);
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Error desconocido guardando datos",
		};
	}
}
