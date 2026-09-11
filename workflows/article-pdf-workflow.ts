//. 📍 workflows/article-pdf-workflow.ts
/**
 * Extrae el contenido de un PDF de artículo (ya subido a Storage por
 * `uploadArticlePdf` en `lib/actions/article-pdf-actions.ts`) vía Replicate
 * Marker (`lib/pdf-processing/marker.ts`) y lo guarda como Markdown en
 * `article_full_documents.markdown_content`. Mismo esqueleto que
 * `workflows/translation-workflow.ts`: workflow sin techo de duración
 * (relevante acá — Marker puede tardar bastante más que traducir un
 * abstract), progreso reportado vía `ai_job_history`.
 *
 * El MDJ (`DocumentoMDJ`) NO se persiste — se parsea al vuelo al leer, igual
 * que hace Cognética Forense con sus propios artefactos ("MDJ frío").
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { createSupabaseServiceRoleClient } from "@/lib/server";
import { extractMarkdownFromPdf } from "@/lib/pdf-processing/marker";
//#endregion ![head]

const STORAGE_BUCKET = "article-pdfs";

//#region [helpers] - 🛠️ ERRORES 🛠️
/**
 * `error instanceof Error` puede dar `false` para un error que cruzó el
 * límite step→workflow del SDK de Workflow: el mecanismo de durabilidad
 * serializa/reconstruye el valor lanzado, y esa reconstrucción no siempre
 * preserva la cadena de prototipos de `Error` — el `.message` original
 * puede sobrevivir en un objeto plano aunque `instanceof Error` ya no dé
 * `true`. Sin este chequeo adicional, el job queda con "Error desconocido"
 * en vez del motivo real (visto en producción con translation-workflow.ts).
 */
function messageFromUnknownError(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "object" && error !== null && "message" in error) {
		const msg = (error as Record<string, unknown>).message;
		if (typeof msg === "string" && msg.length > 0) return msg;
	}
	return typeof error === "string" ? error : "Error desconocido";
}
//#endregion ![helpers]

//#region [steps] - 🔧 STEPS 🔧
async function processArticlePdfStep(jobId: string, documentId: string): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();

	await admin
		.from("ai_job_history")
		.update({ progress: 10, details: { documentId, step: "Descargando PDF..." } })
		.eq("id", jobId);

	const { data: doc, error: docError } = await admin
		.from("article_full_documents")
		.select("storage_path")
		.eq("id", documentId)
		.single();
	if (docError || !doc) {
		throw new Error(`Documento no encontrado: ${docError?.message ?? documentId}`);
	}

	const { data: fileBlob, error: downloadError } = await admin.storage
		.from(STORAGE_BUCKET)
		.download(doc.storage_path);
	if (downloadError || !fileBlob) {
		throw new Error(`No se pudo descargar el PDF: ${downloadError?.message ?? "sin datos"}`);
	}

	const buffer = Buffer.from(await fileBlob.arrayBuffer());

	await admin
		.from("ai_job_history")
		.update({
			progress: 30,
			details: { documentId, step: "Extrayendo texto con Marker (puede tardar varios minutos)..." },
		})
		.eq("id", jobId);

	try {
		const markdown = await extractMarkdownFromPdf(buffer);

		await admin
			.from("article_full_documents")
			.update({ status: "ready", markdown_content: markdown, error_message: null })
			.eq("id", documentId);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Error desconocido";
		await admin
			.from("article_full_documents")
			.update({ status: "error", error_message: errorMessage })
			.eq("id", documentId);
		throw error;
	}
}

async function finalizeArticlePdfJobStep(jobId: string): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();
	await admin
		.from("ai_job_history")
		.update({
			status: "completed",
			progress: 100,
			completed_at: new Date().toISOString(),
			details: { step: "¡Documento procesado!" },
		})
		.eq("id", jobId);
}

async function markArticlePdfJobFailedStep(jobId: string, errorMessage: string): Promise<void> {
	"use step";
	const admin = await createSupabaseServiceRoleClient();
	await admin
		.from("ai_job_history")
		.update({
			status: "failed",
			progress: 100,
			completed_at: new Date().toISOString(),
			error_message: errorMessage,
		})
		.eq("id", jobId);
}
//#endregion ![steps]

//#region [main] - 🔧 ORQUESTADOR 🔧
export async function articlePdfWorkflow(jobId: string, documentId: string): Promise<void> {
	"use workflow";

	try {
		await processArticlePdfStep(jobId, documentId);
		await finalizeArticlePdfJobStep(jobId);
	} catch (error) {
		await markArticlePdfJobFailedStep(jobId, messageFromUnknownError(error));
		throw error;
	}
}
//#endregion ![main]
