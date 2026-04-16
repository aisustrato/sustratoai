// 📍 lib/types/minotauro-append-types.ts
// 🎯 Tipos para arquitectura append-only de arquetipos

import type { ArchetypeTone, HumanResponse } from "./minotauro-types";

/**
 * Versión inmutable del texto
 */
export interface TextVersion {
	version: number;
	content: string;
	timestamp: string;
	origen: "humano" | "arquetipo";
	arquetipo_id?: string; // Referencia al análisis que generó esta versión
}

/**
 * Comentario de arquetipo con respuesta humana
 */
export interface ArchetypeComment {
	id: string;
	point: string;
	observation: string;
	respuesta_humano?: HumanResponse;
	nota_humano?: string;
}

/**
 * Análisis inmutable de un arquetipo (append-only)
 */
export interface ArchetypeAnalysis {
	id: string;
	version_entrada: number; // Versión del texto que analizó
	version_salida: number | null; // Versión del texto que generó (null si no ejecutó)
	archetype: ArchetypeTone;
	sentido: string; // Pre-calibración: instrucción breve del humano
	timestamp_analisis: string;
	timestamp_ejecucion?: string;
	status: "pending_calibration" | "calibrated" | "executed";
	comments: ArchetypeComment[];
	instruccion_final?: string; // Instrucción final antes de ejecutar
	tokens: {
		totalTokenCount: number;
		promptTokenCount: number;
		candidatesTokenCount: number;
	};
}

/**
 * Metadata extendido de Galaxy con arquitectura append-only
 */
export interface GalaxyMetadataAppendOnly {
	// Contenido actual (última versión)
	content: string;
	word_count: number;
	char_count: number;
	estimated_pages: number;

	// Historial de versiones del texto (append-only)
	versiones_texto: TextVersion[];

	// Historial de análisis de arquetipos (append-only)
	historial_arquetipos: ArchetypeAnalysis[];

	// Fuentes curadas con números asignados
	fuentes_curadas: CuratedSourceWithNumber[];
	siguiente_numero_referencia: number; // Para asignar nuevos números

	// Índice de versión actual visualizada
	version_actual: number;

	// Campos legacy (mantener por compatibilidad)
	ultimo_analisis?: unknown;
	ultimo_arquetipo?: string;
	timestamp_analisis?: string;
	timestamp_ejecucion?: string;
}

/**
 * Props para TextVersionViewer
 */
export interface TextVersionViewerProps {
	versiones: TextVersion[];
	versionActual: number;
	onVersionChange: (version: number) => void;
}

/**
 * Props para ArchetypeTimeline
 */
export interface ArchetypeTimelineProps {
	analisis: ArchetypeAnalysis[];
	onSelectAnalysis: (analysisId: string) => void;
	onViewVersion: (version: number) => void;
}

/**
 * Props para SentidoInput
 */
export interface SentidoInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

/**
 * Fuente curada con número asignado
 */
export interface CuratedSourceWithNumber {
	id: string;
	numero: number; // Número único asignado automáticamente
	titulo: string;
	autor?: string;
	año?: number;
	url?: string;
	tipo: "paper" | "libro" | "articulo" | "web" | "otro";
	resumen?: string;
	timestamp: string;
	selectedElements?: {
		transcripcion?: boolean;
		ensayo_destilado?: boolean;
		elementos_cognitivos?: boolean;
		datos_cronologicos?: boolean;
		metabolizacion_micelio?: boolean;
		chat_calibrador?: boolean;
	};
	tokenBreakdown?: {
		transcripcion: number;
		ensayo_destilado: number;
		elementos_cognitivos: number;
		datos_cronologicos: number;
		metabolizacion_micelio: number;
		chat_calibrador: number;
		total: number;
	};
}

/**
 * Props para ReferencesPanel
 */
export interface ReferencesPanelProps {
	fuentes: CuratedSourceWithNumber[];
	onSelectReference?: (numero: number) => void;
	onAddSource?: () => void;
}
