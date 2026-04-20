/**
 * Cálculo de SHA-256 sobre contenido canónico.
 *
 * Usa la Web Crypto API (disponible en Node.js 18+ y edge runtime).
 * El input siempre pasa por `canonicalStringify` antes de hashearse,
 * garantizando que el mismo objeto produce el mismo hash.
 */

import { canonicalStringify } from "./utils/json-canonical";

/**
 * Calcula SHA-256 hexadecimal del JSON canónico de un valor.
 *
 * Es **el** punto de entrada para hashear la tríada. No exponer variantes
 * que acepten strings arbitrarios — siempre pasa por serialización canónica.
 */
export async function sha256CanonicalJson(value: unknown): Promise<string> {
  const canonical = canonicalStringify(value);
  return sha256Hex(canonical);
}

/**
 * SHA-256 hexadecimal de un string UTF-8.
 * Utilidad interna; preferir `sha256CanonicalJson` para datos estructurados.
 */
export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
