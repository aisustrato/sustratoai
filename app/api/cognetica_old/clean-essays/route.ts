// 📍 app/api/cognetica_old/clean-essays/route.ts
// 🎯 PROPÓSITO: Endpoint para ejecutar limpieza de ensayos destilados envueltos en JSON

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { cleanDistilledEssaysJSON } from "@/lib/actions/cognetica-old-migration-clean-essays";

export async function POST(req: NextRequest) {
	try {
		const supabase = await createSupabaseServerClient();

		// Verificar autenticación
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autenticado" }, { status: 401 });
		}

		console.log(
			`🧹 [API] Usuario ${user.email} ejecutando limpieza de ensayos...`,
		);

		// Ejecutar limpieza
		const result = await cleanDistilledEssaysJSON();

		console.log(`✅ [API] Limpieza completada:`, {
			cleaned: result.cleaned,
			skipped: result.skipped,
			errors: result.errors,
		});

		return NextResponse.json({
			success: result.success,
			data: result,
		});
	} catch (error) {
		console.error("Error en API de limpieza de ensayos:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Error desconocido" },
			{ status: 500 },
		);
	}
}
