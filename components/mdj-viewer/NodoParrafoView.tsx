// 📍 components/mdj-viewer/NodoParrafoView.tsx
// 'use client' — párrafo con highlights de anotaciones y búsqueda.
// Cada tipo de anotación usa su tooltip interactivo:
//   frase_notable → FraseNotableTooltip (accent, borrar)
//   referencia → ReferenciaTooltip (tertiary, editar/borrar)
//   nota → NotaTooltip (secondary, editar/borrar)

"use client";

import { useMemo } from "react";
import * as React from "react";
import { useTheme } from "@/app/theme-provider";
import type { NodoParrafo, Anotacion, CoincidenciaBusqueda, NodoInline } from "@/lib/mdj/types";
import { extraerTextoPlano } from "@/lib/mdj/texto-plano";
import { InlineRenderer } from "./InlineRenderer";
import { AnotacionMarca } from "./AnotacionMarca";
import { NotaTooltip } from "./NotaTooltip";
import { ReferenciaTooltip } from "./ReferenciaTooltip";
import { FraseNotableTooltip } from "./FraseNotableTooltip";
import { EntidadTooltip } from "./EntidadTooltip";

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
    } else if (contenido) {
      // Texto entre regiones, sin anotación ni búsqueda activa. DEBE pushearse:
      // si se omite, los segmentos dejan de ser contiguos y el render (que
      // acumula posiciones por largo) corre todos los resaltados siguientes.
      segmentos.push({ tipo: "texto", contenido });
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

function renderizarSegmentosConInline(
  segmentos: Segmento[],
  inline: NodoInline[],
  callbacks: Record<string, unknown>,
): React.ReactNode[] {
  // Mapa posición → segmento especial (anotación y/o búsqueda).
  // Usamos los offsets acumulados de los segmentos contiguos en lugar de
  // textoPlano.indexOf (que mapeaba mal los términos de búsqueda repetidos).
  const segPorPos = new Map<number, Segmento>();
  let pos = 0;
  for (const seg of segmentos) {
    const len = seg.contenido.length;
    if (seg.tipo !== "texto") {
      for (let p = pos; p < pos + len; p++) segPorPos.set(p, seg);
    }
    pos += len;
  }

  if (segPorPos.size === 0) {
    return [<InlineRenderer key="full" inline={inline} />];
  }

  return walkInlineWithAnnotations(inline, 0, segPorPos, callbacks);
}

function leafLen(nodo: NodoInline): number {
  // DEBE coincidir EXACTO con extraerTextoPlano (que produce texto_plano, sobre
  // el que se calculan los offsets de las anotaciones). Si difiere, los
  // resaltados se desfasan — p.ej. un link aporta su texto a texto_plano pero
  // no tiene contenido/hijos, así que la versión vieja devolvía 0 y corría la
  // marca por el largo del link.
  return extraerTextoPlano([nodo]).length;
}

function walkInlineWithAnnotations(
  inline: NodoInline[],
  base: number,
  am: Map<number, Segmento>,
  cb: Record<string, unknown>,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let k = 0, cur = base;
  for (const n of inline) {
    const len = leafLen(n), s = cur, e = s + len;
    let annotated = false;
    for (let p = s; p < e; p++) { if (am.has(p)) { annotated = true; break; } }
    if (!annotated) {
      out.push(<InlineRenderer key={k++} inline={[n]} />);
    } else {
      out.push(...walkNode(n, s, am, cb, k++));
    }
    cur = e;
  }
  return out;
}

function walkNode(
  n: NodoInline,
  base: number,
  am: Map<number, Segmento>,
  cb: Record<string, unknown>,
  key: number,
): React.ReactNode[] {
  if ("contenido" in n && typeof (n as { contenido: string }).contenido === "string") {
    return splitText((n as { contenido: string }).contenido, base, am, cb);
  }
  if ("hijos" in n && Array.isArray(n.hijos)) {
    const kids = walkInlineWithAnnotations(n.hijos as NodoInline[], base, am, cb);
    switch (n.tipo) {
      case "negrita": return [<strong key={key}>{kids}</strong>];
      case "cursiva": return [<em key={key}>{kids}</em>];
      case "neg_cur": return [<strong key={key}><em>{kids}</em></strong>];
      case "tachado": return [<del key={key}>{kids}</del>];
      default: return kids;
    }
  }
  return [<InlineRenderer key={key} inline={[n]} />];
}

/** Renderiza una anotación (entidad/nota/referencia/frase) con su tooltip. */
function renderAnotacionInline(
  a: Anotacion,
  at: string,
  activa: boolean,
  key: string,
  cb: Record<string, unknown>,
): React.ReactNode {
  if (a.tipo === "entidad") {
    return (
      <EntidadTooltip key={key} anotacion={a} activa={activa}>
        {at}
      </EntidadTooltip>
    );
  }
  if (a.tipo === "nota") {
    return (
      <NotaTooltip
        key={key}
        anotacion={a}
        activa={activa}
        onEditar={cb.onEditarNota as ((anotacion: Anotacion) => void) | undefined}
        onBorrar={cb.onBorrarNota as ((anotacionId: string) => void) | undefined}
      >
        {at}
      </NotaTooltip>
    );
  }
  if (a.tipo === "referencia") {
    return (
      <ReferenciaTooltip
        key={key}
        anotacion={a}
        activa={activa}
        onEditar={cb.onEditarReferencia as ((anotacion: Anotacion) => Promise<{ ok: boolean }>) | undefined}
        onBorrar={cb.onBorrarReferencia as ((anotacionId: string) => Promise<{ ok: boolean }>) | undefined}
      >
        {at}
      </ReferenciaTooltip>
    );
  }
  if (a.tipo === "frase_notable") {
    return (
      <FraseNotableTooltip
        key={key}
        anotacion={a}
        activa={activa}
        onBorrar={cb.onBorrarFraseNotable as ((anotacionId: string) => Promise<{ ok: boolean }>) | undefined}
      >
        {at}
      </FraseNotableTooltip>
    );
  }
  const onClick = (cb as Record<string, unknown>).onAnotacionClick;
  return (
    <AnotacionMarca
      key={key}
      colorScheme="neutral"
      activa={activa}
      onClick={typeof onClick === "function" ? () => (onClick as (a: Anotacion) => void)(a) : undefined}
    >
      {at}
    </AnotacionMarca>
  );
}

function splitText(
  txt: string,
  base: number,
  am: Map<number, Segmento>,
  cb: Record<string, unknown>,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let cur = 0;
  while (cur < txt.length) {
    const pos = base + cur;
    const seg = am.get(pos);
    if (!seg) {
      let nxt = txt.length;
      for (let p = pos; p < base + txt.length; p++) { if (am.has(p)) { nxt = p - base; break; } }
      const t = txt.slice(cur, nxt);
      // key por posición absoluta (única en todo el párrafo: cada segmento
      // arranca en un offset distinto). Antes un contador local se reiniciaba
      // por hoja y chocaba entre hojas (warning "two children with same key").
      if (t) out.push(<span key={`t-${pos}`}>{t}</span>);
      cur = nxt;
    } else {
      let fin = txt.length;
      for (let p = pos; p < base + txt.length; p++) { if (am.get(p) !== seg) { fin = p - base; break; } }
      const at = txt.slice(cur, fin);
      if (at && seg.tipo === "busqueda") {
        // Coincidencia de búsqueda sin anotación → resaltado de búsqueda.
        out.push(
          <BusquedaMarca key={`m-${pos}`} activa={seg.activa}>
            {at}
          </BusquedaMarca>,
        );
      } else if (at) {
        const a = (seg as { anotacion: Anotacion }).anotacion;
        const activa = (cb as Record<string, unknown>).anotacionActiva === a.id;
        const key = `m-${pos}`;
        const anotEl = renderAnotacionInline(a, at, activa, key, cb);
        // Si el segmento ADEMÁS es coincidencia de búsqueda (p.ej. "Ubicar" sobre
        // una entidad, que siempre es anotación), se envuelve en la marca verde
        // para que se vea y el scroll encuentre `data-busqueda-activa`. Antes este
        // caso se renderizaba como solo-anotación → búsqueda invisible (el bug).
        if (seg.tipo === "anotacion_busqueda") {
          out.push(
            <BusquedaMarca key={`mb-${pos}`} activa={(seg as { activa: boolean }).activa}>
              {anotEl}
            </BusquedaMarca>,
          );
        } else {
          out.push(anotEl);
        }
      }
      cur = fin;
    }
  }
  return out;
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
      {renderizarSegmentosConInline(segmentos, nodo.inline, {
        anotacionActiva,
        onAnotacionClick,
        onEditarNota,
        onBorrarNota,
        onEditarReferencia,
        onBorrarReferencia,
        onBorrarFraseNotable,
      })}
    </p>
  );
}
