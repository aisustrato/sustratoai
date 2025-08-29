// EN: lib/actions/article-notes-actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database, Tables } from "@/lib/database.types";

// ========================================================================
//  INTERFACES Y TIPOS
// ========================================================================

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

// --- INTERFAZ RESTAURADA ---
export interface GetNotesFilters {
  noteId?: string;
  articleId?: string;
  authorId?: string;
  visibility?: Database["public"]["Enums"]["note_visibility"];
  projectId?: string;
}

// Usamos el tipo inferido de la vista para mayor precisión
export type DetailedNote = Tables<'detailed_article_notes'> & {
  // Enriquecimiento opcional con el título del artículo relacionado
  article_title?: string | null;
};

// Tipo auxiliar para el JOIN con articles(title)
type DetailedNoteJoined = Tables<'detailed_article_notes'> & {
  articles?: { title: string | null } | null;
};

// --- INTERFAZ ACTUALIZADA ---
export interface CreateNotePayload {
  projectId: string;
  articleId: string;
  title?: string;
  noteContent: string;
  visibility: Database["public"]["Enums"]["note_visibility"];
  userId?: string; // Para validación en el servidor
}

// --- INTERFAZ ACTUALIZADA ---
export interface UpdateNotePayload {
  noteId: string;
  title?: string;
  noteContent?: string;
  visibility?: Database["public"]["Enums"]["note_visibility"];
  userId?: string; // Para validación en el servidor
  projectId?: string; // Para validación en el servidor
}


// ========================================================================
//  ACCIONES PARA NOTAS DE ARTÍCULOS
// ========================================================================

/**
 * Obtiene notas aplicando un conjunto flexible de filtros, usando la vista 'detailed_article_notes'.
 */
export async function getNotes(filters: GetNotesFilters): Promise<ResultadoOperacion<DetailedNote[]>> {
  console.log('[SERVER] getNotes - Iniciando con filtros:', JSON.stringify(filters, null, 2));
  
  try {
    const supabase = await createSupabaseServerClient();
    console.log('[SERVER] Cliente Supabase creado');
    // Obtener y loggear usuario autenticado (útil para diagnosticar RLS)
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[SERVER] Usuario autenticado:', user ? { id: user.id, email: user.email } : 'No autenticado');
    
    let query = supabase
      .from('detailed_article_notes')
      // Traemos también el título del artículo vía relación
      .select('*, articles(title)');
    
    // Aplicar filtros si existen
    if (filters.noteId) {
      console.log(`[SERVER] Aplicando filtro por ID de nota: ${filters.noteId}`);
      query = query.eq('id', filters.noteId);
    }
    if (filters.articleId) {
      console.log(`[SERVER] Aplicando filtro por ID de artículo: ${filters.articleId}`);
      query = query.eq('article_id', filters.articleId);
    }
    if (filters.authorId) {
      console.log(`[SERVER] Aplicando filtro por ID de autor: ${filters.authorId}`);
      query = query.eq('user_id', filters.authorId);
    }
    if (filters.visibility) {
      console.log(`[SERVER] Aplicando filtro por visibilidad: ${filters.visibility}`);
      query = query.eq('visibility', filters.visibility);
    }
    if (filters.projectId) {
      console.log(`[SERVER] Aplicando filtro por ID de proyecto: ${filters.projectId}`);
      query = query.eq('project_id', filters.projectId);
    }
    
    console.log('[SERVER] Ejecutando consulta...');
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[SERVER] Error al obtener notas:', error);
      throw error;
    }
    
    console.log(`[SERVER] Se encontraron ${data?.length || 0} notas`);
    // Mapear para aplanar articles.title -> article_title sin usar 'any'
    const raw: DetailedNoteJoined[] = (data || []) as DetailedNoteJoined[];
    const enriched: DetailedNote[] = raw.map((n) => {
      const { articles, ...rest } = n;
      const article_title = articles?.title ?? null;
      return { ...(rest as Tables<'detailed_article_notes'>), article_title } as DetailedNote;
    });

    if (enriched.length > 0) {
      const sample = enriched.slice(0, 3).map((n) => ({
        id: n.id,
        project_id: (n as Tables<'detailed_article_notes'>).project_id,
        article_id: n.article_id,
        user_id: n.user_id,
        visibility: n.visibility,
        article_title: n.article_title,
      }));
      console.log('[SERVER] Muestra de resultados (enriched):', sample);
    }

    return { success: true, data: enriched };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error('[SERVER] Error en getNotes:', errorMessage, error);
    return { 
      success: false, 
      error: `No se pudieron obtener las notas: ${errorMessage}`,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Crea una nueva nota para un artículo.
 */
export async function createArticleNote(payload: CreateNotePayload): Promise<ResultadoOperacion<DetailedNote | null>> {
  console.log('[SERVER] createArticleNote - Iniciando con payload:', JSON.stringify(payload, null, 2));
  
  try {
    const supabase = await createSupabaseServerClient();
    console.log('[SERVER] Cliente Supabase creado');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[SERVER] Usuario obtenido:', user ? 'Autenticado' : 'No autenticado');
    
    if (!user) {
      console.error('[SERVER] Error: Usuario no autenticado');
      return { success: false, error: "Usuario no autenticado." };
    }

    console.log('[SERVER] Creando nota en la base de datos...');
    const { data: newNote, error } = await supabase
      .from('article_notes')
      .insert({
        project_id: payload.projectId,
        article_id: payload.articleId,
        user_id: user.id,
        title: payload.title || 'sin título',
        note_content: payload.noteContent,
        visibility: payload.visibility,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SERVER] Error al crear la nota:', error);
      throw error;
    }
    
    console.log('[SERVER] Nota creada con ID:', newNote.id);
    
    const { data: detailedNewNote, error: fetchError } = await supabase
      .from('detailed_article_notes')
      .select('*')
      .eq('id', newNote.id)
      .single();

    if (fetchError) {
      console.error('[SERVER] Error al obtener la nota detallada:', fetchError);
      throw fetchError;
    }

    console.log('[SERVER] Nota creada exitosamente:', detailedNewNote);
    return { success: true, data: detailedNewNote as DetailedNote };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error('[SERVER] Error en createArticleNote:', errorMessage, error);
    return { 
      success: false, 
      error: `No se pudo crear la nota: ${errorMessage}`,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Actualiza una nota existente. La RLS asegura que solo el autor pueda hacerlo.
 */
export async function updateArticleNote(payload: UpdateNotePayload): Promise<ResultadoOperacion<DetailedNote | null>> {
  console.log('[SERVER] updateArticleNote - Iniciando con payload:', JSON.stringify(payload, null, 2));
  
  try {
    const supabase = await createSupabaseServerClient();
    console.log('[SERVER] Cliente Supabase creado');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[SERVER] Usuario obtenido:', user ? 'Autenticado' : 'No autenticado');
    
    if (!user) {
      console.error('[SERVER] Error: Usuario no autenticado');
      return { success: false, error: "Usuario no autenticado." };
    }

    const updateData: {
      updated_at: string;
      title?: string;
      note_content?: string;
      visibility?: Database["public"]["Enums"]["note_visibility"];
    } = { 
      updated_at: new Date().toISOString() 
    };
    
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.noteContent !== undefined) updateData.note_content = payload.noteContent;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;

    console.log('[SERVER] Actualizando nota con datos:', updateData);
    
    const { error } = await supabase
      .from('article_notes')
      .update(updateData)
      .eq('id', payload.noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[SERVER] Error al actualizar la nota:', error);
      throw error;
    }
    
    console.log('[SERVER] Nota actualizada, obteniendo detalles...');
    
    const { data: detailedNote, error: fetchError } = await supabase
      .from('detailed_article_notes')
      .select('*')
      .eq('id', payload.noteId)
      .single();

    if (fetchError) {
      console.error('[SERVER] Error al obtener la nota detallada actualizada:', fetchError);
      throw fetchError;
    }

    console.log('[SERVER] Nota actualizada exitosamente:', detailedNote);
    return { success: true, data: detailedNote as DetailedNote };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error('[SERVER] Error en updateArticleNote:', errorMessage, error);
    return { 
      success: false, 
      error: `No se pudo actualizar la nota: ${errorMessage}`,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Elimina una nota existente. La RLS asegura que solo el autor pueda hacerlo.
 */
export async function deleteArticleNote(noteId: string): Promise<ResultadoOperacion<{ id: string }>> {
  console.log(`[SERVER] deleteArticleNote - Iniciando eliminación de nota con ID: ${noteId}`);
  
  try {
    // Validación de entrada
    if (!noteId || typeof noteId !== 'string' || noteId.trim().length === 0) {
      console.error('[SERVER] deleteArticleNote - ID de nota inválido');
      return { success: false, error: 'ID de nota inválido.', errorCode: 'INVALID_INPUT' };
    }

    const supabase = await createSupabaseServerClient();
    console.log('[SERVER] Cliente Supabase creado');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[SERVER] Usuario obtenido:', user ? 'Autenticado' : 'No autenticado');
    
    if (!user) {
      console.error('[SERVER] Error: Usuario no autenticado');
      return { success: false, error: "Usuario no autenticado." };
    }

    console.log(`[SERVER] Eliminando nota con ID: ${noteId} para el usuario: ${user.id}`);
    
    const { data: deletedNote, error } = await supabase
      .from('article_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select('id')
      .single();

    if (error) {
      // Manejo específico: 0 filas encontradas (no existe o no autorizado por RLS)
      const errMsg = error?.message || error?.details || '';
      const errCode = error?.code || '';
      const isNoRows = errCode === 'PGRST116' || /Results contain 0 rows/i.test(errMsg);
      if (isNoRows) {
        console.warn('[SERVER] Nota no encontrada o sin permisos para eliminarla');
        return { success: false, error: 'Nota no encontrada o sin permisos para eliminarla.', errorCode: 'NOT_FOUND_OR_FORBIDDEN' };
      }
      console.error('[SERVER] Error al eliminar la nota:', error);
      return { success: false, error: `No se pudo eliminar la nota: ${errMsg || 'Error desconocido'}`, errorCode: errCode || 'DELETE_ERROR' };
    }
    
    if (!deletedNote) {
      console.error('[SERVER] No se pudo obtener la nota eliminada');
      return { 
        success: false, 
        error: 'No se pudo confirmar la eliminación de la nota',
        errorCode: 'DELETE_CONFIRMATION_FAILED'
      };
    }
    
    console.log(`[SERVER] Nota eliminada exitosamente: ${deletedNote.id}`);
    return { 
      success: true, 
      data: { id: deletedNote.id } 
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error('[SERVER] Error en deleteArticleNote:', errorMessage, error);
    return { 
      success: false, 
      error: `No se pudo eliminar la nota: ${errorMessage}`,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    };
  }
}

// ========================================================================
//  RPC: get_article_notes_info_by_batch_item
// ========================================================================

export interface NotesInfoByBatchItem {
  articleId: string | null;
  hasNotes: boolean;
  noteIds: string[];
  noteCount: number;
}

/**
 * Dado un article_batch_item_id retorna información agregada de notas del artículo
 * asociado: articleId, hasNotes, noteIds y noteCount. Usa la RPC
 * `get_article_notes_info_by_batch_item` definida en la base de datos.
 */
export async function getArticleNotesInfoByBatchItem(
  batchItemId: string
): Promise<ResultadoOperacion<NotesInfoByBatchItem>> {
  if (!batchItemId || typeof batchItemId !== 'string' || batchItemId.trim().length === 0) {
    return { success: false, error: 'Se requiere el ID del ítem del lote.' }
  }
  try {
    const supabase = await createSupabaseServerClient();
    const ts = () => new Date().toISOString();
    const started = performance.now();
    type RpcNotesInfoRow = {
      article_id: string | null;
      has_notes: boolean | null;
      note_ids: string[] | null;
      note_count: number | null;
    };
    console.log(`[${ts()}] [notes-rpc] Llamando RPC get_article_notes_info_by_batch_item`, { batchItemId });
    const { data, error } = await supabase.rpc('get_article_notes_info_by_batch_item', {
      batch_item_id: batchItemId,
    });

    if (!error && data) {
      // ✅ Camino principal por RPC
      // La RPC retorna una tabla; supabase usualmente la entrega como array de filas
      const row = (Array.isArray(data) ? data?.[0] : data) as RpcNotesInfoRow | null;

      const result: NotesInfoByBatchItem = {
        articleId: row?.article_id ?? null,
        hasNotes: Boolean(row?.has_notes ?? false),
        noteIds: row?.note_ids ?? [],
        noteCount: row?.note_count ?? 0,
      };
      const ms = Math.round(performance.now() - started);
      console.log(`[${ts()}] [notes-rpc] RPC OK`, { batchItemId, ms, hasNotes: result.hasNotes, noteCount: result.noteCount });
      return { success: true, data: result };
    }

    // 🔁 Fallback si la RPC no existe o falla (útil mientras se ejecuta el SQL en Supabase)
    console.warn(`[${ts()}] [notes-rpc] RPC no disponible o sin datos. Activando fallback...`, {
      rpcError: error?.message || null,
    });
    const fallbackStarted = performance.now();

    // 1) Obtener article_id desde article_batch_items
    const { data: abiRow, error: abiError } = await supabase
      .from('article_batch_items')
      .select('article_id')
      .eq('id', batchItemId)
      .single();

    if (abiError) {
      console.error('[SERVER] Fallback: error obteniendo article_id desde article_batch_items', abiError);
      return { success: false, error: `No se pudo obtener el artículo del ítem: ${abiError.message}` };
    }

    const aid = (abiRow as { article_id: string | null } | null)?.article_id ?? null;
    if (!aid) {
      console.warn('[SERVER] Fallback: article_id no encontrado para el ítem. Retornando vacío.');
      return { success: true, data: { articleId: null, hasNotes: false, noteIds: [], noteCount: 0 } };
    }

    // 2) Listar/contar notas visibles por RLS para ese artículo
    const { data: notesRows, error: notesError, count } = await supabase
      .from('article_notes')
      .select('id', { count: 'exact' })
      .eq('article_id', aid);

    if (notesError) {
      console.error('[SERVER] Fallback: error consultando notas del artículo', notesError);
      return { success: false, error: `No se pudieron obtener notas del artículo: ${notesError.message}` };
    }

    const noteIds = (notesRows || []).map((r: { id: string }) => r.id);
    const noteCount = typeof count === 'number' ? count : noteIds.length;

    const fallbackResult: NotesInfoByBatchItem = {
      articleId: aid,
      hasNotes: noteCount > 0,
      noteIds,
      noteCount,
    };

    const totalMs = Math.round(performance.now() - started);
    const fallbackMs = Math.round(performance.now() - fallbackStarted);
    console.log(`[${ts()}] [notes-rpc] Fallback OK`, { batchItemId, totalMs, fallbackMs, hasNotes: fallbackResult.hasNotes, noteCount: fallbackResult.noteCount });
    return { success: true, data: fallbackResult };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido.';
    return { success: false, error: `Error interno: ${msg}` };
  }
}