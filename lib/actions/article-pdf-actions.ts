// EN: lib/actions/article-pdf-actions.ts

"use server";

import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/server";

const STORAGE_BUCKET = "article-pdfs";
const MAX_SIZE = 50 * 1024 * 1024;

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export interface ArticleFullDocument {
	id: string;
	status: "processing" | "ready" | "error";
	markdownContent: string | null;
	errorMessage: string | null;
}

/**
 * Documento vigente (versión actual, `is_current=true`) del artículo
 * completo, si existe. `null` si nunca se subió un PDF para este artículo.
 */
export async function getCurrentArticlePdfDocument(
	articleId: string,
): Promise<ResultadoOperacion<ArticleFullDocument | null>> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("article_full_documents")
			.select("id, status, markdown_content, error_message")
			.eq("article_id", articleId)
			.eq("is_current", true)
			.is("deleted_at", null)
			.maybeSingle();

		if (error) throw error;
		if (!data) return { success: true, data: null };

		return {
			success: true,
			data: {
				id: data.id,
				status: data.status as ArticleFullDocument["status"],
				markdownContent: data.markdown_content,
				errorMessage: data.error_message,
			},
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Error desconocido";
		console.error("[SERVER] Error en getCurrentArticlePdfDocument:", errorMessage, error);
		return { success: false, error: `No se pudo obtener el documento: ${errorMessage}` };
	}
}

/**
 * Sube el PDF completo de un artículo a Storage y registra una fila nueva en
 * `article_full_documents` (`status: 'processing'`) — NUNCA pisa la versión
 * anterior: si existía una vigente, se marca `is_current=false` y queda
 * enlazada vía `replaces_id`. No dispara el procesamiento — eso lo hace
 * `POST /api/workflows/article-pdf/start` con el `documentId` devuelto acá,
 * siguiendo el mismo patrón que el resto de los workflows de Vercel del
 * proyecto (subir/registrar y disparar son pasos separados).
 *
 * Recibe `FormData` (no un objeto con un `File` adentro) porque Next.js no
 * permite pasar `File` dentro de objetos literales a Server Actions — mismo
 * motivo documentado en `ingestaArtefactoFromFormData`.
 */
export async function uploadArticlePdf(
	formData: FormData,
): Promise<{ ok: true; documentId: string } | { ok: false; error: string }> {
	const file = formData.get("file");
	const articleId = formData.get("articleId");

	if (!(file instanceof File) || typeof articleId !== "string") {
		return { ok: false, error: "Payload inválido." };
	}
	if (file.type !== "application/pdf") {
		return { ok: false, error: "El archivo debe ser un PDF." };
	}
	if (file.size > MAX_SIZE) {
		return { ok: false, error: "El archivo excede el tamaño máximo de 50 MB." };
	}

	try {
		const supabase = await createSupabaseServerClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return { ok: false, error: "Usuario no autenticado." };

		const { data: article, error: articleError } = await supabase
			.from("articles")
			.select("project_id")
			.eq("id", articleId)
			.single();
		if (articleError || !article) return { ok: false, error: "Artículo no encontrado." };

		const { data: anterior } = await supabase
			.from("article_full_documents")
			.select("id")
			.eq("article_id", articleId)
			.eq("is_current", true)
			.is("deleted_at", null)
			.maybeSingle();

		const documentId = randomUUID();
		const storagePath = `articles/${article.project_id}/${articleId}/${documentId}/original.pdf`;
		const bytes = new Uint8Array(await file.arrayBuffer());

		const { error: uploadError } = await supabase.storage
			.from(STORAGE_BUCKET)
			.upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
		if (uploadError) {
			return { ok: false, error: `No se pudo subir el PDF: ${uploadError.message}` };
		}

		if (anterior) {
			const { error: updateError } = await supabase
				.from("article_full_documents")
				.update({ is_current: false })
				.eq("id", anterior.id);
			if (updateError) {
				console.error(
					"[SERVER] uploadArticlePdf: no se pudo marcar la versión anterior como no vigente:",
					updateError,
				);
			}
		}

		const { error: insertError } = await supabase.from("article_full_documents").insert({
			id: documentId,
			article_id: articleId,
			storage_path: storagePath,
			status: "processing",
			created_by: user.id,
			replaces_id: anterior?.id ?? null,
		});
		if (insertError) {
			return { ok: false, error: `No se pudo registrar el documento: ${insertError.message}` };
		}

		return { ok: true, documentId };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Error desconocido";
		console.error("[SERVER] Error en uploadArticlePdf:", errorMessage, error);
		return { ok: false, error: errorMessage };
	}
}
