// 📍 lib/cognetica-forense/direcciones/matcher.ts
// Matcher compartido: dado un DocumentoMDJ parseado + las menciones del
// artefacto, ubica cada mención en el texto y devuelve sus direcciones
// (nodo_id + offsets). Lo usa el builder del MDJ frío (resolver.ts) para hornear
// las anotaciones de entidades que se persisten en cgt_documentos_mdj.
//
// Estrategia de matching por tipo:
//   - pensador (autores): nombre completo + cada palabra suelta (apellido/nombre),
//     palabra completa (no subcadena), descartando iniciales/partículas. Así
//     "Alan Turing" también marca "Alan" o "Turing" sueltos en el texto.
//   - concepto / teoría / disciplina: SOLO coincidencia completa (no se parte en
//     palabras). Evita que "teoría de la relatividad" marque cualquier "teoría".
//   - cita: coincidencia completa; si no, ancla por el fragmento inicial.
//   - referencia: coincidencia completa (de su cita inline).
// Best-effort: si no matchea, no inventa (no aparece → fallback por texto).

import type { DocumentoMDJ, CoincidenciaBusqueda } from "@/lib/mdj/types";
import { buscarEnDocumento } from "@/lib/mdj/buscador";
import type { MencionConValorCanonico } from "@/lib/actions/cognetica-forense-menciones-actions";

export type EntidadTipo = "pensador" | "concepto" | "teoria" | "disciplina" | "cita";

/** Una aparición de una mención en el documento (con su dirección MDJ). */
export interface UbicacionMencion {
	tipo: EntidadTipo;
	/** id de la fila en cgt_<tipo>_menciones. */
	mencionId: string;
	/** id de la entidad canónica (para el link); las citas no tienen. */
	entidadId?: string;
	/** Texto visible para el tooltip (nombre canónico o texto de la cita). */
	nombre: string;
	descripcion?: string;
	nodoId: string;
	offsetInicio: number;
	offsetFin: number;
}

const PARTICULAS = new Set([
	"de", "del", "la", "las", "los", "el", "von", "van", "der", "di", "da",
	"dos", "do", "e", "y", "san", "santa", "st", "le", "mc", "mac",
]);

function cantidadLetras(token: string): number {
	return (token.match(/\p{L}/gu) ?? []).length;
}

/** Palabras significativas: ≥ 3 letras, sin partículas (para apellido/nombre). */
function palabrasSignificativas(nombre: string): string[] {
	return nombre
		.split(/\s+/)
		.map((t) => t.trim())
		.filter((t) => cantidadLetras(t) >= 3 && !PARTICULAS.has(t.toLowerCase()));
}

/** Fragmento inicial de una cita (primeras ~8 palabras) para anclarla. */
function anclaCita(texto: string): string {
	const palabras = texto.trim().split(/\s+/);
	if (palabras.length <= 8) return "";
	return palabras.slice(0, 8).join(" ");
}

export interface DatosMencion {
	tipo: EntidadTipo;
	mencionId: string;
	entidadId?: string;
	nombre: string | null;
	descripcion?: string;
	/**
	 * Si true, además de la coincidencia completa se busca cada palabra suelta
	 * (apellido/nombre). Solo para pensadores (autores). El resto de entidades
	 * marca solo por coincidencia completa.
	 */
	partirEnPalabras: boolean;
}

/** Extrae los datos visibles (tipo, nombre, descripción, ids) de una mención. */
export function extraerDatosMencion(m: MencionConValorCanonico): DatosMencion | null {
	switch (m.tipo) {
		case "pensador":
			return { tipo: "pensador", mencionId: m.mencion.id, entidadId: m.valor_canonico.pensador_id ?? undefined, nombre: m.valor_canonico.nombre_canonico_actual, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, partirEnPalabras: true };
		case "concepto":
			return { tipo: "concepto", mencionId: m.mencion.id, entidadId: m.valor_canonico.concepto_id ?? undefined, nombre: m.valor_canonico.nombre_canonico_actual, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, partirEnPalabras: false };
		case "teoria":
			return { tipo: "teoria", mencionId: m.mencion.id, entidadId: m.valor_canonico.teoria_id ?? undefined, nombre: m.valor_canonico.nombre_canonico_actual, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, partirEnPalabras: false };
		case "disciplina":
			return { tipo: "disciplina", mencionId: m.mencion.id, entidadId: m.valor_canonico.disciplina_id ?? undefined, nombre: m.valor_canonico.nombre_canonico_actual, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, partirEnPalabras: false };
		case "cita":
			return { tipo: "cita", mencionId: m.mencion.id, entidadId: undefined, nombre: m.valor_canonico.texto_canonico_actual, descripcion: undefined, partirEnPalabras: false };
		default:
			return null;
	}
}

/**
 * Ubica las menciones en el documento. Multi-ocurrencia, sin solapar.
 */
export function ubicarMenciones(
	doc: DocumentoMDJ,
	menciones: MencionConValorCanonico[],
): UbicacionMencion[] {
	const ubicaciones: UbicacionMencion[] = [];

	// Rangos ya ocupados por nodo, para no solapar (nombre completo vs apellido,
	// o dos entidades que comparten una palabra).
	const ocupado = new Map<string, Array<[number, number]>>();
	const solapa = (nodoId: string, ini: number, fin: number) =>
		(ocupado.get(nodoId) ?? []).some(([a, b]) => ini < b && a < fin);

	for (const m of menciones) {
		const datos = extraerDatosMencion(m);
		if (!datos || !datos.nombre || datos.nombre.trim().length < 2) continue;
		const { tipo, mencionId, entidadId, nombre, descripcion, partirEnPalabras } = datos;

		const agregar = (c: CoincidenciaBusqueda) => {
			if (solapa(c.nodo_id, c.offset_inicio, c.offset_fin)) return;
			const rs = ocupado.get(c.nodo_id) ?? [];
			rs.push([c.offset_inicio, c.offset_fin]);
			ocupado.set(c.nodo_id, rs);
			ubicaciones.push({
				tipo,
				mencionId,
				entidadId,
				nombre,
				descripcion,
				nodoId: c.nodo_id,
				offsetInicio: c.offset_inicio,
				offsetFin: c.offset_fin,
			});
		};

		// 1. Coincidencia completa (nombre o texto de la cita). Aplica a todos.
		const completas = buscarEnDocumento(doc, nombre, { palabraCompleta: true });
		for (const c of completas) agregar(c);

		// 1b. Citas: si no calzó completa, anclar por fragmento inicial.
		if (tipo === "cita" && completas.length === 0) {
			const ancla = anclaCita(nombre);
			if (ancla) {
				for (const c of buscarEnDocumento(doc, ancla, { palabraCompleta: true })) agregar(c);
			}
		}

		// 2. Solo pensadores (autores): además cada palabra suelta (apellido/nombre).
		if (partirEnPalabras) {
			const palabras = palabrasSignificativas(nombre);
			if (palabras.length > 1) {
				for (const palabra of palabras) {
					for (const c of buscarEnDocumento(doc, palabra, { palabraCompleta: true })) agregar(c);
				}
			}
		}
	}

	return ubicaciones;
}
