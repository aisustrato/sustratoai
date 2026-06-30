// 📍 lib/papers/types.ts
// Tipos TypeScript para el sistema de papers de la DMZ

export interface PaperAuthor {
	name: string;
	orcid?: string;
	affiliation?: string;
	role?: string;
}

export interface Paper {
	id: string;
	slug: string;
	title: string;
	subtitle?: string | null;
	abstract_es: string;
	abstract_en?: string | null;
	authors: PaperAuthor[];
	keywords: string[];
	content_md: string;
	doi?: string | null;
	zenodo_url?: string | null;
	pdf_url?: string | null;
	language: string;
	published_at?: string | null;
	is_published: boolean;
	version: string;
	citation_apa?: string | null;
	license: string;
	created_at: string;
	updated_at: string;
}

// Tipo para la respuesta de la API (sin campos internos)
export interface PaperPublicData {
	slug: string;
	title: string;
	subtitle?: string | null;
	abstract_es: string;
	abstract_en?: string | null;
	authors: PaperAuthor[];
	keywords: string[];
	content_md: string;
	doi?: string | null;
	zenodo_url?: string | null;
	pdf_url?: string | null;
	language: string;
	published_at?: string | null;
	version: string;
	citation_apa?: string | null;
	license: string;
	updated_at: string;
}

// Tipo para el índice de papers (sin content_md completo)
export interface PaperListItem {
	slug: string;
	title: string;
	subtitle?: string | null;
	abstract_es: string;
	authors: PaperAuthor[];
	published_at?: string | null;
	keywords: string[];
	doi?: string | null;
}

// ============================================================================
// TIPOS PARA SISTEMA DE PUBLICACIÓN (/personal/papers)
// ============================================================================

/**
 * Imagen asociada a un paper
 * Representa la doble capa: visual (URL) y textual (descripción para AI)
 */
export interface PaperImage {
	id: string;
	paper_id: string;
	position: number;
	original_placeholder: string;
	storage_path: string | null;
	public_url: string | null;
	alt_text: string;
	description_ai: string;
	original_filename: string | null;
	file_size: number | null;
	mime_type: string | null;
	width: number | null;
	height: number | null;
	is_uploaded: boolean;
	created_at: string;
	updated_at: string;
}

/**
 * Input para crear o actualizar un paper (borrador o publicado)
 */
export interface PaperDraftInput {
	title: string;
	subtitle?: string;
	slug: string;
	abstract_es: string;
	abstract_en?: string;
	authors: PaperAuthor[];
	keywords: string[];
	content_md: string;
	doi?: string;
	zenodo_url?: string;
	pdf_url?: string;
	version: string;
	citation_apa?: string;
	license: string;
	language: string;
	published_at?: string;
	pdf_storage_path?: string;
	pdf_sha256?: string;
	created_by?: string;
	processing_status: "draft" | "processing" | "ready" | "published";
}

/**
 * Placeholder de imagen detectado por Marker en el markdown
 */
export interface ImagePlaceholder {
	position: number;
	fullMatch: string;
	altText: string;
	src: string;
	/** Descripción extendida delimitada con `<!-- /img -->` (paso 2). */
	descriptionAi?: string;
	/** true si la imagen tiene marcador de fin de descripción. */
	hasEndMarker?: boolean;
}

/**
 * Paper extendido con sus imágenes (para edición)
 */
export interface PaperWithImages extends Paper {
	images: PaperImage[];
	pdf_storage_path?: string | null;
	pdf_sha256?: string | null;
	created_by?: string | null;
	processing_status: "draft" | "processing" | "ready" | "published";
}

/**
 * Input para crear/actualizar una imagen de paper
 */
export interface PaperImageInput {
	paper_id: string;
	position: number;
	original_placeholder: string;
	storage_path?: string;
	public_url?: string;
	alt_text: string;
	description_ai: string;
	original_filename?: string;
	file_size?: number;
	mime_type?: string;
	width?: number;
	height?: number;
	is_uploaded: boolean;
}

/**
 * Metadata extraída del procesamiento de PDF
 */
export interface PdfProcessingMetadata {
	title: string;
	originalFileName: string;
	fileSize: number;
	sha256: string;
	numPages?: number;
	author?: string;
	subject?: string;
}

/**
 * Respuesta del endpoint de procesamiento de PDF
 */
export interface ProcessPdfResponse {
	success: boolean;
	markdown: string;
	imagePlaceholders: ImagePlaceholder[];
	metadata: PdfProcessingMetadata;
}

/**
 * Estado del pipeline de publicación
 */
export type PipelineStep = 1 | 2 | 3 | 4;

export interface PipelineState {
	currentStep: PipelineStep;
	// Paso 1
	pdfFile: File | null;
	isProcessing: boolean;
	// Paso 2
	markdownContent: string;
	markdownOriginal: string;
	// Paso 3
	imagePlaceholders: ImagePlaceholder[];
	uploadedImages: Map<string, PaperImage>; // key = original_placeholder
	// Paso 4
	metadata: Partial<PaperDraftInput>;
	// General
	paperId: string | null;
	isSaving: boolean;
	error: string | null;
}
