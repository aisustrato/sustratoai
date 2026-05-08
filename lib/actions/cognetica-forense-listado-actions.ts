//. 📍 lib/actions/cognetica-forense-listado-actions.ts
/**
 * Server Actions de **lectura** para el directorio raíz de Cognética.
 *
 * Expone `listarArtefactosConNucleo`, que devuelve un listado ligero de
 * los artefactos de un proyecto con la `tesis` del Núcleo adjuntada
 * (cuando existe) para usarla como descripción en las tarjetas.
 *
 * Filosofía: lee-sólo, sin efectos secundarios. Usa `createServerClient`
 * (que propaga cookies + RLS) para que cada usuario vea sólo sus proyectos.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { createServerClient } from "@/lib/supabase";
import { ok, fail } from "@/lib/cognetica-forense/result";
import type {
	CgtEstadoMetabolizacion,
	CgtTipoArtefacto,
	Result,
	ResultErrorCode,
} from "@/lib/cognetica-forense/types";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
/**
 * Payload ligero del listado. No incluye los contenidos completos (crónica,
 * destilado, germinal) — sólo lo mínimo que necesita la tarjeta:
 *
 *   - Identificación (`id`, `tipo`, `titulo`).
 *   - Estado (`estado`, `error_mensaje`).
 *   - Indicadores de existencia de cada formato (para calcular la fase
 *     de metabolización y si falta algún paso, sin cargar los contenidos).
 *   - `nucleo_tesis`: la tesis del Núcleo si ya fue generado; se usa como
 *     descripción principal en la tarjeta. Null si aún no hay Núcleo.
 *   - `descripcion`: fallback cuando `nucleo_tesis` es null.
 *   - `created_at`: para ordenar.
 */
export interface ArtefactoListadoItem {
	id: string;
	tipo: CgtTipoArtefacto;
	titulo: string;
	descripcion: string | null;
	estado: CgtEstadoMetabolizacion;
	error_mensaje: string | null;
	created_at: string;
	tiene_cronica: boolean;
	tiene_destilado: boolean;
	tiene_nucleo: boolean;
	tiene_germinal: boolean;
	/** Tesis del Núcleo si existe — descripción canónica del artefacto. */
	nucleo_tesis: string | null;
}
//#endregion ![def]

//#region [main] - 🔧 listarArtefactosConNucleo 🔧
/**
 * Lista artefactos del proyecto activo, ordenados por `created_at` DESC,
 * cada uno con su `nucleo_tesis` y sus flags de progreso de metabolización.
 *
 * RLS ya restringe los resultados a proyectos accesibles por el usuario
 * autenticado; no se valida acceso explícito aquí (si el `projectId` no
 * es accesible, el SELECT devuelve vacío y `ok([])` es la respuesta).
 */
export async function listarArtefactosConNucleo(
	projectId: string,
): Promise<Result<ArtefactoListadoItem[], ResultErrorCode>> {
	if (!projectId) return fail<ResultErrorCode>("INVALID_INPUT");

	const supabase = await createServerClient();

	// SELECT en dos pasos, barato:
	//   1) artefactos del proyecto con sus metadatos básicos;
	//   2) en paralelo, ids de filas existentes en cada tabla de formato y
	//      tesis del Núcleo por artefacto. Con dos round-trips (el segundo
	//      paralelo) cubrimos todo el listado sin N+1.
	const { data: artefactos, error: artErr } = await supabase
		.from("cgt_artefactos")
		.select(
			"id, tipo, titulo, descripcion, estado, error_mensaje, created_at",
		)
		.eq("project_id", projectId)
		.order("created_at", { ascending: false });

	if (artErr) {
		console.error("[listarArtefactosConNucleo] cgt_artefactos:", artErr);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!artefactos || artefactos.length === 0) return ok([]);

	const ids = artefactos.map((a) => a.id);

	const [cronicaRows, destiladoRows, nucleoRows, germinalRows] =
		await Promise.all([
			supabase
				.from("cgt_cronicas")
				.select("artefacto_id")
				.in("artefacto_id", ids),
			supabase
				.from("cgt_destilados")
				.select("artefacto_id")
				.in("artefacto_id", ids),
			supabase
				.from("cgt_nucleos")
				.select("artefacto_id, tesis")
				.in("artefacto_id", ids),
			supabase
				.from("cgt_germinales")
				.select("artefacto_id")
				.in("artefacto_id", ids),
		]);

	const cronicaSet = new Set(
		(cronicaRows.data ?? []).map((r) => r.artefacto_id),
	);
	const destiladoSet = new Set(
		(destiladoRows.data ?? []).map((r) => r.artefacto_id),
	);
	const germinalSet = new Set(
		(germinalRows.data ?? []).map((r) => r.artefacto_id),
	);
	const nucleoMap = new Map<string, string>();
	for (const n of nucleoRows.data ?? []) {
		if (n.artefacto_id) nucleoMap.set(n.artefacto_id, n.tesis);
	}

	const items: ArtefactoListadoItem[] = artefactos.map((a) => ({
		id: a.id,
		tipo: a.tipo as CgtTipoArtefacto,
		titulo: a.titulo,
		descripcion: a.descripcion,
		estado: a.estado as CgtEstadoMetabolizacion,
		error_mensaje: a.error_mensaje,
		created_at: a.created_at,
		tiene_cronica: cronicaSet.has(a.id),
		tiene_destilado: destiladoSet.has(a.id),
		tiene_nucleo: nucleoMap.has(a.id),
		tiene_germinal: germinalSet.has(a.id),
		nucleo_tesis: nucleoMap.get(a.id) ?? null,
	}));

	return ok(items);
}
//#endregion ![main]
