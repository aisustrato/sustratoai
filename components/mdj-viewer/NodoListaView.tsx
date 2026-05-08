// 📍 components/mdj-viewer/NodoListaView.tsx
// Server Component — lista ordenada/no-ordenada con ítems navegables

import type { NodoLista, Anotacion } from "@/lib/mdj/types";
import { InlineRenderer } from "./InlineRenderer";
import { NodoParrafoView } from "./NodoParrafoView";

interface NodoListaViewProps {
  nodo: NodoLista;
  anotaciones: Anotacion[];
  onAnotacionClick?: (anotacion: Anotacion) => void;
  anotacionActiva?: string | null;
  nivel?: number;
}

export function NodoListaView({
  nodo,
  anotaciones,
  onAnotacionClick,
  anotacionActiva,
  nivel = 0,
}: NodoListaViewProps) {
  const Tag = nodo.tipo === "ol" ? "ol" : "ul";
  const listStyle =
    nodo.tipo === "ol" ? "list-decimal" : "list-disc";
  const indent = nivel > 0 ? "ml-5" : "";

  // Construir índice de anotaciones por item id
  const anotsPorItem = new Map<string, Anotacion[]>();
  for (const anot of anotaciones) {
    const existentes = anotsPorItem.get(anot.nodo_id) || [];
    existentes.push(anot);
    anotsPorItem.set(anot.nodo_id, existentes);
  }

  return (
    <Tag className={`${listStyle} ${indent} mb-4 space-y-1 text-base`}>
      {nodo.items.map((item) => {
        const itemAnots = anotsPorItem.get(item.id) || [];

        return (
          <li key={item.id} id={item.id} data-nodo-id={item.id} className="leading-relaxed">
            {itemAnots.length > 0 ? (
              <NodoParrafoView
                nodo={{
                  id: item.id,
                  tipo: "p",
                  indice_global: item.indice_global,
                  inline: item.inline,
                  texto_plano: item.texto_plano,
                }}
                anotaciones={itemAnots}
                onAnotacionClick={onAnotacionClick}
                anotacionActiva={anotacionActiva}
              />
            ) : (
              <InlineRenderer inline={item.inline} />
            )}
            {item.hijos &&
              item.hijos.map((sub) => (
                <NodoListaView
                  key={sub.id}
                  nodo={sub}
                  anotaciones={anotaciones}
                  onAnotacionClick={onAnotacionClick}
                  anotacionActiva={anotacionActiva}
                  nivel={nivel + 1}
                />
              ))}
          </li>
        );
      })}
    </Tag>
  );
}
