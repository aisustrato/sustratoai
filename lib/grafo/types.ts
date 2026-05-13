/**
 * Tipos públicos de StandardGrafo.
 *
 * Estos tipos definen el contrato del componente agnóstico de grafo.
 * Cualquier cliente (Cognética, futuros) consume esta API.
 */

import type { ElementType } from "react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

/**
 * Modo de vista del nodo. `flat` = círculo plano relleno. `3d` = degradado
 * radial con brillo arriba-izquierda y sombra al borde, simulando esfera.
 */
export type GraphViewMode = "flat" | "3d";

/**
 * Modo de icono: cuál convención usa el grafo para sus tipos.
 *
 * El componente fuerza coherencia: o todos los tipos usan componente React
 * (modo "icon", típicamente lucide-react o StandardIcon), o todos usan
 * emoji string (modo "emoji"). Mezclar genera console.warn y fallback.
 */
export type GraphIconMode = "icon" | "emoji";

/**
 * Componente de icono compatible. Usamos `ElementType` (no `ComponentType`)
 * porque lucide-react expone `ForwardRefExoticComponent`, que es un
 * `ExoticComponent` — NO asignable a `ComponentType`. `ElementType` cubre
 * ambos casos (forward-ref, FC, class).
 *
 * Trade-off: pierdes type-safety en los props del icono. El componente
 * pasa `size` por defecto al renderizar; otros props se pasan por convención.
 */
export type GraphIconComponent = ElementType;

/**
 * Definición de un tipo de nodo en el grafo.
 *
 * Cada nodo del grafo apunta a un `GraphNodeType` por `typeId`. El tipo
 * decide: color (vía `colorScheme`), icono/emoji, título y subtítulo
 * mostrados en el tooltip / barra de filtro.
 *
 * LÍMITE: se recomiendan máximo 8 tipos visibles a la vez.
 * Razones (documentadas para humanos y futuras IAs):
 *   1. El ojo humano discrimina cómodamente hasta ~7-8 colores en una vista.
 *      Más allá, los matices se confunden y el grafo deja de comunicar.
 *   2. La barra de filtro de tipos satura visualmente con más de 8 chips
 *      (obliga a scroll horizontal o wrap, perdiendo la vista de un vistazo).
 *   3. El design system tiene 8 `ColorSchemeVariant` principales (primary,
 *      secondary, tertiary, accent, success, warning, danger, neutral) que
 *      emparejan 1:1 con los tipos sin reutilizar paletas.
 *   4. Más de 8 tipos suele indicar un problema de modelado: o la dimensión
 *      "tipo" tiene sub-categorías ocultas, o se está mezclando jerarquía
 *      con clasificación.
 *
 * Pasar más de 8 tipos no rompe el componente, solo dispara console.warn.
 */
export interface GraphNodeType {
  id: string;
  label: string;
  subtitle?: string;
  /**
   * Icono del tipo. Si `iconMode === "icon"` debe ser componente React.
   * Si `iconMode === "emoji"` debe ser string (un solo grafema visible).
   */
  icon: GraphIconComponent | string;
  colorScheme: ColorSchemeVariant;
}

/**
 * Nodo del grafo. Para retrocompatibilidad, `typeId` es opcional — si no se
 * provee, el nodo se renderiza con colorScheme "primary" y sin icono.
 */
export interface GraphNode {
  id: string;
  label: string;
  subtitle?: string;
  freq: number;
  typeId?: string;
}

/**
 * Arista de co-ocurrencia entre dos nodos.
 */
export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

/**
 * Configuración de animaciones del grafo.
 */
export interface GraphAnimationConfig {
  /** Nodos oscilan suavemente en X/Y (movimiento sinusoidal). */
  float: boolean;
  /** El radio de cada nodo pulsa periódicamente (efecto respiración). */
  breathe: boolean;
  /** Hover sobre un nodo amplifica su animación. */
  hoverIntensify: boolean;
}

export const DEFAULT_ANIMATION_CONFIG: GraphAnimationConfig = {
  float: true,
  breathe: true,
  hoverIntensify: true,
};

/**
 * Header opcional del grafo. Si `showHeader` está activo, el componente
 * renderiza este bloque arriba del canvas. Si no, el cliente lo maneja afuera.
 */
export interface GraphHeader {
  title: string;
  subtitle?: string;
  /** Mismo principio que `GraphNodeType.icon`, coherente con `iconMode`. */
  icon?: GraphIconComponent | string;
}

/**
 * Estado interno calculado por el layout. No es parte de la API pública,
 * lo expongo aquí para que `lib/grafo/render.ts` y `animation.ts` lo importen.
 */
export interface NodeLayout {
  id: string;
  label: string;
  freq: number;
  typeId?: string;
  /** Posición base (sin offset de animación). */
  baseX: number;
  baseY: number;
  /** Posición actual (base + offset animado). Render usa esto. */
  x: number;
  y: number;
  /** Radio base (sin pulse de respiración). */
  baseRadius: number;
  /** Radio actual. */
  radius: number;
  /** Fase aleatoria para que cada nodo flote desincronizado. */
  phaseFloat: number;
  phaseBreathe: number;
}

/**
 * Límite documentado de tipos visibles. Más que esto genera warning.
 */
export const MAX_RECOMMENDED_NODE_TYPES = 8;
