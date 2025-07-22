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
}

// Usamos el tipo inferido de la vista para mayor precisión
export type DetailedNote = Tables<'detailed_article_notes'>;

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
    
    let query = supabase
      .from('detailed_article_notes')
      .select('*');
    
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
    
    console.log('[SERVER] Ejecutando consulta...');
    const { data, error, count } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[SERVER] Error al obtener notas:', error);
      throw error;
    }
    
    console.log(`[SERVER] Se encontraron ${data?.length || 0} notas`);
    return { 
      success: true, 
      data: (data || []) as DetailedNote[] 
    };
    
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[SERVER] Usuario obtenido:', user ? 'Autenticado' : 'No autenticado');
    
    if (!user) {
      console.error('[SERVER] Error: Usuario no autenticado');
      return { success: false, error: "Usuario no autenticado." };
    }

    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };
    
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.noteContent !== undefined) updateData.note_content = payload.noteContent;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;

    console.log('[SERVER] Actualizando nota con datos:', updateData);
    
    const { data: updatedNote, error } = await supabase
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
    const supabase = await createSupabaseServerClient();
    console.log('[SERVER] Cliente Supabase creado');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
      console.error('[SERVER] Error al eliminar la nota:', error);
      throw error;
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