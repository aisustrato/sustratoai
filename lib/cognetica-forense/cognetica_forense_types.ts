/**
 * Cognética Forense — Tipos TypeScript Oleada 1
 *
 * Alineados al esquema SQL `cognetica_v2_oleada_1.sql`.
 * Si hay discrepancia entre este archivo y el SQL, gana el SQL.
 *
 * Convención:
 * - Prefijo `Cgt` para tipos de tablas
 * - snake_case en campos de DB, camelCase en nombres de tipos/funciones TS
 * - Tipos de enum como unión de strings literales (alineados al CREATE TYPE SQL)
 *
 * Autor: Hongo / Calibrador
 * Versión: v0.2
 */

// =============================================================================
// ENUMS (alineados a CREATE TYPE SQL)
// =============================================================================

export type CgtTipoArtefacto =
  | "audio"
  | "pdf_slides"
  | "pdf_informe"
  | "markdown"
  | "video"
  | "imagen";

export type CgtVisibilidad = "privado" | "proyecto";

export type CgtEstadoMetabolizacion =
  | "ingresado"
  | "metabolizando"
  | "metabolizado"
  | "error";

export type CgtOrigen = "llm" | "humano" | "nodo" | "sistema";

// =============================================================================
// RESULT TYPE (patrón Rust-like para Server Actions)
// =============================================================================

export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// =============================================================================
// TABLA MADRE: cgt_artefactos
// =============================================================================

export interface CgtArtefacto {
  id: string;
  project_id: string;
  grupo_id: string | null;

  tipo: CgtTipoArtefacto;
  titulo: string;
  descripcion: string | null;

  storage_path_original: string | null;
  storage_path_md: string | null;
  storage_path_yaml: string | null;
  storage_path_json: string;

  sha256_json: string; // 64 caracteres hex

  estado: CgtEstadoMetabolizacion;
  visibilidad: CgtVisibilidad;

  error_mensaje: string | null;

  metadata: Record<string, unknown>;

  created_by: string | null;
  created_at: string; // ISO timestamp
  updated_at: string;
}

// =============================================================================
// GRUPOS
// =============================================================================

export interface CgtGrupoArtefactos {
  id: string;
  project_id: string;

  nombre: string;
  descripcion: string | null;
  visibilidad: CgtVisibilidad;

  metadata: Record<string, unknown>;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// EXTENSIONES POR TIPO
// =============================================================================

export interface CgtArtefactoAudio {
  artefacto_id: string;
  duracion_seg: number | null;
  idioma: string | null;
  transcripcion_completa: string | null;
  hablantes: CgtHablante[];
  sample_rate: number | null;
  bitrate: number | null;
  formato_original: string | null;
  created_at: string;
  updated_at: string;
}

export interface CgtHablante {
  id: string;
  nombre: string;
  metadata?: Record<string, unknown>;
}

export interface CgtAudioSegmento {
  id: string;
  artefacto_id: string;
  timestamp_inicio: number;
  timestamp_fin: number;
  hablante_id: string | null;
  texto: string;
  confianza: number | null;
  created_at: string;
}

export interface CgtArtefactoPdfSlides {
  artefacto_id: string;
  num_paginas: number;
  paginas: CgtPaginaSlide[];
  autor_original: string | null;
  fecha_original: string | null; // ISO date
  created_at: string;
  updated_at: string;
}

export interface CgtPaginaSlide {
  numero: number;
  titulo: string | null;
  texto: string;
  notas: string | null;
}

export interface CgtArtefactoPdfInforme {
  artefacto_id: string;
  num_paginas: number | null;
  markdown_renderizado: string;
  secciones: CgtSeccion[];
  autor_original: string | null;
  fecha_original: string | null;
  doi: string | null;
  citas_bibliograficas: CgtCitaBibliografica[];
  created_at: string;
  updated_at: string;
}

export interface CgtSeccion {
  titulo: string;
  nivel: number; // 1-6 (h1-h6)
  inicio_char: number;
  fin_char: number;
}

export interface CgtCitaBibliografica {
  texto: string;
  autor?: string;
  año?: number;
  doi?: string;
  url?: string;
  [key: string]: unknown;
}

export interface CgtArtefactoMarkdown {
  artefacto_id: string;
  contenido: string;
  frontmatter: Record<string, unknown>;
  headers: CgtHeader[];
  autor_original: string | null;
  fecha_original: string | null;
  created_at: string;
  updated_at: string;
}

export interface CgtHeader {
  texto: string;
  nivel: number;
  posicion_char: number;
}

export interface CgtArtefactoVideo {
  artefacto_id: string;
  duracion_seg: number | null;
  idioma: string | null;
  transcripcion_completa: string | null;
  hablantes: CgtHablante[];
  resolucion: string | null;
  fps: number | null;
  formato_original: string | null;
  created_at: string;
  updated_at: string;
}

export interface CgtVideoSegmento {
  id: string;
  artefacto_id: string;
  timestamp_inicio: number;
  timestamp_fin: number;
  hablante_id: string | null;
  texto: string | null;
  frames_clave_ids: string[];
  confianza: number | null;
  created_at: string;
}

export interface CgtArtefactoImagen {
  artefacto_id: string;
  imagen_descrita_id: string | null;
  formato_original: string | null;
  ancho_px: number | null;
  alto_px: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// IMÁGENES DESCRITAS (transversal)
// =============================================================================

export interface CgtImagenDescrita {
  id: string;
  artefacto_id: string;

  pagina_num: number | null;
  posicion_en_pagina: number | null;
  timestamp_seg: number | null;

  descripcion_ia: string | null;
  descripcion_humana: string | null;

  modelo_ia: string | null;

  storage_path: string;

  ancho_px: number | null;
  alto_px: number | null;
  formato: string | null;

  descripcion_humana_por: string | null;
  descripcion_humana_at: string | null;

  created_at: string;
  updated_at: string;
}

// =============================================================================
// FORMATOS DE METABOLIZACIÓN
// =============================================================================

export interface CgtCronica {
  id: string;
  artefacto_id: string;
  project_id: string;

  contenido: string;
  tokens_count: number | null;

  contracalibracion: string | null;
  contracalibracion_activada: boolean;

  generado_por: CgtOrigen;
  nodo_generador: string | null;
  modelo_ia: string | null;
  version_esquema: string;

  costo_usd: number | null;
  tokens_input: number | null;
  tokens_output: number | null;

  visibilidad: CgtVisibilidad;

  created_at: string;
  updated_at: string;
}

export interface CgtDestilado {
  id: string;
  artefacto_id: string;
  project_id: string;

  tesis: string;
  movimientos: CgtMovimiento[];
  tensiones: CgtTension[];
  cita_nucleo: CgtCitaNucleo | null;

  tokens_count: number | null;

  generado_por: CgtOrigen;
  nodo_generador: string | null;
  modelo_ia: string | null;
  version_esquema: string;

  costo_usd: number | null;
  tokens_input: number | null;
  tokens_output: number | null;

  visibilidad: CgtVisibilidad;

  created_at: string;
  updated_at: string;
}

export interface CgtMovimiento {
  orden: number;
  desde: string;
  hacia: string;
  texto: string;
}

export interface CgtTension {
  texto: string;
  tipo: "paradoja" | "pregunta_abierta" | "contradiccion";
}

export interface CgtCitaNucleo {
  texto: string;
  ubicacion: string;
  autor?: string;
}

export interface CgtGerminal {
  id: string;

  artefacto_id: string | null;
  grupo_id: string | null;

  project_id: string;

  resumen: string | null;
  contexto_snapshot: CgtContextoSnapshot;

  num_resonancias_propuestas: number;
  num_proyecciones_propuestas: number;

  tokens_count: number | null;

  generado_por: CgtOrigen;
  nodo_generador: string | null;
  modelo_ia: string | null;
  version_esquema: string;

  costo_usd: number | null;
  tokens_input: number | null;
  tokens_output: number | null;

  visibilidad: CgtVisibilidad;

  created_at: string;
  updated_at: string;
}

export interface CgtContextoSnapshot {
  destilados_previos_consultados: string[]; // UUIDs de destilados usados como contexto
  semillas_vivas_snapshot: unknown[]; // Oleada 2 poblará esto
  timestamp_snapshot: string;
  [key: string]: unknown;
}

// =============================================================================
// TIPOS COMPUESTOS PARA VISTAS / CONSULTAS
// =============================================================================

/**
 * Artefacto con toda su información relacionada.
 * Usado por `obtenerArtefactoCompleto()`.
 */
export interface ArtefactoCompleto {
  artefacto: CgtArtefacto;

  // Extensión específica por tipo (solo una estará poblada)
  audio?: CgtArtefactoAudio;
  audio_segmentos?: CgtAudioSegmento[];
  pdf_slides?: CgtArtefactoPdfSlides;
  pdf_informe?: CgtArtefactoPdfInforme;
  markdown?: CgtArtefactoMarkdown;
  video?: CgtArtefactoVideo;
  video_segmentos?: CgtVideoSegmento[];
  imagen?: CgtArtefactoImagen;

  // Imágenes descritas (pueden pertenecer a slides, informe, video)
  imagenes_descritas?: CgtImagenDescrita[];

  // Metabolización
  cronica?: CgtCronica;
  destilado?: CgtDestilado;
  germinal?: CgtGerminal;

  // Grupo si pertenece a uno
  grupo?: CgtGrupoArtefactos;
}

// =============================================================================
// INPUTS DE SERVER ACTIONS
// =============================================================================

export interface IngestaArtefactoInput {
  project_id: string;
  grupo_id?: string;
  tipo: CgtTipoArtefacto;
  titulo: string;
  descripcion?: string;

  // Archivo subido (ya en Supabase Storage o por subir).
  // La action decide cómo recibirlo (File, Blob, path de storage).
  file: File | Blob;

  // Opciones de metabolización
  incluir_contracalibracion?: boolean;

  // Visibilidad (default: 'privado')
  visibilidad?: CgtVisibilidad;

  // Metadata libre
  metadata?: Record<string, unknown>;
}

export interface CrearGrupoInput {
  project_id: string;
  nombre: string;
  descripcion?: string;
  visibilidad?: CgtVisibilidad;
  metadata?: Record<string, unknown>;
}

export interface FiltrosArtefacto {
  tipos?: CgtTipoArtefacto[];
  estados?: CgtEstadoMetabolizacion[];
  grupo_id?: string | null; // null = sin grupo; undefined = cualquier grupo
  desde_fecha?: string;
  hasta_fecha?: string;
  busqueda_texto?: string; // full-text sobre título, descripción, contenido
  orden?: "reciente" | "antiguo" | "titulo_asc" | "titulo_desc";
  limite?: number;
  offset?: number;
}

// =============================================================================
// TIPOS DE SOPORTE PARA PROCESAMIENTO
// =============================================================================

/**
 * Resultado de transcripción Replicate WhisperX.
 * Estructura parseada desde la respuesta cruda de la API.
 */
export interface ResultadoTranscripcion {
  segmentos: Array<{
    timestamp_inicio: number;
    timestamp_fin: number;
    texto: string;
    hablante_id: string | null;
    confianza: number | null;
  }>;
  hablantes: CgtHablante[];
  idioma_detectado: string | null;
  transcripcion_completa: string;
  duracion_seg: number;
}

/**
 * Resultado de llamada a LLM para generar un formato.
 */
export interface ResultadoGeneracionFormato {
  contenido_raw: string; // respuesta cruda del LLM
  tokens_input: number;
  tokens_output: number;
  costo_usd: number;
  modelo_usado: string;
  duracion_ms: number;
}

/**
 * Datos canónicos para hash SHA-256.
 * El JSON serializado de este objeto es lo que se hashea.
 */
export interface TriadaCanonica {
  version_esquema: string;
  tipo: CgtTipoArtefacto;
  titulo: string;
  descripcion: string | null;
  contenido_estructurado: Record<string, unknown>; // estructura específica por tipo
  metadata: Record<string, unknown>;
  fecha_ingesta: string; // ISO timestamp
}
