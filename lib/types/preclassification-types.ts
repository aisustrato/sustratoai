import type { Database } from "@/lib/database.types";

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string; errorCode?: string };

export interface BatchWithCounts {
	id: string;
	batch_number: number;
	name: string | null;
	phase_id: string; // ID de la fase a la que pertenece el lote
	status: Database["public"]["Enums"]["batch_preclass_status"];
	assigned_to?: string | null;
	article_counts: {
		pending?: number;
		translated?: number;
		pending_review?: number;
		review_pending?: number; // Backend devuelve esta clave
		reconciliation_pending?: number;
		validated?: number;
		reconciled?: number;
		disputed?: number;
	} | null;
	is_closed?: boolean;
	closure_stats?: {
		total_dimensions: number;
		finalized_dimensions: number;
		percent_finalized: number;
	};
}

export interface ClassificationReview {
	reviewer_type: "ai" | "human";
	reviewer_id: string;
	iteration: number;
	value: string | null;
	confidence: number | null;
	rationale: string | null;
	// Nuevos campos según esquema actualizado
	option_id?: string | null;
	prevalidated?: boolean;
	is_final?: boolean;
	status?: Database["public"]["Enums"]["batch_preclass_status"];
}

export interface NotesInfo {
	article_id: string | null;
	has_notes: boolean;
	note_count: number;
	note_ids?: string[];
}

export interface ArticleForReview {
	item_id: string;
	article_id: string; // 🎯 OPTIMIZACIÓN: ID directo del artículo para evitar consultas adicionales
	article_status: Database["public"]["Enums"]["batch_preclass_status"];
	article_data: {
		correlativo: number | null;
		publication_year: number | null;
		journal: string | null;
		original_title: string | null;
		original_abstract: string | null;
		translated_title: string | null;
		translated_abstract: string | null;
		translation_summary: string | null;
	};
	ai_summary: {
		keywords: string[] | null;
		process_opinion: string | null;
	};
	classifications: Record<string, ClassificationReview[]>;
	notes_info?: NotesInfo;
}

type ColumnOption =
	| string
	| {
			value: string | number;
			label: string;
	  };

export interface BatchDetails {
	columns: {
		id: string;
		name: string;
		type: string;
		options: ColumnOption[];
		icon?: string | null;
		// Mapa de valor de opción -> emoticon asociado (si existe)
		optionEmoticons?: Record<string, string | null>;
	}[];
	dimensions?: { id: string; name: string }[]; // 🆕 Para detección de artículos sin clasificaciones
	rows: ArticleForReview[];
	batch_number: number;
	id: string;
	name: string | null;
	status: Database["public"]["Enums"]["batch_preclass_status"];
}

export interface SubmitHumanReviewPayload {
	article_batch_item_id: string;
	dimension_id: string;
	human_value: string;
	human_rationale: string;
	human_confidence: number;
	// Para dimensiones finitas (si corresponde). No se persiste hasta que el schema/tipos lo soporten.
	human_option_id?: string | null;
}

export interface TranslatedArticlePayload {
	articleId: string;
	title: string;
	abstract: string;
	summary?: string;
	translated_by?: string;
	translator_system?: string;
}

// Constantes de permisos
export const PERMISOS = {
	GESTIONAR_PRECLASIFICACION: "can_create_batches",
	GESTIONAR_DATOS_MAESTROS: "can_manage_master_data",
} as const;
