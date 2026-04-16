// 📍 lib/actions/cognetica-bookmark-actions.ts
// 🎯 PROPÓSITO: Gestionar bookmarks de segmentos de transcripción en Supabase
// 🔧 DECISIÓN: Persistencia por usuario y artefacto con RLS

'use server';

import { createServerClient } from '@/lib/supabase';

export interface SegmentBookmark {
    id: string;
    artifact_id: string;
    user_id: string;
    segment_index: number;
    segment_start?: number;
    segment_end?: number;
    segment_text?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Obtener todos los bookmarks de un artefacto para el usuario actual
 */
export async function getSegmentBookmarks(artifactId: string): Promise<{
    success: boolean;
    data?: number[]; // Array de índices de segmentos marcados
    error?: string;
}> {
    try {
        const supabase = await createServerClient();
        
        // Obtener usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const { data, error } = await supabase
            .from('cog_segment_bookmarks')
            .select('segment_index')
            .eq('artifact_id', artifactId)
            .eq('user_id', user.id)
            .order('segment_index', { ascending: true });

        if (error) {
            console.error('❌ [Bookmarks] Error obteniendo bookmarks:', error);
            return { success: false, error: error.message };
        }

        const indices = data?.map((b: { segment_index: number }) => b.segment_index) || [];
        console.log(`🔖 [Bookmarks] Cargados ${indices.length} bookmarks para artefacto ${artifactId}`);
        
        return { success: true, data: indices };
    } catch (err: any) {
        console.error('❌ [Bookmarks] Error inesperado:', err);
        return { success: false, error: err.message || 'Error desconocido' };
    }
}

/**
 * Agregar un bookmark a un segmento
 */
export async function addSegmentBookmark(
    artifactId: string,
    segmentIndex: number,
    segmentStart?: number,
    segmentEnd?: number,
    segmentText?: string
): Promise<{
    success: boolean;
    data?: SegmentBookmark;
    error?: string;
}> {
    try {
        const supabase = await createServerClient();
        
        // Obtener usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const { data, error } = await supabase
            .from('cog_segment_bookmarks')
            .insert({
                artifact_id: artifactId,
                user_id: user.id,
                segment_index: segmentIndex,
                segment_start: segmentStart,
                segment_end: segmentEnd,
                segment_text: segmentText
            })
            .select()
            .single();

        if (error) {
            // Si es error de duplicado, no es crítico
            if (error.code === '23505') {
                console.log(`🔖 [Bookmarks] Segmento ${segmentIndex} ya estaba marcado`);
                return { success: true };
            }
            console.error('❌ [Bookmarks] Error agregando bookmark:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ [Bookmarks] Bookmark agregado: segmento ${segmentIndex}`);
        return { success: true, data: data as SegmentBookmark };
    } catch (err: any) {
        console.error('❌ [Bookmarks] Error inesperado:', err);
        return { success: false, error: err.message || 'Error desconocido' };
    }
}

/**
 * Eliminar un bookmark de un segmento
 */
export async function removeSegmentBookmark(
    artifactId: string,
    segmentIndex: number
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createServerClient();
        
        // Obtener usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const { error } = await supabase
            .from('cog_segment_bookmarks')
            .delete()
            .eq('artifact_id', artifactId)
            .eq('user_id', user.id)
            .eq('segment_index', segmentIndex);

        if (error) {
            console.error('❌ [Bookmarks] Error eliminando bookmark:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ [Bookmarks] Bookmark eliminado: segmento ${segmentIndex}`);
        return { success: true };
    } catch (err: any) {
        console.error('❌ [Bookmarks] Error inesperado:', err);
        return { success: false, error: err.message || 'Error desconocido' };
    }
}

/**
 * Actualizar notas de un bookmark
 */
export async function updateSegmentBookmarkNotes(
    artifactId: string,
    segmentIndex: number,
    notes: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createServerClient();
        
        // Obtener usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const { error } = await supabase
            .from('cog_segment_bookmarks')
            .update({ notes })
            .eq('artifact_id', artifactId)
            .eq('user_id', user.id)
            .eq('segment_index', segmentIndex);

        if (error) {
            console.error('❌ [Bookmarks] Error actualizando notas:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ [Bookmarks] Notas actualizadas: segmento ${segmentIndex}`);
        return { success: true };
    } catch (err: any) {
        console.error('❌ [Bookmarks] Error inesperado:', err);
        return { success: false, error: err.message || 'Error desconocido' };
    }
}
