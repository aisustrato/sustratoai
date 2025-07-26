// lib/actions/preclassification_phases_actions.ts

'use server';

// import { cookies } from 'next/headers'; // Unused
import { createSupabaseServerClient } from "@/lib/server";

import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';

// Estados de un lote que se consideran "no terminados"
const activeOrInProgressBatchStates: Database["public"]["Enums"]["batch_preclass_status"][] = [
    'pending',
    'translated',
    'review_pending',
    'reconciliation_pending',
    'disputed'
];

// =================================================================//
//    CONSULTAS (QUERIES)
// =================================================================//

/**
 * Obtiene todas las fases de un proyecto específico, ordenadas por su número de fase.
 * @param projectId - El UUID del proyecto.
 * @returns Un objeto con los datos de las fases o un mensaje de error.
 */
export async function getPhasesForProject(projectId: string) {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from('preclassification_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_number', { ascending: true });

    if (error) {
        console.error('Error fetching phases:', error);
        return { data: null, error: { message: 'No se pudieron obtener las fases del proyecto.' } };
    }

    return { data, error: null };
}

/**
 * ⭐️ NUEVA FUNCIÓN: Obtiene la fase activa para un proyecto.
 * Será muy utilizada en la app para saber en qué etapa se encuentra el trabajo.
 * @param projectId - El UUID del proyecto.
 * @returns Un objeto con los datos de la fase activa o null si no hay ninguna.
 */
export async function getActivePhaseForProject(projectId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('preclassification_phases')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single(); // Esperamos como máximo una fase activa

    if (error) {
        // El código 'PGRST116' significa 'No rows found', lo cual es normal si no hay fase activa.
        if (error.code !== 'PGRST116') {
            console.error('Error fetching active phase:', error);
            return { data: null, error: { message: 'Error al obtener la fase activa.' } };
        }
    }

    return { data, error: null };
}


// =================================================================//
//    MUTACIONES (MUTATIONS)
// =================================================================//


/**
 * Crea una nueva fase de preclasificación para un proyecto.
 * @param formData - Datos del formulario con project_id, name, description y phase_number.
 * @returns Un objeto con los datos de la nueva fase o un mensaje de error.
 */
export async function createPhase(formData: FormData) {
    const supabase = await createSupabaseServerClient();

    const phaseData: TablesInsert<'preclassification_phases'> = {
        project_id: formData.get('project_id') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        phase_number: parseInt(formData.get('phase_number') as string, 10),
    };

    if (!phaseData.project_id || !phaseData.name || isNaN(phaseData.phase_number)) {
        return { data: null, error: { message: 'Faltan datos requeridos (proyecto, nombre o número de fase).' } };
    }

    const { data, error } = await supabase
        .from('preclassification_phases')
        .insert(phaseData)
        .select()
        .single();

    if (error) {
        console.error('Error creating phase:', error);
        if (error.code === '23505') { // Unique violation
             return { data: null, error: { message: 'El número de fase ya existe en este proyecto.' } };
        }
        return { data: null, error: { message: 'No se pudo crear la fase.' } };
    }

    return { data, error: null };
}

/**
 * Actualiza los datos de una fase existente (nombre, descripción, número). No maneja cambios de estado.
 * @param formData - Datos del formulario con el id de la fase y los campos a actualizar.
 * @returns Un objeto con los datos de la fase actualizada o un mensaje de error.
 */
export async function updatePhaseDetails(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const phaseId = formData.get('id') as string;

    const phaseUpdate: TablesUpdate<'preclassification_phases'> = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        phase_number: parseInt(formData.get('phase_number') as string, 10),
    };

     if (!phaseId) {
        return { data: null, error: { message: 'ID de fase no proporcionado.' } };
    }

    const { data, error } = await supabase
        .from('preclassification_phases')
        .update(phaseUpdate)
        .eq('id', phaseId)
        .select()
        .single();

    if (error) {
        console.error('Error updating phase details:', error);
        if (error.code === '23505') {
             return { data: null, error: { message: 'El número de fase ya existe en este proyecto.' } };
        }
        return { data: null, error: { message: 'No se pudo actualizar la fase.' } };
    }

    return { data, error: null };
}

/**
 * Actualiza el ESTADO de una fase, aplicando la lógica de negocio para coherencia.
 * @param phaseId - El UUID de la fase a actualizar.
 * @param newStatus - El nuevo estado ('active', 'inactive', 'completed', 'annulled').
 * @returns Un objeto con los datos de la fase actualizada o un mensaje de error.
 */
export async function updatePhaseStatus(phaseId: string, newStatus: 'active' | 'inactive' | 'completed' | 'annulled') {
    const supabase = await createSupabaseServerClient();

    const { data: currentPhase, error: fetchError } = await supabase
        .from('preclassification_phases')
        .select('id, project_id, status')
        .eq('id', phaseId)
        .single();

    if (fetchError || !currentPhase) {
        return { data: null, error: { message: 'No se encontró la fase a actualizar.' } };
    }
    
    const { project_id } = currentPhase;
    
    if (newStatus === 'active') {
        const { data: activePhase, error: activeCheckError } = await supabase
            .from('preclassification_phases')
            .select('id')
            .eq('project_id', project_id)
            .eq('status', 'active')
            .neq('id', phaseId)
            .limit(1)
            .single();
        
        if (activeCheckError && activeCheckError.code !== 'PGRST116') {
            return { data: null, error: { message: 'Error al verificar fases activas.' } };
        }
        if (activePhase) {
            return { data: null, error: { message: 'Ya existe una fase activa. Por favor, complete o desactive la fase actual antes de activar una nueva.' } };
        }
    }

    if (newStatus === 'completed') {
        const { count, error: batchCheckError } = await supabase
            .from('article_batches')
            .select('*', { count: 'exact', head: true })
            .eq('phase_id', phaseId)
            .in('status', activeOrInProgressBatchStates);

        if (batchCheckError) {
             return { data: null, error: { message: 'Error al verificar los lotes de la fase.' } };
        }
        if (count && count > 0) {
            return { data: null, error: { message: `No se puede completar la fase porque tiene ${count} lote(s) de preclasificación pendientes.` } };
        }
    }
    
    const { data: updatedPhase, error: updateError } = await supabase
        .from('preclassification_phases')
        .update({ status: newStatus })
        .eq('id', phaseId)
        .select()
        .single();

    if (updateError) {
        return { data: null, error: { message: 'No se pudo actualizar el estado de la fase.' } };
    }

    const newActivePhaseId = newStatus === 'active' ? phaseId : (currentPhase.status === 'active' ? null : undefined);
    
    if (newActivePhaseId !== undefined) {
         const { error: projectUpdateError } = await supabase
            .from('projects')
            .update({ active_phase_id: newActivePhaseId })
            .eq('id', project_id);

        if (projectUpdateError) {
            return { data: null, error: { message: 'El estado de la fase se actualizó, pero hubo un error al actualizar el proyecto.' } };
        }
    }

    return { data: updatedPhase, error: null };
}

/**
 * Elimina una fase, SOLO SI no tiene lotes o dimensiones asociadas.
 * @param phaseId - El UUID de la fase a eliminar.
 * @returns Un objeto indicando el éxito o un mensaje de error.
 */
export async function deletePhase(phaseId: string) {
    const supabase = await createSupabaseServerClient();

    // 🧠 Lógica de borrado refinada: verificar dependencias antes de eliminar.
    const { count: batchCount, error: batchError } = await supabase
        .from('article_batches').select('*', { count: 'exact', head: true }).eq('phase_id', phaseId);

    const { count: dimensionCount, error: dimensionError } = await supabase
        .from('preclass_dimensions').select('*', { count: 'exact', head: true }).eq('phase_id', phaseId);
    
    if (batchError || dimensionError) {
        return { data: null, error: { message: 'Error al verificar las dependencias de la fase.' } };
    }

    if ((batchCount ?? 0) > 0 || (dimensionCount ?? 0) > 0) {
        return { data: null, error: { message: `La fase no se puede eliminar porque tiene ${dimensionCount} dimensiones y ${batchCount} lotes asociados. Considere anular la fase para preservar el historial.` } };
    }

    // Si no hay dependencias, proceder con el borrado.
    const { error } = await supabase
        .from('preclassification_phases')
        .delete()
        .eq('id', phaseId);

    if (error) {
        console.error('Error deleting phase:', error);
        return { data: null, error: { message: 'No se pudo eliminar la fase.' } };
    }

    return { data: { success: true }, error: null };
}