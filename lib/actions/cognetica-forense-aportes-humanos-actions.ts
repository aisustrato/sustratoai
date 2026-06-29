//. 📍 lib/actions/cognetica-forense-aportes-humanos-actions.ts
/**
 * Server Actions de **aportes humanos** sobre artefactos.
 *
 * Hogar de todo lo que un operador humano CREA a mano (no edita: la edición
 * append-only vive en `cognetica-forense-menciones-actions.ts` y queda en su
 * propio mundo). Aquí centralizamos la **generación de hashes nuevos** para
 * cualquier mención creada manualmente, de modo que el control de
 * idempotencia humano viva en un solo lugar.
 *
 * Fase 1 (audio): `crearCitaDesdeSegmento` — el operador marca un segmento de
 * la transcripción de audio y lo guarda como cita, ligada al segmento por
 * timestamp (`ubicacion_en_artefacto = "ts:<inicio>"`, ver
 * `lib/cognetica-forense/citas/emparejar-cita-segmento.ts`).
 *
 * A futuro: otras entidades manuales (pensadores, conceptos, etc.) reusarán
 * este mismo módulo y su lógica de hash.
 *
 * Las menciones creadas aquí llevan `origen = 'humano'` para distinguirlas de
 * las extraídas por el pipeline (`origen = 'llm'`).
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import crypto from "node:crypto";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { ok, fail } from "@/lib/cognetica-forense/result";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import type { CitaMencion } from "@/lib/cognetica-forense/types/oleada2";
import { timestampAUbicacion } from "@/lib/cognetica-forense/citas/emparejar-cita-segmento";
import { construirMdjArtefacto } from "@/lib/cognetica-forense/direcciones/resolver";
//#endregion ![head]

//#region [def] - 📦 SCHEMAS 📦
const UUID_SCHEMA = z.string().uuid();

/** Tipos de mención borrables desde el menú por badge (Fase 4). */
const TIPO_MENCION_SCHEMA = z.enum([
	"pensador",
	"disciplina",
	"concepto",
	"teoria",
	"cita",
]);

const CREAR_CITA_SCHEMA = z.object({
	artefactoId: UUID_SCHEMA,
	segmentoId: UUID_SCHEMA,
});

export interface CrearCitaDesdeSegmentoInput {
	artefactoId: string;
	segmentoId: string;
}
//#endregion ![def]

//#region [helpers] - 🛠️ HASH HUMANO 🛠️
/**
 * Hash de idempotencia para una cita creada por humano. Determinístico por
 * `(origen, artefacto, segmento)`: marcar dos veces el mismo segmento produce
 * el mismo hash, lo que nos permite detectar el duplicado sin constraint de DB.
 */
function hashCitaHumana(artefactoId: string, segmentoId: string): string {
	const canonical = JSON.stringify({
		origen: "humano",
		artefacto_id: artefactoId,
		segmento_id: segmentoId,
	});
	return crypto.createHash("sha256").update(canonical).digest("hex");
}
//#endregion ![helpers]

//#region [api] - 🔧 CREAR CITA DESDE SEGMENTO 🔧
/**
 * Crea una cita-mención humana a partir de un segmento de audio.
 *
 * - El texto de la cita es el texto del segmento.
 * - El vínculo al segmento se guarda como `ubicacion_en_artefacto = "ts:<inicio>"`.
 * - Es **idempotente**: si el segmento ya fue marcado como cita humana, devuelve
 *   la mención existente en vez de duplicar.
 *
 * Autorización vía RLS (INSERT/SELECT fallan si el usuario no es miembro del
 * proyecto → lo mapeamos a `FORBIDDEN`).
 */
export async function crearCitaDesdeSegmento(
	input: CrearCitaDesdeSegmentoInput,
): Promise<Result<CitaMencion, ResultErrorCode>> {
	const parsed = CREAR_CITA_SCHEMA.safeParse(input);
	if (!parsed.success) return fail<ResultErrorCode>("INVALID_INPUT");
	const { artefactoId, segmentoId } = parsed.data;

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail<ResultErrorCode>("UNAUTHORIZED");

	// 1. Leer el segmento y validar que pertenece al artefacto indicado.
	const segRes = await supabase
		.from("cgt_audio_segmentos")
		.select("artefacto_id, texto, timestamp_inicio")
		.eq("id", segmentoId)
		.maybeSingle();
	if (segRes.error) {
		console.error("[crearCitaDesdeSegmento] lectura segmento:", segRes.error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!segRes.data) return fail<ResultErrorCode>("NOT_FOUND");
	if (segRes.data.artefacto_id !== artefactoId) {
		console.error(
			"[crearCitaDesdeSegmento] segmento no pertenece al artefacto",
			`seg=${segmentoId.slice(0, 8)} art=${artefactoId.slice(0, 8)}`,
		);
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	// 2. Resolver project_id desde el artefacto.
	const artRes = await supabase
		.from("cgt_artefactos")
		.select("project_id")
		.eq("id", artefactoId)
		.maybeSingle();
	if (artRes.error) {
		console.error("[crearCitaDesdeSegmento] lectura artefacto:", artRes.error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!artRes.data) return fail<ResultErrorCode>("NOT_FOUND");
	const projectId = artRes.data.project_id;

	const hash = hashCitaHumana(artefactoId, segmentoId);

	// 3. Idempotencia: si ya existe la cita humana de este segmento, devolverla.
	const existenteRes = await supabase
		.from("cgt_citas_menciones")
		.select("*")
		.eq("artefacto_id", artefactoId)
		.eq("hash_extractor_crudo", hash)
		.maybeSingle();
	if (existenteRes.error) {
		console.error(
			"[crearCitaDesdeSegmento] chequeo duplicado:",
			existenteRes.error,
		);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (existenteRes.data) return ok(existenteRes.data as CitaMencion);

	// 4. Insertar la cita-mención humana.
	const insertRes = await supabase
		.from("cgt_citas_menciones")
		.insert({
			artefacto_id: artefactoId,
			project_id: projectId,
			texto_extractor_crudo: segRes.data.texto,
			ubicacion_en_artefacto: timestampAUbicacion(segRes.data.timestamp_inicio),
			origen: "humano",
			hash_extractor_crudo: hash,
		})
		.select("*")
		.single();

	if (insertRes.error) {
		const pgErr = insertRes.error as { code?: string };
		console.error("[crearCitaDesdeSegmento] insert:", insertRes.error);
		if (pgErr.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
		if (pgErr.code === "23505") return fail<ResultErrorCode>("DUPLICATE");
		return fail<ResultErrorCode>("INTERNAL");
	}

	return ok(insertRes.data as CitaMencion);
}
//#endregion ![api]

//#region [api] - 🔧 ELIMINAR CITA HUMANA 🔧
/**
 * Elimina una cita-mención **creada por humano** (toggle "Quitar cita").
 *
 * Sólo borra filas con `origen = 'humano'`: nunca toca las citas del pipeline
 * (LLM) ni deja ediciones humanas huérfanas. Si la mención no es humana,
 * devuelve `FORBIDDEN` (no se puede des-extraer una cita del pipeline desde acá).
 */
export async function eliminarCitaMencion(
	mencionId: string,
): Promise<Result<{ id: string }, ResultErrorCode>> {
	const parseId = UUID_SCHEMA.safeParse(mencionId);
	if (!parseId.success) return fail<ResultErrorCode>("INVALID_INPUT");

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail<ResultErrorCode>("UNAUTHORIZED");

	// 1. Validar que la mención existe y es de origen humano.
	const mencionRes = await supabase
		.from("cgt_citas_menciones")
		.select("id, origen")
		.eq("id", mencionId)
		.maybeSingle();
	if (mencionRes.error) {
		console.error("[eliminarCitaMencion] lectura:", mencionRes.error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!mencionRes.data) return fail<ResultErrorCode>("NOT_FOUND");
	if (mencionRes.data.origen !== "humano") {
		return fail<ResultErrorCode>("FORBIDDEN");
	}

	// 2. Borrar (defensivo: la condición origen='humano' también en el DELETE).
	const delRes = await supabase
		.from("cgt_citas_menciones")
		.delete()
		.eq("id", mencionId)
		.eq("origen", "humano");
	if (delRes.error) {
		const pgErr = delRes.error as { code?: string };
		console.error("[eliminarCitaMencion] delete:", delRes.error);
		if (pgErr.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
		return fail<ResultErrorCode>("INTERNAL");
	}

	return ok({ id: mencionId });
}
//#endregion ![api]

//#region [api] - 🔧 ELIMINAR MENCIÓN (cualquier tipo) 🔧
/**
 * Elimina una mención cartografiada de un artefacto, de cualquier tipo
 * (pensador/disciplina/concepto/teoría/cita). Es la acción "Eliminar" del menú
 * por badge (Fase 4): curación del grafo — quitar un falso positivo del pipeline
 * o una mención humana errónea.
 *
 * Tras borrar, **re-hornea el MDJ in-place** del artefacto para que el resaltado
 * de la mención desaparezca de los textos. El re-horneado es best-effort: si
 * falla, el borrado YA ocurrió y el próximo open del visor lo recompone; se
 * loguea con contexto (nunca silencioso).
 */
export async function eliminarMencion(
	mencionId: string,
	tipo: string,
	artefactoId: string,
): Promise<Result<{ id: string }, ResultErrorCode>> {
	const parseId = UUID_SCHEMA.safeParse(mencionId);
	const parseArt = UUID_SCHEMA.safeParse(artefactoId);
	const parseTipo = TIPO_MENCION_SCHEMA.safeParse(tipo);
	if (!parseId.success || !parseArt.success || !parseTipo.success) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail<ResultErrorCode>("UNAUTHORIZED");

	// Switch con tablas literales: el cliente tipado de Supabase infiere mejor
	// con literales que con un string dinámico (evita "never").
	const delRes = await (async () => {
		switch (parseTipo.data) {
			case "pensador":
				return supabase.from("cgt_pensadores_menciones").delete().eq("id", mencionId);
			case "disciplina":
				return supabase.from("cgt_disciplinas_menciones").delete().eq("id", mencionId);
			case "concepto":
				return supabase.from("cgt_conceptos_menciones").delete().eq("id", mencionId);
			case "teoria":
				return supabase.from("cgt_teorias_menciones").delete().eq("id", mencionId);
			case "cita":
				return supabase.from("cgt_citas_menciones").delete().eq("id", mencionId);
		}
	})();

	if (delRes.error) {
		const pgErr = delRes.error as { code?: string };
		console.error("[eliminarMencion] delete:", delRes.error);
		if (pgErr.code === "42501") return fail<ResultErrorCode>("FORBIDDEN");
		return fail<ResultErrorCode>("INTERNAL");
	}

	// Re-hornear in-place: que el resaltado de la mención borrada desaparezca.
	const rebake = await construirMdjArtefacto(artefactoId);
	if (!rebake.ok) {
		console.error("[eliminarMencion] re-hornear MDJ:", rebake.error);
	}

	return ok({ id: mencionId });
}
//#endregion ![api]
