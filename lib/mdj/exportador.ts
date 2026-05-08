// 📍 lib/mdj/exportador.ts
// Exporta DocumentoMDJ → MD puro (Obsidian-friendly)
//
// Anexo B del contrato MDJ
//
// Invariantes:
//   1. exportarMDPuro(parsearMDJ(md)) sin anotaciones → MD equivalente
//   2. MD exportado válido en Obsidian sin plugins
//   3. Sin metadatos internos de sustrato.ai (nodo_ids, offsets, uuids)
//   4. Es la utilidad de "salida del ecosistema"

import type { DocumentoMDJ, NodoEstructural, NodoInline, NodoH1, NodoH2, NodoH3, NodoParrafo, NodoLista, NodoTabla, NodoCodigo, NodoLatex } from "./types";

// ── Serialización inline ──────────────────────────────────────────────────

function serializarInline(inline: NodoInline[]): string {
  return inline
    .map((n) => {
      switch (n.tipo) {
        case "texto":
          return n.contenido;
        case "negrita":
          return `**${serializarInline(n.hijos)}**`;
        case "cursiva":
          return `*${serializarInline(n.hijos)}*`;
        case "neg_cur":
          return `***${serializarInline(n.hijos)}***`;
        case "tachado":
          return `~~${serializarInline(n.hijos)}~~`;
        case "code_inline":
          return `\`${n.contenido}\``;
        case "latex_inline":
          return `$${n.contenido}$`;
        case "link":
          return `[${n.texto}](${n.url})`;
      }
    })
    .join("");
}

// ── Serialización de nodos estructurales ─────────────────────────────────

// ── Anotaciones a sintaxis portable ──────────────────────────────────────

function serializarAnotacionInline(
  inline: NodoInline[],
  anotacionesEnNodo: { offset_inicio: number; offset_fin: number; tipo: string; fragmento: string; entidad_id?: string; nota_texto?: string }[],
): string {
  if (anotacionesEnNodo.length === 0) {
    return serializarInline(inline);
  }

  // Reconstruir el texto plano y marcar regiones anotadas
  const textoBase = serializarInline(inline);
  if (!textoBase) return "";

  // Ordenar anotaciones por offset (de atrás hacia adelante para no desfasar índices)
  const sorted = [...anotacionesEnNodo].sort(
    (a, b) => b.offset_inicio - a.offset_inicio,
  );

  let resultado = textoBase;
  for (const anot of sorted) {
    const antes = resultado.slice(0, anot.offset_inicio);
    const fragmento = resultado.slice(anot.offset_inicio, anot.offset_fin);
    const despues = resultado.slice(anot.offset_fin);

    switch (anot.tipo) {
      case "frase_notable":
        resultado = antes + "==" + fragmento + "==" + despues;
        break;
      case "referencia": {
        const refId =
          anot.entidad_id?.slice(0, 8) || "ref";
        resultado =
          antes + fragmento + `[^${refId}]` + despues;
        break;
      }
      case "nota":
        // Las notas se exportan como blockquote al final, no inline
        resultado = antes + fragmento + despues;
        break;
    }
  }

  return resultado;
}

function recolectarFootnotes(
  anotaciones: { tipo: string; entidad_id?: string; fragmento: string }[],
): string {
  return anotaciones
    .filter((a) => a.tipo === "referencia" && a.entidad_id)
    .map((a) => {
      const refId = a.entidad_id!.slice(0, 8);
      return `[^${refId}]: ${a.fragmento}`;
    })
    .join("\n");
}

function recolectarNotas(
  anotaciones: { tipo: string; nota_texto?: string }[],
): string {
  return anotaciones
    .filter((a) => a.tipo === "nota" && a.nota_texto)
    .map((a) => `> 📝 ${a.nota_texto}`)
    .join("\n\n");
}

// ── Export principal ──────────────────────────────────────────────────────

/**
 * Serializa un DocumentoMDJ de vuelta a MD estándar.
 * Las anotaciones se degradan a sintaxis portable:
 *   - frases notables → ==highlight== (Obsidian)
 *   - referencias → [^id] footnotes CommonMark
 *   - notas → > 📝 blockquote
 */
export function exportarMDPuro(doc: DocumentoMDJ): string {
  const partes: string[] = [];

  // Agrupar anotaciones por nodo_id
  const anotacionesPorNodo = new Map<
    string,
    { offset_inicio: number; offset_fin: number; tipo: string; fragmento: string; entidad_id?: string; nota_texto?: string }[]
  >();
  for (const anot of doc.anotaciones) {
    if (anot.huerfana) continue;
    const existentes = anotacionesPorNodo.get(anot.nodo_id) || [];
    existentes.push(anot);
    anotacionesPorNodo.set(anot.nodo_id, existentes);
  }

  // Serializar nodos
  for (const nodo of doc.nodos) {
    partes.push(serializarNodoConAnotaciones(nodo, anotacionesPorNodo));
  }

  // Footnotes de referencias
  const todasAnotaciones = doc.anotaciones.filter((a) => !a.huerfana);
  const footnotes = recolectarFootnotes(todasAnotaciones);
  if (footnotes) {
    partes.push("\n" + footnotes + "\n");
  }

  // Notas como blockquotes
  const notas = recolectarNotas(todasAnotaciones);
  if (notas) {
    partes.push("\n" + notas + "\n");
  }

  // Anotaciones huérfanas como comentario HTML
  const huerfanas = doc.anotaciones.filter((a) => a.huerfana);
  if (huerfanas.length > 0) {
    partes.push("\n<!-- ANOTACIONES HUÉRFANAS:\n");
    for (const h of huerfanas) {
      partes.push(
        `  - [${h.tipo}] "${h.fragmento}" (id: ${h.id})\n`,
      );
    }
    partes.push("-->\n");
  }

  return partes.join("");
}

function serializarNodoConAnotaciones(
  nodo: NodoEstructural,
  anotacionesPorNodo: Map<string, Array<{ offset_inicio: number; offset_fin: number; tipo: string; fragmento: string; entidad_id?: string; nota_texto?: string }>>,
): string {
  switch (nodo.tipo) {
    case "h1": {
      const h1 = nodo as NodoH1;
      const hijos = h1.hijos.map((h) => serializarNodoConAnotaciones(h, anotacionesPorNodo)).join("");
      return `# ${h1.texto}\n\n${hijos}`;
    }
    case "h2": {
      const h2 = nodo as NodoH2;
      const hijos = h2.hijos.map((h) => serializarNodoConAnotaciones(h, anotacionesPorNodo)).join("");
      return `## ${h2.texto}\n\n${hijos}`;
    }
    case "h3": {
      const h3 = nodo as NodoH3;
      const hijos = h3.hijos.map((h) => serializarNodoConAnotaciones(h as NodoEstructural, anotacionesPorNodo)).join("");
      return `### ${h3.texto}\n\n${hijos}`;
    }
    case "p": {
      const anots = anotacionesPorNodo.get(nodo.id) || [];
      return serializarAnotacionInline((nodo as NodoParrafo).inline, anots) + "\n\n";
    }
    case "ul":
    case "ol": {
      const lista = nodo as NodoLista;
      return (
        lista.items
          .map((item) => {
            const anots = anotacionesPorNodo.get(item.id) || [];
            const marcador = lista.tipo === "ol" ? "1." : "-";
            const texto = serializarAnotacionInline(item.inline, anots);
            let resultado = `${marcador} ${texto}`;
            if (item.hijos) {
              for (const sub of item.hijos) {
                resultado += "\n" + serializarNodoConAnotaciones(sub as NodoEstructural, anotacionesPorNodo);
              }
            }
            return resultado;
          })
          .join("\n") + "\n\n"
      );
    }
    case "tbl": {
      const tbl = nodo as NodoTabla;
      const header =
        "| " + tbl.headers.join(" | ") + " |\n" +
        "| " + tbl.headers.map(() => "---").join(" | ") + " |\n";
      const rows = tbl.filas
        .map((fila) => "| " + fila.join(" | ") + " |")
        .join("\n");
      return header + rows + "\n\n";
    }
    case "code": {
      const code = nodo as NodoCodigo;
      const lang = code.lenguaje || "";
      return "```" + lang + "\n" + code.contenido + "\n```\n\n";
    }
    case "latex":
      return "$$\n" + (nodo as NodoLatex).contenido + "\n$$\n\n";
    default:
      return "";
  }
}
