//. 📍 lib/actions/cognetica-forense-borrar-artefacto-actions.ts
/**
 * Server Action para eliminar un artefacto y todos sus datos asociados.
 *
 * **Destructivo**: esta acción elimina permanentemente:
 *   - Crónica, Destilado, Núcleo, Germinal (formatos metabolizables)
 *   - Menciones de todas las dimensiones (pensadores, disciplinas, conceptos, teorías, citas)
 *   - Ediciones humanas asociadas a las menciones (por CASCADE)
 *   - Logs del cartografiador
 *   - Referencias bibliográficas asociadas
 *   - Logs de DeepSeek (artefacto_id → NULL)
 *   - Archivos en Supabase Storage (original, md, yaml, json)
 *
 * **Validaciones de seguridad**:
 *   - No permite borrar entidades canónicas (pensadores, disciplinas, etc.)
 *   - Verifica membresía en proyecto vía RLS
 *   - Usa transacción para atomicidad (todo o nada)
 *
 * **Nota sobre CASCADEs**: Las tablas de menciones y ediciones humanas ya tienen
 * `ON DELETE CASCADE` configurado en SQL, por lo que no es necesario borrarlas
 * explícitamente.
 */
"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { fail, ok } from "@/lib/cognetica-forense/result";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
//#endregion ![head]

//#region [def] - 📦 SCHEMAS 📦
const UUID_SCHEMA = z.string().uuid();
//#endregion ![def]

//#region [action] - 🔧 borrarArtefacto 🔧
/**
 * Elimina un artefacto y todos sus datos asociados del sistema Cognética Forense.
 *
 * @param artefactoId - UUID del artefacto a eliminar
 * @returns Result<true, ResultErrorCode> - Éxito o código de error
 *
 * **Errores posibles**:
 *   - `INVALID_INPUT`: artefactoId no es UUID válido
 *   - `NOT_FOUND`: artefacto no existe o usuario no tiene acceso
 *   - `FORBIDDEN`: el artefacto es una entidad canónica (no se pueden borrar)
 *   - `INTERNAL`: error de base de datos
 */
export async function borrarArtefacto(
	artefactoId: string,
): Promise<Result<true, ResultErrorCode>> {
	const parsed = UUID_SCHEMA.safeParse(artefactoId);
	if (!parsed.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();

	// Verificar que el artefacto existe y obtener sus storage paths
	const { data: artefacto, error: fetchError } = await supabase
		.from("cgt_artefactos")
		.select(
			"id, project_id, storage_path_original, storage_path_md, storage_path_yaml, storage_path_json",
		)
		.eq("id", artefactoId)
		.single();

	if (fetchError || !artefacto) {
		console.error("[borrarArtefacto] Artefacto no encontrado:", fetchError);
		return fail<ResultErrorCode>("NOT_FOUND");
	}

	// Verificar que NO sea una entidad canónica
	// Las entidades canónicas tienen su propia tabla y no deben borrarse como artefactos
	const esEntidadCanonica = await verificarEsEntidadCanonica(
		supabase,
		artefactoId,
	);
	if (esEntidadCanonica) {
		console.error(
			"[borrarArtefacto] Intento de borrar entidad canónica:",
			artefactoId,
		);
		return fail<ResultErrorCode>("FORBIDDEN");
	}

	// =================================================================
	// 1. BORRAR ARCHIVOS DE SUPABASE STORAGE (antes de borrar DB)
	// =================================================================
	// Los paths de storage deben borrarse explícitamente, no hay CASCADE
	const pathsToDelete = [
		artefacto.storage_path_original,
		artefacto.storage_path_md,
		artefacto.storage_path_yaml,
		artefacto.storage_path_json,
	].filter((p): p is string => Boolean(p));

	if (pathsToDelete.length > 0) {
		const { error: storageError } = await supabase.storage
			.from("cognetica-files")
			.remove(pathsToDelete);

		if (storageError) {
			console.error(
				"[borrarArtefacto] Error borrando archivos de storage:",
				storageError,
			);
			// Continuamos igual — el archivo puede ya no existir o ser inaccesible
			// El borrado de DB es más importante que limpiar storage huérfano
		}
	}

	// =================================================================
	// 2. EJECUTAR BORRADO EN BASE DE DATOS (transacción atómica)
	// =================================================================
	// Orden: hijos primero, luego padre. Las tablas con CASCADE se manejan automáticamente.
	// Nota: cgt_borrar_artefacto_completo es una función RPC definida en SQL
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { error: rpcError } = await (supabase.rpc as any)(
		"cgt_borrar_artefacto_completo",
		{
			p_artefacto_id: artefactoId,
		},
	);

	if (rpcError) {
		console.error("[borrarArtefacto] Error en RPC:", rpcError);
		return fail<ResultErrorCode>("INTERNAL");
	}

	console.log(
		`[borrarArtefacto] Artefacto ${artefactoId} eliminado correctamente`,
	);
	return ok(true as const);
}
//#endregion ![action]

//#region [helpers] - 🛠️ HELPERS 🛠️
/**
 * Verifica si un ID corresponde a una entidad canónica (pensador, disciplina,
 * concepto, teoría o cita). Estas entidades tienen vida propia en el proyecto
 * y no deben borrarse como artefactos.
 */
async function verificarEsEntidadCanonica(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	id: string,
): Promise<boolean> {
	// Consultar en paralelo las 5 tablas de entidades canónicas
	const [pensador, disciplina, concepto, teoria, cita] = await Promise.all([
		supabase.from("cgt_pensadores").select("id").eq("id", id).maybeSingle(),
		supabase.from("cgt_disciplinas").select("id").eq("id", id).maybeSingle(),
		supabase.from("cgt_conceptos").select("id").eq("id", id).maybeSingle(),
		supabase.from("cgt_teorias").select("id").eq("id", id).maybeSingle(),
		supabase.from("cgt_citas").select("id").eq("id", id).maybeSingle(),
	]);

	// Si existe en cualquiera de las tablas, es entidad canónica
	return Boolean(
		pensador.data ||
			disciplina.data ||
			concepto.data ||
			teoria.data ||
			cita.data,
	);
}
//#endregion ![helpers]
