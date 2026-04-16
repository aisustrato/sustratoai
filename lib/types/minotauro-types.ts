// 📍 lib/types/minotauro-types.ts
// 🎯 PROPÓSITO: Tipos para el Módulo Minotauro de escritura híbrida
// 🔧 DECISIÓN: Tipos espejean exactamente el esquema SQL para consistencia

//#region [types] - 🎨 TIPOS BASE

// Arquetipos según spec v2
// 🔧 NOTA: 'micelio' fue removido - su metabolización ahora ocurre en el módulo Cognética
export type ArchetypeTone =
	| "deslixador" // 🛠️ Limpieza de señal
	| "polinizador" // 🌱 Conexión con fuentes Cognética
	| "dedalo" // 🏛️ Arquitecto/Geómetra
	| "bufon" // 🃏 Nota podrida / Salida elegante
	| "cronos" // ⏳ Auditor del tiempo lineal
	| "colega"; // ☕ Acompañante

// Respuesta del humano a propuestas de arquetipos
export type HumanResponse =
	| "aceptado"
	| "aceptado_con_modificaciones"
	| "rechazado"
	| "rechazado_sin_razon"
	| "rechazado_con_razon"
	| "respuesta_positiva_fuerte"; // "esto me voló la cabeza"

// Estado de la sección
export type SectionState = "abierta" | "en_iteracion" | "cerrada";

export type ParagraphStatus =
	| "draft" // Borrador inicial humano
	| "ai_processing" // IA procesando
	| "ai_proposal" // IA propuso cambios
	| "human_review" // Humano revisando
	| "accepted" // Cambios aceptados
	| "rejected" // Cambios rechazados
	| "final"; // Finalizado

export type SourceType =
	| "chat_message" // Mensaje de chat de Cognética
	| "artifact" // Artefacto de Cognética
	| "garden" // Jardín de Resonancia
	| "external_link" // Link externo
	| "article" // Artículo académico
	| "note" // Nota personal
	| "other"; // Otro tipo

//#endregion

//#region [interfaces] - 🎨 INTERFACES DE TABLAS

export interface MinotauroUniverse {
	id: string;
	project_id: string;
	user_id: string;
	title: string;
	subtitle?: string | null;
	purpose?: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface MinotauroGalaxy {
	id: string;
	universe_id: string;
	title: string;
	description?: string | null;
	content?: string | null; // Contenido MD de la sección (humano)
	ai_content?: string | null; // Propuesta de IA tras procesar
	order_index: number;
	status?: ParagraphStatus; // Reutilizamos el enum
	last_archetype?: ArchetypeTone | null; // Último arquetipo usado
	metadata: MinotauroGalaxyMetadata; // Metadata estructurado según spec v2
	created_at: string;
	updated_at: string;
}

// Metadata estructurado para galaxias según spec v2
export interface MinotauroGalaxyMetadata {
	// Contenido y métricas
	content?: string;
	word_count?: number;
	char_count?: number;
	estimated_pages?: number;

	// Sistema de memoria de sesión
	session_id?: string;
	estado_seccion?: SectionState;
	texto_limpio_por_deslixador?: string;
	historial_interacciones?: SectionInteraction[];
	arquetipos_ya_actuados?: ArchetypeTone[];

	// 🍄 Micelio: resultado de la ronda inicial de metabolización (prerequisito para arquetipos)
	micelio_digest?: {
		ejecutado_en: string; // ISO timestamp
		fuentes_metabolizadas: Array<{
			fuente_id: string;
			referencia_formal: string;
			resonancia: "a_favor" | "en_contra" | "tension" | "sin_resonancia";
			fragmento: string; // digest completo listo para SessionContext
		}>;
	};

	// Otros datos flexibles
	[key: string]: unknown;
}

export interface MinotauroParagraph {
	id: string;
	galaxy_id: string;
	title_tentative?: string | null;
	human_content: string;
	ai_content?: string | null;
	final_content?: string | null;
	status: ParagraphStatus;
	order_index: number;
	archetype_tone: ArchetypeTone;
	seed_concept?: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface GalaxyVersion {
	id: string;
	galaxy_id: string;
	version_number: number;
	content: string;
	created_by: "human" | "ai";
	archetype_tone?: ArchetypeTone | null;
	changes_summary?: string | null;
	ai_rationale?: string | null;
	metadata: Record<string, unknown>; // Incluye métricas: word_count, char_count
	created_at: string;
}

export interface ParagraphVersion {
	id: string;
	paragraph_id: string;
	version_number: number;
	content: string;
	created_by: "human" | "ai";
	archetype_tone?: ArchetypeTone | null;
	changes_summary?: string | null;
	ai_rationale?: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface CuratedSource {
	id: string;
	galaxy_id: string;
	chat_session_id?: string | null;
	message_id?: string | null;
	artifact_id?: string | null;
	source_type: SourceType;
	content_excerpt?: string | null;
	relevance_note?: string | null;
	order_index: number;
	metadata: Record<string, unknown>;
	created_at: string;
}

// Fuente curada con detalles expandidos de artefactos y chat sessions
export interface CuratedSourceWithDetails {
	source: CuratedSource;
	artifact?: {
		id: string;
		title: string;
		type: string;
		description?: string | null;
	} | null;
	chat_session?: {
		id: string;
		session_title: string;
	} | null;
}

export interface AIInteraction {
	id: string;
	paragraph_id: string;
	ai_model: string;
	archetype_tone: ArchetypeTone;
	prompt_sent: string;
	response_received: string;
	input_tokens?: number | null;
	output_tokens?: number | null;
	success: boolean;
	error_message?: string | null;
	created_at: string;
}

//#endregion

//#region [composite] - 🎨 TIPOS COMPUESTOS

// Estructura completa para el editor
export interface MinotauroUniverseFull {
	universe: MinotauroUniverse;
	galaxies: Array<{
		galaxy: MinotauroGalaxy;
		paragraphs: MinotauroParagraph[];
	}>;
}

// Párrafo con sus fuentes curadas y detalles de Cognética
export interface ParagraphWithSources {
	paragraph: MinotauroParagraph;
	sources: Array<{
		source: CuratedSource;
		artifact?: {
			id: string;
			title: string;
			type: string;
			description?: string | null;
		} | null;
		chat_session?: { id: string; session_title: string } | null;
	}>;
	versions: ParagraphVersion[];
	latest_interaction?: AIInteraction;
}

// Galaxia con sus párrafos expandidos
export interface GalaxyWithParagraphs {
	galaxy: MinotauroGalaxy;
	paragraphs: ParagraphWithSources[];
}

//#endregion

//#region [payloads] - 🎨 PAYLOADS PARA ACCIONES

export interface CreateUniversePayload {
	project_id: string;
	title: string;
	subtitle?: string;
	purpose?: string;
}

export interface CreateGalaxyPayload {
	universe_id: string;
	title: string;
	description?: string;
	content?: string; // Contenido MD de la sección
	order_index?: number;
}

export interface UpdateGalaxyPayload {
	title?: string;
	description?: string;
	content?: string; // Contenido MD de la sección
	ai_content?: string; // Propuesta de IA
	status?: ParagraphStatus;
	last_archetype?: ArchetypeTone;
	metadata?: Record<string, unknown>;
	order_index?: number;
}

export interface CreateParagraphPayload {
	galaxy_id: string;
	human_content: string;
	title_tentative?: string;
	seed_concept?: string;
	archetype_tone?: ArchetypeTone;
}

export interface ProcessWithAIPayload {
	paragraph_id: string;
	archetype_tone: ArchetypeTone;
	curated_sources?: string[]; // IDs de fuentes a incluir en el contexto
}

export interface AddCuratedSourcePayload {
	galaxy_id: string;
	source_type: SourceType;
	content_excerpt?: string;
	relevance_note?: string;
	chat_session_id?: string;
	message_id?: string;
	artifact_id?: string;
}

//#endregion

//#region [session] - 🎨 SISTEMA DE MEMORIA DE SESIÓN (SPEC V2)

// Interacción individual en el historial de una sección
export interface SectionInteraction {
	orden_en_sesion: number;
	arquetipo: ArchetypeTone;
	propuesta: string; // Texto de la propuesta del arquetipo
	respuesta_humano: HumanResponse;
	razon_rechazo?: string; // Solo si rechazado_con_razon
	timestamp: string;
}

// Template de formato de paper
export interface PaperFormat {
	nombre: "zenodo" | "nature" | "apa" | "libre" | string;
	limite_palabras_por_seccion: number;
	estructura_esperada: string[];
	tono: "formal" | "critico" | "experimental";
}

// Fuente Cognética relevante
export interface CogneticaSource {
	id: string;
	fragmento: string;
	referencia_formal: string;
}

// Contexto completo de sesión que se inyecta a la IA
export interface SessionContext {
	session_id: string;
	seccion_id: string;
	texto_humano_original: string;
	texto_limpio_por_deslixador?: string;
	fuentes_cognetica_relevantes: CogneticaSource[];
	historial_interacciones: SectionInteraction[];
	arquetipos_ya_actuados_en_seccion: ArchetypeTone[];
	arquetipo_actual: ArchetypeTone;
	estado_seccion: SectionState;
	formato_paper: PaperFormat;
}

//#endregion

//#region [results] - 🎨 TIPOS DE RESULTADOS

export interface ProcessingResult {
	success: boolean;
	paragraph?: MinotauroParagraph;
	interaction?: AIInteraction;
	error?: string;
}

export interface ExportResult {
	success: boolean;
	content?: string;
	format: "markdown" | "latex" | "docx" | "pdf";
	error?: string;
}

//#endregion
