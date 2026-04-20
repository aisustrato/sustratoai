import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateGalaxy } from "@/lib/actions/minotauro-actions";
import type {
	MinotauroGalaxy,
	ArchetypeTone,
} from "@/lib/types/minotauro-types";
import type {
	GalaxyMetadataAppendOnly,
	ArchetypeAnalysis,
	TextVersion,
	CuratedSourceWithNumber,
} from "@/lib/types/minotauro-append-types";

interface TextMetrics {
	words: number;
	characters: number;
	estimatedPages: number;
}

function calculateTextMetrics(text: string): TextMetrics {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	const characters = text.length;
	const estimatedPages = words / 250;

	return { words, characters, estimatedPages };
}

interface UseArchetypeProcessorReturn {
	processing: string | null;
	processingArchetype: ArchetypeTone | null;
	processWithArchetype: (
		galaxy: MinotauroGalaxy,
		archetype: ArchetypeTone,
		content: string,
		projectId: string,
		sentido?: string, // Pre-calibración opcional
		fuentesCuradas?: CuratedSourceWithNumber[], // Referencias disponibles
	) => Promise<ArchetypeAnalysis | null>;
}

export function useArchetypeProcessor(): UseArchetypeProcessorReturn {
	const { toast } = useToast();

	const [processing, setProcessing] = useState<string | null>(null);
	const [processingArchetype, setProcessingArchetype] =
		useState<ArchetypeTone | null>(null);

	const processWithArchetype = useCallback(
		async (
			galaxy: MinotauroGalaxy,
			archetype: ArchetypeTone,
			content: string,
			projectId: string,
			sentido?: string,
			fuentesCuradas?: CuratedSourceWithNumber[],
		) => {
			setProcessing(galaxy.id);
			setProcessingArchetype(archetype);

			const metrics = calculateTextMetrics(content);

			// Obtener metadata actual con estructura append-only
			const currentMetadata =
				(galaxy.metadata as Record<string, unknown>) ||
				({} as Partial<GalaxyMetadataAppendOnly>);
			const versionesTexto = (currentMetadata.versiones_texto || []) as any[];
			const historialArquetipos = (currentMetadata.historial_arquetipos ||
				[]) as any[];
			const fuentesCuradasActuales =
				currentMetadata.fuentes_curadas || fuentesCuradas || [];

			// Determinar versión actual
			const versionActual =
				versionesTexto.length > 0 ?
					versionesTexto[versionesTexto.length - 1].version
				:	0;

			// Si el contenido cambió, crear nueva versión
			const ultimaVersion = versionesTexto[versionesTexto.length - 1];
			const contenidoCambio =
				!ultimaVersion || ultimaVersion.content !== content;

			const nuevasVersiones = [...versionesTexto];
			let versionEntrada = versionActual;

			if (contenidoCambio) {
				const nuevaVersion: TextVersion = {
					version: versionActual + 1,
					content,
					timestamp: new Date().toISOString(),
					origen: "humano",
				};
				nuevasVersiones.push(nuevaVersion);
				versionEntrada = nuevaVersion.version;
			}

			// Guardar versión actualizada antes de procesar
			const saveResult = await updateGalaxy(galaxy.id, {
				metadata: {
					...currentMetadata,
					content,
					word_count: metrics.words,
					char_count: metrics.characters,
					estimated_pages: metrics.estimatedPages,
					versiones_texto: nuevasVersiones,
					version_actual: versionEntrada,
					fuentes_curadas: fuentesCuradasActuales,
				},
			});

			if (!saveResult.success) {
				toast({
					title: "Error al guardar",
					description: "No se pudo guardar el contenido antes de procesar",
					variant: "destructive",
				});
				setProcessing(null);
				setProcessingArchetype(null);
				return null;
			}

			toast({
				title: "🤖 Procesando con IA...",
				description: `Arquetipo: ${archetype}`,
			});

			try {
				const response = await fetch("/api/minotauro/process-galaxy", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						galaxyId: galaxy.id,
						archetype,
						projectId,
						sentido: sentido || "",
						fuentes_curadas: fuentesCuradasActuales,
					}),
				});

				const data = await response.json();

				if (!response.ok || !data.success) {
					throw new Error(data.error || "Error procesando con IA");
				}

				const aiResponse = data.data.response || {};
				const comments = aiResponse.comments || [];

				console.log("📊 [Frontend] Análisis recibido:", {
					archetype,
					commentsCount: comments.length,
					aiResponse,
				});

				// Crear análisis con estructura append-only
				const analysisData: ArchetypeAnalysis = {
					id: crypto.randomUUID(),
					version_entrada: versionEntrada,
					version_salida: null, // Aún no ejecutado
					archetype,
					sentido: sentido || "",
					timestamp_analisis: new Date().toISOString(),
					status: "pending_calibration",
					comments: comments.map(
						(c: { point?: string; observation?: string }) => ({
							id: crypto.randomUUID(),
							point: c.point || "",
							observation: c.observation || "",
						}),
					),
					tokens: data.data.tokens,
				};

				// Agregar análisis al historial (append-only)
				const nuevoHistorialArquetipos = [...historialArquetipos, analysisData];

				await updateGalaxy(galaxy.id, {
					metadata: {
						...currentMetadata,
						content,
						word_count: metrics.words,
						char_count: metrics.characters,
						estimated_pages: metrics.estimatedPages,
						versiones_texto: nuevasVersiones,
						historial_arquetipos: nuevoHistorialArquetipos,
						version_actual: versionEntrada,
						fuentes_curadas: fuentesCuradasActuales,
						siguiente_numero_referencia:
							currentMetadata.siguiente_numero_referencia || 1,
					},
				});

				toast({
					title: "✨ Análisis generado",
					description: `${archetype} ha analizado el texto (${data.data.tokens.totalTokenCount} tokens, ${comments.length} observaciones)`,
				});

				return analysisData;
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : "Error desconocido";
				console.error("Error procesando con IA:", error);
				toast({
					title: "Error",
					description: errorMessage || "No se pudo procesar con IA",
					variant: "destructive",
				});
				return null;
			} finally {
				setProcessing(null);
				setProcessingArchetype(null);
			}
		},
		[toast],
	);

	return {
		processing,
		processingArchetype,
		processWithArchetype,
	};
}
