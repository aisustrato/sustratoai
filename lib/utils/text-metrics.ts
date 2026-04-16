// 📍 lib/utils/text-metrics.ts
// 🎯 PROPÓSITO: Calcular métricas de peso para guiar al escritor

export interface TextMetrics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  paragraphs: number;
  estimatedPages: number; // Basado en ~250 palabras por página
  estimatedMinutes: number; // Tiempo de lectura (~200 palabras/min)
}

export interface BalanceIndicator {
  level: 'optimal' | 'warning' | 'danger';
  message: string;
}

/**
 * Calcula métricas de un texto MD
 */
export function calculateTextMetrics(text: string | null | undefined): TextMetrics {
  if (!text || text.trim().length === 0) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      paragraphs: 0,
      estimatedPages: 0,
      estimatedMinutes: 0,
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  
  // Contar palabras (split por espacios, filtrar vacíos)
  const words = text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;
  
  // Contar párrafos (líneas no vacías)
  const paragraphs = text
    .split('\n')
    .filter(line => line.trim().length > 0).length;
  
  // Estimaciones
  const estimatedPages = Math.ceil(words / 250); // ~250 palabras por página
  const estimatedMinutes = Math.ceil(words / 200); // ~200 palabras por minuto

  return {
    characters,
    charactersNoSpaces,
    words,
    paragraphs,
    estimatedPages,
    estimatedMinutes,
  };
}

/**
 * Evalúa el balance de una sección según estándares
 * Ejemplo: Paper Zenodo típico = 10 páginas, 5 secciones → ~500 palabras por sección
 */
export function evaluateSectionBalance(
  words: number,
  targetWordsPerSection: number = 500
): BalanceIndicator {
  const ratio = words / targetWordsPerSection;

  if (ratio < 0.3) {
    return {
      level: 'danger',
      message: `Sección muy escueta (${words} palabras). Considera desarrollar más esta idea.`,
    };
  }

  if (ratio < 0.6) {
    return {
      level: 'warning',
      message: `Sección breve (${words} palabras). Podrías expandir un poco más.`,
    };
  }

  if (ratio > 2.5) {
    return {
      level: 'danger',
      message: `Sección muy extensa (${words} palabras). Considera dividir en subsecciones.`,
    };
  }

  if (ratio > 1.8) {
    return {
      level: 'warning',
      message: `Sección extensa (${words} palabras). Revisa si puedes condensar.`,
    };
  }

  return {
    level: 'optimal',
    message: `Sección balanceada (${words} palabras).`,
  };
}

/**
 * Evalúa el balance del universo completo
 * Ejemplo: Paper Zenodo = ~2500 palabras (10 páginas)
 */
export function evaluateUniverseBalance(
  totalWords: number,
  sectionCount: number,
  targetTotalWords: number = 2500
): BalanceIndicator {
  const ratio = totalWords / targetTotalWords;

  if (totalWords === 0) {
    return {
      level: 'warning',
      message: 'Universo vacío. Comienza a escribir en las secciones.',
    };
  }

  if (ratio < 0.5) {
    return {
      level: 'warning',
      message: `Paper breve (${totalWords} palabras). Meta sugerida: ~${targetTotalWords} palabras.`,
    };
  }

  if (ratio > 1.5) {
    return {
      level: 'warning',
      message: `Paper extenso (${totalWords} palabras). Considera si puedes condensar.`,
    };
  }

  if (ratio > 2) {
    return {
      level: 'danger',
      message: `Paper muy extenso (${totalWords} palabras). Revisa el alcance del escrito.`,
    };
  }

  // Evaluar distribución
  if (sectionCount > 0) {
    const avgWordsPerSection = totalWords / sectionCount;
    
    if (avgWordsPerSection < 200) {
      return {
        level: 'warning',
        message: `Promedio de ${Math.round(avgWordsPerSection)} palabras por sección. Considera desarrollar más cada sección.`,
      };
    }

    if (avgWordsPerSection > 800) {
      return {
        level: 'warning',
        message: `Promedio de ${Math.round(avgWordsPerSection)} palabras por sección. Considera agregar más secciones para mejor estructura.`,
      };
    }
  }

  return {
    level: 'optimal',
    message: `Paper balanceado (${totalWords} palabras en ${sectionCount} secciones).`,
  };
}

/**
 * Formatea métricas para display
 */
export function formatMetrics(metrics: TextMetrics): string {
  const parts: string[] = [];
  
  if (metrics.words > 0) {
    parts.push(`${metrics.words} palabras`);
  }
  
  if (metrics.estimatedPages > 0) {
    parts.push(`~${metrics.estimatedPages} páginas`);
  }
  
  if (metrics.estimatedMinutes > 0) {
    parts.push(`~${metrics.estimatedMinutes} min lectura`);
  }

  return parts.join(' • ');
}

/**
 * Estándares predefinidos para diferentes tipos de papers
 */
export const PAPER_STANDARDS = {
  zenodo: {
    name: 'Zenodo (estándar)',
    targetWords: 2500,
    targetPages: 10,
    targetSections: 5,
    wordsPerSection: 500,
  },
  short: {
    name: 'Paper corto',
    targetWords: 1500,
    targetPages: 6,
    targetSections: 4,
    wordsPerSection: 375,
  },
  extended: {
    name: 'Paper extendido',
    targetWords: 5000,
    targetPages: 20,
    targetSections: 7,
    wordsPerSection: 715,
  },
  thesis: {
    name: 'Tesis/Capítulo',
    targetWords: 10000,
    targetPages: 40,
    targetSections: 10,
    wordsPerSection: 1000,
  },
} as const;

export type PaperStandard = keyof typeof PAPER_STANDARDS;
