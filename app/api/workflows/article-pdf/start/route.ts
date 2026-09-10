//. 📍 app/api/workflows/article-pdf/start/route.ts
/**
 * Dispara el workflow de extracción de PDF de artículo
 * (`workflows/article-pdf-workflow.ts`). Route Handler (no Server Action)
 * porque es el patrón documentado por el SDK de Vercel Workflows para
 * disparar un run — mismo esqueleto que
 * `app/api/workflows/translation/start/route.ts`.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { createSupabaseServerClient, createSupabaseUserClient } from "@/lib/server";
import { articlePdfWorkflow } from "@/workflows/article-pdf-workflow";
//#endregion ![head]

//#region [main] - 🔧 HANDLER 🔧
export async function POST(request: Request) {
	// Try/catch de punta a punta: cualquier excepción no prevista acá antes
	// devolvía un 500 sin cuerpo (el cliente fallaba con "Unexpected end of
	// JSON input" en vez de ver el error real). Regla de oro: ningún error
	// silencioso — con esto, cualquier falla queda logueada con contexto Y
	// visible para quien llama.
	try {
		const { documentId } = await request.json();
		if (!documentId || typeof documentId !== "string") {
			return NextResponse.json({ success: false, error: "Se requiere documentId." }, { status: 400 });
		}

		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ success: false, error: "Usuario no autenticado." }, { status: 401 });
		}

		const { data: doc, error: docError } = await supabase
			.from("article_full_documents")
			.select("id, status, articles(project_id)")
			.eq("id", documentId)
			.single();
		if (docError || !doc || !doc.articles) {
			console.error("[article-pdf/start] Documento no encontrado:", documentId, docError);
			return NextResponse.json({ success: false, error: "Documento no encontrado." }, { status: 404 });
		}
		if (doc.status !== "processing") {
			return NextResponse.json(
				{
					success: false,
					error: `El documento debe estar en estado 'processing' para iniciar el procesamiento. Estado actual: ${doc.status}`,
				},
				{ status: 400 },
			);
		}

		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.access_token) {
			return NextResponse.json(
				{ success: false, error: "No se pudo obtener el token de sesión para crear el job." },
				{ status: 401 },
			);
		}
		const db = createSupabaseUserClient(session.access_token);

		const { data: job, error: jobError } = await db
			.from("ai_job_history")
			.insert({
				project_id: doc.articles.project_id,
				user_id: user.id,
				job_type: "article_pdf_processing",
				status: "running",
				description: "Procesando PDF de artículo",
				progress: 0,
				details: { documentId, step: "Iniciando procesamiento..." },
			})
			.select("id")
			.single();
		if (jobError || !job) {
			console.error("[article-pdf/start] Error al crear ai_job_history:", jobError);
			return NextResponse.json(
				{ success: false, error: `No se pudo crear el registro del job: ${jobError?.message}` },
				{ status: 500 },
			);
		}

		await start(articlePdfWorkflow, [job.id, documentId]);

		return NextResponse.json({ success: true, data: { jobId: job.id } });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[article-pdf/start] Excepción no capturada:", error);
		return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
	}
}
//#endregion ![main]
