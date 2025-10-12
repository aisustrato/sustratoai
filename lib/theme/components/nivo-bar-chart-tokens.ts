// Ruta: lib/theme/components/nivo-bar-chart-tokens.ts

import type { AppColorTokens, ColorSchemeVariant } from "../ColorToken";
import tinycolor from "tinycolor2";

/**
 * 🎨 FILOSOFÍA DEL LABORATORIO DE COLOR PARA GRÁFICOS
 * 
 * El componente StandardBarChart es AGNÓSTICO al color.
 * Este archivo de tokens es quien hace la MAGIA y decide:
 * 
 * 1. VISTA AGRUPADA (todas las dimensiones):
 *    - Cada dimensión = un colorScheme completo (primary, secondary, etc.)
 *    - Los valores dentro de esa dimensión = variantes de ese colorScheme
 *    - Si hay más dimensiones que esquemas disponibles, se hace loop
 * 
 * 2. VISTA DETALLE (una dimensión individual):
 *    - Cada valor/categoría = un colorScheme diferente
 *    - Valor 1 = primary, Valor 2 = secondary, Valor 3 = tertiary, etc.
 *    - Si hay más valores que esquemas, se hace loop
 * 
 * Este enfoque maximiza la variedad visual y mantiene coherencia por contexto.
 */

// 🎨 Esquemas de color disponibles en orden de aplicación
const COLOR_SCHEMES: Array<ColorSchemeVariant> = [
  'primary',
  'secondary',
  'tertiary',
  'accent',
  'success',
  'warning',
  'danger',
  'neutral',
];

/**
 * Genera variaciones de un colorScheme específico
 * Crea un rango de tonos del mismo color base
 */
function generateColorVariations(
  appColorTokens: AppColorTokens,
  colorScheme: ColorSchemeVariant,
  count: number
): string[] {
  const baseColor = appColorTokens[colorScheme].pure;
  const tColor = tinycolor(baseColor);
  
  // Si solo necesitamos un color, retornamos el puro
  if (count === 1) return [baseColor];
  
  const variations: string[] = [];
  
  // Estrategia: generar variaciones desde más oscuro a más claro
  // Esto crea un gradiente visual agradable
  for (let i = 0; i < count; i++) {
    const step = i / (count - 1); // 0 a 1
    
    // Crear variación: oscuro -> puro -> claro
    let variant: tinycolor.Instance;
    if (step < 0.5) {
      // Primera mitad: oscurecer progresivamente
      const darkenAmount = (0.5 - step) * 30; // 0% a 15%
      variant = tColor.clone().darken(darkenAmount);
    } else {
      // Segunda mitad: aclarar progresivamente
      const lightenAmount = (step - 0.5) * 30; // 0% a 15%
      variant = tColor.clone().lighten(lightenAmount);
    }
    
    // Asegurar que el color sea vibrante
    variant = variant.saturate(5);
    variations.push(variant.toString());
  }
  
  return variations;
}

/**
 * Genera el tema de Nivo para gráficos de barras sincronizado con la paleta del usuario
 */
export function generateNivoBarTheme(appColorTokens: AppColorTokens) {
  
  // Tema base para Nivo (fuentes, tooltips, grid, ejes)
  const theme = {
    fontSize: 12,
    textColor: appColorTokens.neutral.text,
    tooltip: {
      container: {
        background: appColorTokens.neutral.bg,
        color: appColorTokens.neutral.text,
        borderRadius: '6px',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
        padding: '8px 12px',
        border: `1px solid ${appColorTokens.neutral.bgShade}`,
      },
    },
    grid: {
      line: {
        stroke: appColorTokens.neutral.bgShade,
        strokeWidth: 1,
      },
    },
    axis: {
      domain: {
        line: {
          stroke: appColorTokens.neutral.bgShade,
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: appColorTokens.neutral.bgShade,
          strokeWidth: 1,
        },
        text: {
          fill: appColorTokens.neutral.textShade,
          fontSize: 11,
        },
      },
      legend: {
        text: {
          fill: appColorTokens.neutral.text,
          fontSize: 12,
          fontWeight: 600,
        },
      },
    },
    legends: {
      text: {
        fill: appColorTokens.neutral.text,
        fontSize: 11,
      },
    },
  };

  /**
   * 🎨 MODO 1: Para vista agrupada (todas las dimensiones)
   * Cada dimensión usa un colorScheme, sus valores son variaciones de ese esquema
   */
  const getGroupedViewColors = (
    dimensionIndex: number,
    valuesCount: number
  ): string[] => {
    // Determinar qué colorScheme usar para esta dimensión (con loop)
    const colorScheme = COLOR_SCHEMES[dimensionIndex % COLOR_SCHEMES.length];
    
    // Generar variaciones de ese colorScheme
    return generateColorVariations(appColorTokens, colorScheme, valuesCount);
  };

  /**
   * 🎨 MODO 2: Para vista detalle (una dimensión individual)
   * Cada valor usa un colorScheme diferente
   */
  const getDetailViewColor = (valueIndex: number): string => {
    // Cada valor obtiene un colorScheme diferente (con loop)
    const colorScheme = COLOR_SCHEMES[valueIndex % COLOR_SCHEMES.length];
    return appColorTokens[colorScheme].pure;
  };

  /**
   * Genera mapa de colores para keys en vista agrupada
   * Este es el sistema inteligente que asigna colores por contexto
   */
  const generateColorMap = (
    keys: string[],
    dimensionsData?: Array<{ name: string; values: string[] }>
  ): Record<string, string> => {
    const colorMap: Record<string, string> = {};
    
    if (!dimensionsData) {
      // Fallback: usar colorSchemes directamente
      keys.forEach((key, index) => {
        const colorScheme = COLOR_SCHEMES[index % COLOR_SCHEMES.length];
        colorMap[key] = appColorTokens[colorScheme].pure;
      });
      return colorMap;
    }
    
    // 🎯 LÓGICA INTELIGENTE: Asignar colores por dimensión
    // Cada dimensión tiene su propio colorScheme
    // Los valores dentro de esa dimensión son variaciones de ese esquema
    dimensionsData.forEach((dimension, dimIndex) => {
      const colorScheme = COLOR_SCHEMES[dimIndex % COLOR_SCHEMES.length];
      const variations = generateColorVariations(
        appColorTokens,
        colorScheme,
        dimension.values.length
      );
      
      // Asignar cada valor a su variación
      dimension.values.forEach((value, valIndex) => {
        colorMap[value] = variations[valIndex];
      });
    });
    
    return colorMap;
  };

  /**
   * Obtener color por índice (legacy support)
   * Usa el nuevo sistema de colorSchemes
   */
  const getColorByIndex = (index: number): string => {
    return getDetailViewColor(index);
  };

  /**
   * Colores para estados hover (más oscuros)
   */
  const getHoverColor = (baseColor: string): string => {
    return tinycolor(baseColor).darken(10).toString();
  };

  return { 
    theme, 
    getColorByIndex,
    generateColorMap,
    getHoverColor,
    // 🆕 Nuevas funciones para control granular
    getGroupedViewColors,
    getDetailViewColor,
    COLOR_SCHEMES, // Exportar para referencia
  };
}

/**
 * Mapeo predefinido para dimensiones comunes
 * Puedes extender esto según tus necesidades
 */
export const COMMON_DIMENSION_COLORS: Record<string, keyof AppColorTokens> = {
  'Foco del estudio': 'primary',
  'Tipo de población': 'secondary',
  'Intervención': 'tertiary',
  'Resultado': 'success',
  'Diseño': 'accent',
  'Calidad': 'warning',
  'Región': 'neutral',
};
