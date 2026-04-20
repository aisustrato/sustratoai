// 📍 app/api/cognetica_old/chronicle/[artifactId]/route.ts
// 🎯 PROPÓSITO: Metabolización Crónica Forense de un artefacto cognetico completo.
//              Toma el corpus ya procesado (texto + elementos cogneticos extraídos)
//              y genera 3 versiones: extendida, destilada y crónica narrativa.
// 🔧 DECISIÓN: Guarda resultado en source_metadata.micelio_chronicle del artefacto.
//              Usa DeepSeek (mismo modelo que Micelio en Minotauro) para coherencia.
// ⚠️ ADVERTENCIA: Requiere que el artefacto ya tenga extracción cognitiva completada.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { callDeepSeekAPI } from "@/lib/deepseek/api";
import {
	generateChronicleMicelioPrompt,
	extractJSONFromResponse,
} from "@/lib/prompts/minotauro-archetype-prompts";
import { getArtifactTextContent } from "@/lib/actions/cognetica-old-helpers";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ artifactId: string }> },
) {
	try {
		const supabase = await createSupabaseServerClient();

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

		const { artifactId } = await params;

		if (!artifactId) {
			return NextResponse.json(
				{ success: false, error: "Falta artifactId" },
				{ status: 400 },
			);
		}

		console.log(
			`🍄 [Chronicle] Iniciando metabolización crónica para artefacto: ${artifactId}`,
		);

		// 1. Obtener datos base del artefacto
		const { data: artifact, error: artifactError } = await supabase
			.from("cog_artifacts")
			.select("id, title, type, project_id, source_metadata, status")
			.eq("id", artifactId)
			.single();

		if (artifactError || !artifact) {
			return NextResponse.json(
				{ success: false, error: "Artefacto no encontrado" },
				{ status: 404 },
			);
		}

		// 2. Verificar permisos: el usuario debe ser miembro del proyecto
		const { data: membership } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", artifact.project_id)
			.eq("user_id", user.id)
			.single();

		if (!membership) {
			return NextResponse.json(
				{ success: false, error: "Sin acceso a este proyecto" },
				{ status: 403 },
			);
		}

		// 3. Obtener ensayo destilado como fuente principal (fallback a transcripción)
		let textContent: { text: string; source: string };

		// Intentar obtener el ensayo destilado primero
		const { data: transcriptionWithEssay } = await supabase
			.from("cog_transcriptions")
			.select("distilled_essay")
			.eq("artifact_id", artifactId)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (
			transcriptionWithEssay?.distilled_essay &&
			transcriptionWithEssay.distilled_essay.length > 100
		) {
			textContent = {
				text: transcriptionWithEssay.distilled_essay,
				source: "ensayo_destilado",
			};
			console.log(
				`🍄 [Chronicle] Usando ENSAYO DESTILADO como fuente: ${textContent.text.length} chars`,
			);
		} else {
			// Fallback a transcripción original
			const originalContent = await getArtifactTextContent(artifactId);
			if (!originalContent?.text || originalContent.text.length < 50) {
				return NextResponse.json(
					{
						success: false,
						error:
							"El artefacto no tiene ensayo destilado ni transcripción. Genera el ensayo destilado primero.",
					},
					{ status: 400 },
				);
			}
			textContent = originalContent;
			console.log(
				`🍄 [Chronicle] Usando transcripción original como fallback: ${textContent.text.length} chars`,
			);
		}

		// 4. Cargar elementos cogneticos ya extraídos
		const [
			seedsResult,
			thinkersResult,
			disciplinesResult,
			theoriesResult,
			streamsResult,
		] = await Promise.all([
			supabase
				.from("cog_fractal_seeds")
				.select("content, context, properties")
				.eq("artifact_id", artifactId)
				.order("created_at", { ascending: false })
				.limit(20),
			supabase
				.from("cog_artifact_references")
				.select("context_snippet, cog_references!inner(name, era, bio_snippet)")
				.eq("artifact_id", artifactId)
				.limit(10),
			supabase
				.from("cog_artifact_disciplines")
				.select("cog_disciplines!inner(name)")
				.eq("artifact_id", artifactId),
			supabase
				.from("cog_artifact_theories")
				.select("cog_theories!inner(name)")
				.eq("artifact_id", artifactId),
			supabase
				.from("cog_artifact_streams")
				.select("cog_thought_streams!inner(name)")
				.eq("artifact_id", artifactId),
		]);

		const seeds = seedsResult.data || [];
		const thinkers = thinkersResult.data || [];
		const disciplines = disciplinesResult.data || [];
		const theories = theoriesResult.data || [];
		const streams = streamsResult.data || [];

		// Separar semillas normales de citas y frases notables
		const semillasFractales = seeds
			.filter((s) => {
				const isQuote =
					(s.properties as { type?: string } | null)?.type === "quote";
				const isNotablePhrase =
					(s.properties as { type?: string } | null)?.type === "notable_phrase";
				return !isQuote && !isNotablePhrase;
			})
			.map((s) => ({ content: s.content, context: s.context || "" }));

		const citas = seeds
			.filter(
				(s) => (s.properties as { type?: string } | null)?.type === "quote",
			)
			.map((s) => ({ content: s.content, context: s.context || "" }));

		const frasesNotables = seeds
			.filter(
				(s) =>
					(s.properties as { type?: string } | null)?.type === "notable_phrase",
			)
			.map((s) => ({ content: s.content, context: s.context || "" }));

		const pensadores = thinkers
			.map((t) => ({
				name: (t.cog_references as { name?: string } | null)?.name || "",
				era:
					(t.cog_references as { era?: string | null } | null)?.era ||
					undefined,
				bio_snippet:
					(t.cog_references as { bio_snippet?: string | null } | null)
						?.bio_snippet || undefined,
			}))
			.filter((p) => p.name);

		const disciplinasNames = disciplines
			.map((d) => (d.cog_disciplines as { name?: string } | null)?.name)
			.filter((name): name is string => Boolean(name));
		const teoriasNames = theories
			.map((t) => (t.cog_theories as { name?: string } | null)?.name)
			.filter((name): name is string => Boolean(name));
		const corrientesNames = streams
			.map((s) => (s.cog_thought_streams as { name?: string } | null)?.name)
			.filter((name): name is string => Boolean(name));

		const sourceMeta =
			(artifact.source_metadata as Record<string, unknown>) || {};
		const resumenCognitivo =
			typeof sourceMeta.cognitive_summary === "string" ?
				sourceMeta.cognitive_summary
			:	undefined;

		console.log(
			`🍄 [Chronicle] Corpus enriquecido (fuente: ${textContent.source}):`,
		);
		console.log(`  - Semillas fractales: ${semillasFractales.length}`);
		console.log(`  - Frases notables: ${frasesNotables.length}`);
		console.log(`  - Citas: ${citas.length}`);
		console.log(`  - Pensadores: ${pensadores.length}`);
		console.log(`  - Disciplinas: ${disciplinasNames.length}`);
		console.log(`  - Teorías: ${teoriasNames.length}`);
		console.log(`  - Corrientes: ${corrientesNames.length}`);

		// 5. Construir y ejecutar el prompt de Crónica Forense
		const chroniclePrompt = generateChronicleMicelioPrompt({
			titulo: artifact.title || "Sin título",
			tipo: artifact.type || "desconocido",
			texto_completo: textContent.text,
			semillas_fractales: semillasFractales,
			pensadores,
			disciplinas: disciplinasNames,
			teorias: teoriasNames,
			corrientes: corrientesNames,
			citas,
			resumen_cognitivo: resumenCognitivo,
		});

		console.log(
			`🍄 [Chronicle] Enviando prompt a DeepSeek (${chroniclePrompt.length} chars)...`,
		);

		const chronicleRaw = await callDeepSeekAPI(
			"deepseek-chat",
			chroniclePrompt,
		);

		if (!chronicleRaw?.result) {
			console.error("❌ [Chronicle] Respuesta vacía de DeepSeek");
			return NextResponse.json(
				{ success: false, error: "Respuesta vacía del modelo" },
				{ status: 500 },
			);
		}

		console.log(
			`🍄 [Chronicle] Respuesta recibida (${chronicleRaw.result.length} chars)`,
		);

		// 6. Parsear respuesta JSON
		const chronicleJSON = extractJSONFromResponse(chronicleRaw.result);

		if (!chronicleJSON?.version_extendida && !chronicleJSON?.cronica) {
			console.error(
				"❌ [Chronicle] JSON inválido o sin campos esperados:",
				JSON.stringify(chronicleJSON).substring(0, 300),
			);
			return NextResponse.json(
				{ success: false, error: "El modelo no devolvió una crónica válida" },
				{ status: 500 },
			);
		}

		// 7. Guardar resultado en source_metadata del artefacto
		const micelioChronicle = {
			ejecutado_en: new Date().toISOString(),
			version_extendida: chronicleJSON.version_extendida || "",
			version_destilada: chronicleJSON.version_destilada || "",
			cronica: chronicleJSON.cronica || "",
			semillas_clave:
				Array.isArray(chronicleJSON.semillas_clave) ?
					chronicleJSON.semillas_clave
				:	[],
			tension_central: chronicleJSON.tension_central || "",
			nota_cronista: chronicleJSON.nota_cronista || "",
			stats: {
				semillas_input: semillasFractales.length,
				pensadores_input: pensadores.length,
				disciplinas_input: disciplinasNames.length,
				chars_texto: textContent.text.length,
			},
		};

		const metadataActualizada = {
			...sourceMeta,
			micelio_chronicle: micelioChronicle,
		};

		const { error: updateError } = await supabase
			.from("cog_artifacts")
			.update({ source_metadata: metadataActualizada })
			.eq("id", artifactId);

		if (updateError) {
			console.error(
				"❌ [Chronicle] Error guardando crónica en metadata:",
				updateError,
			);
			return NextResponse.json(
				{
					success: false,
					error: "Error guardando la crónica en la base de datos",
				},
				{ status: 500 },
			);
		}

		console.log(
			`✅ [Chronicle] Crónica guardada exitosamente para artefacto: ${artifactId}`,
		);

		return NextResponse.json({
			success: true,
			data: {
				artifactId,
				ejecutado_en: micelioChronicle.ejecutado_en,
				version_extendida: micelioChronicle.version_extendida,
				version_destilada: micelioChronicle.version_destilada,
				cronica: micelioChronicle.cronica,
				semillas_clave: micelioChronicle.semillas_clave,
				tension_central: micelioChronicle.tension_central,
				nota_cronista: micelioChronicle.nota_cronista,
				stats: micelioChronicle.stats,
			},
		});
	} catch (error) {
		console.error("❌ [Chronicle] Error inesperado:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Error inesperado",
			},
			{ status: 500 },
		);
	}
}

// GET: Obtener la crónica ya guardada de un artefacto
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ artifactId: string }> },
) {
	try {
		const supabase = await createSupabaseServerClient();

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

		const { artifactId } = await params;

		const { data: artifact, error: artifactError } = await supabase
			.from("cog_artifacts")
			.select("id, title, project_id, source_metadata")
			.eq("id", artifactId)
			.single();

		if (artifactError || !artifact) {
			return NextResponse.json(
				{ success: false, error: "Artefacto no encontrado" },
				{ status: 404 },
			);
		}

		// Verificar permisos
		const { data: membership } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", artifact.project_id)
			.eq("user_id", user.id)
			.single();

		if (!membership) {
			return NextResponse.json(
				{ success: false, error: "Sin acceso a este proyecto" },
				{ status: 403 },
			);
		}

		const sourceMeta =
			(artifact.source_metadata as Record<string, unknown>) || {};
		const chronicle = sourceMeta.micelio_chronicle || null;

		return NextResponse.json({
			success: true,
			data: {
				artifactId,
				titulo: artifact.title,
				chronicle,
				has_chronicle: !!chronicle,
			},
		});
	} catch (error) {
		console.error("❌ [Chronicle GET] Error inesperado:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Error inesperado",
			},
			{ status: 500 },
		);
	}
}
