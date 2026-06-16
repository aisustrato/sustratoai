// 📍 lib/mdj/types.ts
// Tipos del contrato MDJ v0.1 — árbol de nodos derivado de MD fuente

// ── IDs ──────────────────────────────────────────────────────────────────

export type TipoAbrev =
  | "root"
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "ul"
  | "ol"
  | "li"
  | "tbl"
  | "code"
  | "latex";

// ── Nodos inline ─────────────────────────────────────────────────────────

export type NodoInline =
  | { tipo: "texto"; contenido: string }
  | { tipo: "negrita"; hijos: NodoInline[] }
  | { tipo: "cursiva"; hijos: NodoInline[] }
  | { tipo: "neg_cur"; hijos: NodoInline[] }
  | { tipo: "tachado"; hijos: NodoInline[] }
  | { tipo: "code_inline"; contenido: string }
  | { tipo: "latex_inline"; contenido: string }
  | { tipo: "link"; texto: string; url: string };

// ── Anotaciones ──────────────────────────────────────────────────────────

export type TipoAnotacion = "frase_notable" | "referencia" | "nota";

export type SemaforoReferencia = "verde" | "amarillo" | "rojo";

export type Anotacion = {
  id: string;
  tipo: TipoAnotacion;
  nodo_id: string;
  offset_inicio: number;
  offset_fin: number;
  fragmento: string;
  entidad_id?: string;
  nota_texto?: string;
  /** Semáforo de confiabilidad de la fuente (solo para tipo "referencia") */
  semaforo?: SemaforoReferencia;
  /** Indica si el link fue verificado que existe (solo para tipo "referencia") */
  validado?: boolean;
  huerfana?: boolean;
};

// ── TipoNodo (string union — no derivado para evitar circularidad) ───────

export type TipoNodo =
  | "root"
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "ul"
  | "ol"
  | "li"
  | "tbl"
  | "code"
  | "latex";

// ── Nodo base ────────────────────────────────────────────────────────────

export type NodoBase = {
  id: string;
  tipo: TipoNodo;
  indice_global: number;
  /** Primera línea del MD fuente que ocupa este nodo (1-indexed) */
  line_inicio?: number;
  /** Última línea del MD fuente que ocupa este nodo (1-indexed) */
  line_fin?: number;
  anotaciones?: Anotacion[];
};

// ── Nodos estructurales ──────────────────────────────────────────────────

export type NodoH1 = NodoBase & {
  tipo: "h1";
  texto: string;
  hijos: NodoEstructural[];
  colapsado?: boolean;
};

export type NodoH2 = NodoBase & {
  tipo: "h2";
  texto: string;
  hijos: NodoEstructural[];
  colapsado?: boolean;
};

export type NodoH3 = NodoBase & {
  tipo: "h3";
  texto: string;
  hijos: NodoHoja[];
  colapsado?: boolean;
};

export type NodoParrafo = NodoBase & {
  tipo: "p";
  inline: NodoInline[];
  texto_plano: string;
};

export type NodoLista = NodoBase & {
  tipo: "ul" | "ol";
  items: NodoItem[];
};

export type NodoItem = NodoBase & {
  tipo: "li";
  inline: NodoInline[];
  texto_plano: string;
  hijos?: NodoLista[];
};

export type NodoTabla = NodoBase & {
  tipo: "tbl";
  headers: string[];
  filas: string[][];
};

export type NodoCodigo = NodoBase & {
  tipo: "code";
  lenguaje?: string;
  contenido: string;
};

export type NodoLatex = NodoBase & {
  tipo: "latex";
  contenido: string;
  modo: "bloque";
};

// ── Uniones ──────────────────────────────────────────────────────────────

export type NodoHoja =
  | NodoParrafo
  | NodoLista
  | NodoTabla
  | NodoCodigo
  | NodoLatex;

export type NodoEstructural =
  | NodoH1
  | NodoH2
  | NodoH3
  | NodoParrafo
  | NodoLista
  | NodoTabla
  | NodoCodigo
  | NodoLatex;

// ── Búsqueda ─────────────────────────────────────────────────────────────

export type CoincidenciaBusqueda = {
  nodo_id: string;
  offset_inicio: number;
  offset_fin: number;
  fragmento: string;
};

// ── Documento completo ───────────────────────────────────────────────────

export type DocumentoMDJ = {
  version: "0.1";
  artefacto_id: string;
  tipo_artefacto:
    | "cronica"
    | "destilado"
    | "germinador"
    | "transcripcion_pdf"
    | "otro";
  md_hash: string;
  nodos: NodoEstructural[];
  anotaciones: Anotacion[];
};
