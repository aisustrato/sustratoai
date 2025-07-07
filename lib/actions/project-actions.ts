// EN: lib/actions/project-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ========================================================================
//  INTERFACES Y TIPOS
// ========================================================================

/**
 * Resultado de una operación, siguiendo el patrón estándar.
 */
export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string; errorCode?: string };

/**
 * Payload para la acción de actualización de los detalles del proyecto.
 * Incluye el ID del proyecto y los campos que se pueden modificar.
 */
export interface UpdateProjectDetailsPayload {
	projectId: string;
	name?: string;
	code?: string | null;
	description?: string | null;
	institution_name?: string | null;
	lead_researcher_user_id?: string | null;
	status?: string;
	proposal?: string | null;
	proposal_bibliography?: string | null;
	proposal_interviews?: string | null;
}

// Constante para el permiso requerido
const PERMISO_GESTIONAR_DATOS_MAESTROS = "can_manage_master_data";

// ========================================================================
//  SERVER ACTION: updateProjectDetails
// ========================================================================

/**
 * Actualiza los campos editables de un proyecto existente en la base de datos.
 * No permite crear ni eliminar proyectos.
 *
 * @param payload - Contiene el ID del proyecto y los datos a actualizar.
 * @returns Un objeto con el resultado de la operación y los datos del proyecto actualizado.
 */
export async function updateProjectDetails(
	payload: UpdateProjectDetailsPayload
): Promise<
	ResultadoOperacion<{
		project: Database["public"]["Tables"]["projects"]["Row"];
	}>
> {
	const opId = `UPDATE-PROJ-${Math.floor(Math.random() * 10000)}`;
	const { projectId, ...updateData } = payload;

	console.log(
		`🚀 [${opId}] Iniciando actualización para el proyecto: ${projectId}`
	);

	// 1. --- Validación del Payload ---
	if (!projectId) {
		return {
			success: false,
			error: "Payload inválido. Se requiere un ID de proyecto.",
			errorCode: "INVALID_PAYLOAD",
		};
	}
	if (Object.keys(updateData).length === 0) {
		return {
			success: false,
			error: "No se proporcionaron datos para actualizar.",
			errorCode: "NO_DATA_TO_UPDATE",
		};
	}

	const supabase = await createSupabaseServerClient();

	try {
		// 2. --- Verificación de Autenticación y Permisos ---
		const {
			data: { user: currentUser },
		} = await supabase.auth.getUser();
		if (!currentUser) {
			return {
				success: false,
				error: "Usuario no autenticado.",
				errorCode: "UNAUTHENTICATED",
			};
		}

		const { data: tienePermiso, error: rpcError } = await supabase.rpc(
			"has_permission_in_project",
			{
				p_user_id: currentUser.id,
				p_project_id: projectId,
				p_permission_column: PERMISO_GESTIONAR_DATOS_MAESTROS,
			}
		);

		if (rpcError || !tienePermiso) {
			console.error(
				`[AUTH_CHECK_ERROR] RPC has_permission_in_project (${PERMISO_GESTIONAR_DATOS_MAESTROS}):`,
				rpcError?.message
			);
			return {
				success: false,
				error: "No tienes permiso para gestionar los datos de este proyecto.",
				errorCode: "FORBIDDEN",
			};
		}

		// 3. --- Operación de Actualización en la Base de Datos ---
		const { data: updatedProject, error: updateError } = await supabase
			.from("projects")
			.update(updateData)
			.eq("id", projectId)
			.select()
			.single();

		if (updateError) {
			console.error(
				`❌ [${opId}] Error en la actualización del proyecto:`,
				updateError
			);
			throw new Error(
				`Error al actualizar el proyecto: ${updateError.message}`
			);
		}

		console.log(
			`✅ [${opId}] Éxito: El proyecto ${projectId} ha sido actualizado.`
		);

		return {
			success: true,
			data: { project: updatedProject },
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido.";
		console.error(
			`❌ [${opId}] Excepción en updateProjectDetails:`,
			errorMessage
		);
		return {
			success: false,
			error: `Error interno del servidor: ${errorMessage}`,
			errorCode: "INTERNAL_SERVER_ERROR",
		};
	}
}

// ========================================================================
//  SERVER ACTION: getProjectDetails
// ========================================================================

/**
 * Obtiene los detalles completos de un proyecto específico, verificando
 * que el usuario actual tenga acceso a él.
 *
 * @param projectId - El ID del proyecto a obtener.
 * @returns Un objeto con el resultado de la operación y los datos del proyecto.
 */
export async function getProjectDetails(
	projectId: string
): Promise<
	ResultadoOperacion<{
		project: Database["public"]["Tables"]["projects"]["Row"];
	}>
> {
	const opId = `GET-PROJ-${Math.floor(Math.random() * 10000)}`;
	console.log(
		`🚀 [${opId}] Iniciando obtención de detalles para el proyecto: ${projectId}`
	);

	if (!projectId) {
		return {
			success: false,
			error: "Payload inválido. Se requiere un ID de proyecto.",
			errorCode: "INVALID_PAYLOAD",
		};
	}

	const supabase = await createSupabaseServerClient();

	try {
		const {
			data: { user: currentUser },
		} = await supabase.auth.getUser();
		if (!currentUser) {
			return {
				success: false,
				error: "Usuario no autenticado.",
				errorCode: "UNAUTHENTICATED",
			};
		}

		const { data: projectUser, error: membershipError } = await supabase
			.from("project_members")
			.select("user_id")
			.eq("project_id", projectId)
			.eq("user_id", currentUser.id)
			.maybeSingle();

		if (membershipError) {
			console.error(
				`❌ [${opId}] Error al verificar la membresía del proyecto:`,
				membershipError
			);
			throw new Error(
				`Error al verificar permisos: ${membershipError.message}`
			);
		}

		if (!projectUser) {
			return {
				success: false,
				error: "No tienes permiso para ver los datos de este proyecto.",
				errorCode: "FORBIDDEN",
			};
		}

		const { data: project, error: fetchError } = await supabase
			.from("projects")
			.select("*")
			.eq("id", projectId)
			.single();

		if (fetchError) {
			console.error(`❌ [${opId}] Error al obtener el proyecto:`, fetchError);
			throw new Error(`Error al obtener el proyecto: ${fetchError.message}`);
		}

		console.log(
			`✅ [${opId}] Éxito: Los detalles del proyecto ${projectId} han sido obtenidos.`
		);

		return {
			success: true,
			data: { project },
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido.";
		console.error(`❌ [${opId}] Excepción en getProjectDetails:`, errorMessage);
		return {
			success: false,
			error: `Error interno del servidor: ${errorMessage}`,
			errorCode: "INTERNAL_SERVER_ERROR",
		};
	}
}
