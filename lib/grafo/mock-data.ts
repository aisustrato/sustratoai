/**
 * Mock datasets para el grafo de co-ocurrencia.
 *
 * Activación: cookie `graph_mock=<scenarioId>` en el cliente. Las rutas
 * `/api/graph/entities` y `/api/graph/cooccurrence` hacen short-circuit y
 * devuelven estos datos en vez de consultar Supabase. Si la cookie no
 * existe, el flujo real queda intacto.
 *
 * Cada entity puede tener `typeId` que referencia un tipo de nodo. Los
 * tipos en sí (con iconos React) NO se definen aquí porque NO son
 * serializables vía API; el cliente (showroom o futuro consumidor) define
 * el catálogo `GraphNodeType[]` usando los ids documentados en
 * `SCENARIO_TYPE_IDS` para cada escenario.
 *
 * Escenarios:
 *   - vacio:               empty state, sin tipos
 *   - circulo-simple:      5 nodos, 2 tipos (concepto / método)
 *   - circulo-grande:      20 nodos, 4 tipos
 *   - top-dominante:       1 nodo >80%, 2 tipos (raíz / hoja)
 *   - pesos-mixtos:        8 nodos, 3 tipos, foco en weights
 *   - cognetica-artefactos: 12 nodos, 6 tipos (caso de Cognética)
 */

import type { EntityNode } from "@/app/api/graph/entities/route";
import type { CooccurrenceEdge } from "@/app/api/graph/cooccurrence/route";

export type GraphScenarioId =
  | "vacio"
  | "circulo-simple"
  | "circulo-grande"
  | "top-dominante"
  | "pesos-mixtos"
  | "cognetica-artefactos";

export interface GraphScenario {
  id: GraphScenarioId;
  label: string;
  description: string;
  entities: EntityNode[];
  edges: CooccurrenceEdge[];
  total: number;
  /** Type IDs que aparecen en este escenario — el cliente arma el catálogo. */
  typeIds: string[];
}

const SCENARIO_VACIO: GraphScenario = {
  id: "vacio",
  label: "Vacío",
  description: "Corpus sin entidades. Debe mostrar mensaje 'Sin entidades en el corpus.'",
  entities: [],
  edges: [],
  total: 0,
  typeIds: [],
};

const SCENARIO_CIRCULO_SIMPLE: GraphScenario = {
  id: "circulo-simple",
  label: "Círculo simple (5 nodos)",
  description: "5 nodos, 2 tipos (concepto/método). Layout circular sin centro.",
  entities: [
    { id: "e1", label: "Sustrato", freq: 5, typeId: "concepto" },
    { id: "e2", label: "Cognición", freq: 4, typeId: "concepto" },
    { id: "e3", label: "Forense", freq: 4, typeId: "metodo" },
    { id: "e4", label: "Hongo", freq: 3, typeId: "concepto" },
    { id: "e5", label: "Oleada", freq: 3, typeId: "metodo" },
  ],
  edges: [
    { source: "e1", target: "e2", weight: 3 },
    { source: "e1", target: "e3", weight: 2 },
    { source: "e2", target: "e3", weight: 4 },
    { source: "e2", target: "e4", weight: 1 },
    { source: "e3", target: "e5", weight: 2 },
    { source: "e4", target: "e5", weight: 1 },
  ],
  total: 12,
  typeIds: ["concepto", "metodo"],
};

const SCENARIO_CIRCULO_GRANDE: GraphScenario = {
  id: "circulo-grande",
  label: "Círculo grande (20 nodos)",
  description: "20 nodos con 4 tipos. Caso realista de corpus mediano.",
  entities: [
    { id: "g01", label: "Sustrato", freq: 25, typeId: "concepto-clave" },
    { id: "g02", label: "Cognición", freq: 20, typeId: "concepto-clave" },
    { id: "g03", label: "Forense", freq: 18, typeId: "metodo" },
    { id: "g04", label: "Hongo", freq: 15, typeId: "concepto-clave" },
    { id: "g05", label: "Metabolización", freq: 14, typeId: "proceso" },
    { id: "g06", label: "Cartografía", freq: 12, typeId: "proceso" },
    { id: "g07", label: "Crónica", freq: 11, typeId: "artefacto" },
    { id: "g08", label: "Destilado", freq: 10, typeId: "artefacto" },
    { id: "g09", label: "Germinal", freq: 9, typeId: "artefacto" },
    { id: "g10", label: "Artefacto", freq: 8, typeId: "concepto-clave" },
    { id: "g11", label: "Mención", freq: 7, typeId: "sub-concepto" },
    { id: "g12", label: "Referencia", freq: 7, typeId: "sub-concepto" },
    { id: "g13", label: "Slide", freq: 6, typeId: "artefacto" },
    { id: "g14", label: "Triada", freq: 5, typeId: "metodo" },
    { id: "g15", label: "Ingesta", freq: 5, typeId: "proceso" },
    { id: "g16", label: "Concepto", freq: 4, typeId: "sub-concepto" },
    { id: "g17", label: "Corpus", freq: 4, typeId: "concepto-clave" },
    { id: "g18", label: "Vector", freq: 3, typeId: "sub-concepto" },
    { id: "g19", label: "Embedding", freq: 3, typeId: "sub-concepto" },
    { id: "g20", label: "Token", freq: 2, typeId: "sub-concepto" },
  ],
  edges: [
    { source: "g01", target: "g02", weight: 8 },
    { source: "g01", target: "g03", weight: 7 },
    { source: "g01", target: "g04", weight: 6 },
    { source: "g01", target: "g05", weight: 5 },
    { source: "g02", target: "g03", weight: 6 },
    { source: "g02", target: "g05", weight: 4 },
    { source: "g02", target: "g06", weight: 3 },
    { source: "g03", target: "g04", weight: 5 },
    { source: "g03", target: "g07", weight: 4 },
    { source: "g04", target: "g05", weight: 4 },
    { source: "g04", target: "g08", weight: 3 },
    { source: "g05", target: "g06", weight: 3 },
    { source: "g06", target: "g07", weight: 2 },
    { source: "g07", target: "g08", weight: 3 },
    { source: "g07", target: "g09", weight: 2 },
    { source: "g08", target: "g09", weight: 4 },
    { source: "g09", target: "g10", weight: 2 },
    { source: "g10", target: "g11", weight: 3 },
    { source: "g10", target: "g12", weight: 2 },
    { source: "g11", target: "g12", weight: 4 },
    { source: "g12", target: "g13", weight: 2 },
    { source: "g13", target: "g14", weight: 1 },
    { source: "g14", target: "g15", weight: 2 },
    { source: "g15", target: "g16", weight: 1 },
    { source: "g16", target: "g17", weight: 2 },
    { source: "g17", target: "g18", weight: 1 },
    { source: "g18", target: "g19", weight: 3 },
    { source: "g19", target: "g20", weight: 1 },
    { source: "g01", target: "g20", weight: 1 },
    { source: "g02", target: "g11", weight: 2 },
  ],
  total: 60,
  typeIds: ["concepto-clave", "sub-concepto", "metodo", "proceso", "artefacto"],
};

const SCENARIO_TOP_DOMINANTE: GraphScenario = {
  id: "top-dominante",
  label: "Top dominante (>80%)",
  description: "Un nodo concentra >80% de las menciones. Va al centro, resto en elipse.",
  entities: [
    { id: "t1", label: "Sustrato", freq: 60, typeId: "raiz" },
    { id: "t2", label: "Cognición", freq: 1, typeId: "hoja" },
    { id: "t3", label: "Forense", freq: 1, typeId: "hoja" },
    { id: "t4", label: "Hongo", freq: 1, typeId: "hoja" },
    { id: "t5", label: "Crónica", freq: 1, typeId: "hoja" },
    { id: "t6", label: "Destilado", freq: 1, typeId: "hoja" },
    { id: "t7", label: "Germinal", freq: 1, typeId: "hoja" },
    { id: "t8", label: "Mención", freq: 1, typeId: "hoja" },
    { id: "t9", label: "Slide", freq: 1, typeId: "hoja" },
  ],
  edges: [
    { source: "t1", target: "t2", weight: 1 },
    { source: "t1", target: "t3", weight: 1 },
    { source: "t1", target: "t4", weight: 1 },
    { source: "t1", target: "t5", weight: 1 },
    { source: "t1", target: "t6", weight: 1 },
    { source: "t1", target: "t7", weight: 1 },
    { source: "t1", target: "t8", weight: 1 },
    { source: "t1", target: "t9", weight: 1 },
    { source: "t2", target: "t3", weight: 1 },
    { source: "t4", target: "t5", weight: 1 },
  ],
  total: 65,
  typeIds: ["raiz", "hoja"],
};

const SCENARIO_PESOS_MIXTOS: GraphScenario = {
  id: "pesos-mixtos",
  label: "Pesos mixtos",
  description: "Weights 1-12 para validar punteadas (≤2) vs gruesas. 3 tipos de nodo.",
  entities: [
    { id: "p1", label: "Núcleo", freq: 12, typeId: "estructura" },
    { id: "p2", label: "Periferia", freq: 10, typeId: "estructura" },
    { id: "p3", label: "Eje", freq: 8, typeId: "estructura" },
    { id: "p4", label: "Borde", freq: 7, typeId: "frontera" },
    { id: "p5", label: "Hilo", freq: 6, typeId: "conexion" },
    { id: "p6", label: "Nodo", freq: 5, typeId: "estructura" },
    { id: "p7", label: "Trama", freq: 4, typeId: "conexion" },
    { id: "p8", label: "Hueco", freq: 3, typeId: "frontera" },
  ],
  edges: [
    { source: "p1", target: "p2", weight: 12 },
    { source: "p1", target: "p3", weight: 8 },
    { source: "p2", target: "p3", weight: 5 },
    { source: "p2", target: "p4", weight: 3 },
    { source: "p3", target: "p5", weight: 3 },
    { source: "p4", target: "p5", weight: 2 },
    { source: "p4", target: "p6", weight: 2 },
    { source: "p5", target: "p6", weight: 1 },
    { source: "p6", target: "p7", weight: 1 },
    { source: "p7", target: "p8", weight: 1 },
    { source: "p1", target: "p8", weight: 2 },
  ],
  total: 25,
  typeIds: ["estructura", "frontera", "conexion"],
};

const SCENARIO_COGNETICA_ARTEFACTOS: GraphScenario = {
  id: "cognetica-artefactos",
  label: "Cognética: artefactos",
  description: "Caso real del primer cliente. Los typeIds coinciden con el enum `cgt_tipo_artefacto` de Supabase (markdown, pdf_informe, pdf_slides, audio, video, imagen).",
  entities: [
    { id: "ca01", label: "Notas Sustrato v2",     freq: 18, typeId: "markdown" },
    { id: "ca02", label: "Informe Forense Q1",    freq: 16, typeId: "pdf_informe" },
    { id: "ca03", label: "Slides: Oleada 1",      freq: 14, typeId: "pdf_slides" },
    { id: "ca04", label: "Entrevista Hongo",      freq: 12, typeId: "audio" },
    { id: "ca05", label: "Demo cartografiado",    freq: 11, typeId: "video" },
    { id: "ca06", label: "Álbum corpus 2026",     freq: 10, typeId: "imagen" },
    { id: "ca07", label: "Notas metabolización",  freq: 9,  typeId: "markdown" },
    { id: "ca08", label: "Informe destilado",     freq: 8,  typeId: "pdf_informe" },
    { id: "ca09", label: "Slides destilado",      freq: 7,  typeId: "pdf_slides" },
    { id: "ca10", label: "Podcast cognición",     freq: 6,  typeId: "audio" },
    { id: "ca11", label: "Tutorial ingesta",      freq: 5,  typeId: "video" },
    { id: "ca12", label: "Álbum referencias",     freq: 4,  typeId: "imagen" },
  ],
  edges: [
    { source: "ca01", target: "ca02", weight: 5 },
    { source: "ca01", target: "ca07", weight: 6 },
    { source: "ca02", target: "ca03", weight: 4 },
    { source: "ca02", target: "ca08", weight: 5 },
    { source: "ca03", target: "ca09", weight: 4 },
    { source: "ca04", target: "ca10", weight: 3 },
    { source: "ca04", target: "ca05", weight: 2 },
    { source: "ca05", target: "ca11", weight: 4 },
    { source: "ca05", target: "ca06", weight: 2 },
    { source: "ca06", target: "ca12", weight: 3 },
    { source: "ca07", target: "ca08", weight: 3 },
    { source: "ca08", target: "ca09", weight: 4 },
    { source: "ca01", target: "ca03", weight: 2 },
    { source: "ca02", target: "ca04", weight: 1 },
    { source: "ca03", target: "ca05", weight: 2 },
    { source: "ca10", target: "ca11", weight: 2 },
    { source: "ca11", target: "ca06", weight: 1 },
    { source: "ca07", target: "ca10", weight: 1 },
  ],
  total: 40,
  typeIds: ["markdown", "pdf_informe", "pdf_slides", "audio", "video", "imagen"],
};

export const GRAPH_SCENARIOS: Record<GraphScenarioId, GraphScenario> = {
  vacio: SCENARIO_VACIO,
  "circulo-simple": SCENARIO_CIRCULO_SIMPLE,
  "circulo-grande": SCENARIO_CIRCULO_GRANDE,
  "top-dominante": SCENARIO_TOP_DOMINANTE,
  "pesos-mixtos": SCENARIO_PESOS_MIXTOS,
  "cognetica-artefactos": SCENARIO_COGNETICA_ARTEFACTOS,
};

export const GRAPH_SCENARIO_LIST: GraphScenario[] = [
  SCENARIO_VACIO,
  SCENARIO_CIRCULO_SIMPLE,
  SCENARIO_CIRCULO_GRANDE,
  SCENARIO_TOP_DOMINANTE,
  SCENARIO_PESOS_MIXTOS,
  SCENARIO_COGNETICA_ARTEFACTOS,
];

export function getScenario(id: string | undefined | null): GraphScenario | null {
  if (!id) return null;
  if (id in GRAPH_SCENARIOS) {
    return GRAPH_SCENARIOS[id as GraphScenarioId];
  }
  return null;
}

export const MOCK_COOKIE_NAME = "graph_mock";
