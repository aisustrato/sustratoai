"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardPagination } from "@/components/ui/StandardPagination";
import {
	GitCompareArrows,
	Filter,
	X,
	BarChart3,
	ExternalLink,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	Clock,
	Bot,
	User,
	Scale,
	Download,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import {
	getDiscrepancyAnalysisData,
	type DiscrepancyDetail,
	type DiscrepancyAnalysisResult,
	saveDiscrepancyExportLog,
} from "@/lib/actions/preclassification-actions";
import {
	getActivePhaseForProject,
	getPhasesForProject,
} from "@/lib/actions/preclassification_phases_actions";
import { DiscrepancyVisualization } from "./components/DiscrepancyVisualization";
import { IterationTimeline } from "./components/IterationTimeline";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Phase = Database["public"]["Tables"]["preclassification_phases"]["Row"];

type DiscrepancyFilterType =
	| "all"
	| "agreement"
	| "discrepancy"
	| "reconciled"
	| "disputed"
	| "pending_reconciliation"
	| "only_iter1";

const ITEMS_PER_PAGE_OPTIONS = [
	{ value: "10", label: "10 por página" },
	{ value: "25", label: "25 por página" },
	{ value: "50", label: "50 por página" },
	{ value: "100", label: "100 por página" },
];

export default function AnalisisDiscrepanciasPage() {
	const { proyectoActual } = useAuth();

	// Fases
	const [allPhases, setAllPhases] = useState<Phase[]>([]);
	const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);
	const [activePhase, setActivePhase] = useState<Phase | null>(null);
	const [isLoadingPhase, setIsLoadingPhase] = useState(true);
	const hasInitializedPhaseRef = useRef(false);

	// Datos de discrepancias
	const [analysisData, setAnalysisData] =
		useState<DiscrepancyAnalysisResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Filtros
	const [filterType, setFilterType] = useState<DiscrepancyFilterType>("all");
	const [filterDimension, setFilterDimension] = useState<string>("all");
	const [showFilters, setShowFilters] = useState(false);
	const [showVisualization, setShowVisualization] = useState(true);
	const [showTable, setShowTable] = useState(true);
	const [showTimeline, setShowTimeline] = useState(false);
	const [selectedDetail, setSelectedDetail] =
		useState<DiscrepancyDetail | null>(null);

	// Paginación
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(25);

	// Exportación
	const [isExporting, setIsExporting] = useState(false);

	// Cargar fases
	const loadPhases = useCallback(async () => {
		if (!proyectoActual?.id || hasInitializedPhaseRef.current) return;
		hasInitializedPhaseRef.current = true;
		setIsLoadingPhase(true);

		try {
			const [activeResult, allResult] = await Promise.all([
				getActivePhaseForProject(proyectoActual.id),
				getPhasesForProject(proyectoActual.id),
			]);

			const phases = allResult.data ? allResult.data : [];
			setAllPhases(phases);

			// Por defecto: todas las fases
			if (phases.length > 0) {
				setSelectedPhaseIds(phases.map((p) => p.id));
				if (activeResult.data) {
					setActivePhase(activeResult.data);
				} else {
					setActivePhase(phases[0]);
				}
			}
		} catch (error) {
			console.error("Error cargando fases:", error);
			toast.error("Error al cargar las fases");
		} finally {
			setIsLoadingPhase(false);
		}
	}, [proyectoActual?.id]);

	useEffect(() => {
		loadPhases();
	}, [loadPhases]);

	// Cargar datos de discrepancias
	const loadDiscrepancyData = useCallback(async () => {
		if (!proyectoActual?.id || selectedPhaseIds.length === 0) return;

		setIsLoading(true);
		try {
			const result = await getDiscrepancyAnalysisData({
				projectId: proyectoActual.id,
				phaseIds: selectedPhaseIds,
			});

			if (result.success) {
				setAnalysisData(result.data);
			} else {
				toast.error(result.error || "Error al cargar datos de discrepancias");
			}
		} catch (error) {
			console.error("Error cargando discrepancias:", error);
			toast.error("Error al cargar análisis de discrepancias");
		} finally {
			setIsLoading(false);
		}
	}, [proyectoActual?.id, selectedPhaseIds]);

	useEffect(() => {
		if (selectedPhaseIds.length > 0) {
			loadDiscrepancyData();
		}
	}, [loadDiscrepancyData, selectedPhaseIds]);

	// Detalles filtrados
	const filteredDetails = useMemo(() => {
		if (!analysisData) return [];

		// SIEMPRE excluir artículos con solo iter 1 (sin revisión humana)
		let filtered = analysisData.details.filter((d) => d.iter2 !== null);

		// Filtro por tipo de discrepancia
		switch (filterType) {
			case "agreement":
				filtered = filtered.filter((d) => d.isAgreement);
				break;
			case "discrepancy":
				filtered = filtered.filter((d) => !d.isAgreement);
				break;
			case "reconciled":
				filtered = filtered.filter((d) => d.finalStatus === "reconciled");
				break;
			case "disputed":
				filtered = filtered.filter((d) => d.finalStatus === "disputed");
				break;
			case "pending_reconciliation":
				filtered = filtered.filter((d) => !d.isAgreement && d.iter3 === null);
				break;
		}

		// Filtro por dimensión
		if (filterDimension !== "all") {
			filtered = filtered.filter((d) => d.dimensionId === filterDimension);
		}

		return filtered;
	}, [analysisData, filterType, filterDimension]);

	// Paginación sobre filteredDetails
	const totalItems = filteredDetails.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const paginatedDetails = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredDetails.slice(start, start + itemsPerPage);
	}, [filteredDetails, currentPage, itemsPerPage]);

	// Reset página al cambiar filtros
	useEffect(() => {
		setCurrentPage(1);
	}, [filterType, filterDimension]);

	// Dimensiones únicas para el selector de filtros
	const uniqueDimensions = useMemo(() => {
		if (!analysisData) return [];
		return analysisData.byDimension.map((d) => ({
			value: d.dimensionId,
			label: d.dimensionName,
		}));
	}, [analysisData]);

	// Contadores para badges de filtro (solo artículos con iter≥2)
	const filterCounts = useMemo(() => {
		if (!analysisData) return {} as Record<DiscrepancyFilterType, number>;
		const d = analysisData.details.filter((x) => x.iter2 !== null);
		return {
			all: d.length,
			agreement: d.filter((x) => x.isAgreement).length,
			discrepancy: d.filter((x) => !x.isAgreement).length,
			reconciled: d.filter((x) => x.finalStatus === "reconciled").length,
			disputed: d.filter((x) => x.finalStatus === "disputed").length,
			pending_reconciliation: d.filter(
				(x) => !x.isAgreement && x.iter3 === null,
			).length,
			only_iter1: 0, // No se muestra en esta vista
		};
	}, [analysisData]);

	// Navegación a detalle de artículo
	const handleNavigateToArticle = useCallback((articleId: string) => {
		const returnHref = encodeURIComponent("/articulos/analisis-discrepancias");
		const returnLabel = encodeURIComponent("Análisis de Discrepancias");
		window.location.href = `/articulos/detalle?articleId=${articleId}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
	}, []);

	// Función de exportación a CSV con hash SHA-256
	const handleExportToCSV = useCallback(async () => {
		if (!filteredDetails || filteredDetails.length === 0) {
			toast.error("No hay datos para exportar");
			return;
		}

		setIsExporting(true);
		try {
			// Preparar datos para CSV
			const csvRows: string[] = [];

			// Encabezados
			const headers = [
				"Correlativo",
				"Título Artículo",
				"Título Traducido",
				"Dimensión",
				"Lote",
				"IA Iter1 - Valor",
				"IA Iter1 - Confianza",
				"IA Iter1 - Justificación",
				"Humano Iter2 - Valor",
				"Humano Iter2 - Confianza",
				"Humano Iter2 - Justificación",
				"¿Acuerdo?",
				"Reconciliación Iter3 - Valor",
				"Reconciliación Iter3 - Confianza",
				"Reconciliación Iter3 - Justificación",
				"Reconciliación Iter3 - Status",
				"Status Final",
			];
			csvRows.push(headers.map((h) => `"${h}"`).join(","));

			// Datos
			filteredDetails.forEach((detail) => {
				const row = [
					detail.correlativo || "",
					(detail.translatedTitle || detail.articleTitle || "").replace(
						/"/g,
						'""',
					),
					(detail.translatedTitle || "").replace(/"/g, '""'),
					detail.dimensionName.replace(/"/g, '""'),
					detail.batchNumber?.toString() || "",
					detail.iter1?.value?.replace(/"/g, '""') || "",
					detail.iter1?.confidence?.toString() || "",
					(detail.iter1?.rationale || "").replace(/"/g, '""'),
					detail.iter2?.value?.replace(/"/g, '""') || "",
					detail.iter2?.confidence?.toString() || "",
					(detail.iter2?.rationale || "").replace(/"/g, '""'),
					detail.isAgreement ? "Sí" : "No",
					detail.iter3?.value?.replace(/"/g, '""') || "",
					detail.iter3?.confidence?.toString() || "",
					(detail.iter3?.rationale || "").replace(/"/g, '""'),
					detail.iter3?.status?.replace(/"/g, '""') || "",
					detail.finalStatus?.replace(/"/g, '""') || "",
				];
				csvRows.push(row.map((cell) => `"${cell}"`).join(","));
			});

			const csvContent = csvRows.join("\n");
			const blob = new Blob(["\uFEFF" + csvContent], {
				type: "text/csv;charset=utf-8;",
			});

			// Generar hash SHA-256
			const arrayBuffer = await blob.arrayBuffer();
			const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			// Timestamp
			const timestamp = new Date().toISOString();
			const fileName = `analisis-discrepancias_${timestamp.replace(/[:.]/g, "-")}.csv`;

			// Guardar registro en BD
			if (proyectoActual?.id) {
				const logResult = await saveDiscrepancyExportLog({
					projectId: proyectoActual.id,
					totalDiscrepancies: filteredDetails.length,
					exportFormat: "csv",
					exportMetadata: {
						fileName,
						fileHashSha256: hashHex,
						phaseIds: selectedPhaseIds,
						filterType: filterType !== "all" ? filterType : undefined,
						filterDimensionId:
							filterDimension !== "all" ? filterDimension : undefined,
					},
				});

				if (!logResult.success) {
					console.warn(
						"⚠️ No se pudo guardar registro de exportación:",
						logResult.error,
					);
				} else {
					console.log("✅ Registro de exportación guardado:", logResult.logId);
				}
			}

			// Descargar archivo
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.success(
				`Exportados ${filteredDetails.length} registros. Hash: ${hashHex.substring(0, 16)}...`,
			);
		} catch (error) {
			console.error("Error al exportar:", error);
			toast.error("Error al exportar datos");
		} finally {
			setIsExporting(false);
		}
	}, [
		filteredDetails,
		proyectoActual?.id,
		selectedPhaseIds,
		filterType,
		filterDimension,
	]);

	// Columnas de la tabla
	const columns = useMemo<ColumnDef<DiscrepancyDetail>[]>(
		() => [
			{
				accessorKey: "correlativo",
				header: "#",
				size: 60,
				cell: ({ row }) => (
					<StandardText size="sm" weight="semibold">
						{row.original.correlativo || "—"}
					</StandardText>
				),
			},
			{
				accessorKey: "articleTitle",
				header: "Artículo",
				size: 250,
				cell: ({ row }) => (
					<div className="max-w-xs">
						<StandardText size="sm" className="line-clamp-2">
							{row.original.translatedTitle || row.original.articleTitle}
						</StandardText>
					</div>
				),
				meta: {
					isTruncatable: true,
					tooltipType: "longText" as const,
				},
			},
			{
				accessorKey: "dimensionName",
				header: "Dimensión",
				size: 150,
				cell: ({ row }) => (
					<StandardBadge size="sm" colorScheme="primary" styleType="outline">
						{row.original.dimensionName}
					</StandardBadge>
				),
			},
			{
				id: "iter1_value",
				header: "IA (Iter 1)",
				size: 140,
				cell: ({ row }) => {
					if (!row.original.iter1) {
						return (
							<StandardText size="sm" colorShade="subtle">
								—
							</StandardText>
						);
					}
					return (
						<div className="flex items-center gap-1">
							<Bot size={12} className="text-accent-500 shrink-0" />
							<StandardText size="sm">{row.original.iter1.value}</StandardText>
						</div>
					);
				},
			},
			{
				id: "iter1_rationale",
				header: "Justificación IA",
				size: 250,
				cell: ({ row }) => {
					if (!row.original.iter1?.rationale) {
						return (
							<StandardText size="sm" colorShade="subtle">
								—
							</StandardText>
						);
					}
					return (
						<StandardText size="sm" className="line-clamp-2">
							{row.original.iter1.rationale}
						</StandardText>
					);
				},
				meta: {
					isTruncatable: true,
					tooltipType: "longText" as const,
				},
			},
			{
				id: "iter2_value",
				header: "Humano (Iter 2)",
				size: 140,
				cell: ({ row }) => {
					if (!row.original.iter2) {
						return (
							<StandardText size="sm" colorShade="subtle">
								Sin revisión
							</StandardText>
						);
					}
					return (
						<div className="flex items-center gap-1">
							<User size={12} className="text-primary-500 shrink-0" />
							<StandardText size="sm">{row.original.iter2.value}</StandardText>
						</div>
					);
				},
			},
			{
				id: "iter2_rationale",
				header: "Justificación Humano",
				size: 250,
				cell: ({ row }) => {
					if (!row.original.iter2?.rationale) {
						return (
							<StandardText size="sm" colorShade="subtle">
								—
							</StandardText>
						);
					}
					return (
						<StandardText size="sm" className="line-clamp-2">
							{row.original.iter2.rationale}
						</StandardText>
					);
				},
				meta: {
					isTruncatable: true,
					tooltipType: "longText" as const,
				},
			},
			{
				id: "agreement",
				header: "Resultado",
				size: 130,
				cell: ({ row }) => {
					if (!row.original.iter2) {
						return (
							<StandardBadge
								size="sm"
								colorScheme="neutral"
								styleType="outline">
								Solo IA
							</StandardBadge>
						);
					}
					return row.original.isAgreement ?
							<StandardBadge size="sm" colorScheme="success">
								Acuerdo
							</StandardBadge>
						:	<StandardBadge size="sm" colorScheme="danger">
								Discrepancia
							</StandardBadge>;
				},
			},
			{
				id: "iter3_value",
				header: "Reconciliación (Iter 3)",
				size: 160,
				cell: ({ row }) => {
					if (!row.original.iter3) {
						if (!row.original.isAgreement && row.original.iter2) {
							return (
								<StandardBadge
									size="sm"
									colorScheme="warning"
									styleType="outline">
									Pendiente
								</StandardBadge>
							);
						}
						return (
							<StandardText size="sm" colorShade="subtle">
								—
							</StandardText>
						);
					}
					const statusBadge =
						row.original.iter3.status === "reconciled" ?
							{ color: "primary" as const, label: "Reconciliado" }
						: row.original.iter3.status === "disputed" ?
							{ color: "danger" as const, label: "Disputado" }
						:	{
								color: "neutral" as const,
								label: row.original.iter3.status || "—",
							};

					return (
						<div className="space-y-1">
							<div className="flex items-center gap-1">
								<Scale size={12} className="text-success-500 shrink-0" />
								<StandardText size="sm">
									{row.original.iter3.value}
								</StandardText>
							</div>
							<StandardBadge
								size="sm"
								colorScheme={statusBadge.color}
								styleType="outline">
								{statusBadge.label}
							</StandardBadge>
						</div>
					);
				},
			},
			{
				id: "iter3_rationale",
				header: "Justificación Reconciliación",
				size: 250,
				cell: ({ row }) => {
					if (!row.original.iter3?.rationale) {
						return (
							<StandardText size="sm" colorShade="subtle">
								—
							</StandardText>
						);
					}
					return (
						<StandardText size="sm" className="line-clamp-2">
							{row.original.iter3.rationale}
						</StandardText>
					);
				},
				meta: {
					isTruncatable: true,
					tooltipType: "longText" as const,
				},
			},
			{
				id: "actions",
				header: "Acciones",
				size: 80,
				cell: ({ row }) => (
					<div className="flex gap-1">
						<StandardButton
							styleType="ghost"
							size="sm"
							iconOnly
							onClick={() => {
								setSelectedDetail(row.original);
								setShowTimeline(true);
							}}
							tooltip="Ver historial de iteraciones">
							<GitCompareArrows size={14} />
						</StandardButton>
						<StandardButton
							styleType="ghost"
							size="sm"
							iconOnly
							onClick={() => handleNavigateToArticle(row.original.articleId)}
							tooltip="Ver detalle del artículo">
							<ExternalLink size={14} />
						</StandardButton>
					</div>
				),
				meta: {
					isSticky: "right" as const,
				},
			},
		],
		[handleNavigateToArticle],
	);

	// Breadcrumbs
	const breadcrumbs = [
		{ label: "Artículos", href: "/articulos" },
		{ label: "Análisis de Discrepancias" },
	];

	// Loading
	if (!proyectoActual?.id) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<SustratoLoadingLogo size={64} />
				<StandardText colorShade="subtle">
					Cargando información del proyecto...
				</StandardText>
			</div>
		);
	}

	if (isLoadingPhase) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<SustratoLoadingLogo size={64} />
				<StandardText colorShade="subtle">Cargando fase activa...</StandardText>
			</div>
		);
	}

	if (allPhases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<GitCompareArrows className="h-12 w-12 text-neutral-300" />
				<StandardText size="lg" weight="semibold">
					No hay fases disponibles
				</StandardText>
				<StandardText colorShade="subtle">
					Crea una fase desde la gestión de fases para comenzar el análisis.
				</StandardText>
			</div>
		);
	}

	const summary = analysisData?.summary;
	const agreementRate =
		summary && summary.totalPairs > 0 ?
			Math.round(
				(summary.agreements / (summary.totalPairs - summary.onlyIter1)) * 100,
			)
		:	0;

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Selector de Fases */}
			{allPhases.length > 1 && (
				<div className="flex items-center gap-3">
					<StandardText size="sm" weight="medium">
						Analizar fase:
					</StandardText>
					<div className="w-80">
						<StandardSelect
							value={
								selectedPhaseIds.length === 1 ? selectedPhaseIds[0] : "multiple"
							}
							onChange={(value) => {
								if (typeof value !== "string") return;
								if (value === "multiple") {
									setSelectedPhaseIds(allPhases.map((p) => p.id));
								} else {
									setSelectedPhaseIds([value]);
								}
								setCurrentPage(1);
							}}
							placeholder="Seleccionar fase"
							options={[
								...allPhases.map((phase) => ({
									value: phase.id,
									label: `Fase ${phase.phase_number}: ${phase.name}${
										phase.id === activePhase?.id ? " (Activa)" : ""
									}`,
								})),
								{
									value: "multiple",
									label: `Todas las Fases (${allPhases.length})`,
								},
							]}
							defaultValue="multiple"
						/>
					</div>
				</div>
			)}

			{/* Título */}
			<StandardPageTitle
				title="Análisis de Discrepancias"
				subtitle={
					selectedPhaseIds.length === 1 ?
						`Fase: ${
							allPhases.find((p) => p.id === selectedPhaseIds[0])?.name ||
							activePhase?.name ||
							"Sin nombre"
						}`
					:	`Análisis Multifase (${selectedPhaseIds.length} fases)`
				}
				description="Comparación global entre clasificación IA (iter 1), revisión humana (iter 2) y reconciliación (iter 3). Navega al historial de iteraciones para cada par artículo-dimensión."
				mainIcon={GitCompareArrows}
				breadcrumbs={breadcrumbs}
			/>

			{/* KPIs */}
			{summary && !isLoading && (
				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							Total Pares
						</StandardText>
						<StandardText size="xl" weight="bold">
							{summary.totalPairs}
						</StandardText>
					</StandardCard>

					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							Acuerdos
						</StandardText>
						<StandardText size="xl" weight="bold" colorScheme="success">
							{summary.agreements}
						</StandardText>
						{summary.totalPairs > 0 && (
							<StandardBadge
								size="sm"
								colorScheme="success"
								styleType="outline">
								{agreementRate}%
							</StandardBadge>
						)}
					</StandardCard>

					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							Discrepancias
						</StandardText>
						<StandardText size="xl" weight="bold" colorScheme="danger">
							{summary.discrepancies}
						</StandardText>
					</StandardCard>

					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							Reconciliados
						</StandardText>
						<StandardText size="xl" weight="bold" colorScheme="primary">
							{summary.reconciled}
						</StandardText>
					</StandardCard>

					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							En Disputa
						</StandardText>
						<StandardText size="xl" weight="bold" colorScheme="danger">
							{summary.disputed}
						</StandardText>
					</StandardCard>

					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							Pend. Acción Humana
						</StandardText>
						<StandardText size="xl" weight="bold" colorScheme="warning">
							{summary.pendingReconciliation}
						</StandardText>
					</StandardCard>

					<StandardCard
						styleType="subtle"
						hasOutline
						className="p-3 text-center">
						<StandardText size="xs" colorShade="subtle" className="block">
							Solo IA
						</StandardText>
						<StandardText size="xl" weight="bold" colorScheme="neutral">
							{summary.onlyIter1}
						</StandardText>
					</StandardCard>
				</div>
			)}

			{/* Loading */}
			{isLoading && (
				<div className="flex flex-col items-center justify-center py-16 gap-4">
					<SustratoLoadingLogo size={64} />
					<StandardText colorShade="subtle">
						Analizando discrepancias entre iteraciones...
					</StandardText>
				</div>
			)}

			{/* Barra de herramientas */}
			{!isLoading && analysisData && (
				<StandardCard styleType="subtle" hasOutline className="mb-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex flex-wrap items-center gap-2">
							<StandardButton
								styleType={showFilters ? "solid" : "outline"}
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								leftIcon={Filter}>
								Filtros
							</StandardButton>

							{(filterType !== "all" || filterDimension !== "all") && (
								<StandardButton
									styleType="ghost"
									size="sm"
									onClick={() => {
										setFilterType("all");
										setFilterDimension("all");
									}}
									leftIcon={X}>
									Limpiar filtros
								</StandardButton>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<StandardButton
								styleType="outline"
								colorScheme="success"
								size="sm"
								onClick={handleExportToCSV}
								disabled={
									isExporting ||
									!filteredDetails ||
									filteredDetails.length === 0
								}
								leftIcon={Download}>
								{isExporting ? "Exportando..." : "Exportar CSV"}
							</StandardButton>

							<StandardButton
								styleType={showTable ? "solid" : "outline"}
								colorScheme={showTable ? "primary" : undefined}
								size="sm"
								onClick={() => setShowTable(!showTable)}
								leftIcon={showTable ? X : BarChart3}
								defaultChecked={true}>
								{showTable ? "Ocultar Tabla" : "Mostrar Tabla"}
							</StandardButton>

							<StandardButton
								styleType={showVisualization ? "solid" : "outline"}
								colorScheme="primary"
								size="sm"
								onClick={() => setShowVisualization(!showVisualization)}
								leftIcon={BarChart3}>
								{showVisualization ? "Ocultar" : "Ver"} gráficos
							</StandardButton>
						</div>
					</div>
				</StandardCard>
			)}

			{/* Filtros */}
			{showFilters && analysisData && (
				<StandardCard styleType="subtle" hasOutline className="mb-6">
					<div className="space-y-4 p-4">
						{/* Filtro por tipo */}
						<div>
							<StandardText size="sm" weight="semibold" className="mb-2 block">
								Tipo de Resultado
							</StandardText>
							<div className="flex flex-wrap gap-2">
								{[
									{
										key: "all" as const,
										label: "Todos",
										icon: null,
										color: "neutral" as const,
									},
									{
										key: "agreement" as const,
										label: "Acuerdos",
										icon: CheckCircle2,
										color: "success" as const,
									},
									{
										key: "discrepancy" as const,
										label: "Discrepancias",
										icon: XCircle,
										color: "danger" as const,
									},
									{
										key: "reconciled" as const,
										label: "Reconciliados",
										icon: Scale,
										color: "primary" as const,
									},
									{
										key: "disputed" as const,
										label: "En Disputa",
										icon: AlertTriangle,
										color: "danger" as const,
									},
									{
										key: "pending_reconciliation" as const,
										label: "Pend. Acción Humana",
										icon: Clock,
										color: "warning" as const,
									},
								].map((opt) => (
									<StandardBadge
										key={opt.key}
										styleType={filterType === opt.key ? "solid" : "outline"}
										colorScheme={filterType === opt.key ? opt.color : "neutral"}
										className="cursor-pointer"
										onClick={() => setFilterType(opt.key)}>
										{opt.label} ({filterCounts[opt.key] ?? 0})
									</StandardBadge>
								))}
							</div>
						</div>

						{/* Filtro por dimensión */}
						{uniqueDimensions.length > 0 && (
							<div>
								<StandardText
									size="sm"
									weight="semibold"
									className="mb-2 block">
									Dimensión
								</StandardText>
								<div className="w-64">
									<StandardSelect
										value={filterDimension}
										onChange={(val) => {
											if (typeof val === "string") setFilterDimension(val);
										}}
										options={[
											{ value: "all", label: "Todas las dimensiones" },
											...uniqueDimensions,
										]}
										size="sm"
									/>
								</div>
							</div>
						)}
					</div>
				</StandardCard>
			)}

			{/* Gráficos */}
			{showVisualization && analysisData && !isLoading && (
				<DiscrepancyVisualization
					summary={analysisData.summary}
					byDimension={analysisData.byDimension}
				/>
			)}

			{/* Tabla */}
			{showTable && analysisData && !isLoading && (
				<StandardCard>
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex items-center gap-4">
							<StandardText size="sm" colorShade="subtle">
								Total: {totalItems} par{totalItems !== 1 ? "es" : ""}
							</StandardText>
							{filterType !== "all" && (
								<StandardBadge size="sm" colorScheme="accent">
									Filtro: {filterType}
								</StandardBadge>
							)}
						</div>
						<div className="flex items-center gap-2">
							<StandardText size="sm" colorShade="subtle">
								Mostrar:
							</StandardText>
							<StandardSelect
								options={ITEMS_PER_PAGE_OPTIONS}
								value={itemsPerPage.toString()}
								onChange={(value) => {
									if (typeof value === "string") {
										setItemsPerPage(Number(value));
										setCurrentPage(1);
									}
								}}
								size="sm"
								className="w-40"
							/>
						</div>
					</div>

					{paginatedDetails.length === 0 ?
						<div className="flex flex-col items-center justify-center py-16 gap-2">
							<GitCompareArrows className="h-12 w-12 text-neutral-300" />
							<StandardText size="lg" weight="semibold">
								Sin resultados
							</StandardText>
							<StandardText colorShade="subtle">
								No hay pares artículo-dimensión con los filtros seleccionados.
							</StandardText>
						</div>
					:	<StandardTable
							data={paginatedDetails}
							columns={columns}
							enableTruncation={true}
							colorScheme="neutral"
							enableKeywordHighlighting={true}
							keywordHighlightPlaceholder="Buscar en tabla...">
							<StandardTable.Table />
						</StandardTable>
					}

					{totalPages > 1 && (
						<div className="border-t">
							<StandardPagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
								itemsPerPage={itemsPerPage}
								totalItems={totalItems}
							/>
						</div>
					)}
				</StandardCard>
			)}

			{/* Timeline de iteraciones (panel lateral o expandido) */}
			{showTimeline && selectedDetail && (
				<div className="fixed inset-0 z-50 flex justify-end">
					{/* Overlay */}
					<div
						className="absolute inset-0 bg-black/30"
						onClick={() => {
							setShowTimeline(false);
							setSelectedDetail(null);
						}}
					/>
					{/* Panel */}
					<div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 shadow-xl overflow-y-auto">
						<div className="sticky top-0 bg-white dark:bg-neutral-900 z-10 p-4 border-b flex items-center justify-between">
							<StandardText size="sm" weight="semibold">
								Historial de Iteraciones
							</StandardText>
							<StandardButton
								styleType="ghost"
								size="sm"
								iconOnly
								onClick={() => {
									setShowTimeline(false);
									setSelectedDetail(null);
								}}>
								<X size={16} />
							</StandardButton>
						</div>
						<div className="p-4">
							<IterationTimeline
								detail={selectedDetail}
								onNavigateToArticle={handleNavigateToArticle}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
