// 📍 components/ui/StandardMDNoteViewer.tsx
// 'use client' — Visor ligero MD con split-pane: fuente ↔ preview.
// Ambos paneles comparten el mismo árbol MDJ para scroll sync 1:1.
// Fase 2: modo edición con textarea + live preview sync (debounce 300ms)
//        + toolbar de formato Markdown + indicadores de anotaciones
//        + undo/redo con toast de confirmación.
// Fase 3: edición quirúrgica + menú contextual + feedback visual.
//
// Uso:
//   <StandardMDNoteViewer md={contenido} anotaciones={anotaciones} />

"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { parsearMDJ } from "@/lib/mdj/parser";
import type { DocumentoMDJ, Anotacion, NodoEstructural } from "@/lib/mdj/types";
import { NodoDispatcher } from "@/components/mdj-viewer/NodoDispatcher";
import { useScrollSyncMDNote } from "./helpers/useScrollSyncMDNote";
import { useUndoRedo, type HistoryEntry } from "./helpers/useUndoRedo";
import { BarraFormatoMD } from "./helpers/BarraFormatoMD";
import { MenuContextualNodo } from "./helpers/MenuContextualNodo";
import { StandardButton } from "./StandardButton";
import { StandardText } from "./StandardText";
import { Columns2, FileText, Eye, Pencil, Eye as EyeIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mapearAnotacionesALineas } from "@/lib/mdj/buscador";
import { PanelBuscarYOperar } from "./helpers/PanelBuscarYOperar";
import {
  reemplazarNodo,
  insertarDespuesDeNodo,
  eliminarNodo,
  type ResultadoCirujano,
} from "@/lib/mdj/cirujano";

type VistaMode = "split" | "md" | "preview";
type ModoEditor = "lectura" | "edicion";

export interface StandardMDNoteViewerProps {
  md: string;
  className?: string;
  altura?: string;
  vistaInicial?: VistaMode;
  modoInicial?: ModoEditor;
  anotaciones?: Anotacion[];
  onChange?: (nuevoMd: string) => void;
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

/**
 * Color del indicador de anotación según tipo.
 */
function getAnotacionColor(tipo: string): string {
  switch (tipo) {
    case "frase_notable":
      return "bg-amber-400 dark:bg-amber-500";
    case "nota":
      return "bg-blue-400 dark:bg-blue-500";
    case "referencia":
      return "bg-green-400 dark:bg-green-500";
    default:
      return "bg-neutral-400 dark:bg-neutral-500";
  }
}

export function StandardMDNoteViewer({
  md,
  className = "",
  altura = "500px",
  vistaInicial = "split",
  modoInicial = "lectura",
  anotaciones = [],
  onChange,
}: StandardMDNoteViewerProps) {
  const [vista, setVista] = useState<VistaMode>(vistaInicial);
  const [modo, setModo] = useState<ModoEditor>(modoInicial);
  const [mostrarPanelBuscar, setMostrarPanelBuscar] = useState(false);

  // MD interno para edición — se sincroniza con prop externa
  const [mdInterno, setMdInterno] = useState(md);

  // Ref para el textarea (usado por BarraFormatoMD para obtener selección)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Undo/Redo
  const { pushToHistory, undo, redo, canUndo, canRedo } = useUndoRedo(50);

  // Toast de confirmación
  const [toast, setToast] = useState<{ mensaje: string; visible: boolean }>({
    mensaje: "",
    visible: false,
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback((mensaje: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ mensaje, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2000);
  }, []);

  // ── Menú contextual (click derecho en preview) ──
  const [menuContextual, setMenuContextual] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodoId: string;
    nodoTipo: string;
  }>({ visible: false, x: 0, y: 0, nodoId: "", nodoTipo: "" });

  // Líneas afectadas por edición quirúrgica (para feedback visual)
  const [lineasAfectadas, setLineasAfectadas] = useState<{ inicio: number; fin: number } | null>(null);
  const lineasAfectadasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarLineasAfectadas = useCallback((lineas: { inicio: number; fin: number }) => {
    if (lineasAfectadasTimerRef.current) clearTimeout(lineasAfectadasTimerRef.current);
    setLineasAfectadas(lineas);
    lineasAfectadasTimerRef.current = setTimeout(() => {
      setLineasAfectadas(null);
    }, 1500);
  }, []);

  const cerrarMenuContextual = useCallback(() => {
    setMenuContextual((prev) => ({ ...prev, visible: false }));
  }, []);

  const aplicarCirujano = useCallback(
    (resultado: ResultadoCirujano, accionLabel: string) => {
      pushToHistory(mdInterno, textareaRef.current?.selectionStart ?? 0, textareaRef.current?.scrollTop ?? 0);
      setMdInterno(resultado.nuevoMd);
      onChange?.(resultado.nuevoMd);
      mostrarToast(accionLabel);
      mostrarLineasAfectadas(resultado.lineasAfectadas);
      cerrarMenuContextual();
    },
    [pushToHistory, mdInterno, onChange, mostrarToast, mostrarLineasAfectadas, cerrarMenuContextual],
  );

  // Sincronizar mdInterno cuando la prop md cambia externamente
  useEffect(() => {
    setMdInterno(md);
  }, [md]);

  // Debounce 300ms para re-parsear en modo edición
  const [mdDebounced, setMdDebounced] = useState(md);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (modo === "edicion") {
      // Limpiar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Nuevo timer 300ms
      debounceTimerRef.current = setTimeout(() => {
        setMdDebounced(mdInterno);
      }, 300);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    } else {
      // En modo lectura, usar md directamente
      setMdDebounced(md);
    }
  }, [mdInterno, modo, md]);

  // Parsear MD para preview — usa el valor debounced en edición
  const docPreview = useMemo(
    () => parsearMDJ(mdDebounced, "mdnote", "otro", anotaciones),
    [mdDebounced, anotaciones],
  );

  // Parsear MD para panel lectura (coloreado por líneas) — usa md directo
  const docLectura = useMemo(
    () => parsearMDJ(md, "mdnote", "otro", anotaciones),
    [md, anotaciones],
  );

  // Mapa línea → tipo de nodo para colorear el panel fuente (solo lectura)
  const mapaLineas = useMemo(() => construirMapaLineas(docLectura), [docLectura]);

  // Mapa línea → tipos de anotación para indicadores visuales
  const mapaAnotaciones = useMemo(
    () => mapearAnotacionesALineas(anotaciones, docLectura),
    [anotaciones, docLectura],
  );

  // Ref separado para el div de lectura
  const sourceRefLectura = useRef<HTMLDivElement>(null);

  // Scroll sync entre ambos paneles — textareaRef se usa como source en modo edición
  const { previewRef } = useScrollSyncMDNote({
    enabled: vista === "split",
    sourceRef: modo === "edicion" ? (textareaRef as React.RefObject<HTMLDivElement | HTMLTextAreaElement | null>) : (sourceRefLectura as React.RefObject<HTMLDivElement | HTMLTextAreaElement | null>),
  });

  // Líneas del MD fuente
  const lineas = useMemo(() => md.split("\n"), [md]);

  // Anotaciones huérfanas
  const huerfanas = useMemo(
    () => docPreview.anotaciones.filter((a) => a.huerfana),
    [docPreview.anotaciones],
  );

  // ── Handlers de edición quirúrgica (dependen de docPreview) ──
  const handleEditarNodo = useCallback(() => {
    try {
      const resultado = reemplazarNodo(mdInterno, docPreview, menuContextual.nodoId, "[editar contenido]");
      aplicarCirujano(resultado, "Sección lista para editar ✏️");
    } catch (err) {
      console.error("[mdnote:editar]", err);
      mostrarToast("Error al editar sección");
      cerrarMenuContextual();
    }
  }, [mdInterno, docPreview, menuContextual.nodoId, aplicarCirujano, mostrarToast, cerrarMenuContextual]);

  const handleInsertarDespues = useCallback(() => {
    try {
      const resultado = insertarDespuesDeNodo(mdInterno, docPreview, menuContextual.nodoId, "\n[Nuevo contenido]\n");
      aplicarCirujano(resultado, "Contenido insertado ➕");
    } catch (err) {
      console.error("[mdnote:insertar]", err);
      mostrarToast("Error al insertar");
      cerrarMenuContextual();
    }
  }, [mdInterno, docPreview, menuContextual.nodoId, aplicarCirujano, mostrarToast, cerrarMenuContextual]);

  const handleEliminarNodo = useCallback(() => {
    try {
      const resultado = eliminarNodo(mdInterno, docPreview, menuContextual.nodoId);
      aplicarCirujano(resultado, "Sección eliminada 🗑️");
    } catch (err) {
      console.error("[mdnote:eliminar]", err);
      mostrarToast("Error al eliminar");
      cerrarMenuContextual();
    }
  }, [mdInterno, docPreview, menuContextual.nodoId, aplicarCirujano, mostrarToast, cerrarMenuContextual]);

  const toggleVista = useCallback(() => {
    setVista((prev) => {
      if (prev === "split") return "md";
      if (prev === "md") return "preview";
      return "split";
    });
  }, []);

  const toggleModo = useCallback(() => {
    setModo((prev) => (prev === "lectura" ? "edicion" : "lectura"));
  }, []);

  const handleMdChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nuevo = e.target.value;
      // Guardar estado actual en historial antes de cambiar
      pushToHistory(mdInterno, textareaRef.current?.selectionStart ?? 0, textareaRef.current?.scrollTop ?? 0);
      setMdInterno(nuevo);
      onChange?.(nuevo);
    },
    [onChange, pushToHistory, mdInterno],
  );

  const handleApplyFormato = useCallback(
    (nuevoMd: string) => {
      // Guardar estado actual en historial antes de cambiar
      pushToHistory(mdInterno, textareaRef.current?.selectionStart ?? 0, textareaRef.current?.scrollTop ?? 0);
      setMdInterno(nuevoMd);
      onChange?.(nuevoMd);
    },
    [onChange, pushToHistory, mdInterno],
  );

  const handleUndo = useCallback(() => {
    const currentState: HistoryEntry = {
      value: mdInterno,
      cursor: textareaRef.current?.selectionStart ?? 0,
      scrollTop: textareaRef.current?.scrollTop ?? 0,
    };
    const prev = undo(currentState);
    if (prev) {
      setMdInterno(prev.value);
      onChange?.(prev.value);
      mostrarToast("Deshecho ↩");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(prev.cursor, prev.cursor);
          textareaRef.current.scrollTop = prev.scrollTop;
        }
      });
    }
  }, [undo, mdInterno, onChange, mostrarToast]);

  const handleRedo = useCallback(() => {
    const currentState: HistoryEntry = {
      value: mdInterno,
      cursor: textareaRef.current?.selectionStart ?? 0,
      scrollTop: textareaRef.current?.scrollTop ?? 0,
    };
    const next = redo(currentState);
    if (next) {
      setMdInterno(next.value);
      onChange?.(next.value);
      mostrarToast("Rehecho ↪");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(next.cursor, next.cursor);
          textareaRef.current.scrollTop = next.scrollTop;
        }
      });
    }
  }, [redo, mdInterno, onChange, mostrarToast]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
    },
    [handleUndo, handleRedo],
  );

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

  const modoLabel = modo === "lectura" ? "Editar" : "Vista";
  const modoIcon = modo === "lectura" ? Pencil : EyeIcon;

  // ── Handler de contexto para preview ──
  const handlePreviewContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (modo !== "edicion") return;
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-nodo-id]");
      if (!nodeEl) return;

      const nodoId = nodeEl.getAttribute("data-nodo-id") || "";
      const nodoTipo = nodeEl.getAttribute("data-nodo-tipo") || "";
      if (!nodoId) return;

      e.preventDefault();
      e.stopPropagation();
      setMenuContextual({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        nodoId,
        nodoTipo,
      });
    },
    [modo],
  );

  if (!docPreview || docPreview.nodos.length === 0) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400 italic py-8 text-center">
        Sin contenido para mostrar
      </div>
    );
  }

  // ── Panel MD Fuente (reutilizable para split y md-only) ──
  const renderPanelMD = () => {
    if (modo === "edicion") {
      return (
        <div className="flex flex-col relative" style={{ height: altura }}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
              MD Fuente
            </StandardText>
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <StandardText size="xs" colorScheme="warning" className="opacity-70">
              Editando
            </StandardText>
          </div>
          {/* Toolbar de formato */}
          <BarraFormatoMD
            textareaRef={textareaRef}
            onApply={handleApplyFormato}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <textarea
            ref={textareaRef}
            value={mdInterno}
            onChange={handleMdChange}
            onKeyDown={handleTextareaKeyDown}
            className={cn(
              "flex-1 rounded-b-md border border-t-0 transition-colors duration-300",
              "bg-neutral-50 dark:bg-neutral-900 p-3",
              "font-mono text-sm leading-relaxed",
              "resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50",
              "text-neutral-800 dark:text-neutral-200",
              lineasAfectadas
                ? "border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                : "border-neutral-200 dark:border-neutral-700",
            )}
            spellCheck={false}
          />
          {/* Toast de confirmación */}
          <div
            className={cn(
              "absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-md shadow-lg text-xs font-medium",
              "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900",
              "transition-opacity duration-300 pointer-events-none",
              toast.visible ? "opacity-100" : "opacity-0",
            )}
          >
            {toast.mensaje}
          </div>
          {/* Menú contextual */}
          <MenuContextualNodo
            visible={menuContextual.visible}
            x={menuContextual.x}
            y={menuContextual.y}
            nodoId={menuContextual.nodoId}
            nodoTipo={menuContextual.nodoTipo}
            onEditar={handleEditarNodo}
            onInsertarDespues={handleInsertarDespues}
            onEliminar={handleEliminarNodo}
            onClose={cerrarMenuContextual}
          />
        </div>
      );
    }

    // Modo lectura — div con líneas coloreadas + indicadores de anotaciones
    return (
      <div className="flex flex-col" style={{ height: altura }}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
            MD Fuente
          </StandardText>
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          <StandardText size="xs" colorScheme="primary" className="opacity-70">
            Sincronizado
          </StandardText>
          {anotaciones.length > 0 && (
            <StandardText size="xs" colorScheme="secondary" className="opacity-70">
              {anotaciones.length} anotación{anotaciones.length > 1 ? "es" : ""}
            </StandardText>
          )}
        </div>
        <div
          ref={sourceRefLectura}
          className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-3 overflow-y-auto font-mono text-sm leading-relaxed"
        >
          {lineas.map((linea, i) => {
            const lineaNum = i + 1; // 1-indexed
            const tipo = mapaLineas.get(lineaNum);
            const colorClass = getLineColor(tipo);
            const anotTipos = mapaAnotaciones.get(lineaNum);

            return (
              <div
                key={i}
                data-line={lineaNum}
                className={cn("whitespace-pre-wrap py-0.5 flex items-start gap-2", colorClass)}
              >
                <span className="select-none text-neutral-400 dark:text-neutral-600 w-8 inline-block text-right mr-1 text-xs shrink-0">
                  {lineaNum}
                </span>
                {/* Indicadores de anotación */}
                {anotTipos && anotTipos.length > 0 && (
                  <span className="flex gap-0.5 shrink-0 mt-0.5">
                    {anotTipos.map((t) => (
                      <span
                        key={t}
                        className={cn("w-1.5 h-1.5 rounded-full", getAnotacionColor(t))}
                        title={t.replace("_", " ")}
                      />
                    ))}
                  </span>
                )}
                <span className="flex-1">{linea || "\u00A0"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Panel Vista Previa (reutilizable para split y preview-only) ──
  const renderPanelPreview = () => (
    <div className="flex flex-col" style={{ height: altura }}>
      <div className="flex items-center gap-2 mb-1 px-1">
        <StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
          Vista Previa
        </StandardText>
        {modo === "edicion" && (
          <>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <StandardText size="xs" colorScheme="secondary" className="opacity-70">
              Live preview
            </StandardText>
            <StandardText size="xs" colorScheme="neutral" className="opacity-50">
              (click derecho para editar)
            </StandardText>
          </>
        )}
      </div>
      <div
        ref={previewRef}
        onContextMenu={handlePreviewContextMenu}
        className="flex-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 overflow-y-auto"
      >
        {docPreview.nodos.map((nodo) => (
          <NodoDispatcher
            key={nodo.id}
            nodo={nodo}
            anotaciones={docPreview.anotaciones}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header con toggles */}
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
        <div className="flex items-center gap-2">
          {/* Buscar y operar — solo en modo edición */}
          {modo === "edicion" && (
            <StandardButton
              size="sm"
              styleType="outline"
              colorScheme={mostrarPanelBuscar ? "primary" : "neutral"}
              leftIcon={Search}
              onClick={() => setMostrarPanelBuscar((prev) => !prev)}
              tooltip="Buscar y operar"
            >
              Buscar
            </StandardButton>
          )}
          <StandardButton
            size="sm"
            styleType="outline"
            colorScheme="neutral"
            leftIcon={modoIcon}
            onClick={toggleModo}
            tooltip={modoLabel}
          >
            {modoLabel}
          </StandardButton>
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
      </div>

      {/* Panel Buscar y Operar */}
      {mostrarPanelBuscar && modo === "edicion" && (
        <div className="mb-3">
          <PanelBuscarYOperar
            md={mdInterno}
            doc={docPreview}
            onAplicar={aplicarCirujano}
            onClose={() => setMostrarPanelBuscar(false)}
          />
        </div>
      )}

      {/* Contenido */}
      {vista === "split" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderPanelMD()}
          {renderPanelPreview()}
        </div>
      ) : vista === "md" ? (
        renderPanelMD()
      ) : (
        renderPanelPreview()
      )}
    </div>
  );
}
