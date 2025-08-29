// EN: lib/actions/article-group-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database, Tables } from "@/lib/database.types";

// ========================================================================
//  INTERFACES Y TIPOS
// ========================================================================

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

export interface GetGroupsFilters {
  articleId?: string;
  userId?: string;
}

export interface GetBulkGroupsPresenceFilters {
  articleIds: string[];
  userId?: string;
}

export type GroupWithArticleCount = Tables<'article_groups'> & {
    article_count: number;
};

export type GroupDetails = Tables<'article_groups'> & {
    items: {
        description: string | null;
        article_id: string;
        article_title: string | null;
    }[];
};

export interface CreateGroupPayload {
    projectId: string;
    name: string;
    description?: string;
    visibility: Database["public"]["Enums"]["group_visibility"];
    articleIds: string[];
}

export interface AddArticlesPayload {
    groupId: string;
    articleIds: string[];
}

export interface UpdateGroupPayload {
    groupId: string;
    name?: string;
    description?: string;
    visibility?: Database["public"]["Enums"]["group_visibility"];
}

export interface RemoveArticlePayload {
    groupId: string;
    articleId: string;
}


// ========================================================================
//  ACCIONES DE LECTURA (GET)
// ========================================================================

/**
 * Obtiene una lista de grupos aplicando filtros.
 * La RLS asegura que solo se devuelvan los grupos visibles para el usuario.
 */
export async function getGroups(filters: GetGroupsFilters): Promise<ResultadoOperacion<GroupWithArticleCount[]>> {
    try {
        const supabase = await createSupabaseServerClient();
        
        let query = supabase.from('article_groups').select('*, article_group_items(count)');

        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.articleId) {
            query = query.filter('article_group_items.article_id', 'eq', filters.articleId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData = data.map(group => ({
            ...group,
            article_count: group.article_group_items[0]?.count || 0
        }));

        return { success: true, data: formattedData };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudieron obtener los grupos: ${msg}` };
    }
}

/**
 * Obtiene los detalles completos de un grupo, incluyendo la lista de artículos que contiene.
 */
export async function getGroupDetails(groupId: string): Promise<ResultadoOperacion<GroupDetails | null>> {
    try {
        const supabase = await createSupabaseServerClient();
        
        const { data, error } = await supabase
            .from('article_groups')
            .select(`
                *,
                items:article_group_items (
                    description,
                    article_id:articles (id, title)
                )
            `)
            .eq('id', groupId)
            .single();

        if (error) throw error;

        // Formatear la respuesta para que sea más amigable para el frontend
        // Definir el tipo para el ítem de la respuesta de la base de datos
        type GroupItemResponse = {
            description: string | null;
            article_id: {
                id: string;
                title: string | null;
            };
        };

        const formattedData: GroupDetails = {
            ...data,
            items: data.items.map((item: GroupItemResponse) => ({
                description: item.description,
                article_id: item.article_id.id,
                article_title: item.article_id.title
            }))
        };
        
        return { success: true, data: formattedData };

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudieron obtener los detalles del grupo: ${msg}` };
    }
}


// ========================================================================
//  ACCIONES DE ESCRITURA (WRITE)
// ========================================================================

/**
 * Crea un nuevo grupo y le añade una lista inicial de artículos.
 */
export async function createGroupWithArticles(payload: CreateGroupPayload): Promise<ResultadoOperacion<Tables<'article_groups'>>> {
    const supabase = await createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Usuario no autenticado." };

        // 1. Crear el grupo
        const { data: newGroup, error: groupError } = await supabase
            .from('article_groups')
            .insert({
                project_id: payload.projectId,
                user_id: user.id,
                name: payload.name,
                description: payload.description,
                visibility: payload.visibility
            })
            .select()
            .single();

        if (groupError) throw groupError;

        // 2. Añadir los artículos iniciales al grupo
        const itemsToInsert = payload.articleIds.map(articleId => ({
            group_id: newGroup.id,
            article_id: articleId,
            user_id: user.id
        }));

        // Permitir crear grupos vacíos sin insertar ítems
        if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase.from('article_group_items').insert(itemsToInsert);
            if (itemsError) throw itemsError; // Si esto falla, el grupo ya fue creado. Se podría añadir lógica de rollback.
        }

        return { success: true, data: newGroup };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudo crear el grupo: ${msg}` };
    }
}


/**
 * Añade uno o más artículos a un grupo existente.
 */
export async function addArticlesToGroup(payload: AddArticlesPayload): Promise<ResultadoOperacion<null>> {
    const supabase = await createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Usuario no autenticado." };

        const itemsToInsert = payload.articleIds.map(articleId => ({
            group_id: payload.groupId,
            article_id: articleId,
            user_id: user.id
        }));

        const { error } = await supabase.from('article_group_items').insert(itemsToInsert);
        if (error) throw error;

        return { success: true, data: null };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudieron añadir los artículos: ${msg}` };
    }
}

/**
 * Actualiza los detalles de un grupo. RLS asegura que solo el creador pueda hacerlo.
 */
export async function updateGroupDetails(payload: UpdateGroupPayload): Promise<ResultadoOperacion<Tables<'article_groups'>>> {
     const supabase = await createSupabaseServerClient();
    try {
        const { groupId, ...updateData } = payload;
        const { data, error } = await supabase
            .from('article_groups')
            .update(updateData)
            .eq('id', groupId)
            .select()
            .single();
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudo actualizar el grupo: ${msg}` };
    }
}


/**
 * Elimina un artículo de un grupo. RLS asegura que solo quien lo añadió pueda quitarlo.
 */
export async function removeArticleFromGroup(payload: RemoveArticlePayload): Promise<ResultadoOperacion<null>> {
    const supabase = await createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Usuario no autenticado." };

        const { error } = await supabase
            .from('article_group_items')
            .delete()
            .eq('group_id', payload.groupId)
            .eq('article_id', payload.articleId)
            .eq('user_id', user.id); // RLS ya protege esto, pero ser explícito es más seguro.

        if (error) throw error;
        return { success: true, data: null };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudo quitar el artículo del grupo: ${msg}` };
    }
}

/**
 * Obtiene la presencia de grupos para múltiples artículos de forma optimizada.
 * Retorna un mapa de article_id -> boolean indicando si tiene grupos.
 */
export async function getBulkGroupsPresence(filters: GetBulkGroupsPresenceFilters): Promise<ResultadoOperacion<Record<string, boolean>>> {
    try {
        const supabase = await createSupabaseServerClient();
        
        if (filters.articleIds.length === 0) {
            return { success: true, data: {} };
        }

        // Consulta optimizada: obtener todos los article_ids que tienen grupos en una sola query
        let query = supabase
            .from('article_group_items')
            .select('article_id')
            .in('article_id', filters.articleIds);

        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Crear mapa de presencia
        const presenceMap: Record<string, boolean> = {};
        const articlesWithGroups = new Set(data.map(item => item.article_id));
        
        // Inicializar todos como false, luego marcar los que tienen grupos como true
        filters.articleIds.forEach(articleId => {
            presenceMap[articleId] = articlesWithGroups.has(articleId);
        });

        return { success: true, data: presenceMap };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudo obtener la presencia de grupos: ${msg}` };
    }
}

/**
 * Elimina un grupo completo. RLS asegura que solo el creador pueda hacerlo.
 */
export async function deleteGroup(groupId: string): Promise<ResultadoOperacion<null>> {
    const supabase = await createSupabaseServerClient();
    try {
        const { error } = await supabase.from('article_groups').delete().eq('id', groupId);
        if (error) throw error;
        return { success: true, data: null };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, error: `No se pudo eliminar el grupo: ${msg}` };
    }
}