// 📍 components/mdj-viewer/MDJViewerClient.tsx
// 'use client' — Wrapper que agrega selección inteligente de texto.
// Renderiza el árbol MDJ directamente (no usa MDJViewer Server Component).
//
// Uso:
//   <MDJViewerClient
//     md={contenido}
//     artefactoId="..."
//     onSeleccion={(sel) => enviarACognetica(sel)}
//   />
//
// Para uso sin selección (más liviano, server-rendered), usar MDJViewer directamente.

"use client";

import { useRef, useState, useMemo } from "react";
import { useSeleccionMDJ, type SeleccionMDJ } from "./useSeleccionMDJ";
import { parsearMDJ } from "@/lib/mdj/parser";
import type { DocumentoMDJ, Anotacion } from "@/lib/mdj/types";
import { NodoDispatcher } from "./NodoDispatcher";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { X } from "lucide-react";

interface MDJViewerClientProps {
  md: string;
  artefactoId: string;
  tipoArtefacto?: DocumentoMDJ["tipo_artefacto"];
  anotaciones?: Anotacion[];
  className?: string;
  /** Callback cuando el usuario selecciona texto */
  onSeleccion?: (sel: SeleccionMDJ) => void;
  /** Muestra panel lateral con la selección actual */
  mostrarPanelSeleccion?: boolean;
}

export function MDJViewerClient({
  md,
  artefactoId,
  tipoArtefacto = "otro",
  anotaciones = [],
  className = "",
  onSeleccion,
  mostrarPanelSeleccion = true,
}: MDJViewerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [seleccionLocal, setSeleccionLocal] = useState<SeleccionMDJ | null>(null);

  // Parsear en cliente — memoizado para no reparsear en cada render
  const doc = useMemo(
    () => parsearMDJ(md, artefactoId, tipoArtefacto, anotaciones),
    [md, artefactoId, tipoArtefacto, anotaciones],
  );

  const handleSeleccion = (sel: SeleccionMDJ) => {
    setSeleccionLocal(sel);
    onSeleccion?.(sel);
  };

  useSeleccionMDJ(containerRef, doc, handleSeleccion);

  if (!doc || doc.nodos.length === 0) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400 italic py-8 text-center">
        Sin contenido para mostrar
      </div>
    );
  }

  const huerfanas = doc.anotaciones.filter((a) => a.huerfana);

  return (
    <div className="flex gap-6">
      <div ref={containerRef} className={`flex-1 min-w-0 mdj-viewer ${className}`}>
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

      {mostrarPanelSeleccion && seleccionLocal && (
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm space-y-3">
            <div className="flex items-center justify-between">
              <StandardText weight="semibold" size="sm">
                Texto seleccionado
              </StandardText>
              <button
                onClick={() => setSeleccionLocal(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <blockquote className="border-l-2 border-primary pl-3 py-1 text-neutral-600 dark:text-neutral-400 italic">
              &ldquo;{seleccionLocal.fragmento}&rdquo;
            </blockquote>

            <div className="space-y-1.5 text-xs font-mono text-neutral-500">
              <div>
                <span className="text-neutral-400">nodo_id:</span>{" "}
                {seleccionLocal.nodo_id}
              </div>
              <div>
                <span className="text-neutral-400">offset:</span>{" "}
                {seleccionLocal.offset_inicio}&rarr;{seleccionLocal.offset_fin}
              </div>
              <div>
                <span className="text-neutral-400">longitud:</span>{" "}
                {seleccionLocal.fragmento.length} chars
              </div>
            </div>

            <StandardButton
              size="sm"
              styleType="solid"
              colorScheme="primary"
              className="w-full"
              onClick={() => {
                console.log("[MDJViewerClient] Selección lista para Anotacion:", seleccionLocal);
              }}
            >
              Enviar a Cognética
            </StandardButton>
          </div>
        </div>
      )}
    </div>
  );
}
