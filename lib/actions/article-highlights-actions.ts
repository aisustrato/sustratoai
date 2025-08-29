import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type ArticleHighlightInsert = Database['public']['Tables']['article_abstract_highlights']['Insert'];

export interface ArticleHighlightMetadata {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  timestamp: string;
}

export interface SaveHighlightParams {
  articleId: string;
  projectId: string;
  versionType: 'original' | 'translated';
  highlightedContent: string;
  highlightsMetadata: ArticleHighlightMetadata[];
}

export interface GetHighlightParams {
  articleId: string;
  versionType: 'original' | 'translated';
}

/**
 * Guardar o actualizar resaltados de un abstract
 */
export async function saveArticleHighlights(params: SaveHighlightParams) {
  console.log('🔄 [saveArticleHighlights] Iniciando función server action...');
  console.log('📋 [saveArticleHighlights] Parámetros recibidos:', {
    articleId: params.articleId,
    projectId: params.projectId,
    versionType: params.versionType,
    highlightsCount: params.highlightsMetadata.length
  });

  try {
    console.log('🔐 [saveArticleHighlights] Obteniendo usuario...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ [saveArticleHighlights] Usuario no autenticado');
      return { success: false, error: 'Usuario no autenticado' };
    }

    console.log('✅ [saveArticleHighlights] Usuario autenticado:', user.id);

    const highlightData: ArticleHighlightInsert = {
      article_id: params.articleId,
      user_id: user.id,
      project_id: params.projectId,
      version_type: params.versionType,
      highlighted_content: params.highlightedContent,
      highlights_metadata: params.highlightsMetadata as unknown as Database['public']['Tables']['article_abstract_highlights']['Row']['highlights_metadata'],
    };

    console.log('📤 [saveArticleHighlights] Datos preparados para BD:', {
      ...highlightData,
      highlighted_content: highlightData.highlighted_content.substring(0, 100) + '...'
    });

    // Usar upsert para insertar o actualizar si ya existe
    console.log('💾 [saveArticleHighlights] Ejecutando upsert...');
    const { data, error } = await supabase
      .from('article_abstract_highlights')
      .upsert(highlightData, {
        onConflict: 'article_id,user_id,version_type'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [saveArticleHighlights] Error en BD:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [saveArticleHighlights] Guardado exitoso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [saveArticleHighlights] Error inesperado:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtener resaltados existentes de un abstract
 */
export async function getArticleHighlights(params: GetHighlightParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data, error } = await supabase
      .from('article_abstract_highlights')
      .select('*')
      .eq('article_id', params.articleId)
      .eq('user_id', user.id)
      .eq('version_type', params.versionType)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener resaltados:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado al obtener resaltados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Eliminar resaltados de un abstract
 */
export async function deleteArticleHighlights(params: GetHighlightParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { error } = await supabase
      .from('article_abstract_highlights')
      .delete()
      .eq('article_id', params.articleId)
      .eq('user_id', user.id)
      .eq('version_type', params.versionType);

    if (error) {
      console.error('Error al eliminar resaltados:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error inesperado al eliminar resaltados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtener todos los resaltados de un usuario para un artículo (ambas versiones)
 */
export async function getAllArticleHighlights(articleId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data, error } = await supabase
      .from('article_abstract_highlights')
      .select('*')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .order('version_type');

    if (error) {
      console.error('Error al obtener todos los resaltados:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error inesperado al obtener todos los resaltados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Verificar si existen resaltados para un artículo y versión específica
 */
export async function hasArticleHighlights(params: GetHighlightParams): Promise<boolean> {
  const result = await getArticleHighlights(params);
  return result.success && !!result.data;
}
