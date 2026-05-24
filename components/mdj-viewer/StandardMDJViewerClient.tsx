// 📍 components/mdj-viewer/StandardMDJViewerClient.tsx
// 'use client' — Wrapper que agrega selección inteligente de texto y búsqueda.
// Renderiza el árbol MDJ directamente (no usa StandardMDJViewer Server Component).
//
// Uso:
//   <StandardMDJViewerClient
//     md={contenido}
//     artefactoId="..."
//     onSeleccion={(sel) => enviarACognetica(sel)}
//   />
//
// Para uso sin selección (más liviano, server-rendered), usar StandardMDJViewer directamente.

"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSeleccionMDJ, type SeleccionMDJ } from "./useSeleccionMDJ";
import { BuscadorMDJ } from "./BuscadorMDJ";
import { SeleccionPopover } from "./SeleccionPopover";
import { DialogoReintento } from "./DialogoReintento";
import { DialogoAgregarReferencia } from "./DialogoAgregarReferencia";
import { parsearMDJ } from "@/lib/mdj/parser";
import type { DocumentoMDJ, Anotacion, CoincidenciaBusqueda, SemaforoReferencia } from "@/lib/mdj/types";
import { NodoDispatcher } from "./NodoDispatcher";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { Download } from "lucide-react";
import { exportarMDPuro } from "@/lib/mdj/exportador";
import { generarIdAnotacion } from "@/lib/mdj/id-generator";

interface ResultadoBusqueda {
  coincidencias: CoincidenciaBusqueda[];
  indiceActivo: number;
}

interface PosicionSeleccion {
  x: number;
  y: number;
}

interface StandardMDJViewerClientProps {
  md: string;
  artefactoId: string;
  tipoArtefacto?: DocumentoMDJ["tipo_artefacto"];
  anotaciones?: Anotacion[];
  className?: string;
  /** Callback cuando el usuario selecciona texto */
  onSeleccion?: (sel: SeleccionMDJ) => void;
  /** Callback externo para agregar frase notable — retorna Promise<{ ok: boolean }> */
  onAgregarFraseNotable?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
  /** Callback externo para agregar referencia — retorna Promise<{ ok: boolean }> */
  onAgregarReferencia?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
  /** Callback externo para agregar nota — retorna Promise<{ ok: boolean }> */
  onAgregarNota?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
}

export function StandardMDJViewerClient({
  md,
  artefactoId,
  tipoArtefacto = "otro",
  anotaciones = [],
  className = "",
  onSeleccion,
  onAgregarFraseNotable,
  onAgregarReferencia,
  onAgregarNota,
}: StandardMDJViewerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [seleccionLocal, setSeleccionLocal] = useState<SeleccionMDJ | null>(null);
  const [posicionPopover, setPosicionPopover] = useState<PosicionSeleccion | null>(null);
  const [resultadoBusqueda, setResultadoBusqueda] = useState<ResultadoBusqueda | null>(null);

  // Ref para la selección activa — permite que handleAccionSeleccion lea
  // el valor más reciente sin depender de un estado que cambia en cada cierre.
  // La popover se muestra/oculta según seleccionLocal/posicionPopover (estado),
  // pero las acciones leen del ref para evitar closures stale.
  const seleccionRef = useRef<SeleccionMDJ | null>(null);

  // Track last mouse position as fallback for popover positioning
  const lastMousePos = useRef<PosicionSeleccion>({ x: 0, y: 0 });

  // Estado local de anotaciones — permite editar/borrar sin reparsear
  const [anotacionesLocales, setAnotacionesLocales] = useState<Anotacion[]>(anotaciones);

  // Estado para diálogo de reintento
  const [reintento, setReintento] = useState<{
    tipo: "frase" | "referencia" | "nota";
    anotacion: Anotacion;
    mensaje: string;
  } | null>(null);
  const [reintentando, setReintentando] = useState(false);

  // Leer parámetro de búsqueda desde URL (navegación desde Cognética)
  const searchParams = useSearchParams();
  const busquedaInicial = searchParams?.get("buscar") || undefined;

  // Estado para búsqueda externa (desde popover de selección)
  const [busquedaExterna, setBusquedaExterna] = useState<string | null>(null);

  // Estado para diálogo de agregar nota
  const [dialogoNotaAbierto, setDialogoNotaAbierto] = useState(false);
  const [notaPendiente, setNotaPendiente] = useState<{
    nodo_id: string;
    offset_inicio: number;
    offset_fin: number;
    fragmento: string;
  } | null>(null);
  const [notaTexto, setNotaTexto] = useState("");

  // Estado para diálogo de agregar referencia
  const [dialogoReferenciaAbierto, setDialogoReferenciaAbierto] = useState(false);
  const [referenciaPendiente, setReferenciaPendiente] = useState<{
    nodo_id: string;
    offset_inicio: number;
    offset_fin: number;
    fragmento: string;
  } | null>(null);

  // Parsear en cliente — memoizado para no reparsear en cada render
  // Las anotaciones se pasan separadas para poder modificarlas localmente
  const doc = useMemo(
    () => parsearMDJ(md, artefactoId, tipoArtefacto, []),
    [md, artefactoId, tipoArtefacto],
  );

  // Resolver anotaciones locales sobre el árbol (mismo proceso que parsearMDJ)
  const anotacionesResueltas = useMemo(() => {
    // Reutilizamos la lógica de resolución del parser
    // Para simplificar, pasamos las anotaciones locales directamente
    // El resolverAnotaciones se ejecuta dentro de parsearMDJ, pero como
    // parseamos sin anotaciones, las resolvemos aquí manualmente
    const indice = new Map<string, string>();
    const indexar = (nodos: typeof doc.nodos) => {
      for (const nodo of nodos) {
        indice.set(nodo.id, nodo.id);
        if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
          indexar(nodo.hijos as typeof doc.nodos);
        }
        if ("items" in nodo) {
          for (const item of (nodo as { items: { id: string; texto_plano: string }[] }).items) {
            indice.set(item.id, item.id);
          }
        }
      }
    };
    indexar(doc.nodos);

    return anotacionesLocales.map((anot) => {
      if (!indice.has(anot.nodo_id)) {
        return { ...anot, huerfana: true };
      }
      return anot;
    });
  }, [doc, anotacionesLocales]);

  const handleSeleccion = useCallback((sel: SeleccionMDJ) => {
    console.log("[StandardMDJViewerClient:handleSeleccion] 📍 called, fragmento:", sel.fragmento?.slice(0, 40));

    // Guardar en ref para que handleAccionSeleccion siempre tenga el valor fresco
    seleccionRef.current = sel;
    setSeleccionLocal(sel);

    // Capturar posición de la selección para el popover
    // Envuelto en try/catch porque getRangeAt(0) puede lanzar si rangeCount === 0
    let rect: DOMRect | null = null;
    try {
      const range = window.getSelection()?.getRangeAt(0);
      if (range) rect = range.getBoundingClientRect();
    } catch (err) {
      console.warn("[StandardMDJViewerClient:handleSeleccion] getRangeAt(0) falló — usando fallback de mouse", err);
    }

    if (rect) {
      setPosicionPopover({
        x: rect.left + rect.width / 2,
        y: rect.top + 4,
      });
      console.log("[StandardMDJViewerClient:handleSeleccion] posicionPopover:", { x: rect.left + rect.width / 2, y: rect.top + 4 });
    } else {
      setPosicionPopover({
        x: lastMousePos.current.x,
        y: lastMousePos.current.y + 4,
      });
      console.log("[StandardMDJViewerClient:handleSeleccion] posicionPopover (fallback mouse):", { x: lastMousePos.current.x, y: lastMousePos.current.y + 4 });
    }

    console.log("[StandardMDJViewerClient:handleSeleccion] ✅ done — popover should render now");
    onSeleccion?.(sel);
  }, [onSeleccion]);

  // Track mouse position for popover fallback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useSeleccionMDJ(containerRef, doc, handleSeleccion);

  // Scroll al match activo de búsqueda
  useEffect(() => {
    if (!resultadoBusqueda || resultadoBusqueda.indiceActivo < 0) return;

    const el = containerRef.current?.querySelector('[data-busqueda-activa="true"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [resultadoBusqueda]);

  const handleNavegarBusqueda = useCallback(
    (coincidencia: CoincidenciaBusqueda, indice: number, total: number) => {
      if (indice < 0 || total === 0) {
        setResultadoBusqueda(null);
        return;
      }
      setResultadoBusqueda({
        coincidencias: [coincidencia], // Solo la activa para el dispatcher
        indiceActivo: indice,
      });
    },
    [],
  );

  // Descargar MD con anotaciones marcadas (==frase_notable==, footnotes, notas)
  const descargarMD = useCallback(() => {
    try {
      const mdExportado = exportarMDPuro({ ...doc, anotaciones: anotacionesResueltas });
      const blob = new Blob([mdExportado], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.artefacto_id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[StandardMDJViewerClient:descargarMD]", err);
    }
  }, [doc, anotacionesResueltas]);

  // Callbacks para notas interactivas
  const handleEditarNota = useCallback((anotacion: Anotacion) => {
    setAnotacionesLocales((prev) =>
      prev.map((a) => (a.id === anotacion.id ? anotacion : a)),
    );
  }, []);

  const handleBorrarNota = useCallback((anotacionId: string) => {
    setAnotacionesLocales((prev) => prev.filter((a) => a.id !== anotacionId));
  }, []);

  // Manejar acciones del popover de selección
  const handleAccionSeleccion = useCallback(
    async (accion: "frase" | "nota" | "referencia" | "copiar" | "buscar") => {
      console.log("[StandardMDJViewerClient:handleAccionSeleccion] 🎯 action:", accion);
      // Leer del ref para evitar closures stale — seleccionLocal puede cambiar
      // mientras la función está activa, pero el ref siempre tiene el último valor.
      const seleccion = seleccionRef.current;
      console.log("[StandardMDJViewerClient:handleAccionSeleccion] seleccionRef.current:", seleccion?.fragmento?.slice(0, 40));

      if (!seleccion) {
        console.log("[StandardMDJViewerClient:handleAccionSeleccion] ❌ seleccion is null, returning");
        return;
      }

      // Cerrar popover inmediatamente para que el mouseup listener pueda
      // capturar la próxima selección sin interferencia del estado anterior.
      setPosicionPopover(null);
      setSeleccionLocal(null);

      switch (accion) {
        case "copiar":
          console.log("[StandardMDJViewerClient:handleAccionSeleccion] 📋 writing to clipboard:", seleccion.fragmento.slice(0, 40));
          navigator.clipboard.writeText(seleccion.fragmento).then(() => {
            console.log("[StandardMDJViewerClient:handleAccionSeleccion] ✅ clipboard write OK");
          }).catch((err) => {
            console.error("[StandardMDJViewerClient:handleAccionSeleccion] ❌ clipboard write FAILED:", err);
          });
          break;
        case "buscar":
          console.log("[StandardMDJViewerClient:handleAccionSeleccion] 🔍 setting busquedaExterna:", seleccion.fragmento.slice(0, 40));
          setBusquedaExterna(seleccion.fragmento);
          break;
        case "frase": {
          // Optimistic UI: agregar anotación local inmediatamente
          const nuevaAnot: Anotacion = {
            id: generarIdAnotacion(),
            tipo: "frase_notable",
            nodo_id: seleccion.nodo_id,
            offset_inicio: seleccion.offset_inicio,
            offset_fin: seleccion.offset_fin,
            fragmento: seleccion.fragmento,
          };
          setAnotacionesLocales((prev) => [...prev, nuevaAnot]);

          // Llamar callback externo si existe
          if (onAgregarFraseNotable) {
            try {
              const resultado = await onAgregarFraseNotable(nuevaAnot);
              if (!resultado.ok) {
                setReintento({
                  tipo: "frase",
                  anotacion: nuevaAnot,
                  mensaje: "No se pudo guardar la frase notable en el servidor.",
                });
              }
            } catch (err) {
              console.error("[StandardMDJViewerClient:agregarFraseNotable]", err);
              setReintento({
                tipo: "frase",
                anotacion: nuevaAnot,
                mensaje: "Error de red al guardar la frase notable.",
              });
            }
          }
          break;
        }
        case "referencia": {
          // Abrir diálogo para que el usuario ingrese link, semáforo y descripción
          setReferenciaPendiente({
            nodo_id: seleccion.nodo_id,
            offset_inicio: seleccion.offset_inicio,
            offset_fin: seleccion.offset_fin,
            fragmento: seleccion.fragmento,
          });
          setDialogoReferenciaAbierto(true);
          break;
        }
        case "nota": {
          // Abrir diálogo para que el usuario escriba la nota
          setNotaPendiente({
            nodo_id: seleccion.nodo_id,
            offset_inicio: seleccion.offset_inicio,
            offset_fin: seleccion.offset_fin,
            fragmento: seleccion.fragmento,
          });
          setNotaTexto("");
          setDialogoNotaAbierto(true);
          break;
        }
      }
    },
    // NOTA: seleccionLocal explícitamente excluido del dep array.
    // El hook lee del ref (seleccionRef.current), no del estado React,
    // para evitar que el callback se recreé en cada selección y cause
    // race conditions con el cierre del popover de Radix.
    [onAgregarFraseNotable],
  );

  // Reintentar operación fallida
  const handleReintentar = useCallback(async () => {
    if (!reintento) return;
    setReintentando(true);

    try {
      if (reintento.tipo === "frase" && onAgregarFraseNotable) {
        const resultado = await onAgregarFraseNotable(reintento.anotacion);
        if (resultado.ok) {
          setReintento(null);
        } else {
          console.error("[StandardMDJViewerClient:reintento:frase] Falló nuevamente");
        }
      } else if (reintento.tipo === "referencia" && onAgregarReferencia) {
        const resultado = await onAgregarReferencia(reintento.anotacion);
        if (resultado.ok) {
          setReintento(null);
        } else {
          console.error("[StandardMDJViewerClient:reintento:referencia] Falló nuevamente");
        }
      } else if (reintento.tipo === "nota" && onAgregarNota) {
        const resultado = await onAgregarNota(reintento.anotacion);
        if (resultado.ok) {
          setReintento(null);
        } else {
          console.error("[StandardMDJViewerClient:reintento:nota] Falló nuevamente");
        }
      }
    } catch (err) {
      console.error("[StandardMDJViewerClient:reintento]", err);
    } finally {
      setReintentando(false);
    }
  }, [reintento, onAgregarFraseNotable, onAgregarReferencia, onAgregarNota]);

  const handleCancelarReintento = useCallback(() => {
    // Remover la anotación que falló
    if (reintento) {
      setAnotacionesLocales((prev) => prev.filter((a) => a.id !== reintento.anotacion.id));
    }
    setReintento(null);
  }, [reintento]);

  const cerrarPopover = useCallback(() => {
    setPosicionPopover(null);
    setSeleccionLocal(null);
  }, []);

  // Callback estable para limpiar busquedaExterna — evita que se recree
  // en cada render y dispare el efecto de BuscadorMDJ innecesariamente.
  const handleBusquedaExternaClear = useCallback(() => setBusquedaExterna(null), []);

  // Guardar nota desde el diálogo
  const handleGuardarNota = useCallback(async () => {
    if (!notaPendiente) return;

    const nuevaAnot: Anotacion = {
      id: generarIdAnotacion(),
      tipo: "nota",
      nodo_id: notaPendiente.nodo_id,
      offset_inicio: notaPendiente.offset_inicio,
      offset_fin: notaPendiente.offset_fin,
      fragmento: notaPendiente.fragmento,
      nota_texto: notaTexto.trim(),
    };

    // Optimistic UI: agregar inmediatamente
    setAnotacionesLocales((prev) => [...prev, nuevaAnot]);
    setDialogoNotaAbierto(false);

    // Llamar callback externo si existe
    if (onAgregarNota) {
      try {
        const resultado = await onAgregarNota(nuevaAnot);
        if (!resultado.ok) {
          setReintento({
            tipo: "nota",
            anotacion: nuevaAnot,
            mensaje: "No se pudo guardar la nota en el servidor.",
          });
        }
      } catch (err) {
        console.error("[StandardMDJViewerClient:agregarNota]", err);
        setReintento({
          tipo: "nota",
          anotacion: nuevaAnot,
          mensaje: "Error de red al guardar la nota.",
        });
      }
    }

    // Limpiar estado pendiente
    setNotaPendiente(null);
    setNotaTexto("");
  }, [notaPendiente, notaTexto, onAgregarNota]);

  // Cancelar nota desde el diálogo
  const handleCancelarNota = useCallback(() => {
    setDialogoNotaAbierto(false);
    setNotaPendiente(null);
    setNotaTexto("");
  }, []);

  // Guardar referencia desde el diálogo
  const handleGuardarReferencia = useCallback(
    async (link: string, descripcion: string, semaforo: SemaforoReferencia, validado: boolean) => {
      if (!referenciaPendiente) return;

      const nuevaAnot: Anotacion = {
        id: generarIdAnotacion(),
        tipo: "referencia",
        nodo_id: referenciaPendiente.nodo_id,
        offset_inicio: referenciaPendiente.offset_inicio,
        offset_fin: referenciaPendiente.offset_fin,
        fragmento: referenciaPendiente.fragmento,
        entidad_id: link,
        nota_texto: descripcion || undefined,
        semaforo,
        validado,
      };

      // Optimistic UI: agregar inmediatamente
      setAnotacionesLocales((prev) => [...prev, nuevaAnot]);
      setDialogoReferenciaAbierto(false);

      // Llamar callback externo si existe
      if (onAgregarReferencia) {
        try {
          const resultado = await onAgregarReferencia(nuevaAnot);
          if (!resultado.ok) {
            setReintento({
              tipo: "referencia",
              anotacion: nuevaAnot,
              mensaje: "No se pudo guardar la referencia en el servidor.",
            });
          }
        } catch (err) {
          console.error("[StandardMDJViewerClient:agregarReferencia]", err);
          setReintento({
            tipo: "referencia",
            anotacion: nuevaAnot,
            mensaje: "Error de red al guardar la referencia.",
          });
        }
      }

      // Limpiar estado pendiente
      setReferenciaPendiente(null);
    },
    [referenciaPendiente, onAgregarReferencia],
  );

  // Cancelar referencia desde el diálogo
  const handleCancelarReferencia = useCallback(() => {
    setDialogoReferenciaAbierto(false);
    setReferenciaPendiente(null);
  }, []);

  // Memoizar doc con anotaciones para que la referencia sea estable.
  // Sin esto, cada render del padre crea un objeto nuevo que dispara
  // los efectos de BuscadorMDJ → onNavegar → setResultadoBusqueda()
  // → render padre → objeto nuevo → loop infinito.
  const docConAnotaciones = useMemo(
    () => ({ ...doc, anotaciones: anotacionesResueltas }),
    [doc, anotacionesResueltas],
  );

  if (!doc || doc.nodos.length === 0) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400 italic py-8 text-center">
        Sin contenido para mostrar
      </div>
    );
  }

  const huerfanas = anotacionesResueltas.filter((a) => a.huerfana);

  return (
    <>
      <div className="flex gap-6">
      <div className={`flex-1 min-w-0 mdj-viewer ${className}`}>
        {/* Header sticky — FUERA de containerRef para que no se pierda al hacer scroll */}
        {/* top-16 = 64px para quedar debajo del StandardNavbar (h-16 + 1px gradiente) */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
          <div className="py-3">
            <BuscadorMDJ
              doc={docConAnotaciones}
              onNavegar={handleNavegarBusqueda}
              busquedaInicial={busquedaInicial}
              busquedaExterna={busquedaExterna}
              onBusquedaExternaClear={handleBusquedaExternaClear}
            />
          </div>

          {huerfanas.length > 0 && (
            <div className="pb-3 px-1">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                {huerfanas.length} anotación{huerfanas.length > 1 ? "es" : ""}{" "}
                huérfana{huerfanas.length > 1 ? "s" : ""} — el fragmento original ya
                no existe en el documento.
              </div>
            </div>
          )}
        </div>

        {/* Contenido scrolleable — containerRef solo envuelve los nodos */}
        <div ref={containerRef} className="pt-4">
          {doc.nodos.map((nodo) => (
            <NodoDispatcher
              key={nodo.id}
              nodo={nodo}
              anotaciones={anotacionesResueltas}
              busqueda={resultadoBusqueda ? {
                coincidencias: resultadoBusqueda.coincidencias,
                indiceActivo: resultadoBusqueda.indiceActivo,
              } : undefined}
              onEditarNota={handleEditarNota}
              onBorrarNota={handleBorrarNota}
            />
          ))}
        </div>
      </div>

    </div>

    {/* Botón Bajar a DM — fuera del flex, siempre visible abajo */}
    <div className="mt-6 flex justify-end">
      <StandardButton
        size="sm"
        styleType="outline"
        colorScheme="neutral"
        leftIcon={Download}
        onClick={descargarMD}
      >
        Bajar a DM
      </StandardButton>
    </div>

    {/* Popover de selección — posicionado cerca del texto seleccionado */}
    {posicionPopover && seleccionLocal && (
      <div
        className="fixed z-50"
        style={{
          left: `${posicionPopover.x}px`,
          top: `${posicionPopover.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <SeleccionPopover
          onSeleccion={handleAccionSeleccion}
          onClose={cerrarPopover}
        />
      </div>
    )}

    {/* Diálogo de reintento — cuando un callback externo falla */}
    {reintento && (
      <DialogoReintento
        mensaje={reintento.mensaje}
        onReintentar={handleReintentar}
        onCancelar={handleCancelarReintento}
        reintentando={reintentando}
      />
    )}

    {/* Diálogo para agregar nota — se abre al elegir "Agregar nota" en el popover */}
    <StandardDialog open={dialogoNotaAbierto} onOpenChange={(open) => { if (!open) handleCancelarNota(); }}>
      <StandardDialog.Content size="md" colorScheme="secondary">
        <StandardDialog.Header>
          <StandardDialog.Title>Agregar nota</StandardDialog.Title>
          <StandardDialog.Description>
            Escribe una nota para el fragmento seleccionado.
          </StandardDialog.Description>
        </StandardDialog.Header>
        <StandardDialog.Body>
          {notaPendiente && (
            <div className="mb-3 p-2 bg-secondary/10 border border-secondary/20 rounded text-xs text-secondary-foreground">
              <span className="font-semibold">Fragmento:</span>{" "}
              &ldquo;{notaPendiente.fragmento.slice(0, 120)}
              {notaPendiente.fragmento.length > 120 ? "…" : ""}&rdquo;
            </div>
          )}
          <textarea
            value={notaTexto}
            onChange={(e) => setNotaTexto(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            className="w-full min-h-[120px] p-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-y"
            autoFocus
          />
        </StandardDialog.Body>
        <StandardDialog.Footer>
          <StandardButton
            size="sm"
            styleType="outline"
            colorScheme="neutral"
            onClick={handleCancelarNota}
          >
            Cancelar
          </StandardButton>
          <StandardButton
            size="sm"
            styleType="solid"
            colorScheme="secondary"
            onClick={handleGuardarNota}
            disabled={!notaTexto.trim()}
          >
            Guardar nota
          </StandardButton>
        </StandardDialog.Footer>
      </StandardDialog.Content>
    </StandardDialog>

    {/* Diálogo para agregar referencia — se abre al elegir "Agregar referencia" en el popover */}
    {referenciaPendiente && (
      <DialogoAgregarReferencia
        abierto={dialogoReferenciaAbierto}
        onOpenChange={(open) => { if (!open) handleCancelarReferencia(); }}
        fragmento={referenciaPendiente.fragmento}
        onGuardar={handleGuardarReferencia}
        onCancelar={handleCancelarReferencia}
      />
    )}
    </>
  );
}
