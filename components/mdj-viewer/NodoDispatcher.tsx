// 📍 components/mdj-viewer/NodoDispatcher.tsx
// Server Component — despacha cada nodo a su componente visual según tipo
// Soporta anotaciones, búsqueda y callbacks de notas/referencias/frases

import type { NodoEstructural, NodoH1, NodoH2, NodoH3, NodoParrafo, NodoLista, NodoTabla, NodoCodigo, NodoLatex, Anotacion, CoincidenciaBusqueda } from "@/lib/mdj/types";
import { SeccionColapsable } from "./SeccionColapsable";
import { NodoParrafoView } from "./NodoParrafoView";
import { NodoListaView } from "./NodoListaView";
import { NodoTablaView } from "./NodoTablaView";
import { NodoCodigoView } from "./NodoCodigoView";
import { NodoLatexView } from "./NodoLatexView";

interface BusquedaEnNodo {
  coincidencias: CoincidenciaBusqueda[];
  indiceActivo: number;
}

interface NodoDispatcherProps {
  nodo: NodoEstructural;
  anotaciones: Anotacion[];
  onAnotacionClick?: (anotacion: Anotacion) => void;
  anotacionActiva?: string | null;
  busqueda?: BusquedaEnNodo;
  onEditarNota?: (anotacion: Anotacion) => void;
  onBorrarNota?: (anotacionId: string) => void;
  onEditarReferencia?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
  onBorrarReferencia?: (anotacionId: string) => Promise<{ ok: boolean }>;
  onBorrarFraseNotable?: (anotacionId: string) => Promise<{ ok: boolean }>;
}

export function NodoDispatcher({
  nodo,
  anotaciones,
  onAnotacionClick,
  anotacionActiva,
  busqueda,
  onEditarNota,
  onBorrarNota,
  onEditarReferencia,
  onBorrarReferencia,
  onBorrarFraseNotable,
}: NodoDispatcherProps) {
  const anotsDelNodo = anotaciones.filter((a) => a.nodo_id === nodo.id);

  // Filtrar coincidencias de búsqueda para este nodo
  const busqDelNodo = busqueda ? {
    coincidencias: busqueda.coincidencias.filter((c) => c.nodo_id === nodo.id),
    indiceActivo: busqueda.indiceActivo,
  } : undefined;

  switch (nodo.tipo) {
    case "h1": {
      const h1 = nodo as NodoH1;
      return (
        <SeccionColapsable
          id={h1.id}
          nivel={1}
          titulo={h1.texto}
          colapsadoInicial={h1.colapsado || false}
        >
          {h1.hijos.map((hijo) => (
            <NodoDispatcher
              key={hijo.id}
              nodo={hijo}
              anotaciones={anotaciones}
              onAnotacionClick={onAnotacionClick}
              anotacionActiva={anotacionActiva}
              busqueda={busqueda}
              onEditarNota={onEditarNota}
              onBorrarNota={onBorrarNota}
              onEditarReferencia={onEditarReferencia}
              onBorrarReferencia={onBorrarReferencia}
              onBorrarFraseNotable={onBorrarFraseNotable}
            />
          ))}
        </SeccionColapsable>
      );
    }

    case "h2": {
      const h2 = nodo as NodoH2;
      return (
        <SeccionColapsable
          id={h2.id}
          nivel={2}
          titulo={h2.texto}
          colapsadoInicial={h2.colapsado || false}
        >
          {h2.hijos.map((hijo) => (
            <NodoDispatcher
              key={hijo.id}
              nodo={hijo}
              anotaciones={anotaciones}
              onAnotacionClick={onAnotacionClick}
              anotacionActiva={anotacionActiva}
              busqueda={busqueda}
              onEditarNota={onEditarNota}
              onBorrarNota={onBorrarNota}
              onEditarReferencia={onEditarReferencia}
              onBorrarReferencia={onBorrarReferencia}
              onBorrarFraseNotable={onBorrarFraseNotable}
            />
          ))}
        </SeccionColapsable>
      );
    }

    case "h3": {
      const h3 = nodo as NodoH3;
      return (
        <SeccionColapsable
          id={h3.id}
          nivel={3}
          titulo={h3.texto}
          colapsadoInicial={h3.colapsado || false}
        >
          {h3.hijos.map((hoja) => (
            <NodoDispatcher
              key={hoja.id}
              nodo={hoja as NodoEstructural}
              anotaciones={anotaciones}
              onAnotacionClick={onAnotacionClick}
              anotacionActiva={anotacionActiva}
              busqueda={busqueda}
              onEditarNota={onEditarNota}
              onBorrarNota={onBorrarNota}
              onEditarReferencia={onEditarReferencia}
              onBorrarReferencia={onBorrarReferencia}
              onBorrarFraseNotable={onBorrarFraseNotable}
            />
          ))}
        </SeccionColapsable>
      );
    }

    case "p":
      return (
        <NodoParrafoView
          nodo={nodo as NodoParrafo}
          anotaciones={anotsDelNodo}
          onAnotacionClick={onAnotacionClick}
          anotacionActiva={anotacionActiva}
          busqueda={busqDelNodo}
          onEditarNota={onEditarNota}
          onBorrarNota={onBorrarNota}
          onEditarReferencia={onEditarReferencia}
          onBorrarReferencia={onBorrarReferencia}
          onBorrarFraseNotable={onBorrarFraseNotable}
        />
      );

    case "ul":
    case "ol":
      return (
        <NodoListaView
          nodo={nodo as NodoLista}
          anotaciones={anotaciones}
          onAnotacionClick={onAnotacionClick}
          anotacionActiva={anotacionActiva}
          busqueda={busqueda}
          onEditarNota={onEditarNota}
          onBorrarNota={onBorrarNota}
          onEditarReferencia={onEditarReferencia}
          onBorrarReferencia={onBorrarReferencia}
          onBorrarFraseNotable={onBorrarFraseNotable}
        />
      );

    case "tbl":
      return <NodoTablaView nodo={nodo as NodoTabla} />;

    case "code":
      return <NodoCodigoView nodo={nodo as NodoCodigo} />;

    case "latex":
      return <NodoLatexView nodo={nodo as NodoLatex} />;

    default:
      return null;
  }
}
