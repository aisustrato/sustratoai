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

	// Tipo para agrupar lotes por estado
	type ResumenPorEstadoDeLote = Record<string, {
		cantidadLotes: number;
		totalArticulos: number;
		label: string;
		emoticon: string;
		colorScheme: ColorSchemeVariant;
	}>;

	// Función auxiliar para obtener etiquetas legibles de estados de lote
	const getEstadoLoteLabel = (estado: string): string => {
		switch (estado.toUpperCase()) {
			case 'PENDING': return 'Pend. Revisión';
			case 'TRANSLATED': return 'Pend. Revisión (Traducido)';
			case 'REVIEW_PENDING': return 'Pend. Revisión';
			case 'RECONCILIATION_PENDING': return 'Pend. Reconciliación';
			case 'VALIDATED': return 'Validados';
			case 'RECONCILED': return 'Reconciliados';
			case 'DISPUTED': return 'En Disputa';
			case 'AGREED': return 'Acordados';
			default: return estado;
		}
	};

	// Agrupación de lotes por su estado (no por estados de artículos individuales)
	const resumenPorEstadoDeLote: ResumenPorEstadoDeLote = useMemo(() => {
		const grupos: ResumenPorEstadoDeLote = {};
		
		batches.forEach((lote) => {
			const estado = lote.status || 'UNKNOWN';
			const visuals = getVisualsForStatus(estado);
			
			// Calcular total de artículos en este lote
			const counts = lote.article_counts;
			const totalArticulosEnLote = 
				(counts?.pending_review || 0) +
				(counts?.reconciliation_pending || 0) +
				(counts?.agreed || 0) +
				(counts?.reconciled || 0) +
				(counts?.disputed || 0);
			
			// Inicializar grupo si no existe
			if (!grupos[estado]) {
				grupos[estado] = {
					cantidadLotes: 0,
					totalArticulos: 0,
					label: getEstadoLoteLabel(estado),
					emoticon: visuals.emoticon,
					colorScheme: visuals.colorScheme,
				};
			}
			
			// Sumar lote y sus artículos al grupo
			grupos[estado].cantidadLotes += 1;
			grupos[estado].totalArticulos += totalArticulosEnLote;
		});
		
		return grupos;
	}, [batches]);
	


	const totalValue = useMemo(() => {
		return Object.values(resumenPorEstadoDeLote).reduce((sum, grupo) => sum + grupo.totalArticulos, 0);
	}, [resumenPorEstadoDeLote]);

	const sphereGridTitle = useMemo(() => {
		const userName = auth.user?.user_metadata?.full_name || "Investigador";
		if (isLoading) return "Cargando lotes...";
		if (batches.length > 0)
			return `${batches.length} lotes asignados a ${userName}`;
		return "Lotes Asignados";
	}, [auth.user, batches, isLoading]);

	const pieChartData: PieChartData[] = useMemo(() => {
		// Convertir resumenPorEstadoDeLote a formato PieChartData
		const data = Object.entries(resumenPorEstadoDeLote)
			.filter(([, grupo]) => grupo.totalArticulos > 0)
			.map(([estado, grupo]) => ({
				id: estado,
				value: grupo.totalArticulos,
				label: grupo.label,
				emoticon: grupo.emoticon,
			}));

		// Ordenar por cantidad de artículos (mayor a menor) para mejor visualización
		data.sort((a, b) => b.value - a.value);

		return data;
	}, [resumenPorEstadoDeLote]);
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
			const counts = batch.article_counts;
			
			// Calcular total incluyendo TODOS los estados disponibles
			const totalArticles =
				(counts?.pending_review || 0) +
				(counts?.reconciliation_pending || 0) +
				(counts?.agreed || 0) +
				(counts?.reconciled || 0) +
				(counts?.disputed || 0);

			return {
				id: batch.id,
				keyGroup: batch.status,
				emoticon: visuals.emoticon,
				value: batch.batch_number,
				colorScheme: visuals.colorScheme,
				onClick: () => handleSphereClick(batch),
				// Tooltip completo con todos los estados disponibles y emoticonos alineados
				tooltip: [
					`*Lote:* ${batch.batch_number} - *Total:* ${totalArticles}`,
					"---",
					`${ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon} *Pend. Revisión:* ${counts?.pending_review || 0}`,
					`${ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon} *Pend. Reconciliación:* ${counts?.reconciliation_pending || 0}`,
					`${ARTICLE_STATUS_VISUALS.acordados.emoticon} *Acordados:* ${counts?.agreed || 0}`,
					`${ARTICLE_STATUS_VISUALS.reconciliados.emoticon} *Reconciliados:* ${counts?.reconciled || 0}`,
					`${ARTICLE_STATUS_VISUALS.enDisputa.emoticon} *En Disputa:* ${counts?.disputed || 0}`,
				].join("\n"),
				statusBadge: counts?.pending_review
					? {
							text: counts.pending_review.toString(),
							colorScheme: "warning",
							tooltip: `${counts.pending_review} artículos pendientes de revisión`,
					  }
					: undefined,
			};
		});
	}, [batches, handleSphereClick]);

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
					<div className="w-full" style={{ height: `${gridHeight}px` }}>
						{containerWidth && (
							<StandardSphereGrid
								items={sphereData}
								containerWidth={containerWidth}
								containerHeight={containerHeight}
								groupByKeyGroup
								forceBadge={true}
								title={sphereGridTitle}
								isLoading={isLoading}
								loadingMessage="Cargando lotes..."
								emptyStateText={
									error ? `Error: ${error}` : "No hay lotes disponibles."
								}
							/>
						)}
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
								{Object.entries(resumenPorEstadoDeLote).map(
									([estado, grupo]) => {
										const count = grupo.totalArticulos;
										const percentage =
											totalValue > 0
												? ((count / totalValue) * 100).toFixed(1)
												: "0.0";
										const color =
											colorMap[estado] || appColorTokens.neutral.text;

											return (
											<div key={estado} className="flex items-center space-x-3">
												<div
													className="w-4 h-4 rounded-full"
													style={{ backgroundColor: color }}
												/>
												<StandardText
													size="sm"
													className="flex items-baseline">
													<span>
														{grupo.emoticon} {grupo.label} ({count})
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
