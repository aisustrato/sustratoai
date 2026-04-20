/**
 * Serialización JSON canónica determinística.
 *
 * El hash SHA-256 de la tríada debe ser **reproducible**: el mismo contenido
 * siempre produce el mismo hash. Para garantizarlo, este módulo serializa
 * cualquier valor con:
 *
 *  1. Keys de objetos ordenadas alfabéticamente en **todos los niveles**.
 *  2. Sin espacios en blanco extra (modo compacto).
 *  3. Arrays preservan su orden (el orden es información).
 *  4. Números se serializan como JavaScript estándar (sin forzar notación).
 *  5. `undefined` se omite (consistente con JSON.stringify).
 *  6. Ciclos detectados → error explícito (no se silencia).
 *
 * Usar exclusivamente esta función para todo contenido que vaya a hasharse.
 * No hashear el output de `JSON.stringify` nativo.
 */

/**
 * Serializa un valor en JSON canónico determinístico.
 *
 * @throws Error si detecta un ciclo o un tipo no serializable.
 */
export function canonicalStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return serialize(value, seen);
}

function serialize(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return "null";

  const type = typeof value;

  if (type === "string") return JSON.stringify(value);
  if (type === "number") {
    if (!Number.isFinite(value as number)) {
      throw new Error(
        `canonicalStringify: número no finito (${String(value)}) no serializable`
      );
    }
    return String(value);
  }
  if (type === "boolean") return value ? "true" : "false";
  if (type === "undefined") return ""; // marcador: omitir en ensamblaje
  if (type === "bigint") {
    throw new Error("canonicalStringify: BigInt no soportado en JSON canónico");
  }
  if (type === "function" || type === "symbol") {
    throw new Error(
      `canonicalStringify: tipo no serializable (${type})`
    );
  }

  // object o array
  if (seen.has(value as object)) {
    throw new Error("canonicalStringify: ciclo detectado en el objeto");
  }
  seen.add(value as object);

  try {
    if (Array.isArray(value)) {
      const items = value.map((item) => {
        const s = serialize(item, seen);
        return s === "" ? "null" : s; // undefined → null en arrays
      });
      return `[${items.join(",")}]`;
    }

    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const s = serialize(obj[key], seen);
      if (s === "") continue; // undefined → omitir en objetos
      parts.push(`${JSON.stringify(key)}:${s}`);
    }
    return `{${parts.join(",")}}`;
  } finally {
    seen.delete(value as object);
  }
}
