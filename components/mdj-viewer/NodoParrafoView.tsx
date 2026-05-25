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
import { InlineRenderer } from "./InlineRenderer";
import { AnotacionMarca } from "./AnotacionMarca";

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

function renderizarSegmentosConInline(
  segmentos: Segmento[],
  inline: NodoInline[],
  textoPlano: string,
  callbacks: Record<string, unknown>,
): React.ReactNode[] {
  // Extraer rangos de anotación
  const rangosAnotacion: Array<{ inicio: number; fin: number; seg: Segmento }> = [];
  for (const seg of segmentos) {
    if (seg.tipo === "anotacion" || seg.tipo === "anotacion_busqueda") {
      const idx = textoPlano.indexOf(seg.contenido);
      if (idx >= 0) {
        rangosAnotacion.push({ inicio: idx, fin: idx + seg.contenido.length, seg });
      }
    }
  }

  if (rangosAnotacion.length === 0) {
    return [<InlineRenderer key="full" inline={inline} />];
  }

  // Mapa de posición → segmento de anotación
  const anotacionPorPos = new Map<number, Segmento>();
  for (const r of rangosAnotacion) {
    for (let p = r.inicio; p < r.fin; p++) {
      anotacionPorPos.set(p, r.seg);
    }
  }

  // Renderizar inline respetando anotaciones
  return walkInlineWithAnnotations(inline, 0, anotacionPorPos, callbacks);
}

function leafLen(nodo: NodoInline): number {
  if ("contenido" in nodo && typeof (nodo as { contenido: string }).contenido === "string") {
    return (nodo as { contenido: string }).contenido.length;
  }
  if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
    return (nodo.hijos as NodoInline[]).reduce((s: number, h: NodoInline) => s + leafLen(h), 0);
  }
  return 0;
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

function splitText(
  txt: string,
  base: number,
  am: Map<number, Segmento>,
  cb: Record<string, unknown>,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let cur = 0, ik = 0;
  while (cur < txt.length) {
    const pos = base + cur;
    const seg = am.get(pos);
    if (!seg) {
      let nxt = txt.length;
      for (let p = pos; p < base + txt.length; p++) { if (am.has(p)) { nxt = p - base; break; } }
      const t = txt.slice(cur, nxt);
      if (t) out.push(<span key={`t${ik++}`}>{t}</span>);
      cur = nxt;
    } else {
      let fin = txt.length;
      for (let p = pos; p < base + txt.length; p++) { if (am.get(p) !== seg) { fin = p - base; break; } }
      const at = txt.slice(cur, fin);
      if (at) {
        const a = (seg as { anotacion: Anotacion }).anotacion;
        const activa = (cb as Record<string, unknown>).anotacionActiva === a.id;
        const onClick = (cb as Record<string, unknown>).onAnotacionClick;
        out.push(
          <AnotacionMarca
            key={`a${ik++}`}
            colorScheme={a.tipo === "nota" ? "secondary" : a.tipo === "referencia" ? "tertiary" : "accent"}
            activa={activa}
            onClick={typeof onClick === "function" ? () => (onClick as (a: Anotacion) => void)(a) : undefined}
          >
            {at}
          </AnotacionMarca>,
        );
      }
      cur = fin;
    }
  }
  return out;
}

// Función auxiliar que mide la longitud de texto de un NodoInline
function longitudInline(nodo: NodoInline): number {
  if ("contenido" in nodo && typeof (nodo as { contenido: string }).contenido === "string") {
    return (nodo as { contenido: string }).contenido.length;
  }
  if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
    return nodo.hijos.reduce((sum: number, h: NodoInline) => sum + longitudInline(h), 0);
  }
  return 0;
}

/**
 * Renderiza un array inline recorriendo posición por posición y envolviendo
 * las partes anotadas con el tooltip correspondiente.
 */
function renderInlineConAnotaciones(
  inline: NodoInline[],
  offsetBase: number,
  anotacionPorPos: Map<number, Segmento>,
  textoPlano: string,
  callbacks: {
    anotacionActiva?: string | null;
    onAnotacionClick?: (anotacion: Anotacion) => void;
    onEditarNota?: (anotacion: Anotacion) => void;
    onBorrarNota?: (anotacionId: string) => void;
    onEditarReferencia?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
    onBorrarReferencia?: (anotacionId: string) => Promise<{ ok: boolean }>;
    onBorrarFraseNotable?: (anotacionId: string) => Promise<{ ok: boolean }>;
  },
): React.ReactNode[] {
  const resultado: React.ReactNode[] = [];
  let cursor = offsetBase;

  for (let i = 0; i < inline.length; i++) {
    const nodo = inline[i];
    const len = longitudInline(nodo);
    const start = cursor;
    const end = cursor + len;

    // Verificar si este nodo tiene alguna posición anotada
    let tieneAnotacion = false;
    for (let p = start; p < end; p++) {
      if (anotacionPorPos.has(p)) {
        tieneAnotacion = true;
        break;
      }
    }

    if (!tieneAnotacion) {
      // Renderizar normal con InlineRenderer
      resultado.push(<InlineRenderer key={i} inline={[nodo]} />);
      cursor = end;
      continue;
    }

    // Este nodo tiene anotación — necesitamos dividirlo
    // Por simplicidad, procesamos los hijos si los tiene
    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      resultado.push(
        ...renderizarNodoAnotado(nodo, start, anotacionPorPos, textoPlano, callbacks, i),
      );
      cursor = end;
      continue;
    }

    // Nodo hoja — dividir por segmentos de anotación
    if ("contenido" in nodo && typeof nodo.contenido === "string") {
      const partes = dividirTextoPorAnotaciones(
        nodo.contenido, start, anotacionPorPos, textoPlano, callbacks,
      );
      resultado.push(...partes);
      cursor = end;
    } else {
      resultado.push(<InlineRenderer key={i} inline={[nodo]} />);
      cursor = end;
    }
  }

  return resultado;
}

/**
 * Renderiza un nodo inline que tiene anotaciones en su interior,
 * recorriendo recursivamente sus hijos.
 */
function renderizarNodoAnotado(
  nodo: NodoInline,
  offsetBase: number,
  anotacionPorPos: Map<number, Segmento>,
  textoPlano: string,
  callbacks: Parameters<typeof renderInlineConAnotaciones>[4],
  key: number,
): React.ReactNode[] {
  // Caso hoja
  if ("contenido" in nodo && typeof nodo.contenido === "string") {
    return dividirTextoPorAnotaciones(
      nodo.contenido, offsetBase, anotacionPorPos, textoPlano, callbacks,
    );
  }

  // Nodo con hijos — renderizar hijos anotados y envolver
  if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
    const hijosRender = renderInlineConAnotaciones(
      nodo.hijos, offsetBase, anotacionPorPos, textoPlano, callbacks,
    );

    // Envolver según tipo
    switch (nodo.tipo) {
      case "negrita":
        return [<strong key={key}>{hijosRender}</strong>];
      case "cursiva":
        return [<em key={key}>{hijosRender}</em>];
      case "neg_cur":
        return [<strong key={key}><em>{hijosRender}</em></strong>];
      case "tachado":
        return [<del key={key}>{hijosRender}</del>];
      default:
        return hijosRender;
    }
  }

  return [<InlineRenderer key={key} inline={[nodo]} />];
}

/**
 * Divide un texto plano en segmentos anotados/no anotados
 * y los envuelve con tooltips según corresponda.
 */
function dividirTextoPorAnotaciones(
  texto: string,
  offsetBase: number,
  anotacionPorPos: Map<number, Segmento>,
  textoPlano: string,
  callbacks: {
    anotacionActiva?: string | null;
    onAnotacionClick?: (anotacion: Anotacion) => void;
    onEditarNota?: (anotacion: Anotacion) => void;
    onBorrarNota?: (anotacionId: string) => void;
    onEditarReferencia?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
    onBorrarReferencia?: (anotacionId: string) => Promise<{ ok: boolean }>;
    onBorrarFraseNotable?: (anotacionId: string) => Promise<{ ok: boolean }>;
  },
): React.ReactNode[] {
  const partes: React.ReactNode[] = [];
  let subCursor = 0;
  let partIdx = 0;

  while (subCursor < texto.length) {
    const pos = offsetBase + subCursor;
    const segAnot = anotacionPorPos.get(pos);

    if (!segAnot) {
      // Texto no anotado — avanzar hasta el próximo inicio de anotación
      let nextAnot = texto.length;
      for (let p = pos; p < offsetBase + texto.length; p++) {
        if (anotacionPorPos.has(p)) {
          nextAnot = p - offsetBase;
          break;
        }
      }
      const textoNormal = texto.slice(subCursor, nextAnot);
      if (textoNormal) {
        partes.push(<span key={`t-${partIdx++}`}>{textoNormal}</span>);
      }
      subCursor = nextAnot;
    } else {
      // Texto anotado — encontrar el final de esta anotación
      // Calcular fin recorriendo hacia adelante hasta que cambie la anotación
      let finRel = texto.length;
      for (let p = pos; p < offsetBase + texto.length; p++) {
        const seg = anotacionPorPos.get(p);
        if (seg !== segAnot) {
          finRel = p - offsetBase;
          break;
        }
      }

      const textoAnotado = texto.slice(subCursor, finRel);
      if (textoAnotado) {
        partes.push(
          <span key={`a-${partIdx++}`} className="bg-yellow-200 dark:bg-yellow-700/30 rounded px-0.5">
            {textoAnotado}
          </span>,
        );
      }
      subCursor = finRel;
    }
  }

  return partes;
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
      {renderizarSegmentosConInline(segmentos, nodo.inline, nodo.texto_plano, {
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
