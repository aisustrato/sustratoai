// 📍 lib/mdj/transformer.ts
// Transforma MDAST (remark-parse) → DocumentoMDJ (contrato propio)
//
// Arquitectura:
//   MD fuente → remark-parse → MDAST → transformer → DocumentoMDJ
//
// Responsabilidades:
//   1. Agrupar contenido por headings (H1/H2/H3)
//   2. Generar IDs deterministas
//   3. Convertir inline MDAST → NodoInline[]
//   4. Extraer texto_plano para cada nodo estructural
//   5. Resolver anotaciones sobre el árbol

import type { Root, Content, PhrasingContent } from "mdast";
import type {
  DocumentoMDJ,
  NodoEstructural,
  NodoHoja,
  NodoH1,
  NodoH2,
  NodoH3,
  NodoParrafo,
  NodoLista,
  NodoItem,
  NodoTabla,
  NodoCodigo,
  NodoLatex,
  NodoInline,
  Anotacion,
  NodoBase,
} from "./types";
import { crearGeneradorIds, type GeneradorIds } from "./id-generator";
import { extraerTextoPlano } from "./texto-plano";

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convierte phrasing content MDAST a nuestros NodoInline[] */
function convertirInline(children: PhrasingContent[]): NodoInline[] {
  const resultado: NodoInline[] = [];

  for (const child of children) {
    switch (child.type) {
      case "text":
        resultado.push({ tipo: "texto", contenido: child.value });
        break;
      case "inlineCode":
        resultado.push({ tipo: "code_inline", contenido: child.value });
        break;
      case "strong": {
        const hijos = convertirInline(child.children);
        // Si algún hijo es emphasis → es neg_cur
        const tieneCursiva = hijos.some(
          (h) => h.tipo === "cursiva" || h.tipo === "neg_cur",
        );
        if (tieneCursiva) {
          // Aplanar: los emphasis dentro de strong se vuelven neg_cur
          resultado.push(...aplanarNegCur(hijos));
        } else {
          resultado.push({ tipo: "negrita", hijos });
        }
        break;
      }
      case "emphasis": {
        const hijos = convertirInline(child.children);
        const tieneNegrita = hijos.some(
          (h) => h.tipo === "negrita" || h.tipo === "neg_cur",
        );
        if (tieneNegrita) {
          resultado.push(...aplanarNegCur(hijos));
        } else {
          resultado.push({ tipo: "cursiva", hijos });
        }
        break;
      }
      case "delete": {
        const hijos = convertirInline(child.children);
        resultado.push({ tipo: "tachado", hijos });
        break;
      }
      case "link":
        resultado.push({
          tipo: "link",
          texto: child.children
            .map((c) => ("value" in c ? c.value : ""))
            .join(""),
          url: child.url,
        });
        break;
      case "image":
        // v0.2 — por ahora lo tratamos como texto con alt
        resultado.push({
          tipo: "texto",
          contenido: child.alt || child.url || "",
        });
        break;
      case "html":
        // HTML inline — lo pasamos como texto
        resultado.push({ tipo: "texto", contenido: child.value });
        break;
      case "break":
        resultado.push({ tipo: "texto", contenido: "\n" });
        break;
      case "inlineMath":
        resultado.push({
          tipo: "latex_inline",
          contenido: (child as { value: string }).value,
        });
        break;
      default:
        // Text, inlineMath (con remark-math), etc.
        if ("value" in child && typeof child.value === "string") {
          resultado.push({ tipo: "texto", contenido: child.value });
        }
    }
  }

  return resultado;
}

/** Aplana negrita+cursiva anidada a nivel neg_cur */
function aplanarNegCur(inline: NodoInline[]): NodoInline[] {
  return inline.map((n) => {
    if (n.tipo === "negrita" || n.tipo === "cursiva") {
      return { ...n, tipo: "neg_cur" as const };
    }
    return n;
  });
}

/** Extrae texto plano de una celda de tabla MDAST */
function textoCelda(children: PhrasingContent[]): string {
  return children
    .map((c) => ("value" in c ? c.value : ""))
    .join("")
    .trim();
}

// ── Conversión de nodos hoja ─────────────────────────────────────────────

function convertirParrafo(
  paragraph: { type: "paragraph"; children: PhrasingContent[] },
  id: string,
  indice: number,
): NodoParrafo {
  const inline = convertirInline(paragraph.children);
  return {
    id,
    tipo: "p",
    indice_global: indice,
    inline,
    texto_plano: extraerTextoPlano(inline),
  };
}

function convertirLista(
  listNode: { type: "list"; ordered: boolean; children: { type: "listItem"; children: Content[] }[] },
  id: string,
  indice: number,
  generador: GeneradorIds,
): NodoLista {
  const tipo = listNode.ordered ? "ol" : "ul";
  const items: NodoItem[] = [];

  let itemIdx = 0;
  for (const itemMdast of listNode.children) {
    if (itemMdast.type !== "listItem") continue;

    const itemId = generador.siguiente("li");
    const inlineChildren: PhrasingContent[] = [];
    const subListas: NodoLista[] = [];

    for (const child of itemMdast.children) {
      if (child.type === "list") {
        const subId = generador.siguiente(child.ordered ? "ol" : "ul");
        subListas.push(convertirLista(child as { type: "list"; ordered: boolean; children: { type: "listItem"; children: Content[] }[] }, subId, indice + items.length + 1, generador));
      } else if ("children" in child) {
        inlineChildren.push(
          ...(child as { children: PhrasingContent[] }).children,
        );
      }
    }

    const inline = convertirInline(inlineChildren);
    items.push({
      id: itemId,
      tipo: "li",
      indice_global: indice + itemIdx,
      inline,
      texto_plano: extraerTextoPlano(inline),
      hijos: subListas.length > 0 ? subListas : undefined,
    });

    itemIdx++;
  }

  return { id, tipo, indice_global: indice, items };
}

function convertirTabla(
  tableNode: { type: "table"; children: { type: "tableRow"; children: { type: "tableCell"; children: PhrasingContent[] }[] }[] },
  id: string,
  indice: number,
): NodoTabla {
  const filas: string[][] = [];
  const headers: string[] = [];

  const rows = tableNode.children;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.type !== "tableRow") continue;
    const celdas = row.children
      .filter((c) => c.type === "tableCell")
      .map((c) => textoCelda(c.children));
    if (i === 0) {
      headers.push(...celdas);
    } else {
      filas.push(celdas);
    }
  }

  return { id, tipo: "tbl", indice_global: indice, headers, filas };
}

function convertirCodigo(
  codeNode: { type: "code"; lang?: string | null; value: string },
  id: string,
  indice: number,
): NodoCodigo {
  return {
    id,
    tipo: "code",
    indice_global: indice,
    lenguaje: codeNode.lang ?? undefined,
    contenido: codeNode.value,
  };
}

function convertirLatex(
  mathNode: { type: "math"; value: string },
  id: string,
  indice: number,
): NodoLatex {
  return {
    id,
    tipo: "latex",
    indice_global: indice,
    contenido: mathNode.value,
    modo: "bloque",
  };
}

// ── Procesamiento principal ──────────────────────────────────────────────

let contadorGlobal = 0;

function siguienteIndice(): number {
  return contadorGlobal++;
}

/** Convierte un nodo MDAST de contenido a NodoEstructural */
function convertirNodoContenido(
  node: Content,
  generador: GeneradorIds,
): NodoHoja | null {
  const idx = siguienteIndice();

  switch (node.type) {
    case "paragraph": {
      const id = generador.siguiente("p");
      return convertirParrafo(node, id, idx);
    }
    case "list": {
      const id = generador.siguiente(node.ordered ? "ol" : "ul");
      return convertirLista(
        node as unknown as { type: "list"; ordered: boolean; children: { type: "listItem"; children: Content[] }[] },
        id,
        idx,
        generador,
      );
    }
    case "table": {
      const id = generador.siguiente("tbl");
      return convertirTabla(
        node as unknown as { type: "table"; children: { type: "tableRow"; children: { type: "tableCell"; children: PhrasingContent[] }[] }[] },
        id,
        idx,
      );
    }
    case "code": {
      const id = generador.siguiente("code");
      return convertirCodigo(node, id, idx);
    }
    case "math": {
      const id = generador.siguiente("latex");
      return convertirLatex(node as { type: "math"; value: string }, id, idx);
    }
    case "blockquote": {
      // Blockquote → aplanamos como párrafos dentro
      const hijos: NodoHoja[] = [];
      const generadorHijo = crearGeneradorIds(generador.prefijo);
      for (const child of node.children) {
        const hoja = convertirNodoContenido(child, generadorHijo);
        if (hoja) hijos.push(hoja);
      }
      // Devolvemos solo el primero por simplicidad — o podríamos devolver un NodoParrafo compuesto
      if (hijos.length === 1) return hijos[0];
      if (hijos.length > 1) {
        // Unir blockquotes en un solo párrafo
        const textoCompleto = hijos
          .filter((h): h is NodoParrafo => h.tipo === "p")
          .map((h) => h.texto_plano)
          .join("\n");
        const id = generador.siguiente("p");
        return {
          id,
          tipo: "p",
          indice_global: idx,
          inline: [{ tipo: "texto", contenido: textoCompleto }],
          texto_plano: textoCompleto,
        };
      }
      return null;
    }
    case "heading": {
      // Los headings se manejan en el nivel superior — aquí no deberían llegar
      return null;
    }
    case "thematicBreak":
      return null;
    // "math" no existe en MDAST estándar sin remark-math — ignorar
    default:
      return null;
  }
}

/** Procesa los hijos de una sección (entre H2 y H3 o dentro de H3) */
function procesarHijosSeccion(
  children: Content[],
  generador: GeneradorIds,
  nivelParent: 1 | 2 | 3,
): NodoEstructural[] {
  const resultado: NodoEstructural[] = [];

  let i = 0;
  while (i < children.length) {
    const node = children[i];

    if (node.type === "heading") {
      const depth = node.depth;

      if (depth <= nivelParent) {
        // Este heading es del mismo nivel o superior → termina la sección actual
        break;
      }

      const texto = node.children
        .filter((c) => c.type === "text")
        .map((c) => ("value" in c ? c.value : ""))
        .join("");

      if (depth === 2 && nivelParent === 1) {
        // H2 dentro de H1
        const id = generador.siguiente("h2");
        const generadorH2 = generador.hijo(id);

        // Recolectar hijos hasta próximo H2 o H1
        i++;
        const hijosH2: Content[] = [];
        while (i < children.length) {
          const next = children[i];
          if (
            next.type === "heading" &&
            (next.depth <= 2)
          ) {
            break;
          }
          hijosH2.push(next);
          i++;
        }

        const h2: NodoH2 = {
          id,
          tipo: "h2",
          indice_global: siguienteIndice(),
          texto,
          hijos: procesarHijosSeccion(hijosH2, generadorH2, 2),
        };
        resultado.push(h2);
        continue;
      }

      if (depth === 3 && nivelParent >= 2) {
        // H3 dentro de H2 o H1
        const id = generador.siguiente("h3");
        const generadorH3 = generador.hijo(id);

        i++;
        const hijosH3: Content[] = [];
        while (i < children.length) {
          const next = children[i];
          if (next.type === "heading" && next.depth <= 3) break;
          hijosH3.push(next);
          i++;
        }

        const h3: NodoH3 = {
          id,
          tipo: "h3",
          indice_global: siguienteIndice(),
          texto,
          hijos: hijosH3
            .map((c) => convertirNodoContenido(c, generadorH3))
            .filter((n): n is NodoHoja => n !== null),
        };
        resultado.push(h3);
        continue;
      }

      // Heading más profundo → tratar como párrafo
      i++;
      continue;
    }

    // Nodo de contenido normal
    const hoja = convertirNodoContenido(node, generador);
    if (hoja) resultado.push(hoja);
    i++;
  }

  return resultado;
}

// ── Export principal ──────────────────────────────────────────────────────

/**
 * Transforma el árbol MDAST (de remark-parse) en un DocumentoMDJ.
 *
 * @param mdast - Raíz del árbol MDAST
 * @param artefactoId - UUID del artefacto
 * @param tipoArtefacto - Tipo de artefacto Cognética
 * @param mdHash - Hash SHA-256 del MD fuente
 * @param anotaciones - Anotaciones a resolver en el árbol
 */
export function transformarMDASTaMDJ(
  mdast: Root,
  artefactoId: string,
  tipoArtefacto: DocumentoMDJ["tipo_artefacto"],
  mdHash: string,
  anotaciones: Anotacion[] = [],
): DocumentoMDJ {
  // Reiniciar contador global
  contadorGlobal = 0;

  const raiz = crearGeneradorIds("");
  const nodos: NodoEstructural[] = [];
  const children = mdast.children as Content[];
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    if (node.type === "heading" && node.depth === 1) {
      // H1 — inicia una sección nueva
      const texto = node.children
        .filter((c) => c.type === "text")
        .map((c) => ("value" in c ? c.value : ""))
        .join("");

      const id = raiz.siguiente("h1");
      const generadorH1 = raiz.hijo(id);

      // Recolectar todos los hijos hasta el próximo H1
      i++;
      const hijosH1: Content[] = [];
      while (i < children.length) {
        const next = children[i];
        if (next.type === "heading" && next.depth === 1) break;
        hijosH1.push(next);
        i++;
      }

      const h1: NodoH1 = {
        id,
        tipo: "h1",
        indice_global: siguienteIndice(),
        texto,
        hijos: procesarHijosSeccion(hijosH1, generadorH1, 1),
      };
      nodos.push(h1);
    } else {
      // Contenido antes del primer H1 → va a root
      const hoja = convertirNodoContenido(node, raiz);
      if (hoja) nodos.push(hoja);
      i++;
    }
  }

  // Resolver anotaciones
  const anotacionesResueltas = resolverAnotaciones(nodos, anotaciones);

  return {
    version: "0.1",
    artefacto_id: artefactoId,
    tipo_artefacto: tipoArtefacto,
    md_hash: mdHash,
    nodos,
    anotaciones: anotacionesResueltas,
  };
}

// ── Resolución de anotaciones ────────────────────────────────────────────

function resolverAnotaciones(
  nodos: NodoEstructural[],
  anotaciones: Anotacion[],
): Anotacion[] {
  // Construir índice de nodos por ID
  const indice = new Map<string, NodoBase>();
  const indexar = (nodo: NodoEstructural) => {
    indice.set(nodo.id, nodo);
    if ("hijos" in nodo && Array.isArray(nodo.hijos)) {
      for (const hijo of (nodo as NodoH1 | NodoH2).hijos) {
        indexar(hijo as NodoEstructural);
      }
    }
    if ("items" in nodo) {
      for (const item of (nodo as NodoLista).items) {
        indice.set(item.id, item);
        if (item.hijos) {
          for (const subLista of item.hijos) {
            for (const subItem of subLista.items) {
              indice.set(subItem.id, subItem);
            }
          }
        }
      }
    }
  };

  for (const nodo of nodos) {
    indexar(nodo);
  }

  // Resolver cada anotación
  return anotaciones.map((anot) => {
    const nodo = indice.get(anot.nodo_id);
    if (!nodo) {
      return { ...anot, huerfana: true };
    }

    // Verificar offsets contra texto_plano
    let textoPlano = "";
    if ("texto_plano" in nodo) {
      textoPlano = (nodo as NodoParrafo | NodoItem).texto_plano;
    }

    if (
      anot.offset_inicio < 0 ||
      anot.offset_fin > textoPlano.length ||
      anot.offset_inicio >= anot.offset_fin
    ) {
      return { ...anot, huerfana: true };
    }

    return anot;
  });
}
