"use client";

import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/app/auth/client";
import { useAuth } from "@/app/auth-provider";
import { useRouter } from "next/navigation";
import {
	getProjectBatchesForUser,
} from "@/lib/actions/preclassification-actions";
import { getActivePhaseForProject } from "@/lib/actions/preclassification_phases_actions";
import { useUserProfile, getUserDisplayName } from "@/hooks/useUserProfile";
import { type BatchWithCounts } from "@/lib/types/preclassification-types";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { Filter, Boxes } from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import {
	StandardPieChart,
	type PieChartData,
} from "@/components/charts/StandardPieChart";
import {
	StandardSphereGrid,
	type SphereItemData,
} from "@/components/ui/StandardSphereGrid";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { useJobManager } from "@/app/contexts/JobManagerContext";
import { useDialog } from "@/app/contexts/DialogContext";
import { useTheme } from "@/app/theme-provider";
import { useWindowSize } from "@/lib/hooks/useWindowSize";
import { useLayout } from '@/app/contexts/layout-context';

// Fuente de verdad para los estados de los ARTÍCULOS y su representación visual.
// Alineado con los estados reales del backend (BatchWithCounts) y tooltips del SphereGrid
const ARTICLE_STATUS_VISUALS = {
	pendientesRevision: {
		label: "Pend. Revisión",
		emoticon: "🔔",
		colorScheme: "primary",
	},
	pendientesRevisionTraducido: {
		label: "Pend. Revisión (Traducido)",
		emoticon: "🇪🇸",
		colorScheme: "tertiary",
	},
	pendientesReconciliacion: {
		label: "Pend. Reconciliación",
		emoticon: "🧩",
		colorScheme: "accent",
	},
	reconciliados: {
		label: "Reconciliados",
		emoticon: "🎯",
		colorScheme: "warning",
	},
	enDisputa: { 
		label: "En Disputa", 
		emoticon: "⚠️", 
		colorScheme: "danger" 
	},
	acordados: { 
		label: "Acordados", 
		emoticon: "🤝", 
		colorScheme: "tertiary" 
	},
};

// Orden explícito por estatus para el grid (asegura orden estable y "nativo")
const STATUS_ORDER = [
    'pending',
    'translated',
    'pending_review',
    'reconciliation_pending',
    'agreed',
    'reconciled',
    'disputed',
] as const;

const getOrderedGroupKey = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    const idx = STATUS_ORDER.indexOf(s as typeof STATUS_ORDER[number]);
    // Invertir el índice para que el orden de grupos sea descendente con sort asc
    const reversedIdx = idx >= 0 ? (STATUS_ORDER.length - 1 - idx) : 99;
    const order = String(reversedIdx).padStart(2, '0');
    return `${order}-${s || 'unknown'}`;
};

const getVisualsForStatus = (
	status: string | undefined | null
): { emoticon: string; colorScheme: ColorSchemeVariant } => {
	if (!status) return { emoticon: "❔", colorScheme: "neutral" };
	
	// Mapeo directo a los estados visuales definidos en ARTICLE_STATUS_VISUALS
	// Extrayendo solo emoticon y colorScheme para coincidir con el tipo de retorno
	switch (status.toUpperCase()) {
		case "PENDING":
			return { emoticon: "🕒", colorScheme: "neutral" };
		case "TRANSLATED":
			return { 
				emoticon: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon, 
				colorScheme: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.colorScheme as ColorSchemeVariant 
			};

		case "REVIEW_PENDING":
			return { 
				emoticon: ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon, 
				colorScheme: ARTICLE_STATUS_VISUALS.pendientesRevision.colorScheme as ColorSchemeVariant 
			};
		case "RECONCILIATION_PENDING":
			return { 
				emoticon: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon, 
				colorScheme: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.colorScheme as ColorSchemeVariant 
			};
		case "VALIDATED":
			return { emoticon: "👍🏻", colorScheme: "success" };
		case "RECONCILED":
			return { 
				emoticon: ARTICLE_STATUS_VISUALS.reconciliados.emoticon, 
				colorScheme: ARTICLE_STATUS_VISUALS.reconciliados.colorScheme as ColorSchemeVariant 
			};
		case "DISPUTED":
			return { 
				emoticon: ARTICLE_STATUS_VISUALS.enDisputa.emoticon, 
				colorScheme: ARTICLE_STATUS_VISUALS.enDisputa.colorScheme as ColorSchemeVariant 
			};
		case "AGREED":
			return { 
				emoticon: ARTICLE_STATUS_VISUALS.acordados.emoticon, 
				colorScheme: ARTICLE_STATUS_VISUALS.acordados.colorScheme as ColorSchemeVariant 
			};
		default:
			return { emoticon: "❔", colorScheme: "neutral" };
	}
};

const PreclassificationPage = () => {
	const auth = useAuth();
	const router = useRouter();
	const { profile: userProfile } = useUserProfile();
	const [batches, setBatches] = useState<BatchWithCounts[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [colorMap, setColorMap] = useState<Record<string, string>>({});
	const [activePhase, setActivePhase] = useState<{ id: string; phase_number: number; name: string } | null>(null);
	const { startJob } = useJobManager();
	const { showDialog } = useDialog();
	const { appColorTokens } = useTheme();
    const [groupByStatus, setGroupByStatus] = useState<boolean>(true);
	const [selectedSphereId, setSelectedSphereId] = useState<string | null>(null);

	// (Eliminado) Tipo y función de etiquetas por estado de lote ya no son necesarios en la UI actual

	// Normaliza conteos por estado de artículos para evitar problemas de typing
	const normalizeCounts = (counts: BatchWithCounts['article_counts']): Record<string, number> => ({
		pending: counts?.pending ?? 0,
		translated: counts?.translated ?? 0,
		pending_review: counts?.pending_review ?? 0,
		reconciliation_pending: counts?.reconciliation_pending ?? 0,
		agreed: counts?.agreed ?? 0,
		reconciled: counts?.reconciled ?? 0,
		disputed: counts?.disputed ?? 0,
	});




	// NUEVO: Resumen agregado por estados de artículos (usa claves de la RPC)
	const resumenPorEstadoDeArticulo = useMemo(() => {
		const agg: Record<string, { label: string; emoticon: string; value: number }> = {
			pending: { label: 'Pendientes (Inicial)', emoticon: '🕒', value: 0 },
			translated: { label: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.label, emoticon: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon, value: 0 },
			pending_review: { label: ARTICLE_STATUS_VISUALS.pendientesRevision.label, emoticon: ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon, value: 0 },
			reconciliation_pending: { label: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.label, emoticon: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon, value: 0 },
			agreed: { label: ARTICLE_STATUS_VISUALS.acordados.label, emoticon: ARTICLE_STATUS_VISUALS.acordados.emoticon, value: 0 },
			reconciled: { label: ARTICLE_STATUS_VISUALS.reconciliados.label, emoticon: ARTICLE_STATUS_VISUALS.reconciliados.emoticon, value: 0 },
			disputed: { label: ARTICLE_STATUS_VISUALS.enDisputa.label, emoticon: ARTICLE_STATUS_VISUALS.enDisputa.emoticon, value: 0 },
		};

		for (const lote of batches) {
			const c = lote.article_counts || {} as Record<string, number>;
			agg.pending.value += c.pending || 0;
			agg.translated.value += c.translated || 0;
			agg.pending_review.value += c.pending_review || 0;
			agg.reconciliation_pending.value += c.reconciliation_pending || 0;
			agg.agreed.value += c.agreed || 0;
			agg.reconciled.value += c.reconciled || 0;
			agg.disputed.value += c.disputed || 0;
		}

		return agg;
	}, [batches]);

	const totalValue = useMemo(() => {
		return Object.values(resumenPorEstadoDeArticulo).reduce((sum, item) => sum + (item.value || 0), 0);
	}, [resumenPorEstadoDeArticulo]);

	const sphereGridTitle = useMemo(() => {
		const userName = auth.user?.user_metadata?.full_name || "Investigador";
		if (isLoading) return "Cargando lotes...";
		if (batches.length > 0)
			return `${batches.length} lotes asignados a ${userName}`;
		return "Lotes Asignados";
	}, [auth.user, batches, isLoading]);

	const pieChartData: PieChartData[] = useMemo(() => {
		// Construir el pie por ESTADOS DE ARTÍCULO agregados
		const data = Object.entries(resumenPorEstadoDeArticulo)
			.filter(([, item]) => (item.value || 0) > 0)
			.map(([key, item]) => ({
				id: key,
				value: item.value,
				label: item.label,
				emoticon: item.emoticon,
			}));

		data.sort((a, b) => b.value - a.value);
		return data;
	}, [resumenPorEstadoDeArticulo]);
	const { width: windowWidth } = useWindowSize();
	const { sidebarWidth, layoutGap, globalXPadding } = useLayout();

	// Calcula el ancho disponible restando el sidebar y un padding general
	const containerWidth = windowWidth ? windowWidth - sidebarWidth - layoutGap - globalXPadding : 0;
	
	// 🎯 LÓGICA INTELIGENTE: Altura dinámica según cantidad de lotes
	// Si hay menos de 30 lotes, reducir altura en 40% (usar 60% del original)
	const baseHeight = 500;
	const containerHeight = batches.length < 30 ? Math.floor(baseHeight * 0.6) : baseHeight;
	const gridHeight = containerHeight; // Altura del div contenedor

	const fetchBatches = useCallback(async () => {
		if (!auth.proyectoActual?.id || !auth.user?.id) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Obtener lotes y fase activa en paralelo
			const [batchesResult, phaseResult] = await Promise.all([
				getProjectBatchesForUser(auth.proyectoActual.id, auth.user.id),
				getActivePhaseForProject(auth.proyectoActual.id)
			]);

			if (batchesResult.success) {
				setBatches(batchesResult.data);
			} else {
				setError(batchesResult.error);
				setBatches([]);
			}

			// Establecer la fase activa si existe
			if (phaseResult.data) {
				setActivePhase({
					id: phaseResult.data.id,
					phase_number: phaseResult.data.phase_number,
					name: phaseResult.data.name
				});
			} else {
				setActivePhase(null);
			}
		} catch (err) {
			console.error("Error al cargar datos:", err);
			setError("Error inesperado al cargar los datos");
			setBatches([]);
			setActivePhase(null);
		} finally {
			setIsLoading(false);
		}
	}, [auth.proyectoActual?.id, auth.user?.id]);

	// Efecto para la carga inicial
	useEffect(() => {
		setIsLoading(true);
		fetchBatches();
	}, [fetchBatches]); // fetchBatches es la única dependencia necesaria gracias a useCallback

	// Efecto para la suscripción a Supabase Realtime
	useEffect(() => {
		if (!supabase) return;

		const channel = supabase.channel("realtime-lotes-de-trabajo");
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _ = channel
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "article_batches" },
				(payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
					console.log(
						"✅ Cambio detectado en un lote, recargando datos:",
						payload
					);
					fetchBatches();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [fetchBatches]);

	const handleSphereClick = useCallback((batch: BatchWithCounts) => {
		setSelectedSphereId(batch.id);
		// Comprobar el estado del lote
		if (batch.status === 'pending') {
			// Si está 'pending', ejecutar la lógica de INICIAR TRADUCCIÓN
			console.log(`Activando flujo de traducción para el lote: ${batch.id}`);
			showDialog({
				title: 'Confirmar Traducción',
				content: `¿Deseas enviar a traducir el Lote #${batch.batch_number}?`,
				confirmText: "Sí, Iniciar Traducción",
				cancelText: "No, cancelar",
				colorScheme: "primary",
				onConfirm: () => {
					if (!auth.proyectoActual?.id) {
						showDialog({
							title: "Error: Proyecto No Seleccionado",
							content: "No se puede iniciar un trabajo sin un proyecto activo. Por favor, asegúrate de tener un proyecto seleccionado.",
							confirmText: "Entendido",
							colorScheme: "danger",
							onConfirm: () => {},
						});
						return;
					}
					startJob({
						type: 'TRANSLATE_BATCH',
						title: `Traduciendo Lote #${batch.batch_number}`,
						payload: { 
							batchId: batch.id, 
							userId: auth.user?.id || 'unknown_user',
							projectId: auth.proyectoActual.id, // Proyecto activo
						},
					});
				},
			});
		} else {
			// Para cualquier otro estado, ejecutar la lógica de NAVEGACIÓN
			console.log(`Navegando al detalle del lote: ${batch.id}`);
			router.push(`/articulos/preclasificacion/${batch.id}`);
		}
	}, [auth.proyectoActual?.id, auth.user?.id, router, showDialog, startJob]);

	const sphereData: SphereItemData[] = useMemo(() => {
		return batches.map((batch) => {
			const visuals = getVisualsForStatus(batch.status);
			const counts = normalizeCounts(batch.article_counts);
			
			// Calcular total incluyendo TODOS los estados disponibles
			const totalArticles =
				counts.pending +
				counts.translated +
				counts.pending_review +
				counts.reconciliation_pending +
				counts.agreed +
				counts.reconciled +
				counts.disputed;

			return {
				id: batch.id,
				keyGroup: getOrderedGroupKey(batch.status as string),
				emoticon: visuals.emoticon,
				value: batch.batch_number,
				colorScheme: visuals.colorScheme,
				styleType: selectedSphereId === batch.id ? 'outline' : 'filled',
				onClick: () => handleSphereClick(batch),
				// Tooltip completo con todos los estados disponibles y emoticonos alineados
				tooltip: [
					`*Lote:* ${batch.batch_number} - *Total:* ${totalArticles}`,
					"---",
					`🕒 *Pendientes:* ${counts.pending}`,
					`${ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon} *Pend. Revisión (Traducido):* ${counts.translated}`,
					`${ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon} *Pend. Revisión:* ${counts.pending_review}`,
					`${ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon} *Pend. Reconciliación:* ${counts.reconciliation_pending}`,
					`${ARTICLE_STATUS_VISUALS.acordados.emoticon} *Acordados:* ${counts.agreed}`,
					`${ARTICLE_STATUS_VISUALS.reconciliados.emoticon} *Reconciliados:* ${counts.reconciled}`,
					`${ARTICLE_STATUS_VISUALS.enDisputa.emoticon} *En Disputa:* ${counts.disputed}`,
				].join("\n"),
			};
		});
	}, [batches, handleSphereClick, selectedSphereId]);

	// Título condicional basado en la existencia de lotes y la fase activa
	const pageSubtitle = useMemo(() => {
		const userName = getUserDisplayName(auth.user, userProfile);
		if (!activePhase) {
			return `${userName}, no hay una fase activa configurada`;
		}

		const phaseInfo = `Fase ${activePhase.phase_number}: ${activePhase.name}`;
		if (batches.length === 0 && !isLoading) {
			return `${userName}, aún no se asignan lotes para la ${phaseInfo}`;
		} else {
			return `${userName}, estos son tus lotes asignados para la ${phaseInfo}`;
		}
	}, [auth.user, userProfile, activePhase, batches.length, isLoading]);

	return (
		<div className="w-full h-full p-4 sm:p-6 flex flex-col">
			<StandardPageTitle
				title="Preclasificación de Artículos"
				mainIcon={Filter}
				subtitle={pageSubtitle}
				showBackButton={{ href: "/articulos" }}
				breadcrumbs={[
					{ label: "Artículos", href: "/articulos" },
					{ label: "Preclasificación" },
				]}
			/>
			<div className="mt-6 flex-grow flex flex-col gap-6">
				{/* Mostrar empty state independiente cuando no hay lotes */}
				{!isLoading && batches.length === 0 && !error ? (
					<StandardCard
						animateEntrance
						colorScheme="primary"
						accentPlacement="top"
						accentColorScheme="primary"
						shadow="md"
						className="flex-1"
						styleType="subtle"
						hasOutline={false}>
						<StandardCard.Header>
							<StandardText size="lg" weight="semibold">
								Lotes Asignados
							</StandardText>
						</StandardCard.Header>
						<StandardCard.Content className="p-8 flex-1 flex items-center justify-center">
							<StandardEmptyState
								icon={Boxes}
								title={activePhase ? 
									`Aún no tienes lotes asignados` : 
									`No hay una fase activa configurada`
								}
								description={activePhase ? 
									`Para comenzar con la preclasificación de artículos en la Fase ${activePhase.phase_number}: ${activePhase.name}, primero necesitas crear y asignar lotes. Los lotes organizan los artículos en grupos manejables para su revisión.` :
									`Antes de poder crear lotes y comenzar la preclasificación, necesitas configurar y activar una fase en la gestión de fases del proyecto.`
								}
								colorScheme="blue"
								action={
									<StandardButton
										colorScheme="primary"
										styleType="solid"
										size="md"
										onClick={() => router.push(activePhase ? '/datos-maestros/lote' : '/datos-maestros/fases')}
										leftIcon={Boxes}>
										{activePhase ? 'Ir a Gestión de Lotes' : 'Ir a Gestión de Fases'}
									</StandardButton>
								}
							/>
						</StandardCard.Content>
					</StandardCard>
				) : (
					/* Mostrar SphereGrid solo cuando hay lotes o está cargando */
					<div className="w-full">
						{/* Toggle de agrupación por estatus */}
						<div className="flex items-center justify-end mb-2">
							<StandardText size="sm" className="mr-2">Agrupar por estatus</StandardText>
							<StandardSwitch
								checked={groupByStatus}
								onCheckedChange={(v) => setGroupByStatus(Boolean(v))}
								colorScheme="primary"
							/>
						</div>
						<div style={{ height: `${gridHeight}px` }}>
							{containerWidth && (
								<StandardSphereGrid
									items={sphereData}
									containerWidth={containerWidth}
									containerHeight={containerHeight}
									sortBy="value"
									sortDirection="asc"
									groupByKeyGroup={groupByStatus}
									forceBadge={false}
									title={sphereGridTitle}
									isLoading={isLoading}
									loadingMessage="Cargando lotes..."
									emptyStateText={
										error ? `Error: ${error}` : "No hay lotes disponibles."
									}
								/>
							)}
						</div>
					</div>
				)}

				{pieChartData.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<StandardCard
							title="Resumen de Artículos"
							className="md:col-span-2">
							<StandardCard.Content>
								<StandardPieChart
									data={pieChartData}
									onColorMapGenerated={setColorMap}
									totalValue={totalValue}
								/>
							</StandardCard.Content>
						</StandardCard>
						<StandardCard title="Leyenda">
							<StandardCard.Content>
								<div className="flex flex-col space-y-3">
								{Object.entries(resumenPorEstadoDeArticulo).map(
									([key, item]) => {
										const count = item.value;
										const percentage =
											totalValue > 0
												? ((count / totalValue) * 100).toFixed(1)
												: "0.0";
										const color =
											colorMap[key] || appColorTokens.neutral.text;
										return (
											<div key={key} className="flex items-center space-x-3">
												<div
													className="w-4 h-4 rounded-full"
													style={{ backgroundColor: color }}
												/>
												<StandardText
													size="sm"
													className="flex items-baseline">
													<span>
														{item.emoticon} {item.label} ({count})
													</span>
														{parseFloat(percentage) > 0 && (
															<span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
																({percentage}%)
															</span>
														)}
													</StandardText>
												</div>
											);
										}
									)}
								</div>
							</StandardCard.Content>
						</StandardCard>
					</div>
				)}
			</div>
		</div>
	);
};

export default PreclassificationPage;
