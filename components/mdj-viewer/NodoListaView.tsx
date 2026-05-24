// 📍 components/mdj-viewer/NodoListaView.tsx
// Server Component — lista ordenada/no-ordenada con ítems navegables
// Soporta anotaciones, búsqueda y callbacks de notas/referencias/frases

import type { NodoLista, Anotacion, CoincidenciaBusqueda } from "@/lib/mdj/types";
import { InlineRenderer } from "./InlineRenderer";
import { NodoParrafoView } from "./NodoParrafoView";

interface BusquedaEnNodo {
  coincidencias: CoincidenciaBusqueda[];
  indiceActivo: number;
}

interface NodoListaViewProps {
  nodo: NodoLista;
  anotaciones: Anotacion[];
  onAnotacionClick?: (anotacion: Anotacion) => void;
  anotacionActiva?: string | null;
  nivel?: number;
  busqueda?: BusquedaEnNodo;
  onEditarNota?: (anotacion: Anotacion) => void;
  onBorrarNota?: (anotacionId: string) => void;
  onEditarReferencia?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
  onBorrarReferencia?: (anotacionId: string) => Promise<{ ok: boolean }>;
  onBorrarFraseNotable?: (anotacionId: string) => Promise<{ ok: boolean }>;
}

export function NodoListaView({
  nodo,
  anotaciones,
  onAnotacionClick,
  anotacionActiva,
  nivel = 0,
  busqueda,
  onEditarNota,
  onBorrarNota,
  onEditarReferencia,
  onBorrarReferencia,
  onBorrarFraseNotable,
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

  // Construir índice de búsqueda por item id
  const busqPorItem = new Map<string, CoincidenciaBusqueda[]>();
  if (busqueda) {
    for (const c of busqueda.coincidencias) {
      const existentes = busqPorItem.get(c.nodo_id) || [];
      existentes.push(c);
      busqPorItem.set(c.nodo_id, existentes);
    }
  }

  return (
    <Tag className={`${listStyle} ${indent} mb-4 space-y-1 text-base`}>
      {nodo.items.map((item) => {
        const itemAnots = anotsPorItem.get(item.id) || [];
        const itemBusq = busqPorItem.get(item.id);
        const tieneBusqueda = itemBusq && itemBusq.length > 0;

        // Determinar si usar NodoParrafoView (tiene anotaciones O tiene búsqueda)
        const usarParrafoView = itemAnots.length > 0 || tieneBusqueda;

        return (
          <li key={item.id} id={item.id} data-nodo-id={item.id} className="leading-relaxed">
            {usarParrafoView ? (
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
                busqueda={tieneBusqueda ? {
                  coincidencias: itemBusq!,
                  indiceActivo: busqueda!.indiceActivo,
                } : undefined}
                onEditarNota={onEditarNota}
                onBorrarNota={onBorrarNota}
                onEditarReferencia={onEditarReferencia}
                onBorrarReferencia={onBorrarReferencia}
                onBorrarFraseNotable={onBorrarFraseNotable}
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
                  busqueda={busqueda}
                  onEditarNota={onEditarNota}
                  onBorrarNota={onBorrarNota}
                  onEditarReferencia={onEditarReferencia}
                  onBorrarReferencia={onBorrarReferencia}
                  onBorrarFraseNotable={onBorrarFraseNotable}
                />
              ))}
          </li>
        );
      })}
    </Tag>
  );
}
