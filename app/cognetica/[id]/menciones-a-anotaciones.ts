// 📍 app/cognetica/[id]/menciones-a-anotaciones.ts
// Glue Cognética ↔ MDJ: convierte menciones de pensadores (autores) en
// anotaciones del visor MDJ, ubicándolas en el texto vía el buscador.
//
// Estrategia §5 del requerimiento: el resaltado se calcula al vuelo buscando el
// nombre canónico de la entidad en el documento (no se persiste posición).
//
// Legacy: el nombre canónico se guarda "lindo" (nombre + apellido), pero en el
// texto/citas muchas veces aparece solo el apellido (o solo el nombre). Por eso
// se busca el nombre completo Y cada palabra significativa por separado,
// evitando solapamientos.

import type { DocumentoMDJ, Anotacion, CoincidenciaBusqueda } from "@/lib/mdj/types";
import { buscarEnDocumento } from "@/lib/mdj/buscador";
import type { MencionConValorCanonico } from "@/lib/actions/cognetica-forense-menciones-actions";

// Partículas/conectores que no se buscan sueltos (generan ruido).
const PARTICULAS = new Set([
	"de", "del", "la", "las", "los", "el", "von", "van", "der", "di", "da",
	"dos", "do", "e", "y", "san", "santa", "st", "le", "mc", "mac",
]);

/** Cuenta las letras (unicode) de un token — ignora puntos/iniciales. */
function cantidadLetras(token: string): number {
	return (token.match(/\p{L}/gu) ?? []).length;
}

/**
 * Divide un nombre en palabras significativas: ≥ 3 LETRAS (no solo largo, para
 * descartar iniciales como "J." o "J.R.") y sin partículas (de, la, von…).
 */
function palabrasSignificativas(nombre: string): string[] {
	return nombre
		.split(/\s+/)
		.map((t) => t.trim())
		.filter((t) => cantidadLetras(t) >= 3 && !PARTICULAS.has(t.toLowerCase()));
}

/**
 * Genera anotaciones de tipo "entidad" para cada aparición de un pensador en el
 * documento. Busca el nombre completo y, además, cada palabra (nombre/apellido)
 * suelta donde no se haya resaltado ya. Multi-ocurrencia.
 */
export function pensadoresAAnotaciones(
	doc: DocumentoMDJ,
	menciones: MencionConValorCanonico[],
): Anotacion[] {
	const anotaciones: Anotacion[] = [];

	// Rangos ya resaltados por nodo, para no solapar (full name vs apellido).
	const ocupado = new Map<string, Array<[number, number]>>();
	const solapa = (nodoId: string, ini: number, fin: number) =>
		(ocupado.get(nodoId) ?? []).some(([a, b]) => ini < b && a < fin);
	const ocupar = (nodoId: string, ini: number, fin: number) => {
		const rs = ocupado.get(nodoId) ?? [];
		rs.push([ini, fin]);
		ocupado.set(nodoId, rs);
	};

	for (const m of menciones) {
		if (m.tipo !== "pensador") continue;

		const vc = m.valor_canonico;
		const nombre = vc.nombre_canonico_actual;
		if (!nombre || nombre.trim().length < 2) continue;

		const entidadId = vc.pensador_id ?? undefined;
		const descripcion = vc.descripcion_canonica_actual ?? undefined;

		const agregar = (c: CoincidenciaBusqueda) => {
			if (solapa(c.nodo_id, c.offset_inicio, c.offset_fin)) return;
			ocupar(c.nodo_id, c.offset_inicio, c.offset_fin);
			anotaciones.push({
				id: `entidad-${entidadId ?? "x"}-${c.nodo_id}-${c.offset_inicio}`,
				tipo: "entidad",
				nodo_id: c.nodo_id,
				offset_inicio: c.offset_inicio,
				offset_fin: c.offset_fin,
				fragmento: nombre, // el tooltip muestra el nombre completo
				entidad_id: entidadId,
				nota_texto: descripcion,
			});
		};

		// 1. Nombre completo (resaltado de una sola pieza donde aparezca).
		for (const c of buscarEnDocumento(doc, nombre, { palabraCompleta: true })) {
			agregar(c);
		}

		// 2. Cada palabra suelta (apellido/nombre) donde no esté ya cubierta.
		//    Palabra completa: "May" no debe matchear dentro de "mayor".
		const palabras = palabrasSignificativas(nombre);
		if (palabras.length > 1) {
			for (const palabra of palabras) {
				for (const c of buscarEnDocumento(doc, palabra, { palabraCompleta: true })) {
					agregar(c);
				}
			}
		}
	}

	return anotaciones;
}
