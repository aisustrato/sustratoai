// 📍 app/cognetica_old/minotauro/[universeId]/utils/referenceHelpers.ts
// 🎯 Helpers para gestión de referencias numeradas

import type { CuratedSourceWithNumber } from '@/lib/types/minotauro-append-types';

/**
 * Agregar nueva fuente curada con número asignado automáticamente
 */
export function agregarFuenteCurada(
  fuentesActuales: CuratedSourceWithNumber[],
  nuevaFuente: Omit<CuratedSourceWithNumber, 'numero' | 'id' | 'timestamp'>
): CuratedSourceWithNumber[] {
  const siguienteNumero = fuentesActuales.length + 1;
  
  const fuenteCompleta: CuratedSourceWithNumber = {
    ...nuevaFuente,
    id: crypto.randomUUID(),
    numero: siguienteNumero,
    timestamp: new Date().toISOString()
  };
  
  return [...fuentesActuales, fuenteCompleta];
}

/**
 * Detectar referencias en el texto (regex para (1), (2), etc.)
 */
export const REFERENCE_REGEX = /\((\d+)\)/g;

/**
 * Extraer números de referencias de un texto
 */
export function extraerReferencias(texto: string): number[] {
  const matches = texto.matchAll(REFERENCE_REGEX);
  const numeros = Array.from(matches, m => parseInt(m[1]));
  return [...new Set(numeros)].sort((a, b) => a - b);
}

/**
 * Validar que todas las referencias en el texto existen
 */
export function validarReferencias(
  texto: string,
  fuentesDisponibles: CuratedSourceWithNumber[]
): { validas: boolean; faltantes: number[] } {
  const referenciasEnTexto = extraerReferencias(texto);
  const numerosDisponibles = fuentesDisponibles.map(f => f.numero);
  
  const faltantes = referenciasEnTexto.filter(num => !numerosDisponibles.includes(num));
  
  return {
    validas: faltantes.length === 0,
    faltantes
  };
}

/**
 * Obtener fuente por número
 */
export function obtenerFuentePorNumero(
  numero: number,
  fuentes: CuratedSourceWithNumber[]
): CuratedSourceWithNumber | undefined {
  return fuentes.find(f => f.numero === numero);
}

/**
 * Formatear referencia para display
 */
export function formatearReferencia(fuente: CuratedSourceWithNumber): string {
  const autor = fuente.autor || 'Sin autor';
  const año = fuente.año ? ` ${fuente.año}` : '';
  return `[${fuente.numero}] ${autor}${año} - "${fuente.titulo}"`;
}

/**
 * Generar lista de referencias para prompt de arquetipo
 */
export function generarListaReferenciasParaPrompt(
  fuentes: CuratedSourceWithNumber[]
): string {
  return fuentes.map(fuente => {
    let ref = `[${fuente.numero}] ${fuente.autor || 'Sin autor'} ${fuente.año || ''} - "${fuente.titulo}"`;
    if (fuente.resumen) {
      ref += `\n    Resumen: ${fuente.resumen}`;
    }
    return ref;
  }).join('\n\n');
}
