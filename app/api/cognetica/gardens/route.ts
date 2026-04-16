// 📍 app/api/cognetica/gardens/route.ts
// 🎯 PROPÓSITO: API para listar jardines de resonancia por proyecto

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";

export async function GET(req: NextRequest) {
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

		const { searchParams } = new URL(req.url);
		const projectId = searchParams.get("projectId");

		if (!projectId) {
			return NextResponse.json(
				{ success: false, error: "projectId requerido" },
				{ status: 400 },
			);
		}

		// Obtener jardines con conteo de elementos
		const { data: gardens, error } = await supabase
			.from("cog_resonance_gardens")
			.select(
				`
                id,
                name,
                description,
                emoji,
                created_at,
                elements:cog_garden_elements(count)
            `,
			)
			.eq("project_id", projectId)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("❌ Error obteniendo jardines:", error);
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 500 },
			);
		}

		// Formatear datos con conteo de elementos
		const formattedGardens = (gardens || []).map((garden: any) => ({
			id: garden.id,
			name: garden.name,
			description: garden.description,
			emoji: garden.emoji,
			created_at: garden.created_at,
			elements_count: garden.elements?.[0]?.count || 0,
		}));

		return NextResponse.json({
			success: true,
			gardens: formattedGardens,
		});
	} catch (error) {
		console.error("❌ Error en /api/cognetica/gardens:", error);
		return NextResponse.json(
			{ success: false, error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
