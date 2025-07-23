"use client";

import React, {
	useState,
	useEffect,
	useMemo,
	useRef,
	useCallback,
} from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/app/auth/client";
import { useAuth } from "@/app/auth-provider";
import { useRouter } from "next/navigation";
import {
	getProjectBatchesForUser,
	type BatchWithCounts,
} from "@/lib/actions/preclassification-actions";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { ClipboardList } from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
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
const ARTICLE_STATUS_VISUALS = {
	pendientesRevision: {
		label: "Pend. Revisión",
		emoticon: "🔍",
		colorScheme: "primary",
	},
	pendientesRevisionTraducido: {
		label: "Pend. Revisión (Traducido)",
		emoticon: "🇪🇸",
		colorScheme: "tertiary",
	},
	pendientesReconciliacion: {
		label: "Pend. Reconciliación",
		emoticon: "🔄",
		colorScheme: "accent",
	},
	validados: { label: "Validados", emoticon: "⚖️", colorScheme: "warning" },
	reconciliados: {
		label: "Reconciliados",
		emoticon: "✅",
		colorScheme: "success",
	},
	enDisputa: { label: "En Disputa", emoticon: "⚠️", colorScheme: "danger" },
	acordados: { label: "Acordados", emoticon: "🤝", colorScheme: "tertiary" },
};

const getVisualsForStatus = (
	status: string | undefined | null
): { emoticon: string; colorScheme: ColorSchemeVariant } => {
	if (!status) return { emoticon: "❔", colorScheme: "neutral" };
	switch (status.toUpperCase()) {
		case "PENDING":
			return { emoticon: "🔍", colorScheme: "neutral" };
		case "TRANSLATED":
			return { emoticon: "🇪🇸", colorScheme: "tertiary" };
		case "REVIEW_PENDING":
			return { emoticon: "🔍", colorScheme: "primary" };
		case "RECONCILIATION_PENDING":
			return { emoticon: "🔄", colorScheme: "accent" };
		case "VALIDATED":
			return { emoticon: "👍🏻", colorScheme: "warning" };
		case "RECONCILED":
			return { emoticon: "🤝", colorScheme: "success" };
		case "DISPUTED":
			return { emoticon: "⚠️", colorScheme: "danger" };
		default:
			return { emoticon: "❔", colorScheme: "neutral" };
	}
};

const PreclassificationPage = () => {
	const auth = useAuth();
	const router = useRouter();
	const [batches, setBatches] = useState<BatchWithCounts[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [colorMap, setColorMap] = useState<Record<string, string>>({});
	const { startJob } = useJobManager();
	const { showDialog } = useDialog();
	const { appColorTokens } = useTheme();

	type ResumenGeneral = {
		pendientesRevision: number;
		pendientesRevisionTraducido: number;
		pendientesReconciliacion: number;
		reconciliados: number;
		enDisputa: number;
		acordados: number;
	};

	const resumenGeneral: ResumenGeneral = useMemo(() => {
		return batches.reduce(
			(acc: ResumenGeneral, lote: BatchWithCounts) => {
				const pendingReviewCount = lote.article_counts?.pending_review || 0;
				if (lote.status?.toUpperCase() === "TRANSLATED") {
					acc.pendientesRevisionTraducido += pendingReviewCount;
				} else {
					acc.pendientesRevision += pendingReviewCount;
				}
				acc.pendientesReconciliacion +=
					lote.article_counts?.reconciliation_pending || 0;
				acc.reconciliados += lote.article_counts?.reconciled || 0;
				acc.enDisputa += lote.article_counts?.disputed || 0;
				acc.acordados += lote.article_counts?.agreed || 0;
				return acc;
			},
			{
				pendientesRevision: 0,
				pendientesRevisionTraducido: 0,
				pendientesReconciliacion: 0,
				reconciliados: 0,
				enDisputa: 0,
				acordados: 0,
			}
		);
	}, [batches]);

	const totalValue = useMemo(() => {
		return Object.values(resumenGeneral).reduce((sum, count) => sum + count, 0);
	}, [resumenGeneral]);

	const sphereGridTitle = useMemo(() => {
		const userName = auth.user?.user_metadata?.full_name || "Investigador";
		if (isLoading) return "Cargando lotes...";
		if (batches.length > 0)
			return `${batches.length} lotes asignados a ${userName}`;
		return "Lotes Asignados";
	}, [auth.user, batches, isLoading]);

	const pieChartData: PieChartData[] = useMemo(() => {
		const data = (
			Object.entries(resumenGeneral) as [keyof ResumenGeneral, number][]
		)
			.filter(([, value]) => value > 0)
			.map(([key, value]) => {
				const visualInfo =
					ARTICLE_STATUS_VISUALS[key as keyof typeof ARTICLE_STATUS_VISUALS];
				return {
					id: key,
					value: value,
					label: visualInfo?.label || key,
					emoticon: visualInfo?.emoticon,
				};
			});

		// Reordenar para que 'Traducido' venga después de 'Pend. Revisión'
		const translatedIndex = data.findIndex(
			(item) => item.id === "pendientesRevisionTraducido"
		);
		if (translatedIndex > -1) {
			const translatedItem = data.splice(translatedIndex, 1)[0];
			const normalIndex = data.findIndex(
				(item) => item.id === "pendientesRevision"
			);
			if (normalIndex > -1) {
				data.splice(normalIndex + 1, 0, translatedItem);
			} else {
				data.unshift(translatedItem);
			}
		}

		return data;
	}, [resumenGeneral]);
	const { width: windowWidth, height: windowHeight } = useWindowSize();
	const { sidebarWidth, layoutGap, globalXPadding } = useLayout();

	// Calcula el ancho disponible restando el sidebar y un padding general
	const containerWidth = windowWidth ? windowWidth - sidebarWidth - layoutGap - globalXPadding : 0;
	// La altura puede ser fija o depender de la ventana menos la navbar, etc.
	const containerHeight = 500; // Mantenemos la altura fija del div por ahora

	const fetchBatches = useCallback(async () => {
		if (auth.authLoading) return; // No hacer nada si la autenticación aún está en proceso

		const userId = auth.user?.id;
		const projectId = auth.proyectoActual?.id;

		if (projectId && userId) {
			setError(null);
			const result = await getProjectBatchesForUser(projectId, userId);
			if (result.success) {
				setBatches(result.data || []);
			} else {
				setError(result.error || "Ocurrió un error desconocido.");
				setBatches([]);
			}
		} else {
			// Si no hay proyecto o usuario, no mostrar error, sino un estado vacío.
			setBatches([]);
		}
		setIsLoading(false);
	}, [auth.user, auth.proyectoActual, auth.authLoading]);

	// Efecto para la carga inicial
	useEffect(() => {
		setIsLoading(true);
		fetchBatches();
	}, [fetchBatches]); // fetchBatches es la única dependencia necesaria gracias a useCallback

	// Efecto para la suscripción a Supabase Realtime
	useEffect(() => {
		if (!supabase) return;

		const channel = supabase.channel("realtime-lotes-de-trabajo");
		const subscription = channel
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "article_batches" },
				(payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
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

	const handleSphereClick = (batch: BatchWithCounts) => {
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
	};

	const sphereData: SphereItemData[] = useMemo(() => {
		return batches.map((batch) => {
			const visuals = getVisualsForStatus(batch.status);
			const counts = batch.article_counts;
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
				tooltip: [
					`*Lote:* ${batch.batch_number} - *Total:* ${totalArticles}`,
					"---",
					`*Pend. Revisión:* ${counts?.pending_review || 0}`,
					`*Pend. Reconciliación:* ${counts?.reconciliation_pending || 0}`,
					`*Acordados:* ${counts?.agreed || 0}`,
					`*Reconciliados:* ${counts?.reconciled || 0}`,
					`*En Disputa:* ${counts?.disputed || 0}`,
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
	}, [batches]);

	return (
		<div className="w-full h-full p-4 sm:p-6 flex flex-col">
			<StandardPageTitle
				title="Preclasificación de Artículos"
				mainIcon={ClipboardList}
				subtitle="Visualiza y gestiona el estado de los artículos de los lotes activos."
				showBackButton={{ href: "/articulos" }}
				breadcrumbs={[
					{ label: "Artículos", href: "/articulos" },
					{ label: "Preclasificación" },
				]}
			/>
			<div className="mt-6 flex-grow flex flex-col gap-6">
				<div className="h-[500px] w-full">
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
								error ? `Error: ${error}` : "No hay lotes para mostrar."
							}
						/>
					)}
				</div>

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
									{Object.entries(ARTICLE_STATUS_VISUALS).map(
										([key, { label, emoticon }]) => {
											const count =
												resumenGeneral[key as keyof ResumenGeneral] || 0;
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
															{emoticon} {label} ({count})
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
