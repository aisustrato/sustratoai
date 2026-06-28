// 📍 lib/cognetica-forense/mdj-contenido.ts
// Helpers para el contenido de los documentos del artefacto, que pasó a guardar
// el MDJ serializado donde antes vivía el MD (in-place, sin tabla).
//
// El MDJ es el nuevo MD. El contenido puede estar en dos formas:
//   - MDJ serializado: JSON.stringify(DocumentoMDJ) (nuevo, con anotaciones horneadas)
//   - MD plano: legacy, hasta que se hornea.
//
// `mdDesdeContenido` es el ACCESOR DE COMPATIBILIDAD: todo consumidor que necesite
// markdown lo usa y obtiene MD venga el contenido como venga (MDJ → exportado;
// MD → tal cual). Volver a MD desde MDJ es trivial (lib/mdj/exportador.ts).

import { parsearMDJ } from "@/lib/mdj/parser";
import { exportarMDPuro } from "@/lib/mdj/exportador";
import type { DocumentoMDJ } from "@/lib/mdj/types";

/** Intenta interpretar el contenido como un DocumentoMDJ serializado. */
function parseMdjSeguro(contenido: string): DocumentoMDJ | null {
	const s = contenido.trimStart();
	if (!s.startsWith("{")) return null; // atajo: el MD plano no empieza con '{'
	try {
		const obj = JSON.parse(contenido) as unknown;
		if (
			obj &&
			typeof obj === "object" &&
			(obj as DocumentoMDJ).version === "0.1" &&
			Array.isArray((obj as DocumentoMDJ).nodos)
		) {
			return obj as DocumentoMDJ;
		}
		return null;
	} catch {
		return null; // no es JSON → MD plano
	}
}

/** True si el contenido ya está guardado como MDJ serializado. */
export function esMdj(contenido: string | null | undefined): boolean {
	if (!contenido) return false;
	return parseMdjSeguro(contenido) !== null;
}

/**
 * Devuelve el DocumentoMDJ del contenido. Si ya es MDJ, lo deserializa (con sus
 * anotaciones horneadas); si es MD plano (legacy), lo parsea al vuelo (anotaciones
 * vacías).
 */
export function mdjDesdeContenido(
	contenido: string,
	artefactoId: string,
	tipoArtefacto: DocumentoMDJ["tipo_artefacto"] = "otro",
): DocumentoMDJ {
	const mdj = parseMdjSeguro(contenido);
	if (mdj) return mdj;
	return parsearMDJ(contenido, artefactoId, tipoArtefacto);
}

/**
 * ACCESOR DE COMPATIBILIDAD: devuelve markdown a partir del contenido, sea MDJ
 * (lo exporta) o MD plano (lo devuelve tal cual). Lo usa todo consumidor que
 * espera markdown.
 */
export function mdDesdeContenido(contenido: string | null | undefined): string {
	if (!contenido) return "";
	const mdj = parseMdjSeguro(contenido);
	return mdj ? exportarMDPuro(mdj) : contenido;
}

/** Serializa un DocumentoMDJ para guardarlo en el campo de contenido. */
export function serializarMdj(doc: DocumentoMDJ): string {
	return JSON.stringify(doc);
}
