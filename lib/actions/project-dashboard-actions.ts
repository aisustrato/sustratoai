
"use server";

import { createSupabaseServerClient } from "@/lib/server";

// ========================================================================
//  INICIO: DEFINICIONES DE INTERFACES Y TIPOS
// ========================================================================
export interface Project { 
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  institution_name?: string | null;
  status?: string | null; 
  module_bibliography?: boolean | null;
  module_interviews?: boolean | null;
  module_planning?: boolean | null;
  // lead_researcher_user_id?: string | null; // Ya presente en Database['public']['Tables']['projects']['Row']
}

export interface UserProfile {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_institution?: string | null;
  contact_phone?: string | null;
  general_notes?: string | null;
  public_display_name?: string | null;
  public_contact_email?: string | null;
  preferred_language?: string | null;
  pronouns?: string | null;
}

export interface RolePermissions {
  role_name?: string | null;
  can_manage_master_data?: boolean | null;
  can_create_batches?: boolean | null;
  can_upload_files?: boolean | null;
  can_bulk_edit_master_data?: boolean | null;
}

export interface UserProjectSetting extends Project {
  project_role_id: string;
  ui_theme: string | null;
  ui_font_pair: string | null;
  ui_is_dark_mode: boolean | null;
  is_active_for_user: boolean;
  contextual_notes?: string | null;
  contact_email_for_project?: string | null;
  permissions?: RolePermissions | null;
}

export interface UserDashboardData {
  profile: UserProfile | null;
  projects: UserProjectSetting[];
}

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string }; 

// ========================================================================
//  FIN: DEFINICIONES DE INTERFACES Y TIPOS
// ========================================================================

export async function obtenerProyectosConSettingsUsuario(
  userId: string
): Promise<ResultadoOperacion<UserProjectSetting[]>> {
  const opId = Math.floor(Math.random() * 1000);
  console.log(
    `📄 [PCSU:${opId}] Iniciando obtenerProyectosConSettingsUsuario para: ${userId.substring(0,8)}...`
  );

  try {
    if (!userId || userId.trim() === "") {
      return { success: false, error: "Se requiere un ID de usuario válido" };
    }
    const supabase = await createSupabaseServerClient();

    const { data: authContextResult, error: rpcError } = await supabase.rpc(
      "get_current_auth_context"
    );
    if (rpcError) {
      return { success: false, error: `RPC Error: ${rpcError.message}` };
    }
    if ( !authContextResult || !Array.isArray(authContextResult) || authContextResult.length === 0 ) {
      return { success: false, error: "RPC Auth context no válido" };
    }
    const authContext = authContextResult[0];
    if ( !authContext || typeof authContext !== "object" || !("current_uid" in authContext) || !("current_role" in authContext) ) {
      return { success: false, error: "RPC Auth context formato inválido" };
    }
    const { current_uid, current_role } = authContext as { current_uid: string | null; current_role: string | null; };
    if (current_role !== "authenticated") {
      return { success: false, error: `Rol no autenticado: ${current_role}` };
    }
    // Esta línea estaba antes, la mantengo por si es intencional, aunque current_uid debería ser el userId si la llamada es autenticada.
    if (current_uid !== userId && current_uid) { 
      console.warn(`[PCSU:${opId}] El userId proporcionado (${userId.substring(0,8)}) difiere del current_uid del contexto DB (${current_uid.substring(0,8)}). Usando current_uid.`);
      userId = current_uid; 
    }
    console.log(`✅ [PCSU:${opId}] Contexto de DB validado correctamente para usuario: ${userId.substring(0,8)}`);

    const { data: membresias, error: errorMembresias } = await supabase
      .from("project_members")
      .select(
        `
        project_role_id, 
        is_active_for_user,
        ui_theme,
        ui_font_pair,
        ui_is_dark_mode,
        contextual_notes,
        contact_email_for_project,
        joined_at,
        updated_at,
        projects (
          id,
          name,
          code,
          description,
          institution_name,
          status,
          module_bibliography,
          module_interviews,
          module_planning
        ),
        project_roles (
          role_name,
          can_manage_master_data,
          can_create_batches,
          can_upload_files,
          can_bulk_edit_master_data
        )
      `
      )
      .eq("user_id", userId);

    if (errorMembresias) {
      console.error(`❌ [PCSU:${opId}] Error al obtener membresías:`, errorMembresias);
      return { success: false, error: `Error al obtener membresías: ${errorMembresias.message}` };
    }

    if (!membresias || membresias.length === 0) {
      console.log(`ℹ️ [PCSU:${opId}] No se encontraron membresías para el usuario.`);
      return { success: true, data: [] };
    }

    const proyectosConSettings: UserProjectSetting[] = membresias
      .map((m): UserProjectSetting | null => { 
        let proyectoBase: Project | null = null;
        const rawProjectDataFromMember = m.projects; 

        if (rawProjectDataFromMember && Array.isArray(rawProjectDataFromMember) && rawProjectDataFromMember.length > 0) {
            proyectoBase = rawProjectDataFromMember[0] as Project; 
        } else if (rawProjectDataFromMember && typeof rawProjectDataFromMember === 'object' && !Array.isArray(rawProjectDataFromMember) && rawProjectDataFromMember !== null && 'id' in rawProjectDataFromMember) {
            proyectoBase = rawProjectDataFromMember as Project;
        } else {
            console.warn(`[PCSU:${opId}] Datos de proyecto inesperados o nulos para membresía. Datos de 'm.projects':`, rawProjectDataFromMember);
        }
        
        if (!proyectoBase || !proyectoBase.id) { 
          console.warn(`[PCSU:${opId}] 'proyectoBase' es nulo o no tiene ID después del procesamiento. Saltando esta membresía. Datos de membresía:`, m);
          return null;
        }

        const rolePermissionsData = m.project_roles as RolePermissions | null;
        const permissions: RolePermissions | null = rolePermissionsData
          ? {
              role_name: rolePermissionsData.role_name ?? null,
              can_manage_master_data: rolePermissionsData.can_manage_master_data ?? false,
              can_create_batches: rolePermissionsData.can_create_batches ?? false,
              can_upload_files: rolePermissionsData.can_upload_files ?? false,
              can_bulk_edit_master_data: rolePermissionsData.can_bulk_edit_master_data ?? false,
            }
          : null;

        return {
          id: String(proyectoBase.id), 
          name: proyectoBase.name,     
          code: proyectoBase.code ?? null,
          description: proyectoBase.description ?? null,
          institution_name: proyectoBase.institution_name ?? null,
          status: proyectoBase.status ?? null,
          module_bibliography: proyectoBase.module_bibliography ?? null,
          module_interviews: proyectoBase.module_interviews ?? null,
          module_planning: proyectoBase.module_planning ?? null,
          project_role_id: m.project_role_id!, 
          is_active_for_user: m.is_active_for_user ?? false,
          ui_theme: m.ui_theme ?? null,
          ui_font_pair: m.ui_font_pair ?? null,
          ui_is_dark_mode: m.ui_is_dark_mode ?? false,
          contextual_notes: m.contextual_notes ?? null,
          contact_email_for_project: m.contact_email_for_project ?? null,
          permissions,
        };
      })
      .filter((p): p is UserProjectSetting => p !== null); 

    console.log(`🎉 [PCSU:${opId}] ÉXITO: ${proyectosConSettings.length} proyectos con settings obtenidos.`);
    // Tu log detallado JSON.stringify va aquí si lo deseas
    return { success: true, data: proyectosConSettings };

  } catch (error) {
    console.error(`❌ [PCSU:${opId}] Excepción:`, error);
    return { success: false, error: `Error interno: ${(error as Error).message}` };
  }
}

export async function cargarDatosDashboardUsuario(
  userId: string
): Promise<ResultadoOperacion<UserDashboardData>> {
  // TU CÓDIGO ORIGINAL AQUÍ (ASEGÚRATE DE MANEJAR ResultadoOperacion)
  // Ejemplo de cómo debería ser el manejo si proyectosSettingsResultado falla:
  // if (!proyectosSettingsResultado.success) {
  //   return { success: false, error: proyectosSettingsResultado.error };
  // }
  // const dashboardData: UserDashboardData = {
  //   profile: profileData as UserProfile | null,
  //   projects: proyectosSettingsResultado.data, // Aquí data es UserProjectSetting[]
  // };
  // return { success: true, data: dashboardData };
  // --- PEGANDO TU CÓDIGO ORIGINAL ---
  const opId = Math.floor(Math.random() * 1000);
  console.log(`📄 [CDDU:${opId}] Iniciando cargarDatosDashboardUsuario para: ${userId.substring(0,8)}...`);
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profileData, error: profileError } = await supabase.from("users_profiles").select(`user_id, first_name, last_name, public_display_name, public_contact_email, primary_institution, contact_phone, general_notes, preferred_language, pronouns`).eq("user_id", userId).single();
    if (profileError && profileError.code !== "PGRST116") { console.error(`❌ [CDDU:${opId}] Error obteniendo perfil:`, profileError); return { success: false, error: `Error obteniendo perfil: ${profileError.message}` }; }
    const proyectosSettingsResultado = await obtenerProyectosConSettingsUsuario(userId);
    if (!proyectosSettingsResultado.success) { console.error(`❌ [CDDU:${opId}] Error obteniendo proyectos con settings:`, proyectosSettingsResultado.error); return { success: false, error: proyectosSettingsResultado.error }; }
    const dashboardData: UserDashboardData = { profile: profileData as UserProfile | null, projects: proyectosSettingsResultado.data, };
    console.log(`🎉 [CDDU:${opId}] ÉXITO: Datos del dashboard cargados. Perfil: ${profileData ? "OK" : "No encontrado"}, Proyectos: ${dashboardData.projects.length}`);
    console.log(`👤 [CDDU:${opId}] DETALLE DEL PERFIL:`, JSON.stringify(dashboardData.profile, null, 2));
    console.log(`🎨 [CDDU:${opId}] CONFIGURACIONES DE UI POR PROYECTO:`);
    dashboardData.projects.forEach((project) => { console.log(`  - Proyecto "${project.name}" (${project.id.substring(0,8)}...): • Tema UI: ${project.ui_theme || "No configurado"} • Par de Fuentes: ${project.ui_font_pair || "No configurado"} • Modo Oscuro: ${project.ui_is_dark_mode ? "Activado" : "Desactivado"}`); });
    return { success: true, data: dashboardData };
  } catch (error) { console.error(`❌ [CDDU:${opId}] Excepción:`, error); return { success: false, error: `Error interno: ${(error as Error).message}` }; }
}

export async function obtenerProyectoPorId(
  proyectoId: string
): Promise<ResultadoOperacion<Project | null>> {
  const opId = Math.floor(Math.random() * 1000);
  console.log(`📄 [PPI:${opId}] Iniciando obtenerProyectoPorId para: ${proyectoId}`);
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("projects").select("id, name, code, description, institution_name, status, module_bibliography, module_interviews, module_planning").eq("id", proyectoId).single();
    if (error) {
      if (error.code === "PGRST116") { return { success: true, data: null }; }
      return { success: false, error: `Error al obtener proyecto: ${error.message}` };
    }
    return { success: true, data: data as Project };
  } catch (error) {
    return { success: false, error: `Error interno: ${(error as Error).message}` };
  }
}

export async function obtenerPerfilesMiembrosProyecto(
  proyectoId: string
): Promise<ResultadoOperacion<UserProfile[]>> {
  // TU CÓDIGO ORIGINAL AQUÍ
  // --- PEGANDO TU CÓDIGO ORIGINAL ---
  const opId = Math.floor(Math.random() * 1000);
  console.log(`📄 [PMP:${opId}] Iniciando obtenerPerfilesMiembrosProyecto para: ${proyectoId}`);
  try {
    const supabase = await createSupabaseServerClient();
    const { data: miembros, error } = await supabase.from("project_members").select(`user_id, project_role_id, users_profiles (user_id, first_name, last_name, primary_institution, contact_phone, general_notes, public_display_name, public_contact_email, preferred_language, pronouns)`).eq("project_id", proyectoId);
    if (error) { return { success: false, error: `Error obteniendo miembros: ${(error as Error).message}` }; }
    if (!miembros) { return { success: true, data: [] }; }
    const perfiles: UserProfile[] = miembros.map((m) => { const perfilData = m.users_profiles; if (perfilData && typeof perfilData === "object" && "user_id" in perfilData) { return perfilData as UserProfile; } return null; }).filter((p): p is UserProfile => p !== null);
    console.log(`🎉 [PMP:${opId}] ÉXITO: ${perfiles.length} perfiles encontrados para proyecto ${proyectoId}.`);
    return { success: true, data: perfiles };
  } catch (error) { return { success: false, error: `Error interno: ${(error as Error).message}` }; }
}

export async function actualizarPreferenciasUI(
  userId: string,
  proyectoId: string,
  preferencias: { ui_theme?: string | null; ui_font_pair?: string | null; ui_is_dark_mode?: boolean | null; }
): Promise<ResultadoOperacion<null>> {
  // TU CÓDIGO ORIGINAL AQUÍ
  // --- PEGANDO TU CÓDIGO ORIGINAL ---
  const opId = Math.floor(Math.random() * 1000);
  console.log(`📄 [APU:${opId}] Iniciando actualizarPreferenciasUI para usuario: ${userId.substring(0,8)}, proyecto: ${proyectoId.substring(0, 8)}`);
  try {
    if (!userId || !proyectoId) { return { success: false, error: "Se requiere ID de usuario y proyecto válidos" }; }
    const supabase = await createSupabaseServerClient();
    // Creamos un objeto de actualización con los campos que se van a modificar
    const actualizaciones: Record<string, unknown> = {};
    
    // Solo agregamos los campos que tienen valores definidos
    if (preferencias.ui_theme !== undefined) {
      actualizaciones.ui_theme = preferencias.ui_theme;
    }
    if (preferencias.ui_font_pair !== undefined) {
      actualizaciones.ui_font_pair = preferencias.ui_font_pair;
    }
    if (preferencias.ui_is_dark_mode !== undefined) {
      // Aseguramos que sea un booleano o null, según lo que espere la base de datos
      actualizaciones.ui_is_dark_mode = preferencias.ui_is_dark_mode;
    }
    if (Object.keys(actualizaciones).length === 0) { console.log(`ℹ️ [APU:${opId}] No hay cambios que actualizar`); return { success: true, data: null }; }
    console.log(`📝 [APU:${opId}] Actualizando preferencias:`, actualizaciones);
    const { error } = await supabase.from("project_members").update(actualizaciones).eq("user_id", userId).eq("project_id", proyectoId);
    if (error) { console.error(`❌ [APU:${opId}] Error al actualizar preferencias:`, error); return { success: false, error: `Error al actualizar preferencias: ${error.message}` }; }
    console.log(`✅ [APU:${opId}] Preferencias actualizadas exitosamente`);
    return { success: true, data: null };
  } catch (error) { console.error(`❌ [APU:${opId}] Excepción:`, error); return { success: false, error: `Error interno: ${(error as Error).message}` }; }
}

export async function actualizarProyectoActivo(
  userId: string,
  proyectoId: string
): Promise<ResultadoOperacion<null>> {
  // TU CÓDIGO ORIGINAL AQUÍ
  // --- PEGANDO TU CÓDIGO ORIGINAL ---
  const opId = Math.floor(Math.random() * 1000);
  console.log(`📄 [APA:${opId}] Iniciando actualizarProyectoActivo para usuario: ${userId.substring(0,8)}, proyecto: ${proyectoId.substring(0, 8)}`);
  try {
    if (!userId || !proyectoId) { return { success: false, error: "Se requiere ID de usuario y proyecto válidos" }; }
    const supabase = await createSupabaseServerClient();
    console.log(`🔄 [APA:${opId}] Desactivando todos los proyectos del usuario`);
    const { error: desactivarError } = await supabase.from("project_members").update({ is_active_for_user: false }).eq("user_id", userId);
    if (desactivarError) { console.error(`❌ [APA:${opId}] Error al desactivar proyectos:`, desactivarError); return { success: false, error: `Error al desactivar proyectos: ${desactivarError.message}` }; }
    console.log(`🔄 [APA:${opId}] Activando proyecto seleccionado`);
    const { error: activarError } = await supabase.from("project_members").update({ is_active_for_user: true }).eq("user_id", userId).eq("project_id", proyectoId);
    if (activarError) { console.error(`❌ [APA:${opId}] Error al activar proyecto:`, activarError); return { success: false, error: `Error al activar proyecto: ${activarError.message}` }; }
    console.log(`✅ [APA:${opId}] Proyecto activo actualizado exitosamente`);
    return { success: true, data: null };
  } catch (error) { console.error(`❌ [APA:${opId}] Excepción:`, error); return { success: false, error: `Error interno: ${(error as Error).message}` }; }
}
