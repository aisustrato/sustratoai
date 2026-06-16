// 📍 components/mdj-viewer/useSeleccionMDJ.ts
// 'use client' — Hook para capturar selecciones de texto y resolver
// el fragmento seleccionado a nodo_id + offsets en el árbol MDJ.
//
// Usa un ref para el callback onSeleccion para que el listener de mouseup
// NUNCA se remueva/re-agregue (evita perder eventos en renders intermedios).

"use client";

import { useState, useEffect, useRef } from "react";
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
  const onSeleccionRef = useRef(onSeleccion);

  // Mantener el ref del callback siempre actualizado sin recrear listeners
  useEffect(() => {
    onSeleccionRef.current = onSeleccion;
  }, [onSeleccion]);

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

  // Listener estable — nunca se recrea gracias al ref
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      console.log("[useSeleccionMDJ:mouseup] 🔥 FIRED");

      const sel = window.getSelection();
      console.log("[useSeleccionMDJ:mouseup] sel:", sel?.toString()?.slice(0, 40), "isCollapsed:", sel?.isCollapsed);

      if (!sel || sel.isCollapsed) {
        console.log("[useSeleccionMDJ:mouseup] ❌ collapsed or null, bailing");
        setSeleccion(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const selectedText = range.toString().trim();
      console.log("[useSeleccionMDJ:mouseup] selectedText:", selectedText?.slice(0, 40));

      if (!selectedText) {
        console.log("[useSeleccionMDJ:mouseup] ❌ empty selection, bailing");
        setSeleccion(null);
        return;
      }

      // Encontrar el ancestro con data-nodo-id más cercano
      let node: Node | null = range.commonAncestorContainer;
      let nodoId: string | null = null;

      while (node && node !== container) {
        if (node instanceof HTMLElement && node.dataset.nodoId) {
          nodoId = node.dataset.nodoId;
          break;
        }
        node = node.parentNode;
      }

      console.log("[useSeleccionMDJ:mouseup] nodoId:", nodoId);

      if (!nodoId || !indice.current?.has(nodoId)) {
        console.log("[useSeleccionMDJ:mouseup] ❌ no nodoId found or not in index, bailing");
        setSeleccion(null);
        return;
      }

      const nodoInfo = indice.current.get(nodoId)!;
      const textoBase = nodoInfo.texto_plano;

      // Calcular offset_inicio: buscar el texto seleccionado dentro de texto_plano
      const offset = textoBase.indexOf(selectedText);
      if (offset === -1) {
        console.warn(
          "[useSeleccionMDJ:indexOf] ❌ texto no encontrado en texto_plano",
          { nodoId, selectedText: selectedText.slice(0, 80), textoBase: textoBase.slice(0, 80) }
        );
        setSeleccion(null);
        return;
      }

      const resultado: SeleccionMDJ = {
        nodo_id: nodoId,
        offset_inicio: offset,
        offset_fin: offset + selectedText.length,
        fragmento: selectedText,
      };

      console.log("[useSeleccionMDJ:mouseup] ✅ calling onSeleccionRef.current with fragmento:", selectedText.slice(0, 40));
      setSeleccion(resultado);
      onSeleccionRef.current?.(resultado);
    };

    container.addEventListener("mouseup", handleMouseUp);
    return () => container.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef]);

  return { seleccion };
}
