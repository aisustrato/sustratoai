// lib/actions/project-role-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ========================================================================
//  TYPE ALIASES FROM DATABASE SCHEMA
// ========================================================================
export type ProjectRoleRow = Database["public"]["Tables"]["project_roles"]["Row"];
type ProjectRoleInsert = Database["public"]["Tables"]["project_roles"]["Insert"];
type ProjectRoleUpdate = Database["public"]["Tables"]["project_roles"]["Update"];

type HasPermissionRpcArgs = Database["public"]["Functions"]["has_permission_in_project"]["Args"];
type HasPermissionRpcReturn = Database["public"]["Functions"]["has_permission_in_project"]["Returns"];

// ========================================================================
//  CUSTOM INTERFACES FOR ACTION PAYLOADS AND RETURN TYPES
// ========================================================================
export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

const PERMISO_GESTIONAR_ROLES = "can_manage_master_data";

// ========================================================================
//  INTERNAL HELPER FUNCTION: VERIFY PERMISSION
// ========================================================================
async function verificarPermisoGestionRoles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  proyectoId: string
): Promise<boolean> {
  const { data: tienePermiso, error: rpcError } = await supabase.rpc(
    "has_permission_in_project",
    {
      p_user_id: userId,
      p_project_id: proyectoId,
      p_permission_column: PERMISO_GESTIONAR_ROLES,
    } as HasPermissionRpcArgs
  );
  if (rpcError) {
    console.error(
      `[AUTH_CHECK_ERROR] Error en RPC has_permission_in_project (roles): ${rpcError.message}`
    );
    return false;
  }
  return (tienePermiso as HasPermissionRpcReturn) === true;
}

// ========================================================================
//  ACTION 1: OBTENER ROLES DE UN PROYECTO
// ========================================================================
export async function obtenerRolesDelProyecto(
  proyectoId: string
): Promise<ResultadoOperacion<ProjectRoleRow[]>> {
  const opId = `ORP-${Math.floor(Math.random() * 10000)}`;
  console.log(
    `📄 [${opId}] Iniciando obtenerRolesDelProyecto para proyecto: ${proyectoId}`
  );

  if (!proyectoId) {
    return { success: false, error: "Se requiere un ID de proyecto válido." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: rolesData, error: rolesError } = await supabase
      .from("project_roles")
      .select("*")
      .eq("project_id", proyectoId)
      .order("role_name", { ascending: true });

    if (rolesError) {
      console.error(`❌ [${opId}] Error al obtener roles:`, rolesError);
      return {
        success: false,
        error: `Error al obtener roles: ${rolesError.message}`,
      };
    }

    console.log(`🎉 [${opId}] ÉXITO: ${rolesData.length} roles obtenidos.`);
    return { success: true, data: rolesData || [] };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción:`, error);
    return {
      success: false,
      error: `Error interno del servidor: ${(error as Error).message}`,
    };
  }
}

// ========================================================================
//  ACTION 2: AGREGAR ROL A PROYECTO
// ========================================================================
export interface AddRolePayload {
  project_id: string;
  role_name: string;
  role_description?: string | null;
  can_manage_master_data?: boolean;
  can_create_batches?: boolean;
  can_upload_files?: boolean;
  can_bulk_edit_master_data?: boolean;
}

export async function agregarRolAProyecto(
  payload: AddRolePayload
): Promise<ResultadoOperacion<ProjectRoleRow>> {
  const opId = `ARP-${Math.floor(Math.random() * 10000)}`;
  console.log(
    `📄 [${opId}] Iniciando agregarRolAProyecto: ${payload.role_name} a proyecto ${payload.project_id}`
  );

  const { project_id, role_name } = payload;
  if (!project_id || !role_name) {
    return {
      success: false,
      error: "Faltan datos requeridos (project_id, role_name).",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }

    if (!(await verificarPermisoGestionRoles(supabase, currentUser.id, project_id))) {
      return { success: false, error: "No tienes permiso para agregar roles a este proyecto.", errorCode: "FORBIDDEN" };
    }
    console.log(`✅ [${opId}] Permiso verificado para ${currentUser.id}`);

    const { data: existingRole, error: checkError } = await supabase
      .from("project_roles")
      .select("id")
      .eq("project_id", project_id)
      .eq("role_name", role_name)
      .maybeSingle();

    if (checkError) {
        console.error(`❌ [${opId}] Error verificando rol existente:`, checkError);
        return { success: false, error: `Error al verificar rol: ${checkError.message}` };
    }
    if (existingRole) {
        return { success: false, error: `Ya existe un rol con el nombre "${role_name}" en este proyecto.`, errorCode: "DUPLICATE_ROLENAME" };
    }

    const rolParaInsertar: ProjectRoleInsert = {
      project_id: payload.project_id,
      role_name: payload.role_name,
      role_description: payload.role_description || null,
      can_manage_master_data: payload.can_manage_master_data || false,
      can_create_batches: payload.can_create_batches || false,
      can_upload_files: payload.can_upload_files || false,
      can_bulk_edit_master_data: payload.can_bulk_edit_master_data || false,
    };

    const { data: nuevoRol, error: insertError } = await supabase
      .from("project_roles")
      .insert(rolParaInsertar)
      .select()
      .single();

    if (insertError) {
      console.error(`❌ [${opId}] Error al agregar rol:`, insertError);
      return { success: false, error: `Error al agregar rol: ${insertError.message}` };
    }
    if (!nuevoRol) {
        return { success: false, error: "Error interno: Inserción de rol no retornó datos." };
    }

    console.log(`🎉 [${opId}] ÉXITO: Rol agregado. ID: ${nuevoRol.id}`);
    return { success: true, data: nuevoRol };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
  }
}
type ProjectRoleHistoryRow = Database["public"]["Tables"]["project_roles_history"]["Row"]; // Asumiendo que tienes este tipo

export async function obtenerHistorialDeRol(
  roleId: string,
  proyectoId: string // Para el contexto de permisos
): Promise<ResultadoOperacion<ProjectRoleHistoryRow[]>> {
  const opId = `OHR-${Math.floor(Math.random() * 10000)}`;
  console.log(`📄 [${opId}] Iniciando obtenerHistorialDeRol: rol ${roleId} en proyecto ${proyectoId}`);

  if (!roleId || !proyectoId) {
    return { success: false, error: "ID de rol y ID de proyecto son requeridos." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }

    // Verificar permiso para ver el historial (usando la misma lógica que la RLS de la tabla de historial)
    if (!(await verificarPermisoGestionRoles(supabase, currentUser.id, proyectoId))) {
      return { success: false, error: "No tienes permiso para ver el historial de roles de este proyecto.", errorCode: "FORBIDDEN" };
    }
    console.log(`✅ [${opId}] Permiso verificado para ver historial por ${currentUser.id}`);
    
    const { data: historialData, error } = await supabase
      .from("project_roles_history")
      .select("*") // Seleccionar todas las columnas del historial
      .eq("role_id", roleId) // Filtrar por el ID del rol específico
      .eq("project_id", proyectoId) // Asegurar que es del proyecto correcto
      .order("operation_timestamp", { ascending: false }); // Más reciente primero

    if (error) {
      console.error(`❌ [${opId}] Error al obtener historial del rol:`, error);
      return { success: false, error: `Error al obtener historial del rol: ${error.message}` };
    }
    
    console.log(`🎉 [${opId}] ÉXITO: ${historialData.length} entradas de historial obtenidas para el rol ${roleId}.`);
    return { success: true, data: historialData || [] };

  } catch (err) {
    console.error(`❌ [${opId}] Excepción:`, err);
    return { success: false, error: `Error interno del servidor: ${(err as Error).message}` };
  }
}
// ========================================================================
//  ACTION 3: MODIFICAR ROL EN PROYECTO
// ========================================================================
export interface ModifyRolePayload {
  role_id: string;
  project_id: string;
  updates: Omit<Partial<ProjectRoleUpdate>, "id" | "project_id" | "created_at" | "updated_at">;
}

export async function modificarRolEnProyecto(
  payload: ModifyRolePayload
): Promise<ResultadoOperacion<ProjectRoleRow>> {
  const opId = `MRP-${Math.floor(Math.random() * 10000)}`;
  const { role_id, project_id, updates } = payload;

  console.log(
    `📄 [${opId}] Iniciando modificarRolEnProyecto para rol ID: ${role_id} en proyecto ${project_id}`
  );
  console.log(`[${opId}] Updates recibidos:`, JSON.stringify(updates, null, 2));

  if (!role_id || !project_id) {
    return { success: false, error: "Faltan IDs requeridos (role_id, project_id)." };
  }
  if (!updates || Object.keys(updates).length === 0) {
    return { success: false, error: "No se proporcionaron datos para actualizar.", errorCode: "NO_CHANGES" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }

    const { data: currentRoleData, error: fetchRoleError } = await supabase
      .from("project_roles")
      .select("project_id, role_name")
      .eq("id", role_id)
      .single();

    if (fetchRoleError) {
        console.error(`❌ [${opId}] Error obteniendo rol actual:`, fetchRoleError);
        return { success: false, error: `Error al obtener datos del rol: ${fetchRoleError.message}`, errorCode: "FETCH_ERROR" };
    }
    if (!currentRoleData) {
        return { success: false, error: `Rol con ID ${role_id} no encontrado.`, errorCode: "ROLE_NOT_FOUND"};
    }
    if (currentRoleData.project_id !== project_id) {
        return { success: false, error: "Inconsistencia de datos: El rol no pertenece al proyecto indicado.", errorCode: "DATA_MISMATCH"};
    }

    if (!(await verificarPermisoGestionRoles(supabase, currentUser.id, project_id))) {
      return { success: false, error: "No tienes permiso para modificar roles en este proyecto.", errorCode: "FORBIDDEN" };
    }
    console.log(`✅ [${opId}] Permiso verificado para ${currentUser.id}`);

    if (updates.role_name && updates.role_name !== currentRoleData.role_name) {
        const { data: existingRoleWithNewName, error: checkNameError } = await supabase
            .from("project_roles")
            .select("id")
            .eq("project_id", project_id)
            .eq("role_name", updates.role_name)
            .neq("id", role_id)
            .maybeSingle();

        if (checkNameError) {
            console.error(`❌ [${opId}] Error verificando duplicidad de nuevo nombre de rol:`, checkNameError);
            return { success: false, error: `Error al verificar nuevo nombre de rol: ${checkNameError.message}` };
        }
        if (existingRoleWithNewName) {
            return { success: false, error: `Ya existe otro rol con el nombre "${updates.role_name}" en este proyecto.`, errorCode: "DUPLICATE_ROLENAME" };
        }
    }

    const { data: rolActualizado, error: updateError } = await supabase
      .from("project_roles")
      .update(updates)
      .eq("id", role_id)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ [${opId}] Error al actualizar rol:`, updateError);
      return { success: false, error: `Error al actualizar rol: ${updateError.message}` };
    }
    if (!rolActualizado) {
        return { success: false, error: "Error interno: Actualización de rol no retornó datos." };
    }

    console.log(`🎉 [${opId}] ÉXITO: Rol actualizado. ID: ${rolActualizado.id}`);
    return { success: true, data: rolActualizado };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
  }
}

// ========================================================================
//  ACTION 4: ELIMINAR ROL DE PROYECTO
// ========================================================================
export interface DeleteRolePayload {
  role_id: string;
  project_id: string;
}

export async function eliminarRolDeProyecto(
  payload: DeleteRolePayload
): Promise<ResultadoOperacion<null>> {
  const opId = `DRP-${Math.floor(Math.random() * 10000)}`;
  const { role_id, project_id } = payload;

  console.log(
    `📄 [${opId}] Iniciando eliminarRolDeProyecto: rol ID ${role_id} de proyecto ${project_id}`
  );

  if (!role_id || !project_id) {
    return { success: false, error: "Faltan IDs requeridos (role_id, project_id)." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }
    
    const { data: currentRoleData, error: fetchRoleError } = await supabase
      .from("project_roles")
      .select("project_id")
      .eq("id", role_id)
      .single();

    if (fetchRoleError) {
        console.error(`❌ [${opId}] Error obteniendo rol para eliminar:`, fetchRoleError);
        return { success: false, error: `Error al obtener datos del rol: ${fetchRoleError.message}`, errorCode: "FETCH_ERROR" };
    }
    if (!currentRoleData) {
        return { success: false, error: `Rol con ID ${role_id} no encontrado.`, errorCode: "ROLE_NOT_FOUND"};
    }
    if (currentRoleData.project_id !== project_id) {
        return { success: false, error: "Inconsistencia de datos: El rol no pertenece al proyecto indicado para eliminación.", errorCode: "DATA_MISMATCH"};
    }

    if (!(await verificarPermisoGestionRoles(supabase, currentUser.id, project_id))) {
      return { success: false, error: "No tienes permiso para eliminar roles de este proyecto.", errorCode: "FORBIDDEN" };
    }
    console.log(`✅ [${opId}] Permiso verificado para ${currentUser.id}`);

    // CORRECCIÓN: Usar .select('*', { count: 'exact', head: true }) para obtener solo el conteo
    const { count, error: checkUsageError } = await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true }) 
        .eq("project_role_id", role_id);
    
    if (checkUsageError) {
        console.error(`❌ [${opId}] Error verificando uso del rol:`, checkUsageError);
        return { success: false, error: `Error al verificar si el rol está en uso: ${checkUsageError.message}` };
    }

    const usageCount = count ?? 0; // count puede ser null si no hay registros que coincidan

    if (usageCount > 0) { 
        return { 
            success: false, 
            error: `Este rol está asignado a ${usageCount} miembro(s) y no puede ser eliminado. Reasigna los miembros a otro rol primero.`,
            errorCode: "ROLE_IN_USE" 
        };
    }

    console.log(`🗑️ [${opId}] Eliminando rol ${role_id}`);
    const { error: deleteError } = await supabase
      .from("project_roles")
      .delete()
      .eq("id", role_id);

    if (deleteError) {
      console.error(`❌ [${opId}] Error al eliminar rol:`, deleteError);
      return { success: false, error: `Error al eliminar rol: ${deleteError.message}` };
    }

    console.log(`🎉 [${opId}] ÉXITO: Rol eliminado del proyecto.`);
    return { success: true, data: null };
  } catch (error) {
    console.error(`❌ [${opId}] Excepción:`, error);
    return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
  }
}
// En lib/actions/project-role-actions.ts

// ... (otras actions y tipos) ...

// ========================================================================
//  ACTION: OBTENER DETALLES DE UN ROL ESPECÍFICO DEL PROYECTO
// ========================================================================
export async function obtenerDetallesRolProyecto(
  roleId: string,
  proyectoId: string // Esencial para el contexto y la seguridad
): Promise<ResultadoOperacion<ProjectRoleRow | null>> {
  const opId = `ODRP-${Math.floor(Math.random() * 10000)}`;
  console.log(`📄 [${opId}] Iniciando obtenerDetallesRolProyecto: rol ${roleId} en proyecto ${proyectoId}`);

  if (!roleId || !proyectoId) {
    return { success: false, error: "ID de rol y ID de proyecto son requeridos." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // No se necesita verificación de permisos explícita aquí si la RLS
    // en la tabla 'project_roles' ya asegura que el usuario solo pueda
    // leer roles del proyecto al que pertenece Y tiene permiso.
    // Sin embargo, filtrar por proyectoId aquí es una buena práctica adicional.
    const { data: rolData, error } = await supabase
      .from("project_roles")
      .select("*")
      .eq("id", roleId)
      .eq("project_id", proyectoId) // Asegurar que el rol sea del proyecto especificado
      .maybeSingle();

    if (error) {
      console.error(`❌ [${opId}] Error al obtener detalles del rol:`, error);
      return { success: false, error: `Error al obtener detalles del rol: ${error.message}` };
    }
    
    if (!rolData) {
      console.log(`ℹ️ [${opId}] Rol con ID ${roleId} no encontrado en proyecto ${proyectoId}.`);
      return { success: true, data: null }; // Es un éxito, pero no se encontraron datos
    }

    console.log(`🎉 [${opId}] ÉXITO: Detalles del rol obtenidos.`);
    return { success: true, data: rolData };

  } catch (err) {
    console.error(`❌ [${opId}] Excepción:`, err);
    return { success: false, error: `Error interno del servidor: ${(err as Error).message}` };
  }
}
// ========================================================================
//  DOCUMENTACIÓN PARA FRONTEND / IA ASISTENTE (sin cambios respecto a la versión anterior)
// ========================================================================
/*
SOBRE ESTE ARCHIVO (`project-role-actions.ts`)
Contiene Server Actions para gestionar los roles dentro de los proyectos.

ESTRUCTURA DE RETORNO COMÚN:
  - `success: true`, `data: T`
  - `success: false`, `error: string`, `errorCode?: string`

PERMISOS:
- Las acciones de escritura (agregar, modificar, eliminar) requieren que el usuario
  autenticado tenga el permiso `can_manage_master_data` en el proyecto.
- La función `obtenerRolesDelProyecto` es de solo lectura y puede ser llamada por
  cualquier miembro del proyecto (RLS en la tabla `project_roles` lo controla).

FUNCIONES DISPONIBLES:

1. obtenerRolesDelProyecto(proyectoId: string)
   - Propósito: Obtener la lista de roles de un proyecto.
   - Retorna: `ProjectRoleRow[]` (Array de objetos rol, cada uno con todas sus columnas).

2. agregarRolAProyecto(payload: AddRolePayload)
   - Propósito: Añadir un nuevo rol a un proyecto.
   - `payload`:
     - `project_id: string`
     - `role_name: string` (Nombre único para el rol dentro del proyecto)
     - `role_description?: string | null`
     - `can_manage_master_data?: boolean` (default: false)
     - `can_create_batches?: boolean` (default: false)
     - `can_upload_files?: boolean` (default: false)
     - `can_bulk_edit_master_data?: boolean` (default: false)
   - Retorna: `ProjectRoleRow` (El rol recién creado).
   - Errores Comunes (`errorCode`): `UNAUTHENTICATED`, `FORBIDDEN`, `DUPLICATE_ROLENAME`.

3. modificarRolEnProyecto(payload: ModifyRolePayload)
   - Propósito: Actualizar datos de un rol existente.
   - `payload`:
     - `role_id: string` (ID del rol a modificar)
     - `project_id: string` (Para validación de permisos)
     - `updates: Omit<Partial<ProjectRoleUpdate>, "id" | "project_id" | ...>`
       (Objeto con campos de `project_roles` a cambiar. Ej: `{ role_name: 'Nuevo Nombre Rol' }`)
   - Retorna: `ProjectRoleRow` (El rol actualizado).
   - Errores Comunes (`errorCode`): `NO_CHANGES`, `ROLE_NOT_FOUND`, `DATA_MISMATCH`, `FORBIDDEN`, `DUPLICATE_ROLENAME`.

4. eliminarRolDeProyecto(payload: DeleteRolePayload)
   - Propósito: Eliminar un rol de un proyecto.
   - `payload`:
     - `role_id: string` (ID del rol a eliminar)
     - `project_id: string` (Para validación de permisos)
   - Lógica Interna: Verifica si el rol está en uso por algún miembro antes de eliminar.
   - Retorna: `null` en `data` si es exitoso.
   - UI: SIEMPRE pedir confirmación al usuario antes de llamar.
   - Errores Comunes (`errorCode`): `ROLE_NOT_FOUND`, `DATA_MISMATCH`, `FORBIDDEN`, `ROLE_IN_USE`.
*/