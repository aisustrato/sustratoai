"use server";

// Simula la estructura de un artículo que recibiría el servidor
interface ArticleData {
  Title: string;
  Authors: string;
  [key: string]: any;
}

/**
 * Simula una llamada a la base de datos para verificar si un proyecto ya tiene artículos.
 * @param projectId - El ID del proyecto a verificar.
 * @returns Una promesa que resuelve a un objeto indicando si existen artículos.
 */
export async function checkIfProjectHasArticles(projectId: string): Promise<{ hasArticles: boolean }> {
  console.log(`Verificando artículos para el proyecto: ${projectId}`);
  
  // Simula una latencia de red de 500ms
  await new Promise(resolve => setTimeout(resolve, 500));

  // En un caso real, aquí se consultaría la base de datos.
  // Para esta simulación, asumiremos que el proyecto está vacío.
  return { hasArticles: false };
}

/**
 * Simula el proceso de recibir, validar y guardar una lista de artículos en el backend.
 * @param articles - Un array de objetos de artículo parseados desde el CSV.
 * @returns Una promesa que resuelve a un objeto con el resultado de la operación.
 */
export async function uploadAndProcessArticles(articles: ArticleData[]): Promise<{ success: boolean; message: string; count: number }> {
  console.log(`Recibidos ${articles.length} artículos para procesar.`);

  // Simula una latencia de red más larga para el proceso de guardado (1.5 segundos)
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!articles || articles.length === 0) {
    return { success: false, message: "No se recibieron artículos para procesar.", count: 0 };
  }

  // Simulación de un posible error en el backend (ej. 10% de probabilidad de fallo)
  if (Math.random() < 0.1) {
    console.error("Error simulado en el backend durante el guardado.");
    return { success: false, message: "Ocurrió un error inesperado en el servidor.", count: 0 };
  }

  console.log("Artículos procesados y guardados exitosamente (simulación).");
  return {
    success: true,
    message: `Se han guardado ${articles.length} artículos correctamente.`,
    count: articles.length,
  };
}
