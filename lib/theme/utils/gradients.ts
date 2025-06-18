// 📍 lib/theme/utils/gradients.ts
// Utilidades para generar degradados consistentes en la UI

interface GradientStop {
  color: string;
  position: number;
}

/**
 * Genera un degradado lineal a partir de una serie de paradas de color
 * 
 * @param stops - Array de paradas de color con su posición (0-100)
 * @param angle - Ángulo del degradado en grados (por defecto 135, diagonal)
 * @returns - String CSS con el degradado lineal
 */
export function generateLinearGradient(stops: GradientStop[], angle: number = 135): string {
  if (!stops || stops.length === 0) {
    throw new Error('Se requiere al menos una parada de color para generar un degradado');
  }

  const gradientStops = stops
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');

  return `linear-gradient(${angle}deg, ${gradientStops})`;
}

/**
 * Genera un degradado de dos colores
 * 
 * @param startColor - Color inicial
 * @param endColor - Color final
 * @param angle - Ángulo del degradado (por defecto 135, diagonal)
 * @returns - String CSS con el degradado lineal
 */
export function generateTwoToneGradient(startColor: string, endColor: string, angle: number = 135): string {
  return generateLinearGradient([
    { color: startColor, position: 0 },
    { color: endColor, position: 100 }
  ], angle);
}

/**
 * Genera un degradado de tres colores
 * 
 * @param startColor - Color inicial
 * @param middleColor - Color intermedio
 * @param endColor - Color final
 * @param angle - Ángulo del degradado (por defecto 135, diagonal)
 * @returns - String CSS con el degradado lineal
 */
export function generateThreeToneGradient(
  startColor: string, 
  middleColor: string, 
  endColor: string, 
  angle: number = 135
): string {
  return generateLinearGradient([
    { color: startColor, position: 0 },
    { color: middleColor, position: 50 },
    { color: endColor, position: 100 }
  ], angle);
}
