// 📍 lib/mdj/anotaciones.ts
// Utilidades para resolver y navegar anotaciones en el árbol MDJ

import type { Anotacion, NodoEstructural, NodoBase } from "./types";

/**
 * Construye un índice plano de todos los nodos por ID.
 * Útil para búsquedas rápidas (scrollToNodo, lookup de anotaciones).
 */
export function indexarNodos(
  nodos: NodoEstructural[],
): Map<string, NodoBase> {
  const indice = new Map<string, NodoBase>();

  const walk = (nodo: NodoEstructural) => {
    indice.set(nodo.id, nodo);
    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      for (const hijo of (
        nodo as { hijos: NodoEstructural[] }
      ).hijos) {
        walk(hijo);
      }
    }
    if ("items" in nodo && "items" in nodo) {
      for (const item of (nodo as { items: { id: string; hijos?: { items: { id: string }[] }[] }[] }).items) {
        indice.set(item.id, item as unknown as NodoBase);
        if (item.hijos) {
          for (const subLista of item.hijos) {
            for (const subItem of subLista.items) {
              indice.set(subItem.id, subItem as unknown as NodoBase);
            }
          }
        }
      }
    }
  };

  for (const nodo of nodos) {
    walk(nodo);
  }

  return indice;
}

/**
 * Agrupa anotaciones por nodo_id.
 * Retorna Map<nodo_id, Anotacion[]> para consumo del viewer.
 */
export function agruparAnotacionesPorNodo(
  anotaciones: Anotacion[],
): Map<string, Anotacion[]> {
  const mapa = new Map<string, Anotacion[]>();
  for (const anot of anotaciones) {
    const existentes = mapa.get(anot.nodo_id) || [];
    existentes.push(anot);
    mapa.set(anot.nodo_id, existentes);
  }
  return mapa;
}

/**
 * Filtra anotaciones huérfanas (nodo_id no encontrado en el árbol).
 */
export function filtrarHuerfanas(
  anotaciones: Anotacion[],
): { validas: Anotacion[]; huerfanas: Anotacion[] } {
  const validas: Anotacion[] = [];
  const huerfanas: Anotacion[] = [];
  for (const a of anotaciones) {
    if (a.huerfana) huerfanas.push(a);
    else validas.push(a);
  }
  return { validas, huerfanas };
}
