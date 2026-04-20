// 📍 app/cognetica_old/minotauro/[universeId]/utils/versionHelpers.ts
// 🎯 Helpers para gestión de versiones de texto

import type { TextVersion, ArchetypeAnalysis } from '@/lib/types/minotauro-append-types';

/**
 * Crear nueva versión de texto
 */
export function crearVersionTexto(
  versionesActuales: TextVersion[],
  contenido: string,
  origen: 'humano' | 'arquetipo',
  arquetipoId?: string
): TextVersion {
  const siguienteVersion = versionesActuales.length + 1;
  
  return {
    version: siguienteVersion,
    content: contenido,
    timestamp: new Date().toISOString(),
    origen,
    arquetipo_id: arquetipoId
  };
}

/**
 * Obtener versión por número
 */
export function obtenerVersionPorNumero(
  numero: number,
  versiones: TextVersion[]
): TextVersion | undefined {
  return versiones.find(v => v.version === numero);
}

/**
 * Obtener última versión
 */
export function obtenerUltimaVersion(versiones: TextVersion[]): TextVersion | undefined {
  if (versiones.length === 0) return undefined;
  return versiones[versiones.length - 1];
}

/**
 * Obtener análisis que generó una versión
 */
export function obtenerAnalisisPorVersion(
  versionNumero: number,
  analisis: ArchetypeAnalysis[]
): ArchetypeAnalysis | undefined {
  return analisis.find(a => a.version_salida === versionNumero);
}

/**
 * Verificar si una versión fue generada por arquetipo
 */
export function esVersionDeArquetipo(version: TextVersion): boolean {
  return version.origen === 'arquetipo' && !!version.arquetipo_id;
}

/**
 * Obtener todas las versiones de un origen específico
 */
export function filtrarVersionesPorOrigen(
  versiones: TextVersion[],
  origen: 'humano' | 'arquetipo'
): TextVersion[] {
  return versiones.filter(v => v.origen === origen);
}

/**
 * Calcular diferencia entre dos versiones (simple)
 */
export function calcularDiferenciaVersiones(
  versionAnterior: TextVersion,
  versionNueva: TextVersion
): {
  palabrasAgregadas: number;
  palabrasEliminadas: number;
  caracteresAgregados: number;
  caracteresEliminados: number;
} {
  const palabrasAntes = versionAnterior.content.trim().split(/\s+/).filter(Boolean).length;
  const palabrasDespues = versionNueva.content.trim().split(/\s+/).filter(Boolean).length;
  
  const caracteresAntes = versionAnterior.content.length;
  const caracteresDespues = versionNueva.content.length;
  
  return {
    palabrasAgregadas: Math.max(0, palabrasDespues - palabrasAntes),
    palabrasEliminadas: Math.max(0, palabrasAntes - palabrasDespues),
    caracteresAgregados: Math.max(0, caracteresDespues - caracteresAntes),
    caracteresEliminados: Math.max(0, caracteresAntes - caracteresDespues)
  };
}

/**
 * Generar resumen de versión para display
 */
export function generarResumenVersion(version: TextVersion): string {
  const fecha = new Date(version.timestamp).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const origen = version.origen === 'humano' ? '📝 Original' : '🤖 Generado por IA';
  const palabras = version.content.trim().split(/\s+/).filter(Boolean).length;
  
  return `v${version.version} • ${origen} • ${fecha} • ${palabras} palabras`;
}
