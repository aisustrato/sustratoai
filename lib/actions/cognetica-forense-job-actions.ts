//. 📍 lib/actions/cognetica-forense-job-actions.ts
/**
 * Server Actions para registrar cada paso del pipeline de metabolización
 * de Cognética Forense en la tabla `ai_job_history`.
 *
 * Cada paso (Crónica, Destilado, Núcleo, Germinal) crea un registro al
 * iniciar y lo cierra al terminar con los tokens consumidos. Esto permite:
 *   - Real-time: el frontend sabe qué paso está activo sin adivinar.
 *   - Historial: el usuario ve consumo de tokens por paso, modelo usado, etc.
 *
 * Usa `createSupabaseServiceRoleClient` para bypass RLS en writes.
 *
 * ⚠️ REGLA DE ORO: PROHIBIDO ERRORES SILENCIOSOS.
 * Todo error se loguea con contexto completo.
 */

"use server";

import { createSupabaseServiceRoleClient } from "@/lib/server";

// ========================================================================
//  TYPES
// ========================================================================

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================================================
//  INICIAR JOB
// ========================================================================

/**
 * Crea un registro en `ai_job_history` al iniciar un paso del pipeline.
 *
 * @param artefactoId - UUID del artefacto que se está metabolizando.
 * @param projectId   - UUID del proyecto.
 * @param userId      - UUID del usuario que ejecuta.
 * @param stepName    - Nombre del paso: "cronica" | "destilado" | "nucleo" | "germinal"
 * @param aiModel     - Modelo IA usado (opcional, se puede setear al completar).
 * @returns jobId del registro creado, o error.
 */
export async function iniciarJobCognetica(
  artefactoId: string,
  projectId: string,
  userId: string,
  stepName: string,
  aiModel?: string,
): Promise<ResultadoOperacion<{ jobId: string }>> {
  const admin = await createSupabaseServiceRoleClient();

  try {
    const { data: newJob, error } = await admin
      .from("ai_job_history")
      .insert({
        project_id: projectId,
        user_id: userId,
        job_type: "cognetica_metabolizacion",
        description: `Cognética: ${stepName} — artefacto ${artefactoId.slice(0, 8)}`,
        ai_model: aiModel ?? null,
        status: "running",
        progress: 0,
        details: {
          artefacto_id: artefactoId,
          step_name: stepName,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[iniciarJobCognetica] ❌ Supabase error:", JSON.stringify(error));
      throw error;
    }
    console.log(`[iniciarJobCognetica] ✅ Job creado: ${newJob.id}, step="${stepName}", artefacto=${artefactoId.slice(0, 8)}`);
    return { success: true, data: { jobId: newJob.id } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    console.error("[iniciarJobCognetica] ❌ Excepción:", msg);
    return { success: false, error: msg };
  }
}

// ========================================================================
//  COMPLETAR JOB
// ========================================================================

/**
 * Marca un job como completado con los tokens consumidos.
 *
 * @param jobId        - UUID del registro en ai_job_history.
 * @param inputTokens  - Tokens de input consumidos por el LLM.
 * @param outputTokens - Tokens de output consumidos por el LLM.
 */
export async function completarJobCognetica(
  jobId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<ResultadoOperacion<null>> {
  const admin = await createSupabaseServiceRoleClient();

  try {
    const { error } = await admin
      .from("ai_job_history")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        error_message: null,
      })
      .eq("id", jobId);

    if (error) {
      console.error("[completarJobCognetica] ❌ Supabase error:", JSON.stringify(error));
      throw error;
    }
    console.log(`[completarJobCognetica] ✅ Job completado: ${jobId}, tokens in=${inputTokens} out=${outputTokens}`);
    return { success: true, data: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    console.error("[completarJobCognetica] ❌ Excepción:", msg);
    return { success: false, error: msg };
  }
}

// ========================================================================
//  FALLAR JOB
// ========================================================================

/**
 * Marca un job como fallido con el mensaje de error.
 *
 * @param jobId        - UUID del registro en ai_job_history.
 * @param errorMessage - Mensaje descriptivo del error.
 */
export async function fallarJobCognetica(
  jobId: string,
  errorMessage: string,
): Promise<ResultadoOperacion<null>> {
  const admin = await createSupabaseServiceRoleClient();

  try {
    const { error } = await admin
      .from("ai_job_history")
      .update({
        status: "failed",
        progress: 100,
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq("id", jobId);

    if (error) {
      console.error("[fallarJobCognetica] ❌ Supabase error:", JSON.stringify(error));
      throw error;
    }
    console.log(`[fallarJobCognetica] ✅ Job fallido: ${jobId}`);
    return { success: true, data: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    console.error("[fallarJobCognetica] ❌ Excepción:", msg);
    return { success: false, error: msg };
  }
}

// ========================================================================
//  OBTENER JOB ACTIVO (lectura)
// ========================================================================

/**
 * Obtiene el job activo (running) más reciente para un artefacto.
 *
 * @param artefactoId - UUID del artefacto.
 * @returns El job activo o null si no hay ninguno en curso.
 */
export async function obtenerJobActivoCognetica(
  artefactoId: string,
): Promise<ResultadoOperacion<{
  id: string;
  step_name: string;
  status: string;
  progress: number | null;
  started_at: string | null;
  ai_model: string | null;
} | null>> {
  const admin = await createSupabaseServiceRoleClient();

  try {
    // Filtrar por job_type, status Y artefacto_id dentro de details JSONB
    const { data, error } = await admin
      .from("ai_job_history")
      .select("id, status, progress, started_at, ai_model, details")
      .eq("job_type", "cognetica_metabolizacion")
      .eq("status", "running")
      .filter("details->>artefacto_id", "eq", artefactoId)
      .order("started_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[obtenerJobActivoCognetica] ❌ Supabase error:", JSON.stringify(error));
      throw error;
    }

    if (!data || data.length === 0) {
      return { success: true, data: null };
    }

    const row = data[0];
    const details = (row.details as Record<string, unknown> | null) ?? {};
    const stepName = (details.step_name as string) ?? null;

    if (!stepName) {
      // Datos inconsistentes: hay job activo pero sin step_name. NO devolvemos
      // "data: null" porque eso disfraza el bug como "no hay job". Retornamos
      // error explícito para que el caller (y el usuario) lo vea.
      const msg = `Job activo ${row.id} sin step_name en details — datos inconsistentes`;
      console.error("[obtenerJobActivoCognetica] ❌", msg);
      return { success: false, error: msg };
    }

    return {
      success: true,
      data: {
        id: row.id,
        step_name: stepName,
        status: row.status ?? "running",
        progress: row.progress,
        started_at: row.started_at,
        ai_model: row.ai_model,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    console.error("[obtenerJobActivoCognetica] ❌ Excepción:", msg);
    return { success: false, error: msg };
  }
}

// ========================================================================
//  LISTAR JOBS MAESTROS ACTIVOS (rehidratación tras refresh)
// ========================================================================

/**
 * Lista los jobs maestros de cognética relevantes para rehidratar el panel:
 *
 *   1. Todos los que están **en curso** (status="running") sin límite de tiempo.
 *   2. Los que **terminaron recientemente** (status="completed" | "failed")
 *      en los últimos `VENTANA_RECIENTES_MS`. Esto cubre el caso en que el
 *      proceso se cerró mientras el cliente estaba en otra pestaña o cargando
 *      — sin esto, el usuario refrescaba y "no se enteraba" del resultado.
 *
 * El cliente decide qué hacer con los recientes: el `CogneticaJobHandler`
 * hace un SELECT inicial al montarse, ve el `status` ya terminal, dispara
 * `expandJobManager()` para alertar y muestra el botón "Ir al artefacto".
 *
 * Filtramos por `details->>es_job_maestro = 'true'` para excluir los jobs
 * per-step que conviven en la misma tabla.
 */
const VENTANA_RECIENTES_MS = 5 * 60 * 1000; // 5 minutos

export async function listarJobsCogneticaActivos(
  projectId: string,
  userId: string,
): Promise<ResultadoOperacion<Array<{
  jobIdBackend: string;
  artefactoId: string;
  pipelineTipo: string;
  description: string | null;
  progress: number | null;
  startedAt: string | null;
  status: string | null;
}>>> {
  const admin = await createSupabaseServiceRoleClient();

  try {
    const desde = new Date(Date.now() - VENTANA_RECIENTES_MS).toISOString();

    // Una query única que cubre los dos casos:
    //   - status="running" (siempre, sin límite de tiempo)
    //   - status="completed" | "failed" con started_at >= ahora - 5min
    // Hacemos dos queries paralelas porque el OR con filtros distintos en
    // started_at se complica con el query builder de Supabase.
    const [activosRes, recientesRes] = await Promise.all([
      admin
        .from("ai_job_history")
        .select("id, description, progress, started_at, status, details")
        .eq("job_type", "cognetica_metabolizacion")
        .eq("status", "running")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .filter("details->>es_job_maestro", "eq", "true")
        .order("started_at", { ascending: false }),
      admin
        .from("ai_job_history")
        .select("id, description, progress, started_at, status, details")
        .eq("job_type", "cognetica_metabolizacion")
        .in("status", ["completed", "failed"])
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .gte("started_at", desde)
        .filter("details->>es_job_maestro", "eq", "true")
        .order("started_at", { ascending: false }),
    ]);

    if (activosRes.error) {
      console.error(
        "[listarJobsCogneticaActivos] ❌ Query activos error:",
        JSON.stringify(activosRes.error),
      );
      throw activosRes.error;
    }
    if (recientesRes.error) {
      console.error(
        "[listarJobsCogneticaActivos] ❌ Query recientes error:",
        JSON.stringify(recientesRes.error),
      );
      throw recientesRes.error;
    }

    const mapRow = (row: {
      id: string;
      description: string | null;
      progress: number | null;
      started_at: string | null;
      status: string | null;
      details: Record<string, unknown> | null;
    }) => {
      const details = row.details ?? {};
      return {
        jobIdBackend: row.id,
        artefactoId: (details.artefacto_id as string) ?? "",
        pipelineTipo: (details.pipeline_tipo as string) ?? "",
        description: row.description,
        progress: row.progress,
        startedAt: row.started_at,
        status: row.status,
      };
    };

    const jobs = [
      ...((activosRes.data as Array<Parameters<typeof mapRow>[0]> | null) ?? []).map(mapRow),
      ...((recientesRes.data as Array<Parameters<typeof mapRow>[0]> | null) ?? []).map(mapRow),
    ];

    return { success: true, data: jobs };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    console.error("[listarJobsCogneticaActivos] ❌ Excepción:", msg);
    return { success: false, error: msg };
  }
}
