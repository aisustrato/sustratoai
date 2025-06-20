import type { AppColorTokens, ColorSchemeVariant, Mode } from "../ColorToken";
import tinycolor from 'tinycolor2';

// CAMBIO: Definición de tamaños de la esfera alineada con la jerga Standard.
// Estos son los 'rem' o 'px' reales que la esfera tendrá.
export type SphereSizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// CAMBIO: Tipo de tamaño para StandardIcon (proporcionado por Rodolfo)
export type ImportedIconSize = "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl";


export type SphereStyleType = 'filled' | 'subtle' | 'outline';

export interface SphereTokens {
  // Tamaños base de la esfera en 'rem' (ya no se modifican dinámicamente aquí)
  size: {
    [key in SphereSizeVariant]: string;
  };

  // Colores por variante y tipo de estilo
  styles: {
    [key in SphereStyleType]: {
      backgroundColor: string;
      foregroundColor: string;
      borderColor: string;
      gradient?: string;
      hoverBackgroundColor?: string;
      hoverForegroundColor?: string;
      activeBorderColor?: string;
    }
  };

  // Token para badge si está presente
  badge: {
    offset: string; // Desplazamiento desde la base de la esfera
    size: string;   // Tamaño del badge (referencia, el badge usa su propia prop size)
  };

  // Transiciones y animaciones para la esfera
  transition: string;
  hoverTransform: string;
  activeTransform: string;
}

/**
 * Crea un gradiente radial que simula una esfera 3D.
 * @param color El color base para generar el gradiente.
 * @returns Una cadena de CSS para un gradiente radial.
 */
function createGradient(color: string): string {
  const lighter = tinycolor(color).lighten(12).toHexString();
  const base = color;
  const darker = tinycolor(color).darken(15).toHexString();

  // Degradado tipo "esfera" radial desde arriba-izquierda para un efecto de profundidad
  return `radial-gradient(circle at 30% 30%, ${lighter}, ${base} 50%, ${darker})`;
}

/**
 * Genera un conjunto de tokens de estilo para StandardSphere para cada esquema de color,
 * basándose en los tokens de color de la aplicación y el modo (claro/oscuro).
 * @param appColorTokens Los tokens de color globales de la aplicación.
 * @param mode El modo actual (claro u oscuro).
 * @returns Un objeto con tokens de esfera para cada variante de esquema de color.
 */
export function generateSphereTokens(appColorTokens: AppColorTokens, mode: Mode): Record<ColorSchemeVariant, SphereTokens> {
  const isDark = mode === 'dark';
  const tokens = {} as Record<ColorSchemeVariant, SphereTokens>;

  // Definición de los tamaños físicos de las esferas en 'rem', coherente con la jerga Standard.
  // Estos son los valores que el StandardSphere usará directamente.
  const spherePhysicalSizes: Record<SphereSizeVariant, string> = {
    xs: '2rem',  // 32px
    sm: '2.5rem', // 40px
    md: '3rem',  // 48px
    lg: '3.5rem', // 56px
    xl: '4rem',  // 64px
    '2xl': '4.5rem', // 72px
  };

  for (const colorScheme in appColorTokens) {
    const key = colorScheme as ColorSchemeVariant;
    const palette = appColorTokens[key];

    // Generar tokens solo para las variantes de color principales (primary, secondary, tertiary, etc.).
    // Esto excluye variantes como 'text', 'background' que no son esquemas de color completos.
    if (!palette || !['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info', 'neutral'].includes(key)) {
      continue;
    }

    const mainColor = palette.pure;
    const textColor = palette.contrastText;
    // Para sutil, usamos el color de texto principal del esquema si es oscuro, o un tono de texto más oscuro si es claro.
    const subtleTextColor = isDark ? palette.text : palette.textShade;

    // Generar colores programáticos para estados interactivos (hover/active)
    const hoverBgColor = isDark ? tinycolor(mainColor).lighten(8).toHexString() : tinycolor(mainColor).darken(8).toHexString();
    const activeBgColor = isDark ? tinycolor(mainColor).lighten(12).toHexString() : tinycolor(mainColor).darken(12).toHexString();

    tokens[key] = {
      size: spherePhysicalSizes, // Asigna los tamaños físicos definidos
      styles: {
        filled: {
          backgroundColor: mainColor,
          foregroundColor: textColor,
          borderColor: 'transparent',
          gradient: createGradient(mainColor),
          hoverBackgroundColor: hoverBgColor,
          hoverForegroundColor: textColor,
          activeBorderColor: activeBgColor,
        },
        subtle: {
          backgroundColor: tinycolor(mainColor).setAlpha(0.15).toHexString(),
          foregroundColor: subtleTextColor,
          borderColor: 'transparent',
          gradient: `radial-gradient(circle at 30% 30%, ${tinycolor(mainColor).setAlpha(0.2)}, ${tinycolor(mainColor).setAlpha(0.1)})`,
          hoverBackgroundColor: tinycolor(mainColor).setAlpha(0.25).toHexString(),
          hoverForegroundColor: subtleTextColor,
          activeBorderColor: 'transparent', // Sin borde visible en active para sutil
        },
        outline: {
          backgroundColor: 'transparent',
          foregroundColor: mainColor,
          borderColor: mainColor,
          hoverBackgroundColor: tinycolor(mainColor).setAlpha(0.1).toHexString(),
          hoverForegroundColor: mainColor,
          activeBorderColor: mainColor, // Mismo color de borde en active
        }
      },
      badge: {
        offset: '0.7rem', // Desplazamiento hacia abajo para el badge
        size: '1rem',    // Tamaño de referencia para el espacio del badge
      },
      transition: 'all 0.2s ease-in-out', // Transición suave para todos los cambios de estilo/transformación
      hoverTransform: 'translateY(-2px) scale(1.05)', // Pequeño levantamiento y escala al pasar el ratón
      activeTransform: 'translateY(0) scale(0.98)' // Pequeño "hundimiento" al hacer click
    };
  }

  return tokens;
}