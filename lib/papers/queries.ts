"use server";

// 📍 lib/papers/queries.ts
// Queries de Supabase para papers de la DMZ
// Usa el cliente de servidor existente de /app/auth/session.ts
//
// NOTA: este módulo es un Server Action ("use server"). Es importante porque
// estas funciones se invocan tanto desde Server Components como desde Client
// Components (paso 4 del wizard). Al ser Server Actions, corren enteras en el
// servidor y solo devuelven objetos planos (Paper) al cliente — evitando el
// error "Only plain objects can be passed to Client Components" que ocurría al
// cruzar el cliente de Supabase (instancia de clase) por la frontera.

import { createServerSupabaseClient } from "@/app/auth/session";
import type {
	Paper,
	PaperListItem,
	PaperDraftInput,
	PaperWithImages,
	PaperImage,
	PaperImageInput,
} from "./types";

/**
 * Obtiene todos los papers publicados ordenados por fecha de publicación (más reciente primero)
 * Para el índice público /papers
 */
export async function getPublishedPapers(): Promise<PaperListItem[]> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("papers")
		.select(
			"slug, title, subtitle, abstract_es, authors, published_at, keywords, doi",
		)
		.eq("is_published", true)
		.order("published_at", { ascending: false });

	if (error) {
		console.error("[getPublishedPapers] Error fetching papers:", error);
		return [];
	}

	return (data || []) as unknown as PaperListItem[];
}

/**
 * Obtiene un paper individual por su slug
 * Para la página /papers/[slug]
 * Retorna null si no existe o no está publicado
 */
export async function getPaperBySlug(slug: string): Promise<Paper | null> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("papers")
		.select("*")
		.eq("slug", slug)
		.eq("is_published", true)
		.single();

	if (error) {
		console.error(`[getPaperBySlug] Error fetching paper ${slug}:`, error);
		return null;
	}

	return data as unknown as Paper;
}

/**
 * Obtiene todos los papers publicados (con content_md completo)
 * Para generar el sitemap dinámicamente
 */
export async function getAllPublishedPapersForSitemap(): Promise<
	Pick<Paper, "slug" | "updated_at">[]
> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("papers")
		.select("slug, updated_at")
		.eq("is_published", true)
		.order("published_at", { ascending: false });

	if (error) {
		console.error(
			"[getAllPublishedPapersForSitemap] Error fetching papers:",
			error,
		);
		return [];
	}

	return data || [];
}

// ============================================================================
// QUERIES DE ESCRITURA PARA SISTEMA DE PUBLICACIÓN (/personal/papers)
// ============================================================================

// NOTA: Los errores de tipo "Argument of type 'any' is not assignable to parameter of type 'never'"
// son temporales. Se resolverán al:
// 1. Ejecutar la migración SQL (crear tabla paper_images y columnas en papers)
// 2. Regenerar tipos de Supabase con: npx supabase gen types typescript --local > lib/database.types.ts

/**
 * Crea un nuevo paper en estado borrador
 *
 * @param data - Datos del paper a crear
 * @returns Paper creado con su ID
 */
export async function createPaperDraft(data: PaperDraftInput): Promise<Paper> {
	const supabase = await createServerSupabaseClient();

	// Asignar ownership desde la sesión autenticada (no confiar en el cliente)
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		console.error("[createPaperDraft] No hay usuario autenticado");
		throw new Error("Debes iniciar sesión para crear un paper.");
	}

	const { data: paper, error } = await supabase
		.from("papers")
		.insert({
			...data,
			created_by: data.created_by ?? user.id,
			is_published: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		} as any) // Temporal: tipos se regenerarán tras migración SQL
		.select()
		.single();

	if (error) {
		console.error("[createPaperDraft] Error creating draft:", error);
		throw new Error(`Error creando borrador: ${error.message}`);
	}

	return paper as unknown as Paper;
}

/**
 * Actualiza un paper existente (borrador o publicado)
 *
 * @param paperId - UUID del paper
 * @param data - Datos a actualizar (parciales)
 * @returns Paper actualizado
 */
export async function updatePaperDraft(
	paperId: string,
	data: Partial<PaperDraftInput>,
): Promise<Paper> {
	const supabase = await createServerSupabaseClient();

	const { data: paper, error } = await supabase
		.from("papers")
		.update({
			...data,
			updated_at: new Date().toISOString(),
		} as any)
		.eq("id", paperId)
		.select()
		.single();

	if (error) {
		console.error("[updatePaperDraft] Error updating draft:", error);
		throw new Error(`Error actualizando borrador: ${error.message}`);
	}

	return paper as unknown as Paper;
}

/**
 * Publica un paper (cambia is_published a true)
 *
 * @param paperId - UUID del paper
 * @returns Paper publicado
 */
export async function publishPaper(paperId: string): Promise<Paper> {
	const supabase = await createServerSupabaseClient();

	const { data: paper, error } = await supabase
		.from("papers")
		.update({
			is_published: true,
			published_at: new Date().toISOString(),
			processing_status: "published",
			updated_at: new Date().toISOString(),
		} as any)
		.eq("id", paperId)
		.select()
		.single();

	if (error) {
		console.error("[publishPaper] Error publishing paper:", error);
		throw new Error(`Error publicando paper: ${error.message}`);
	}

	return paper as unknown as Paper;
}

/**
 * Despublica un paper (cambia is_published a false)
 *
 * @param paperId - UUID del paper
 * @returns Paper despublicado
 */
export async function unpublishPaper(paperId: string): Promise<Paper> {
	const supabase = await createServerSupabaseClient();

	const { data: paper, error } = await supabase
		.from("papers")
		.update({
			is_published: false,
			processing_status: "ready",
			updated_at: new Date().toISOString(),
		} as any)
		.eq("id", paperId)
		.select()
		.single();

	if (error) {
		console.error("[unpublishPaper] Error unpublishing paper:", error);
		throw new Error(`Error despublicando paper: ${error.message}`);
	}

	return paper as unknown as Paper;
}

/**
 * Obtiene todos los papers del usuario actual (incluyendo borradores)
 * Para la lista en /personal/papers
 *
 * @returns Array de papers (publicados y borradores)
 */
export async function getMyPapers(): Promise<PaperWithImages[]> {
	const supabase = await createServerSupabaseClient();

	// Obtener usuario actual
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("Usuario no autenticado");
	}

	const { data, error } = await supabase
		.from("papers")
		.select(
			`
      *,
      images:paper_images(*)
    `,
		)
		.eq("created_by", user.id) // Solo papers del usuario actual
		.order("updated_at", { ascending: false });

	if (error) {
		console.error("[getMyPapers] Error fetching papers:", error);
		throw new Error(`Error obteniendo papers: ${error.message}`);
	}

	return (data || []) as unknown as PaperWithImages[];
}

/**
 * Obtiene un paper por ID (incluyendo borradores)
 * Para edición en /personal/papers/[paperId]
 *
 * @param paperId - UUID del paper
 * @returns Paper con sus imágenes, o null si no existe
 */
export async function getPaperById(
	paperId: string,
): Promise<PaperWithImages | null> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("papers")
		.select(
			`
      *,
      images:paper_images(*)
    `,
		)
		.eq("id", paperId)
		.single();

	if (error) {
		console.error(`[getPaperById] Error fetching paper ${paperId}:`, error);
		return null;
	}

	return data as unknown as PaperWithImages;
}

/**
 * Elimina un paper (y sus imágenes por CASCADE)
 *
 * @param paperId - UUID del paper
 */
export async function deletePaper(paperId: string): Promise<void> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase.from("papers").delete().eq("id", paperId);

	if (error) {
		console.error("[deletePaper] Error deleting paper:", error);
		throw new Error(`Error eliminando paper: ${error.message}`);
	}
}

// ============================================================================
// QUERIES PARA IMÁGENES DE PAPERS
// ============================================================================

/**
 * Crea un registro de imagen asociado a un paper
 *
 * @param data - Datos de la imagen
 * @returns Imagen creada
 */
export async function createPaperImage(
	data: PaperImageInput,
): Promise<PaperImage> {
	const supabase = await createServerSupabaseClient();

	const { data: image, error } = await supabase
		.from("paper_images")
		.insert({
			...data,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		} as any)
		.select()
		.single();

	if (error) {
		console.error("[createPaperImage] Error creating image:", error);
		throw new Error(`Error creando imagen: ${error.message}`);
	}

	return image as PaperImage;
}

/**
 * Actualiza un registro de imagen (después de upload)
 *
 * @param imageId - UUID de la imagen
 * @param data - Datos a actualizar
 * @returns Imagen actualizada
 */
export async function updatePaperImage(
	imageId: string,
	data: Partial<PaperImageInput>,
): Promise<PaperImage> {
	const supabase = await createServerSupabaseClient();

	const { data: image, error } = await supabase
		.from("paper_images")
		.update({
			...data,
			updated_at: new Date().toISOString(),
		} as any)
		.eq("id", imageId)
		.select()
		.single();

	if (error) {
		console.error("[updatePaperImage] Error updating image:", error);
		throw new Error(`Error actualizando imagen: ${error.message}`);
	}

	return image as PaperImage;
}

/**
 * Elimina un registro de imagen
 *
 * @param imageId - UUID de la imagen
 */
export async function deletePaperImage(imageId: string): Promise<void> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase
		.from("paper_images")
		.delete()
		.eq("id", imageId);

	if (error) {
		console.error("[deletePaperImage] Error deleting image:", error);
		throw new Error(`Error eliminando imagen: ${error.message}`);
	}
}

/**
 * Obtiene todas las imágenes de un paper ordenadas por posición
 *
 * @param paperId - UUID del paper
 * @returns Array de imágenes
 */
export async function getPaperImages(paperId: string): Promise<PaperImage[]> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("paper_images")
		.select("*")
		.eq("paper_id", paperId)
		.order("position", { ascending: true });

	if (error) {
		console.error("[getPaperImages] Error fetching images:", error);
		throw new Error(`Error obteniendo imágenes: ${error.message}`);
	}

	return (data || []) as PaperImage[];
}
