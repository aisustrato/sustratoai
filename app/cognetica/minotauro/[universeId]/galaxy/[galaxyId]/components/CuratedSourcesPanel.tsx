// 📍 app/cognetica/minotauro/[universeId]/galaxy/[galaxyId]/components/CuratedSourcesPanel.tsx
// 🎯 PROPÓSITO: Panel para conectar fuentes de Cognética (artefactos) a párrafos

"use client";

import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	forwardRef,
	useImperativeHandle,
} from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import {
	addCuratedSource,
	removeCuratedSource,
	getCuratedSourcesWithDetails,
} from "@/lib/actions/minotauro-actions";
import { getArtifactTokens } from "@/lib/actions/cognetica-gardens-actions";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Sprout, Zap } from "lucide-react";
import { ArtifactSelector } from "./ArtifactSelectorDebug";
import { GardenArtifactSelector } from "./GardenArtifactSelector";
import {
	ArtifactTokenBreakdown,
	type ArtifactTokenData,
} from "./ArtifactTokenBreakdown";
import type { GardenPayloadVersion } from "@/lib/actions/cognetica-gardens-minotauro";
import { estimateTokens } from "@/lib/utils/token-estimator";

interface CuratedSourcesPanelProps {
	galaxyId: string;
	projectId: string;
	onCountChange?: (count: number) => void;
}

export interface SelectedArtifactForArchetype {
	sourceId: string;
	artifactId: string;
	version: GardenPayloadVersion;
	content: string;
	metadata?: any;
	selectedElements?: {
		transcripcion?: boolean;
		ensayo_destilado?: boolean;
		elementos_cognitivos?: boolean;
		datos_cronologicos?: boolean;
		metabolizacion_micelio?: boolean;
		chat_calibrador?: boolean;
	};
	tokenBreakdown?: ArtifactTokenData;
}

export interface CuratedSourcesPanelRef {
	getSelectedArtifactsWithVersions: () => SelectedArtifactForArchetype[];
	getTotalSelectedTokens: () => number;
}

export const CuratedSourcesPanel = forwardRef<
	CuratedSourcesPanelRef,
	CuratedSourcesPanelProps
>(function CuratedSourcesPanel({ galaxyId, projectId, onCountChange }, ref) {
	const { toast } = useToast();
	const [sources, setSources] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [showArtifactSelector, setShowArtifactSelector] = useState(false);
	const [showGardenSelector, setShowGardenSelector] = useState(false);

	// Estados para selección y versión de artefactos
	const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(
		new Set(),
	);
	const [artifactVersions, setArtifactVersions] = useState<
		Record<string, GardenPayloadVersion>
	>({});

	// Estados para control granular de tokens
	const [artifactTokens, setArtifactTokens] = useState<
		Record<string, ArtifactTokenData>
	>({});
	const [selectedElements, setSelectedElements] = useState<
		Record<string, Set<string>>
	>({}); // artifactId -> Set de elementIds
	const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set());

	const loadSources = async () => {
		setLoading(true);
		const result = await getCuratedSourcesWithDetails(galaxyId);
		if (result.success && result.data) {
			setSources(result.data);
			onCountChange?.(result.data.length);

			// Inicializar todos los artefactos como seleccionados con versión ligera por defecto
			const newSelected = new Set<string>();
			const newVersions: Record<string, GardenPayloadVersion> = {};

			result.data.forEach((item: any) => {
				const sourceId = item.source.id;
				newSelected.add(sourceId);
				newVersions[sourceId] = "ligera"; // Versión mínima por defecto

				// Inicializar selección de elementos vacía (se cargará bajo demanda)
				if (item.artifact?.id) {
					// No cargar tokens automáticamente, solo cuando el usuario expanda
				}
			});

			setSelectedArtifacts(newSelected);
			setArtifactVersions(newVersions);
		}
		setLoading(false);
	};

	useEffect(() => {
		loadSources();
	}, [galaxyId]);

	const handleArtifactsSelected = async (artifactIds: string[]) => {
		let successCount = 0;
		let errorCount = 0;
		let duplicateCount = 0;

		for (const artifactId of artifactIds) {
			const payload = {
				galaxy_id: galaxyId,
				source_type: "artifact" as const,
				artifact_id: artifactId,
			};

			const result = await addCuratedSource(payload);

			if (result.success && result.duplicate) {
				duplicateCount++;
			} else if (result.success) {
				successCount++;
			} else {
				errorCount++;
				console.error("❌ [CuratedSourcesPanel] Error:", result.error);
			}
		}

		if (successCount > 0) {
			toast({
				title: "🔗 Artefactos conectados",
				description: `${successCount} artefacto(s) conectado(s) exitosamente`,
			});
		}

		if (duplicateCount > 0) {
			toast({
				title: "Ya estaban curados",
				description: `${duplicateCount} artefacto(s) ya estaban en esta sección`,
			});
		}

		if (errorCount > 0) {
			toast({
				title: "Algunos artefactos fallaron",
				description: `${errorCount} artefacto(s) no pudieron conectarse`,
				variant: "destructive",
			});
		}

		setShowArtifactSelector(false);
		setAdding(false);
		loadSources();
	};

	const handleGardenArtifactsSelected = async (
		selections: Map<
			string,
			{
				artifactId: string;
				version: GardenPayloadVersion;
				gardenId: string;
				gardenName: string;
			}
		>,
	) => {
		let successCount = 0;
		let errorCount = 0;
		let duplicateCount = 0;

		// Agregar artefactos del jardín directamente
		for (const [artifactId, selection] of selections) {
			try {
				const payload = {
					galaxy_id: galaxyId,
					source_type: "artifact" as const,
					artifact_id: artifactId,
					metadata: {
						from_garden: true,
						garden_id: selection.gardenId,
						garden_name: selection.gardenName,
						data_version: selection.version,
					},
				};

				const result = await addCuratedSource(payload);

				if (result.success && result.duplicate) {
					duplicateCount++;
				} else if (result.success) {
					successCount++;
				} else {
					errorCount++;
					console.error("❌ [CuratedSourcesPanel] Error:", result.error);
				}
			} catch (err) {
				errorCount++;
				console.error(
					"❌ [CuratedSourcesPanel] Error procesando artefacto:",
					err,
				);
			}
		}

		if (successCount > 0) {
			toast({
				title: "🌱 Artefactos del jardín conectados",
				description: `${successCount} artefacto(s) agregado(s) exitosamente`,
			});
		}

		if (duplicateCount > 0) {
			toast({
				title: "Ya estaban curados",
				description: `${duplicateCount} artefacto(s) ya estaban en esta sección`,
			});
		}

		if (errorCount > 0) {
			toast({
				title: "Errores al conectar",
				description: `${errorCount} artefacto(s) no pudieron conectarse`,
				variant: "destructive",
			});
		}

		setShowGardenSelector(false);
		setAdding(false);
		loadSources();
	};

	const handleRemoveSource = async (sourceId: string) => {
		if (!confirm("¿Eliminar esta fuente curada?")) return;

		const result = await removeCuratedSource(sourceId);
		if (result.success) {
			toast({
				title: "🗑️ Fuente eliminada",
				description: "La fuente ha sido desconectada",
			});
			loadSources();
		} else {
			toast({
				title: "Error al eliminar",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}
	};

	// Cargar tokens de un artefacto
	const loadArtifactTokens = useCallback(
		async (artifactId: string) => {
			if (artifactTokens[artifactId] || loadingTokens.has(artifactId)) return;

			setLoadingTokens((prev) => new Set(prev).add(artifactId));

			const result = await getArtifactTokens(artifactId);

			if (result.success && result.data) {
				setArtifactTokens((prev) => ({
					...prev,
					[artifactId]: result.data!,
				}));

				// Inicializar todos los elementos como seleccionados por defecto
				const allElements = new Set<string>();
				Object.keys(result.data).forEach((key) => {
					const value = result.data![key as keyof typeof result.data];
					if (
						key !== "total" &&
						key !== "detalles" &&
						typeof value === "number" &&
						value > 0
					) {
						allElements.add(`${artifactId}_${key}`);
					}
				});

				setSelectedElements((prev) => ({
					...prev,
					[artifactId]: allElements,
				}));
			}

			setLoadingTokens((prev) => {
				const newSet = new Set(prev);
				newSet.delete(artifactId);
				return newSet;
			});
		},
		[artifactTokens, loadingTokens],
	);

	// Calcular tokens totales según elementos seleccionados
	const estimatedTokens = useMemo(() => {
		let total = 0;
		sources.forEach((item) => {
			const sourceId = item.source.id;
			const artifactId = item.artifact?.id;

			if (!selectedArtifacts.has(sourceId)) return;

			// Si tiene tokens granulares calculados, usar esos
			if (artifactId && artifactTokens[artifactId]) {
				const tokenData = artifactTokens[artifactId];
				const elements = selectedElements[artifactId] || new Set();

				// Sumar solo los elementos seleccionados
				Object.entries(tokenData).forEach(([key, value]) => {
					if (
						key !== "total" &&
						key !== "detalles" &&
						typeof value === "number"
					) {
						const elementId = `${artifactId}_${key}`;
						if (elements.has(elementId)) {
							total += value;
						}
					}
				});
			} else {
				// Fallback: estimación básica
				const content = item.source.content_excerpt || "";
				total += estimateTokens(content);
			}
		});
		return total;
	}, [sources, selectedArtifacts, artifactTokens, selectedElements]);

	// Función para obtener artefactos seleccionados con sus versiones y elementos
	const getSelectedArtifactsWithVersions =
		useCallback((): SelectedArtifactForArchetype[] => {
			return sources
				.filter((item) => selectedArtifacts.has(item.source.id))
				.map((item) => {
					const artifactId = item.artifact?.id || item.chat_session?.id || "";
					const tokenData = artifactTokens[artifactId];
					const elements = selectedElements[artifactId] || new Set();

					// Construir objeto de elementos seleccionados
					const selectedElementsObj: SelectedArtifactForArchetype["selectedElements"] =
						{};
					if (tokenData) {
						Object.keys(tokenData).forEach((key) => {
							if (key !== "total" && key !== "detalles") {
								const elementId = `${artifactId}_${key}`;
								selectedElementsObj[key as keyof typeof selectedElementsObj] =
									elements.has(elementId);
							}
						});
					}

					return {
						sourceId: item.source.id,
						artifactId,
						version: artifactVersions[item.source.id] || "ligera",
						content: item.source.content_excerpt || "",
						metadata: item.source.metadata || {},
						selectedElements: selectedElementsObj,
						tokenBreakdown: tokenData,
					};
				});
		}, [
			sources,
			selectedArtifacts,
			artifactVersions,
			artifactTokens,
			selectedElements,
		]);

	// Función para obtener total de tokens seleccionados
	const getTotalSelectedTokens = useCallback(() => {
		return estimatedTokens;
	}, [estimatedTokens]);

	// Exponer funciones al componente padre mediante ref
	useImperativeHandle(
		ref,
		() => ({
			getSelectedArtifactsWithVersions,
			getTotalSelectedTokens,
		}),
		[getSelectedArtifactsWithVersions, getTotalSelectedTokens],
	);

	return (
		<div className="space-y-3">
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<h4 className="font-semibold text-sm flex items-center gap-2">
						📚 Fuentes curadas
						<StandardBadge colorScheme="neutral" size="sm">
							{sources.length}
						</StandardBadge>
					</h4>
					{selectedArtifacts.size > 0 && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<Zap className="w-3 h-3" />
							<span>
								{selectedArtifacts.size} seleccionados • ~
								{estimatedTokens.toLocaleString()} tokens
							</span>
						</div>
					)}
				</div>
				{!adding && (
					<div className="flex gap-2">
						<StandardButton
							colorScheme="accent"
							size="sm"
							leftIcon={Sprout}
							onClick={() => {
								setAdding(true);
								setShowGardenSelector(true);
							}}>
							Jardín
						</StandardButton>
						<StandardButton
							colorScheme="primary"
							size="sm"
							leftIcon={Plus}
							onClick={() => {
								setAdding(true);
								setShowArtifactSelector(true);
							}}>
							Artefacto
						</StandardButton>
					</div>
				)}
			</div>

			{/* Selector de jardines */}
			{adding && showGardenSelector && (
				<GardenArtifactSelector
					projectId={projectId}
					onConfirm={handleGardenArtifactsSelected}
					onCancel={() => {
						setShowGardenSelector(false);
						setAdding(false);
					}}
				/>
			)}

			{/* Selector de artefactos */}
			{adding && showArtifactSelector && (
				<ArtifactSelector
					projectId={projectId}
					onSelect={handleArtifactsSelected}
					onCancel={() => {
						setShowArtifactSelector(false);
						setAdding(false);
					}}
					alreadyCuratedIds={
						sources
							.map((s) => s.source?.artifact_id || s.artifact?.id)
							.filter(Boolean) as string[]
					}
				/>
			)}

			{/* Lista de artefactos */}
			{loading ?
				<p className="text-xs text-muted-foreground">Cargando artefactos...</p>
			: sources.length === 0 ?
				<p className="text-xs text-muted-foreground italic">
					Sin artefactos curados. Agrega artefactos de Cognética para enviar a
					los arquetipos.
				</p>
			:	<div className="space-y-2">
					{sources.map((item, index) => {
						const sourceId = item.source.id;
						const artifactId = item.artifact?.id;
						const isSelected = selectedArtifacts.has(sourceId);
						const currentVersion = artifactVersions[sourceId] || "ligera";
						const hasTokenData = artifactId && artifactTokens[artifactId];
						const isLoadingTokenData =
							artifactId && loadingTokens.has(artifactId);

						return (
							<StandardCard key={item.source.id} className="p-3">
								<div className="space-y-3">
									<div className="flex justify-between items-start gap-2">
										{/* Checkbox para incluir/excluir */}
										<div className="flex items-start pt-1">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={(e) => {
													const newSelected = new Set(selectedArtifacts);
													if (e.target.checked) {
														newSelected.add(sourceId);
														// Cargar tokens si es un artefacto y no están cargados
														if (
															artifactId &&
															!hasTokenData &&
															!isLoadingTokenData
														) {
															loadArtifactTokens(artifactId);
														}
													} else {
														newSelected.delete(sourceId);
													}
													setSelectedArtifacts(newSelected);
												}}
												className="mt-0.5"
											/>
										</div>

										<div className="flex-1 min-w-0 space-y-2">
											{/* Detectar si es un jardín por la metadata */}
											{(() => {
												const isGarden =
													item.source.metadata &&
													typeof item.source.metadata === "object" &&
													"garden_id" in item.source.metadata;
												const gardenMeta =
													isGarden ? (item.source.metadata as any) : null;

												return (
													<>
														<div className="flex items-center gap-2 flex-wrap">
															<span className="text-xs font-medium text-muted-foreground">
																#{index + 1}
															</span>
															{isGarden ?
																<>
																	<span className="font-medium text-sm truncate">
																		🌱{" "}
																		{gardenMeta?.referencia_formal ||
																			"Jardín de Resonancia"}
																	</span>
																	<StandardBadge colorScheme="accent" size="sm">
																		{gardenMeta?.version || "ligera"}
																	</StandardBadge>
																	<StandardBadge
																		colorScheme="neutral"
																		size="sm">
																		~{gardenMeta?.token_count || 0} tokens
																	</StandardBadge>
																</>
															:	<span className="font-medium text-sm truncate">
																	{item.artifact?.title ||
																		item.chat_session?.title ||
																		"Artefacto sin título"}
																</span>
															}
														</div>

														{/* Mostrar preview del contenido del jardín */}
														{isGarden && item.source.content_excerpt && (
															<details className="text-xs text-muted-foreground mt-2">
																<summary className="cursor-pointer hover:text-foreground">
																	📄 Ver contenido del jardín
																</summary>
																<div className="mt-2 p-2 bg-accent-50 rounded border border-accent-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
																	{item.source.content_excerpt}
																</div>
															</details>
														)}

														{item.source.relevance_note && (
															<p className="text-xs text-muted-foreground">
																💡 {item.source.relevance_note}
															</p>
														)}
													</>
												);
											})()}
										</div>

										<StandardButton
											colorScheme="danger"
											size="sm"
											styleType="ghost"
											leftIcon={Trash2}
											onClick={() => handleRemoveSource(item.source.id)}
										/>
									</div>

									{/* Control granular de tokens - solo para artefactos seleccionados */}
									{isSelected && artifactId && (
										<div className="mt-3 pt-3 border-t border-border">
											{isLoadingTokenData ?
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
													<span>Calculando tokens...</span>
												</div>
											: hasTokenData ?
												<ArtifactTokenBreakdown
													artifactId={artifactId}
													artifactTitle={item.artifact?.title || "Artefacto"}
													artifactNumber={index + 1}
													tokenData={artifactTokens[artifactId]}
													selectedElements={
														selectedElements[artifactId] || new Set()
													}
													onElementToggle={(elementId) => {
														setSelectedElements((prev) => {
															const current = prev[artifactId] || new Set();
															const newSet = new Set(current);
															if (newSet.has(elementId)) {
																newSet.delete(elementId);
															} else {
																newSet.add(elementId);
															}
															return {
																...prev,
																[artifactId]: newSet,
															};
														});
													}}
													isMainSelected={true}
													onMainToggle={() => {
														// El toggle principal ya está manejado por el checkbox superior
													}}
												/>
											:	<StandardButton
													size="sm"
													colorScheme="primary"
													styleType="outline"
													onClick={() => loadArtifactTokens(artifactId)}>
													📊 Mostrar desglose de tokens
												</StandardButton>
											}
										</div>
									)}
								</div>
							</StandardCard>
						);
					})}
				</div>
			}
		</div>
	);
});
