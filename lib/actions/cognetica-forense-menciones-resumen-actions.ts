//. 📍 lib/actions/cognetica-forense-menciones-resumen-actions.ts
/**
 * Server Action de **resumen agregado** de menciones por artefacto para
 * el directorio raíz de Cognética Forense (`/cognetica/page.tsx`).
 *
 * Diferencia respecto a `listarMencionesPorArtefacto` del Hito 2:
 *
 *   - Aquella devuelve el detalle completo de un artefacto + un tipo,
 *     con `mencion` raw y `valor_canonico` ya resuelto.
 *   - Esta devuelve **solo lo que la tarjeta raíz necesita**: por
 *     artefacto y por dimensión, el `count` y los primeros N nombres
 *     canónicos (o textos para citas).
 *
 * Una sola corrida carga las 5 vistas filtradas por `project_id` — 5
 * SELECT paralelos — y agrupa en memoria. Mucho más barato que 5·N
 * queries desde el cliente.
 *
 * **Valor canónico:** las vistas `cgt_vw_<tipo>_valor_canonico` ya
 * resuelven el coalesce `humano → cartografiador → extractor` (spec
 * §2 y `SQL_COGNETICA_V2_OLEADA_2.sql §6`). Esta acción simplemente
 * consume ese valor sin reconstruir lógica.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { fail, ok } from "@/lib/cognetica-forense/result";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import type { TipoEntidad } from "@/lib/cognetica-forense/types/oleada2";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
const UUID_SCHEMA = z.string().uuid();

/**
 * Cantidad de nombres "top" que se devuelven por dimensión.
 *
 * No exportamos esta constante: el archivo tiene `"use server"` y Next
 * solo permite async functions como exports. El valor lo consume
 * internamente `finalizarDimension`; el UI lee indirectamente el
 * tamaño a partir del array `topNombres` que recibe.
 */
const TOP_NOMBRES_POR_DIMENSION = 5;

/**
 * Item individual en el resumen top de una dimensión.
 */
export interface ResumenItem {
	/** ID de la entidad canónica (pensador_id, disciplina_id, etc.) */
	id: string;
	/** Nombre canónico para mostrar */
	nombre: string;
	/** Conteo total de menciones de esta entidad en el proyecto (>= 1) */
	menciones_count: number;
}

/**
 * Resumen por dimensión para un artefacto: cuántas menciones y cuáles
 * son (primeros N nombres canónicos únicos, ordenados alfabéticamente).
 *
 * Las citas usan `texto_canonico_actual` truncado a 80 chars. Todas las
 * demás usan `nombre_canonico_actual`.
 */
export interface ResumenDimension {
	count: number;
	/** @deprecated Usar topItems en su lugar */
	topNombres: string[];
	/** Items top con ID y nombre para navegación */
	topItems: ResumenItem[];
}

/**
 * Resumen por artefacto: las 5 dimensiones + el `artefacto_id` que
 * permite a la UI hacer el join con `ArtefactoListadoItem`.
 */
export interface ResumenMencionesArtefacto {
	artefacto_id: string;
	pensadores: ResumenDimension;
	disciplinas: ResumenDimension;
	conceptos: ResumenDimension;
	teorias: ResumenDimension;
	citas: ResumenDimension;
}

/** Longitud máxima a mostrar de una cita (para mantener UI legible). */
const MAX_LEN_CITA = 80;
//#endregion ![def]

//#region [action] - 🔧 listarResumenMencionesPorProyecto 🔧
/**
 * Para cada artefacto del proyecto, devuelve un resumen de sus
 * menciones por las 5 dimensiones. Si un artefacto no tiene ninguna
 * mención, no aparece en el mapa — el consumidor debe manejar ausencia
 * como "todos los counts en 0".
 *
 * RLS filtra por membresía en el proyecto; si el usuario no tiene
 * acceso, las 5 queries devuelven vacío y `ok({})` es la respuesta.
 */
export async function listarResumenMencionesPorProyecto(
	projectId: string,
): Promise<Result<Record<string, ResumenMencionesArtefacto>, ResultErrorCode>> {
	const parsed = UUID_SCHEMA.safeParse(projectId);
	if (!parsed.success) return fail<ResultErrorCode>("INVALID_INPUT");

	const supabase = await createServerClient();

	// 5 queries paralelas a las vistas de valor canónico del proyecto.
	// Seleccionamos las columnas necesarias para el resumen + IDs de entidades.
	const [pensRes, discRes, concRes, teoRes, citRes] = await Promise.all([
		supabase
			.from("cgt_vw_pensadores_valor_canonico")
			.select("artefacto_id, pensador_id, nombre_canonico_actual")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_disciplinas_valor_canonico")
			.select("artefacto_id, disciplina_id, nombre_canonico_actual")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_conceptos_valor_canonico")
			.select("artefacto_id, concepto_id, nombre_canonico_actual")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_teorias_valor_canonico")
			.select("artefacto_id, teoria_id, nombre_canonico_actual")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_citas_valor_canonico")
			.select("artefacto_id, cita_id, texto_canonico_actual")
			.eq("project_id", projectId),
	]);

	// Cargar conteos de menciones por entidad desde las vistas con conteo
	const [pensConteo, discConteo, concConteo, teoConteo] = await Promise.all([
		supabase
			.from("cgt_vw_pensadores_con_conteo")
			.select("id, menciones_count")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_disciplinas_con_conteo")
			.select("id, menciones_count")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_conceptos_con_conteo")
			.select("id, menciones_count")
			.eq("project_id", projectId),
		supabase
			.from("cgt_vw_teorias_con_conteo")
			.select("id, menciones_count")
			.eq("project_id", projectId),
	]);

	// Indexar conteos por ID para lookup O(1)
	const conteosPorId = new Map<string, number>();
	for (const row of (pensConteo.data ?? []) as Array<{
		id: string;
		menciones_count: number;
	}>) {
		conteosPorId.set(row.id, row.menciones_count);
	}
	for (const row of (discConteo.data ?? []) as Array<{
		id: string;
		menciones_count: number;
	}>) {
		conteosPorId.set(row.id, row.menciones_count);
	}
	for (const row of (concConteo.data ?? []) as Array<{
		id: string;
		menciones_count: number;
	}>) {
		conteosPorId.set(row.id, row.menciones_count);
	}
	for (const row of (teoConteo.data ?? []) as Array<{
		id: string;
		menciones_count: number;
	}>) {
		conteosPorId.set(row.id, row.menciones_count);
	}

	const errores = [pensRes, discRes, concRes, teoRes, citRes]
		.map((r) => r.error?.message)
		.filter(Boolean);
	if (errores.length > 0) {
		console.error("[listarResumenMencionesPorProyecto] errores:", errores);
		return fail<ResultErrorCode>("INTERNAL");
	}

	const mapa: Record<string, ResumenMencionesArtefacto> = {};

	const actualizarDimension = (
		tipo: Exclude<TipoEntidad, "cita">,
		idField: string,
		rows: Array<{
			artefacto_id: string | null;
			nombre_canonico_actual: string | null;
			[id: string]: string | null | undefined;
		}>,
	) => {
		for (const row of rows) {
			if (!row.artefacto_id) continue;
			const nombre = row.nombre_canonico_actual?.trim();
			const id = row[idField]?.trim();
			if (!nombre || !id) continue;
			const r = ensureResumen(mapa, row.artefacto_id);
			// Contamos TODAS las menciones (no deduplicamos por nombre) —
			// el count refleja "cuántas veces apareció este concepto en el
			// artefacto". Para los top items sí deduplicamos por ID.
			const dim = r[pluralDimension(tipo)];
			dim.count++;
			// Obtener conteo global del proyecto para esta entidad
			const mencionesCount = conteosPorId.get(id) ?? 1;
			if (!dim.topItems.some((item) => item.id === id)) {
				dim.topItems.push({ id, nombre, menciones_count: mencionesCount });
			}
			// Backwards compat: mantener topNombres también
			if (!dim.topNombres.includes(nombre)) {
				dim.topNombres.push(nombre);
			}
		}
	};

	actualizarDimension(
		"pensador",
		"pensador_id",
		(pensRes.data ?? []) as Array<{
			artefacto_id: string | null;
			nombre_canonico_actual: string | null;
			pensador_id: string | null;
		}>,
	);
	actualizarDimension(
		"disciplina",
		"disciplina_id",
		(discRes.data ?? []) as Array<{
			artefacto_id: string | null;
			nombre_canonico_actual: string | null;
			disciplina_id: string | null;
		}>,
	);
	actualizarDimension(
		"concepto",
		"concepto_id",
		(concRes.data ?? []) as Array<{
			artefacto_id: string | null;
			nombre_canonico_actual: string | null;
			concepto_id: string | null;
		}>,
	);
	actualizarDimension(
		"teoria",
		"teoria_id",
		(teoRes.data ?? []) as Array<{
			artefacto_id: string | null;
			nombre_canonico_actual: string | null;
			teoria_id: string | null;
		}>,
	);

	// Citas: solo contamos y guardamos nombres (no tienen vista raíz).
	// No necesitamos el cita_id porque las citas no son navegables.
	// Las citas siempre tienen menciones_count = 1 (cada una es única).
	for (const row of (citRes.data ?? []) as Array<{
		artefacto_id: string | null;
		texto_canonico_actual: string | null;
	}>) {
		if (!row.artefacto_id) continue;
		const texto = row.texto_canonico_actual?.trim();
		if (!texto) continue;
		const r = ensureResumen(mapa, row.artefacto_id);
		r.citas.count++;
		const truncado =
			texto.length > MAX_LEN_CITA ?
				`${texto.slice(0, MAX_LEN_CITA - 1)}…`
			:	texto;
		// Las citas no tienen vista raíz, guardamos ID dummy para compatibilidad
		if (!r.citas.topItems.some((item) => item.nombre === truncado)) {
			r.citas.topItems.push({
				id: "cita",
				nombre: truncado,
				menciones_count: 1,
			});
		}
		if (!r.citas.topNombres.includes(truncado)) {
			r.citas.topNombres.push(truncado);
		}
	}

	// Ordena alfabéticamente y trunca a TOP_NOMBRES_POR_DIMENSION.
	for (const r of Object.values(mapa)) {
		r.pensadores = finalizarDimension(r.pensadores);
		r.disciplinas = finalizarDimension(r.disciplinas);
		r.conceptos = finalizarDimension(r.conceptos);
		r.teorias = finalizarDimension(r.teorias);
		r.citas = finalizarDimension(r.citas);
	}

	return ok(mapa);
}
//#endregion ![action]

//#region [helpers] - 🛠️ EMPAQUE DE RESUMEN 🛠️
function dimensionVacia(): ResumenDimension {
	return { count: 0, topNombres: [], topItems: [] };
}

function ensureResumen(
	mapa: Record<string, ResumenMencionesArtefacto>,
	artefactoId: string,
): ResumenMencionesArtefacto {
	let r = mapa[artefactoId];
	if (!r) {
		r = {
			artefacto_id: artefactoId,
			pensadores: dimensionVacia(),
			disciplinas: dimensionVacia(),
			conceptos: dimensionVacia(),
			teorias: dimensionVacia(),
			citas: dimensionVacia(),
		};
		mapa[artefactoId] = r;
	}
	return r;
}

/**
 * Mapea el tipo singular a la clave plural usada en `ResumenMencionesArtefacto`.
 * Solo para los 4 "simples" — citas se trata aparte por diferencia de schema.
 */
function pluralDimension(
	tipo: Exclude<TipoEntidad, "cita">,
): keyof Omit<ResumenMencionesArtefacto, "artefacto_id" | "citas"> {
	switch (tipo) {
		case "pensador":
			return "pensadores";
		case "disciplina":
			return "disciplinas";
		case "concepto":
			return "conceptos";
		case "teoria":
			return "teorias";
	}
}

function finalizarDimension(d: ResumenDimension): ResumenDimension {
	// Ordenar topItems por nombre y truncar
	const sortedItems = d.topItems
		.slice()
		.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
		.slice(0, TOP_NOMBRES_POR_DIMENSION);
	return {
		count: d.count,
		topNombres: d.topNombres
			.slice()
			.sort((a, b) => a.localeCompare(b, "es"))
			.slice(0, TOP_NOMBRES_POR_DIMENSION),
		topItems: sortedItems,
	};
}
//#endregion ![helpers]
