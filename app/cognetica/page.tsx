"use client";

import React, {
	useEffect,
	useState,
	useCallback,
	useRef,
	useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Plus,
	FileAudio,
	FileText,
	Video,
	Clock,
	RefreshCw,
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	FileCode,
	FileSpreadsheet,
	Presentation,
	Image as ImageIcon,
	Pencil,
	Check,
	X,
	Wand2,
	Trash2,
	AlertTriangle,
} from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	getFilteredArtifacts,
	type ArtifactWithCounts,
	type CognitiveElementType,
} from "@/lib/actions/cognetica-filters-actions";
import { updateArtifactTitle } from "@/lib/actions/cognetica-actions";
import {
	deleteArtifact,
	canDeleteArtifact,
} from "@/lib/actions/cognetica-delete-actions";
import { toast } from "sonner";
import { formatTokenCount } from "@/lib/utils/token-estimator";
import { AdvancedSearch } from "./components/AdvancedSearch";
import { SmartBreadcrumb } from "./components/SmartBreadcrumb";
import { CognitiveElementDrawer } from "./components/CognitiveElementDrawer";
import { useCogneticaPreferences } from "@/hooks/use-cognetica-preferences";

// Tipos específicos que ahora están en la BD
type ArtifactType =
	| "audio"
	| "video"
	| "markdown"
	| "pdf_report"
	| "pdf_slides"
	| "image";

// Limpia el título: quita extensión, reemplaza _ por espacio, capitaliza respetando emojis
function cleanTitle(raw: string): string {
	// Quitar extensión de archivo (.md, .pdf, .mp3, etc.)
	let t = raw.replace(/\.[a-zA-Z0-9]{1,5}$/, "");
	// Reemplazar _ y - por espacio
	t = t.replace(/[_-]/g, " ");
	// Colapsar espacios múltiples
	t = t.replace(/\s+/g, " ").trim();
	// Capitalizar primera letra que sea alfabética (saltando emojis/iconos al inicio)
	t = t.replace(
		/^([^a-zA-ZáéíóúÁÉÍÓÚñÑ]*)([a-zA-ZáéíóúÁÉÍÓÚñÑ])/,
		(_, prefix, letter) => prefix + letter.toUpperCase(),
	);
	return t;
}

export default function CogneticaDashboard() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const auth = useAuth();

	// ✅ Hook de persistencia de preferencias
	const { preferences, updatePreference, isLoaded } = useCogneticaPreferences();

	const [artifacts, setArtifacts] = useState<ArtifactWithCounts[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchInput, setSearchInput] = useState(""); // Input del usuario (inmediato)
	const [searchQuery, setSearchQuery] = useState(""); // Query real con debounce
	const [currentPage, setCurrentPage] = useState(1);

	// Estados de filtros (no persistentes, se resetean al navegar)
	const [selectedSeed, setSelectedSeed] = useState<string | undefined>();
	const [selectedDiscipline, setSelectedDiscipline] = useState<
		string | undefined
	>();
	const [selectedTheory, setSelectedTheory] = useState<string | undefined>();
	const [selectedThinker, setSelectedThinker] = useState<string | undefined>();

	// Estados de edición de título
	const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
	const [editingTitleValue, setEditingTitleValue] = useState("");
	const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
	const titleInputRef = useRef<HTMLInputElement>(null);

	// Estados para borrado de artefactos
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [artifactToDelete, setArtifactToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [canDelete, setCanDelete] = useState(true);
	const [deleteReason, setDeleteReason] = useState<string | null>(null);

	// ✅ Usar preferencias persistentes con useMemo para estabilizar referencias
	const selectedTypes = useMemo(
		() => (preferences.selectedTypes || []) as ArtifactType[],
		[preferences.selectedTypes],
	);

	// ✅ Crear clave estable para el useEffect basada en el contenido del array
	const selectedTypesKey = useMemo(
		() => JSON.stringify(selectedTypes),
		[selectedTypes],
	);

	const showSeeds = preferences.showSeeds ?? true;
	const showDisciplines = preferences.showDisciplines ?? true;
	const showTheories = preferences.showTheories ?? true;
	const showThinkers = preferences.showThinkers ?? true;
	const showMicelio = preferences.showMicelio ?? true;
	const emojiMode = preferences.emojiMode ?? false;
	const gardenFilter = preferences.gardenFilter;

	// ✅ Handlers que actualizan y persisten preferencias
	const setSelectedTypes = useCallback(
		(types: ArtifactType[]) => {
			updatePreference("selectedTypes", types);
		},
		[updatePreference],
	);

	const setShowSeeds = useCallback(
		(value: boolean) => {
			updatePreference("showSeeds", value);
		},
		[updatePreference],
	);

	const setShowDisciplines = useCallback(
		(value: boolean) => {
			updatePreference("showDisciplines", value);
		},
		[updatePreference],
	);

	const setShowTheories = useCallback(
		(value: boolean) => {
			updatePreference("showTheories", value);
		},
		[updatePreference],
	);

	const setShowThinkers = useCallback(
		(value: boolean) => {
			updatePreference("showThinkers", value);
		},
		[updatePreference],
	);

	const setShowMicelio = useCallback(
		(value: boolean) => {
			updatePreference("showMicelio", value);
		},
		[updatePreference],
	);

	const setEmojiMode = useCallback(
		(value: boolean) => {
			updatePreference("emojiMode", value);
		},
		[updatePreference],
	);

	const setGardenFilter = useCallback(
		(value: "with" | "without" | undefined) => {
			updatePreference("gardenFilter", value);
		},
		[updatePreference],
	);

	const handleEmojiModeChange = useCallback(
		(val: boolean) => {
			setEmojiMode(val);
		},
		[setEmojiMode],
	);

	const startEditTitle = useCallback((artifact: ArtifactWithCounts) => {
		setEditingTitleId(artifact.id);
		setEditingTitleValue(artifact.title);
		setTimeout(() => titleInputRef.current?.select(), 50);
	}, []);

	const cancelEditTitle = useCallback(() => {
		setEditingTitleId(null);
		setEditingTitleValue("");
	}, []);

	const saveTitle = useCallback(
		async (artifactId: string) => {
			const val = editingTitleValue.trim();
			if (!val) return;
			setSavingTitleId(artifactId);
			const result = await updateArtifactTitle(artifactId, val);
			if (result.success) {
				setArtifacts((prev) =>
					prev.map((a) => (a.id === artifactId ? { ...a, title: val } : a)),
				);
				setEditingTitleId(null);
			}
			setSavingTitleId(null);
		},
		[editingTitleValue],
	);

	// Funciones para manejo de borrado de artefactos
	const handleDeleteClick = useCallback(
		async (artifactId: string, title: string) => {
			const result = await canDeleteArtifact(artifactId);
			setCanDelete(result.canDelete);
			setDeleteReason(result.reason);
			setArtifactToDelete({ id: artifactId, title });
			setDeleteDialogOpen(true);
		},
		[],
	);

	const handleConfirmDelete = useCallback(async () => {
		if (!artifactToDelete) return;

		setDeletingId(artifactToDelete.id);
		toast.loading("Eliminando artefacto...", { id: "delete-artifact" });

		try {
			const result = await deleteArtifact(artifactToDelete.id);

			if (result.success) {
				toast.success("¡Artefacto eliminado exitosamente!", {
					id: "delete-artifact",
				});
				setArtifacts((prev) =>
					prev.filter((a) => a.id !== artifactToDelete.id),
				);
			} else {
				toast.error(result.error || "Error eliminando artefacto", {
					id: "delete-artifact",
				});
			}
		} catch (error) {
			toast.error("Error inesperado al eliminar", { id: "delete-artifact" });
		} finally {
			setDeletingId(null);
			setDeleteDialogOpen(false);
			setArtifactToDelete(null);
		}
	}, [artifactToDelete]);

	const [drawerElement, setDrawerElement] = useState<{
		type: CognitiveElementType;
		value: string;
		label: string;
	} | null>(null);
	const itemsPerPage = 20;

	// Handler para búsqueda avanzada
	const handleAdvancedSearchSelect = (
		type: "seed" | "discipline" | "theory" | "thinker",
		value: string,
	) => {
		// Limpiar otros filtros
		setSelectedSeed(undefined);
		setSelectedDiscipline(undefined);
		setSelectedTheory(undefined);
		setSelectedThinker(undefined);

		// Aplicar el filtro seleccionado
		switch (type) {
			case "seed":
				setSelectedSeed(value);
				setShowSeeds(true);
				break;
			case "discipline":
				setSelectedDiscipline(value);
				setShowDisciplines(true);
				break;
			case "theory":
				setSelectedTheory(value);
				setShowTheories(true);
				break;
			case "thinker":
				setSelectedThinker(value);
				setShowThinkers(true);
				break;
		}
	};

	// Aplicar filtros desde URL al cargar y auto-marcar elementos
	useEffect(() => {
		const seed = searchParams.get("seed");
		const discipline = searchParams.get("discipline");
		const theory = searchParams.get("theory");
		const thinker = searchParams.get("thinker");

		if (seed) {
			setSelectedSeed(decodeURIComponent(seed));
			setShowSeeds(true); // Auto-marcar si viene desde detalle
		}
		if (discipline) {
			setSelectedDiscipline(discipline);
			setShowDisciplines(true);
		}
		if (theory) {
			setSelectedTheory(theory);
			setShowTheories(true);
		}
		if (thinker) {
			setSelectedThinker(thinker);
			setShowThinkers(true);
		}
	}, [searchParams]);

	// Debounce para búsqueda (500ms)
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(searchInput);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchInput]);

	// Cargar artefactos filtrados desde backend
	useEffect(() => {
		async function loadArtifacts() {
			if (!isLoaded) return; // Esperar a que se carguen preferencias

			if (!auth.proyectoActual?.id || !auth.user?.id) {
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				console.log(
					"🔍 [Cognetica] Cargando artefactos filtrados para proyecto:",
					auth.proyectoActual.id,
				);

				const result = await getFilteredArtifacts(auth.proyectoActual.id, {
					searchText: searchQuery,
					types: selectedTypes.length > 0 ? selectedTypes : undefined,
					seedContent: selectedSeed,
					disciplineId: selectedDiscipline,
					theoryId: selectedTheory,
					thinkerId: selectedThinker,
					hasGardens: gardenFilter,
				});

				if (!result.success || !result.data) {
					console.error(
						"❌ [Cognetica] Error cargando artefactos:",
						result.error,
					);
					setError(result.error || "Error desconocido");
					setArtifacts([]);
				} else {
					console.log(
						"✅ [Cognetica] Artefactos cargados:",
						result.data.length,
					);
					setArtifacts(result.data);
				}
			} catch (err) {
				console.error("❌ [Cognetica] Error inesperado:", err);
				setError("Error inesperado al cargar los datos");
				setArtifacts([]);
			} finally {
				setLoading(false);
			}
		}

		loadArtifacts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isLoaded,
		auth.proyectoActual?.id,
		auth.user?.id,
		searchQuery,
		selectedTypesKey,
		selectedSeed,
		selectedDiscipline,
		selectedTheory,
		selectedThinker,
		gardenFilter,
	]);

	// Los artefactos ya vienen filtrados del backend
	const filteredArtifacts = artifacts;

	// Paginación
	const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedArtifacts = filteredArtifacts.slice(startIndex, endIndex);

	// Reset página cuando cambian los artefactos
	useEffect(() => {
		setCurrentPage(1);
	}, [artifacts.length]);

	// Handler para toggle de tipos
	const handleTypeToggle = useCallback(
		(type: ArtifactType) => {
			const newTypes =
				selectedTypes.includes(type) ?
					selectedTypes.filter((t) => t !== type)
				:	[...selectedTypes, type];
			setSelectedTypes(newTypes);
		},
		[selectedTypes, setSelectedTypes],
	);

	// Formatear duración
	const formatDuration = (seconds: number | null): string => {
		if (!seconds) return "-";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins >= 60) {
			const hrs = Math.floor(mins / 60);
			const remainingMins = mins % 60;
			return `${hrs}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Formatear fecha relativa
	const formatDate = (dateStr: string | null): string => {
		if (!dateStr) return "-";
		try {
			return formatDistanceToNow(new Date(dateStr), {
				addSuffix: true,
				locale: es,
			});
		} catch {
			return "-";
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-4xl font-bold tracking-tight text-foreground">
						Cognética Forense
					</h1>
					<p className="text-sm text-muted-foreground mt-1 max-w-2xl">
						Curatoría inteligente de artefactos multiformato: calibra,
						metaboliza y genera formatos triádicos con trazabilidad HS256.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<StandardButton
						colorScheme="accent"
						styleType="outline"
						size="sm"
						onClick={() => router.push("/cognetica/jardines")}>
						🌱 Jardines
					</StandardButton>
					<StandardButton
						colorScheme="primary"
						leftIcon={Plus}
						onClick={() => router.push("/cognetica/nuevo")}>
						Nuevo Artefacto
					</StandardButton>
				</div>
			</div>

			{/* Breadcrumb inteligente */}
			<SmartBreadcrumb />

			<div className="grid grid-cols-1 gap-6">
				{/* Lista de Artefactos */}
				<StandardCard>
					<StandardCard.Header className="flex items-center justify-between">
						<StandardText size="lg" weight="bold">
							Artefactos ({filteredArtifacts.length})
						</StandardText>
						{loading && (
							<RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
						)}
					</StandardCard.Header>

					{/* Barra de búsqueda y filtros reorganizada */}
					{!loading && artifacts.length > 0 && (
						<div className="px-6 pt-4 pb-2 space-y-3">
							{/* Línea 1: Búsqueda + Filtros de tipo de documento */}
							<div className="flex flex-col md:flex-row gap-3">
								<div className="md:w-64">
									<StandardInput
										placeholder="Buscar... (espera 500ms)"
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										size="sm"
									/>
								</div>

								<div className="flex-1 flex flex-wrap items-center gap-2">
									<StandardText
										size="xs"
										weight="medium"
										colorScheme="neutral"
										className="mr-1">
										Documentos:
									</StandardText>
									<StandardCheckbox
										label="🎙️ Audio"
										checked={selectedTypes.includes("audio")}
										onChange={() => handleTypeToggle("audio")}
										size="sm"
									/>
									<StandardCheckbox
										label="🎬 Video"
										checked={selectedTypes.includes("video")}
										onChange={() => handleTypeToggle("video")}
										size="sm"
									/>
									<StandardCheckbox
										label="📄 PDF"
										checked={selectedTypes.includes("pdf_report")}
										onChange={() => handleTypeToggle("pdf_report")}
										size="sm"
									/>
									<StandardCheckbox
										label="📽️ Slides"
										checked={selectedTypes.includes("pdf_slides")}
										onChange={() => handleTypeToggle("pdf_slides")}
										size="sm"
									/>
									<StandardCheckbox
										label="📝 MD"
										checked={selectedTypes.includes("markdown")}
										onChange={() => handleTypeToggle("markdown")}
										size="sm"
									/>
									<StandardCheckbox
										label="🖼️ Img"
										checked={selectedTypes.includes("image")}
										onChange={() => handleTypeToggle("image")}
										size="sm"
									/>
								</div>
							</div>

							{/* Línea 2: Botones toggle para elementos cognitivos + Búsqueda avanzada */}
							<div className="flex flex-wrap items-center gap-2 pt-2 border-t">
								<StandardText
									size="xs"
									weight="medium"
									colorScheme="neutral"
									className="mr-1">
									Elementos:
								</StandardText>
								<StandardButton
									size="xs"
									colorScheme="accent"
									styleType={showSeeds ? "subtle" : "outline"}
									onClick={() => setShowSeeds(!showSeeds)}>
									🌱 Semillas
								</StandardButton>
								<StandardButton
									size="xs"
									colorScheme="primary"
									styleType={showDisciplines ? "subtle" : "outline"}
									onClick={() => setShowDisciplines(!showDisciplines)}>
									🔬 Disciplinas
								</StandardButton>
								<StandardButton
									size="xs"
									colorScheme="secondary"
									styleType={showTheories ? "subtle" : "outline"}
									onClick={() => setShowTheories(!showTheories)}>
									💡 Teorías
								</StandardButton>
								<StandardButton
									size="xs"
									colorScheme="tertiary"
									styleType={showThinkers ? "subtle" : "outline"}
									onClick={() => setShowThinkers(!showThinkers)}>
									👤 Pensadores
								</StandardButton>
								<StandardButton
									size="xs"
									colorScheme="success"
									styleType={showMicelio ? "subtle" : "outline"}
									onClick={() => setShowMicelio(!showMicelio)}>
									🍄 Micelio
								</StandardButton>

								{/* Separador visual */}
								<div className="h-6 w-px bg-border mx-1" />

								{/* Filtro de jardines */}
								<StandardText
									size="xs"
									weight="medium"
									colorScheme="neutral"
									className="mr-1">
									Jardines:
								</StandardText>
								<StandardButton
									size="xs"
									colorScheme="accent"
									styleType={gardenFilter === "with" ? "subtle" : "outline"}
									onClick={() =>
										setGardenFilter(
											gardenFilter === "with" ? undefined : "with",
										)
									}>
									🌱 Con
								</StandardButton>
								<StandardButton
									size="xs"
									colorScheme="neutral"
									styleType={gardenFilter === "without" ? "subtle" : "outline"}
									onClick={() =>
										setGardenFilter(
											gardenFilter === "without" ? undefined : "without",
										)
									}>
									Sin
								</StandardButton>

								{/* Separador visual */}
								<div className="h-6 w-px bg-border mx-1" />

								{/* Switch modo emoji */}
								<div className="flex items-center gap-1.5">
									<span className="text-xs text-neutral-400">🔤</span>
									<StandardSwitch
										colorScheme="tertiary"
										size="sm"
										checked={emojiMode}
										onCheckedChange={handleEmojiModeChange}
									/>
									<span className="text-base leading-none">🎨</span>
								</div>

								{/* Búsqueda avanzada */}
								{auth.proyectoActual?.id && (
									<AdvancedSearch
										projectId={auth.proyectoActual.id}
										onSelectElement={handleAdvancedSearchSelect}
									/>
								)}
							</div>
						</div>
					)}
					<StandardCard.Content className="p-0">
						{/* Estado de error */}
						{error && (
							<div className="p-6 flex items-center gap-3 text-red-600">
								<AlertCircle className="h-5 w-5" />
								<StandardText colorScheme="danger">{error}</StandardText>
							</div>
						)}

						{/* Estado vacío - sin artefactos */}
						{!loading && !error && artifacts.length === 0 && (
							<StandardEmptyState
								icon={FileAudio}
								title="No hay artefactos en este proyecto"
								description="Sube tu primer audio, video o documento para iniciar el análisis cognitivo."
								action={
									<StandardButton
										colorScheme="primary"
										leftIcon={Plus}
										onClick={() => router.push("/cognetica/nuevo")}>
										Cargar Artefacto
									</StandardButton>
								}
							/>
						)}

						{/* Estado vacío - búsqueda sin resultados */}
						{!loading &&
							!error &&
							artifacts.length > 0 &&
							filteredArtifacts.length === 0 && (
								<div className="p-6 text-center">
									<StandardText colorScheme="neutral">
										No se encontraron artefactos con &quot;{searchQuery}&quot;
									</StandardText>
								</div>
							)}

						{/* Estado de carga */}
						{loading && (
							<div className="flex items-center justify-center py-20">
								<SustratoLoadingLogo
									size={64}
									variant="spin-pulse"
									speed="normal"
									showText={true}
									text="Cargando artefactos..."
									breathingEffect={true}
									colorTransition={true}
								/>
							</div>
						)}

						{/* Lista de artefactos */}
						{!loading && !error && paginatedArtifacts.length > 0 && (
							<div className="divide-y divide-neutral-100">
								{paginatedArtifacts.map(
									(artifact: ArtifactWithCounts, idx: number) => (
										<div
											key={artifact.id}
											className={`p-4 transition-colors group ${
												idx % 2 === 0 ?
													"bg-transparent hover:bg-neutral-50"
												:	"bg-tertiary/5 hover:bg-tertiary/10"
											}`}>
											<div className="flex items-start justify-between gap-4">
												<div className="flex items-center gap-4 flex-1">
													{/* Icono con círculo estético - MÁS GRANDE */}
													{emojiMode ?
														<span
															className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-3xl leading-none"
															style={{
																background:
																	artifact.status === "error" ?
																		"radial-gradient(circle, var(--color-danger-100, #fee) 60%, var(--color-danger-200, #fcc) 100%)"
																	:	"radial-gradient(circle, var(--color-accent-100, #f0e6ff) 60%, var(--color-accent-200, #ddd0f7) 100%)",
															}}
															title={artifact.type}>
															{artifact.type === "audio" ?
																"🎙️"
															: artifact.type === "video" ?
																"🎬"
															: artifact.type === "markdown" ?
																"📝"
															: artifact.type === "pdf_report" ?
																"📊"
															: artifact.type === "pdf_slides" ?
																"📽️"
															: artifact.type === "image" ?
																"🖼️"
															:	"📄"}
														</span>
													:	<div
															className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
															style={{
																background:
																	artifact.status === "error" ?
																		"radial-gradient(circle, var(--color-danger-100, #fee) 60%, var(--color-danger-200, #fcc) 100%)"
																	:	"radial-gradient(circle, var(--color-neutral-100, #f5f5f5) 60%, var(--color-neutral-200, #e5e5e5) 100%)",
															}}>
															<StandardIcon
																colorScheme={
																	artifact.status === "completed" ? "success"
																	: artifact.status === "error" ?
																		"danger"
																	:	"warning"
																}
																styleType="outline"
																size="lg">
																{artifact.type === "audio" ?
																	<FileAudio />
																: artifact.type === "video" ?
																	<Video />
																: artifact.type === "markdown" ?
																	<FileCode />
																: artifact.type === "pdf_report" ?
																	<FileSpreadsheet />
																: artifact.type === "pdf_slides" ?
																	<Presentation />
																: artifact.type === "image" ?
																	<ImageIcon />
																:	<FileText />}
															</StandardIcon>
														</div>
													}
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5 group/title">
															{editingTitleId === artifact.id ?
																/* Edición inline */
																<div className="flex items-center gap-1.5 flex-1 min-w-0">
																	<input
																		ref={titleInputRef}
																		value={editingTitleValue}
																		onChange={(e) =>
																			setEditingTitleValue(e.target.value)
																		}
																		onKeyDown={(e) => {
																			if (e.key === "Enter")
																				saveTitle(artifact.id);
																			if (e.key === "Escape") cancelEditTitle();
																		}}
																		className="flex-1 min-w-0 text-base font-semibold bg-transparent border-b-2 border-primary-400 outline-none text-foreground px-0.5"
																		autoFocus
																	/>
																	<button
																		title="Limpiar título automáticamente"
																		onClick={() =>
																			setEditingTitleValue(
																				cleanTitle(editingTitleValue),
																			)
																		}
																		className="p-1 rounded text-neutral-400 hover:text-accent-500 hover:bg-accent-50 transition-colors flex-shrink-0">
																		<Wand2 className="h-3.5 w-3.5" />
																	</button>
																	<button
																		title="Guardar (Enter)"
																		onClick={() => saveTitle(artifact.id)}
																		disabled={savingTitleId === artifact.id}
																		className="p-1 rounded text-success hover:bg-green-50 transition-colors flex-shrink-0 disabled:opacity-50">
																		<Check className="h-3.5 w-3.5" />
																	</button>
																	<button
																		title="Cancelar (Esc)"
																		onClick={cancelEditTitle}
																		className="p-1 rounded text-neutral-400 hover:text-danger hover:bg-red-50 transition-colors flex-shrink-0">
																		<X className="h-3.5 w-3.5" />
																	</button>
																</div>
															:	/* Título normal con botón editar al hover - MÁS GRANDE */
																<>
																	<h3
																		className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
																		onClick={(e: React.MouseEvent) => {
																			e.stopPropagation();
																			router.push(`/cognetica/${artifact.id}`);
																		}}>
																		{artifact.title}
																	</h3>
																	<button
																		title="Editar título"
																		onClick={(e) => {
																			e.stopPropagation();
																			startEditTitle(artifact);
																		}}
																		className="opacity-0 group-hover/title:opacity-100 p-1 rounded text-neutral-300 hover:text-primary hover:bg-neutral-100 transition-all flex-shrink-0">
																		<Pencil className="h-3 w-3" />
																	</button>
																</>
															}
															{/* Indicadores de estado: micelio y chat */}
															{!editingTitleId && artifact.has_chronicle && (
																<span
																	title="Metabolizado por Micelio Cronista"
																	className="text-lg leading-none flex-shrink-0">
																	🍄
																</span>
															)}
															{!editingTitleId && artifact.has_chat && (
																<span
																	title="Tiene sesiones de Chat Quipu"
																	className="text-lg leading-none flex-shrink-0">
																	🪢
																</span>
															)}
															{!editingTitleId && artifact.garden_count > 0 && (
																<button
																	title={`Ver ${artifact.garden_count} ${artifact.garden_count === 1 ? "jardín" : "jardines"} donde aparece`}
																	onClick={(e) => {
																		e.stopPropagation();
																		router.push("/cognetica/jardines");
																	}}
																	className="text-lg leading-none flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
																	🌱
																</button>
															)}
															{/* Botón de borrado al final derecho */}
															{!editingTitleId && (
																<div className="ml-auto flex-shrink-0">
																	<StandardButton
																		size="xs"
																		styleType="outline"
																		colorScheme="danger"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleDeleteClick(
																				artifact.id,
																				artifact.title,
																			);
																		}}
																		disabled={deletingId === artifact.id}
																		className="opacity-0 group-hover/title:opacity-100 transition-opacity">
																		<Trash2 className="h-3 w-3" />
																	</StandardButton>
																</div>
															)}
														</div>
														<div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
															<Clock className="h-3 w-3" />
															<span>{formatDate(artifact.created_at)}</span>
															{artifact.duration_seconds && (
																<>
																	<span>•</span>
																	<span>
																		{formatDuration(artifact.duration_seconds)}
																	</span>
																</>
															)}
															{artifact.micelio_destilada && (
																<>
																	<span>•</span>
																	<span title="Tokens aproximados del corpus completo (estimado desde destilada)">
																		~
																		{formatTokenCount(
																			Math.round(
																				(artifact.micelio_destilada.length *
																					12) /
																					4,
																			),
																		)}{" "}
																		tk
																	</span>
																</>
															)}
														</div>
													</div>
												</div>

												{/* Badge solo si está procesando o tiene error explícito */}
												{artifact.status && artifact.status !== "completed" && (
													<div className="flex items-center gap-3">
														<StandardBadge
															colorScheme={
																artifact.status === "error" ? "danger"
																: (
																	artifact.status === "analyzing" ||
																	artifact.status === "transcribing"
																) ?
																	"warning"
																:	"neutral"
															}
															size="sm">
															{artifact.status === "error" ?
																"Error"
															: artifact.status === "analyzing" ?
																"Analizando..."
															: artifact.status === "transcribing" ?
																"Transcribiendo..."
															: artifact.status === "uploading" ?
																"Subiendo..."
															:	"Pendiente"}
														</StandardBadge>
													</div>
												)}
											</div>

											{/* Badges de elementos cognitivos - clicables para filtrar */}
											{(artifact.seeds?.length ||
												artifact.disciplines?.length ||
												artifact.theories?.length ||
												artifact.thinkers?.length ||
												artifact.has_chronicle) && (
												<div className="flex flex-wrap gap-2 mt-3 ml-12">
													{showSeeds &&
														artifact.seeds?.map((seed, sidx) => (
															<span
																key={`seed-${sidx}`}
																className="inline-flex items-center gap-0.5">
																<StandardBadge
																	colorScheme="accent"
																	styleType="subtle"
																	size="xs"
																	className="cursor-pointer hover:scale-105 transition-transform"
																	onClick={(e) => {
																		e.stopPropagation();
																		setSelectedSeed(
																			selectedSeed === seed.content ?
																				undefined
																			:	seed.content,
																		);
																	}}>
																	🌱 {seed.content}
																</StandardBadge>
																<button
																	title="Ver todos los artefactos con esta semilla"
																	className="text-neutral-300 hover:text-accent-500 transition-colors text-xs leading-none px-0.5"
																	onClick={(e) => {
																		e.stopPropagation();
																		setDrawerElement({
																			type: "seed",
																			value: seed.content,
																			label: seed.content,
																		});
																	}}>
																	⬡
																</button>
															</span>
														))}
													{showDisciplines &&
														artifact.disciplines?.map((disc) => (
															<span
																key={disc.id}
																className="inline-flex items-center gap-0.5">
																<StandardBadge
																	colorScheme="primary"
																	styleType="subtle"
																	size="xs"
																	className="cursor-pointer hover:scale-105 transition-transform"
																	onClick={(e) => {
																		e.stopPropagation();
																		setSelectedDiscipline(
																			selectedDiscipline === disc.id ?
																				undefined
																			:	disc.id,
																		);
																	}}>
																	🔬 {disc.name}
																</StandardBadge>
																<button
																	title="Ver todos los artefactos con esta disciplina"
																	className="text-neutral-300 hover:text-primary-500 transition-colors text-xs leading-none px-0.5"
																	onClick={(e) => {
																		e.stopPropagation();
																		setDrawerElement({
																			type: "discipline",
																			value: disc.id,
																			label: disc.name,
																		});
																	}}>
																	⬡
																</button>
															</span>
														))}
													{showTheories &&
														artifact.theories?.map((theory) => (
															<span
																key={theory.id}
																className="inline-flex items-center gap-0.5">
																<StandardBadge
																	colorScheme="secondary"
																	styleType="subtle"
																	size="xs"
																	className="cursor-pointer hover:scale-105 transition-transform"
																	onClick={(e) => {
																		e.stopPropagation();
																		setSelectedTheory(
																			selectedTheory === theory.id ?
																				undefined
																			:	theory.id,
																		);
																	}}>
																	💡 {theory.name}
																</StandardBadge>
																<button
																	title="Ver todos los artefactos con esta teoría"
																	className="text-neutral-300 hover:text-secondary-500 transition-colors text-xs leading-none px-0.5"
																	onClick={(e) => {
																		e.stopPropagation();
																		setDrawerElement({
																			type: "theory",
																			value: theory.id,
																			label: theory.name,
																		});
																	}}>
																	⬡
																</button>
															</span>
														))}
													{showThinkers &&
														artifact.thinkers?.map((thinker) => (
															<span
																key={thinker.id}
																className="inline-flex items-center gap-0.5">
																<StandardBadge
																	colorScheme="tertiary"
																	styleType="subtle"
																	size="xs"
																	className="cursor-pointer hover:scale-105 transition-transform"
																	onClick={(e) => {
																		e.stopPropagation();
																		setSelectedThinker(
																			selectedThinker === thinker.id ?
																				undefined
																			:	thinker.id,
																		);
																	}}>
																	👤 {thinker.name}
																</StandardBadge>
																<button
																	title="Ver todos los artefactos con este pensador"
																	className="text-neutral-300 hover:text-tertiary-500 transition-colors text-xs leading-none px-0.5"
																	onClick={(e) => {
																		e.stopPropagation();
																		setDrawerElement({
																			type: "thinker",
																			value: thinker.id,
																			label: thinker.name,
																		});
																	}}>
																	⬡
																</button>
															</span>
														))}
													{/* Badge Micelio + destilada siempre visible cuando showMicelio activo */}
													{showMicelio && artifact.has_chronicle && (
														<>
															<StandardBadge
																colorScheme="success"
																styleType="subtle"
																size="xs">
																🍄 Micelio
															</StandardBadge>
															{artifact.micelio_destilada && (
																<StandardCard
																	colorScheme="neutral"
																	styleType="subtle"
																	className="w-full mt-2 border-l-4 border-l-tertiary-400"
																	onClick={(e) => e.stopPropagation()}>
																	<StandardCard.Content className="p-3">
																		<StandardText
																			size="xs"
																			className="leading-relaxed">
																			{artifact.micelio_destilada}
																		</StandardText>
																	</StandardCard.Content>
																</StandardCard>
															)}
														</>
													)}
												</div>
											)}
										</div>
									),
								)}
							</div>
						)}

						{/* Paginación */}
						{!loading && !error && filteredArtifacts.length > itemsPerPage && (
							<div className="px-6 py-4 flex items-center justify-between border-t border-neutral-100">
								<StandardText size="sm" colorScheme="neutral">
									Mostrando {startIndex + 1}-
									{Math.min(endIndex, filteredArtifacts.length)} de{" "}
									{filteredArtifacts.length}
								</StandardText>
								<div className="flex items-center gap-2">
									<StandardButton
										size="sm"
										styleType="outline"
										leftIcon={ChevronLeft}
										disabled={currentPage === 1}
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
										Anterior
									</StandardButton>
									<StandardText size="sm" colorScheme="neutral">
										Página {currentPage} de {totalPages}
									</StandardText>
									<StandardButton
										size="sm"
										styleType="outline"
										rightIcon={ChevronRight}
										disabled={currentPage === totalPages}
										onClick={() =>
											setCurrentPage((p) => Math.min(totalPages, p + 1))
										}>
										Siguiente
									</StandardButton>
								</div>
							</div>
						)}
					</StandardCard.Content>
				</StandardCard>
			</div>

			{/* Drawer de isometría cognitiva */}
			{auth.proyectoActual?.id && (
				<CognitiveElementDrawer
					projectId={auth.proyectoActual.id}
					element={drawerElement}
					onClose={() => setDrawerElement(null)}
				/>
			)}

			{/* Dialog de confirmación de eliminación */}
			<StandardDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}>
				<StandardDialog.Content
					size="md"
					colorScheme={canDelete ? "danger" : "warning"}>
					<StandardDialog.Header>
						<StandardDialog.Title>
							{canDelete ? "Confirmar Eliminación" : "No se puede eliminar"}
						</StandardDialog.Title>
					</StandardDialog.Header>

					<StandardDialog.Body>
						{canDelete ?
							<>
								<div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
									<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
									<div className="space-y-1">
										<StandardText weight="semibold" colorScheme="danger">
											Esta acción es irreversible
										</StandardText>
										<StandardText size="sm" colorScheme="neutral">
											Se eliminará permanentemente el artefacto y todos sus
											datos asociados:
										</StandardText>
										<ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4">
											<li>• Archivo original</li>
											<li>• Transcripción/Markdown</li>
											<li>• Semillas fractales</li>
											<li>
												• Asociaciones con disciplinas, pensadores y teorías
											</li>
											<li>• Sesiones de chat con QUIPU</li>
										</ul>
									</div>
								</div>

								<div className="p-3 bg-muted rounded-lg">
									<StandardText size="sm" weight="medium">
										Artefacto a eliminar:
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										className="mt-1">
										{artifactToDelete?.title}
									</StandardText>
								</div>
							</>
						:	<>
								<div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
									<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
									<div className="space-y-1">
										<StandardText weight="semibold" colorScheme="warning">
											Artefacto protegido
										</StandardText>
										<StandardText size="sm" colorScheme="neutral">
											{deleteReason}
										</StandardText>
									</div>
								</div>

								<div className="p-3 bg-muted rounded-lg">
									<StandardText size="sm" weight="medium" className="mb-2">
										Condiciones para eliminar:
									</StandardText>
									<ul className="text-sm text-muted-foreground space-y-1 ml-4">
										<li>• No debe tener calibración QUIPU</li>
										<li>• No debe haber sido descargado (sin hash)</li>
									</ul>
								</div>
							</>
						}
					</StandardDialog.Body>

					<StandardDialog.Footer>
						{canDelete ?
							<>
								<StandardButton
									styleType="outline"
									onClick={() => setDeleteDialogOpen(false)}
									disabled={!!deletingId}>
									Cancelar
								</StandardButton>
								<StandardButton
									colorScheme="danger"
									onClick={handleConfirmDelete}
									disabled={!!deletingId}
									leftIcon={Trash2}>
									{deletingId ? "Eliminando..." : "Eliminar Permanentemente"}
								</StandardButton>
							</>
						:	<StandardButton onClick={() => setDeleteDialogOpen(false)}>
								Entendido
							</StandardButton>
						}
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
}
