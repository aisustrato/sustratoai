// lib/actions/dimension-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { BatchStatusEnum, Database } from "@/lib/database.types";

// ========================================================================
//  TYPE ALIASES FROM DATABASE SCHEMA
// ========================================================================
export type PreclassDimensionRow = Database["public"]["Tables"]["preclass_dimensions"]["Row"];
type PreclassDimensionInsert = Database["public"]["Tables"]["preclass_dimensions"]["Insert"];
type PreclassDimensionUpdate = Database["public"]["Tables"]["preclass_dimensions"]["Update"];

type PreclassDimensionOptionRow = Database["public"]["Tables"]["preclass_dimension_options"]["Row"];
type PreclassDimensionOptionInsert = Database["public"]["Tables"]["preclass_dimension_options"]["Insert"];
type PreclassDimensionOptionUpdate = Database["public"]["Tables"]["preclass_dimension_options"]["Update"];

type PreclassDimensionQuestionRow = Database["public"]["Tables"]["preclass_dimension_questions"]["Row"];
type PreclassDimensionQuestionInsert = Database["public"]["Tables"]["preclass_dimension_questions"]["Insert"];
type PreclassDimensionQuestionUpdate = Database["public"]["Tables"]["preclass_dimension_questions"]["Update"];

type PreclassDimensionExampleRow = Database["public"]["Tables"]["preclass_dimension_examples"]["Row"];
type PreclassDimensionExampleInsert = Database["public"]["Tables"]["preclass_dimension_examples"]["Insert"];
type PreclassDimensionExampleUpdate = Database["public"]["Tables"]["preclass_dimension_examples"]["Update"];

// ========================================================================
//  CUSTOM INTERFACES FOR ACTION PAYLOADS AND RETURN TYPES
// ========================================================================
export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

const PERMISO_GESTIONAR_DIMENSIONES = "can_manage_master_data";

export interface DimensionOptionData {
  id?: string; 
  value: string;
  ordering: number;
}
export interface DimensionQuestionData {
  id?: string;
  question: string;
  ordering: number;
}
export interface DimensionExampleData {
  id?: string;
  example: string; // 'example' es string, no opcional aquí, porque viene del form validado
}

export interface FullDimension extends PreclassDimensionRow {
  options: PreclassDimensionOptionRow[];
  questions: PreclassDimensionQuestionRow[];
  examples: PreclassDimensionExampleRow[];
}

export interface CreateDimensionPayload {
  projectId: string;
  name: string;
  type: 'finite' | 'open';
  description?: string | null;
  ordering: number; 
  options?: DimensionOptionData[];
  questions?: DimensionQuestionData[];
  examples?: DimensionExampleData[];
}

export interface UpdateDimensionPayload {
  dimensionId: string;
  projectId: string;
  name?: string;
  // El tipo no se actualiza: type?: 'finite' | 'open'; 
  description?: string | null;
  ordering?: number;
  options?: DimensionOptionData[];
  questions?: DimensionQuestionData[];
  examples?: DimensionExampleData[];
}

export interface DeleteDimensionPayload {
  dimensionId: string;
  projectId: string;
}

export interface ReorderDimensionsPayload {
  projectId: string;
  orderedDimensionIds: string[];
}


// ========================================================================
//  INTERNAL HELPER FUNCTION: VERIFY PERMISSION
// ========================================================================
async function verificarPermisoGestionDimensiones(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data: tienePermiso, error: rpcError } = await supabase.rpc(
    "has_permission_in_project",
    {
      p_user_id: userId,
      p_project_id: projectId,
      p_permission_column: PERMISO_GESTIONAR_DIMENSIONES,
    }
  );
  if (rpcError) {
    console.error(`[AUTH_CHECK_ERROR] RPC has_permission_in_project (dimensiones): ${rpcError.message}`);
    return false;
  }
  return tienePermiso === true;
}

// ========================================================================
//  ACTION 1: LISTAR DIMENSIONES
// ========================================================================
export async function listDimensions(
  projectId: string
): Promise<ResultadoOperacion<FullDimension[]>> {
  const opId = `LDIM-${Math.floor(Math.random() * 10000)}`;
  console.log(`📄 [${opId}] Iniciando listDimensions para proyecto: ${projectId}`);
  if (!projectId) return { success: false, error: "Se requiere un ID de proyecto válido." };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: dimensionsDataFromDb, error: dimensionsError } = await supabase
      .from("preclass_dimensions")
      .select(`*, preclass_dimension_options (*), preclass_dimension_questions (*), preclass_dimension_examples (*)`)
      .eq("project_id", projectId)
      .order("ordering", { ascending: true });

    if (dimensionsError) {
      console.error(`❌ [${opId}] Error al obtener dimensiones:`, dimensionsError);
      return { success: false, error: `Error al obtener dimensiones: ${dimensionsError.message}` };
    }
    if (!dimensionsDataFromDb) return { success: true, data: [] };

    const fullDimensions: FullDimension[] = dimensionsDataFromDb.map(dim => {
      const typedDim = dim as PreclassDimensionRow & { // Ayuda a TypeScript a entender la estructura anidada
        preclass_dimension_options: PreclassDimensionOptionRow[] | null;
        preclass_dimension_questions: PreclassDimensionQuestionRow[] | null;
        preclass_dimension_examples: PreclassDimensionExampleRow[] | null;
      };
      return { // Construir explícitamente el objeto FullDimension
        id: typedDim.id, project_id: typedDim.project_id, name: typedDim.name, type: typedDim.type,
        description: typedDim.description, ordering: typedDim.ordering, created_at: typedDim.created_at, updated_at: typedDim.updated_at,
        options: (typedDim.preclass_dimension_options || []).sort((a, b) => a.ordering - b.ordering),
        questions: (typedDim.preclass_dimension_questions || []).sort((a, b) => a.ordering - b.ordering),
        examples: (typedDim.preclass_dimension_examples || []), // Asumiendo que examples no tienen 'ordering' o no es crítico aquí
      };
    });
    console.log(`🎉 [${opId}] ÉXITO: ${fullDimensions.length} dimensiones obtenidas.`);
    return { success: true, data: fullDimensions };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción en listDimensions:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`};
  }
}

// ========================================================================
//  ACTION 2: CREAR UNA NUEVA DIMENSIÓN
// ========================================================================
export async function createDimension(
  payload: CreateDimensionPayload
): Promise<ResultadoOperacion<PreclassDimensionRow>> {
  const opId = `CDIM-${Math.floor(Math.random() * 10000)}`;
  console.log(`📄 [${opId}] Iniciando createDimension: ${payload.name} en proyecto ${payload.projectId}`);
  const { projectId, name, type, description, ordering, 
          options: payloadOptions, // Renombrar para claridad con los de la DB
          questions: payloadQuestions, 
          examples: payloadExamples 
        } = payload;

  if (!projectId || !name || !type) return { success: false, error: "Faltan datos requeridos (projectId, name, type).", errorCode: "MISSING_REQUIRED_FIELDS" };
  if (type === 'finite' && (!payloadOptions || payloadOptions.length === 0)) return { success: false, error: "Las dimensiones de tipo 'finite' deben tener al menos una opción.", errorCode: "FINITE_REQUIRES_OPTIONS" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) return { success: false, error: "No tienes permiso para crear dimensiones.", errorCode: "FORBIDDEN" };
    
    const { data: existingDimension, error: checkError } = await supabase.from("preclass_dimensions").select("id").eq("project_id", projectId).eq("name", name).maybeSingle();
    if (checkError) return { success: false, error: `Error al verificar dimensión: ${checkError.message}` };
    if (existingDimension) return { success: false, error: `Ya existe una dimensión con el nombre "${name}".`, errorCode: "DUPLICATE_DIMENSION_NAME" };

    const dimensionToInsert: PreclassDimensionInsert = {
      project_id: projectId, name, type, description: description || null, ordering,
    };
    const { data: nuevaDimension, error: insertDimensionError } = await supabase.from("preclass_dimensions").insert(dimensionToInsert).select().single();
    if (insertDimensionError || !nuevaDimension) return { success: false, error: `Error al crear la dimensión: ${insertDimensionError?.message || 'No data.'}` };
    console.log(`[${opId}] Dimensión principal creada ID: ${nuevaDimension.id}`);

    if (type === 'finite' && payloadOptions && payloadOptions.length > 0) {
      const optionsToInsert: PreclassDimensionOptionInsert[] = payloadOptions.map(opt => ({ dimension_id: nuevaDimension.id, value: opt.value, ordering: opt.ordering }));
      const { error: insertOptionsError } = await supabase.from("preclass_dimension_options").insert(optionsToInsert);
      if (insertOptionsError) return { success: false, error: `Error al guardar opciones: ${insertOptionsError.message}.`, errorCode: "PARTIAL_INSERT_OPTIONS" };
    }
    if (payloadQuestions && payloadQuestions.length > 0) {
      const questionsToInsert: PreclassDimensionQuestionInsert[] = payloadQuestions.map(q => ({ dimension_id: nuevaDimension.id, question: q.question, ordering: q.ordering }));
      const { error: insertQuestionsError } = await supabase.from("preclass_dimension_questions").insert(questionsToInsert);
      if (insertQuestionsError) return { success: false, error: `Error al guardar preguntas: ${insertQuestionsError.message}.`, errorCode: "PARTIAL_INSERT_QUESTIONS" };
    }
    if (payloadExamples && payloadExamples.length > 0) {
      const examplesToInsert: PreclassDimensionExampleInsert[] = payloadExamples.map(ex => ({ dimension_id: nuevaDimension.id, example: ex.example }));
      const { error: insertExamplesError } = await supabase.from("preclass_dimension_examples").insert(examplesToInsert);
      if (insertExamplesError) return { success: false, error: `Error al guardar ejemplos: ${insertExamplesError.message}.`, errorCode: "PARTIAL_INSERT_EXAMPLES" };
    }
    console.log(`🎉 [${opId}] ÉXITO: Dimensión creada ID: ${nuevaDimension.id}`);
    return { success: true, data: nuevaDimension };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción en createDimension:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
   }
}

// ========================================================================
//  ACTION 3: MODIFICAR UNA DIMENSIÓN
// ========================================================================
// lib/actions/dimension-actions.ts
// ... (imports, tipos, y otras funciones sin cambios) ...

// ========================================================================
//  ACTION 3: MODIFICAR UNA DIMENSIÓN
// ========================================================================
export async function updateDimension(
  payload: UpdateDimensionPayload
): Promise<ResultadoOperacion<PreclassDimensionRow>> {
  const opId = `UDIM-${Math.floor(Math.random() * 10000)}`;
  const { 
    dimensionId, projectId, name, description, ordering, 
    options: payloadOptions, 
    questions: payloadQuestions, 
    examples: payloadExamples 
  } = payload;

  console.log(`📄 [${opId}] Iniciando updateDimension para ID: ${dimensionId} en proyecto ${projectId}`);

  if (!dimensionId || !projectId) {
    return { success: false, error: "Faltan IDs requeridos (dimensionId, projectId).", errorCode: "MISSING_IDS" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) return { success: false, error: "No tienes permiso para modificar dimensiones.", errorCode: "FORBIDDEN" };
    
    const { data: currentDimensionData, error: fetchError } = await supabase
      .from("preclass_dimensions")
      .select("*, preclass_dimension_options(*), preclass_dimension_questions(*), preclass_dimension_examples(*)")
      .eq("id", dimensionId)
      .eq("project_id", projectId)
      .single();

    if (fetchError || !currentDimensionData) {
      return { success: false, error: `Dimensión no encontrada o error al obtenerla: ${fetchError?.message || 'No data'}.`, errorCode: "DIMENSION_NOT_FOUND" };
    }
    
    const currentDimensionTyped: FullDimension = {
        ...currentDimensionData,
        options: currentDimensionData.preclass_dimension_options || [],
        questions: currentDimensionData.preclass_dimension_questions || [],
        examples: currentDimensionData.preclass_dimension_examples || [],
    };

    if (name && name !== currentDimensionTyped.name) {
      const { data: existingName, error: nameCheckError } = await supabase
        .from("preclass_dimensions").select("id").eq("project_id", projectId).eq("name", name).neq("id", dimensionId).maybeSingle();
      if (nameCheckError) return { success: false, error: `Error verificando nombre: ${nameCheckError.message}`, errorCode: "DB_ERROR" };
      if (existingName) return { success: false, error: `Ya existe otra dimensión con el nombre "${name}".`, errorCode: "DUPLICATE_DIMENSION_NAME" };
    }
    
    const effectiveType = currentDimensionTyped.type;

    const dimensionUpdates: PreclassDimensionUpdate = {};
    if (name !== undefined && name !== currentDimensionTyped.name) dimensionUpdates.name = name;
    if (description !== undefined && description !== currentDimensionTyped.description) dimensionUpdates.description = description;
    if (ordering !== undefined && ordering !== currentDimensionTyped.ordering) dimensionUpdates.ordering = ordering;
    
    let updatedDimensionRow: PreclassDimensionRow = currentDimensionTyped;

    if (Object.keys(dimensionUpdates).length > 0) {
        dimensionUpdates.updated_at = new Date().toISOString();
        const { data: updatedData, error: updateMainError } = await supabase
        .from("preclass_dimensions").update(dimensionUpdates).eq("id", dimensionId).select().single();
        if (updateMainError || !updatedData) return { success: false, error: `Error actualizando datos principales: ${updateMainError?.message || 'No data'}.`, errorCode: "MAIN_UPDATE_FAILED" };
        updatedDimensionRow = updatedData;
        console.log(`[${opId}] Dimensión principal actualizada.`);
    }

    // A. MANEJAR OPCIONES
    if (effectiveType === 'finite') {
      if (payloadOptions !== undefined) {
        const currentOptionIds = (currentDimensionTyped.options || []).map(opt => opt.id);
        const receivedOptionIds = (payloadOptions || []).map(opt => opt.id).filter(id => !!id) as string[];
        const optionsToDelete = currentOptionIds.filter(id => !receivedOptionIds.includes(id));
        if (optionsToDelete.length > 0) {
          const { error: deleteErr } = await supabase.from("preclass_dimension_options").delete().in("id", optionsToDelete);
          if (deleteErr) return { success: false, error: `Error eliminando opciones antiguas: ${deleteErr.message}`, errorCode: "DELETE_OPTIONS_FAILED" };
        }
        for (const optPayload of (payloadOptions || [])) {
          if (optPayload.id && currentOptionIds.includes(optPayload.id)) { // Actualizar opción existente
            const dataToUpdate: PreclassDimensionOptionUpdate = { 
                value: optPayload.value, 
                ordering: optPayload.ordering 
            };
            const { error: updateErr } = await supabase.from("preclass_dimension_options").update(dataToUpdate).eq("id", optPayload.id);
            if (updateErr) return { success: false, error: `Error actualizando opción ${optPayload.id}: ${updateErr.message}`, errorCode: "UPDATE_OPTION_FAILED" };
          } else { // Insertar nueva opción
            const dataToInsert: PreclassDimensionOptionInsert = { 
              dimension_id: dimensionId, 
              value: optPayload.value, // optPayload.value es string
              ordering: optPayload.ordering // optPayload.ordering es number
            };
            const { error: insertErr } = await supabase.from("preclass_dimension_options").insert(dataToInsert);
            if (insertErr) return { success: false, error: `Error insertando nueva opción: ${insertErr.message}`, errorCode: "INSERT_OPTION_FAILED" };
          }
        }
        console.log(`[${opId}] Opciones (finite) procesadas.`);
      }
    } else if (effectiveType === 'open' && (currentDimensionTyped.options || []).length > 0) {
        const { error: deleteErr } = await supabase.from("preclass_dimension_options").delete().eq("dimension_id", dimensionId);
        if (deleteErr) return { success: false, error: `Error eliminando opciones para tipo open: ${deleteErr.message}`, errorCode: "DELETE_OPEN_OPTIONS_FAILED" };
        console.log(`[${opId}] Opciones eliminadas porque el tipo es 'open'.`);
    }

    // B. MANEJAR PREGUNTAS
    if (payloadQuestions !== undefined) {
        const currentQuestionIds = (currentDimensionTyped.questions || []).map(q => q.id);
        const receivedQuestionIds = (payloadQuestions || []).map(q => q.id).filter(id => !!id) as string[];
        const questionsToDelete = currentQuestionIds.filter(id => !receivedQuestionIds.includes(id));
        if (questionsToDelete.length > 0) {
          const { error: deleteErr } = await supabase.from("preclass_dimension_questions").delete().in("id", questionsToDelete);
          if (deleteErr) return { success: false, error: `Error eliminando preguntas antiguas: ${deleteErr.message}`, errorCode: "DELETE_QUESTIONS_FAILED" };
        }
        for (const qPayload of (payloadQuestions || [])) {
          if (qPayload.id && currentQuestionIds.includes(qPayload.id)) { // Actualizar pregunta existente
            const dataToUpdate: PreclassDimensionQuestionUpdate = { 
                question: qPayload.question, 
                ordering: qPayload.ordering 
            };
            const { error: updateErr } = await supabase.from("preclass_dimension_questions").update(dataToUpdate).eq("id", qPayload.id);
            if (updateErr) return { success: false, error: `Error actualizando pregunta ${qPayload.id}: ${updateErr.message}`, errorCode: "UPDATE_QUESTION_FAILED" };
          } else { // Insertar nueva pregunta
            const dataToInsert: PreclassDimensionQuestionInsert = { 
              dimension_id: dimensionId, 
              question: qPayload.question, // qPayload.question es string
              ordering: qPayload.ordering // qPayload.ordering es number
            };
            const { error: insertErr } = await supabase.from("preclass_dimension_questions").insert(dataToInsert);
            if (insertErr) return { success: false, error: `Error insertando nueva pregunta: ${insertErr.message}`, errorCode: "INSERT_QUESTION_FAILED" };
          }
        }
        console.log(`[${opId}] Preguntas procesadas.`);
    }
    
    // C. MANEJAR EJEMPLOS (esta sección ya estaba corregida)
    if (payloadExamples !== undefined) {
        const currentExampleIds = (currentDimensionTyped.examples || []).map(ex => ex.id);
        const receivedExampleIds = (payloadExamples || []).map(ex => ex.id).filter(id => !!id) as string[];
        const examplesToDelete = currentExampleIds.filter(id => !receivedExampleIds.includes(id));
        if (examplesToDelete.length > 0) {
          const { error: deleteErr } = await supabase.from("preclass_dimension_examples").delete().in("id", examplesToDelete);
           if (deleteErr) return { success: false, error: `Error eliminando ejemplos antiguos: ${deleteErr.message}`, errorCode: "DELETE_EXAMPLES_FAILED" };
        }
        for (const exPayload of (payloadExamples || [])) {
          if (exPayload.id && currentExampleIds.includes(exPayload.id)) {
            const dataToUpdate: PreclassDimensionExampleUpdate = { example: exPayload.example };
            const { error: updateErr } = await supabase.from("preclass_dimension_examples").update(dataToUpdate).eq("id", exPayload.id);
            if (updateErr) return { success: false, error: `Error actualizando ejemplo ${exPayload.id}: ${updateErr.message}`, errorCode: "UPDATE_EXAMPLE_FAILED" };
          } else {
            const dataToInsert: PreclassDimensionExampleInsert = { dimension_id: dimensionId, example: exPayload.example };
            const { error: insertErr } = await supabase.from("preclass_dimension_examples").insert(dataToInsert);
            if (insertErr) return { success: false, error: `Error insertando nuevo ejemplo: ${insertErr.message}`, errorCode: "INSERT_EXAMPLE_FAILED" };
          }
        }
        console.log(`[${opId}] Ejemplos procesados.`);
    }

    console.log(`🎉 [${opId}] ÉXITO: Dimensión actualizada. ID: ${dimensionId}`);
    return { success: true, data: updatedDimensionRow };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción en updateDimension:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR" };
  }
}


// ========================================================================
//  ACTION 4: ELIMINAR UNA DIMENSIÓN
// ========================================================================
// ========================================================================
//  ACTION 4: ELIMINAR UNA DIMENSIÓN
// ========================================================================
export async function deleteDimension(
  payload: DeleteDimensionPayload // Esta interfaz debe estar definida arriba
): Promise<ResultadoOperacion<null>> {
  const opId = `DDIM-${Math.floor(Math.random() * 10000)}`;
  const { dimensionId, projectId } = payload;
  console.log(`🗑️ [${opId}] Iniciando deleteDimension: ID ${dimensionId} en proyecto ${projectId}`);

  if (!dimensionId || !projectId) {
    return { success: false, error: "IDs de dimensión y proyecto son requeridos.", errorCode: "MISSING_IDS" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }
    // Asumo que verificarPermisoGestionDimensiones y PERMISO_GESTIONAR_DIMENSIONES están definidos
    if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) {
      return { success: false, error: "No tienes permiso para eliminar dimensiones en este proyecto.", errorCode: "FORBIDDEN" };
    }

    // Verificar que la dimensión pertenece al proyecto (RLS también debería cubrir esto)
    const { data: dimCheck, error: checkDimError } = await supabase
      .from("preclass_dimensions").select("id").eq("id", dimensionId).eq("project_id", projectId).maybeSingle();
    if (checkDimError) {
      console.error(`❌ [${opId}] Error verificando dimensión:`, checkDimError);
      return { success: false, error: `Error verificando dimensión: ${checkDimError.message}`, errorCode: "DB_ERROR_CHECK_DIM" };
    }
    if (!dimCheck) {
      return { success: false, error: "Dimensión no encontrada o no pertenece al proyecto.", errorCode: "DIMENSION_NOT_FOUND" };
    }

    // VERIFICACIÓN: No eliminar dimensión si el proyecto tiene lotes activos o en progreso.
    const activeOrInProgressBatchStates: BatchStatusEnum[] = ['in_progress', 'ai_prefilled', 'discrepancies'];

    const { count: activeProjectBatchesCount, error: checkBatchesError } = await supabase
      .from('article_batches') // Nombre correcto de la tabla de lotes
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .in('status', activeOrInProgressBatchStates); 

    if (checkBatchesError) {
      console.error(`❌ [${opId}] Error al verificar lotes del proyecto:`, checkBatchesError);
      return { 
        success: false, 
        error: `Error al verificar estado de los lotes del proyecto: ${checkBatchesError.message}`, 
        errorCode: "DB_CHECK_PROJECT_BATCH_STATUS_ERROR" 
      };
    }

    if (activeProjectBatchesCount !== null && activeProjectBatchesCount > 0) {
      console.warn(`[${opId}] Intento de eliminar dimensión bloqueado. Proyecto ${projectId} tiene ${activeProjectBatchesCount} lotes activos/en progreso.`);
      return { 
        success: false, 
        error: `No se puede eliminar la dimensión porque el proyecto tiene ${activeProjectBatchesCount} lote(s) de trabajo activos o en progreso. Estos lotes se iniciaron con el conjunto actual de dimensiones. Completa o reinicia estos lotes primero.`,
        errorCode: "PROJECT_HAS_ACTIVE_BATCHES_PREVENT_DIM_DELETE" 
      };
    }
    console.log(`[${opId}] Verificación de lotes activos del proyecto pasada. Lotes activos/en progreso: ${activeProjectBatchesCount}`);

    // Si se llega aquí, se puede proceder a eliminar.
    // ASEGÚRATE de que las FKs en preclass_dimension_options, _questions, y _examples
    // que referencian a preclass_dimensions(id) tengan ON DELETE CASCADE configurado en la DB.
    const { error: deleteError } = await supabase
      .from("preclass_dimensions")
      .delete()
      .eq("id", dimensionId);

    if (deleteError) {
      console.error(`❌ [${opId}] Error al eliminar dimensión ID ${dimensionId}:`, deleteError);
      if (deleteError.code === '23503') { // foreign_key_violation
        return { 
          success: false, 
          error: `No se pudo eliminar la dimensión. Podría ser debido a que aún tiene elementos asociados (opciones, preguntas o ejemplos) y el borrado en cascada no está configurado correctamente en la base de datos, o por otra restricción de clave foránea. Error: ${deleteError.message}`, 
          errorCode: "FK_VIOLATION_ON_DIM_DELETE" 
        };
      }
      return { success: false, error: `Error al eliminar dimensión: ${deleteError.message}`, errorCode: "DELETE_FAILED" };
    }

    console.log(`🎉 [${opId}] ÉXITO: Dimensión eliminada ID: ${dimensionId}`);
    return { success: true, data: null };

  } catch (error) {
    console.error(`❌ [${opId}] Excepción en deleteDimension:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR" };
  }
}

// Aquí irían las otras funciones de dimension-actions.ts (listDimensions, createDimension, updateDimension, reorderDimensions)
// Asegúrate de que las interfaces DeleteDimensionPayload, ResultadoOperacion y el tipo BatchStatusEnum
// ========================================================================
//  ACTION 5: REORDENAR DIMENSIONES
// ========================================================================
export async function reorderDimensions(
  payload: ReorderDimensionsPayload
): Promise<ResultadoOperacion<null>> {
  const opId = `RDIM-${Math.floor(Math.random() * 10000)}`;
  const { projectId, orderedDimensionIds } = payload;
  console.log(`🔄 [${opId}] Iniciando reorderDimensions para proyecto: ${projectId}`);

  if (!projectId || !Array.isArray(orderedDimensionIds)) return { success: false, error: "Payload inválido.", errorCode: "INVALID_PAYLOAD" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) return { success: false, error: "No tienes permiso para reordenar dimensiones.", errorCode: "FORBIDDEN" };

    const updates = orderedDimensionIds.map((dimensionId, index) => 
        supabase
            .from("preclass_dimensions")
            .update({ ordering: index, updated_at: new Date().toISOString() })
            .eq("id", dimensionId)
            .eq("project_id", projectId) // Seguridad adicional
    );
    
    // Ejecutar todas las actualizaciones. Promise.all fallará si alguna falla.
    // No es una transacción verdadera, pero es mejor que un bucle secuencial para errores.
    const results = await Promise.all(updates); 
    for (const result of results) {
        if (result.error) {
            console.error(`❌ [${opId}] Error actualizando orden para una dimensión:`, result.error);
            return { success: false, error: `Error al actualizar orden: ${result.error.message}`, errorCode: "REORDER_FAILED_PARTIAL" };
        }
    }

    console.log(`🎉 [${opId}] ÉXITO: Dimensiones reordenadas.`);
    return { success: true, data: null };
  } catch (error) { // Captura errores de Promise.all o de las llamadas previas
    console.error(`❌ [${opId}] Excepción en reorderDimensions:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR" };
  }
}