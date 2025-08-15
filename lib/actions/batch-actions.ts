// lib/actions/batch-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getActivePhaseForProject } from "./preclassification_phases_actions";
// CAMBIO: Se importa la acción del otro archivo para obtener los IDs
import { listEligibleArticlesForPhase } from "./phase-eligible-articles-actions";
import { ResultadoOperacion } from "./types";

// ========================================================================
//	INTERFACES Y TIPOS
// ========================================================================
const PERMISO_CREAR_LOTES = "can_create_batches";

export interface BatchingStatus {
    status: 'NO_ACTIVE_PHASE' | 'UNIVERSE_NOT_DEFINED' | 'READY_FOR_BATCHING' | 'BATCHES_CREATED';
    activePhase?: { id: string; phase_number: number; };
    totalUniverseSize?: number;
    unbatchedArticleCount?: number;
    canResetBatches?: boolean;
}

// ========================================================================
// 	ACCIÓN 1.5: VERIFICAR SI UNA FASE PERMITE MODIFICAR DIMENSIONES
// 	Regla: Se permite modificar/eliminar dimensiones mientras NO existan
// 	lotes de la fase en estado distinto al estado inicial.
// 	- Fase 1: estado inicial = 'pending'
// 	- Fases >1: estado inicial = 'translated'
// ========================================================================
export async function canModifyDimensionsForPhase(
    phaseId: string
): Promise<ResultadoOperacion<{ allowed: boolean; reason?: string }>> {
    const opId = `CMDP-${Math.floor(Math.random() * 10000)}`;
    console.log(`[${opId}] Verificando si la fase permite modificar dimensiones: ${phaseId}`);

    try {
        const supabase = await createSupabaseServerClient();

        // Obtener el phase_number para determinar el estado inicial de sus lotes
        const { data: phaseData, error: phaseError } = await supabase
            .from('preclassification_phases')
            .select('phase_number, name')
            .eq('id', phaseId)
            .single();

        if (phaseError || !phaseData) {
            return { success: false, error: 'Fase no encontrada para verificación.' };
        }

        const initialState = phaseData.phase_number === 1 ? 'pending' : 'translated';

        // Contar lotes que NO están en el estado inicial
        const { count: advancedCount, error: countError } = await supabase
            .from('article_batches')
            .select('*', { count: 'exact', head: true })
            .eq('phase_id', phaseId)
            .neq('status', initialState);

        if (countError) {
            return { success: false, error: 'Error al verificar estado de los lotes de la fase.' };
        }

        const hasAdvanced = (advancedCount ?? 0) > 0;
        if (hasAdvanced) {
            const reason = `No se puede modificar ni eliminar dimensiones de "${phaseData.name ?? 'esta fase'}" porque existen lotes en progreso (estado distinto a "${initialState}").`;
            return { success: true, data: { allowed: false, reason } };
        }

        return { success: true, data: { allowed: true } };
    } catch (error) {
        console.error(`❌ [${opId}] Excepción en canModifyDimensionsForPhase:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}

export interface CreateBatchesPayload {
	projectId: string;
    batchSize: number;
	selectedMemberIds: string[];
	batchNamePrefix?: string;
}

export interface CreateBatchesResult {
	createdBatchesCount: number;
	totalItemsCreated: number;
}

// ========================================================================
//	HELPERS (Funciones de Apoyo Internas)
// ========================================================================

async function verificarPermiso(supabase: SupabaseClient, projectId: string): Promise<ResultadoOperacion<string>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado." };

    const { data: tienePermiso } = await supabase.rpc("has_permission_in_project", {
        p_user_id: user.id,
        p_project_id: projectId,
        p_permission_column: PERMISO_CREAR_LOTES,
    });

    if (!tienePermiso) return { success: false, error: "No tienes permiso para gestionar lotes." };
    return { success: true, data: user.id };
}

function segmentArticles(totalItems: number, batchSize: number): number[] {
    if (totalItems === 0 || batchSize <= 0) return [];
    const numBatches = Math.ceil(totalItems / batchSize);
    const baseSize = Math.floor(totalItems / numBatches);
    const remainder = totalItems % numBatches;
    return Array.from({ length: numBatches }, (_, i) => baseSize + (i < remainder ? 1 : 0));
}

// ========================================================================
//	ACCIÓN 1: OBTENER ESTADO DEL PROCESO DE LOTEO (La "Gateway")
// ========================================================================
export async function getBatchingStatusForActivePhase(
    projectId: string
): Promise<ResultadoOperacion<BatchingStatus>> {
    const opId = `GBS-${Math.floor(Math.random() * 10000)}`;
    console.log(`[${opId}] Iniciando getBatchingStatus para proyecto: ${projectId}`);
    
    try {
        const supabase = await createSupabaseServerClient();
        const activePhaseResult = await getActivePhaseForProject(projectId);
        
        if (!activePhaseResult.data) {
            return { success: true, data: { status: 'NO_ACTIVE_PHASE' } };
        }
        const activePhase = activePhaseResult.data;

        // CORRECCIÓN: Usar conteo más preciso para evitar limitaciones de Supabase
        // Intentar primero el conteo rápido, pero si falla o parece limitado, usar conteo manual
        let universeSize = 0;
        
        const { count: quickCount, error: quickCountError } = await supabase
            .from('phase_eligible_articles')
            .select('*', { count: 'exact', head: true })
            .eq('phase_id', activePhase.id);
        
        if (quickCountError) {
            console.warn(`[${opId}] Error en conteo rápido, usando conteo manual:`, quickCountError.message);
        }
        
        // Si el conteo rápido da exactamente 1000, es sospechoso de limitación
        if (quickCount && quickCount < 1000) {
            universeSize = quickCount;
            console.log(`[${opId}] Conteo rápido exitoso: ${universeSize} artículos`);
        } else {
            // Hacer conteo manual con paginación para obtener el total real
            console.log(`[${opId}] Conteo rápido sospechoso (${quickCount}), realizando conteo manual...`);
            let totalCount = 0;
            let page = 0;
            const pageSize = 1000;
            
            while (true) {
                const { data, error } = await supabase
                    .from('phase_eligible_articles')
                    .select('id')
                    .eq('phase_id', activePhase.id)
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) {
                    console.error(`[${opId}] Error en conteo manual:`, error.message);
                    return { success: false, error: "Error al contar el universo de la fase." };
                }
                
                if (!data || data.length === 0) break;
                
                totalCount += data.length;
                page++;
                
                if (data.length < pageSize) break; // Última página
            }
            
            universeSize = totalCount;
            console.log(`[${opId}] Conteo manual completado: ${universeSize} artículos (${page} páginas)`);
        }

        if (universeSize === 0) {
            return { success: true, data: { status: 'UNIVERSE_NOT_DEFINED', activePhase: { id: activePhase.id, phase_number: activePhase.phase_number } } };
        }

        const { count: batchCount, error: batchCountError } = await supabase
            .from('article_batches')
            .select('*', { count: 'exact', head: true })
            .eq('phase_id', activePhase.id);

        if (batchCountError) return { success: false, error: "Error al contar lotes existentes." };
        
        const existingBatches = batchCount ?? 0;

        if (existingBatches === 0) {
            return { success: true, data: { status: 'READY_FOR_BATCHING', activePhase: { id: activePhase.id, phase_number: activePhase.phase_number }, totalUniverseSize: universeSize, unbatchedArticleCount: universeSize } };
        } else {
            const initialState = activePhase.phase_number === 1 ? 'pending' : 'translated';
            const { count: advancedBatchesCount, error: advancedCheckError } = await supabase
                .from('article_batches')
                .select('*', { count: 'exact', head: true })
                .eq('phase_id', activePhase.id)
                .neq('status', initialState);

            if (advancedCheckError) return { success: false, error: "Error al verificar el estado de los lotes." };

            const canReset = ((advancedBatchesCount ?? 0) === 0);
            return { success: true, data: { status: 'BATCHES_CREATED', activePhase: { id: activePhase.id, phase_number: activePhase.phase_number }, totalUniverseSize: universeSize, unbatchedArticleCount: 0, canResetBatches: canReset } };
        }
    } catch (error) {
        console.error(`❌ [${opId}] Excepción:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}

// ========================================================================
//	ACCIÓN 2: VISUALIZAR LOTES CREADOS PARA UNA FASE
// ========================================================================
export async function getBatchesForPhaseDisplay(
    phaseId: string
): Promise<ResultadoOperacion<unknown[]>> {
    const opId = `GBFD-${Math.floor(Math.random() * 10000)}`;
    console.log(`[${opId}] Obteniendo lotes para fase: ${phaseId}`);

    try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.rpc('get_phase_batches_with_details', { p_phase_id: phaseId });

        if (error) {
            return { success: false, error: `Error al llamar a RPC: ${error.message}` };
        }
        
        // Mapear los datos para que coincidan con la interfaz esperada en el frontend
        interface BatchFromDB {
            id: string;
            batch_number: number;
            status: string;
            article_count: number;
            assigned_researcher_name: string;
            phase_name?: string;
        }
        
        const mappedData = (data || []).map((batch: unknown) => {
            const typedBatch = batch as BatchFromDB;
            return {
                id: typedBatch.id,
                batch_number: typedBatch.batch_number,
                status: typedBatch.status,
                // Mapear los nombres de campos de la DB a los esperados en el frontend
                total_items: typedBatch.article_count, // article_count -> total_items
                assigned_member_name: typedBatch.assigned_researcher_name, // assigned_researcher_name -> assigned_member_name
                phase_name: typedBatch.phase_name || null
            };
        });
        
        return { success: true, data: mappedData };
    } catch (error) {
        console.error(`❌ [${opId}] Excepción:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}

// ========================================================================
//	ACCIÓN 3: CREAR LOTES (REFACTORIZADA)
// ========================================================================
export async function createBatches(
    payload: CreateBatchesPayload
): Promise<ResultadoOperacion<CreateBatchesResult>> {
    const opId = `CB-${Math.floor(Math.random() * 10000)}`;
    const { projectId, batchSize, selectedMemberIds, batchNamePrefix } = payload;
    console.log(`[${opId}] Iniciando creación de lotes para proyecto: ${projectId}`);
    
    const supabase = await createSupabaseServerClient();
    
    try {
        const permissionCheck = await verificarPermiso(supabase, projectId);
        if (!permissionCheck.success) return permissionCheck;

        const activePhaseResult = await getActivePhaseForProject(projectId);
        if (!activePhaseResult.data) return { success: false, error: "No se encontró una fase activa." };
        const activePhase = activePhaseResult.data;

        // CAMBIO: Se llama a la acción del otro archivo, en lugar de a una RPC.
        const articleIdsResult = await listEligibleArticlesForPhase(activePhase.id);
        
        if (!articleIdsResult.success) {
            return { success: false, error: `No se pudieron obtener los artículos para lotear: ${articleIdsResult.error}` };
        }
        
        const availableArticles = articleIdsResult.data;
        if (availableArticles.length === 0) return { success: false, error: "No hay artículos disponibles para lotear." };
        
        // CORRECCIÓN: Extraer solo los IDs de los objetos artículo
        const availableArticleIds = availableArticles.map((article: unknown) => (article as { id: string }).id);
        console.log(`[${opId}] Artículos disponibles: ${availableArticles.length}, IDs extraídos: ${availableArticleIds.length}`);
        
        const articlesPerBatchArray = segmentArticles(availableArticleIds.length, batchSize);
        const numBatches = articlesPerBatchArray.length;
        
        const { data: maxBatchNumData } = await supabase.from("article_batches").select("batch_number").eq("project_id", projectId).order("batch_number", { ascending: false }).limit(1).single();
        const nextBatchNumber = (maxBatchNumData?.batch_number || 0) + 1;

        let totalItemsCreated = 0;
        let articlePoolIndex = 0;

        for (let i = 0; i < numBatches; i++) {
            const assignedMemberId = selectedMemberIds[i % selectedMemberIds.length];
            const assignedBatchNumber = nextBatchNumber + i;
            const batchName = batchNamePrefix ? `${batchNamePrefix} ${assignedBatchNumber}` : `Lote ${assignedBatchNumber}`;
            const initialState = activePhase.phase_number === 1 ? 'pending' : 'translated';

            const { data: newBatch, error: batchInsertError } = await supabase.from("article_batches").insert({
                project_id: projectId,
                phase_id: activePhase.id,
                batch_number: assignedBatchNumber,
                name: batchName,
                assigned_to: assignedMemberId,
                status: initialState,
            }).select("id").single();

            if (batchInsertError || !newBatch) return { success: false, error: `Error al crear el lote ${i+1}: ${batchInsertError?.message}` };

            const articleCountForThisBatch = articlesPerBatchArray[i];
            const itemsToInsert = availableArticleIds.slice(articlePoolIndex, articlePoolIndex + articleCountForThisBatch)
                .map((articleId: string) => ({
                    batch_id: newBatch.id,
                    article_id: articleId, // Ahora articleId es realmente un string UUID
                    status: 'unreviewed' as const
                }));
            
            console.log(`[${opId}] Lote ${assignedBatchNumber}: insertando ${itemsToInsert.length} artículos`);
            
            if (itemsToInsert.length > 0) {
                const { error: itemsInsertError } = await supabase.from('article_batch_items').insert(itemsToInsert);
                if (itemsInsertError) {
                    console.error(`[${opId}] Error insertando artículos en lote ${assignedBatchNumber}:`, itemsInsertError);
                    return { success: false, error: `Error al agregar artículos al lote ${assignedBatchNumber}: ${itemsInsertError.message}` };
                }
                totalItemsCreated += itemsToInsert.length;
            }
            articlePoolIndex += articleCountForThisBatch;
        }

        return { success: true, data: { createdBatchesCount: numBatches, totalItemsCreated } };

    } catch (error) {
        console.error(`❌ [${opId}] Excepción:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}

// ========================================================================
//	ACCIÓN 4: RESETEAR LOTES PARA UNA FASE
// ========================================================================
export async function resetBatchesForPhase(
    phaseId: string,
    projectId: string
): Promise<ResultadoOperacion<{ deletedBatches: number; deletedItems: number; }>> {
    const opId = `RBP-${Math.floor(Math.random() * 10000)}`;
    console.log(`[${opId}] Iniciando reseteo para fase: ${phaseId}`);

    try {
        const supabase = await createSupabaseServerClient();
        const permissionCheck = await verificarPermiso(supabase, projectId);
        if (!permissionCheck.success) return permissionCheck;
        
        const { data: phaseData, error: phaseError } = await supabase.from('preclassification_phases').select('phase_number').eq('id', phaseId).single();
        if (phaseError || !phaseData) return { success: false, error: "Fase no encontrada." };

        const initialState = phaseData.phase_number === 1 ? 'pending' : 'translated';
        
        const { count: advancedCount, error: checkError } = await supabase.from('article_batches').select('*', { count: 'exact', head: true }).eq('phase_id', phaseId).neq('status', initialState);

        if (checkError) return { success: false, error: "Error al verificar estado de lotes." };
        if (advancedCount && advancedCount > 0) {
            return { success: false, error: `No se puede resetear, ${advancedCount} lote(s) ya están en progreso.` };
        }

        const { data: batchIdsData, error: idsError } = await supabase.from('article_batches').select('id').eq('phase_id', phaseId);
        if (idsError) return { success: false, error: "Error obteniendo IDs de lotes." };

        const batchIdsToDelete = batchIdsData.map(b => b.id);
        if (batchIdsToDelete.length === 0) return { success: true, data: { deletedBatches: 0, deletedItems: 0 } };

        const { count: deletedItems, error: itemsError } = await supabase.from('article_batch_items').delete().in('batch_id', batchIdsToDelete);
        if (itemsError) return { success: false, error: "Error al eliminar items de lotes." };

        const { count: deletedBatches, error: batchesError } = await supabase.from('article_batches').delete().in('id', batchIdsToDelete);
        if (batchesError) return { success: false, error: "Error al eliminar lotes." };

        return { success: true, data: { deletedBatches: deletedBatches || 0, deletedItems: deletedItems || 0 } };

    } catch (error) {
        console.error(`❌ [${opId}] Excepción:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}