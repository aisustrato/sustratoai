// lib/actions/phase-eligible-articles-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";
import { getActivePhaseForProject } from "./preclassification_phases_actions";
import { ResultadoOperacion } from "./dimension-actions";

// ========================================================================
// 	ACCIÓN 0: Poblar el universo para la FASE INICIAL (FASE 1)
// ========================================================================
export async function populateInitialPhaseUniverse(
	projectId: string
): Promise<ResultadoOperacion<{ count: number }>> {
	const opId = `PIPU-${Math.floor(Math.random() * 10000)}`;
	console.log(`[${opId}] Iniciando populateInitialPhaseUniverse para proyecto: ${projectId}`);

	try {
		const supabase = await createSupabaseServerClient();

		// 1. Obtener la fase activa y verificar que es la Fase 1
		const activePhaseResult = await getActivePhaseForProject(projectId);
		if (!activePhaseResult.data || activePhaseResult.error) {
			return { success: false, error: "No se encontró una fase activa para este proyecto.", errorCode: "NO_ACTIVE_PHASE" };
		}
		if (activePhaseResult.data.phase_number !== 1) {
			return { success: false, error: "La fase activa no es la Fase 1. Esta función es solo para el universo inicial.", errorCode: "NOT_PHASE_1" };
		}
		const phaseId = activePhaseResult.data.id;

		// 2. Verificar si el universo ya ha sido poblado
		const { count: existingCount, error: checkError } = await supabase
			.from('phase_eligible_articles')
			.select('*', { count: 'exact', head: true })
			.eq('phase_id', phaseId);

		if (checkError) return { success: false, error: `Error al verificar registros existentes: ${checkError.message}` };
		if (existingCount && existingCount > 0) {
			return { success: false, error: "El universo para la Fase 1 ya ha sido poblado.", errorCode: "UNIVERSE_ALREADY_POPULATED" };
		}

		// 3. Obtener TODOS los artículos del proyecto en lotes
		let allArticles: { id: string }[] = [];
		let page = 0;
		const pageSize = 1000; // Límite de Supabase por consulta
		while (true) {
			const { data: articles, error: articlesError } = await supabase
				.from('articles')
				.select('id')
				.eq('project_id', projectId)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (articlesError) return { success: false, error: `Error al obtener artículos del proyecto: ${articlesError.message}` };
			if (articles.length > 0) {
				allArticles = allArticles.concat(articles);
				page++;
			} else {
				break; // No hay más artículos
			}
		}

		if (allArticles.length === 0) return { success: true, data: { count: 0 } };

		// 4. Insertar los registros en lotes
		const recordsToInsert = allArticles.map(article => ({
			phase_id: phaseId,
			article_id: article.id
		}));

		const batchSize = 1000;
		let totalInserted = 0;
		for (let i = 0; i < recordsToInsert.length; i += batchSize) {
			const batch = recordsToInsert.slice(i, i + batchSize);
			const { error: insertError } = await supabase
				.from('phase_eligible_articles')
				.insert(batch, { count: 'exact' }); // Usar count: 'exact' para bulk inserts

			if (insertError) return { success: false, error: `Error al poblar el universo: ${insertError.message}` };
			totalInserted += batch.length;
		}

		console.log(`🎉 [${opId}] ÉXITO: Universo de Fase 1 poblado con ${totalInserted} artículos.`);
		return { success: true, data: { count: totalInserted } };

	} catch (error) {
		console.error(`❌ [${opId}] Excepción en populateInitialPhaseUniverse:`, error);
		return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
	}
}

// ========================================================================
// 	ACCIÓN 1: Añadir artículos al universo de FASES POSTERIORES
// ========================================================================
export async function addToPhaseUniverse(
    phaseId: string,
    articleIds: string[]
): Promise<ResultadoOperacion<{ count: number }>> {
    const opId = `APU-${Math.floor(Math.random() * 10000)}`;
    console.log(`[${opId}] Iniciando addToPhaseUniverse para fase: ${phaseId}`);

    if (!articleIds || articleIds.length === 0) {
        return { success: true, data: { count: 0 } };
    }

    try {
        const supabase = await createSupabaseServerClient();
        
        const { count: batchCount, error: batchCheckError } = await supabase
            .from('article_batches')
            .select('*', { count: 'exact', head: true })
            .eq('phase_id', phaseId);

        if (batchCheckError) return { success: false, error: `Error al verificar lotes existentes: ${batchCheckError.message}` };
        if (batchCount && batchCount > 0) {
            return { success: false, error: `No se pueden añadir artículos a la fase porque ya se han creado ${batchCount} lotes.`, errorCode: "BATCHES_ALREADY_EXIST" };
        }

        const recordsToUpsert = articleIds.map(id => ({
            phase_id: phaseId,
            article_id: id,
        }));

        // CORRECCIÓN: Se utiliza el método .upsert() que es el correcto para esta operación.
        const { count: upsertedCount, error: upsertError } = await supabase
            .from('phase_eligible_articles')
            .upsert(recordsToUpsert, {
                onConflict: 'phase_id, article_id',
                ignoreDuplicates: true // Esto equivale a ON CONFLICT DO NOTHING
            });

        if (upsertError) return { success: false, error: `Error al añadir artículos al universo: ${upsertError.message}` };

        console.log(`🎉 [${opId}] ÉXITO: Nuevos artículos procesados para el universo de la fase ${phaseId}.`);
        return { success: true, data: { count: upsertedCount || 0 } };

    } catch (error) {
        console.error(`❌ [${opId}] Excepción en addToPhaseUniverse:`, error);
		return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}


// ========================================================================
// 	ACCIÓN 2: BORRADO SEGURO DEL UNIVERSO
// ========================================================================
export async function clearFromPhaseUniverse(
    phaseId: string,
    articleIds?: string[]
): Promise<ResultadoOperacion<{ count: number }>> {
    const opId = `CFPU-${Math.floor(Math.random() * 10000)}`;
    const mode = articleIds ? 'parcial' : 'total';
    console.log(`[${opId}] Iniciando borrado ${mode} del universo para fase: ${phaseId}`);

    try {
        const supabase = await createSupabaseServerClient();

        const { count: batchCount, error: batchCheckError } = await supabase
            .from('article_batches')
            .select('*', { count: 'exact', head: true })
            .eq('phase_id', phaseId);
        
        if (batchCheckError) return { success: false, error: `Error al verificar lotes existentes: ${batchCheckError.message}` };
        if (batchCount && batchCount > 0) {
            return { success: false, error: `No se puede modificar el universo de la fase porque ya se han creado ${batchCount} lotes.`, errorCode: "BATCHES_ALREADY_EXIST" };
        }

        let query = supabase.from('phase_eligible_articles').delete().eq('phase_id', phaseId);

        if (articleIds && articleIds.length > 0) {
            query = query.in('article_id', articleIds);
        }

        const { count: deletedCount, error: deleteError } = await query;

        if (deleteError) return { success: false, error: `Error al eliminar del universo: ${deleteError.message}` };

        console.log(`🎉 [${opId}] ÉXITO: ${deletedCount || 0} artículos eliminados del universo de la fase ${phaseId}.`);
        return { success: true, data: { count: deletedCount || 0 } };

    } catch (error) {
        console.error(`❌ [${opId}] Excepción en clearFromPhaseUniverse:`, error);
		return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}

// ========================================================================
// 	ACCIÓN 3: LISTAR ARTÍCULOS ELEGIBLES (CON JOIN) - CON PAGINACIÓN
// ========================================================================
export async function listEligibleArticlesForPhase(
    phaseId: string
): Promise<ResultadoOperacion<any[]>> { 
    const opId = `LEAFP-${Math.floor(Math.random() * 10000)}`;
    console.log(`[${opId}] Iniciando listado de artículos para fase: ${phaseId}`);

    try {
        const supabase = await createSupabaseServerClient();
        
        // CORRECCIÓN: Implementar paginación para obtener TODOS los artículos elegibles
        let allArticles: any[] = [];
        let page = 0;
        const pageSize = 1000; // Límite de Supabase por consulta
        
        while (true) {
            const { data, error } = await supabase
                .from('phase_eligible_articles')
                .select(`
                    *,
                    articles (*)
                `)
                .eq('phase_id', phaseId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) return { success: false, error: `Error al listar artículos elegibles: ${error.message}` };
            
            if (!data || data.length === 0) break; // No hay más artículos
            
            allArticles = allArticles.concat(data);
            page++;
            
            console.log(`[${opId}] Página ${page}: ${data.length} artículos obtenidos (total acumulado: ${allArticles.length})`);
            
            // Si obtuvimos menos registros que el pageSize, hemos llegado al final
            if (data.length < pageSize) break;
        }

        const flattenedData = allArticles.map(item => {
            // Verificación para asegurar que item.articles no sea nulo
            if (!item.articles) {
                console.warn(`[${opId}] Se encontró un registro en phase_eligible_articles (id: ${item.id}) sin un artículo correspondiente.`);
                return null;
            }
            return {
                ...item.articles, 
                phase_eligible_article_id: item.id 
            };
        }).filter(item => item !== null); // Filtramos cualquier resultado nulo

        console.log(`🎉 [${opId}] ÉXITO: Se encontraron ${flattenedData.length} artículos elegibles en total (${page} páginas procesadas).`);
        return { success: true, data: flattenedData };

    } catch (error) {
        console.error(`❌ [${opId}] Excepción en listEligibleArticlesForPhase:`, error);
		return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}