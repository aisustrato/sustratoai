// 📍 components/mdj-viewer/NodoParrafoView.tsx
// 'use client' — párrafo con highlights de anotaciones y búsqueda.
// Cada tipo de anotación usa su tooltip interactivo:
//   frase_notable → FraseNotableTooltip (accent, borrar)
//   referencia → ReferenciaTooltip (tertiary, editar/borrar)
//   nota → NotaTooltip (secondary, editar/borrar)

"use client";

import { useMemo } from "react";
import { useTheme } from "@/app/theme-provider";
import type { NodoParrafo, Anotacion, CoincidenciaBusqueda } from "@/lib/mdj/types";
import { InlineRenderer } from "./InlineRenderer";
import { AnotacionMarca } from "./AnotacionMarca";
import { NotaTooltip } from "./NotaTooltip";
import { FraseNotableTooltip } from "./FraseNotableTooltip";
import { ReferenciaTooltip } from "./ReferenciaTooltip";

/**
 * Marca visual para coincidencias de búsqueda — usa el color success del tema.
 */
function BusquedaMarca({
  activa,
  children,
}: {
  activa: boolean;
  children: React.ReactNode;
}) {
  const { appColorTokens } = useTheme();
  const success = appColorTokens.success;

  const baseStyle: React.CSSProperties = {
    backgroundColor: activa ? success.bgShade : success.bg,
    borderRadius: "2px",
    padding: "0 2px",
    transition: "all 0.2s ease",
    scrollMarginTop: "120px",
  };

  const activeStyle: React.CSSProperties = activa
    ? {
        boxShadow: `0 0 0 2px ${success.pure}`,
      }
    : {};

  return (
    <span
      style={{ ...baseStyle, ...activeStyle }}
      data-busqueda-activa={activa ? "true" : undefined}
    >
      {children}
    </span>
  );
}

interface BusquedaEnNodo {
  coincidencias: CoincidenciaBusqueda[];
  indiceActivo: number;
}

interface NodoParrafoViewProps {
  nodo: NodoParrafo;
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

type Segmento =
  | { tipo: "texto"; contenido: string }
  | { tipo: "anotacion"; anotacion: Anotacion; contenido: string }
  | { tipo: "busqueda"; contenido: string; activa: boolean }
  | { tipo: "anotacion_busqueda"; anotacion: Anotacion; contenido: string; activa: boolean };

/**
 * Construye segmentos mergeados combinando offsets de anotaciones y búsqueda.
 * Usa un algoritmo de barrido (line-sweep) sobre eventos de inicio/fin.
 */
function construirSegmentos(
  textoPlano: string,
  anotaciones: Anotacion[],
  busqueda?: BusquedaEnNodo,
): Segmento[] {
  const tieneAnotaciones = anotaciones.length > 0;
  const tieneBusqueda = busqueda && busqueda.coincidencias.length > 0;

  // Sin nada que resaltar → un solo segmento de texto
  if (!tieneAnotaciones && !tieneBusqueda) {
    return [{ tipo: "texto", contenido: textoPlano }];
  }

  // Solo anotaciones → comportamiento original
  if (tieneAnotaciones && !tieneBusqueda) {
    const sorted = [...anotaciones].sort(
      (a, b) => a.offset_inicio - b.offset_inicio,
    );
    const result: Segmento[] = [];
    let cursor = 0;

    for (const anot of sorted) {
      if (anot.offset_inicio > cursor) {
        result.push({
          tipo: "texto",
          contenido: textoPlano.slice(cursor, anot.offset_inicio),
        });
      }
      result.push({
        tipo: "anotacion",
        anotacion: anot,
        contenido: textoPlano.slice(anot.offset_inicio, anot.offset_fin),
      });
      cursor = anot.offset_fin;
    }

    if (cursor < textoPlano.length) {
      result.push({
        tipo: "texto",
        contenido: textoPlano.slice(cursor),
      });
    }

    return result;
  }

  // Solo búsqueda → segmentos de búsqueda
  if (!tieneAnotaciones && tieneBusqueda) {
    const sorted = [...busqueda!.coincidencias].sort(
      (a, b) => a.offset_inicio - b.offset_inicio,
    );
    const result: Segmento[] = [];
    let cursor = 0;

    for (let i = 0; i < sorted.length; i++) {
      const c = sorted[i];
      if (c.offset_inicio > cursor) {
        result.push({
          tipo: "texto",
          contenido: textoPlano.slice(cursor, c.offset_inicio),
        });
      }
      result.push({
        tipo: "busqueda",
        contenido: textoPlano.slice(c.offset_inicio, c.offset_fin),
        activa: i === busqueda!.indiceActivo,
      });
      cursor = c.offset_fin;
    }

    if (cursor < textoPlano.length) {
      result.push({
        tipo: "texto",
        contenido: textoPlano.slice(cursor),
      });
    }

    return result;
  }

  // Ambos: anotaciones + búsqueda → merge con line-sweep
  type Evento = {
    pos: number;
    tipo: "ini_anot" | "fin_anot" | "ini_busq" | "fin_busq";
    ref: Anotacion | number;
  };

  const eventos: Evento[] = [];

  for (const anot of anotaciones) {
    eventos.push({ pos: anot.offset_inicio, tipo: "ini_anot", ref: anot });
    eventos.push({ pos: anot.offset_fin, tipo: "fin_anot", ref: anot });
  }

  for (let i = 0; i < busqueda!.coincidencias.length; i++) {
    const c = busqueda!.coincidencias[i];
    eventos.push({ pos: c.offset_inicio, tipo: "ini_busq", ref: i });
    eventos.push({ pos: c.offset_fin, tipo: "fin_busq", ref: i });
  }

  eventos.sort((a, b) => a.pos - b.pos);

  const segmentos: Segmento[] = [];
  let cursor = 0;
  let anotacionActiva: Anotacion | null = null;
  let busquedaActivaIdx: number | null = null;
  let i = 0;

  while (i < eventos.length) {
    const pos = eventos[i].pos;

    // Texto antes de este evento
    if (pos > cursor) {
      segmentos.push({
        tipo: "texto",
        contenido: textoPlano.slice(cursor, pos),
      });
    }

    // Procesar todos los eventos en esta posición
    while (i < eventos.length && eventos[i].pos === pos) {
      const ev = eventos[i];
      if (ev.tipo === "ini_anot") anotacionActiva = ev.ref as Anotacion;
      else if (ev.tipo === "fin_anot") anotacionActiva = null;
      else if (ev.tipo === "ini_busq") busquedaActivaIdx = ev.ref as number;
      else if (ev.tipo === "fin_busq") busquedaActivaIdx = null;
      i++;
    }

    // Siguiente posición de evento
    const nextPos = i < eventos.length ? eventos[i].pos : textoPlano.length;
    const contenido = textoPlano.slice(pos, nextPos);

    if (anotacionActiva && busquedaActivaIdx !== null) {
      segmentos.push({
        tipo: "anotacion_busqueda",
        anotacion: anotacionActiva,
        contenido,
        activa: busquedaActivaIdx === busqueda!.indiceActivo,
      });
    } else if (anotacionActiva) {
      segmentos.push({
        tipo: "anotacion",
        anotacion: anotacionActiva,
        contenido,
      });
    } else if (busquedaActivaIdx !== null) {
      segmentos.push({
        tipo: "busqueda",
        contenido,
        activa: busquedaActivaIdx === busqueda!.indiceActivo,
      });
    }

    cursor = nextPos;
  }

  // Texto después del último evento
  if (cursor < textoPlano.length) {
    segmentos.push({
      tipo: "texto",
      contenido: textoPlano.slice(cursor),
    });
  }

  return segmentos;
}

export function NodoParrafoView({
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
}: NodoParrafoViewProps) {
  const segmentos = useMemo(
    () => construirSegmentos(nodo.texto_plano, anotaciones, busqueda),
    [nodo.texto_plano, anotaciones, busqueda],
  );

  // Si no hay segmentos especiales, renderizar inline simple
  const tieneEspecial = segmentos.some(
    (s) => s.tipo !== "texto",
  );

  if (!tieneEspecial) {
    return (
      <p className="leading-relaxed mb-4 text-base" data-nodo-id={nodo.id}>
        <InlineRenderer inline={nodo.inline} />
      </p>
    );
  }

  return (
    <p className="leading-relaxed mb-4 text-base" data-nodo-id={nodo.id}>
      {segmentos.map((seg, i) => {
        switch (seg.tipo) {
          case "texto":
            return <span key={i}>{seg.contenido}</span>;

          case "anotacion":
            // Notas → tooltip interactivo con editar/borrar
            if (seg.anotacion.tipo === "nota") {
              return (
                <NotaTooltip
                  key={i}
                  anotacion={seg.anotacion}
                  activa={anotacionActiva === seg.anotacion.id}
                  onEditar={onEditarNota}
                  onBorrar={onBorrarNota}
                />
              );
            }
            // Referencias → tooltip con editar/borrar + callback externo
            if (seg.anotacion.tipo === "referencia") {
              return (
                <ReferenciaTooltip
                  key={i}
                  anotacion={seg.anotacion}
                  activa={anotacionActiva === seg.anotacion.id}
                  onEditar={onEditarReferencia}
                  onBorrar={onBorrarReferencia}
                />
              );
            }
            // Frases notables → tooltip con borrar + callback externo
            if (seg.anotacion.tipo === "frase_notable") {
              return (
                <FraseNotableTooltip
                  key={i}
                  anotacion={seg.anotacion}
                  activa={anotacionActiva === seg.anotacion.id}
                  onBorrar={onBorrarFraseNotable}
                />
              );
            }
            // Fallback para otros tipos
            return (
              <AnotacionMarca
                key={i}
                colorScheme="neutral"
                activa={anotacionActiva === seg.anotacion.id}
                onClick={() => onAnotacionClick?.(seg.anotacion)}
              >
                {seg.contenido}
              </AnotacionMarca>
            );

          case "busqueda":
            return (
              <BusquedaMarca
                key={i}
                activa={seg.activa}
              >
                {seg.contenido}
              </BusquedaMarca>
            );

          case "anotacion_busqueda":
            // Notas → tooltip interactivo
            if (seg.anotacion.tipo === "nota") {
              return (
                <NotaTooltip
                  key={i}
                  anotacion={seg.anotacion}
                  activa={anotacionActiva === seg.anotacion.id}
                  onEditar={onEditarNota}
                  onBorrar={onBorrarNota}
                />
              );
            }
            // Referencias → tooltip con editar/borrar
            if (seg.anotacion.tipo === "referencia") {
              return (
                <ReferenciaTooltip
                  key={i}
                  anotacion={seg.anotacion}
                  activa={anotacionActiva === seg.anotacion.id}
                  onEditar={onEditarReferencia}
                  onBorrar={onBorrarReferencia}
                />
              );
            }
            // Frases notables → tooltip con borrar
            if (seg.anotacion.tipo === "frase_notable") {
              return (
                <FraseNotableTooltip
                  key={i}
                  anotacion={seg.anotacion}
                  activa={anotacionActiva === seg.anotacion.id}
                  onBorrar={onBorrarFraseNotable}
                />
              );
            }
            // Fallback
            return (
              <AnotacionMarca
                key={i}
                colorScheme="neutral"
                activa={anotacionActiva === seg.anotacion.id}
                onClick={() => onAnotacionClick?.(seg.anotacion)}
              >
                {seg.contenido}
              </AnotacionMarca>
            );
        }
      })}
    </p>
  );
}
