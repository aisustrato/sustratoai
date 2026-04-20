// 📍 lib/actions/cognetica-old-infographic-images-actions.ts
// 🎯 PROPÓSITO: Acciones para gestionar imágenes de infografías generadas

"use server";

import { createSupabaseServerClient } from "@/lib/server";

type ResultadoOperacion<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

export interface InfographicImage {
	id: string;
	promptId: string;
	imageUrl: string;
	style: string;
	promptText: string;
	width: number;
	height: number;
	status: string | null;
	createdAt: string | null;
}

/**
 * Obtener imágenes de infografías generadas para un artefacto
 */
export async function getInfographicImages(
	artifactId: string,
): Promise<ResultadoOperacion<InfographicImage[]>> {
	try {
		const supabase = await createSupabaseServerClient();

		// Primero obtener los prompts del artefacto
		const { data: prompts, error: promptsError } = await supabase
			.from("cog_image_prompts")
			.select("id, prompt_text, style_modifiers")
			.eq("artifact_id", artifactId);

		if (promptsError) {
			console.error("❌ Error obteniendo prompts:", promptsError);
			return { success: false, error: promptsError.message };
		}

		if (!prompts || prompts.length === 0) {
			return { success: true, data: [] };
		}

		const promptIds = prompts.map((p) => p.id);

		// Luego obtener las imágenes de esos prompts
		const { data, error } = await supabase
			.from("cog_generated_images")
			.select("id, prompt_id, storage_path, width, height, status, created_at")
			.in("prompt_id", promptIds)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("❌ Error obteniendo imágenes de infografías:", error);
			return { success: false, error: error.message };
		}

		// Crear un mapa de prompts por ID para fácil acceso
		const promptsMap = new Map(prompts.map((p) => [p.id, p]));

		// Generar URLs firmadas para cada imagen (igual que el audio)
		const images: InfographicImage[] = await Promise.all(
			(data || []).map(
				async (img: {
					id: string;
					prompt_id: string;
					storage_path: string;
					width: number | null;
					height: number | null;
					status: string | null;
					created_at: string | null;
				}) => {
					const prompt = promptsMap.get(img.prompt_id);

					// Generar URL firmada temporal (1 hora de validez)
					const { data: signedUrlData } = await supabase.storage
						.from("cognetica-files")
						.createSignedUrl(img.storage_path, 3600);

					return {
						id: img.id,
						promptId: img.prompt_id,
						imageUrl: signedUrlData?.signedUrl || "",
						style: prompt?.style_modifiers?.[0] || "unknown",
						promptText: prompt?.prompt_text || "",
						width: img.width || 2048,
						height: img.height || 1152,
						status: img.status,
						createdAt: img.created_at,
					};
				},
			),
		);

		console.log(
			`✅ Obtenidas ${images.length} imágenes de infografías para artefacto ${artifactId}`,
		);
		return { success: true, data: images };
	} catch (error: unknown) {
		console.error("❌ Error en getInfographicImages:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

/**
 * Verificar si un artefacto tiene imágenes de infografías generadas
 */
export async function hasInfographicImages(
	artifactId: string,
): Promise<ResultadoOperacion<boolean>> {
	try {
		const supabase = await createSupabaseServerClient();

		const { count, error } = await supabase
			.from("cog_generated_images")
			.select("id", { count: "exact", head: true })
			.eq("cog_image_prompts.artifact_id", artifactId);

		if (error) {
			console.error("❌ Error verificando imágenes:", error);
			return { success: false, error: error.message };
		}

		return { success: true, data: (count || 0) > 0 };
	} catch (error: unknown) {
		console.error("❌ Error en hasInfographicImages:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}

/**
 * Eliminar todas las imágenes de infografías de un artefacto
 */
export async function deleteInfographicImages(
	artifactId: string,
): Promise<ResultadoOperacion<number>> {
	try {
		const supabase = await createSupabaseServerClient();

		// Primero obtener los IDs de los prompts
		const { data: prompts, error: promptsError } = await supabase
			.from("cog_image_prompts")
			.select("id")
			.eq("artifact_id", artifactId);

		if (promptsError) {
			console.error("❌ Error obteniendo prompts:", promptsError);
			return { success: false, error: promptsError.message };
		}

		if (!prompts || prompts.length === 0) {
			return { success: true, data: 0 };
		}

		const promptIds = prompts.map((p) => p.id);

		// Eliminar imágenes (cascade eliminará los prompts)
		const { error: deleteError } = await supabase
			.from("cog_generated_images")
			.delete()
			.in("prompt_id", promptIds);

		if (deleteError) {
			console.error("❌ Error eliminando imágenes:", deleteError);
			return { success: false, error: deleteError.message };
		}

		// Eliminar prompts
		const { error: deletePromptsError } = await supabase
			.from("cog_image_prompts")
			.delete()
			.in("id", promptIds);

		if (deletePromptsError) {
			console.error("❌ Error eliminando prompts:", deletePromptsError);
			return { success: false, error: deletePromptsError.message };
		}

		console.log(`✅ Eliminadas ${prompts.length} imágenes de infografías`);
		return { success: true, data: prompts.length };
	} catch (error: unknown) {
		console.error("❌ Error en deleteInfographicImages:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}
