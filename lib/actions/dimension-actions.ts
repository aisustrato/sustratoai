// lib/actions/dimension-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ========================================================================
//	TYPE ALIASES FROM DATABASE SCHEMA
// ========================================================================
export type PreclassDimensionRow = Database["public"]["Tables"]["preclass_dimensions"]["Row"];
type PreclassDimensionInsert = Database["public"]["Tables"]["preclass_dimensions"]["Insert"];
type PreclassDimensionUpdate = Database["public"]["Tables"]["preclass_dimensions"]["Update"];

type PreclassDimensionOptionRow = Database["public"]["Tables"]["preclass_dimension_options"]["Row"];
type PreclassDimensionOptionInsert = Database["public"]["Tables"]["preclass_dimension_options"]["Insert"];
type PreclassDimensionOptionUpdate = Database["public"]["Tables"]["preclass_dimension_options"]["Update"];

type PreclassDimensionQuestionRow = Database["public"]["Tables"]["preclass_dimension_questions"]["Row"];
type PreclassDimensionQuestionInsert = Database["public"]["Tables"]["preclass_dimension_questions"]["Insert"];
// type PreclassDimensionQuestionUpdate = Database["public"]["Tables"]["preclass_dimension_questions"]["Update"]; // Unused

type PreclassDimensionExampleRow = Database["public"]["Tables"]["preclass_dimension_examples"]["Row"];
type PreclassDimensionExampleInsert = Database["public"]["Tables"]["preclass_dimension_examples"]["Insert"];
// type PreclassDimensionExampleUpdate = Database["public"]["Tables"]["preclass_dimension_examples"]["Update"]; // Unused

// ========================================================================
//	CUSTOM INTERFACES FOR ACTION PAYLOADS AND RETURN TYPES
// ========================================================================
export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string; errorCode?: string };

const PERMISO_GESTIONAR_DIMENSIONES = "can_manage_master_data";

export interface DimensionOptionData {
	id?: string;
	value: string;
	ordering: number;
	emoticon?: string | null;
}
export interface DimensionQuestionData {
	id?: string;
	question: string;
	ordering: number;
}
export interface DimensionExampleData {
	id?: string;
	example: string;
}

export interface FullDimension extends PreclassDimensionRow {
	options: PreclassDimensionOptionRow[];
	questions: PreclassDimensionQuestionRow[];
	examples: PreclassDimensionExampleRow[];
}

export interface CreateDimensionPayload {
	projectId: string;
	phaseId: string;
	name: string;
	type: 'finite' | 'open';
	description?: string | null;
	ordering: number;
	icon?: string | null;
	options?: DimensionOptionData[];
	questions?: DimensionQuestionData[];
	examples?: DimensionExampleData[];
}

// CORRECCIÓN: Restauradas las propiedades opcionales.
export interface UpdateDimensionPayload {
	dimensionId: string;
	projectId: string;
	name?: string;
	description?: string | null;
	ordering?: number;
	icon?: string | null;
	options?: DimensionOptionData[];
	questions?: DimensionQuestionData[];
	examples?: DimensionExampleData[];
}

export interface ArchiveDimensionPayload {
	dimensionId: string;
	projectId: string;
}

export interface HardDeleteDimensionPayload {
	dimensionId: string;
	projectId: string;
}

export interface ReorderDimensionsPayload {
	projectId: string;
	orderedDimensionIds: string[];
}

// ========================================================================
//	INTERNAL HELPER FUNCTION: VERIFY PERMISSION
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
//	ACTION 1: LISTAR DIMENSIONES
// ========================================================================
export async function listDimensions(
	phaseId: string,
	includeArchived: boolean = false
): Promise<ResultadoOperacion<FullDimension[]>> {
	const opId = `LDIM-${Math.floor(Math.random() * 10000)}`;
	console.log(`📄 [${opId}] Iniciando listDimensions para fase: ${phaseId}`);
	if (!phaseId) return { success: false, error: "Se requiere un ID de fase válido." };

	try {
		const supabase = await createSupabaseServerClient();
		let query = supabase
			.from("preclass_dimensions")
			.select(`*, options:preclass_dimension_options (*), questions:preclass_dimension_questions (*), examples:preclass_dimension_examples (*)`)
			.eq("phase_id", phaseId);
        
        if (!includeArchived) {
            query = query.eq('status', 'active');
        }

		const { data: dimensionsDataFromDb, error: dimensionsError } = await query.order("ordering", { ascending: true });

		if (dimensionsError) {
			console.error(`❌ [${opId}] Error al obtener dimensiones:`, dimensionsError);
			return { success: false, error: `Error al obtener dimensiones: ${dimensionsError.message}` };
		}
		if (!dimensionsDataFromDb) return { success: true, data: [] };

		const fullDimensions: FullDimension[] = dimensionsDataFromDb.map(dim => ({
            ...dim,
            options: (dim.options || []).sort((a, b) => a.ordering - b.ordering),
            questions: (dim.questions || []).sort((a, b) => a.ordering - b.ordering),
            examples: (dim.examples || []),
        }));
        
		console.log(`🎉 [${opId}] ÉXITO: ${fullDimensions.length} dimensiones obtenidas.`);
		return { success: true, data: fullDimensions };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción en listDimensions:`, error);
		return { success: false, error: `Error interno del servidor: ${(error as Error).message}`};
	}
}

// ========================================================================
//	ACTION 2: CREAR UNA NUEVA DIMENSIÓN
// ========================================================================
export async function createDimension(
	payload: CreateDimensionPayload
): Promise<ResultadoOperacion<PreclassDimensionRow>> {
	const opId = `CDIM-${Math.floor(Math.random() * 10000)}`;
	const { projectId, phaseId, name, type, description, ordering,
			options: payloadOptions,
			questions: payloadQuestions,
			examples: payloadExamples,
			icon
		} = payload;
	
	console.log(`📄 [${opId}] Iniciando createDimension: ${name} en fase ${phaseId}`);

	if (!projectId || !phaseId || !name || !type) return { success: false, error: "Faltan datos requeridos (projectId, phaseId, name, type).", errorCode: "MISSING_REQUIRED_FIELDS" };
	if (type === 'finite' && (!payloadOptions || payloadOptions.length === 0)) return { success: false, error: "Las dimensiones de tipo 'finite' deben tener al menos una opción.", errorCode: "FINITE_REQUIRES_OPTIONS" };

	try {
		const supabase = await createSupabaseServerClient();
		const { data: { user: currentUser } } = await supabase.auth.getUser();
		if (!currentUser) return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
		if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) return { success: false, error: "No tienes permiso para crear dimensiones.", errorCode: "FORBIDDEN" };
		
		const { data: existingDimension, error: checkError } = await supabase.from("preclass_dimensions").select("id").eq("phase_id", phaseId).eq("name", name).maybeSingle();
		if (checkError) return { success: false, error: `Error al verificar dimensión: ${checkError.message}` };
		if (existingDimension) return { success: false, error: `Ya existe una dimensión con el nombre "${name}" en esta fase.`, errorCode: "DUPLICATE_DIMENSION_NAME" };

		const dimensionToInsert: PreclassDimensionInsert = {
			project_id: projectId,
            phase_id: phaseId,
            name, type, description: description || null, ordering,
            icon: icon ?? null,
        };
		const { data: nuevaDimension, error: insertDimensionError } = await supabase.from("preclass_dimensions").insert(dimensionToInsert).select().single();
		if (insertDimensionError || !nuevaDimension) return { success: false, error: `Error al crear la dimensión: ${insertDimensionError?.message || 'No data.'}` };
		console.log(`[${opId}] Dimensión principal creada ID: ${nuevaDimension.id}`);

        if (type === 'finite' && payloadOptions && payloadOptions.length > 0) {
            const optionsToInsert: PreclassDimensionOptionInsert[] = payloadOptions.map(opt => ({
                dimension_id: nuevaDimension.id,
                value: opt.value,
                ordering: opt.ordering,
                emoticon: opt.emoticon ?? null,
            }));
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
//	ACTION 3: MODIFICAR UNA DIMENSIÓN
// ========================================================================
// CORRECCIÓN: Cuerpo de la función incluido completamente.
export async function updateDimension(
	payload: UpdateDimensionPayload
): Promise<ResultadoOperacion<PreclassDimensionRow>> {
	const opId = `UDIM-${Math.floor(Math.random() * 10000)}`;
	const {
		dimensionId, projectId, name, description, ordering,
		options: payloadOptions,
		questions: payloadQuestions,
		examples: payloadExamples,
		icon
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
			.select("*, options:preclass_dimension_options(*), questions:preclass_dimension_questions(*), examples:preclass_dimension_examples(*)")
			.eq("id", dimensionId)
			.eq("project_id", projectId)
			.single();

		if (fetchError || !currentDimensionData) {
			return { success: false, error: `Dimensión no encontrada o error al obtenerla: ${fetchError?.message || 'No data'}.`, errorCode: "DIMENSION_NOT_FOUND" };
		}
		
		const currentDimensionTyped: FullDimension = {
			...currentDimensionData,
			options: currentDimensionData.options || [],
			questions: currentDimensionData.questions || [],
			examples: currentDimensionData.examples || [],
		};

		if (name && name !== currentDimensionTyped.name) {
			const { data: existingName, error: nameCheckError } = await supabase
				.from("preclass_dimensions").select("id").eq("project_id", projectId).eq("name", name).neq("id", dimensionId).maybeSingle();
			if (nameCheckError) return { success: false, error: `Error verificando nombre: ${nameCheckError.message}`, errorCode: "DB_ERROR" };
			if (existingName) return { success: false, error: `Ya existe otra dimensión con el nombre "${name}".`, errorCode: "DUPLICATE_DIMENSION_NAME" };
		}
		
		const effectiveType = currentDimensionTyped.type;

		const dimensionUpdates: PreclassDimensionUpdate = {} as PreclassDimensionUpdate;
        if (name !== undefined && name !== currentDimensionTyped.name) dimensionUpdates.name = name;
        if (description !== undefined && description !== currentDimensionTyped.description) dimensionUpdates.description = description;
        if (ordering !== undefined && ordering !== currentDimensionTyped.ordering) dimensionUpdates.ordering = ordering;
        if (icon !== undefined) {
            dimensionUpdates.icon = icon ?? null;
        }
		
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
					const { error: deleteErr } = await supabase
						.from("preclass_dimension_options")
						.delete()
						.in("id", optionsToDelete);
					if (deleteErr) return { success: false, error: `Error eliminando opciones antiguas: ${deleteErr.message}`, errorCode: "DELETE_OPTIONS_FAILED" };
				}
				for (const optPayload of (payloadOptions || [])) {
					if (optPayload.id && currentOptionIds.includes(optPayload.id)) { // Actualizar
						const updateBody: PreclassDimensionOptionUpdate = {
							value: optPayload.value,
							ordering: optPayload.ordering,
							emoticon: optPayload.emoticon ?? null,
						};
						const { error: updateErr } = await supabase
							.from("preclass_dimension_options")
							.update(updateBody)
							.eq("id", optPayload.id);
						if (updateErr) return { success: false, error: `Error actualizando opción ${optPayload.id}: ${updateErr.message}`, errorCode: "UPDATE_OPTION_FAILED" };
					} else { // Insertar
						const insertBody: PreclassDimensionOptionInsert = {
							dimension_id: dimensionId,
							value: optPayload.value,
							ordering: optPayload.ordering,
							emoticon: optPayload.emoticon ?? null,
						};
						const { error: insertErr } = await supabase
							.from("preclass_dimension_options")
							.insert(insertBody);
						if (insertErr) return { success: false, error: `Error insertando nueva opción: ${insertErr.message}`, errorCode: "INSERT_OPTION_FAILED" };
					}
				}
			}
			console.log(`[${opId}] Opciones (finite) procesadas.`);
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
				if (qPayload.id && currentQuestionIds.includes(qPayload.id)) { // Actualizar
					const { error: updateErr } = await supabase.from("preclass_dimension_questions").update({ question: qPayload.question, ordering: qPayload.ordering }).eq("id", qPayload.id);
					if (updateErr) return { success: false, error: `Error actualizando pregunta ${qPayload.id}: ${updateErr.message}`, errorCode: "UPDATE_QUESTION_FAILED" };
				} else { // Insertar
					const { error: insertErr } = await supabase.from("preclass_dimension_questions").insert({ dimension_id: dimensionId, question: qPayload.question, ordering: qPayload.ordering });
					if (insertErr) return { success: false, error: `Error insertando nueva pregunta: ${insertErr.message}`, errorCode: "INSERT_QUESTION_FAILED" };
				}
			}
			console.log(`[${opId}] Preguntas procesadas.`);
		}
		
		// C. MANEJAR EJEMPLOS
		if (payloadExamples !== undefined) {
			const currentExampleIds = (currentDimensionTyped.examples || []).map(ex => ex.id);
			const receivedExampleIds = (payloadExamples || []).map(ex => ex.id).filter(id => !!id) as string[];
			const examplesToDelete = currentExampleIds.filter(id => !receivedExampleIds.includes(id));
			if (examplesToDelete.length > 0) {
				const { error: deleteErr } = await supabase.from("preclass_dimension_examples").delete().in("id", examplesToDelete);
				if (deleteErr) return { success: false, error: `Error eliminando ejemplos antiguos: ${deleteErr.message}`, errorCode: "DELETE_EXAMPLES_FAILED" };
			}
			for (const exPayload of (payloadExamples || [])) {
				if (exPayload.id && currentExampleIds.includes(exPayload.id)) { // Actualizar
					const { error: updateErr } = await supabase.from("preclass_dimension_examples").update({ example: exPayload.example }).eq("id", exPayload.id);
					if (updateErr) return { success: false, error: `Error actualizando ejemplo ${exPayload.id}: ${updateErr.message}`, errorCode: "UPDATE_EXAMPLE_FAILED" };
				} else { // Insertar
					const { error: insertErr } = await supabase.from("preclass_dimension_examples").insert({ dimension_id: dimensionId, example: exPayload.example });
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
//	ACTION 4: ARCHIVAR UNA DIMENSIÓN (Soft Delete)
// ========================================================================
export async function archiveDimension(
	payload: ArchiveDimensionPayload
): Promise<ResultadoOperacion<null>> {
    const opId = `ADIM-${Math.floor(Math.random() * 10000)}`;
    const { dimensionId, projectId } = payload;
    console.log(`🗄️ [${opId}] Iniciando archiveDimension: ID ${dimensionId}`);

    if (!dimensionId || !projectId) {
        return { success: false, error: "IDs de dimensión y proyecto son requeridos.", errorCode: "MISSING_IDS" };
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
        }
        if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) {
            return { success: false, error: "No tienes permiso para archivar dimensiones.", errorCode: "FORBIDDEN" };
        }

        const { error: updateError } = await supabase
            .from("preclass_dimensions")
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq("id", dimensionId)
            .eq("project_id", projectId);

        if (updateError) {
            console.error(`❌ [${opId}] Error al archivar dimensión:`, updateError);
            return { success: false, error: `Error al archivar la dimensión: ${updateError.message}`, errorCode: "ARCHIVE_FAILED" };
        }

        console.log(`🎉 [${opId}] ÉXITO: Dimensión archivada ID: ${dimensionId}`);
        return { success: true, data: null };
    } catch (error) {
        console.error(`❌ [${opId}] Excepción en archiveDimension:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR" };
    }
}

// ========================================================================
//	ACTION 5: BORRADO FÍSICO DE DIMENSIÓN (Hard Delete)
// ========================================================================
export async function hardDeleteDimension(
    payload: HardDeleteDimensionPayload
): Promise<ResultadoOperacion<null>> {
    const opId = `HDDIM-${Math.floor(Math.random() * 10000)}`;
    const { dimensionId, projectId } = payload;
    console.log(`🗑️ [${opId}] Iniciando hardDeleteDimension: ID ${dimensionId}`);

    if (!dimensionId || !projectId) {
        return { success: false, error: "IDs de dimensión y proyecto son requeridos.", errorCode: "MISSING_IDS" };
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
        }
        if (!(await verificarPermisoGestionDimensiones(supabase, currentUser.id, projectId))) {
            return { success: false, error: "No tienes permiso para eliminar dimensiones.", errorCode: "FORBIDDEN" };
        }

        const { count, error: checkError } = await supabase
            .from('article_dimension_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('dimension_id', dimensionId);
        
        if (checkError) {
            return { success: false, error: `Error al verificar el uso de la dimensión: ${checkError.message}`, errorCode: "USAGE_CHECK_FAILED" };
        }

        if (count && count > 0) {
            return { success: false, error: `Esta dimensión ya ha sido usada en ${count} clasificaciones y no puede ser eliminada permanentemente. Puede archivarla en su lugar.`, errorCode: "DIMENSION_IN_USE" };
        }

        const { error: deleteError } = await supabase
            .from("preclass_dimensions")
            .delete()
            .eq("id", dimensionId);

        if (deleteError) {
            console.error(`❌ [${opId}] Error al eliminar dimensión:`, deleteError);
            return { success: false, error: `Error al eliminar la dimensión: ${deleteError.message}`, errorCode: "DELETE_FAILED" };
        }

        console.log(`🎉 [${opId}] ÉXITO: Dimensión eliminada permanentemente. ID: ${dimensionId}`);
        return { success: true, data: null };

    } catch (error) {
        console.error(`❌ [${opId}] Excepción en hardDeleteDimension:`, error);
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR" };
    }
}

// ========================================================================
//	ACCIÓN 6: REORDENAR DIMENSIONES
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
				.eq("project_id", projectId)
		);
		
		const results = await Promise.all(updates);
		for (const result of results) {
			if (result.error) {
				console.error(`❌ [${opId}] Error actualizando orden para una dimensión:`, result.error);
				return { success: false, error: `Error al actualizar orden: ${result.error.message}`, errorCode: "REORDER_FAILED_PARTIAL" };
			}
		}

		console.log(`🎉 [${opId}] ÉXITO: Dimensiones reordenadas.`);
		return { success: true, data: null };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción en reorderDimensions:`, error);
		return { success: false, error: `Error interno del servidor: ${(error as Error).message}`, errorCode: "INTERNAL_SERVER_ERROR" };
	}
}