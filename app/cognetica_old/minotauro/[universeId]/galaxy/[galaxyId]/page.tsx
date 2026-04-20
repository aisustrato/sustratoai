// 📍 app/cognetica_old/minotauro/[universeId]/galaxy/[galaxyId]/page.tsx
// 🎯 PROPÓSITO: Editor de galaxia con párrafos inline (MD-friendly)
// 🌌 METÁFORA: La galaxia es el encabezado, los párrafos fluyen inline

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardNote } from "@/components/ui/StandardNote";
import {
	getGalaxiesByUniverse,
	getParagraphsByGalaxy,
	createParagraph,
	updateParagraph,
	deleteParagraph,
	processWithAI,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// getCuratedSourcesWithDetails,
} from "@/lib/actions/minotauro-actions";
import type {
	MinotauroGalaxy,
	MinotauroParagraph,
	ArchetypeTone,
	CuratedSourceWithDetails,
} from "@/lib/types/minotauro-types";
import { useToast } from "@/hooks/use-toast";
import {
	ArrowLeft,
	Plus,
	Trash2,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// Sparkles,
	Save,
	X,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// ChevronDown,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// ChevronUp,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// Loader2,
	CheckCircle2,
	Sprout,
} from "lucide-react";
import {
	CuratedSourcesPanel,
	type CuratedSourcesPanelRef,
} from "./components/CuratedSourcesPanel";
import { TokenProgressBar } from "../../components/TokenProgressBar";
import {
	ArchetypeConfirmationDialog,
	type SelectedArtifactForDialog,
	type PreviousIteration,
} from "../../components/ArchetypeConfirmationDialog";

export default function GalaxyEditorPage() {
	const params = useParams();
	const router = useRouter();
	const { proyectoActual } = useAuth();
	const { toast } = useToast();

	const universeId = params.universeId as string;
	const galaxyId = params.galaxyId as string;

	const [galaxy, setGalaxy] = useState<MinotauroGalaxy | null>(null);
	const [paragraphs, setParagraphs] = useState<MinotauroParagraph[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingParagraphId, setEditingParagraphId] = useState<string | null>(
		null,
	);
	const [newParagraph, setNewParagraph] = useState(false);
	const [expandedSources, setExpandedSources] = useState<Set<string>>(
		new Set(),
	);
	const [sourcesCount, setSourcesCount] = useState<Record<string, number>>({});

	// Estados para el diálogo de procesamiento con IA
	const [aiDialogOpen, setAiDialogOpen] = useState(false);
	const [selectedParagraph, setSelectedParagraph] =
		useState<MinotauroParagraph | null>(null);
	const [selectedArchetype, setSelectedArchetype] =
		useState<ArchetypeTone>("bufon");
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [curatedSources, setCuratedSources] = useState<
		CuratedSourceWithDetails[]
	>([]);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [isProcessingAI, setIsProcessingAI] = useState(false);
	const [editingAIContent, setEditingAIContent] = useState<
		Record<string, string>
	>({});

	// Estados para control de tokens
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [totalTokens, setTotalTokens] = useState(0);
	const [selectedArtifactsForDialog, setSelectedArtifactsForDialog] = useState<
		SelectedArtifactForDialog[]
	>([]);
	const [previousIterations, setPreviousIterations] = useState<
		PreviousIteration[]
	>([]);
	const [currentTextTokens, setCurrentTextTokens] = useState(0);

	// Refs para acceder a los paneles de fuentes curadas por párrafo
	const curatedSourcesRefs = useRef<
		Record<string, CuratedSourcesPanelRef | null>
	>({});

	// Form state para nuevo/editar párrafo
	const [formData, setFormData] = useState({
		title_tentative: "",
		seed_concept: "",
		human_content: "",
	});

	const loadGalaxyData = async () => {
		setLoading(true);

		// Cargar galaxia
		const galaxiesResult = await getGalaxiesByUniverse(universeId);
		if (galaxiesResult.success && galaxiesResult.data) {
			const foundGalaxy = galaxiesResult.data.find((g) => g.id === galaxyId);
			if (foundGalaxy) {
				setGalaxy(foundGalaxy);
			}
		}

		// Cargar párrafos
		const paragraphsResult = await getParagraphsByGalaxy(galaxyId);
		if (paragraphsResult.success && paragraphsResult.data) {
			setParagraphs(paragraphsResult.data);
		}

		setLoading(false);
	};

	useEffect(() => {
		loadGalaxyData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [galaxyId]);

	const handleCreateParagraph = async () => {
		if (!formData.human_content.trim()) {
			toast({
				title: "Error",
				description: "El contenido es obligatorio",
				variant: "destructive",
			});
			return;
		}

		const result = await createParagraph({
			galaxy_id: galaxyId,
			title_tentative: formData.title_tentative.trim() || undefined,
			seed_concept: formData.seed_concept.trim() || undefined,
			human_content: formData.human_content.trim(),
		});

		if (result.success) {
			toast({
				title: "📝 Párrafo creado",
				description: "Nuevo párrafo agregado a la galaxia",
			});
			setFormData({ title_tentative: "", seed_concept: "", human_content: "" });
			setNewParagraph(false);
			loadGalaxyData();
		} else {
			toast({
				title: "Error al crear párrafo",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}
	};

	const handleUpdateParagraph = async (paragraphId: string) => {
		const result = await updateParagraph(paragraphId, {
			title_tentative: formData.title_tentative.trim() || undefined,
			seed_concept: formData.seed_concept.trim() || undefined,
			human_content: formData.human_content.trim(),
		});

		if (result.success) {
			toast({
				title: "✏️ Párrafo actualizado",
				description: "Cambios guardados",
			});
			setEditingParagraphId(null);
			setFormData({ title_tentative: "", seed_concept: "", human_content: "" });
			loadGalaxyData();
		} else {
			toast({
				title: "Error al actualizar",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}
	};

	const handleDeleteParagraph = async (paragraphId: string) => {
		if (!confirm("¿Eliminar este párrafo?")) return;

		const result = await deleteParagraph(paragraphId);
		if (result.success) {
			toast({
				title: "🗑️ Párrafo eliminado",
				description: "El párrafo ha sido eliminado",
			});
			loadGalaxyData();
		} else {
			toast({
				title: "Error al eliminar",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}
	};

	const handleProcessWithAI = async (
		paragraphId: string,
		archetype: ArchetypeTone,
	) => {
		const paragraph = paragraphs.find((p) => p.id === paragraphId);
		if (!paragraph) return;

		// Obtener fuentes curadas del panel correspondiente
		const panelRef = curatedSourcesRefs.current[paragraphId];
		if (!panelRef) {
			toast({
				title: "Error",
				description: "No se pudo acceder al panel de fuentes",
				variant: "destructive",
			});
			return;
		}

		const selectedArtifacts = panelRef.getSelectedArtifactsWithVersions();

		if (selectedArtifacts.length === 0) {
			toast({
				title: "Sin artefactos",
				description: "Debes seleccionar al menos un artefacto",
				variant: "destructive",
			});
			return;
		}

		// Obtener total de tokens
		const tokensTotal = panelRef.getTotalSelectedTokens();

		// Preparar artefactos para el dialog
		const artifactsForDialog: SelectedArtifactForDialog[] = selectedArtifacts
			.filter((artifact) => artifact.tokenBreakdown)
			.map((artifact, index) => {
				// Calcular tokens seleccionados de este artefacto
				const selectedTokens = Object.entries(
					artifact.selectedElements || {},
				).reduce((sum, [key, isSelected]) => {
					if (isSelected && artifact.tokenBreakdown) {
						const tokenValue =
							artifact.tokenBreakdown[
								key as keyof typeof artifact.tokenBreakdown
							];
						return sum + (typeof tokenValue === "number" ? tokenValue : 0);
					}
					return sum;
				}, 0);

				return {
					artifactId: artifact.artifactId,
					artifactTitle: artifact.metadata?.title || `Artefacto ${index + 1}`,
					artifactNumber: index + 1,
					selectedElements: artifact.selectedElements || {},
					tokenBreakdown: artifact.tokenBreakdown!,
					totalSelectedTokens: selectedTokens,
				};
			});

		// TODO: Obtener iteraciones previas del backend
		// Por ahora, array vacío
		const iterations: PreviousIteration[] = [];

		// Calcular tokens del texto actual (estimación básica)
		const textTokens = Math.ceil(paragraph.human_content.length / 4);

		setSelectedParagraph(paragraph);
		setSelectedArchetype(archetype);
		setTotalTokens(tokensTotal);
		setSelectedArtifactsForDialog(artifactsForDialog);
		setPreviousIterations(iterations);
		setCurrentTextTokens(textTokens);
		setAiDialogOpen(true);

		console.log("🎯 [GalaxyPage] Preparando dialog:", {
			archetype,
			totalTokens: tokensTotal,
			artifactsCount: artifactsForDialog.length,
			textTokens,
		});
	};

	const confirmProcessWithAI = async () => {
		if (!selectedParagraph) return;

		setIsProcessingAI(true);

		toast({
			title: "🤖 Procesando con IA...",
			description: `Arquetipo: ${selectedArchetype}`,
		});

		// Obtener selección granular del panel
		const panelRef = curatedSourcesRefs.current[selectedParagraph.id];
		const selectedArtifacts =
			panelRef?.getSelectedArtifactsWithVersions() || [];

		// Preparar datos de selección granular para el backend
		const selectedArtifactsForBackend = selectedArtifacts.map((artifact) => ({
			artifactId: artifact.artifactId,
			selectedElements: artifact.selectedElements || {},
		}));

		console.log("🎯 [ConfirmProcessWithAI] Enviando al backend:", {
			archetype: selectedArchetype,
			artifactsCount: selectedArtifactsForBackend.length,
			selectedArtifacts: selectedArtifactsForBackend,
		});

		const result = await processWithAI({
			paragraph_id: selectedParagraph.id,
			archetype_tone: selectedArchetype,
			selected_artifacts: selectedArtifactsForBackend,
		} as any);

		if (result.success) {
			toast({
				title: "✨ Procesamiento completado",
				description: "La IA ha generado una propuesta",
			});
			setAiDialogOpen(false);
			setSelectedParagraph(null);

			// FIX 1: Mantener panel abierto tras procesar
			// FIX 2: Actualización optimista sin refresh completo
			setParagraphs((prev) =>
				prev.map((p) =>
					p.id === selectedParagraph.id ?
						{
							...p,
							ai_content: (result as any).data?.ai_content || "",
							status: "ai_proposal" as const,
						}
					:	p,
				),
			);

			// CRÍTICO: Forzar que el panel permanezca expandido
			setExpandedSources((prev) => {
				const newSet = new Set(prev);
				newSet.add(selectedParagraph.id);
				return newSet;
			});

			console.log(
				"🔓 [Panel] Forzando panel expandido para:",
				selectedParagraph.id,
			);
		} else {
			toast({
				title: "Error en procesamiento",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}

		setIsProcessingAI(false);
	};

	const startEditingParagraph = (paragraph: MinotauroParagraph) => {
		setEditingParagraphId(paragraph.id);
		setFormData({
			title_tentative: paragraph.title_tentative || "",
			seed_concept: paragraph.seed_concept || "",
			human_content: paragraph.human_content,
		});
		setNewParagraph(false);
	};

	const cancelEditing = () => {
		setEditingParagraphId(null);
		setNewParagraph(false);
		setFormData({ title_tentative: "", seed_concept: "", human_content: "" });
	};

	const toggleSourcesPanel = (paragraphId: string) => {
		setExpandedSources((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(paragraphId)) {
				newSet.delete(paragraphId);
			} else {
				newSet.add(paragraphId);
			}
			return newSet;
		});
	};

	if (loading) {
		return (
			<div className="container mx-auto p-8">
				<div className="text-center py-12">
					<p className="text-muted-foreground">Cargando galaxia...</p>
				</div>
			</div>
		);
	}

	if (!galaxy) {
		return (
			<div className="container mx-auto p-8">
				<div className="text-center py-12">
					<p className="text-muted-foreground">Galaxia no encontrada</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-8 space-y-6">
			{/* Header con navegación */}
			<div className="flex items-center gap-4">
				<StandardButton
					colorScheme="neutral"
					size="sm"
					onClick={() => router.push(`/cognetica_old/minotauro/${universeId}`)}>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Volver al Universo
				</StandardButton>
			</div>

			{/* Encabezado de la Galaxia */}
			<StandardCard className="p-6 space-y-3">
				<div className="flex justify-between items-start">
					<div className="flex-1">
						<h1 className="text-3xl font-bold flex items-center gap-3">
							🌌 {galaxy.title}
							<StandardBadge colorScheme="neutral">
								{paragraphs.length}{" "}
								{paragraphs.length === 1 ? "párrafo" : "párrafos"}
							</StandardBadge>
						</h1>
						{galaxy.description && (
							<p className="text-muted-foreground mt-2">{galaxy.description}</p>
						)}
					</div>
				</div>
			</StandardCard>

			{/* Botón para nuevo párrafo */}
			{!newParagraph && !editingParagraphId && (
				<div className="flex justify-end">
					<StandardButton
						colorScheme="primary"
						onClick={() => setNewParagraph(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Nuevo Párrafo
					</StandardButton>
				</div>
			)}

			{/* Formulario de nuevo párrafo */}
			{newParagraph && (
				<StandardCard className="p-6 space-y-4 border-2 border-primary">
					<h3 className="text-lg font-semibold">📝 Nuevo Párrafo</h3>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							Título tentativo{" "}
							<span className="text-muted-foreground">(opcional)</span>
						</label>
						<StandardInput
							value={formData.title_tentative}
							onChange={(e) =>
								setFormData({ ...formData, title_tentative: e.target.value })
							}
							placeholder="Ej: Introducción al concepto..."
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							🎯 Semilla / Concepto{" "}
							<span className="text-muted-foreground">(opcional)</span>
						</label>
						<StandardInput
							value={formData.seed_concept}
							onChange={(e) =>
								setFormData({ ...formData, seed_concept: e.target.value })
							}
							placeholder="¿Qué quieres transmitir en este párrafo?"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							Contenido (Markdown) <span className="text-destructive">*</span>
						</label>
						<StandardTextarea
							value={formData.human_content}
							onChange={(e) =>
								setFormData({ ...formData, human_content: e.target.value })
							}
							placeholder="Escribe tu párrafo aquí... Puedes usar Markdown"
							rows={8}
							className="font-mono"
						/>
					</div>

					<div className="flex justify-end gap-2">
						<StandardButton colorScheme="neutral" onClick={cancelEditing}>
							<X className="w-4 h-4 mr-2" />
							Cancelar
						</StandardButton>
						<StandardButton
							colorScheme="primary"
							onClick={handleCreateParagraph}>
							<Save className="w-4 h-4 mr-2" />
							Guardar Párrafo
						</StandardButton>
					</div>
				</StandardCard>
			)}

			{/* Lista de párrafos */}
			<div className="space-y-4">
				{paragraphs.map((paragraph, index) => (
					<StandardCard key={paragraph.id} className="p-6 space-y-4">
						{
							editingParagraphId === paragraph.id ?
								// Modo edición
								<>
									<h3 className="text-lg font-semibold">
										✏️ Editando Párrafo #{index + 1}
									</h3>

									<div className="space-y-2">
										<label className="text-sm font-medium">
											Título tentativo
										</label>
										<StandardInput
											value={formData.title_tentative}
											onChange={(e) =>
												setFormData({
													...formData,
													title_tentative: e.target.value,
												})
											}
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium">
											🎯 Semilla / Concepto
										</label>
										<StandardInput
											value={formData.seed_concept}
											onChange={(e) =>
												setFormData({
													...formData,
													seed_concept: e.target.value,
												})
											}
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium">
											Contenido (Markdown)
										</label>
										<StandardTextarea
											value={formData.human_content}
											onChange={(e) =>
												setFormData({
													...formData,
													human_content: e.target.value,
												})
											}
											rows={8}
											className="font-mono"
										/>
									</div>

									<div className="flex justify-end gap-2">
										<StandardButton
											colorScheme="neutral"
											onClick={cancelEditing}>
											<X className="w-4 h-4 mr-2" />
											Cancelar
										</StandardButton>
										<StandardButton
											colorScheme="primary"
											onClick={() => handleUpdateParagraph(paragraph.id)}>
											<Save className="w-4 h-4 mr-2" />
											Guardar Cambios
										</StandardButton>
									</div>
								</>
								// Modo vista
							:	<>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<span className="text-xl font-bold text-muted-foreground">
													{index + 1}.
												</span>
												{paragraph.title_tentative && (
													<h3 className="text-lg font-semibold">
														{paragraph.title_tentative}
													</h3>
												)}
												<StandardBadge
													colorScheme={
														paragraph.status === "final" ? "success"
														: paragraph.status === "accepted" ?
															"primary"
														: paragraph.status === "ai_proposal" ?
															"warning"
														:	"neutral"
													}
													size="sm">
													{paragraph.status}
												</StandardBadge>
											</div>

											{paragraph.seed_concept && (
												<p className="text-sm text-muted-foreground mb-3">
													🎯 {paragraph.seed_concept}
												</p>
											)}

											<div className="prose prose-sm max-w-none">
												<pre className="whitespace-pre-wrap font-sans bg-muted/50 p-4 rounded">
													{paragraph.human_content}
												</pre>
											</div>

											{paragraph.ai_content && (
												<div className="mt-4 p-4 bg-primary/10 rounded border border-primary/20 space-y-3">
													<div className="flex justify-between items-center">
														<p className="text-sm font-medium">
															💡 Propuesta de IA (Editable):
														</p>
														<StandardBadge colorScheme="warning" size="sm">
															Versión{" "}
															{((paragraph as any).versions?.length || 1) + 1}
														</StandardBadge>
													</div>
													<StandardNote
														value={
															editingAIContent[paragraph.id] ??
															paragraph.ai_content
														}
														onChange={(value) =>
															setEditingAIContent((prev) => ({
																...prev,
																[paragraph.id]: value,
															}))
														}
														placeholder="Edita la propuesta del arquetipo..."
														colorScheme="primary"
														showToolbar={true}
														showPreview={true}
														livePreview={true}
														viewMode="divided"
														minimalToolbar={false}
													/>
													<div className="flex justify-end gap-2">
														<StandardButton
															colorScheme="danger"
															size="sm"
															onClick={() => {
																// Rechazar propuesta - volver a contenido original
																setParagraphs((prev) =>
																	prev.map((p) =>
																		p.id === paragraph.id ?
																			{
																				...p,
																				ai_content: "",
																				status: "draft" as const,
																			}
																		:	p,
																	),
																);
																setEditingAIContent((prev) => {
																	const newState = { ...prev };
																	delete newState[paragraph.id];
																	return newState;
																});
																toast({
																	title: "❌ Propuesta rechazada",
																	description:
																		"Volviendo al contenido original",
																});
															}}>
															❌ Rechazar
														</StandardButton>
														<StandardButton
															colorScheme="success"
															size="sm"
															onClick={async () => {
																const finalContent =
																	editingAIContent[paragraph.id] ??
																	paragraph.ai_content;

																console.log("✅ [Aprobar] Contenido final:", {
																	paragraphId: paragraph.id,
																	contentLength: finalContent.length,
																	wasEdited:
																		editingAIContent[paragraph.id] !==
																		undefined,
																});

																// Aprobar: guardar como nueva versión en human_content
																const result = await updateParagraph(
																	paragraph.id,
																	{
																		human_content: finalContent,
																		status: "accepted",
																	},
																);

																if (result.success) {
																	// Actualización optimista sin refresh
																	setParagraphs((prev) =>
																		prev.map((p) =>
																			p.id === paragraph.id ?
																				{
																					...p,
																					human_content: finalContent,
																					ai_content: "",
																					status: "accepted" as const,
																				}
																			:	p,
																		),
																	);
																	setEditingAIContent((prev) => {
																		const newState = { ...prev };
																		delete newState[paragraph.id];
																		return newState;
																	});
																	toast({
																		title: "✅ Propuesta aprobada",
																		description:
																			"Contenido actualizado como nueva versión",
																	});

																	console.log(
																		"✅ [Aprobar] Actualización optimista completada",
																	);
																} else {
																	toast({
																		title: "Error al aprobar",
																		description:
																			result.error || "Intenta nuevamente",
																		variant: "destructive",
																	});
																}
															}}>
															<CheckCircle2 className="w-4 h-4 mr-2" />
															Aprobar y Continuar
														</StandardButton>
													</div>
												</div>
											)}
										</div>
									</div>

									{/* Acciones del párrafo */}
									<div className="space-y-4 pt-4 border-t">
										<div className="flex justify-between items-center">
											<div className="flex gap-2">
												<StandardButton
													colorScheme="neutral"
													size="sm"
													onClick={() => startEditingParagraph(paragraph)}>
													✏️ Editar
												</StandardButton>
												<StandardButton
													colorScheme="danger"
													size="sm"
													onClick={() => handleDeleteParagraph(paragraph.id)}>
													<Trash2 className="w-4 h-4" />
												</StandardButton>
												{sourcesCount[paragraph.id] === 0 && (
													<StandardButton
														colorScheme="neutral"
														size="sm"
														onClick={() => toggleSourcesPanel(paragraph.id)}>
														<>
															<Sprout className="w-4 h-4 mr-2" /> 🌱 Conectar
															Jardines/Artefactos
														</>
													</StandardButton>
												)}
											</div>

											{/* Arquetipos */}
											{sourcesCount[paragraph.id] > 0 && (
												<div className="flex gap-2">
													<StandardButton
														colorScheme="warning"
														size="sm"
														onClick={() =>
															handleProcessWithAI(paragraph.id, "bufon")
														}>
														🃏 Bufón
													</StandardButton>
													<StandardButton
														colorScheme="primary"
														size="sm"
														onClick={() =>
															handleProcessWithAI(paragraph.id, "cronos")
														}>
														📊 Cronos
													</StandardButton>
													<StandardButton
														colorScheme="success"
														size="sm"
														onClick={() =>
															handleProcessWithAI(paragraph.id, "deslixador")
														}>
														✍️ Deslixador
													</StandardButton>
													<StandardButton
														colorScheme="accent"
														size="sm"
														onClick={() =>
															handleProcessWithAI(paragraph.id, "colega")
														}>
														☕ Colega
													</StandardButton>
												</div>
											)}
										</div>

										{/* Panel de fuentes curadas (expandible) */}
										{expandedSources.has(paragraph.id) && proyectoActual && (
											<div className="pt-4 border-t space-y-4">
												<CuratedSourcesPanel
													ref={(el) => {
														curatedSourcesRefs.current[paragraph.id] = el;
													}}
													galaxyId={galaxyId}
													projectId={proyectoActual.id}
													onCountChange={(count) => {
														setSourcesCount((prev) => ({
															...prev,
															[paragraph.id]: count,
														}));
													}}
												/>

												{/* Barra de progreso de tokens */}
												{sourcesCount[paragraph.id] > 0 &&
													curatedSourcesRefs.current[paragraph.id] && (
														<TokenProgressBar
															currentTokens={
																curatedSourcesRefs.current[
																	paragraph.id
																]?.getTotalSelectedTokens() || 0
															}
															maxTokens={130000}
															colorScheme="primary"
														/>
													)}
											</div>
										)}
									</div>
								</>

						}
					</StandardCard>
				))}
			</div>

			{/* Ayuda */}
			{paragraphs.length === 0 && !newParagraph && (
				<StandardCard className="p-12 text-center space-y-4">
					<div className="text-6xl">📝</div>
					<h3 className="text-xl font-semibold">Comienza a escribir</h3>
					<p className="text-muted-foreground max-w-md mx-auto">
						Los párrafos son la unidad mínima de co-creación. Escribe tu
						contenido y luego procesa con los arquetipos de IA.
					</p>
					<StandardButton
						colorScheme="primary"
						onClick={() => setNewParagraph(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Crear Primer Párrafo
					</StandardButton>
				</StandardCard>
			)}
			{/* Diálogo de confirmación con resumen de tokens */}
			{selectedParagraph && (
				<ArchetypeConfirmationDialog
					isOpen={aiDialogOpen}
					onClose={() => {
						setAiDialogOpen(false);
						setSelectedParagraph(null);
					}}
					onConfirm={confirmProcessWithAI}
					archetypeName={selectedArchetype}
					selectedArtifacts={selectedArtifactsForDialog}
					previousIterations={previousIterations}
					currentText={selectedParagraph.human_content}
					currentTextTokens={currentTextTokens}
					currentVersion={1}
				/>
			)}
		</div>
	);
}
