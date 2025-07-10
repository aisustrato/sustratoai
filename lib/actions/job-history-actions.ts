// EN: lib/actions/job-history-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ========================================================================
//  INTERFACES Y TIPOS
// ========================================================================

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

export interface StartJobPayload {
  projectId: string;
  jobType: Database["public"]["Enums"]["job_type"];
  description?: string;
  aiModel?: string;
}

export interface UpdateJobCompletedPayload {
  jobId: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface UpdateJobFailedPayload {
  jobId: string;
  errorMessage: string;
}

export interface GetMyRecentJobsPayload {
  projectId: string;
  jobType?: Database["public"]["Enums"]["job_type"];
  limit?: number;
}

type JobHistoryRow = Database['public']['Tables']['ai_job_history']['Row'];


// ========================================================================
//  ACCIONES DEL HISTORIAL DE TRABAJOS
// ========================================================================

/**
 * Crea un nuevo registro en el historial al iniciar un trabajo.
 * @param payload Datos iniciales del trabajo.
 * @returns El ID del nuevo registro de trabajo creado.
 */
export async function startJobLog(payload: StartJobPayload): Promise<ResultadoOperacion<{ jobId: string }>> {
  const supabase = await createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };

    const { data: newJob, error } = await supabase
      .from('ai_job_history')
      .insert({
        project_id: payload.projectId,
        user_id: user.id,
        job_type: payload.jobType,
        description: payload.description,
        ai_model: payload.aiModel,
        status: 'running',
      })
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, data: { jobId: newJob.id } };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `No se pudo iniciar el log del trabajo: ${msg}` };
  }
}

/**
 * Actualiza un trabajo como completado con éxito.
 * @param payload Datos finales del trabajo, incluyendo el conteo de tokens.
 */
export async function updateJobAsCompleted(payload: UpdateJobCompletedPayload): Promise<ResultadoOperacion<null>> {
  const supabase = await createSupabaseServerClient();
  try {
    const { error } = await supabase
      .from('ai_job_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        input_tokens: payload.inputTokens,
        output_tokens: payload.outputTokens,
        error_message: null,
      })
      .eq('id', payload.jobId);

    if (error) throw error;
    return { success: true, data: null };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `No se pudo actualizar el trabajo a completado: ${msg}` };
  }
}

/**
 * Actualiza un trabajo como fallido, guardando el mensaje de error.
 * @param payload Contiene el ID del trabajo y el mensaje de error.
 */
export async function updateJobAsFailed(payload: UpdateJobFailedPayload): Promise<ResultadoOperacion<null>> {
  const supabase = await createSupabaseServerClient();
  try {
    const { error } = await supabase
      .from('ai_job_history')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: payload.errorMessage,
      })
      .eq('id', payload.jobId);

    if (error) throw error;
    return { success: true, data: null };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `No se pudo actualizar el trabajo a fallido: ${msg}` };
  }
}

/**
 * Obtiene el historial completo de trabajos para un proyecto.
 */
export async function getJobHistoryForProject(projectId: string): Promise<ResultadoOperacion<JobHistoryRow[]>> {
  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase
      .from('ai_job_history')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `No se pudo obtener el historial de trabajos: ${msg}` };
  }
}

/**
 * Obtiene los trabajos recientes de un usuario específico, con filtros opcionales.
 * (La función más atómica que solicitaste).
 */
export async function getMyRecentJobs(payload: GetMyRecentJobsPayload): Promise<ResultadoOperacion<JobHistoryRow[]>> {
    const supabase = await createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };

        let query = supabase
            .from('ai_job_history')
            .select('*')
            .eq('project_id', payload.projectId)
            .eq('user_id', user.id);

        if (payload.jobType) {
            query = query.eq('job_type', payload.jobType);
        }

        query = query.order('started_at', { ascending: false }).limit(payload.limit || 10);

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
        
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudo obtener los trabajos recientes: ${msg}` };
    }
}