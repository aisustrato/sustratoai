// 📍 app/api/minotauro/process-galaxy/route-v2.ts
// 🎯 PROPÓSITO: API refactorizada según spec v2 con sistema de memoria de sesión
// 🔧 DECISIÓN: Inyección completa de contexto JSON a cada arquetipo

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { callDeepSeekAPI } from "@/lib/deepseek/api";
import {
	generateArchetypePrompt,
	extractJSONFromResponse,
} from "@/lib/prompts/minotauro-archetype-prompts";

import type {
	SessionContext,
	ArchetypeTone,
	SectionInteraction,
	PaperFormat,
	CogneticaSource,
	MinotauroGalaxyMetadata,
	HumanResponse,
	SectionState,
} from "@/lib/types/minotauro-types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
	try {
		const supabase = await createSupabaseServerClient();

		// Autenticar usuario
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json(
				{ success: false, error: "No autenticado" },
				{ status: 401 },
			);
		}

		const body = await req.json();
		const {
			galaxyId,
			archetype,
			projectId,
			calibracion,
			ejecutar_version,
			sentido, // Pre-calibración del humano
			fuentes_curadas, // Referencias numeradas disponibles
			selected_artifacts, // Artefactos con selección granular de elementos
		} = body;

		if (!galaxyId || !archetype) {
			return NextResponse.json(
				{ success: false, error: "Faltan parámetros requeridos" },
				{ status: 400 },
			);
		}

		// Obtener la galaxia con su metadata
		const { data: galaxy, error: galaxyError } = await supabase
			.from("minotauro_galaxies")
			.select("*")
			.eq("id", galaxyId)
			.single();

		if (galaxyError || !galaxy) {
			return NextResponse.json(
				{ success: false, error: "Galaxia no encontrada" },
				{ status: 404 },
			);
		}

		const metadata = (galaxy.metadata as MinotauroGalaxyMetadata) || {};
		const content = metadata.content || "";

		// Obtener fuentes curadas para esta galaxia (con artifact_id para cargar transcripción)
		const { data: sources } = await supabase
			.from("minotauro_curated_sources")
			.select(
				`
        id,
        source_type,
        content_excerpt,
        relevance_note,
        artifact_id,
        metadata,
        cog_artifacts (
          id,
          title,
          type
        )
      `,
			)
			.eq("galaxy_id", galaxyId)
			.order("order_index", { ascending: true });

		// � Construir CogneticaSources con selección granular de elementos
		// Ya no depende de Micelio - ahora usa datos directos de Cognética
		const cogneticaSources: CogneticaSource[] = [];

		for (const source of sources || []) {
			const meta = (source.metadata as any) || {};
			const artifact = (source as any).cog_artifacts;
			const artifactId = source.artifact_id;
			const referencia_formal =
				artifact?.title ||
				meta.referencia_formal ||
				`Fuente ${source.source_type}`;

			// Buscar selección granular para este artefacto
			const selectedArtifact = selected_artifacts?.find(
				(a: any) => a.artifactId === artifactId,
			);
			const selectedElements = selectedArtifact?.selectedElements || {};

			// Si hay selección granular, construir fragmento solo con elementos seleccionados
			let fragmento = "";

			if (artifactId && Object.keys(selectedElements).length > 0) {
				console.log(
					`🎯 [Granular] Procesando artefacto ${artifactId} con elementos:`,
					selectedElements,
				);

				const partes: string[] = [];

				// 1. TRANSCRIPCIÓN - desde cog_transcriptions o cog_artifact_pages
				if (selectedElements.transcripcion) {
					// Verificar tipo de artefacto
					const { data: artifact } = await supabase
						.from("cog_artifacts")
						.select("type")
						.eq("id", artifactId)
						.single();

					if (artifact?.type === "pdf_slides") {
						// Para slides: buscar en cog_artifact_pages
						const { data: pages } = await supabase
							.from("cog_artifact_pages")
							.select("markdown_original")
							.eq("artifact_id", artifactId)
							.order("page_number", { ascending: true });

						if (pages && pages.length > 0) {
							const fullContent = pages
								.map((p) => p.markdown_original)
								.filter(Boolean)
								.join("\n\n");
							if (fullContent) partes.push(`[Transcripción]\n${fullContent}`);
						}
					} else {
						// Para otros tipos: buscar en cog_transcriptions
						const { data: transcription } = await supabase
							.from("cog_transcriptions")
							.select("full_text")
							.eq("artifact_id", artifactId)
							.order("created_at", { ascending: false })
							.limit(1)
							.single();

						if (transcription?.full_text) {
							partes.push(`[Transcripción]\n${transcription.full_text}`);
						}
					}
				}

				// 2. ENSAYO DESTILADO - desde cog_transcriptions
				if (selectedElements.ensayo_destilado) {
					const { data: essay } = await supabase
						.from("cog_transcriptions")
						.select("distilled_essay")
						.eq("artifact_id", artifactId)
						.order("created_at", { ascending: false })
						.limit(1)
						.single();

					if (essay?.distilled_essay) {
						partes.push(`[Ensayo Destilado]\n${essay.distilled_essay}`);
					}
				}

				// 3. ELEMENTOS COGNITIVOS - desde cog_fractal_seeds y cog_artifact_disciplines
				if (selectedElements.elementos_cognitivos) {
					const elementosParts: string[] = [];

					const { data: seeds } = await supabase
						.from("cog_fractal_seeds")
						.select("content")
						.eq("artifact_id", artifactId)
						.not("tags", "cs", '{"cita"}');

					if (seeds && seeds.length > 0) {
						elementosParts.push(
							`Seeds:\n${seeds.map((s) => `- ${s.content}`).join("\n")}`,
						);
					}

					const { data: disciplines } = await supabase
						.from("cog_artifact_disciplines")
						.select("cog_disciplines(name)")
						.eq("artifact_id", artifactId);

					if (disciplines && disciplines.length > 0) {
						const names = disciplines
							.map((d) => (d.cog_disciplines as any)?.name)
							.filter(Boolean);
						if (names.length > 0) {
							elementosParts.push(
								`Disciplinas:\n${names.map((n) => `- ${n}`).join("\n")}`,
							);
						}
					}

					if (elementosParts.length > 0) {
						partes.push(
							`[Elementos Cognitivos]\n${elementosParts.join("\n\n")}`,
						);
					}
				}

				// 4. DATOS CRONOLÓGICOS - desde source_metadata
				if (selectedElements.datos_cronologicos) {
					const { data: artifact } = await supabase
						.from("cog_artifacts")
						.select("source_metadata")
						.eq("id", artifactId)
						.single();

					if (artifact?.source_metadata) {
						const meta = artifact.source_metadata as any;
						const chronoParts: string[] = [];
						if (meta.fecha_publicacion)
							chronoParts.push(`Fecha: ${meta.fecha_publicacion}`);
						if (meta.autor) chronoParts.push(`Autor: ${meta.autor}`);
						if (meta.titulo) chronoParts.push(`Título: ${meta.titulo}`);

						if (chronoParts.length > 0) {
							partes.push(`[Datos Cronológicos]\n${chronoParts.join("\n")}`);
						}
					}
				}

				// 5. CHAT CALIBRADOR - desde cog_chat_sessions
				if (selectedElements.chat_calibrador) {
					const { data: chats } = await supabase
						.from("cog_chat_sessions")
						.select("messages")
						.eq("artifact_id", artifactId)
						.order("created_at", { ascending: false })
						.limit(1)
						.single();

					if (chats?.messages) {
						const chatText =
							typeof chats.messages === "string" ?
								chats.messages
							:	JSON.stringify(chats.messages, null, 2);
						partes.push(`[Chat Calibrador]\n${chatText}`);
					}
				}

				fragmento = partes.join("\n\n---\n\n");
				console.log(
					`✅ [Granular] Artefacto ${artifactId}: ${partes.length} elementos seleccionados, ${fragmento.length} chars`,
				);
			} else if (artifactId) {
				// Sin selección granular, cargar ensayo destilado por defecto (comportamiento legacy)
				const { data: essay } = await supabase
					.from("cog_transcriptions")
					.select("distilled_essay, full_text")
					.eq("artifact_id", artifactId)
					.order("created_at", { ascending: false })
					.limit(1)
					.single();

				// Priorizar ensayo destilado, fallback a transcripción completa
				fragmento =
					essay?.distilled_essay ||
					essay?.full_text ||
					source.content_excerpt ||
					"";
				console.log(
					`📋 [Legacy] Artefacto ${artifactId}: usando ensayo destilado/transcripción, ${fragmento.length} chars`,
				);
			} else {
				// Fuente sin artefacto, usar excerpt
				fragmento = source.content_excerpt || "";
				console.log(
					`📋 [Legacy] Fuente ${source.id}: usando content_excerpt, ${fragmento.length} chars`,
				);
			}

			if (fragmento) {
				cogneticaSources.push({
					id: source.id,
					fragmento,
					referencia_formal,
				});
			}
		}

		console.log("🎯 [Fuentes] Contexto construido:", {
			total: cogneticaSources.length,
			conSeleccionGranular: selected_artifacts?.length || 0,
			totalChars: cogneticaSources.reduce(
				(sum, f) => sum + f.fragmento.length,
				0,
			),
			estimatedTokens: Math.ceil(
				cogneticaSources.reduce((sum, f) => sum + f.fragmento.length, 0) / 4,
			),
		});

		// Obtener formato de paper del universo
		const { data: universe } = await supabase
			.from("minotauro_universes")
			.select("metadata")
			.eq("id", galaxy.universe_id)
			.single();

		const universeMetadata = (universe?.metadata as any) || {};
		const paperFormat: PaperFormat = {
			nombre: universeMetadata.paper_format || "zenodo",
			limite_palabras_por_seccion: universeMetadata.words_per_section || 400,
			estructura_esperada: universeMetadata.estructura || [
				"introduccion",
				"desarrollo",
				"conclusion",
			],
			tono: universeMetadata.tono || "formal",
		};

		// 🔧 SPEC V2: Construir SessionContext completo
		const historialArquetipoPrevios = (metadata.historial_arquetipos ||
			[]) as any[];

		// Construir historial de interacciones desde análisis previos
		const historialInteracciones: SectionInteraction[] = [];
		historialArquetipoPrevios.forEach((analisis: any) => {
			analisis.comments?.forEach((comment: any) => {
				if (comment.respuesta_humano) {
					historialInteracciones.push({
						orden_en_sesion: historialInteracciones.length + 1,
						arquetipo: analisis.archetype as ArchetypeTone,
						propuesta: `${comment.point}: ${comment.observation}`,
						respuesta_humano: comment.respuesta_humano as HumanResponse,
						razon_rechazo: comment.nota_humano,
						timestamp: analisis.timestamp_analisis || new Date().toISOString(),
					});
				}
			});
		});

		// Arquetipos que ya actuaron en esta sección
		const arquetiposYaActuados: ArchetypeTone[] = historialArquetipoPrevios.map(
			(a: any) => a.archetype as ArchetypeTone,
		);

		// Obtener texto limpio por Deslixador si existe
		const deslixadorAnalisis = historialArquetipoPrevios.find(
			(a: any) => a.archetype === "deslixador" && a.status === "executed",
		);
		const versionesTextoTemp = (metadata.versiones_texto || []) as any[];
		const textoLimpio =
			deslixadorAnalisis ?
				versionesTextoTemp.find(
					(v: any) => v.version === deslixadorAnalisis.version_salida,
				)?.content || ""
			:	"";

		// 🔧 SPEC V2: Construir SessionContext según sección 5 de la spec
		const sessionContext: SessionContext = {
			session_id: galaxyId,
			seccion_id: galaxy.title || "Sección principal",
			texto_humano_original: content,
			texto_limpio_por_deslixador: textoLimpio,
			fuentes_cognetica_relevantes: cogneticaSources,
			historial_interacciones: historialInteracciones,
			arquetipos_ya_actuados_en_seccion: arquetiposYaActuados,
			arquetipo_actual: archetype as ArchetypeTone,
			estado_seccion: "en_iteracion" as SectionState,
			formato_paper: paperFormat,
		};

		console.log("🔧 [SessionContext] Construido:", {
			session_id: sessionContext.session_id,
			seccion_id: sessionContext.seccion_id,
			arquetipos_previos: arquetiposYaActuados,
			interacciones_count: historialInteracciones.length,
			fuentes_count: cogneticaSources.length,
		});

		// 🔧 SPEC V2: Usar generateArchetypePrompt() en lugar de prompt manual
		let prompt = generateArchetypePrompt(
			archetype as ArchetypeTone,
			sessionContext,
		);

		// 🎯 Si es ejecución, agregar calibración al prompt
		if (ejecutar_version && calibracion && Array.isArray(calibracion)) {
			const aceptados = calibracion.filter(
				(c: any) => c.respuesta_humano === "aceptado",
			);
			const rechazados = calibracion.filter(
				(c: any) => c.respuesta_humano !== "aceptado",
			);

			prompt += `\n\n---\n\n# 🎯 MODO CO-CREACIÓN — ESCRIBE AHORA

El humano te dio luz verde. Llegó el momento de escribir, no de analizar.

## Lo que el humano aprobó (tu mandato):
${aceptados
	.map((cal: any, i: number) => `${i + 1}. **${cal.punto}** — HAZLO`)
	.join("\n")}

${
	rechazados.length > 0 ?
		`## Lo que el humano descartó (no lo hagas):
${rechazados
	.map(
		(cal: any, i: number) =>
			`${i + 1}. **${cal.punto}**${cal.razon ? ` — Razón: "${cal.razon}"` : ""}`,
	)
	.join("\n")}`
	:	""
}

## Tu misión ahora:
Reescribe el texto COMPLETO con convicción. No hagas cambios tímidos ni mínimos. Tienes permiso para reescribir párrafos enteros si eso sirve mejor a la idea. El humano confió en ti — honra esa confianza con una versión que sea notablemente mejor que la anterior.

Usa las fuentes Cognética disponibles en el contexto si son relevantes para enriquecer el texto.

## Output — SOLO esto, sin explicaciones:
\`\`\`json
{
  "texto_nuevo": "TEXTO COMPLETO REESCRITO AQUÍ — que sea notablemente mejor",
  "cambios_aplicados": ["descripción honesta de cada transformación realizada"]
}
\`\`\``;
		}

		console.log("🤖 [Minotauro] Procesando con arquetipo:", archetype);
		console.log(
			"🎯 [Ejecución] Con calibración:",
			ejecutar_version ? "SÍ" : "NO",
		);
		console.log("📋 [Prompt] Usando generateArchetypePrompt() según spec v2");
		console.log("📋 [Prompt Length]:", prompt.length, "chars");
		if (ejecutar_version && calibracion) {
			console.log("🎯 [Calibración] Items:", calibracion.length);
		}

		// Llamar a DeepSeek con el prompt generado
		// callDeepSeekAPI tiene firma: (model: string, text: string)
		const model = "deepseek-chat"; // Modelo por defecto
		const aiResponse = await callDeepSeekAPI(model, prompt);

		// aiResponse tiene estructura: { result: string, usage: { promptTokenCount, candidatesTokenCount, totalTokenCount } }
		const responseText = aiResponse.result || "";
		console.log("📝 [Raw Response Length]:", responseText.length, "chars");
		console.log("📝 [Raw Response Preview]:", responseText.substring(0, 500));
		console.log(
			"📝 [Raw Response End]:",
			responseText.substring(responseText.length - 200),
		);

		const parsedResponse = extractJSONFromResponse(responseText);

		if (!parsedResponse || typeof parsedResponse !== "object") {
			console.error("❌ [Parse Error] No se pudo parsear la respuesta");
			throw new Error("La IA no devolvió un JSON válido");
		}

		console.log("🔍 [Parsed Response Keys]:", Object.keys(parsedResponse));
		console.log(
			"📋 [Parsed Response Full]:",
			JSON.stringify(parsedResponse, null, 2),
		);
		console.log("📊 [Comments Count]:", parsedResponse?.comments?.length || 0);

		// 🛡️ VALIDACIÓN CRÍTICA: Si no es ejecución, DEBE tener comments
		if (!ejecutar_version) {
			if (!parsedResponse.comments || parsedResponse.comments.length === 0) {
				console.error("❌ [CRITICAL] Análisis sin comentarios detectado");
				console.error(
					"❌ [CRITICAL] parsedResponse:",
					JSON.stringify(parsedResponse, null, 2),
				);
				console.error(
					"❌ [CRITICAL] Raw response preview:",
					responseText.substring(0, 1000),
				);
				throw new Error(
					`El arquetipo ${archetype} no devolvió comentarios válidos. Revisa los logs del servidor para ver la respuesta completa de DeepSeek.`,
				);
			}
			console.log("✅ [Comments Sample]:", parsedResponse.comments[0]);
			console.log(
				"✅ [Análisis] Arquetipo devolvió",
				parsedResponse.comments.length,
				"comentarios para calibración",
			);
		} else {
			// En ejecución, validar que haya texto modificado
			if (parsedResponse.texto_limpio) {
				console.log(
					"✅ [Texto Limpio Length]:",
					parsedResponse.texto_limpio?.length || 0,
				);
			} else if (parsedResponse.texto_nuevo) {
				console.log(
					"✅ [Texto Nuevo Length]:",
					parsedResponse.texto_nuevo?.length || 0,
				);
			} else {
				console.error("❌ [CRITICAL] Ejecución sin texto_nuevo/texto_limpio");
				console.error(
					"❌ [CRITICAL] parsedResponse:",
					JSON.stringify(parsedResponse, null, 2),
				);
				throw new Error(
					`El arquetipo ${archetype} no devolvió texto modificado. Revisa los logs del servidor.`,
				);
			}
		}

		// (Legacy code removed)

		// Si hay texto_nuevo, crear nueva versión (v2, v3, etc.)
		let versionesTexto = (metadata.versiones_texto || []) as any[];
		let versionActual = (metadata.version_actual || 1) as number;

		if (parsedResponse.texto_nuevo && ejecutar_version) {
			// Si no existe v1, crearla primero con el contenido actual
			if (versionesTexto.length === 0) {
				const v1 = {
					version: 1,
					content: metadata.content || "",
					timestamp: new Date().toISOString(),
					origen: "manual" as const,
					arquetipo_id: null,
				};
				versionesTexto = [v1];
				console.log("✅ [v1 creada] Contenido original guardado como v1");
			}

			// Crear nueva versión con el texto_nuevo
			const nuevaVersion = versionesTexto.length + 1;
			const nuevaVersionTexto = {
				version: nuevaVersion,
				content: parsedResponse.texto_nuevo,
				timestamp: new Date().toISOString(),
				origen: "arquetipo" as const,
				arquetipo_id: crypto.randomUUID(),
			};

			versionesTexto = [...versionesTexto, nuevaVersionTexto];
			versionActual = nuevaVersion;

			console.log(
				`✅ [Nueva Versión] v${nuevaVersion} creada desde arquetipo ${archetype}`,
			);
		}

		// Crear análisis para historial_arquetipos (nueva arquitectura)
		const historialArquetipos = (metadata.historial_arquetipos || []) as any[];
		const nuevoAnalisis = {
			id: crypto.randomUUID(),
			version_entrada: versionActual - 1, // La versión que se usó como entrada
			version_salida: ejecutar_version ? versionActual : null, // La nueva versión creada (si se ejecutó)
			archetype: archetype as any,
			sentido: sentido || "",
			timestamp_analisis: new Date().toISOString(),
			status: ejecutar_version ? "executed" : "pending_calibration",
			comments: parsedResponse.comments || [],
			tokens: {
				totalTokenCount: 0,
				promptTokenCount: 0,
				candidatesTokenCount: 0,
			},
		};

		const updatedMetadata: any = {
			...metadata,
			content: content,
			word_count: content.split(/\s+/).length,
			char_count: content.length,
			versiones_texto: versionesTexto,
			version_actual: versionActual,
			historial_arquetipos: [...historialArquetipos, nuevoAnalisis],
			fuentes_curadas: metadata.fuentes_curadas || [],
			siguiente_numero_referencia: metadata.siguiente_numero_referencia || 1,
		};

		// Guardar metadata actualizado
		await supabase
			.from("minotauro_galaxies")
			.update({
				metadata: updatedMetadata,
				updated_at: new Date().toISOString(),
			})
			.eq("id", galaxyId);

		console.log("✅ [Minotauro] Respuesta procesada y metadata actualizado");

		return NextResponse.json({
			success: true,
			data: {
				archetype,
				response: parsedResponse,
				tokens: {
					totalTokenCount: aiResponse.usage?.totalTokenCount || 0,
					promptTokenCount: aiResponse.usage?.promptTokenCount || 0,
					candidatesTokenCount: aiResponse.usage?.candidatesTokenCount || 0,
				},
				metadata: {
					versiones_count: versionesTexto.length,
					analisis_count: historialArquetipos.length + 1,
				},
			},
		});
	} catch (error: any) {
		console.error("❌ [Minotauro] Error:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
