//. 📍 lib/cognetica-forense/parsers/markdown.ts
/**
 * Parser de artefactos tipo `markdown` para Cognética Forense v2.
 *
 * Responsabilidad: dado el texto crudo de un archivo .md, extraer
 * frontmatter YAML (si existe), cuerpo y encabezados (H1..H6) con sus
 * posiciones de carácter en el texto original. Todo puro, sin I/O.
 *
 * Reglas (alineadas al requerimiento §6 y a `CgtArtefactoMarkdown` en el
 * contrato de Hongo):
 * - Frontmatter YAML delimitado por `---` al inicio exacto del archivo.
 *   Si no hay `---` en línea 1 o no se cierra, se trata como cuerpo puro.
 * - El cuerpo (`contenido`) es lo que queda tras el frontmatter, sin
 *   modificar espacios interiores (el hash debe ser determinístico).
 * - Encabezados ATX (`#`, `##`, ...) y ATX con atributos HTML son
 *   soportados. Setext (`====` / `----`) NO se soporta en Oleada 1.
 * - `autor_original` y `fecha_original` se derivan del frontmatter si
 *   existen campos `author`/`autor` y `date`/`fecha` (strings). De lo
 *   contrario, `null`.
 *
 * No lanza excepciones — si el YAML del frontmatter es inválido,
 * retorna `frontmatter: {}` y el cuerpo completo intacto.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import yaml from "js-yaml";

import type { CgtHeader } from "../cognetica_forense_types";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
/**
 * Resultado estructurado del parse de un artefacto markdown.
 *
 * Campos alineados a `CgtArtefactoMarkdown` (tabla
 * `cgt_artefactos_markdown`), excluyendo los que provienen del contexto
 * externo (`artefacto_id`, `created_at`, etc.).
 */
export interface MarkdownArtefactoParseado {
  /** Cuerpo del markdown tras remover el frontmatter. */
  contenido: string;
  /** Objeto YAML parseado del frontmatter. `{}` si no hay o es inválido. */
  frontmatter: Record<string, unknown>;
  /** Encabezados detectados en orden de aparición. */
  headers: CgtHeader[];
  /** Autor derivado del frontmatter (`author` o `autor`). `null` si no existe. */
  autor_original: string | null;
  /**
   * Fecha derivada del frontmatter (`date` o `fecha`). ISO string si
   * el campo es una fecha o string parseable; `null` si no aplica.
   */
  fecha_original: string | null;
}
//#endregion ![def]

//#region [helpers] - 🛠️ FRONTMATTER 🛠️
/**
 * Patrón: `---\n...\n---` al inicio exacto del archivo.
 * Tolera `\r\n` (Windows) y `\n` (Unix/Mac).
 */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Separa frontmatter YAML del cuerpo.
 *
 * - Si el archivo NO empieza con `---\n`, retorna `frontmatter: {}` y el raw completo.
 * - Si empieza pero el YAML es inválido, idem (fallback silencioso y seguro).
 */
export function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const yamlRaw = match[1];
  const body = raw.slice(match[0].length);

  try {
    const parsed = yaml.load(yamlRaw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { frontmatter: parsed as Record<string, unknown>, body };
    }
    // YAML válido pero no es un mapa (ej: una lista o scalar): lo ignoramos.
    return { frontmatter: {}, body };
  } catch {
    return { frontmatter: {}, body };
  }
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ HEADERS 🛠️
/**
 * Patrón ATX: de 1 a 6 `#` al inicio de línea + espacio + texto.
 * No captura los `#` opcionales de cierre (`## título ##`), se limpian abajo.
 */
const ATX_HEADER_REGEX = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;

/**
 * Extrae encabezados ATX del cuerpo markdown con su posición exacta
 * de carácter dentro de `body` (no del archivo original con frontmatter).
 *
 * Bloques de código fenced (```...```) se excluyen para no confundir `#`
 * dentro de ejemplos con encabezados reales.
 */
export function extractHeaders(body: string): CgtHeader[] {
  const codeMask = buildFencedCodeMask(body);
  const headers: CgtHeader[] = [];

  for (const match of body.matchAll(ATX_HEADER_REGEX)) {
    const position = match.index ?? 0;
    if (codeMask[position]) continue;
    const hashes = match[1];
    const texto = match[2].trim();
    headers.push({
      texto,
      nivel: hashes.length,
      posicion_char: position,
    });
  }
  return headers;
}

/**
 * Genera un arreglo booleano del largo de `body` donde `true` indica que
 * ese carácter está dentro de un bloque de código fenced (```).
 *
 * No es el parser más sofisticado (no soporta indented code blocks ni
 * backtick-count variable), pero cubre el 95% de casos reales y es
 * suficiente para Oleada 1.
 */
function buildFencedCodeMask(body: string): boolean[] {
  const mask = new Array<boolean>(body.length).fill(false);
  const FENCE = /^```/gm;
  let inside = false;
  let lastIdx = 0;
  for (const match of body.matchAll(FENCE)) {
    const idx = match.index ?? 0;
    if (inside) {
      for (let i = lastIdx; i < idx + 3; i++) mask[i] = true;
      inside = false;
    } else {
      lastIdx = idx;
      inside = true;
    }
  }
  // Fence no cerrado: marcar hasta el final como código (conservador).
  if (inside) {
    for (let i = lastIdx; i < body.length; i++) mask[i] = true;
  }
  return mask;
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ METADATA DERIVADA 🛠️
/**
 * Extrae `autor` desde frontmatter admitiendo variantes comunes.
 * Retorna trimmed string o `null`.
 */
function extraerAutor(fm: Record<string, unknown>): string | null {
  const candidatos = [fm.author, fm.autor, fm.authors, fm.autores];
  for (const c of candidatos) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (Array.isArray(c) && c.length > 0 && typeof c[0] === "string") {
      return c.join(", ");
    }
  }
  return null;
}

/**
 * Extrae `fecha_original` desde frontmatter, normalizada a ISO string.
 *
 * Admite:
 * - `Date` (js-yaml lo emite para `YYYY-MM-DD`)
 * - string ISO-ish parseable por `new Date()`
 *
 * Si no es parseable, retorna `null` en vez de lanzar.
 */
function extraerFecha(fm: Record<string, unknown>): string | null {
  const candidatos = [fm.date, fm.fecha, fm.published, fm.publicado];
  for (const c of candidatos) {
    if (c instanceof Date && !Number.isNaN(c.valueOf())) {
      return c.toISOString();
    }
    if (typeof c === "string" && c.trim()) {
      const parsed = new Date(c.trim());
      if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
    }
  }
  return null;
}
//#endregion ![helpers]

//#region [main] - 🔧 PUBLIC API 🔧
/**
 * Parser completo de un artefacto markdown.
 *
 * @param raw texto crudo del archivo .md (ya decodificado a UTF-8).
 * @returns estructura lista para persistir en `cgt_artefactos_markdown`.
 *
 * ```ts
 * const parsed = parseMarkdownArtefacto(await file.text());
 * //=> { contenido, frontmatter, headers, autor_original, fecha_original }
 * ```
 */
export function parseMarkdownArtefacto(raw: string): MarkdownArtefactoParseado {
  const { frontmatter, body } = parseFrontmatter(raw);
  const headers = extractHeaders(body);
  const autor_original = extraerAutor(frontmatter);
  const fecha_original = extraerFecha(frontmatter);

  return {
    contenido: body,
    frontmatter,
    headers,
    autor_original,
    fecha_original,
  };
}
//#endregion ![main]
