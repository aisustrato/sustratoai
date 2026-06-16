// 📍 lib/mdj/cirujano.ts
// API de edición quirúrgica — modifica el MD fuente operando sobre nodos del árbol MDJ.
//
// Todas las funciones son puras: toman MD + doc + especificación del blanco y devuelven
// el nuevo MD string. No mutan el original.
//
// Uso:
//   const nuevoMd = reemplazarNodo(md, doc, "h1_0.h2_0.p_0", "Nuevo contenido");
//   const nuevoMd = insertarDespuesDeNodo(md, doc, "h1_0.h2_0", "## Nueva subsección\n");

import type { DocumentoMDJ, NodoBase, NodoEstructural } from "./types";
import { buscarHeadingPorIndice } from "./buscador";

export interface ResultadoCirujano {
  nuevoMd: string;
  lineasAfectadas: { inicio: number; fin: number };
  tipoAccion: "reemplazar" | "insertar" | "eliminar" | "extraer";
}

/**
 * Reemplaza el contenido de un nodo identificado por su ID.
 *
 * @param md - MD fuente original
 * @param doc - DocumentoMDJ parseado
 * @param nodoId - ID del nodo a reemplazar
 * @param nuevoContenido - Nuevo contenido MD para ese nodo
 * @returns ResultadoCirujano con el nuevo MD y las líneas afectadas
 */
export function reemplazarNodo(
  md: string,
  doc: DocumentoMDJ,
  nodoId: string,
  nuevoContenido: string,
): ResultadoCirujano {
  const nodo = encontrarNodoPorId(doc.nodos, nodoId);
  if (!nodo || nodo.line_inicio === undefined || nodo.line_fin === undefined) {
    throw new Error(`[cirujano] Nodo "${nodoId}" no encontrado o sin información de líneas`);
  }

  const lineas = md.split("\n");
  const inicioIdx = nodo.line_inicio - 1; // 0-indexed
  const finIdx = nodo.line_fin - 1; // 0-indexed

  // Reemplazar las líneas del nodo con el nuevo contenido
  const lineasNuevas = nuevoContenido.split("\n");
  const nuevasLineas = [
    ...lineas.slice(0, inicioIdx),
    ...lineasNuevas,
    ...lineas.slice(finIdx + 1),
  ];

  return {
    nuevoMd: nuevasLineas.join("\n"),
    lineasAfectadas: { inicio: nodo.line_inicio, fin: nodo.line_inicio + lineasNuevas.length - 1 },
    tipoAccion: "reemplazar",
  };
}

/**
 * Inserta contenido después de un nodo identificado por su ID.
 *
 * @param md - MD fuente original
 * @param doc - DocumentoMDJ parseado
 * @param nodoId - ID del nodo después del cual insertar
 * @param contenido - Contenido MD a insertar
 * @returns ResultadoCirujano con el nuevo MD y las líneas afectadas
 */
export function insertarDespuesDeNodo(
  md: string,
  doc: DocumentoMDJ,
  nodoId: string,
  contenido: string,
): ResultadoCirujano {
  const nodo = encontrarNodoPorId(doc.nodos, nodoId);
  if (!nodo || nodo.line_fin === undefined) {
    throw new Error(`[cirujano] Nodo "${nodoId}" no encontrado o sin información de líneas`);
  }

  const lineas = md.split("\n");
  const insertarEn = nodo.line_fin; // 0-indexed: después de la última línea del nodo

  const lineasNuevas = contenido.split("\n");
  const nuevasLineas = [
    ...lineas.slice(0, insertarEn),
    ...lineasNuevas,
    ...lineas.slice(insertarEn),
  ];

  return {
    nuevoMd: nuevasLineas.join("\n"),
    lineasAfectadas: { inicio: nodo.line_fin + 1, fin: nodo.line_fin + lineasNuevas.length },
    tipoAccion: "insertar",
  };
}

/**
 * Inserta contenido antes de un nodo identificado por su ID.
 *
 * @param md - MD fuente original
 * @param doc - DocumentoMDJ parseado
 * @param nodoId - ID del nodo antes del cual insertar
 * @param contenido - Contenido MD a insertar
 * @returns ResultadoCirujano con el nuevo MD y las líneas afectadas
 */
export function insertarAntesDeNodo(
  md: string,
  doc: DocumentoMDJ,
  nodoId: string,
  contenido: string,
): ResultadoCirujano {
  const nodo = encontrarNodoPorId(doc.nodos, nodoId);
  if (!nodo || nodo.line_inicio === undefined) {
    throw new Error(`[cirujano] Nodo "${nodoId}" no encontrado o sin información de líneas`);
  }

  const lineas = md.split("\n");
  const insertarEn = nodo.line_inicio - 1; // 0-indexed: antes de la primera línea del nodo

  const lineasNuevas = contenido.split("\n");
  const nuevasLineas = [
    ...lineas.slice(0, insertarEn),
    ...lineasNuevas,
    ...lineas.slice(insertarEn),
  ];

  return {
    nuevoMd: nuevasLineas.join("\n"),
    lineasAfectadas: { inicio: nodo.line_inicio - lineasNuevas.length + 1, fin: nodo.line_inicio - 1 },
    tipoAccion: "insertar",
  };
}

/**
 * Elimina un nodo identificado por su ID.
 *
 * @param md - MD fuente original
 * @param doc - DocumentoMDJ parseado
 * @param nodoId - ID del nodo a eliminar
 * @returns ResultadoCirujano con el nuevo MD y las líneas afectadas
 */
export function eliminarNodo(
  md: string,
  doc: DocumentoMDJ,
  nodoId: string,
): ResultadoCirujano {
  const nodo = encontrarNodoPorId(doc.nodos, nodoId);
  if (!nodo || nodo.line_inicio === undefined || nodo.line_fin === undefined) {
    throw new Error(`[cirujano] Nodo "${nodoId}" no encontrado o sin información de líneas`);
  }

  const lineas = md.split("\n");
  const inicioIdx = nodo.line_inicio - 1; // 0-indexed
  const finIdx = nodo.line_fin - 1; // 0-indexed

  const nuevasLineas = [
    ...lineas.slice(0, inicioIdx),
    ...lineas.slice(finIdx + 1),
  ];

  return {
    nuevoMd: nuevasLineas.join("\n"),
    lineasAfectadas: { inicio: nodo.line_inicio, fin: nodo.line_fin },
    tipoAccion: "eliminar",
  };
}

/**
 * Extrae una sección completa por sus índices jerárquicos.
 *
 * @param md - MD fuente original
 * @param doc - DocumentoMDJ parseado
 * @param h1Index - Índice del H1 (1-indexed)
 * @param h2Index - Índice del H2 dentro del H1 (1-indexed, 0 = toda la sección H1)
 * @param h3Index - Índice del H3 dentro del H2 (1-indexed, 0 = toda la sección H2)
 * @returns El contenido MD de la sección extraída, o null si no se encuentra
 */
export function extraerSeccion(
  md: string,
  doc: DocumentoMDJ,
  h1Index: number,
  h2Index = 0,
  h3Index = 0,
): { md: string; nodo: NodoBase } | null {
  const heading = buscarHeadingPorIndice(doc, h1Index, h2Index, h3Index);
  if (!heading || heading.line_inicio === undefined || heading.line_fin === undefined) {
    return null;
  }

  const lineas = md.split("\n");
  const inicioIdx = heading.line_inicio - 1; // 0-indexed
  const finIdx = heading.line_fin - 1; // 0-indexed

  const contenido = lineas.slice(inicioIdx, finIdx + 1).join("\n");

  return { md: contenido, nodo: heading };
}

/**
 * Reemplaza una sección completa por su contenido.
 * Útil para reemplazar todo el contenido de un heading y sus hijos.
 *
 * @param md - MD fuente original
 * @param doc - DocumentoMDJ parseado
 * @param h1Index - Índice del H1 (1-indexed)
 * @param h2Index - Índice del H2 dentro del H1 (1-indexed, 0 = toda la sección H1)
 * @param nuevoContenido - Nuevo contenido MD para la sección
 * @returns ResultadoCirujano con el nuevo MD y las líneas afectadas
 */
export function reemplazarSeccion(
  md: string,
  doc: DocumentoMDJ,
  h1Index: number,
  h2Index = 0,
  nuevoContenido: string,
): ResultadoCirujano {
  const heading = buscarHeadingPorIndice(doc, h1Index, h2Index);
  if (!heading || heading.line_inicio === undefined || heading.line_fin === undefined) {
    throw new Error(`[cirujano] Sección H1=${h1Index} H2=${h2Index} no encontrada`);
  }

  const lineas = md.split("\n");
  const inicioIdx = heading.line_inicio - 1; // 0-indexed
  const finIdx = heading.line_fin - 1; // 0-indexed

  const lineasNuevas = nuevoContenido.split("\n");
  const nuevasLineas = [
    ...lineas.slice(0, inicioIdx),
    ...lineasNuevas,
    ...lineas.slice(finIdx + 1),
  ];

  return {
    nuevoMd: nuevasLineas.join("\n"),
    lineasAfectadas: { inicio: heading.line_inicio, fin: heading.line_inicio + lineasNuevas.length - 1 },
    tipoAccion: "reemplazar",
  };
}

/**
 * Busca un nodo por ID dentro del árbol MDJ.
 * (Reutilizada de buscador.ts para evitar import circular)
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
      for (const item of (nodo as { items: Array<{ id: string }> }).items) {
        if (item.id === id) return item as unknown as NodoEstructural;
        if ("hijos" in item && Array.isArray((item as { hijos?: unknown[] }).hijos)) {
          for (const subLista of (item as { hijos: unknown[] }).hijos) {
            const encontrado = encontrarNodoPorId([subLista as NodoEstructural], id);
            if (encontrado) return encontrado;
          }
        }
      }
    }
  }

  return null;
}
