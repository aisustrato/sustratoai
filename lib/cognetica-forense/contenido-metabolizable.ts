//. 📍 lib/cognetica-forense/contenido-metabolizable.ts
/**
 * Obtención del contenido unificado listo para metabolizar.
 *
 * Dado un `artefacto_id`, despacha por `tipo` y devuelve un `string` Markdown
 * unificado que sirve como input del LLM para todos los formatos (Crónica,
 * Destilado, Núcleo, Germinal).
 *
 * **Mapa por tipo** (alineado a `docs/cognetica/addendum_requerimiento_windsurf_v11.md §5.2` y
 * `docs/cognetica/pipeline_metabolizacion_v1.md §3`):
 *   - `markdown`     → `cgt_artefactos_markdown.contenido`
 *   - `audio`        → concatena `cgt_audio_segmentos` con `[HH:MM:SS] hablante: texto`
 *   - `video`        → concatena `cgt_video_segmentos` mismo patrón
 *   - `pdf_informe`  → `cgt_artefactos_pdf_informe.markdown_renderizado`
 *   - `pdf_slides`   → concatena `paginas[].texto` con `--- Página N ---`
 *   - `imagen`       → `cgt_imagenes_descritas.descripcion_humana ?? descripcion_ia`
 *
 * **Reutilización v1**: idea de dispatch + separadores por página tomada de
 * `cognetica-old-helpers.ts::getArtifactTextContent`. Adaptada al schema v2
 * `cgt_*` y simplificada en firma. Ver `docs/cognetica/REUTILIZACION_V1_EN_V2.md §3`.
 *
 * **Estado Oleada 1**: solo `markdown` está soportado end-to-end (único tipo
 * ingestable en la Oleada 1). Los demás tipos retornan `MISSING_UPSTREAM`
 * para que las Server Actions fallen explícitamente cuando se intente
 * metabolizar un artefacto cuya ingesta aún no está implementada.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
	CgtHablante,
	CgtPaginaSlide,
	Result,
	ResultErrorCode,
} from "@/lib/cognetica-forense/types";
import { fail, ok } from "@/lib/cognetica-forense/result";
import type { Database, Json } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 📦 TIPO DE RETORNO 📦
/**
 * Retorno de `obtenerContenidoMetabolizable`.
 *
 * `contenido` es Markdown plano; `tokens_estimados` se precalcula para que
 * el caller pueda decidir chunking sin re-llamar al estimador.
 */
export interface ContenidoMetabolizable {
	contenido: string;
	tokens_estimados: number;
}
//#endregion ![def]

//#region [main] - 🔧 DISPATCHER 🔧
/**
 * Dispatcher principal. Asume que el artefacto existe y pertenece a un
 * proyecto del usuario (la RLS se ocupa). El caller (Server Action) debe
 * haber validado autorización antes.
 */
export async function obtenerContenidoMetabolizable(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	const { data: art, error: artErr } = await supabase
		.from("cgt_artefactos")
		.select("id, tipo, titulo")
		.eq("id", artefactoId)
		.maybeSingle();

	if (artErr) {
		console.error("[contenido-metabolizable] error al leer artefacto:", artErr);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!art) {
		return fail<ResultErrorCode>("NOT_FOUND");
	}

	switch (art.tipo) {
		case "markdown":
			return obtenerMarkdown(supabase, artefactoId);
		case "audio":
			return obtenerAudio(supabase, artefactoId);
		case "video":
			return obtenerVideo(supabase, artefactoId);
		case "pdf_informe":
			return obtenerPdfInforme(supabase, artefactoId);
		case "pdf_slides":
			return obtenerPdfSlides(supabase, artefactoId);
		case "imagen":
			return obtenerImagen(supabase, artefactoId);
		default:
			return fail<ResultErrorCode>("NOT_IMPLEMENTED");
	}
}
//#endregion ![main]

//#region [main] - 🔧 DESPACHADORES POR TIPO 🔧

async function obtenerMarkdown(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	const { data, error } = await supabase
		.from("cgt_artefactos_markdown")
		.select("contenido")
		.eq("artefacto_id", artefactoId)
		.maybeSingle();

	if (error) {
		console.error("[contenido-metabolizable] markdown:", error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!data?.contenido) {
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}
	return ok(envolverContenido(data.contenido));
}

async function obtenerAudio(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	// Preferir segmentos con timestamp + hablante. Fallback a
	// `transcripcion_completa` si no hay segmentos (audios viejos o ingesta
	// sin diarización).
	const [segRes, audioRes] = await Promise.all([
		supabase
			.from("cgt_audio_segmentos")
			.select("timestamp_inicio, hablante_id, texto")
			.eq("artefacto_id", artefactoId)
			.order("timestamp_inicio", { ascending: true }),
		supabase
			.from("cgt_artefactos_audio")
			.select("transcripcion_completa, hablantes")
			.eq("artefacto_id", artefactoId)
			.maybeSingle(),
	]);

	if (segRes.error) {
		console.error("[contenido-metabolizable] audio segmentos:", segRes.error);
		return fail<ResultErrorCode>("INTERNAL");
	}

	const hablantes = parseHablantes(audioRes.data?.hablantes);
	const segments = segRes.data ?? [];

	if (segments.length > 0) {
		const lines = segments.map((s) => {
			const ts = formatearTimestamp(s.timestamp_inicio);
			const nombreHablante = resolverHablante(s.hablante_id, hablantes);
			return `[${ts}] ${nombreHablante}: ${s.texto}`;
		});
		return ok(envolverContenido(lines.join("\n")));
	}

	if (audioRes.data?.transcripcion_completa) {
		return ok(envolverContenido(audioRes.data.transcripcion_completa));
	}

	return fail<ResultErrorCode>("MISSING_UPSTREAM");
}

async function obtenerVideo(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	const [segRes, videoRes] = await Promise.all([
		supabase
			.from("cgt_video_segmentos")
			.select("timestamp_inicio, hablante_id, texto")
			.eq("artefacto_id", artefactoId)
			.order("timestamp_inicio", { ascending: true }),
		supabase
			.from("cgt_artefactos_video")
			.select("transcripcion_completa, hablantes")
			.eq("artefacto_id", artefactoId)
			.maybeSingle(),
	]);

	if (segRes.error) {
		console.error("[contenido-metabolizable] video segmentos:", segRes.error);
		return fail<ResultErrorCode>("INTERNAL");
	}

	const hablantes = parseHablantes(videoRes.data?.hablantes);
	const segments = segRes.data ?? [];

	if (segments.length > 0) {
		const lines = segments
			.filter((s) => !!s.texto)
			.map((s) => {
				const ts = formatearTimestamp(s.timestamp_inicio);
				const nombreHablante = resolverHablante(s.hablante_id, hablantes);
				return `[${ts}] ${nombreHablante}: ${s.texto}`;
			});
		return ok(envolverContenido(lines.join("\n")));
	}

	if (videoRes.data?.transcripcion_completa) {
		return ok(envolverContenido(videoRes.data.transcripcion_completa));
	}

	return fail<ResultErrorCode>("MISSING_UPSTREAM");
}

async function obtenerPdfInforme(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	const { data, error } = await supabase
		.from("cgt_artefactos_pdf_informe")
		.select("markdown_renderizado")
		.eq("artefacto_id", artefactoId)
		.maybeSingle();

	if (error) {
		console.error("[contenido-metabolizable] pdf_informe:", error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	if (!data?.markdown_renderizado) {
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}
	return ok(envolverContenido(data.markdown_renderizado));
}

async function obtenerPdfSlides(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	const { data, error } = await supabase
		.from("cgt_artefactos_pdf_slides")
		.select("paginas")
		.eq("artefacto_id", artefactoId)
		.maybeSingle();

	if (error) {
		console.error("[contenido-metabolizable] pdf_slides:", error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	const paginas = parsePaginas(data?.paginas);
	if (!paginas.length) {
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}

	const bloques = paginas.map((p) => {
		const cabecera = p.titulo ? `${p.numero}. ${p.titulo}` : `${p.numero}`;
		const cuerpo = [p.texto, p.notas ? `Notas: ${p.notas}` : ""]
			.filter(Boolean)
			.join("\n\n");
		return `--- Página ${cabecera} ---\n\n${cuerpo}`;
	});
	return ok(envolverContenido(bloques.join("\n\n")));
}

async function obtenerImagen(
	supabase: SupabaseClient<Database>,
	artefactoId: string,
): Promise<Result<ContenidoMetabolizable, ResultErrorCode>> {
	// Metabolizar una imagen = metabolizar su descripción (humana > IA).
	const { data, error } = await supabase
		.from("cgt_imagenes_descritas")
		.select("descripcion_humana, descripcion_ia")
		.eq("artefacto_id", artefactoId)
		.order("created_at", { ascending: true })
		.limit(1)
		.maybeSingle();

	if (error) {
		console.error("[contenido-metabolizable] imagen:", error);
		return fail<ResultErrorCode>("INTERNAL");
	}
	const texto = data?.descripcion_humana ?? data?.descripcion_ia;
	if (!texto) {
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}
	return ok(envolverContenido(texto));
}
//#endregion ![main]

//#region [helpers] - 🛠️ UTILIDADES INTERNAS 🛠️
/** Envuelve un string en el shape de `ContenidoMetabolizable`. */
function envolverContenido(contenido: string): ContenidoMetabolizable {
	return {
		contenido,
		tokens_estimados: estimateTokensFallback(contenido),
	};
}

/**
 * Estimador de tokens (4 chars/token ES). Duplicado local para evitar
 * importar desde `/utils/token-counter` — este archivo es `"use server"`
 * y no queremos importar módulos que pudieran traer side-effects de cliente.
 */
function estimateTokensFallback(text: string): number {
	return Math.ceil((text?.length ?? 0) / 4);
}

/**
 * Formatea un timestamp en segundos a `HH:MM:SS`. Si es `< 1h`, usa `MM:SS`.
 */
function formatearTimestamp(seg: number): string {
	const s = Math.floor(seg);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const rest = s % 60;
	const pad = (n: number) => n.toString().padStart(2, "0");
	if (h > 0) return `${pad(h)}:${pad(m)}:${pad(rest)}`;
	return `${pad(m)}:${pad(rest)}`;
}

function resolverHablante(
	hablanteId: string | null,
	hablantes: CgtHablante[],
): string {
	if (!hablanteId) return "hablante";
	const h = hablantes.find((x) => x.id === hablanteId);
	return h?.nombre ?? hablanteId;
}

/**
 * Type guard suave sobre el JSONB `hablantes` del audio/video. Si no calza
 * con el shape esperado, retorna `[]` (no rompe metabolización por un
 * registro malformado).
 */
function parseHablantes(raw: Json | null | undefined): CgtHablante[] {
	if (!Array.isArray(raw)) return [];
	const lista: CgtHablante[] = [];
	for (const item of raw) {
		if (
			item &&
			typeof item === "object" &&
			!Array.isArray(item) &&
			typeof (item as Record<string, unknown>).id === "string" &&
			typeof (item as Record<string, unknown>).nombre === "string"
		) {
			const obj = item as Record<string, unknown>;
			lista.push({
				id: obj.id as string,
				nombre: obj.nombre as string,
				metadata:
					obj.metadata && typeof obj.metadata === "object" ?
						(obj.metadata as Record<string, unknown>)
					:	undefined,
			});
		}
	}
	return lista;
}

/** Type guard suave sobre el JSONB `paginas` de pdf_slides. */
function parsePaginas(raw: Json | null | undefined): CgtPaginaSlide[] {
	if (!Array.isArray(raw)) return [];
	const out: CgtPaginaSlide[] = [];
	for (const item of raw) {
		if (item && typeof item === "object" && !Array.isArray(item)) {
			const obj = item as Record<string, unknown>;
			if (typeof obj.numero === "number" && typeof obj.texto === "string") {
				out.push({
					numero: obj.numero,
					titulo: typeof obj.titulo === "string" ? obj.titulo : null,
					texto: obj.texto,
					notas: typeof obj.notas === "string" ? obj.notas : null,
				});
			}
		}
	}
	return out;
}
//#endregion ![helpers]
