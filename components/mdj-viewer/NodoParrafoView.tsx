// 📍 components/mdj-viewer/NodoParrafoView.tsx
// 'use client' — párrafo con highlights de anotaciones y clicks navegables

"use client";

import { useMemo } from "react";
import type { NodoParrafo, Anotacion } from "@/lib/mdj/types";
import { InlineRenderer } from "./InlineRenderer";
import { AnotacionMarca } from "./AnotacionMarca";

interface NodoParrafoViewProps {
  nodo: NodoParrafo;
  anotaciones: Anotacion[];
  onAnotacionClick?: (anotacion: Anotacion) => void;
  anotacionActiva?: string | null;
}

export function NodoParrafoView({
  nodo,
  anotaciones,
  onAnotacionClick,
  anotacionActiva,
}: NodoParrafoViewProps) {
  // Construir segmentos: texto-antes / fragmento-marcado / texto-después
  // useMemo siempre al inicio — no después de early return (rules-of-hooks)
  const segmentos = useMemo(() => {
    if (!anotaciones || anotaciones.length === 0) {
      return [{ tipo: "texto" as const, contenido: nodo.texto_plano }];
    }

    const sorted = [...anotaciones].sort(
      (a, b) => a.offset_inicio - b.offset_inicio,
    );

    const result: Array<{
      tipo: "texto" | "anotacion";
      contenido?: string;
      anotacion?: Anotacion;
    }> = [];

    let cursor = 0;

    for (const anot of sorted) {
      if (anot.offset_inicio > cursor) {
        result.push({
          tipo: "texto",
          contenido: nodo.texto_plano.slice(cursor, anot.offset_inicio),
        });
      }

      result.push({ tipo: "anotacion", anotacion: anot });

      cursor = anot.offset_fin;
    }

    if (cursor < nodo.texto_plano.length) {
      result.push({
        tipo: "texto",
        contenido: nodo.texto_plano.slice(cursor),
      });
    }

    return result;
  }, [nodo.texto_plano, anotaciones]);

  // Si no hay anotaciones, renderizar inline simple
  if (!anotaciones || anotaciones.length === 0) {
    return (
      <p className="leading-relaxed mb-4 text-base" data-nodo-id={nodo.id}>
        <InlineRenderer inline={nodo.inline} />
      </p>
    );
  }

  return (
    <p className="leading-relaxed mb-4 text-base" data-nodo-id={nodo.id}>
      {segmentos.map((seg, i) => {
        if (seg.tipo === "texto") {
          return <span key={i}>{seg.contenido}</span>;
        }
        const anot = seg.anotacion!;
        const activa = anotacionActiva === anot.id;
        return (
          <AnotacionMarca
            key={i}
            tipo={anot.tipo}
            activa={activa}
            onClick={() => onAnotacionClick?.(anot)}
          >
            {anot.fragmento}
          </AnotacionMarca>
        );
      })}
    </p>
  );
}
