/**
 * Render Canvas para StandardGrafo.
 *
 * Esta función dibuja un frame completo (limpia + fondo + aristas + nodos +
 * iconos/emojis + labels). Recibe la paleta de colores resuelta (no consume
 * useTheme directamente porque corre fuera del flujo de React, dentro de
 * requestAnimationFrame).
 *
 * El componente padre resuelve los colores con `useTheme()` y los pasa
 * en `palette`. Si el tema cambia, el componente reconstruye `palette` y
 * el siguiente frame ya pinta con los colores nuevos.
 */

import type {
  NodeLayout,
  GraphEdge,
  GraphNodeType,
  GraphIconMode,
  GraphViewMode,
} from "./types";

export interface NodeColorSet {
  /** Color base del cuerpo del nodo (modo flat o stop intermedio en 3d). */
  fill: string;
  /** Color del borde. */
  stroke: string;
  /** Versión más clara — usada en el centro del gradient 3d. */
  lightFill: string;
  /** Versión más oscura — usada en el borde del gradient 3d. */
  darkFill: string;
}

export interface GraphPalette {
  background: string;
  edge: string;
  edgeHover: string;
  label: string;
  /** Colores para nodos sin tipo (o en modo agregado). */
  fallback: NodeColorSet;
  byType: Record<string, NodeColorSet>;
}

export interface RenderOptions {
  aggregateMode: boolean;
  nodeTypeIndex: Record<string, GraphNodeType>;
  iconMode: GraphIconMode;
  hoveredId: string | null;
  visibleTypes: Set<string>;
  viewMode: GraphViewMode;
  /**
   * Cuando está presente y no-vacío, todos los nodos fuera del set quedan
   * fantasma (igual que en hover). Toma precedencia sobre `hoveredId`: el
   * grafo entra en "modo expandido" mostrando un nodo + sus vecinos.
   */
  highlightSet?: Set<string> | null;
}

const LABEL_FONT = "12px system-ui, sans-serif";
const EMOJI_FONT = "18px system-ui, sans-serif";
/**
 * Cuando hay un nodo bajo el cursor, el resto del grafo se atenúa para dar
 * jerarquía visual al nodo focado. Valores bajos = más fantasma. El costo es
 * un ajuste de `globalAlpha` por nodo/arista — sin allocations.
 */
const GHOST_NODE_ALPHA = 0.25;
const GHOST_EDGE_ALPHA = 0.12;

function nodeColors(
  node: NodeLayout,
  palette: GraphPalette,
  aggregateMode: boolean
): NodeColorSet {
  if (aggregateMode || !node.typeId) return palette.fallback;
  return palette.byType[node.typeId] ?? palette.fallback;
}

/**
 * Pinta un nodo simulando una esfera 3D: gradient radial con brillo
 * arriba-izquierda (off-center hacia -x, -y) y sombra en el borde opuesto.
 */
function paintSphere3D(
  ctx: CanvasRenderingContext2D,
  node: NodeLayout,
  colors: NodeColorSet
): void {
  // Punto de "luz" desplazado del centro hacia la esquina superior-izquierda
  const lightX = node.x - node.radius * 0.35;
  const lightY = node.y - node.radius * 0.35;
  const grad = ctx.createRadialGradient(
    lightX,
    lightY,
    node.radius * 0.1,
    node.x,
    node.y,
    node.radius
  );
  grad.addColorStop(0, colors.lightFill);
  grad.addColorStop(0.55, colors.fill);
  grad.addColorStop(1, colors.darkFill);
  ctx.fillStyle = grad;
  ctx.fill();
}

function isVisible(node: NodeLayout, visibleTypes: Set<string>): boolean {
  if (visibleTypes.size === 0) return true;
  if (!node.typeId) return true;
  return visibleTypes.has(node.typeId);
}

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  layouts: NodeLayout[],
  edges: GraphEdge[],
  palette: GraphPalette,
  options: RenderOptions
): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  if (layouts.length === 0) {
    ctx.fillStyle = palette.label;
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sin entidades en el corpus.", width / 2, height / 2);
    return;
  }

  const visibleLayouts = layouts.filter((n) => isVisible(n, options.visibleTypes));
  const visibleIds = new Set(visibleLayouts.map((n) => n.id));

  const nodeMap = new Map<string, NodeLayout>();
  for (const n of visibleLayouts) nodeMap.set(n.id, n);

  const maxWeight = edges.reduce((m, e) => Math.max(m, e.weight), 0);

  // Aristas — solo las que conectan dos nodos visibles
  const hasHover = options.hoveredId !== null;
  const hasHighlight =
    options.highlightSet !== null &&
    options.highlightSet !== undefined &&
    options.highlightSet.size > 0;
  const focusActive = hasHover || hasHighlight;

  for (const edge of edges) {
    if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) continue;
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const lineWidth = maxWeight > 0 ? 1 + (edge.weight / maxWeight) * 4 : 1;
    const dashed = edge.weight <= 2;

    // Determinar si la arista pasa el filtro de foco.
    let isGhostEdge = false;
    let isStrongEdge = false; // arista directa al nodo hovered (color enfático)
    if (hasHighlight) {
      const bothIn =
        options.highlightSet!.has(edge.source) &&
        options.highlightSet!.has(edge.target);
      isGhostEdge = !bothIn;
      isStrongEdge =
        !isGhostEdge &&
        hasHover &&
        (edge.source === options.hoveredId || edge.target === options.hoveredId);
    } else if (hasHover) {
      const connected =
        edge.source === options.hoveredId || edge.target === options.hoveredId;
      isGhostEdge = !connected;
      isStrongEdge = connected;
    }

    ctx.save();
    if (focusActive && isGhostEdge) ctx.globalAlpha = GHOST_EDGE_ALPHA;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle = isStrongEdge ? palette.edgeHover : palette.edge;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [4, 4] : []);
    ctx.stroke();
    ctx.restore();
  }

  // Nodos
  for (const node of visibleLayouts) {
    const isHovered = node.id === options.hoveredId;
    // Lógica de fantasma: si hay highlightSet activo, solo los del set son
    // visibles a tinta plena. Si no, solo el hovered.
    let isGhost = false;
    if (hasHighlight) {
      isGhost = !options.highlightSet!.has(node.id);
    } else if (hasHover) {
      isGhost = !isHovered;
    }
    const colors = nodeColors(node, palette, options.aggregateMode);

    ctx.save();
    // Atenuar nodo, emoji y label si hay hover y este no es el nodo focado
    if (isGhost) ctx.globalAlpha = GHOST_NODE_ALPHA;

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

    if (options.viewMode === "3d") {
      paintSphere3D(ctx, node, colors);
    } else {
      ctx.fillStyle = colors.fill;
      ctx.fill();
    }

    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = isHovered ? 2.8 : 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Emoji centrado en el nodo (solo si hay tipo y modo emoji).
    // Los iconos React se dibujan como overlay HTML — ver StandardGrafo.tsx.
    if (
      !options.aggregateMode &&
      options.iconMode === "emoji" &&
      node.typeId
    ) {
      const type = options.nodeTypeIndex[node.typeId];
      if (type && typeof type.icon === "string") {
        ctx.fillStyle = "#ffffff";
        ctx.font = EMOJI_FONT;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(type.icon, node.x, node.y);
      }
    }

    // Label debajo del nodo
    ctx.fillStyle = palette.label;
    ctx.font = LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelY = node.y + node.radius + 4;
    const labelText =
      node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label;
    ctx.fillText(labelText, node.x, labelY);

    ctx.restore();
  }
}
