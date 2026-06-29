// 📍 lib/cognetica-forense/direcciones/resolver.ts
// Builder del MDJ FRÍO: hornea las anotaciones (entidades + referencias) dentro
// del DocumentoMDJ de cada documento de texto y lo PISA en su mismo lugar (el MDJ
// es el nuevo MD). Sin tabla aparte.
//
//   - crónica  → cgt_cronicas.contenido      (texto)
//   - germinal → cgt_germinales.resumen      (texto)
//   - original → Storage en storage_path_md  (preserva storage_path_original)
//
// destilado/núcleo: fuera de alcance (JSON estructurado, sin MD almacenado).
//
// Se llama: al final del Cartografiador (nuevos) y lazy al abrir un legacy.
// Idempotente (re-hornea sobre el contenido actual, sea MD o MDJ). Best-effort:
// si algo falla, loguea y devuelve el error (visible).

import { createServerClient } from "@/lib/supabase";
import { buscarEnDocumento } from "@/lib/mdj/buscador";
import type { Anotacion, DocumentoMDJ } from "@/lib/mdj/types";
import {
	mdjDesdeContenido,
	serializarMdj,
} from "@/lib/cognetica-forense/mdj-contenido";
import { obtenerArtefactoCompleto } from "@/lib/actions/cognetica-forense-lecturas-actions";
import {
	listarMencionesPorArtefacto,
	type MencionConValorCanonico,
} from "@/lib/actions/cognetica-forense-menciones-actions";
import {
	listarReferenciasPorArtefacto,
	type ReferenciaArtefacto,
} from "@/lib/actions/cognetica-forense-referencias-actions";
import { ubicarMenciones, type UbicacionMencion } from "./matcher";

const TIPOS = ["pensador", "concepto", "teoria", "disciplina", "cita"] as const;
const DOCUMENTOS = ["cronica", "germinal", "original"] as const;
export type DocumentoTexto = (typeof DOCUMENTOS)[number];

/** Mapa documento → MDJ frío horneado. */
export type MdjPorDocumento = Partial<Record<DocumentoTexto, DocumentoMDJ>>;

/** Fila a insertar en `cgt_menciones_direcciones` (Brick #1). */
interface FilaDireccion {
	project_id: string;
	artefacto_id: string;
	tipo_mencion: UbicacionMencion["tipo"];
	mencion_id: string;
	documento: DocumentoTexto;
	nodo_id: string;
	offset_inicio: number;
	offset_fin: number;
	origen: "llm" | "humano";
}

const BUCKET = "cognetica-files";

function tipoArtefactoDe(documento: DocumentoTexto): DocumentoMDJ["tipo_artefacto"] {
	return documento === "cronica" ? "cronica" : "otro";
}

/** Mapea una ubicación (dirección MDJ) a su anotación de entidad horneada. */
function anotacionDeUbicacion(u: UbicacionMencion): Anotacion {
	return {
		id: `ent-${u.tipo}-${u.mencionId}-${u.nodoId}-${u.offsetInicio}`,
		tipo: "entidad" as const,
		entidad_tipo: u.tipo,
		nodo_id: u.nodoId,
		offset_inicio: u.offsetInicio,
		offset_fin: u.offsetFin,
		fragmento: u.nombre,
		entidad_id: u.entidadId,
		nota_texto: u.descripcion,
	};
}

/** Anotaciones de referencias: ancla la cita inline en el texto (completa). */
function anotacionesReferencias(
	doc: DocumentoMDJ,
	referencias: ReferenciaArtefacto[],
): Anotacion[] {
	const out: Anotacion[] = [];
	for (const r of referencias) {
		const cita = r.formato_cita_inline?.trim();
		if (!cita || cita.length < 2) continue;
		for (const c of buscarEnDocumento(doc, cita, { palabraCompleta: true })) {
			out.push({
				id: `ref-${r.id}-${c.nodo_id}-${c.offset_inicio}`,
				tipo: "referencia",
				nodo_id: c.nodo_id,
				offset_inicio: c.offset_inicio,
				offset_fin: c.offset_fin,
				fragmento: cita,
				entidad_id: r.id,
			});
		}
	}
	return out;
}

/**
 * Hornea y persiste in-place el MDJ frío de los documentos de texto del artefacto.
 * Devuelve los DocumentoMDJ horneados (para el primer render del visor).
 */
export async function construirMdjArtefacto(
	artefactoId: string,
): Promise<{ ok: boolean; docs: MdjPorDocumento; error?: string }> {
	const supabase = await createServerClient();

	const completoRes = await obtenerArtefactoCompleto(artefactoId);
	if (!completoRes.ok) {
		const error = `lectura artefacto: ${JSON.stringify(completoRes)}`;
		console.error("[cognetica:mdj-frio]", error);
		return { ok: false, docs: {}, error };
	}
	const c = completoRes.data;
	const projectId = c.artefacto.project_id;

	// Contenido actual por documento (puede ser MD legacy o MDJ ya horneado).
	const contenidoPorDocumento: Record<DocumentoTexto, string | null | undefined> = {
		cronica: c.cronica?.contenido,
		germinal: c.germinal?.resumen,
		original: c.contenidoMarkdown,
	};

	// Menciones (5 tipos) + referencias del artefacto.
	const menciones: MencionConValorCanonico[] = [];
	for (const tipo of TIPOS) {
		const r = await listarMencionesPorArtefacto(artefactoId, tipo);
		if (r.ok) menciones.push(...r.data);
		else console.error(`[cognetica:mdj-frio] listar ${tipo}:`, r);
	}
	const refsRes = await listarReferenciasPorArtefacto(artefactoId);
	const referencias = refsRes.ok ? refsRes.data : [];
	if (!refsRes.ok) console.error("[cognetica:mdj-frio] listar referencias:", refsRes);

	const docs: MdjPorDocumento = {};

	// Brick #1: direcciones a persistir en cgt_menciones_direcciones (una fila por
	// ocurrencia de entidad/cita). Se calculan de paso, al hornear cada documento.
	const filasDirecciones: FilaDireccion[] = [];

	for (const documento of DOCUMENTOS) {
		const contenido = contenidoPorDocumento[documento];
		if (!contenido || !contenido.trim()) continue;

		// Parsear (desde MD legacy o MDJ previo) y re-hornear las anotaciones.
		const doc = mdjDesdeContenido(contenido, artefactoId, tipoArtefactoDe(documento));
		const ubicaciones = ubicarMenciones(doc, menciones);
		doc.anotaciones = [
			...ubicaciones.map(anotacionDeUbicacion),
			...anotacionesReferencias(doc, referencias),
		];
		for (const u of ubicaciones) {
			filasDirecciones.push({
				project_id: projectId,
				artefacto_id: artefactoId,
				tipo_mencion: u.tipo,
				mencion_id: u.mencionId,
				documento,
				nodo_id: u.nodoId,
				offset_inicio: u.offsetInicio,
				offset_fin: u.offsetFin,
				// TODO(brick-2/3): propagar el origen real de la mención (humano/llm).
				origen: "llm",
			});
		}
		const serializado = serializarMdj(doc);

		// PISAR en su mismo lugar.
		if (documento === "cronica") {
			const up = await supabase
				.from("cgt_cronicas")
				.update({ contenido: serializado })
				.eq("artefacto_id", artefactoId);
			if (up.error) {
				const error = `pisar crónica: ${up.error.message}`;
				console.error("[cognetica:mdj-frio]", error);
				return { ok: false, docs, error };
			}
		} else if (documento === "germinal") {
			const up = await supabase
				.from("cgt_germinales")
				.update({ resumen: serializado })
				.eq("artefacto_id", artefactoId);
			if (up.error) {
				const error = `pisar germinal: ${up.error.message}`;
				console.error("[cognetica:mdj-frio]", error);
				return { ok: false, docs, error };
			}
		} else {
			// original → Storage (storage_path_md), preservando storage_path_original.
			const path =
				c.artefacto.storage_path_md ??
				`cognetica/${projectId}/${artefactoId}/original.mdj.md`;
			// El contenido es el MDJ serializado (JSON), pero se sube como
			// text/markdown porque el bucket restringe los mime types (igual que el
			// original). Al descargar se lee como texto y se parsea.
			const upload = await supabase.storage
				.from(BUCKET)
				.upload(path, serializado, {
					upsert: true,
					contentType: "text/markdown",
				});
			if (upload.error) {
				const error = `pisar original (storage): ${upload.error.message}`;
				console.error("[cognetica:mdj-frio]", error);
				return { ok: false, docs, error };
			}
			if (!c.artefacto.storage_path_md) {
				const up = await supabase
					.from("cgt_artefactos")
					.update({ storage_path_md: path })
					.eq("id", artefactoId);
				if (up.error) {
					const error = `set storage_path_md: ${up.error.message}`;
					console.error("[cognetica:mdj-frio]", error);
					return { ok: false, docs, error };
				}
			}
		}

		docs[documento] = doc;
	}

	// Brick #1: persistir direcciones (delete+insert por artefacto). Best-effort:
	// si falla, el monolito ya quedó horneado (pinta en frío igual); se loguea.
	const delDir = await supabase
		.from("cgt_menciones_direcciones")
		.delete()
		.eq("artefacto_id", artefactoId);
	if (delDir.error) {
		console.error("[cognetica:mdj-frio] borrar direcciones:", delDir.error);
	} else if (filasDirecciones.length > 0) {
		// Dedupe defensivo contra el unique index (artefacto, documento, tipo,
		// mencion, nodo, offset_inicio).
		const vistos = new Set<string>();
		const unicas = filasDirecciones.filter((f) => {
			const k = `${f.documento}|${f.tipo_mencion}|${f.mencion_id}|${f.nodo_id}|${f.offset_inicio}`;
			if (vistos.has(k)) return false;
			vistos.add(k);
			return true;
		});
		const insDir = await supabase
			.from("cgt_menciones_direcciones")
			.insert(unicas);
		if (insDir.error) {
			console.error("[cognetica:mdj-frio] insertar direcciones:", insDir.error);
		}
	}

	// Marcar normalizado (para iniciar el visor en ON).
	const marca = await supabase
		.from("cgt_artefactos")
		.update({ direcciones_resueltas_at: new Date().toISOString() })
		.eq("id", artefactoId);
	if (marca.error) {
		console.error("[cognetica:mdj-frio] marcar resuelto:", marca.error);
	}

	return { ok: true, docs };
}
