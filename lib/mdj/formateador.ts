// 📍 lib/mdj/formateador.ts
// Funciones puras para aplicar formato Markdown a texto seleccionado.
//
// Cada función recibe el MD completo + posiciones de selección y retorna
// el nuevo MD + nuevas posiciones de cursor.
//
// Uso:
//   const resultado = formatearNegrita(md, selectionStart, selectionEnd);
//   textarea.value = resultado.nuevoMd;
//   textarea.setSelectionRange(resultado.cursorInicio, resultado.cursorFin);

export interface ResultadoFormato {
  nuevoMd: string;
  cursorInicio: number;
  cursorFin: number;
}

/**
 * Envuelve la selección en `**texto**` (negrita).
 * Si ya tiene negrita, la quita.
 */
export function formatearNegrita(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  const texto = md.slice(inicio, fin);

  // Si ya tiene negrita, quitarla
  if (texto.startsWith("**") && texto.endsWith("**")) {
    const limpio = texto.slice(2, -2);
    const nuevoMd = md.slice(0, inicio) + limpio + md.slice(fin);
    return { nuevoMd, cursorInicio: inicio, cursorFin: inicio + limpio.length };
  }

  // Aplicar negrita
  const nuevoMd = md.slice(0, inicio) + `**${texto}**` + md.slice(fin);
  return { nuevoMd, cursorInicio: inicio + 2, cursorFin: inicio + 2 + texto.length };
}

/**
 * Envuelve la selección en `*texto*` (cursiva).
 * Si ya tiene cursiva, la quita.
 */
export function formatearCursiva(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  const texto = md.slice(inicio, fin);

  // Si ya tiene cursiva (pero no negrita+cursiva), quitarla
  if (texto.startsWith("*") && texto.endsWith("*") && !texto.startsWith("**")) {
    const limpio = texto.slice(1, -1);
    const nuevoMd = md.slice(0, inicio) + limpio + md.slice(fin);
    return { nuevoMd, cursorInicio: inicio, cursorFin: inicio + limpio.length };
  }

  // Aplicar cursiva
  const nuevoMd = md.slice(0, inicio) + `*${texto}*` + md.slice(fin);
  return { nuevoMd, cursorInicio: inicio + 1, cursorFin: inicio + 1 + texto.length };
}

/**
 * Envuelve la selección en `~~texto~~` (tachado).
 * Si ya tiene tachado, lo quita.
 */
export function formatearTachado(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  const texto = md.slice(inicio, fin);

  if (texto.startsWith("~~") && texto.endsWith("~~")) {
    const limpio = texto.slice(2, -2);
    const nuevoMd = md.slice(0, inicio) + limpio + md.slice(fin);
    return { nuevoMd, cursorInicio: inicio, cursorFin: inicio + limpio.length };
  }

  const nuevoMd = md.slice(0, inicio) + `~~${texto}~~` + md.slice(fin);
  return { nuevoMd, cursorInicio: inicio + 2, cursorFin: inicio + 2 + texto.length };
}

/**
 * Envuelve la selección en `` `texto` `` (código inline).
 * Si ya tiene código, lo quita.
 */
export function formatearCodigo(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  const texto = md.slice(inicio, fin);

  if (texto.startsWith("`") && texto.endsWith("`")) {
    const limpio = texto.slice(1, -1);
    const nuevoMd = md.slice(0, inicio) + limpio + md.slice(fin);
    return { nuevoMd, cursorInicio: inicio, cursorFin: inicio + limpio.length };
  }

  const nuevoMd = md.slice(0, inicio) + `\`${texto}\`` + md.slice(fin);
  return { nuevoMd, cursorInicio: inicio + 1, cursorFin: inicio + 1 + texto.length };
}

/**
 * Envuelve la selección en `[texto](url)` (link).
 * Deja el cursor posicionado en la URL para que el usuario la escriba.
 */
export function formatearLink(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  const texto = md.slice(inicio, fin);
  const nuevoTexto = `[${texto}](url)`;
  const nuevoMd = md.slice(0, inicio) + nuevoTexto + md.slice(fin);

  // Cursor dentro de "url" para que el usuario lo reemplace
  const urlInicio = inicio + texto.length + 3; // después de "]("
  const urlFin = urlInicio + 3; // longitud de "url"

  return { nuevoMd, cursorInicio: urlInicio, cursorFin: urlFin };
}

/**
 * Aplica un heading (`#`, `##`, `###`) al inicio de la línea donde está el cursor.
 * Si la línea ya tiene ese nivel de heading, lo quita.
 * Si tiene otro nivel, lo reemplaza.
 */
export function formatearHeading(
  md: string,
  cursorPos: number,
  nivel: 1 | 2 | 3,
): ResultadoFormato {
  // Encontrar inicio y fin de la línea
  const lineStart = md.lastIndexOf("\n", cursorPos - 1) + 1;
  const lineEnd = md.indexOf("\n", cursorPos);
  const lineEndFinal = lineEnd === -1 ? md.length : lineEnd;
  const linea = md.slice(lineStart, lineEndFinal);

  // Detectar heading existente
  const match = linea.match(/^(#{1,3})\s+/);
  const tieneHeading = match !== null;
  const nivelActual = tieneHeading ? match![1].length : 0;

  const prefijo = "#".repeat(nivel) + " ";

  if (tieneHeading && nivelActual === nivel) {
    // Quitar heading
    const sinHeading = linea.replace(/^#{1,3}\s+/, "");
    const nuevoMd = md.slice(0, lineStart) + sinHeading + md.slice(lineEndFinal);
    return { nuevoMd, cursorInicio: lineStart, cursorFin: lineStart + sinHeading.length };
  }

  // Reemplazar o agregar heading
  const nuevaLinea = tieneHeading
    ? prefijo + linea.replace(/^#{1,3}\s+/, "")
    : prefijo + linea;

  const nuevoMd = md.slice(0, lineStart) + nuevaLinea + md.slice(lineEndFinal);
  return { nuevoMd, cursorInicio: lineStart, cursorFin: lineStart + nuevaLinea.length };
}

/**
 * Antepone `- ` a cada línea seleccionada (lista no ordenada).
 * Si ya tienen `- `, los quita.
 */
export function formatearLista(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  // Expandir a líneas completas
  const lineStart = md.lastIndexOf("\n", inicio - 1) + 1;
  const lineEnd = md.indexOf("\n", fin);
  const lineEndFinal = lineEnd === -1 ? md.length : lineEnd;

  const bloque = md.slice(lineStart, lineEndFinal);
  const lineas = bloque.split("\n");

  // Detectar si todas las líneas ya tienen `- `
  const todasConLista = lineas.every((l) => l.match(/^[-*]\s/));

  const nuevasLineas = todasConLista
    ? lineas.map((l) => l.replace(/^[-*]\s+/, ""))
    : lineas.map((l) => `- ${l}`);

  const nuevoBloque = nuevasLineas.join("\n");
  const nuevoMd = md.slice(0, lineStart) + nuevoBloque + md.slice(lineEndFinal);

  return { nuevoMd, cursorInicio: lineStart, cursorFin: lineStart + nuevoBloque.length };
}

/**
 * Antepone `> ` a cada línea seleccionada (cita/bloque quote).
 * Si ya tienen `> `, los quita.
 */
export function formatearCita(
  md: string,
  inicio: number,
  fin: number,
): ResultadoFormato {
  // Expandir a líneas completas
  const lineStart = md.lastIndexOf("\n", inicio - 1) + 1;
  const lineEnd = md.indexOf("\n", fin);
  const lineEndFinal = lineEnd === -1 ? md.length : lineEnd;

  const bloque = md.slice(lineStart, lineEndFinal);
  const lineas = bloque.split("\n");

  // Detectar si todas las líneas ya tienen `> `
  const todasConCita = lineas.every((l) => l.startsWith("> "));

  const nuevasLineas = todasConCita
    ? lineas.map((l) => l.replace(/^>\s+/, ""))
    : lineas.map((l) => `> ${l}`);

  const nuevoBloque = nuevasLineas.join("\n");
  const nuevoMd = md.slice(0, lineStart) + nuevoBloque + md.slice(lineEndFinal);

  return { nuevoMd, cursorInicio: lineStart, cursorFin: lineStart + nuevoBloque.length };
}

/**
 * Inserta o remueve un bloque de código fenced (```) alrededor de la selección.
 * Si el texto seleccionado ya está envuelto en ```, remueve los delimitadores.
 * Si no, envuelve el texto seleccionado. Si no hay selección, inserta bloque vacío.
 */
export function insertarBloqueCodigo(
  md: string,
  inicio: number,
  fin: number = inicio,
  lenguaje = "",
): ResultadoFormato {
  const haySeleccion = fin > inicio;

  if (!haySeleccion) {
    // Insertar bloque vacío
    const bloque = `\`\`\`${lenguaje}\n\n\`\`\``;
    const nuevoMd = md.slice(0, inicio) + bloque + md.slice(inicio);
    const cursorInicio = inicio + lenguaje.length + 4; // después de "```\n"
    const cursorFin = cursorInicio;
    return { nuevoMd, cursorInicio, cursorFin };
  }

  const textoSeleccionado = md.slice(inicio, fin);
  const textoToggle = textoSeleccionado.trim();

  // Toggle: si ya tiene ```, quitarlos
  const estaEnBloqueCodigo =
    textoToggle.startsWith("```") && textoToggle.endsWith("```") &&
    textoToggle.includes("\n"); // tiene al menos un salto de línea

  if (estaEnBloqueCodigo) {
    // Quitar la primera línea (```...) y la última línea (```)
    const primerSalto = textoToggle.indexOf("\n");
    const ultimoSalto = textoToggle.lastIndexOf("\n");
    const contenido = textoToggle.slice(primerSalto + 1, ultimoSalto).trim();
    const nuevoMd = md.slice(0, inicio) + contenido + md.slice(fin);
    return { nuevoMd, cursorInicio: inicio, cursorFin: inicio + contenido.length };
  }

  // Envolver en bloque de código
  const bloque = `\`\`\`${lenguaje}\n${textoSeleccionado}\n\`\`\``;
  const nuevoMd = md.slice(0, inicio) + bloque + md.slice(fin);
  const cursorInicio = inicio + 3 + lenguaje.length; // después de "```\n"
  const cursorFin = cursorInicio + textoSeleccionado.length;
  return { nuevoMd, cursorInicio, cursorFin };
}

/**
 * Inserta o remueve un bloque LaTeX ($$) alrededor de la selección.
 * Si el texto seleccionado ya está envuelto en $$, remueve los delimitadores.
 * Si no, envuelve el texto seleccionado. Si no hay selección, inserta bloque vacío.
 */
export function insertarBloqueLatex(
  md: string,
  inicio: number,
  fin: number = inicio,
): ResultadoFormato {
  const haySeleccion = fin > inicio;

  if (!haySeleccion) {
    // Insertar bloque vacío
    const bloque = "$$\n\n$$";
    const nuevoMd = md.slice(0, inicio) + bloque + md.slice(inicio);
    const cursorInicio = inicio + 3; // después de "$$\n"
    const cursorFin = cursorInicio;
    return { nuevoMd, cursorInicio, cursorFin };
  }

  const textoSeleccionado = md.slice(inicio, fin);
  const textoToggle = textoSeleccionado.trim();

  // Toggle: si ya tiene $$, quitarlos
  const estaEnLatex = textoToggle.startsWith("$$") && textoToggle.endsWith("$$") && textoToggle.length > 4;

  if (estaEnLatex) {
    // Remover $$ del inicio y final, reemplazar toda la selección
    const contenido = textoToggle.slice(2, -2).trim();
    const nuevoMd = md.slice(0, inicio) + contenido + md.slice(fin);
    return { nuevoMd, cursorInicio: inicio, cursorFin: inicio + contenido.length };
  }

  // Envolver en bloque LaTeX
  const bloque = `$$\n${textoSeleccionado}\n$$`;
  const nuevoMd = md.slice(0, inicio) + bloque + md.slice(fin);
  const cursorInicio = inicio + 3; // después de "$$\n"
  const cursorFin = cursorInicio + textoSeleccionado.length;
  return { nuevoMd, cursorInicio, cursorFin };
}
