// lib/actions/data-export-actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/server";
import type { ResultadoOperacion } from "./types";

// ========================================================================
//  REGISTRO DE EXPORTACIONES CON HASH DE INTEGRIDAD
// ========================================================================

export interface DataExportRecord {
	id: string;
	project_id: string;
	phase_id: string;
	user_id: string;
	sha256_hash: string;
	export_type: "csv" | "json" | "csv+json";
	article_count: number;
	dimension_count: number;
	filters_applied: Record<string, unknown> | null;
	file_name: string;
	metadata: Record<string, unknown>;
	created_at: string;
}

/**
 * Registra una exportación de datos con su hash SHA-256
 * Esto crea un registro inmutable que permite verificar la integridad
 * de los datos exportados por el investigador.
 */
export async function registerDataExport(params: {
	projectId: string;
	phaseId: string;
	sha256Hash: string;
	exportType: "csv" | "json" | "csv+json";
	articleCount: number;
	dimensionCount: number;
	filtersApplied?: Record<string, unknown>;
	fileName: string;
	metadata?: Record<string, unknown>;
}): Promise<ResultadoOperacion<DataExportRecord>> {
	try {
		const supabase = await createSupabaseServerClient();

		// Obtener usuario actual
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return {
				success: false,
				error: "No se pudo autenticar al usuario",
			};
		}

		// Insertar registro de exportación
		const { data, error } = await supabase
			.from("data_export_registry")
			.insert({
				project_id: params.projectId,
				phase_id: params.phaseId,
				user_id: user.id,
				sha256_hash: params.sha256Hash,
				export_type: params.exportType,
				article_count: params.articleCount,
				dimension_count: params.dimensionCount,
				filters_applied: params.filtersApplied || null,
				file_name: params.fileName,
				metadata: params.metadata || {},
			} as any)
			.select()
			.single();

		if (error) {
			console.error("❌ [registerDataExport] Error:", error);
			return {
				success: false,
				error: `Error al registrar exportación: ${error.message}`,
			};
		}

		console.log(
			`✅ [registerDataExport] Exportación registrada: ${params.sha256Hash.substring(0, 12)}... (${params.articleCount} artículos)`,
		);

		return { success: true, data: data as DataExportRecord };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("❌ [registerDataExport] Error:", msg);
		return { success: false, error: msg };
	}
}

/**
 * Verifica si un hash SHA-256 existe en el registro de exportaciones.
 * Esta función puede ser usada por la API pública de verificación.
 */
export async function verifyExportHash(sha256Hash: string): Promise<
	ResultadoOperacion<{
		verified: boolean;
		record?: {
			export_type: string;
			article_count: number;
			dimension_count: number;
			created_at: string;
			file_name: string;
		};
	}>
> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("data_export_registry")
			.select(
				"export_type, article_count, dimension_count, created_at, file_name",
			)
			.eq("sha256_hash", sha256Hash)
			.maybeSingle();

		if (error) {
			return {
				success: false,
				error: `Error al verificar hash: ${error.message}`,
			};
		}

		if (!data) {
			return {
				success: true,
				data: { verified: false },
			};
		}

		return {
			success: true,
			data: {
				verified: true,
				record: data,
			},
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		return { success: false, error: msg };
	}
}

/**
 * Lista las exportaciones registradas para un proyecto/fase
 */
export async function listExportsForPhase(
	projectId: string,
	phaseId: string,
): Promise<ResultadoOperacion<DataExportRecord[]>> {
	try {
		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("data_export_registry")
			.select("*")
			.eq("project_id", projectId)
			.eq("phase_id", phaseId)
			.order("created_at", { ascending: false });

		if (error) {
			return {
				success: false,
				error: `Error al listar exportaciones: ${error.message}`,
			};
		}

		return { success: true, data: (data || []) as DataExportRecord[] };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		return { success: false, error: msg };
	}
}
