// 📍 components/mdj-viewer/StandardMDJViewer.tsx
// Server Component raíz — parsea MD en servidor, renderiza árbol MDJ
//
// Uso básico:
//   <StandardMDJViewer md={contenidoMarkdown} artefactoId={artefacto.id} />
//
// Con anotaciones:
//   <StandardMDJViewer md={md} artefactoId={id} anotaciones={anots} />
//
// Con selección (requiere StandardMDJViewerClient wrapper):
//   <StandardMDJViewerClient md={md} artefactoId={id} onSeleccion={(sel) => {...}} />

import { parsearMDJ } from "@/lib/mdj/parser";
import type { DocumentoMDJ, Anotacion } from "@/lib/mdj/types";
import { NodoDispatcher } from "./NodoDispatcher";

export interface StandardMDJViewerProps {
  md: string;
  artefactoId: string;
  tipoArtefacto?: DocumentoMDJ["tipo_artefacto"];
  anotaciones?: Anotacion[];
  className?: string;
}

/**
 * Componente de servidor — parsea MD y renderiza el árbol completo como HTML.
 * Para agregar interactividad de selección de texto, usar StandardMDJViewerClient.
 */
export function StandardMDJViewer({
  md,
  artefactoId,
  tipoArtefacto = "otro",
  anotaciones = [],
  className = "",
}: StandardMDJViewerProps) {
  const doc = parsearMDJ(md, artefactoId, tipoArtefacto, anotaciones);

  if (!doc || doc.nodos.length === 0) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400 italic py-8 text-center">
        Sin contenido para mostrar
      </div>
    );
  }

  const huerfanas = doc.anotaciones.filter((a) => a.huerfana);

  return (
    <div className={`mdj-viewer ${className}`}>
      {huerfanas.length > 0 && (
        <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          {huerfanas.length} anotación{huerfanas.length > 1 ? "es" : ""}{" "}
          huérfana{huerfanas.length > 1 ? "s" : ""} — el fragmento original ya
          no existe en el documento.
        </div>
      )}

      {doc.nodos.map((nodo) => (
        <NodoDispatcher
          key={nodo.id}
          nodo={nodo}
          anotaciones={doc.anotaciones}
        />
      ))}
    </div>
  );
}
