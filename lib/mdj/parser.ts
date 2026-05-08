// 📍 lib/mdj/parser.ts
// Parser MDJ: MD string → DocumentoMDJ
//
// Pipeline:
//   MD fuente → remark-parse → MDAST → transformer → DocumentoMDJ

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import { transformarMDASTaMDJ } from "./transformer";
import type { DocumentoMDJ, Anotacion } from "./types";

/**
 * Parsea un string MD y produce un DocumentoMDJ.
 *
 * @param md - Contenido Markdown fuente
 * @param artefactoId - UUID del artefacto en Cognética
 * @param tipoArtefacto - Tipo de artefacto
 * @param anotaciones - Anotaciones existentes del artefacto (opcional)
 * @returns DocumentoMDJ con árbol de nodos + anotaciones resueltas
 */
export function parsearMDJ(
  md: string,
  artefactoId: string,
  tipoArtefacto: DocumentoMDJ["tipo_artefacto"] = "otro",
  anotaciones: Anotacion[] = [],
): DocumentoMDJ {
  const mdast = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;

  const mdHash = hashSimple(md);

  return transformarMDASTaMDJ(
    mdast,
    artefactoId,
    tipoArtefacto,
    mdHash,
    anotaciones,
  );
}

/**
 * Hash simple para detectar cambios en el MD fuente.
 * No es criptográfico — solo para comparar si el árbol está desactualizado.
 */
function hashSimple(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convertir a 32-bit int
  }
  return "md_" + Math.abs(hash).toString(36);
}
