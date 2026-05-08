//. 📍 lib/actions/cognetica-forense-menciones-actions.ts
/**
 * Server Actions de Oleada 2 — CRUD básico sobre menciones + ediciones
 * humanas + entidades canónicas del proyecto.
 *
 * Alcance (ver `guia_ruta_cascade_oleada_2.md §3 HITO 2`):
 *
 *   - `listarMencionesPorArtefacto(artefactoId, tipo)` — lee de la vista
 *     `cgt_vw_<tipo>_valor_canonico` que ya resuelve el coalesce
 *     humano → cartografiador → extractor. También devuelve la mención
 *     raw para que la UI pueda mostrar las 3 capas sin queries extra.
 *
 *   - `editarMencionHumana(input)` — **append-only**: inserta una fila
 *     nueva en `cgt_<tipo>_ediciones_humanas`. NUNCA toca las tablas de
 *     menciones ni las entidades canónicas. La trazabilidad es ley
 *     (`guia §0.6`).
 *
 *   - `listarEdicionesHumanasPorMencion(mencionId, tipo)` — historial
 *     cronológico descendente para mostrar el append-only en la UI.
 *
 *   - `listarEntidadesCanonicasProyecto(projectId, tipo)` — lista las
 *     entidades canónicas del proyecto (con conteo inline cuando aplica)
 *     para poblar los dropdowns de reasignación del Hito 4.
 *
 * Filosofía de validación: entrada con Zod (rechazo temprano), autorización
 * delegada a RLS (el SELECT/INSERT fallará con row silently rejected si el
 * usuario no es miembro del proyecto; aquí mapeamos ese caso a `FORBIDDEN`).
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { ok, fail } from "@/lib/cognetica-forense/result";
import type {
	CitaEdicionHumana,
	CitaMencion,
	CitaValorCanonico,
	ConceptoConConteo,
	ConceptoEdicionHumana,
	ConceptoMencion,
	ConceptoValorCanonico,
	DisciplinaConConteo,
	DisciplinaEdicionHumana,
	DisciplinaMencion,
	DisciplinaValorCanonico,
	EditarMencionHumanaInput,
	PensadorConConteo,
	PensadorEdicionHumana,
	PensadorMencion,
	PensadorValorCanonico,
	TeoriaConConteo,
	TeoriaEdicionHumana,
	TeoriaMencion,
	TeoriaValorCanonico,
	TipoEntidad,
	CitaCanonica,
} from "@/lib/cognetica-forense/types/oleada2";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
//#endregion ![head]

//#region [def] - 📦 SCHEMAS ZOD 📦
/**
 * Uniones strictas de `campo_editado` por tipo. Coinciden con los
 * CHECK de SQL (`SQL_COGNETICA_V2_OLEADA_2.sql §1–§5`). Si un cliente
 * envía un `campo` no admitido, se rechaza con `INVALID_INPUT` antes de
 * tocar la DB.
 */
const CAMPO_EDICION_POR_TIPO: Record<
	TipoEntidad,
	z.ZodEnum<[string, ...string[]]>
> = {
	pensador: z.enum(["nombre", "descripcion", "reasignar_entidad_canonica"]),
	disciplina: z.enum([
		"nombre",
		"descripcion",
		"reasignar_entidad_canonica",
		"asignar_disciplina_madre",
	]),
	concepto: z.enum([
		"nombre",
		"descripcion",
		"reasignar_entidad_canonica",
		"marcar_semilla_fractal",
	]),
	teoria: z.enum([
		"nombre",
		"descripcion",
		"reasignar_entidad_canonica",
		"actualizar_autores",
	]),
	cita: z.enum([
		"texto",
		"autor",
		"referencia",
		"tipo_cita",
		"reasignar_entidad_canonica",
	]),
};

const TIPO_ENTIDAD_SCHEMA = z.enum([
	"pensador",
	"disciplina",
	"concepto",
	"teoria",
	"cita",
]);

const UUID_SCHEMA = z.string().uuid();
//#endregion ![def]

//#region [def] - 📦 RETORNOS TIPADOS 📦
/**
 * Una mención + la proyección de valor canónico actual (la vista
 * `cgt_vw_<tipo>_valor_canonico` ya trae el coalesce). La UI del Hito 4
 * usa `valor_canonico` para el nombre visible y `mencion` para las 3
 * capas en el modal de detalle.
 */
/**
 * Mención con valor canónico + conteo de apariciones en el proyecto.
 * El `menciones_count` solo aplica a entidades con conteo (excluye citas).
 */
export type MencionConValorCanonico =
	| {
			tipo: "pensador";
			mencion: PensadorMencion;
			valor_canonico: PensadorValorCanonico;
			menciones_count: number;
	  }
	| {
			tipo: "disciplina";
			mencion: DisciplinaMencion;
			valor_canonico: DisciplinaValorCanonico;
			menciones_count: number;
	  }
	| {
			tipo: "concepto";
			mencion: ConceptoMencion;
			valor_canonico: ConceptoValorCanonico;
			menciones_count: number;
	  }
	| {
			tipo: "teoria";
			mencion: TeoriaMencion;
			valor_canonico: TeoriaValorCanonico;
			menciones_count: number;
	  }
	| {
			tipo: "cita";
			mencion: CitaMencion;
			valor_canonico: CitaValorCanonico;
			menciones_count: 1;
	  };

export type EdicionHumanaConTipo =
	| { tipo: "pensador"; edicion: PensadorEdicionHumana }
	| { tipo: "disciplina"; edicion: DisciplinaEdicionHumana }
	| { tipo: "concepto"; edicion: ConceptoEdicionHumana }
	| { tipo: "teoria"; edicion: TeoriaEdicionHumana }
	| { tipo: "cita"; edicion: CitaEdicionHumana };

/**
 * Entidad canónica del proyecto enriquecida con `menciones_count`
 * cuando aplica (todas menos citas, según `SQL §9`). Para citas se
 * devuelve el canónico puro sin contador.
 */
export type EntidadCanonicaListable =
	| { tipo: "pensador"; entidad: PensadorConConteo }
	| { tipo: "disciplina"; entidad: DisciplinaConConteo }
	| { tipo: "concepto"; entidad: ConceptoConConteo }
	| { tipo: "teoria"; entidad: TeoriaConConteo }
	| { tipo: "cita"; entidad: CitaCanonica };
//#endregion ![def]

//#region [helpers] - 🛠️ DESPACHO TIPADO 🛠️
/**
 * Estrategia: en vez de un mapa central `Record<TipoEntidad, {tabla,
 * vista, ediciones}>` — que obliga a Supabase a fusionar el union de
 * todas las tablas y dispara `TS2589: Type instantiation excessively
 * deep` — se usa un `switch(tipo)` explícito por query. Cada branch
 * literal deja que Supabase-ts infiera el shape exacto de esa tabla o
 * vista.
 *
 * El costo: 5 branches de ~6 líneas. La ganancia: type-safety real
 * end-to-end sin castear a `any`.
 */
//#endregion ![helpers]

//#region [action] - 🔧 listarMencionesPorArtefacto 🔧
/**
 * Lista menciones de un tipo dado para un artefacto, con su valor
 * canónico ya resuelto vía la vista.
 *
 * RLS hace el filtrado por proyecto. Si el usuario no tiene acceso, el
 * SELECT devuelve vacío y retornamos `ok([])` — no distinguimos entre
 * "no existe" y "no tiene permiso" por privacidad.
 */
export async function listarMencionesPorArtefacto(
	artefactoId: string,
	tipo: TipoEntidad,
): Promise<Result<MencionConValorCanonico[], ResultErrorCode>> {
	const parseId = UUID_SCHEMA.safeParse(artefactoId);
	const parseTipo = TIPO_ENTIDAD_SCHEMA.safeParse(tipo);
	if (!parseId.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();

	// Despacho explícito por tipo. Supabase infiere mejor con literales.
	// Tabla y vista tienen shapes distintos; el switch mantiene cada branch
	// con sus tipos exactos y evita el "Type instantiation excessively deep".
	const { menciones, valores } = await obtenerMencionesYValores(
		supabase,
		tipo,
		artefactoId,
	);

	if (menciones.error) {
		console.error("[listarMencionesPorArtefacto] menciones:", menciones.error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (valores.error) {
		console.error("[listarMencionesPorArtefacto] valores:", valores.error);
		return fail<ResultErrorCode>("INTERNAL");
	}

	// Indexo valor canónico por mencion_id para join O(1)
	const valoresPorMencionId = new Map<string, unknown>();
	for (const v of (valores.data ?? []) as Array<{ mencion_id: string }>) {
		valoresPorMencionId.set(v.mencion_id, v);
	}

	// Obtener conteos de menciones por entidad canónica (solo para tipos con conteo)
	const conteosPorEntidad = await obtenerConteosPorEntidad(
		supabase,
		tipo,
		(valores.data ?? []) as Array<Record<string, unknown>>,
	);

	const items: MencionConValorCanonico[] = [];
	for (const mencion of (menciones.data ?? []) as Array<{ id: string }>) {
		const valor = valoresPorMencionId.get(mencion.id);
		if (!valor) continue; // skip defensivo

		// Extraer el ID de entidad canónica según el tipo
		const entidadId = extraerEntidadId(tipo, valor as Record<string, unknown>);
		const mencionesCount =
			entidadId ? (conteosPorEntidad.get(entidadId) ?? 1) : 1;

		items.push({
			tipo,
			mencion,
			valor_canonico: valor,
			menciones_count: mencionesCount,
		} as MencionConValorCanonico);
	}

	return ok(items);
}

/**
 * Extrae el ID de entidad canónica del valor canónico según el tipo.
 * Retorna null si no hay entidad asignada (sin_cartografiar o ambigua).
 */
function extraerEntidadId(
	tipo: TipoEntidad,
	valor: Record<string, unknown>,
): string | null {
	switch (tipo) {
		case "pensador":
			return (valor.pensador_id as string) ?? null;
		case "disciplina":
			return (valor.disciplina_id as string) ?? null;
		case "concepto":
			return (valor.concepto_id as string) ?? null;
		case "teoria":
			return (valor.teoria_id as string) ?? null;
		case "cita":
			return (valor.cita_id as string) ?? null;
	}
}

/**
 * Obtiene los conteos de menciones para cada entidad canónica única.
 * Para citas siempre retorna 1 (cada cita es única conceptualmente).
 * Usa las vistas `cgt_vw_<tipo>_con_conteo` que ya tienen el conteo inline.
 */
async function obtenerConteosPorEntidad(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidad,
	valores: Array<Record<string, unknown>>,
): Promise<Map<string, number>> {
	const conteos = new Map<string, number>();

	// Extraer IDs únicos de entidades canónicas
	const idsUnicos = new Set<string>();
	for (const v of valores) {
		const id = extraerEntidadId(tipo, v);
		if (id) idsUnicos.add(id);
	}

	if (idsUnicos.size === 0 || tipo === "cita") {
		// Citas no tienen conteo (cada una es única)
		return conteos;
	}

	const idsArray = Array.from(idsUnicos);

	// Consultar la vista con conteo para cada tipo
	switch (tipo) {
		case "pensador": {
			const { data, error } = await supabase
				.from("cgt_vw_pensadores_con_conteo")
				.select("id,menciones_count")
				.in("id", idsArray);
			if (!error && data) {
				for (const row of data as Array<{
					id: string;
					menciones_count: number;
				}>) {
					conteos.set(row.id, row.menciones_count);
				}
			}
			break;
		}
		case "disciplina": {
			const { data, error } = await supabase
				.from("cgt_vw_disciplinas_con_conteo")
				.select("id,menciones_count")
				.in("id", idsArray);
			if (!error && data) {
				for (const row of data as Array<{
					id: string;
					menciones_count: number;
				}>) {
					conteos.set(row.id, row.menciones_count);
				}
			}
			break;
		}
		case "concepto": {
			const { data, error } = await supabase
				.from("cgt_vw_conceptos_con_conteo")
				.select("id,menciones_count")
				.in("id", idsArray);
			if (!error && data) {
				for (const row of data as Array<{
					id: string;
					menciones_count: number;
				}>) {
					conteos.set(row.id, row.menciones_count);
				}
			}
			break;
		}
		case "teoria": {
			const { data, error } = await supabase
				.from("cgt_vw_teorias_con_conteo")
				.select("id,menciones_count")
				.in("id", idsArray);
			if (!error && data) {
				for (const row of data as Array<{
					id: string;
					menciones_count: number;
				}>) {
					conteos.set(row.id, row.menciones_count);
				}
			}
			break;
		}
	}

	return conteos;
}

/**
 * Despacho tipado para el fetch paralelo de menciones + valores
 * canónicos. Cada branch usa el literal exacto de tabla/vista para que
 * Supabase-ts infiera el shape correcto.
 *
 * El retorno se presenta como `{data, error}` uniforme — el caller solo
 * necesita saber si hubo error y mapear el array.
 */
async function obtenerMencionesYValores(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidad,
	artefactoId: string,
): Promise<{
	menciones: { data: unknown[] | null; error: unknown };
	valores: { data: unknown[] | null; error: unknown };
}> {
	switch (tipo) {
		case "pensador": {
			const [m, v] = await Promise.all([
				supabase
					.from("cgt_pensadores_menciones")
					.select("*")
					.eq("artefacto_id", artefactoId)
					.order("created_at", { ascending: true }),
				supabase
					.from("cgt_vw_pensadores_valor_canonico")
					.select("*")
					.eq("artefacto_id", artefactoId),
			]);
			return { menciones: m, valores: v };
		}
		case "disciplina": {
			const [m, v] = await Promise.all([
				supabase
					.from("cgt_disciplinas_menciones")
					.select("*")
					.eq("artefacto_id", artefactoId)
					.order("created_at", { ascending: true }),
				supabase
					.from("cgt_vw_disciplinas_valor_canonico")
					.select("*")
					.eq("artefacto_id", artefactoId),
			]);
			return { menciones: m, valores: v };
		}
		case "concepto": {
			const [m, v] = await Promise.all([
				supabase
					.from("cgt_conceptos_menciones")
					.select("*")
					.eq("artefacto_id", artefactoId)
					.order("created_at", { ascending: true }),
				supabase
					.from("cgt_vw_conceptos_valor_canonico")
					.select("*")
					.eq("artefacto_id", artefactoId),
			]);
			return { menciones: m, valores: v };
		}
		case "teoria": {
			const [m, v] = await Promise.all([
				supabase
					.from("cgt_teorias_menciones")
					.select("*")
					.eq("artefacto_id", artefactoId)
					.order("created_at", { ascending: true }),
				supabase
					.from("cgt_vw_teorias_valor_canonico")
					.select("*")
					.eq("artefacto_id", artefactoId),
			]);
			return { menciones: m, valores: v };
		}
		case "cita": {
			const [m, v] = await Promise.all([
				supabase
					.from("cgt_citas_menciones")
					.select("*")
					.eq("artefacto_id", artefactoId)
					.order("created_at", { ascending: true }),
				supabase
					.from("cgt_vw_citas_valor_canonico")
					.select("*")
					.eq("artefacto_id", artefactoId),
			]);
			return { menciones: m, valores: v };
		}
	}
}
//#endregion ![action]

//#region [action] - 🔧 editarMencionHumana 🔧
/**
 * Registra una edición humana sobre una mención. **Append-only**:
 * inserta una fila nueva en `cgt_<tipo>_ediciones_humanas`, sin tocar
 * la mención ni la entidad canónica (ver `guia §0.6` y `SQL §1-§5`).
 *
 * Obliga a tener `user_id` (`UNAUTHORIZED` si no hay sesión). La
 * `justificacion` es opcional en el tipo pero la UI del Hito 4 la
 * exigirá en la capa cliente; aquí se pasa tal cual.
 *
 * Captura `valor_anterior` leyendo la mención antes del insert para
 * que el historial sea autocontenido (no haya que reconstruir el
 * valor previo combinando filas).
 */
export async function editarMencionHumana<T extends TipoEntidad>(
	input: EditarMencionHumanaInput<T>,
): Promise<Result<EdicionHumanaConTipo, ResultErrorCode>> {
	const parseId = UUID_SCHEMA.safeParse(input.mencion_id);
	const parseTipo = TIPO_ENTIDAD_SCHEMA.safeParse(input.tipo);
	if (!parseId.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const campoSchema = CAMPO_EDICION_POR_TIPO[input.tipo];
	const parseCampo = campoSchema.safeParse(input.campo);
	if (!parseCampo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail<ResultErrorCode>("UNAUTHORIZED");

	// 1. Lectura previa de la mención — usada para capturar `valor_anterior`
	//    auto-completado y `project_id` para el insert. Si RLS bloquea el
	//    SELECT, `NOT_FOUND` (no distingo de "no existe" por privacidad).
	const mencionRes = await leerMencion(supabase, input.tipo, input.mencion_id);
	if (mencionRes.error) {
		console.error("[editarMencionHumana] lectura mención:", mencionRes.error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!mencionRes.data) return fail<ResultErrorCode>("NOT_FOUND");

	const mencionRow = mencionRes.data as Record<string, unknown>;
	const valorAnterior = extraerValorAnterior(mencionRow, input.campo);
	const projectId = mencionRow["project_id"] as string;

	// 2. Insert append-only.
	const insertRes = await insertarEdicion(supabase, input.tipo, {
		mencion_id: input.mencion_id,
		project_id: projectId,
		user_id: user.id,
		campo_editado: input.campo,
		valor_anterior: valorAnterior,
		valor_nuevo: input.valor_nuevo,
		justificacion: input.justificacion ?? null,
	});

	if (insertRes.error) {
		const pgErr = insertRes.error as { code?: string };
		console.error("[editarMencionHumana] insert edición:", insertRes.error);
		if (pgErr.code === "23514") return fail<ResultErrorCode>("INVALID_INPUT");
		if (pgErr.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!insertRes.data) return fail<ResultErrorCode>("INTERNAL");

	return ok({
		tipo: input.tipo,
		edicion: insertRes.data,
	} as EdicionHumanaConTipo);
}

/**
 * Lee una mención por id despachando por tipo. Cada branch usa el
 * literal de tabla exacto para inference correcto.
 */
async function leerMencion(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidad,
	mencionId: string,
): Promise<{ data: unknown; error: unknown }> {
	switch (tipo) {
		case "pensador":
			return supabase
				.from("cgt_pensadores_menciones")
				.select("*")
				.eq("id", mencionId)
				.maybeSingle();
		case "disciplina":
			return supabase
				.from("cgt_disciplinas_menciones")
				.select("*")
				.eq("id", mencionId)
				.maybeSingle();
		case "concepto":
			return supabase
				.from("cgt_conceptos_menciones")
				.select("*")
				.eq("id", mencionId)
				.maybeSingle();
		case "teoria":
			return supabase
				.from("cgt_teorias_menciones")
				.select("*")
				.eq("id", mencionId)
				.maybeSingle();
		case "cita":
			return supabase
				.from("cgt_citas_menciones")
				.select("*")
				.eq("id", mencionId)
				.maybeSingle();
	}
}

/**
 * Payload común para insertar ediciones humanas en cualquier tabla
 * `cgt_<tipo>_ediciones_humanas`. Todas comparten el mismo shape
 * gracias al diseño homogéneo de la Oleada 2.
 */
interface InsertEdicionPayload {
	mencion_id: string;
	project_id: string;
	user_id: string;
	campo_editado: string;
	valor_anterior: string | null;
	valor_nuevo: string | null;
	justificacion: string | null;
}

/**
 * Inserta una edición humana despachando por tipo. Retorna la fila
 * recién creada o el error crudo de Postgres para que el caller mapee
 * códigos (23514 = CHECK, 42501 = RLS).
 */
async function insertarEdicion(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidad,
	payload: InsertEdicionPayload,
): Promise<{ data: unknown; error: unknown }> {
	switch (tipo) {
		case "pensador":
			return supabase
				.from("cgt_pensadores_ediciones_humanas")
				.insert(payload)
				.select()
				.maybeSingle();
		case "disciplina":
			return supabase
				.from("cgt_disciplinas_ediciones_humanas")
				.insert(payload)
				.select()
				.maybeSingle();
		case "concepto":
			return supabase
				.from("cgt_conceptos_ediciones_humanas")
				.insert(payload)
				.select()
				.maybeSingle();
		case "teoria":
			return supabase
				.from("cgt_teorias_ediciones_humanas")
				.insert(payload)
				.select()
				.maybeSingle();
		case "cita":
			return supabase
				.from("cgt_citas_ediciones_humanas")
				.insert(payload)
				.select()
				.maybeSingle();
	}
}

/**
 * Deriva el `valor_anterior` a persistir según el `campo_editado`.
 * Para los campos textuales comunes mapeamos al nombre canónico
 * calculado (coalesce humano → cartografiador → extractor aplicado
 * manualmente) desde la mención cruda, sin re-leer la vista.
 *
 * Para `reasignar_entidad_canonica` el valor anterior es el UUID de la
 * entidad canónica actualmente vinculada (FK `<tipo>_id`). Para campos
 * "no textuales" (`marcar_semilla_fractal`, `asignar_disciplina_madre`,
 * `actualizar_autores`) devolvemos null y el cliente lo rellena con el
 * valor serializado que corresponda.
 */
function extraerValorAnterior(
	mencion: Record<string, unknown>,
	campo: string,
): string | null {
	const coalesce = (...keys: string[]): string | null => {
		for (const k of keys) {
			const v = mencion[k];
			if (typeof v === "string" && v.length > 0) return v;
		}
		return null;
	};

	switch (campo) {
		case "nombre":
			return coalesce("nombre_cartografiador", "nombre_extractor_crudo");
		case "descripcion":
			return coalesce(
				"descripcion_cartografiador",
				"descripcion_extractor_cruda",
			);
		case "texto":
			return coalesce("texto_cartografiador", "texto_extractor_crudo");
		case "autor":
			return coalesce("autor_cartografiador", "autor_extractor_crudo");
		case "referencia":
			return coalesce(
				"referencia_cartografiador",
				"referencia_extractor_cruda",
			);
		case "tipo_cita":
			return coalesce("tipo_cita_cartografiador", "tipo_cita_extractor");
		case "reasignar_entidad_canonica": {
			// FK varía por tipo: pensador_id, disciplina_id, etc.
			for (const k of [
				"pensador_id",
				"disciplina_id",
				"concepto_id",
				"teoria_id",
				"cita_id",
			]) {
				const v = mencion[k];
				if (typeof v === "string") return v;
			}
			return null;
		}
		default:
			// Campos "extra" (marcar_semilla_fractal, etc): el valor
			// previo lo conoce el cliente y llegará explícitamente si
			// corresponde. Dejamos null para no mentir en el historial.
			return null;
	}
}
//#endregion ![action]

//#region [action] - 🔧 listarEdicionesHumanasPorMencion 🔧
/**
 * Historial append-only de ediciones humanas sobre una mención,
 * cronológico descendente (más reciente primero) para que la UI pueda
 * mostrarlo como timeline directamente.
 */
export async function listarEdicionesHumanasPorMencion(
	mencionId: string,
	tipo: TipoEntidad,
): Promise<Result<EdicionHumanaConTipo[], ResultErrorCode>> {
	const parseId = UUID_SCHEMA.safeParse(mencionId);
	const parseTipo = TIPO_ENTIDAD_SCHEMA.safeParse(tipo);
	if (!parseId.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();
	const res = await listarEdicionesPorTipo(supabase, tipo, mencionId);

	if (res.error) {
		console.error("[listarEdicionesHumanasPorMencion]:", res.error);
		return fail<ResultErrorCode>("INTERNAL");
	}

	const items: EdicionHumanaConTipo[] = ((res.data ?? []) as unknown[]).map(
		(edicion) => ({ tipo, edicion }) as EdicionHumanaConTipo,
	);
	return ok(items);
}

async function listarEdicionesPorTipo(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidad,
	mencionId: string,
): Promise<{ data: unknown[] | null; error: unknown }> {
	switch (tipo) {
		case "pensador":
			return supabase
				.from("cgt_pensadores_ediciones_humanas")
				.select("*")
				.eq("mencion_id", mencionId)
				.order("created_at", { ascending: false });
		case "disciplina":
			return supabase
				.from("cgt_disciplinas_ediciones_humanas")
				.select("*")
				.eq("mencion_id", mencionId)
				.order("created_at", { ascending: false });
		case "concepto":
			return supabase
				.from("cgt_conceptos_ediciones_humanas")
				.select("*")
				.eq("mencion_id", mencionId)
				.order("created_at", { ascending: false });
		case "teoria":
			return supabase
				.from("cgt_teorias_ediciones_humanas")
				.select("*")
				.eq("mencion_id", mencionId)
				.order("created_at", { ascending: false });
		case "cita":
			return supabase
				.from("cgt_citas_ediciones_humanas")
				.select("*")
				.eq("mencion_id", mencionId)
				.order("created_at", { ascending: false });
	}
}
//#endregion ![action]

//#region [action] - 🔧 listarEntidadesCanonicasProyecto 🔧
/**
 * Lista las entidades canónicas del proyecto (con conteo inline cuando
 * aplica: pensadores/disciplinas/conceptos/teorías). Citas usan la
 * canónica pura porque `SQL §9` no define vista con conteo para ellas
 * (cada aparición es conceptualmente única).
 *
 * Ordenamiento alfabético por nombre canónico (o `texto` para citas)
 * para UX predecible en los dropdowns de reasignación.
 */
export async function listarEntidadesCanonicasProyecto(
	projectId: string,
	tipo: TipoEntidad,
): Promise<Result<EntidadCanonicaListable[], ResultErrorCode>> {
	const parseId = UUID_SCHEMA.safeParse(projectId);
	const parseTipo = TIPO_ENTIDAD_SCHEMA.safeParse(tipo);
	if (!parseId.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();
	const res = await listarCanonicasPorTipo(supabase, tipo, projectId);

	if (res.error) {
		console.error("[listarEntidadesCanonicasProyecto]:", res.error);
		return fail<ResultErrorCode>("INTERNAL");
	}

	const items: EntidadCanonicaListable[] = ((res.data ?? []) as unknown[]).map(
		(entidad) => ({ tipo, entidad }) as EntidadCanonicaListable,
	);
	return ok(items);
}

async function listarCanonicasPorTipo(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	tipo: TipoEntidad,
	projectId: string,
): Promise<{ data: unknown[] | null; error: unknown }> {
	switch (tipo) {
		case "pensador":
			return supabase
				.from("cgt_vw_pensadores_con_conteo")
				.select("*")
				.eq("project_id", projectId)
				.order("nombre_canonico", { ascending: true });
		case "disciplina":
			return supabase
				.from("cgt_vw_disciplinas_con_conteo")
				.select("*")
				.eq("project_id", projectId)
				.order("nombre_canonico", { ascending: true });
		case "concepto":
			return supabase
				.from("cgt_vw_conceptos_con_conteo")
				.select("*")
				.eq("project_id", projectId)
				.order("nombre_canonico", { ascending: true });
		case "teoria":
			return supabase
				.from("cgt_vw_teorias_con_conteo")
				.select("*")
				.eq("project_id", projectId)
				.order("nombre_canonico", { ascending: true });
		case "cita":
			// Citas no tienen vista con conteo (cada aparición es única).
			// Se consulta la tabla canónica directa ordenada por `texto`.
			return supabase
				.from("cgt_citas")
				.select("*")
				.eq("project_id", projectId)
				.order("texto", { ascending: true });
	}
}
//#endregion ![action]
