// 📍 app/api/cognetica_old/lightweight-extraction/route.ts
// 🎯 PROPÓSITO: Endpoint API para extracción ligera de pensadores y datos cronológicos
// 🔧 DECISIÓN: Procesa transcripción completa con DeepSeek Chat (modelo ligero)

import { NextRequest, NextResponse } from "next/server";
import { extractLightweightElements } from "@/lib/actions/cognetica-old-lightweight-extraction-actions";

export async function POST(request: NextRequest) {
	try {
		const { artifactId } = await request.json();

		if (!artifactId) {
			return NextResponse.json(
				{ success: false, error: "artifactId es requerido" },
				{ status: 400 },
			);
		}

		console.log(
			`🚀 [API Lightweight] Iniciando extracción para artefacto: ${artifactId}`,
		);

		const result = await extractLightweightElements(artifactId);

		if (result.success) {
			console.log(`✅ [API Lightweight] Extracción completada exitosamente`);
			return NextResponse.json(result);
		} else {
			console.error(`❌ [API Lightweight] Error:`, result.error);
			return NextResponse.json(result, { status: 500 });
		}
	} catch (error: any) {
		console.error("❌ [API Lightweight] Error no manejado:", error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || "Error desconocido en extracción ligera",
			},
			{ status: 500 },
		);
	}
}
