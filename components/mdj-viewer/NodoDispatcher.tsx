// 📍 components/mdj-viewer/NodoDispatcher.tsx
// Server Component — despacha cada nodo a su componente visual según tipo

import type { NodoEstructural, NodoH1, NodoH2, NodoH3, NodoParrafo, NodoLista, NodoTabla, NodoCodigo, NodoLatex, Anotacion } from "@/lib/mdj/types";
import { SeccionColapsable } from "./SeccionColapsable";
import { NodoParrafoView } from "./NodoParrafoView";
import { NodoListaView } from "./NodoListaView";
import { NodoTablaView } from "./NodoTablaView";
import { NodoCodigoView } from "./NodoCodigoView";

interface NodoDispatcherProps {
  nodo: NodoEstructural;
  anotaciones: Anotacion[];
  onAnotacionClick?: (anotacion: Anotacion) => void;
  anotacionActiva?: string | null;
}

export function NodoDispatcher({
  nodo,
  anotaciones,
  onAnotacionClick,
  anotacionActiva,
}: NodoDispatcherProps) {
  const anotsDelNodo = anotaciones.filter((a) => a.nodo_id === nodo.id);

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
        />
      );

    case "tbl":
      return <NodoTablaView nodo={nodo as NodoTabla} />;

    case "code":
      return <NodoCodigoView nodo={nodo as NodoCodigo} />;

    case "latex":
      return (
        <div className="my-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
          <code className="text-sm font-mono">{(nodo as NodoLatex).contenido}</code>
        </div>
      );

    default:
      return null;
  }
}
