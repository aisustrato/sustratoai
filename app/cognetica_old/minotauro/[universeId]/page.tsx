"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
	updateGalaxy,
	getCuratedSourcesWithDetails,
	getArtifactsFullContent,
} from "@/lib/actions/minotauro-actions";
import type {
	ArchetypeTone,
	CuratedSourceWithDetails,
} from "@/lib/types/minotauro-types";

// Hooks refactorizados
import { useUniverseData } from "./hooks/useUniverseData";
import { useGalaxyEditor } from "./hooks/useGalaxyEditor";
import { useArchetypeProcessor } from "./hooks/useArchetypeProcessor";
import { useCalibration } from "./hooks/useCalibration";
import { useAnalysisHistory } from "./hooks/useAnalysisHistory";
import { useGalaxyCreation } from "./hooks/useGalaxyCreation";

// Utilidades
import {
	calculateTextMetrics,
	calculateTotalMetrics,
} from "./utils/textMetrics";
import { PAPER_STANDARDS, type PaperStandard } from "./utils/paperStandards";
import { estimateSessionContextTokens } from "@/lib/utils/token-estimator";

// Componentes
import { UniverseHeader } from "./components/UniverseHeader";
import { NewGalaxyForm } from "./components/NewGalaxyForm";
import { GalaxyCard } from "./components/GalaxyCard";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { CuratedSourcesPanel } from "./galaxy/[galaxyId]/components/CuratedSourcesPanel";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ProcessWithAIDialog } from "./galaxy/[galaxyId]/components/ProcessWithAIDialog";

// Nuevos componentes arquitectura append-only
import { ArchetypeTimeline } from "./components/ArchetypeTimeline";
import { CalibrationPanel } from "./components/CalibrationPanel";

// Tipos y helpers para nueva arquitectura

export default function UniverseEditorPage() {
	const params = useParams();
	const router = useRouter();
	const { proyectoActual } = useAuth();
	const { toast } = useToast();

	const universeId = params.universeId as string;

	// Estado local
	const [paperStandard, setPaperStandard] = useState<PaperStandard>("zenodo");
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [collapsedSources, setCollapsedSources] = useState<
		Record<string, boolean>
	>({});
	const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});

	// Estados para nueva arquitectura append-only
	const [sentidoActual, setSentidoActual] = useState<Record<string, string>>(
		{},
	);
	const [versionesVisualizadas, setVersionesVisualizadas] = useState<
		Record<string, number>
	>({});
	const [executingCalibration, setExecutingCalibration] = useState<
		string | null
	>(null);

	// Estado artefactos por galaxia (toggle panel)
	const [artefactosExpandidos, setArtefactosExpandidos] = useState<
		Record<string, boolean>
	>({});
	const [artefactosCount, setArtefactosCount] = useState<
		Record<string, number>
	>({});

	// Estado para diálogo de selección de fuentes antes de procesar con arquetipo
	const [archetypeDialogOpen, setArchetypeDialogOpen] = useState(false);
	const [pendingArchetype, setPendingArchetype] = useState<{
		galaxyId: string;
		archetype: ArchetypeTone;
	} | null>(null);
	const [archetypeSources, setArchetypeSources] = useState<
		CuratedSourceWithDetails[]
	>([]);
	const [artifactsContent, setArtifactsContent] = useState<
		Record<string, { text: string; charCount: number }>
	>({});
	const [loadingArtifacts, setLoadingArtifacts] = useState(false);

	// Hooks de lógica
	const {
		universe,
		loading,
		galaxies,
		initialContent,
		initialAnalyses,
		loadUniverse,
		handleDeleteUniverse,
	} = useUniverseData(universeId);

	const {
		editingContent,
		expandedSections,
		setEditingContent,
		handleSaveSection,
		handleDeleteGalaxy,
		handleContentChange,
		handleFieldChange,
		toggleSection,
	} = useGalaxyEditor(initialContent, galaxies, loadUniverse);

	const { processing, processingArchetype, processWithArchetype } =
		useArchetypeProcessor();

	const {
		calibrations,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		handleCalibrationResponse,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		handleCalibrationNote,
		isCalibrationValid,
	} = useCalibration();

	const {
		analyses,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		collapsedAnalyses,
		setAnalyses,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		toggleCollapse,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		dismissAnalysis,
	} = useAnalysisHistory(initialAnalyses as any);

	const {
		newGalaxyForm,
		showNewGalaxyForm,
		setNewGalaxyForm,
		setShowNewGalaxyForm,
		handleCreateGalaxy,
	} = useGalaxyCreation(universeId, loadUniverse);

	// Sincronizar estados
	useEffect(() => {
		setEditingContent(initialContent);
	}, [initialContent, setEditingContent]);

	useEffect(() => {
		setAnalyses(initialAnalyses as any);
	}, [initialAnalyses, setAnalyses]);

	// Actualizar contenido cuando cambia la versión visualizada
	useEffect(() => {
		galaxies.forEach((galaxy) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const metadata = (galaxy.galaxy.metadata as any) || {};
			const versiones = metadata.versiones_texto || [];
			const versionSeleccionada = versionesVisualizadas[galaxy.galaxy.id];

			if (versionSeleccionada && versiones.length > 0) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const versionData = versiones.find(
					(v: any) => v.version === versionSeleccionada,
				);
				if (
					versionData &&
					versionData.content !== editingContent[galaxy.galaxy.id]?.content
				) {
					setEditingContent((prev) => ({
						...prev,
						[galaxy.galaxy.id]: {
							...prev[galaxy.galaxy.id],
							content: versionData.content,
						},
					}));
				}
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [versionesVisualizadas, galaxies]);

	// Métricas calculadas
	const standard = PAPER_STANDARDS[paperStandard];
	const totalMetrics = useMemo(
		() => calculateTotalMetrics(editingContent),
		[editingContent],
	);

	// Handler para abrir diálogo antes de procesar con arquetipo
	const handleProcessWithArchetype = async (
		galaxyId: string,
		archetype: ArchetypeTone,
	) => {
		// 🛡️ PROTECCIÓN: Evitar ejecuciones múltiples
		if (processing) {
			toast({
				title: "⚠️ Proceso en curso",
				description: `Ya hay un ${processingArchetype} procesando. Espera a que termine.`,
				variant: "destructive",
			});
			return;
		}

		if (!proyectoActual?.id) {
			toast({
				title: "Error",
				description: "No se pudo obtener el ID del proyecto.",
				variant: "destructive",
			});
			return;
		}

		const galaxy = galaxies.find((g) => g.galaxy.id === galaxyId);
		if (!galaxy) return;

		// Abrir diálogo inmediatamente con loading
		setArchetypeSources([]);
		setArtifactsContent({});
		setLoadingArtifacts(true);
		setPendingArchetype({ galaxyId, archetype });
		setArchetypeDialogOpen(true);

		// Cargar fuentes y contenido en paralelo
		const sourcesResult = await getCuratedSourcesWithDetails(galaxyId);
		const sources = sourcesResult.success ? sourcesResult.data || [] : [];

		const artifactIds = sources
			.filter((s: CuratedSourceWithDetails) => s.source.artifact_id)
			.map((s: CuratedSourceWithDetails) => s.source.artifact_id as string);

		let contentMap: Record<string, { text: string; charCount: number }> = {};
		if (artifactIds.length > 0) {
			const contentResult = await getArtifactsFullContent(artifactIds);
			if (contentResult.success && contentResult.data) {
				contentMap = contentResult.data;
			}
		}

		setArchetypeSources(sources);
		setArtifactsContent(contentMap);
		setLoadingArtifacts(false);
	};

	// Ejecutar proceso real tras confirmar en el diálogo
	const confirmArchetypeProcess = async () => {
		if (!pendingArchetype || !proyectoActual?.id) return;

		const { galaxyId, archetype } = pendingArchetype;
		const galaxy = galaxies.find((g) => g.galaxy.id === galaxyId);
		if (!galaxy) return;

		setArchetypeDialogOpen(false);

		const content = editingContent[galaxyId]?.content || "";
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const metadata = (galaxy.galaxy.metadata as any) || {};
		const fuentesCuradas = metadata.fuentes_curadas || [];

		const analysisData = await processWithArchetype(
			galaxy.galaxy,
			archetype,
			content,
			proyectoActual.id,
			sentidoActual[galaxyId] || "",
			fuentesCuradas,
		);

		if (analysisData) {
			setAnalyses((prev) => ({
				...prev,
				[galaxyId]: analysisData,
			}));

			// FIX: Forzar apertura del panel de artefactos tras procesar
			setArtefactosExpandidos((prev) => ({
				...prev,
				[galaxyId]: true,
			}));

			console.log(
				"🔓 [Panel] Panel de artefactos abierto para galaxia:",
				galaxyId,
			);

			await loadUniverse();
		}

		setPendingArchetype(null);
	};

	// Handler para ejecutar versión calibrada
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleExecuteVersion = async (
		galaxyId: string,
		finalInstruction?: string,
	) => {
		const analysis = analyses[galaxyId];
		if (!analysis) return;

		// 🛡️ PROTECCIÓN: Evitar ejecuciones múltiples
		if (executingCalibration) {
			toast({
				title: "⚠️ Ejecución en curso",
				description:
					"Ya hay una calibración ejecutándose. Espera a que termine.",
				variant: "destructive",
			});
			return;
		}

		const validation = isCalibrationValid(galaxyId, analysis);
		if (!validation.valid) {
			toast({
				title: "⚠️ Calibración incompleta",
				description: validation.message,
				variant: "destructive",
			});
			return;
		}

		setExecutingCalibration(galaxyId);

		toast({
			title: "🚀 Ejecutando nueva versión...",
			description: `Enviando calibración al ${analysis.archetype}${finalInstruction ? " con instrucción personalizada" : ""}`,
		});

		try {
			const galaxyCalibrations = calibrations[galaxyId] || {};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const calibracionHumana = analysis.comments.map((c: any) => {
				const cal = galaxyCalibrations[c.id];
				return {
					punto: c.point,
					observacion: c.observation,
					respuesta_humano: cal?.response || "rechazado_sin_razon",
					razon: cal?.note || "",
				};
			});

			const response = await fetch("/api/minotauro/process-galaxy", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					galaxyId,
					archetype: analysis.archetype,
					projectId: proyectoActual?.id || "",
					calibracion: calibracionHumana,
					instruccion_final: finalInstruction || "",
					ejecutar_version: true,
				}),
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data.error || "Error generando nueva versión");
			}

			// El arquetipo devuelve el texto completo nuevo en diferentes formatos
			const newContent =
				data.data.response.texto_limpio ||
				data.data.response.texto_nuevo ||
				data.data.response.propuesta_texto ||
				"";

			if (!newContent) {
				throw new Error("El arquetipo no devolvió una nueva versión del texto");
			}

			setEditingContent((prev) => ({
				...prev,
				[galaxyId]: {
					...prev[galaxyId],
					content: newContent,
				},
			}));

			const galaxy = galaxies.find((g) => g.galaxy.id === galaxyId);
			if (galaxy) {
				const metrics = calculateTextMetrics(newContent);

				// Crear registro completo de la ejecución con TODA la información
				const executedAnalysis = {
					...analysis,
					status: "executed" as const,
					timestamp_ejecucion: new Date().toISOString(),
					calibracion_humana: calibracionHumana,
					instruccion_final: finalInstruction || "",
					nueva_version_generada: newContent,
					tokens_ejecucion: data.data.tokens,
				};

				// Obtener historial actual y agregar la ejecución
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const currentMetadata = (galaxy.galaxy.metadata as any) || {};
				const historialActual = currentMetadata.historial_analisis || [];

				// Actualizar el último análisis del historial con la ejecución
				const nuevoHistorial = [...historialActual];
				if (nuevoHistorial.length > 0) {
					// Reemplazar el último análisis con la versión ejecutada
					nuevoHistorial[nuevoHistorial.length - 1] = executedAnalysis;
				}

				await updateGalaxy(galaxyId, {
					metadata: {
						...galaxy.galaxy.metadata,
						content: newContent,
						word_count: metrics.words,
						char_count: metrics.characters,
						estimated_pages: metrics.estimatedPages,
						historial_analisis: nuevoHistorial,
						ultimo_analisis: executedAnalysis,
						timestamp_ejecucion: new Date().toISOString(),
					},
				});
			}

			setAnalyses((prev) => ({
				...prev,
				[galaxyId]: {
					...analysis,
					status: "executed",
				},
			}));

			toast({
				title: "✅ Nueva versión generada",
				description: `${data.data.tokens.totalTokenCount} tokens usados`,
			});

			// Recargar universo para mostrar historial actualizado
			await loadUniverse();

			setTimeout(() => {
				editorRefs.current[galaxyId]?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		} catch (error: unknown) {
			console.error("Error ejecutando versión:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ?
						error.message
					:	"No se pudo ejecutar la versión",
				variant: "destructive",
			});
		} finally {
			setExecutingCalibration(null);
		}
	};

	// Estados de carga
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Cargando universo...</p>
				</div>
			</div>
		);
	}

	if (!universe) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-muted-foreground">Universo no encontrado</p>
			</div>
		);
	}

	const isProcessing = !!processing;
	const isExecuting = !!executingCalibration;
	const showLoadingOverlay = isProcessing || isExecuting;

	return (
		<div className="min-h-screen bg-background p-8 relative">
			{/* Overlay de loading durante procesamiento o ejecución */}
			{showLoadingOverlay && (
				<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
					<div className="flex flex-col items-center gap-4">
						<SustratoLoadingLogo
							size={80}
							variant="spin-pulse"
							speed="normal"
							showText={true}
							text={
								isProcessing ?
									`Procesando con ${processingArchetype}...`
								:	"Ejecutando calibración..."
							}
							breathingEffect={true}
							colorTransition={true}
						/>
					</div>
				</div>
			)}

			<div className="max-w-6xl mx-auto space-y-6">
				{/* Header con métricas globales */}
				<UniverseHeader
					title={universe.universe.title}
					subtitle={universe.universe.subtitle || "Sin descripción"}
					paperStandard={paperStandard}
					totalSections={galaxies.length}
					totalWords={totalMetrics.words}
					totalPages={totalMetrics.estimatedPages}
					standard={standard}
					onStandardChange={setPaperStandard}
					onNewSection={() => setShowNewGalaxyForm(true)}
					onDelete={handleDeleteUniverse}
					onBack={() => router.push("/cognetica_old/minotauro")}
				/>

				{/* Formulario Nueva Galaxia */}
				{showNewGalaxyForm && (
					<NewGalaxyForm
						title={newGalaxyForm.title}
						description={newGalaxyForm.description}
						onTitleChange={(value) =>
							setNewGalaxyForm((prev) => ({ ...prev, title: value }))
						}
						onDescriptionChange={(value) =>
							setNewGalaxyForm((prev) => ({ ...prev, description: value }))
						}
						onSubmit={handleCreateGalaxy}
						onCancel={() => setShowNewGalaxyForm(false)}
					/>
				)}

				{/* Lista de Galaxias */}
				<div className="space-y-4">
					{galaxies.map((item, index) => {
						const galaxy = item.galaxy;
						const content = editingContent[galaxy.id];
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const analysis = analyses[galaxy.id];
						const isExpanded = expandedSections.has(galaxy.id);

						if (!content) return null;

						// Obtener metadata para arquitectura append-only
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const metadata = (galaxy.metadata as any) || {};
						const versiones = metadata.versiones_texto || [];
						const versionActual =
							versionesVisualizadas[galaxy.id] ||
							metadata.version_actual ||
							(versiones.length > 0 ?
								versiones[versiones.length - 1].version
							:	undefined);

						return (
							<GalaxyCard
								key={galaxy.id}
								galaxyId={galaxy.id}
								content={content}
								isExpanded={isExpanded}
								isProcessing={processing === galaxy.id}
								sectionNumber={index + 1}
								standard={standard}
								editorRef={(el) => {
									editorRefs.current[galaxy.id] = el;
								}}
								onToggle={() => toggleSection(galaxy.id)}
								onFieldChange={(field, value) =>
									handleFieldChange(galaxy.id, field, value)
								}
								onContentChange={(content) =>
									handleContentChange(galaxy.id, content)
								}
								onSave={() => handleSaveSection(galaxy.id)}
								onDelete={() => handleDeleteGalaxy(galaxy.id)}
								onProcessArchetype={(archetype) =>
									handleProcessWithArchetype(galaxy.id, archetype)
								}
								versiones={versiones.length > 0 ? versiones : undefined}
								versionActual={versionActual}
								onVersionChange={(version) =>
									setVersionesVisualizadas((prev) => ({
										...prev,
										[galaxy.id]: version,
									}))
								}
								sentido={sentidoActual[galaxy.id]}
								onSentidoChange={(value) =>
									setSentidoActual((prev) => ({ ...prev, [galaxy.id]: value }))
								}
								processingArchetype={
									processing === galaxy.id ? processingArchetype : null
								}
								onToggleArtefactos={() =>
									setArtefactosExpandidos((prev) => ({
										...prev,
										[galaxy.id]: !prev[galaxy.id],
									}))
								}
								artefactosCount={artefactosCount[galaxy.id]}
								artefactosExpandidos={!!artefactosExpandidos[galaxy.id]}
								artefactosPanel={
									artefactosExpandidos[galaxy.id] ?
										<CuratedSourcesPanel
											galaxyId={galaxy.id}
											projectId={proyectoActual?.id || ""}
											onCountChange={(count) =>
												setArtefactosCount((prev) => ({
													...prev,
													[galaxy.id]: count,
												}))
											}
										/>
									:	undefined
								}>
								{/* Timeline de Arquetipos - Solo nueva arquitectura append-only */}
								{(() => {
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									const meta = (galaxy.metadata as any) || {};
									const historialArquetipos = meta.historial_arquetipos || [];

									if (historialArquetipos.length === 0) return null;

									return (
										<>
											<ArchetypeTimeline
												analisis={historialArquetipos}
												onSelectAnalysis={(analysisId) => {
													console.log("Ver análisis:", analysisId);
												}}
												onViewVersion={(version) => {
													setVersionesVisualizadas((prev) => ({
														...prev,
														[galaxy.id]: version,
													}));
												}}
											/>

											{/* Panel de Calibración para el último análisis pendiente */}
											{(() => {
												const ultimoAnalisis =
													historialArquetipos[historialArquetipos.length - 1];
												console.log("🔍 [CalibrationPanel Debug]", {
													tieneAnalisis: !!ultimoAnalisis,
													status: ultimoAnalisis?.status,
													commentsCount: ultimoAnalisis?.comments?.length,
												});

												if (
													ultimoAnalisis &&
													ultimoAnalisis.status !== "executed"
												) {
													return (
														<CalibrationPanel
															analysis={ultimoAnalisis}
															onCalibrate={async (
																commentId,
																response,
																note,
															) => {
																// Actualizar el comentario en el metadata
																const updatedAnalisis = {
																	...ultimoAnalisis,
																	// eslint-disable-next-line @typescript-eslint/no-explicit-any
																	comments: ultimoAnalisis.comments.map(
																		(c: any) =>
																			c.id === commentId ?
																				{
																					...c,
																					respuesta_humano: response,
																					nota_humano: note,
																				}
																			:	c,
																	),
																};

																// eslint-disable-next-line @typescript-eslint/no-explicit-any
																const updatedHistorial =
																	historialArquetipos.map((a: any) =>
																		a.id === ultimoAnalisis.id ?
																			updatedAnalisis
																		:	a,
																	);

																await updateGalaxy(galaxy.id, {
																	metadata: {
																		...meta,
																		historial_arquetipos: updatedHistorial,
																	},
																});

																await loadUniverse();
															}}
															onShowConfirmDialog={async () => {
																// Ejecutar directamente sin segundo diálogo
																if (executingCalibration) {
																	toast({
																		title: "⚠️ Ejecución en curso",
																		description: "Espera a que termine.",
																		variant: "destructive",
																	});
																	return;
																}
																setExecutingCalibration(galaxy.id);
																toast({
																	title: "🚀 Ejecutando nueva versión...",
																	description: `Enviando calibración al ${ultimoAnalisis.archetype}`,
																});
																try {
																	// eslint-disable-next-line @typescript-eslint/no-explicit-any
																	const calibracion =
																		ultimoAnalisis.comments.map((c: any) => ({
																			punto: c.point,
																			observacion: c.observation,
																			respuesta_humano:
																				c.respuesta_humano ||
																				"rechazado_sin_razon",
																			razon: c.nota_humano,
																		}));
																	const response = await fetch(
																		"/api/minotauro/process-galaxy",
																		{
																			method: "POST",
																			headers: {
																				"Content-Type": "application/json",
																			},
																			body: JSON.stringify({
																				galaxyId: galaxy.id,
																				archetype: ultimoAnalisis.archetype,
																				content: meta.content,
																				projectId: proyectoActual?.id || "",
																				sentido: ultimoAnalisis.sentido,
																				fuentes_curadas:
																					meta.fuentes_curadas || [],
																				ejecutar_version: true,
																				calibracion,
																			}),
																		},
																	);
																	const result = await response.json();
																	if (result.success) {
																		toast({
																			title: "✅ Versión ejecutada",
																			description:
																				"Nueva versión del texto generada",
																		});
																		await loadUniverse();
																	} else {
																		throw new Error(
																			result.error ||
																				"Error ejecutando versión",
																		);
																	}
																} catch (error: unknown) {
																	toast({
																		title: "❌ Error",
																		description:
																			error instanceof Error ?
																				error.message
																			:	"No se pudo ejecutar la versión",
																		variant: "destructive",
																	});
																} finally {
																	setExecutingCalibration(null);
																}
															}}
															onExecute={async () => {
																// Esta función ya no se usa directamente, se llama desde el dialog
															}}
															isProcessing={executingCalibration === galaxy.id}
															versionActual={meta.version_actual}
															historialCount={historialArquetipos.length}
															fuentesCount={meta.fuentes_curadas?.length || 0}
															// eslint-disable-next-line @typescript-eslint/no-explicit-any
															estimatedTokens={(() => {
																const versiones = meta.versiones_texto || [];
																const textoActual =
																	versiones.length > 0 ?
																		versiones[versiones.length - 1].content
																	:	meta.content || "";
																const tokens = estimateSessionContextTokens({
																	texto_humano_original: textoActual,
																	// eslint-disable-next-line @typescript-eslint/no-explicit-any
																	texto_limpio_por_deslixador:
																		meta.versiones_texto?.find(
																			(v: any) => v.origen === "deslixador",
																		)?.content || "",
																	fuentes_cognetica_relevantes:
																		meta.fuentes_curadas || [],
																	// eslint-disable-next-line @typescript-eslint/no-explicit-any
																	historial_interacciones:
																		historialArquetipos.map((a: any) => ({
																			orden_en_sesion: 1,
																			arquetipo: a.archetype,
																			// eslint-disable-next-line @typescript-eslint/no-explicit-any
																			propuesta:
																				a.comments
																					?.map((c: any) => c.point)
																					.join(", ") || "",
																			respuesta_humano: "aceptado",
																			razon_rechazo: "",
																			timestamp: a.timestamp_analisis,
																		})),
																	// eslint-disable-next-line @typescript-eslint/no-explicit-any
																	arquetipos_ya_actuados_en_seccion:
																		historialArquetipos.map(
																			(a: any) => a.archetype,
																		),
																	formato_paper: {
																		nombre: "Zenodo",
																		limite_palabras_por_seccion: 400,
																		tono: "formal",
																	},
																});
																return tokens.total;
															})()}
														/>
													);
												}
												return null;
											})()}
										</>
									);
								})()}
							</GalaxyCard>
						);
					})}
				</div>
			</div>

			{/* Loading Overlay */}
			{processingArchetype && (
				<LoadingOverlay archetype={processingArchetype} />
			)}

			{/* Diálogo de selección de fuentes antes de procesar con arquetipo */}
			{pendingArchetype &&
				(() => {
					const galaxy = galaxies.find(
						(g) => g.galaxy.id === pendingArchetype.galaxyId,
					);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const metadata = (galaxy?.galaxy.metadata as any) || {};
					const versiones = metadata.versiones_texto || [];
					const contenidoActual =
						editingContent[pendingArchetype.galaxyId]?.content || "";

					// Filtrar versiones anteriores (todas menos la actual)
					const versionesAnteriores = versiones
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.filter(
							(v: any) =>
								v.version < (metadata.version_actual || versiones.length),
						)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.map((v: any) => ({
							version: v.version,
							content: v.content,
							origen: v.origen,
						}));

					return (
						<ProcessWithAIDialog
							isOpen={archetypeDialogOpen}
							onClose={() => {
								setArchetypeDialogOpen(false);
								setPendingArchetype(null);
							}}
							onConfirm={confirmArchetypeProcess}
							galaxyTitle={galaxy?.galaxy.title || ""}
							sources={archetypeSources}
							artifactsContent={artifactsContent}
							isLoadingContent={loadingArtifacts}
							archetype={pendingArchetype.archetype}
							isProcessing={!!processing}
							currentContent={contenidoActual}
							previousVersions={versionesAnteriores}
							recommendedWords={standard.wordsPerSection}
						/>
					);
				})()}
		</div>
	);
}
