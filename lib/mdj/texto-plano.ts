// 📍 lib/mdj/texto-plano.ts
// Extrae texto_plano de nodos inline — sin formato, solo caracteres

import type { NodoInline } from "./types";

/**
 * Convierte un array de nodos inline a texto plano.
 * Recorre recursivamente negrita/cursiva/tachado extrayendo solo el texto.
 */
export function extraerTextoPlano(inline: NodoInline[]): string {
  return inline
    .map((n) => {
      switch (n.tipo) {
        case "texto":
        case "code_inline":
        case "latex_inline":
          return n.contenido;
        case "negrita":
        case "cursiva":
        case "neg_cur":
        case "tachado":
          return extraerTextoPlano(n.hijos);
        case "link":
          return n.texto;
      }
    })
    .join("");
}
