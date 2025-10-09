// EN: lib/actions/article-actions.ts (Versión Final Definitiva)

"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// ... (Interfaces y Tipos sin cambios)
export type ResultadoOperacion<T> = | { success: true; data: T } | { success: false; error: string; errorCode?: string };
export type ArticleFromCsv = { [key: string]: string | number | null; };
export interface UploadArticlesPayload { projectId: string; articlesData: ArticleFromCsv[]; }

const PERMISO_SUBIR_ARCHIVOS = "can_upload_files";
const PERMISO_GESTIONAR_DATOS_MAESTROS = "can_manage_master_data";

// ========================================================================
//  ACCIÓN 1: uploadAndProcessArticles
// ========================================================================
export async function uploadAndProcessArticles(
  payload: UploadArticlesPayload
): Promise<ResultadoOperacion<{ insertedCount: number }>> {
  const { projectId, articlesData } = payload;
  if (!projectId || !articlesData || articlesData.length === 0) {
    return { success: false, error: "Payload inválido.", errorCode: "INVALID_PAYLOAD" };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
    }

    const { data: tienePermiso, error: rpcError } = await supabase.rpc("has_permission_in_project", { p_user_id: currentUser.id, p_project_id: projectId, p_permission_column: PERMISO_SUBIR_ARCHIVOS });
    if (rpcError || !tienePermiso) {
      return { success: false, error: "No tienes permiso para subir archivos en este proyecto.", errorCode: "FORBIDDEN" };
    }

    const { data: lastCorrelativoData, error: correlativoError } = await supabase.from("articles").select("correlativo").eq("project_id", projectId).order("correlativo", { ascending: false }).limit(1).maybeSingle();
    if (correlativoError) throw new Error(`Error al obtener el correlativo: ${correlativoError.message}`);

    const nextCorrelativo = (lastCorrelativoData?.correlativo || 0) + 1;

    const articlesToInsert: Database['public']['Tables']['articles']['Insert'][] = articlesData.map((rawArticle, index) => {
      const mainData = {
        title: rawArticle.Title as string | null,
        authors: (rawArticle.Authors as string)?.split(';').map(name => name.trim()) || null,
        journal: rawArticle.Journal as string | null,
        publication_year: Number(rawArticle["Publication Year"]) || null,
        abstract: rawArticle.Abstract as string | null,
        doi: rawArticle.DOI as string | null,
      };

      const metadata: Record<string, string | number | null> = {};
      const mainKeys = new Set(['Title', 'Authors', 'Journal', 'Publication Year', 'Abstract', 'DOI']);
      for (const key in rawArticle) {
        if (!mainKeys.has(key) && rawArticle[key] !== null && rawArticle[key] !== '') {
          metadata[key] = rawArticle[key];
        }
      }

      return {
        project_id: projectId,
        correlativo: nextCorrelativo + index,
        ...mainData,
        metadata: metadata,
      };
    });

    const { error: insertError, count: insertedCount } = await supabase.from("articles").insert(articlesToInsert, { count: 'exact' });
    if (insertError) throw new Error(`Error al guardar los artículos: ${insertError.message}`);

    return { success: true, data: { insertedCount: insertedCount || 0 } };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, error: `Error interno del servidor: ${errorMessage}`, errorCode: "INTERNAL_SERVER_ERROR" };
  }
}

// ========================================================================
//  ACCIÓN 5: getLatestTranslationsForArticles
//  Dado un arreglo de articleIds, devuelve la última traducción por artículo
// ========================================================================
export type LatestTranslationsMap = Record<string, Database['public']['Tables']['article_translations']['Row']>;

export async function getLatestTranslationsForArticles(
  articleIds: string[]
): Promise<ResultadoOperacion<LatestTranslationsMap>> {
  if (!Array.isArray(articleIds) || articleIds.length === 0) {
    return { success: true, data: {} };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Obtener todas las traducciones de estos artículos ordenadas por fecha desc
    const { data, error } = await supabase
      .from('article_translations')
      .select('*')
      .in('article_id', articleIds)
      .order('translated_at', { ascending: false });

    if (error) throw new Error(error.message);

    const map: LatestTranslationsMap = {};
    for (const t of data || []) {
      // La primera que veamos por article_id (por orden desc) es la más reciente
      if (!map[t.article_id]) {
        map[t.article_id] = t;
      }
    }

    return { success: true, data: map };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    return {
      success: false,
      error: `Error al obtener traducciones: ${errorMessage}`,
      errorCode: 'INTERNAL_SERVER_ERROR',
    };
  }
}

// ... (Las funciones checkIfProjectHasArticles y deleteUploadedArticles permanecen igual, ya que solo necesitan el nombre de la tabla "articles" y sus tipos se actualizarán automáticamente)
// ========================================================================
//  ACCIÓN 2: checkIfProjectHasArticles
// ========================================================================
export async function checkIfProjectHasArticles(
  projectId: string
): Promise<ResultadoOperacion<{ hasArticles: boolean }>> {
  if (!projectId) {
    return { success: false, error: "Se requiere ID de proyecto.", errorCode: "INVALID_PROJECT_ID" };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, data: { hasArticles: (count || 0) > 0 } };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
    return {
      success: false,
      error: `Error al verificar los artículos: ${errorMessage}`,
      errorCode: "DB_CHECK_ERROR",
    };
  }
}
// ========================================================================
//  ACCIÓN 3: deleteUploadedArticles
// ========================================================================
export async function deleteUploadedArticles(
  projectId: string
): Promise<ResultadoOperacion<{ deletedCount: number }>> {
  if (!projectId) {
    return { success: false, error: "Se requiere ID de proyecto.", errorCode: "INVALID_PROJECT_ID" };
  }
  const supabase = await createSupabaseServerClient();
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado.", errorCode: "UNAUTHENTICATED" };
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
      return { success: false, error: "No tienes permiso para eliminar datos maestros en este proyecto.", errorCode: "FORBIDDEN" };
    }
    const { count: activeBatchesCount, error: checkError } = await supabase
      .from("article_batches")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .neq("status", "pending");
    if (checkError) {
        throw new Error(`Error al verificar estado de los lotes: ${checkError.message}`);
    }
    if ((activeBatchesCount || 0) > 0) {
      return {
        success: false,
        error: `No se pueden eliminar los artículos porque ${activeBatchesCount} lote(s) ya han sido iniciados. Completa o reinicia esos lotes primero.`,
        errorCode: "DELETE_BLOCKED_ACTIVE_BATCHES",
      };
    }
    const { count: deletedCount, error: deleteError } = await supabase
        .from("articles")
        .delete({ count: "exact" })
        .eq("project_id", projectId);
    if (deleteError) {
        throw new Error(`Error al eliminar los artículos: ${deleteError.message}`);
    }
    return { success: true, data: { deletedCount: deletedCount || 0 } };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
    return {
      success: false,
      error: `Error interno del servidor: ${errorMessage}`,
      errorCode: "INTERNAL_SERVER_ERROR",
    };
  }
}

// ========================================================================
//  ACCIÓN 4: getArticleWithTranslations
// ========================================================================
export type ArticleDetailResult = {
  article: Database['public']['Tables']['articles']['Row'] | null;
  translations: Database['public']['Tables']['article_translations']['Row'][];
};

export async function getArticleWithTranslations(
  articleId: string
): Promise<ResultadoOperacion<ArticleDetailResult>> {
  if (!articleId) {
    return { success: false, error: "Se requiere ID de artículo.", errorCode: "INVALID_ARTICLE_ID" };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Obtener artículo principal
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .maybeSingle();

    if (articleError) {
      throw new Error(`Error al obtener el artículo: ${articleError.message}`);
    }

    // Si no existe el artículo, devolvemos éxito con article null y sin traducciones
    if (!article) {
      return { success: true, data: { article: null, translations: [] } };
    }

    // Obtener traducciones asociadas
    const { data: translations, error: translationsError } = await supabase
      .from('article_translations')
      .select('*')
      .eq('article_id', articleId)
      .order('translated_at', { ascending: false });

    if (translationsError) {
      throw new Error(`Error al obtener traducciones: ${translationsError.message}`);
    }

    return {
      success: true,
      data: {
        article,
        translations: translations || [],
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    return {
      success: false,
      error: `Error interno del servidor: ${errorMessage}`,
      errorCode: 'INTERNAL_SERVER_ERROR',
    };
  }
}

// ========================================================================
//  ACCIÓN 6: getPaginatedArticlesForProject
//  Obtiene artículos paginados para un proyecto con conteo total
// ========================================================================
export type PaginatedArticlesResult = {
  articles: Database['public']['Tables']['articles']['Row'][];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
};

export async function getPaginatedArticlesForProject(
  projectId: string,
  page: number = 1,
  limit: number = 10
): Promise<ResultadoOperacion<PaginatedArticlesResult>> {
  if (!projectId) {
    return { success: false, error: "Se requiere ID de proyecto.", errorCode: "INVALID_PROJECT_ID" };
  }

  if (page < 1 || limit < 1) {
    return { success: false, error: "Página y límite deben ser mayores a 0.", errorCode: "INVALID_PAGINATION_PARAMS" };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Obtener conteo total
    const { count: totalCount, error: countError } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (countError) {
      throw new Error(`Error al obtener conteo de artículos: ${countError.message}`);
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    // Calcular offset
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Obtener artículos paginados
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .eq('project_id', projectId)
      .order('correlativo', { ascending: true })
      .range(from, to);

    if (articlesError) {
      throw new Error(`Error al obtener artículos: ${articlesError.message}`);
    }

    return {
      success: true,
      data: {
        articles: articles || [],
        totalCount: total,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    return {
      success: false,
      error: `Error interno del servidor: ${errorMessage}`,
      errorCode: 'INTERNAL_SERVER_ERROR',
    };
  }
}