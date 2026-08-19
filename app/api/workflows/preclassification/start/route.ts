//. 📍 app/api/workflows/preclassification/start/route.ts
/**
 * Dispara el workflow de clasificación inicial de lote (versión Vercel
 * Workflows, ruta paralela al `startInitialPreclassification` de
 * `preclassification-actions.ts`, que no se toca). Ver
 * docs/preclasificacion-auditoria-funcional/07_Requerimiento_Preclasificacion_Workflow_Vercel.md
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import {
	createSupabaseServerClient,
	createSupabaseUserClient,
} from "@/lib/server";
import { preclassificationWorkflow } from "@/workflows/preclassification-workflow";
//#endregion ![head]

//#region [def] - 🎯 CONSTANTES 🎯
// job_type reutilizado del enum existente ('preclassification', minúscula),
// sin uso previo en el código — distingue estos runs de los del flujo viejo
// ('PRECLASSIFICATION', mayúscula).
const WORKFLOW_JOB_TYPE = "preclassification" as const;
//#endregion ![def]

//#region [main] - 🔧 HANDLER 🔧
export async function POST(request: Request) {
	const { batchId } = await request.json();
	if (!batchId || typeof batchId !== "string") {
		return NextResponse.json(
			{ success: false, error: "Se requiere batchId." },
			{ status: 400 },
		);
	}

	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json(
			{ success: false, error: "Usuario no autenticado." },
			{ status: 401 },
		);
	}

	const { data: batch, error: batchError } = await supabase
		.from("article_batches")
		.select("*, projects(id)")
		.eq("id", batchId)
		.single();
	if (batchError || !batch) {
		return NextResponse.json(
			{ success: false, error: "Lote no encontrado." },
			{ status: 404 },
		);
	}
	if (batch.status !== "translated") {
		return NextResponse.json(
			{
				success: false,
				error:
					"El lote debe estar en estado 'traducido' para iniciar la preclasificación.",
			},
			{ status: 400 },
		);
	}

	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return NextResponse.json(
			{
				success: false,
				error: "No se pudo obtener el token de sesión para crear el job.",
			},
			{ status: 401 },
		);
	}
	const db = createSupabaseUserClient(session.access_token);

	const { data: job, error: jobError } = await db
		.from("ai_job_history")
		.insert({
			project_id: batch.projects!.id,
			user_id: user.id,
			job_type: WORKFLOW_JOB_TYPE,
			status: "running",
			description: `[Workflow] Preclasificando Lote #${batch.batch_number}`,
			progress: 0,
			details: {
				batchId,
				total: 0,
				processed: 0,
				step: "Iniciando (workflow)...",
			},
		})
		.select("id")
		.single();
	if (jobError || !job) {
		return NextResponse.json(
			{
				success: false,
				error: `No se pudo crear el registro del job: ${jobError?.message}`,
			},
			{ status: 500 },
		);
	}
	const jobUUID = job.id;

	const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
	const { data: otherJobs, error: duplicateCheckError } = await db
		.from("ai_job_history")
		.select("id")
		.eq("job_type", WORKFLOW_JOB_TYPE)
		.eq("project_id", batch.projects!.id)
		.eq("status", "running")
		.gte("started_at", twentyMinutesAgo)
		.ilike("description", `%Lote #${batch.batch_number}%`)
		.neq("id", jobUUID);

	if (duplicateCheckError) {
		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				error_message: "Error verificando duplicados",
				progress: 100,
			})
			.eq("id", jobUUID);
		return NextResponse.json(
			{ success: false, error: "Error verificando trabajos duplicados." },
			{ status: 500 },
		);
	}

	if (otherJobs && otherJobs.length > 0) {
		await db
			.from("ai_job_history")
			.update({
				status: "failed",
				error_message: `Trabajo duplicado detectado para Lote #${batch.batch_number}`,
				progress: 100,
				completed_at: new Date().toISOString(),
			})
			.eq("id", jobUUID);
		return NextResponse.json(
			{
				success: false,
				error: `Ya existe un workflow de preclasificación en curso para el Lote #${batch.batch_number}.`,
			},
			{ status: 409 },
		);
	}

	await start(preclassificationWorkflow, [jobUUID, batchId, user.id]);

	return NextResponse.json({ success: true, data: { jobId: jobUUID } });
}
//#endregion ![main]
