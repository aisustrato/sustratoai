// 📍 app/api/deepseek/test/route.ts
// 🎯 PROPÓSITO: Endpoint de prueba para verificar conexión con DeepSeek API
// 🔧 DECISIÓN: Acceso directo a DeepSeek (no vía Replicate)

import { NextRequest, NextResponse } from "next/server";
import { callDeepSeekAPI } from "@/lib/deepseek/api";

export async function POST(request: NextRequest) {
	try {
		const { prompt } = await request.json();

		if (!prompt) {
			return NextResponse.json(
				{ error: "Se requiere un prompt" },
				{ status: 400 },
			);
		}

		console.log("🐍 [DeepSeek Test] Probando conexión...");
		console.log("📝 [DeepSeek Test] Prompt:", prompt);

		// Llamar a la API de DeepSeek
		const { result, usage } = await callDeepSeekAPI("deepseek-chat", prompt);

		console.log("✅ [DeepSeek Test] Conexión exitosa");
		console.log("📊 [DeepSeek Test] Tokens usados:", usage);

		return NextResponse.json({
			success: true,
			response: result,
			usage: {
				promptTokens: usage.promptTokenCount,
				completionTokens: usage.candidatesTokenCount,
				totalTokens: usage.totalTokenCount,
			},
		});
	} catch (error: any) {
		console.error("❌ [DeepSeek Test] Error:", error);

		// Detectar errores comunes
		let errorMessage = error.message || "Error desconocido";

		if (errorMessage.includes("API key")) {
			errorMessage =
				"API Key no configurada o inválida. Verifica DEEPSEEK_API_KEY en .env.local";
		} else if (errorMessage.includes("401")) {
			errorMessage = "API Key inválida o expirada";
		} else if (errorMessage.includes("429")) {
			errorMessage =
				"Límite de rate excedido. Espera un momento e intenta de nuevo";
		} else if (errorMessage.includes("500")) {
			errorMessage =
				"Error en el servidor de DeepSeek. Intenta de nuevo más tarde";
		}

		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
				details: error.message,
			},
			{ status: error.status || 500 },
		);
	}
}
