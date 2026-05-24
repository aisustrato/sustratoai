/**
 * Layout circular estático para StandardGrafo.
 *
 * Reglas:
 *   - Nodos ordenados por freq desc.
 *   - Si el nodo top supera 80% del total: va al centro, el resto se distribuye
 *     en elipse alrededor.
 *   - Si no: todos los nodos se distribuyen en círculo perimetral.
 *
 * Esta función calcula `baseX/baseY/baseRadius` (posiciones SIN animación).
 * `lib/grafo/animation.ts` calcula los offsets que se aplican por frame.
 */

import type { GraphNode, NodeLayout } from "./types";

const RADIO_MIN = 14;
const RADIO_MAX = 42;
export const LAYOUT_PADDING = RADIO_MAX + 12;

function calcRadius(freq: number, maxFreq: number): number {
  if (maxFreq === 0) return RADIO_MIN;
  const t = freq / maxFreq;
  return RADIO_MIN + t * (RADIO_MAX - RADIO_MIN);
}

export function buildLayout(
  nodes: GraphNode[],
  total: number,
  canvasW: number,
  canvasH: number
): NodeLayout[] {
  if (nodes.length === 0) return [];

  const sorted = [...nodes].sort((a, b) => b.freq - a.freq);
  const maxFreq = sorted[0]?.freq ?? 0;

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  const topIsCenter =
    total > 0 && sorted.length > 1 && sorted[0].freq / total > 0.8;

  const layouts: NodeLayout[] = [];

  const make = (n: GraphNode, x: number, y: number): NodeLayout => {
    const r = calcRadius(n.freq, maxFreq);
    return {
      id: n.id,
      label: n.label,
      freq: n.freq,
      typeId: n.typeId,
      baseX: x,
      baseY: y,
      x,
      y,
      baseRadius: r,
      radius: r,
      // Fases se asignan después con assignAnimationPhases() para que el
      // primer frame ya tenga desincronización aleatoria.
      phaseFloat: 0,
      phaseBreathe: 0,
    };
  };

  if (topIsCenter && sorted.length > 1) {
    layouts.push(make(sorted[0], cx, cy));
    const rest = sorted.slice(1);
    const rx = (canvasW / 2 - LAYOUT_PADDING) * 0.85;
    const ry = (canvasH / 2 - LAYOUT_PADDING) * 0.75;
    rest.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / rest.length - Math.PI / 2;
      layouts.push(make(node, cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)));
    });
  } else {
    const r = Math.min(canvasW, canvasH) / 2 - LAYOUT_PADDING;
    sorted.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / sorted.length - Math.PI / 2;
      layouts.push(make(node, cx + r * Math.cos(angle), cy + r * Math.sin(angle)));
    });
  }

  return layouts;
}
