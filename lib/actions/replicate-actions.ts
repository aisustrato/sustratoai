// 📍 lib/actions/replicate-actions.ts
// 🎯 PROPÓSITO: Acciones para interactuar con modelos de IA vía Replicate
// 🔧 DECISIÓN: Usar Replicate para modelos especializados (Mistral, Vision, Seedream)

"use server";

import Replicate from "replicate";

// Inicializar cliente Replicate
const replicate = new Replicate({
	auth: process.env.REPLICATE_API_TOKEN,
});

// ========================================================================
// MISTRAL CHAT
// ========================================================================
export async function runMistralChat(
	prompt: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
	try {
		if (!process.env.REPLICATE_API_TOKEN) {
			return { success: false, error: "REPLICATE_API_TOKEN no configurado" };
		}

		console.log(
			"🚀 [Mistral] Iniciando chat con prompt:",
			prompt.substring(0, 100),
		);

		const output = await replicate.run("mistralai/mistral-7b-instruct-v0.2", {
			input: {
				prompt: prompt,
				max_tokens: 1024,
				temperature: 0.7,
			},
		});

		// Replicate retorna un array de strings para modelos de texto
		const result = Array.isArray(output) ? output.join("") : String(output);

		console.log("✅ [Mistral] Respuesta recibida:", result.substring(0, 100));
		return { success: true, data: result };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [Mistral] Error:", error);
		return {
			success: false,
			error: errorMessage || "Error desconocido en Mistral",
		};
	}
}

// ========================================================================
// DEEPSEEK CHAT (VÍA REPLICATE)
// ========================================================================
export async function runDeepSeekChat(
	prompt: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
	try {
		if (!process.env.REPLICATE_API_TOKEN) {
			return { success: false, error: "REPLICATE_API_TOKEN no configurado" };
		}

		console.log(
			"🚀 [DeepSeek-Replicate] Iniciando chat con prompt:",
			prompt.substring(0, 100),
		);

		const output = await replicate.run("deepseek-ai/deepseek-r1", {
			input: {
				prompt: prompt,
				max_tokens: 2048,
				temperature: 0.7,
			},
		});

		const result = Array.isArray(output) ? output.join("") : String(output);

		console.log(
			"✅ [DeepSeek-Replicate] Respuesta recibida:",
			result.substring(0, 100),
		);
		return { success: true, data: result };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [DeepSeek-Replicate] Error:", error);
		return {
			success: false,
			error: errorMessage || "Error desconocido en DeepSeek",
		};
	}
}

// ========================================================================
// VISION ANALYSIS (LLaVA)
// ========================================================================
export async function runVisionAnalysis(
	imageUrl: string,
	prompt: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
	try {
		if (!process.env.REPLICATE_API_TOKEN) {
			return { success: false, error: "REPLICATE_API_TOKEN no configurado" };
		}

		console.log("🚀 [Vision] Analizando imagen:", imageUrl.substring(0, 50));
		console.log("🚀 [Vision] Prompt:", prompt);

		const output = await replicate.run(
			"yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
			{
				input: {
					image: imageUrl,
					prompt: prompt,
					max_tokens: 1024,
				},
			},
		);

		const result = Array.isArray(output) ? output.join("") : String(output);

		console.log("✅ [Vision] Análisis completado:", result.substring(0, 100));
		return { success: true, data: result };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [Vision] Error:", error);
		return {
			success: false,
			error: errorMessage || "Error desconocido en Vision",
		};
	}
}

// ========================================================================
// SEEDREAM 4.5 GENERATION (2K, 16:9)
// ========================================================================
export async function runSeedreamGeneration(
	prompt: string,
	aspectRatio: string = "16:9",
	resolution: string = "2k",
): Promise<{ success: boolean; data?: string; error?: string }> {
	try {
		if (!process.env.REPLICATE_API_TOKEN) {
			return { success: false, error: "REPLICATE_API_TOKEN no configurado" };
		}

		console.log(
			"🎨 [SeaDream 4.5] Generando imagen con prompt:",
			prompt.substring(0, 100),
		);
		console.log(
			"🎨 [SeaDream 4.5] Aspect Ratio:",
			aspectRatio,
			"| Resolution:",
			resolution,
		);

		const input: Record<string, string | number> = {
			prompt: prompt,
			aspect_ratio: aspectRatio,
			output_format: "png",
			num_inference_steps: 4,
			guidance_scale: 3.5,
		};

		// SeaDream 4.5 en Replicate
		// Usar replicate.predictions.create para tener más control sobre el output
		const prediction = await replicate.predictions.create({
			version:
				"5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
			input,
		});

		console.log("🔍 [SeaDream 4.5] Prediction ID:", prediction.id);
		console.log("🔍 [SeaDream 4.5] Status inicial:", prediction.status);

		// Esperar a que la predicción se complete
		let completedPrediction = prediction;
		while (
			completedPrediction.status !== "succeeded" &&
			completedPrediction.status !== "failed"
		) {
			await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo
			completedPrediction = await replicate.predictions.get(prediction.id);
			console.log("� [SeaDream 4.5] Status:", completedPrediction.status);
		}

		if (completedPrediction.status === "failed") {
			console.error(
				"❌ [SeaDream 4.5] Predicción falló:",
				completedPrediction.error,
			);
			return {
				success: false,
				error:
					typeof completedPrediction.error === "string" ?
						completedPrediction.error
					:	"Predicción falló",
			};
		}

		// El output ahora debe contener la URL de la imagen
		const output = completedPrediction.output;
		console.log("� [SeaDream 4.5] Output type:", typeof output);
		console.log("� [SeaDream 4.5] Output is array:", Array.isArray(output));
		console.log("� [SeaDream 4.5] Output:", output);

		// Extraer la URL de la imagen
		let imageUrl: string;

		if (Array.isArray(output) && output.length > 0) {
			imageUrl = output[0];
			console.log("📦 [SeaDream 4.5] URL del array:", imageUrl);
		} else if (typeof output === "string") {
			imageUrl = output;
			console.log("📦 [SeaDream 4.5] URL directa:", imageUrl);
		} else {
			console.error("❌ [SeaDream 4.5] Output inesperado:", output);
			return {
				success: false,
				error: "Formato de respuesta inválido de Replicate",
			};
		}

		// Validar que sea una URL válida
		if (
			!imageUrl ||
			typeof imageUrl !== "string" ||
			(!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))
		) {
			console.error("❌ [SeaDream 4.5] URL inválida:", imageUrl);
			return { success: false, error: `URL de imagen inválida: ${imageUrl}` };
		}

		console.log("✅ [SeaDream 4.5] Imagen generada:", imageUrl);
		return { success: true, data: imageUrl };
	} catch (error: unknown) {
		const errorMessage: string =
			error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [SeaDream 4.5] Error:", error);
		return { success: false, error: errorMessage };
	}
}

// ========================================================================
// DELETE TEMPORARY IMAGE (Supabase Storage)
// ========================================================================
export async function deleteTemporaryImage(
	path: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const { createSupabaseServerClient } = await import("@/lib/server");
		const supabase = await createSupabaseServerClient();

		console.log("🗑️ [Storage] Eliminando imagen temporal:", path);

		const { error } = await supabase.storage
			.from("temporary-images")
			.remove([path]);

		if (error) {
			console.error("❌ [Storage] Error al eliminar:", error);
			return { success: false, error: error.message };
		}

		console.log("✅ [Storage] Imagen eliminada exitosamente");
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [Storage] Error:", error);
		return { success: false, error: errorMessage || "Error desconocido" };
	}
}
