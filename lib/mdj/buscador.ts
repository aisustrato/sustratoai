// 📍 lib/mdj/buscador.ts
// Búsqueda de texto dentro de un DocumentoMDJ
//
// Uso:
//   const coincidencias = buscarEnDocumento(doc, "sinergia")
//   → [{ nodo_id, offset_inicio, offset_fin, fragmento }, ...]

import type { DocumentoMDJ, CoincidenciaBusqueda, NodoEstructural, NodoParrafo, NodoItem } from "./types";

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
