// 📍 components/mdj-viewer/BuscadorMDJ.tsx
// 'use client' — barra de búsqueda interna del MDJViewer
// Con debounce para no buscar en cada keystroke.
//
// Uso:
//   <BuscadorMDJ
//     doc={doc}
//     onNavegar={(coincidencia, indice, total) => {...}}
//     busquedaInicial={searchParams.get("buscar") || undefined}
//   />

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { buscarEnDocumento } from "@/lib/mdj/buscador";
import type { DocumentoMDJ, CoincidenciaBusqueda } from "@/lib/mdj/types";

const DEBOUNCE_MS = 500;

interface BuscadorMDJProps {
  doc: DocumentoMDJ;
  onNavegar: (coincidencia: CoincidenciaBusqueda, indice: number, total: number) => void;
  busquedaInicial?: string;
  /** Búsqueda programática (desde popover de selección) */
  busquedaExterna?: string | null;
  /** Callback para limpiar la búsqueda externa después de procesarla */
  onBusquedaExternaClear?: () => void;
}

export function BuscadorMDJ({ doc, onNavegar, busquedaInicial, busquedaExterna, onBusquedaExternaClear }: BuscadorMDJProps) {
  const [termino, setTermino] = useState(busquedaInicial || "");
  const [terminoBusqueda, setTerminoBusqueda] = useState(busquedaInicial || "");
  const [coincidencias, setCoincidencias] = useState<CoincidenciaBusqueda[]>([]);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [abierto, setAbierto] = useState(!!busquedaInicial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref guard para evitar reprocesar la misma busquedaExterna dos veces
  const busquedaExternaProcesada = useRef<string | null>(null);

  // Debounce: al escribir, esperar DEBOUNCE_MS antes de ejecutar búsqueda
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setTerminoBusqueda(termino);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [termino]);

  // Ejecutar búsqueda cuando cambia el término debounced
  useEffect(() => {
    if (!terminoBusqueda || terminoBusqueda.trim().length < 2) {
      setCoincidencias([]);
      setIndiceActivo(0);
      return;
    }

    const resultados = buscarEnDocumento(doc, terminoBusqueda);
    setCoincidencias(resultados);
    setIndiceActivo(0);

    if (resultados.length > 0) {
      onNavegar(resultados[0], 0, resultados.length);
    }
  }, [terminoBusqueda, doc, onNavegar]);

  // Auto-abrir si hay busquedaInicial
  useEffect(() => {
    if (busquedaInicial) {
      setAbierto(true);
    }
  }, [busquedaInicial]);

  // Sincronizar input cuando cambia busquedaInicial (navegación desde Cognética)
  useEffect(() => {
    if (busquedaInicial) {
      setTermino(busquedaInicial);
      setTerminoBusqueda(busquedaInicial);
    }
  }, [busquedaInicial]);

  // Procesar búsqueda externa (desde popover de selección)
  useEffect(() => {
    if (!busquedaExterna || busquedaExterna.trim().length < 2) return;
    // Guard: si ya procesamos este mismo valor, ignorar
    if (busquedaExterna === busquedaExternaProcesada.current) return;
    busquedaExternaProcesada.current = busquedaExterna;

    setAbierto(true);
    setTermino(busquedaExterna);
    setTerminoBusqueda(busquedaExterna);
    onBusquedaExternaClear?.();
  }, [busquedaExterna, onBusquedaExternaClear]);

  const irAnterior = useCallback(() => {
    if (coincidencias.length === 0) return;
    const nuevo = (indiceActivo - 1 + coincidencias.length) % coincidencias.length;
    setIndiceActivo(nuevo);
    onNavegar(coincidencias[nuevo], nuevo, coincidencias.length);
  }, [coincidencias, indiceActivo, onNavegar]);

  const irSiguiente = useCallback(() => {
    if (coincidencias.length === 0) return;
    const nuevo = (indiceActivo + 1) % coincidencias.length;
    setIndiceActivo(nuevo);
    onNavegar(coincidencias[nuevo], nuevo, coincidencias.length);
  }, [coincidencias, indiceActivo, onNavegar]);

  const cerrar = useCallback(() => {
    setTermino("");
    setTerminoBusqueda("");
    setCoincidencias([]);
    setIndiceActivo(0);
    setAbierto(false);
    onNavegar({ nodo_id: "", offset_inicio: 0, offset_fin: 0, fragmento: "" }, -1, 0);
  }, [onNavegar]);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label="Buscar en el documento"
      >
        <Search size={16} />
        <span>Buscar</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder="Buscar en el documento..."
          className="w-full pl-9 pr-8 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          autoFocus
        />
        {termino && (
          <button
            onClick={() => setTermino("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {coincidencias.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
          <button
            onClick={irAnterior}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[4rem] text-center tabular-nums">
            {indiceActivo + 1} de {coincidencias.length}
          </span>
          <button
            onClick={irSiguiente}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {terminoBusqueda.trim().length >= 2 && coincidencias.length === 0 && (
        <span className="text-sm text-neutral-400">Sin resultados</span>
      )}

      <button
        onClick={cerrar}
        className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Cerrar búsqueda"
      >
        <X size={16} />
      </button>
    </div>
  );
}
