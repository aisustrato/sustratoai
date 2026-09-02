//. 📍 app/datos-maestros/lote/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import BatchSimulatorPage from "./components/BatchSimulatorPage";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSelect } from "@/components/ui/StandardSelect";
import {
	StandardSphereGrid,
	type SphereItemData,
} from "@/components/ui/StandardSphereGrid";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { useWindowSize } from "@/lib/hooks/useWindowSize";
import { useLayout } from "@/app/contexts/layout-context";
import { useTheme } from "@/app/theme-provider";
import {
	AlertTriangle,
	Users,
	FileText,
	Boxes,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";

import {
	getBatchingStatusForActivePhase,
	resetBatchesForPhase,
	getBatchesForPhaseDisplay,
} from "@/lib/actions/batch-actions";
import {
	getActivePhaseForProject,
	getPhasesForProject,
} from "@/lib/actions/preclassification_phases_actions";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
type ViewState =
	| "loading"
	| "no_active_phase"
	| "universe_not_defined"
	| "ready_for_batching"
	| "batches_created"
	| "error";

// Tipos específicos para los datos de lotes
interface BatchData {
	id: string;
	batch_number: number;
	status?: string;
	total_items?: number;
	assigned_member_name?: string;
	assigned_member_initials?: string;
	phase_id?: string;
	phase_name?: string;
	phase_number?: number;
	is_closed?: boolean;
	article_counts?: {
		pending: number;
		translated: number;
		pending_review: number;
		reconciliation_pending: number;
		validated: number;
		reconciled: number;
		disputed: number;
	};
}

interface PhaseInfo {
	id: string;
	phase_number: number;
	name: string;
	status: string;
}

// Fuente de verdad para los estados de los ARTÍCULOS (alineado con preclasificación)
const ARTICLE_STATUS_VISUALS = {
	pendientesRevision: {
		emoticon: "�",
		colorScheme: "accent" as ColorSchemeVariant,
	},
	pendientesRevisionTraducido: {
		emoticon: "�",
		colorScheme: "secondary" as ColorSchemeVariant,
	},
	pendientesReconciliacion: {
		emoticon: "�",
		colorScheme: "warning" as ColorSchemeVariant,
	},
	validados: {
		emoticon: "✅",
		colorScheme: "success" as ColorSchemeVariant,
	},
	reconciliados: {
		emoticon: "🎯",
		colorScheme: "primary" as ColorSchemeVariant,
	},
	enDisputa: {
		emoticon: "⚡",
		colorScheme: "danger" as ColorSchemeVariant,
	},
};

// Orden explícito por estatus para el grid
const STATUS_ORDER = [
	"pending",
	"translated",
	"review_pending",
	"reconciliation_pending",
	"validated",
	"reconciled",
	"disputed",
] as const;

const getOrderedGroupKey = (status?: string | null) => {
	const s = (status || "").toLowerCase();
	const idx = STATUS_ORDER.indexOf(s as (typeof STATUS_ORDER)[number]);
	const reversedIdx = idx >= 0 ? STATUS_ORDER.length - 1 - idx : 99;
	const order = String(reversedIdx).padStart(2, "0");
	return `${order}-${s || "unknown"}`;
};

// 🎯 NUEVA FUNCIÓN: Determina el color de la esfera basado en el PEOR estado presente
type ArticleCounts = {
	pending: number;
	translated: number;
	pending_review: number;
	reconciliation_pending: number;
	validated: number;
	reconciled: number;
	disputed: number;
};

const getSphereVisualsFromCounts = (
	counts: ArticleCounts,
	isClosed: boolean,
): {
	emoticon: string;
	colorScheme: ColorSchemeVariant;
	styleType: "subtle" | "filled";
} => {
	// 🚨 Orden de prioridad: del PEOR al MEJOR estado
	if (counts.disputed > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.enDisputa.emoticon,
			colorScheme: "danger",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	if (counts.reconciled > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.reconciliados.emoticon,
			colorScheme: "primary",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	if (counts.reconciliation_pending > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon,
			colorScheme: "warning",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	if (counts.pending_review > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon,
			colorScheme: "accent",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	if (counts.translated > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon,
			colorScheme: "secondary",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	if (counts.pending > 0) {
		return {
			emoticon: "⏳",
			colorScheme: "neutral",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	if (counts.validated > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.validados.emoticon,
			colorScheme: "success",
			styleType: isClosed ? "subtle" : "filled",
		};
	}
	return {
		emoticon: "❔",
		colorScheme: "neutral",
		styleType: "subtle",
	};
};

// Helper para extraer iniciales del nombre
const getInitials = (name: string | null | undefined): string => {
	if (!name || name === "Sin asignar") return "?";
	const parts = name.split(" ").filter((p) => p.length > 0);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Normaliza conteos por estado de artículos
const normalizeCounts = (
	counts: BatchData["article_counts"],
): ArticleCounts => ({
	pending: counts?.pending ?? 0,
	translated: counts?.translated ?? 0,
	pending_review:
		(counts?.pending_review ||
			(counts as unknown as { review_pending?: number })?.review_pending) ??
		0,
	reconciliation_pending: counts?.reconciliation_pending ?? 0,
	validated: counts?.validated ?? 0,
	reconciled: counts?.reconciled ?? 0,
	disputed: counts?.disputed ?? 0,
});
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function LotesOrquestadorPage() {
	const t = useTranslations("datosMaestrosPages.lotePage");
	const { proyectoActual, user } = useAuth();

	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
	const [viewState, setViewState] = useState<ViewState>("loading");
	const [batchingStatus, setBatchingStatus] = useState<{
		activePhase?: { id: string; phase_number: number };
		totalUniverseSize?: number;
		canResetBatches?: boolean;
	} | null>(null);
	const [batchesData, setBatchesData] = useState<BatchData[]>([]);
	const [allPhases, setAllPhases] = useState<PhaseInfo[]>([]);
	const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isResetting, setIsResetting] = useState(false);
	const [activePhaseInfo, setActivePhaseInfo] = useState<{
		id: string;
		phase_number: number;
		name: string;
	} | null>(null);
	const [selectedSphereId, setSelectedSphereId] = useState<string | null>(null);

	// Hooks para dimensiones reactivas - igual que preclasificación
	const { width: windowWidth } = useWindowSize();
	const { sidebarWidth, layoutGap, globalXPadding } = useLayout();
	const { appColorTokens } = useTheme();

	// Calcula el ancho disponible restando el sidebar y un padding general
	const containerWidth = useMemo(() => {
		const calculatedWidth =
			windowWidth ? windowWidth - sidebarWidth - layoutGap - globalXPadding : 0;
		return calculatedWidth;
	}, [windowWidth, sidebarWidth, layoutGap, globalXPadding]);

	// La altura puede ser fija o depender de la ventana menos la navbar, etc.
	const containerHeight = 500;

	const permisoGestionGeneral =
		proyectoActual?.permissions?.can_create_batches || false;

	// 🎯 Filtrar lotes por fase seleccionada (todas las fases por defecto)
	const filteredBatches = useMemo(() => {
		if (!selectedPhaseId || selectedPhaseId === "") return batchesData;
		return batchesData.filter((batch) => batch.phase_id === selectedPhaseId);
	}, [batchesData, selectedPhaseId]);

	const cargarEstadoLoteo = useCallback(async () => {
		if (!proyectoActual?.id) {
			setViewState("error");
			setError(t("errorNoActiveProject"));
			return;
		}

		setViewState("loading");
		setError(null);

		try {
			console.log(
				`🔄 Cargando estado de loteo para proyecto: ${proyectoActual.id}`,
			);

			// 🎯 Obtener TODAS las fases del proyecto (no solo la activa)
			const [allPhasesResult, activePhaseResult] = await Promise.all([
				getPhasesForProject(proyectoActual.id),
				getActivePhaseForProject(proyectoActual.id),
			]);

			if (allPhasesResult.data) {
				setAllPhases(
					allPhasesResult.data.map((p) => ({
						id: p.id,
						phase_number: p.phase_number,
						name: p.name,
						status: p.status || "planning",
					})),
				);
			}

			if (activePhaseResult.data) {
				setActivePhaseInfo({
					id: activePhaseResult.data.id,
					phase_number: activePhaseResult.data.phase_number,
					name: activePhaseResult.data.name,
				});
			}

			// 🎯 Obtener lotes de TODAS las fases (no solo la activa)
			const allBatches: BatchData[] = [];
			const phasesWithBatches = allPhasesResult.data || [];

			for (const phase of phasesWithBatches) {
				const batchesResult = await getBatchesForPhaseDisplay(phase.id);
				if (batchesResult.success && batchesResult.data) {
					const phaseBatches = (batchesResult.data as any[]).map((batch) => ({
						...batch,
						phase_id: phase.id,
						phase_name: phase.name,
						phase_number: phase.phase_number,
						assigned_member_initials: getInitials(batch.assigned_member_name),
					}));
					allBatches.push(...phaseBatches);
				}
			}

			console.log(
				`📊 Total lotes cargados: ${allBatches.length} de ${phasesWithBatches.length} fases`,
			);

			// Si hay lotes en cualquier fase, mostrar vista de lotes creados
			if (allBatches.length > 0) {
				setBatchesData(allBatches);
				setViewState("batches_created");
				return;
			}

			// Si no hay lotes, verificar estado para mostrar mensaje apropiado
			const statusResult = await getBatchingStatusForActivePhase(
				proyectoActual.id,
			);

			if (!statusResult.success) {
				setViewState("error");
				setError(
					statusResult.error ||
						t("errorGettingLoteoStatus"),
				);
				return;
			}

			const status = statusResult.data;
			setBatchingStatus(status);

			// Mapear el estado del gateway a nuestro viewState
			switch (status.status) {
				case "NO_ACTIVE_PHASE":
					setViewState("no_active_phase");
					break;
				case "UNIVERSE_NOT_DEFINED":
					setViewState("universe_not_defined");
					break;
				case "READY_FOR_BATCHING":
					setViewState("ready_for_batching");
					break;
				case "BATCHES_CREATED":
					// El conteo directo dice que hay lotes, pero getBatchesForPhaseDisplay
					// no los trajo arriba (desync) — mensaje específico, no genérico.
					setViewState("error");
					setError(
						t("errorBatchesDesync"),
					);
					break;
				default:
					setViewState("error");
					setError(
						t("errorUnknownStatus", { status: status.status }),
					);
			}
		} catch (error) {
			console.error("❌ Excepción al cargar estado de loteo:", error);
			setViewState("error");
			setError(
				t("errorInternal", { message: error instanceof Error ? error.message : t("unknownError") }),
			);
		}
	}, [proyectoActual?.id, t]);

	useEffect(() => {
		cargarEstadoLoteo();
	}, [cargarEstadoLoteo]);

	const handleBatchesCreated = () => {
		console.log("✅ Lotes creados exitosamente, recargando estado...");
		cargarEstadoLoteo();
	};

	const handleResetBatches = async (): Promise<{
		success: boolean;
		message?: string;
		error?: string;
	}> => {
		if (!proyectoActual?.id || !batchingStatus?.activePhase?.id) {
			return { success: false, error: t("errorNoActiveProjectOrPhase") };
		}
		if (!permisoGestionGeneral) {
			return {
				success: false,
				error: t("errorNoResetPermission"),
			};
		}

		setIsResetting(true);
		try {
			const result = await resetBatchesForPhase(
				batchingStatus.activePhase.id,
				proyectoActual.id,
			);
			if (result.success) {
				console.log("✅ Lotes reseteados exitosamente:", result.data);
				cargarEstadoLoteo(); // Recargar estado
				return {
					success: true,
					message: t("resetSuccessMessage", { batches: result.data.deletedBatches, items: result.data.deletedItems }),
				};
			} else {
				return { success: false, error: result.error };
			}
		} catch (error) {
			return {
				success: false,
				error: t("errorInternal", { message: error instanceof Error ? error.message : t("unknownError") }),
			};
		} finally {
			setIsResetting(false);
		}
	};
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨

	// Estado de carga
	if (viewState === "loading") {
		return (
			<div className="flex items-center justify-center min-h-[70vh]">
				<SustratoLoadingLogo text={t("loadingLoteoStatus")} />
			</div>
		);
	}

	// Sin proyecto activo
	if (!proyectoActual) {
		return (
			<div className="container mx-auto py-8">
				<StandardCard
					disableShadowHover={true}
					colorScheme="primary"
					styleType="subtle"
					className="mt-6 text-center max-w-lg mx-auto p-8"
					hasOutline={false}
					accentPlacement="none">
					<StandardCard.Header className="items-center flex flex-col">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 mb-4">
							<StandardIcon>
								<AlertTriangle className="h-6 w-6 text-warning-600" />
							</StandardIcon>
						</div>
						<StandardText size="lg" weight="bold" colorScheme="warning">
							{t("noProjectSelectedTitle")}
						</StandardText>
					</StandardCard.Header>
					<StandardCard.Content>
						<StandardText>
							{t("noProjectSelectedDescription")}
						</StandardText>
					</StandardCard.Content>
				</StandardCard>
			</div>
		);
	}

	return (
		<div className="w-full h-full p-4 sm:p-6 flex flex-col">
			{/* Título condicional: solo se muestra cuando no estamos en ready_for_batching */}
			{viewState !== "ready_for_batching" && (
				<StandardPageTitle
					title={
						activePhaseInfo ?
							t("pageTitleWithPhase", { number: activePhaseInfo.phase_number, name: activePhaseInfo.name })
						:	t("pageTitleNoPhase")
					}
					subtitle={
						viewState === "no_active_phase" ? t("subtitleNoActivePhase")
						: viewState === "universe_not_defined" ?
							t("subtitleUniverseNotDefined")
						: viewState === "batches_created" ?
							t("subtitleBatchesCreated")
						: viewState === "error" ?
							t("subtitleError")
						:	t("subtitleLoading")
					}
					description={t("pageDescription")}
					showBackButton={{ href: "/datos-maestros" }}
					breadcrumbs={[
						{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
						{ label: t("breadcrumbLotes"), href: "/datos-maestros/lote" },
					]}
				/>
			)}
			{/* Estado: Sin fase activa */}
			{viewState === "no_active_phase" && (
				<div className="flex-grow flex items-center justify-center">
					<StandardCard
						colorScheme="warning"
						accentPlacement="left"
						accentColorScheme="warning"
						shadow="md"
						styleType="subtle"
						hasOutline={false}
						className="max-w-2xl mx-auto">
						<StandardCard.Header className="flex items-center gap-3">
							<StandardIcon>
								<Users className="h-6 w-6 text-warning-600" />
							</StandardIcon>
							<StandardText
								preset="subheading"
								weight="medium"
								colorScheme="warning">
								{t("noActivePhaseTitle")}
							</StandardText>
						</StandardCard.Header>
						<StandardCard.Content className="space-y-4">
							<StandardText>
								{t("noActivePhaseDescription")}
							</StandardText>
							<div className="flex justify-center">
								<Link href="/datos-maestros/fases-preclasificacion">
									<StandardButton
										colorScheme="warning"
										styleType="solid"
										rightIcon={ArrowRight}>
										{t("goToPhasesManagementButton")}
									</StandardButton>
								</Link>
							</div>
						</StandardCard.Content>
					</StandardCard>
				</div>
			)}

			{/* Estado: Universo no definido */}
			{viewState === "universe_not_defined" && batchingStatus?.activePhase && (
				<div className="flex-grow flex items-center justify-center">
					<StandardCard
						colorScheme="accent"
						accentPlacement="left"
						accentColorScheme="accent"
						shadow="md"
						styleType="subtle"
						hasOutline={false}
						className="max-w-2xl mx-auto">
						<StandardCard.Header className="flex items-center gap-3">
							<StandardIcon>
								<FileText className="h-6 w-6 text-accent-600" />
							</StandardIcon>
							<StandardText
								preset="subheading"
								weight="medium"
								colorScheme="accent">
								{t("universeNotDefinedTitle")}
							</StandardText>
						</StandardCard.Header>
						<StandardCard.Content className="space-y-4">
							<StandardText>
								{t("universeNotDefinedDescription", { number: batchingStatus.activePhase.phase_number })}
							</StandardText>
							<div className="flex justify-center">
								<Link
									href={`/datos-maestros/fases-preclasificacion?phase=${batchingStatus.activePhase.id}`}>
									<StandardButton
										colorScheme="accent"
										styleType="solid"
										rightIcon={ArrowRight}>
										{t("configureEligibleArticlesButton")}
									</StandardButton>
								</Link>
							</div>
						</StandardCard.Content>
					</StandardCard>
				</div>
			)}

			{/* Estado: Listo para crear lotes */}
			{viewState === "ready_for_batching" && (
				<BatchSimulatorPage
					onBatchesCreatedSuccessfully={handleBatchesCreated}
				/>
			)}

			{/* Estado: Lotes ya creados */}
			{viewState === "batches_created" && (
				<div className="mt-6 flex-grow flex flex-col gap-6">
					{/* Header con información y selector de fase */}
					<StandardCard
						colorScheme="success"
						accentPlacement="top"
						accentColorScheme="success"
						shadow="md"
						styleType="subtle"
						hasOutline={false}>
						<StandardCard.Header className="flex items-center justify-between flex-wrap gap-4">
							<div className="flex items-center gap-3">
								<StandardIcon>
									<Boxes className="h-6 w-6 text-success-600" />
								</StandardIcon>
								<div>
									<StandardText
										preset="subheading"
										weight="medium"
										colorScheme="success">
										{selectedPhaseId ?
											t("batchesInPhaseTitle", { number: allPhases.find((p) => p.id === selectedPhaseId)?.phase_number ?? 0 })
										:	t("allBatchesTitle", { count: batchesData.length, phases: allPhases.length })
										}
									</StandardText>
									<StandardText size="sm" className="text-muted-foreground">
										{t("batchesShownCount", { count: filteredBatches.length })}
									</StandardText>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{/* Selector de Fase */}
								{allPhases.length > 1 && (
									<div className="w-64">
										<StandardSelect
											value={selectedPhaseId || ""}
											onChange={(value: string | string[] | undefined) => {
												const newValue =
													Array.isArray(value) ? value[0] : value;
												setSelectedPhaseId(newValue || null);
											}}
											placeholder={t("allPhasesPlaceholder")}
											options={[
												{ value: "", label: t("allPhasesOption") },
												...allPhases.map((phase) => ({
													value: phase.id,
													label: `${t("phaseOptionLabel", { number: phase.phase_number, name: phase.name })}${phase.status === "active" ? t("activePhaseSuffix") : ""}`,
												})),
											]}
										/>
									</div>
								)}

								{permisoGestionGeneral && activePhaseInfo && (
									<StandardButton
										colorScheme="danger"
										styleType="outline"
										size="sm"
										onClick={handleResetBatches}
										loading={isResetting}
										disabled={isResetting}>
										{isResetting ? t("resettingButton") : t("resetButton")}
									</StandardButton>
								)}
							</div>
						</StandardCard.Header>
					</StandardCard>

					{/* Área de visualización de lotes - con nueva lógica de colores */}
					<div className="h-[500px] w-full">
						{containerWidth && (
							<StandardSphereGrid
								items={filteredBatches.map((batch) => {
									const counts = normalizeCounts(batch.article_counts);
									const total = Object.values(counts).reduce(
										(a, b) => a + b,
										0,
									);
									const visuals = getSphereVisualsFromCounts(
										counts,
										batch.is_closed || false,
									);
									const assignedMember =
										batch.assigned_member_name || t("unassignedMember");

									return {
										id: batch.id,
										value: batch.batch_number,
										emoticon: visuals.emoticon,
										colorScheme: visuals.colorScheme,
										styleType:
											selectedSphereId === batch.id ?
												"outline"
											:	visuals.styleType,
										onClick: () =>
											setSelectedSphereId(
												batch.id === selectedSphereId ? null : batch.id,
											),
										tooltip: [
											`${t("tooltipBatch", { number: batch.batch_number })}${batch.is_closed ? t("tooltipClosedSuffix") : ""}`,
											t("tooltipPhase", { name: batch.phase_name ?? "", number: batch.phase_number ?? 0 }),
											t("tooltipResearcher", { name: assignedMember }),
											t("tooltipTotalArticles", { total }),
											"---",
											t("tooltipPending", { count: counts.pending }),
											`${ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon} ${t("tooltipTranslated", { count: counts.translated })}`,
											`${ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon} ${t("tooltipPendingReview", { count: counts.pending_review })}`,
											`${ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon} ${t("tooltipPendingReconciliation", { count: counts.reconciliation_pending })}`,
											`${ARTICLE_STATUS_VISUALS.validados.emoticon} ${t("tooltipValidated", { count: counts.validated })}`,
											`${ARTICLE_STATUS_VISUALS.reconciliados.emoticon} ${t("tooltipReconciled", { count: counts.reconciled })}`,
											`${ARTICLE_STATUS_VISUALS.enDisputa.emoticon} ${t("tooltipDisputed", { count: counts.disputed })}`,
										]
											.filter(Boolean)
											.join("\n"),
										statusBadge:
											(
												batch.assigned_member_initials &&
												batch.assigned_member_initials !== "?"
											) ?
												{
													text: batch.assigned_member_initials,
													colorScheme: "primary" as const,
													tooltip: t("assignedToTooltip", { name: assignedMember }),
												}
											:	undefined,
									};
								})}
								containerWidth={containerWidth}
								containerHeight={containerHeight}
								groupByKeyGroup
								forceBadge={true}
								title={
									selectedPhaseId ?
										t("batchesInPhaseTitle", { number: allPhases.find((p) => p.id === selectedPhaseId)?.phase_number ?? 0 })
									:	t("allBatchesSphereTitle")
								}
								isLoading={false}
								loadingMessage={t("loadingBatches")}
								emptyStateText={
									selectedPhaseId ?
										t("noBatchesInPhase")
									:	t("noBatchesToShow")
								}
							/>
						)}
					</div>

					{/* Leyenda de estados - alineada con preclasificación */}
					<StandardCard
						title={t("statusesLegendTitle")}
						colorScheme="primary"
						styleType="subtle"
						hasOutline={false}
						shadow="md">
						<StandardCard.Content>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{Object.entries({
									pendientesRevision: t("statusPendingReviewLabel"),
									pendientesRevisionTraducido: t("statusTranslatedLabel"),
									pendientesReconciliacion: t("statusPendingReconciliationLabel"),
									validados: t("statusValidatedLabel"),
									reconciliados: t("statusReconciledLabel"),
									enDisputa: t("statusDisputedLabel"),
								}).map(([key, label]) => {
									const { emoticon, colorScheme } =
										ARTICLE_STATUS_VISUALS[key as keyof typeof ARTICLE_STATUS_VISUALS];
									return (
										<div key={key} className="flex items-center gap-2">
											<div
												className={`w-4 h-4 rounded-full bg-${colorScheme}-500`}
											/>
											<span>{emoticon}</span>
											<StandardText size="sm">{label}</StandardText>
										</div>
									);
								})}
							</div>
							<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<StandardText size="xs" className="text-muted-foreground">
									{t("legendFooterBefore")}{" "}
									<strong>{t("legendFooterBold")}</strong> {t("legendFooterAfter")}
								</StandardText>
							</div>
						</StandardCard.Content>
					</StandardCard>
				</div>
			)}

			{/* Estado de error */}
			{viewState === "error" && (
				<StandardCard
					colorScheme="danger"
					accentPlacement="left"
					accentColorScheme="danger"
					shadow="md"
					styleType="subtle"
					hasOutline={false}
					className="max-w-2xl mx-auto">
					<StandardCard.Header className="flex items-center gap-3">
						<StandardIcon>
							<AlertTriangle className="h-6 w-6 text-danger-600" />
						</StandardIcon>
						<StandardText
							preset="subheading"
							weight="medium"
							colorScheme="danger">
							{t("errorTitle")}
						</StandardText>
					</StandardCard.Header>
					<StandardCard.Content className="space-y-4">
						<StandardText>
							{error || t("errorUnexpectedGeneric")}
						</StandardText>
						<div className="flex justify-center">
							<StandardButton
								colorScheme="danger"
								styleType="outline"
								onClick={cargarEstadoLoteo}>
								{t("retryButton")}
							</StandardButton>
						</div>
					</StandardCard.Content>
				</StandardCard>
			)}
		</div>
	);
	//#endregion [render_sub]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// El manejo de `errorMessage` cuando `viewMode` es 'simulator' está comentado. Revisar si es necesario.
// Considerar si el estado `loading` global de `useLoading` podría simplificar `isLoadingPageData`.
// Refinar la UX para el cambio entre 'simulator' y 'displayBatches' (ej. con animaciones o transiciones suaves).
//#endregion ![todo]
