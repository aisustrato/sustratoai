"use client";

/**
 * StandardGrafo — Componente agnóstico de grafo del sistema sustrato.ai.
 *
 * Capacidades:
 *   - Tipos de nodo con color (vía tokens del design system), icono/emoji,
 *     título y subtítulo.
 *   - Barra de visibilidad por tipo (toggle por chip).
 *   - Modo agregado: ignora tipos, todos los nodos con look neutro.
 *   - Header opcional (título + ícono + subtítulo).
 *   - Animaciones: float + breathe; hover las intensifica.
 *   - Doble click independiente del click simple (delay 250ms).
 *   - Theme-aware: lee colores desde `useTheme().appColorTokens`.
 *   - Respeta `prefers-reduced-motion`.
 *
 * Coherencia de iconos: `iconMode` define si todos los tipos usan componente
 * React o todos usan emoji string. Mezclas disparan console.warn.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tinycolor from "tinycolor2";

import { useTheme } from "@/app/theme-provider";
import { StandardText } from "@/components/ui/StandardText";

import type {
  GraphAnimationConfig,
  GraphEdge,
  GraphHeader,
  GraphIconComponent,
  GraphIconMode,
  GraphNode,
  GraphNodeType,
  GraphViewMode,
  NodeLayout,
} from "@/lib/grafo/types";
import {
  DEFAULT_ANIMATION_CONFIG,
  MAX_RECOMMENDED_NODE_TYPES,
} from "@/lib/grafo/types";
import { buildLayout } from "@/lib/grafo/layout";
import {
  renderGraph,
  type GraphPalette,
  type RenderOptions,
} from "@/lib/grafo/render";
import {
  applyAnimationFrame,
  assignAnimationPhases,
} from "@/lib/grafo/animation";

const CLICK_DOUBLE_DELAY_MS = 250;

export interface StandardGrafoProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total: number;

  /** Catálogo de tipos. Si vacío, todos los nodos usan colorScheme primary. */
  nodeTypes?: GraphNodeType[];

  /** Convención de iconos: componentes React o emoji string. */
  iconMode?: GraphIconMode;

  /** Si está presente y `showHeader=true`, se renderiza arriba del canvas. */
  header?: GraphHeader;
  showHeader?: boolean;

  /** Default: visible si hay >1 tipo. Pasar false para ocultar. */
  showTypeFilter?: boolean;
  /** Toggle "modo agregado" en la barra superior. */
  showAggregateToggle?: boolean;
  defaultAggregateMode?: boolean;

  animations?: GraphAnimationConfig;

  /** "flat" = círculo plano. "3d" = degradado radial simulando esfera. */
  viewMode?: GraphViewMode;

  onNodeClick?: (id: string) => void;
  onNodeDoubleClick?: (id: string) => void;

  height?: number;
  emptyMessage?: string;
}

interface OverlayIconEntry {
  id: string;
  Icon: GraphIconComponent;
  size: number;
}

interface TooltipState {
  x: number;
  y: number;
  node: NodeLayout;
  connections: Array<{ label: string; weight: number }>;
}

export function StandardGrafo({
  nodes,
  edges,
  total,
  nodeTypes = [],
  iconMode = "icon",
  header,
  showHeader = false,
  showTypeFilter,
  showAggregateToggle = false,
  defaultAggregateMode = false,
  animations = DEFAULT_ANIMATION_CONFIG,
  viewMode = "flat",
  onNodeClick,
  onNodeDoubleClick,
  height = 400,
}: StandardGrafoProps) {
  const { appColorTokens } = useTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutsRef = useRef<NodeLayout[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Overlay HTML para iconos React (SVG): un div por icono, posicionado con
  // transform en cada frame del RAF para seguir al nodo animado.
  const iconElsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const [canvasWidth, setCanvasWidth] = useState(600);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [aggregateMode, setAggregateMode] = useState(defaultAggregateMode);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [overlayEntries, setOverlayEntries] = useState<OverlayIconEntry[]>([]);
  // Click sobre un nodo lo "expande": ese nodo + sus vecinos quedan a tinta
  // plena, el resto fantasma. Se resetea al salir del nodo con el mouse.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 1. Validar coherencia de iconMode y límite de tipos
  useEffect(() => {
    if (nodeTypes.length === 0) return;
    const wantString = iconMode === "emoji";
    for (const t of nodeTypes) {
      const isString = typeof t.icon === "string";
      if (isString !== wantString) {
        console.warn(
          `[StandardGrafo] iconMode='${iconMode}' pero tipo '${t.id}' tiene icon ${
            isString ? "string" : "componente"
          }. Esperado: ${wantString ? "string" : "componente"}. Se renderizará vacío.`
        );
        break;
      }
    }
    if (nodeTypes.length > MAX_RECOMMENDED_NODE_TYPES) {
      console.warn(
        `[StandardGrafo] ${nodeTypes.length} tipos. Recomendado ≤${MAX_RECOMMENDED_NODE_TYPES} para mantener la legibilidad visual.`
      );
    }
  }, [nodeTypes, iconMode]);

  // 2. Index de tipos para lookups O(1)
  const nodeTypeIndex = useMemo(() => {
    const idx: Record<string, GraphNodeType> = {};
    for (const t of nodeTypes) idx[t.id] = t;
    return idx;
  }, [nodeTypes]);

  // 2.5 Set de vecinos del nodo expandido (incluyéndolo). Pre-computado para
  // no recorrer `edges` en cada frame del RAF.
  const highlightSet = useMemo<Set<string> | null>(() => {
    if (!expandedId) return null;
    const s = new Set<string>([expandedId]);
    for (const e of edges) {
      if (e.source === expandedId) s.add(e.target);
      else if (e.target === expandedId) s.add(e.source);
    }
    return s;
  }, [expandedId, edges]);

  // 3. Paleta de colores desde tokens.
  // Para el modo "3d" precomputamos lightFill (más claro) y darkFill (más
  // oscuro) que sirven de stops en el gradient radial. tinycolor es estable
  // y ya está en el bundle.
  const palette = useMemo<GraphPalette>(() => {
    const buildColorSet = (fill: string, stroke: string) => ({
      fill,
      stroke,
      lightFill: tinycolor(fill).lighten(22).toHexString(),
      darkFill: tinycolor(fill).darken(18).toHexString(),
    });
    const byType: Record<string, ReturnType<typeof buildColorSet>> = {};
    for (const t of nodeTypes) {
      const shade = appColorTokens[t.colorScheme];
      byType[t.id] = buildColorSet(shade.pure, shade.textShade);
    }
    const primary = appColorTokens.primary;
    return {
      background: appColorTokens.neutral.bg,
      edge: tinycolor(primary.pure).setAlpha(0.35).toRgbString(),
      edgeHover: tinycolor(primary.pure).setAlpha(0.7).toRgbString(),
      label: appColorTokens.neutral.text,
      fallback: buildColorSet(primary.pure, primary.textShade),
      byType,
    };
  }, [appColorTokens, nodeTypes]);

  // 4. ResizeObserver para ancho responsivo
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setCanvasWidth(entry.contentRect.width || 600);
    });
    observer.observe(container);
    setCanvasWidth(container.clientWidth || 600);
    return () => observer.disconnect();
  }, []);

  // 5. Rebuild layout cuando cambian nodos o tamaño.
  // En el mismo paso, snapshot del overlay de iconos React.
  useEffect(() => {
    const layouts = buildLayout(nodes, total, canvasWidth, height);
    assignAnimationPhases(layouts);
    layoutsRef.current = layouts;
    startTimeRef.current = performance.now();

    // Snapshot del overlay de iconos React (SVG).
    if (iconMode !== "icon" || aggregateMode) {
      setOverlayEntries([]);
      return;
    }
    const visibleTypeIds = new Set<string>();
    for (const t of nodeTypes) {
      if (!hiddenTypes.has(t.id)) visibleTypeIds.add(t.id);
    }
    const entries: OverlayIconEntry[] = [];
    for (const layout of layouts) {
      if (!layout.typeId) continue;
      if (visibleTypeIds.size > 0 && !visibleTypeIds.has(layout.typeId)) continue;
      const type = nodeTypeIndex[layout.typeId];
      if (!type) continue;
      if (typeof type.icon === "string") continue;
      entries.push({
        id: layout.id,
        Icon: type.icon as GraphIconComponent,
        size: Math.max(10, Math.round(layout.baseRadius * 0.75)),
      });
    }
    setOverlayEntries(entries);
  }, [
    nodes,
    total,
    canvasWidth,
    height,
    iconMode,
    aggregateMode,
    nodeTypeIndex,
    hiddenTypes,
    nodeTypes,
  ]);

  // 6. Loop de animación + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const visibleTypes = new Set<string>();
    for (const t of nodeTypes) {
      if (!hiddenTypes.has(t.id)) visibleTypes.add(t.id);
    }

    const renderOptions: RenderOptions = {
      aggregateMode,
      nodeTypeIndex,
      iconMode,
      hoveredId,
      visibleTypes,
      viewMode,
      highlightSet,
    };

    // Index para hit-testing rápido de iconos durante el RAF (O(1) por id)
    const overlayIndex = new Map<string, OverlayIconEntry>();
    for (const e of overlayEntries) overlayIndex.set(e.id, e);

    const tick = (now: number) => {
      const t = now - startTimeRef.current;
      applyAnimationFrame(layoutsRef.current, t, hoveredId, animations);
      renderGraph(ctx, layoutsRef.current, edges, palette, renderOptions);

      // Actualizar transform + opacity de cada icono del overlay HTML.
      // Direct DOM (sin setState) para no re-renderizar React a 60fps.
      // Opacity sigue la misma lógica que el canvas: highlightSet tiene
      // precedencia sobre hoveredId.
      if (overlayIndex.size > 0) {
        const hasHover = hoveredId !== null;
        const hasHighlight = highlightSet !== null && highlightSet.size > 0;
        for (const layout of layoutsRef.current) {
          const entry = overlayIndex.get(layout.id);
          if (!entry) continue;
          const el = iconElsRef.current[layout.id];
          if (!el) continue;
          el.style.transform = `translate(${layout.x - entry.size / 2}px, ${
            layout.y - entry.size / 2
          }px)`;
          let ghost = false;
          if (hasHighlight) ghost = !highlightSet.has(layout.id);
          else if (hasHover) ghost = layout.id !== hoveredId;
          el.style.opacity = ghost ? "0.25" : "1";
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [
    edges,
    palette,
    aggregateMode,
    nodeTypeIndex,
    iconMode,
    hoveredId,
    hiddenTypes,
    nodeTypes,
    animations,
    viewMode,
    overlayEntries,
    highlightSet,
  ]);

  // 7. Hit testing — devuelve el nodo bajo el cursor (visible)
  const getNodeAt = useCallback(
    (cx: number, cy: number): NodeLayout | null => {
      const visibleSet = new Set<string>();
      for (const t of nodeTypes) {
        if (!hiddenTypes.has(t.id)) visibleSet.add(t.id);
      }
      for (const node of layoutsRef.current) {
        if (node.typeId && visibleSet.size > 0 && !visibleSet.has(node.typeId)) continue;
        const dx = cx - node.x;
        const dy = cy - node.y;
        if (dx * dx + dy * dy <= node.radius * node.radius) return node;
      }
      return null;
    },
    [hiddenTypes, nodeTypes]
  );

  // 8. Tooltip
  const buildTooltip = useCallback(
    (node: NodeLayout, mx: number, my: number): TooltipState => {
      const connections = edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          const otherId = e.source === node.id ? e.target : e.source;
          const other = layoutsRef.current.find((n) => n.id === otherId);
          return { label: other?.label ?? otherId, weight: e.weight };
        })
        .sort((a, b) => b.weight - a.weight);
      return { x: mx, y: my, node, connections };
    },
    [edges]
  );

  // 9. Mouse handlers
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
        // Hover sobre OTRO nodo rompe la expansión y reinicia el ciclo
        // (hover puro). Si el hover es sobre el mismo nodo expandido, no
        // tocamos nada — la expansión se mantiene.
        if (expandedId && expandedId !== node.id) setExpandedId(null);
      } else {
        setHoveredId(null);
        setTooltip(null);
        canvas.style.cursor = "default";
        // En zona vacía mantenemos la expansión. Solo se limpia con click
        // en vacío (ver handleClick).
      }
    },
    [getNodeAt, buildTooltip, expandedId]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
    // Mantenemos la expansión aunque el cursor abandone el canvas — el reset
    // exige click explícito en vacío.
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);

      if (!node) {
        // Click en zona vacía: reset de la expansión, vuelta al estado normal.
        if (expandedId) setExpandedId(null);
        return;
      }

      // Expandir visualmente al hacer click (vecinos quedan no-fantasma).
      // Lo hago inmediato — no espera el delay de doble-click — porque es
      // feedback visual, no semántico. El callback `onNodeClick` sigue su
      // ciclo normal con el timer.
      setExpandedId(node.id);

      // Distinguir click simple vs doble con timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        onNodeDoubleClick?.(node.id);
        return;
      }
      clickTimerRef.current = setTimeout(() => {
        onNodeClick?.(node.id);
        clickTimerRef.current = null;
      }, CLICK_DOUBLE_DELAY_MS);
    },
    [getNodeAt, onNodeClick, onNodeDoubleClick, expandedId]
  );

  const toggleType = useCallback((typeId: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  }, []);

  const shouldShowTypeFilter =
    showTypeFilter ?? (nodeTypes.length > 1 && !aggregateMode);

  // Banner instructivo: tiene precedencia el de expansión sobre el de hover.
  // En hover puro, el mensaje se adapta si el cliente registró onNodeDoubleClick.
  const bannerText = useMemo<string | null>(() => {
    if (expandedId) return "Click en zona vacía para volver al estado normal";
    if (hoveredId) {
      return onNodeDoubleClick
        ? "Click para marcar relaciones · Doble click para navegar"
        : "Click para marcar relaciones";
    }
    return null;
  }, [expandedId, hoveredId, onNodeDoubleClick]);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {showHeader && header && (
        <GraphHeaderBlock header={header} iconMode={iconMode} />
      )}

      {(shouldShowTypeFilter || showAggregateToggle) && (
        <TypeFilterBar
          nodeTypes={nodeTypes}
          iconMode={iconMode}
          hiddenTypes={hiddenTypes}
          onToggle={toggleType}
          showAggregateToggle={showAggregateToggle}
          aggregateMode={aggregateMode}
          onAggregateToggle={() => setAggregateMode((v) => !v)}
          shouldShowTypeFilter={shouldShowTypeFilter}
          palette={palette}
        />
      )}

      <div style={{ position: "relative", width: "100%", height }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ display: "block", width: canvasWidth, height }}
        />
        {overlayEntries.length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {overlayEntries.map(({ id, Icon, size }) => {
              const IconComponent = Icon as React.ElementType;
              return (
                <div
                  key={id}
                  ref={(el) => {
                    iconElsRef.current[id] = el;
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: size,
                    height: size,
                    color: "#ffffff",
                    transform: "translate(-9999px, -9999px)",
                    willChange: "transform",
                  }}
                >
                  <IconComponent size={size} color="#ffffff" />
                </div>
              );
            })}
          </div>
        )}

        {bannerText && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              background: tinycolor(appColorTokens.neutral.pure)
                .setAlpha(0.88)
                .toRgbString(),
              color: appColorTokens.neutral.contrastText,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: "none",
              zIndex: 5,
              boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
              whiteSpace: "nowrap",
              transition: "opacity 150ms ease",
            }}
          >
            {bannerText}
          </div>
        )}
      </div>

      {tooltip && (
        <TooltipBlock
          tooltip={tooltip}
          total={total}
          nodeTypeIndex={nodeTypeIndex}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes internos
// ---------------------------------------------------------------------------

function GraphHeaderBlock({
  header,
  iconMode,
}: {
  header: GraphHeader;
  iconMode: GraphIconMode;
}) {
  const Icon = header.icon;
  return (
    <div className="mb-3 flex items-start gap-3">
      {Icon && iconMode === "icon" && typeof Icon !== "string" && (
        <RenderIcon Icon={Icon as GraphIconComponent} size={28} />
      )}
      {Icon && iconMode === "emoji" && typeof Icon === "string" && (
        <span style={{ fontSize: 28, lineHeight: 1 }}>{Icon}</span>
      )}
      <div>
        <StandardText preset="title">{header.title}</StandardText>
        {header.subtitle && (
          <StandardText preset="caption" colorScheme="neutral" colorShade="subtle">
            {header.subtitle}
          </StandardText>
        )}
      </div>
    </div>
  );
}

function TypeFilterBar({
  nodeTypes,
  iconMode,
  hiddenTypes,
  onToggle,
  showAggregateToggle,
  aggregateMode,
  onAggregateToggle,
  shouldShowTypeFilter,
  palette,
}: {
  nodeTypes: GraphNodeType[];
  iconMode: GraphIconMode;
  hiddenTypes: Set<string>;
  onToggle: (id: string) => void;
  showAggregateToggle: boolean;
  aggregateMode: boolean;
  onAggregateToggle: () => void;
  shouldShowTypeFilter: boolean;
  palette: GraphPalette;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {shouldShowTypeFilter &&
        nodeTypes.map((t) => {
          const hidden = hiddenTypes.has(t.id);
          const colors = palette.byType[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              title={t.subtitle ?? t.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: hidden ? "transparent" : colors?.fill ?? palette.fallback.fill,
                border: `1.5px solid ${colors?.stroke ?? palette.fallback.stroke}`,
                color: hidden ? colors?.stroke ?? palette.fallback.stroke : "#fff",
                opacity: hidden ? 0.55 : 1,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                transition: "all 150ms ease",
              }}
            >
              {iconMode === "emoji" && typeof t.icon === "string" && (
                <span>{t.icon}</span>
              )}
              {iconMode === "icon" && typeof t.icon !== "string" && (
                <RenderIcon Icon={t.icon as GraphIconComponent} size={14} />
              )}
              <span>{t.label}</span>
            </button>
          );
        })}

      {showAggregateToggle && (
        <button
          type="button"
          onClick={onAggregateToggle}
          style={{
            marginLeft: "auto",
            padding: "4px 10px",
            borderRadius: 999,
            background: aggregateMode ? palette.fallback.fill : "transparent",
            border: `1.5px solid ${palette.fallback.stroke}`,
            color: aggregateMode ? "#fff" : palette.fallback.stroke,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            transition: "all 150ms ease",
          }}
        >
          {aggregateMode ? "✓ Modo agregado" : "Modo agregado"}
        </button>
      )}
    </div>
  );
}

function TooltipBlock({
  tooltip,
  total,
  nodeTypeIndex,
}: {
  tooltip: TooltipState;
  total: number;
  nodeTypeIndex: Record<string, GraphNodeType>;
}) {
  const type = tooltip.node.typeId ? nodeTypeIndex[tooltip.node.typeId] : null;
  return (
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
        maxWidth: 240,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.node.label}</div>
      {type && (
        <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>
          {type.label}
        </div>
      )}
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
  );
}

function RenderIcon({
  Icon,
  size,
}: {
  Icon: GraphIconComponent;
  size: number;
}) {
  const IconComponent = Icon as React.ElementType;
  return <IconComponent size={size} width={size} height={size} />;
}

export default StandardGrafo;
