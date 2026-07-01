//. 📍 lib/actions/cognetica-forense-direcciones-actions.ts
/**
 * Server Action del **MDJ FRÍO in-place**.
 *
 * `asegurarMdjArtefacto`: hornea las anotaciones (entidades + referencias) dentro
 * del MDJ de cada documento de texto y lo PISA en su lugar (crónica/germinal/
 * original). Devuelve los DocumentoMDJ horneados para el primer render del visor.
 * Lo llama el visor SOLO cuando el contenido todavía es MD plano (legacy); los ya
 * horneados se pintan en frío desde el propio contenido, sin tocar esta acción.
 *
 * El error es un string user-facing CON el detalle real — nada de fallar en
 * silencio (el visor lo muestra).
 */

"use server";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { ok, fail } from "@/lib/cognetica-forense/result";
import type { Result } from "@/lib/cognetica-forense/types";
import {
	construirMdjArtefacto,
	type MdjPorDocumento,
} from "@/lib/cognetica-forense/direcciones/resolver";

const UUID = z.string().uuid();

export type { MdjPorDocumento };

export async function asegurarMdjArtefacto(
	artefactoId: string,
): Promise<Result<MdjPorDocumento, string>> {
	if (!UUID.safeParse(artefactoId).success) return fail("ID de artefacto inválido");

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail("No autorizado (sesión)");

	const res = await construirMdjArtefacto(artefactoId);
	if (!res.ok) {
		const msg = `No se pudo hornear el MDJ: ${res.error ?? "error desconocido"}`;
		console.error("[cognetica:mdj-frio]", msg);
		return fail(msg);
	}
	return ok(res.docs);
}

/** Una ocurrencia (dirección) de una mención dentro de un documento. */
export interface OcurrenciaDireccion {
	documento: string;
	nodo_id: string;
	offset_inicio: number;
	offset_fin: number;
}

// Orden de documentos para "Ubicar": primero el abierto por default.
const PREFERENCIA_DOC = ["original", "cronica", "germinal"];

/**
 * Compara dos nodo_id por POSICIÓN EN EL DOCUMENTO. Los ids son rutas anidadas
 * con puntos (`h1_0.h2_4.h3_0.p_0`) donde cada segmento `<tipo>_<n>` lleva su
 * índice en orden de lectura. Se comparan segmento a segmento por su número; la
 * ruta más corta (un ancestro/intro) va primero ante prefijo común.
 */
function numeroSegmento(seg: string): number {
	const m = seg.match(/_(\d+)$/);
	return m ? parseInt(m[1], 10) : 0;
}

function compararNodoId(a: string, b: string): number {
	const ka = a.split(".").map(numeroSegmento);
	const kb = b.split(".").map(numeroSegmento);
	const n = Math.max(ka.length, kb.length);
	for (let i = 0; i < n; i++) {
		const va = ka[i] ?? -1;
		const vb = kb[i] ?? -1;
		if (va !== vb) return va - vb;
	}
	return 0;
}

/**
 * Todas las ocurrencias (direcciones) de una mención, ordenadas por documento
 * (original > crónica > germinal) y posición (nodo + offset). Base de "Ubicar en
 * texto": no depende del string del nombre — usa las direcciones horneadas.
 */
export async function listarDireccionesMencion(
	artefactoId: string,
	tipoMencion: string,
	mencionId: string,
): Promise<Result<OcurrenciaDireccion[], string>> {
	if (!UUID.safeParse(artefactoId).success || !UUID.safeParse(mencionId).success) {
		return fail("ID inválido");
	}
	const supabase = await createServerClient();
	const { data, error } = await supabase
		.from("cgt_menciones_direcciones")
		.select("documento, nodo_id, offset_inicio, offset_fin")
		.eq("artefacto_id", artefactoId)
		.eq("tipo_mencion", tipoMencion)
		.eq("mencion_id", mencionId);

	if (error) {
		console.error("[listarDireccionesMencion]", error);
		return fail("No se pudieron leer las direcciones de la mención");
	}

	const ocurrencias: OcurrenciaDireccion[] = (data ?? []).map((r) => ({
		documento: r.documento,
		nodo_id: r.nodo_id,
		offset_inicio: r.offset_inicio,
		offset_fin: r.offset_fin,
	}));
	ocurrencias.sort((a, b) => {
		const da = PREFERENCIA_DOC.indexOf(a.documento);
		const db = PREFERENCIA_DOC.indexOf(b.documento);
		const oa = da === -1 ? 99 : da;
		const ob = db === -1 ? 99 : db;
		if (oa !== ob) return oa - ob;
		const cmp = compararNodoId(a.nodo_id, b.nodo_id);
		if (cmp !== 0) return cmp;
		return a.offset_inicio - b.offset_inicio;
	});
	return ok(ocurrencias);
}
