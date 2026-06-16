// 📍 components/ui/helpers/PanelBuscarYOperar.tsx
// Panel de búsqueda + operación quirúrgica.
//
// Uso:
//   <PanelBuscarYOperar
//     doc={docPreview}
//     onBuscar={handleBuscar}
//     onAplicar={handleAplicar}
//     onClose={handleClose}
//   />

"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Search, X, Pencil, ArrowUp, ArrowDown, Trash2, Check, AlertCircle } from "lucide-react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { buscarConContexto, type ResultadoContextual } from "@/lib/mdj/buscador";
import type { DocumentoMDJ } from "@/lib/mdj/types";
import {
  reemplazarNodo,
  insertarAntesDeNodo,
  insertarDespuesDeNodo,
  eliminarNodo,
  type ResultadoCirujano,
} from "@/lib/mdj/cirujano";

interface PanelBuscarYOperarProps {
  md: string;
  doc: DocumentoMDJ;
  onAplicar: (resultado: ResultadoCirujano, label: string) => void;
  onClose: () => void;
}

type AccionPendiente =
  | { tipo: "reemplazar"; resultado: ResultadoContextual }
  | { tipo: "insertarArriba"; resultado: ResultadoContextual }
  | { tipo: "insertarAbajo"; resultado: ResultadoContextual }
  | { tipo: "eliminar"; resultado: ResultadoContextual }
  | null;

export function PanelBuscarYOperar({
  md,
  doc,
  onAplicar,
  onClose,
}: PanelBuscarYOperarProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ResultadoContextual[]>([]);
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente>(null);
  const [contenidoNuevo, setContenidoNuevo] = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus en el input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce de búsqueda
  const ejecutarBusqueda = useCallback(
    (frase: string) => {
      setBuscando(true);
      const res = buscarConContexto(doc, frase);
      setResultados(res);
      setBuscando(false);
    },
    [doc],
  );

  const handleBusquedaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = e.target.value;
      setBusqueda(valor);
      setAccionPendiente(null);
      setContenidoNuevo("");

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (valor.trim().length >= 2) {
        debounceRef.current = setTimeout(() => {
          ejecutarBusqueda(valor.trim());
        }, 400);
      } else {
        setResultados([]);
      }
    },
    [ejecutarBusqueda],
  );

  const handleBuscarClick = useCallback(() => {
    if (busqueda.trim().length >= 2) {
      ejecutarBusqueda(busqueda.trim());
    }
  }, [busqueda, ejecutarBusqueda]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBuscarClick();
      }
    },
    [handleBuscarClick],
  );

  // Acciones por match
  const handleReemplazar = useCallback((resultado: ResultadoContextual) => {
    setAccionPendiente({ tipo: "reemplazar", resultado });
    setContenidoNuevo(resultado.textoCompleto);
    setConfirmarEliminar(null);
  }, []);

  const handleInsertarArriba = useCallback((resultado: ResultadoContextual) => {
    setAccionPendiente({ tipo: "insertarArriba", resultado });
    setContenidoNuevo("");
    setConfirmarEliminar(null);
  }, []);

  const handleInsertarAbajo = useCallback((resultado: ResultadoContextual) => {
    setAccionPendiente({ tipo: "insertarAbajo", resultado });
    setContenidoNuevo("");
    setConfirmarEliminar(null);
  }, []);

  const handleEliminar = useCallback((resultado: ResultadoContextual) => {
    setConfirmarEliminar(resultado.nodoId);
    setAccionPendiente(null);
  }, []);

  const confirmarEliminacion = useCallback(() => {
    if (confirmarEliminar) {
      try {
        const resultado = eliminarNodo(md, doc, confirmarEliminar);
        onAplicar(resultado, "Sección eliminada 🗑️");
        setConfirmarEliminar(null);
        setResultados([]);
        setBusqueda("");
      } catch (err) {
        console.error("[panel:eliminar]", err);
      }
    }
  }, [confirmarEliminar, md, doc, onAplicar]);

  const aplicarAccion = useCallback(() => {
    if (!accionPendiente) return;

    try {
      let resultado: ResultadoCirujano;

      switch (accionPendiente.tipo) {
        case "reemplazar":
          resultado = reemplazarNodo(md, doc, accionPendiente.resultado.nodoId, contenidoNuevo);
          onAplicar(resultado, "Sección reemplazada ✏️");
          break;
        case "insertarArriba":
          resultado = insertarAntesDeNodo(md, doc, accionPendiente.resultado.nodoId, contenidoNuevo);
          onAplicar(resultado, "Contenido insertado arriba ⬆️");
          break;
        case "insertarAbajo":
          resultado = insertarDespuesDeNodo(md, doc, accionPendiente.resultado.nodoId, contenidoNuevo);
          onAplicar(resultado, "Contenido insertado abajo ⬇️");
          break;
        default:
          return;
      }

      setAccionPendiente(null);
      setContenidoNuevo("");
      setResultados([]);
      setBusqueda("");
    } catch (err) {
      console.error("[panel:aplicar]", err);
    }
  }, [accionPendiente, contenidoNuevo, md, doc, onAplicar]);

  const cancelarAccion = useCallback(() => {
    setAccionPendiente(null);
    setContenidoNuevo("");
    setConfirmarEliminar(null);
  }, []);

  // Resaltar fragmento en el texto
  const renderTextoConResaltado = useCallback(
    (texto: string, fragmento: string) => {
      if (!fragmento || !texto.includes(fragmento)) {
        return <span className="text-neutral-700 dark:text-neutral-300">{texto}</span>;
      }

      const idx = texto.indexOf(fragmento);
      const antes = texto.slice(0, idx);
      const despues = texto.slice(idx + fragmento.length);

      return (
        <span>
          <span className="text-neutral-700 dark:text-neutral-300">{antes}</span>
          <span className="bg-amber-200 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100 px-0.5 rounded">
            {fragmento}
          </span>
          <span className="text-neutral-700 dark:text-neutral-300">{despues}</span>
        </span>
      );
    },
    [],
  );

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-neutral-500" />
          <StandardText size="sm" weight="semibold">Buscar y operar</StandardText>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      {/* Input de búsqueda */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={handleBusquedaChange}
            onKeyDown={handleKeyDown}
            placeholder="Buscar frase en el documento..."
            className="flex-1 px-3 py-1.5 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <StandardButton
            size="sm"
            styleType="solid"
            colorScheme="primary"
            onClick={handleBuscarClick}
            disabled={busqueda.trim().length < 2}
          >
            Buscar
          </StandardButton>
        </div>
      </div>

      {/* Resultados */}
      <div className="max-h-[400px] overflow-y-auto">
        {buscando && (
          <div className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
            Buscando...
          </div>
        )}

        {!buscando && resultados.length === 0 && busqueda.trim().length >= 2 && (
          <div className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
            Sin coincidencias
          </div>
        )}

        {!buscando && resultados.length > 0 && (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {resultados.map((r) => (
              <div key={r.nodoId} className="px-4 py-3">
                {/* Breadcrumb + líneas */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[70%]">
                    {r.headingPath}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                    líneas {r.line_inicio}–{r.line_fin}
                  </span>
                  {resultados.length > 1 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                      {resultados.length} coincidencias
                    </span>
                  )}
                </div>

                {/* Texto con resaltado */}
                <div className="text-sm leading-relaxed mb-2 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700">
                  {renderTextoConResaltado(r.textoCompleto, r.fragmento)}
                </div>

                {/* Acciones */}
                {!accionPendiente && confirmarEliminar !== r.nodoId && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleReemplazar(r)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertarArriba(r)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Insertar ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertarAbajo(r)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                    >
                      <ArrowDown className="h-3 w-3" />
                      Insertar ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(r)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </button>
                  </div>
                )}

                {/* Editor inline para reemplazar/insertar */}
                {accionPendiente && accionPendiente.resultado.nodoId === r.nodoId && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={contenidoNuevo}
                      onChange={(e) => setContenidoNuevo(e.target.value)}
                      placeholder={
                        accionPendiente.tipo === "reemplazar"
                          ? "Nuevo contenido para este párrafo..."
                          : "Escribe el nuevo contenido aquí..."
                      }
                      className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <StandardButton
                        size="sm"
                        styleType="solid"
                        colorScheme="primary"
                        leftIcon={Check}
                        onClick={aplicarAccion}
                        disabled={!contenidoNuevo.trim()}
                      >
                        Aplicar
                      </StandardButton>
                      <StandardButton
                        size="sm"
                        styleType="outline"
                        colorScheme="neutral"
                        onClick={cancelarAccion}
                      >
                        Cancelar
                      </StandardButton>
                    </div>
                  </div>
                )}

                {/* Confirmación de eliminación */}
                {confirmarEliminar === r.nodoId && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span className="text-xs text-red-700 dark:text-red-300 flex-1">
                      ¿Eliminar esta sección? Esta acción se puede deshacer.
                    </span>
                    <StandardButton
                      size="sm"
                      styleType="solid"
                      colorScheme="warning"
                      onClick={confirmarEliminacion}
                    >
                      Sí, eliminar
                    </StandardButton>
                    <StandardButton
                      size="sm"
                      styleType="outline"
                      colorScheme="neutral"
                      onClick={cancelarAccion}
                    >
                      No
                    </StandardButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Estado inicial */}
        {!buscando && resultados.length === 0 && busqueda.trim().length < 2 && (
          <div className="px-4 py-8 text-center">
            <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <StandardText size="xs" colorScheme="neutral" colorShade="subtle">
              Escribe una frase para buscar en el documento
            </StandardText>
          </div>
        )}
      </div>
    </div>
  );
}
