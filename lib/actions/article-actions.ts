"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { ResultadoOperacion } from './batch-actions'; // Reutilizamos el tipo

/**
 * Verifica si un proyecto ya tiene artículos.
 * @param projectId - El ID del proyecto a verificar.
 * @returns Un objeto ResultadoOperacion que indica si la operación fue exitosa y el resultado.
 */
export async function checkProjectHasArticles(
  projectId: string
): Promise<ResultadoOperacion<{ hasArticles: boolean; count: number }>> {
  const opId = `CHECK-ARTICLES-${Math.floor(Math.random() * 10000)}`;
  console.log(`[${opId}] Iniciando verificación de artículos para el proyecto: ${projectId}`);

  if (!projectId) {
    return { success: false, error: "Se requiere ID de proyecto.", errorCode: "INVALID_PROJECT_ID" };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) {
      console.error(`❌ [${opId}] Error al contar artículos:`, error);
      return { success: false, error: `Error en la base de datos: ${error.message}`, errorCode: "DB_COUNT_ERROR" };
    }

    const hasArticles = count !== null && count > 0;
    console.log(`[${opId}] Verificación completada. El proyecto ${hasArticles ? 'tiene' : 'no tiene'} artículos. Cantidad: ${count}`);

    return { success: true, data: { hasArticles, count: count || 0 } };

  } catch (e) {
    const error = e as Error;
    console.error(`❌ [${opId}] Excepción en checkProjectHasArticles:`, error);
    return { success: false, error: `Error interno del servidor: ${error.message}`, errorCode: "INTERNAL_SERVER_ERROR" };
  }
}

// HACK: El tipo Article se define aquí para evitar dependencias circulares.
// Lo ideal sería moverlo a un archivo de tipos global (p. ej. types/index.ts)
export type Article = {
  'Publication Type': string;
  'Authors': string;
  'Title': string;
  'Jurnal': string;
  'Publication_Year': string;
  'DOI': string;
};

/**
 * Crea múltiples artículos para un proyecto, asignándoles un correlativo.
 * @param projectId - El ID del proyecto.
 * @param articles - Un array de artículos para crear.
 * @returns Un objeto ResultadoOperacion.
 */
export async function createArticlesForProject(
  projectId: string,
  articles: Article[]
): Promise<ResultadoOperacion<{ count: number }>> {
  const opId = `CREATE-ARTICLES-${Math.floor(Math.random() * 10000)}`;
  console.log(`[${opId}] Iniciando creación de ${articles.length} artículos para el proyecto: ${projectId}`);

  if (!projectId) {
    return { success: false, error: "Se requiere ID de proyecto.", errorCode: "INVALID_PROJECT_ID" };
  }
  if (!articles || articles.length === 0) {
    return { success: false, error: "Se requiere una lista de artículos.", errorCode: "EMPTY_ARTICLE_LIST" };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const articlesToInsert = articles.map((article, index) => {
      const year = parseInt(article['Publication_Year'], 10);
      return {
        project_id: projectId,
        title: article['Title'],
        authors: article['Authors'],
        journal: article['Jurnal'],
        publication_year: isNaN(year) ? null : year,
        doi: article['DOI'],
        publication_type: article['Publication Type'],
        correlative: index + 1,
      };
    });

    const { error, count } = await supabase
      .from('articles')
      .insert(articlesToInsert);

    if (error) {
      console.error(`❌ [${opId}] Error al insertar artículos:`, error);
      if (error.code === '23505') {
          return { success: false, error: `Error de duplicado: Uno o más artículos ya existen (DOI duplicado).`, errorCode: "DB_UNIQUE_VIOLATION" };
      }
      return { success: false, error: `Error en la base de datos: ${error.message}`, errorCode: "DB_INSERT_ERROR" };
    }

    console.log(`[${opId}] Creación completada. Se insertaron ${count} artículos.`);
    return { success: true, data: { count: count || 0 } };

  } catch (e) {
    const error = e as Error;
    console.error(`❌ [${opId}] Excepción en createArticlesForProject:`, error);
    return { success: false, error: `Error interno del servidor: ${error.message}`, errorCode: "INTERNAL_SERVER_ERROR" };
  }
}
