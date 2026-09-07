// EN: lib/actions/article-annotations-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Anotacion } from "@/lib/mdj/types";

export type VersionType = "original" | "translated";

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Obtiene las anotaciones (frase notable / nota / referencia) guardadas para
 * una versión (original o traducida) del abstract de un artículo.
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
			.order("created_at", { ascending: true });

		if (error) {
			console.error("[SERVER] Error al obtener anotaciones:", error);
			throw error;
		}

		const anotaciones: Anotacion[] = (data || []).map((row) => ({
			id: row.id,
			tipo: row.tipo as Anotacion["tipo"],
			nodo_id: row.nodo_id,
			offset_inicio: row.offset_inicio,
			offset_fin: row.offset_fin,
			fragmento: row.fragmento,
			nota_texto: row.nota_texto ?? undefined,
			semaforo: (row.semaforo ?? undefined) as Anotacion["semaforo"],
			validado: row.validado ?? undefined,
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
