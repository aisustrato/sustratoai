// 📍 app/api/transcription/replicate/route.ts
// 🎯 PROPÓSITO: Transcripción de audio vía Replicate + WhisperX (Large v3)
// 🔧 DECISIÓN: Arquitectura de Soberanía Delegada - calidad profesional sin quemar CPU local
// ⚡ MEJORA: Migrado a WhisperX - más rápido, robusto y sin timeouts
// ⚠️ ADVERTENCIA: Requiere REPLICATE_API_TOKEN en .env.local

import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
	try {
		// 🔐 Autenticación
		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					},
				},
			},
		);
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autenticado" }, { status: 401 });
		}

		// 📦 Extraer datos del request
		const formData = await req.formData();
		const audioFile = formData.get("audio") as File;
		const language = (formData.get("language") as string) || "es";

		if (!audioFile) {
			return NextResponse.json(
				{ error: "No se proporcionó archivo de audio" },
				{ status: 400 },
			);
		}

		console.log("🎙️ [Replicate Transcription] Iniciando transcripción:", {
			fileName: audioFile.name,
			fileSize: audioFile.size,
			fileType: audioFile.type,
			language,
			userId: user.id,
		});

		// 🔑 Verificar API Key
		if (!process.env.REPLICATE_API_TOKEN) {
			console.error("❌ [Replicate] REPLICATE_API_TOKEN no configurado");
			return NextResponse.json(
				{ error: "Servicio de transcripción no configurado" },
				{ status: 500 },
			);
		}

		// 🚀 Inicializar Replicate
		const replicate = new Replicate({
			auth: process.env.REPLICATE_API_TOKEN,
		});

		// 📤 Convertir archivo a base64 (Replicate acepta data URIs)
		const arrayBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64Audio = buffer.toString("base64");
		const mimeType = audioFile.type || "audio/mpeg";
		const dataUri = `data:${mimeType};base64,${base64Audio}`;

		console.log("📡 [Replicate] Enviando audio a WhisperX Large v3...");

		// 🚨 SIN REINTENTOS AUTOMÁTICOS - Filosofía Sustrato: Fallos Ruidosos
		// El humano decide si reintentar, no la máquina
		let output;

		try {
			output = await replicate.run(
				"victor-upmeet/whisperx:84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb",
				{
					input: {
						audio_file: dataUri,
						debug: false,
						batch_size: 64,
						diarization: true, // ✅ Activar diarización para separar hablantes
						align_output: true, // ✅ Activar timestamps precisos palabra por palabra
						temperature: 0,
						vad_onset: 0.5,
						vad_offset: 0.363,
						language_detection_min_prob: 0,
						language_detection_max_tries: 5,
					},
				},
			);

			console.log("✅ [Replicate] Transcripción exitosa");
		} catch (error: unknown) {
			console.error("❌ [Replicate] Error en transcripción:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Error desconocido";

			// 🔍 Analizar tipo de error y retornar información actionable
			const errorResponse: {
				success: boolean;
				error: string;
				userMessage: string;
				technicalDetails: string;
				canRetry: boolean;
				suggestions: string[];
				errorType?: string;
				retryAfter?: number;
				metadata: {
					fileName: string;
					fileSize: number;
					fileSizeMB: string;
				};
			} = {
				success: false,
				error: "transcription_failed",
				userMessage: "",
				technicalDetails: errorMessage,
				canRetry: true,
				suggestions: [],
				metadata: {
					fileName: audioFile.name,
					fileSize: audioFile.size,
					fileSizeMB: (audioFile.size / (1024 * 1024)).toFixed(1),
				},
			};

			// 🚦 Rate Limit (429)
			if (errorMessage.includes("429") || errorMessage.includes("throttled")) {
				const retryAfterMatch = errorMessage.match(/retry_after[":]\s*(\d+)/);
				const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1]) : 10;

				errorResponse.errorType = "rate_limit";
				errorResponse.userMessage = `⏱️ Límite de peticiones alcanzado. Replicate pide esperar ${retryAfter} segundos.`;
				errorResponse.retryAfter = retryAfter;
				errorResponse.suggestions = [
					`Espera ${retryAfter} segundos y vuelve a intentar`,
					"Considera agregar más crédito a tu cuenta de Replicate (actualmente <$5)",
				];

				return NextResponse.json(errorResponse, { status: 429 });
			}

			// 🔧 Error de Predicción (NoneType, etc.)
			if (
				errorMessage.includes("NoneType") ||
				errorMessage.includes("Prediction failed")
			) {
				errorResponse.errorType = "prediction_error";
				errorResponse.userMessage =
					"⚠️ Error interno de WhisperX. El modelo falló al procesar el audio.";
				errorResponse.suggestions = [
					"Verifica que el archivo de audio sea válido y no esté corrupto",
					"Intenta con un archivo más corto (< 10 minutos)",
					"Prueba convertir el audio a formato MP3 o WAV",
					"Si el problema persiste, puede ser un issue temporal del servidor de Replicate",
				];

				return NextResponse.json(errorResponse, { status: 500 });
			}

			// 🚫 Error PA (Prediction Interrupted)
			if (
				errorMessage.includes("code: PA") ||
				errorMessage.includes("interrupted")
			) {
				errorResponse.errorType = "prediction_interrupted";
				errorResponse.userMessage = `⏸️ Predicción interrumpida. Archivo muy grande (${errorResponse.metadata.fileSizeMB}MB) o timeout del servidor.`;
				errorResponse.suggestions = [
					"Reduce el tamaño del archivo (< 20MB recomendado)",
					"Comprime el audio reduciendo bitrate",
					"Divide el audio en segmentos más pequeños",
					"Intenta en un momento con menos carga del servidor",
				];

				return NextResponse.json(errorResponse, { status: 500 });
			}

			// ❓ Error Genérico
			errorResponse.errorType = "unknown";
			errorResponse.userMessage = "❌ Error inesperado al transcribir.";
			errorResponse.suggestions = [
				"Verifica tu conexión a internet",
				"Confirma que el archivo de audio sea válido",
				"Intenta con un archivo diferente para descartar problemas con este audio específico",
			];

			return NextResponse.json(errorResponse, { status: 500 });
		}

		console.log("✅ [Replicate] Transcripción completada");
		console.log("📝 [Replicate] Output:", output);

		// 📊 Extraer texto y segmentos de la respuesta
		let transcription = "";
		let segments = [];
		let detectedLanguage = "";

		if (typeof output === "string") {
			transcription = output;
		} else if (output && typeof output === "object") {
			// WhisperX con diarización retorna un objeto con segments
			const outputObj = output as Record<string, unknown>;

			// Extraer idioma detectado
			detectedLanguage =
				(outputObj.detected_language as string) ||
				(outputObj.language as string) ||
				"";

			// Extraer segmentos con timestamps
			if (outputObj.segments && Array.isArray(outputObj.segments)) {
				segments = outputObj.segments;
				// Concatenar texto de todos los segmentos
				transcription = segments
					.map((s: { text?: string }) => s.text)
					.join(" ");
			} else if (outputObj.transcription) {
				transcription = outputObj.transcription as string;
			} else if (outputObj.text) {
				transcription = outputObj.text as string;
			} else {
				console.error(
					"⚠️ [Replicate] Formato de respuesta inesperado:",
					output,
				);
				transcription = JSON.stringify(output);
			}
		}

		// 💾 Opcional: Guardar en historial de trabajos
		// Nota: Comentado temporalmente hasta verificar enum job_type en Supabase
		// const { error: jobError } = await supabase
		//   .from('ai_job_history')
		//   .insert({
		//     user_id: user.id,
		//     job_type: 'AUDIO_TRANSCRIPTION', // Ajustar según enum real
		//     status: 'completed',
		//     progress: 100,
		//     description: `Transcripción de audio: ${audioFile.name}`,
		//     details: {
		//       fileName: audioFile.name,
		//       fileSize: audioFile.size,
		//       language,
		//       model: 'whisper-large-v3',
		//       provider: 'replicate'
		//     }
		//   });

		// if (jobError) {
		//   console.warn('⚠️ [Replicate] Error al guardar en historial:', jobError);
		// }

		console.log(
			"✅ [Replicate] Transcripción exitosa (historial deshabilitado temporalmente)",
		);

		return NextResponse.json({
			success: true,
			transcription,
			segments, // ✅ Incluir segmentos con timestamps y speakers
			detectedLanguage, // ✅ Idioma detectado por WhisperX
			metadata: {
				fileName: audioFile.name,
				fileSize: audioFile.size,
				language,
				model: "whisperx-large-v3",
				provider: "replicate",
				hasDiarization: segments.length > 0,
				segmentCount: segments.length,
			},
		});
	} catch (error: unknown) {
		console.error("❌ [Replicate Transcription] Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json(
			{
				error: "Error al transcribir audio",
				details: errorMessage,
			},
			{ status: 500 },
		);
	}
}
