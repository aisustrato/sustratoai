/**
 * Estado y helpers de animación para StandardGrafo.
 *
 * Responsabilidades:
 *   - Calcular offsets de "float" (oscilación X/Y sinusoidal por nodo).
 *   - Calcular delta de "breathe" (pulsación del radio).
 *   - Amplificar valores cuando un nodo está hovered.
 *   - Respetar `prefers-reduced-motion`: si está activa, devolver 0.
 *
 * El componente llama a `applyAnimationFrame(layouts, t, hoveredId, config)`
 * en cada frame de `requestAnimationFrame`. La función muta las posiciones
 * `x/y/radius` de los layouts a partir de sus `baseX/baseY/baseRadius`.
 */

import type { NodeLayout, GraphAnimationConfig } from "./types";

const FLOAT_AMPLITUDE = 4; // px de oscilación en X/Y
const FLOAT_FREQUENCY = 0.0006; // rad/ms — período ~10.5s
const BREATHE_AMPLITUDE = 1.5; // px de pulso del radio
const BREATHE_FREQUENCY = 0.0010; // rad/ms — período ~6.3s
const HOVER_INTENSIFY_FACTOR = 2.2;

/**
 * Verifica si el usuario tiene activa la preferencia de movimiento reducido.
 * Memo a nivel módulo para evitar consultar matchMedia cada frame.
 */
let prefersReducedMotionCache: boolean | null = null;

export function prefersReducedMotion(): boolean {
  if (prefersReducedMotionCache !== null) return prefersReducedMotionCache;
  if (typeof window === "undefined" || !window.matchMedia) {
    prefersReducedMotionCache = false;
    return false;
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  prefersReducedMotionCache = mq.matches;
  return mq.matches;
}

/**
 * Asigna fases aleatorias a cada layout para desincronizar la animación.
 * Llamar UNA vez al construir los layouts (no en cada frame).
 */
export function assignAnimationPhases(layouts: NodeLayout[]): void {
  for (const node of layouts) {
    node.phaseFloat = Math.random() * Math.PI * 2;
    node.phaseBreathe = Math.random() * Math.PI * 2;
  }
}

/**
 * Aplica el estado de animación correspondiente al tiempo `t` (ms desde
 * el inicio de la sesión de animación). Muta los layouts in-place.
 *
 * Si `prefers-reduced-motion` está activa, restablece x/y/radius a los
 * valores base (sin animación).
 */
export function applyAnimationFrame(
  layouts: NodeLayout[],
  t: number,
  hoveredId: string | null,
  config: GraphAnimationConfig
): void {
  if (prefersReducedMotion()) {
    for (const node of layouts) {
      node.x = node.baseX;
      node.y = node.baseY;
      node.radius = node.baseRadius;
    }
    return;
  }

  const enableFloat = config.float;
  const enableBreathe = config.breathe;
  const enableHover = config.hoverIntensify;

  for (const node of layouts) {
    const isHovered = enableHover && node.id === hoveredId;
    const intensify = isHovered ? HOVER_INTENSIFY_FACTOR : 1;

    if (enableFloat) {
      const ax = FLOAT_AMPLITUDE * intensify;
      const ay = FLOAT_AMPLITUDE * intensify;
      // Componentes X e Y desfasadas para que el nodo trace una elipse,
      // no una línea diagonal.
      node.x = node.baseX + Math.sin(t * FLOAT_FREQUENCY + node.phaseFloat) * ax;
      node.y =
        node.baseY +
        Math.cos(t * FLOAT_FREQUENCY * 1.3 + node.phaseFloat) * ay;
    } else {
      node.x = node.baseX;
      node.y = node.baseY;
    }

    if (enableBreathe) {
      const ar = BREATHE_AMPLITUDE * intensify;
      node.radius =
        node.baseRadius +
        Math.sin(t * BREATHE_FREQUENCY + node.phaseBreathe) * ar;
    } else {
      node.radius = node.baseRadius;
    }
  }
}

/**
 * Para test/storybook: resetea el cache de prefers-reduced-motion.
 */
export function _resetReducedMotionCache(): void {
  prefersReducedMotionCache = null;
}
