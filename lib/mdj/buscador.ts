// 📍 lib/mdj/buscador.ts
// Búsqueda de texto dentro de un DocumentoMDJ
//
// Uso:
//   const coincidencias = buscarEnDocumento(doc, "sinergia")
//   → [{ nodo_id, offset_inicio, offset_fin, fragmento }, ...]

import type { DocumentoMDJ, CoincidenciaBusqueda, NodoEstructural, NodoParrafo, NodoItem, NodoBase, NodoH1, NodoH2, NodoH3, Anotacion } from "./types";

/**
 * Normaliza texto: lowercase + quita acentos para búsqueda insensible.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Comillas y guiones tipogr\u00e1ficos \u2192 ASCII. Cada reemplazo es 1 car\u00e1cter \u2192
    // 1 car\u00e1cter, as\u00ed que NO cambia la longitud y los offsets siguen alineados.
    // Tolera que la cita can\u00f3nica use comillas curvas y el texto rectas (o al rev\u00e9s).
    .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ");
}

/**
 * Recolecta todos los nodos hoja con texto_plano del árbol.
 */
function recolectarHojas(nodos: NodoEstructural[]): Array<{ id: string; texto_plano: string }> {
  const hojas: Array<{ id: string; texto_plano: string }> = [];

  const recorrer = (nodo: NodoEstructural) => {
    if ("texto_plano" in nodo) {
      hojas.push({
        id: nodo.id,
        texto_plano: (nodo as NodoParrafo | NodoItem).texto_plano,
      });
    }
    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      for (const hijo of nodo.hijos as NodoEstructural[]) {
        recorrer(hijo);
      }
    }
    if ("items" in nodo) {
      for (const item of (nodo as { items: NodoItem[] }).items) {
        hojas.push({ id: item.id, texto_plano: item.texto_plano });
        if (item.hijos) {
          for (const subLista of item.hijos) {
            recorrer(subLista);
          }
        }
      }
    }
  };

  for (const nodo of nodos) {
    recorrer(nodo);
  }

  return hojas;
}

/** Caracter de palabra (letra unicode o dígito) — para límites de palabra. */
const CARACTER_PALABRA = /[\p{L}\p{N}]/u;

/**
 * Busca un término en todo el documento MDJ.
 * Case-insensitive, ignora acentos.
 *
 * @param doc - DocumentoMDJ parseado
 * @param termino - Texto a buscar
 * @param opciones.palabraCompleta - Si es true, exige que la coincidencia sea
 *   una palabra completa (límites no alfanuméricos). Evita que "May" matchee
 *   dentro de "mayor". Default false (subcadena, como la caja de búsqueda).
 * @returns Array de coincidencias ordenadas por aparición en el documento
 */
export function buscarEnDocumento(
  doc: DocumentoMDJ,
  termino: string,
  opciones?: { palabraCompleta?: boolean },
): CoincidenciaBusqueda[] {
  if (!termino || termino.trim().length < 2) return [];

  const terminoNorm = normalizar(termino.trim());
  const hojas = recolectarHojas(doc.nodos);
  const resultados: CoincidenciaBusqueda[] = [];
  const palabraCompleta = opciones?.palabraCompleta ?? false;

  for (const hoja of hojas) {
    const textoNorm = normalizar(hoja.texto_plano);
    let pos = 0;

    while (true) {
      const idx = textoNorm.indexOf(terminoNorm, pos);
      if (idx === -1) break;

      pos = idx + 1;

      // Límites de palabra: el char anterior y el siguiente no deben ser
      // alfanuméricos (chequeado sobre el texto normalizado, consistente con idx).
      if (palabraCompleta) {
        const antes = idx > 0 ? textoNorm[idx - 1] : "";
        const despues = textoNorm[idx + terminoNorm.length] ?? "";
        if (CARACTER_PALABRA.test(antes) || CARACTER_PALABRA.test(despues)) {
          continue;
        }
      }

      // Extraer fragmento del texto ORIGINAL (no normalizado)
      const fragmento = hoja.texto_plano.slice(idx, idx + terminoNorm.length);

      resultados.push({
        nodo_id: hoja.id,
        offset_inicio: idx,
        offset_fin: idx + terminoNorm.length,
        fragmento,
      });
    }
  }

  return resultados;
}

// ── Búsqueda estructural ─────────────────────────────────────────────────

/**
 * Encuentra el nodo que contiene una línea específica del MD fuente.
 *
 * @param doc - DocumentoMDJ parseado
 * @param linea - Número de línea (1-indexed)
 * @returns El nodo que contiene esa línea, o null si no se encuentra
 */
export function buscarLineaANodo(
  doc: DocumentoMDJ,
  linea: number,
): NodoBase | null {
  const recorrer = (nodo: NodoEstructural): NodoBase | null => {
    // Verificar si este nodo contiene la línea
    if (nodo.line_inicio !== undefined && nodo.line_fin !== undefined) {
      if (linea >= nodo.line_inicio && linea <= nodo.line_fin) {
        return nodo;
      }
    }

    // Buscar en hijos de H1/H2
    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      for (const hijo of (nodo as NodoH1 | NodoH2).hijos) {
        const resultado = recorrer(hijo);
        if (resultado) return resultado;
      }
    }

    // Buscar en items de listas
    if ("items" in nodo) {
      for (const item of (nodo as { items: NodoItem[] }).items) {
        if (item.line_inicio !== undefined && item.line_fin !== undefined) {
          if (linea >= item.line_inicio && linea <= item.line_fin) {
            return item;
          }
        }
        if (item.hijos) {
          for (const subLista of item.hijos) {
            const resultado = recorrer(subLista);
            if (resultado) return resultado;
          }
        }
      }
    }

    return null;
  };

  for (const nodo of doc.nodos) {
    const resultado = recorrer(nodo);
    if (resultado) return resultado;
  }

  return null;
}

/**
 * Encuentra un heading por su índice jerárquico.
 * Ej: "sección 4.1" → cuarto H2 dentro del primer H1.
 *
 * @param doc - DocumentoMDJ parseado
 * @param h1Index - Índice del H1 (1-indexed, 0 = todos)
 * @param h2Index - Índice del H2 dentro del H1 (1-indexed, 0 = todos)
 * @param h3Index - Índice del H3 dentro del H2 (1-indexed, 0 = todos)
 * @returns El nodo heading encontrado, o null
 */
export function buscarHeadingPorIndice(
  doc: DocumentoMDJ,
  h1Index: number,
  h2Index: number = 0,
  h3Index: number = 0,
): NodoH1 | NodoH2 | NodoH3 | null {
  // Encontrar H1
  const h1s = doc.nodos.filter((n): n is NodoH1 => n.tipo === "h1");
  if (h1Index === 0) return h1s[0] || null;
  const h1 = h1s[h1Index - 1];
  if (!h1) return null;

  if (h2Index === 0) return h1;

  // Encontrar H2 dentro del H1
  const h2s = h1.hijos.filter((n): n is NodoH2 => n.tipo === "h2");
  const h2 = h2s[h2Index - 1];
  if (!h2) return null;

  if (h3Index === 0) return h2;

  // Encontrar H3 dentro del H2
  const h3s = h2.hijos.filter((n): n is NodoH3 => n.tipo === "h3");
  const h3 = h3s[h3Index - 1];
  if (!h3) return null;

  return h3;
}

/**
 * Busca nodos por tipo dentro de un nodo padre.
 *
 * @param doc - DocumentoMDJ parseado
 * @param tipo - Tipo de nodo a buscar ("p", "tbl", "code", "latex", "li")
 * @param posicion - "primera", "última", o número de índice (1-indexed)
 * @param dentroDe - Nodo padre opcional para limitar la búsqueda
 * @returns Array de nodos encontrados
 */
export function buscarNodosPorTipo(
  doc: DocumentoMDJ,
  tipo: string,
  posicion: "primera" | "última" | number = "primera",
  dentroDe?: NodoBase,
): NodoBase[] {
  const resultados: NodoBase[] = [];

  const recorrer = (nodo: NodoEstructural) => {
    // Si estamos buscando dentro de un nodo específico, solo procesar sus hijos
    if (dentroDe && nodo.id !== dentroDe.id) {
      // Verificar si este nodo es hijo del nodo padre
      // (simplificación: recorrer todo y filtrar después)
    }

    if (nodo.tipo === tipo) {
      resultados.push(nodo);
    }

    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      for (const hijo of (nodo as NodoH1 | NodoH2).hijos) {
        recorrer(hijo);
      }
    }
    if ("items" in nodo) {
      for (const item of (nodo as { items: NodoItem[] }).items) {
        if (tipo === "li") resultados.push(item);
        if (item.hijos) {
          for (const subLista of item.hijos) {
            recorrer(subLista);
          }
        }
      }
    }
  };

  if (dentroDe) {
    // Buscar solo dentro del nodo padre
    const encontrarPadre = (nodos: NodoEstructural[]): NodoEstructural | null => {
      for (const nodo of nodos) {
        if (nodo.id === dentroDe.id) return nodo;
        if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
          const encontrado = encontrarPadre(nodo.hijos as NodoEstructural[]);
          if (encontrado) return encontrado;
        }
      }
      return null;
    };
    const padre = encontrarPadre(doc.nodos);
    if (padre) recorrer(padre);
  } else {
    for (const nodo of doc.nodos) {
      recorrer(nodo);
    }
  }

  // Aplicar filtro de posición
  if (posicion === "primera") return resultados.slice(0, 1);
  if (posicion === "última") return resultados.slice(-1);
  if (typeof posicion === "number") {
    const idx = posicion - 1;
    return idx >= 0 && idx < resultados.length ? [resultados[idx]] : [];
  }

  return resultados;
}

// ── Mapeo de anotaciones a líneas ────────────────────────────────────────

/**
 * Mapea anotaciones a números de línea del MD fuente.
 *
 * Para cada anotación, busca el nodo por `nodo_id`, obtiene su `line_inicio`,
 * y cuenta los saltos de línea en `texto_plano` hasta `offset_inicio`
 * para determinar la línea exacta.
 *
 * @param anotaciones - Array de anotaciones
 * @param doc - DocumentoMDJ parseado
 * @returns Map<linea, tipoAnotacion[]> (línea 1-indexed → tipos)
 */
export function mapearAnotacionesALineas(
  anotaciones: Anotacion[],
  doc: DocumentoMDJ,
): Map<number, string[]> {
  const mapa = new Map<number, string[]>();

  // Recolectar todos los nodos hoja con texto_plano y sus líneas
  const hojas = recolectarHojas(doc.nodos);

  // Crear mapa id → hoja
  const hojasMap = new Map<string, { texto_plano: string; nodo: NodoEstructural }>();
  for (const hoja of hojas) {
    // Buscar el nodo completo para obtener line_inicio
    const nodo = encontrarNodoPorId(doc.nodos, hoja.id);
    if (nodo) {
      hojasMap.set(hoja.id, { texto_plano: hoja.texto_plano, nodo });
    }
  }

  for (const anot of anotaciones) {
    const info = hojasMap.get(anot.nodo_id);
    if (!info) continue;

    const { texto_plano, nodo } = info;
    const lineInicio = nodo.line_inicio ?? 1;

    // Contar saltos de línea hasta offset_inicio
    const textoHastaOffset = texto_plano.slice(0, anot.offset_inicio);
    const saltos = (textoHastaOffset.match(/\n/g) || []).length;
    const lineaAnot = lineInicio + saltos;

    // También mapear hasta offset_fin (puede abarcar múltiples líneas)
    const textoHastaFin = texto_plano.slice(0, anot.offset_fin);
    const saltosFin = (textoHastaFin.match(/\n/g) || []).length;
    const lineaFin = lineInicio + saltosFin;

    for (let l = lineaAnot; l <= lineaFin; l++) {
      const existente = mapa.get(l) || [];
      if (!existente.includes(anot.tipo)) {
        existente.push(anot.tipo);
      }
      mapa.set(l, existente);
    }
  }

  return mapa;
}

/**
 * Busca un nodo por ID dentro del árbol MDJ.
 */
function encontrarNodoPorId(
  nodos: NodoEstructural[],
  id: string,
): NodoEstructural | null {
  for (const nodo of nodos) {
    if (nodo.id === id) return nodo;

    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      const encontrado = encontrarNodoPorId(nodo.hijos as NodoEstructural[], id);
      if (encontrado) return encontrado;
    }

    if ("items" in nodo) {
      for (const item of (nodo as { items: NodoItem[] }).items) {
        if (item.id === id) return item as unknown as NodoEstructural;
        if (item.hijos) {
          for (const subLista of item.hijos) {
            const encontrado = encontrarNodoPorId([subLista], id);
            if (encontrado) return encontrado;
          }
        }
      }
    }
  }

  return null;
}

// ── Búsqueda contextual (para Panel Buscar y Operar) ─────────────────────

export interface ResultadoContextual {
  nodoId: string;
  nodoTipo: string;
  textoCompleto: string;
  headingPath: string;
  fragmento: string;
  offset_inicio: number;
  offset_fin: number;
  line_inicio: number;
  line_fin: number;
}

/**
 * Obtiene la ruta jerárquica (breadcrumb) de un nodo.
 * Ej: "§1. Introducción > §1.2. Métricas > p"
 */
export function obtenerRutaJerarquica(
  doc: DocumentoMDJ,
  nodoId: string,
): string {
  // Recorrer el árbol para encontrar el nodo y su camino
  const buscarCamino = (
    nodos: NodoEstructural[],
    path: string[],
  ): string[] | null => {
    for (const nodo of nodos) {
      const currentPath = [...path];

      if (nodo.tipo === "h1" || nodo.tipo === "h2" || nodo.tipo === "h3") {
        const h = nodo as NodoH1 | NodoH2 | NodoH3;
        currentPath.push(`§${h.texto}`);
      }

      if (nodo.id === nodoId) {
        return currentPath;
      }

      if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
        const resultado = buscarCamino(nodo.hijos as NodoEstructural[], currentPath);
        if (resultado) return resultado;
      }

      if ("items" in nodo) {
        for (const item of (nodo as { items: NodoItem[] }).items) {
          if (item.id === nodoId) return [...currentPath, "li"];
          if (item.hijos) {
            for (const subLista of item.hijos) {
              const resultado = buscarCamino([subLista], [...currentPath, "li"]);
              if (resultado) return resultado;
            }
          }
        }
      }
    }
    return null;
  };

  const camino = buscarCamino(doc.nodos, []);
  if (!camino || camino.length === 0) return nodoId;

  return camino.join(" > ");
}

/**
 * Busca una frase en el documento y devuelve resultados con contexto completo.
 * Agrupa múltiples matches en el mismo nodo para no duplicar tarjetas.
 */
export function buscarConContexto(
  doc: DocumentoMDJ,
  frase: string,
): ResultadoContextual[] {
  if (!frase || frase.trim().length < 2) return [];

  const coincidencias = buscarEnDocumento(doc, frase);
  if (coincidencias.length === 0) return [];

  // Agrupar por nodo_id
  const porNodo = new Map<string, CoincidenciaBusqueda[]>();
  for (const c of coincidencias) {
    const existentes = porNodo.get(c.nodo_id) || [];
    existentes.push(c);
    porNodo.set(c.nodo_id, existentes);
  }

  const resultados: ResultadoContextual[] = [];

  for (const [nodoId, matches] of porNodo) {
    const nodo = encontrarNodoPorId(doc.nodos, nodoId);
    if (!nodo) continue;

    const textoCompleto = "texto_plano" in nodo
      ? (nodo as NodoParrafo | NodoItem).texto_plano
      : "";

    const headingPath = obtenerRutaJerarquica(doc, nodoId);

    // Usar el primer match para el fragmento principal
    const primerMatch = matches[0];
    const fragmento = primerMatch.fragmento;

    resultados.push({
      nodoId,
      nodoTipo: nodo.tipo,
      textoCompleto,
      headingPath,
      fragmento,
      offset_inicio: primerMatch.offset_inicio,
      offset_fin: primerMatch.offset_fin,
      line_inicio: nodo.line_inicio ?? 0,
      line_fin: nodo.line_fin ?? 0,
    });
  }

  return resultados;
}
