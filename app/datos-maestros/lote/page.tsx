//. 📍 app/datos-maestros/lote/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
		label: "Pend. Revisión",
		emoticon: "�",
		colorScheme: "accent" as ColorSchemeVariant,
	},
	pendientesRevisionTraducido: {
		label: "Traducido",
		emoticon: "�",
		colorScheme: "secondary" as ColorSchemeVariant,
	},
	pendientesReconciliacion: {
		label: "Pend. Reconciliación",
		emoticon: "�",
		colorScheme: "warning" as ColorSchemeVariant,
	},
	validados: {
		label: "Validados",
		emoticon: "✅",
		colorScheme: "success" as ColorSchemeVariant,
	},
	reconciliados: {
		label: "Reconciliados",
		emoticon: "🎯",
		colorScheme: "primary" as ColorSchemeVariant,
	},
	enDisputa: {
		label: "En Disputa",
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
			setError("No hay proyecto activo.");
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
						"Error al obtener el estado del proceso de loteo.",
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
				default:
					setViewState("error");
					setError("Estado desconocido recibido del servidor.");
			}
		} catch (error) {
			console.error("❌ Excepción al cargar estado de loteo:", error);
			setViewState("error");
			setError(
				`Error interno: ${error instanceof Error ? error.message : "Error desconocido"}`,
			);
		}
	}, [proyectoActual?.id]);

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
			return { success: false, error: "No hay proyecto activo o fase activa." };
		}
		if (!permisoGestionGeneral) {
			return {
				success: false,
				error: "No tienes permisos para resetear lotes.",
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
					message: `Se eliminaron ${result.data.deletedBatches} lotes y ${result.data.deletedItems} elementos.`,
				};
			} else {
				return { success: false, error: result.error };
			}
		} catch (error) {
			return {
				success: false,
				error: `Error interno: ${error instanceof Error ? error.message : "Error desconocido"}`,
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
				<SustratoLoadingLogo text="Cargando estado del proceso de loteo..." />
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
							Proyecto No Seleccionado
						</StandardText>
					</StandardCard.Header>
					<StandardCard.Content>
						<StandardText>
							Por favor, selecciona un proyecto activo para gestionar los lotes.
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
							`Gestión de Lotes fase ${activePhaseInfo.phase_number}: ${activePhaseInfo.name}`
						:	"Gestión de Lotes por Fases"
					}
					subtitle={
						viewState === "no_active_phase" ? "Sin fase activa"
						: viewState === "universe_not_defined" ?
							"Configuración requerida"
						: viewState === "batches_created" ?
							"Lotes creados"
						: viewState === "error" ?
							"Error en el proceso"
						:	"Cargando..."
					}
					description="Sistema de loteo inteligente basado en fases del proyecto"
					showBackButton={{ href: "/datos-maestros" }}
					breadcrumbs={[
						{ label: "Datos maestros", href: "/datos-maestros" },
						{ label: "Lotes", href: "/datos-maestros/lote" },
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
								No hay fase activa
							</StandardText>
						</StandardCard.Header>
						<StandardCard.Content className="space-y-4">
							<StandardText>
								Para crear lotes de artículos, primero necesitas tener una fase
								de preclasificación activa.
							</StandardText>
							<div className="flex justify-center">
								<Link href="/datos-maestros/fases-preclasificacion">
									<StandardButton
										colorScheme="warning"
										styleType="solid"
										rightIcon={ArrowRight}>
										Ir a Gestión de Fases
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
								Universo de artículos no definido
							</StandardText>
						</StandardCard.Header>
						<StandardCard.Content className="space-y-4">
							<StandardText>
								La fase {batchingStatus.activePhase.phase_number} está activa,
								pero no tiene artículos elegibles definidos. Necesitas
								configurar el universo de artículos antes de crear lotes.
							</StandardText>
							<div className="flex justify-center">
								<Link
									href={`/datos-maestros/fases-preclasificacion?phase=${batchingStatus.activePhase.id}`}>
									<StandardButton
										colorScheme="accent"
										styleType="solid"
										rightIcon={ArrowRight}>
										Configurar Artículos Elegibles
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
											`Lotes - Fase ${allPhases.find((p) => p.id === selectedPhaseId)?.phase_number}`
										:	`Todos los Lotes - ${batchesData.length} lotes en ${allPhases.length} fase(s)`
										}
									</StandardText>
									<StandardText size="sm" className="text-muted-foreground">
										{filteredBatches.length} lotes mostrados
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
											placeholder="Todas las fases"
											options={[
												{ value: "", label: "📋 Todas las fases" },
												...allPhases.map((phase) => ({
													value: phase.id,
													label: `Fase ${phase.phase_number}: ${phase.name}${phase.status === "active" ? " (Activa)" : ""}`,
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
										{isResetting ? "Reseteando..." : "Resetear"}
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
										batch.assigned_member_name || "Sin asignar";

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
											`*Lote:* ${batch.batch_number}${batch.is_closed ? " 🔒 CERRADO" : ""}`,
											`*Fase:* ${batch.phase_name} (${batch.phase_number})`,
											`*Investigador:* ${assignedMember}`,
											`*Total Artículos:* ${total}`,
											"---",
											`⏳ *Pendientes:* ${counts.pending}`,
											`${ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon} *Traducido:* ${counts.translated}`,
											`${ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon} *Pend. Revisión:* ${counts.pending_review}`,
											`${ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon} *Pend. Reconciliación:* ${counts.reconciliation_pending}`,
											`${ARTICLE_STATUS_VISUALS.validados.emoticon} *Validados:* ${counts.validated}`,
											`${ARTICLE_STATUS_VISUALS.reconciliados.emoticon} *Reconciliados:* ${counts.reconciled}`,
											`${ARTICLE_STATUS_VISUALS.enDisputa.emoticon} *En Disputa:* ${counts.disputed}`,
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
													tooltip: `Asignado a: ${assignedMember}`,
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
										`Lotes - Fase ${allPhases.find((p) => p.id === selectedPhaseId)?.phase_number}`
									:	"Todos los Lotes"
								}
								isLoading={false}
								loadingMessage="Cargando lotes..."
								emptyStateText={
									selectedPhaseId ?
										"Sin lotes en esta fase"
									:	"No hay lotes para mostrar."
								}
							/>
						)}
					</div>

					{/* Leyenda de estados - alineada con preclasificación */}
					<StandardCard
						title="Estados de Artículos"
						colorScheme="primary"
						styleType="subtle"
						hasOutline={false}
						shadow="md">
						<StandardCard.Content>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{Object.entries(ARTICLE_STATUS_VISUALS).map(
									([key, { label, emoticon, colorScheme }]) => (
										<div key={key} className="flex items-center gap-2">
											<div
												className={`w-4 h-4 rounded-full bg-${colorScheme}-500`}
											/>
											<span>{emoticon}</span>
											<StandardText size="sm">{label}</StandardText>
										</div>
									),
								)}
							</div>
							<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<StandardText size="xs" className="text-muted-foreground">
									💡 El color de cada esfera representa el{" "}
									<strong>peor estado</strong> presente en el lote.
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
							Error en el Sistema de Lotes
						</StandardText>
					</StandardCard.Header>
					<StandardCard.Content className="space-y-4">
						<StandardText>
							{error && "Ha ocurrido un error inesperado."}
						</StandardText>
						<div className="flex justify-center">
							<StandardButton
								colorScheme="danger"
								styleType="outline"
								onClick={cargarEstadoLoteo}>
								Reintentar
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
