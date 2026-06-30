// 📍 lib/papers/slug.ts
// Utilidades para generación y validación de slugs de papers

import { createServerSupabaseClient } from "@/app/auth/session";
import { supabase } from "@/app/auth/client";

/**
 * Genera un slug URL-friendly desde un título
 *
 * Características:
 * - Normaliza Unicode (quita acentos)
 * - Convierte a minúsculas
 * - Reemplaza caracteres no-alfanuméricos con guiones
 * - Limita a 100 caracteres
 *
 * @example
 * generatePaperSlug("De la Paradoja a la Infraestructura")
 * // → "de-la-paradoja-a-la-infraestructura"
 */
export function generatePaperSlug(title: string): string {
	if (!title || title.trim().length === 0) {
		return "";
	}

	return title
		.normalize("NFD") // Descomponer caracteres Unicode
		.replace(/[\u0300-\u036f]/g, "") // Quitar marcas diacríticas (acentos)
		.toLowerCase() // Minúsculas
		.replace(/[^a-z0-9]+/g, "-") // No-alfanuméricos → guión
		.replace(/^-+|-+$/g, "") // Quitar guiones al inicio/fin
		.slice(0, 100); // Limitar longitud
}

/**
 * Verifica si un slug está disponible (no existe en la BD)
 * Versión para server components
 *
 * @param slug - Slug a verificar
 * @param excludePaperId - ID del paper a excluir (para edición)
 * @returns true si el slug está disponible
 */
export async function isSlugAvailableServer(
	slug: string,
	excludePaperId?: string,
): Promise<boolean> {
	const supabase = await createServerSupabaseClient();

	let query = supabase.from("papers").select("id").eq("slug", slug).limit(1);

	// Si estamos editando un paper, excluirlo de la búsqueda
	if (excludePaperId) {
		query = query.neq("id", excludePaperId);
	}

	const { data, error } = await query;

	if (error) {
		console.error("[isSlugAvailableServer] Error:", error);
		return false; // En caso de error, asumir no disponible por seguridad
	}

	return data.length === 0;
}

/**
 * Verifica si un slug está disponible (no existe en la BD)
 * Versión para client components
 *
 * @param slug - Slug a verificar
 * @param excludePaperId - ID del paper a excluir (para edición)
 * @returns true si el slug está disponible
 */
export async function isSlugAvailableClient(
	slug: string,
	excludePaperId?: string,
): Promise<boolean> {
	// Usar cliente de browser importado

	let query = supabase.from("papers").select("id").eq("slug", slug).limit(1);

	if (excludePaperId) {
		query = query.neq("id", excludePaperId);
	}

	const { data, error } = await query;

	if (error) {
		console.error("[isSlugAvailableClient] Error:", error);
		return false;
	}

	return data.length === 0;
}

/**
 * Genera un slug único agregando sufijo numérico si es necesario
 *
 * @example
 * generateUniqueSlug("mi-paper")
 * // Si existe → "mi-paper-2"
 * // Si "mi-paper-2" existe → "mi-paper-3"
 */
export async function generateUniqueSlugServer(
	baseTitle: string,
): Promise<string> {
	const baseSlug = generatePaperSlug(baseTitle);
	let slug = baseSlug;
	let counter = 2;

	// Intentar hasta encontrar uno disponible
	while (!(await isSlugAvailableServer(slug))) {
		slug = `${baseSlug}-${counter}`;
		counter++;

		// Prevenir loop infinito
		if (counter > 100) {
			// Agregar timestamp como último recurso
			slug = `${baseSlug}-${Date.now()}`;
			break;
		}
	}

	return slug;
}

/**
 * Valida formato de slug
 *
 * Reglas:
 * - Solo minúsculas, números y guiones
 * - No puede empezar ni terminar con guión
 * - Longitud entre 3 y 100 caracteres
 */
export function isValidSlugFormat(slug: string): boolean {
	if (!slug || slug.length < 3 || slug.length > 100) {
		return false;
	}

	// Solo minúsculas, números y guiones
	const formatRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
	return formatRegex.test(slug);
}

/**
 * Sanitiza un slug ingresado manualmente por el usuario
 * Aplica las mismas reglas que generatePaperSlug
 */
export function sanitizeSlug(input: string): string {
	return generatePaperSlug(input);
}
