"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/app/auth/client";
import { useAuth } from "@/app/auth-provider";
import { useRouter } from "next/navigation";
import { getProjectBatchesForUser } from "@/lib/actions/preclassification-actions";
import {
	getActivePhaseForProject,
	getPhasesForProject,
} from "@/lib/actions/preclassification_phases_actions";
import { useUserProfile, getUserDisplayName } from "@/hooks/useUserProfile";
import { type BatchWithCounts } from "@/lib/types/preclassification-types";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { Filter, Boxes } from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardSelect } from "@/components/ui/StandardSelect";
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
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { useWindowSize } from "@/lib/hooks/useWindowSize";
import { useLayout } from "@/app/contexts/layout-context";

// Fuente de verdad para los estados de los ARTÍCULOS y su representación visual.
// Alineado con los estados reales del backend (BatchWithCounts) y tooltips del SphereGrid
// 🎨 ESQUEMA ACTUALIZADO: Evita conflictos visuales (amarillo en warning, verde en success)
const ARTICLE_STATUS_VISUALS = {
	pendientesRevision: {
		label: "Pend. Revisión",
		emoticon: "🔔",
		colorScheme: "accent",
	},
	pendientesRevisionTraducido: {
		label: "Traducido",
		emoticon: "🌐",
		colorScheme: "secondary",
	},
	pendientesReconciliacion: {
		label: "Pend. Reconciliación",
		emoticon: "🔄",
		colorScheme: "warning",
	},
	validados: {
		label: "Validados",
		emoticon: "✅",
		colorScheme: "success",
	},
	reconciliados: {
		label: "Reconciliados",
		emoticon: "🎯",
		colorScheme: "primary",
	},
	enDisputa: {
		label: "En Disputa",
		emoticon: "⚡",
		colorScheme: "danger",
	},
};

// Orden explícito por estatus para el grid (asegura orden estable y "nativo")
const STATUS_ORDER = [
	"pending",
	"translated",
	"pending_review",
	"reconciliation_pending",
	"validated",
	"reconciled",
	"disputed",
] as const;

const getOrderedGroupKey = (status?: string | null) => {
	const s = (status || "").toLowerCase();
	const idx = STATUS_ORDER.indexOf(s as (typeof STATUS_ORDER)[number]);
	// Invertir el índice para que el orden de grupos sea descendente con sort asc
	const reversedIdx = idx >= 0 ? STATUS_ORDER.length - 1 - idx : 99;
	const order = String(reversedIdx).padStart(2, "0");
	return `${order}-${s || "unknown"}`;
};

const getVisualsForStatus = (
	status: string | undefined | null,
): { emoticon: string; colorScheme: ColorSchemeVariant } => {
	if (!status) return { emoticon: "❔", colorScheme: "neutral" };

	// Mapeo directo a los estados visuales definidos en ARTICLE_STATUS_VISUALS
	// Extrayendo solo emoticon y colorScheme para coincidir con el tipo de retorno
	switch (status.toUpperCase()) {
		case "PENDING":
			return { emoticon: "⏳", colorScheme: "neutral" };
		case "TRANSLATED":
			return {
				emoticon: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon,
				colorScheme: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido
					.colorScheme as ColorSchemeVariant,
			};

		case "REVIEW_PENDING":
			return {
				emoticon: ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon,
				colorScheme: ARTICLE_STATUS_VISUALS.pendientesRevision
					.colorScheme as ColorSchemeVariant,
			};
		case "RECONCILIATION_PENDING":
			return {
				emoticon: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon,
				colorScheme: ARTICLE_STATUS_VISUALS.pendientesReconciliacion
					.colorScheme as ColorSchemeVariant,
			};
		case "VALIDATED":
			return {
				emoticon: ARTICLE_STATUS_VISUALS.validados.emoticon,
				colorScheme: ARTICLE_STATUS_VISUALS.validados
					.colorScheme as ColorSchemeVariant,
			};
		case "RECONCILED":
			return {
				emoticon: ARTICLE_STATUS_VISUALS.reconciliados.emoticon,
				colorScheme: ARTICLE_STATUS_VISUALS.reconciliados
					.colorScheme as ColorSchemeVariant,
			};
		case "DISPUTED":
			return {
				emoticon: ARTICLE_STATUS_VISUALS.enDisputa.emoticon,
				colorScheme: ARTICLE_STATUS_VISUALS.enDisputa
					.colorScheme as ColorSchemeVariant,
			};
		default:
			return { emoticon: "❔", colorScheme: "neutral" };
	}
};

// 🎯 NUEVA FUNCIÓN: Determina el color de la esfera basado en el PEOR estado presente
// Prioridad (peor primero): Disputa > Reconciliado > Pend.Reconciliación > Pend.Revisión > Traducido > Pendientes > Validados
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
	// Si hay al menos 1 artículo en un estado peor, ese color prevalece

	// 1. DISPUTA (rojo) - peor estado, siempre gana si hay alguno
	if (counts.disputed > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.enDisputa.emoticon,
			colorScheme: "danger",
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// 2. RECONCILIADO (primary/azul)
	if (counts.reconciled > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.reconciliados.emoticon,
			colorScheme: "primary",
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// 3. PEND. RECONCILIACIÓN (warning/amarillo)
	if (counts.reconciliation_pending > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon,
			colorScheme: "warning",
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// 4. PEND. REVISIÓN (accent)
	if (counts.pending_review > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon,
			colorScheme: "accent",
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// 5. TRADUCIDO (secondary)
	if (counts.translated > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon,
			colorScheme: "secondary",
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// 6. PENDIENTES (neutral)
	if (counts.pending > 0) {
		return {
			emoticon: "⏳",
			colorScheme: "neutral",
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// 7. VALIDADOS (verde) - mejor estado
	// Si el lote está cerrado y todo está validado → primary suave (subtle)
	// Si el lote NO está cerrado y todo está validado → verde fuerte (filled)
	if (counts.validated > 0) {
		return {
			emoticon: ARTICLE_STATUS_VISUALS.validados.emoticon,
			colorScheme: "success",
			// 🔑 VERDE FUERTE solo si no está cerrado, si está cerrado usar subtle
			styleType: isClosed ? "subtle" : "filled",
		};
	}

	// Default: neutral
	return {
		emoticon: "❔",
		colorScheme: "neutral",
		styleType: "subtle",
	};
};

const PreclassificationPage = () => {
	const auth = useAuth();
	const router = useRouter();
	const { profile: userProfile } = useUserProfile();
	const [batches, setBatches] = useState<BatchWithCounts[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedSphereId, setSelectedSphereId] = useState<string | null>(null);
	const [activePhase, setActivePhase] = useState<{
		id: string;
		phase_number: number;
		name: string;
	} | null>(null);
	const [allPhases, setAllPhases] = useState<
		Array<{ id: string; phase_number: number; name: string; status: string }>
	>([]);
	const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null); // null = fase activa
	// 🌊 Estado para trackear esferas que necesitan shimmer (cambiaron de estado)
	const [spheresWithShimmer, setSpheresWithShimmer] = useState<Set<string>>(
		new Set(),
	);
	const [previousBatchStates, setPreviousBatchStates] = useState<
		Map<string, string>
	>(new Map());
	const { startJob } = useJobManager();
	const { showDialog } = useDialog();
	const { tokens } = useDesignTokens();
	const [groupByStatus, setGroupByStatus] = useState<boolean>(true);

	// (Eliminado) Tipo y función de etiquetas por estado de lote ya no son necesarios en la UI actual

	// Normaliza conteos por estado de artículos para evitar problemas de typing
	const normalizeCounts = (
		counts: BatchWithCounts["article_counts"],
	): ArticleCounts => ({
		pending: counts?.pending ?? 0,
		translated: counts?.translated ?? 0,
		pending_review: (counts?.pending_review || counts?.review_pending) ?? 0,
		reconciliation_pending: counts?.reconciliation_pending ?? 0,
		validated: counts?.validated ?? 0,
		reconciled: counts?.reconciled ?? 0,
		disputed: counts?.disputed ?? 0,
	});

	// 🔒 Helper: Determina si un lote está CERRADO
	// Un lote se considera cerrado si TODAS sus dimensiones tienen is_final = true
	const isBatchClosed = useCallback((batch: BatchWithCounts): boolean => {
		// Usar el campo is_closed que viene del backend (verificación real de is_final)
		return batch.is_closed === true;
	}, []);

	// 🎯 Filtrar lotes por fase seleccionada (por defecto fase activa)
	const filteredBatches = useMemo(() => {
		const phaseIdToFilter = selectedPhaseId || activePhase?.id;
		if (!phaseIdToFilter) return batches;

		return batches.filter((batch) => batch.phase_id === phaseIdToFilter);
	}, [batches, selectedPhaseId, activePhase?.id]);

	// NUEVO: Resumen agregado por estados de artículos (usa claves de la RPC)
	// 🎯 Usa filteredBatches para que el resumen refleje solo la fase seleccionada
	const resumenPorEstadoDeArticulo = useMemo(() => {
		const agg: Record<
			string,
			{ label: string; emoticon: string; value: number }
		> = {
			pending: { label: "Pendientes", emoticon: "⏳", value: 0 },
			translated: {
				label: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.label,
				emoticon: ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon,
				value: 0,
			},
			pending_review: {
				label: ARTICLE_STATUS_VISUALS.pendientesRevision.label,
				emoticon: ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon,
				value: 0,
			},
			reconciliation_pending: {
				label: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.label,
				emoticon: ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon,
				value: 0,
			},
			validated: {
				label: ARTICLE_STATUS_VISUALS.validados.label,
				emoticon: ARTICLE_STATUS_VISUALS.validados.emoticon,
				value: 0,
			},
			reconciled: {
				label: ARTICLE_STATUS_VISUALS.reconciliados.label,
				emoticon: ARTICLE_STATUS_VISUALS.reconciliados.emoticon,
				value: 0,
			},
			disputed: {
				label: ARTICLE_STATUS_VISUALS.enDisputa.label,
				emoticon: ARTICLE_STATUS_VISUALS.enDisputa.emoticon,
				value: 0,
			},
		};

		console.log(
			"🔍 [DEBUG] Procesando lotes filtrados para gráfico:",
			filteredBatches.length,
		);
		for (const lote of filteredBatches) {
			const c = lote.article_counts || ({} as Record<string, number>);
			console.log(`🔍 [DEBUG] Lote #${lote.batch_number} - article_counts:`, c);
			agg.pending.value += c.pending || 0;
			agg.translated.value += c.translated || 0;
			agg.pending_review.value += c.pending_review || c.review_pending || 0;
			agg.reconciliation_pending.value += c.reconciliation_pending || 0;
			agg.validated.value += c.validated || 0;
			agg.reconciled.value += c.reconciled || 0;
			agg.disputed.value += c.disputed || 0;
		}

		console.log("🔍 [DEBUG] Resumen final para gráfico:", agg);
		return agg;
	}, [filteredBatches]);

	const totalValue = useMemo(() => {
		return Object.values(resumenPorEstadoDeArticulo).reduce(
			(sum, item) => sum + (item.value || 0),
			0,
		);
	}, [resumenPorEstadoDeArticulo]);

	const sphereGridTitle = useMemo(() => {
		const userName = auth.user?.user_metadata?.full_name || "Investigador";
		if (isLoading) return "Cargando lotes...";
		if (filteredBatches.length > 0)
			return `${filteredBatches.length} lotes asignados a ${userName}`;
		return "Lotes Asignados";
	}, [auth.user, filteredBatches, isLoading]);

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
	const containerWidth =
		windowWidth ? windowWidth - sidebarWidth - layoutGap - globalXPadding : 0;

	// 🎯 LÓGICA INTELIGENTE: Altura dinámica según cantidad de lotes
	// Si hay menos de 30 lotes, reducir altura en 40% (usar 60% del original)
	const baseHeight = 500;
	const containerHeight =
		batches.length < 30 ? Math.floor(baseHeight * 0.6) : baseHeight;
	const gridHeight = containerHeight; // Altura del div contenedor

	const fetchBatches = useCallback(async () => {
		if (!auth.proyectoActual?.id || !auth.user?.id) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Obtener lotes, fase activa y todas las fases en paralelo
			const [batchesResult, phaseResult, allPhasesResult] = await Promise.all([
				getProjectBatchesForUser(auth.proyectoActual.id, auth.user.id),
				getActivePhaseForProject(auth.proyectoActual.id),
				getPhasesForProject(auth.proyectoActual.id),
			]);

			// Cargar todas las fases disponibles
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

			if (batchesResult.success) {
				// 🌊 DETECTAR CAMBIOS DE ESTADO para activar shimmer
				const newBatches = batchesResult.data;
				const changedBatchIds = new Set<string>();

				newBatches.forEach((batch) => {
					const previousStatus = previousBatchStates.get(batch.id);
					if (previousStatus && previousStatus !== batch.status) {
						// Estado cambió → agregar shimmer
						changedBatchIds.add(batch.id);
						console.log(
							`🌊 [Shimmer] Lote #${batch.batch_number} cambió de ${previousStatus} → ${batch.status}`,
						);
					}
				});

				// Actualizar estados previos
				const newStatesMap = new Map<string, string>();
				newBatches.forEach((batch) => {
					newStatesMap.set(batch.id, batch.status);
				});
				setPreviousBatchStates(newStatesMap);

				// Agregar shimmer a esferas que cambiaron
				if (changedBatchIds.size > 0) {
					setSpheresWithShimmer((prev) => {
						const updated = new Set(prev);
						changedBatchIds.forEach((id) => updated.add(id));
						return updated;
					});
				}

				setBatches(newBatches);
			} else {
				setError(batchesResult.error);
				setBatches([]);
			}

			// Establecer la fase activa si existe
			if (phaseResult.data) {
				setActivePhase({
					id: phaseResult.data.id,
					phase_number: phaseResult.data.phase_number,
					name: phaseResult.data.name,
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
				(
					payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
				) => {
					console.log(
						"✅ Cambio detectado en un lote, recargando datos:",
						payload,
					);
					fetchBatches();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [fetchBatches]);

	// 🔔 Listener para eventos personalizados de JobHandlers
	useEffect(() => {
		const handleBatchUpdate = (event: Event) => {
			const customEvent = event as CustomEvent<{ batchId: string }>;
			console.log(
				"🔔 [Page] Evento batch-updated recibido:",
				customEvent.detail,
			);
			fetchBatches();
		};

		window.addEventListener("batch-updated", handleBatchUpdate);

		return () => {
			window.removeEventListener("batch-updated", handleBatchUpdate);
		};
	}, [fetchBatches]);

	const handleSphereClick = useCallback(
		(batch: BatchWithCounts) => {
			setSelectedSphereId(batch.id);

			// 🌊 REMOVER SHIMMER al hacer click (usuario reconoció el cambio)
			setSpheresWithShimmer((prev) => {
				if (prev.has(batch.id)) {
					const updated = new Set(prev);
					updated.delete(batch.id);
					console.log(
						`🌊 [Shimmer] Removido de Lote #${batch.batch_number} por click del usuario`,
					);
					return updated;
				}
				return prev;
			});

			// Comprobar el estado del lote
			if (batch.status === "pending") {
				// ✅ PENDING → Iniciar Traducción
				console.log(`Activando flujo de traducción para el lote: ${batch.id}`);
				showDialog({
					title: "Confirmar Traducción",
					content: `¿Deseas enviar a traducir el Lote #${batch.batch_number}?`,
					confirmText: "Sí, Iniciar Traducción",
					cancelText: "No, cancelar",
					colorScheme: "primary",
					onConfirm: () => {
						if (!auth.proyectoActual?.id) {
							showDialog({
								title: "Error: Proyecto No Seleccionado",
								content:
									"No se puede iniciar un trabajo sin un proyecto activo. Por favor, asegúrate de tener un proyecto seleccionado.",
								confirmText: "Entendido",
								colorScheme: "danger",
								onConfirm: () => {},
							});
							return;
						}
						startJob({
							type: "TRANSLATE_BATCH",
							title: `Traduciendo Lote #${batch.batch_number}`,
							payload: {
								batchId: batch.id,
								userId: auth.user?.id || "unknown_user",
								projectId: auth.proyectoActual.id,
							},
						});
					},
				});
			} else if (batch.status === "translated") {
				// ✅ TRANSLATED → Iniciar Preclasificación
				console.log(
					`Activando flujo de preclasificación para el lote: ${batch.id}`,
				);
				showDialog({
					title: "Confirmar Preclasificación",
					content: `El Lote #${batch.batch_number} ya está traducido. ¿Deseas iniciar la preclasificación automática?`,
					confirmText: "Sí, Iniciar Preclasificación",
					cancelText: "No, Ver Detalle",
					colorScheme: "secondary",
					onConfirm: () => {
						if (!auth.proyectoActual?.id) {
							showDialog({
								title: "Error: Proyecto No Seleccionado",
								content:
									"No se puede iniciar un trabajo sin un proyecto activo. Por favor, asegúrate de tener un proyecto seleccionado.",
								confirmText: "Entendido",
								colorScheme: "danger",
								onConfirm: () => {},
							});
							return;
						}
						startJob({
							type: "PRECLASSIFY_BATCH",
							title: `Preclasificando Lote #${batch.batch_number}`,
							payload: {
								batchId: batch.id,
								userId: auth.user?.id || "unknown_user",
								projectId: auth.proyectoActual.id,
							},
						});
					},
					onCancel: () => {
						// Si cancela, navegar al detalle del lote
						console.log(`Navegando al detalle del lote: ${batch.id}`);
						router.push(`/articulos/preclasificacion/${batch.id}`);
					},
				});
			} else {
				// ✅ OTROS ESTADOS → Navegación al Detalle
				console.log(`Navegando al detalle del lote: ${batch.id}`);
				router.push(`/articulos/preclasificacion/${batch.id}`);
			}
		},
		[auth.proyectoActual?.id, auth.user?.id, router, showDialog, startJob],
	);

	const sphereData: SphereItemData[] = useMemo(() => {
		return filteredBatches.map((batch) => {
			const counts = normalizeCounts(batch.article_counts);

			// Calcular total incluyendo TODOS los estados disponibles
			const totalArticles =
				counts.pending +
				counts.translated +
				counts.pending_review +
				counts.reconciliation_pending +
				counts.validated +
				counts.reconciled +
				counts.disputed;

			const isClosed = isBatchClosed(batch);

			// 🎯 NUEVA LÓGICA: Color basado en el PEOR estado presente
			const sphereVisuals = getSphereVisualsFromCounts(counts, isClosed);

			return {
				id: batch.id,
				keyGroup: getOrderedGroupKey(batch.status as string),
				emoticon: sphereVisuals.emoticon,
				value: batch.batch_number,
				colorScheme: sphereVisuals.colorScheme,
				// 🔒 Estilos según estado: outline si seleccionado, sino usar el styleType calculado
				styleType:
					selectedSphereId === batch.id ? "outline" : sphereVisuals.styleType,
				// 🌊 Shimmer si el estado cambió y usuario no ha hecho click
				shimmer: spheresWithShimmer.has(batch.id),
				onClick: () => handleSphereClick(batch),
				// Tooltip completo con todos los estados disponibles y emoticonos alineados
				tooltip: [
					`*Lote:* ${batch.batch_number} - *Total:* ${totalArticles}${isClosed ? " 🔒 CERRADO" : ""}`,
					isClosed && batch.closure_stats ?
						`*Finalización:* ${batch.closure_stats.finalized_dimensions}/${batch.closure_stats.total_dimensions} dimensiones (${batch.closure_stats.percent_finalized.toFixed(0)}%)`
					:	"",
					"---",
					`⏳ *Pendientes:* ${counts.pending}`,
					`${ARTICLE_STATUS_VISUALS.pendientesRevisionTraducido.emoticon} *Traducido:* ${counts.translated}`,
					`${ARTICLE_STATUS_VISUALS.pendientesRevision.emoticon} *Pend. Revisión:* ${counts.pending_review}`,
					`${ARTICLE_STATUS_VISUALS.pendientesReconciliacion.emoticon} *Pend. Reconciliación:* ${counts.reconciliation_pending}`,
					`${ARTICLE_STATUS_VISUALS.validados.emoticon} *Validados:* ${counts.validated}`,
					`${ARTICLE_STATUS_VISUALS.reconciliados.emoticon} *Reconciliados:* ${counts.reconciled}`,
					`${ARTICLE_STATUS_VISUALS.enDisputa.emoticon} *En Disputa:* ${counts.disputed}`,
				]
					.filter((line) => line !== "")
					.join("\n"),
			};
		});
	}, [
		filteredBatches,
		handleSphereClick,
		selectedSphereId,
		isBatchClosed,
		spheresWithShimmer,
	]);

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

			{/* Selector de Fase - Solo mostrar si hay múltiples fases */}
			{allPhases.length > 1 && (
				<div className="mt-4 flex items-center gap-3">
					<StandardText size="sm" weight="medium">
						Filtrar por fase:
					</StandardText>
					<div className="w-64">
						<StandardSelect
							value={selectedPhaseId || activePhase?.id || ""}
							onChange={(value) => {
								const newValue = Array.isArray(value) ? value[0] : value;
								setSelectedPhaseId(
									newValue === activePhase?.id ? null : newValue || null,
								);
							}}
							placeholder="Seleccionar fase"
							options={allPhases.map((phase) => ({
								value: phase.id,
								label: `Fase ${phase.phase_number}: ${phase.name}${phase.id === activePhase?.id ? " (Activa)" : ""}`,
							}))}
						/>
					</div>
					{selectedPhaseId && selectedPhaseId !== activePhase?.id && (
						<StandardButton
							size="sm"
							styleType="ghost"
							onClick={() => setSelectedPhaseId(null)}>
							Ver fase activa
						</StandardButton>
					)}
				</div>
			)}

			<div className="mt-6 flex-grow flex flex-col gap-6">
				{/* Mostrar empty state independiente cuando no hay lotes */}
				{!isLoading && batches.length === 0 && !error ?
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
								title={
									activePhase ?
										`Aún no tienes lotes asignados`
									:	`No hay una fase activa configurada`
								}
								description={
									activePhase ?
										`Para comenzar con la preclasificación de artículos en la Fase ${activePhase.phase_number}: ${activePhase.name}, primero necesitas crear y asignar lotes. Los lotes organizan los artículos en grupos manejables para su revisión.`
									:	`Antes de poder crear lotes y comenzar la preclasificación, necesitas configurar y activar una fase en la gestión de fases del proyecto.`
								}
								action={
									<StandardButton
										colorScheme="primary"
										styleType="solid"
										size="md"
										onClick={() =>
											router.push(
												activePhase ?
													"/datos-maestros/lote"
												:	"/datos-maestros/fases",
											)
										}
										leftIcon={Boxes}>
										{activePhase ?
											"Ir a Gestión de Lotes"
										:	"Ir a Gestión de Fases"}
									</StandardButton>
								}
							/>
						</StandardCard.Content>
					</StandardCard>
				:	/* Mostrar SphereGrid solo cuando hay lotes o está cargando */
					<div className="w-full">
						{/* Toggle de agrupación por estatus */}
						<div className="flex items-center justify-end mb-2">
							<StandardText size="sm" className="mr-2">
								Agrupar por estatus
							</StandardText>
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
				}

				{pieChartData.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<StandardCard
							title="Resumen de Artículos"
							className="md:col-span-2">
							<StandardCard.Content>
								<StandardPieChart data={pieChartData} totalValue={totalValue} />
							</StandardCard.Content>
						</StandardCard>
						<StandardCard title="Leyenda">
							<StandardCard.Content>
								<div className="flex flex-col space-y-3">
									{Object.entries(resumenPorEstadoDeArticulo).map(
										([key, item]) => {
											const count = item.value;
											const percentage =
												totalValue > 0 ?
													((count / totalValue) * 100).toFixed(1)
												:	"0.0";
											// 🎨 Obtener color desde tokens centralizados Canon 4.0
											const color =
												tokens?.nivoChart?.colors[
													key as keyof typeof tokens.nivoChart.colors
												] || "#cccccc";
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
										},
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
