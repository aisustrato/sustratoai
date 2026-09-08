// EN: lib/actions/article-annotations-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Anotacion } from "@/lib/mdj/types";

export type VersionType = "original" | "translated";

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Obtiene las anotaciones vigentes (frase notable / nota / referencia) para una
 * versión (original o traducida) del abstract de un artículo, con el nombre de
 * quien las creó. Filtra `is_current=true, deleted_at=null` — el historial
 * completo (ediciones/borrados) queda en la tabla vía `replaces_id`, pero no se
 * expone acá porque nadie lo pidió todavía.
 */
export async function getAnnotations(
	articleId: string,
	versionType: VersionType,
): Promise<ResultadoOperacion<Anotacion[]>> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("article_annotations")
			.select("*")
			.eq("article_id", articleId)
			.eq("version_type", versionType)
			.eq("is_current", true)
			.is("deleted_at", null)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("[SERVER] Error al obtener anotaciones:", error);
			throw error;
		}

		const filas = data || [];
		const autorIds = Array.from(new Set(filas.map((row) => row.created_by)));

		const nombresPorAutor = new Map<string, string>();
		if (autorIds.length > 0) {
			const { data: perfiles, error: perfilesError } = await supabase
				.from("users_profiles")
				.select("user_id, public_display_name")
				.in("user_id", autorIds);

			if (perfilesError) {
				console.error("[SERVER] Error al resolver autores de anotaciones:", perfilesError);
			} else {
				for (const perfil of perfiles || []) {
					if (perfil.public_display_name) {
						nombresPorAutor.set(perfil.user_id, perfil.public_display_name);
					}
				}
			}
		}

		const anotaciones: Anotacion[] = filas.map((row) => ({
			id: row.id,
			tipo: row.tipo as Anotacion["tipo"],
			nodo_id: row.nodo_id,
			offset_inicio: row.offset_inicio,
			offset_fin: row.offset_fin,
			fragmento: row.fragmento,
			nota_texto: row.nota_texto ?? undefined,
			semaforo: (row.semaforo ?? undefined) as Anotacion["semaforo"],
			validado: row.validado ?? undefined,
			autor_nombre: nombresPorAutor.get(row.created_by) ?? undefined,
			creado_en: row.created_at,
		}));

		return { success: true, data: anotaciones };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		console.error("[SERVER] Error en getAnnotations:", errorMessage, error);
		return {
			success: false,
			error: `No se pudieron obtener las anotaciones: ${errorMessage}`,
		};
	}
}

export interface CreateAnnotationPayload {
	articleId: string;
	versionType: VersionType;
	anotacion: Anotacion;
}

/**
 * Crea una anotación nueva. Firma compatible con los callbacks
 * `onAgregarFraseNotable` / `onAgregarNota` / `onAgregarReferencia` de
 * StandardMDJViewerClient, que esperan `Promise<{ ok: boolean }>`.
 *
 * El `id` que trae `anotacion` (generado en el cliente por
 * `generarIdAnotacion`) no es un UUID válido — se usa solo para el estado
 * optimista local del visor. Aquí se deja que la base de datos genere su
 * propio `id`; al recargar, `getAnnotations` devuelve el id real.
 */
export async function createAnnotation(
	payload: CreateAnnotationPayload,
): Promise<{ ok: boolean }> {
	try {
		const supabase = await createSupabaseServerClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.error("[SERVER] createAnnotation: usuario no autenticado");
			return { ok: false };
		}

		const { anotacion } = payload;

		const { error } = await supabase.from("article_annotations").insert({
			article_id: payload.articleId,
			version_type: payload.versionType,
			tipo: anotacion.tipo,
			nodo_id: anotacion.nodo_id,
			offset_inicio: anotacion.offset_inicio,
			offset_fin: anotacion.offset_fin,
			fragmento: anotacion.fragmento,
			nota_texto: anotacion.nota_texto ?? null,
			semaforo: anotacion.semaforo ?? null,
			validado: anotacion.validado ?? null,
			created_by: user.id,
		});

		if (error) {
			console.error("[SERVER] Error en createAnnotation:", error);
			return { ok: false };
		}

		return { ok: true };
	} catch (error) {
		console.error("[SERVER] Error en createAnnotation:", error);
		return { ok: false };
	}
}

export interface EditAnnotationPayload {
	articleId: string;
	versionType: VersionType;
	anotacion: Anotacion;
}

/**
 * Corrige una anotación existente SIN pisar su contenido: inserta una fila
 * nueva con el contenido corregido (`replaces_id` apunta a la anterior) y
 * marca la anterior `is_current=false`. Nunca se hace UPDATE del contenido.
 *
 * `anotacion.id` debe ser el id de la fila vigente que se está corrigiendo
 * (así llegan los callbacks `onEditar` de NotaTooltip/ReferenciaTooltip: el
 * mismo objeto con algún campo de contenido cambiado).
 */
export async function editAnnotation(
	payload: EditAnnotationPayload,
): Promise<{ ok: boolean }> {
	try {
		const supabase = await createSupabaseServerClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.error("[SERVER] editAnnotation: usuario no autenticado");
			return { ok: false };
		}

		const { anotacion } = payload;

		const { error: insertError } = await supabase
			.from("article_annotations")
			.insert({
				article_id: payload.articleId,
				version_type: payload.versionType,
				tipo: anotacion.tipo,
				nodo_id: anotacion.nodo_id,
				offset_inicio: anotacion.offset_inicio,
				offset_fin: anotacion.offset_fin,
				fragmento: anotacion.fragmento,
				nota_texto: anotacion.nota_texto ?? null,
				semaforo: anotacion.semaforo ?? null,
				validado: anotacion.validado ?? null,
				created_by: user.id,
				replaces_id: anotacion.id,
			});

		if (insertError) {
			console.error("[SERVER] Error en editAnnotation (insert):", insertError);
			return { ok: false };
		}

		const { error: updateError } = await supabase
			.from("article_annotations")
			.update({ is_current: false })
			.eq("id", anotacion.id);

		if (updateError) {
			console.error("[SERVER] Error en editAnnotation (marcar anterior):", updateError);
			return { ok: false };
		}

		return { ok: true };
	} catch (error) {
		console.error("[SERVER] Error en editAnnotation:", error);
		return { ok: false };
	}
}

/**
 * Borra (lógicamente) una anotación: nunca DELETE — marca `is_current=false`,
 * `deleted_at`/`deleted_by`. La fila y su contenido original quedan intactos.
 */
export async function deleteAnnotation(
	annotationId: string,
): Promise<{ ok: boolean }> {
	try {
		const supabase = await createSupabaseServerClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.error("[SERVER] deleteAnnotation: usuario no autenticado");
			return { ok: false };
		}

		const { error } = await supabase
			.from("article_annotations")
			.update({
				is_current: false,
				deleted_at: new Date().toISOString(),
				deleted_by: user.id,
			})
			.eq("id", annotationId);

		if (error) {
			console.error("[SERVER] Error en deleteAnnotation:", error);
			return { ok: false };
		}

		return { ok: true };
	} catch (error) {
		console.error("[SERVER] Error en deleteAnnotation:", error);
		return { ok: false };
	}
}
