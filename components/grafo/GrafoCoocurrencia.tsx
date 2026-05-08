"use client";

/**
 * GrafoCoocurrencia — Visualización de grafo de co-ocurrencia de conceptos.
 *
 * Render con Canvas API nativa. Sin D3, sin librerías de grafos.
 * Layout circular estático (sin física/simulación).
 *
 * Comportamiento de layout:
 * - Nodos ordenados por freq desc en disposición circular.
 * - Si el nodo de mayor freq supera 80% del total, va al centro y el resto
 *   se distribuye en elipse alrededor.
 *
 * Nodos: radio 14–42px proporcional a freq.
 * Aristas: grosor proporcional a weight; punteadas si weight ≤ 2.
 * Hover: tooltip con label + freq/total + conexiones con pesos.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface EntityNode {
  id: string;
  label: string;
  freq: number;
}

interface CooccurrenceEdge {
  source: string;
  target: string;
  weight: number;
}

interface NodeLayout {
  id: string;
  label: string;
  freq: number;
  x: number;
  y: number;
  radius: number;
}

interface TooltipState {
  x: number;
  y: number;
  node: NodeLayout;
  connections: Array<{ label: string; weight: number }>;
}

// ---------------------------------------------------------------------------
// Props públicas
// ---------------------------------------------------------------------------

export interface GrafoCoocurrenciaProps {
  onArtifactSelect?: (artifactId: string) => void;
  onEntitySelect?: (entityId: string) => void;
  minWeight?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Constantes de render
// ---------------------------------------------------------------------------

const RADIO_MIN = 14;
const RADIO_MAX = 42;
const PADDING = RADIO_MAX + 8;
const NODE_FILL = "#6366f1"; // indigo-500
const NODE_STROKE = "#312e81"; // indigo-900
const NODE_HOVER_FILL = "#818cf8"; // indigo-400
const EDGE_COLOR = "rgba(99,102,241,0.35)";
const EDGE_COLOR_HEAVY = "rgba(99,102,241,0.65)";
const BG_COLOR = "#0f172a"; // slate-900
const LABEL_COLOR = "#f1f5f9"; // slate-100
const LABEL_FONT = "12px system-ui, sans-serif";

// ---------------------------------------------------------------------------
// Helpers de layout
// ---------------------------------------------------------------------------

function calcRadius(freq: number, maxFreq: number): number {
  if (maxFreq === 0) return RADIO_MIN;
  const t = freq / maxFreq;
  return RADIO_MIN + t * (RADIO_MAX - RADIO_MIN);
}

function buildLayout(
  entities: EntityNode[],
  total: number,
  canvasW: number,
  canvasH: number
): NodeLayout[] {
  if (entities.length === 0) return [];

  // Ordenar por freq desc
  const sorted = [...entities].sort((a, b) => b.freq - a.freq);
  const maxFreq = sorted[0]?.freq ?? 0;

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  // Detectar si el nodo top supera 80% del total
  const topIsCenter =
    total > 0 && sorted.length > 1 && sorted[0].freq / total > 0.8;

  const layouts: NodeLayout[] = [];

  if (topIsCenter && sorted.length > 1) {
    // Nodo 0 va al centro
    layouts.push({
      id: sorted[0].id,
      label: sorted[0].label,
      freq: sorted[0].freq,
      x: cx,
      y: cy,
      radius: calcRadius(sorted[0].freq, maxFreq),
    });

    // Resto en elipse alrededor
    const rest = sorted.slice(1);
    const rx = (canvasW / 2 - PADDING) * 0.85;
    const ry = (canvasH / 2 - PADDING) * 0.75;
    rest.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / rest.length - Math.PI / 2;
      layouts.push({
        id: node.id,
        label: node.label,
        freq: node.freq,
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
        radius: calcRadius(node.freq, maxFreq),
      });
    });
  } else {
    // Todos en círculo
    const r = Math.min(canvasW, canvasH) / 2 - PADDING;
    sorted.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / sorted.length - Math.PI / 2;
      layouts.push({
        id: node.id,
        label: node.label,
        freq: node.freq,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        radius: calcRadius(node.freq, maxFreq),
      });
    });
  }

  return layouts;
}

// ---------------------------------------------------------------------------
// Render Canvas
// ---------------------------------------------------------------------------

function renderGraph(
  ctx: CanvasRenderingContext2D,
  layouts: NodeLayout[],
  edges: CooccurrenceEdge[],
  hoveredId: string | null
): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  // Fondo
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  if (layouts.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sin entidades en el corpus.", width / 2, height / 2);
    return;
  }

  const nodeMap = new Map<string, NodeLayout>();
  for (const n of layouts) nodeMap.set(n.id, n);

  // Máximo weight para normalizar grosor
  const maxWeight = edges.reduce((m, e) => Math.max(m, e.weight), 0);

  // Dibujar aristas
  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const lineWidth = maxWeight > 0 ? 1 + (edge.weight / maxWeight) * 4 : 1;
    const dashed = edge.weight <= 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle =
      hoveredId && (edge.source === hoveredId || edge.target === hoveredId)
        ? EDGE_COLOR_HEAVY
        : EDGE_COLOR;
    ctx.lineWidth = lineWidth;
    if (dashed) {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Dibujar nodos
  for (const node of layouts) {
    const isHovered = node.id === hoveredId;

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
    ctx.fillStyle = isHovered ? NODE_HOVER_FILL : NODE_FILL;
    ctx.fill();
    ctx.strokeStyle = NODE_STROKE;
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Label debajo del nodo
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelY = node.y + node.radius + 3;
    // Máximo 16 caracteres para no solapar
    const labelText =
      node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label;
    ctx.fillText(labelText, node.x, labelY);
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function GrafoCoocurrencia({
  // onArtifactSelect: reservado para integración futura con Minotauro
  onArtifactSelect: _onArtifactSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
  onEntitySelect,
  minWeight = 1,
  height = 400,
}: GrafoCoocurrenciaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);

  const [entities, setEntities] = useState<EntityNode[]>([]);
  const [total, setTotal] = useState(0);
  const [edges, setEdges] = useState<CooccurrenceEdge[]>([]);
  const [layouts, setLayouts] = useState<NodeLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Ajustar ancho al contenedor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCanvasWidth(entry.contentRect.width || 600);
      }
    });
    observer.observe(container);
    setCanvasWidth(container.clientWidth || 600);
    return () => observer.disconnect();
  }, []);

  // Fetch de datos
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setFetchError(null);
      try {
        const [entRes, edgeRes] = await Promise.all([
          fetch("/api/graph/entities"),
          fetch(`/api/graph/cooccurrence?min_weight=${minWeight}`),
        ]);

        if (!entRes.ok) {
          throw new Error(`Error cargando entidades: ${entRes.status}`);
        }
        if (!edgeRes.ok) {
          throw new Error(`Error cargando co-ocurrencias: ${edgeRes.status}`);
        }

        const entData = (await entRes.json()) as {
          entities: EntityNode[];
          total: number;
        };
        const edgeData = (await edgeRes.json()) as {
          edges: CooccurrenceEdge[];
        };

        if (!cancelled) {
          setEntities(entData.entities ?? []);
          setTotal(entData.total ?? 0);
          setEdges(edgeData.edges ?? []);
        }
      } catch (err) {
        console.error("[GrafoCoocurrencia:fetch]", err);
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : "Error cargando grafo"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [minWeight]);

  // Recalcular layout cuando cambian datos o tamaño
  useEffect(() => {
    setLayouts(buildLayout(entities, total, canvasWidth, height));
  }, [entities, total, canvasWidth, height]);

  // Render en canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderGraph(ctx, layouts, edges, hoveredId);
  }, [layouts, edges, hoveredId]);

  // Detectar nodo bajo el cursor
  const getNodeAt = useCallback(
    (canvasX: number, canvasY: number): NodeLayout | null => {
      for (const node of layouts) {
        const dx = canvasX - node.x;
        const dy = canvasY - node.y;
        if (dx * dx + dy * dy <= node.radius * node.radius) {
          return node;
        }
      }
      return null;
    },
    [layouts]
  );

  const buildTooltip = useCallback(
    (
      node: NodeLayout,
      mouseX: number,
      mouseY: number
    ): TooltipState => {
      const connections = edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          const otherId = e.source === node.id ? e.target : e.source;
          const other = layouts.find((n) => n.id === otherId);
          return { label: other?.label ?? otherId, weight: e.weight };
        })
        .sort((a, b) => b.weight - a.weight);

      return { x: mouseX, y: mouseY, node, connections };
    },
    [edges, layouts]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);

      if (node) {
        setHoveredId(node.id);
        setTooltip(buildTooltip(node, e.clientX, e.clientY));
        canvas.style.cursor = "pointer";
      } else {
        setHoveredId(null);
        setTooltip(null);
        canvas.style.cursor = "default";
      }
    },
    [getNodeAt, buildTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);
      if (node && onEntitySelect) {
        onEntitySelect(node.id);
      }
    },
    [getNodeAt, onEntitySelect]
  );

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BG_COLOR,
            color: "#94a3b8",
            fontSize: 14,
            zIndex: 2,
            height,
          }}
        >
          Cargando grafo…
        </div>
      )}

      {fetchError && !loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BG_COLOR,
            color: "#f87171",
            fontSize: 13,
            zIndex: 2,
            height,
            padding: "0 16px",
            textAlign: "center",
          }}
        >
          {fetchError}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ display: "block", width: canvasWidth, height }}
      />

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 6,
            padding: "8px 12px",
            color: "#f1f5f9",
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 100,
            maxWidth: 220,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {tooltip.node.label}
          </div>
          <div style={{ color: "#94a3b8", marginBottom: 6 }}>
            freq: {tooltip.node.freq} / {total}
          </div>
          {tooltip.connections.length > 0 && (
            <>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  marginBottom: 3,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Co-ocurre con
              </div>
              {tooltip.connections.slice(0, 8).map((c) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    fontSize: 11,
                    color: "#cbd5e1",
                  }}
                >
                  <span>
                    {c.label.length > 18 ? c.label.slice(0, 16) + "…" : c.label}
                  </span>
                  <span style={{ color: "#818cf8", fontVariantNumeric: "tabular-nums" }}>
                    ×{c.weight}
                  </span>
                </div>
              ))}
              {tooltip.connections.length > 8 && (
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                  +{tooltip.connections.length - 8} más
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
