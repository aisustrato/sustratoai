// 📍 components/ui/StandardMDNoteViewer.tsx
// 'use client' — Visor ligero MD con split-pane: fuente ↔ preview.
// Ambos paneles comparten el mismo árbol MDJ para scroll sync 1:1.
//
// Uso:
//   <StandardMDNoteViewer md={contenido} anotaciones={anotaciones} />

"use client";

import { useMemo, useCallback, useState } from "react";
import { parsearMDJ } from "@/lib/mdj/parser";
import type { DocumentoMDJ, Anotacion, NodoEstructural } from "@/lib/mdj/types";
import { NodoDispatcher } from "@/components/mdj-viewer/NodoDispatcher";
import { useScrollSyncMDNote } from "./helpers/useScrollSyncMDNote";
import { StandardButton } from "./StandardButton";
import { StandardText } from "./StandardText";
import { Columns2, FileText, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type VistaMode = "split" | "md" | "preview";

export interface StandardMDNoteViewerProps {
  md: string;
  className?: string;
  altura?: string;
  vistaInicial?: VistaMode;
  anotaciones?: Anotacion[];
}

/**
 * Determina el color sutil para una línea según el tipo de nodo que la contiene.
 */
function getLineColor(tipo: string | undefined): string {
  switch (tipo) {
    case "h1":
      return "text-blue-600 dark:text-blue-400 font-semibold";
    case "h2":
      return "text-blue-500 dark:text-blue-300 font-medium";
    case "h3":
      return "text-blue-400 dark:text-blue-200";
    case "code":
      return "text-gray-500 dark:text-gray-400";
    case "latex":
      return "text-purple-500 dark:text-purple-300";
    case "tbl":
      return "text-green-600 dark:text-green-400";
    case "ul":
    case "ol":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-gray-700 dark:text-gray-300";
  }
}

/**
 * Construye un mapa línea → tipo de nodo para colorear el panel MD fuente.
 */
function construirMapaLineas(doc: DocumentoMDJ): Map<number, string> {
  const mapa = new Map<number, string>();

  const recorrer = (nodo: NodoEstructural) => {
    if (nodo.line_inicio !== undefined && nodo.line_fin !== undefined) {
      for (let l = nodo.line_inicio; l <= nodo.line_fin; l++) {
        if (!mapa.has(l)) {
          mapa.set(l, nodo.tipo);
        }
      }
    }

    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      for (const hijo of (nodo as { hijos: NodoEstructural[] }).hijos) {
        recorrer(hijo);
      }
    }
    if ("items" in nodo) {
      for (const item of (nodo as { items: { id: string; line_inicio?: number; line_fin?: number }[] }).items) {
        if (item.line_inicio !== undefined && item.line_fin !== undefined) {
          for (let l = item.line_inicio; l <= item.line_fin; l++) {
            if (!mapa.has(l)) {
              mapa.set(l, "li");
            }
          }
        }
      }
    }
  };

  for (const nodo of doc.nodos) {
    recorrer(nodo);
  }

  return mapa;
}

export function StandardMDNoteViewer({
  md,
  className = "",
  altura = "500px",
  vistaInicial = "split",
  anotaciones = [],
}: StandardMDNoteViewerProps) {
  const [vista, setVista] = useState<VistaMode>(vistaInicial);

  // Parsear MD una sola vez — ambos paneles comparten el mismo árbol
  const doc = useMemo(
    () => parsearMDJ(md, "mdnote", "otro", anotaciones),
    [md, anotaciones],
  );

  // Mapa línea → tipo de nodo para colorear el panel fuente
  const mapaLineas = useMemo(() => construirMapaLineas(doc), [doc]);

  // Scroll sync entre ambos paneles
  const { sourceRef, previewRef } = useScrollSyncMDNote({
    enabled: vista === "split",
  });

  // Líneas del MD fuente
  const lineas = useMemo(() => md.split("\n"), [md]);

  // Anotaciones huérfanas
  const huerfanas = useMemo(
    () => doc.anotaciones.filter((a) => a.huerfana),
    [doc.anotaciones],
  );

  const toggleVista = useCallback(() => {
    setVista((prev) => {
      if (prev === "split") return "md";
      if (prev === "md") return "preview";
      return "split";
    });
  }, []);

  const vistaLabel = useMemo(() => {
    switch (vista) {
      case "split":
        return "Vista dividida";
      case "md":
        return "Solo MD";
      case "preview":
        return "Solo Preview";
    }
  }, [vista]);

  if (!doc || doc.nodos.length === 0) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400 italic py-8 text-center">
        Sin contenido para mostrar
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header con toggle de vista */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
            MD Note Viewer
          </StandardText>
          {huerfanas.length > 0 && (
            <StandardText size="xs" colorScheme="warning" className="opacity-70">
              {huerfanas.length} anotación{huerfanas.length > 1 ? "es" : ""} huérfana{huerfanas.length > 1 ? "s" : ""}
            </StandardText>
          )}
        </div>
        <StandardButton
          size="sm"
          styleType="outline"
          colorScheme="neutral"
          leftIcon={
            vista === "split" ? Columns2
              : vista === "md" ? FileText
              : Eye
          }
          onClick={toggleVista}
          tooltip={vistaLabel}
        >
          {!vista.includes("split") && vistaLabel}
        </StandardButton>
      </div>

      {/* Contenido */}
      {vista === "split" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel MD Fuente */}
          <div className="flex flex-col" style={{ height: altura }}>
            <div className="flex items-center gap-2 mb-1 px-1">
              <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
                MD Fuente
              </StandardText>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <StandardText size="xs" colorScheme="primary" className="opacity-70">
                Sincronizado
              </StandardText>
            </div>
            <div
              ref={sourceRef}
              className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-3 overflow-y-auto font-mono text-sm leading-relaxed"
            >
              {lineas.map((linea, i) => {
                const lineaNum = i + 1; // 1-indexed
                const tipo = mapaLineas.get(lineaNum);
                const colorClass = getLineColor(tipo);

                return (
                  <div
                    key={i}
                    data-line={lineaNum}
                    className={cn("whitespace-pre-wrap py-0.5", colorClass)}
                  >
                    <span className="select-none text-neutral-400 dark:text-neutral-600 w-8 inline-block text-right mr-3 text-xs">
                      {lineaNum}
                    </span>
                    {linea || "\u00A0"}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Vista Previa */}
          <div className="flex flex-col" style={{ height: altura }}>
            <div className="flex items-center gap-2 mb-1 px-1">
              <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
                Vista Previa
              </StandardText>
            </div>
            <div
              ref={previewRef}
              className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 overflow-y-auto"
            >
              {doc.nodos.map((nodo) => (
                <NodoDispatcher
                  key={nodo.id}
                  nodo={nodo}
                  anotaciones={doc.anotaciones}
                />
              ))}
            </div>
          </div>
        </div>
      ) : vista === "md" ? (
        <div className="flex flex-col" style={{ height: altura }}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
              MD Fuente
            </StandardText>
          </div>
          <div className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-3 overflow-y-auto font-mono text-sm leading-relaxed">
            {lineas.map((linea, i) => {
              const lineaNum = i + 1;
              const tipo = mapaLineas.get(lineaNum);
              const colorClass = getLineColor(tipo);

              return (
                <div
                  key={i}
                  className={cn("whitespace-pre-wrap py-0.5", colorClass)}
                >
                  <span className="select-none text-neutral-400 dark:text-neutral-600 w-8 inline-block text-right mr-3 text-xs">
                    {lineaNum}
                  </span>
                  {linea || "\u00A0"}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col" style={{ height: altura }}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
              Vista Previa
            </StandardText>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <StandardText size="xs" colorScheme="secondary" className="opacity-70">
              Solo lectura
            </StandardText>
          </div>
          <div className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 overflow-y-auto">
            {doc.nodos.map((nodo) => (
              <NodoDispatcher
                key={nodo.id}
                nodo={nodo}
                anotaciones={doc.anotaciones}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
