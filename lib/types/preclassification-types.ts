import type { Database } from "@/lib/database.types";

export type ResultadoOperacion<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

export interface BatchWithCounts {
  id: string;
  batch_number: number;
  name: string | null;
  status: Database["public"]["Enums"]["batch_preclass_status"];
  article_counts: {
    pending_review?: number;
    reconciliation_pending?: number;
    agreed?: number;
    reconciled?: number;
    disputed?: number;
  } | null;
}

export interface ClassificationReview {
  reviewer_type: 'ai' | 'human';
  reviewer_id: string;
  iteration: number;
  value: string | null;
  confidence: number | null;
  rationale: string | null;
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
  article_status: Database["public"]["Enums"]["item_preclass_status"];
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

type ColumnOption = string | {
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
  GESTIONAR_DATOS_MAESTROS: "can_manage_master_data"
} as const;
