// 📍 components/mdj-viewer/useSeleccionMDJ.ts
// 'use client' — Hook para capturar selecciones de texto y resolver
// el fragmento seleccionado a nodo_id + offsets en el árbol MDJ.
//
// Uso:
//   const { seleccion } = useSeleccionMDJ(containerRef, doc)
//   // seleccion = { nodo_id, offset_inicio, offset_fin, fragmento } | null

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DocumentoMDJ } from "@/lib/mdj/types";
import { indexarNodos } from "@/lib/mdj/anotaciones";

export interface SeleccionMDJ {
  nodo_id: string;
  offset_inicio: number;
  offset_fin: number;
  fragmento: string;
}

export function useSeleccionMDJ(
  containerRef: React.RefObject<HTMLElement | null>,
  doc: DocumentoMDJ,
  onSeleccion?: (sel: SeleccionMDJ) => void,
) {
  const [seleccion, setSeleccion] = useState<SeleccionMDJ | null>(null);
  const indice = useRef<Map<string, { texto_plano: string }> | null>(null);

  // Construir índice de texto_plano por nodo_id (solo una vez por doc)
  useEffect(() => {
    const nodos = indexarNodos(doc.nodos);
    const map = new Map<string, { texto_plano: string }>();
    for (const [id, nodo] of nodos) {
      if ("texto_plano" in nodo && typeof (nodo as { texto_plano: string }).texto_plano === "string") {
        map.set(id, { texto_plano: (nodo as { texto_plano: string }).texto_plano });
      }
    }
    indice.current = map;
  }, [doc]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      setSeleccion(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText) {
      setSeleccion(null);
      return;
    }

    // Encontrar el ancestro con data-nodo-id más cercano
    let node: Node | null = range.commonAncestorContainer;
    let nodoId: string | null = null;

    while (node && node !== containerRef.current) {
      if (node instanceof HTMLElement && node.dataset.nodoId) {
        nodoId = node.dataset.nodoId;
        break;
      }
      node = node.parentNode;
    }

    if (!nodoId || !indice.current?.has(nodoId)) {
      setSeleccion(null);
      return;
    }

    const nodoInfo = indice.current.get(nodoId)!;
    const textoBase = nodoInfo.texto_plano;

    // Calcular offset_inicio: buscar el texto seleccionado dentro de texto_plano
    const offset = textoBase.indexOf(selectedText);
    if (offset === -1) {
      setSeleccion(null);
      return;
    }

    const resultado: SeleccionMDJ = {
      nodo_id: nodoId,
      offset_inicio: offset,
      offset_fin: offset + selectedText.length,
      fragmento: selectedText,
    };

    setSeleccion(resultado);
    onSeleccion?.(resultado);
  }, [containerRef, onSeleccion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mouseup", handleMouseUp);
    return () => container.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef, handleMouseUp]);

  return { seleccion };
}
