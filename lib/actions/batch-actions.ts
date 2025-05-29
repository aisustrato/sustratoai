// lib/actions/batch-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server"; 
import type { 
    Database,
    BatchStatusEnum, 
    BatchItemStatusEnum 
} from "@/lib/database.types"; 

// ========================================================================
//  INTERFACES Y TIPOS COMUNES
// ========================================================================
export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

const PERMISO_CREAR_LOTES = "can_create_batches";
const PERMISO_GESTIONAR_LOTES_PARA_BORRADO = "can_create_batches"; 

export interface SimulateBatchesPayload {
  projectId: string;
  mode: 'size' | 'batches'; 
  value: number;           
  selectedMemberIds: string[]; 
}

export interface BatchSimulationDetails {
  batchNumberObjective: number; 
  articleCount: number;       
  assignedToMemberId?: string; 
}

export interface SimulateBatchesResult {
  distribution: BatchSimulationDetails[];
  totalBatchesCalculated: number;
  totalEligibleArticles: number;
  articlesPerMember?: Record<string, number>; 
}

export interface CreateBatchesPayload {
  projectId: string;
  simulationParams: {
    mode: 'size' | 'batches';
    value: number; 
    selectedMemberIds: string[];
  };
  batchNamePrefix?: string; 
}

export interface CreateBatchesResult {
  createdBatchesCount: number;
  totalItemsCreated: number; 
  batchIds: string[];        
}

export interface ResetBatchesPayload {
  projectId: string;
}

export interface ResetBatchesResult {
  deletedBatchesCount: number;
  deletedItemsCount: number;
  message: string;
}

interface GetProjectBatchesPayload {
  projectId: string;
}

export interface BatchForDisplay { 
  id: string; 
  batch_number: number; 
  name: string | null; 
  status: string; 
  assigned_to_member_name: string | null; 
  article_count: number; 
}

export interface GetProjectBatchesData {
    lotes: BatchForDisplay[];
    canResetAll: boolean; 
    totalLotes: number;
    totalLotesPending: number;
}

// ========================================================================
//  HELPER: FUNCIÓN DE SEGMENTACIÓN
// ========================================================================
function segmentArticles( 
  totalItems: number,
  mode: 'batches' | 'size',
  value: number
): { numBatches: number; articlesPerBatchArray: number[] } {
  if (totalItems === 0 || value <= 0) return { numBatches: 0, articlesPerBatchArray: [] };
  let numBatches = mode === 'batches' ? Math.min(value, totalItems) : Math.ceil(totalItems / value);
  if (numBatches === 0 && totalItems > 0) numBatches = 1;
  if (numBatches === 0) return { numBatches: 0, articlesPerBatchArray: [] };
  
  const baseSize = Math.floor(totalItems / numBatches);
  const remainder = totalItems % numBatches;
  return { 
    numBatches, 
    articlesPerBatchArray: Array.from({ length: numBatches }, (_, i) => baseSize + (i < remainder ? 1 : 0))
  };
}

// ========================================================================
//  HELPER: VERIFICAR PERMISO
// ========================================================================
async function verificarPermisoBatchActions( 
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  projectId: string,
  permission: string = PERMISO_CREAR_LOTES 
): Promise<boolean> {
  const { data: tienePermiso, error: rpcError } = await supabase.rpc(
    "has_permission_in_project", 
    {
      p_user_id: userId,
      p_project_id: projectId,
      p_permission_column: permission,
    }
  );
  if (rpcError) {
    console.error(`[AUTH_CHECK_ERROR] RPC has_permission_in_project (${permission}):`, rpcError.message);
    return false;
  }
  return tienePermiso === true;
}

// ========================================================================
//  ACCIÓN 1: SIMULATE BATCHES (Usa COUNT de la vista)
// ========================================================================
export async function simulateBatches( 
  payload: SimulateBatchesPayload
): Promise<ResultadoOperacion<SimulateBatchesResult>> {
  const opId = `SIM-BATCH-${Math.floor(Math.random() * 10000)}`; 
  const { projectId, mode, value, selectedMemberIds } = payload;

  console.log(`🧪 [${opId}] Iniciando simulateBatches (Vista, Asig.Bloques) para proyecto: ${projectId}`);

  const MIN_BATCH_SIZE = 10;
  const MAX_BATCH_SIZE = 60;

  if (!projectId || value <= 0 ) {
    return { success: false, error: "Payload inválido (projectId o value).", errorCode: "INVALID_PAYLOAD_BASIC" };
  }
  if (mode === 'size' && (value < MIN_BATCH_SIZE || value > MAX_BATCH_SIZE)) {
    return { 
        success: false, 
        error: `El tamaño del lote debe estar entre ${MIN_BATCH_SIZE} y ${MAX_BATCH_SIZE}.`, 
        errorCode: "INVALID_BATCH_SIZE_RANGE" 
    };
  }
  if (!selectedMemberIds || !Array.isArray(selectedMemberIds) || selectedMemberIds.length === 0) {
    return { success: false, error: "Payload inválido: Se requiere al menos un miembro seleccionado.", errorCode: "INVALID_PAYLOAD_MEMBERS" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }

    const tienePermiso = await verificarPermisoBatchActions(supabase, currentUser.id, projectId);
    if (!tienePermiso) {
        return { success: false, error: "No tienes permiso para simular/crear lotes en este proyecto.", errorCode: "FORBIDDEN_SIMULATE" };
    }

    const { count: totalEligibleArticles, error: countError } = await supabase
      .from('eligible_articles_for_batching_view') 
      .select('*', { count: 'exact', head: true })   
      .eq('project_id', projectId);                   

    if (countError) {
      console.error(`❌ [${opId}] Error contando desde la VISTA:`, JSON.stringify(countError, null, 2));
      return { success: false, error: `Error al contar artículos desde la vista (${countError.message})`, errorCode: "DB_VIEW_COUNT_ERROR" };
    }
    
    if (totalEligibleArticles === null) {
      console.error(`❌ [${opId}] El conteo desde la VISTA retornó NULL.`);
      return { success: false, error: "El conteo de artículos (vista) retornó NULL.", errorCode: "DB_VIEW_COUNT_NULL" };
    }
    console.log(`[${opId}] Artículos elegibles encontrados (desde Vista para SIMULACIÓN): ${totalEligibleArticles}`);
    
    if (totalEligibleArticles === 0) {
      return { 
        success: true, 
        data: { distribution: [], totalBatchesCalculated: 0, totalEligibleArticles: 0, articlesPerMember: {} } 
      };
    }
    
    const { numBatches, articlesPerBatchArray } = segmentArticles(totalEligibleArticles, mode, value);

    if (numBatches > 2000) { 
      return { success: false, error: "La simulación excede el máximo de 2000 lotes (Vista).", errorCode: "TOO_MANY_BATCHES_VIEW" };
    }

    const distribution: BatchSimulationDetails[] = [];
    const articlesPerMemberCounter: Record<string, number> = {};
    selectedMemberIds.forEach(id => articlesPerMemberCounter[id] = 0);

    const numSelectedMembers = selectedMemberIds.length;
    const baseBatchesPerMember = Math.floor(numBatches / numSelectedMembers);
    const remainingBatchesExtra = numBatches % numSelectedMembers; 
    let currentMemberArrIndex = 0; 
    let batchesAssignedToThisMemberBlock = 0; 
    let targetBatchesForThisMemberBlock = baseBatchesPerMember + (currentMemberArrIndex < remainingBatchesExtra ? 1 : 0);

    for (let i = 0; i < numBatches; i++) {
      if (batchesAssignedToThisMemberBlock >= targetBatchesForThisMemberBlock && currentMemberArrIndex < numSelectedMembers - 1) {
        currentMemberArrIndex++; batchesAssignedToThisMemberBlock = 0;
        targetBatchesForThisMemberBlock = baseBatchesPerMember + (currentMemberArrIndex < remainingBatchesExtra ? 1 : 0);
      }
      const assignedMemberId = selectedMemberIds[currentMemberArrIndex];
      const articleCountForThisBatch = articlesPerBatchArray[i];
      distribution.push({
        batchNumberObjective: i + 1, articleCount: articleCountForThisBatch, assignedToMemberId: assignedMemberId,
      });
      if (assignedMemberId) {
        articlesPerMemberCounter[assignedMemberId] = (articlesPerMemberCounter[assignedMemberId] || 0) + articleCountForThisBatch;
      }
      batchesAssignedToThisMemberBlock++;
    }
    
    console.log(`🎉 [${opId}] Simulación (Vista, Asig. Bloques) completada. ${distribution.length} lotes.`);
    return {
      success: true,
      data: { distribution, totalBatchesCalculated: numBatches, totalEligibleArticles, articlesPerMember: articlesPerMemberCounter },
    };

  } catch (error) {
    console.error(`❌ [${opId}] Excepción en simulateBatches:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR_SIM" };
  }
}

// ========================================================================
//  ACCIÓN 2: CREATE BATCHES (Usa obtención de IDs en CHUNKS desde la vista)
// ========================================================================
export async function createBatches(
  payload: CreateBatchesPayload
): Promise<ResultadoOperacion<CreateBatchesResult>> {
  const opId = `CREATE-BATCH-CHUNK-${Math.floor(Math.random() * 10000)}`; 
  const { projectId, simulationParams, batchNamePrefix } = payload;
  const { mode, value, selectedMemberIds } = simulationParams;

  console.log(`🚀 [${opId}] Iniciando createBatches (CHUNKED) para proyecto: ${projectId}`);

  const MIN_BATCH_SIZE = 10;
  const MAX_BATCH_SIZE = 60;
  if (!projectId || value <= 0 ) {
    return { success: false, error: "Payload inválido (projectId o value).", errorCode: "INVALID_PAYLOAD_BASIC_CREATE" };
  }
  if (mode === 'size' && (value < MIN_BATCH_SIZE || value > MAX_BATCH_SIZE)) {
    return { success: false, error: `El tamaño del lote debe estar entre ${MIN_BATCH_SIZE} y ${MAX_BATCH_SIZE}.`, errorCode: "INVALID_BATCH_SIZE_RANGE_CREATE" };
  }
  if (!selectedMemberIds || !Array.isArray(selectedMemberIds) || selectedMemberIds.length === 0) {
    return { success: false, error: "Payload inválido: Se requiere al menos un miembro seleccionado.", errorCode: "INVALID_PAYLOAD_MEMBERS_CREATE" };
  }

  const supabase = await createSupabaseServerClient(); 

  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED_CREATE" };
    }
    const tienePermiso = await verificarPermisoBatchActions(supabase, currentUser.id, projectId);
    if (!tienePermiso) {
        return { success: false, error: "No tienes permiso para crear lotes en este proyecto.", errorCode: "FORBIDDEN_CREATE" };
    }

    console.log(`[${opId}] Obteniendo TODOS los IDs de artículos elegibles desde la VISTA (en chunks)...`);
    const allEligibleArticleIds: string[] = [];
    const CHUNK_SIZE = 500; 
    let currentOffset = 0; 
    let moreDataAvailable = true;

    while (moreDataAvailable) {
      const { data: chunkData, error: chunkError } = await supabase
        .from('eligible_articles_for_batching_view')
        .select('article_id')
        .eq('project_id', projectId)
        .order('article_id', { ascending: true }) 
        .range(currentOffset, currentOffset + CHUNK_SIZE - 1);

      if (chunkError) {
        console.error(`❌ [${opId}] Error obteniendo chunk de IDs elegibles:`, JSON.stringify(chunkError, null, 2));
        return { success: false, error: `Error al obtener IDs elegibles (chunk ${currentOffset}): ${chunkError.message}`, errorCode: "DB_VIEW_FETCH_CHUNK_ERROR" };
      }

      if (chunkData && chunkData.length > 0) {
        const idsInChunk = chunkData.map(a => a.article_id).filter(id => id !== null) as string[];
        allEligibleArticleIds.push(...idsInChunk);
        currentOffset += idsInChunk.length; 
        if (idsInChunk.length < CHUNK_SIZE) moreDataAvailable = false; 
      } else {
        moreDataAvailable = false; 
      }
      console.log(`[${opId}]   Chunk fetched. Total IDs acumulados: ${allEligibleArticleIds.length}`);
    }
    
    const availableArticleIds = allEligibleArticleIds; 
    const totalEligibleArticles = availableArticleIds.length;
    console.log(`[${opId}] IDs de artículos elegibles TOTALES obtenidos para CREACIÓN: ${totalEligibleArticles}`);
    
    if (totalEligibleArticles === 0) {
      return { success: false, error: "No hay artículos elegibles para lotear.", errorCode: "NO_ELIGIBLE_ARTICLES_CREATE_FINAL" };
    }
    
    const { numBatches, articlesPerBatchArray } = segmentArticles(totalEligibleArticles, mode, value);
    if (numBatches === 0) {
        return { success: false, error: "No se pueden crear 0 lotes.", errorCode: "ZERO_BATCHES_TO_CREATE" };
    }
    if (numBatches > 2000) { 
      return { success: false, error: "La creación excede el máximo de 2000 lotes.", errorCode: "TOO_MANY_BATCHES_CREATE" };
    }

    const createdBatchIds: string[] = [];
    let totalItemsAssignedToBatches = 0;
    let currentArticlePoolIndex = 0; 

    const { data: maxBatchNumData, error: maxBatchNumError } = await supabase
        .from('article_batches').select('batch_number').eq('project_id', projectId)
        .order('batch_number', { ascending: false }).limit(1).maybeSingle(); 
    if (maxBatchNumError && maxBatchNumError.code !== 'PGRST116') {
      console.error(`❌ [${opId}] Error obteniendo max batch_number:`, maxBatchNumError);
      return { success: false, error: `Error determinando número de lote: ${maxBatchNumError.message}`, errorCode: "DB_MAX_BATCH_NUM_ERROR"};
    }
    let nextBatchNumber = (maxBatchNumData?.batch_number || 0) + 1;

    const numSelectedMembers = selectedMemberIds.length;
    const baseBatchesPerMember = Math.floor(numBatches / numSelectedMembers);
    const remainingBatchesExtra = numBatches % numSelectedMembers;
    let currentMemberArrIndex = 0;
    let batchesAssignedToThisMemberBlock = 0;
    let targetBatchesForThisMemberBlock = baseBatchesPerMember + (currentMemberArrIndex < remainingBatchesExtra ? 1 : 0);

    for (let i = 0; i < numBatches; i++) {
      const assignedBatchNumber = nextBatchNumber + i;
      if (batchesAssignedToThisMemberBlock >= targetBatchesForThisMemberBlock && currentMemberArrIndex < numSelectedMembers - 1) {
        currentMemberArrIndex++; batchesAssignedToThisMemberBlock = 0;
        targetBatchesForThisMemberBlock = baseBatchesPerMember + (currentMemberArrIndex < remainingBatchesExtra ? 1 : 0);
      }
      const assignedMemberId = selectedMemberIds[currentMemberArrIndex];
      const articleCountForThisBatch = articlesPerBatchArray[i];
      const batchName = batchNamePrefix ? `${batchNamePrefix}${assignedBatchNumber}` : `Lote ${assignedBatchNumber} (${projectId.substring(0,4)}...)`;
      
      const { data: newBatch, error: batchInsertError } = await supabase
        .from('article_batches').insert({
          project_id: projectId, batch_number: assignedBatchNumber, name: batchName,
          assigned_to: assignedMemberId, status: 'pending' as BatchStatusEnum, 
        }).select('id').single();

      if (batchInsertError || !newBatch) {
        console.error(`❌ [${opId}] Error insertando en article_batches:`, batchInsertError);
        return { success: false, error: `Error al crear el lote ${assignedBatchNumber}: ${batchInsertError?.message || 'No se retornó ID.'}`, errorCode: "DB_BATCH_INSERT_ERROR"};
      }
      createdBatchIds.push(newBatch.id);

      const itemsToInsert: Database['public']['Tables']['article_batch_items']['Insert'][] = [];
      const articlesForThisBatch = availableArticleIds.slice(currentArticlePoolIndex, currentArticlePoolIndex + articleCountForThisBatch);
      for (const articleId of articlesForThisBatch) {
        if (!articleId) { console.warn(`[${opId}] articleId nulo/undefined saltado.`); continue; }
        itemsToInsert.push({ batch_id: newBatch.id, article_id: articleId, status: 'unreviewed' as BatchItemStatusEnum });
      }

      if (itemsToInsert.length > 0) {
        const { error: itemsInsertError } = await supabase.from('article_batch_items').insert(itemsToInsert);
        if (itemsInsertError) {
          console.error(`❌ [${opId}] Error insertando items para batch ${newBatch.id}:`, itemsInsertError);
          return { success: false, error: `Error al agregar artículos al lote ${assignedBatchNumber}: ${itemsInsertError.message}`, errorCode: "DB_BATCH_ITEMS_INSERT_ERROR"};
        }
        totalItemsAssignedToBatches += itemsToInsert.length; 
      }
      currentArticlePoolIndex += articleCountForThisBatch;
      batchesAssignedToThisMemberBlock++;
    }
    
    console.log(`✅ [${opId}] Creación de lotes completada. Lotes creados: ${createdBatchIds.length}, Items totales: ${totalItemsAssignedToBatches}`);
    return { success: true, data: { createdBatchesCount: createdBatchIds.length, totalItemsCreated: totalItemsAssignedToBatches, batchIds: createdBatchIds, } };

  } catch (error) {
    console.error(`❌ [${opId}] Excepción en createBatches:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR_CREATE" };
  }
}

// ========================================================================
//  ACCIÓN 3: RESET PROJECT BATCHES
// ========================================================================
export async function resetProjectBatchesIfNotInitialized(
  payload: ResetBatchesPayload
): Promise<ResultadoOperacion<ResetBatchesResult>> {
  const opId = `RESET-BATCHES-${Math.floor(Math.random() * 10000)}`;
  const { projectId } = payload;

  console.log(`🗑️ [${opId}] Iniciando resetProjectBatches para proyecto: ${projectId}`);

  if (!projectId) {
    return { success: false, error: "Se requiere un ID de proyecto.", errorCode: "INVALID_PROJECT_ID_RESET" };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED_RESET" };
    }
    const tienePermiso = await verificarPermisoBatchActions(supabase, currentUser.id, projectId, PERMISO_GESTIONAR_LOTES_PARA_BORRADO);
    if (!tienePermiso) {
        return { success: false, error: "No tienes permiso para eliminar/resetear lotes en este proyecto.", errorCode: "FORBIDDEN_RESET" };
    }

    const { count: initializedBatchesCount, error: checkError } = await supabase
      .from('article_batches').select('*', { count: 'exact', head: true })
      .eq('project_id', projectId).neq('status', 'pending' as BatchStatusEnum); 

    if (checkError) {
      return { success: false, error: `Error al verificar estado de los lotes: ${checkError.message}`, errorCode: "DB_CHECK_INIT_ERROR" };
    }
    if (initializedBatchesCount === null) {
      return { success: false, error: "No se pudo determinar el estado de los lotes.", errorCode: "DB_CHECK_INIT_NULL" };
    }
    if (initializedBatchesCount > 0) {
      return { success: false, error: `No se pueden eliminar los lotes porque ${initializedBatchesCount} lote(s) ya han sido inicializados.`, errorCode: "BATCHES_ALREADY_INITIALIZED" };
    }

    const { data: pendingBatchIdsData, error: idsError } = await supabase
        .from('article_batches').select('id').eq('project_id', projectId).eq('status', 'pending' as BatchStatusEnum);
    if (idsError || !pendingBatchIdsData) {
        return { success: false, error: "Error preparando borrado (obteniendo IDs).", errorCode: "DB_FETCH_PENDING_IDS_ERROR" };
    }
    if (pendingBatchIdsData.length === 0) {
        return { success: true, data: { deletedBatchesCount: 0, deletedItemsCount: 0, message: "No había lotes pendientes para eliminar." } };
    }
    const batchIdsToDelete = pendingBatchIdsData.map(b => b.id);

    let deletedItemsCount = 0;
    const { count: itemsDeleted, error: deleteItemsError } = await supabase
        .from('article_batch_items').delete({ count: 'exact' }).in('batch_id', batchIdsToDelete);
    if (deleteItemsError) {
        return { success: false, error: `Error al eliminar artículos de los lotes: ${deleteItemsError.message}`, errorCode: "DB_DELETE_ITEMS_ERROR" };
    }
    deletedItemsCount = itemsDeleted || 0;

    const { count: batchesDeleted, error: deleteBatchesError } = await supabase
      .from('article_batches').delete({ count: 'exact' })
      .eq('project_id', projectId).eq('status', 'pending' as BatchStatusEnum);
    if (deleteBatchesError) {
      return { success: false, error: `Error al eliminar los lotes maestros: ${deleteBatchesError.message}`, errorCode: "DB_DELETE_BATCHES_ERROR" };
    }
    const actualBatchesDeleted = batchesDeleted || 0;
    
    console.log(`✅ [${opId}] Reseteo de lotes completado. Lotes eliminados: ${actualBatchesDeleted}, Items eliminados: ${deletedItemsCount}`);
    return { success: true, data: { deletedBatchesCount: actualBatchesDeleted, deletedItemsCount: deletedItemsCount, message: `${actualBatchesDeleted} lote(s) y ${deletedItemsCount} artículo(s) asignados fueron eliminados.` } };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción en resetProjectBatches:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR_RESET" };
  }
}

// ========================================================================
//  ACCIÓN 4: GET PROJECT BATCHES FOR DISPLAY (Usa RPC)
// ========================================================================
export async function getProjectBatchesForDisplay(
  payload: GetProjectBatchesPayload
): Promise<ResultadoOperacion<GetProjectBatchesData>> {
  const { projectId } = payload;
  const opId = `GET-PROJ-BATCHES-RPC-${Math.floor(Math.random() * 10000)}`;
  console.log(`[${opId}] Iniciando getProjectBatchesForDisplay (RPC) para proyecto: ${projectId}`);

  if (!projectId) {
    return { success: false, error: "Se requiere ID de proyecto.", errorCode: "INVALID_PROJECT_ID_GPB_RPC" };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_project_batches_with_assignee_names', { p_project_id: projectId });

    if (rpcError) {
      console.error(`❌ [${opId}] Error en RPC 'get_project_batches_with_assignee_names':`, JSON.stringify(rpcError, null, 2));
      return { success: false, error: `Error al cargar lotes (RPC): ${rpcError.message}`, errorCode: "DB_RPC_ERROR_GPB" };
    }
    if (!rpcData) {
        return { success: true, data: { lotes: [], canResetAll: false, totalLotes: 0, totalLotesPending: 0, } };
    }
    
    const lotesTransformados: BatchForDisplay[] = rpcData.map((lote: any) => ({
      id: lote.id, batch_number: lote.batch_number, name: lote.name, status: lote.status, 
      assigned_to_member_name: lote.assigned_to_member_name,
      article_count: Number(lote.article_count) 
    }));
    
    let canResetAll = false;
    if (lotesTransformados.length > 0) {
        canResetAll = lotesTransformados.every(lote => lote.status === 'pending');
    }

    console.log(`[${opId}] Lotes obtenidos (RPC): ${lotesTransformados.length}, Puede resetear todo: ${canResetAll}`);
    return {
      success: true,
      data: {
        lotes: lotesTransformados, canResetAll: canResetAll, totalLotes: lotesTransformados.length,
        totalLotesPending: lotesTransformados.filter(l => l.status === 'pending').length,
      }
    };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción en getProjectBatchesForDisplay (RPC):`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_ERROR_GPB_RPC" };
  }
}