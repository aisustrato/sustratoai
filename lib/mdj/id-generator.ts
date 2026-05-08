// 📍 lib/mdj/id-generator.ts
// Generación de IDs deterministas para el árbol MDJ
//
// Esquema: {abrev}_{indice} anidado con punto como separador
// Ej: "h1_0.p_0", "h1_0.ul_0.li_2", "root.p_1"
//
// Invariante: mismo MD → misma estructura → mismos IDs siempre

import type { TipoAbrev } from "./types";

/** Genera la porción local de un ID: tipo + contador */
export function idLocal(tipo: TipoAbrev, contador: number): string {
  return `${tipo}_${contador}`;
}

/** Genera el ID completo uniendo prefijo del padre + id local */
export function idCompleto(prefijoPadre: string, tipo: TipoAbrev, contador: number): string {
  const local = idLocal(tipo, contador);
  return prefijoPadre ? `${prefijoPadre}.${local}` : local;
}

/**
 * Generador de IDs con estado — mantiene contadores por tipo dentro de cada sección.
 * Uso:
 *   const gen = crearGeneradorIds()
 *   gen.h1()  // → "h1_0"
 *   gen.p()   // → "h1_0.p_0"
 *   gen.h2()  // → "h1_0.h2_1"
 *   gen.h3()  // → "h1_0.h2_1.h3_0"
 *
 * Al entrar a un nuevo H1/H2/H3, se crea un generador hijo con el prefijo del heading.
 */
export function crearGeneradorIds(prefijoPadre?: string) {
  const prefijo = prefijoPadre ?? "";
  const contadores: Record<string, number> = {};

  const siguiente = (tipo: TipoAbrev): string => {
    const idx = contadores[tipo] ?? 0;
    contadores[tipo] = idx + 1;
    return idCompleto(prefijo, tipo, idx);
  };

  /** Crea un generador hijo con el prefijo de un heading */
  const hijo = (idHeading: string) => crearGeneradorIds(idHeading);

  return { siguiente, hijo, prefijo };
}

export type GeneradorIds = ReturnType<typeof crearGeneradorIds>;
