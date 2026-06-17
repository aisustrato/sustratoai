// 📍 app/cognetica/[id]/menciones-a-anotaciones.ts
// Glue Cognética ↔ MDJ: convierte menciones de entidades (autores/pensadores,
// conceptos, teorías, disciplinas) en anotaciones del visor MDJ, ubicándolas en
// el texto vía el buscador.
//
// Estrategia §5 del requerimiento: el resaltado se calcula al vuelo buscando el
// nombre canónico de la entidad en el documento (no se persiste posición).
//
// Legacy: el nombre canónico se guarda "lindo" (nombre + apellido), pero en el
// texto/citas muchas veces aparece solo el apellido (o una palabra). Por eso se
// busca el nombre completo Y cada palabra significativa, en modo palabra
// completa (un apellido "May" no debe matchear dentro de "mayor").

import type { DocumentoMDJ, Anotacion, CoincidenciaBusqueda } from "@/lib/mdj/types";
import { buscarEnDocumento } from "@/lib/mdj/buscador";
import type { MencionConValorCanonico } from "@/lib/actions/cognetica-forense-menciones-actions";

type EntidadTipo = NonNullable<Anotacion["entidad_tipo"]>;

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
 * Fragmento inicial de una cita (primeras ~8 palabras) para anclarla cuando su
 * texto completo no aparece verbatim. Devuelve "" si la cita es corta (en ese
 * caso ya se intentó la coincidencia completa y el fragmento no aportaría).
 */
function anclaCita(texto: string): string {
	const palabras = texto.trim().split(/\s+/);
	if (palabras.length <= 8) return "";
	return palabras.slice(0, 8).join(" ");
}

/**
 * Extrae (nombre, id) de una mención de entidad NOMBRADA. Las citas se omiten
 * acá (son texto, no entidad con nombre/ficha) y se tratarán por separado.
 */
interface DatosEntidad {
	tipo: EntidadTipo;
	nombre: string | null;
	id: string | undefined;
	descripcion: string | undefined;
	/** Si true, solo se busca la coincidencia COMPLETA (no se parte en palabras). */
	soloCompleto: boolean;
}

function datosEntidad(m: MencionConValorCanonico): DatosEntidad | null {
	// Se accede a m.valor_canonico dentro de cada case para que TS lo estreche
	// por el discriminante m.tipo.
	switch (m.tipo) {
		case "pensador":
			return { tipo: "pensador", nombre: m.valor_canonico.nombre_canonico_actual, id: m.valor_canonico.pensador_id ?? undefined, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, soloCompleto: false };
		case "concepto":
			return { tipo: "concepto", nombre: m.valor_canonico.nombre_canonico_actual, id: m.valor_canonico.concepto_id ?? undefined, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, soloCompleto: false };
		case "teoria":
			return { tipo: "teoria", nombre: m.valor_canonico.nombre_canonico_actual, id: m.valor_canonico.teoria_id ?? undefined, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, soloCompleto: false };
		case "disciplina":
			return { tipo: "disciplina", nombre: m.valor_canonico.nombre_canonico_actual, id: m.valor_canonico.disciplina_id ?? undefined, descripcion: m.valor_canonico.descripcion_canonica_actual ?? undefined, soloCompleto: false };
		case "cita":
			// La cita se busca como coincidencia completa de su texto, nunca por palabra.
			return { tipo: "cita", nombre: m.valor_canonico.texto_canonico_actual, id: undefined, descripcion: undefined, soloCompleto: true };
		default:
			return null;
	}
}

/**
 * Genera anotaciones de tipo "entidad" para cada aparición de las entidades
 * nombradas en el documento. Busca el nombre completo y, además, cada palabra
 * (nombre/apellido) suelta donde no se haya resaltado ya. Multi-ocurrencia.
 */
export function mencionesAAnotaciones(
	doc: DocumentoMDJ,
	menciones: MencionConValorCanonico[],
): Anotacion[] {
	const anotaciones: Anotacion[] = [];

	// Rangos ya resaltados por nodo, para no solapar (full name vs apellido, o
	// dos entidades que comparten una palabra).
	const ocupado = new Map<string, Array<[number, number]>>();
	const solapa = (nodoId: string, ini: number, fin: number) =>
		(ocupado.get(nodoId) ?? []).some(([a, b]) => ini < b && a < fin);
	const ocupar = (nodoId: string, ini: number, fin: number) => {
		const rs = ocupado.get(nodoId) ?? [];
		rs.push([ini, fin]);
		ocupado.set(nodoId, rs);
	};

	for (const m of menciones) {
		const datos = datosEntidad(m);
		if (!datos || !datos.nombre || datos.nombre.trim().length < 2) continue;
		const { tipo, nombre, id, descripcion, soloCompleto } = datos;

		const agregar = (c: CoincidenciaBusqueda) => {
			if (solapa(c.nodo_id, c.offset_inicio, c.offset_fin)) return;
			ocupar(c.nodo_id, c.offset_inicio, c.offset_fin);
			anotaciones.push({
				id: `entidad-${tipo}-${id ?? "x"}-${c.nodo_id}-${c.offset_inicio}`,
				tipo: "entidad",
				entidad_tipo: tipo,
				nodo_id: c.nodo_id,
				offset_inicio: c.offset_inicio,
				offset_fin: c.offset_fin,
				fragmento: nombre, // el tooltip muestra el nombre completo
				entidad_id: id,
				nota_texto: descripcion,
			});
		};

		// 1. Coincidencia completa (nombre o texto de la cita) donde aparezca.
		const completas = buscarEnDocumento(doc, nombre, { palabraCompleta: true });
		for (const c of completas) agregar(c);

		// 1b. Citas: si la coincidencia completa no aparece (texto largo que
		//     difiere en una palabra/recorte, o cruza un bloque), anclar por el
		//     fragmento inicial (primeras ~8 palabras) para marcarla igual. El
		//     tooltip sigue mostrando la cita completa.
		if (soloCompleto && completas.length === 0) {
			const ancla = anclaCita(nombre);
			if (ancla) {
				for (const c of buscarEnDocumento(doc, ancla, { palabraCompleta: true })) {
					agregar(c);
				}
			}
		}

		// 2. Solo para entidades nombradas: cada palabra suelta (apellido/nombre)
		//    donde no esté ya cubierta. Las citas NUNCA se parten en palabras.
		if (!soloCompleto) {
			const palabras = palabrasSignificativas(nombre);
			if (palabras.length > 1) {
				for (const palabra of palabras) {
					for (const c of buscarEnDocumento(doc, palabra, { palabraCompleta: true })) {
						agregar(c);
					}
				}
			}
		}
	}

	return anotaciones;
}
