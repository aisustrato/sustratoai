// 📍 lib/mdj/buscador.ts
// Búsqueda de texto dentro de un DocumentoMDJ
//
// Uso:
//   const coincidencias = buscarEnDocumento(doc, "sinergia")
//   → [{ nodo_id, offset_inicio, offset_fin, fragmento }, ...]

import type { DocumentoMDJ, CoincidenciaBusqueda, NodoEstructural, NodoParrafo, NodoItem, NodoBase, NodoH1, NodoH2, NodoH3 } from "./types";

/**
 * Normaliza texto: lowercase + quita acentos para búsqueda insensible.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

/**
 * Busca un término en todo el documento MDJ.
 * Case-insensitive, ignora acentos.
 *
 * @param doc - DocumentoMDJ parseado
 * @param termino - Texto a buscar
 * @returns Array de coincidencias ordenadas por aparición en el documento
 */
export function buscarEnDocumento(
  doc: DocumentoMDJ,
  termino: string,
): CoincidenciaBusqueda[] {
  if (!termino || termino.trim().length < 2) return [];

  const terminoNorm = normalizar(termino.trim());
  const hojas = recolectarHojas(doc.nodos);
  const resultados: CoincidenciaBusqueda[] = [];

  for (const hoja of hojas) {
    const textoNorm = normalizar(hoja.texto_plano);
    let pos = 0;

    while (true) {
      const idx = textoNorm.indexOf(terminoNorm, pos);
      if (idx === -1) break;

      // Extraer fragmento del texto ORIGINAL (no normalizado)
      const fragmento = hoja.texto_plano.slice(idx, idx + terminoNorm.length);

      resultados.push({
        nodo_id: hoja.id,
        offset_inicio: idx,
        offset_fin: idx + terminoNorm.length,
        fragmento,
      });

      pos = idx + 1;
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
