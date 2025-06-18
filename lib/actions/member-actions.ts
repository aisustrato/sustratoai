// lib/actions/member-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ========================================================================
//  TYPE ALIASES FROM DATABASE SCHEMA
// ========================================================================
type UserProfileInsert =
	Database["public"]["Tables"]["users_profiles"]["Insert"];
type UserProfileUpdate =
	Database["public"]["Tables"]["users_profiles"]["Update"];
type ProjectMemberInsert =
	Database["public"]["Tables"]["project_members"]["Insert"];
type ProjectMemberUpdate =
	Database["public"]["Tables"]["project_members"]["Update"];

type GetUserByEmailRpcArgs =
	Database["public"]["Functions"]["get_user_by_email"]["Args"];

type HasPermissionRpcArgs =
	Database["public"]["Functions"]["has_permission_in_project"]["Args"];
type HasPermissionRpcReturn =
	Database["public"]["Functions"]["has_permission_in_project"]["Returns"];

// ========================================================================
//  CUSTOM INTERFACES FOR ACTION PAYLOADS AND RETURN TYPES
// ========================================================================
export interface MemberProfileData {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	public_display_name: string | null;
	public_contact_email: string | null;
	primary_institution: string | null;
	contact_phone: string | null;
	general_notes: string | null;
	preferred_language: string | null;
	pronouns: string | null;
}

export interface ProjectMemberDetails {
	project_member_id: string;
	user_id: string;
	project_id: string;
	project_role_id: string;
	role_name: string | null;
	profile: MemberProfileData | null;
	joined_at: string | null;
	ui_theme: string | null;
	ui_font_pair: string | null;
	ui_is_dark_mode: boolean | null;
}

export interface ProjectRoleInfo {
	id: string;
	role_name: string;
	role_description: string | null;
	can_manage_master_data: boolean;
	can_create_batches: boolean;
	can_upload_files: boolean;
	can_bulk_edit_master_data: boolean;
}

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string; errorCode?: string };

const PERMISO_GESTIONAR_MIEMBROS = "can_manage_master_data";

// ========================================================================
//  INTERNAL HELPER FUNCTION: VERIFY PERMISSION
// ========================================================================
async function verificarPermisoGestionMiembros(
	supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
	userId: string,
	proyectoId: string
): Promise<boolean> {
	const { data: tienePermiso, error: rpcError } = await supabase.rpc(
		"has_permission_in_project",
		{
			p_user_id: userId,
			p_project_id: proyectoId,
			p_permission_column: PERMISO_GESTIONAR_MIEMBROS,
		} as HasPermissionRpcArgs
	);
	if (rpcError) {
		console.error(
			"[AUTH_CHECK_ERROR] Error en RPC has_permission_in_project:",
			rpcError.message
		);
		return false;
	}
	return (tienePermiso as HasPermissionRpcReturn) === true;
}

// ========================================================================
//  ACTION 1: OBTENER MIEMBROS CON PERFILES Y ROLES (USANDO LA VISTA)
// ========================================================================
export async function obtenerMiembrosConPerfilesYRolesDelProyecto(
	proyectoId: string
): Promise<ResultadoOperacion<ProjectMemberDetails[]>> {
	const opId = `OMP-VIEW-${Math.floor(Math.random() * 10000)}`;
	console.log(
		`📄 [${opId}] Iniciando obtenerMiembrosConPerfilesYRolesDelProyecto (VIEW) para proyecto: ${proyectoId}`
	);
	if (!proyectoId) {
		return { success: false, error: "Se requiere un ID de proyecto válido." };
	}
	try {
		const supabase = await createSupabaseServerClient();
		const { data: miembrosData, error: miembrosError } = await supabase
			.from("detailed_project_members")
			.select(
				`
        project_member_id, user_id, project_id, project_role_id, joined_at,
        role_name, 
        first_name, last_name, public_display_name, public_contact_email, 
        primary_institution, contact_phone, general_notes, preferred_language, pronouns,
        ui_theme, ui_font_pair, ui_is_dark_mode 
      `
			)
			.eq("project_id", proyectoId);
		if (miembrosError) {
			console.error(
				`❌ [${opId}] Error al obtener miembros desde la vista:`,
				miembrosError
			);
			return {
				success: false,
				error: `Error al obtener miembros: ${miembrosError.message}`,
			};
		}
		if (!miembrosData) {
			return { success: true, data: [] };
		}
		const miembrosDetallados: ProjectMemberDetails[] = miembrosData.map(
			(m: any) => ({
				project_member_id: m.project_member_id,
				user_id: m.user_id,
				project_id: m.project_id,
				project_role_id: m.project_role_id,
				role_name: m.role_name ?? "Rol no definido",
				profile: {
					user_id: m.user_id,
					first_name: m.first_name,
					last_name: m.last_name,
					public_display_name: m.public_display_name,
					public_contact_email: m.public_contact_email,
					primary_institution: m.primary_institution,
					contact_phone: m.contact_phone,
					general_notes: m.general_notes,
					preferred_language: m.preferred_language,
					pronouns: m.pronouns,
				},
				joined_at: m.joined_at,
				ui_theme: m.ui_theme,
				ui_font_pair: m.ui_font_pair,
				ui_is_dark_mode: m.ui_is_dark_mode,
			})
		);
		console.log(
			`🎉 [${opId}] ÉXITO: ${miembrosDetallados.length} miembros obtenidos (VIEW).`
		);
		return { success: true, data: miembrosDetallados };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción (VIEW):`, error);
		return {
			success: false,
			error: `Error interno del servidor: ${(error as Error).message}`,
		};
	}
}

// ========================================================================
//  ACTION: OBTENER DETALLES DE UN MIEMBRO ESPECÍFICO DEL PROYECTO
// ========================================================================
export async function obtenerDetallesMiembroProyecto(
	projectMemberId: string,
	proyectoId: string
): Promise<ResultadoOperacion<ProjectMemberDetails | null>> {
	const opId = `ODM-${Math.floor(Math.random() * 10000)}`;
	console.log(
		`📄 [${opId}] Iniciando obtenerDetallesMiembroProyecto para membresía: ${projectMemberId} en proyecto: ${proyectoId}`
	);
	if (!projectMemberId || !proyectoId) {
		return {
			success: false,
			error: "Se requieren projectMemberId y proyectoId válidos.",
		};
	}
	try {
		const supabase = await createSupabaseServerClient();
		const { data: miembroData, error: miembroError } = await supabase
			.from("detailed_project_members")
			.select(
				`
        project_member_id, user_id, project_id, project_role_id, joined_at,
        role_name, 
        first_name, last_name, public_display_name, public_contact_email, 
        primary_institution, contact_phone, general_notes, preferred_language, pronouns,
        ui_theme, ui_font_pair, ui_is_dark_mode
      `
			)
			.eq("project_member_id", projectMemberId)
			.eq("project_id", proyectoId)
			.maybeSingle();
		if (miembroError) {
			console.error(
				`❌ [${opId}] Error al obtener detalles del miembro:`,
				miembroError
			);
			return {
				success: false,
				error: `Error al obtener detalles del miembro: ${miembroError.message}`,
			};
		}
		if (!miembroData) {
			return { success: true, data: null };
		}
		const miembroDetallado: ProjectMemberDetails = {
			project_member_id: miembroData.project_member_id!,
			user_id: miembroData.user_id!,
			project_id: miembroData.project_id!,
			project_role_id: miembroData.project_role_id!,
			role_name: miembroData.role_name ?? "Rol no definido",
			profile: {
				user_id: miembroData.user_id!,
				first_name: miembroData.first_name,
				last_name: miembroData.last_name,
				public_display_name: miembroData.public_display_name,
				public_contact_email: miembroData.public_contact_email,
				primary_institution: miembroData.primary_institution,
				contact_phone: miembroData.contact_phone,
				general_notes: miembroData.general_notes,
				preferred_language: miembroData.preferred_language,
				pronouns: miembroData.pronouns,
			},
			joined_at: miembroData.joined_at,
			ui_theme: miembroData.ui_theme,
			ui_font_pair: miembroData.ui_font_pair,
			ui_is_dark_mode: miembroData.ui_is_dark_mode,
		};
		console.log(`🎉 [${opId}] ÉXITO: Detalles del miembro obtenidos.`);
		return { success: true, data: miembroDetallado };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción:`, error);
		return {
			success: false,
			error: `Error interno del servidor: ${(error as Error).message}`,
		};
	}
}

// ========================================================================
//  ACTION: OBTENER ROLES DISPONIBLES PARA UN PROYECTO
// ========================================================================
export async function obtenerRolesDisponiblesProyecto(
	proyectoId: string
): Promise<ResultadoOperacion<ProjectRoleInfo[]>> {
	const opId = `ORDP-${Math.floor(Math.random() * 10000)}`;
	console.log(
		`📄 [${opId}] Iniciando obtenerRolesDisponiblesProyecto para proyecto: ${proyectoId}`
	);
	if (!proyectoId) {
		return { success: false, error: "Se requiere un ID de proyecto válido." };
	}
	try {
		const supabase = await createSupabaseServerClient();
		const { data: rolesData, error: rolesError } = await supabase
			.from("project_roles")
			.select(
				`
        id,
        role_name,
        role_description,
        can_manage_master_data,
        can_create_batches,
        can_upload_files,
        can_bulk_edit_master_data
      `
			)
			.eq("project_id", proyectoId)
			.order("role_name", { ascending: true });
		if (rolesError) {
			console.error(
				`❌ [${opId}] Error al obtener roles del proyecto:`,
				rolesError
			);
			return {
				success: false,
				error: `Error al obtener roles: ${rolesError.message}`,
			};
		}
		if (!rolesData) {
			return { success: true, data: [] };
		}
		const rolesInfo: ProjectRoleInfo[] = rolesData.map((r: any) => ({
			// any para simplificar, o usar el tipo Row de project_roles
			id: r.id,
			role_name: r.role_name,
			role_description: r.role_description,
			can_manage_master_data: r.can_manage_master_data || false,
			can_create_batches: r.can_create_batches || false,
			can_upload_files: r.can_upload_files || false,
			can_bulk_edit_master_data: r.can_bulk_edit_master_data || false,
		}));
		console.log(
			`🎉 [${opId}] ÉXITO: ${rolesInfo.length} roles obtenidos para el proyecto.`
		);
		return { success: true, data: rolesInfo };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción:`, error);
		return {
			success: false,
			error: `Error interno del servidor: ${(error as Error).message}`,
		};
	}
}

// ========================================================================
//  ACTION: AGREGAR MIEMBRO A PROYECTO
// ========================================================================
interface AddMemberPayload {
	proyectoId: string;
	emailUsuarioNuevo: string;
	rolIdAsignar: string;
	datosPerfilInicial?: Omit<
		Partial<UserProfileInsert>,
		"user_id" | "public_contact_email"
	>;
}

export async function agregarMiembroAProyecto(
	payload: AddMemberPayload
): Promise<
	ResultadoOperacion<{
		project_member_id: string;
		profile_action: "created" | "existed" | "error";
	}>
> {
	const opId = `AMPv3-${Math.floor(Math.random() * 10000)}`;
	console.log(
		`📄 [${opId}] Iniciando agregarMiembroAProyecto v3: ${payload.emailUsuarioNuevo} a proyecto ${payload.proyectoId}`
	);

	const { proyectoId, emailUsuarioNuevo, rolIdAsignar, datosPerfilInicial } =
		payload;
	if (!proyectoId || !emailUsuarioNuevo || !rolIdAsignar) {
		return {
			success: false,
			error:
				"Faltan datos requeridos (proyectoId, emailUsuarioNuevo, rolIdAsignar).",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user: currentUser },
		} = await supabase.auth.getUser();

		if (!currentUser)
			return {
				success: false,
				error: "Usuario no autenticado.",
				errorCode: "UNAUTHENTICATED",
			};

		if (
			!(await verificarPermisoGestionMiembros(
				supabase,
				currentUser.id,
				proyectoId
			))
		) {
			return {
				success: false,
				error: "No tienes permiso para agregar miembros a este proyecto.",
				errorCode: "FORBIDDEN",
			};
		}
		console.log(`✅ [${opId}] Permiso verificado para ${currentUser.id}`);

		const { data: rpcData, error: rpcError } = await supabase.rpc(
			"get_user_by_email",
			{ user_email: emailUsuarioNuevo } as GetUserByEmailRpcArgs
		);

		if (rpcError) {
			console.error(`❌ [${opId}] Error en RPC get_user_by_email:`, rpcError);
			return {
				success: false,
				error: `Error al buscar usuario: ${rpcError.message}`,
				errorCode: "RPC_ERROR",
			};
		}
		if (rpcData === null || typeof rpcData === "undefined") {
			return {
				success: false,
				error: `Usuario con email '${emailUsuarioNuevo}' no encontrado.`,
				errorCode: "USER_NOT_FOUND",
			};
		}
		const targetUserId: string = rpcData; // TypeScript ahora sabe que es string
		console.log(`👤 [${opId}] Usuario a agregar ID: ${targetUserId}`);

		const { data: existingMember, error: checkMemberError } = await supabase
			.from("project_members")
			.select("id")
			.eq("user_id", targetUserId)
			.eq("project_id", proyectoId)
			.maybeSingle();
		if (checkMemberError) {
			console.error(
				`❌ [${opId}] Error verificando membresía existente:`,
				checkMemberError
			);
			return {
				success: false,
				error: `Error al verificar membresía: ${checkMemberError.message}`,
			};
		}
		if (existingMember) {
			return {
				success: false,
				error: "El usuario ya es miembro de este proyecto.",
				errorCode: "ALREADY_MEMBER",
			};
		}

		let profile_action_status: "created" | "existed" | "error" = "error";
		const { data: existingProfile, error: checkProfileError } = await supabase
			.from("users_profiles")
			.select("user_id")
			.eq("user_id", targetUserId)
			.maybeSingle();
		if (checkProfileError) {
			console.error(
				`❌ [${opId}] Error verificando perfil existente:`,
				checkProfileError
			);
			return {
				success: false,
				error: `Error al verificar perfil: ${checkProfileError.message}`,
			};
		}

		if (!existingProfile) {
			console.log(
				`ℹ️ [${opId}] Perfil no existente para ${targetUserId}. Creando...`
			);
			const perfilParaInsertar: UserProfileInsert = {
				user_id: targetUserId,
				first_name: datosPerfilInicial?.first_name || "Usuario",
				last_name: datosPerfilInicial?.last_name || "Invitado",
				public_display_name:
					datosPerfilInicial?.public_display_name ||
					`${datosPerfilInicial?.first_name || "Usuario"} ${
						datosPerfilInicial?.last_name || "Invitado"
					}`,
				public_contact_email: emailUsuarioNuevo,
				primary_institution: datosPerfilInicial?.primary_institution || null,
				contact_phone: datosPerfilInicial?.contact_phone || null,
				general_notes: datosPerfilInicial?.general_notes || null,
				preferred_language: datosPerfilInicial?.preferred_language || "es",
				pronouns: datosPerfilInicial?.pronouns || null,
			};
			const { error: profileInsertError } = await supabase
				.from("users_profiles")
				.insert(perfilParaInsertar);
			if (profileInsertError) {
				console.error(
					`❌ [${opId}] Error al crear perfil para ${targetUserId}:`,
					profileInsertError
				);
				profile_action_status = "error";
			} else {
				profile_action_status = "created";
				console.log(`✅ [${opId}] Perfil creado para ${targetUserId}`);
			}
		} else {
			profile_action_status = "existed";
			console.log(`ℹ️ [${opId}] Perfil ya existente para ${targetUserId}.`);
		}

		const membresiaParaInsertar: ProjectMemberInsert = {
			user_id: targetUserId,
			project_id: proyectoId,
			project_role_id: rolIdAsignar,
			ui_theme: "blue",
			ui_font_pair: "sustrato",
			ui_is_dark_mode: false,
			is_active_for_user: true,
		};
		const { data: nuevaMembresia, error: insertError } = await supabase
			.from("project_members")
			.insert(membresiaParaInsertar)
			.select("id")
			.single();

		if (insertError) {
			return {
				success: false,
				error: `Error al agregar miembro al proyecto: ${insertError.message}`,
			};
		}
		if (!nuevaMembresia?.id) {
			return {
				success: false,
				error: "Error interno: Inserción de miembro no retornó ID.",
			};
		}

		console.log(
			`🎉 [${opId}] ÉXITO: Miembro agregado. ID Membresía: ${nuevaMembresia.id}, Perfil: ${profile_action_status}`
		);
		return {
			success: true,
			data: {
				project_member_id: nuevaMembresia.id,
				profile_action: profile_action_status,
			},
		};
	} catch (error) {
		console.error(`❌ [${opId}] Excepción:`, error);
		return {
			success: false,
			error: `Error interno del servidor: ${(error as Error).message}`,
		};
	}
}

// ========================================================================
//  ACTION 3: MODIFICAR DETALLES DE MIEMBRO (PERFIL Y/O MEMBRESÍA)
// ========================================================================
interface ModifyMemberPayload {
	projectMemberId: string;
	proyectoId: string;
	profileUpdates?: Omit<
		Partial<UserProfileUpdate>,
		"user_id" | "public_contact_email" | "created_at" | "updated_at"
	>;
	// Ajuste aquí para que el frontend envíe lo que tiene y la SA lo mapee
	memberUpdates?: {
		nuevoRolId?: string | null; // Frontend envía esto si quiere cambiar el rol
		// Incluir otros campos de project_members que el frontend podría querer actualizar
		ui_theme?: string | null;
		ui_font_pair?: string | null;
		ui_is_dark_mode?: boolean | null;
		contact_email_for_project?: string | null;
		contextual_notes?: string | null;
	};
}

export async function modificarDetallesMiembroEnProyecto(
	payload: ModifyMemberPayload
): Promise<ResultadoOperacion<null>> {
	const opId = `MDMv3-${Math.floor(Math.random() * 10000)}`; // Versión incrementada
	const {
		projectMemberId,
		proyectoId,
		profileUpdates,
		memberUpdates: memberUpdatesFromPayload,
	} = payload;

	console.log(
		`📄 [${opId}] Iniciando modificarDetallesMiembroEnProyecto v3 para membresía ID: ${projectMemberId}`
	);
	console.log(`[${opId}] Payload recibido:`, JSON.stringify(payload, null, 2));

	if (!projectMemberId || !proyectoId) {
		return {
			success: false,
			error: "Faltan IDs requeridos (projectMemberId, proyectoId).",
		};
	}
	if (
		(!profileUpdates || Object.keys(profileUpdates).length === 0) &&
		(!memberUpdatesFromPayload ||
			Object.keys(memberUpdatesFromPayload).length === 0)
	) {
		return {
			success: false,
			error: "No se proporcionaron datos para actualizar.",
			errorCode: "NO_CHANGES",
		};
	}

	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user: currentUser },
		} = await supabase.auth.getUser();

		if (!currentUser)
			return {
				success: false,
				error: "Usuario no autenticado.",
				errorCode: "UNAUTHENTICATED",
			};

		if (
			!(await verificarPermisoGestionMiembros(
				supabase,
				currentUser.id,
				proyectoId
			))
		) {
			return {
				success: false,
				error: "No tienes permiso para modificar miembros en este proyecto.",
				errorCode: "FORBIDDEN",
			};
		}
		console.log(`✅ [${opId}] Permiso verificado para ${currentUser.id}`);

		const { data: miembro, error: miembroFetchError } = await supabase
			.from("project_members")
			.select("user_id, project_id")
			.eq("id", projectMemberId)
			.single();

		if (miembroFetchError) {
			console.error(
				`❌ [${opId}] Error obteniendo datos del miembro:`,
				miembroFetchError
			);
			return {
				success: false,
				error: `Error al obtener datos del miembro: ${miembroFetchError.message}`,
				errorCode: "FETCH_ERROR",
			};
		}
		if (!miembro) {
			return {
				success: false,
				error: `Membresía con ID ${projectMemberId} no encontrada.`,
				errorCode: "MEMBER_NOT_FOUND",
			};
		}
		if (miembro.project_id !== proyectoId) {
			return {
				success: false,
				error:
					"Inconsistencia de datos: La membresía no pertenece al proyecto indicado.",
				errorCode: "DATA_MISMATCH",
			};
		}
		const targetUserId = miembro.user_id;

		// Actualizar users_profiles si hay datos
		if (profileUpdates && Object.keys(profileUpdates).length > 0) {
			// Filtrar cualquier campo que no deba ser undefined explícitamente
			const cleanProfileUpdates = Object.entries(profileUpdates).reduce(
				(acc, [key, value]) => {
					if (value !== undefined) {
						(acc as any)[key] = value;
					}
					return acc;
				},
				{} as Partial<UserProfileUpdate>
			);

			if (Object.keys(cleanProfileUpdates).length > 0) {
				console.log(
					`🔄 [${opId}] Actualizando perfil de ${targetUserId}:`,
					cleanProfileUpdates
				);
				const { error: profileUpdateError } = await supabase
					.from("users_profiles")
					.update(cleanProfileUpdates) // Usar cleanProfileUpdates
					.eq("user_id", targetUserId);

				if (profileUpdateError) {
					console.error(
						`❌ [${opId}] Error actualizando perfil de ${targetUserId}:`,
						profileUpdateError
					);
					return {
						success: false,
						error: `Error al actualizar perfil: ${profileUpdateError.message}`,
					};
				}
				console.log(`✅ [${opId}] Perfil de ${targetUserId} actualizado.`);
			}
		}

		// Actualizar project_members si hay datos
		if (
			memberUpdatesFromPayload &&
			Object.keys(memberUpdatesFromPayload).length > 0
		) {
			const updatesParaProjectMembersDb: Partial<ProjectMemberUpdate> = {};

			if (memberUpdatesFromPayload.nuevoRolId !== undefined) {
				const value = memberUpdatesFromPayload.nuevoRolId;
				updatesParaProjectMembersDb.project_role_id =
					value === null ? undefined : value;
			}
			if (memberUpdatesFromPayload.ui_theme !== undefined) {
				updatesParaProjectMembersDb.ui_theme =
					memberUpdatesFromPayload.ui_theme;
			}
			if (memberUpdatesFromPayload.ui_font_pair !== undefined) {
				updatesParaProjectMembersDb.ui_font_pair =
					memberUpdatesFromPayload.ui_font_pair;
			}
			if (memberUpdatesFromPayload.ui_is_dark_mode !== undefined) {
				const value = memberUpdatesFromPayload.ui_is_dark_mode;
				updatesParaProjectMembersDb.ui_is_dark_mode =
					value === null ? undefined : value;
			}
			if (memberUpdatesFromPayload.contact_email_for_project !== undefined) {
				updatesParaProjectMembersDb.contact_email_for_project =
					memberUpdatesFromPayload.contact_email_for_project;
			}
			if (memberUpdatesFromPayload.contextual_notes !== undefined) {
				updatesParaProjectMembersDb.contextual_notes =
					memberUpdatesFromPayload.contextual_notes;
			}

			if (Object.keys(updatesParaProjectMembersDb).length > 0) {
				console.log(
					`🔄 [${opId}] Actualizando membresía ${projectMemberId}:`,
					updatesParaProjectMembersDb
				);
				const { error: memberUpdateError } = await supabase
					.from("project_members")
					.update(updatesParaProjectMembersDb)
					.eq("id", projectMemberId);

				if (memberUpdateError) {
					console.error(
						`❌ [${opId}] Error actualizando membresía ${projectMemberId}:`,
						memberUpdateError
					);
					return {
						success: false,
						error: `Error al actualizar membresía: ${memberUpdateError.message}`,
					};
				}
				console.log(`✅ [${opId}] Membresía ${projectMemberId} actualizada.`);
			}
		}

		console.log(`🎉 [${opId}] ÉXITO: Detalles de miembro actualizados.`);
		return { success: true, data: null };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción:`, error);
		return {
			success: false,
			error: `Error interno del servidor: ${(error as Error).message}`,
		};
	}
}

// ========================================================================
//  ACTION 4: ELIMINAR MIEMBRO DE PROYECTO
// ========================================================================
interface DeleteMemberPayload {
	projectMemberId: string;
	proyectoId: string;
}

export async function eliminarMiembroDeProyecto(
	payload: DeleteMemberPayload
): Promise<ResultadoOperacion<null>> {
	const opId = `EMPv2-${Math.floor(Math.random() * 10000)}`;
	const { projectMemberId, proyectoId } = payload;
	console.log(
		`📄 [${opId}] Iniciando eliminarMiembroDeProyecto: membresía ID ${projectMemberId} de proyecto ${proyectoId}`
	);
	if (!projectMemberId || !proyectoId) {
		return {
			success: false,
			error: "Faltan IDs requeridos (projectMemberId, proyectoId).",
		};
	}
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user: currentUser },
		} = await supabase.auth.getUser();
		if (!currentUser)
			return {
				success: false,
				error: "Usuario no autenticado.",
				errorCode: "UNAUTHENTICATED",
			};
		if (
			!(await verificarPermisoGestionMiembros(
				supabase,
				currentUser.id,
				proyectoId
			))
		) {
			return {
				success: false,
				error: "No tienes permiso para eliminar miembros de este proyecto.",
				errorCode: "FORBIDDEN",
			};
		}
		console.log(`✅ [${opId}] Permiso verificado para ${currentUser.id}`);
		const { data: miembro, error: fetchError } = await supabase
			.from("project_members")
			.select("project_id")
			.eq("id", projectMemberId)
			.single();
		if (fetchError) {
			console.error(
				`❌ [${opId}] Error obteniendo datos del miembro para eliminar:`,
				fetchError
			);
			return {
				success: false,
				error: `Error al obtener datos del miembro: ${fetchError.message}`,
				errorCode: "FETCH_ERROR",
			};
		}
		if (!miembro) {
			return {
				success: false,
				error: `Membresía con ID ${projectMemberId} no encontrada.`,
				errorCode: "MEMBER_NOT_FOUND",
			};
		}
		if (miembro.project_id !== proyectoId) {
			return {
				success: false,
				error:
					"Inconsistencia de datos: La membresía no pertenece al proyecto indicado para eliminación.",
				errorCode: "DATA_MISMATCH",
			};
		}
		console.log(`🗑️ [${opId}] Eliminando membresía ${projectMemberId}`);
		const { error: deleteError } = await supabase
			.from("project_members")
			.delete()
			.eq("id", projectMemberId);
		if (deleteError) {
			console.error(`❌ [${opId}] Error al eliminar miembro:`, deleteError);
			return {
				success: false,
				error: `Error al eliminar miembro: ${deleteError.message}`,
			};
		}
		console.log(`🎉 [${opId}] ÉXITO: Miembro eliminado del proyecto.`);
		return { success: true, data: null };
	} catch (error) {
		console.error(`❌ [${opId}] Excepción:`, error);
		return {
			success: false,
			error: `Error interno del servidor: ${(error as Error).message}`,
		};
	}
}

// ========================================================================
//  DOCUMENTACIÓN PARA FRONTEND / IA ASISTENTE (la misma que antes, debería estar actualizada)
// ========================================================================
/*
SOBRE ESTE ARCHIVO (`member-actions.ts`)
Este archivo contiene Server Actions de Next.js para gestionar los miembros (investigadores)
de los proyectos. Estas funciones se ejecutan en el servidor y pueden ser llamadas
directamente desde componentes de cliente.

ESTRUCTURA DE RETORNO COMÚN:
Todas las funciones devuelven un objeto:
  - `success: true`, `data: T` (si la operación fue exitosa, T es el tipo de dato retornado)
  - `success: false`, `error: string`, `errorCode?: string` (si hubo un error)
Maneja estos estados en tu UI (loading, mostrar error, actualizar con data).

PERMISOS:
- Las acciones de escritura (agregar, modificar, eliminar) requieren que el usuario
  autenticado tenga el permiso `can_manage_master_data` en el proyecto.
- La UI debe reflejar esto (deshabilitar botones si no hay permiso), aunque las
  Server Actions SIEMPRE revalidan el permiso en el backend.
- La función `obtenerMiembrosConPerfilesYRolesDelProyecto` es de solo lectura
  y puede ser llamada por cualquier miembro del proyecto (la VISTA y RLS lo controlan).

FUNCIONES DISPONIBLES:

1. obtenerMiembrosConPerfilesYRolesDelProyecto(proyectoId: string)
   - Propósito: Obtener la lista completa de miembros de un proyecto, con sus
     datos de perfil, nombre de rol y algunas configuraciones de UI.
   - Usa la VISTA `detailed_project_members` para eficiencia.
   - Retorna: `ProjectMemberDetails[]` (ver interfaz arriba).
     - `project_member_id`: ID único de la membresía. Úsalo como `key` y para
       acciones de modificación/eliminación.
     - `profile`: Objeto con datos de `users_profiles` (nombre, email, teléfono, etc.).

2. agregarMiembroAProyecto(payload: AddMemberPayload)
   - Propósito: Añadir un nuevo usuario (que ya debe existir en `auth.users`) a un proyecto.
   - `payload`:
     - `proyectoId: string`
     - `emailUsuarioNuevo: string` (del usuario a añadir)
     - `rolIdAsignar: string` (UUID del `project_roles` a asignar)
     - `datosPerfilInicial?: Omit<Partial<UserProfileInsert>, "user_id" | "public_contact_email">`
       (Opcional. Si el usuario no tiene perfil, se crea uno con estos datos o defaults.
        Ej: `{ first_name: 'Ana', last_name: 'Perez', pronouns: 'ella' }`)
   - Lógica Interna:
     - Verifica permisos del admin.
     - Busca `user_id` por email.
     - Si el `user_id` no tiene perfil, lo crea.
     - Inserta en `project_members` con UI por defecto (`ui_theme='blue'`, `is_active_for_user=true`, etc.).
   - Retorna: `{ project_member_id: string; profile_action: "created" | "existed" | "error" }`
   - `profile_action` indica si el perfil se creó, ya existía, o hubo un error al intentar crearlo.
   - Errores Comunes (`errorCode`): `UNAUTHENTICATED`, `FORBIDDEN`, `USER_NOT_FOUND`, `ALREADY_MEMBER`, `RPC_ERROR`.
   - POST-ACCIÓN UI: Refrescar la lista de miembros.

3. modificarDetallesMiembroEnProyecto(payload: ModifyMemberPayload)
   - Propósito: Actualizar datos del perfil Y/O datos de la membresía de un miembro existente.
   - `payload`:
     - `projectMemberId: string` (ID de la fila en `project_members` a modificar)
     - `proyectoId: string` (para validación de permisos)
     - `profileUpdates?: Omit<Partial<UserProfileUpdate>, "user_id" | ...>`
       (Objeto con campos de `users_profiles` a cambiar. Ej: `{ first_name: 'Nuevo Nombre' }`)
     - `memberUpdates?: Omit<Partial<ProjectMemberUpdate>, "id" | ...>`
       (Objeto con campos de `project_members` a cambiar. Ej: `{ project_role_id: 'nuevo-rol-uuid', ui_theme: 'green' }`)
   - Lógica Interna:
     - Verifica permisos del admin.
     - Actualiza `users_profiles` si se provee `profileUpdates`.
     - Actualiza `project_members` si se provee `memberUpdates`.
   - Retorna: `null` en `data` si es exitoso.
   - Errores Comunes (`errorCode`): `NO_CHANGES`, `MEMBER_NOT_FOUND`, `DATA_MISMATCH`, `FETCH_ERROR`.
   - POST-ACCIÓN UI: Refrescar detalles/lista del miembro.

4. eliminarMiembroDeProyecto(payload: DeleteMemberPayload)
   - Propósito: Quitar un miembro de un proyecto (elimina la fila de `project_members`).
   - `payload`:
     - `projectMemberId: string` (ID de la membresía a eliminar)
     - `proyectoId: string` (para validación de permisos)
   - Lógica Interna: No borra el `users_profiles` del usuario.
   - Retorna: `null` en `data` si es exitoso.
   - UI: SIEMPRE pedir confirmación al usuario antes de llamar.
   - Errores Comunes (`errorCode`): `MEMBER_NOT_FOUND`, `DATA_MISMATCH`, `FETCH_ERROR`.
   - POST-ACCIÓN UI: Refrescar lista de miembros.

RPCs Y VISTA NECESARIAS EN LA BASE DE DATOS:
- RPC `get_user_by_email`
- RPC `has_permission_in_project`
- VISTA `detailed_project_members` (como se definió previamente, incluyendo los nuevos campos de perfil)

Esta estructura debería ser mucho más robusta y fácil de consumir desde el frontend.
*/
